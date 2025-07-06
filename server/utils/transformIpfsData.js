// src/utils/transformIpfsData.js

export function stripTrailingId(val) {
    return String(val).replace(/_\d+$/, "").trim();
}
export function cleanKey(val) {
    return String(val).replace(/_\d+$/, "").trim().toLowerCase();
}
export function deref(val, map) {
    let steps = 0;
    let seen = new Set();
    while (
        typeof val === "string" &&
        val in map &&
        !seen.has(val) &&
        steps < 20 // failsafe
    ) {
        seen.add(val);
        val = map[val];
        steps++;
    }
    return val;
}

// Full property metadata transform (from your PropertyDetail.js)
export function transformIpfsData(ipfsData, tokenAddress) {
    if (!ipfsData?.ops) {
        console.error("No ipfsData or ops!", ipfsData);
        return null;
    }
    const ops = ipfsData.ops;

    // STEP 1: Build propId -> fieldName map
    const propIdToField = {};
    for (const op of ops) {
        if (op.updateEntity?.values) {
            for (const v of op.updateEntity.values) {
                if (typeof v.value === "string" && v.value.match(/_\d+$/)) {
                    propIdToField[op.updateEntity.id] = cleanKey(stripTrailingId(v.value));
                }
            }
        }
    }

    // STEP 2: Build propId -> value map (raw, could be pointer)
    const propIdToValue = {};
    for (const op of ops) {
        if (op.updateEntity?.values) {
            for (const v of op.updateEntity.values) {
                propIdToValue[op.updateEntity.id] = v.value;
                if (typeof v.property === "string") {
                    propIdToValue[v.property] = v.value;
                }
            }
        }
    }

    // STEP 3: FieldName -> dereferenced value
    const fieldValueMap = {};
    for (const [propId, field] of Object.entries(propIdToField)) {
        const rawValue = propIdToValue[propId];
        fieldValueMap[field] = deref(rawValue, propIdToValue);
    }
    // Try all known propIds
    for (const key in propIdToValue) {
        const cleaned = cleanKey(key);
        if (!fieldValueMap[cleaned]) {
            fieldValueMap[cleaned] = deref(propIdToValue[key], propIdToValue);
        }
    }

    let features = fieldValueMap.features || "";
    if (typeof features === "string") {
        features = features.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (!Array.isArray(features)) {
        features = [];
    }
    let image = fieldValueMap.image || fieldValueMap.img || fieldValueMap.photo || "";
    if (image && !/^https?:\/\//.test(image) && image.length > 10) {
        image = `https://ipfs.io/ipfs/${image}`;
    }
    if (!image) image = "/properties/apt1.png";
    const parseNum = (v) =>
        typeof v === "string" && !isNaN(Number(v)) ? Number(v) : v;

    return {
        id: 1,
        name:
            stripTrailingId(
                fieldValueMap.name ||
                fieldValueMap.propertyname ||
                fieldValueMap["seaside loft"] ||
                "Unknown Property"
            ),
        image,
        city: fieldValueMap.city || "",
        location: fieldValueMap.location || fieldValueMap.propertylocation || "",
        description: fieldValueMap.description || "",
        features,
        bedrooms: parseNum(fieldValueMap.bedrooms),
        bathrooms: parseNum(fieldValueMap.bathrooms),
        squareFootage: fieldValueMap.squarefootage || "",
        floorPrice: parseNum(fieldValueMap.totalshares) || 0.1,
        symbol: "USDC",
        token: {
            standard: "ERC-721",
            address: tokenAddress,
            tokenId: 1,
            tokenURI: `https://ipfs.io/ipfs/${ipfsData.cid || ""}/1`,
            explorer: `https://www.oklink.com/amoy/address/${tokenAddress}`,
        },
        supply: parseNum(fieldValueMap.totalshares) || 100,
        holders: parseNum(fieldValueMap.ownerscount) || 1,
        docs: {
            legal: fieldValueMap.legaldocs || fieldValueMap.legalDocs || "#",
            audit: fieldValueMap.audit || fieldValueMap.Audit || "#",
        },
        manager: {
            name: fieldValueMap.managername || "",
            url: fieldValueMap.managercontact
                ? `mailto:${fieldValueMap.managercontact}`
                : "",
        },
        ownerName: fieldValueMap.ownername || "",
        ownerWallet: fieldValueMap.ownerwallet || "",
        jurisdiction: fieldValueMap.jurisdiction || "",
        issuer: fieldValueMap.issuer || "",
        auditTimestamp: fieldValueMap.audittimestamp || "",
        auditor: fieldValueMap.auditor || "",
        kycLevelRequired: parseNum(fieldValueMap.kyclevelrequired),
    };
}
