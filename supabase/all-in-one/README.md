# All migrations in one folder

This folder contains every Supabase migration in **run order**.

**Run them in this order** (by filename):

1. `001_initial_schema.sql` through `027_*.sql`
2. Then `100_*.sql` through `113_fix_rls_policies.sql`

**How to run:**

- **Supabase Dashboard:** SQL Editor → open each file in order → Run.
- **psql or other client:** Run each `.sql` file in the order above.

The main migration folder is still `supabase/migrations/` for `supabase db push`. This folder is a copy so you have everything in one place.
