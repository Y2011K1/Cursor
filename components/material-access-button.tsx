"use client"

import { Button } from "@/components/ui/button"
import { Download, Eye } from "lucide-react"
import { trackMaterialAccess } from "@/app/actions/material"
import { useState } from "react"

interface MaterialAccessButtonProps {
  materialId: string
  fileUrl: string
  fileName: string
  fileType?: string | null
  showView?: boolean
}

export function MaterialAccessButton({
  materialId,
  fileUrl,
  fileName,
  fileType,
  showView = false,
}: MaterialAccessButtonProps) {
  const [isTracking, setIsTracking] = useState(false)

  const handleAccess = async () => {
    if (!isTracking) {
      setIsTracking(true)
      await trackMaterialAccess(materialId)
    }
  }

  if (showView && (fileType?.toLowerCase().includes('pdf') || 
                   fileType?.toLowerCase().includes('image') ||
                   fileType?.toLowerCase().includes('text'))) {
    return (
      <>
        <Button 
          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white" 
          size="sm"
          asChild
        >
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={handleAccess}
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </a>
        </Button>
        <Button 
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" 
          size="sm"
          asChild
        >
          <a 
            href={fileUrl} 
            download={fileName}
            target="_blank" 
            rel="noopener noreferrer"
            onClick={handleAccess}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </a>
        </Button>
      </>
    )
  }

  return (
    <Button 
      className="w-full bg-purple-500 hover:bg-purple-600 text-white" 
      size="sm"
      asChild
    >
      <a 
        href={fileUrl} 
        download={fileName}
        target="_blank" 
        rel="noopener noreferrer"
        onClick={handleAccess}
      >
        <Download className="h-4 w-4 mr-2" />
        Download
      </a>
    </Button>
  )
}
