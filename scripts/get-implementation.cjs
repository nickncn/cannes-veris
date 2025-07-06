const { upgrades } = require("hardhat");

async function main() {
    const proxyAddress = "0xD40492F53f3d387637E12d3Bf2dBD7B551D2C167";
    const impl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("Implementation address:", impl);
}

main().catch(console.error);
