// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

// Import non-upgradeable Strings library (pure, safe)
import "@openzeppelin/contracts/utils/Strings.sol";

contract PropertyToken is Initializable, ERC721Upgradeable, OwnableUpgradeable {
    using Strings for uint256; // use non-upgradeable Strings here

    IERC20 public usdcToken;
    uint256 public pricePerShare;
    uint256 public nextTokenId;
    string public baseTokenURI;

    mapping(address => bool) public whitelist;

    event Purchase(address indexed buyer, uint256 tokenId);

    function initialize(
        address _usdcToken,
        uint256 _pricePerShare,
        string memory _baseTokenURI,
        address initialOwner
    ) public initializer {
        __ERC721_init("PropertyShare", "PSH");
        __Ownable_init(initialOwner);

        usdcToken = IERC20(_usdcToken);
        pricePerShare = _pricePerShare;
        baseTokenURI = _baseTokenURI;
        nextTokenId = 1;

        _transferOwnership(initialOwner);
    }

    function addToWhitelist(address user) external onlyOwner {
        whitelist[user] = true;
    }

    function removeFromWhitelist(address user) external onlyOwner {
        whitelist[user] = false;
    }

    function buyProperty() external {
        require(whitelist[msg.sender], "Not whitelisted");
        require(usdcToken.allowance(msg.sender, address(this)) >= pricePerShare, "Approve USDC first");
        require(usdcToken.balanceOf(msg.sender) >= pricePerShare, "Insufficient USDC balance");

        bool sent = usdcToken.transferFrom(msg.sender, address(this), pricePerShare);
        require(sent, "USDC transfer failed");

        _safeMint(msg.sender, nextTokenId);
        emit Purchase(msg.sender, nextTokenId);
        nextTokenId++;
    }

    function withdrawUSDC(address to, uint256 amount) external onlyOwner {
        require(usdcToken.balanceOf(address(this)) >= amount, "Insufficient USDC");
        usdcToken.transfer(to, amount);
    }

    function setBaseTokenURI(string memory newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    require(ownerOf(tokenId) != address(0), "ERC721Metadata: URI query for nonexistent token");
    return string(abi.encodePacked(baseTokenURI, Strings.toString(tokenId), ".json"));
}




}
