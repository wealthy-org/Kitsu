// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title DailyCourseRegistry
/// @notice Stores one immutable seed per daily course so the course cannot be changed after publish.
contract DailyCourseRegistry {
    address public owner;

    mapping(bytes32 => string) private _seeds;
    mapping(bytes32 => bool) public published;

    event CoursePublished(bytes32 indexed courseId, string seed, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function publishCourse(bytes32 courseId, string calldata seed) external onlyOwner {
        require(!published[courseId], "already published");
        _seeds[courseId] = seed;
        published[courseId] = true;
        emit CoursePublished(courseId, seed, block.timestamp);
    }

    function getSeed(bytes32 courseId) external view returns (string memory) {
        return _seeds[courseId];
    }
}
