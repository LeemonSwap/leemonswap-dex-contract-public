// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.12;
pragma experimental ABIEncoderV2;

import "./hedera/SafeHederaTokenService.sol";
import "./libraries/Bits.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract JUICE is SafeHederaTokenService, Ownable {
    using Bits for uint;

    address public token;

    event Deposit(address indexed src, address indexed dst, uint wad);
    event Withdrawal(address indexed src, address indexed dst, uint wad);

    constructor() payable {

        uint supplyKeyType;
        IHederaTokenService.KeyValue memory supplyKeyValue;

        supplyKeyType = supplyKeyType.setBit(4);
        supplyKeyValue.contractId = address(this);

        IHederaTokenService.TokenKey[]
            memory keys = new IHederaTokenService.TokenKey[](1);
        keys[0] = IHederaTokenService.TokenKey(supplyKeyType, supplyKeyValue);

        IHederaTokenService.Expiry memory expiry;
        expiry.autoRenewAccount = address(this);
        expiry.autoRenewPeriod = 8000000;

        IHederaTokenService.HederaToken memory myToken;
        myToken.name = "JUICE";
        myToken.symbol = "JUICE";
        myToken.treasury = address(this);
        myToken.expiry = expiry;
        myToken.tokenKeys = keys;

        (int responseCode, address _token) = HederaTokenService
            .createFungibleToken(myToken, 0, 8);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        bytes[] memory x;
        token = _token;
        associateWith(msg.sender);
        safeMintToken(
            token,
            address(msg.sender),
            500_000_000_000_000_000,
            x
        );
        safeTransferToken(
            token,
            address(this),
            address(msg.sender),
            500_000_000_000_000_000
        );

    }
        function balanceOf(address src) public view returns (uint) {
        return IERC20(token).balanceOf(src);
    }
    
    function associateWith(address accountAddress) public onlyOwner {
        safeAssociateToken(accountAddress, token);
    }
}