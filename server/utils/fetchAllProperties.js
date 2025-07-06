import { transformIpfsData } from '../utils/transformIpfsData';

const PROPERTY_TOKENS = [
    "0x1DF87Ad00f2B46925a0017abC720C129d94CE9A7",
    "0x56eA33C2c53c0A7558209e34c8A4c36a0c40B4E2",
    "0x6795ec3AAF960fFB4D7e9411bec9c799f971Cc9D",
    "0xC6b32B271bf43f7Ad17929e697b21CFD5f06ef95",
    "0x6A9EECDd9D38D7bb139BD84F69Bc53b8e88585B5",
    "0xF13614d1bd1f846d8696124282FfC4b35c00a019",
];



async function fetchPropertyData(token) {

    let { propertyToken } = req.query;
    if (!propertyToken) {
        return res.status(400).json({ error: 'propertyToken required' });
    }
    propertyToken = propertyToken.toLowerCase();
    try {
        const res = await fetch(`http://localhost:3001/api/getPropertyData?propertyToken=${tokenLower}`);

        if (!res.ok) {
            console.error(`Network response was not ok for token ${tokenLower}: ${res.status} ${res.statusText}`);
            return null;
        }

        const data = await res.json();

        console.log(`Response for ${tokenLower}:`, data);

        if (!data.success) {
            console.error(`API error for token ${tokenLower}:`, data.error);
            return null;
        }
        if (!data.ipfsData) {
            console.error(`No IPFS data returned for token ${tokenLower}`);
            return null;
        }

        const property = transformIpfsData(data.ipfsData, tokenLower);
        console.log(`Transformed property data for token ${tokenLower}:`, property);
        return property;
    } catch (error) {
        console.error(`Fetch failed for token ${tokenLower}:`, error);
        return null;
    }
}

export async function fetchAllProperties() {
    const results = [];

    for (const token of PROPERTY_TOKENS) {
        const property = await fetchPropertyData(token);
        if (property) {
            results.push(property);
        } else {
            console.warn(`Skipping token ${token.toLowerCase()} due to fetch/transform failure.`);
        }
    }

    return results;
}
