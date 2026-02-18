"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DepositionPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/operations/health/degradation?type=Deposition")
  }, [router])
  return null
}
