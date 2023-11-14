import { nanoid } from 'nanoid';

export const cacheOptions = {
	enabled: true,
	staleTime: 60 * 1000,
};

export const cache = {};
export const subscriptions = {};

export const request = async (url, options = {}) => {
	const { invalidateAfter = cacheOptions.staleTime, invalidates, cache: useCache = invalidates ? false : cacheOptions.enabled, isRefetch, onRefetch, enabled = true, ...fetchOptions } = options;

	if (!enabled) return {};

	const id = options.id || options.method + url;

	if (isRefetch && cache[id]) cache[id] = undefined;

	if (useCache && cache[id]) return cache[id].response;

	let response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...fetchOptions, ...(options.body ? { body: JSON.stringify(options.body) } : {}) });

	const refetch = async () => await request.call(this, url, { isRefetch: true, ...options });
	const success = response.status % 200 < 100;
	const contentType = response.headers.get('content-type');

	response = { response, contentType, body: await (contentType && contentType.includes('application/json') ? response.json() : response.text()), success, refetch };

	if (success && invalidates) {
		Object.entries(subscriptions).forEach(([_id, { refetch }]) => {
			if (
				invalidates.some(invalidate => {
					if (Array.isArray(_id)) {
						return Array.isArray(invalidate) ? invalidate === _id : _id.includes(invalidate);
					} else {
						return Array.isArray(invalidate) ? false : _id === invalidate;
					}
				})
			) {
				refetch();
			}
		});
	}

	const invalidate = () => {
		cache[id] = undefined;
	};

	if (useCache) {
		if (cache[id]?.timeout) clearTimeout(cache[id].timeout);

		cache[id] = { invalidate, response };
		response.invalidate = invalidate;

		if (invalidateAfter) cache[id].timeout = setTimeout(invalidate, invalidateAfter);
	}

	if (subscriptions[id]) {
		Object.values(subscriptions[id]).forEach(({ onRefetch: listener }) => listener?.(response));
	}

	if (onRefetch) {
		if (isRefetch) onRefetch(response);
		else {
			const subscriptionId = nanoid(5);
			const unsubscribe = () => {
				delete subscriptions[id][subscriptionId];
			};

			subscriptions[id] = subscriptions[id] || { refetch };
			subscriptions[id][subscriptionId] = {
				onRefetch: () => {
					unsubscribe();
					onRefetch();
				},
				unsubscribe,
			};
			response.unsubscribe = unsubscribe;
		}
	}

	return response;
};

export const GET = async (url, options = {}) => await request(url, { method: 'GET', ...options });

export const POST = async (url, options = {}) => await request(url, { method: 'POST', ...options });

export const PUT = async (url, options = {}) => await request(url, { method: 'PUT', ...options });

export const PATCH = async (url, options = {}) => await request(url, { method: 'PATCH', ...options });

export const DELETE = async (url, options = {}) => await request(url, { method: 'DELETE', ...options });
