import type { ReactNode } from 'react';
import { useAuth } from 'react-oidc-context';
import { useTranslation } from 'react-i18next';
import { hasBackofficeRole } from '@/auth/roles';

/**
 * Gate a route behind the `backoffice` realm role. Assumes authentication has already happened
 * (render inside {@link RequireAuth}); a logged-in user lacking the role sees a refusal instead of the content.
 */
export function RequireBackofficeRole({ children }: { children: ReactNode }) {
	const auth = useAuth();
	const { t } = useTranslation();

	if (!hasBackofficeRole(auth.user?.access_token)) {
		return (
			<div className="flex h-full items-center justify-center p-8">
				<div className="alert alert-error max-w-md">
					<span>{t('auth.forbidden')}</span>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}
