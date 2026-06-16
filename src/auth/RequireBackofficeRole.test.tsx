import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from 'react-oidc-context';
import { RequireBackofficeRole } from './RequireBackofficeRole';

vi.mock('react-oidc-context', () => ({ useAuth: vi.fn() }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const useAuthMock = vi.mocked(useAuth);

function tokenWithRoles(roles: string[]): string {
	const payload = btoa(JSON.stringify({ realm_access: { roles } }));
	return `header.${payload}.signature`;
}

describe('RequireBackofficeRole', () => {
	beforeEach(() => {
		useAuthMock.mockReset();
	});

	it('renders its children when the user has the backoffice realm role', () => {
		useAuthMock.mockReturnValue({ user: { access_token: tokenWithRoles(['backoffice']) } } as never);

		render(
			<RequireBackofficeRole>
				<div>protected rules grid</div>
			</RequireBackofficeRole>,
		);

		expect(screen.queryByText('protected rules grid')).not.toBeNull();
		expect(screen.queryByText('auth.forbidden')).toBeNull();
	});

	it('refuses a user without the backoffice realm role', () => {
		useAuthMock.mockReturnValue({ user: { access_token: tokenWithRoles(['citizen']) } } as never);

		render(
			<RequireBackofficeRole>
				<div>protected rules grid</div>
			</RequireBackofficeRole>,
		);

		expect(screen.queryByText('protected rules grid')).toBeNull();
		expect(screen.queryByText('auth.forbidden')).not.toBeNull();
	});
});
