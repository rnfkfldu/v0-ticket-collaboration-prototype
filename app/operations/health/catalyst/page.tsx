"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CatalystPerformancePage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/operations/health/degradation?type=Catalyst+Performance")
  }, [router])
  return null
}
