export type TranslationState = 'MISSING' | 'PARTIAL' | 'PRESENT' | 'PARTIAL_STAGED' | 'STAGED';

const chipClass = (state: TranslationState) => {
	switch (state) {
		case 'STAGED':
			return 'badge badge-sm badge-warning';
		case 'PARTIAL_STAGED':
			return 'badge badge-sm badge-striped-warning';
		case 'PRESENT':
			return 'badge badge-sm badge-success';
		case 'PARTIAL':
			return 'badge badge-sm badge-striped-success';
		default:
			return 'badge badge-sm badge-ghost';
	}
};

/**
 * The per-language completeness chips for a translatable thing: one badge per language, coloured by its translation
 * state — amber when staged, green when a published translation is present, ghost when every field is empty, and
 * amber/green diagonal stripes when only some of the fields are translated (staged or published respectively). The full
 * language code shows on large screens and its first letter on small ones. The shared visual vocabulary for translation
 * completeness across the backoffice grids.
 */
export function TranslationChips<L extends string>({
	languages,
	states,
}: {
	languages: readonly L[];
	states: Record<L, TranslationState>;
}) {
	return (
		<>
			{languages.map((lang) => (
				<span key={lang} className={chipClass(states[lang])}>
					<span className="sm:hidden lg:inline">{lang}</span>
					<span className="text-[10px] sm:inline lg:hidden">{lang.substring(0, 1)}</span>
				</span>
			))}
		</>
	);
}
