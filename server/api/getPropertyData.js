// server/api/getPropertyData.js

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPublicClient, http } from 'viem';
import { polygonAmoy } from 'viem/chains';
import { Edit } from '@graphprotocol/grc-20/proto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const metadataABIPath = path.resolve(__dirname, '../../artifacts/contracts/MetadataRegistry.sol/MetadataRegistry.json');
const MetadataRegistryABI = JSON.parse(readFileSync(metadataABIPath, 'utf-8'));

const RPC_URL = process.env.POLYGON_AMOY_RPC_URL;
const METADATA_REGISTRY_ADDRESS = process.env.METADATA_REGISTRY_ADDRESS;

const publicClient = createPublicClient({
    chain: polygonAmoy,
    transport: http(RPC_URL),
});

// Try public gateways first!
async function fetchFromIpfs(cid) {
    const path = cid.replace(/^ipfs:\/\//, '');
    const urls = [
        `https://gateway.lighthouse.storage/ipfs/${path}`,
    ];
    let lastError = null;
    for (const url of urls) {
        console.log(`[IPFS] Trying ${url}`);
        try {
            const resp = await fetch(url);
            if (resp.ok) {
                console.log(`[IPFS] Success from ${url}`);
                return await resp.arrayBuffer();
            }
            lastError = `Failed at ${url}: ${resp.status} ${resp.statusText}`;
        } catch (err) {
            lastError = `Error at ${url}: ${err.message}`;
        }
    }
    throw new Error(lastError || "All gateways failed");
}

export default async function handler(req, res) {
    console.log('QUERY:', req.query);
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'GET only' });
    }
    try {
        let { propertyToken } = req.query;
        if (!propertyToken) {
            return res.status(400).json({ error: 'propertyToken required' });
        }
        propertyToken = propertyToken.toLowerCase();
        console.log(
            `STEP 1: Calling getMetadataCID on ${METADATA_REGISTRY_ADDRESS} for token ${propertyToken}`
        );
        const cid = await publicClient.readContract({
            address: METADATA_REGISTRY_ADDRESS,
            abi: MetadataRegistryABI.abi,
            functionName: 'getMetadataCID',
            args: [propertyToken],
        });
        console.log('STEP 1 DONE: CID is', cid);
        if (!cid || cid === "") return res.status(404).json({ error: 'No CID found for this token' });

        // Try fetching metadata from public IPFS
        let arrayBuffer;
        try {
            console.log("STEP 2: Fetching from IPFS");
            arrayBuffer = await fetchFromIpfs(cid);
        } catch (error) {
            console.error("IPFS fetch failed:", error);
            return res.status(500).json({ success: false, error: `Could not fetch IPFS file: ${error.message}` });
        }

        // Parse proto buffer
        let decoded;
        try {
            decoded = Edit.fromBinary(new Uint8Array(arrayBuffer));
        } catch (e) {
            return res.status(500).json({ error: "Failed to decode proto", details: e.message });
        }

        // Extract values
        const updateEntities = decoded.ops.filter(
            op => op.payload?.case === "updateEntity"
        ).map(op => op.payload.value);

        if (!updateEntities.length)
            return res.status(500).json({ error: "No updateEntity operations found" });

        const mainEntity = updateEntities.reduce(
            (a, b) => (b.values?.length > (a.values?.length || 0) ? b : a),
            { values: [] }
        );
        const values = mainEntity.values || [];

        const getProp = (key) => {
            for (const v of values) {
                let prop = v.property;
                if (prop && prop instanceof Uint8Array) {
                    try {
                        prop = new TextDecoder().decode(prop);
                    } catch {
                        prop = Array.from(prop).map(b => b.toString(16).padStart(2, '0')).join('');
                    }
                }
                if ((prop || "").toLowerCase().includes(key.toLowerCase())) {
                    return v.value;
                }
            }
            return "";
        };

        // Build your mapped property object
        const mapped = {
            name: getProp("name"),
            location: getProp("location"),
            description: getProp("description"),
            legalDocs: getProp("legaldocs"),
            audit: getProp("audit"),
            managerName: getProp("managername"),
            managerContact: getProp("managercontact"),
            features: (getProp("features") || "").split(",").map(f => f.trim()).filter(Boolean),
            ownersCount: getProp("ownerscount"),
            totalShares: getProp("totalshares"),
            // ... add more fields as needed!
        };
        console.log('Using METADATA_REGISTRY_ADDRESS:', METADATA_REGISTRY_ADDRESS);

        return res.status(200).json({ success: true, cid, property: mapped, ipfsData: decoded });
    } catch (error) {
        console.error('Error fetching property data:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
