// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title SeasonPrizeVault
/// @notice Holds sponsor-funded rewards and distributes them by season. It never mints new funds.
contract SeasonPrizeVault {
    address public owner;

    event Funded(address indexed from, uint256 amount);
    event Distributed(bytes32 indexed seasonLabel, uint256 total, uint256 winnerCount);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {
        emit Funded(msg.sender, msg.value);
    }

    function fund() external payable {
        emit Funded(msg.sender, msg.value);
    }

    function balance() external view returns (uint256) {
        return address(this).balance;
    }

    function distribute(
        bytes32 seasonLabel,
        address[] calldata winners,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(winners.length == amounts.length, "length mismatch");
        uint256 total;
        for (uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }
        require(total <= address(this).balance, "insufficient balance");

        for (uint256 i = 0; i < winners.length; i++) {
            (bool ok, ) = winners[i].call{value: amounts[i]}("");
            require(ok, "transfer failed");
        }

        emit Distributed(seasonLabel, total, winners.length);
    }
}
