"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function IntegrityRiskPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/operations/health/degradation?type=Integrity+Risk")
  }, [router])
  return null
}
