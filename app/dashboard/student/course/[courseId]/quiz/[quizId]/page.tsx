"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { ArrowLeft, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function StudentQuizPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const quizId = params.quizId as string
  const router = useRouter()
  const supabase = createClient()
  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isLongLoading, setIsLongLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submission, setSubmission] = useState<any>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [profile, setProfile] = useState<any>(null)

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

        if (!classroomResult.data) {
          router.push("/dashboard/student")
          return
        }

        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("student_id", user.id)
          .eq("course_id", classroomResult.data.id)
          .eq("is_active", true)
          .single()

        if (!enrollment) {
          router.push(`/dashboard/student?course=${courseId}`)
          return
        }

        // Get quiz, questions, and submission in parallel
        const [quizResult, questionsResult, submissionResult] = await Promise.all([
          supabase
            .from("quizzes")
            .select("*")
            .eq("id", quizId)
            .eq("course_id", courseId)
            .eq("is_published", true)
            .single(),
          supabase
            .from("quiz_questions")
            .select("*")
            .eq("quiz_id", quizId)
            .order("order_index", { ascending: true }),
          supabase
            .from("quiz_submissions")
            .select("*")
            .eq("quiz_id", quizId)
            .eq("student_id", user.id)
            .order("started_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        ])

        const quizData = quizResult.data
        if (!quizData) {
          router.push(`/dashboard/student/course/${courseId}/assignments`)
          return
        }

        setQuiz(quizData)
        setQuestions(questionsResult.data || [])
        const submissionData = submissionResult.data

        if (submissionData) {
          setSubmission(submissionData)

          // Get answers (already have questions from parallel query above)
          const { data: answersData } = await supabase
            .from("quiz_answers")
            .select("*")
            .eq("submission_id", submissionData.id)

          const answersMap: Record<string, string> = {}
          answersData?.forEach((a) => {
            answersMap[a.question_id] = a.selected_answer || ""
          })
          setAnswers(answersMap)
        } else {
          // Create new submission
          const { data: newSubmission } = await supabase
            .from("quiz_submissions")
            .insert({
              quiz_id: quizId,
              student_id: user.id,
              started_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (newSubmission) {
            setSubmission(newSubmission)
          }
        }

        // Set timer if time limit exists
        if (quizData.time_limit_minutes && !submissionData?.is_completed) {
          const startTime = submissionData?.started_at
            ? new Date(submissionData.started_at).getTime()
            : Date.now()
          const timeLimitMs = quizData.time_limit_minutes * 60 * 1000
          const elapsed = Date.now() - startTime
          const remaining = Math.max(0, timeLimitMs - elapsed)
          setTimeRemaining(Math.floor(remaining / 1000))

          const timer = setInterval(() => {
            setTimeRemaining((prev) => {
              if (prev === null || prev <= 1) {
                clearInterval(timer)
                return 0
              }
              return prev - 1
            })
          }, 1000)

          return () => clearInterval(timer)
        }
      } catch (error) {
        console.error("Error loading quiz:", error)
        clearTimeout(longLoadingTimer)
      } finally {
        setIsLoading(false)
        clearTimeout(longLoadingTimer)
      }
    }

    if (courseId && quizId) loadData()
    else setIsLoading(false)

    return () => clearTimeout(longLoadingTimer)
  }, [courseId, quizId, router, supabase])

  const handleAnswerChange = async (questionId: string, answer: string) => {
    if (!submission || submission.is_completed) return

    setAnswers((prev) => ({ ...prev, [questionId]: answer }))

    // Save answer immediately (use RPC function to handle unique constraint)
    try {
      const { error } = await supabase.rpc("upsert_quiz_answer", {
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

  const handleSubmit = async () => {
    if (!submission || submission.is_completed) return

    setIsSubmitting(true)

    try {
      // Save all answers (use RPC function to handle unique constraint)
      for (const [questionId, answer] of Object.entries(answers)) {
        const { error: answerError } = await supabase.rpc("upsert_quiz_answer", {
          p_submission_id: submission.id,
          p_question_id: questionId,
          p_selected_answer: answer,
        })

        if (answerError) {
          console.error("Error saving answer:", answerError)
          throw new Error(`Failed to save answer: ${answerError.message}`)
        }
      }

      // Call auto-grade function
      const { error: gradeError } = await supabase.rpc("auto_grade_quiz_submission", {
        submission_uuid: submission.id,
      })

      if (gradeError) {
        console.error("Error auto-grading:", gradeError)
        throw new Error(`Failed to grade quiz: ${gradeError.message}`)
      }

      // Refresh to get updated submission
      router.refresh()
    } catch (error: any) {
      console.error("Error submitting quiz:", error)
      alert(`Failed to submit quiz: ${error.message || "Please try again."}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-sky flex items-center justify-center">
        <div className="text-center">
          {isLongLoading ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-deep-teal mx-auto mb-4" />
              <p className="text-slate-blue">Loading quiz... This may take a moment</p>
            </>
          ) : (
            <>
              <div className="animate-pulse space-y-4 w-full max-w-2xl mx-auto">
                <div className="h-8 bg-slate-blue/20 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-slate-blue/20 rounded w-1/2 mx-auto"></div>
                <div className="space-y-3 mt-8">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-4 border border-input rounded-md bg-white">
                      <div className="h-4 bg-slate-blue/20 rounded w-3/4 mb-3"></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-3 bg-slate-blue/20 rounded"></div>
                        <div className="h-3 bg-slate-blue/20 rounded"></div>
                        <div className="h-3 bg-slate-blue/20 rounded"></div>
                        <div className="h-3 bg-slate-blue/20 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  if (!quiz || !profile) {
    return null
  }

  const isCompleted = submission?.is_completed || false
  const canSubmit = !isCompleted && Object.keys(answers).length > 0

  return (
    <div className="min-h-screen bg-light-sky">
      <Navigation userRole="student" userName={profile.full_name} />
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <Button variant="ghost" size="sm" asChild className="text-slate-blue hover:text-deep-teal -ml-2">
              <Link href={`/dashboard/student/course/${courseId}/assignments`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Assignments
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-slate-blue hover:text-deep-teal">
              <Link href={`/dashboard/student?course=${courseId}`}>Dashboard</Link>
            </Button>
          </div>
          <div className="mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-deep-teal mb-2">
                  {quiz.title}
                </h1>
                {quiz.description && (
                  <p className="text-slate-blue">{quiz.description}</p>
                )}
              </div>
              {quiz.time_limit_minutes && timeRemaining !== null && !isCompleted && (
                <div className="flex items-center gap-2 text-warm-coral font-semibold">
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
                  Quiz Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-2xl font-bold text-deep-teal">
                    Score: {submission.score ?? 0} / {submission.total_points ?? 0}
                  </div>
                  <div className="text-slate-blue">
                    Percentage: {submission.total_points
                      ? Math.round(((submission.score || 0) / submission.total_points) * 100)
                      : 0}%
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

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
                            Correct (+{question.points})
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
                            } ${isCompleted ? "cursor-not-allowed" : ""}`}
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option}
                              checked={isSelected}
                              onChange={() => handleAnswerChange(question.id, option)}
                              disabled={isCompleted}
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

          {!isCompleted && (
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !canSubmit || (timeRemaining !== null && timeRemaining <= 0)}
                className="bg-deep-teal hover:bg-deep-teal/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Quiz"
                )}
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
