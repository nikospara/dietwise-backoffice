import type { AppConfig } from './model';
import { FALLBACK_APP_CONFIG } from './model';

function nonEmptyString(value: unknown): string | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}
	const result = value.trim();
	return result.length > 0 ? result : undefined;
}

function readEnvConfig(): Partial<AppConfig> {
	return {
		authServerHost: nonEmptyString(import.meta.env.VITE_AUTH_SERVER_HOST),
		apiServerHost: nonEmptyString(import.meta.env.VITE_API_SERVER_HOST),
		oidcClientId: nonEmptyString(import.meta.env.VITE_OIDC_CLIENT_ID),
	};
}

async function readRuntimeConfig(): Promise<Partial<AppConfig>> {
	const basePath = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
	const configUrl = `${basePath}config.json`;
	try {
		const response = await fetch(configUrl, { cache: 'no-store' });
		if (!response.ok) {
			return {};
		}
		const json = (await response.json()) as Record<string, unknown>;
		return {
			authServerHost: nonEmptyString(json.authServerHost),
			apiServerHost: nonEmptyString(json.apiServerHost),
			oidcClientId: nonEmptyString(json.oidcClientId),
		};
	} catch (_e) {
		return {};
	}
}

export async function loadAppConfig(): Promise<AppConfig> {
	const runtimeConfig = await readRuntimeConfig();
	return Object.assign({}, FALLBACK_APP_CONFIG, readEnvConfig(), runtimeConfig);
}
