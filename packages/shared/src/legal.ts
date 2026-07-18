/**
 * Legal document identity and versioning.
 *
 * The versions below are the evidence anchor: every acceptance we persist
 * stores the exact version the user was shown, so we can always reconstruct
 * which text they agreed to. Bump a version ONLY when the corresponding
 * document changes in substance, and never edit a published document in place
 * without bumping it.
 */

/**
 * Identity of the data controller, as required by GDPR Article 13(1)(a).
 *
 * Currently a natural person. Replace with the company name and VAT number if
 * Radevu is ever incorporated — this value is rendered verbatim on
 * /legal/privacy and /legal/terms.
 */
export const LEGAL_CONTROLLER_NAME = "Ιωάννης Δήμος";

/** Contact address for privacy requests and legal notices. */
export const LEGAL_CONTACT_EMAIL = "dimos.is.dev@gmail.com";

/** Country of establishment — determines the competent supervisory authority. */
export const LEGAL_CONTROLLER_COUNTRY = "Ελλάδα";

/** Greek supervisory authority, for the Article 13(2)(d) complaint right. */
export const LEGAL_SUPERVISORY_AUTHORITY = {
  address: "Κηφισίας 1-3, 115 23 Αθήνα",
  email: "contact@dpa.gr",
  name: "Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα (ΑΠΔΠΧ)",
  phone: "+30 210 6475600",
  url: "https://www.dpa.gr"
} as const;

/**
 * Current published versions, as ISO dates.
 *
 * Persisted on every TermsAcceptance row.
 */
export const LEGAL_VERSIONS = {
  privacy: "2026-07-18",
  terms: "2026-07-18"
} as const;

/** Where in the product an acceptance was captured. */
export const TERMS_ACCEPTANCE_CONTEXTS = ["register", "booking"] as const;

export type TermsAcceptanceContext =
  (typeof TERMS_ACCEPTANCE_CONTEXTS)[number];

/**
 * How the acceptance was expressed.
 *
 * - `checkbox`: the user actively ticked a box that was unchecked by default.
 * - `submit`: the user pressed a submit button under a notice stating that
 *   submitting constitutes acceptance.
 */
export const TERMS_ACCEPTANCE_METHODS = ["checkbox", "submit"] as const;

export type TermsAcceptanceMethod = (typeof TERMS_ACCEPTANCE_METHODS)[number];

/**
 * Human-readable retention periods, surfaced in the privacy policy and kept
 * here so the policy text and any future cleanup jobs cannot drift apart.
 */
export const LEGAL_RETENTION = {
  appointmentsMonths: 24,
  contactRequestsMonths: 12,
  loginAttemptsMonths: 12,
  termsAcceptanceYears: 5
} as const;
