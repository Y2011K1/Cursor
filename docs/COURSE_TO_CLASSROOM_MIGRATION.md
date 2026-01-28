# Course to Classroom Migration Guide

## Overview
The platform has been refactored to remove the "course" concept. Now, each classroom directly contains lessons, quizzes, and exams. Each classroom has a subject field.

## Database Changes

### Migration: `011_remove_courses_link_to_classrooms.sql`

1. **Added `subject` field to classrooms table**
2. **Added `classroom_id` to lessons, quizzes, and exams tables**
3. **Migrated data from courses to classrooms**
4. **Removed `course_id` foreign keys**
5. **Dropped the `courses` table**

## Key Changes

### Teacher Flow
- **Before**: Teacher Dashboard → Course → Lessons/Quizzes/Exams
- **After**: Teacher Dashboard → Classroom → Lessons/Quizzes/Exams

### Admin Flow
- When creating a teacher, admin must provide:
  - Classroom Name
  - **Subject** (new required field)
  - Classroom Description
  - Max Students

### Component Updates
- `AddLessonDialog`: Now uses `classroomId` instead of `courseId`
- `AddQuizDialog`: Now uses `classroomId` instead of `courseId`
- `AddExamDialog`: Now uses `classroomId` instead of `courseId`
- `AddTeacherDialog`: Added subject field

### Page Routes
- **Old**: `/dashboard/teacher/courses/[courseId]`
- **New**: `/dashboard/teacher/classroom/[classroomId]`

## Next Steps

1. **Run the migration** in Supabase SQL Editor:
   ```sql
   -- Run supabase/migrations/011_remove_courses_link_to_classrooms.sql
   ```

2. **Update RLS policies** (if needed) - The migration handles most of this, but verify:
   - Lessons policies should check `classroom_id`
   - Quizzes policies should check `classroom_id`
   - Exams policies should check `classroom_id`

3. **Update student pages** to work with classrooms directly (pending)

4. **Clean up old course-related files**:
   - `app/dashboard/teacher/courses/[courseId]/page.tsx` (can be removed)
   - `components/create-course-dialog.tsx` (can be removed)
   - `components/publish-course-button.tsx` (replaced by `publish-classroom-button.tsx`)

## Important Notes

- All existing data is migrated automatically
- The `subject` field on classrooms is optional but recommended
- Teachers can now directly manage their classroom content without the course layer
