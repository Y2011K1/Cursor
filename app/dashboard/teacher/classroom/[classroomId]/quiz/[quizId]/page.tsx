import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { FileText, ArrowLeft, Plus, Eye, EyeOff, Clock, RotateCcw } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AddQuestionDialog } from "@/components/add-question-dialog"
import { PublishQuizButton } from "@/components/publish-quiz-button"
import { DeleteQuizButton } from "@/components/delete-quiz-button"

interface QuizDetailPageProps {
  params: Promise<{ classroomId: string; quizId: string }>
}

export default async function QuizDetailPage({ params }: QuizDetailPageProps) {
  const { classroomId, quizId } = await params
  const profile = await requireRole("teacher")
  const supabase = await createClient()

  // Get teacher's classroom
  const { data: classroom } = await supabase
    .from("classrooms")
    .select("id")
    .eq("teacher_id", profile.id)
    .single()

  // Get quiz and verify it belongs to teacher's classroom
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .eq("classroom_id", classroom?.id)
    .single()

  if (!quiz) {
    notFound()
  }

  // Get quiz questions
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", quiz.id)
    .order("order_index", { ascending: true })

  const totalPoints = questions?.reduce((sum, q) => sum + q.points, 0) || 0

  return (
    <div className="min-h-screen bg-light-sky">
      <Navigation userRole="teacher" userName={profile.full_name} />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-deep-teal mb-2">
                  {quiz.title}
                </h1>
                <p className="text-slate-blue">
                  {quiz.description || "No description"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {quiz.is_published ? (
                  <span className="text-xs px-3 py-1 rounded-full bg-success-green/20 text-success-green flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Published
                  </span>
                ) : (
                  <span className="text-xs px-3 py-1 rounded-full bg-slate-blue/20 text-slate-blue flex items-center gap-1">
                    <EyeOff className="h-3 w-3" />
                    Draft
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4 text-sm text-slate-blue">
              {quiz.time_limit_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {quiz.time_limit_minutes} minutes
                </span>
              )}
              <span className="flex items-center gap-1">
                <RotateCcw className="h-4 w-4" />
                Max {quiz.max_attempts} attempt{quiz.max_attempts > 1 ? "s" : ""}
              </span>
              <span className="font-medium text-deep-teal">
                Total: {totalPoints} points
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-deep-teal flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Questions ({questions?.length || 0})
                    </CardTitle>
                    <AddQuestionDialog quizId={quiz.id} />
                  </div>
                </CardHeader>
                <CardContent>
                  {questions && questions.length > 0 ? (
                    <div className="space-y-4">
                      {questions.map((question, index) => (
                        <div
                          key={question.id}
                          className="p-4 border border-input rounded-md bg-white"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-deep-teal">
                                  Question {index + 1}
                                </span>
                                <span className="text-xs text-slate-blue">
                                  ({question.points} point{question.points !== 1 ? "s" : ""})
                                </span>
                              </div>
                              <p className="text-dark-text font-medium mb-3">
                                {question.question_text}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className={`p-2 rounded border ${
                              question.correct_answer === "A"
                                ? "bg-success-green/20 border-success-green"
                                : "border-input"
                            }`}>
                              <span className="font-medium text-slate-blue">A:</span> {question.option_a}
                            </div>
                            <div className={`p-2 rounded border ${
                              question.correct_answer === "B"
                                ? "bg-success-green/20 border-success-green"
                                : "border-input"
                            }`}>
                              <span className="font-medium text-slate-blue">B:</span> {question.option_b}
                            </div>
                            <div className={`p-2 rounded border ${
                              question.correct_answer === "C"
                                ? "bg-success-green/20 border-success-green"
                                : "border-input"
                            }`}>
                              <span className="font-medium text-slate-blue">C:</span> {question.option_c}
                            </div>
                            <div className={`p-2 rounded border ${
                              question.correct_answer === "D"
                                ? "bg-success-green/20 border-success-green"
                                : "border-input"
                            }`}>
                              <span className="font-medium text-slate-blue">D:</span> {question.option_d}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-blue text-center py-8">
                      No questions yet. Add your first question to get started.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-deep-teal">Quiz Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <PublishQuizButton
                    quizId={quiz.id}
                    isPublished={quiz.is_published}
                  />
                  <Button className="w-full" variant="outline">
                    Edit Quiz Details
                  </Button>
                  <DeleteQuizButton
                    quizId={quiz.id}
                    quizTitle={quiz.title}
                    classroomId={classroomId}
                  />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-deep-teal">Quiz Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-blue">Questions:</span>
                    <span className="font-medium text-deep-teal">{questions?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-blue">Total Points:</span>
                    <span className="font-medium text-deep-teal">{totalPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-blue">Submissions:</span>
                    <span className="font-medium text-deep-teal">0</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
