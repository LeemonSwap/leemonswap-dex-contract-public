// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.12;
pragma experimental ABIEncoderV2;

import "./HederaTokenService.sol";
import '../libraries/SafeCast.sol';
import "./IHederaTokenService.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract SafeHederaTokenService is HederaTokenService {

    using SafeCast for uint256;

    event Transfer(address indexed from, address indexed to, uint64 value);

    function safeMintToken(address token, address to, uint256 amount, bytes[] memory metadata) internal
    returns (uint64 newTotalSupply, int64[] memory serialNumbers) {
        int32 responseCode;
        (responseCode, newTotalSupply, serialNumbers) = HederaTokenService.mintToken(token, amount.toUint64(), metadata);
        if(responseCode != HederaResponseCodes.SUCCESS)
        {
            string memory x = "Safe mint failed :";
            revert(string.concat(x,Strings.toString(uint256(int256(responseCode)))));
        }
        emit Transfer(address(0), to, amount.toUint64());
    }

    function safeBurnToken(address token, uint256 amount, int64[] memory serialNumbers) internal
    returns (uint64 newTotalSupply) {
        int32 responseCode;
        (responseCode, newTotalSupply) = HederaTokenService.burnToken(token, amount.toUint64(), serialNumbers);
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe burn failed!");
        emit Transfer(token, address(0), amount.toUint64());
    }

    function safeBurnToken(address token, address to, uint256 amount, int64[] memory serialNumbers) internal
    returns (uint64 newTotalSupply)
    {
        int32 responseCode;
        (responseCode, newTotalSupply) = HederaTokenService.burnToken(token, amount.toUint64(), serialNumbers);
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe burn failed!");
        emit Transfer(to, address(0), amount.toUint64());
    }

    function safeAssociateTokens(address account, address[] memory tokens) internal {
        int32 responseCode;
        (responseCode) = HederaTokenService.associateTokens(account, tokens);
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe multiple associations failed!");
    }

    function safeAssociateToken(address account, address token) internal {
        int32 responseCode;
        (responseCode) = HederaTokenService.associateToken(account, token);
        if(responseCode != HederaResponseCodes.SUCCESS)
        {
            string memory x = "Safe single association failed! :";
            revert(string.concat(x,Strings.toString(uint256(int256(responseCode)))));
        }
    }

    function safeTransferToken(address token, address sender, address receiver, uint256 amount) internal {
        int32 responseCode;
        (responseCode) = HederaTokenService.transferToken(token, sender, receiver, amount.toInt64());
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe token transfer failed!");
        emit Transfer(sender, receiver, uint64(amount));
    }

    function safeTransferTokenRouter(address token, address sender, address receiver, uint256 amount) internal {
        int32 responseCode;
        (responseCode) = HederaTokenService.transferTokenRouter(token, sender, receiver, amount.toInt64());
        if(responseCode != HederaResponseCodes.SUCCESS)
        {
            string memory x = "Safe token transfer router failed! :";
            revert(string.concat(x,Strings.toString(uint256(int256(responseCode)))));
        }
        emit Transfer(sender, receiver, uint64(amount));
    }

    function safeApprove(address token, address spender, uint256 amount) internal {
        int32 responseCode;
        (responseCode) = HederaTokenService.approve(token,spender,amount);
        if(responseCode != HederaResponseCodes.SUCCESS)
        {
            string memory x = "Safe approve failed :";
            revert(string.concat(x,Strings.toString(uint256(int256(responseCode)))));
        }
    }

}
