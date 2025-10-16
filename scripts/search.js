export function compileRegex(input, flags = 'i') {
    if (!input) return null;
    try {
        // Allows the user to provide regex with slashes for instance: /pattern/
        if (input.startsWith('/') && input.lastIndexOf('/') > 0) {
            const last = input.lastIndexOf('/');
            const pattern = input.slice(1, last);
            const userFlags = input.slice(last + 1) || flags;
            return new RegExp(pattern, userFlags);
        }
        return new RegExp(input, flags);
    } catch (e) {
        return null;
    }
}

export function highlight(text, re) {
    if (!re || !text) return escapeHtml(text || '');
    const escaped = escapeHtml(text);
    return escaped.replace(re, (m) => `<mark>${escapeHtml(m)}</mark>`);
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
