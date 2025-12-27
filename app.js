document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const dropZone = document.getElementById('drop-zone');
    const textInput = document.getElementById('text-input');
    const linesInput = document.getElementById('lines-per-chunk');
    const chunksContainer = document.getElementById('chunks-container');
    const resultCount = document.getElementById('result-count');
    const toast = document.getElementById('toast');
    const fileUpload = document.getElementById('file-upload');
    const uploadTriggerBtn = document.getElementById('upload-trigger-btn');
    const inputScrollTopBtn = document.getElementById('input-scroll-top');
    const inputScrollBottomBtn = document.getElementById('input-scroll-bottom');
    const lineNumbers = document.getElementById('line-numbers');
    const layoutToggleBtn = document.getElementById('layout-toggle-btn');
    const splitView = document.querySelector('.split-view');

    // State
    let currentChunks = [];
    let debounceTimer;

    // Fix zebra striping alignment by measuring actual rendered line-height
    const setActualLineHeight = () => {
        // Create a temporary element to measure the actual rendered line height
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = `
            position: absolute;
            visibility: hidden;
            font-family: monospace;
            font-size: 0.95rem;
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

        // Set as CSS variable on the textarea
        textInput.style.setProperty('--actual-line-height', `${actualLineHeight}px`);

        console.log(`Zebra stripe line-height set to: ${actualLineHeight}px (precise)`);
    };

    // Call it immediately after DOM is ready
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

    // Line Numbers & Scroll Sync
    const updateLineNumbers = () => {
        const text = textInput.value;
        const numberOfLines = text.split(/\r?\n/).length;
        const currentLines = lineNumbers.children.length;

        if (numberOfLines !== currentLines) {
            // Rebuild if count changes (basic approach for correctness)
            // For extreme performance optimization on 10k+ lines, virtual scrolling would be needed,
            // but for typical usage, this string build is fast enough.
            const linesArr = new Array(numberOfLines).fill(0).map((_, i) => i + 1);
            lineNumbers.innerText = linesArr.join('\n');
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
        debounceTimer = setTimeout(triggerSplit, 100);
    });

    // Auto-scroll to top on paste
    textInput.addEventListener('paste', () => {
        // Use timeout to allow paste to render, then snap back to top
        setTimeout(() => {
            textInput.scrollTop = 0;
            textInput.setSelectionRange(0, 0);
            if (lineNumbers) lineNumbers.scrollTop = 0;
            updateLineNumbers();
        }, 0);
    });

    linesInput.addEventListener('input', triggerSplit);

    function triggerSplit() {
        const text = textInput.value;
        const linesPerChunk = parseInt(linesInput.value, 10);

        if (!text.trim()) {
            renderEmptyState();
            return;
        }

        if (isNaN(linesPerChunk) || linesPerChunk < 1) {
            return;
        }

        processSplit(text, linesPerChunk);
    }

    function processSplit(text, chunkSize) {
        const lines = text.split(/\r?\n/);
        currentChunks = [];

        for (let i = 0; i < lines.length; i += chunkSize) {
            const chunk = lines.slice(i, i + chunkSize).join('\n');
            currentChunks.push({
                id: i / chunkSize + 1,
                content: chunk,
                lineStart: i + 1,
                lineEnd: Math.min(i + chunkSize, lines.length)
            });
        }

        renderResults();
    }

    function renderEmptyState() {
        chunksContainer.innerHTML = `
            <div class="empty-state">
                Start typing or upload a file to see results...
            </div>
        `;
        resultCount.textContent = '0 chunks';
    }

    function renderResults() {
        chunksContainer.innerHTML = '';
        resultCount.textContent = `${currentChunks.length} chunks`;

        if (currentChunks.length === 0) {
            renderEmptyState();
            return;
        }

        const fragment = document.createDocumentFragment();

        currentChunks.forEach((chunk, index) => {
            const card = document.createElement('div');
            card.className = 'chunk-card';

            card.innerHTML = `
                <div class="chunk-header">
                    <span>Split part ${chunk.id}</span>
                    <span style="font-size: 0.75rem; opacity: 0.7;">Lines ${chunk.lineStart}-${chunk.lineEnd}</span>
                </div>
                <div id="chunk-content-${index}" class="chunk-content" title="Click to scroll">${escapeHtml(chunk.content)}</div>
                <div class="chunk-actions">
                    <button class="btn-icon" onclick="scrollToChunkTop(${index})" title="Go to Start">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        </svg>
                    </button>
                    <button class="btn-icon" onclick="scrollToChunkBottom(${index})" title="Go to End">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                    <div style="width: 1px; height: 20px; background: var(--border-color); margin: 0 0.5rem;"></div>
                    <button class="btn-icon" onclick="copyChunk(${index}, this)" title="Copy to Clipboard">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                        </svg>
                    </button>
                    <button class="btn-icon" onclick="downloadChunk(${index})" title="Download .txt">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                    </button>
                </div>
            `;

            // Interaction Logic for Scroll Trap Prevention
            const contentEl = card.querySelector('.chunk-content');
            contentEl.addEventListener('click', () => {
                contentEl.classList.add('scroll-enabled');
            });
            contentEl.addEventListener('mouseleave', () => {
                contentEl.classList.remove('scroll-enabled');
            });

            fragment.appendChild(card);
        });

        chunksContainer.appendChild(fragment);
    }

    // Utilities - Global
    window.scrollToChunkTop = (index) => {
        const el = document.getElementById(`chunk-content-${index}`);
        if (el) el.scrollTop = 0;
    };

    window.scrollToChunkBottom = (index) => {
        const el = document.getElementById(`chunk-content-${index}`);
        if (el) el.scrollTop = el.scrollHeight;
    };

    window.copyChunk = async (index, btn) => {
        const text = currentChunks[index].content;
        try {
            await navigator.clipboard.writeText(text);
            showToast('Copied to clipboard!');

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

    window.downloadChunk = (index) => {
        const chunk = currentChunks[index];
        const blob = new Blob(['\uFEFF' + chunk.content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `split_part_${chunk.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 2000);
    }
});
