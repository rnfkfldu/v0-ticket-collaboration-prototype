"use client"

import { useState, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search, Layers, Box, Tag, Calendar, Clock, User, Filter,
  AlertTriangle, CheckCircle, Activity, TrendingUp, TrendingDown,
  ThermometerSun, Gauge, Zap, ChevronRight, ChevronDown, FileText,
  X, ArrowLeft, CalendarDays
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ========= 공정 기록 데이터 ========= */

// 로그 소스 타입
type LogSource = 
  | "daily-monitoring"      // Daily Monitoring 특이사항
  | "tag-observation"       // 태그 특이사항 로그
  | "anomaly-detection"     // 이상징후 모니터링
  | "shift-handover"        // 교대 인수인계
  | "equipment-status"      // 장치 상태 변경
  | "parameter-change"      // 운전 파라미터 변경
  | "alarm-history"         // 알람 이력

// 계층 레벨
type HierarchyLevel = "process" | "equipment" | "tag"

interface ProcessLog {
  id: string
  date: string
  time: string
  source: LogSource
  level: HierarchyLevel
  process: string           // 공정 (CDU, VDU, HCR 등)
  equipment?: string        // 장치 (E-101, H-1001 등)
  tag?: string             // 태그 (TI-2001, PI-1001 등)
  title: string
  description: string
  operator: string
  severity: "info" | "warning" | "critical"
  status: "normal" | "abnormal" | "resolved"
  relatedTags?: string[]
  metrics?: { name: string; value: string; unit: string; trend?: "up" | "down" | "stable" }[]
  linkedEventId?: string   // 연결된 이벤트 ID
}

// 샘플 로그 데이터
const PROCESS_LOGS: ProcessLog[] = [
  // Daily Monitoring 로그
  { id: "LOG-001", date: "2025-02-04", time: "06:00", source: "daily-monitoring", level: "process", process: "HCR", 
    title: "HCR 공정 일일 모니터링 - 정상", description: "전반적으로 안정 운전. Feed Sulfur 전일 대비 변동 없음(0.85%). WABT 380도 유지. 촉매 활성도 양호.",
    operator: "김철수", severity: "info", status: "normal",
    metrics: [{ name: "WABT", value: "380", unit: "°C", trend: "stable" }, { name: "Feed Sulfur", value: "0.85", unit: "%", trend: "stable" }] },
  
  { id: "LOG-002", date: "2025-02-04", time: "06:00", source: "daily-monitoring", level: "process", process: "CDU", 
    title: "CDU 공정 일일 모니터링 - Blend 변경", description: "22:00 Crude Blend 비율 조정 시작. Arab Medium 60% -> 55%, Arab Light 25% -> 30%. 상압탑 온도 프로파일 안정.",
    operator: "박민수", severity: "info", status: "normal",
    metrics: [{ name: "E-101 UA", value: "465", unit: "W/m²K", trend: "down" }, { name: "Column Top", value: "112", unit: "°C", trend: "stable" }] },

  // 태그 특이사항 로그
  { id: "LOG-003", date: "2025-02-03", time: "14:30", source: "tag-observation", level: "tag", process: "HCR", equipment: "R-2001", tag: "TI-2001",
    title: "TI-2001 온도 상승 추세 관찰", description: "TI-2001 트렌드 확인. 전일 대비 1.5도 상승. Feed 분석 결과 Sulfur 0.92% (전일 0.85%). 1시간 주기 모니터링으로 전환.",
    operator: "이영희", severity: "warning", status: "abnormal",
    metrics: [{ name: "TI-2001", value: "381.5", unit: "°C", trend: "up" }, { name: "Feed Sulfur", value: "0.92", unit: "%", trend: "up" }],
    relatedTags: ["TI-2002", "TI-2003", "FI-2001"] },

  { id: "LOG-004", date: "2025-02-03", time: "10:15", source: "tag-observation", level: "tag", process: "VDU", equipment: "H-1001", tag: "TI-1101",
    title: "Heater TMT 정상 범위 확인", description: "Heater TMT 최고점 485도 (Limit 530도, 여유 충분). 정상 운전 지속.",
    operator: "최지훈", severity: "info", status: "normal",
    metrics: [{ name: "TMT Max", value: "485", unit: "°C", trend: "stable" }] },

  // 이상징후 모니터링 로그
  { id: "LOG-005", date: "2025-02-02", time: "09:30", source: "anomaly-detection", level: "equipment", process: "VDU", equipment: "H-1001",
    title: "H-1001 Flame Scanner 이상 감지", description: "Flame Scanner #2 오작동 감지. 비상 감량 시작 (80% -> 60%). 운전팀 현장 출동.",
    operator: "최지훈", severity: "critical", status: "resolved",
    linkedEventId: "EVT-2024-0089",
    relatedTags: ["FS-1001", "FS-1002", "FI-1001"] },

  { id: "LOG-006", date: "2025-02-01", time: "22:00", source: "anomaly-detection", level: "equipment", process: "CDU", equipment: "E-101",
    title: "E-101 UA 급격 저하 감지", description: "UA 모니터링에서 급격 저하 감지 (485 -> 380, 2주간). AI 모델 알림 발생.",
    operator: "박민수", severity: "warning", status: "resolved",
    linkedEventId: "EVT-2024-0081",
    metrics: [{ name: "UA", value: "380", unit: "W/m²K", trend: "down" }] },

  // 교대 인수인계 로그
  { id: "LOG-007", date: "2025-02-04", time: "06:00", source: "shift-handover", level: "process", process: "HCR",
    title: "HCR 야간→주간 교대 인수인계", description: "야간 특이사항: 없음. 주의 필요 사항: TI-2001 트렌드 지속 감시. Feed Sulfur 모니터링 주기 유지.",
    operator: "김철수", severity: "info", status: "normal" },

  { id: "LOG-008", date: "2025-02-04", time: "06:00", source: "shift-handover", level: "process", process: "CDU",
    title: "CDU 야간→주간 교대 인수인계", description: "야간 특이사항: Crude Blend 변경 완료. 주의 필요 사항: E-101 UA 추이 관찰 지속.",
    operator: "박민수", severity: "info", status: "normal" },

  // 장치 상태 변경 로그
  { id: "LOG-009", date: "2025-02-01", time: "10:45", source: "equipment-status", level: "equipment", process: "VDU", equipment: "H-1001",
    title: "H-1001 Heater 재기동", description: "Heater 재점화 성공. Flame Scanner Lens 세정 후 수동 Reset 완료. 정상 운전 복구 시작.",
    operator: "최지훈", severity: "info", status: "normal",
    linkedEventId: "EVT-2024-0089" },

  { id: "LOG-010", date: "2025-01-30", time: "16:00", source: "equipment-status", level: "equipment", process: "CCR", equipment: "C-3001",
    title: "Net Gas Compressor Standby 전환", description: "진동 Alert 발생으로 Standby 전환 결정. Bearing Temp 동반 상승 확인.",
    operator: "정수민", severity: "warning", status: "resolved",
    linkedEventId: "EVT-2024-0075" },

  // 운전 파라미터 변경 로그
  { id: "LOG-011", date: "2025-02-03", time: "22:00", source: "parameter-change", level: "process", process: "CDU",
    title: "Crude Blend 비율 변경", description: "Arab Medium 60% -> 55%, Arab Light 25% -> 30%. 상압탑 온도 프로파일 안정화 확인.",
    operator: "박민수", severity: "info", status: "normal",
    metrics: [{ name: "Arab Medium", value: "55", unit: "%", trend: "down" }, { name: "Arab Light", value: "30", unit: "%", trend: "up" }] },

  { id: "LOG-012", date: "2025-02-02", time: "14:00", source: "parameter-change", level: "equipment", process: "FCC", equipment: "Reactor",
    title: "Cat/Oil Ratio 조정", description: "Cat/Oil Ratio 6.0 -> 6.2 조정. Gasoline 수율 +0.3% 확인.",
    operator: "이연구원", severity: "info", status: "normal",
    metrics: [{ name: "C/O Ratio", value: "6.2", unit: "-", trend: "up" }, { name: "Gasoline 수율", value: "+0.3", unit: "%", trend: "up" }] },

  // 알람 이력 로그
  { id: "LOG-013", date: "2025-02-03", time: "06:15", source: "alarm-history", level: "tag", process: "HCR", equipment: "R-2001", tag: "TI-2001",
    title: "TI-2001 High 알람 발생", description: "TI-2001 온도 Alert 발생 (380도 -> 383도). 1시간 주기 모니터링 전환.",
    operator: "이영희", severity: "warning", status: "abnormal",
    metrics: [{ name: "TI-2001", value: "383", unit: "°C", trend: "up" }] },

  { id: "LOG-014", date: "2025-02-01", time: "09:30", source: "alarm-history", level: "equipment", process: "VDU", equipment: "H-1001",
    title: "H-1001 Trip 알람", description: "H-1001 Heater Trip 발생. Flame Scanner #2 오작동.",
    operator: "최지훈", severity: "critical", status: "resolved",
    linkedEventId: "EVT-2024-0089" },

  { id: "LOG-015", date: "2025-01-30", time: "14:00", source: "alarm-history", level: "equipment", process: "CCR", equipment: "C-3001",
    title: "Compressor 진동 알람", description: "진동 Alert 발생 (5.2 -> 7.5 mm/s). Bearing Temp 동반 상승.",
    operator: "정수민", severity: "warning", status: "resolved",
    linkedEventId: "EVT-2024-0075",
    metrics: [{ name: "Vibration", value: "7.5", unit: "mm/s", trend: "up" }] },
  
  // 더 많은 날짜의 로그 추가
  { id: "LOG-016", date: "2025-01-29", time: "06:00", source: "daily-monitoring", level: "process", process: "HCR", 
    title: "HCR 공정 일일 모니터링 - 정상", description: "전반적으로 안정 운전.",
    operator: "김철수", severity: "info", status: "normal" },
  { id: "LOG-017", date: "2025-01-28", time: "06:00", source: "daily-monitoring", level: "process", process: "CDU", 
    title: "CDU 공정 일일 모니터링 - 정상", description: "정상 운전 유지.",
    operator: "박민수", severity: "info", status: "normal" },
  { id: "LOG-018", date: "2025-01-27", time: "14:00", source: "tag-observation", level: "tag", process: "FCC", tag: "TI-3001",
    title: "Riser 온도 모니터링", description: "Riser 온도 안정.",
    operator: "이연구원", severity: "info", status: "normal" },
  { id: "LOG-019", date: "2025-01-26", time: "09:00", source: "anomaly-detection", level: "equipment", process: "SRU", equipment: "R-4001",
    title: "SRU Reactor 온도 이상", description: "Reactor 입구 온도 상승 감지.",
    operator: "한지훈", severity: "warning", status: "resolved" },
  { id: "LOG-020", date: "2025-01-25", time: "06:00", source: "daily-monitoring", level: "process", process: "VDU", 
    title: "VDU 공정 일일 모니터링", description: "정상 운전.",
    operator: "최지훈", severity: "info", status: "normal" },
]

// 주요 트렌드/장치 목록
const KEY_TRENDS = [
  { id: "TI-2001", name: "HCR 1st Reactor Inlet Temp", process: "HCR", equipment: "R-2001", type: "temperature" },
  { id: "TI-2002", name: "HCR 2nd Reactor Inlet Temp", process: "HCR", equipment: "R-2001", type: "temperature" },
  { id: "UA-E101", name: "CDU Desalter UA", process: "CDU", equipment: "E-101", type: "coefficient" },
  { id: "TI-1101", name: "VDU Heater TMT", process: "VDU", equipment: "H-1001", type: "temperature" },
  { id: "PI-3001", name: "FCC Riser Pressure", process: "FCC", equipment: "Reactor", type: "pressure" },
  { id: "VI-C301", name: "CCR Compressor Vibration", process: "CCR", equipment: "C-3001", type: "vibration" },
]

const KEY_EQUIPMENT = [
  { id: "R-2001", name: "HCR Reactor", process: "HCR" },
  { id: "E-101", name: "CDU Desalter", process: "CDU" },
  { id: "H-1001", name: "VDU Heater", process: "VDU" },
  { id: "C-3001", name: "CCR Net Gas Compressor", process: "CCR" },
  { id: "Reactor", name: "FCC Reactor/Regenerator", process: "FCC" },
]

const PROCESSES = ["전체", "CDU", "VDU", "HCR", "CCR", "FCC", "SRU"]

const sourceLabels: Record<LogSource, string> = {
  "daily-monitoring": "Daily Monitoring",
  "tag-observation": "태그 특이사항",
  "anomaly-detection": "이상징후 감지",
  "shift-handover": "교대 인수인계",
  "equipment-status": "장치 상태 변경",
  "parameter-change": "파라미터 변경",
  "alarm-history": "알람 이력"
}

const sourceColors: Record<LogSource, string> = {
  "daily-monitoring": "bg-blue-100 text-blue-700 border-blue-200",
  "tag-observation": "bg-purple-100 text-purple-700 border-purple-200",
  "anomaly-detection": "bg-red-100 text-red-700 border-red-200",
  "shift-handover": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "equipment-status": "bg-amber-100 text-amber-700 border-amber-200",
  "parameter-change": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "alarm-history": "bg-orange-100 text-orange-700 border-orange-200"
}

const levelIcons: Record<HierarchyLevel, React.ElementType> = {
  "process": Layers,
  "equipment": Box,
  "tag": Tag
}

// 날짜 범위 생성 (최근 14일)
function generateDateRange(days: number = 14): string[] {
  const dates: string[] = []
  const today = new Date("2025-02-04") // 데모용 고정 날짜
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
}

// 날짜별 상태 계산
function getDayStatus(date: string, logs: ProcessLog[]): "normal" | "warning" | "critical" | "empty" {
  const dayLogs = logs.filter(l => l.date === date)
  if (dayLogs.length === 0) return "empty"
  if (dayLogs.some(l => l.severity === "critical")) return "critical"
  if (dayLogs.some(l => l.severity === "warning")) return "warning"
  return "normal"
}

export default function ProcessLogsPage() {
  const [processFilter, setProcessFilter] = useState("전체")
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTrend, setSelectedTrend] = useState<string | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"timeline" | "trends" | "equipment">("timeline")
  const [dateRangeDays, setDateRangeDays] = useState(14)

  // 날짜 범위
  const dateRange = useMemo(() => generateDateRange(dateRangeDays), [dateRangeDays])

  // 공정 필터링된 로그
  const filteredLogs = useMemo(() => {
    if (processFilter === "전체") return PROCESS_LOGS
    return PROCESS_LOGS.filter(l => l.process === processFilter)
  }, [processFilter])

  // 선택된 날짜의 로그
  const selectedDateLogs = useMemo(() => {
    if (!selectedDate) return []
    return filteredLogs.filter(l => l.date === selectedDate).sort((a, b) => b.time.localeCompare(a.time))
  }, [selectedDate, filteredLogs])

  // 선택된 트렌드/장치의 로그
  const selectedTrendLogs = useMemo(() => {
    if (!selectedTrend) return []
    return filteredLogs.filter(l => l.tag === selectedTrend || l.relatedTags?.includes(selectedTrend))
  }, [selectedTrend, filteredLogs])

  const selectedEquipmentLogs = useMemo(() => {
    if (!selectedEquipment) return []
    return filteredLogs.filter(l => l.equipment === selectedEquipment)
  }, [selectedEquipment, filteredLogs])

  // 날짜별 통계
  const dateStats = useMemo(() => {
    const stats: Record<string, { total: number; normal: number; warning: number; critical: number }> = {}
    dateRange.forEach(date => {
      const dayLogs = filteredLogs.filter(l => l.date === date)
      stats[date] = {
        total: dayLogs.length,
        normal: dayLogs.filter(l => l.severity === "info").length,
        warning: dayLogs.filter(l => l.severity === "warning").length,
        critical: dayLogs.filter(l => l.severity === "critical").length,
      }
    })
    return stats
  }, [dateRange, filteredLogs])

  // 요일 이름
  const getDayName = (dateStr: string) => {
    const days = ["일", "월", "화", "수", "목", "금", "토"]
    return days[new Date(dateStr).getDay()]
  }

  const renderLogItem = (log: ProcessLog) => {
    const LevelIcon = levelIcons[log.level]
    return (
      <div 
        key={log.id}
        className={cn(
          "p-3 rounded-lg border transition-colors",
          log.severity === "critical" && "border-red-200 bg-red-50/50",
          log.severity === "warning" && "border-amber-200 bg-amber-50/50",
          log.severity === "info" && "border-border bg-card"
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
            log.severity === "critical" && "bg-red-100",
            log.severity === "warning" && "bg-amber-100",
            log.severity === "info" && "bg-blue-100"
          )}>
            <LevelIcon className={cn(
              "h-4 w-4",
              log.severity === "critical" && "text-red-600",
              log.severity === "warning" && "text-amber-600",
              log.severity === "info" && "text-blue-600"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn("text-[10px] border", sourceColors[log.source])}>{sourceLabels[log.source]}</Badge>
              <span className="text-xs text-muted-foreground">{log.time}</span>
              <span className="text-xs font-mono text-muted-foreground">{log.process}</span>
              {log.equipment && <span className="text-xs font-mono text-muted-foreground">/ {log.equipment}</span>}
              {log.tag && <Badge variant="outline" className="text-[10px]">{log.tag}</Badge>}
            </div>
            <p className="text-sm font-medium mt-1">{log.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{log.description}</p>
            
            {/* Metrics */}
            {log.metrics && log.metrics.length > 0 && (
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {log.metrics.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-1 text-xs bg-muted/50 px-2 py-0.5 rounded">
                    <span className="text-muted-foreground">{m.name}:</span>
                    <span className="font-medium">{m.value}{m.unit}</span>
                    {m.trend === "up" && <TrendingUp className="h-3 w-3 text-red-500" />}
                    {m.trend === "down" && <TrendingDown className="h-3 w-3 text-blue-500" />}
                  </div>
                ))}
              </div>
            )}
            
            {/* Related Tags & Event */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {log.relatedTags && log.relatedTags.map(t => (
                <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
              ))}
              {log.linkedEventId && (
                <Badge variant="outline" className="text-[10px] text-blue-600">{log.linkedEventId}</Badge>
              )}
              <span className="text-[10px] text-muted-foreground ml-auto">{log.operator}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-6 py-4">
          <h1 className="text-lg font-bold">공정 기록</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            플랫폼 전체의 공정/장치/태그 단위 로그를 시간 연대기별로 조회합니다
          </p>
        </header>

        <main className="p-6">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <Select value={processFilter} onValueChange={setProcessFilter}>
              <SelectTrigger className="w-32">
                <Layers className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROCESSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={String(dateRangeDays)} onValueChange={(v) => setDateRangeDays(Number(v))}>
              <SelectTrigger className="w-32">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">최근 7일</SelectItem>
                <SelectItem value="14">최근 14일</SelectItem>
                <SelectItem value="30">최근 30일</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="mb-4">
              <TabsTrigger value="timeline" className="gap-1.5">
                <CalendarDays className="h-4 w-4" />
                일별 타임라인
              </TabsTrigger>
              <TabsTrigger value="trends" className="gap-1.5">
                <Activity className="h-4 w-4" />
                주요 트렌드
              </TabsTrigger>
              <TabsTrigger value="equipment" className="gap-1.5">
                <Box className="h-4 w-4" />
                주요 장치
              </TabsTrigger>
            </TabsList>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Calendar Timeline */}
                <Card className="lg:col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      날짜별 현황
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {dateRange.map(date => {
                        const status = getDayStatus(date, filteredLogs)
                        const stats = dateStats[date]
                        const isSelected = selectedDate === date
                        
                        return (
                          <button
                            key={date}
                            onClick={() => setSelectedDate(isSelected ? null : date)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                              isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted/50",
                              !isSelected && status === "critical" && "bg-red-50",
                              !isSelected && status === "warning" && "bg-amber-50",
                            )}
                          >
                            {/* Status Indicator */}
                            <div className={cn(
                              "h-3 w-3 rounded-full shrink-0",
                              status === "critical" && (isSelected ? "bg-red-300" : "bg-red-500"),
                              status === "warning" && (isSelected ? "bg-amber-300" : "bg-amber-500"),
                              status === "normal" && (isSelected ? "bg-emerald-300" : "bg-emerald-500"),
                              status === "empty" && "bg-muted-foreground/30"
                            )} />
                            
                            {/* Date */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={cn("text-sm font-medium", isSelected && "text-primary-foreground")}>
                                  {date.slice(5)} ({getDayName(date)})
                                </span>
                              </div>
                            </div>
                            
                            {/* Counts */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {stats.critical > 0 && (
                                <Badge variant={isSelected ? "secondary" : "destructive"} className="h-5 px-1.5 text-[10px]">
                                  {stats.critical}
                                </Badge>
                              )}
                              {stats.warning > 0 && (
                                <Badge variant={isSelected ? "secondary" : "outline"} className={cn("h-5 px-1.5 text-[10px]", !isSelected && "border-amber-300 text-amber-700")}>
                                  {stats.warning}
                                </Badge>
                              )}
                              {stats.normal > 0 && (
                                <span className={cn("text-xs", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                  +{stats.normal}
                                </span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    
                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <span>정상</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                        <span>주의</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                        <span>위험</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Day Detail */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        {selectedDate ? (
                          <span>{selectedDate} 특이사항 ({selectedDateLogs.length}건)</span>
                        ) : (
                          <span>날짜를 선택하세요</span>
                        )}
                      </div>
                      {selectedDate && (
                        <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedDate ? (
                      selectedDateLogs.length > 0 ? (
                        <ScrollArea className="h-[500px] pr-4">
                          <div className="space-y-2">
                            {selectedDateLogs.map(log => renderLogItem(log))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mb-3 text-emerald-500" />
                          <p className="text-sm font-medium">특이사항 없음</p>
                          <p className="text-xs mt-1">해당 날짜에 기록된 특이사항이 없습니다</p>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <CalendarDays className="h-12 w-12 mb-3 opacity-30" />
                        <p className="text-sm">좌측 캘린더에서 날짜를 선택하면</p>
                        <p className="text-sm">해당 일자의 특이사항을 확인할 수 있습니다</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Trend List */}
                <Card className="lg:col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      주요 트렌드
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {KEY_TRENDS.filter(t => processFilter === "전체" || t.process === processFilter).map(trend => {
                        const trendLogs = filteredLogs.filter(l => l.tag === trend.id || l.relatedTags?.includes(trend.id))
                        const hasIssue = trendLogs.some(l => l.severity !== "info")
                        const isSelected = selectedTrend === trend.id
                        
                        return (
                          <button
                            key={trend.id}
                            onClick={() => setSelectedTrend(isSelected ? null : trend.id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                              isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted/50",
                              !isSelected && hasIssue && "bg-amber-50"
                            )}
                          >
                            <Tag className={cn("h-4 w-4 shrink-0", isSelected ? "text-primary-foreground" : "text-purple-500")} />
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium truncate", isSelected && "text-primary-foreground")}>{trend.id}</p>
                              <p className={cn("text-[10px] truncate", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>{trend.name}</p>
                            </div>
                            {trendLogs.length > 0 && (
                              <Badge variant={isSelected ? "secondary" : hasIssue ? "outline" : "secondary"} className={cn("text-[10px]", !isSelected && hasIssue && "border-amber-300 text-amber-700")}>
                                {trendLogs.length}
                              </Badge>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Trend Logs */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        {selectedTrend ? (
                          <span>{selectedTrend} 관련 로그 ({selectedTrendLogs.length}건)</span>
                        ) : (
                          <span>트렌드를 선택하세요</span>
                        )}
                      </div>
                      {selectedTrend && (
                        <Button variant="ghost" size="sm" onClick={() => setSelectedTrend(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedTrend ? (
                      selectedTrendLogs.length > 0 ? (
                        <ScrollArea className="h-[500px] pr-4">
                          <div className="space-y-2">
                            {selectedTrendLogs.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)).map(log => renderLogItem(log))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mb-3 text-emerald-500" />
                          <p className="text-sm font-medium">로그 없음</p>
                          <p className="text-xs mt-1">해당 트렌드에 대한 로그가 없습니다</p>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Activity className="h-12 w-12 mb-3 opacity-30" />
                        <p className="text-sm">좌측에서 트렌드를 선택하면</p>
                        <p className="text-sm">해당 트렌드 관련 로그를 확인할 수 있습니다</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Equipment Tab */}
            <TabsContent value="equipment" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Equipment List */}
                <Card className="lg:col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Box className="h-4 w-4 text-primary" />
                      주요 장치
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {KEY_EQUIPMENT.filter(e => processFilter === "전체" || e.process === processFilter).map(equip => {
                        const equipLogs = filteredLogs.filter(l => l.equipment === equip.id)
                        const hasIssue = equipLogs.some(l => l.severity !== "info")
                        const isSelected = selectedEquipment === equip.id
                        
                        return (
                          <button
                            key={equip.id}
                            onClick={() => setSelectedEquipment(isSelected ? null : equip.id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                              isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted/50",
                              !isSelected && hasIssue && "bg-amber-50"
                            )}
                          >
                            <Box className={cn("h-4 w-4 shrink-0", isSelected ? "text-primary-foreground" : "text-amber-500")} />
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium truncate", isSelected && "text-primary-foreground")}>{equip.id}</p>
                              <p className={cn("text-[10px] truncate", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>{equip.name}</p>
                            </div>
                            {equipLogs.length > 0 && (
                              <Badge variant={isSelected ? "secondary" : hasIssue ? "outline" : "secondary"} className={cn("text-[10px]", !isSelected && hasIssue && "border-amber-300 text-amber-700")}>
                                {equipLogs.length}
                              </Badge>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Equipment Logs */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Box className="h-4 w-4 text-primary" />
                        {selectedEquipment ? (
                          <span>{selectedEquipment} 관련 로그 ({selectedEquipmentLogs.length}건)</span>
                        ) : (
                          <span>장치를 선택하세요</span>
                        )}
                      </div>
                      {selectedEquipment && (
                        <Button variant="ghost" size="sm" onClick={() => setSelectedEquipment(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedEquipment ? (
                      selectedEquipmentLogs.length > 0 ? (
                        <ScrollArea className="h-[500px] pr-4">
                          <div className="space-y-2">
                            {selectedEquipmentLogs.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)).map(log => renderLogItem(log))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mb-3 text-emerald-500" />
                          <p className="text-sm font-medium">로그 없음</p>
                          <p className="text-xs mt-1">해당 장치에 대한 로그가 없습니다</p>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Box className="h-12 w-12 mb-3 opacity-30" />
                        <p className="text-sm">좌측에서 장치를 선택하면</p>
                        <p className="text-sm">해당 장치 관련 로그를 확인할 수 있습니다</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AppShell>
  )
}
