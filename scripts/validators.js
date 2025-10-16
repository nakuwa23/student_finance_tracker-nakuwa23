// The necessary validators for the Student Finance Tracker Application
export const patterns = {
	description: /^\S(?:.*\S)?$/,
	amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
	date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
	category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
	duplicateWord: /\b(\w+)\s+\1\b/
};

export function normalizeDescription(s) {
	if (typeof s !== 'string') return '';
	return s.replace(/\s{2,}/g, ' ').trim();
}

export function validateDescription(s) {
	const value = normalizeDescription(s);
	const ok = patterns.description.test(value);
	return { valid: ok, value, message: ok ? null : 'Description cannot have leading/trailing spaces' };
}

export function validateAmount(v) {
	const str = String(v);
	const ok = patterns.amount.test(str);
	return { valid: ok, value: ok ? Number(str) : null, message: ok ? null : 'Amount must be a number with up to 2 decimals' };
}

export function validateDate(s) {
	const ok = patterns.date.test(s);
	return { valid: ok, message: ok ? null : 'Date must be YYYY-MM-DD' };
}

export function validateCategory(s) {
	const ok = patterns.category.test(s);
	return { valid: ok, message: ok ? null : 'Category must be letters, spaces or hyphens' };
}

export function validateRecord(rec) {
	const errors = [];
	const d = validateDescription(rec.description);
	if (!d.valid) errors.push({ field: 'description', message: d.message });
	const a = validateAmount(rec.amount);
	if (!a.valid) errors.push({ field: 'amount', message: a.message });
	const dt = validateDate(rec.date);
	if (!dt.valid) errors.push({ field: 'date', message: dt.message });
	const c = validateCategory(rec.category);
	if (!c.valid) errors.push({ field: 'category', message: c.message });
	return { ok: errors.length === 0, errors };
}


