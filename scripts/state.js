import * as Storage from './storage.js';

let state = {
	records: [],
	settings: {
		baseCurrency: 'USD',
		rates: { EUR: 1, GBP: 1 }
	}
};

const subscribers = new Set();
let idCounter = 1;

function generateId() {
	const id = `txn_${String(Date.now()).slice(-6)}_${idCounter}`;
	idCounter += 1;
	return id;
}

function nowISO() {
	return new Date().toISOString();
}

export function init(seed) {
	const loaded = Storage.load();
	const settings = Storage.loadSettings();
	if (settings && Object.keys(settings).length) state.settings = { ...state.settings, ...settings };
	if (Array.isArray(loaded) && loaded.length) {
		state.records = loaded;
	} else if (Array.isArray(seed) && seed.length) {
		state.records = seed;
		Storage.save(state.records);
	}
	notify();
}

export function getState() {
	return { ...state, records: [...state.records] };
}

export function subscribe(cb) {
	subscribers.add(cb);
	return () => subscribers.delete(cb);
}

function notify() {
	subscribers.forEach(cb => {
		try { cb(getState()); } catch (e) { console.error(e); }
	});
}

export function addRecord({ description, amount, category, date }) {
	const rec = {
		id: generateId(),
		description: String(description).trim(),
		amount: Number(amount),
		category: String(category),
		date: String(date),
		createdAt: nowISO(),
		updatedAt: nowISO()
	};
	state.records.unshift(rec);
	Storage.save(state.records);
	notify();
	return rec;
}

export function updateRecord(id, updates = {}) {
	const idx = state.records.findIndex(r => r.id === id);
	if (idx === -1) return null;
	const updated = { ...state.records[idx], ...updates, updatedAt: nowISO() };
	state.records[idx] = updated;
	Storage.save(state.records);
	notify();
	return updated;
}

export function deleteRecord(id) {
	const idx = state.records.findIndex(r => r.id === id);
	if (idx === -1) return false;
	state.records.splice(idx, 1);
	Storage.save(state.records);
	notify();
	return true;
}

export function clearAll() {
	state.records = [];
	Storage.save(state.records);
	notify();
}

// Settings getters
export function getSettings() {
	return { ...state.settings };
}

export function saveSettings(settings) {
	state.settings = { ...state.settings, ...settings };
	Storage.saveSettings(state.settings);
	notify();
}

// Statistics helpers
export function totalAmount() {
	return state.records.reduce((s, r) => s + Number(r.amount || 0), 0);
}

export function topCategory() {
	const map = {};
	state.records.forEach(r => { map[r.category] = (map[r.category] || 0) + r.amount; });
	return Object.keys(map).sort((a,b)=>map[b]-map[a])[0] || null;
}

export function last7Totals() {
	const now = new Date();
	const days = Array.from({ length: 7 }, (_, i) => ({ day: i, total: 0 }));
	state.records.forEach(r => {
		const d = new Date(r.date);
		const diff = Math.floor((now - d) / (24*60*60*1000));
		if (diff >=0 && diff < 7) days[6 - diff].total += Number(r.amount || 0);
	});
	return days.map(d=>d.total);
}

