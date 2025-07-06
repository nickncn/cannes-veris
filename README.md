# 🧱 Compliant, Queryable Metadata Infra for Tokenized Real-World Assets (RWA)

> **The composable compliance and metadata infrastructure for tokenized property and real-world assets.  
Powering every RWA platform’s data and checkout—globally, and transparently.**

---

## 🚫 Not Another Property Investment Site

This is not a “real estate marketplace.”  
Not a “platform to buy apartment shares.”  
Not a siloed dApp with hardcoded listings.

---

## What We **Are**

**A protocol and developer layer** for real-world asset (RWA) metadata, compliance, and transactions.  
We are the **Plaid / Stripe / Infura** of tokenized property infrastructure—enabling *any* app, wallet, or marketplace to build on top.

---

## 🧠 Core Features

### 📚 Composable Compliance Metadata Registry
- Structured using the **GRC-20 / Knowledge Graph** standard
- On-chain + off-chain metadata for tokenized assets
- Entity-relation graph: assets, issuers, managers, owners, KYC, legal, jurisdiction, audit

### 🔍 Queryable API / Subgraph Layer
- Filter by jurisdiction, asset class, compliance status, or ownership structure
- Plug in to validate asset provenance, audit trail, and real-world backing

### 🧩 Plug-and-Play Checkout Layer
- Add a **modular transaction UI** (like Stripe Checkout) to any RWA platform
- Supports gasless USDC flows, powered by metadata compliance checks

### 🏗️ Infra for Builders
- Build your own marketplace, wallet, or dashboard on top
- Bring your own frontend or white-label the flow
- Fully composable across assets, geographies, issuers, and platforms

---

## 🧾 Why the Industry Needs This

The RWA space doesn’t need more consumer-facing real estate sites. It needs:

- **Transparent, trusted metadata infra** across platforms  
- **Composable compliance layers** instead of siloed silos  
- **Open registries** instead of black-box “we promise it’s compliant” UIs  

> We are infra-first. We make RWA platforms composable, compliant, and credible.

---

## 🧪 Bounty Showcases

### 🔹 USDC Gasless Transactions
> “Our protocol lets *any* dApp or marketplace plug in a gasless, USDC-powered checkout layer—on top of a fully validated compliance registry.”

### 🔹 Graph-Based Metadata Schema
> “All asset, compliance, and audit data is structured as a **GRC-20 entity-relation graph**, enabling filtering, onboarding, and validation in seconds.”

---

## 🧠 Think:

- **Stripe** → for asset token checkout & payments  
- **Plaid** → for KYC, compliance, audit history  
- **Infura** → for querying RWA metadata & provenance  

---

## 🛠️ Tech Stack

- **Smart Contracts**: ERC standards + GRC-20 metadata
- **Backend**: Node.js, GraphQL, Subgraph for metadata indexing
- **Checkout Layer**: Gasless USDC flow with whitelist/auth
- **Metadata Structure**: Typed property JSONs + off-chain linkage (IPFS, Arweave)

---

## 🧰 For Developers

```bash
# Clone the repo
git clone https://github.com/nick/cannes-veris.git

# Install dependencies
cd backend/
npm install

# Start dev server
npm run dev

# Run local subgraph (optional)
yarn graph deploy ...
