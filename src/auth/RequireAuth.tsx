import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useTranslation } from 'react-i18next';

export function RequireAuth({ children }: { children: ReactNode }) {
	const auth = useAuth();
	const { t } = useTranslation();

	useEffect(() => {
		if (!auth.isLoading && !auth.isAuthenticated && !auth.activeNavigator && !auth.error) {
			void auth.signinRedirect();
		}
	}, [auth]);

	if (auth.error) {
		return (
			<div className="flex h-full items-center justify-center p-8">
				<div className="alert alert-error max-w-md">
					<span>
						{t('auth.signInError')}: {auth.error.message}
					</span>
				</div>
			</div>
		);
	}

	if (!auth.isAuthenticated) {
		return (
			<div className="flex h-full items-center justify-center p-8">
				<span className="loading loading-spinner loading-lg" aria-label={t('auth.signingIn')} />
			</div>
		);
	}

	return <>{children}</>;
}
