import { getAccessToken } from '@/auth/userManager';

let apiServerHost = '';

export function configureApiServerHost(host: string): void {
	apiServerHost = host.replace(/\/+$/, '');
}

export class ApiError extends Error {
	constructor(
		public readonly status: number,
		message: string,
		public readonly body?: unknown,
	) {
		super(message);
		this.name = 'ApiError';
	}
}

/**
 * Fetches JSON from the DietWise API, attaching the current bearer token.
 * Throws {@link ApiError} on non-2xx responses. Returns undefined for 204 responses.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
	const accessToken = await getAccessToken();
	const headers = new Headers(options.headers);
	headers.set('Accept', 'application/json');
	if (options.body != null && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}
	if (accessToken) {
		headers.set('Authorization', `Bearer ${accessToken}`);
	}

	const response = await fetch(`${apiServerHost}${path}`, { ...options, headers });

	if (!response.ok) {
		let body: unknown;
		try {
			body = await response.json();
		} catch (_e) {
			body = await response.text().catch(() => undefined);
		}
		throw new ApiError(response.status, `Request to ${path} failed with status ${response.status}`, body);
	}

	if (response.status === 204) {
		return undefined as T;
	}
	return (await response.json()) as T;
}
