"use client"

import { useState, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import {
  Search, TrendingUp, Calendar, Clock, User, MessageSquare,
  AlertTriangle, CheckCircle, Tag, Filter, X, Activity,
  ThermometerSun, Gauge, Zap, ChevronRight, ChevronDown
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// 공정 변수 타입
interface ProcessVariable {
  id: string
  name: string
  description: string
  process: string
  equipment: string
  type: "temperature" | "pressure" | "flow" | "level" | "other"
  unit: string
}

// 트렌드 주석/로그 타입
interface TrendAnnotation {
  id: string
  variableId: string
  date: string
  time: string
  author: string
  type: "observation" | "anomaly" | "action" | "analysis" | "note"
  title: string
  content: string
  value?: string
  severity?: "info" | "warning" | "critical"
  linkedEventId?: string
}

// 샘플 공정 변수
const PROCESS_VARIABLES: ProcessVariable[] = [
  { id: "TI-2001", name: "HCR 1st Reactor Inlet Temp", description: "1차 반응기 입구 온도", process: "HCR", equipment: "R-2001", type: "temperature", unit: "°C" },
  { id: "TI-2002", name: "HCR 2nd Reactor Inlet Temp", description: "2차 반응기 입구 온도", process: "HCR", equipment: "R-2002", type: "temperature", unit: "°C" },
  { id: "TI-2003", name: "HCR Reactor Outlet Temp", description: "반응기 출구 온도", process: "HCR", equipment: "R-2001", type: "temperature", unit: "°C" },
  { id: "PI-2001", name: "HCR Reactor Pressure", description: "반응기 운전 압력", process: "HCR", equipment: "R-2001", type: "pressure", unit: "kg/cm²" },
  { id: "FI-2001", name: "HCR Feed Flow", description: "Feed 유량", process: "HCR", equipment: "R-2001", type: "flow", unit: "m³/h" },
  { id: "TI-1101", name: "VDU Heater TMT", description: "Heater Tube Metal Temperature", process: "VDU", equipment: "H-1001", type: "temperature", unit: "°C" },
  { id: "TI-1001", name: "VDU Column Top Temp", description: "상압탑 상부 온도", process: "VDU", equipment: "T-1001", type: "temperature", unit: "°C" },
  { id: "PI-1001", name: "VDU Column Pressure", description: "상압탑 운전 압력", process: "VDU", equipment: "T-1001", type: "pressure", unit: "mmHg" },
  { id: "UA-E101", name: "CDU Desalter UA", description: "Desalter 열전달 계수", process: "CDU", equipment: "E-101", type: "other", unit: "W/m²K" },
  { id: "TI-0101", name: "CDU Crude Inlet Temp", description: "원유 입구 온도", process: "CDU", equipment: "E-101", type: "temperature", unit: "°C" },
  { id: "VI-C301", name: "CCR Compressor Vibration", description: "압축기 진동", process: "CCR", equipment: "C-3001", type: "other", unit: "mm/s" },
  { id: "TI-3001", name: "FCC Riser Temp", description: "Riser 온도", process: "FCC", equipment: "Reactor", type: "temperature", unit: "°C" },
]

// 샘플 트렌드 주석 데이터
const TREND_ANNOTATIONS: TrendAnnotation[] = [
  // TI-2001 주석
  { id: "AN-001", variableId: "TI-2001", date: "2025-02-04", time: "06:15", author: "김철수",
    type: "observation", title: "온도 상승 추이 관찰", content: "전일 대비 1.5도 상승. Feed Sulfur 증가와 연관 가능성.", value: "381.5°C", severity: "warning" },
  { id: "AN-002", variableId: "TI-2001", date: "2025-02-03", time: "14:30", author: "이영희",
    type: "anomaly", title: "온도 급상승 감지", content: "AI 모델 알림 발생. 1시간 주기 모니터링 전환.", value: "383°C", severity: "critical", linkedEventId: "EVT-001" },
  { id: "AN-003", variableId: "TI-2001", date: "2025-02-02", time: "09:00", author: "박민수",
    type: "action", title: "Feed Sulfur 분석 요청", content: "온도 상승 원인 파악을 위한 분석 의뢰.", severity: "info" },
  { id: "AN-004", variableId: "TI-2001", date: "2025-01-28", time: "10:30", author: "김철수",
    type: "analysis", title: "촉매 활성도 평가", content: "WABT 기준 촉매 활성도 정상 범위. 다음 S/D 시 교체 불필요.", severity: "info" },
  
  // TI-2002 주석
  { id: "AN-005", variableId: "TI-2002", date: "2025-02-03", time: "14:35", author: "이영희",
    type: "observation", title: "TI-2001 연동 상승", content: "1차 반응기 온도 상승에 따른 동반 상승 확인.", value: "375°C", severity: "warning" },
  
  // UA-E101 주석
  { id: "AN-006", variableId: "UA-E101", date: "2025-02-01", time: "22:00", author: "박민수",
    type: "anomaly", title: "UA 급격 저하 감지", content: "2주간 485 -> 380 W/m²K 저하. Fouling 의심.", value: "380 W/m²K", severity: "critical", linkedEventId: "EVT-2024-0081" },
  { id: "AN-007", variableId: "UA-E101", date: "2025-01-25", time: "08:00", author: "최지훈",
    type: "analysis", title: "Fouling Rate 분석", content: "일일 약 5 W/m²K 저하 추이. 예상 세정 시점: 2월 3주차.", severity: "warning" },
  { id: "AN-008", variableId: "UA-E101", date: "2025-01-20", time: "14:00", author: "박민수",
    type: "note", title: "세정 이력 기록", content: "전회 세정: 2024-11-15. 세정 후 UA: 520 W/m²K.", severity: "info" },
  
  // TI-1101 주석
  { id: "AN-009", variableId: "TI-1101", date: "2025-02-02", time: "09:30", author: "최지훈",
    type: "anomaly", title: "Heater Trip 발생", content: "Flame Scanner #2 오작동으로 Trip. 긴급 재점화 수행.", value: "0°C (Trip)", severity: "critical", linkedEventId: "EVT-2024-0089" },
  { id: "AN-010", variableId: "TI-1101", date: "2025-02-02", time: "10:45", author: "최지훈",
    type: "action", title: "Heater 재점화 완료", content: "수동 Reset 후 재점화 성공. TMT 정상 복구.", value: "485°C", severity: "info" },
  
  // VI-C301 주석
  { id: "AN-011", variableId: "VI-C301", date: "2025-01-30", time: "14:00", author: "정수민",
    type: "anomaly", title: "진동 Alert 발생", content: "진동 수치 5.2 -> 7.5 mm/s 급상승. Bearing Temp 동반 상승.", value: "7.5 mm/s", severity: "critical", linkedEventId: "EVT-2024-0075" },
  { id: "AN-012", variableId: "VI-C301", date: "2025-01-30", time: "16:00", author: "정수민",
    type: "action", title: "Standby 전환 결정", content: "안전 운전을 위해 Standby Compressor로 전환.", severity: "warning" },
]

const typeIcons: Record<ProcessVariable["type"], React.ElementType> = {
  temperature: ThermometerSun,
  pressure: Gauge,
  flow: Activity,
  level: Zap,
  other: Tag
}

const annotationTypeColors: Record<TrendAnnotation["type"], string> = {
  observation: "bg-blue-100 text-blue-700 border-blue-200",
  anomaly: "bg-red-100 text-red-700 border-red-200",
  action: "bg-emerald-100 text-emerald-700 border-emerald-200",
  analysis: "bg-purple-100 text-purple-700 border-purple-200",
  note: "bg-gray-100 text-gray-700 border-gray-200"
}

const annotationTypeLabels: Record<TrendAnnotation["type"], string> = {
  observation: "관찰",
  anomaly: "이상징후",
  action: "조치",
  analysis: "분석",
  note: "메모"
}

export default function VariableHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [processFilter, setProcessFilter] = useState("all")
  const [selectedVariables, setSelectedVariables] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<"7" | "14" | "30" | "all">("30")
  const [expandedDates, setExpandedDates] = useState<string[]>([])
  
  // 공정 필터링된 변수 목록
  const filteredVariables = useMemo(() => {
    let result = PROCESS_VARIABLES
    if (processFilter !== "all") {
      result = result.filter(v => v.process === processFilter)
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(v => 
        v.id.toLowerCase().includes(query) ||
        v.name.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query)
      )
    }
    return result
  }, [processFilter, searchQuery])
  
  // 선택된 변수들의 주석 데이터
  const selectedAnnotations = useMemo(() => {
    if (selectedVariables.length === 0) return []
    
    let annotations = TREND_ANNOTATIONS.filter(a => selectedVariables.includes(a.variableId))
    
    // 날짜 필터
    if (dateRange !== "all") {
      const days = parseInt(dateRange)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      annotations = annotations.filter(a => new Date(a.date) >= cutoffDate)
    }
    
    return annotations.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date)
      if (dateCompare !== 0) return dateCompare
      return b.time.localeCompare(a.time)
    })
  }, [selectedVariables, dateRange])
  
  // 날짜별 그룹핑
  const annotationsByDate = useMemo(() => {
    const groups: Record<string, TrendAnnotation[]> = {}
    selectedAnnotations.forEach(a => {
      if (!groups[a.date]) groups[a.date] = []
      groups[a.date].push(a)
    })
    return groups
  }, [selectedAnnotations])
  
  const toggleVariable = (id: string) => {
    setSelectedVariables(prev => 
      prev.includes(id) 
        ? prev.filter(v => v !== id)
        : [...prev, id]
    )
  }
  
  const toggleDate = (date: string) => {
    setExpandedDates(prev =>
      prev.includes(date)
        ? prev.filter(d => d !== date)
        : [...prev, date]
    )
  }
  
  const clearSelection = () => {
    setSelectedVariables([])
  }
  
  const processes = [...new Set(PROCESS_VARIABLES.map(v => v.process))]

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold">공정 변수 히스토리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            공정 변수 트렌드에 기록된 모든 주석과 로그를 한눈에 확인합니다
          </p>
        </div>
        
        {/* 메인 레이아웃 */}
        <div className="grid grid-cols-12 gap-6">
          {/* 좌측: 변수 선택 패널 */}
          <Card className="col-span-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  공정 변수 선택
                </CardTitle>
                {selectedVariables.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7 text-xs">
                    <X className="h-3 w-3 mr-1" />
                    초기화
                  </Button>
                )}
              </div>
              {selectedVariables.length > 0 && (
                <Badge variant="secondary" className="w-fit text-xs mt-2">
                  {selectedVariables.length}개 선택됨
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 검색 및 필터 */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="변수 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={processFilter} onValueChange={setProcessFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="공정 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 공정</SelectItem>
                    {processes.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* 변수 목록 */}
              <ScrollArea className="h-[500px]">
                <div className="space-y-1">
                  {filteredVariables.map(variable => {
                    const Icon = typeIcons[variable.type]
                    const isSelected = selectedVariables.includes(variable.id)
                    const annotationCount = TREND_ANNOTATIONS.filter(a => a.variableId === variable.id).length
                    
                    return (
                      <div
                        key={variable.id}
                        onClick={() => toggleVariable(variable.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                          isSelected 
                            ? "border-primary bg-primary/5 ring-1 ring-primary" 
                            : "border-border hover:bg-muted/50"
                        )}
                      >
                        <Checkbox checked={isSelected} className="pointer-events-none" />
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                          isSelected ? "bg-primary/10" : "bg-muted"
                        )}>
                          <Icon className={cn(
                            "h-4 w-4",
                            isSelected ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-medium">{variable.id}</span>
                            <Badge variant="outline" className="text-[10px]">{variable.process}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {variable.description}
                          </p>
                        </div>
                        {annotationCount > 0 && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            {annotationCount}
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          
          {/* 우측: 주석 히스토리 */}
          <Card className="col-span-8">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  트렌드 주석 히스토리
                  {selectedAnnotations.length > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      {selectedAnnotations.length}건
                    </Badge>
                  )}
                </CardTitle>
                
                {/* 기간 필터 */}
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button
                    variant={dateRange === "7" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setDateRange("7")}
                  >
                    7일
                  </Button>
                  <Button
                    variant={dateRange === "14" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setDateRange("14")}
                  >
                    14일
                  </Button>
                  <Button
                    variant={dateRange === "30" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setDateRange("30")}
                  >
                    30일
                  </Button>
                  <Button
                    variant={dateRange === "all" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setDateRange("all")}
                  >
                    전체
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedVariables.length === 0 ? (
                <div className="h-[540px] flex items-center justify-center">
                  <div className="text-center">
                    <Tag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      좌측에서 공정 변수를 선택하면<br />해당 변수의 트렌드 주석을 확인할 수 있습니다
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      여러 변수를 동시에 선택할 수 있습니다
                    </p>
                  </div>
                </div>
              ) : selectedAnnotations.length === 0 ? (
                <div className="h-[540px] flex items-center justify-center">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-emerald-500/50 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      선택한 기간 내 주석이 없습니다
                    </p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-[540px]">
                  <div className="space-y-3 pr-4">
                    {Object.entries(annotationsByDate).map(([date, annotations]) => {
                      const isExpanded = expandedDates.includes(date) || expandedDates.length === 0
                      const hasCritical = annotations.some(a => a.severity === "critical")
                      const hasWarning = annotations.some(a => a.severity === "warning")
                      
                      return (
                        <Collapsible key={date} open={isExpanded} onOpenChange={() => toggleDate(date)}>
                          <CollapsibleTrigger asChild>
                            <div className={cn(
                              "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                              hasCritical ? "bg-red-50 hover:bg-red-100" :
                              hasWarning ? "bg-amber-50 hover:bg-amber-100" :
                              "bg-muted/50 hover:bg-muted"
                            )}>
                              <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{date}</span>
                                <Badge variant="outline" className="text-[10px]">
                                  {annotations.length}건
                                </Badge>
                                {hasCritical && (
                                  <Badge className="text-[10px] bg-red-100 text-red-700">위험</Badge>
                                )}
                                {!hasCritical && hasWarning && (
                                  <Badge className="text-[10px] bg-amber-100 text-amber-700">주의</Badge>
                                )}
                              </div>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="space-y-2 mt-2 ml-4 pl-4 border-l-2 border-muted">
                              {annotations.map(annotation => {
                                const variable = PROCESS_VARIABLES.find(v => v.id === annotation.variableId)
                                
                                return (
                                  <Card key={annotation.id} className={cn(
                                    "border-l-4",
                                    annotation.severity === "critical" && "border-l-red-500",
                                    annotation.severity === "warning" && "border-l-amber-500",
                                    annotation.severity === "info" && "border-l-blue-500"
                                  )}>
                                    <CardContent className="p-3">
                                      <div className="flex items-start gap-3">
                                        <div className={cn(
                                          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                          annotation.severity === "critical" && "bg-red-100",
                                          annotation.severity === "warning" && "bg-amber-100",
                                          annotation.severity === "info" && "bg-blue-100"
                                        )}>
                                          <MessageSquare className={cn(
                                            "h-4 w-4",
                                            annotation.severity === "critical" && "text-red-600",
                                            annotation.severity === "warning" && "text-amber-600",
                                            annotation.severity === "info" && "text-blue-600"
                                          )} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-xs">{annotation.time}</span>
                                            <Badge className={cn("text-[10px] border", annotationTypeColors[annotation.type])}>
                                              {annotationTypeLabels[annotation.type]}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px] font-mono">
                                              {annotation.variableId}
                                            </Badge>
                                            {variable && (
                                              <Badge variant="secondary" className="text-[10px]">
                                                {variable.process}
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-sm font-medium">{annotation.title}</p>
                                          <p className="text-xs text-muted-foreground mt-0.5">{annotation.content}</p>
                                          
                                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                                            {annotation.value && (
                                              <div className="flex items-center gap-1 text-xs bg-muted/50 px-2 py-0.5 rounded">
                                                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                                                <span className="font-medium">{annotation.value}</span>
                                              </div>
                                            )}
                                            {annotation.linkedEventId && (
                                              <Badge variant="outline" className="text-[10px] text-indigo-600 cursor-pointer hover:bg-indigo-50">
                                                {annotation.linkedEventId}
                                              </Badge>
                                            )}
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
                                              <User className="h-3 w-3" />
                                              {annotation.author}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
