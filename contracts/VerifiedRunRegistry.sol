// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {DailyCourseRegistry} from "./DailyCourseRegistry.sol";

/// @title VerifiedRunRegistry
/// @notice Records server-verified runs on-chain, wired to the course registry at construction.
contract VerifiedRunRegistry {
    DailyCourseRegistry public immutable courseRegistry;
    address public owner;

    mapping(bytes32 => bool) public relayed;

    event RunRelayed(
        bytes32 indexed runId,
        address indexed wallet,
        bytes32 indexed courseId,
        uint256 score,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(address registry) {
        require(registry != address(0), "registry required");
        courseRegistry = DailyCourseRegistry(registry);
        owner = msg.sender;
    }

    function relayRun(
        bytes32 runId,
        address wallet,
        bytes32 courseId,
        uint256 score,
        uint256 timestamp
    ) external onlyOwner {
        require(!relayed[runId], "already relayed");
        require(courseRegistry.published(courseId), "course not published");
        relayed[runId] = true;
        emit RunRelayed(runId, wallet, courseId, score, timestamp);
    }
}
