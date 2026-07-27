/**
 * The longest text the backend accepts for each editable field, mirroring the size of the column it is written to —
 * master and Working Copy alike, whichever is narrower. Over the limit the write fails in the database and surfaces as
 * an opaque HTTP error, so every editor caps its input with `maxLength` instead.
 *
 * Keep these in step with the Liquibase changelogs in the `dietwise` repo.
 */
export const MAX_LENGTHS = {
	/** Name of a Trigger Ingredient, Role or Technique, or Alternative Ingredient, English or translated. */
	referenceName: 200,
	/** LLM explanation of a Trigger Ingredient, Role or Technique, or Alternative Ingredient, English or translated. */
	referenceExplanation: 300,
	ruleRationale: 300,
	recommendationName: 200,
	recommendationComponentForScoring: 200,
	recommendationExplanation: 300,
	recommendationHumanFriendlyDisplay: 300,
	/** Keyed by `TemplateField`; the fields of a Suggestion Template differ in length from one another. */
	templateField: {
		RESTRICTION: 300,
		EQUIVALENCE: 300,
		TECHNIQUE_NOTES: 1000,
	},
} as const;
