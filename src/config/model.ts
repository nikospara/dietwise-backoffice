export interface AppConfig {
	authServerHost: string;
	apiServerHost: string;
	oidcClientId: string;
}

export const FALLBACK_APP_CONFIG: AppConfig = Object.freeze({
	authServerHost: 'http://localhost:8280/realms/dietwise',
	apiServerHost: 'http://localhost:8180/api/v1',
	oidcClientId: 'backoffice',
});
