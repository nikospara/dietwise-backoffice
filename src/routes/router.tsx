import { createBrowserRouter } from 'react-router';
import { RequireAuth } from '@/auth/RequireAuth';
import { RequireBackofficeRole } from '@/auth/RequireBackofficeRole';
import { AppLayout } from '@/layout/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RulesPage } from '@/pages/RulesPage';

export const router = createBrowserRouter(
	[
		{
			path: '/',
			element: (
				<RequireAuth>
					<AppLayout />
				</RequireAuth>
			),
			children: [
				{ index: true, element: <HomePage /> },
				{
					path: 'rules',
					element: (
						<RequireBackofficeRole>
							<RulesPage />
						</RequireBackofficeRole>
					),
				},
				// Entity CRUD routes get added here.
			],
		},
		{ path: '*', element: <NotFoundPage /> },
	],
	{ basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
);
