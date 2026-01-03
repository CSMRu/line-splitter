# Line Splitter

A modern, responsive web application designed to split large text files into smaller, manageable chunks based on line count. It features a real-time reactive interface, dark/light mode, and advanced text navigation.

## Key Features

### 📄 Text Processing
-   **Real-time Splitting**: Instantly splits text as you type or paste.
-   **Configurable Chunk Size**: Adjust the "Lines per chunk" setting to dynamically regroup your text.
-   **File Support**: Drag & drop text files or use the upload button to load content immediately.
-   **Precise Split**: Standardizes output with LF line endings.

### 🖥️ User Interface
-   **Dual Panel Layout**:
    -   **Input Source**: Full-featured text editor with synchronized line numbers.
    -   **Results Panel**: Scrollable list of generated text chunks.
-   **Dark/Light Theme**: Toggle between themes with automatic preference saving (localStorage).
-   **Responsive Design**: Optimized for desktop workflows with a clean, distraction-free aesthetic.

### ⚡ Interactive Navigation
-   **Click-to-Scroll**: Click any line number in a split result to instantly scroll the main editor to that exact line.
-   **Chunk Controls**:
    -   **Top/Bottom**: Quickly jump to the start or end of a specific chunk.
    -   **Copy**: One-click copy to clipboard with a visual counter badge.
    -   **Download**: Export individual chunks as `.txt` files (UTF-8).
-   **Zebra Striping**: Visual line guides that align perfectly with text for better readability.

## Technologies
-   **Core**: HTML5, Vanilla JavaScript, CSS3.
-   **Styling**: Custom CSS variables for theming, Flexbox/Grid for layout.
-   **No Dependencies**: Pure browser-native implementation for maximum performance.

## Usage
1.  **Open**: Launch `index.html` in any modern web browser.
2.  **Input**: Type text, paste content, or drop a `.txt` file into the left panel.
3.  **Configure**: Set your desired **Lines per chunk** (default: 80).
4.  **Interact**:
    -   Click the **Theme Icon** to switch modes.
    -   Use the **Arrow Icons** on chunks to navigate text.
    -   Click **Copy** or **Download** on any result block to save it.
