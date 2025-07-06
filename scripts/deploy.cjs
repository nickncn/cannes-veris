require("dotenv").config();
const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const usdcAddress = process.env.USDC_ADDRESS;
    const pricePerShare = ethers.parseUnits("1", 6);
    const baseTokenURI = process.env.BASE_TOKEN_URI;

    const raw = fs.readFileSync(path.join(__dirname, "property1.json"), "utf-8");
    const prop = JSON.parse(raw);

    const name = prop.propertyName || "";
    const location = prop.propertyLocation || "";
    const jurisdiction = prop.jurisdiction || "";
    const issuer = prop.issuer || "";
    const totalShares = prop.totalShares || 0;
    const initialOwner = prop.ownerWallet || ethers.ZeroAddress;
    const image = prop.image || "";
    const latestMetadataCid = "";

    console.log(`Deploying PropertyToken for "${name}"...`);

    const PropertyToken = await ethers.getContractFactory("PropertyToken");

    const propertyToken = await upgrades.deployProxy(
        PropertyToken,
        [
            usdcAddress,
            pricePerShare,
            baseTokenURI,
            initialOwner,
            name,
            location,
            jurisdiction,
            issuer,
            totalShares,
            image,
            latestMetadataCid,
        ],
        { initializer: "initialize" }
    );

    await propertyToken.waitForDeployment();

    console.log(`Deployed PropertyToken at: ${propertyToken.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
