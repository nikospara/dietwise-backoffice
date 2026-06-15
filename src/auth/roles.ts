export const BACKOFFICE_ROLE = 'backoffice';

interface AccessTokenClaims {
	realm_access?: { roles?: string[] };
}

function decodeJwtPayload(token: string): AccessTokenClaims | null {
	const parts = token.split('.');
	if (parts.length < 2) {
		return null;
	}
	try {
		const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
		return JSON.parse(decodeURIComponent(escape(atob(base64)))) as AccessTokenClaims;
	} catch (_e) {
		return null;
	}
}

/** Realm roles carried by the access token (Keycloak `realm_access.roles`). */
export function realmRoles(accessToken: string | undefined): string[] {
	if (!accessToken) {
		return [];
	}
	return decodeJwtPayload(accessToken)?.realm_access?.roles ?? [];
}

export function hasBackofficeRole(accessToken: string | undefined): boolean {
	return realmRoles(accessToken).includes(BACKOFFICE_ROLE);
}
