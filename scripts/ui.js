import * as State from './state.js';
import * as V from './validators.js';
import { compileRegex, highlight } from './search.js';

let currentSort = { field: 'date', dir: 'desc' };

function $(sel) { return document.querySelector(sel); }

export function renderDashboard(state) {
	const totalTransactions = state.records.length;
	const totalAmount = state.records.reduce((s, r) => s + Number(r.amount || 0), 0);
	$('#total-transactions').textContent = totalTransactions;
	$('#total-amount').textContent = `$${totalAmount.toFixed(2)}`;

	const cats = {};
	state.records.forEach(r => { cats[r.category] = (cats[r.category] || 0) + r.amount; });
	const top = Object.keys(cats).sort((a,b)=>cats[b]-cats[a])[0] || '-';
	$('#top-category').textContent = top;

	const totals = State.last7Totals(); 
	const last7Total = totals.reduce((s,v)=>s+v,0);
	$('#last-week-total').textContent = `$${last7Total.toFixed(2)}`;

	const chart = $('#trend-chart');
	if (chart) {
		chart.innerHTML = '';
		const max = Math.max(...totals, 1);
		totals.forEach((value, i) => {
			const bar = document.createElement('div');
			bar.className = 'chart-bar';
			const heightPct = (value / max) * 100;
			bar.style.height = Math.max(6, heightPct) + '%'; 
			const d = new Date();
			const label = d.toLocaleDateString(undefined, { weekday: 'short' });
			const labelEl = document.createElement('div');
			labelEl.className = 'chart-label';
			labelEl.textContent = label;
			bar.setAttribute('role', 'img');
			bar.setAttribute('aria-label', `${label}: $${value.toFixed(2)}`);
			chart.appendChild(bar);
			chart.appendChild(labelEl);
		});
	}
}

export function renderRecords(state, pattern=null) {
	const tbody = $('#transactions-body');
	tbody.innerHTML = '';

	const re = pattern ? compileRegex(pattern) : null;

	let records = [...state.records];
	records.sort((a,b)=>{
		const f = currentSort.field;
		if (f === 'amount') return currentSort.dir === 'asc' ? a.amount - b.amount : b.amount - a.amount;
		if (f === 'description') return currentSort.dir === 'asc' ? a.description.localeCompare(b.description) : b.description.localeCompare(a.description);
		return currentSort.dir === 'asc' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date);
	});

	if (!records.length) {
		$('#empty-state').hidden = false;
	} else {
		$('#empty-state').hidden = true;
	}

	records.forEach(rec => {
		const tr = document.createElement('tr');
		const descHtml = re ? highlight(rec.description, re) : escapeHtml(rec.description);
		tr.innerHTML = `
			<td>${escapeHtml(rec.date)}</td>
			<td>${descHtml}</td>
			<td>$${Number(rec.amount).toFixed(2)}</td>
			<td>${escapeHtml(rec.category)}</td>
			<td>
				<button data-id="${rec.id}" class="edit-btn">Edit</button>
				<button data-id="${rec.id}" class="delete-btn">Delete</button>
			</td>
		`;
		tbody.appendChild(tr);
	});

	tbody.querySelectorAll('.edit-btn').forEach(b => b.addEventListener('click', (e)=>{ 
		const id = e.currentTarget ? e.currentTarget.getAttribute('data-id') : (e.target && e.target.getAttribute && e.target.getAttribute('data-id')); 
		const rec = state.records.find(r=>r.id===id); 
		if (rec) { 
			populateForm(rec); 
			showPage('form'); 
		} 
	}));

	tbody.querySelectorAll('.delete-btn').forEach(b => b.addEventListener('click', (e)=>{ 
		const id = e.currentTarget ? e.currentTarget.getAttribute('data-id') : (e.target && e.target.getAttribute && e.target.getAttribute('data-id')); 
		if (confirm('Delete this transaction?')) { 
			State.deleteRecord(id); 
		} 
	}));
}

function populateForm(rec) {
	$('#description').value = rec.description;
	$('#amount').value = rec.amount;
	$('#category').value = rec.category;
	$('#date').value = rec.date;
	$('#submit-btn').textContent = 'Save Changes';
	$('#transaction-form').setAttribute('data-edit-id', rec.id);
	$('#description').focus();
}

export function bindUI() {
	setupNavigation();

	try {
		const btn = document.getElementById('theme-toggle');
		const settings = State.getSettings();
		const initialDark = settings && settings.theme === 'dark';
		if (initialDark) document.documentElement.classList.add('dark');
		if (btn) {
			btn.setAttribute('aria-pressed', initialDark ? 'true' : 'false');
			btn.textContent = initialDark ? '☀️' : '🌙';
			btn.addEventListener('click', ()=>{
				const isDark = document.documentElement.classList.toggle('dark');
				const s = State.getSettings(); s.theme = isDark ? 'dark' : 'light'; State.saveSettings(s);
				btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
				btn.textContent = isDark ? '☀️' : '🌙';
			});
		}
	} catch (e) {}

	$('#transaction-form').addEventListener('submit', (e)=>{
		e.preventDefault();
		try {
			const raw = {
				description: $('#description') ? $('#description').value : '',
				amount: $('#amount') ? $('#amount').value : '',
				category: $('#category') ? $('#category').value : '',
				date: $('#date') ? $('#date').value : ''
			};

			['description','amount','category','date'].forEach(f=>{ const el = $(`#${f}-error`); if (el) el.textContent = ''; });

			const desc = V.validateDescription(raw.description);
			if (!desc.valid) { $('#description-error').textContent = desc.message; $('#description').focus(); return; }
			const amt = V.validateAmount(raw.amount);
			if (!amt.valid) { $('#amount-error').textContent = amt.message; $('#amount').focus(); return; }
			const dt = V.validateDate(raw.date);
			if (!dt.valid) { $('#date-error').textContent = dt.message; $('#date').focus(); return; }
			const cat = V.validateCategory(raw.category);
			if (!cat.valid) { $('#category-error').textContent = cat.message; $('#category').focus(); return; }

			const data = {
				description: V.normalizeDescription(raw.description),
				amount: Number(amt.value),
				category: raw.category,
				date: raw.date
			};

			const editId = $('#transaction-form').getAttribute('data-edit-id');
			if (editId) {
				State.updateRecord(editId, data);
				$('#transaction-form').removeAttribute('data-edit-id');
				$('#submit-btn').textContent = 'Add Transaction';
				$('#form-status').textContent = 'Updated Successfully✅';
			} else {
				State.addRecord(data);
				$('#form-status').textContent = 'Added Successfully✅';
				$('#transaction-form').reset();
			}
		} catch (err) {
			console.error('Error handling form submit', err);
			$('#form-status').textContent = 'Error: see console';
		}
	});

	function doSearch() {
		const v = $('#search-input').value.trim();
		const flags = $('#search-case').checked ? 'i' : '';
		if (!v) {
			renderRecords(State.getState());
			$('#search-error').textContent = '';
			return;
		}
		const re = compileRegex(v, flags);
		if (!re) { $('#search-error').textContent = 'Invalid regex'; return; }
		$('#search-error').textContent = '';
		renderRecords(State.getState(), v);
	}

	$('#search-input').addEventListener('input', doSearch);
	$('#search-case').addEventListener('change', doSearch);

	$('#clear-search').addEventListener('click', ()=>{ $('#search-input').value=''; $('#search-input').dispatchEvent(new Event('input')); });

	document.querySelectorAll('th.sortable').forEach(th=>{
		th.addEventListener('click', ()=>{
			const field = th.getAttribute('data-sort');
			if (currentSort.field === field) currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
			else { currentSort.field = field; currentSort.dir = 'asc'; }
			renderRecords(State.getState(), $('#search-input').value || null);
		});
	});

	$('#export-data').addEventListener('click', ()=>{
		const data = { records: State.getState().records, settings: State.getSettings() };
		const str = JSON.stringify(data, null, 2);
		const blob = new Blob([str], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url; a.download = 'finance-export.json';
		a.click();
		URL.revokeObjectURL(url);
	});

	$('#import-data').addEventListener('click', ()=>{ $('#import-file').click(); });
	$('#import-file').addEventListener('change', (e)=>{
		const f = e.target.files[0];
		if (!f) return;
		const r = new FileReader();
		r.onload = (ev)=>{
			const res = window.storageImport ? window.storageImport(ev.target.result) : null;
			try {
				const parsed = JSON.parse(ev.target.result);
				if (Array.isArray(parsed)) {
					State.clearAll();
					parsed.forEach(p=>State.addRecord(p));
					$('#import-status').textContent = 'Imported successfully';
				} else if (parsed.records) {
					State.clearAll();
					parsed.records.forEach(p=>State.addRecord(p));
					if (parsed.settings) State.saveSettings(parsed.settings);
					$('#import-status').textContent = 'Imported successfully (with settings)';
				} else {
					$('#import-status').textContent = 'Imported JSON must include records array';
				}
			} catch (err) { $('#import-status').textContent = 'Invalid JSON'; }
		};
		r.readAsText(f);
	});

	$('#clear-data').addEventListener('click', ()=>{
		if (confirm('Clear all data?')) State.clearAll();
	});

	$('#set-budget').addEventListener('click', ()=>{
		const v = Number($('#monthly-budget').value || 0);
		if (v > 0) {
			const settings = State.getSettings();
			settings.monthlyBudget = v;
			State.saveSettings(settings);
			updateBudgetDisplay();
		}
	});

	function updateBudgetDisplay() {
		const settings = State.getSettings();
		const budget = Number(settings.monthlyBudget || 0);
		if (!budget) { $('#budget-display').hidden = true; return; }
		$('#budget-display').hidden = false;
		const spent = State.totalAmount();
		const pct = Math.min(100, (spent / budget) * 100);
		$('#budget-progress').style.width = pct + '%';
		$('#budget-text').textContent = `Spent $${spent.toFixed(2)} of $${budget.toFixed(2)}`;

		const balance = +(budget - spent).toFixed(2);
		const balanceEl = $('#budget-balance');
		if (balanceEl) {
			balanceEl.textContent = balance >= 0 ? `Balance $${balance.toFixed(2)}` : `Balance -$${Math.abs(balance).toFixed(2)}`;
			balanceEl.classList.toggle('negative', balance < 0);
			balanceEl.classList.toggle('positive', balance >= 0);
		}
		$('#budget-status').textContent = pct < 100 ? 'Under budget' : 'Over budget';
		const alert = $('#budget-alert');
		if (pct >= 100) { alert.textContent = 'Budget exceeded'; alert.classList.remove('sr-only'); }
		else { alert.textContent = ''; alert.classList.add('sr-only'); }
	}

	$('#save-currency').addEventListener('click', ()=>{
		const base = $('#base-currency').value;
		const eur = Number($('#exchange-rate-usd').value || 1);
		const gbp = Number($('#exchange-rate-gbp').value || 1);
		State.saveSettings({ baseCurrency: base, rates: { EUR: eur, GBP: gbp } });
		$('#import-status').textContent = 'Settings Saved Successfully✅';
	});

	updateBudgetDisplay();

	State.subscribe(s => {
		renderDashboard(s);
		renderRecords(s, $('#search-input').value || null);
	});

	function isTyping(e) {
		const tag = (e.target && e.target.tagName) || '';
		return ['INPUT','TEXTAREA','SELECT'].includes(tag);
	}

	document.addEventListener('keydown', (e)=>{
		if (isTyping(e)) return; 

		function isInForm() {
			const active = document.activeElement;
			const form = document.getElementById('transaction-form');
			return form && (form.contains(active) || form.classList.contains('active') || form.getAttribute('data-edit-id') !== null);
		}

		if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
			if (isInForm()) {
				e.preventDefault();
				const form = document.getElementById('transaction-form');
				if (form) form.requestSubmit ? form.requestSubmit() : form.submit();
			}
			return;
		}

		if (e.key === '/') {
			e.preventDefault();
			const s = document.getElementById('search-input');
			if (s) s.focus();
			return;
		}

		if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
			e.preventDefault();
			showPage('settings');
			return;
		}

		if (e.key.toLowerCase() === 'n') { showPage('form'); return; }
		if (e.key.toLowerCase() === 't') { showPage('transactions'); return; }
		if (e.key.toLowerCase() === 'd') { showPage('dashboard'); return; }
	});
}

function setupNavigation() {
	const toggle = document.querySelector('.dropdown-toggle');
	const menu = document.querySelector('.dropdown-menu');
	if (toggle && menu) {
		toggle.addEventListener('click', (e)=>{
			const isOpen = menu.classList.toggle('open');
			toggle.setAttribute('aria-expanded', String(isOpen));
		});

		document.addEventListener('click', (e)=>{
			if (!menu.contains(e.target) && !toggle.contains(e.target)) {
				menu.classList.remove('open');
				toggle.setAttribute('aria-expanded','false');
			}
		});
	}

	document.querySelectorAll('a[data-page]').forEach(a=>{
		a.addEventListener('click', (e)=>{
			e.preventDefault();
			const page = a.getAttribute('data-page');
			navigateToPage(page);
			if (menu) { menu.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); }
		});
	});

	window.addEventListener('popstate', (e)=>{
		const page = e.state?.page || (location.hash ? location.hash.slice(1) : 'dashboard');
		showPage(page, { pushState: false });
	});

	const initial = location.hash ? location.hash.slice(1) : 'dashboard';
	showPage(initial, { pushState: false });
}

export function showPage(page='dashboard', opts = { pushState: true }) {
	const sections = document.querySelectorAll('.page-section');
	sections.forEach(s => s.classList.remove('active','fade-in'));
	const target = document.getElementById(`${page}-section`);
	if (target) {
		target.classList.add('active');
		setTimeout(()=> target.classList.add('fade-in'), 50);
	}

	document.querySelectorAll('a[data-page]').forEach(a=>{
		if (a.getAttribute('data-page') === page) a.setAttribute('aria-current','page');
		else a.removeAttribute('aria-current');
	});

	if (opts.pushState) history.pushState({ page }, '', `${location.pathname}#${page}`);
}

function navigateToPage(page) {
	showPage(page, { pushState: true });
}

function escapeHtml(str){
	return String(str)
		.replace(/&/g,'&amp;')
		.replace(/</g,'&lt;')
		.replace(/>/g,'&gt;')
		.replace(/"/g,'&quot;')
		.replace(/'/g,'&#39;');
}
