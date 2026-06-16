import { useState } from 'react';

export interface ComboboxOption {
	id: string;
	name: string;
}

interface ComboboxProps {
	options: ComboboxOption[];
	value: string | null;
	onChange: (id: string | null) => void;
	label: string;
	placeholder?: string;
	/** When set, the list offers an entry that clears the selection (for an optional field). */
	clearLabel?: string;
}

/**
 * A type-to-filter picker over a fixed set of existing entries. The text input filters the options by name while
 * focused; selecting an option reports its id. With {@link ComboboxProps.clearLabel} the list also offers a way to
 * clear the selection.
 */
export function Combobox({ options, value, onChange, label, placeholder, clearLabel }: ComboboxProps) {
	const [query, setQuery] = useState('');
	const [open, setOpen] = useState(false);
	const selected = options.find((option) => option.id === value) ?? null;
	const filtered = options.filter((option) => option.name.toLowerCase().includes(query.toLowerCase()));

	const select = (id: string | null) => {
		onChange(id);
		setQuery('');
		setOpen(false);
	};

	return (
		<div className="relative">
			<input
				type="text"
				className="input input-sm input-bordered w-full"
				aria-label={label}
				placeholder={placeholder}
				value={open ? query : (selected?.name ?? '')}
				onFocus={() => {
					setQuery('');
					setOpen(true);
				}}
				onChange={(event) => setQuery(event.target.value)}
				onBlur={() => setOpen(false)}
			/>
			{open ? (
				<ul className="menu bg-base-100 rounded-box border-base-300 absolute z-10 mt-1 max-h-60 w-full flex-nowrap overflow-auto border shadow">
					{clearLabel !== undefined ? (
						<li>
							<button type="button" className="italic" onMouseDown={() => select(null)}>
								{clearLabel}
							</button>
						</li>
					) : null}
					{filtered.map((option) => (
						<li key={option.id}>
							<button type="button" onMouseDown={() => select(option.id)}>
								{option.name}
							</button>
						</li>
					))}
				</ul>
			) : null}
		</div>
	);
}
