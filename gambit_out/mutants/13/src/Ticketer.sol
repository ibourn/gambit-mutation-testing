// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import {Ownable} from "openzeppelin/contracts/access/Ownable.sol";

contract Ticketer is Ownable {
    error InvalidValue();
    error NativeTransferFailed();

    uint256 public constant price = 1 ether;
    mapping(address => uint256) public ticketBalances;

    constructor() Ownable(msg.sender) {}

    function buyTicket(uint256 amount) external payable {
        if (amount == 0) revert InvalidValue();
        if (msg.value != amount * price) revert InvalidValue();
        ticketBalances[msg.sender] += amount;
    }

    function ownerCollect() external {
        (bool success,) = payable(msg.sender).call{value: address(this).balance}("");
        /// IfStatementMutation(`!success` |==> `true`) of: `if (!success) revert NativeTransferFailed();`
        if (true) revert NativeTransferFailed();
    }
}
