-- ============================================
-- Auto-confirm all existing users
-- Run this if you have existing users that need email confirmation
-- ============================================

-- Update all existing users to have confirmed emails
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Note: For new signups, make sure email confirmation is disabled in Supabase Dashboard:
-- Authentication → Settings → Email Auth → "Enable email confirmations" should be OFF
