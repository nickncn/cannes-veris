// src/utils/fetchPropertyTxs.js
export async function fetchPropertyTxs(tokenAddress) {
  console.log("Fetching property shares for token:", tokenAddress.toLowerCase());
  const query = `
      {
        propertyShares(where: { contract: "${tokenAddress.toLowerCase()}" }) {
          id
          tokenId
          owner { id }
          mintedAt
        }
      }
    `;

  const res = await fetch("https://api.studio.thegraph.com/query/113714/cannes/v0.0.6", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const { data } = await res.json();
  if (!data || !data.propertyShares) return [];
  return data.propertyShares.map((s) => ({
    type: "Mint",
    hash: s.id.split("-")[1] || "",
    value: "",
    time: new Date(Number(s.mintedAt) * 1000).toLocaleString(),
  }));
}
