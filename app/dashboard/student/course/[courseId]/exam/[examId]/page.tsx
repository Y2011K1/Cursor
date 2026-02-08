"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { ArrowLeft, Clock, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface ExamPageProps {
  params: {
    courseId: string
    examId: string
  }
}

export default function StudentExamPage({ params }: ExamPageProps) {
  const { courseId, examId } = params
  const router = useRouter()
  const supabase = createClient()
  const [exam, setExam] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isLongLoading, setIsLongLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submission, setSubmission] = useState<any>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [startTime, setStartTime] = useState<number | null>(null)

  useEffect(() => {
    // Show long loading indicator after 2 seconds
    const longLoadingTimer = setTimeout(() => {
      setIsLongLoading(true)
    }, 2000)

    const loadData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }

        // Optimize: Get profile, classroom, and enrollment in parallel
        const [profileResult, classroomResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single(),
          supabase
            .from("courses")
            .select("id")
            .eq("id", courseId)
            .eq("is_active", true)
            .single()
        ])

        setProfile(profileResult.data)

        if (classroomResult.data) {
          const { data: enrollment } = await supabase
            .from("enrollments")
            .select("id")
            .eq("student_id", user.id)
            .eq("course_id", classroomResult.data.id)
            .eq("is_active", true)
            .single()

          if (!enrollment) {
            router.push("/dashboard/student")
            return
          }
        }

        // Get exam, questions, and submission in parallel
        const [examResult, submissionResult] = await Promise.all([
          supabase
            .from("exams")
            .select("*")
            .eq("id", examId)
            .eq("course_id", courseId)
            .eq("is_published", true)
            .single(),
          supabase
            .from("exam_submissions")
            .select("*")
            .eq("exam_id", examId)
            .eq("student_id", user.id)
            .maybeSingle()
        ])

        const examData = examResult.data
        if (!examData) {
          router.push(`/dashboard/student/classroom/${courseId}`)
          return
        }

        setExam(examData)
        const submissionData = submissionResult.data

        if (submissionData) {
          setSubmission(submissionData)

          // Get questions and answers in parallel
          const [questionsResult, answersResult] = await Promise.all([
            supabase
              .from("exam_questions")
              .select("*")
              .eq("exam_id", examId)
              .order("order_index", { ascending: true }),
            supabase
              .from("exam_answers")
              .select("*")
              .eq("submission_id", submissionData.id)
          ])

          setQuestions(questionsResult.data || [])

          const answersMap: Record<string, string> = {}
          answersResult.data?.forEach((a) => {
            answersMap[a.question_id] = a.selected_answer || ""
          })
          setAnswers(answersMap)

          // Set timer if not completed
          if (!submissionData.is_completed && examData.time_limit_minutes) {
            const start = new Date(submissionData.started_at).getTime()
            const timeLimitMs = examData.time_limit_minutes * 60 * 1000
            const elapsed = Date.now() - start
            const remaining = Math.max(0, timeLimitMs - elapsed)
            setTimeRemaining(Math.floor(remaining / 1000))
            setStartTime(start)
          }
        } else {
          // Create new submission and get questions in parallel
          const now = Date.now()
          const [newSubmissionResult, questionsResult] = await Promise.all([
            supabase
              .from("exam_submissions")
              .insert({
                exam_id: examId,
                student_id: user.id,
                started_at: new Date(now).toISOString(),
              })
              .select()
              .single(),
            supabase
              .from("exam_questions")
              .select("*")
              .eq("exam_id", examId)
              .order("order_index", { ascending: true })
          ])

          const newSubmission = newSubmissionResult.data
          if (newSubmission) {
            setSubmission(newSubmission)
            setStartTime(now)
            setQuestions(questionsResult.data || [])

            // Set timer
            if (examData.time_limit_minutes) {
              const timeLimitMs = examData.time_limit_minutes * 60 * 1000
              setTimeRemaining(Math.floor(timeLimitMs / 1000))
            }
          }
        }
      } catch (error) {
        console.error("Error loading exam:", error)
        clearTimeout(longLoadingTimer)
      } finally {
        setIsLoading(false)
        clearTimeout(longLoadingTimer)
      }
    }

    loadData()

    return () => clearTimeout(longLoadingTimer)
  }, [courseId, examId, router, supabase])

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (!submission || submission.is_completed) return

    if (!autoSubmit && !confirm("Are you sure you want to submit? You cannot retake this exam.")) {
      return
    }

    setIsSubmitting(true)

    try {
      // Calculate time spent
      const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : null

      // Save all answers (use RPC function to handle unique constraint)
      for (const [questionId, answer] of Object.entries(answers)) {
        const { error: answerError } = await supabase.rpc("upsert_exam_answer", {
          p_submission_id: submission.id,
          p_question_id: questionId,
          p_selected_answer: answer,
        })

        if (answerError) {
          console.error("Error saving answer:", answerError)
          throw new Error(`Failed to save answer: ${answerError.message}`)
        }
      }

      // Update submission with time spent
      const { error: updateError } = await supabase
        .from("exam_submissions")
        .update({
          time_spent_seconds: timeSpent,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", submission.id)

      if (updateError) {
        console.error("Error updating submission:", updateError)
        throw new Error(`Failed to update submission: ${updateError.message}`)
      }

      // Call auto-grade function
      const { error: gradeError } = await supabase.rpc("auto_grade_exam_submission", {
        submission_uuid: submission.id,
      })

      if (gradeError) {
        console.error("Error auto-grading:", gradeError)
        throw new Error(`Failed to grade exam: ${gradeError.message}`)
      }

      // Refresh to get updated submission
      router.refresh()
    } catch (error: any) {
      console.error("Error submitting exam:", error)
      alert(`Failed to submit exam: ${error.message || "Please try again."}`)
    } finally {
      setIsSubmitting(false)
    }
  }, [submission, startTime, answers, supabase, router])

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && !submission?.is_completed) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer)
            // Auto-submit when time runs out
            if (prev !== null && prev <= 1) {
              handleSubmit(true)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [timeRemaining, submission, handleSubmit])

  const handleAnswerChange = async (questionId: string, answer: string) => {
    if (!submission || submission.is_completed) return

    setAnswers((prev) => ({ ...prev, [questionId]: answer }))

    // Save answer immediately (use RPC function to handle unique constraint)
    try {
      const { error } = await supabase.rpc("upsert_exam_answer", {
        p_submission_id: submission.id,
        p_question_id: questionId,
        p_selected_answer: answer,
      })

      if (error) {
        console.error("Error saving answer:", error)
      }
    } catch (error) {
      console.error("Error saving answer:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-sky flex items-center justify-center">
        <div className="text-slate-blue">Loading exam...</div>
      </div>
    )
  }

  if (!exam || !profile) {
    return null
  }

  const isCompleted = submission?.is_completed || false
  const canSubmit = !isCompleted && Object.keys(answers).length > 0
  const timeUp = timeRemaining !== null && timeRemaining <= 0

  return (
    <div className="min-h-screen bg-light-sky">
      <Navigation userRole="student" userName={profile.full_name} />
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-deep-teal mb-2">
                  {exam.title}
                </h1>
                {exam.description && (
                  <p className="text-slate-blue">{exam.description}</p>
                )}
                {!isCompleted && (
                  <div className="mt-2 flex items-center gap-2 text-warm-coral">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">You can only attempt this exam once</span>
                  </div>
                )}
              </div>
              {exam.time_limit_minutes && timeRemaining !== null && !isCompleted && (
                <div className={`flex items-center gap-2 font-semibold ${timeRemaining < 60 ? "text-warm-coral" : "text-deep-teal"}`}>
                  <Clock className="h-5 w-5" />
                  <span>
                    {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {isCompleted && submission ? (
            <Card className="border-0 shadow-md mb-6">
              <CardHeader>
                <CardTitle className="text-deep-teal flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-success-green" />
                  Exam Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-2xl font-bold text-deep-teal">
                    Score: {submission.score || 0} / {submission.total_points || 0} points
                  </div>
                  <div className="text-slate-blue">
                    Percentage: {submission.total_points
                      ? Math.round(((submission.score || 0) / submission.total_points) * 100)
                      : 0}%
                  </div>
                  {submission.time_spent_seconds && (
                    <div className="text-slate-blue">
                      Time spent: {Math.floor(submission.time_spent_seconds / 60)} minutes
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {timeUp && !isCompleted && (
            <Card className="border-0 shadow-md mb-6 bg-warm-coral/10 border-warm-coral">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-warm-coral font-semibold">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Time is up! Your exam will be automatically submitted.</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {questions.map((question, index) => {
              const selectedAnswer = answers[question.id] || ""
              const isCorrect = isCompleted && selectedAnswer === question.correct_answer
              const showResults = isCompleted

              return (
                <Card key={question.id} className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-deep-teal">
                      Question {index + 1}
                    </CardTitle>
                    <CardDescription>{question.question_text}</CardDescription>
                    {showResults && (
                      <div className="mt-2">
                        {isCorrect ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-success-green/20 text-success-green flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            Correct ({question.points} points)
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-warm-coral/20 text-warm-coral flex items-center gap-1 w-fit">
                            <XCircle className="h-3 w-3" />
                            Incorrect (Correct: {question.correct_answer})
                          </span>
                        )}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {["A", "B", "C", "D"].map((option) => {
                        const optionText = question[`option_${option.toLowerCase()}` as keyof typeof question] as string
                        const isSelected = selectedAnswer === option
                        const isCorrectOption = showResults && option === question.correct_answer

                        return (
                          <label
                            key={option}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                              isSelected
                                ? isCorrectOption
                                  ? "border-success-green bg-success-green/10"
                                  : "border-deep-teal bg-deep-teal/10"
                                : isCorrectOption && showResults
                                ? "border-success-green bg-success-green/5"
                                : "border-input hover:border-deep-teal/50"
                            } ${isCompleted || timeUp ? "cursor-not-allowed" : ""}`}
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option}
                              checked={isSelected}
                              onChange={() => handleAnswerChange(question.id, option)}
                              disabled={isCompleted || timeUp}
                              className="w-4 h-4 text-deep-teal"
                            />
                            <span className="font-medium text-deep-teal">{option}.</span>
                            <span className="text-slate-blue">{optionText}</span>
                          </label>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {!isCompleted && !timeUp && (
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || !canSubmit}
                className="bg-warm-coral hover:bg-warm-coral/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Exam"
                )}
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
