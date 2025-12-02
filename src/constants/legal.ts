/**
 * Legal Documents Configuration
 *
 * Contains URLs to hosted legal documents and version tracking.
 *
 * Legal documents are hosted on Vercel at https://legal.searai.app
 * See /legal-docs/README.md for updating legal documents.
 */

const LEGAL_BASE_URL = 'https://legal.searai.app';

export const LEGAL_URLS = {
  PRIVACY_POLICY: `${LEGAL_BASE_URL}/privacy-policy.html`,
  TERMS_OF_SERVICE: `${LEGAL_BASE_URL}/terms-of-service.html`,
  CONTENT_POLICY: `${LEGAL_BASE_URL}/content-policy.html`,
} as const;

/**
 * Legal Document Versions
 *
 * Increment these when updating legal documents to track which version users accepted.
 * Use semantic versioning: 1.0, 1.1, 2.0, etc.
 *
 * When to increment:
 * - Minor changes (typos, clarifications): increment minor version (1.0 -> 1.1)
 * - Material changes (new terms, policy changes): increment major version (1.0 -> 2.0)
 */
export const LEGAL_VERSIONS = {
  TERMS: '1.0',
  PRIVACY: '1.0',
  CONTENT_POLICY: '1.0',
} as const;

/**
 * Minimum age requirement (COPPA compliance)
 */
export const MIN_AGE = 13;

/**
 * Helper function to check if user has accepted latest version
 */
export function needsToAcceptUpdatedTerms(
  userTermsVersion: string | null,
  userPrivacyVersion: string | null
): boolean {
  return (
    userTermsVersion !== LEGAL_VERSIONS.TERMS ||
    userPrivacyVersion !== LEGAL_VERSIONS.PRIVACY
  );
}

/**
 * Helper function to check if user has accepted content policy
 */
export function needsToAcceptContentPolicy(
  userContentPolicyVersion: string | null
): boolean {
  return userContentPolicyVersion !== LEGAL_VERSIONS.CONTENT_POLICY;
}
