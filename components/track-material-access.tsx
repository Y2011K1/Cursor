"use client"

import { useEffect } from "react"
import { trackMaterialAccess } from "@/app/actions/material"

interface TrackMaterialAccessProps {
  materialId: string
}

export function TrackMaterialAccess({ materialId }: TrackMaterialAccessProps) {
  useEffect(() => {
    // Track access when component mounts (when material is viewed)
    trackMaterialAccess(materialId).catch((error) => {
      console.error("Error tracking material access:", error)
    })
  }, [materialId])

  return null
}
