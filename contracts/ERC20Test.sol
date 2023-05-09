// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract ERC20Test {

    uint256 public balance;
    function balanceOf(address token, address account) external {
        balance = IERC20(token).balanceOf(account);
    }

}