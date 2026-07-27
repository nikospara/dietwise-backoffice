import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TooLongError } from './TooLongError';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

describe('TooLongError', () => {
	it('says nothing while the value fits', () => {
		const { container } = render(<TooLongError value={'x'.repeat(300)} max={300} />);

		expect(container.innerHTML).toBe('');
	});

	it('reports the value once it exceeds the limit', () => {
		render(<TooLongError value={'x'.repeat(301)} max={300} />);

		expect(screen.getByText('validation.tooLong')).not.toBeNull();
	});
});
