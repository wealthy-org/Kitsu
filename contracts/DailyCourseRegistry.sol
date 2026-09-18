// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title DailyCourseRegistry
/// @notice Stores one immutable seed hash per daily course so the course cannot be changed after publish.
contract DailyCourseRegistry {
    address public owner;

    mapping(bytes32 => bytes32) private _seedHashes;
    mapping(bytes32 => bool) public published;

    event CoursePublished(bytes32 indexed courseId, bytes32 seedHash, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function publishCourse(bytes32 courseId, bytes32 seedHash) external onlyOwner {
        require(!published[courseId], "already published");
        _seedHashes[courseId] = seedHash;
        published[courseId] = true;
        emit CoursePublished(courseId, seedHash, block.timestamp);
    }

    function getSeedHash(bytes32 courseId) external view returns (bytes32) {
        return _seedHashes[courseId];
    }
}
