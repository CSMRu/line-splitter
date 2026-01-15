document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const dropZone = document.getElementById('drop-zone');
    const textInput = document.getElementById('text-input');
    const linesInput = document.getElementById('lines-per-block');
    const blocksContainer = document.getElementById('blocks-container');
    const resultCount = document.getElementById('result-count');
    const inputLineCount = document.getElementById('input-line-count');
    const toast = document.getElementById('toast');
    const fileUpload = document.getElementById('file-upload');
    const uploadTriggerBtn = document.getElementById('upload-trigger-btn');
    const inputScrollTopBtn = document.getElementById('input-scroll-top');
    const inputScrollBottomBtn = document.getElementById('input-scroll-bottom');
    const lineNumbers = document.getElementById('line-numbers');
    const layoutToggleBtn = document.getElementById('layout-toggle-btn');
    const splitView = document.querySelector('.split-view');
    const fontDecreaseBtn = document.getElementById('font-decrease');
    const fontIncreaseBtn = document.getElementById('font-increase');

    const fontSizeLabel = document.getElementById('font-size-label');
    const lockToggleBtn = document.getElementById('lock-toggle-btn');
    const downloadAllZipBtn = document.getElementById('download-all-zip-btn');

    // State
    let currentBlocks = [];
    let debounceTimer;
    let currentFontSize = parseInt(localStorage.getItem('fontSize')) || 12;
    let isLocked = true; // Default locked state
    let currentRenderJobId = 0; // To track active render batch jobs

    // Fix zebra striping alignment by measuring actual rendered line-height
    const setActualLineHeight = () => {
        // Create a temporary element to measure the actual rendered line height
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = `
            position: absolute;
            visibility: hidden;
            font-family: monospace;
            font-size: ${currentFontSize}pt;
            line-height: 1.6;
            white-space: pre;
        `;
        tempDiv.textContent = 'X\nX';
        document.body.appendChild(tempDiv);

        // Use getBoundingClientRect for precise sub-pixel measurement
        const rect = tempDiv.getBoundingClientRect();
        const height = rect.height;
        document.body.removeChild(tempDiv);

        // Calculate single line height
        const actualLineHeight = height / 2;

        // Set as CSS variable on root so all components can use it
        document.documentElement.style.setProperty('--actual-line-height', `${actualLineHeight}px`);
        document.documentElement.style.setProperty('--editor-font-size', `${currentFontSize}pt`);

        if (fontSizeLabel) {
            fontSizeLabel.textContent = `${currentFontSize}pt`;
        }

        console.log(`Font size: ${currentFontSize}pt, Line-height: ${actualLineHeight}px`);
    };

    setActualLineHeight();

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'dark';

    // Apply saved theme on load
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
    });

    // Layout Toggle
    layoutToggleBtn.addEventListener('click', () => {
        splitView.classList.toggle('expanded');
    });

    // Panel Swap Toggle
    const swapPanelsBtn = document.getElementById('swap-panels-btn');
    const savedLayout = localStorage.getItem('layout') || 'normal';

    // Apply saved layout
    if (savedLayout === 'swapped') {
        splitView.classList.add('swapped');
    }

    swapPanelsBtn.addEventListener('click', () => {
        splitView.classList.toggle('swapped');
        const currentLayout = splitView.classList.contains('swapped') ? 'swapped' : 'normal';
        localStorage.setItem('layout', currentLayout);
    });

    // Font Size Controls
    const updateFontSize = (newSize) => {
        if (newSize < 9 || newSize > 15) return;
        currentFontSize = newSize;
        localStorage.setItem('fontSize', currentFontSize);
        setActualLineHeight();
        // Since line height changed, we might need to refresh results if they depend on it
        // (Though CSS variables handle the background-size)
    };

    if (fontDecreaseBtn) {
        fontDecreaseBtn.addEventListener('click', () => {
            updateFontSize(currentFontSize - 1);
        });
    }

    if (fontIncreaseBtn) {
        fontIncreaseBtn.addEventListener('click', () => {
            updateFontSize(currentFontSize + 1);
        });
    }

    // Lock Toggle Logic
    const updateLockState = () => {
        if (isLocked) {
            textInput.setAttribute('readonly', 'true');
            lockToggleBtn.classList.remove('unlocked');
            lockToggleBtn.classList.add('locked');
            lockToggleBtn.title = 'Unlock Input';
            // Show Closed Lock Icon
            lockToggleBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
            `;
        } else {
            textInput.removeAttribute('readonly');
            lockToggleBtn.classList.remove('locked');
            lockToggleBtn.classList.add('unlocked');
            lockToggleBtn.title = 'Lock Input';
            // Show Open Lock Icon
            lockToggleBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
            `;
            textInput.focus();
        }
    };

    if (lockToggleBtn) {
        lockToggleBtn.addEventListener('click', () => {
            isLocked = !isLocked;
            updateLockState();
        });

        // Initialize state
        updateLockState();
    }

    // Line Numbers & Scroll Sync
    const updateLineNumbers = () => {
        const text = textInput.value;
        // Optimized Line Counting (Scanning for \n is much faster than splitting string)
        let numberOfLines = 1;
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '\n') numberOfLines++;
        }

        const currentLines = lineNumbers.children.length;

        if (numberOfLines !== currentLines) {
            // Rebuild if count changes (basic approach for correctness)
            // For extreme performance optimization on 10k+ lines, virtual scrolling would be needed,
            // but for typical usage, this string build is fast enough.
            const linesArr = new Array(numberOfLines).fill(0).map((_, i) => i + 1);
            lineNumbers.innerText = linesArr.join('\n');
        }

        if (inputLineCount) {
            inputLineCount.textContent = `${numberOfLines} ${numberOfLines <= 1 ? 'line' : 'lines'}`;
        }
    };

    textInput.addEventListener('scroll', () => {
        lineNumbers.scrollTop = textInput.scrollTop;
    });

    // Initial Line Numbers
    updateLineNumbers();

    // Line Number Click to Select Line (VSCode-style)
    lineNumbers.addEventListener('click', (e) => {
        const rect = lineNumbers.getBoundingClientRect();
        const clickY = e.clientY - rect.top + lineNumbers.scrollTop; // Account for scroll
        const lineHeight = parseFloat(getComputedStyle(lineNumbers).lineHeight);
        const paddingTop = parseFloat(getComputedStyle(lineNumbers).paddingTop);

        // Calculate which line was clicked (1-indexed)
        const lineIndex = Math.floor((clickY - paddingTop) / lineHeight);

        const lines = textInput.value.split(/\r?\n/);
        if (lineIndex >= 0 && lineIndex < lines.length) {
            // Calculate character positions for this line
            let startPos = 0;
            for (let i = 0; i < lineIndex; i++) {
                startPos += lines[i].length + 1; // +1 for newline
            }
            const endPos = startPos + lines[lineIndex].length;

            // Select the line
            textInput.focus({ preventScroll: true });
            textInput.setSelectionRange(startPos, endPos);
        }
    });

    // Input Scroll Handlers
    // Using direct function assignment or verifying existence to ensure no duplicates/failures
    if (inputScrollTopBtn) {
        inputScrollTopBtn.onclick = () => {
            // Scroll textarea
            textInput.scrollTop = 0;
            // Also sync line numbers immediately manual override just in case
            if (lineNumbers) lineNumbers.scrollTop = 0;
        };
    }

    if (inputScrollBottomBtn) {
        inputScrollBottomBtn.onclick = () => {
            // Scroll to huge number to ensure bottom
            textInput.scrollTop = textInput.scrollHeight;
            if (lineNumbers) lineNumbers.scrollTop = lineNumbers.scrollHeight;
        };
    }

    // File Upload Button Handler
    uploadTriggerBtn.addEventListener('click', () => {
        fileUpload.click();
    });

    fileUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
            fileUpload.value = '';
        }
    });

    // Drag & Drop Handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-active');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-active');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-active');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith('text/') && !file.name.endsWith('.txt')) {
            showToast('Please upload a text file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            textInput.value = e.target.result;
            // File upload populates strictly via JS, so readonly doesn't block it.
            // We can keep it locked or unlock it. User didn't specify auto-unlock, so we keep state.

            // Force top position
            textInput.scrollTop = 0;
            textInput.setSelectionRange(0, 0);
            if (lineNumbers) lineNumbers.scrollTop = 0;

            updateLineNumbers(); // Update lines immediately
            triggerSplit();
        };
        reader.readAsText(file);
    }

    // Real-time Listeners
    textInput.addEventListener('input', () => {
        updateLineNumbers(); // Update on typing
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(triggerSplit, 300);
    });



    linesInput.addEventListener('input', triggerSplit);

    if (downloadAllZipBtn) {
        downloadAllZipBtn.addEventListener('click', () => {
            downloadAllAsZip();
        });
    }

    async function downloadAllAsZip() {
        if (currentBlocks.length === 0) return;

        try {
            const zip = new JSZip();
            currentBlocks.forEach(block => {
                zip.file(getBlockFilename(block.id), '\uFEFF' + block.content);
            });

            const now = new Date();
            const year = String(now.getFullYear()).slice(-2);
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const timestamp = `${year}${month}${day}-${hours}${minutes}`;

            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `split_blocks_${timestamp}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('ZIP download started!');
        } catch (err) {
            console.error('ZIP Error:', err);
            showToast('Failed to create ZIP.');
        }
    }

    function triggerSplit() {
        const text = textInput.value;
        const linesPerBlock = parseInt(linesInput.value, 10);

        if (!text.trim()) {
            renderEmptyState();
            return;
        }

        if (isNaN(linesPerBlock) || linesPerBlock < 1) {
            renderEmptyState();
            return;
        }

        processSplit(text, linesPerBlock);
    }

    function processSplit(text, blockSize) {
        const lines = text.split(/\r?\n/);
        currentBlocks = [];

        for (let i = 0; i < lines.length; i += blockSize) {
            const block = lines.slice(i, i + blockSize).join('\n');
            currentBlocks.push({
                id: i / blockSize + 1,
                content: block,
                lineStart: i + 1,
                lineEnd: Math.min(i + blockSize, lines.length)
            });
        }

        renderResults(lines.length, blockSize);
    }

    function renderEmptyState() {
        blocksContainer.innerHTML = `
            <div class="empty-state">
                Start typing or upload a file to see results...
            </div>
        `;
        resultCount.textContent = '0 block';
        currentBlocks = [];
        if (downloadAllZipBtn) downloadAllZipBtn.disabled = true;
    }
    function renderResults(totalLines, blockSize) {
        blocksContainer.innerHTML = '';

        let countText = `${currentBlocks.length} ${currentBlocks.length <= 1 ? 'block' : 'blocks'}`;

        if (totalLines && blockSize) {
            const fullBlocks = Math.floor(totalLines / blockSize);
            const remainder = totalLines % blockSize;

            if (remainder > 0) {
                countText = `${fullBlocks} ${fullBlocks <= 1 ? 'block' : 'blocks'} + ${remainder} ${remainder <= 1 ? 'line' : 'lines'}`;
            } else {
                countText = `${fullBlocks} ${fullBlocks <= 1 ? 'block' : 'blocks'}`;
            }
        }

        if (resultCount) {
            resultCount.textContent = countText;
        }

        if (downloadAllZipBtn) {
            downloadAllZipBtn.disabled = currentBlocks.length === 0;
        }

        if (currentBlocks.length === 0) {
            renderEmptyState();
            return;
        }

        // Batch Rendering Logic
        let renderedCount = 0;
        const BATCH_SIZE = 20;

        // Render batches using requestAnimationFrame to avoid blocking the main thread.
        // The 'myJobId' closure ensures that if a new render starts (incrementing currentRenderJobId),
        // this old loop terminates early, preventing race conditions.
        const myJobId = ++currentRenderJobId;

        function renderBatch() {
            const fragment = document.createDocumentFragment();
            const end = Math.min(renderedCount + BATCH_SIZE, currentBlocks.length);

            for (let i = renderedCount; i < end; i++) {
                const block = currentBlocks[i];
                const index = i;
                const card = document.createElement('div');
                card.className = 'block-card';

                card.innerHTML = `
                    <div class="block-header">
                        <span>Block ${block.id}</span>
                        <div class="block-actions">
                            <button class="btn-icon" onclick="scrollToBlockTop(${index})" title="Go to Start">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                                </svg>
                            </button>
                            <button class="btn-icon" onclick="scrollToBlockBottom(${index})" title="Go to End">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>
                            <div style="width: 1px; height: 20px; background: var(--border-color); margin: 0 0.5rem;"></div>
                            <button class="btn-icon" onclick="copyBlock(${index}, this)" title="Copy to Clipboard">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                                </svg>
                            </button>
                            <button class="btn-icon" onclick="downloadBlock(${index}, this)" title="Download .txt">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div id="block-scroll-container-${index}" class="block-body" title="Click to scroll">
                        <div class="block-flex-wrapper">
                            <div class="block-line-numbers">${generateLineNumbers(block.lineStart, block.lineEnd)}</div>
                            <div class="block-content">${escapeHtml(block.content)}</div>
                        </div>
                    </div>
                `;

                // Interaction Logic
                const contentEl = card.querySelector('.block-body');
                contentEl.addEventListener('click', (e) => {
                    if (!e.target.closest('.block-line-numbers')) {
                        contentEl.classList.add('highlight-active');
                    }
                });
                contentEl.addEventListener('mouseleave', () => {
                    contentEl.classList.remove('highlight-active');
                });

                const lineNumbersEl = card.querySelector('.block-line-numbers');
                lineNumbersEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const rect = lineNumbersEl.getBoundingClientRect();
                    const clickY = e.clientY - rect.top;
                    const lineHeight = parseFloat(getComputedStyle(lineNumbersEl).lineHeight);
                    const paddingTop = parseFloat(getComputedStyle(lineNumbersEl).paddingTop);
                    const lineIndexInBlock = Math.max(0, Math.floor((clickY - paddingTop) / lineHeight));
                    const targetLine = block.lineStart + lineIndexInBlock;

                    if (targetLine >= block.lineStart && targetLine <= block.lineEnd) {
                        scrollToInputLine(targetLine);
                    }
                });

                fragment.appendChild(card);
            }

            blocksContainer.appendChild(fragment);
            renderedCount += BATCH_SIZE;

            if (renderedCount < currentBlocks.length) {
                requestAnimationFrame(renderBatch);
            }
        }

        renderBatch();
    }

    // Utilities - Global
    window.scrollToBlockTop = (index) => {
        const el = document.getElementById(`block-scroll-container-${index}`);
        if (el) el.scrollTop = 0;
    };

    window.scrollToBlockBottom = (index) => {
        const el = document.getElementById(`block-scroll-container-${index}`);
        if (el) el.scrollTop = el.scrollHeight;
    };

    function scrollToInputLine(lineNumber) {
        // Ensure lineNumber is valid
        if (lineNumber < 1) return;

        // Get actual line height from CSS variable (or re-calculate if missing)
        const styles = getComputedStyle(document.documentElement);
        const actualLineHeight = parseFloat(styles.getPropertyValue('--actual-line-height')) || 24; // Fallback

        // Calculate scroll position (0-indexed logic for scroll)
        // Calculate scroll position (0-indexed logic for scroll)
        // We need to account for the top padding of the textarea so the line appears at the true visual top
        const computedStyle = getComputedStyle(textInput);
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;

        // Target position: (LineIndex * Height) + PaddingOffset
        // If we simply set scrollTop to (LineIndex * Height), the first line (LineIndex 0) is at 0.
        // But physically, it's rendered at Y=paddingTop.
        // Wait, scrollTop moves the view.
        // If scrollTop = 0, we see [Padding][Line1]...
        // To put Line 2 at the top of the *viewport* (hiding Line 1 and Padding):
        // scrollTop needs to be Padding + LineHeight.

        // Correct Logic:
        // To show Line N at top:
        // scrollTop = (N - 1) * actualLineHeight + paddingTop;
        // Example: Line 1. N=1. scrollTop = 0 + 24 = 24.
        // This scrolls past the 24px padding. AND the 0px of previous lines.
        // Result: Line 1 appears at very top.
        // Wait, if scrollTop = 24, and content starts at 24 (padding).
        // Then we scroll past the padding. So Line 1 is cleanly at top.
        // What if N=1?
        // If the user clicks Line 1, they usually expect to see it at the top.
        // But for Line 1, it's safer to show padding?
        // Actually, users usually prefer to keep the top padding visible for Line 1.

        let targetScrollTop;
        if (lineNumber === 1) {
            targetScrollTop = 0;
        } else {
            targetScrollTop = ((lineNumber - 1) * actualLineHeight) + paddingTop;
        }

        // Scroll the input
        textInput.scrollTop = targetScrollTop;

        // Also sync the main line numbers (though scroll listener handles it, explicit sync is safe)
        if (lineNumbers) lineNumbers.scrollTop = targetScrollTop;

        // Optional: formatting to highlight? For now just scroll.
    }

    window.copyBlock = async (index, btn) => {
        const text = currentBlocks[index].content;
        try {
            await navigator.clipboard.writeText(text);
            showToast('Copied to clipboard!');

            // Add highlight (Unique)
            document.querySelectorAll('.block-card').forEach(c => c.classList.remove('highlighted'));
            const card = btn.closest('.block-card');
            if (card) {
                card.classList.add('highlighted');
            }

            // Auto-scroll to bottom
            window.scrollToBlockBottom(index);

            // Handle Badge
            let badge = btn.querySelector('.notification-badge');
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'notification-badge';
                badge.textContent = '1';
                btn.appendChild(badge);
            } else {
                let count = parseInt(badge.textContent, 10);
                badge.textContent = count + 1;
                // Re-trigger animation
                badge.style.animation = 'none';
                badge.offsetHeight; /* trigger reflow */
                badge.style.animation = 'popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            }
        } catch (err) {
            showToast('Failed to copy.');
        }
    };

    window.downloadBlock = (index, btn) => {
        const block = currentBlocks[index];

        // Add highlight (Unique)
        document.querySelectorAll('.block-card').forEach(c => c.classList.remove('highlighted'));
        const card = btn.closest('.block-card');
        if (card) {
            card.classList.add('highlighted');
        }

        const blob = new Blob(['\uFEFF' + block.content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = getBlockFilename(block.id);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    function getBlockFilename(id) {
        if (id < 1000) {
            return `block_${String(id).padStart(3, '0')}.txt`;
        } else {
            const thousands = Math.floor(id / 1000);
            const remainder = String(id % 1000).padStart(3, '0');
            return `block${thousands}_${remainder}.txt`;
        }
    }

    function generateLineNumbers(start, end) {
        let lines = '';
        for (let i = start; i <= end; i++) {
            lines += i + '\n';
        }
        return lines.trimEnd(); // Remove trailing newline
    }

    function escapeHtml(text) {
        if (!text) return text;
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 2000);
    }
});
