import * as State from './state.js';
import * as UI from './ui.js';

async function loadSeed() {
    try {
        const res = await fetch('../seed.json');
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.warn('Could not load seed.json', e);
        return [];
    }
}

async function initApp() {
    const seed = await loadSeed();
    State.init(seed);
    UI.bindUI();
    try { const storage = await import('./storage.js'); window.storageImport = storage.importJSON; } catch(e){}
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initApp();
        window.financeApp = { State, UI };
    });
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = { State };
}
