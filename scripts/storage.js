// A simple localStorage wrapper for the Finance Tracker Application
const KEY = 'finance:data:v1';

const SETTINGS_KEY = 'finance:settings:v1';

function safeParse(json) {
	try {
		return JSON.parse(json);
	} catch (e) {
		return null;
	}
}

export function load() {
	if (typeof localStorage === 'undefined') return [];
	const raw = localStorage.getItem(KEY);
	if (!raw) return [];
	const data = safeParse(raw);
	return Array.isArray(data) ? data : [];
}

export function save(data) {
	if (typeof localStorage === 'undefined') return false;
	try {
		localStorage.setItem(KEY, JSON.stringify(data));
		return true;
	} catch (e) {
		console.error('Failed to save data', e);
		return false;
	}
}

export function exportJSON(data) {
	try {
		return JSON.stringify(data, null, 2);
	} catch (e) {
		return null;
	}
}

export function importJSON(jsonString) {
	const parsed = safeParse(jsonString);
	if (!parsed) return { ok: false, error: 'Invalid JSON' };

	// Accepts either an array or an object
	const records = Array.isArray(parsed) ? parsed : parsed.records;
	const settings = parsed.settings;

	if (!Array.isArray(records)) return { ok: false, error: 'JSON must include an array of records' };

	const errors = [];
	records.forEach((r, i) => {
		if (typeof r.id !== 'string') errors.push(`record[${i}].id missing or not a string`);
		if (typeof r.description !== 'string') errors.push(`record[${i}].description missing or not a string`);
		if (typeof r.amount !== 'number') errors.push(`record[${i}].amount missing or not a number`);
		if (typeof r.category !== 'string') errors.push(`record[${i}].category missing or not a string`);
		if (typeof r.date !== 'string') errors.push(`record[${i}].date missing or not a string`);
	});

	if (errors.length) return { ok: false, error: errors.join('; ') };
	return { ok: true, data: records, settings: settings };
}

// Ensures settings persistence
export function loadSettings() {
	if (typeof localStorage === 'undefined') return {};
	const raw = localStorage.getItem(SETTINGS_KEY);
	if (!raw) return {};
	return safeParse(raw) || {};
}

export function saveSettings(settings) {
	if (typeof localStorage === 'undefined') return false;
	try {
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
		return true;
	} catch (e) {
		console.error('Failed to save settings', e);
		return false;
	}
}

