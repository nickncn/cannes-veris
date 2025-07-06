import dotenv from 'dotenv';
dotenv.config();

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Graph } from '@graphprotocol/grc-20';
import { EditProposal } from '@graphprotocol/grc-20/proto';
import { Ipfs } from '@graphprotocol/grc-20';
import { createPublicClient, createWalletClient, http } from 'viem';
import { encodeFunctionData } from 'viem';
import { polygonAmoy } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const metadataABIPath = path.resolve(__dirname, '../../artifacts/contracts/MetadataRegistry.sol/MetadataRegistry.json');
const MetadataRegistryABI = JSON.parse(readFileSync(metadataABIPath, 'utf-8'));

const RPC_URL = process.env.POLYGON_AMOY_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const PROPERTY_TOKEN_ADDRESS = process.env.PROPERTY_TOKEN_ADDRESS;
const METADATA_REGISTRY_ADDRESS = process.env.METADATA_REGISTRY_ADDRESS;

const DataType = {
    TEXT: 0,
    NUMBER: 1,
    CHECKBOX: 2,
    TIME: 3,
    POINT: 4,
    RELATION: 5,
};

const publicClient = createPublicClient({
    chain: polygonAmoy,
    transport: http(RPC_URL),
});

const account = privateKeyToAccount(PRIVATE_KEY);
const walletClient = createWalletClient({
    chain: polygonAmoy,
    transport: http(RPC_URL),
    privateKey: PRIVATE_KEY,
    account,
});

function bufferToStream(buffer) {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null); // Signal EOF
    return stream;
}

async function addToLocalIpfs(buffer) {
    const formData = new FormData();

    // Convert buffer to stream
    const stream = bufferToStream(buffer);

    formData.append('file', stream, {
        filename: 'metadata.proto',
        contentType: 'application/octet-stream',
    });

    const res = await fetch('http://127.0.0.1:5001/api/v0/add?pin=true', {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to add file to local IPFS node: ${text}`);
    }

    const data = await res.json();
    return data.Hash;
}


export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'POST only' });
    }

    try {
        const unique = Date.now().toString();

        // Extract metadata from request body
        const {
            propertyName,
            propertyLocation,
            propertyDescription = '',
            bedrooms = 0,
            bathrooms = 0,
            squareFootage = 0,
            features = [],
            totalShares = 0,
            ownersCount = 0,
            legalDocsUrl = '',
            auditUrl = '',
            managerName = 'AcmeDAO',
            managerContact = 'manager@demo.com',
            ownerName = 'Alice',
            ownerWallet = '0x123abc...',
            jurisdiction = '',
            issuer = '',
            auditTimestamp = '',
            auditor = '',
            kycLevelRequired = 0,
        } = req.body;

        if (!propertyName || !propertyLocation) {
            return res.status(400).json({ error: 'propertyName and propertyLocation required' });
        }

        const ops = [];

        // 1. Create property value properties
        const propDefs = [
            { name: `Name_${unique}`, type: DataType.TEXT },
            { name: `Location_${unique}`, type: DataType.TEXT },
            { name: `Description_${unique}`, type: DataType.TEXT },
            { name: `Bedrooms_${unique}`, type: DataType.NUMBER },
            { name: `Bathrooms_${unique}`, type: DataType.NUMBER },
            { name: `SquareFootage_${unique}`, type: DataType.NUMBER },
            { name: `Features_${unique}`, type: DataType.TEXT },
            { name: `TotalShares_${unique}`, type: DataType.NUMBER },
            { name: `OwnersCount_${unique}`, type: DataType.NUMBER },
            { name: `LegalDocs_${unique}`, type: DataType.TEXT },
            { name: `Audit_${unique}`, type: DataType.TEXT },
            { name: `Jurisdiction_${unique}`, type: DataType.TEXT },
            { name: `Issuer_${unique}`, type: DataType.TEXT },
            { name: `AuditTimestamp_${unique}`, type: DataType.TEXT },
            { name: `Auditor_${unique}`, type: DataType.TEXT },
            { name: `KycLevelRequired_${unique}`, type: DataType.NUMBER },
        ];
        const propertyPropIds = [];
        for (const def of propDefs) {
            const { id, ops: defOps } = Graph.createProperty({ name: def.name, dataType: def.type });
            if (!id || id === '0') throw new Error(`Failed to create property property: ${def.name}`);
            propertyPropIds.push(id);
            ops.push(...defOps);
        }

        // 2. Create relation properties
        const { id: ownedByRelId, ops: ownedByRelOps } = Graph.createProperty({
            name: `ownedBy_${unique}`,
            dataType: DataType.RELATION,
        });
        if (!ownedByRelId || ownedByRelId === '0') throw new Error('Failed to create ownedBy relation property');
        ops.push(...ownedByRelOps);

        const { id: managedByRelId, ops: managedByRelOps } = Graph.createProperty({
            name: `managedBy_${unique}`,
            dataType: DataType.RELATION,
        });
        if (!managedByRelId || managedByRelId === '0') throw new Error('Failed to create managedBy relation property');
        ops.push(...managedByRelOps);

        // 3. Create property type
        const allPropertyTypePropIds = [...propertyPropIds, ownedByRelId, managedByRelId];
        const propertyTypeName = `RealEstateProperty_${unique}`;
        const { id: propertyTypeId, ops: propertyTypeOps } = Graph.createType({
            name: propertyTypeName,
            properties: allPropertyTypePropIds,
        });
        if (!propertyTypeId || propertyTypeId === '0') throw new Error('Failed to create property type');
        ops.push(...propertyTypeOps);

        // 4. Owner props and type
        const ownerProps = [
            { name: `OwnerName_${unique}`, type: DataType.TEXT },
            { name: `OwnerWallet_${unique}`, type: DataType.TEXT },
        ];
        const ownerPropIds = [];
        for (const def of ownerProps) {
            const { id, ops: defOps } = Graph.createProperty({
                name: def.name,
                dataType: def.type,
            });
            if (!id || id === '0') throw new Error(`Failed to create owner property: ${def.name}`);
            ownerPropIds.push(id);
            ops.push(...defOps);
        }
        const ownerTypeName = `Owner_${unique}`;
        const { id: ownerTypeId, ops: ownerTypeOps } = Graph.createType({
            name: ownerTypeName,
            properties: ownerPropIds,
        });
        if (!ownerTypeId || ownerTypeId === '0') throw new Error('Failed to create owner type');
        ops.push(...ownerTypeOps);

        // 5. Owner entity
        const ownerEntityName = `${ownerName}_${unique}`;
        const { id: ownerId, ops: ownerOps } = Graph.createEntity({
            name: ownerEntityName,
            types: [ownerTypeId],
            values: [
                { property: ownerPropIds[0], value: ownerName },
                { property: ownerPropIds[1], value: ownerWallet },
            ],
        });
        if (!ownerId || ownerId === '0') throw new Error('Failed to create owner entity');
        ops.push(...ownerOps);

        // 6. Manager props and type
        const managerProps = [
            { name: `ManagerName_${unique}`, type: DataType.TEXT },
            { name: `ManagerContact_${unique}`, type: DataType.TEXT },
        ];
        const managerPropIds = [];
        for (const def of managerProps) {
            const { id, ops: defOps } = Graph.createProperty({
                name: def.name,
                dataType: def.type,
            });
            if (!id || id === '0') throw new Error(`Failed to create manager property: ${def.name}`);
            managerPropIds.push(id);
            ops.push(...defOps);
        }
        const managerTypeName = `Manager_${unique}`;
        const { id: managerTypeId, ops: managerTypeOps } = Graph.createType({
            name: managerTypeName,
            properties: managerPropIds,
        });
        if (!managerTypeId || managerTypeId === '0') throw new Error('Failed to create manager type');
        ops.push(...managerTypeOps);

        // 7. Manager entity
        const managerEntityName = `${managerName}_${unique}`;
        const { id: managerId, ops: managerOps } = Graph.createEntity({
            name: managerEntityName,
            types: [managerTypeId],
            values: [
                { property: managerPropIds[0], value: managerName },
                { property: managerPropIds[1], value: managerContact },
            ],
        });
        if (!managerId || managerId === '0') throw new Error('Failed to create manager entity');
        ops.push(...managerOps);

        // 8. Property entity
        const propertyEntityName = `${propertyName}_${unique}`;
        const { id: propertyEntityId, ops: propertyEntityOps } = Graph.createEntity({
            name: propertyEntityName,
            description: `Property at ${propertyLocation}`,
            types: [propertyTypeId],
            values: [
                { property: propertyPropIds[0], value: propertyName },
                { property: propertyPropIds[1], value: propertyLocation },
                { property: propertyPropIds[2], value: propertyDescription },
                { property: propertyPropIds[3], value: bedrooms.toString() },
                { property: propertyPropIds[4], value: bathrooms.toString() },
                { property: propertyPropIds[5], value: squareFootage.toString() },
                { property: propertyPropIds[6], value: features.join(', ') },
                { property: propertyPropIds[7], value: totalShares.toString() },
                { property: propertyPropIds[8], value: ownersCount.toString() },
                { property: propertyPropIds[9], value: legalDocsUrl },
                { property: propertyPropIds[10], value: auditUrl },
                { property: propertyPropIds[11], value: jurisdiction },
                { property: propertyPropIds[12], value: issuer },
                { property: propertyPropIds[13], value: auditTimestamp },
                { property: propertyPropIds[14], value: auditor },
                { property: propertyPropIds[15], value: kycLevelRequired ? kycLevelRequired.toString() : '0' },
            ],
        });
        if (!propertyEntityId || propertyEntityId === '0') throw new Error('Failed to create property entity');
        ops.push(...propertyEntityOps);

        // 9. Create relations
        const { id: ownedByRelationId, ops: ownedByRelOps2 } = Graph.createRelation({
            type: ownedByRelId,
            fromEntity: propertyEntityId,
            toEntity: ownerId,
            entity: propertyEntityId,
        });
        if (!ownedByRelationId || ownedByRelationId === '0') throw new Error('Failed to create ownedBy relation');
        ops.push(...ownedByRelOps2);

        const { id: managedByRelationId, ops: managedByRelOps2 } = Graph.createRelation({
            type: managedByRelId,
            fromEntity: propertyEntityId,
            toEntity: managerId,
            entity: propertyEntityId,
        });
        if (!managedByRelationId || managedByRelationId === '0') throw new Error('Failed to create managedBy relation');
        ops.push(...managedByRelOps2);

        // --- 10. Encode protobuf buffer ---
        const protoName = `Property Metadata: ${propertyName}`;
        const protoAuthor = WALLET_ADDRESS;
        const protoBuf = EditProposal.encode({
            name: protoName,
            ops,
            author: protoAuthor,
        });

        // --- 11. Add & pin to local IPFS ---
        const result = await Ipfs.publishEdit({
            name: protoName,
            ops,
            author: protoAuthor,
        });
        const cid = result.cid;
        const cidToStore = `ipfs://${cid}`;
        console.log(`[Graph IPFS] Published edit with CID: ${cid}`);


        // --- 12. Store CID on-chain ---
        const calldata = encodeFunctionData({
            abi: MetadataRegistryABI.abi,
            functionName: 'setMetadataCID',
            args: [PROPERTY_TOKEN_ADDRESS, cidToStore],
        });

        const txRequest = {
            to: METADATA_REGISTRY_ADDRESS,
            data: calldata,
            chainId: 80002,
            gasPrice: await publicClient.getGasPrice(),
        };

        const txHash = await walletClient.sendTransaction(txRequest);
        await publicClient.waitForTransactionReceipt({ hash: txHash });
        console.log(`[OnChain] Stored CID. TxHash: ${txHash}`);

        // --- 13. Return success response ---
        return res.status(200).json({
            success: true,
            cid: cidToStore,
            propertyEntityId,
            ownerId,
            managerId,
            txHash,
        });
    } catch (error) {
        console.error('Error publishing metadata or writing onchain:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
