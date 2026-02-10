"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Slide {
  id: string
  title: string
  description: string | null
  cta_text: string | null
  cta_link: string | null
  image_url: string | null
  display_order: number
}

interface HomepageSliderProps {
  /** Rendered when there are no active slides (e.g. about image or placeholder) */
  fallback?: React.ReactNode
}

export function HomepageSlider({ fallback }: HomepageSliderProps) {
  const [slides, setSlides] = useState<Slide[]>([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("homepage_slides")
      .select("id, title, description, cta_text, cta_link, image_url, display_order")
      .eq("is_active", true)
      .or("start_date.is.null,start_date.lte.now()")
      .or("end_date.is.null,end_date.gte.now()")
      .order("display_order", { ascending: true })
      .then(({ data }) => {
        if (data?.length) setSlides(data)
      })
  }, [])

  useEffect(() => {
    if (slides.length <= 1) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, 5000)
    return () => clearInterval(id)
  }, [slides.length])

  if (slides.length === 0) return <>{fallback ?? null}</>

  const slide = slides[index]

  return (
    <div className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-xl bg-deep-teal/20">
      <div className="relative aspect-[2/1] md:aspect-[3/1]">
        {slide.image_url ? (
          <img
            src={slide.image_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-deep-teal to-success-green" />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center text-white bg-black/30">
          <h2 className="text-2xl md:text-4xl font-bold">{slide.title}</h2>
          {slide.description && (
            <p className="text-lg text-white/90 max-w-2xl">{slide.description}</p>
          )}
          {slide.cta_text && slide.cta_link && (
            <Link
              href={slide.cta_link}
              className="inline-flex items-center rounded-lg bg-white px-6 py-2 font-medium text-deep-teal hover:bg-white/90"
            >
              {slide.cta_text}
            </Link>
          )}
        </div>
      </div>
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-2 bg-white/50"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
