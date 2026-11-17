# Poly for VS Code ⚡

[![CI](https://github.com/RitualDev-Lab/vscode-poly/actions/workflows/ci.yml/badge.svg)](https://github.com/RitualDev-Lab/vscode-poly/actions)
[![Visual Studio Marketplace Version](https://img.shields.io/badge/VS%20Code-v0.1.0-blue.svg)](https://marketplace.visualstudio.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Powered by Poly](https://img.shields.io/badge/CLI-Poly%20v0.4.0-38bdf8.svg)](https://github.com/RitualDev-Lab/poly)

The official **Visual Studio Code extension** for **[Poly](https://github.com/RitualDev-Lab/poly)** — The Universal Polyglot CLI Package & Dependency Orchestrator for Node.js, Python, Rust, and Go.

---

## Features

- **Activity Bar Poly Explorer**:
  - **Workspace Members & Dependencies Tree**: Inspect monorepo components across all ecosystems with real-time dependency status and versions.
  - **System Health & Toolchains View**: Live diagnosis of Node, Python, Astral uv, Rust, Go, native C/C++ compilers, and registry latencies.
- **PURL Dependency Installer**: Add dependencies with shorthand prefixes (`npm:zod`, `pypi:fastapi`, `cargo:tokio`, `go:github.com/gin-gonic/gin`) from the command palette or sidebar.
- **Interactive Terminal Integration**: Execute `poly install`, `poly audit`, `poly fix`, `poly doctor`, and `poly docker` inside a dedicated, colorized Poly terminal.
- **Manifest Hover Provider**: Hover over package names in `package.json`, `pyproject.toml`, `Cargo.toml`, or `go.mod` to see resolved versions, licenses, and `poly.lock` verification status.
- **Status Bar Health Monitor**: One-click status indicator showing workspace determinism, drift status, and quick links to run diagnostics.

---

## Commands Contributed

| Command | Title | Description |
| :--- | :--- | :--- |
| `poly.addDependency` | **Poly: Add Dependency (PURL)** | Add a package using universal shorthand syntax |
| `poly.install` | **Poly: Install & Sync Dependencies** | Reconcile dependencies across all monorepo members |
| `poly.audit` | **Poly: Audit Security Vulnerabilities** | Scan workspace against OSV database |
| `poly.fix` | **Poly: Auto-Heal Vulnerabilities** | Auto-patch manifests and regenerate `poly.lock` |
| `poly.doctor` | **Poly: Run System Diagnostics** | Comprehensive toolchain, compiler, and network audit |
| `poly.docker` | **Poly: Generate Multi-Stage Dockerfile** | Generate multi-stage Docker & DevContainer files |
| `poly.verifyLock` | **Poly: Verify poly.lock Cryptographic Integrity** | Verify SHA-256 composite lockfile determinism |
| `poly.refresh` | **Poly: Refresh Workspace** | Re-scan workspace members and health report |

---

## Extension Settings

This extension contributes the following settings:

* `poly.executablePath`: Path to the `poly` CLI binary (defaults to `poly`).
* `poly.enableHover`: Enable rich dependency metadata on hover in manifest files (defaults to `true`).
* `poly.autoCheckDrift`: Automatically verify lockfile cryptographic integrity when manifests change (defaults to `true`).

---

## Requirements

Ensure that `@ritualdev-lab/poly` is installed globally:

```bash
npm install -g @ritualdev-lab/poly
```

---

## Related Repositories

- **Core CLI**: [RitualDev-Lab/poly](https://github.com/RitualDev-Lab/poly)
- **Official GitHub Action**: [RitualDev-Lab/setup-poly](https://github.com/RitualDev-Lab/setup-poly)
- **Web Platform & Docs**: [RitualDev-Lab/poly-web](https://github.com/RitualDev-Lab/poly-web)

---

## License

MIT © [RitualDev Lab](https://ritualdev.in)

---

---

## 💖 Sponsor & Support

If you find this project valuable, consider supporting our open-source development:

[![Sponsor on Dodo Payments](https://img.shields.io/badge/Sponsor_via_Dodo-Payments-8b5cf6?style=for-the-badge&logo=shield&logoColor=white)](https://checkout.dodopayments.com/buy/pdt_0NpjONGugY5QkrFDUaPva)
[![Interactive Donation Portal](https://img.shields.io/badge/Donation_Portal-Cards%20%7C%20UPI%20%7C%20Apple%20Pay-ff5964?style=for-the-badge&logo=heart&logoColor=white)](https://ritualdev.in/donate)
[![GitHub Sponsors](https://img.shields.io/badge/GitHub_Sponsors-RitualDev--Lab-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/RitualDev-Lab)

- [**⚡ 1-Click Dodo Payments Checkout**](https://checkout.dodopayments.com/buy/pdt_0NpjONGugY5QkrFDUaPva)
- [**🎁 Interactive Donation Portal**](https://ritualdev.in/donate)
- [**❤️ GitHub Sponsors**](https://github.com/sponsors/RitualDev-Lab)

---

## 🛡️ Community & Governance
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [Accessibility Statement](ACCESSIBILITY.md)
- [License](LICENSE)
