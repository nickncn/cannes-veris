// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { ethers } from "ethers";

import publishMetadataHandler from './server/api/publishMetadata.js';
import getPropertyDataHandler from './server/api/getPropertyData.js';
import decodeProtoFromIpfsRouter from './server/api/decodeProtoFromIpfs.js';

dotenv.config();

const USDC_ABI = JSON.parse(readFileSync("./USDC.json", "utf8"));

const app = express();

app.use(cors({ origin: '*' }));

app.use(express.json());

const provider = new ethers.JsonRpcProvider("https://rpc-amoy.polygon.technology");
const faucetPrivateKey = process.env.FAUCET_PRIVATE_KEY;
const usdc = new ethers.Contract(
    "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
    USDC_ABI,
    new ethers.Wallet(faucetPrivateKey, provider)
);


app.post("/api/send-usdc", async (req, res) => {
    const { address, amount } = req.body;
    if (!ethers.isAddress(address)) return res.json({ success: false });
    try {
        const decimals = 6;
        const tx = await usdc.transfer(address, ethers.parseUnits(String(amount), decimals));
        await tx.wait();
        res.json({ success: true, txHash: tx.hash });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});


app.post('/api/publishMetadata', publishMetadataHandler);
app.get('/api/getPropertyData', getPropertyDataHandler);
app.use('/api', decodeProtoFromIpfsRouter);

app.listen(3001, () => console.log("Backend running on :3001"));
app.use(cors({ origin: 'http://localhost:4200' }));

