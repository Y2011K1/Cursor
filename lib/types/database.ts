/**
 * Database Types
 * Generated types for Supabase database schema
 */

export type UserRole = 'admin' | 'teacher' | 'student'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Classroom {
  id: string
  teacher_id: string
  name: string
  description: string | null
  max_students: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  classroom_id: string
  enrolled_at: string
  is_active: boolean
}

export interface Course {
  id: string
  classroom_id: string
  title: string
  description: string | null
  order_index: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  content: string | null
  video_url: string | null
  video_provider: 'bunny.net' | 'youtube' | 'vimeo' | 'other' | null
  order_index: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Quiz {
  id: string
  course_id: string
  title: string
  description: string | null
  time_limit_minutes: number | null
  max_attempts: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Exam {
  id: string
  course_id: string
  title: string
  description: string | null
  time_limit_minutes: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  points: number
  order_index: number
  created_at: string
}

export interface ExamQuestion {
  id: string
  exam_id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  points: number
  order_index: number
  created_at: string
}

export interface QuizSubmission {
  id: string
  quiz_id: string
  student_id: string
  started_at: string
  submitted_at: string | null
  time_spent_seconds: number | null
  score: number | null
  total_points: number | null
  is_completed: boolean
}

export interface QuizAnswer {
  id: string
  submission_id: string
  question_id: string
  selected_answer: 'A' | 'B' | 'C' | 'D' | null
  is_correct: boolean | null
  points_earned: number
}

export interface ExamSubmission {
  id: string
  exam_id: string
  student_id: string
  started_at: string
  submitted_at: string | null
  time_spent_seconds: number | null
  score: number | null
  total_points: number | null
  is_completed: boolean
}

export interface ExamAnswer {
  id: string
  submission_id: string
  question_id: string
  selected_answer: 'A' | 'B' | 'C' | 'D' | null
  is_correct: boolean | null
  points_earned: number
}

export interface LessonProgress {
  id: string
  lesson_id: string
  student_id: string
  is_completed: boolean
  watch_time_seconds: number
  last_accessed_at: string
  completed_at: string | null
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  classroom_id: string | null
  content: string
  is_read: boolean
  created_at: string
}

// Helper types for joins
export interface ClassroomWithTeacher extends Classroom {
  teacher: Profile
}

export interface CourseWithClassroom extends Course {
  classroom: Classroom
}

export interface LessonWithCourse extends Lesson {
  course: Course
}

export interface QuizWithCourse extends Quiz {
  course: Course
}

export interface ExamWithCourse extends Exam {
  course: Course
}

export interface EnrollmentWithClassroom extends Enrollment {
  classroom: Classroom
}

export interface EnrollmentWithStudent extends Enrollment {
  student: Profile
}
