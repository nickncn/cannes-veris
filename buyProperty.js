// projectroot/buyProperty.js

import "dotenv/config";
import { createPublicClient, http, getContract, parseUnits, encodePacked, hexToBigInt, erc20Abi } from "viem";
import { polygonAmoy } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import {
    createBundlerClient,
    toSimple7702SmartAccount,
} from "viem/account-abstraction";
import { signPermit } from "./permit.js";
import fs from "fs";

// === 1. Setup environment ===
const chain = polygonAmoy;
const usdcAddress = process.env.USDC_ADDRESS;
const paymasterAddress = process.env.PAYMASTER_V08_ADDRESS;
const propertyTokenAddress = process.env.PROPERTY_TOKEN_ADDRESS;
const propertyTokenId = BigInt(process.env.PROPERTY_TOKEN_ID || "1");
const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
const rpcUrl = process.env.RPC_URL;

if (!ownerPrivateKey) throw new Error("Set OWNER_PRIVATE_KEY in .env!");

const client = createPublicClient({ chain, transport: http(rpcUrl) });
const owner = privateKeyToAccount(ownerPrivateKey);

const account = await toSimple7702SmartAccount({ client, owner });

console.log("Smart account address:", account.address);


const usdc = getContract({ client, address: usdcAddress, abi: erc20Abi });
const usdcBalance = await usdc.read.balanceOf([account.address]);
console.log("USDC balance (raw):", usdcBalance.toString());

if (usdcBalance < parseUnits("0.1", 6)) {
    console.error(
        `Fund ${account.address} with at least 0.1 USDC (6 decimals) on Polygon Amoy (https://faucet.circle.com), then run this again.`
    );
    process.exit();
}


const permitAmount = parseUnits("10", 6);
const permitSignature = await signPermit({
    tokenAddress: usdcAddress,
    account,
    client,
    spenderAddress: paymasterAddress,
    permitAmount: permitAmount,
});

const paymasterData = encodePacked(
    ["uint8", "address", "uint256", "bytes"],
    [0, usdcAddress, permitAmount, permitSignature],
);


const paymaster = {
    async getPaymasterData() {
        return {
            paymaster: paymasterAddress,
            paymasterData,
            paymasterVerificationGasLimit: 200000n,
            paymasterPostOpGasLimit: 15000n,
            isFinal: true,
        };
    },
};


const bundlerClient = createBundlerClient({
    account,
    client,
    paymaster,
    transport: http(`https://public.pimlico.io/v2/${chain.id}/rpc`),
    userOperation: {
        estimateFeesPerGas: async ({ bundlerClient }) => {
            const { standard: fees } = await bundlerClient.request({
                method: "pimlico_getUserOperationGasPrice",
            });
            return {
                maxFeePerGas: hexToBigInt(fees.maxFeePerGas),
                maxPriorityFeePerGas: hexToBigInt(fees.maxPriorityFeePerGas),
            };
        },
    },
});


const PROPERTY_ABI = JSON.parse(fs.readFileSync("./src/abis/PropertyToken.json", "utf-8"));


const call = {
    to: propertyTokenAddress,
    abi: PROPERTY_ABI,
    functionName: "buyPropertyShare",
    args: [propertyTokenId, 1n],
};


console.log("Submitting UserOperation to buy property token...");
const hash = await bundlerClient.sendUserOperation({
    account,
    calls: [call],
});
console.log("UserOperation hash:", hash);

const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });
console.log("Transaction hash:", receipt.receipt.transactionHash);

process.exit();
