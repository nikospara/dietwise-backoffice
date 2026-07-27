import { NavLink, Outlet } from 'react-router';
import { useAuth } from 'react-oidc-context';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { FiMenu } from 'react-icons/fi';
import { navItems } from './navItems';
import { hasBackofficeRole } from '@/auth/roles';

export function AppLayout() {
	const auth = useAuth();
	const { t } = useTranslation();
	const email = auth.user?.profile.email ?? auth.user?.profile.name ?? '';
	const missingRole = !hasBackofficeRole(auth.user?.access_token);

	return (
		<div className="drawer h-dvh lg:drawer-open">
			<input id="app-drawer" type="checkbox" className="drawer-toggle" />

			<div className="drawer-content flex h-dvh flex-col">
				<header className="navbar border-b border-base-300 bg-base-100">
					<div className="flex-none lg:hidden">
						<label htmlFor="app-drawer" className="btn btn-square btn-ghost" aria-label="Open menu">
							<FiMenu className="h-5 w-5" />
						</label>
					</div>
					<div className="flex-1 px-2 text-lg font-semibold">{t('app.title')}</div>
					<div className="flex-none items-center gap-2">
						<span className="hidden text-sm opacity-70 sm:inline">{email}</span>
						<button className="btn btn-sm" onClick={() => void auth.signoutRedirect()}>
							{t('auth.logout')}
						</button>
					</div>
				</header>

				{missingRole ? (
					<div className="alert rounded-none alert-warning">
						<span>{t('auth.missingRole')}</span>
					</div>
				) : null}

				<main className="min-h-0 flex-1 overflow-y-auto p-6">
					<Outlet />
				</main>
			</div>

			<div className="drawer-side">
				<label htmlFor="app-drawer" className="drawer-overlay" aria-label="Close menu" />
				<nav className="flex min-h-full w-64 flex-col bg-base-200 p-4 text-base-content">
					<div className="mb-4 px-2 text-xl font-bold">DietWise</div>
					<ul className="menu w-full gap-1">
						{navItems.map((item) => (
							<li key={item.to}>
								<NavLink
									to={item.to}
									end={item.end}
									className={({ isActive }) => classNames({ active: isActive })}
								>
									<item.icon className="h-4 w-4" />
									{t(item.labelKey)}
								</NavLink>
							</li>
						))}
					</ul>
				</nav>
			</div>
		</div>
	);
}
