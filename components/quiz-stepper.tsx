"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, CheckCircle2, Clock } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface Question {
  id: string
  text: string
  options: string[]
  order_index: number
}

interface QuizStepperProps {
  questions: Question[]
  answers: Record<string, string>
  onAnswerChange: (questionId: string, answer: string) => void
  onSubmit: () => void
  isSubmitting?: boolean
  timeRemaining?: number | null
}

export function QuizStepper({
  questions,
  answers,
  onAnswerChange,
  onSubmit,
  isSubmitting = false,
  timeRemaining,
}: QuizStepperProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0
  const currentQ = questions[currentQuestion]
  const currentAnswer = currentQ ? answers[currentQ.id] : ""

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const handleAnswerSelect = (value: string) => {
    if (currentQ) {
      onAnswerChange(currentQ.id, value)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (questions.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Progress bar and header */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-blue">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <div className="flex items-center gap-4">
            {timeRemaining != null && timeRemaining >= 0 ? (
              <span className="font-semibold text-deep-teal">
                <Clock className="h-4 w-4 inline mr-1" />
                {formatTime(timeRemaining)}
              </span>
            ) : null}
            <span className="font-semibold text-deep-teal">
              {Math.round(progress)}% Complete
            </span>
          </div>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-deep-teal rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
        
        {/* Question indicators */}
        <div className="flex gap-2 flex-wrap">
          {questions.map((q, index) => {
            const isAnswered = !!answers[q.id]
            const isCurrent = index === currentQuestion
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(index)}
                className={`
                  w-8 h-8 rounded-full text-xs font-medium transition-all
                  ${isCurrent 
                    ? 'bg-deep-teal text-white scale-110' 
                    : isAnswered 
                      ? 'bg-success-green text-white' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }
                `}
              >
                {index + 1}
              </button>
            )
          })}
        </div>
      </div>

      {/* Current question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-deep-teal flex items-center gap-2">
                <span className="text-lg font-semibold">Q{currentQuestion + 1}</span>
                {currentAnswer && (
                  <CheckCircle2 className="h-5 w-5 text-success-green" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg text-dark-text font-medium">{currentQ.text}</p>
              
              <RadioGroup
                value={currentAnswer}
                onValueChange={handleAnswerSelect}
                className="space-y-3"
              >
                {currentQ.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className="flex items-center space-x-3 p-4 border border-input rounded-lg hover:bg-light-sky transition-colors cursor-pointer"
                  >
                    <RadioGroupItem
                      value={optionIndex.toString()}
                      id={`option-${currentQ.id}-${optionIndex}`}
                    />
                    <Label
                      htmlFor={`option-${currentQ.id}-${optionIndex}`}
                      className="flex-1 cursor-pointer text-dark-text"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="min-w-[120px]"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentQuestion < questions.length - 1 ? (
          <Button
            onClick={handleNext}
            className="bg-deep-teal hover:bg-deep-teal/90 min-w-[120px]"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            size="lg"
            className="bg-success-green hover:bg-success-green/90 min-w-[140px]"
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        )}
      </div>
    </div>
  )
}
