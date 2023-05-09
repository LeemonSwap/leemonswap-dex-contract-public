// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.8.12;

import "../hedera/SafeHederaTokenService.sol";
import "../libraries/Bits.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

contract ERC20Mock is SafeHederaTokenService {

    using Bits for uint;
    address public token;

    constructor(string memory name, string memory symbol, uint256 supply, address _to) payable {
        init(name, symbol, supply, _to);

    }

    function init(string memory name, string memory symbol, uint256 supply, address _to) private {
        uint supplyKeyType;
        IHederaTokenService.KeyValue memory supplyKeyValue;

        supplyKeyType = supplyKeyType.setBit(4);
        supplyKeyValue.contractId = address(this);

        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](1);
        keys[0] = IHederaTokenService.TokenKey(supplyKeyType, supplyKeyValue);

        IHederaTokenService.Expiry memory expiry;
        expiry.autoRenewAccount = address(this);
        expiry.autoRenewPeriod = 8000000;

        IHederaTokenService.HederaToken memory myToken;
        myToken.name = name;
        myToken.symbol = symbol;
        myToken.treasury = address(this);
        myToken.expiry = expiry;
        myToken.tokenKeys = keys;

        (int responseCode, address _token) = HederaTokenService.createFungibleToken(myToken, supply, 8);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert (Strings.toString(uint256(int256(responseCode))));
        }
        bytes[] memory x;

        token = _token;
        safeAssociateToken(address(this), token);
        safeMintToken(token, address(_to), supply, x);
        safeTransferToken(token, address(this), address(_to), supply);
    }


    function approve(address spender, uint256 amount) public {
        safeApprove(token, spender, amount);
    }

    function totalSupply() external view returns (uint256) {
        return IERC20(token).totalSupply();
    }

    function balanceOf(address owner) external view returns (uint256){
        return IERC20(token).balanceOf(owner);
    }

    function mint(address to, uint256 amount) public {
        bytes[] memory x;
        safeMintToken(token, to, amount, x);
    }
}