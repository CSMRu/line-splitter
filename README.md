# Line Splitter (v1.21)

A modern, highly responsive web application designed to instantly split large text files into manageable blocks based on a configurable line count. It features a real-time reactive interface, dark/light theme support, and advanced text navigation.

## 🚀 Key Features

### 📄 Text Processing & Splitting
- **Real-time Splitting**: Text is split into blocks immediately as you type or paste, based on the set line count.
- **Flexible Block Size**: Easily adjust the number of lines per block using the "lines per block" option (Default: 80).
- **File Upload Support**: Load `.txt` files instantly via drag-and-drop or the upload button.
- **Memory Optimized**: Engineered to maintain stable performance even when processing large volumes of text.
- **Batch Rendering**: Prevents UI freezing when processing very large files by rendering results in manageable batches.
- **Input Lock Protection**:
    - **Secure Editing**: Lock the input panel to prevent accidental edits while browsing or copying results.
    - **Visual Indicators**: Clear green (locked) and yellow (unlocked) status indicators.
    - **Note**: File uploads are allowed even in locked mode for convenience.

### 🖥️ User Interface (UI)
- **Dual Panel Layout**:
    - **Input**: A powerful text editor with synchronized line numbers and zebra striping.
    - **Output**: A scrollable list providing a clear overview of all generated text blocks (displays total blocks + remainder lines).
- **Customizable Themes & Layouts**:
    - **Dark/Light Mode**: Toggle between themes based on your preference; settings are persisted via browser storage.
    - **Layout Flexibility**:
        - **Horizontal Scrolling**: Blocks automatically enable horizontal scrolling for extremely long lines (e.g., code snippets or logs) without breaking the card layout.
        - **Panel Swap**: Interchange the positions of the input and output panels for a personalized workflow.
    - **Expanded View**: Expand the output panel to full screen for a more focused workspace.
- **Readability & Precision**: High-precision rendering ensures line numbers and zebra stripes stay perfectly aligned with the text, even when changing font sizes.

### ⚡ Smart Navigation & Convenience
- **Interactive Sync (Scroll Sync)**:
    - Click any line number in the output panel to instantly scroll the input editor to that exact line and select it.
    - Click line numbers in the input panel to quickly select specific lines.
- **Block Controls**:
    - **Jump to Top/Bottom**: Quick-access buttons to scroll to the start or end of any specific block.
    - **One-Click Copy**: Copy blocks to your clipboard with a visual badge notification; the block automatically scrolls to the end upon copying to confirm the selection.
    - **Individual Downloads**: Export each block as a separate `.txt` file.
- **Font Size Control**: Increase or decrease text size in real-time using `A+` and `A-` buttons for enhanced readability.

## 🛠 Tech Stack
- **Core**: HTML5, Vanilla JavaScript, CSS3
- **Design**: CSS Variables (Dynamic Theming), Flexbox/Grid Layout
- **Zero Dependencies**: Built entirely with native browser APIs for maximum performance and security.

## 📖 How to Use
1. **Input**: Type text directly into the left panel or upload a file.
2. **Configure**: Enter your desired **lines per block** value.
3. **Review**: Check the output panel for the real-time generated blocks.
4. **Interact**:
    - Use the top menu to adjust themes, layouts, font sizes, and input lock state.
    - Use block-specific buttons to copy or download.
    - Click line numbers in the output to jump to the corresponding location in the input source.
