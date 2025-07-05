// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MetadataRegistry {
    mapping(address => string) public metadataCIDs;

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setMetadataCID(address tokenAddress, string calldata cid) external onlyOwner {
        metadataCIDs[tokenAddress] = cid;
    }

    function getMetadataCID(address tokenAddress) external view returns (string memory) {
        return metadataCIDs[tokenAddress];
    }
}
