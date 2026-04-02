"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, Ban, AlertTriangle } from "lucide-react"
import type { Milestone, LinkedTicket } from "@/lib/workbench-data"

interface GanttChartProps {
  milestones: Milestone[]
  linkedTickets: LinkedTicket[]
  startDate?: string
  endDate?: string
  className?: string
}

export function GanttChart({ 
  milestones, 
  linkedTickets, 
  startDate, 
  endDate,
  className 
}: GanttChartProps) {
  // Calculate date range
  const { chartStart, chartEnd, totalDays, months } = useMemo(() => {
    const dates: Date[] = []
    
    // Collect all dates from milestones and tickets
    milestones.forEach(ms => {
      if (ms.targetDate) dates.push(new Date(ms.targetDate))
      if (ms.completedDate) dates.push(new Date(ms.completedDate))
    })
    
    if (startDate) dates.push(new Date(startDate))
    if (endDate) dates.push(new Date(endDate))
    
    // Add today
    dates.push(new Date())
    
    if (dates.length === 0) {
      const today = new Date()
      return {
        chartStart: today,
        chartEnd: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000),
        totalDays: 90,
        months: []
      }
    }
    
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
    
    // Add padding
    minDate.setDate(minDate.getDate() - 14)
    maxDate.setDate(maxDate.getDate() + 30)
    
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Calculate months for header
    const months: { name: string; startPos: number; width: number }[] = []
    const currentDate = new Date(minDate)
    
    while (currentDate <= maxDate) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      
      const startPos = Math.max(0, Math.ceil((monthStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)))
      const endPos = Math.min(totalDays, Math.ceil((monthEnd.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)))
      
      months.push({
        name: `${currentDate.getFullYear()}.${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
        startPos,
        width: endPos - startPos
      })
      
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
    
    return { chartStart: minDate, chartEnd: maxDate, totalDays, months }
  }, [milestones, startDate, endDate])
  
  // Calculate position for a date
  const getDatePosition = (dateStr: string) => {
    const date = new Date(dateStr)
    const days = Math.ceil((date.getTime() - chartStart.getTime()) / (1000 * 60 * 60 * 24))
    return (days / totalDays) * 100
  }
  
  // Today's position
  const todayPosition = getDatePosition(new Date().toISOString().split('T')[0])
  
  const getStatusColor = (status: Milestone["status"]) => {
    switch (status) {
      case "completed": return "bg-emerald-500"
      case "in-progress": return "bg-amber-500"
      case "blocked": return "bg-red-500"
      default: return "bg-slate-300"
    }
  }
  
  const getStatusBgColor = (status: Milestone["status"]) => {
    switch (status) {
      case "completed": return "bg-emerald-100"
      case "in-progress": return "bg-amber-100"
      case "blocked": return "bg-red-100"
      default: return "bg-slate-100"
    }
  }
  
  const getStatusIcon = (status: Milestone["status"]) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-3 w-3 text-emerald-600" />
      case "in-progress": return <Circle className="h-3 w-3 text-amber-600 fill-amber-200" />
      case "blocked": return <Ban className="h-3 w-3 text-red-600" />
      default: return <Circle className="h-3 w-3 text-slate-400" />
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Chart Container */}
      <div className="border rounded-lg overflow-hidden">
        {/* Month Header */}
        <div className="flex h-8 bg-muted/50 border-b text-xs">
          <div className="w-48 shrink-0 px-3 flex items-center font-medium border-r">
            마일스톤
          </div>
          <div className="flex-1 relative">
            {months.map((month, idx) => (
              <div
                key={idx}
                className="absolute top-0 h-full flex items-center justify-center text-muted-foreground border-r"
                style={{
                  left: `${(month.startPos / totalDays) * 100}%`,
                  width: `${(month.width / totalDays) * 100}%`
                }}
              >
                {month.name}
              </div>
            ))}
          </div>
        </div>
        
        {/* Milestone Rows */}
        {milestones.map((ms, idx) => {
          const linkedTicketsForMs = linkedTickets.filter(t => ms.linkedTicketIds?.includes(t.id))
          const hasTargetDate = !!ms.targetDate
          const hasCompletedDate = !!ms.completedDate
          
          // Calculate bar positions
          let barStart = 0
          let barEnd = 0
          
          if (hasTargetDate) {
            // If there's a previous milestone, use its target date as start
            const prevMs = milestones[idx - 1]
            if (prevMs?.targetDate) {
              barStart = getDatePosition(prevMs.targetDate)
            } else if (startDate) {
              barStart = getDatePosition(startDate)
            } else {
              barStart = 5
            }
            barEnd = getDatePosition(ms.targetDate!)
          }
          
          return (
            <div 
              key={ms.id} 
              className={cn(
                "flex min-h-12 border-b last:border-b-0",
                idx % 2 === 0 ? "bg-background" : "bg-muted/20"
              )}
            >
              {/* Milestone Name */}
              <div className="w-48 shrink-0 px-3 py-2 border-r flex items-center gap-2">
                {getStatusIcon(ms.status)}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{ms.name}</p>
                  {linkedTicketsForMs.length > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      {linkedTicketsForMs.length}개 이벤트 연결
                    </p>
                  )}
                </div>
              </div>
              
              {/* Gantt Bar Area */}
              <div className="flex-1 relative py-2 px-1">
                {/* Today Line */}
                <div 
                  className="absolute top-0 bottom-0 w-px bg-red-400 z-10"
                  style={{ left: `${todayPosition}%` }}
                >
                  {idx === 0 && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-red-400 text-white text-[9px] px-1 rounded">
                      오늘
                    </div>
                  )}
                </div>
                
                {/* Gantt Bar */}
                {hasTargetDate && (
                  <div 
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 h-6 rounded-md flex items-center px-2",
                      getStatusBgColor(ms.status),
                      ms.status === "in-progress" && "border-2 border-amber-400"
                    )}
                    style={{
                      left: `${Math.min(barStart, barEnd)}%`,
                      width: `${Math.abs(barEnd - barStart)}%`,
                      minWidth: '40px'
                    }}
                  >
                    <div 
                      className={cn(
                        "h-2 rounded-full",
                        getStatusColor(ms.status)
                      )}
                      style={{
                        width: ms.status === "completed" ? "100%" : ms.status === "in-progress" ? "50%" : "0%"
                      }}
                    />
                  </div>
                )}
                
                {/* Completed marker */}
                {hasCompletedDate && (
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center z-20"
                    style={{ left: `${getDatePosition(ms.completedDate!)}%` }}
                  >
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                )}
                
                {/* Target date marker */}
                {hasTargetDate && (
                  <div 
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{ left: `${getDatePosition(ms.targetDate!)}%` }}
                  >
                    <div className="text-[9px] text-muted-foreground whitespace-nowrap -translate-x-1/2">
                      {ms.targetDate}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        
        {/* Empty state */}
        {milestones.length === 0 && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            마일스톤이 없습니다
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>완료</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span>진행 중</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-300" />
          <span>대기</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>차단</span>
        </div>
        <div className="flex items-center gap-1.5 ml-4">
          <div className="w-px h-4 bg-red-400" />
          <span>오늘</span>
        </div>
      </div>
    </div>
  )
}
