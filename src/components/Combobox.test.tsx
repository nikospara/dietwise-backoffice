import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Combobox } from './Combobox';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

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

	it('withholds the create entry and reports a typed name longer than maxNameLength', () => {
		const onCreate = vi.fn();
		render(
			<Combobox
				options={OPTIONS}
				value={null}
				onChange={vi.fn()}
				label="trigger"
				onCreate={onCreate}
				createLabel={(name) => `Add ${name}`}
				maxNameLength={10}
			/>,
		);

		const input = screen.getByLabelText('trigger');
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: 'n'.repeat(11) } });

		expect(screen.queryByText(`Add ${'n'.repeat(11)}`)).toBeNull();
		expect(screen.getByText('validation.tooLong')).not.toBeNull();
		expect(input.className).toContain('border-error');
	});

	it('offers the create entry at exactly maxNameLength', () => {
		render(
			<Combobox
				options={OPTIONS}
				value={null}
				onChange={vi.fn()}
				label="trigger"
				onCreate={vi.fn()}
				createLabel={(name) => `Add ${name}`}
				maxNameLength={10}
			/>,
		);

		const input = screen.getByLabelText('trigger');
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: 'n'.repeat(10) } });

		expect(screen.getByText(`Add ${'n'.repeat(10)}`)).not.toBeNull();
		expect(screen.queryByText('validation.tooLong')).toBeNull();
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

	it('offers a create entry when the query has no exact match and reports the typed name', () => {
		const onCreate = vi.fn();
		render(
			<Combobox
				options={OPTIONS}
				value={null}
				onChange={vi.fn()}
				label="trigger"
				onCreate={onCreate}
				createLabel={(name) => `Add "${name}"`}
			/>,
		);

		const input = screen.getByLabelText('trigger');
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: 'Quinoa flour' } });
		fireEvent.mouseDown(screen.getByText('Add "Quinoa flour"'));

		expect(onCreate).toHaveBeenCalledWith('Quinoa flour');
	});

	it('does not offer a create entry when the query exactly matches an existing option', () => {
		const onCreate = vi.fn();
		render(
			<Combobox
				options={OPTIONS}
				value={null}
				onChange={vi.fn()}
				label="trigger"
				onCreate={onCreate}
				createLabel={(name) => `Add "${name}"`}
			/>,
		);

		const input = screen.getByLabelText('trigger');
		fireEvent.focus(input);
		fireEvent.change(input, { target: { value: 'beef' } });

		expect(screen.queryByText('Add "beef"')).toBeNull();
		expect(screen.getByText('Beef')).not.toBeNull();
	});
});
