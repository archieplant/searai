/**
 * Legal Documents Configuration
 *
 * Contains URLs to hosted legal documents and version tracking.
 *
 * IMPORTANT: Update LEGAL_URLS after enabling GitHub Pages
 * Format: https://[username].github.io/[repo-name]/[file].html
 */

// TODO: Replace with your actual GitHub Pages URLs after enabling GitHub Pages
const GITHUB_USERNAME = 'archieplant'; // Replace with your GitHub username
const REPO_NAME = 'recipe-killer-ai'; // Replace with your repo name

export const LEGAL_URLS = {
  PRIVACY_POLICY: `https://${GITHUB_USERNAME}.github.io/${REPO_NAME}/privacy-policy.html`,
  TERMS_OF_SERVICE: `https://${GITHUB_USERNAME}.github.io/${REPO_NAME}/terms-of-service.html`,
  CONTENT_POLICY: `https://${GITHUB_USERNAME}.github.io/${REPO_NAME}/content-policy.html`,
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
