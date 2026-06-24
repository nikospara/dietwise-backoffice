import { createBrowserRouter } from 'react-router';
import { RequireAuth } from '@/auth/RequireAuth';
import { RequireBackofficeRole } from '@/auth/RequireBackofficeRole';
import { AppLayout } from '@/layout/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RecommendationsPage } from '@/recommendations/RecommendationsPage';
import { RulesPage } from '@/rules/RulesPage';

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
				{
					path: 'recommendations',
					element: (
						<RequireBackofficeRole>
							<RecommendationsPage />
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
