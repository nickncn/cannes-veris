// src/utils/fetchAllOwners.js
import { fetchAllProperties } from "./fetchAllProperties";

export async function fetchAllOwners() {
    const properties = await fetchAllProperties();
    const ownerMap = {};
    for (const prop of properties) {
        if (prop.ownerName || prop.ownerWallet) {
            const key = prop.ownerName + (prop.ownerWallet || "");
            ownerMap[key] = {
                name: prop.ownerName,
                wallet: prop.ownerWallet,
                assets: [prop.name],
            };
        }
    }
    // Aggregate
    for (const prop of properties) {
        for (const key in ownerMap) {
            if (ownerMap[key].name === prop.ownerName) {
                ownerMap[key].assets.push(prop.name);
            }
        }
    }
    return Object.values(ownerMap);
}
