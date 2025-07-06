# 🥲 Trading Tears MiniApp — Deport The Dip

This is the **Telegram MiniApp frontend** for the **Deport The Dip** trading game.

It allows users to:

- Connect their wallet via **Privy**
- Execute swaps via **PancakeSwap**
- View the leaderboard and follow other traders
- Sign transactions directly in the MiniApp (non-delegated flow)

---

## ⚡️ Quick Start

Install dependencies:

```bash
npm install
# or
bun install
```

Run the development server:

```
npm run dev
# or
bun dev
```

Visit

```
http://localhost:3000
```

## 🔁 gRPC Codegen

Before starting, make sure to generate the gRPC TypeScript bindings:

```bash
npm run generate:grpc
```

This compiles protobufs from `proto/` into `src/generated/`.

## 📦 Tech Stack

- Next.js App Router
- Tailwind CSS
- Privy for authentication and wallets
- gRPC-Web for backend communication
- Telegram MiniApp + deep linking
- The Graph for onchain leaderboard stats

## 🪄 Features

- 🧠 Connect wallet with Privy
- 🔄 Build & sign swaps (on-chain via Pancake)
- 📊 Leaderboard UI with follow button
- 🌐 API routes to call gRPC server for tx build/send
- 🖼 Fully embeddable as Telegram MiniApp

Built with 🧠 + 🥲 for ETH Cannes 2025.
