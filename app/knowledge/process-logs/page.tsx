"use client"

import { useState, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search, Layers, Box, Tag, Calendar, Clock, User, Filter,
  AlertTriangle, CheckCircle, Activity, TrendingUp, TrendingDown,
  ThermometerSun, Gauge, Zap, ChevronRight, ChevronDown, FileText
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

const levelLabels: Record<HierarchyLevel, string> = {
  "process": "공정",
  "equipment": "장치",
  "tag": "태그"
}

export default function ProcessLogsPage() {
  const [search, setSearch] = useState("")
  const [processFilter, setProcessFilter] = useState("전체")
  const [levelFilter, setLevelFilter] = useState<HierarchyLevel | "all">("all")
  const [sourceFilter, setSourceFilter] = useState<LogSource | "all">("all")
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "all">("week")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["2025-02-04", "2025-02-03"]))

  // 필터링된 로그
  const filteredLogs = useMemo(() => {
    return PROCESS_LOGS.filter(log => {
      if (search && !log.title.toLowerCase().includes(search.toLowerCase()) && 
          !log.description.toLowerCase().includes(search.toLowerCase()) &&
          !log.tag?.toLowerCase().includes(search.toLowerCase()) &&
          !log.equipment?.toLowerCase().includes(search.toLowerCase())) return false
      if (processFilter !== "전체" && log.process !== processFilter) return false
      if (levelFilter !== "all" && log.level !== levelFilter) return false
      if (sourceFilter !== "all" && log.source !== sourceFilter) return false
      // Date range filter (simplified for demo)
      return true
    })
  }, [search, processFilter, levelFilter, sourceFilter, dateRange])

  // 날짜별 그룹핑
  const groupedLogs = useMemo(() => {
    const groups: Record<string, ProcessLog[]> = {}
    filteredLogs.forEach(log => {
      if (!groups[log.date]) groups[log.date] = []
      groups[log.date].push(log)
    })
    // 날짜 내림차순 정렬
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredLogs])

  // 통계
  const stats = useMemo(() => {
    return {
      total: filteredLogs.length,
      byLevel: {
        process: filteredLogs.filter(l => l.level === "process").length,
        equipment: filteredLogs.filter(l => l.level === "equipment").length,
        tag: filteredLogs.filter(l => l.level === "tag").length,
      },
      bySeverity: {
        info: filteredLogs.filter(l => l.severity === "info").length,
        warning: filteredLogs.filter(l => l.severity === "warning").length,
        critical: filteredLogs.filter(l => l.severity === "critical").length,
      }
    }
  }, [filteredLogs])

  const toggleGroup = (date: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-6 py-4">
          <h1 className="text-lg font-bold">공정 기록</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            플랫폼 전체의 공정/장치/태그 단위 로그를 종합하여 조회합니다
          </p>
        </header>

        <main className="p-6 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="로그 검색 (제목, 태그, 장치명...)" 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    className="pl-9" 
                  />
                </div>
                
                <Select value={processFilter} onValueChange={setProcessFilter}>
                  <SelectTrigger className="w-28">
                    <Layers className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROCESSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as HierarchyLevel | "all")}>
                  <SelectTrigger className="w-28">
                    <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue placeholder="계층" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 계층</SelectItem>
                    <SelectItem value="process">공정</SelectItem>
                    <SelectItem value="equipment">장치</SelectItem>
                    <SelectItem value="tag">태그</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as LogSource | "all")}>
                  <SelectTrigger className="w-40">
                    <FileText className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue placeholder="소스" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 소스</SelectItem>
                    {Object.entries(sourceLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
                  <SelectTrigger className="w-28">
                    <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">오늘</SelectItem>
                    <SelectItem value="week">최근 1주</SelectItem>
                    <SelectItem value="month">최근 1개월</SelectItem>
                    <SelectItem value="all">전체</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <Card className="cursor-pointer hover:bg-muted/30" onClick={() => { setLevelFilter("all"); setSourceFilter("all"); }}>
              <CardContent className="py-3 text-center">
                <p className="text-xs text-muted-foreground">전체 로그</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className={cn("cursor-pointer hover:bg-muted/30", levelFilter === "process" && "ring-2 ring-primary")} onClick={() => setLevelFilter("process")}>
              <CardContent className="py-3 text-center">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Layers className="h-3 w-3" />공정
                </p>
                <p className="text-2xl font-bold mt-1">{stats.byLevel.process}</p>
              </CardContent>
            </Card>
            <Card className={cn("cursor-pointer hover:bg-muted/30", levelFilter === "equipment" && "ring-2 ring-primary")} onClick={() => setLevelFilter("equipment")}>
              <CardContent className="py-3 text-center">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Box className="h-3 w-3" />장치
                </p>
                <p className="text-2xl font-bold mt-1">{stats.byLevel.equipment}</p>
              </CardContent>
            </Card>
            <Card className={cn("cursor-pointer hover:bg-muted/30", levelFilter === "tag" && "ring-2 ring-primary")} onClick={() => setLevelFilter("tag")}>
              <CardContent className="py-3 text-center">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Tag className="h-3 w-3" />태그
                </p>
                <p className="text-2xl font-bold mt-1">{stats.byLevel.tag}</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/30">
              <CardContent className="py-3 text-center">
                <p className="text-xs text-blue-600">정상</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">{stats.bySeverity.info}</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/30">
              <CardContent className="py-3 text-center">
                <p className="text-xs text-amber-600">주의</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">{stats.bySeverity.warning}</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/30">
              <CardContent className="py-3 text-center">
                <p className="text-xs text-red-600">위험</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{stats.bySeverity.critical}</p>
              </CardContent>
            </Card>
          </div>

          {/* Grouped Log List */}
          <div className="space-y-3">
            {groupedLogs.map(([date, logs]) => (
              <Card key={date}>
                <button 
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  onClick={() => toggleGroup(date)}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{date}</span>
                    <Badge variant="secondary" className="text-xs">{logs.length}건</Badge>
                  </div>
                  {expandedGroups.has(date) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {expandedGroups.has(date) && (
                  <CardContent className="pt-0 pb-3 space-y-2">
                    {logs.sort((a, b) => b.time.localeCompare(a.time)).map(log => {
                      const LevelIcon = levelIcons[log.level]
                      return (
                        <div 
                          key={log.id}
                          className={cn(
                            "p-3 rounded-lg border transition-colors hover:bg-muted/30",
                            log.severity === "critical" && "border-red-200 bg-red-50/30",
                            log.severity === "warning" && "border-amber-200 bg-amber-50/30",
                            log.severity === "info" && "border-border"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {/* Level Icon */}
                            <div className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                              log.level === "process" && "bg-blue-100",
                              log.level === "equipment" && "bg-amber-100",
                              log.level === "tag" && "bg-purple-100"
                            )}>
                              <LevelIcon className={cn(
                                "h-4 w-4",
                                log.level === "process" && "text-blue-600",
                                log.level === "equipment" && "text-amber-600",
                                log.level === "tag" && "text-purple-600"
                              )} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-muted-foreground">{log.time}</span>
                                <Badge className={cn("text-[10px]", sourceColors[log.source])}>
                                  {sourceLabels[log.source]}
                                </Badge>
                                <Badge variant="outline" className="text-[10px]">{log.process}</Badge>
                                {log.equipment && (
                                  <Badge variant="outline" className="text-[10px] bg-muted">{log.equipment}</Badge>
                                )}
                                {log.tag && (
                                  <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700">{log.tag}</Badge>
                                )}
                                {log.linkedEventId && (
                                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700">
                                    {log.linkedEventId}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm font-medium mt-1">{log.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{log.description}</p>

                              {/* Metrics */}
                              {log.metrics && log.metrics.length > 0 && (
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                  {log.metrics.map((m, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-xs bg-muted/50 px-2 py-1 rounded">
                                      <span className="text-muted-foreground">{m.name}:</span>
                                      <span className="font-medium">{m.value} {m.unit}</span>
                                      {m.trend === "up" && <TrendingUp className="h-3 w-3 text-red-500" />}
                                      {m.trend === "down" && <TrendingDown className="h-3 w-3 text-blue-500" />}
                                      {m.trend === "stable" && <Activity className="h-3 w-3 text-emerald-500" />}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Related Tags */}
                              {log.relatedTags && log.relatedTags.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-2">
                                  <span className="text-[10px] text-muted-foreground">관련 태그:</span>
                                  {log.relatedTags.map(t => (
                                    <Badge key={t} variant="secondary" className="text-[9px]">{t}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Status & Operator */}
                            <div className="text-right shrink-0">
                              <div className={cn(
                                "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded",
                                log.status === "normal" && "bg-emerald-100 text-emerald-700",
                                log.status === "abnormal" && "bg-amber-100 text-amber-700",
                                log.status === "resolved" && "bg-blue-100 text-blue-700"
                              )}>
                                {log.status === "normal" && <CheckCircle className="h-3 w-3" />}
                                {log.status === "abnormal" && <AlertTriangle className="h-3 w-3" />}
                                {log.status === "resolved" && <CheckCircle className="h-3 w-3" />}
                                {log.status === "normal" ? "정상" : log.status === "abnormal" ? "이상" : "해결됨"}
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-end gap-1">
                                <User className="h-3 w-3" />{log.operator}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {filteredLogs.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>조건에 맞는 로그가 없습니다.</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </AppShell>
  )
}
