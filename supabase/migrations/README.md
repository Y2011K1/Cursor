# Supabase Database Migrations

This directory contains SQL migration files for setting up the Educational Platform database schema.

## Migration Files

1. **001_initial_schema.sql** - Creates all database tables, indexes, and constraints
2. **002_rls_policies.sql** - Sets up Row Level Security (RLS) policies for all tables
3. **003_functions_triggers.sql** - Creates database functions and triggers for automation
4. **004_admin_functions.sql** - Creates admin helper functions (optional, for manual operations)

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended for First Time)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open each migration file in order (001, 002, 003)
4. Copy and paste the contents into the SQL Editor
5. Click **Run** to execute each migration

### Option 2: Supabase CLI

If you have Supabase CLI installed:

```bash
# Initialize Supabase (if not already done)
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

### Option 3: Manual Execution

You can also run the migrations manually by executing the SQL files in order through:
- Supabase SQL Editor
- psql command line
- Any PostgreSQL client

## Migration Order

**IMPORTANT**: Run migrations in this exact order:

1. `001_initial_schema.sql` - Must run first (creates tables)
2. `002_rls_policies.sql` - Must run second (depends on tables)
3. `003_functions_triggers.sql` - Must run third (depends on tables and policies)
4. `004_admin_functions.sql` - Optional, run fourth (admin helper functions)

## Verification

After running all migrations, verify the setup:

1. Check that all tables exist:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

2. Check that RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

3. Test a helper function:
   ```sql
   SELECT public.is_admin();
   ```

## Creating Your First Admin User

After running migrations, you'll need to manually create an admin user:

1. Sign up through the app as a regular user
2. Go to Supabase Dashboard → Authentication → Users
3. Find your user and edit their metadata
4. Add: `{"role": "admin"}` to user metadata
5. Or run this SQL (replace with your user ID):
   ```sql
   UPDATE public.profiles 
   SET role = 'admin' 
   WHERE id = 'your-user-id-here';
   ```

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran migrations in order (001 → 002 → 003)
- Check that you're connected to the correct database

### Error: "permission denied"
- Ensure you're running migrations as a database superuser
- In Supabase Dashboard, you should have full permissions

### RLS Policies Not Working
- Verify RLS is enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- Check that policies exist: `SELECT * FROM pg_policies WHERE tablename = 'table_name';`

## Next Steps

After migrations are complete:

1. Set up environment variables in `.env.local`
2. Test authentication flow
3. Create test users (student, teacher, admin)
4. Build the dashboard UI
