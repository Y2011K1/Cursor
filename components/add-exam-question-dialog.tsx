"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Loader2 } from "lucide-react"
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

type QuestionFormData = z.infer<typeof questionSchema>

interface AddExamQuestionDialogProps {
  examId: string
}

export function AddExamQuestionDialog({ examId }: AddExamQuestionDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      points: "1",
    },
  })

  const onSubmit = async (data: QuestionFormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      // Get current max order_index for this exam
      const { data: questions } = await supabase
        .from("exam_questions")
        .select("order_index")
        .eq("exam_id", examId)
        .order("order_index", { ascending: false })
        .limit(1)

      const nextOrderIndex = questions && questions.length > 0
        ? (questions[0].order_index || 0) + 1
        : 0

      const { error: insertError } = await supabase
        .from("exam_questions")
        .insert({
          exam_id: examId,
          question_text: data.question_text,
          option_a: data.option_a,
          option_b: data.option_b,
          option_c: data.option_c,
          option_d: data.option_d,
          correct_answer: data.correct_answer,
          points: parseInt(data.points),
          order_index: nextOrderIndex,
        })

      if (insertError) {
        setError(insertError.message)
        setIsSubmitting(false)
        return
      }

      setSuccess(true)
      reset()
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        router.refresh()
      }, 1000)
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
          Add Question
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-deep-teal">Add Question</DialogTitle>
          <DialogDescription>
            Add a multiple choice question to this exam
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-md bg-success-green/20 border border-success-green text-success-green text-sm">
              Question added successfully!
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="question_text">Question *</Label>
            <Input
              id="question_text"
              placeholder="What is 2 + 2?"
              {...register("question_text")}
            />
            {errors.question_text && (
              <p className="text-sm text-warm-coral">{errors.question_text.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="option_a">Option A *</Label>
              <Input
                id="option_a"
                placeholder="Answer option A"
                {...register("option_a")}
              />
              {errors.option_a && (
                <p className="text-sm text-warm-coral">{errors.option_a.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="option_b">Option B *</Label>
              <Input
                id="option_b"
                placeholder="Answer option B"
                {...register("option_b")}
              />
              {errors.option_b && (
                <p className="text-sm text-warm-coral">{errors.option_b.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="option_c">Option C *</Label>
              <Input
                id="option_c"
                placeholder="Answer option C"
                {...register("option_c")}
              />
              {errors.option_c && (
                <p className="text-sm text-warm-coral">{errors.option_c.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="option_d">Option D *</Label>
              <Input
                id="option_d"
                placeholder="Answer option D"
                {...register("option_d")}
              />
              {errors.option_d && (
                <p className="text-sm text-warm-coral">{errors.option_d.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="correct_answer">Correct Answer *</Label>
              <select
                id="correct_answer"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register("correct_answer")}
              >
                <option value="">Select answer</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
              {errors.correct_answer && (
                <p className="text-sm text-warm-coral">{errors.correct_answer.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Points *</Label>
              <Input
                id="points"
                type="number"
                min="1"
                placeholder="1"
                {...register("points")}
              />
              {errors.points && (
                <p className="text-sm text-warm-coral">{errors.points.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
              className="bg-deep-teal hover:bg-deep-teal/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Question"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
