// ===== DOM Elements =====
const messagesContainer = document.getElementById('messagesContainer');
const messagesWrapper = document.getElementById('messagesWrapper');
const welcomeScreen = document.getElementById('welcomeScreen');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const stopBtn = document.getElementById('stopBtn');
const newChatBtn = document.getElementById('newChatBtn');
const toggleSidebar = document.getElementById('toggleSidebar');
const toggleSidebarData = document.getElementById('toggleSidebarData');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const chatHistory = document.getElementById('chatHistory');

// View Elements
const chatView = document.getElementById('chatView');
const dataView = document.getElementById('dataView');
const knowledgeSectionBtn = document.getElementById('knowledgeSectionBtn');

const dataViewTitle = document.getElementById('dataViewTitle');
const headerAddKnowledgeBtn = document.getElementById('headerAddKnowledgeBtn');

// History Elements
const knowledgeHistorySection = document.getElementById('knowledgeHistorySection');
const historyList = document.getElementById('historyList');
const loadMoreHistoryBtn = document.getElementById('loadMoreHistoryBtn');

// Ingest Modal Elements
// const ingestBtn removed (comment preserved)
const knowledgeContent = document.getElementById('knowledgeContent');
const charCount = document.getElementById('charCount');
const knowledgeUrl = document.getElementById('knowledgeUrl');
const pdfFileInput = document.getElementById('pdfFileInput');
const pdfDragArea = document.getElementById('pdfDragArea');
const selectedFileName = document.getElementById('selectedFileName');
const selectedFileSize = document.getElementById('selectedFileSize');
const removePdfBtn = document.getElementById('removePdfBtn');
const submitKnowledgeIngest = document.getElementById('submitKnowledgeIngest');
const modalTabs = document.querySelectorAll('.modal-tab');
const tabContents = document.querySelectorAll('.tab-content');
const speechBtnText = document.getElementById('speechBtnText');
const speechBtnUrl = document.getElementById('speechBtnUrl');
const speechBtnMessage = document.getElementById('speechBtnMessage');

// Toast Elements
const toast = document.getElementById('toast');
const toastIcon = document.getElementById('toastIcon');
const toastMessage = document.getElementById('toastMessage');

// Delete Modal Elements
const deleteModal = document.getElementById('deleteModal');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');

// Delete Knowledge Modal Elements
const deleteKnowledgeModal = document.getElementById('deleteKnowledgeModal');
const cancelDeleteKnowledge = document.getElementById('cancelDeleteKnowledge');
const confirmDeleteKnowledge = document.getElementById('confirmDeleteKnowledge');

// Knowledge Detail Modal Elements
const knowledgeDetailModal = document.getElementById('knowledgeDetailModal');
const okKnowledgeDetailBtn = document.getElementById('okKnowledgeDetailBtn');
const knowledgeDetailContent = document.getElementById('knowledgeDetailContent');
const copyKnowledgeDetailBtn = document.getElementById('copyKnowledgeDetailBtn');

// Knowledge Vector Modal Elements
const knowledgeVectorModal = document.getElementById('knowledgeVectorModal');
const knowledgeVectorBody = document.getElementById('knowledgeVectorBody');

// Update Knowledge Modal Elements
const updateKnowledgeModal = document.getElementById('updateKnowledgeModal');
const cancelUpdateKnowledge = document.getElementById('cancelUpdateKnowledge');
const submitUpdateKnowledge = document.getElementById('submitUpdateKnowledge');
const updateKnowledgeContent = document.getElementById('updateKnowledgeContent');
const updateCharCount = document.getElementById('updateCharCount');

// Update Query Modal Elements
const updateQueryModal = document.getElementById('updateQueryModal');
const cancelUpdateQuery = document.getElementById('cancelUpdateQuery');
const submitUpdateQuery = document.getElementById('submitUpdateQuery');
const updateQueryContent = document.getElementById('updateQueryContent');

// ===== State =====
let messages = [];
let sessionToDeleteId = null;
let isStreaming = false;
let currentController = null;
let chatSessions = [];
let currentSessionId = null;
let processingSessionId = null;
let currentFullResponse = '';
let sessionToRenameId = null;

let knowledgeToDeleteId = null;
let knowledgeToDeleteElement = null;

let knowledgeToUpdateId = null;

// History State
let historyCursor = 0;
let historySize = window.CONFIG.UI.HISTORY_PAGE_SIZE;
let historyHasNext = false;
let isHistoryLoading = false;
let activeIngestTab = 'text'; // 'text', 'url', 'pdf'
let selectedPdfFile = null;
let recognition = null;
let isRecording = false;

// ===== API Configuration =====
// ===== API Configuration (Using window.CONFIG) =====
const API_URL = window.CONFIG.API.CHAT;
const KNOWLEDGE_API_URL = window.CONFIG.API.INGEST;
const KNOWLEDGE_UPDATE_URL = window.CONFIG.API.UPDATE;
const KNOWLEDGE_DELETE_URL = window.CONFIG.API.DELETE;
const KNOWLEDGE_HISTORY_URL = window.CONFIG.API.HISTORY;
const KNOWLEDGE_DETAIL_URL = window.CONFIG.API.DETAIL;
const KNOWLEDGE_VECTOR_URL = window.CONFIG.API.VECTOR;
const KNOWLEDGE_CREATE_VIA_PDF_URL = window.CONFIG.API.CREATE_VIA_PDF;

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadChatHistory();
});

function initializeApp() {
    // Configure marked.js for markdown rendering
    marked.setOptions({
        highlight: function (code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        },
        breaks: window.CONFIG.MARKDOWN.LINE_BREAKS,
        gfm: window.CONFIG.MARKDOWN.GITHUB_FLAVORED_MARKDOWN
    });
    
    // Set dynamic PDF size limit text
    const pdfMaxLimitText = document.getElementById('pdfMaxLimitText');
    if (pdfMaxLimitText) {
        const maxMb = (window.CONFIG.UI.MAX_PDF_SIZE_BYTES / (1024 * 1024)).toFixed(0);
        pdfMaxLimitText.textContent = `PDF files only (max. ${maxMb}MB)`;
    }

    // Initialize history state
    if (!history.state) {
        history.replaceState({ view: 'chat' }, '');
    }

}

function setupEventListeners() {
    // Input handling
    messageInput.addEventListener('input', handleInputChange);
    messageInput.addEventListener('keydown', handleKeyDown);

    // Button clicks
    sendBtn.addEventListener('click', sendMessage);
    stopBtn.addEventListener('click', () => {
        stopStreaming();
        stopAllSpeech();
    });
    newChatBtn.addEventListener('click', startNewChat);
    toggleSidebar.addEventListener('click', toggleSidebarMenu);
    sidebarOverlay.addEventListener('click', closeSidebarMenu);



    // Suggestion buttons
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            messageInput.value = btn.dataset.query;
            handleInputChange();
            sendMessage();
        });
    });

    // Add Knowledge Modal Events
    headerAddKnowledgeBtn.addEventListener('click', openKnowledgeModal);

    // History Events
    loadMoreHistoryBtn.addEventListener('click', () => loadKnowledgeHistory(false));

    // View Switching
    knowledgeSectionBtn.addEventListener('click', () => {
        if (dataView.classList.contains('hidden')) {
            showDataView();
        } else {
            showChatView();
        }
    });

    if (toggleSidebarData) {
        toggleSidebarData.addEventListener('click', toggleSidebarMenu);
    }


    cancelKnowledgeIngest.addEventListener('click', closeKnowledgeModal);
    submitKnowledgeIngest.addEventListener('click', handleKnowledgeIngest);
    knowledgeContent.addEventListener('input', handleKnowledgeInputChange);
    knowledgeUrl.addEventListener('input', handleKnowledgeInputChange);

    // Tab switching
    modalTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            switchIngestTab(targetTab);
        });
    });

    // PDF upload events
    pdfDragArea.addEventListener('click', () => pdfFileInput.click());
    pdfFileInput.addEventListener('change', handlePdfFileSelect);

    pdfDragArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        pdfDragArea.classList.add('drag-over');
    });

    pdfDragArea.addEventListener('dragleave', () => {
        pdfDragArea.classList.remove('drag-over');
    });

    pdfDragArea.addEventListener('drop', (e) => {
        e.preventDefault();
        pdfDragArea.classList.remove('drag-over');
        if (e.dataTransfer.files.length) {
            handlePdfFileSelect({ target: { files: e.dataTransfer.files } });
        }
    });

    removePdfBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearPdfSelection();
    });

    if (speechBtnText) {
        speechBtnText.addEventListener('click', () => toggleSpeechToText('text'));
    }
    if (speechBtnUrl) {
        speechBtnUrl.addEventListener('click', () => toggleSpeechToText('url'));
    }
    if (speechBtnMessage) {
        speechBtnMessage.addEventListener('click', () => toggleSpeechToText('message'));
    }

    // Update Knowledge Modal Events

    cancelUpdateKnowledge.addEventListener('click', closeUpdateKnowledgeDialog);
    submitUpdateKnowledge.addEventListener('click', handleKnowledgeUpdate);
    updateKnowledgeContent.addEventListener('input', handleUpdateInputChange);

    // Update Query Modal Events
    cancelUpdateQuery.addEventListener('click', closeUpdateQueryDialog);
    submitUpdateQuery.addEventListener('click', handleQueryUpdateCommit);



    // Stop speech synthesis on window unload (refresh, tab close, navigation)
    window.addEventListener('beforeunload', () => {
        stopAllSpeech();
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!knowledgeModal.classList.contains('hidden')) {
                closeKnowledgeModal();
            }
            if (!deleteModal.classList.contains('hidden')) {
                closeDeleteDialog();
            }
            if (!deleteKnowledgeModal.classList.contains('hidden')) {
                closeDeleteKnowledgeDialog();
            }
            if (!knowledgeDetailModal.classList.contains('hidden')) {
                closeKnowledgeDetailDialog();
            }
            if (!updateKnowledgeModal.classList.contains('hidden')) {
                closeUpdateKnowledgeDialog();
            }
            if (!updateQueryModal.classList.contains('hidden')) {
                closeUpdateQueryDialog();
            }
        }
    });

    // Delete Modal Events

    cancelDelete.addEventListener('click', closeDeleteDialog);
    confirmDelete.addEventListener('click', handleConfirmDelete);



    // Delete Knowledge Modal Events

    cancelDeleteKnowledge.addEventListener('click', closeDeleteKnowledgeDialog);
    confirmDeleteKnowledge.addEventListener('click', handleConfirmDeleteKnowledge);



    // Knowledge Detail Modal Events
    okKnowledgeDetailBtn.addEventListener('click', closeKnowledgeDetailDialog);
    if (copyKnowledgeDetailBtn) {
        copyKnowledgeDetailBtn.addEventListener('click', () => {
            const content = knowledgeDetailContent.textContent;
            navigator.clipboard.writeText(content).then(() => {
                showToast('success', 'Content copied to clipboard');
                const originalText = copyKnowledgeDetailBtn.innerHTML;
                copyKnowledgeDetailBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                `;
                setTimeout(() => copyKnowledgeDetailBtn.innerHTML = originalText, 2000);
            });
        });
    }


    // Handle tab close/page refresh to stop streaming
    window.addEventListener('beforeunload', () => {
        if (isStreaming && currentController) {
            currentController.abort();
        }
    });

    // Handle browser back button
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.view === 'data') {
            showDataView(true);
        } else {
            showChatView(true);
        }
    });
}

// ===== Sidebar Toggle =====
function isMobile() {
    return window.innerWidth <= 768;
}

function toggleSidebarMenu() {
    if (isMobile()) {
        // On mobile, toggle 'open' class
        const isOpen = sidebar.classList.contains('open');
        if (isOpen) {
            closeSidebarMenu();
        } else {
            sidebar.classList.add('open');
            sidebar.classList.remove('collapsed');
            sidebarOverlay.classList.add('show');
        }
    } else {
        // On desktop, toggle 'collapsed' class
        sidebar.classList.toggle('collapsed');
    }
}

function closeSidebarMenu() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
}

// ===== View Switching =====
function showDataView(fromPopState = false) {
    chatView.classList.add('hidden');
    dataView.classList.remove('hidden');

    knowledgeSectionBtn.innerHTML = `
        <div class="avatar" style="background: transparent; border: none;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
        </div>
        <span>Back to Chat</span>
    `;

    // Auto-load history when opening the data view
    loadKnowledgeHistory(true);

    if (window.innerWidth <= 768) {
        closeSidebarMenu();
    }

    stopAllSpeech();

    if (!fromPopState) {
        history.pushState({ view: 'data' }, '');
    }
}

function showChatView(fromPopState = false) {
    dataView.classList.add('hidden');
    chatView.classList.remove('hidden');

    knowledgeSectionBtn.innerHTML = `
        <div class="avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
        </div>
        <span>Ingest Knowledge</span>
        <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" style="margin-left: auto; opacity: 0.5;">
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
    `;

    stopAllSpeech();

    if (!fromPopState && history.state && history.state.view === 'data') {
        history.back();
    }
}

// ===== Input Handling =====
function handleInputChange() {
    // Auto-resize textarea
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';

    // Enable/disable send button
    sendBtn.disabled = !messageInput.value.trim();
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled && !isStreaming) {
            sendMessage();
        }
    }
}

// ===== Message Handling =====
async function sendMessage() {
    stopSpeechRecognition();
    const rawQuery = messageInput.value.trim();
    if (!rawQuery) return;

    // Format the query
    const formattedQuery = rawQuery
        .replace(/\r?\n|\r/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

    if (isStreaming) {
        stopStreaming();
    }

    // Capture original button content and show loader
    const originalBtnContent = sendBtn.innerHTML;
    sendBtn.disabled = true;
    sendBtn.innerHTML = `
        <div class="chat-loader" style="margin: 0; width: 18px; height: 18px; border-width: 2px;"></div>
    `;



    // Hide welcome screen
    const welcome = document.getElementById('welcomeScreen');
    if (welcome) {
        welcome.classList.add('hidden');
    }

    // Now show user message card (directly formatted)
    addMessage('user', formattedQuery);

    // Clear input
    messageInput.value = '';
    handleInputChange();
    
    // Save to history
    saveToHistory(formattedQuery);

    try {
        // Start streaming response
        await streamResponse(formattedQuery);
    } finally {
        // Restore button state
        sendBtn.innerHTML = originalBtnContent;
        handleInputChange(); // Will re-enable/disable based on empty input
    }
}

function addMessage(role, content, timestamp = null) {
    const time = timestamp || (role === 'assistant' ? new Date().toISOString() : null);
    const message = { role, content };
    if (time) message.timestamp = time;
    messages.push(message);

    const messageElement = createMessageElement(role, content, false, false, time);
    messagesWrapper.appendChild(messageElement);

    applySeeMore(messageElement, role);

    scrollToBottom();
    updateLastUserMessageClass();
    updateLastAssistantMessageClass();

    return messageElement;
}

function applySeeMore(messageElement, role) {
    if (role !== 'user') return;

    const textDiv = messageElement.querySelector('.message-text');
    const bubble = messageElement.querySelector('.message-bubble');

    // Slight delay to ensure layout is calculated
    setTimeout(() => {
        if (!textDiv || !bubble) return;

        // If scrollHeight is greater than clientHeight, it means it's truncated
        // clientHeight is restricted by line-clamp in CSS
        if (textDiv.scrollHeight > textDiv.clientHeight) {
            // Check if button already exists to prevent duplicates
            if (bubble.querySelector('.see-more-msg-btn')) return;

            const seeMoreBtn = document.createElement('button');
            seeMoreBtn.className = 'see-more-msg-btn';
            seeMoreBtn.innerHTML = `
                <span>See More</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            `;

            seeMoreBtn.onclick = (e) => {
                e.stopPropagation();
                const isExpanded = textDiv.classList.toggle('expanded');

                const btnText = seeMoreBtn.querySelector('span');
                const btnIcon = seeMoreBtn.querySelector('svg');

                if (isExpanded) {
                    btnText.textContent = 'See Less';
                    btnIcon.style.transform = 'rotate(180deg)';
                } else {
                    btnText.textContent = 'See More';
                    btnIcon.style.transform = 'rotate(0deg)';
                }
            };
            bubble.appendChild(seeMoreBtn);
        }
    }, window.CONFIG.UI.SCROLL_DELAY_MS);
}

function scrollToBottom() {
    messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'auto'
    });
}

function scrollToQuestion() {
    const userMessages = messagesWrapper.querySelectorAll('.message.user');
    if (userMessages.length > 0) {
        const lastQuestion = userMessages[userMessages.length - 1];
        lastQuestion.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function updateLastUserMessageClass() {
    // Remove the class from all messages first
    messagesWrapper.querySelectorAll('.message.user').forEach(el => {
        el.classList.remove('can-edit');
    });

    // Add to the last one
    const userMessages = messagesWrapper.querySelectorAll('.message.user');
    if (userMessages.length > 0) {
        userMessages[userMessages.length - 1].classList.add('can-edit');
    }
}

function updateLastAssistantMessageClass() {
    // Remove the class from all messages first
    messagesWrapper.querySelectorAll('.message.assistant').forEach(el => {
        el.classList.remove('can-regenerate');
    });

    // Add to the last one
    const assistantMessages = messagesWrapper.querySelectorAll('.message.assistant');
    if (assistantMessages.length > 0) {
        assistantMessages[assistantMessages.length - 1].classList.add('can-regenerate');
    }
}

function createMessageElement(role, content, isStreaming = false, isError = false, timestamp = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatarSvg = role === 'user'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>';

    // Always show date and time for assistant messages
    const timeString = (role === 'assistant' && timestamp)
        ? new Date(timestamp).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
        : '';

    messageDiv.innerHTML = `
        <div class="message-avatar">${avatarSvg}</div>
        <div class="message-content">
            <div class="message-bubble">
                <div class="message-text">${role === 'user' ? escapeHtml(content) : ''}</div>
            </div>
            <div class="message-footer">
                <div class="message-timestamp">${timeString}</div>
                <div class="message-actions">
                    ${role === 'user' ? `
                    <button class="edit-msg-btn" title="Edit and re-query" onclick="editLastMessage(this)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="copy-msg-btn" title="Copy message" onclick="copyMessage(this)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>` : ''}
                    ${role === 'assistant' ? `
                    <button class="listen-msg-btn" title="Listen" onclick="speakMessage(this)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                    </button>
                    <button class="copy-msg-btn" title="Copy message" onclick="copyMessage(this)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                    <button class="regenerate-msg-btn" title="Regenerate" onclick="regenerateResponse(this)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M23 4v6h-6"></path>
                            <path d="M1 20v-6h6"></path>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                    </button>` : ''}
                </div>
            </div>
        </div>
    `;

    if (role === 'assistant' && isStreaming) {
        messageDiv.id = 'streamingMessage';
        const textDiv = messageDiv.querySelector('.message-text');
        textDiv.innerHTML = `
            <div class="status-indicator">
                <span>Loading</span>
                <div class="loading-dots"><span></span><span></span><span></span></div>
            </div>
        `;
    }

    return messageDiv;
}

// ===== Streaming Response =====
async function streamResponse(query) {
    const sessionToUpdate = currentSessionId;
    const targetMessages = messages; // Capture reference to current session's messages

    isStreaming = true;
    processingSessionId = currentSessionId;
    sendBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    renderChatHistory(); // Update sidebar to show loader

    // Create assistant message placeholder
    const assistantMessage = createMessageElement('assistant', '', true);
    messagesWrapper.appendChild(assistantMessage);

    // After appending, ensure it's marked as the active streaming message
    // and remove it from any other elements that might have it
    const allStreamingMsgs = document.querySelectorAll('#streamingMessage');
    allStreamingMsgs.forEach(el => {
        if (el !== assistantMessage) el.removeAttribute('id');
    });
    assistantMessage.id = 'streamingMessage';

    const textDiv = assistantMessage.querySelector('.message-text');
    let fullResponse = '';
    currentFullResponse = '';

    // Initial state is already set to 'Loading' in createMessageElement
    // Scroll to the top of the question when answer starts
    scrollToQuestion();

    const controller = new AbortController();
    currentController = controller;
    const url = API_URL;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            },
            body: JSON.stringify({ query: query }),
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let partialLine = '';
        let shouldBreak = false;
        while (true) {
            const { done, value } = await reader.read();
            if (done && !value) break;

            const chunk = decoder.decode(value || new Uint8Array(), { stream: !done });
            const lines = (partialLine + chunk).split('\n');
            partialLine = lines.pop(); // Keep the last partial line for the next chunk

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine || !trimmedLine.startsWith('data:')) continue;

                const dataStr = trimmedLine.substring(5).trim();
                if (!dataStr) continue;

                let data;
                try {
                    data = JSON.parse(dataStr);
                } catch (e) {
                    console.warn('Error parsing SSE data chunk:', e, dataStr);
                    continue; // Skip malformed chunks
                }

                if (data.type === 'message') {
                    if (fullResponse === '') {
                        // First token, clear status indicator or initial loader
                        textDiv.innerHTML = '';
                    }
                    fullResponse += data.content;
                    currentFullResponse = fullResponse;

                    // Update UI with tokens
                    const liveTextDiv = document.querySelector('#streamingMessage .message-text');
                    const targetDiv = liveTextDiv || (currentSessionId === processingSessionId ? textDiv : null);
                    if (targetDiv) {
                        renderMarkdown(targetDiv, fullResponse);
                        scrollToBottom();
                    }
                } else if (data.type === 'status') {
                    if (data.content === 'completed') {
                        shouldBreak = true;
                        break;
                    } else if (data.content === 'error') {
                        console.error('Server returned error status');
                        throw new Error('Something went wrong. Please try again sometimes later.');
                    } else if (data.content) {
                        // Dynamically format any status content received
                        const statusMap = {
                            'analyzing-query': 'Analyzing Query',
                            'retrieving-info': 'Retrieving Information',
                            'reranking-info': 'Organizing Information',
                            'generating-response': 'Generating Response'
                        };
                        
                        // Use map or format the raw content (dash to space, capitalize)
                        const statusText = statusMap[data.content] || 
                            data.content.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                        // Use the captured textDiv reference as the primary target for reliability
                        const liveTextDiv = document.querySelector('#streamingMessage .message-text');
                        const targetDiv = liveTextDiv || textDiv;
                        
                        // Only show status if we haven't started receiving the actual message yet
                        if (targetDiv && fullResponse === '') {
                            targetDiv.innerHTML = `
                                <div class="status-indicator">
                                    <span>${statusText}</span>
                                    <div class="loading-dots"><span></span><span></span><span></span></div>
                                </div>
                            `;
                            scrollToBottom();
                        }
                    }
                }
            }

            if (done || shouldBreak) break;
        }

        // Process any remaining partial line if it's a complete message (though unlikely in SSE)
        if (partialLine.trim().startsWith('data:')) {
            const dataStr = partialLine.trim().substring(5).trim();
            try {
                const data = JSON.parse(dataStr);
                if (data.type === 'status' && data.content === 'error') {
                    console.error('Server returned error status in fallback');
                    throw new Error('Something went wrong. Please try again sometimes later.');
                }
                // Handle other types if needed, but normally SSE lines end with \n
            } catch (e) {
                if (e.message === 'Something went wrong.') throw e;
            }
        }

        // Store the message with UTC timestamp
        const finalTimestamp = new Date().toISOString();
        targetMessages.push({ role: 'assistant', content: fullResponse, timestamp: finalTimestamp });

        // Final render without cursor and update timestamp UI immediately
        const finalStreamingEl = document.querySelector('#streamingMessage');
        if (finalStreamingEl) {
            const finalLiveTextDiv = finalStreamingEl.querySelector('.message-text');
            renderMarkdown(finalLiveTextDiv, fullResponse, false);

            // Update timestamp in the footer
            const timestampDiv = finalStreamingEl.querySelector('.message-timestamp');
            if (timestampDiv) {
                timestampDiv.textContent = new Date(finalTimestamp).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            }
        } else if (currentSessionId === sessionToUpdate) {
            renderMarkdown(textDiv, fullResponse, false);
        }

        // Save to history using captured session ID and messages array
        saveToHistory(query, fullResponse, sessionToUpdate, targetMessages);

    } catch (error) {
        if (error.name === 'AbortError') {
            const abortTimestamp = new Date().toISOString();
            // User stopped the stream
            if (fullResponse) {
                targetMessages.push({ role: 'assistant', content: fullResponse, timestamp: abortTimestamp });
                saveToHistory(query, fullResponse, sessionToUpdate, targetMessages);
            } else {
                const stoppedMsg = '<span class="error-message">Response stopped by user</span>';
                targetMessages.push({ role: 'assistant', content: stoppedMsg, timestamp: abortTimestamp });
                saveToHistory(query, stoppedMsg, sessionToUpdate, targetMessages);
            }

            // Update UI/Messages only if we are still on the same session
            const abortEl = document.querySelector('#streamingMessage');
            if (abortEl) {
                const abortLiveTextDiv = abortEl.querySelector('.message-text');
                if (fullResponse) {
                    renderMarkdown(abortLiveTextDiv, fullResponse, false);
                } else {
                    abortLiveTextDiv.innerHTML = '<span class="error-message">Response stopped by user</span>';
                }

                const abortTimestampDiv = abortEl.querySelector('.message-timestamp');
                if (abortTimestampDiv) {
                    abortTimestampDiv.textContent = new Date(abortTimestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                }
            } else if (currentSessionId === sessionToUpdate) {
                if (fullResponse) {
                    renderMarkdown(textDiv, fullResponse, false);
                } else {
                    const stoppedMsg = '<span class="error-message">Response stopped by user</span>';
                    textDiv.innerHTML = stoppedMsg;
                }
            }
        } else {
            const streamTimestamp = new Date().toISOString();
            console.error('Stream error:', error);
            const errorMsg = (error instanceof TypeError || error.message.includes('fetch'))
                ? 'Error: Failed to fetch. May be the server is not running.'
                : error.message;
            targetMessages.push({ role: 'assistant', content: errorMsg, isError: true, timestamp: streamTimestamp });
            saveToHistory(query, errorMsg, sessionToUpdate, targetMessages);

            if (currentSessionId === sessionToUpdate) {
                const errorEl = document.querySelector('#streamingMessage');
                if (errorEl) {
                    const errorTextDiv = errorEl.querySelector('.message-text');
                    errorTextDiv.innerHTML = `<span class="error-message">${errorMsg}</span>`;

                    const errorTimestampDiv = errorEl.querySelector('.message-timestamp');
                    if (errorTimestampDiv) {
                        errorTimestampDiv.textContent = new Date(streamTimestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        });
                    }
                } else {
                    textDiv.innerHTML = `<span class="error-message">${errorMsg}</span>`;
                }
            }
        }
    } finally {
        if (currentController === controller) {
            isStreaming = false;
            processingSessionId = null;
            currentFullResponse = '';
            newChatBtn.disabled = false;
            currentController = null;
            sendBtn.classList.remove('hidden');
            stopBtn.classList.add('hidden');

            const staleStreamingMsg = document.getElementById('streamingMessage');
            if (staleStreamingMsg) {
                staleStreamingMsg.removeAttribute('id');
            }

            updateLastAssistantMessageClass();
            renderChatHistory(); // Update sidebar to remove loader
        }
    }
}
function stopStreaming() {
    if (currentController) {
        currentController.abort();
    }
}

// ===== Markdown Rendering =====
function renderMarkdown(element, content, showCursor = true) {
    let html = marked.parse(content);

    // Add copy buttons to code blocks
    html = html.replace(/<pre><code class="language-(\w+)">/g, (match, lang) => {
        return `<div class="code-block-wrapper">
            <div class="code-block-header">
                <span>${lang}</span>
                <button class="copy-code-btn" onclick="copyCode(this)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy
                </button>
            </div>
            <pre><code class="language-${lang}">`;
    });

    html = html.replace(/<pre><code>/g,
        `<div class="code-block-wrapper">
            <div class="code-block-header">
                <span>code</span>
                <button class="copy-code-btn" onclick="copyCode(this)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy
                </button>
            </div>
            <pre><code>`);

    html = html.replace(/<\/code><\/pre>/g, '</code></pre></div>');

    // Add streaming cursor
    if (showCursor) {
        html += '<span class="streaming-cursor"></span>';
    }

    element.innerHTML = html;

    // Highlight any unhighlighted code blocks
    element.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
    });
}

// ===== Utility Functions =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        // Only append 'Z' if it doesn't already have one or another timezone indicator
        const normalizedDate = dateString.includes('Z') || dateString.includes('+') ? dateString : dateString + 'Z';
        const date = new Date(normalizedDate);

        if (isNaN(date.getTime())) return dateString; // Fallback if still invalid

        return date.toLocaleString([], {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (e) {
        return dateString;
    }
}



function copyCode(button) {
    const codeBlock = button.closest('.code-block-wrapper').querySelector('code');
    const code = codeBlock.textContent;

    navigator.clipboard.writeText(code).then(() => {
        showToast('success', 'Code copied to clipboard');
        const originalText = button.innerHTML;
        button.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Copied!
        `;
        setTimeout(() => {
            button.innerHTML = originalText;
        }, 2000);
    });
}

function copyMessage(button) {
    const messageContent = button.closest('.message-content');
    const textElement = messageContent.querySelector('.message-text');

    // Create a temporary clone to remove any UI elements like loaders or copy buttons from the text
    const text = textElement.innerText || textElement.textContent;

    navigator.clipboard.writeText(text).then(() => {
        showToast('success', 'Content copied to clipboard');
        const originalHTML = button.innerHTML;
        button.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
        button.classList.add('copied');

        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

function editLastMessage(button) {
    const textElement = button.closest('.message').querySelector('.message-text');
    const originalText = textElement.textContent;

    updateQueryContent.value = originalText;
    updateQueryModal.classList.remove('hidden');
    updateQueryContent.focus();
}

function closeUpdateQueryDialog() {
    updateQueryModal.classList.add('hidden');
    updateQueryContent.value = '';
}

function handleQueryUpdateCommit() {
    const newText = updateQueryContent.value.trim();
    if (!newText) return;

    if (isStreaming) {
        stopStreaming();
    }

    closeUpdateQueryDialog();

    const allMsgs = Array.from(messagesWrapper.querySelectorAll('.message'));
    const userMsgs = allMsgs.filter(msg => msg.classList.contains('user'));

    if (userMsgs.length === 0) return;

    const lastUserMessage = userMsgs[userMsgs.length - 1];
    const startIndex = allMsgs.indexOf(lastUserMessage);

    if (startIndex === -1) return;

    messages = messages.slice(0, startIndex);

    const allMessageElements = Array.from(messagesWrapper.children);
    const domStartIndex = allMessageElements.indexOf(lastUserMessage);

    for (let i = allMessageElements.length - 1; i >= domStartIndex; i--) {
        allMessageElements[i].remove();
    }

    addMessage('user', newText);
    saveToHistory();
    streamResponse(newText);
}


function regenerateResponse(button) {
    if (isStreaming) {
        stopStreaming();
    }

    let lastUserQuery = '';
    const allElements = Array.from(messagesWrapper.children);
    // filter only message elements to avoid index mismatch with messages array
    const allMessageElements = allElements.filter(el => el.classList.contains('message'));
    let sliceIndex = -1;
    let elementToKeepIndex = -1; // The index in allElements of the last message to keep

    if (button) {
        // Targeted regeneration from a specific message
        const messageDiv = button.closest('.message');
        const clickedMsgIndex = allMessageElements.indexOf(messageDiv);

        if (clickedMsgIndex !== -1) {
            // Find the nearest user message before this one
            for (let i = clickedMsgIndex - 1; i >= 0; i--) {
                if (messages[i] && messages[i].role === 'user') {
                    lastUserQuery = messages[i].content;
                    sliceIndex = i;
                    // Find the actual element index to know where to start removal
                    elementToKeepIndex = allElements.indexOf(allMessageElements[i]);
                    break;
                }
            }
        }
    } else {
        // Fallback: Find the very last user message
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                lastUserQuery = messages[i].content;
                sliceIndex = i;
                elementToKeepIndex = allElements.indexOf(allMessageElements[i]);
                break;
            }
        }
    }

    if (lastUserQuery && sliceIndex !== -1) {
        messages = messages.slice(0, sliceIndex + 1);

        // UI Cleanup: Remove all elements after the identified user message
        for (let j = allElements.length - 1; j > elementToKeepIndex; j--) {
            allElements[j].remove();
        }

        // Update classes and history state before starting new stream
        updateLastUserMessageClass();
        updateLastAssistantMessageClass();
        saveToHistory();

        // Trigger regeneration
        streamResponse(lastUserQuery);
    }
}

window.copyToClipboard = function (text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = originalText, window.CONFIG.UI.COPY_FEEDBACK_DURATION_MS);
    });
};

// Make utility functions globally available
window.copyCode = copyCode;
window.copyMessage = copyMessage;
window.editLastMessage = editLastMessage;
window.handleQueryUpdateCommit = handleQueryUpdateCommit;
window.closeUpdateQueryDialog = closeUpdateQueryDialog;
window.regenerateResponse = regenerateResponse;

// ===== Chat History =====
function startNewChat() {
    // Let ongoing streams continue in background if they exist

    showChatView();
    messages = [];
    messagesWrapper.innerHTML = '';

    // Re-add welcome screen
    messagesWrapper.innerHTML = `
        <div class="welcome-screen" id="welcomeScreen">
            <div class="welcome-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" stroke-width="1.5">
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#6366f1"/>
                            <stop offset="100%" style="stop-color:#a855f7"/>
                        </linearGradient>
                    </defs>
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
                    <path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path>
                </svg>
            </div>
            <h2>How can I help you today?</h2>
            <p>Ask me anything about your documents</p>
            <div class="suggestions">
            </div>
        </div>
    `;

    currentSessionId = generateId();
    // Don't save to history yet - wait until first message
    renderChatHistory(); // Update to clear active selection
    messageInput.value = '';
    handleInputChange();
    messageInput.focus();
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function saveToHistory(query = null, response = null, targetSessionId = null, targetMessages = null) {
    const id = targetSessionId || currentSessionId || generateId();

    // If we're updating the current view, update the session ID global
    if (!targetSessionId) {
        currentSessionId = id;
    }

    const existingIndex = chatSessions.findIndex(s => s.id === id);
    let title = query ? (query.substring(0, 40) + (query.length > 40 ? '...' : '')) : 'New Query';
    let timestamp = new Date().toISOString();

    if (existingIndex >= 0) {
        // Keep existing title if it's already a real title (not "New Query")
        if (chatSessions[existingIndex].title && chatSessions[existingIndex].title !== 'New Query') {
            title = chatSessions[existingIndex].title;
        }
    }

    const session = {
        id: id,
        title: title,
        messages: targetMessages || messages,
        timestamp: timestamp
    };

    if (existingIndex >= 0) {
        chatSessions[existingIndex] = session;
    } else {
        chatSessions.unshift(session);
    }

    if (chatSessions.length > window.CONFIG.UI.MAX_CHAT_SESSIONS) {
        chatSessions = chatSessions.slice(0, window.CONFIG.UI.MAX_CHAT_SESSIONS);
    }
    // Save to localStorage
    try {
        localStorage.setItem('ragChatHistory', JSON.stringify(chatSessions));
    } catch (e) {
        console.warn('Could not save to localStorage:', e);
    }

    renderChatHistory();
}

function loadChatHistory() {
    try {
        const saved = localStorage.getItem('ragChatHistory');
        if (saved) {
            chatSessions = JSON.parse(saved);
            renderChatHistory();
        }
    } catch (e) {
        console.warn('Could not load chat history:', e);
    }
}

function renderChatHistory() {
    // Sort sessions by date (newest first)
    const sortedSessions = [...chatSessions].sort((a, b) => {
        return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
    });

    if (sortedSessions.length === 0) {
        chatHistory.innerHTML = '';
        return;
    }

    // Render all as a single group
    chatHistory.innerHTML = `
        <div class="chat-history-group">Your Queries</div>
        ${sortedSessions.map(session => {
        const isRenaming = session.id === sessionToRenameId;
        return `
            <div class="chat-history-item ${session.id === currentSessionId ? 'active' : ''} ${isRenaming ? 'renaming' : ''}" 
                 data-id="${session.id}">
                ${isRenaming ? `
                    <input type="text" class="rename-input" value="${escapeHtml(session.title)}" 
                           onkeydown="handleRenameKeydown('${session.id}', event)"
                           onblur="saveRenameSession('${session.id}', this.value)"
                           onclick="event.stopPropagation()">
                ` : `
                    <span class="chat-title-text">${escapeHtml(session.title)}</span>
                `}
                
                ${session.id === processingSessionId ? '<div class="chat-loader" title="Processing..."></div>' : ''}
                
                ${session.id === processingSessionId || isRenaming ? '' : `
                <div class="chat-item-actions">
                    <button class="rename-chat-btn" title="Rename chat" onclick="startRenameSession('${session.id}', event)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="delete-chat-btn" title="Delete chat" onclick="deleteChatSession('${session.id}', event)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                `}
            </div>
            `;
    }).join('')}
    `;

    // Add click handlers for selection (delete is handled inline)
    chatHistory.querySelectorAll('.chat-history-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (sessionToRenameId) return; // Ignore clicks if renaming
            loadSession(item.dataset.id);
        });
    });

    // Auto-focus rename input if it exists
    const renameInput = chatHistory.querySelector('.rename-input');
    if (renameInput) {
        renameInput.focus();
        renameInput.select();
    }
}

// Global scope for rename handlers
window.startRenameSession = function (id, event) {
    if (event) event.stopPropagation();
    sessionToRenameId = id;
    renderChatHistory();
};

window.saveRenameSession = function (id, newTitle) {
    const session = chatSessions.find(s => s.id === id);
    if (session && newTitle.trim()) {
        session.title = newTitle.trim();
        try {
            localStorage.setItem('ragChatHistory', JSON.stringify(chatSessions));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    }
    sessionToRenameId = null;
    renderChatHistory();
};

window.cancelRename = function (event) {
    if (event) event.stopPropagation();
    sessionToRenameId = null;
    renderChatHistory();
};

window.handleRenameKeydown = function (id, event) {
    if (event.key === 'Enter') {
        saveRenameSession(id, event.target.value);
    } else if (event.key === 'Escape') {
        cancelRename(event);
    }
};

// Global scope for delete handler
// Global scope for delete handler (opens modal)
window.deleteChatSession = function (id, event) {
    if (event) event.stopPropagation();
    sessionToDeleteId = id;
    deleteModal.classList.remove('hidden');
    confirmDelete.focus();
};

function closeDeleteDialog() {
    deleteModal.classList.add('hidden');
    sessionToDeleteId = null;
}

function handleConfirmDelete() {
    if (!sessionToDeleteId) return;

    // Loading transition
    confirmDelete.disabled = true;
    confirmDelete.classList.add('loading');
    const originalText = confirmDelete.innerHTML;
    confirmDelete.innerHTML = `
        <svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
        Deleting...
    `;

    // Simulate small delay for visual feedback if local action
    setTimeout(() => {
        chatSessions = chatSessions.filter(s => s.id !== sessionToDeleteId);

        // Save to localStorage
        try {
            localStorage.setItem('ragChatHistory', JSON.stringify(chatSessions));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }

        if (currentSessionId === sessionToDeleteId) {
            startNewChat();
        }

        renderChatHistory();

        confirmDelete.disabled = false;
        confirmDelete.classList.remove('loading');
        confirmDelete.innerHTML = originalText;
        closeDeleteDialog();
    }, 300);
}

function loadSession(sessionId) {
    const session = chatSessions.find(s => s.id === sessionId);
    if (!session) return;

    showChatView();

    currentSessionId = sessionId;
    messages = session.messages || [];

    // Clear and rebuild messages
    messagesWrapper.innerHTML = '';

    messages.forEach(msg => {
        const element = createMessageElement(msg.role, msg.content, false, msg.isError, msg.timestamp);
        if (msg.role === 'assistant') {
            const textDiv = element.querySelector('.message-text');
            if (msg.isError) {
                textDiv.innerHTML = `<span class="error-message">${msg.content}</span>`;
            } else {
                renderMarkdown(textDiv, msg.content, false);
            }
        }
        messagesWrapper.appendChild(element);
        applySeeMore(element, msg.role);
    });

    // If this is the active processing session, re-attach the streaming placeholder
    if (isStreaming && sessionId === processingSessionId) {
        const streamingPlaceholder = createMessageElement('assistant', currentFullResponse, true);
        messagesWrapper.appendChild(streamingPlaceholder);
        const streamingTextDiv = streamingPlaceholder.querySelector('.message-text');
        if (currentFullResponse) {
            streamingTextDiv.innerHTML = '';
            renderMarkdown(streamingTextDiv, currentFullResponse, true);
        }
    }

    renderChatHistory();
    updateLastUserMessageClass();
    updateLastAssistantMessageClass();
    messageInput.value = '';
    handleInputChange();
    scrollToBottom();
}

// ===== Knowledge Modal Functions =====
function openKnowledgeModal() {
    knowledgeModal.classList.remove('hidden');
    knowledgeContent.focus();
}

function closeKnowledgeModal() {
    knowledgeModal.classList.add('hidden');
    knowledgeContent.value = '';
    knowledgeUrl.value = '';
    clearPdfSelection();
    charCount.textContent = '0';
    switchIngestTab('text');
    submitKnowledgeIngest.disabled = true;
    submitKnowledgeIngest.classList.remove('loading');
}

function switchIngestTab(tabId) {
    activeIngestTab = tabId;
    
    // Stop any ongoing speech recognition when switching tabs
    stopSpeechRecognition();
    
    // Update tab UI
    modalTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });

    // Update content UI
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabId}TabContent`);
    });

    handleKnowledgeInputChange();
}

function validateUrl(url) {
    if (!url) return false;
    // Try standard URL parsing first
    try {
        new URL(url);
        return true;
    } catch (e) {
        // If it fails, check if it looks like a domain (e.g., google.com)
        // by prepending https:// and trying again
        try {
            new URL('https://' + url);
            // Simple check to ensure there's at least one dot and something after it
            return url.includes('.') && url.split('.').pop().length >= 2;
        } catch (err) {
            return false;
        }
    }
}

function handlePdfFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
        showToast('error', 'Please select a PDF file');
        return;
    }

    if (file.size > window.CONFIG.UI.MAX_PDF_SIZE_BYTES) { 
        const maxMb = (window.CONFIG.UI.MAX_PDF_SIZE_BYTES / (1024 * 1024)).toFixed(0);
        showToast('error', `File size exceeds ${maxMb}MB limit`);
        return;
    }

    selectedPdfFile = file;
    selectedFileName.textContent = file.name;
    selectedFileSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;

    pdfDragArea.querySelector('.file-upload-content').classList.add('hidden');
    pdfDragArea.querySelector('.file-selected-content').classList.remove('hidden');

    handleKnowledgeInputChange();
}

function clearPdfSelection() {
    selectedPdfFile = null;
    pdfFileInput.value = '';
    pdfDragArea.querySelector('.file-upload-content').classList.remove('hidden');
    pdfDragArea.querySelector('.file-selected-content').classList.add('hidden');
    handleKnowledgeInputChange();
}

function handleKnowledgeInputChange() {
    if (activeIngestTab === 'text') {
        const content = knowledgeContent.value;
        charCount.textContent = content.length.toLocaleString();
        submitKnowledgeIngest.disabled = !content.trim();
    } else if (activeIngestTab === 'url') {
        const url = knowledgeUrl.value.trim();
        submitKnowledgeIngest.disabled = !url || !validateUrl(url);
    } else if (activeIngestTab === 'pdf') {
        submitKnowledgeIngest.disabled = !selectedPdfFile;
    }
}

async function handleKnowledgeIngest() {
    stopSpeechRecognition();
    let body;
    let url = KNOWLEDGE_API_URL;
    let method = 'POST';
    let headers = {};

    if (activeIngestTab === 'text') {
        const content = knowledgeContent.value.trim();
        if (!content) return;
        body = JSON.stringify({ content: content, type: 'TEXT' });
        headers['Content-Type'] = 'application/json';
    } else if (activeIngestTab === 'url') {
        let content = knowledgeUrl.value.trim();
        if (!content || !validateUrl(content)) return;
        // Normalize URL if protocol is missing
        if (!content.startsWith('http://') && !content.startsWith('https://')) {
            content = 'https://' + content;
        }
        body = JSON.stringify({ content: content, type: 'URL' });
        headers['Content-Type'] = 'application/json';
    } else if (activeIngestTab === 'pdf') {
        if (!selectedPdfFile) return;
        url = KNOWLEDGE_CREATE_VIA_PDF_URL;
        body = new FormData();
        body.append('pdf_file', selectedPdfFile);
        // Browser sets Content-Type for FormData automatically
    }

    // Show loading state
    submitKnowledgeIngest.disabled = true;
    submitKnowledgeIngest.classList.add('loading');
    const originalText = submitKnowledgeIngest.innerHTML;
    submitKnowledgeIngest.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
    Ingesting...
`;

    try {
        const options = {
            method: method,
            body: body
        };

        if (Object.keys(headers).length > 0) {
            options.headers = headers;
        }

        const response = await fetch(url, options);
        const responseText = await response.text();
        let result = {};
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            result = { data: responseText };
        }

        if (!response.ok) {
            throw new Error(result.data || result.message || `HTTP error! status: ${response.status}`);
        }

        // Success
        submitKnowledgeIngest.innerHTML = originalText;
        submitKnowledgeIngest.disabled = false;
        submitKnowledgeIngest.classList.remove('loading');

        closeKnowledgeModal();
        showToast('success', result.message || 'Content added successfully!');

        // If history view is active, directly prepend the new item
        if (!dataView.classList.contains('hidden') && result.data && (result.data.id || result.data.hash_id)) {
            // Remove empty state if it exists
            const emptyState = historyList.querySelector('.empty-state');
            if (emptyState) {
                emptyState.remove();
            }
            renderHistoryItems([result.data], true);
        }

    } catch (error) {
        console.error('Ingest error:', error);
        showToast('error', error.message || 'Error: Failed to fetch. May be the server is not running.');

        // Reset button state
        submitKnowledgeIngest.disabled = false;
        submitKnowledgeIngest.classList.remove('loading');
        submitKnowledgeIngest.innerHTML = originalText;
    }
}

function handleUpdateInputChange() {
    const content = updateKnowledgeContent.value;
    updateCharCount.textContent = content.length.toLocaleString();
    submitUpdateKnowledge.disabled = !content.trim();
}

async function handleKnowledgeUpdate() {
    const content = updateKnowledgeContent.value.trim();
    if (!content || !knowledgeToUpdateId) return;

    // Show loading state
    submitUpdateKnowledge.disabled = true;
    submitUpdateKnowledge.classList.add('loading');
    const originalText = submitUpdateKnowledge.innerHTML;
    submitUpdateKnowledge.innerHTML = `
    <svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
    Updating...
`;

    try {
        const resultData = await updateHistoryItem(knowledgeToUpdateId, content);

        if (resultData) {
            closeUpdateKnowledgeDialog();
            showToast('success', 'Knowledge item updated successfully!');

            // Find and update the specific item in the DOM immediately
            const existingItem = document.querySelector(`.history-item[data-id="${knowledgeToUpdateId}"]`);
            if (existingItem) {
                const newItem = createHistoryItemElement(resultData);
                existingItem.replaceWith(newItem);
            } else {
                // If not found (unlikely), fallback to refreshing history
                loadKnowledgeHistory(true);
            }
        }

    } catch (error) {
        console.error('Update error:', error);
        showToast('error', error.message || 'Error updating content. Please try again.');
    } finally {
        submitUpdateKnowledge.innerHTML = originalText;
        submitUpdateKnowledge.disabled = false;
        submitUpdateKnowledge.classList.remove('loading');
    }
}

// ===== Toast Notification =====
function showToast(type, message) {
    // Set icon based on type
    const iconSvg = type === 'success'
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
               <polyline points="22 4 12 14.01 9 11.01"></polyline>
           </svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <circle cx="12" cy="12" r="10"></circle>
               <line x1="15" y1="9" x2="9" y2="15"></line>
               <line x1="9" y1="9" x2="15" y2="15"></line>
           </svg>`;

    toastIcon.innerHTML = iconSvg;
    toastMessage.textContent = message;

    // Remove previous classes and add new ones
    toast.className = 'toast';
    toast.classList.add(type);

    // Show toast with animation
    toast.classList.remove('hidden');
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Hide after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, window.CONFIG.UI.TOAST_DURATION_MS);
}

/* ===== History View ===== */
async function loadKnowledgeHistory(reset = false) {
    if (isHistoryLoading) return;

    if (reset) {
        historyCursor = 0;
        historyList.innerHTML = '';
        historyHasNext = true;
        loadMoreHistoryBtn.classList.add('hidden');

        // Show initial loader in list
        historyList.innerHTML = `
            <div class="empty-state">
                <div class="loader-container">
                    <svg class="spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                    </svg>
                    <p style="margin-top: 12px; opacity: 0.7;">Loading knowledge base...</p>
                </div>
            </div>
        `;
    }

    if (!reset && !historyHasNext) return;

    isHistoryLoading = true;
    loadMoreHistoryBtn.textContent = 'Loading...';
    loadMoreHistoryBtn.disabled = true;

    // Disable plus button while loading
    headerAddKnowledgeBtn.disabled = true;
    const originalAddBtnHTML = headerAddKnowledgeBtn.innerHTML;
    headerAddKnowledgeBtn.innerHTML = `
        <svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
        Loading...
    `;

    if (reset) {
        loadMoreHistoryBtn.classList.add('hidden'); // correct: hide until loaded
    } else {
        loadMoreHistoryBtn.classList.remove('hidden');
    }

    try {
        const url = `${KNOWLEDGE_HISTORY_URL}?after_id=${historyCursor}&size=${historySize}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to load history: ${response.status} `);
        }

        const result = await response.json();

        if (reset) {
            historyList.innerHTML = ''; // Clear the initial loader
        }

        if (reset && (!result.data || !result.data.items || result.data.items.length === 0)) {
            historyList.innerHTML = `
    <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                            <polyline points="13 2 13 9 20 9"></polyline>
                        </svg>
                    </div>
                    <p style="font-weight: 500; font-size: 16px;">No data found</p>
                    <p style="font-size: 14px; opacity: 0.7;">Start by ingesting some knowledge into the base.</p>
                </div>
    `;
        } else {
            renderHistoryItems(result.data.items);
        }

        historyCursor = result.data.next_cursor_id;
        historyHasNext = result.data.has_next;

        if (historyHasNext) {
            loadMoreHistoryBtn.classList.remove('hidden');
        } else {
            loadMoreHistoryBtn.classList.add('hidden');
        }

    } catch (e) {
        const errorMsg = 'Error: Failed to fetch. May be the server is not running.';
        console.error(e);

        if (reset) {
            loadMoreHistoryBtn.classList.add('hidden');
            historyList.innerHTML = `
    <div class="empty-state">
                    <div class="empty-icon" style="color: #ef4444;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <p style="font-weight: 500; font-size: 16px;">No data found</p>
                    <p style="font-size: 14px; opacity: 0.7;">${errorMsg}</p>
                    <button class="btn-primary" onclick="loadKnowledgeHistory(true)" style="margin-top: 16px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M23 4v6h-6"></path>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                        Retry Loading
                    </button>
                </div>
    `;
        } else {
            showToast('error', errorMsg);
            // Don't hide the button so they can try again
        }
    } finally {
        isHistoryLoading = false;
        loadMoreHistoryBtn.textContent = 'Load More';
        loadMoreHistoryBtn.disabled = false;

        // Restore plus button
        headerAddKnowledgeBtn.disabled = false;
        headerAddKnowledgeBtn.innerHTML = originalAddBtnHTML;
    }
}

async function updateHistoryItem(id, newContent) {
    try {
        const url = `${KNOWLEDGE_UPDATE_URL}?id=${id}`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: newContent })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Failed to update item: ${response.status} `);
        }

        const result = await response.json();
        return result.data;
    } catch (e) {
        console.error(e);
        showToast('error', 'Error: Failed to fetch. May be the server is not running.');
        return false;
    }
}

function renderHistoryItems(items, prepend = false) {
    if (!items) return;

    items.forEach(item => {
        const el = createHistoryItemElement(item);
        if (prepend) {
            historyList.prepend(el);
        } else {
            historyList.appendChild(el);
        }
    });
}

function createHistoryItemElement(item) {
    const el = document.createElement('div');
    el.className = 'data-card history-item';
    el.dataset.id = item.id;
    el.dataset.hashId = item.hash_id || '';

    el.style.marginBottom = '12px';
    el.style.textAlign = 'left';
    el.style.alignItems = 'flex-start';
    el.style.cursor = 'default';
    el.style.display = 'block';
    el.style.padding = '20px';
    el.style.width = '100%';
    el.style.maxWidth = '100%';
    el.style.boxSizing = 'border-box';

    el.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">ID: ${item.id}</div>
                ${item.source ? `<span class="source-badge ${item.source.toLowerCase()}">${item.source}</span>` : ''}
            </div>
            <div style="display: flex; gap: 4px;">
                <button class="view-history-btn" title="View Full Content" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
                <button class="view-vector-btn" title="View Vector Chunks" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"></path>
                        <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                        <circle cx="10" cy="14" r="2"></circle>
                        <path d="M6 14h2"></path>
                        <path d="M12 14h6"></path>
                    </svg>
                </button>
                ${(!item.source || item.source === 'TEXT') ? `
                <button class="edit-history-btn" title="Edit" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>` : ''}
                <button class="delete-history-btn" title="Delete" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
        <div class="history-content-wrapper">
            <div class="history-content" style="font-size: 14px; line-height: 1.6; color: var(--text-primary); white-space: pre-wrap; overflow-wrap: break-word;">${escapeHtml(item.content_preview)}</div>
        </div>
        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 11px; color: var(--text-secondary);">
                <strong>Created:</strong> ${formatDate(item.created_at)}
            </div>
            ${item.updated_at ? `
            <div style="font-size: 11px; color: var(--text-secondary);">
                <strong>Updated:</strong> ${formatDate(item.updated_at)}
            </div>` : ''}
        </div>
    `;

    const spinnerSVG = `
        <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
    `;

    // Add view handler
    const viewBtn = el.querySelector('.view-history-btn');
    viewBtn.onclick = async (e) => {
        e.stopPropagation();
        const originalHTML = viewBtn.innerHTML;
        viewBtn.innerHTML = spinnerSVG;
        viewBtn.disabled = true;

        const fullContent = await fetchKnowledgeDetail(item.id);
        if (fullContent) {
            knowledgeDetailContent.textContent = fullContent;
            knowledgeDetailModal.classList.remove('hidden');
            okKnowledgeDetailBtn.focus();
        }

        viewBtn.innerHTML = originalHTML;
        viewBtn.disabled = false;
    };

    // Add vector view handler
    const vectorBtn = el.querySelector('.view-vector-btn');
    vectorBtn.onclick = async (e) => {
        e.stopPropagation();
        const originalHTML = vectorBtn.innerHTML;
        vectorBtn.innerHTML = spinnerSVG;
        vectorBtn.disabled = true;

        try {
            // hash_id may be missing for items loaded from the history list (the /all API doesn't return it)
            // In that case, fetch from the detail endpoint to get the proper hash_id
            let hashId = item.hash_id || item.hashId;
            if (!hashId) {
                const detailUrl = `${KNOWLEDGE_DETAIL_URL}?id=${item.id}`;
                const detailResponse = await fetch(detailUrl);
                if (!detailResponse.ok) throw new Error('Failed to fetch item details for hash_id');
                const detailResult = await detailResponse.json();
                hashId = detailResult.data && detailResult.data.hash_id;
            }
            if (!hashId) throw new Error('Could not resolve hash_id for this knowledge item');
            const response = await fetch(`${KNOWLEDGE_VECTOR_URL}?hash_id=${hashId}`);
            if (!response.ok) throw new Error('Failed to fetch vector data');
            const result = await response.json();

            renderKnowledgeVectorItems(result.data);
            knowledgeVectorModal.classList.remove('hidden');
        } catch (err) {
            console.error(err);
            showToast('error', 'Error fetching vector data');
        } finally {
            vectorBtn.innerHTML = originalHTML;
            vectorBtn.disabled = false;
        }
    };

    // Add edit handler
    const editBtn = el.querySelector('.edit-history-btn');
    if (editBtn) {
        editBtn.onclick = async (e) => {
            e.stopPropagation();
            const originalHTML = editBtn.innerHTML;
            editBtn.innerHTML = spinnerSVG;
            editBtn.disabled = true;
    
            const fullContent = await fetchKnowledgeDetail(item.id);
            if (fullContent) {
                openUpdateKnowledgeModal(item.id, fullContent);
            }
    
            editBtn.innerHTML = originalHTML;
            editBtn.disabled = false;
        };
    }

    // Add delete handler
    const deleteBtn = el.querySelector('.delete-history-btn');
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        knowledgeToDeleteId = item.id;
        knowledgeToDeleteElement = el;
        deleteKnowledgeModal.classList.remove('hidden');
        confirmDeleteKnowledge.focus();
    };

    return el;
}

async function fetchKnowledgeDetail(id) {
    try {
        const url = `${KNOWLEDGE_DETAIL_URL}?id=${id}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch details');
        const result = await response.json();
        return result.data.content;
    } catch (e) {
        console.error(e);
        showToast('error', 'Error fetching details. Please check if server is running.');
        return null;
    }
}

function closeDeleteKnowledgeDialog() {
    deleteKnowledgeModal.classList.add('hidden');
    knowledgeToDeleteId = null;
    knowledgeToDeleteElement = null;
}

function closeKnowledgeDetailDialog() {
    knowledgeDetailModal.classList.add('hidden');
    knowledgeDetailContent.textContent = '';
}

function closeKnowledgeVectorDialog() {
    knowledgeVectorModal.classList.add('hidden');
    knowledgeVectorBody.innerHTML = '';
}

function renderKnowledgeVectorItems(data) {
    if (!data || data.length === 0) {
        knowledgeVectorBody.innerHTML = `
            <div style="padding: 40px; text-align: center; color: var(--text-secondary);">
                No vector data found for this item.
            </div>
        `;
        return;
    }

    knowledgeVectorBody.innerHTML = data.map((chunk, index) => `
        <div style="padding: 24px; border-bottom: 1px solid var(--border-color); background: ${index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">
                <span>Chunk ID: ${chunk.id}</span>
            </div>
            <div style="font-size: 14px; line-height: 1.6; color: var(--text-primary); white-space: pre-wrap; word-break: break-word;">${escapeHtml(chunk.content_chunk)}</div>
            ${chunk.metadata && Object.keys(chunk.metadata).length > 0 ? `
            <div style="margin-top: 12px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; font-size: 12px;">
                <div style="font-weight: 600; margin-bottom: 4px; opacity: 0.7;">Metadata:</div>
                <pre style="margin: 0; white-space: pre-wrap; font-family: monospace; color: var(--accent-secondary);">${JSON.stringify(chunk.metadata, null, 2)}</pre>
            </div>
            ` : ''}
        </div>
    `).join('');
}

function openUpdateKnowledgeModal(id, content) {
    knowledgeToUpdateId = id;
    updateKnowledgeContent.value = content;
    updateCharCount.textContent = content.length.toLocaleString();
    submitUpdateKnowledge.disabled = false;
    updateKnowledgeModal.classList.remove('hidden');
    updateKnowledgeContent.focus();
}

function closeUpdateKnowledgeDialog() {
    updateKnowledgeModal.classList.add('hidden');
    knowledgeToUpdateId = null;
    updateKnowledgeContent.value = '';
    updateCharCount.textContent = '0';
}

async function handleConfirmDeleteKnowledge() {
    if (!knowledgeToDeleteId || !knowledgeToDeleteElement) return;

    // Loading state
    confirmDeleteKnowledge.disabled = true;
    confirmDeleteKnowledge.classList.add('loading');
    const originalText = confirmDeleteKnowledge.innerHTML;
    confirmDeleteKnowledge.innerHTML = `
        <svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
        Deleting...
    `;

    try {
        const url = `${KNOWLEDGE_DELETE_URL}?id=${knowledgeToDeleteId}`;
        const response = await fetch(url, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete item');

        const el = knowledgeToDeleteElement;
        el.style.opacity = '0';
        el.style.transform = 'translateX(20px)';
        el.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            el.remove();
            if (historyList.children.length === 0) {
                loadKnowledgeHistory(true);
            }
        }, 300);

        showToast('success', 'Knowledge item deleted');
        closeDeleteKnowledgeDialog();
    } catch (e) {
        console.error(e);
        showToast('error', 'Error deleting item. Please check if server is running.');
    } finally {
        confirmDeleteKnowledge.disabled = false;
        confirmDeleteKnowledge.classList.remove('loading');
        confirmDeleteKnowledge.innerHTML = originalText;
    }
}



// ===== Speech to Text =====
let currentSpeechTarget = null;
let isStartingRecognition = false;

function toggleSpeechToText(target = 'text') {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('error', 'Failed to start. Your device may not support this feature');
        return;
    }

    if (isRecording || isStartingRecognition) {
        const prevTarget = currentSpeechTarget;
        stopSpeechRecognition();
        
        // If clicking a DIFFERENT speech button while recording, start that one
        if (prevTarget !== target) {
            currentSpeechTarget = target;
            startSpeechRecognition();
        }
    } else {
        currentSpeechTarget = target;
        startSpeechRecognition();
    }
}

function startSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    let activeInput, activeBtn;
    
    if (currentSpeechTarget === 'text') {
        activeInput = knowledgeContent;
        activeBtn = speechBtnText;
    } else if (currentSpeechTarget === 'url') {
        activeInput = knowledgeUrl;
        activeBtn = speechBtnUrl;
    } else if (currentSpeechTarget === 'message') {
        activeInput = messageInput;
        activeBtn = speechBtnMessage;
    }

    if (!activeInput || !activeBtn) return;

    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
        isRecording = true;
        isStartingRecognition = false;
        if (activeBtn) activeBtn.classList.add('recording');
        showToast('success', 'Listening...');
    };

    recognition.onresult = (event) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }

        if (finalTranscript) {
            const currentContent = activeInput.value;
            const separator = currentContent && !currentContent.endsWith(' ') ? ' ' : '';
            activeInput.value = currentContent + separator + finalTranscript;
            
            if (currentSpeechTarget === 'message') {
                handleInputChange(); // Update send button state and textarea height
            } else {
                handleKnowledgeInputChange();
            }
            
            // Auto-scroll for textarea
            if (activeInput.tagName === 'TEXTAREA') {
                activeInput.scrollTop = activeInput.scrollHeight;
            }
        }
    };

    recognition.onerror = (event) => {
        isStartingRecognition = false;
        // Ignore "no-speech" or "aborted" which are common when stopping manually
        if (event.error === 'no-speech' || event.error === 'aborted') {
            stopSpeechRecognition();
            return;
        }
        console.error('Speech recognition error:', event.error);
        stopSpeechRecognition();
        showToast('error', `Microphone error: ${event.error}`);
    };

    recognition.onend = () => {
        isStartingRecognition = false;
        stopSpeechRecognition();
    };

    isStartingRecognition = true;
    recognition.start();
}

function stopSpeechRecognition() {
    isStartingRecognition = false;
    if (recognition) {
        // Remove listeners to prevent recursive loops on manual stop
        recognition.onend = null;
        recognition.onerror = null;
        recognition.stop();
        recognition = null;
    }
    isRecording = false;
    currentSpeechTarget = null;
    if (speechBtnText) speechBtnText.classList.remove('recording');
    if (speechBtnUrl) speechBtnUrl.classList.remove('recording');
    if (speechBtnMessage) speechBtnMessage.classList.remove('recording');
}

// ===== Text to Speech =====
function speakMessage(button) {
    const messageContent = button.closest('.message-content').querySelector('.message-text').innerText;
    
    if (!('speechSynthesis' in window)) {
        showToast('error', 'Failed to start. Your device may not support this feature');
        return;
    }

    // Toggle stop if already speaking
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        if (button.classList.contains('speaking')) {
            resetSpeechButton(button);
            return;
        }
    }

    // Reset all other buttons just in case
    document.querySelectorAll('.listen-msg-btn.speaking').forEach(resetSpeechButton);

    const utterance = new SpeechSynthesisUtterance(messageContent);
    const voices = window.speechSynthesis.getVoices();
    
    if (voices.length > 0) {
        // Keywords common to male voices across different OS/browsers
        const maleKeywords = ['male', 'guy', 'david', 'mark', 'ravi', 'peter', 'thomas', 'guy'];
        
        let preferredVoice = voices.find(v => {
            const name = v.name.toLowerCase();
            return v.lang.startsWith('en') && maleKeywords.some(keyword => name.includes(keyword));
        });

        // Fallback to natural English voices if no specific male voice is found
        if (!preferredVoice) {
            preferredVoice = voices.find(v => (v.name.includes('Google') || v.name.includes('Natural')) && v.lang.startsWith('en')) || 
                             voices.find(v => v.lang.startsWith('en')) || 
                             voices[0];
        }
        
        utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
        button.classList.add('speaking');
        button.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
        `;
        showToast('success', 'Playing transcription...');
    };

    utterance.onend = () => {
        resetSpeechButton(button);
    };

    utterance.onerror = (event) => {
        console.error('SpeechSynthesis error', event);
        resetSpeechButton(button);
    };

    window.speechSynthesis.speak(utterance);
}

function resetSpeechButton(button) {
    button.classList.remove('speaking');
    button.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
    `;
}

function stopAllSpeech() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        document.querySelectorAll('.listen-msg-btn.speaking').forEach(resetSpeechButton);
    }
    
    // Also stop STT if active
    stopSpeechRecognition();
}




