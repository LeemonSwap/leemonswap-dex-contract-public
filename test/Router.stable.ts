import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { hethers, ethers } from "hardhat";
import { setup } from "./utils/setup";
import {
    BentoBoxV1,
    StablePool,
    StablePoolFactory,
    ERC20Contract,
    JUICE,
    MasterDeployer,
    TridentRouter,
    WHBAR,
} from "../types";

describe.only("Trident", function () {
    let whbar: WHBAR;
    let bento: BentoBoxV1;
    let masterDeployer: MasterDeployer;
    let stablePoolFactory: StablePoolFactory;
    let tridentRouter: TridentRouter;
    let feeReceiver: string;
    let juiceToken: JUICE;
    let cPool: StablePool;

    before(async function () {
        const setupContracts = await setup();
        whbar = await hethers.getContractAt("WHBAR", setupContracts.whbar);
        bento = await hethers.getContractAt("BentoBoxV1", setupContracts.bento);
        masterDeployer = await hethers.getContractAt(
            "MasterDeployer",
            setupContracts.masterDeployer
        );
        stablePoolFactory = await hethers.getContractAt(
            "StablePoolFactory",
            setupContracts.stablePoolFactory
        );
        tridentRouter = await hethers.getContractAt(
            "TridentRouter",
            setupContracts.tridentRouter
        );
        feeReceiver = setupContracts.feeReceiver;
        juiceToken = await hethers.getContractAt(
            "JUICE",
            setupContracts.juiceToken
        );
    });

    it("Test deployments", async function () {
        console.log("[+] WHBAR", whbar.address);
        console.log("[+] Bento", bento.address);
        console.log("[+] MasterDeployer", masterDeployer.address);
        console.log(
            "[+] StablePoolFactory",
            stablePoolFactory.address
        );
        console.log("[+] StablePoolFactory", stablePoolFactory.address);
        console.log("[+] tridentRouter", tridentRouter.address);
        console.log("[+] feeReceiver", feeReceiver);
        console.log("[+] juiceToken", juiceToken.address);
    });

    it.only("Should create a Stable Pool", async function () {
        let token0 = await whbar.token();
        let token1 = await juiceToken.token();
        let pool;
        let alreadyDeployed = false;

        try {
            pool = await stablePoolFactory.getPools(
                token0,
                token1,
                0,
                1
            );
            alreadyDeployed = true;
        } catch (error) {
            const deployData = ethers.utils.defaultAbiCoder.encode(
                ["address", "address", "uint256"],
                [token0, token1, 30]
            );

            await masterDeployer.deployPool(
                stablePoolFactory.address,
                deployData,
                { value: 100000000000 }
            );

            pool = await stablePoolFactory.getPools(
                token0,
                token1,
                0,
                1
            );
        }

        console.log("[+] Stable Pool", pool[0]);

        let poolContract = await hethers.getContractAt(
            "StablePool",
            pool[0]
        );

        let lpToken = await poolContract.lpToken();
        let poolToken = await poolContract.symbol();
        let pToken0 = await poolContract.token0();
        let pToken1 = await poolContract.token1();

        console.log("[+] Stable Pool Symbol", poolToken);
        console.log("[+] Stable Pool Token 0", pToken0);
        console.log("[+] Stable Pool Token 1", pToken1);
        console.log("[+] Stable Pool LP Token (HTS)", lpToken);

        cPool = poolContract;

        if (!alreadyDeployed) {
            console.log("[+] Initializing pool");
            await cPool.initialize();
        }
    });

    it("Should approve the pool", async function () {
        const [owner, feeReceiver] = await hethers.getSigners();

        let token0 = await whbar.token();
        let token1 = await juiceToken.token();

        let ownerAccountId = await hethers.utils.asAccountString(owner.address);
        console.log("[+] Owner Account ID", ownerAccountId);
        let ownerEvm = await hethers.provider.getEvmAddress(ownerAccountId);
        console.log("[+] Owner EVM Address", ownerEvm);

        let whbarToken = await hethers.getContractAt("HederaIERC20", token0);
        let juice = await hethers.getContractAt("HederaIERC20", token1);

        let balance0 = await whbarToken.balanceOf(ownerEvm);
        let balance1 = await juiceToken.balanceOf(ownerEvm);

        console.log("[+] Owner Balance 0", balance0.toString());
        console.log("[+] Owner Balance 1", balance1.toString());

        let bentoEvm = await hethers.provider.getEvmAddress(bento.address);
        console.log("[+] Bento EVM Address", bentoEvm);

        let tridentEvm = await hethers.provider.getEvmAddress(
            tridentRouter.address
        );

        await whbarToken.approve(bentoEvm, balance0);
        await juice.approve(bentoEvm, balance1);

        await whbarToken.approve(tridentEvm, balance0);
        await juice.approve(tridentEvm, balance1);
    });

    it.only("Should add liquidity", async function () {
        const [owner, feeReceiver] = await hethers.getSigners();

        let token0 = await whbar.token();
        let token1 = await juiceToken.token();

        let ownerAccountId = await hethers.utils.asAccountString(owner.address);
        console.log("[+] Owner Account ID", ownerAccountId);
        let ownerEvm = await hethers.provider.getEvmAddress(ownerAccountId);
        console.log("[+] Owner EVM Address", ownerEvm);

        let tridentEvm = await hethers.provider.getEvmAddress(
            tridentRouter.address
        );
        console.log("[+] Trident EVM Address", tridentEvm);
        await bento.whitelistMasterContract(tridentEvm, true);

        let cPoolBalance = await cPool.balanceOf(ownerEvm);

        await bento.setMasterContractApproval(
            ownerEvm,
            tridentEvm,
            true,
            "0",
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000000000000000000000000000"
        );

        try {
            await bento["associateWith(address)"](token0);
            await bento["associateWith(address)"](token1);
        } catch (error) {
            console.log("[+] Already associated");
        }

        console.log("[+] Depositing tokens");
        await bento.deposit(token0, ownerEvm, ownerEvm, 50000000, 0);
        await bento.deposit(token1, ownerEvm, ownerEvm, 50000000, 0);

        console.log("[+] Adding liquidity");
        let ownerEncoded = hethers.utils.defaultAbiCoder.encode(
            ["address"],
            [ownerEvm]
        );

        let whbarToken = await hethers.getContractAt("HederaIERC20", token0);
        let juice = await hethers.getContractAt("HederaIERC20", token1);

        let liquidityInput = [
            {
                token: whbarToken.address,
                native: false,
                amount: 50000000,
            },
            {
                token: juice.address,
                native: false,
                amount: 50000000,
            },
        ];

        let tx = await tridentRouter.addLiquidity(
            liquidityInput,
            cPool.address,
            1,
            ownerEncoded
        );

        let cPoolBalanceAfter = await cPool.balanceOf(ownerEvm);
        expect(cPoolBalanceAfter).to.be.gt(cPoolBalance);

        console.log("[+] LP Balance", cPoolBalanceAfter.toString());
    });

    it("swaps token0 to token1", async () => {
        const [owner, feeReceiver] = await hethers.getSigners();

        let token0 = await hethers.getContractAt(
            "HederaIERC20",
            await whbar.token()
        );
        let token1 = await hethers.getContractAt(
            "HederaIERC20",
            await juiceToken.token()
        );

        let ownerAccountId = await hethers.utils.asAccountString(owner.address);
        let ownerEvm = await hethers.provider.getEvmAddress(ownerAccountId);
        let token1Balance = await token1.balanceOf(ownerEvm);
        let bentoEvm = await hethers.provider.getEvmAddress(bento.address);

        await token0.approve(bentoEvm, "5000");
        await token0.transfer(bentoEvm, "5000");
        console.log("[+] Depositing tokens");
        await bento.deposit(token0.address, bentoEvm, cPool.address, "5000", 0);

        const swapData = hethers.utils.defaultAbiCoder.encode(
            ["address", "address", "bool"],
            [token0.address, ownerEvm, true]
        );
        console.log("[+] Swapping tokens");
        await cPool.swap(swapData);

        expect(await token1.balanceOf(ownerEvm)).to.be.above(token1Balance);
    });

    it("swaps token1 to token0", async () => {
        const [owner, feeReceiver] = await hethers.getSigners();

        let token0 = await hethers.getContractAt(
            "HederaIERC20",
            await whbar.token()
        );
        let token1 = await hethers.getContractAt(
            "HederaIERC20",
            await juiceToken.token()
        );

        let ownerAccountId = await hethers.utils.asAccountString(owner.address);
        let ownerEvm = await hethers.provider.getEvmAddress(ownerAccountId);
        let token0Balance = await token0.balanceOf(ownerEvm);
        let bentoEvm = await hethers.provider.getEvmAddress(bento.address);

        await token1.approve(bentoEvm, "5000");
        await token1.transfer(bentoEvm, "5000");
        await bento.deposit(token1.address, bentoEvm, cPool.address, "5000", 0);
        const swapData = hethers.utils.defaultAbiCoder.encode(
            ["address", "address", "bool"],
            [token1.address, ownerEvm, true]
        );
        console.log("[+] Swapping tokens");
        await cPool.swap(swapData);

        expect(await token0.balanceOf(ownerEvm)).to.be.above(token0Balance);
    });

    it("Should remove liquidity", async function () {
        const [owner, feeReceiver] = await hethers.getSigners();
        let ownerAccountId = await hethers.utils.asAccountString(owner.address);
        let ownerEvm = await hethers.provider.getEvmAddress(ownerAccountId);

        let token0 = await hethers.getContractAt(
            "HederaIERC20",
            await whbar.token()
        );
        let token1 = await hethers.getContractAt(
            "HederaIERC20",
            await juiceToken.token()
        );

        let token0Balance = await token0.balanceOf(ownerEvm);
        let token1Balance = await token1.balanceOf(ownerEvm);

        const data = hethers.utils.defaultAbiCoder.encode(
            ["address", "bool"],
            [ownerEvm, true]
        );

        const minWithdrawals = [
            {
                token: token0.address,
                amount: "5000",
            },
            {
                token: token1.address,
                amount: "5000",
            },
        ];

        let lpToken = await hethers.getContractAt(
            "HederaIERC20",
            await cPool.lpToken()
        );
        let lpBalance = await lpToken.balanceOf(ownerEvm);

        await lpToken.approve(tridentRouter.address, lpBalance);

        await tridentRouter.burnLiquidity(
            cPool.address,
            lpBalance,
            data,
            minWithdrawals
        );

        expect(await token0.balanceOf(ownerEvm)).to.be.gt(token0Balance);
        expect(await token1.balanceOf(ownerEvm)).to.be.gt(token1Balance);
    });
});
