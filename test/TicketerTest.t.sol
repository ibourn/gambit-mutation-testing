// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Ticketer.sol";

contract TicketerTest is Test {
    Ticketer public ticketer;
    uint256 public price = 1 ether;

    address alice = makeAddr("ALICE");
    address bob = makeAddr("BOB");
    address owner = makeAddr("OWNER");

    function setUp() public {
        vm.prank(owner);
        ticketer = new Ticketer();
    }

    function test_BuyOneTicket() public {
        vm.deal(alice, price);
        vm.prank(alice);
        ticketer.buyTicket{value: price}(1);

        assertEq(ticketer.ticketBalances(alice), 1);
        assertEq(ticketer.ticketBalances(bob), 0);
    }

    function test_OwnerCollect() public {
        vm.deal(alice, price);
        vm.prank(alice);
        ticketer.buyTicket{value: price}(1);

        assertEq(address(ticketer).balance, price);
        assertEq(address(owner).balance, 0);

        vm.prank(owner);
        ticketer.ownerCollect();

        assertEq(address(ticketer).balance, 0);
        assertEq(address(owner).balance, price);
    }

    function test_OwnerCollect_FailWhenNotOwner() public {
        vm.deal(alice, price);
        vm.prank(alice);
        ticketer.buyTicket{value: price}(1);

        assertEq(address(ticketer).balance, price);
        assertEq(address(owner).balance, 0);

        vm.startPrank(bob);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, bob));
        ticketer.ownerCollect();
        vm.stopPrank();

        assertEq(address(ticketer).balance, price);
        assertEq(address(owner).balance, 0);
        assertEq(address(bob).balance, 0);
    }

    /**
     * uncomment the following tests to kill the mutants
     */

    /**
     * Kill mutant 2
     * Ticketer.sol::17 : IfStatementMutation(`amount == 0` |==> `false`) of: `if (amount == 0) revert InvalidValue();`
     * This mutation not failing tells us that we don't have test in case of an amount of 0
     */
    function test_BuyWithZeroAmount() public {
        vm.deal(alice, price);
        vm.startPrank(alice);
        vm.expectRevert(Ticketer.InvalidValue.selector);
        ticketer.buyTicket(0);
        vm.stopPrank();

        assertEq(ticketer.ticketBalances(alice), 0);
    }

    /**
     * Kill mutant 4
     * Ticketer.sol::18 : IfStatementMutation(`msg.value != amount * price` |==> `false`) of: `if (msg.value != amount * price) revert InvalidValue();`
     * This mutation not failing tells us that we don't have test in case of an invalid msg.value
     */
    function test_BuyWithInvalidValue() public {
        vm.deal(alice, 2 ether);
        vm.startPrank(alice);

        vm.expectRevert(Ticketer.InvalidValue.selector);
        ticketer.buyTicket(1);

        vm.expectRevert(Ticketer.InvalidValue.selector);
        ticketer.buyTicket{value: 0.5 ether}(1);

        vm.expectRevert(Ticketer.InvalidValue.selector);
        ticketer.buyTicket{value: 1.2 ether}(1);

        vm.stopPrank();

        assertEq(ticketer.ticketBalances(alice), 0);
        assertEq(ticketer.ticketBalances(bob), 0);
    }

    /**
     * Kill mutant 12
     * Ticketer.sol::19 : AssignmentMutation(`amount` |==> `1`) of: `ticketBalances[msg.sender] += amount;`
     * This mutation not failing tells us that we don't check the amount of ticket bought
     */
    function test_FuzzBuyTicket(uint256 amount) public {
        vm.assume(amount != 0 && amount < 1000);
        uint256 amountToSend = amount * price;

        vm.deal(alice, amountToSend);
        vm.prank(alice);
        ticketer.buyTicket{value: amountToSend}(amount);

        assertEq(ticketer.ticketBalances(alice), amount);
        assertEq(ticketer.ticketBalances(bob), 0);
        assertEq(address(ticketer).balance, amountToSend);
    }

    /**
     * Kill mutant 14
     * Ticketer.sol::24 : IfStatementMutation(`!success` |==> `false`) of: `if (!success) revert NativeTransferFailed();`
     * This mutation not failing tells us that we don't have test in case of a failed transfer
     */
    function test_OwnerCannotCollect() public {
        vm.deal(alice, price);
        vm.prank(alice);
        ticketer.buyTicket{value: price}(1);

        assertEq(address(ticketer).balance, price);
        assertEq(address(owner).balance, 0);

        // Set the address of owner to the ticketer contract code
        // as there's no fallback and receive functions, the transfer will fail
        vm.etch(owner, address(ticketer).code);

        vm.startPrank(owner);
        vm.expectRevert(Ticketer.NativeTransferFailed.selector);
        ticketer.ownerCollect();
        vm.stopPrank();

        assertEq(address(ticketer).balance, price);
        assertEq(address(owner).balance, 0);
    }
}
