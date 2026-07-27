import { useState } from 'react';
import { isTooLong } from '@/api/fieldLimits';
import { TooLongError } from '@/components/TooLongError';

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
	/** When set, the list offers a "create" entry with the typed name when no existing option matches it exactly. */
	onCreate?: (name: string) => void;
	/** Renders the label of the create entry for the typed name; required for the create entry to appear. */
	createLabel?: (name: string) => string;
	/** The longest name that can be created; a longer typed name is reported and offers no create entry. */
	maxNameLength?: number;
}

/**
 * A type-to-filter picker over a fixed set of existing entries. The text input filters the options by name while
 * focused; selecting an option reports its id. With {@link ComboboxProps.clearLabel} the list also offers a way to
 * clear the selection. With {@link ComboboxProps.onCreate} the list offers a way to create a new entry from the typed
 * name when none matches it exactly, so an existing entry is reused rather than duplicated.
 */
export function Combobox({
	options,
	value,
	onChange,
	label,
	placeholder,
	clearLabel,
	onCreate,
	createLabel,
	maxNameLength,
}: ComboboxProps) {
	const [query, setQuery] = useState('');
	const [open, setOpen] = useState(false);
	const selected = options.find((option) => option.id === value) ?? null;
	const filtered = options.filter((option) => option.name.toLowerCase().includes(query.toLowerCase()));
	const trimmedQuery = query.trim();
	// The limit the typed name breaches, or null while it fits — carrying the number keeps it in hand for the message.
	const breachedLimit = maxNameLength !== undefined && isTooLong(trimmedQuery, maxNameLength) ? maxNameLength : null;
	const canCreate =
		onCreate !== undefined &&
		createLabel !== undefined &&
		trimmedQuery !== '' &&
		breachedLimit === null &&
		!options.some((option) => option.name.toLowerCase() === trimmedQuery.toLowerCase());

	const select = (id: string | null) => {
		onChange(id);
		setQuery('');
		setOpen(false);
	};

	const create = (name: string) => {
		onCreate?.(name);
		setQuery('');
		setOpen(false);
	};

	return (
		<div className="relative">
			<input
				type="text"
				className={`input-bordered input w-full input-sm ${breachedLimit !== null ? 'border-error' : ''}`}
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
				<ul className="menu absolute z-10 mt-1 max-h-60 w-full flex-nowrap overflow-auto rounded-box border border-base-300 bg-base-100 shadow">
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
					{canCreate ? (
						<li>
							<button type="button" className="font-medium" onMouseDown={() => create(trimmedQuery)}>
								{createLabel?.(trimmedQuery)}
							</button>
						</li>
					) : null}
					{breachedLimit !== null ? (
						<li className="px-3 py-1">
							<TooLongError value={trimmedQuery} max={breachedLimit} />
						</li>
					) : null}
				</ul>
			) : null}
		</div>
	);
}
