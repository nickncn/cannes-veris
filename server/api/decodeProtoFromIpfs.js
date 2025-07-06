// server/api/decodeProtoFromIpfs.js

import express from "express";
import fetch from "node-fetch";

// NOTE: Depending on your actual node_modules, you may need one of these imports:
import { Edit } from '@graphprotocol/grc-20/proto';         // ← try this first
// import { Edit } from '@graphprotocol/grc-20';           // ← or this if above fails
// import { EditProposal } from '@graphprotocol/grc-20';   // ← if you published EditProposal

const router = express.Router();

/**
 * GET /api/decodeProtoFromIpfs?cid=<ipfs_cid>
 * Decodes a GRC-20 proto (binary) from IPFS and returns the parsed JSON
 */
const LOCAL_IPFS_GATEWAY = "http://127.0.0.1:8080/ipfs/";
const FALLBACK_PUBLIC_IPFS = "https://ipfs.io/ipfs/";

router.get('/decodeProtoFromIpfs', async (req, res) => {
    const { cid } = req.query;
    if (!cid) {
        return res.status(400).json({ error: 'CID required' });
    }

    try {
        const cidString = cid.replace(/^ipfs:\/\//, "");
        let ipfsUrl = `${LOCAL_IPFS_GATEWAY}${cidString}`;
        let resp = await fetch(ipfsUrl);
        if (!resp.ok) {
            console.log(`Local IPFS fetch failed (${ipfsUrl}), falling back to ipfs.io`);
            ipfsUrl = `${FALLBACK_PUBLIC_IPFS}${cidString}`;
            resp = await fetch(ipfsUrl);
        }
        if (!resp.ok) throw new Error(`Could not fetch IPFS file from any gateway`);

        const buffer = await resp.arrayBuffer();
        const decoded = Edit.fromBinary(new Uint8Array(buffer));
        return res.status(200).json({ success: true, decoded });
    } catch (error) {
        console.error("[decodeProtoFromIpfs] Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});


export default router;
