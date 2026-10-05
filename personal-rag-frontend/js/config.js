// ===== App Configuration =====
(function () {
    const BASE_URL = 'http://localhost:8080';

    window.CONFIG = {
        // API Endpoints
        API: {
            BASE_URL: BASE_URL,
            CHAT: BASE_URL + '/knowledge/ask',
            INGEST: BASE_URL + '/knowledge/create',
            UPDATE: BASE_URL + '/knowledge/update',
            DELETE: BASE_URL + '/knowledge/delete',
            HISTORY: BASE_URL + '/knowledge/all',
            DETAIL: BASE_URL + '/knowledge/id',
            VECTOR: BASE_URL + '/knowledge/vector',
            CREATE_VIA_PDF: BASE_URL + '/knowledge/create/pdf'
        },

        // UI Settings (All durations in milliseconds)
        UI: {
            TOAST_DURATION_MS: 1500,
            COPY_FEEDBACK_DURATION_MS: 500,
            SCROLL_DELAY_MS: 50,
            MAX_CHAT_SESSIONS: 20,
            HISTORY_PAGE_SIZE: 20,
            MAX_PDF_SIZE_BYTES: 5 * 1024 * 1024 // 5MB
        },

        // Markdown & Code Highlighting
        MARKDOWN: {
            LINE_BREAKS: true,
            GITHUB_FLAVORED_MARKDOWN: true // GFM: GitHub Flavored Markdown for better table/list rendering
        }
    };
})();
