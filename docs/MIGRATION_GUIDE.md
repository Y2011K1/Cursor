# Migration Guide: Removing Courses

## Overview
This migration removes the "courses" concept and links lessons, quizzes, and exams directly to classrooms. Each classroom now has a `subject` field.

## Migration Files

Run these migrations in order:

1. **011_remove_courses_link_to_classrooms.sql** - Main schema migration
2. **012_update_rls_policies_for_classrooms.sql** - Updates RLS policies
3. **013_update_functions_for_classrooms.sql** - Removes course-related triggers

## Steps to Run

### Option 1: Using Supabase CLI
```bash
supabase migration up
```

### Option 2: Manual Execution in Supabase SQL Editor

1. Go to Supabase Dashboard → SQL Editor
2. Run `011_remove_courses_link_to_classrooms.sql`
3. Run `012_update_rls_policies_for_classrooms.sql`
4. Run `013_update_functions_for_classrooms.sql`

## What the Migration Does

### Schema Changes
- ✅ Adds `subject` field to `classrooms` table
- ✅ Adds `classroom_id` to `lessons`, `quizzes`, and `exams` tables
- ✅ Migrates existing data from courses to classrooms
- ✅ Removes `course_id` columns
- ✅ Drops `courses` table
- ✅ Updates indexes

### Policy Updates
- ✅ Updates all RLS policies to use `classroom_id` instead of `course_id`
- ✅ Removes course-related policies

### Function Updates
- ✅ Updates `admin_setup_teacher` to not create courses
- ✅ Removes course-related triggers

## Important Notes

1. **Data Migration**: If you have existing courses, the migration will automatically migrate all lessons, quizzes, and exams to their respective classrooms.

2. **Orphaned Records**: Any records that can't be migrated (shouldn't happen) will be deleted. This is a safety measure.

3. **Backup**: Always backup your database before running migrations in production.

4. **Testing**: Test the migration on a development/staging environment first.

## Troubleshooting

### Error: "column course_id does not exist"
- This means the migration has already been partially run
- Check which steps have completed and continue from there

### Error: "relation courses does not exist"
- This is fine if you're starting fresh
- The migration handles this case gracefully

### Error: "violates not-null constraint"
- This shouldn't happen, but if it does, check for orphaned records
- The migration includes cleanup for this

## After Migration

1. ✅ Verify all lessons, quizzes, and exams have `classroom_id` set
2. ✅ Verify `courses` table is dropped
3. ✅ Test teacher dashboard - should redirect to classroom page
4. ✅ Test adding lessons, quizzes, exams - should work with `classroom_id`
5. ✅ Verify RLS policies work correctly

## Rollback

If you need to rollback, you would need to:
1. Recreate the `courses` table
2. Add `course_id` columns back
3. Migrate data back from `classroom_id` to `course_id`
4. Restore old RLS policies

**Note**: Rollback is complex. Always backup before migration.
