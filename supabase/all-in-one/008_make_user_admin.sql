-- ============================================
-- Make Current User Admin
-- ============================================
-- This script helps you make your user account an admin
-- 
-- INSTRUCTIONS:
-- 1. Replace 'YOUR_EMAIL_HERE' with your actual email address
-- 2. Run this script in Supabase SQL Editor
-- 3. Log out and log back in to see the admin dashboard
-- ============================================

-- Method 1: Update by email (RECOMMENDED)
-- Replace 'YOUR_EMAIL_HERE' with your email
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'YOUR_EMAIL_HERE'
);

-- Method 2: Update by user ID (if you know your user ID)
-- Uncomment and replace 'YOUR_USER_ID_HERE' with your user ID
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = 'YOUR_USER_ID_HERE';

-- Verify the update
SELECT 
  p.id,
  p.full_name,
  p.role,
  u.email
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin';
