/** A non-English language a translatable thing can be translated into. English is the master/source/fallback. */
export type Language = 'EL' | 'LT' | 'NL';

/** The non-English languages, in display order. */
export const LANGUAGES: Language[] = ['EL', 'LT', 'NL'];

/** Whether a translatable thing is translated in a given language, missing (falls back to English), or has a pending change. */
export type TranslationState = 'MISSING' | 'PRESENT' | 'STAGED';

/** An effective translated text and the Working Copy version a subsequent edit must be based on (0 when not staged). */
export interface VersionedText {
	text: string | null;
	version: number;
}

/** A selectable reference-data entry (an id paired with a display name). */
export interface ReferenceOption {
	id: string;
	name: string;
}

/** The editable details of a shared reference entity (its name and LLM explanation). `name` is null only for a
 * not-yet-translated language in a per-language translation payload; the English details always carry a name. */
export interface ReferenceDetails {
	name: string | null;
	explanationForLlm: string | null;
	/** Working Copy version to base the next edit on (0 when no Staged Change exists yet). */
	version: number;
	/** Whether a published master baseline exists behind these details, so a Staged Change can be reverted to it. */
	published: boolean;
}
