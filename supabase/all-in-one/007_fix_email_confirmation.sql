-- ============================================
-- Fix Email Confirmation Issue
-- Run this to auto-confirm all users
-- ============================================

-- Auto-confirm all existing users who don't have confirmed emails
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Verify the update
SELECT 
  id, 
  email, 
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
