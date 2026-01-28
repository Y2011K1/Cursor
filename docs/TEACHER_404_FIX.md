# Teacher Dashboard 404 Error - Fix Guide

## Problem
Getting a 404 error when trying to access the teacher dashboard after login.

## Root Causes

### 1. RLS Policies Not Set Up (Most Likely)
After running migration `011_remove_courses_link_to_classrooms.sql`, you **MUST** run migration `012_update_rls_policies_for_classrooms.sql` to recreate the RLS policies. Without these policies, teachers cannot access their classrooms.

### 2. Teacher Doesn't Have a Classroom
The teacher account might not have a classroom assigned.

### 3. Classroom Query Failing
The Supabase query might be failing due to RLS or database issues.

## Step-by-Step Fix

### Step 1: Verify Migrations Were Run

Run this SQL in Supabase SQL Editor to check if policies exist:

```sql
-- Check if classrooms policies exist
SELECT policyname, tablename 
FROM pg_policies 
WHERE tablename = 'classrooms' 
AND schemaname = 'public'
ORDER BY policyname;
```

You should see:
- "Teachers can view own classroom"
- "Teachers can update own classroom"
- "Admins can view all classrooms"
- "Students can view enrolled classrooms"

**If these don't exist, run migration 012!**

### Step 2: Run Migration 012 (CRITICAL)

1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/012_update_rls_policies_for_classrooms.sql`
3. Copy the entire file
4. Paste into SQL Editor
5. Click **Run**

This recreates all RLS policies with the correct classroom-based logic.

### Step 3: Verify Teacher Has a Classroom

Run this SQL (replace with your teacher's email or user ID):

```sql
-- Check if teacher has a classroom
SELECT 
  p.id as teacher_id,
  p.full_name,
  p.email,
  c.id as classroom_id,
  c.name as classroom_name,
  c.subject
FROM public.profiles p
LEFT JOIN public.classrooms c ON c.teacher_id = p.id
WHERE p.role = 'teacher';
```

**If no classroom exists**, you need to:
1. Have an admin create the teacher properly using the "Add Teacher" feature
2. Or manually create a classroom:

```sql
-- Replace 'teacher-user-id-here' with actual teacher's user ID
INSERT INTO public.classrooms (teacher_id, name, description, subject)
VALUES (
  'teacher-user-id-here',
  'My Classroom',
  'Classroom description',
  'Mathematics'  -- or whatever subject
);
```

### Step 4: Test RLS Policies

Run this as the teacher user (in Supabase SQL Editor, you'll need to use the service role or test via the app):

```sql
-- This should return the teacher's classroom
-- (Run this after logging in as teacher in the app, check browser console)
SELECT * FROM public.classrooms WHERE teacher_id = auth.uid();
```

### Step 5: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to access teacher dashboard
4. Look for error messages like:
   - "Classroom fetch error"
   - "RLS policy violation"
   - "Permission denied"

### Step 6: Verify Route Structure

Make sure these files exist:
- ✅ `app/dashboard/teacher/page.tsx`
- ✅ `app/dashboard/teacher/classroom/[classroomId]/page.tsx`

## Quick Diagnostic Query

Run this to get a full picture:

```sql
-- Full diagnostic query
SELECT 
  'Teacher Profile' as check_type,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as ids
FROM public.profiles 
WHERE role = 'teacher'

UNION ALL

SELECT 
  'Classrooms' as check_type,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as ids
FROM public.classrooms

UNION ALL

SELECT 
  'Teachers with Classrooms' as check_type,
  COUNT(*) as count,
  STRING_AGG(p.id::text, ', ') as ids
FROM public.profiles p
INNER JOIN public.classrooms c ON c.teacher_id = p.id
WHERE p.role = 'teacher'

UNION ALL

SELECT 
  'RLS Policies for Classrooms' as check_type,
  COUNT(*) as count,
  STRING_AGG(policyname, ', ') as ids
FROM pg_policies 
WHERE tablename = 'classrooms' 
AND schemaname = 'public';
```

## Expected Results

- **Teacher Profile**: Should be > 0
- **Classrooms**: Should be > 0
- **Teachers with Classrooms**: Should match number of teachers
- **RLS Policies**: Should be at least 4 policies

## If Still Not Working

1. **Clear browser cache and cookies**
2. **Log out and log back in**
3. **Check Supabase logs** (Dashboard → Logs → API Logs)
4. **Verify environment variables** in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Common Error Messages

### "No Classroom Found"
- Teacher doesn't have a classroom assigned
- Fix: Create classroom or have admin add teacher properly

### "Classroom Not Found" (404)
- RLS policies blocking access
- Fix: Run migration 012

### "Unauthorized"
- Authentication issue
- Fix: Check profile exists and role is 'teacher'

### "RLS policy violation"
- Policies not set up correctly
- Fix: Run migration 012
