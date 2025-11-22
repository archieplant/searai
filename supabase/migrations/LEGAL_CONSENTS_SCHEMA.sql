-- Recipe Killer AI - Legal Consents Schema
-- This file contains the SQL schema for tracking user consent to legal documents

-- =====================================================
-- TABLE: legal_consents
-- =====================================================
-- Tracks user acceptance of Terms of Service, Privacy Policy, and Content Policy
-- GDPR/CCPA compliance: Stores timestamped proof of consent
-- COPPA compliance: Tracks age verification

CREATE TABLE IF NOT EXISTS legal_consents (
  -- Primary key (one record per user)
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Age Verification (COPPA requirement - 13+ years old)
  age_verified BOOLEAN DEFAULT FALSE,
  age_verified_at TIMESTAMPTZ,

  -- Terms of Service
  terms_accepted BOOLEAN DEFAULT FALSE,
  terms_accepted_at TIMESTAMPTZ,
  terms_version TEXT, -- e.g., "1.0", "1.1", "2.0"

  -- Privacy Policy
  privacy_accepted BOOLEAN DEFAULT FALSE,
  privacy_accepted_at TIMESTAMPTZ,
  privacy_version TEXT,

  -- Content Policy (for community sharing)
  content_policy_accepted BOOLEAN DEFAULT FALSE,
  content_policy_accepted_at TIMESTAMPTZ,
  content_policy_version TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
-- Fast lookup by user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_legal_consents_user_id
  ON legal_consents(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Enable RLS to protect user consent data
ALTER TABLE legal_consents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own consents
CREATE POLICY "Users can view own consents"
  ON legal_consents
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own consents (on signup)
CREATE POLICY "Users can insert own consents"
  ON legal_consents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own consents
CREATE POLICY "Users can update own consents"
  ON legal_consents
  FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE legal_consents IS 'Stores timestamped user consent to legal documents for GDPR/CCPA compliance';
COMMENT ON COLUMN legal_consents.user_id IS 'Reference to auth.users - one consent record per user';
COMMENT ON COLUMN legal_consents.age_verified IS 'COPPA compliance: User confirmed they are 13+ years old';
COMMENT ON COLUMN legal_consents.age_verified_at IS 'Timestamp when age was verified';
COMMENT ON COLUMN legal_consents.terms_accepted IS 'User accepted Terms of Service';
COMMENT ON COLUMN legal_consents.terms_accepted_at IS 'Timestamp when Terms were accepted';
COMMENT ON COLUMN legal_consents.terms_version IS 'Version of Terms user accepted (e.g., "1.0")';
COMMENT ON COLUMN legal_consents.privacy_accepted IS 'User accepted Privacy Policy';
COMMENT ON COLUMN legal_consents.privacy_accepted_at IS 'Timestamp when Privacy Policy was accepted';
COMMENT ON COLUMN legal_consents.privacy_version IS 'Version of Privacy Policy user accepted';
COMMENT ON COLUMN legal_consents.content_policy_accepted IS 'User accepted Content Policy (for community sharing)';
COMMENT ON COLUMN legal_consents.content_policy_accepted_at IS 'Timestamp when Content Policy was accepted';
COMMENT ON COLUMN legal_consents.content_policy_version IS 'Version of Content Policy user accepted';

-- =====================================================
-- USAGE NOTES
-- =====================================================
--
-- CONSENT TRACKING:
-- - All consents are opt-in (default FALSE)
-- - Timestamps provide proof of when consent was given
-- - Version tracking allows detecting when users need to re-accept updated terms
--
-- LEGAL REQUIREMENTS:
-- - GDPR Article 7: Requires proof of consent with timestamp
-- - COPPA: Requires age verification for users under 13
-- - CCPA: Requires ability to delete user data (handled by ON DELETE CASCADE)
--
-- VERSION UPDATES:
-- When legal documents are updated:
-- 1. Increment version number (1.0 -> 1.1 -> 2.0)
-- 2. Check if user has accepted latest version
-- 3. Show banner/modal for users who haven't accepted new version
-- 4. User must re-accept for material changes
--
-- EXAMPLE QUERIES:
--
-- Insert initial consents on signup:
-- INSERT INTO legal_consents (
--   user_id,
--   age_verified,
--   age_verified_at,
--   terms_accepted,
--   terms_accepted_at,
--   terms_version,
--   privacy_accepted,
--   privacy_accepted_at,
--   privacy_version
-- ) VALUES (
--   'user-uuid-here',
--   TRUE,
--   NOW(),
--   TRUE,
--   NOW(),
--   '1.0',
--   TRUE,
--   NOW(),
--   '1.0'
-- );
--
-- Check if user accepted content policy:
-- SELECT content_policy_accepted
-- FROM legal_consents
-- WHERE user_id = 'user-uuid-here';
--
-- Update content policy acceptance:
-- UPDATE legal_consents
-- SET
--   content_policy_accepted = TRUE,
--   content_policy_accepted_at = NOW(),
--   content_policy_version = '1.0',
--   updated_at = NOW()
-- WHERE user_id = 'user-uuid-here';
--
