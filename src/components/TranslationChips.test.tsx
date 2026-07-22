import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TranslationChips } from './TranslationChips';

describe('TranslationChips', () => {
	it('renders one badge per language coloured by its translation state', () => {
		render(
			<TranslationChips languages={['EL', 'LT', 'NL']} states={{ EL: 'STAGED', LT: 'PRESENT', NL: 'MISSING' }} />,
		);

		expect(screen.getByText('EL').closest('span.badge')?.className).toContain('badge-warning');
		expect(screen.getByText('LT').closest('span.badge')?.className).toContain('badge-success');
		expect(screen.getByText('NL').closest('span.badge')?.className).toContain('badge-ghost');
	});

	it('stripes a partially translated language: green when unchanged, orange when a change is pending', () => {
		render(<TranslationChips languages={['EL', 'LT']} states={{ EL: 'PARTIAL', LT: 'PARTIAL_STAGED' }} />);

		expect(screen.getByText('EL').closest('span.badge')?.className).toContain('badge-striped-success');
		expect(screen.getByText('LT').closest('span.badge')?.className).toContain('badge-striped-warning');
	});

	it('shows the full language code and its single-letter abbreviation', () => {
		render(<TranslationChips languages={['EL']} states={{ EL: 'PRESENT' }} />);

		expect(screen.getByText('EL')).not.toBeNull();
		expect(screen.getByText('E')).not.toBeNull();
	});
});
