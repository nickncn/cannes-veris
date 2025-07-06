// backend/index.js
import express from "express";
import "dotenv/config";
import cors from "cors";
import { createPublicClient, http, getContract, erc20Abi } from "viem";
import { polygonAmoy } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { createBundlerClient, toSimple7702SmartAccount } from "viem/account-abstraction";
import { encodePacked, hexToBigInt } from "viem";
import { signPermit } from "./permit.js";

const app = express();
app.use(cors({ origin: "http://localhost:4200", methods: ["GET", "POST", "OPTIONS"], credentials: true }));
app.use(express.json());

const usdcAddress = process.env.USDC_ADDRESS;
const paymasterAddress = process.env.PAYMASTER_V08_ADDRESS;
const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
const treasuryAddress = process.env.TREASURY_ADDRESS;

const chain = polygonAmoy;


app.post("/api/pay-with-usdc", async (req, res) => {
    try {
        const { recipient, amount } = req.body;
        if (!recipient || !amount) return res.status(400).json({ error: "recipient and amount required" });

        // 1. Gasless USDC transfer using Paymaster
        const client = createPublicClient({ chain, transport: http() });
        const owner = privateKeyToAccount(ownerPrivateKey);
        const account = await toSimple7702SmartAccount({ client, owner });

        const usdc = getContract({ client, address: usdcAddress, abi: erc20Abi });
        const usdcBalance = await usdc.read.balanceOf([account.address]);
        const sendAmount = BigInt(Math.floor(Number(amount) * 1e6));

        if (usdcBalance < sendAmount) {
            return res.status(400).json({ error: "Insufficient USDC" });
        }

        // Permit for Circle Paymaster
        const permitAmount = sendAmount;
        const permitSignature = await signPermit({
            tokenAddress: usdcAddress,
            client,
            account,
            spenderAddress: paymasterAddress,
            permitAmount,
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
            transport: http(`https://public.pimlico.io/v2/${chain.id}/rpc`),
        });

        // 2. Send USDC to treasury
        const hash = await bundlerClient.sendUserOperation({
            account,
            calls: [
                {
                    to: usdcAddress,
                    abi: erc20Abi,
                    functionName: 'transfer',
                    args: [treasuryAddress || recipient, sendAmount],
                },
            ],
        });

        const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });

        res.json({
            paymentTxHash: receipt.receipt.transactionHash,
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.get("/api/nft-status", async (req, res) => {
    try {
        const { address } = req.query;
        if (!address) return res.status(400).json({ error: "address required" });

        const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology");
        const propertyToken = new ethers.Contract(
            process.env.PROPERTY_TOKEN_ADDRESS,
            PropertyTokenArtifact.abi,
            provider
        );

        const balance = await propertyToken.balanceOf(address);

        let tokenIds = [];
        try {
            if (propertyToken.tokenOfOwnerByIndex && balance > 0) {
                for (let i = 0; i < balance; i++) {
                    const tokenId = await propertyToken.tokenOfOwnerByIndex(address, i);
                    tokenIds.push(tokenId.toString());
                }
            }
        } catch (err) {
            tokenIds = [];
        }

        res.json({
            address,
            nftCount: balance.toString(),
            tokenIds,
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));
