        let mode = 'json-to-toon';
        let inputContent = '';
        let outputContent = '';
        let conversionCount = parseInt(localStorage.getItem('conversionCount') || '0');
        
        document.getElementById('conversionCounter').textContent = conversionCount;

        const els = {
            inputEditor: document.getElementById('inputEditor'),
            outputDisplay: document.getElementById('outputDisplay'),
            fileInput: document.getElementById('fileInput'),
            uploadArea: document.getElementById('uploadArea'),
            convertBtn: document.getElementById('convertBtn'),
            statusBadge: document.getElementById('statusBadge'),
            copyBtn: document.getElementById('copyBtn'),
            downloadBtn: document.getElementById('downloadBtn')
        };

        // Mode switching
        document.getElementById('jsonModeBtn').addEventListener('click', () => switchMode('json-to-toon'));
        document.getElementById('toonModeBtn').addEventListener('click', () => switchMode('toon-to-json'));

        function switchMode(newMode) {
            mode = newMode;
            const jsonBtn = document.getElementById('jsonModeBtn');
            const toonBtn = document.getElementById('toonModeBtn');
            
            if (mode === 'json-to-toon') {
                jsonBtn.classList.add('active');
                toonBtn.classList.remove('active');
                document.getElementById('inputLabel').textContent = 'Paste or upload JSON';
                document.getElementById('outputLabel').textContent = 'Converted TOON format';
                document.getElementById('inputFileName').textContent = 'input.json';
                document.getElementById('outputFileName').textContent = 'output.toon';
                els.fileInput.accept = '.json';
                document.getElementById('acceptedType').textContent = 'Accepts: .json';
            } else {
                toonBtn.classList.add('active');
                jsonBtn.classList.remove('active');
                document.getElementById('inputLabel').textContent = 'Paste or upload TOON';
                document.getElementById('outputLabel').textContent = 'Converted JSON format';
                document.getElementById('inputFileName').textContent = 'input.toon';
                document.getElementById('outputFileName').textContent = 'output.json';
                els.fileInput.accept = '.toon';
                document.getElementById('acceptedType').textContent = 'Accepts: .toon';
            }
            
            resetInterface();
        }

        function resetInterface() {
            els.inputEditor.value = '';
            inputContent = '';
            outputContent = '';
            els.outputDisplay.innerHTML = `
                <div class="text-center py-20 text-gray-600">
                    <svg class="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <p class="text-sm">Output will appear here...</p>
                </div>
            `;
            els.convertBtn.disabled = true;
            els.copyBtn.disabled = true;
            els.downloadBtn.disabled = true;
            document.getElementById('outputStats').classList.add('hidden');
            updateInputStats();
            setStatus('idle');
        }

        // Input tracking
        els.inputEditor.addEventListener('input', () => {
            inputContent = els.inputEditor.value;
            els.convertBtn.disabled = !inputContent.trim();
            updateInputStats();
            if (inputContent.trim()) {
                setStatus('ready');
            } else {
                setStatus('idle');
            }
        });

        function updateInputStats() {
            const lines = inputContent ? inputContent.split('\n').length : 0;
            const bytes = new Blob([inputContent]).size;
            document.getElementById('inputLines').textContent = lines;
            document.getElementById('inputSize').textContent = formatBytes(bytes);
        }

        // Upload functionality
        document.getElementById('uploadBtn').addEventListener('click', () => {
            els.uploadArea.classList.toggle('hidden');
        });

        els.uploadArea.addEventListener('click', (e) => {
            if (e.target.closest('#uploadArea')) {
                els.fileInput.click();
            }
        });

        els.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            els.uploadArea.classList.add('drag-active');
        });

        els.uploadArea.addEventListener('dragleave', () => {
            els.uploadArea.classList.remove('drag-active');
        });

        els.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            els.uploadArea.classList.remove('drag-active');
            handleFileUpload(e.dataTransfer.files[0]);
        });

        els.fileInput.addEventListener('change', (e) => {
            handleFileUpload(e.target.files[0]);
        });

        function handleFileUpload(file) {
            if (!file) return;
            
            const expectedExt = mode === 'json-to-toon' ? '.json' : '.toon';
            if (!file.name.endsWith(expectedExt)) {
                showToast('error', 'Invalid File Type', `Please select a ${expectedExt} file`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                els.inputEditor.value = e.target.result;
                inputContent = e.target.result;
                updateInputStats();
                els.convertBtn.disabled = false;
                els.uploadArea.classList.add('hidden');
                setStatus('ready');
                showToast('success', 'File Loaded', `${file.name} loaded successfully`);
            };
            reader.readAsText(file);
        }

        // Clear input
        document.getElementById('clearBtn').addEventListener('click', () => {
            if (!inputContent) return;
            els.inputEditor.value = '';
            inputContent = '';
            updateInputStats();
            els.convertBtn.disabled = true;
            setStatus('idle');
            showToast('success', 'Cleared', 'Input cleared successfully');
        });

        // Format input
        document.getElementById('formatBtn').addEventListener('click', () => {
            if (!inputContent.trim()) return;
            
            try {
                if (mode === 'json-to-toon') {
                    const formatted = JSON.stringify(JSON.parse(inputContent), null, 2);
                    els.inputEditor.value = formatted;
                    inputContent = formatted;
                    updateInputStats();
                    showToast('success', 'Formatted', 'JSON formatted successfully');
                }
            } catch (err) {
                showToast('error', 'Format Error', 'Invalid JSON syntax');
            }
        });

        // Convert
        els.convertBtn.addEventListener('click', async () => {
            if (!inputContent.trim()) return;

            setStatus('converting');
            els.convertBtn.disabled = true;
            document.getElementById('convertText').classList.add('hidden');
            document.getElementById('convertingText').classList.remove('hidden');

            const formData = new FormData();
            const blob = new Blob([inputContent], { type: 'text/plain' });
            const filename = mode === 'json-to-toon' ? 'input.json' : 'input.toon';
            formData.append('file', blob, filename);
            formData.append('type', mode);

            try {
                const response = await fetch('/convert', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const resultBlob = await response.blob();
                    outputContent = await resultBlob.text();
                    
                    displayOutput(outputContent);
                    updateOutputStats(outputContent);
                    
                    els.copyBtn.disabled = false;
                    els.downloadBtn.disabled = false;
                    
                    conversionCount++;
                    localStorage.setItem('conversionCount', conversionCount.toString());
                    document.getElementById('conversionCounter').textContent = conversionCount;

                    setStatus('ready');
                    showToast('success', 'Conversion Complete', 'File converted successfully');
                } else {
                    setStatus('error');
                    showToast('error', 'Conversion Failed', 'Please check your input and try again');
                }
            } catch (error) {
                setStatus('error');
                showToast('error', 'Network Error', 'Failed to connect to server');
            } finally {
                els.convertBtn.disabled = false;
                document.getElementById('convertText').classList.remove('hidden');
                document.getElementById('convertingText').classList.add('hidden');
            }
        });

        function displayOutput(content) {
            if (mode === 'json-to-toon') {
                els.outputDisplay.innerHTML = `<pre class="text-gray-300">${escapeHtml(content)}</pre>`;
            } else {
                try {
                    const formatted = JSON.stringify(JSON.parse(content), null, 2);
                    els.outputDisplay.innerHTML = `<pre class="text-gray-300">${syntaxHighlight(formatted)}</pre>`;
                } catch {
                    els.outputDisplay.innerHTML = `<pre class="text-gray-300">${escapeHtml(content)}</pre>`;
                }
            }
        }

        function updateOutputStats(content) {
            const lines = content.split('\n').length;
            const bytes = new Blob([content]).size;
            const inputBytes = new Blob([inputContent]).size;
            const ratio = inputBytes > 0 ? ((bytes / inputBytes) * 100).toFixed(1) : 0;
            
            document.getElementById('outputLines').textContent = lines;
            document.getElementById('outputSize').textContent = formatBytes(bytes);
            document.getElementById('compressionRatio').textContent = ratio + '%';
            document.getElementById('outputStats').classList.remove('hidden');
        }

        // Copy output
        els.copyBtn.addEventListener('click', async () => {
            if (!outputContent) return;
            
            try {
                await navigator.clipboard.writeText(outputContent);
                showToast('success', 'Copied', 'Output copied to clipboard');
            } catch (err) {
                showToast('error', 'Copy Failed', 'Could not copy to clipboard');
            }
        });

        // Download output
        els.downloadBtn.addEventListener('click', () => {
            if (!outputContent) return;

            const blob = new Blob([outputContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = mode === 'json-to-toon' ? 'converted.toon' : 'converted.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast('success', 'Downloaded', 'File downloaded successfully');
        });

        // Status management
        function setStatus(status) {
            const badge = els.statusBadge;
            badge.className = 'status-badge';
            
            if (status === 'idle') {
                badge.classList.add('status-idle');
                badge.innerHTML = '<span class="pulse-dot"></span><span>Idle</span>';
            } else if (status === 'ready') {
                badge.classList.add('status-ready');
                badge.innerHTML = '<span class="pulse-dot"></span><span>Ready</span>';
            } else if (status === 'converting') {
                badge.classList.add('status-converting');
                badge.innerHTML = '<span class="spinner"></span><span>Converting</span>';
            } else if (status === 'error') {
                badge.classList.add('status-error');
                badge.innerHTML = '<span class="pulse-dot"></span><span>Error</span>';
            }
        }

        // Utility functions
        function formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        function escapeHtml(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return text.replace(/[&<>"']/g, m => map[m]);
        }

        function syntaxHighlight(json) {
            json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return '<span class="' + cls + '">' + match + '</span>';
            });
        }

        function showToast(type, title, message) {
            const toast = document.getElementById('toast');
            const icon = document.getElementById('toastIcon');

            if (type === 'success') {
                icon.innerHTML = `
                    <div class="w-10 h-10 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center">
                        <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                    </div>
                `;
            } else {
                icon.innerHTML = `
                    <div class="w-10 h-10 rounded-full bg-red-500 bg-opacity-20 flex items-center justify-center">
                        <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </div>
                `;
            }

            document.getElementById('toastTitle').textContent = title;
            document.getElementById('toastMessage').textContent = message;
            toast.classList.remove('hidden');

            setTimeout(() => {
                toast.classList.add('hidden');
            }, 4000);
        }

        // Initialize
        updateInputStats();
