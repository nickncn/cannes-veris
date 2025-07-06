import "dotenv/config";
import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    // Replace with your contract address
    const propertyTokenAddress = "0xD40492F53f3d387637E12d3Bf2dBD7B551D2C167";

    // Replace with your EOA addresses to whitelist
    const eoaAddresses = [
        "0xFaAc141875743347E18748Da3B5fFFF3b749D833",
        "0xcE6d03F1bD5D6c1AD5CB1CA8F5000db6496e336A" // <-- replace with your second EOA
    ];

    // Get the deployer/owner signer
    const [owner] = await ethers.getSigners();

    // Connect to contract
    const propertyToken = await ethers.getContractAt("PropertyToken", propertyTokenAddress, owner);

    for (const eoa of eoaAddresses) {
        const tx = await propertyToken.addToWhitelist(eoa);
        console.log(`Whitelisting tx for ${eoa}: ${tx.hash}`);
        await tx.wait();
        console.log(`Whitelisted: ${eoa}`);
    }
}

main().catch(console.error);
