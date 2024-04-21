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

    function test_buyOneTicket() public {
        vm.deal(alice, price);
        vm.prank(alice);
        ticketer.buyTicket{value: price}(1);

        assertEq(ticketer.ticketBalances(alice), 1);
        assertEq(ticketer.ticketBalances(bob), 0);
    }

    // function test_FuzzBuyTicket(uint256 amount) public {
    //     amount = bound(amount, 0, 200);
    //     vm.deal(alice, amount * price);
    //     vm.prank(alice);
    //     ticketer.buyTicket{value: amount * price}(amount);

    //     assertEq(ticketer.ticketBalances(alice), amount);
    //     assertEq(ticketer.ticketBalances(bob), 0);
    // }

    function test_ownerCollect() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        ticketer.buyTicket{value: 1 ether}(1);

        assertEq(address(ticketer).balance, 1 ether);
        assertEq(address(owner).balance, 0);

        vm.prank(owner);
        ticketer.ownerCollect();

        assertEq(address(ticketer).balance, 0);
        assertEq(address(owner).balance, 1 ether);
    }

    // function test_ownerCollect_WhenNotOwner() public {
    //     vm.deal(alice, 1 ether);
    //     vm.prank(alice);
    //     ticketer.buyTicket{value: 1 ether}(1);

    //     assertEq(address(ticketer).balance, 1 ether);
    //     assertEq(address(owner).balance, 0);

    //     vm.expectRevert();
    //     vm.prank(bob);
    //     ticketer.ownerCollect();

    //     assertEq(address(ticketer).balance, 1 ether);
    //     assertEq(address(owner).balance, 0);
    //     assertEq(address(bob).balance, 0);
    // }
}
