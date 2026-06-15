import { createBrowserRouter } from 'react-router';
import { RequireAuth } from '@/auth/RequireAuth';
import { AppLayout } from '@/layout/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
	{
		path: '/',
		element: (
			<RequireAuth>
				<AppLayout />
			</RequireAuth>
		),
		children: [
			{ index: true, element: <HomePage /> },
			// Entity CRUD routes get added here.
		],
	},
	{ path: '*', element: <NotFoundPage /> },
]);
