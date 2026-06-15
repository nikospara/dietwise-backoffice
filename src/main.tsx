import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { AuthProvider } from 'react-oidc-context';
import { RouterProvider } from 'react-router/dom';
import './index.css';
import { loadAppConfig } from '@/config/loadAppConfig';
import { appConfigAtom } from '@/config/atoms';
import { configureI18n } from '@/i18n';
import { configureUserManager, onSigninCallback } from '@/auth/userManager';
import { configureApiServerHost } from '@/api/client';
import { router } from '@/routes/router';

async function bootstrap() {
	const config = await loadAppConfig();
	configureApiServerHost(config.apiServerHost);
	const userManager = configureUserManager(config);
	await configureI18n('en');

	const jotaiStore = createStore();
	jotaiStore.set(appConfigAtom, config);

	const rootElement = document.getElementById('root') as HTMLElement;
	const root = createRoot(rootElement);

	// keep the JotaiProvider and AuthProvider outside of React.StrictMode
	root.render(
		<JotaiProvider store={jotaiStore}>
			<AuthProvider userManager={userManager} onSigninCallback={onSigninCallback}>
				<StrictMode>
					<RouterProvider router={router} />
				</StrictMode>
			</AuthProvider>
		</JotaiProvider>,
	);
}

void bootstrap();
