# How to Create an Admin Account

There are two ways to make your account an admin:

## Method 1: Using Supabase Dashboard (Recommended)

1. **Sign up** through the app as a regular user (you'll be created as a student)
2. Go to your **Supabase Dashboard** → **Authentication** → **Users**
3. Find your user account (search by email)
4. Click on your user to open the user details
5. Scroll down to **User Metadata** section
6. Click **Edit** and add or update the metadata:
   ```json
   {
     "role": "admin"
   }
   ```
7. Click **Save**

8. **Update the profile table** - Run this SQL in Supabase SQL Editor (replace with your user ID):
   ```sql
   UPDATE public.profiles 
   SET role = 'admin' 
   WHERE id = 'your-user-id-here';
   ```

## Method 2: Using SQL Only

1. **Sign up** through the app first (creates your auth user and profile)
2. Go to **Supabase Dashboard** → **SQL Editor**
3. Find your user ID:
   ```sql
   SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;
   ```
4. Update your profile to admin:
   ```sql
   UPDATE public.profiles 
   SET role = 'admin' 
   WHERE id = 'your-user-id-from-step-3';
   ```

## Method 3: Direct SQL (If you know your email)

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'your-email@example.com'
);
```

## Verify Admin Status

After updating, verify you're an admin:

```sql
SELECT id, full_name, role 
FROM public.profiles 
WHERE role = 'admin';
```

Then **log out and log back in** to your account. You should now see the Admin Dashboard!

## Important Notes

- You must sign up first to create your user account
- The role is stored in the `profiles` table, not just in auth metadata
- After changing the role, you need to log out and log back in for the change to take effect
- Only admins can add teachers through the admin dashboard
