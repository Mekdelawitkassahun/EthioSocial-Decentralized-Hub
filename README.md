 🚀 EthioSocial: A Decentralized Social Media Ecosystem for Ethiopia

EthioSocial is a cutting-edge, decentralized social media platform built specifically for the Ethiopian community. It leverages blockchain technology to return data ownership to users, enable direct creator monetization, and provide a censorship-resistant space for expression.

## 📋 Table of Contents
1. [Vision & Mission](#-vision--mission)
2. [Core Features](#-core-features)
3. [Technical Stack](#-technical-stack)
4. [Smart Contract Architecture](#-smart-contract-architecture)
5. [Frontend & UX Excellence](#-frontend--ux-excellence)
6. [Installation & Deployment](#-installation--deployment)
7. [Design System](#-design-system)

🌟 Vision & Mission
Traditional social media platforms are centralized entities that profit from user data and often apply opaque moderation policies. **EthioSocial** changes this by:
- **Ownership**: Every post, profile, and message is owned by the user's wallet.
- **Culture**: A UI inspired by Ethiopian heritage, supporting local languages and cultural identity.
- **Monetization**: Built-in ETH tipping allows creators to earn directly from their audience without intermediaries.

---
✨ Core Features

### 1. Decentralized Identity (Web3 Profiles)
Users create permanent identities on the Sepolia blockchain. Profiles include:
- **Custom Usernames**: Unique identifiers resolved via on-chain mappings.
- **Visual Identity**: High-resolution avatars and cover photos stored on IPFS.
- **On-Chain Bio**: A permanent, editable description of the user.

### 2. Rich Content Feed
- **Post Types**: Support for Text, Images, and Video.
- **Decentralized Storage**: Media is compressed client-side and pinned to IPFS, ensuring availability and fast loading.
- **Interactions**: Real-time Likes, Comments, and Tipping.

### 3. Social Graph
- **Follow System**: Build a network of connections directly on the blockchain.
- **Discovery**: A powerful search engine that resolves both `@usernames` and `0x...` wallet addresses.

### 4. Direct Messaging (DMs)
Secure, peer-to-peer private messaging.
- **Privacy**: Messages are stored in user-specific mappings on the contract.
- **Conversation Tracking**: Automatic tracking of active chats for a seamless messaging experience.

---

## 🛠 Technical Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Blockchain** | Solidity (^0.8.20) | Smart contract logic and state management. |
| **Network** | Sepolia Testnet | Scalable Ethereum testing environment. |
| **Frontend** | Next.js 14 | React framework for SEO and performance. |
| **Interaction** | Ethers.js (v5) | Bridging the UI with the Ethereum Virtual Machine (EVM). |
| **Storage** | IPFS (via Pinata) | Decentralized media hosting. |
| **Styling** | Tailwind CSS | Modern, utility-first responsive design. |
| **Animation** | Framer Motion | Smooth, "app-like" transitions and interactions. |

---

## 🏗 Smart Contract Architecture

The `EthioSocial.sol` contract is designed for security and efficiency:
- **OpenZeppelin Integration**: Uses `Ownable` for admin controls and `ReentrancyGuard` to prevent flash loan and recursive call attacks.
- **State Management**:
  - `mapping(address => Profile)`: Stores core user data.
  - `mapping(uint256 => Post)`: Centralized repository for all platform content.
  - `mapping(address => mapping(address => Message[]))`: Encrypted-ready private messaging structure.
- **Gas Optimization**: Uses `indexed` events for efficient frontend filtering and minimizes on-chain storage of non-critical metadata.

---

 🎨 Frontend & UX Excellence

 Client-Side Image Compression
To ensure the platform remains fast even with decentralized storage, we implemented a **Canvas-based compression engine**. Images are resized and optimized before being sent to IPFS, drastically reducing gas costs and upload times.

 The "Glitch-Free" Hook System
The custom `useEthioSocial` hook uses advanced React patterns (`useCallback`, `useMemo`, and `useEffect` synchronization) to ensure:
- No infinite re-render loops.
- Instant UI updates after blockchain confirmations.
- Automatic wallet disconnection and account switching.

 🚀 Installation & Deployment

 Local Development
1. **Clone & Install**:
   ```bash
   npm install
   cd frontend && npm install
   ```
2. **Environment Setup**: Create `frontend/.env.local` with:
   - `NEXT_PUBLIC_CONTRACT_ADDRESS`
   - `NEXT_PUBLIC_PINATA_JWT`
3. **Run**:
   ```bash
   npm run dev
   ```

### Production Deployment (Netlify)
The project includes a `netlify.toml` for one-click deployment.
- **Build Command**: `cd frontend && npm install && npm run build`
- **Publish Directory**: `frontend/.next`

---

## 🎨 Design System
- **Green**: `#078930` (Growth & Prosperity)
- **Yellow**: `#FCDD09` (Hope & Justice)
- **Red**: `#DA121A` (Sacrifice & Strength)
- **Typography**: Inter for global readability, Noto Sans Ethiopic for local support.

**Developed with precision for the future of the Ethiopian Web3 community.** 🇪🇹⛓️
