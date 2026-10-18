import { nanoid } from 'nanoid';

import database from '.';

// A key a plain object inherits or that reaches its prototype is never a stored entry
const isSafeKey = key => typeof key === 'string' && !['__proto__', 'constructor', 'prototype'].includes(key);

export const createCRUD = (collection, fields, hooks = {}) => ({
	get data() {
		return database.db.data[collection];
	},
	// Own keys only: `data.toString` is inherited by every plain object, and `__proto__` reaches its prototype
	has(id) {
		return isSafeKey(id) && Object.hasOwn(this.data, id);
	},
	async create(data) {
		let id = nanoid(12);

		while (this.has(id)) id = nanoid(12);

		const entry = { ...Object.fromEntries(fields.map(f => [f, data[f] ?? ''])), id };

		if (hooks.beforeCreate) await hooks.beforeCreate(entry, data);

		this.data[id] = entry;
		await database.write();

		return entry;
	},
	read({ id } = {}) {
		if (id) return this.has(id) ? this.data[id] : false;

		return this.data;
	},
	async update({ id, update }) {
		if (!this.has(id)) return false;

		if (hooks.beforeUpdate) await hooks.beforeUpdate(update);

		const filtered = Object.fromEntries(fields.map(f => [f, update[f]]).filter(([, v]) => v !== undefined));

		this.data[id] = { ...this.data[id], ...filtered };
		await database.write();

		return this.data[id];
	},
	async delete({ id, ...options }) {
		if (!this.has(id)) return false;

		const entry = this.data[id];

		delete this.data[id];

		try {
			if (hooks.afterDelete) await hooks.afterDelete(id, options);
		} catch (error) {
			this.data[id] = entry;
			throw error;
		}

		await database.write();

		return id;
	},
});
