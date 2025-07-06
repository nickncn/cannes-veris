import dotenv from 'dotenv';
dotenv.config();

import hre from 'hardhat';

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log('Deploying MetadataRegistry with account:', deployer.address);

    const MetadataRegistry = await hre.ethers.getContractFactory('MetadataRegistry');
    const registry = await MetadataRegistry.deploy();

    // In ethers v6, deploy() is awaited and transaction is mined immediately
    // No need for registry.deployed()

    console.log('MetadataRegistry deployed to:', registry.target ?? registry.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
