// server/api/buy-property.js (Express example)
import express from "express";
import { createKernelAccountClient, createZeroDevPaymasterClient } from "@zerodev/sdk";
import { polygonAmoy } from "viem/chains";

const USDC_ADDRESS = "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";
const PROPERTY_TOKEN_ADDRESS = "0xD40492F53f3d387637E12d3Bf2dBD7B551D2C167";
const ZERODEV_PROJECT_ID = process.env.ZERODEV_PROJECT_ID;
const PIMLICO_API_KEY = process.env.PIMLICO_API_KEY;

const router = express.Router();

router.post("/", async (req, res) => {
    const { address, tokenId, amount, price } = req.body;
    try {
        const client = await createKernelAccountClient({
            projectId: ZERODEV_PROJECT_ID,
            chain: polygonAmoy,
            paymaster: createZeroDevPaymasterClient({
                apiKey: PIMLICO_API_KEY,
                usePaymaster: "erc20",
                tokenAddress: USDC_ADDRESS,
            }),
            // ...extra config to act "as" user smart account, if possible
        });

        const { hash } = await client.sendTransaction({
            to: PROPERTY_TOKEN_ADDRESS,
            value: 0n,
            data: client.account.encodeFunctionData({
                abi: [
                    {
                        "inputs": [
                            { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
                            { "internalType": "uint256", "name": "amount", "type": "uint256" }
                        ],
                        "name": "buyPropertyShare",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    }
                ],
                functionName: "buyPropertyShare",
                args: [tokenId, 1],
            }),
        });

        res.json({ success: true, txHash: hash });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
