"use client"

import { useState, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  Calendar, ChevronRight, FileText, AlertTriangle, CheckCircle,
  Clock, Layers, Activity, FlaskConical, ClipboardList,
  MessageSquare, Beaker, CalendarDays, ExternalLink
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// 날짜별 상태 타입
type DayStatus = "normal" | "caution" | "critical" | "no-data"

// 날짜별 데이터
interface DayData {
  date: string
  dayOfWeek: string
  status: DayStatus
  dailyMonitoring?: { exists: boolean; hasIssue: boolean; summary?: string; process?: string }
  tobDob?: { exists: boolean; summary?: string; shift?: string }
  operationPlan?: { exists: boolean; summary?: string }
  specialNotes: Array<{
    id: string
    time: string
    type: "anomaly" | "note" | "alarm" | "change"
    source: string
    content: string
    severity?: "low" | "medium" | "high"
    process?: string
    tag?: string
  }>
  processTests: Array<{
    id: string
    time: string
    title: string
    eventId?: string
    status: "scheduled" | "in-progress" | "completed"
    process?: string
  }>
}

// 샘플 데이터 생성
function generateDayData(dateStr: string, seedOffset: number = 0): DayData {
  const date = new Date(dateStr)
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"]
  const dayOfWeek = dayNames[date.getDay()]
  
  // 일관된 랜덤 생성을 위해 날짜 기반 시드 사용
  const seed = date.getDate() + seedOffset
  const rand = (seed * 9301 + 49297) % 233280 / 233280
  
  let status: DayStatus = "normal"
  if (rand > 0.85) status = "critical"
  else if (rand > 0.65) status = "caution"
  
  const hasIssue = status !== "normal"
  const processes = ["CDU", "VDU", "HCR", "CCR", "FCC"]
  const process = processes[seed % processes.length]
  
  const specialNotes: DayData["specialNotes"] = []
  const processTests: DayData["processTests"] = []
  
  // 특이사항 생성
  if (status === "critical") {
    specialNotes.push(
      { id: `sn-${dateStr}-1`, time: "09:15", type: "anomaly", source: "이상징후 모니터링", 
        content: `${process} Feed Temp 급격 상승 감지 - AI 알림 발생`, severity: "high", process, tag: "TI-101" },
      { id: `sn-${dateStr}-2`, time: "14:30", type: "alarm", source: "알람 시스템", 
        content: "TI-101 High Alarm 발생, 운전원 조치 완료", severity: "high", process, tag: "TI-101" }
    )
  } else if (status === "caution") {
    specialNotes.push(
      { id: `sn-${dateStr}-1`, time: "11:20", type: "note", source: "운전원 기록", 
        content: `Pump P-${301 + (seed % 10)} 진동 수치 상승 추이 관찰`, severity: "medium", process }
    )
  }
  
  // 일부 날짜에 추가 특이사항
  if ((seed * 7) % 10 > 6) {
    specialNotes.push(
      { id: `sn-${dateStr}-3`, time: "16:45", type: "change", source: "파라미터 변경", 
        content: "운전 파라미터 조정 완료 - 운전팀장 승인", severity: "low", process }
    )
  }
  
  // 공정 테스트 일정 (일부 날짜에만)
  if ((seed * 3) % 10 > 7) {
    processTests.push({
      id: `pt-${dateStr}-1`,
      time: "10:00",
      title: `${process} Catalyst Activity Test`,
      eventId: `EVT-${String(seed).padStart(3, '0')}`,
      status: date < new Date() ? "completed" : "scheduled",
      process
    })
  }
  
  return {
    date: dateStr,
    dayOfWeek,
    status,
    dailyMonitoring: { 
      exists: true, 
      hasIssue, 
      summary: hasIssue ? "특이사항 발생 - 상세 내용 확인 필요" : "정상 운전 유지", 
      process 
    },
    tobDob: (seed % 3 !== 0) ? { 
      exists: true, 
      summary: hasIssue ? "주의 필요 사항 인수인계" : "특이사항 없음", 
      shift: seed % 2 === 0 ? "Day→Night" : "Night→Day" 
    } : undefined,
    operationPlan: (seed % 4 !== 0) ? { 
      exists: true, 
      summary: "정상 운전 계획 유지" 
    } : undefined,
    specialNotes,
    processTests
  }
}

// 날짜 범위 생성
function generateDateRange(days: number, startDate?: string, endDate?: string): DayData[] {
  const result: DayData[] = []
  
  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    let current = new Date(end)
    
    while (current >= start) {
      const dateStr = current.toISOString().split("T")[0]
      result.push(generateDayData(dateStr))
      current.setDate(current.getDate() - 1)
    }
  } else {
    const today = new Date()
    for (let i = 0; i < days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      result.push(generateDayData(dateStr, i))
    }
  }
  
  return result
}

export default function ProcessLogsPage() {
  const [dateRange, setDateRange] = useState<"7" | "14" | "30" | "custom">("14")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [processFilter, setProcessFilter] = useState("all")
  
  // 날짜 데이터 생성
  const days = useMemo(() => {
    if (dateRange === "custom" && customStartDate && customEndDate) {
      return generateDateRange(0, customStartDate, customEndDate)
    }
    return generateDateRange(parseInt(dateRange))
  }, [dateRange, customStartDate, customEndDate])
  
  // 선택된 날짜 데이터
  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null
    return days.find(d => d.date === selectedDate) || null
  }, [selectedDate, days])
  
  // 통계
  const stats = useMemo(() => {
    const normal = days.filter(d => d.status === "normal").length
    const caution = days.filter(d => d.status === "caution").length
    const critical = days.filter(d => d.status === "critical").length
    return { normal, caution, critical, total: days.length }
  }, [days])
  
  const statusColors: Record<DayStatus, string> = {
    normal: "bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200",
    caution: "bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200",
    critical: "bg-red-100 border-red-300 text-red-700 hover:bg-red-200",
    "no-data": "bg-gray-100 border-gray-200 text-gray-400"
  }
  
  const statusLabels: Record<DayStatus, string> = {
    normal: "정상",
    caution: "주의",
    critical: "위험",
    "no-data": "데이터 없음"
  }
  
  const noteTypeIcons: Record<string, React.ElementType> = {
    anomaly: AlertTriangle,
    note: MessageSquare,
    alarm: Activity,
    change: Layers
  }
  
  const noteTypeLabels: Record<string, string> = {
    anomaly: "이상징후",
    note: "특이사항",
    alarm: "알람",
    change: "변경"
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">공정 연대기</h1>
            <p className="text-sm text-muted-foreground mt-1">
              날짜별 공정 운영 기록, 특이사항, 테스트 일정을 확인합니다
            </p>
          </div>
          
          {/* 날짜 범위 선택 */}
          <div className="flex items-center gap-3">
            <Select value={processFilter} onValueChange={setProcessFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="공정 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 공정</SelectItem>
                <SelectItem value="CDU">CDU</SelectItem>
                <SelectItem value="VDU">VDU</SelectItem>
                <SelectItem value="HCR">HCR</SelectItem>
                <SelectItem value="CCR">CCR</SelectItem>
                <SelectItem value="FCC">FCC</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={dateRange === "7" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setDateRange("7")}
              >
                7일
              </Button>
              <Button
                variant={dateRange === "14" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setDateRange("14")}
              >
                14일
              </Button>
              <Button
                variant={dateRange === "30" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setDateRange("30")}
              >
                30일
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateRange === "custom" ? "secondary" : "ghost"}
                    size="sm"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    기간 설정
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>시작일</Label>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>종료일</Label>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => setDateRange("custom")}
                      disabled={!customStartDate || !customEndDate}
                    >
                      적용
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        {/* 통계 카드 */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">조회 기간</span>
                <Badge variant="outline">{stats.total}일</Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-emerald-700">정상</span>
                <span className="text-xl font-bold text-emerald-700">{stats.normal}일</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-700">주의</span>
                <span className="text-xl font-bold text-amber-700">{stats.caution}일</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-700">위험</span>
                <span className="text-xl font-bold text-red-700">{stats.critical}일</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 메인 콘텐츠 */}
        <div className="grid grid-cols-12 gap-6">
          {/* 날짜별 타임라인 */}
          <Card className="col-span-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                날짜별 현황
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="p-3 space-y-1">
                  {days.map((day) => (
                    <button
                      key={day.date}
                      onClick={() => setSelectedDate(day.date)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                        statusColors[day.status],
                        selectedDate === day.date && "ring-2 ring-primary ring-offset-1"
                      )}
                    >
                      <div className="text-center min-w-[50px]">
                        <div className="text-xs opacity-70">{day.dayOfWeek}</div>
                        <div className="text-lg font-bold">{day.date.split("-")[2]}</div>
                        <div className="text-[10px] opacity-70">{day.date.split("-")[1]}월</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn(
                            "text-[10px] border-current",
                            day.status === "normal" && "text-emerald-600",
                            day.status === "caution" && "text-amber-600",
                            day.status === "critical" && "text-red-600"
                          )}>
                            {statusLabels[day.status]}
                          </Badge>
                          {day.specialNotes.length > 0 && (
                            <span className="text-[10px]">{day.specialNotes.length}건</span>
                          )}
                        </div>
                        {day.dailyMonitoring?.summary && (
                          <p className="text-xs mt-1 truncate opacity-80">
                            {day.dailyMonitoring.summary}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          
          {/* 선택된 날짜 상세 */}
          <Card className="col-span-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {selectedDayData ? (
                  <span className="flex items-center gap-2">
                    {selectedDayData.date} ({selectedDayData.dayOfWeek}) 상세 기록
                    <Badge className={cn(
                      "ml-2",
                      selectedDayData.status === "normal" && "bg-emerald-100 text-emerald-700",
                      selectedDayData.status === "caution" && "bg-amber-100 text-amber-700",
                      selectedDayData.status === "critical" && "bg-red-100 text-red-700"
                    )}>
                      {statusLabels[selectedDayData.status]}
                    </Badge>
                  </span>
                ) : (
                  "날짜를 선택하세요"
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDayData ? (
                <ScrollArea className="h-[560px]">
                  <div className="space-y-6 pr-4">
                    {/* 1. 정기 레포트 섹션 */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        정기 레포트
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {/* Daily Monitoring */}
                        <Card className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          selectedDayData.dailyMonitoring?.exists 
                            ? "border-blue-200 bg-blue-50/50" 
                            : "border-dashed opacity-50"
                        )}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <ClipboardList className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">Daily Monitoring</span>
                            </div>
                            {selectedDayData.dailyMonitoring?.exists ? (
                              <>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {selectedDayData.dailyMonitoring.summary}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  {selectedDayData.dailyMonitoring.process && (
                                    <Badge variant="outline" className="text-[10px]">
                                      {selectedDayData.dailyMonitoring.process}
                                    </Badge>
                                  )}
                                  <Button variant="link" size="sm" className="px-0 h-6 text-xs gap-1">
                                    <ExternalLink className="h-3 w-3" />
                                    상세
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <p className="text-xs text-muted-foreground">데이터 없음</p>
                            )}
                          </CardContent>
                        </Card>
                        
                        {/* TOB/DOB */}
                        <Card className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          selectedDayData.tobDob?.exists 
                            ? "border-purple-200 bg-purple-50/50" 
                            : "border-dashed opacity-50"
                        )}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-medium">TOB/DOB 레포트</span>
                            </div>
                            {selectedDayData.tobDob?.exists ? (
                              <>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {selectedDayData.tobDob.summary}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  {selectedDayData.tobDob.shift && (
                                    <Badge variant="outline" className="text-[10px]">
                                      {selectedDayData.tobDob.shift}
                                    </Badge>
                                  )}
                                  <Button variant="link" size="sm" className="px-0 h-6 text-xs gap-1">
                                    <ExternalLink className="h-3 w-3" />
                                    상세
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <p className="text-xs text-muted-foreground">데이터 없음</p>
                            )}
                          </CardContent>
                        </Card>
                        
                        {/* 운영 계획서 */}
                        <Card className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          selectedDayData.operationPlan?.exists 
                            ? "border-teal-200 bg-teal-50/50" 
                            : "border-dashed opacity-50"
                        )}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-teal-600" />
                              <span className="text-sm font-medium">운영 계획서</span>
                            </div>
                            {selectedDayData.operationPlan?.exists ? (
                              <>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {selectedDayData.operationPlan.summary}
                                </p>
                                <div className="flex items-center justify-end mt-2">
                                  <Button variant="link" size="sm" className="px-0 h-6 text-xs gap-1">
                                    <ExternalLink className="h-3 w-3" />
                                    상세
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <p className="text-xs text-muted-foreground">데이터 없음</p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                    
                    {/* 2. 특이사항 섹션 */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        특이사항 및 이상징후
                        {selectedDayData.specialNotes.length > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {selectedDayData.specialNotes.length}건
                          </Badge>
                        )}
                      </h3>
                      {selectedDayData.specialNotes.length > 0 ? (
                        <div className="space-y-2">
                          {selectedDayData.specialNotes.map((note) => {
                            const Icon = noteTypeIcons[note.type] || AlertTriangle
                            return (
                              <Card key={note.id} className={cn(
                                "border-l-4",
                                note.severity === "high" && "border-l-red-500 bg-red-50/30",
                                note.severity === "medium" && "border-l-amber-500 bg-amber-50/30",
                                note.severity === "low" && "border-l-blue-500 bg-blue-50/30"
                              )}>
                                <CardContent className="p-3">
                                  <div className="flex items-start gap-3">
                                    <div className={cn(
                                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                      note.severity === "high" && "bg-red-100",
                                      note.severity === "medium" && "bg-amber-100",
                                      note.severity === "low" && "bg-blue-100"
                                    )}>
                                      <Icon className={cn(
                                        "h-4 w-4",
                                        note.severity === "high" && "text-red-600",
                                        note.severity === "medium" && "text-amber-600",
                                        note.severity === "low" && "text-blue-600"
                                      )} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="text-xs font-medium">{note.time}</span>
                                        <Badge variant="outline" className="text-[10px]">
                                          {noteTypeLabels[note.type]}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground">
                                          {note.source}
                                        </span>
                                        {note.process && (
                                          <Badge variant="secondary" className="text-[10px]">
                                            {note.process}
                                          </Badge>
                                        )}
                                        {note.tag && (
                                          <Badge variant="outline" className="text-[10px] font-mono">
                                            {note.tag}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm">{note.content}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      ) : (
                        <Card className="border-dashed">
                          <CardContent className="py-8 text-center">
                            <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">특이사항 없음</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    
                    {/* 3. 공정 테스트 일정 */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <Beaker className="h-4 w-4" />
                        공정 테스트 일정 (이벤트 연동)
                        {selectedDayData.processTests.length > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {selectedDayData.processTests.length}건
                          </Badge>
                        )}
                      </h3>
                      {selectedDayData.processTests.length > 0 ? (
                        <div className="space-y-2">
                          {selectedDayData.processTests.map((test) => (
                            <Card key={test.id} className="border-indigo-200 bg-indigo-50/30">
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                      <FlaskConical className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-xs">{test.time}</span>
                                        <span className="text-sm font-medium">{test.title}</span>
                                      </div>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        {test.process && (
                                          <Badge variant="secondary" className="text-[10px]">
                                            {test.process}
                                          </Badge>
                                        )}
                                        {test.eventId && (
                                          <Badge variant="outline" className="text-[10px] text-indigo-600 cursor-pointer hover:bg-indigo-100">
                                            {test.eventId}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <Badge className={cn(
                                    "text-[10px]",
                                    test.status === "completed" && "bg-emerald-100 text-emerald-700",
                                    test.status === "in-progress" && "bg-blue-100 text-blue-700",
                                    test.status === "scheduled" && "bg-gray-100 text-gray-700"
                                  )}>
                                    {test.status === "completed" ? "완료" : test.status === "in-progress" ? "진행중" : "예정"}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card className="border-dashed">
                          <CardContent className="py-6 text-center">
                            <p className="text-sm text-muted-foreground">예정된 테스트 없음</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-[560px] flex items-center justify-center">
                  <div className="text-center">
                    <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      좌측에서 날짜를 선택하면<br />해당 일자의 상세 기록을 확인할 수 있습니다
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
