"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname } from "next/navigation"

export function RouteProgress() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevPathname = useRef(pathname)

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      // Route changed - show quick completion
      setProgress(100)
      setVisible(true)
      prevPathname.current = pathname

      const hideTimer = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 200)

      if (timerRef.current) clearInterval(timerRef.current)
      return () => clearTimeout(hideTimer)
    }
  }, [pathname])

  // Start progress on click of any link
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a")
      if (!target) return
      const href = target.getAttribute("href")
      if (!href || href.startsWith("#") || href.startsWith("http") || href === pathname) return

      setProgress(20)
      setVisible(true)
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            if (timerRef.current) clearInterval(timerRef.current)
            return 90
          }
          return prev + Math.random() * 15
        })
      }, 150)
    }

    document.addEventListener("click", handleClick)
    return () => {
      document.removeEventListener("click", handleClick)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [pathname])

  if (!visible && progress === 0) return null

  return (
    <div
      className="fixed top-0 left-0 z-[100] h-0.5 bg-[#26A69A] transition-all duration-200 ease-out"
      style={{
        width: `${progress}%`,
        opacity: visible ? 1 : 0,
      }}
    />
  )
}
