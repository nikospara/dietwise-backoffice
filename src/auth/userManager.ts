import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import type { UserManagerSettings } from 'oidc-client-ts';
import type { AppConfig } from '@/config/model';

let userManager: UserManager | null = null;

function buildSettings(config: AppConfig): UserManagerSettings {
	const appBaseUrl = `${window.location.origin}${import.meta.env.BASE_URL}`;
	return {
		authority: config.authServerHost,
		client_id: config.oidcClientId,
		redirect_uri: appBaseUrl,
		post_logout_redirect_uri: appBaseUrl,
		response_type: 'code',
		scope: 'openid profile email',
		automaticSilentRenew: true,
		userStore: new WebStorageStateStore({ store: window.localStorage }),
	};
}

export function configureUserManager(config: AppConfig): UserManager {
	userManager = new UserManager(buildSettings(config));
	return userManager;
}

export function getUserManager(): UserManager {
	if (!userManager) {
		throw new Error('UserManager has not been configured. Call configureUserManager() during bootstrap.');
	}
	return userManager;
}

/**
 * Returns a currently valid access token, transparently refreshing it when it has expired.
 * Returns undefined when there is no authenticated session or the refresh failed.
 */
export async function getAccessToken(): Promise<string | undefined> {
	const manager = getUserManager();
	let user = await manager.getUser();
	if (user && user.expired) {
		try {
			user = await manager.signinSilent();
		} catch (_e) {
			return undefined;
		}
	}
	return user?.access_token;
}

/** Removes the OIDC response query parameters from the URL once the login redirect has been processed. */
export function onSigninCallback(): void {
	window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
}
