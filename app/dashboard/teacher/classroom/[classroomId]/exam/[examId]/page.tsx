import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { FileText, ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { AddExamQuestionDialog } from "@/components/add-exam-question-dialog"
import { DeleteExamButton } from "@/components/delete-exam-button"
import { PublishExamButton } from "@/components/publish-exam-button"

interface ExamDetailPageProps {
  params: Promise<{ classroomId: string; examId: string }>
}

export default async function ExamDetailPage({ params }: ExamDetailPageProps) {
  try {
    const { classroomId, examId } = await params
    const profile = await requireRole("teacher")
    const supabase = await createClient()

    // Get teacher's classroom
    const { data: classroom } = await supabase
      .from("courses")
      .select("id")
      .eq("teacher_id", profile.id)
      .single()

    // Get exam and verify it belongs to teacher's classroom
    const { data: exam } = await supabase
      .from("exams")
      .select("*")
      .eq("id", examId)
      .eq("course_id", classroomId)
      .single()

    if (!exam) {
      notFound()
    }

    // Get exam questions
    const { data: questions } = await supabase
      .from("exam_questions")
      .select("*")
      .eq("exam_id", exam.id)
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
                    {exam.title}
                  </h1>
                  {exam.description && (
                    <p className="text-slate-blue mb-2">{exam.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-slate-blue">
                    <span>⏱️ {exam.time_limit_minutes} minutes</span>
                    <span>One attempt only</span>
                    {exam.due_date && (
                      <span>📅 Due: {new Date(exam.due_date).toLocaleDateString()}</span>
                    )}
                    {exam.is_published ? (
                      <span className="text-success-green">Published</span>
                    ) : (
                      <span>Draft</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <PublishExamButton
                    examId={exam.id}
                    isPublished={exam.is_published}
                  />
                  <DeleteExamButton
                    examId={exam.id}
                    examTitle={exam.title}
                    classroomId={classroomId}
                  />
                </div>
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
                      <AddExamQuestionDialog examId={exam.id} />
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
                            </div>

                            <div className="space-y-2">
                              <div className={`p-2 rounded ${question.correct_answer === "A" ? "bg-success-green/20 border border-success-green" : "bg-light-sky"}`}>
                                <span className="font-medium text-deep-teal">A:</span> {question.option_a}
                                {question.correct_answer === "A" && (
                                  <span className="ml-2 text-success-green text-xs">✓ Correct</span>
                                )}
                              </div>
                              <div className={`p-2 rounded ${question.correct_answer === "B" ? "bg-success-green/20 border border-success-green" : "bg-light-sky"}`}>
                                <span className="font-medium text-deep-teal">B:</span> {question.option_b}
                                {question.correct_answer === "B" && (
                                  <span className="ml-2 text-success-green text-xs">✓ Correct</span>
                                )}
                              </div>
                              <div className={`p-2 rounded ${question.correct_answer === "C" ? "bg-success-green/20 border border-success-green" : "bg-light-sky"}`}>
                                <span className="font-medium text-deep-teal">C:</span> {question.option_c}
                                {question.correct_answer === "C" && (
                                  <span className="ml-2 text-success-green text-xs">✓ Correct</span>
                                )}
                              </div>
                              <div className={`p-2 rounded ${question.correct_answer === "D" ? "bg-success-green/20 border border-success-green" : "bg-light-sky"}`}>
                                <span className="font-medium text-deep-teal">D:</span> {question.option_d}
                                {question.correct_answer === "D" && (
                                  <span className="ml-2 text-success-green text-xs">✓ Correct</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-blue text-center py-4">
                        No questions yet. Add your first question to get started.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-deep-teal">Exam Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-blue">Total Questions:</span>
                      <span className="font-medium text-deep-teal">{questions?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-blue">Total Points:</span>
                      <span className="font-medium text-deep-teal">{totalPoints}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-blue">Time Limit:</span>
                      <span className="font-medium text-deep-teal">{exam.time_limit_minutes} min</span>
                    </div>
                    {exam.due_date && (
                      <div className="flex justify-between">
                        <span className="text-slate-blue">Due Date:</span>
                        <span className="font-medium text-deep-teal">
                          {new Date(exam.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error: any) {
    if (error?.message?.includes("Unauthorized")) {
      redirect("/login")
    }
    notFound()
  }
}
