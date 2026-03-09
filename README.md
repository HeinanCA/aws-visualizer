# 🌌 AWS Visualizer

**The next-generation AWS infrastructure dashboard. Beautiful, real-time, and built with a VisionOS-inspired spatial design language.**

*Stop looking at spreadsheets. Start browsing your cloud as a liquid, interactive map.*

[![Star on GitHub](https://img.shields.io/github/stars/HeinanCA/aws-visualizer?style=social)](https://github.com/HeinanCA/aws-visualizer/stargazers)
[![License](https://img.shields.io/github/license/HeinanCA/aws-visualizer?color=blue)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[**☕ Buy me a coffee**](https://coff.ee/heinanca)

---

## ✨ Features

- **Spatial Architecture** – Deep glassmorphism, ambient glows, and liquid spring physics inspired by the next generation of iOS.
- **Real-Time Discovery** – Fastify-powered backend with 21+ concurrent AWS scanners. Watch your graph build live via WebSockets.
- **App-Style Interactions** – Complex resource groups (like 50+ Security Groups) automatically collapse into elegant iOS-style folders.
- **Traffic Flow Visualization** – Moving "trailing comet" particles show directionality and relationships without the clutter of static arrows.
- **VPC Drill-Down** – High-level multi-VPC overview with surgical drill-down into subnets, instances, and messaging components.
- **Zero Configuration** – Just your AWS credentials and one command to launch.

---

## 🔍 Architecture

```
┌────────────────────────┐      WebSocket      ┌─────────────────────────┐
│   React 19 Frontend    │◀───────────────────▶│    Fastify 5 Server     │
│ (React Flow + Physics) │   (Real-time Scan)  │  (Node.js + TypeScript)  │
└────────────────────────┘                     └────────────┬────────────┘
            ▲                                               │
            │ Shared Types & Schemas                        │ SDK v3
            └───────────────────────────────────────────────┘
                                    │
                         ┌──────────┴──────────┐
                         │   Your AWS Account  │
                         │ (21+ Resource Types)│
                         └─────────────────────┘
```

---

## 🚀 Quick Start

```bash
# 1) Clone the repository
git clone https://github.com/HeinanCA/aws-visualizer.git
cd aws-visualizer

# 2) Install dependencies
npm install

# 3) Set up your AWS credentials
export AWS_ACCESS_KEY_ID=xxx
export AWS_SECRET_ACCESS_KEY=xxx
export AWS_REGION=us-east-1

# 4) Launch the spatial engine
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to see your cloud in a new light.

---

## 🤝 Contributing

We are building the future of cloud observability. Want to help?

1. **Fork** the repo and create your feature branch.
2. **Star** the project to help others find it.
3. **Contribute Code**: We love PRs that add new scanners, improve the layout engine, or polish the spatial materials.
4. **Report Bugs**: Open an issue if something doesn't look "premium" enough.

*Follow Conventional Commits for your messages (`feat:`, `fix:`, `refactor:`).*

---

## 📅 Roadmap

- [x] VisionOS Spatial Design Language
- [x] iOS-style Folder interactions
- [x] Real-time Traffic "Comet" animations
- [ ] **Phase 2**: Orphan resource detection (cost-saving mode)
- [ ] **Phase 3**: Compliance & Security posture heatmaps
- [ ] **Phase 4**: Export to "Auditor-Ready" PDF documentation

---

## ❤️ Support

If this tool helped you understand a complex VPC or saved you from a "Spaghetti Architecture" nightmare, consider supporting the development:

- **Star the repo** – It costs nothing and means everything.
- **Donate Code** – Help us reach 100% AWS resource coverage.
- **Fuel the Hacking**: [Buy me a coffee](https://coff.ee/heinanca) — thank you!

---

## 📝 License

MIT — see [LICENSE](LICENSE) for details. Built for engineers who care about quality.

---

Built with 💚 by **HTDevOps LTD** · [HT DevOps](https://htdevops.top)  
*Elevate your cloud visibility.*

Upgrade your shell-fu with [Mastering Bash Scripts](https://www.udemy.com/course/mastering-bash-scripts/?couponCode=08F7AB7FB06373BDB532) – 40% off
