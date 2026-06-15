import { useAuth } from 'react-oidc-context';
import { useTranslation } from 'react-i18next';
import { realmRoles } from '@/auth/roles';

export function HomePage() {
	const auth = useAuth();
	const { t } = useTranslation();
	const profile = auth.user?.profile;
	const name = profile?.name ?? profile?.email ?? '';
	const roles = realmRoles(auth.user?.access_token);

	return (
		<div>
			<h1>{t('home.welcome', { name })}</h1>

			<div className="card bg-base-100 border-base-300 mt-4 max-w-xl border">
				<div className="card-body gap-3">
					<div>
						<div className="text-sm opacity-60">{t('home.signedInAs')}</div>
						<div className="font-mono">{profile?.email ?? '—'}</div>
					</div>
					<div>
						<div className="text-sm opacity-60">{t('home.realmRoles')}</div>
						<div className="flex flex-wrap gap-1">
							{roles.length > 0 ? (
								roles.map((role) => (
									<span key={role} className="badge badge-outline">
										{role}
									</span>
								))
							) : (
								<span className="opacity-60">—</span>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
