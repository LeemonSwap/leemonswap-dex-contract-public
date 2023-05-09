const { hethers } = require("hardhat");
const fs = require("fs");
const path = "./contracts.json";

export const setup = async function () {
  const [owner, feeReceiver] = await hethers.getSigners();

  let data;
  if (fs.existsSync(path)) {
    // Load the addresses from the JSON file
    data = fs.readFileSync(path);
    data = JSON.parse(data);
  } else {
    // Deploy the contracts

    
    // deploy WHBAR
    console.log("Deploying WHBAR...");
    const WHBAR = await hethers.getContractFactory("WHBAR");

    // print balance of owner in a human readable format
    console.log("Owner balance:", hethers.utils.formatHbar(await owner.getBalance()));


    const whbar = await WHBAR.deploy({ value: 100 });
    await whbar.deployed();

    // deploy BentoBox
    const BentoBox = await hethers.getContractFactory("BentoBoxV1");
    const bento = await BentoBox.deploy(whbar.address);
    await bento.deployed();
    console.log("BentoBox deployed to:", bento.address);

    // deploy MasterDeployer
    const MasterDeployer = await hethers.getContractFactory("MasterDeployer");
    const masterDeployer = await MasterDeployer.deploy(300, feeReceiver.address, bento.address);
    console.log("MasterDeployer deployed to:", masterDeployer.address);

    // deploy ConstantProductPoolFactory
    const ConstantProductPoolFactory = await hethers.getContractFactory("ConstantProductPoolFactory");
    const constantProductPoolFactory = await ConstantProductPoolFactory.deploy(masterDeployer.address);
    await constantProductPoolFactory.deployed();
    console.log("ConstantProductPoolFactory deployed to:", constantProductPoolFactory.address);

    // deploy StablePoolFactory
    const StablePoolFactory = await hethers.getContractFactory("StablePoolFactory");
    const stablePoolFactory = await StablePoolFactory.deploy(masterDeployer.address);
    await stablePoolFactory.deployed();
    console.log("StablePoolFactory deployed to:", stablePoolFactory.address);

    // add factories to whitelist
    await masterDeployer.addToWhitelist(constantProductPoolFactory.address);
    await masterDeployer.addToWhitelist(stablePoolFactory.address);

    // deploy TridentRouter
    const TridentRouter = await hethers.getContractFactory("TridentRouter");
    const tridentRouter = await TridentRouter.deploy(bento.address, masterDeployer.address, whbar.address);
    await tridentRouter.deployed();
    console.log("TridentRouter deployed to:", tridentRouter.address);

    const JuiceToken = await hethers.getContractFactory("JUICE");
    const juiceToken = await JuiceToken.deploy({ value: 100 });
    await juiceToken.deployed();

    data = {
        whbar: whbar.address,
        bento: bento.address,
        masterDeployer: masterDeployer.address,
        constantProductPoolFactory: constantProductPoolFactory.address,
        stablePoolFactory: stablePoolFactory.address,
        tridentRouter: tridentRouter.address,
        feeReceiver: feeReceiver.address,
        juiceToken: juiceToken.address,
    };
    fs.writeFileSync(path, JSON.stringify(data));
  }

  return data;
};