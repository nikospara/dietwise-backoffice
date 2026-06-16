import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchRules } from '@/api/rules';
import { RulesPage } from './RulesPage';

vi.mock('@/api/rules', () => ({ fetchRules: vi.fn() }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const fetchRulesMock = vi.mocked(fetchRules);

describe('RulesPage', () => {
	beforeEach(() => {
		fetchRulesMock.mockReset();
	});

	it('renders one row per rule and blanks a missing role and rationale', async () => {
		fetchRulesMock.mockResolvedValue([
			{
				id: '1',
				recommendation: 'Decrease red meat',
				triggerIngredient: 'Beef',
				roleOrTechnique: 'minced in sauce',
				rationale: 'Use plant proteins.',
			},
			{
				id: '2',
				recommendation: 'Decrease red meat',
				triggerIngredient: 'Beef',
				roleOrTechnique: null,
				rationale: null,
			},
		]);

		render(<RulesPage />);

		expect(await screen.findByText('minced in sauce')).not.toBeNull();
		expect(screen.getByText('Use plant proteins.')).not.toBeNull();
		expect(screen.getAllByText('Beef')).toHaveLength(2);
		// the role-less, rationale-less rule renders a placeholder in both cells
		expect(screen.getAllByText('—')).toHaveLength(2);
	});

	it('shows an error message when the rules cannot be loaded', async () => {
		fetchRulesMock.mockRejectedValue(new Error('boom'));

		render(<RulesPage />);

		expect(await screen.findByText('rules.loadError')).not.toBeNull();
	});
});
