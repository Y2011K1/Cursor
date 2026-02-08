"use client"

import { useState, useRef } from "react"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SlideImageUploadProps {
  name: string
  defaultUrl?: string | null
  disabled?: boolean
  className?: string
}

export function SlideImageUpload({ name, defaultUrl, disabled, className }: SlideImageUploadProps) {
  const [value, setValue] = useState<string | null>(defaultUrl ?? null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    setError(null)
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image (JPEG, PNG, WebP, or GIF).")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5MB or smaller.")
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("image", file)
      const res = await fetch("/api/upload/slide-image", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Upload failed.")
        return
      }
      setValue(data.url)
    } catch {
      setError("Upload failed. Try again.")
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (disabled || uploading) return
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => {
    setDragging(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ""
  }

  const clearImage = () => {
    setValue(null)
    setError(null)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input type="hidden" name={name} value={value ?? ""} readOnly />
      {value ? (
        <div className="relative rounded-xl border-2 border-deep-teal/20 overflow-hidden bg-muted/30">
          <img
            src={value}
            alt="Slide preview"
            className="w-full h-40 object-cover"
          />
          {!disabled && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="rounded-xl bg-white/90 text-deep-teal px-4 py-2 text-sm font-medium hover:bg-white disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Replace"}
              </button>
              <button
                type="button"
                onClick={clearImage}
                disabled={uploading}
                className="rounded-xl bg-white/90 text-error-red px-4 py-2 text-sm font-medium hover:bg-white disabled:opacity-50 flex items-center gap-1"
              >
                <X className="h-4 w-4" /> Remove
              </button>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 p-8 min-h-[160px] cursor-pointer transition-colors",
            dragging && "border-deep-teal bg-deep-teal/5",
            !dragging && "border-deep-teal/30 hover:border-deep-teal/50 hover:bg-deep-teal/5",
            disabled && "opacity-60 cursor-not-allowed",
            uploading && "pointer-events-none"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileInput}
          />
          {uploading ? (
            <span className="text-sm text-slate-600">Uploading…</span>
          ) : (
            <>
              <Upload className="h-10 w-10 text-deep-teal/70" />
              <span className="text-sm font-medium text-deep-teal">
                Drop an image here or click to upload
              </span>
              <span className="text-xs text-slate-500">JPEG, PNG, WebP or GIF, max 5MB</span>
            </>
          )}
        </div>
      )}
      {error && (
        <p className="text-sm text-error-red flex items-center gap-1">
          <ImageIcon className="h-4 w-4" /> {error}
        </p>
      )}
    </div>
  )
}
