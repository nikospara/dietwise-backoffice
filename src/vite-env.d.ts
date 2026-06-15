/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_AUTH_SERVER_HOST?: string;
	readonly VITE_API_SERVER_HOST?: string;
	readonly VITE_OIDC_CLIENT_ID?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
