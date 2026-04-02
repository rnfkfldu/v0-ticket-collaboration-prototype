"use client"

import { redirect, useParams } from "next/navigation"

export default function RoadmapDetailRedirect() {
  const { id } = useParams<{ id: string }>()
  redirect(`/actions/tasks/${id}`)
}
