export const req = async (url, options = {}) =>
	await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options, ...(options.body ? { body: JSON.stringify(options.body) } : {}) }).then(response => response.json());

export const GET = async (url, options = {}) => await req(url, { method: 'GET', ...options });

export const POST = async (url, options = {}) => await req(url, { method: 'POST', ...options });

export const PUT = async (url, options = {}) => await req(url, { method: 'PUT', ...options });

export const DELETE = async (url, options = {}) => await req(url, { method: 'DELETE', ...options });
