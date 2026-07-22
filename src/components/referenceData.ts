/** A non-English language a translatable thing can be translated into. English is the master/source/fallback. */
export type Language = 'EL' | 'LT' | 'NL';

/** The non-English languages, in display order. */
export const LANGUAGES: Language[] = ['EL', 'LT', 'NL'];

/** How complete a translatable thing is in a given language: every field empty (missing, falls back to English), some
 * fields translated (partial), or every field translated (present) — each optionally carrying a pending Working Copy
 * change (the `*_STAGED` variants). */
export type TranslationState = 'MISSING' | 'PARTIAL' | 'PRESENT' | 'PARTIAL_STAGED' | 'STAGED';

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
