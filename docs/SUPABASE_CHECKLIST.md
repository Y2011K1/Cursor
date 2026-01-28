# Supabase Configuration Checklist

## Critical Settings to Check in Supabase Dashboard

### 1. Authentication Settings

**Go to: Authentication → Settings**

#### Email Auth Settings:
- [ ] **Enable email confirmations**: Should be **OFF** (disabled)
- [ ] **Enable email signup**: Should be **ON** (enabled)
- [ ] **Enable email change**: Can be ON or OFF (your choice)

#### Site URL:
- [ ] **Site URL**: Should be your production URL (e.g., `https://yourdomain.com`) or `http://localhost:3000` for development
- [ ] **Redirect URLs**: Should include:
  - `http://localhost:3000/**` (for development)
  - `https://yourdomain.com/**` (for production)
  - `http://localhost:3000/dashboard/**`
  - `https://yourdomain.com/dashboard/**`

### 2. Database Settings

**Go to: Database → Settings**

#### Connection Pooling:
- [ ] Connection pooler should be enabled (default)

#### Row Level Security:
- [ ] RLS should be **ENABLED** for all tables (this is critical for security)

### 3. API Settings

**Go to: Settings → API**

#### Project URL:
- [ ] Copy your **Project URL** - should match `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`

#### API Keys:
- [ ] **anon/public key**: Should match `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- [ ] **service_role key**: Should match `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (keep this secret!)

### 4. Database Migrations

**Go to: SQL Editor**

Run these migrations in order:
- [ ] `001_initial_schema.sql` - Creates all tables
- [ ] `002_rls_policies.sql` - Sets up Row Level Security
- [ ] `003_functions_triggers.sql` - Creates triggers and functions
- [ ] `004_admin_functions.sql` - Admin helper functions
- [ ] `005_student_enrollment_policy.sql` - Student enrollment policy
- [ ] `007_fix_email_confirmation.sql` - Auto-confirms existing users (if needed)

### 5. Verify Your Profile Exists

**Run in SQL Editor:**
```sql
-- Replace with your email
SELECT 
  u.id as user_id,
  u.email,
  u.email_confirmed_at,
  p.id as profile_id,
  p.full_name,
  p.role,
  p.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'your-email@example.com';
```

**Expected Result:**
- `user_id` should exist
- `email_confirmed_at` should NOT be NULL
- `profile_id` should exist and match `user_id`
- `role` should be 'student', 'teacher', or 'admin'

### 6. Check RLS Policies

**Run in SQL Editor:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- Should return: rowsecurity = true
```

**Check policies exist:**
```sql
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles';
```

**Should return multiple policies** (SELECT, INSERT, UPDATE for different roles)

### 7. Check Trigger Exists

**Run in SQL Editor:**
```sql
-- Check if profile creation trigger exists
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Should return the trigger name
```

### 8. Environment Variables

**Check your `.env.local` file:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Verify:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` matches your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` matches your anon/public key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` matches your service_role key (for admin functions)

### 9. Browser Console Checks

**Open browser DevTools → Console and check:**
- [ ] No CORS errors
- [ ] No cookie-related errors
- [ ] No authentication errors

**Open browser DevTools → Application → Cookies:**
- [ ] Should see Supabase auth cookies (usually named like `sb-*-auth-token`)
- [ ] Cookies should have `SameSite=Lax` or `SameSite=None`
- [ ] Cookies should have `Secure` flag if using HTTPS

### 10. Network Tab Checks

**Open browser DevTools → Network:**
1. Try to login
2. Look for requests to:
   - `https://your-project.supabase.co/auth/v1/token` (login request)
   - `https://your-project.supabase.co/rest/v1/profiles` (profile fetch)
3. Check response status codes:
   - Login should return `200 OK`
   - Profile fetch should return `200 OK` (not `401` or `403`)

### 11. Common Issues and Fixes

#### Issue: "Email not confirmed"
**Fix:** Run migration `007_fix_email_confirmation.sql` or manually:
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'your-email@example.com';
```

#### Issue: Profile doesn't exist
**Fix:** Create it manually:
```sql
INSERT INTO public.profiles (id, full_name, role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
  COALESCE(u.raw_user_meta_data->>'role', 'student')
FROM auth.users u
WHERE u.email = 'your-email@example.com'
AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);
```

#### Issue: RLS blocking access
**Fix:** Verify all migrations are run, especially `002_rls_policies.sql`

#### Issue: Cookies not persisting
**Fix:** 
- Check Site URL in Supabase matches your app URL
- Check Redirect URLs include your app URLs
- Clear browser cookies and try again
- Check browser isn't blocking third-party cookies

### 12. Test Authentication Flow

1. **Sign Up:**
   - [ ] Create new account
   - [ ] Should redirect to dashboard
   - [ ] Profile should be created automatically

2. **Login:**
   - [ ] Login with existing account
   - [ ] Should redirect to dashboard
   - [ ] Should see correct role-based dashboard

3. **Session Persistence:**
   - [ ] Refresh page - should stay logged in
   - [ ] Close and reopen browser - should stay logged in (if cookies persist)

## Still Having Issues?

If you've checked all of the above and still have problems:

1. **Check browser console** for specific error messages
2. **Check Network tab** for failed requests
3. **Check Supabase logs** (Dashboard → Logs → Auth Logs)
4. **Try in incognito mode** to rule out cookie/cache issues
5. **Verify all environment variables** are correct
6. **Make sure all migrations are run** in the correct order
