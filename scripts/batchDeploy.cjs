require("dotenv").config();
const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

// List your property metadata files here
const propertyFiles = [
    "property1.json",
    "property2.json",
    "property3.json",
    "property4.json",
    "property5.json",
    "property6.json"
];

async function main() {
    const usdcAddress = process.env.USDC_ADDRESS;
    const pricePerShare = ethers.parseUnits("1", 6); // 1 USDC with 6 decimals
    const baseTokenURI = process.env.BASE_TOKEN_URI;

    const PropertyToken = await ethers.getContractFactory("PropertyToken");

    for (const file of propertyFiles) {
        const raw = fs.readFileSync(path.join(__dirname, file), "utf-8");
        const prop = JSON.parse(raw);

        // Extract fields for the contract
        const name = prop.propertyName || "";
        const location = prop.propertyLocation || "";
        const jurisdiction = prop.jurisdiction || "";
        const issuer = prop.issuer || "";
        const totalShares = prop.totalShares || 0;
        const initialOwner = prop.ownerWallet || ethers.ZeroAddress;
        const image = prop.image || ""; // Could be empty, update later!
        const latestMetadataCid = ""; // Set as empty, will update after deploy

        console.log(`\nDeploying PropertyToken for "${name}"...`);
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
                latestMetadataCid
            ],
            { initializer: "initialize" }
        );
        await propertyToken.waitForDeployment();
        console.log(`  Deployed "${name}" at: ${propertyToken.target}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
