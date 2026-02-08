-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- Extends auth.users with role and metadata
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CLASSROOMS TABLE
-- Each teacher owns exactly one classroom
-- ============================================
CREATE TABLE public.classrooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  max_students INTEGER DEFAULT 10 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT max_students_check CHECK (max_students > 0 AND max_students <= 50)
);

-- Enable RLS
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ENROLLMENTS TABLE
-- Students can be enrolled in multiple classrooms
-- ============================================
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  -- Prevent duplicate enrollments in the same classroom
  UNIQUE(student_id, classroom_id)
);

-- Enable RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- COURSES TABLE
-- Courses belong to a classroom
-- ============================================
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0 NOT NULL,
  is_published BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- LESSONS TABLE
-- Lessons belong to a course
-- ============================================
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  video_provider TEXT CHECK (video_provider IN ('bunny.net', 'youtube', 'vimeo', 'other')),
  order_index INTEGER DEFAULT 0 NOT NULL,
  is_published BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- ============================================
-- QUIZZES TABLE (Assignments)
-- Quizzes are part of a course, can be accessed anytime
-- ============================================
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER,
  max_attempts INTEGER DEFAULT 1,
  is_published BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- EXAMS TABLE
-- Exams are part of a course, one attempt only, timed
-- ============================================
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT time_limit_check CHECK (time_limit_minutes > 0)
);

-- Enable RLS
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- ============================================
-- QUIZ_QUESTIONS TABLE
-- All questions are multiple choice
-- ============================================
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  points INTEGER DEFAULT 1 NOT NULL,
  order_index INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- EXAM_QUESTIONS TABLE
-- All questions are multiple choice
-- ============================================
CREATE TABLE public.exam_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  points INTEGER DEFAULT 1 NOT NULL,
  order_index INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- QUIZ_SUBMISSIONS TABLE
-- Track student quiz attempts
-- ============================================
CREATE TABLE public.quiz_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  submitted_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,
  score INTEGER,
  total_points INTEGER,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  UNIQUE(quiz_id, student_id, id)
);

-- Enable RLS
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- QUIZ_ANSWERS TABLE
-- Store individual question answers
-- ============================================
CREATE TABLE public.quiz_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES public.quiz_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_answer TEXT CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0 NOT NULL,
  UNIQUE(submission_id, question_id)
);

-- Enable RLS
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- EXAM_SUBMISSIONS TABLE
-- Track student exam attempts (one attempt only)
-- ============================================
CREATE TABLE public.exam_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  submitted_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,
  score INTEGER,
  total_points INTEGER,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  -- Ensure only one attempt per exam per student
  UNIQUE(exam_id, student_id)
);

-- Enable RLS
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- EXAM_ANSWERS TABLE
-- Store individual question answers
-- ============================================
CREATE TABLE public.exam_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES public.exam_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  selected_answer TEXT CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0 NOT NULL,
  UNIQUE(submission_id, question_id)
);

-- Enable RLS
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- LESSON_PROGRESS TABLE
-- Track lesson completion and watch time
-- ============================================
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  watch_time_seconds INTEGER DEFAULT 0 NOT NULL,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  UNIQUE(lesson_id, student_id)
);

-- Enable RLS
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- ============================================
-- MESSAGES TABLE
-- Real-time chat between users
-- ============================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Ensure users can only message within their classroom context
  CONSTRAINT valid_message_relationship CHECK (
    (sender_id != receiver_id)
  )
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_classrooms_teacher_id ON public.classrooms(teacher_id);
CREATE INDEX idx_enrollments_student_id ON public.enrollments(student_id) WHERE is_active = true;
CREATE INDEX idx_enrollments_classroom_id ON public.enrollments(classroom_id);
CREATE INDEX idx_courses_classroom_id ON public.courses(classroom_id);
CREATE INDEX idx_lessons_course_id ON public.lessons(course_id);
CREATE INDEX idx_quizzes_course_id ON public.quizzes(course_id);
CREATE INDEX idx_exams_course_id ON public.exams(course_id);
CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX idx_exam_questions_exam_id ON public.exam_questions(exam_id);
CREATE INDEX idx_quiz_submissions_student_id ON public.quiz_submissions(student_id);
CREATE INDEX idx_quiz_submissions_quiz_id ON public.quiz_submissions(quiz_id);
CREATE INDEX idx_exam_submissions_student_id ON public.exam_submissions(student_id);
CREATE INDEX idx_exam_submissions_exam_id ON public.exam_submissions(exam_id);
CREATE INDEX idx_lesson_progress_student_id ON public.lesson_progress(student_id);
CREATE INDEX idx_lesson_progress_lesson_id ON public.lesson_progress(lesson_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_classroom_id ON public.messages(classroom_id);
