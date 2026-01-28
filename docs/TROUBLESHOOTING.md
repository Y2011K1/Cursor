# Troubleshooting Guide

## Email Confirmation Issues

### Problem: "Email not confirmed" error even though confirmation is disabled

**Solution:**

1. **Verify Supabase Settings:**
   - Go to Supabase Dashboard → Authentication → Settings
   - Under "Email Auth", make sure "Enable email confirmations" is **OFF**
   - Save changes

2. **Auto-confirm existing users:**
   Run this SQL in Supabase SQL Editor:
   ```sql
   UPDATE auth.users
   SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
   WHERE email_confirmed_at IS NULL;
   ```

3. **For new signups:**
   The signup flow should work automatically. If you still get errors:
   - Check that email confirmation is disabled in Supabase settings
   - Clear browser cookies and try again
   - Check browser console for any errors

4. **Manual confirmation (if needed):**
   If you need to manually confirm a specific user:
   ```sql
   UPDATE auth.users
   SET email_confirmed_at = NOW()
   WHERE email = 'user@example.com';
   ```

## Common Issues

### Can't access dashboard after login
- Make sure you've run all database migrations (001-005)
- Check that your profile exists: `SELECT * FROM public.profiles WHERE id = 'your-user-id';`
- Verify your role is set correctly

### RLS policies blocking access
- Check that RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
- Verify policies exist: `SELECT * FROM pg_policies WHERE tablename = 'profiles';`
- Make sure you're logged in with the correct user

### Teacher can't see classroom
- Verify teacher was created by admin (not self-signup)
- Check classroom exists: `SELECT * FROM public.classrooms WHERE teacher_id = 'teacher-id';`
- Ensure profile role is 'teacher'

### Student can't enroll
- Check student role: `SELECT role FROM public.profiles WHERE id = 'student-id';`
- Verify classroom is active: `SELECT is_active FROM public.classrooms WHERE id = 'classroom-id';`
- Check classroom capacity hasn't been reached
