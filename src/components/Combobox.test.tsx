import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Combobox } from './Combobox';

const OPTIONS = [
	{ id: '1', name: 'Beef' },
	{ id: '2', name: 'Pork' },
	{ id: '3', name: 'Soy sauce' },
];

describe('Combobox', () => {
	it('shows the selected option name', () => {
		render(<Combobox options={OPTIONS} value="2" onChange={vi.fn()} label="trigger" />);

		expect((screen.getByLabelText('trigger') as HTMLInputElement).value).toBe('Pork');
	});

	it('filters options by the typed query and reports the chosen id', () => {
		const onChange = vi.fn();
		render(<Combobox options={OPTIONS} value={null} onChange={onChange} label="trigger" />);

		const input = screen.getByLabelText('trigger');
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: 'so' } });

		expect(screen.queryByText('Beef')).toBeNull();
		fireEvent.mouseDown(screen.getByText('Soy sauce'));

		expect(onChange).toHaveBeenCalledWith('3');
	});

	it('offers a clear entry that reports null when clearLabel is set', () => {
		const onChange = vi.fn();
		render(<Combobox options={OPTIONS} value="1" onChange={onChange} label="role" clearLabel="(none)" />);

		fireEvent.focus(screen.getByLabelText('role'));
		fireEvent.mouseDown(screen.getByText('(none)'));

		expect(onChange).toHaveBeenCalledWith(null);
	});
});
