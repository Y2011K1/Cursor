# Educational Platform

A focused, secure, and humane teaching platform built with Next.js 14, TypeScript, and Supabase.

## Features

- **Role-based Access Control**: Admin, Teacher, and Student roles with distinct permissions
- **Private Classrooms**: Each teacher owns one isolated classroom
- **Multi-Classroom Enrollment**: Students can join multiple classrooms
- **Auto-graded Assessments**: MCQ-based quizzes and exams with automatic grading
- **Progress Tracking**: Comprehensive analytics for students, teachers, and admins
- **Secure by Default**: Row Level Security (RLS) enforced at the database level

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd myapp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Add your Supabase credentials to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
myapp/
├── app/
│   ├── (auth)/          # Authentication routes
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/       # Dashboard pages
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── components/
│   └── ui/              # shadcn/ui components
├── lib/
│   ├── supabase/        # Supabase client utilities
│   └── utils.ts         # Utility functions
└── public/              # Static assets
```

## Color Palette

- **Deep Teal** (#2E5266): Primary brand color
- **Slate Blue** (#6E8898): Secondary text
- **Soft Mint** (#9FC5D4): Accents and hover states
- **Light Sky** (#E8F4F8): Backgrounds
- **Warm Coral** (#E07A5F): CTAs and warnings
- **Success Green** (#81B29A): Success messages

## Next Steps

1. Set up Supabase database schema
2. Implement Row Level Security policies
3. Build classroom management features
4. Create course content system
5. Implement quiz and exam functionality

## Making Your Account Admin

After signing up, you need to manually set your account as admin. See [docs/ADMIN_SETUP.md](./docs/ADMIN_SETUP.md) for detailed instructions.

Quick method:
1. Sign up through the app
2. Go to Supabase Dashboard → SQL Editor
3. Run: `UPDATE public.profiles SET role = 'admin' WHERE id = 'your-user-id';`
4. Log out and log back in

## License

MIT
