# Line Splitter
| <div align="center"> <a href="https://csmru.github.io/line-splitter/"><img src="favicon.svg" width="64"></a> <br> [![Version](https://img.shields.io/badge/Version-26.0126a-fbbf24)](https://github.com/csmru/line-splitter/commits) [![Hosted on GitHub Pages](https://img.shields.io/badge/GitHub-Pages-306d35?logo=github)](https://csmru.github.io/line-splitter/) </div> |
| :--- |

> A modern, highly responsive web application designed to instantly split large text files into manageable blocks.

## 🚀 Key Features

### Core Functionality
- **Instant Splitting**: Real-time block generation as you type or upload files (Drag & Drop supported).
- **Performance**: Validated for 200,000+ lines with batch rendering for a smooth UI.
- **Secure & Robust**: XSS protection and safe handling of large inputs.
- **Input Locking**: Prevent accidental edits with a toggleable read-only mode.
- **Bulk Download**: One-click **"Download All (ZIP)"** to save all generated blocks as individual `.txt` files in a single archive.

### 🖥️ User Interface & Navigation
- **Dual Panel Layout**: Input editor with line numbers (left) and scrollable block output (right).
- **Smart Navigation**:
    - **Scroll Sync**: Click line numbers in the output to jump to the exact line in the input.
    - **Block Actions**: Dedicated buttons to copy, download, or jump to the start/end of each block.
- **Adaptive UI**:
    - **Themes**: Persisted Dark/Light mode.
    - **Flexible Layout**: Swap panels, expand output, or adjust font size (`A+`/`A-`) for comfort.
    - **Stable Layout**: Optimized headers and consistent badge widths for a jitter-free experience.

## 🛠 Tech Stack
- **Core**: HTML5, Vanilla JavaScript, CSS3
- **Design**: CSS Variables, Flexbox/Grid
- **Philosophy**: Zero dependencies, native browser performance.

## 📖 How to Use
1. **Input**: Type text directly into the left panel or upload a file.
2. **Configure**: Enter your desired **lines per block** value.
3. **Review**: Check the output panel for the real-time generated blocks.
4. **Download All**: Use the ZIP icon in the output header to download all blocks at once.
5. **Interact**:
    - Use the top menu to adjust themes, layouts, font sizes, and input lock state.
    - Use block-specific buttons to copy or download individual blocks.
    - Click line numbers in the output to jump to the corresponding location in the input source.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
