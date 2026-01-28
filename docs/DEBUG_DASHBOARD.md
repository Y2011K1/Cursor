# Debugging Dashboard Access Issues

If you can't access the dashboard after login, follow these steps:

## Step 1: Check if your profile exists

Run this SQL in Supabase SQL Editor (replace with your email):

```sql
-- Find your user ID
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'your-email@example.com';

-- Check if profile exists (use the ID from above)
SELECT id, full_name, role, created_at 
FROM public.profiles 
WHERE id = 'your-user-id-from-above';
```

## Step 2: If profile doesn't exist

The trigger should create it automatically. If it doesn't exist, create it manually:

```sql
-- Replace with your actual user ID and details
INSERT INTO public.profiles (id, full_name, role)
VALUES (
  'your-user-id',
  'Your Name',
  'student'
)
ON CONFLICT (id) DO NOTHING;
```

## Step 3: Verify RLS policies

Check if RLS is blocking access:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Check policies exist
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

## Step 4: Check trigger exists

```sql
-- Check if the trigger function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Check if the trigger exists
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

## Step 5: Test the trigger manually

If the trigger isn't working, you can test it:

```sql
-- This should create a profile for any user that doesn't have one
INSERT INTO public.profiles (id, full_name, role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
  COALESCE(u.raw_user_meta_data->>'role', 'student')
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;
```

## Common Issues

### Issue: "Profile not found"
- **Solution**: Run Step 2 to create the profile manually

### Issue: RLS blocking access
- **Solution**: Make sure you've run all migrations (001-005)
- Check that you're logged in with the correct user

### Issue: Trigger not firing
- **Solution**: Make sure migration 003_functions_triggers.sql has been run
- Check Step 4 to verify trigger exists

### Issue: Role is null or invalid
- **Solution**: Update your profile role:
  ```sql
  UPDATE public.profiles 
  SET role = 'student' 
  WHERE id = 'your-user-id' AND (role IS NULL OR role NOT IN ('admin', 'teacher', 'student'));
  ```
