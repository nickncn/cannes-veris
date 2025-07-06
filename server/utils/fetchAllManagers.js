// src/utils/fetchAllManagers.js
import { fetchAllProperties } from "./fetchAllProperties";

export async function fetchAllManagers() {
    const properties = await fetchAllProperties();
    // Collect managers (unique by name or contact)
    const managerMap = {};
    for (const prop of properties) {
        if (prop.manager?.name) {
            const key = prop.manager.name + (prop.manager.url || "");
            managerMap[key] = {
                name: prop.manager.name,
                contact: prop.manager.url || "",
                assets: [prop.name],
                jurisdiction: prop.jurisdiction || "",
            };
        }
    }
    // If a manager manages multiple assets, aggregate
    for (const prop of properties) {
        for (const key in managerMap) {
            if (managerMap[key].name === prop.manager?.name) {
                managerMap[key].assets.push(prop.name);
            }
        }
    }
    return Object.values(managerMap);
}
