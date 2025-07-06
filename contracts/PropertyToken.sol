// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract PropertyToken is Initializable, ERC721Upgradeable, OwnableUpgradeable {
    using Strings for uint256;

    IERC20 public usdcToken;
    uint256 public pricePerShare;
    uint256 public nextTokenId;
    uint256 public totalShares;
    string public baseTokenURI;

    // Property Metadata
    string public name_;
    string public location;
    string public jurisdiction;
    string public issuer;
    string public image;
    string public latestMetadataCid;

    event Purchase(address indexed buyer, uint256 tokenId);
    event PropertyRegistered(
        address indexed contractAddress,
        string name,
        string location,
        string jurisdiction,
        string issuer,
        uint256 totalShares,
        string image,
        string latestMetadataCid
    );
    event MetadataUpdated(string latestMetadataCid, uint256 updatedAt);

    function initialize(
        address _usdcToken,
        uint256 _pricePerShare,
        string memory _baseTokenURI,
        address initialOwner,
        string memory _name,
        string memory _location,
        string memory _jurisdiction,
        string memory _issuer,
        uint256 _totalShares,
        string memory _image,
        string memory _latestMetadataCid
    ) public initializer {
        __ERC721_init("PropertyShare", "PSH");
        __Ownable_init(initialOwner);

        usdcToken = IERC20(_usdcToken);
        pricePerShare = _pricePerShare;
        baseTokenURI = _baseTokenURI;
        nextTokenId = 1;
        totalShares = _totalShares;

        name_ = _name;
        location = _location;
        jurisdiction = _jurisdiction;
        issuer = _issuer;
        image = _image;
        latestMetadataCid = _latestMetadataCid;

        emit PropertyRegistered(address(this), _name, _location, _jurisdiction, _issuer, _totalShares, _image, _latestMetadataCid);
    }

    /// @notice Mint a new Property NFT to `to`. Only callable by owner (backend)
    function mint(address to) external onlyOwner returns (uint256) {
        require(nextTokenId <= totalShares, "All shares minted");
        uint256 tokenId = nextTokenId;
        nextTokenId++;
        _safeMint(to, tokenId);
        emit Purchase(to, tokenId);
        return tokenId;
    }

    /// @notice Owner can withdraw accumulated USDC payments from contract
    function withdrawUSDC(address to, uint256 amount) external onlyOwner {
        require(usdcToken.balanceOf(address(this)) >= amount, "Insufficient USDC");
        usdcToken.transfer(to, amount);
    }

    /// @notice Set new base URI for token metadata
    function setBaseTokenURI(string memory newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
    }

    /// @notice Update off-chain metadata CID
    function updateMetadataCID(string memory newCid) external onlyOwner {
        latestMetadataCid = newCid;
        emit MetadataUpdated(newCid, block.timestamp);
    }

    /// @notice Return token metadata URI
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        address owner;
        try this.ownerOf(tokenId) returns (address _owner) {
            owner = _owner;
        } catch {
            revert("ERC721Metadata: URI query for nonexistent token");
        }
        return string(abi.encodePacked(baseTokenURI, Strings.toString(tokenId), ".json"));
    }
}
