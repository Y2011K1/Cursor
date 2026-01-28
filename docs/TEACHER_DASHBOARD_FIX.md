# Teacher Dashboard Login Issue - Fix Guide

## Problem
After running migration `011_remove_courses_link_to_classrooms.sql`, the teacher dashboard doesn't log in.

## Root Cause
Migration 011 drops all RLS policies that reference `course_id`, but doesn't recreate them. You need to run migration 012 to recreate the policies with the correct classroom-based logic.

## Solution

### Step 1: Verify Migration Status
Run this SQL in Supabase SQL Editor to check if policies exist:

```sql
-- Check if classrooms policies exist
SELECT policyname, tablename 
FROM pg_policies 
WHERE tablename = 'classrooms' 
AND schemaname = 'public';
```

You should see:
- "Teachers can view own classroom"
- "Teachers can update own classroom"

If these don't exist, the initial migration (002_rls_policies.sql) might not have run.

### Step 2: Run Migration 012
**CRITICAL**: After running migration 011, you MUST run migration 012:

1. Go to Supabase Dashboard → SQL Editor
2. Run `012_update_rls_policies_for_classrooms.sql`
3. This recreates all RLS policies with classroom-based logic

### Step 3: Verify Policies
Run this to verify all policies are created:

```sql
-- Check all policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Step 4: Test Teacher Access
1. Log in as a teacher
2. Check browser console for any errors
3. Check Supabase logs for RLS policy violations

## Common Issues

### Issue: "No Classroom Found"
**Cause**: Teacher doesn't have a classroom assigned.

**Fix**: 
```sql
-- Check if teacher has a classroom
SELECT c.*, p.full_name, p.role
FROM public.classrooms c
JOIN public.profiles p ON c.teacher_id = p.id
WHERE p.role = 'teacher';

-- If no classroom, create one (replace with actual teacher_id)
INSERT INTO public.classrooms (teacher_id, name, description, subject)
VALUES ('teacher-user-id-here', 'My Classroom', 'Classroom description', 'Mathematics');
```

### Issue: RLS Policy Blocking Access
**Cause**: RLS policies not correctly set up.

**Fix**: 
1. Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'classrooms';`
2. Re-run migration 012
3. Check that `auth.uid()` returns the correct user ID

### Issue: "Unauthorized" Error
**Cause**: `requireRole` function failing.

**Fix**:
1. Check profile exists: `SELECT * FROM public.profiles WHERE id = 'your-user-id';`
2. Verify role is 'teacher': `SELECT role FROM public.profiles WHERE id = 'your-user-id';`
3. Check authentication: `SELECT * FROM auth.users WHERE id = 'your-user-id';`

## Migration Order (IMPORTANT)

Run migrations in this exact order:

1. ✅ `001_initial_schema.sql` - Creates tables
2. ✅ `002_rls_policies.sql` - Creates initial RLS policies
3. ✅ `003_functions_triggers.sql` - Creates functions and triggers
4. ✅ `011_remove_courses_link_to_classrooms.sql` - Removes courses, drops old policies
5. ✅ **`012_update_rls_policies_for_classrooms.sql`** - **MUST RUN AFTER 011**
6. ✅ `013_update_functions_for_classrooms.sql` - Updates functions

## Quick Test Query

Run this as a teacher user to test access:

```sql
-- This should return your classroom
SELECT * FROM public.classrooms WHERE teacher_id = auth.uid();
```

If this returns nothing, check:
1. Your user ID matches: `SELECT auth.uid();`
2. Classroom exists: `SELECT * FROM public.classrooms;`
3. RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'classrooms';`
