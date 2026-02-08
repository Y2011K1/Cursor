# Supabase Database Migrations

SQL migrations for the Educational Platform. Run them **in filename order** (001, 002, 003, … 113).

---

## Which migrations to use

**Use all of them in order.** Apply every migration from `001` through `113` so schema, RLS, and fixes are in place.

### Core (run first, in order)

| Order | File | Purpose |
|-------|------|--------|
| 1 | `001_initial_schema.sql` | Base tables (profiles, courses, lessons, etc.) |
| 2 | `002_rls_policies.sql` | RLS + helpers (`is_admin()`, `is_teacher()`, etc.) |
| 3 | `003_functions_triggers.sql` | Triggers, `update_updated_at_column()` |
| 4 | `004_admin_functions.sql` | Admin helpers |
| 5–27 | `005_*` … `027_*` | Enrollment, RLS fixes, materials, indexes |

### Rename and features (100+)

| Order | File | Purpose |
|-------|------|--------|
| 28 | `100_rename_classrooms_to_courses.sql` | Classrooms → courses, RLS updates |
| 29 | `101_enhance_courses.sql` | Course fields |
| 30 | `102_teacher_profiles.sql` | Teacher profiles table + RLS |
| 31 | `103_ratings_feedback.sql` | Course/teacher ratings + RLS |
| 32 | `104_blog_system.sql` | Blog categories & posts + RLS |
| 33 | `105_announcements_slides.sql` | Announcements & hero slides + RLS |
| 34 | `106_enhance_quiz_submissions.sql` | Quiz submission tweaks |
| 35 | `107_certificates.sql` | Certificates table + RLS |
| 36 | `108_landing_page_system.sql` | About, testimonials, platform_stats + RLS |
| 37 | `109_teacher_profile_extras.sql` | Teacher profile columns |
| 38 | `110_testimonials_students_only.sql` | Testimonials student_id + RLS |
| 39 | `111_featured_links.sql` | (If present: testimonials or other; see repo) |
| 40 | `112_blog_post_links.sql` | Blog post links table + RLS (needs 104) |
| **41** | **`113_fix_rls_policies.sql`** | **Fixes RLS so admin policies work (WITH CHECK + is_admin())** |

---

## RLS fix (113)

**Run `113_fix_rls_policies.sql`** so admin can insert/update/delete where intended.

It:

- Refreshes `public.is_admin()` and uses it everywhere for admin checks.
- Adds **WITH CHECK** to every “Admin manages” **FOR ALL** policy so INSERT/UPDATE succeed.
- Recreates admin policies for:  
  `blog_posts`, `blog_categories`, `announcements`, `homepage_slides`, `about_section`, `testimonials`, `platform_stats`, `certificates`, `course_ratings`, `teacher_ratings`, `blog_post_links`, and (if the table exists) `featured_links`.

After 113, admin policies should work for dashboard and landing-page management.

---

## How to apply

### Supabase Dashboard (SQL Editor)

1. Open **SQL Editor** in your project.
2. Run each migration file in order (001 → 002 → … → 113).
3. Paste the file contents and click **Run**.

### Supabase CLI

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

`db push` runs all migrations in order.

---

## If policies still don’t work

1. **Confirm 113 ran:**  
   In SQL Editor:  
   `SELECT * FROM pg_policies WHERE policyname LIKE '%Admin%';`  
   You should see policies that use `public.is_admin()` and have both `USING` and `WITH CHECK` where applicable.

2. **Confirm your user is admin:**  
   `SELECT id, role FROM public.profiles WHERE id = auth.uid();`  
   Role should be `admin`.

3. **Confirm RLS is on:**  
   `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blog_posts';`  
   `rowsecurity` should be `true`.

---

## First admin user

After migrations:

1. Sign up in the app (or create a user in Auth).
2. In Supabase: **Authentication → Users** → select user → set metadata, or run (replace the id):  
   `UPDATE public.profiles SET role = 'admin' WHERE id = 'your-user-uuid';`
