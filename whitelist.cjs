require('dotenv').config();
const { ethers } = require('ethers');

const {
  PRIVATE_KEY,
  POLYGON_AMOY_RPC_URL,
  CONTRACT_ADDRESS,
  WHITELIST,
} = process.env;

if (!PRIVATE_KEY || !POLYGON_AMOY_RPC_URL || !CONTRACT_ADDRESS || !WHITELIST) {
  console.error("Please set PRIVATE_KEY, POLYGON_AMOY_RPC_URL, CONTRACT_ADDRESS, WHITELIST in your .env");
  process.exit(1);
}

const ABI = [
  "function addToWhitelist(address user) external",
];

async function main() {
  const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  const addresses = WHITELIST.split(',').map(a => a.trim()).filter(Boolean);
  if (!addresses.length) {
    console.error("No addresses to whitelist!");
    return;
  }

  for (const address of addresses) {
    try {
      console.log(`Whitelisting ${address}...`);
      const tx = await contract.addToWhitelist(address);
      console.log(`  Transaction sent: ${tx.hash}`);
      await tx.wait();
      console.log(`  Confirmed!`);
    } catch (err) {
      console.error(`Failed to whitelist ${address}:`, err);
    }
  }
}

main();
