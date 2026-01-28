"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Loader2, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const questionSchema = z.object({
  question_text: z.string().min(5, "Question text must be at least 5 characters"),
  option_a: z.string().min(1, "Option A is required"),
  option_b: z.string().min(1, "Option B is required"),
  option_c: z.string().min(1, "Option C is required"),
  option_d: z.string().min(1, "Option D is required"),
  correct_answer: z.enum(["A", "B", "C", "D"], {
    required_error: "Please select the correct answer",
  }),
  points: z.string().refine((val) => {
    const num = parseInt(val)
    return !isNaN(num) && num > 0
  }, "Points must be a positive number"),
})

const examSchema = z.object({
  title: z.string().min(2, "Exam title must be at least 2 characters"),
  description: z.string().optional(),
  time_limit_minutes: z.string().refine((val) => {
    const num = parseInt(val)
    return !isNaN(num) && num > 0 && num <= 480
  }, "Time limit must be between 1 and 480 minutes"),
  due_date: z.string().optional(),
  questions: z.array(questionSchema).min(1, "At least one question is required"),
})

type ExamFormData = z.infer<typeof examSchema>

interface AddExamWithQuestionsDialogProps {
  classroomId: string
}

export function AddExamWithQuestionsDialog({ classroomId }: AddExamWithQuestionsDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      questions: [
        {
          question_text: "",
          option_a: "",
          option_b: "",
          option_c: "",
          option_d: "",
          correct_answer: "A",
          points: "1",
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  })

  const onSubmit = async (data: ExamFormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      // Create exam first
      const { data: exam, error: examError } = await supabase
        .from("exams")
        .insert({
          classroom_id: classroomId,
          title: data.title,
          description: data.description || null,
          time_limit_minutes: parseInt(data.time_limit_minutes),
          due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
          is_published: false,
        })
        .select()
        .single()

      if (examError || !exam) {
        setError(examError?.message || "Failed to create exam")
        setIsSubmitting(false)
        return
      }

      // Add all questions
      const questionsToInsert = data.questions.map((q, index) => ({
        exam_id: exam.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        points: parseInt(q.points),
        order_index: index,
      }))

      const { error: questionsError } = await supabase
        .from("exam_questions")
        .insert(questionsToInsert)

      if (questionsError) {
        // Rollback: delete the exam if questions fail
        await supabase.from("exams").delete().eq("id", exam.id)
        setError(questionsError.message)
        setIsSubmitting(false)
        return
      }

      setSuccess(true)
      reset()
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-soft-mint hover:bg-soft-mint/80 text-dark-text">
          <Plus className="h-4 w-4 mr-2" />
          Add Exam
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="text-deep-teal">Create New Exam with Questions</DialogTitle>
          <DialogDescription>
            Create an exam and add questions all at once. Students can only take it once.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 min-h-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-4" id="exam-form">
            {error && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-md bg-success-green/20 border border-success-green text-success-green text-sm">
                Exam created successfully with {fields.length} question{fields.length !== 1 ? "s" : ""}!
              </div>
            )}

            {/* Exam Details */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold text-deep-teal">Exam Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="title">Exam Title *</Label>
                <Input
                  id="title"
                  placeholder="Midterm Exam"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-warm-coral">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  rows={2}
                  placeholder="Exam instructions or description"
                  {...register("description")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="time_limit_minutes">Time Limit (minutes) *</Label>
                  <Input
                    id="time_limit_minutes"
                    type="number"
                    placeholder="60"
                    {...register("time_limit_minutes")}
                  />
                  {errors.time_limit_minutes && (
                    <p className="text-sm text-warm-coral">{errors.time_limit_minutes.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date (Optional)</Label>
                  <Input
                    id="due_date"
                    type="datetime-local"
                    {...register("due_date")}
                  />
                </div>
              </div>
            </div>

            {/* Questions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-deep-teal">Questions ({fields.length})</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({
                    question_text: "",
                    option_a: "",
                    option_b: "",
                    option_c: "",
                    option_d: "",
                    correct_answer: "A",
                    points: "1",
                  })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {errors.questions && (
                <p className="text-sm text-warm-coral">{errors.questions.message}</p>
              )}

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-lg bg-light-sky/50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-deep-teal">Question {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-warm-coral hover:text-warm-coral"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Question Text *</Label>
                        <Input
                          placeholder="What is 2 + 2?"
                          {...register(`questions.${index}.question_text`)}
                        />
                        {errors.questions?.[index]?.question_text && (
                          <p className="text-sm text-warm-coral">
                            {errors.questions[index]?.question_text?.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Option A *</Label>
                          <Input
                            placeholder="Answer A"
                            {...register(`questions.${index}.option_a`)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Option B *</Label>
                          <Input
                            placeholder="Answer B"
                            {...register(`questions.${index}.option_b`)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Option C *</Label>
                          <Input
                            placeholder="Answer C"
                            {...register(`questions.${index}.option_c`)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Option D *</Label>
                          <Input
                            placeholder="Answer D"
                            {...register(`questions.${index}.option_d`)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Correct Answer *</Label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            {...register(`questions.${index}.correct_answer`)}
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Points *</Label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="1"
                            {...register(`questions.${index}.points`)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>
        <div className="px-6 pb-6 pt-4 border-t flex-shrink-0 bg-white">
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                reset()
                setError(null)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="exam-form"
              className="bg-deep-teal hover:bg-deep-teal/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                `Create Exam with ${fields.length} Question${fields.length !== 1 ? "s" : ""}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
