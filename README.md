# 🪶 Lekh

**Lekh** (लेख) — *Sanskrit for "writing"*

A modern, beautiful, and blazing-fast markdown editor built for every platform.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Android-brightgreen)
![Built With](https://img.shields.io/badge/built%20with-Tauri%20v2-orange)

---

## ✨ Features

- 📝 **Full Markdown Support** — CommonMark + GitHub Flavored Markdown (GFM)
- 🎨 **Syntax Highlighting** — 100+ programming languages via CodeMirror 6
- ➗ **Math Equations** — KaTeX-powered LaTeX rendering (inline & block)
- 📊 **Mermaid Diagrams** — Flowcharts, sequence diagrams, and more
- 🌙 **Dark / Light / System Themes** — Beautiful, eye-friendly design
- ⌨️ **Keyboard-First** — Comprehensive shortcuts for everything
- 📁 **File Management** — Multi-tab editing with unsaved change indicators
- 🔍 **Command Palette** — Fuzzy search for instant access to all commands
- 🖥️ **Split View** — Editor + live preview side-by-side with draggable divider
- 🧘 **Zen Mode** — Distraction-free writing, hide all chrome
- 💾 **Auto-Save** — Configurable automatic saving
- 📤 **Export to HTML** — One-click export with embedded styles
- 🖱️ **Drag & Drop** — Drop `.md` files directly into the editor
- 🎯 **Document Outline** — Navigate headings with a click
- ⚙️ **Highly Configurable** — Font, theme, tab size, word wrap, and more

## 🖥️ Screenshots

*Coming soon*

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | [Tauri v2](https://v2.tauri.app/) (Rust backend) |
| **Frontend** | React 19 + TypeScript |
| **Bundler** | Vite 7 |
| **Editor** | CodeMirror 6 |
| **Markdown** | unified / remark / rehype pipeline |
| **Math** | KaTeX |
| **Diagrams** | Mermaid |
| **State** | Zustand |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+P` | Command Palette |
| `Ctrl+S` | Save File |
| `Ctrl+O` | Open File |
| `Ctrl+N` | New Tab |
| `Ctrl+W` | Close Tab |
| `Ctrl+B` | Toggle Sidebar |
| `Ctrl+,` | Open Settings |
| `Ctrl+1` / `2` / `3` | Editor / Split / Preview |
| `Ctrl+Shift+E` | Toggle Zen Mode |
| `Alt+Z` | Toggle Word Wrap |
| `Ctrl+=` / `Ctrl+-` | Increase / Decrease Font Size |
| `Escape` | Close overlay / Exit Zen Mode |

## 📦 Installation

### Pre-built Binaries

Download the latest release for your platform from the [Releases](https://github.com/dcryptoniun/lekh/releases) page.

### Build from Source

**Prerequisites:**
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/) (latest stable)
- [Tauri v2 Prerequisites](https://v2.tauri.app/start/prerequisites/)

```bash
# Clone the repository
git clone https://github.com/dcryptoniun/lekh.git
cd lekh

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

### Android Build

```bash
# Initialize Android target
npm run tauri android init

# Run on connected device/emulator
npm run tauri android dev

# Build APK
npm run tauri android build
```

## ⚠️ Platform Support

Lekh is designed to run on **Windows, macOS, Linux, and Android**.

> **Note:** This project has been primarily developed and tested on **Windows**. While it is architected for cross-platform compatibility, **it has not been tested on all platforms**. If you encounter issues on macOS, Linux, or Android, please [open an issue](https://github.com/dcryptoniun/lekh/issues) — contributions and bug reports from all platforms are very welcome!

| Platform | Status |
|----------|--------|
| Windows | ✅ Tested |
| macOS | ⚠️ Untested |
| Linux | ⚠️ Untested |
| Android | ⚠️ Untested |

## 🤖 Vibe Coded

This project was **vibe coded** — built through natural language conversations with AI, iterating on ideas, debugging in real-time, and shipping fast. The entire codebase, from architecture to pixel-perfect UI, was crafted through this collaborative human-AI workflow.

Vibe coding is about trusting the flow: describe what you want, refine what you get, and ship something beautiful.

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [Tauri](https://tauri.app/) — For making cross-platform apps lightweight and secure
- [CodeMirror](https://codemirror.net/) — For the incredible editor framework
- [unified](https://unifiedjs.com/) — For the powerful markdown processing ecosystem
- [KaTeX](https://katex.org/) — For beautiful math rendering
- [Mermaid](https://mermaid.js.org/) — For diagram support

---

<p align="center">
  <b>Lekh</b> (लेख) — Write beautifully, everywhere.<br>
  Made with ❤️ by <a href="https://github.com/dcryptoniun">Mayank Meena</a>
</p>
