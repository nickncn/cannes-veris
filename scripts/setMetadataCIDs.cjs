require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const registryAddress = process.env.METADATA_REGISTRY_ADDRESS;
    const abi = [
        "function setMetadataCID(address, string) external",
        "function owner() view returns (address)"
    ];
    const [deployer] = await ethers.getSigners();
    const registry = await ethers.getContractAt(abi, registryAddress);

    const mappings = [
        { token: "0x1DF87Ad00f2B46925a0017abC720C129d94CE9A7", cid: "ipfs://bafkreia4k6goindud4dt75wzni5h77unyey332t7j6vcdmad3evll6qdia" },
        { token: "0x56eA33C2c53c0A7558209e34c8A4c36a0c40B4E2", cid: "ipfs://bafkreihqsfhd4w4cfidbk6ruoaf6425s6roabzv7sbwn5mbmcoyeppqu4e" },
        { token: "0x6795ec3AAF960fFB4D7e9411bec9c799f971Cc9D", cid: "ipfs://bafkreid5g5yc5nj3unqtlx2slh6xq3x5d4m7sf7nrf7qs5k637sk5uvghu" },
        { token: "0xC6b32B271bf43f7Ad17929e697b21CFD5f06ef95", cid: "ipfs://bafkreicw6zo4yn7pz53hpmvdvbcoxfndejz3khjfiwzptnwbvawzm24kgy" },
        { token: "0x6A9EECDd9D38D7bb139BD84F69Bc53b8e88585B5", cid: "ipfs://bafkreicmxitplqjbuyotvnzu6kzyvrd3bwacbmy4yo5iarvbwrs6d7tn7y" },
        { token: "0xF13614d1bd1f846d8696124282FfC4b35c00a019", cid: "ipfs://bafkreidm2aj2qis5zejwzojpvlvqcpt7tdupmsykv6raa5hu6wck3of2hy" },
    ];

    for (const { token, cid } of mappings) {
        const tx = await registry.setMetadataCID(token, cid);
        await tx.wait();
        console.log(`Mapped: ${token} → ${cid}`);
    }
}
main();
