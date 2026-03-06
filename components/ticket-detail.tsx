"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { Ticket, EventProcessStep, EventOpinion, DataInsertBox } from "@/lib/types"
import { ClosureReportDialog, requiresClosureReport } from "@/components/closure-report-dialog"
import type { ClosureReport } from "@/components/closure-report-dialog"
import { DataVisualization } from "@/components/data-visualization"
import { DataInsertBoxConfig } from "@/components/data-insert-box-config"
import { TemplateSelectorDialog } from "@/components/template-selector-dialog"
import { TICKET_CATEGORY_TEMPLATES } from "@/lib/ticket-templates"
import { getTickets, markNotificationAsRead, closeTicket, getTicketById, updateTicket } from "@/lib/storage"
import {
  Calendar, User, Target, AlertCircle, CheckCircle, XCircle, Clock, ArrowRight,
  FileSearch, FileText, Send, Save, PlusCircle, Trash2, FileUp, X, RotateCcw,
  Activity, Gauge, Info, Wrench, FileBarChart, Link2, MessageSquare, ChevronRight,
  Search, Users, UserPlus, ExternalLink, Boxes, ChevronDown, ArrowUpCircle, Shield,
  Globe, Lock, Eye, Settings, RefreshCcw, Paperclip, TrendingUp, Monitor, BarChart3,
  Table as TableIcon, Sparkles
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog"

interface TicketDetailProps {
  ticket: Ticket
}

const CURRENT_USER = "김지수"

const COLORS = ["#10b981","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#f97316"]

function generateTagTrend(tagId: string, points = 48) {
  const seed = tagId.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const rand = (s: number) => ((Math.sin(s) * 10000) % 1 + 1) % 1
  const prefix = tagId.substring(0, 2)
  let base = 100, unit = "", high: number | null = null, low: number | null = null
  if (prefix === "TI") { base = 200 + seed % 200; unit = "deg.C"; high = base + 40; low = base - 30 }
  else if (prefix === "PI") { base = 5 + seed % 20; unit = "kg/cm2"; high = base + 7; low = base - 3 }
  else if (prefix === "FI") { base = 50 + seed % 100; unit = "BPD"; high = base + 30; low = null }
  else if (prefix === "LI") { base = 40 + seed % 30; unit = "%"; high = 80; low = 20 }
  else { base = 50 + seed % 50; unit = "unit"; high = null; low = null }
  const values: number[] = []
  for (let i = 0; i < points; i++) values.push(base + (rand(seed + i * 7) - 0.5) * base * 0.15)
  const current = values[values.length - 1]
  return { values, unit, high, low, current: Math.round(current * 10) / 10 }
}

function MiniTrendChart({ values, high, low, color, isAlert }: { values: number[]; high: number | null; low: number | null; color: string; isAlert?: boolean }) {
  const min = Math.min(...values), max = Math.max(...values)
  const allMin = Math.min(min, low ?? min), allMax = Math.max(max, high ?? max)
  const range = allMax - allMin || 1
  const h = 80, w = 200, pad = 2
  const pts = values.map((v, i) => `${pad + (i / (values.length - 1)) * (w - pad * 2)},${h - pad - ((v - allMin) / range) * (h - pad * 2)}`).join(" ")
  const highY = high !== null ? h - pad - ((high - allMin) / range) * (h - pad * 2) : null
  const lowY = low !== null ? h - pad - ((low - allMin) / range) * (h - pad * 2) : null
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" preserveAspectRatio="none">
      {highY !== null && <line x1={pad} y1={highY} x2={w - pad} y2={highY} stroke="#ef4444" strokeWidth="0.5" strokeDasharray="3,3" opacity={0.6} />}
      {lowY !== null && <line x1={pad} y1={lowY} x2={w - pad} y2={lowY} stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="3,3" opacity={0.6} />}
      <polyline points={pts} fill="none" stroke={isAlert ? "#ef4444" : color} strokeWidth="1.5" />
    </svg>
  )
}

// --- Process Flow Component ---
function ProcessFlowBar({ steps, processStatus }: { steps?: EventProcessStep[]; processStatus?: string }) {
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({})

  if (!steps || steps.length === 0) return null
  
  // 스킵된 단계는 숨김 처리
  const visibleSteps = steps.filter(s => s.status !== "skipped")

  const toggleStep = (idx: number) => {
    setExpandedSteps(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  const getBorderColor = (status: string) => {
    switch (status) {
      case "completed": return "border-l-emerald-500"
      case "current": return "border-l-amber-500"
      case "skipped": return "border-l-red-400"
      default: return "border-l-border"
    }
  }

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-500 text-white"
      case "current": return "bg-amber-500 text-white"
      case "skipped": return "bg-red-400 text-white"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getCardBg = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-50/50"
      case "current": return "bg-amber-50/50"
      case "skipped": return "bg-red-50/30"
      default: return "bg-muted/20"
    }
  }

  const hasDetails = (step: EventProcessStep) => !!(step.assignee || step.team || step.timestamp)

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          업무 프로세스
        </h3>
        <Badge variant="outline" className="text-[10px] font-medium">
          {visibleSteps.filter(s => s.status === "completed").length} / {visibleSteps.length} 완료
        </Badge>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${visibleSteps.length}, minmax(0, 1fr))` }}>
        {visibleSteps.map((step, index) => {
          const isExpanded = expandedSteps[index] !== false
          const details = hasDetails(step)
          return (
            <div
              key={step.step + index}
              className={cn(
                "rounded-lg border border-l-[3px] transition-all",
                getBorderColor(step.status),
                getCardBg(step.status),
                step.status === "current" && "ring-1 ring-amber-200/60",
              )}
            >
              {/* Header */}
              <button
                onClick={() => details && toggleStep(index)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 text-left",
                  details && "cursor-pointer"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn(
                    "shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold leading-none",
                    getBadgeStyle(step.status),
                  )}>
                    {step.status === "completed" ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : step.status === "skipped" ? (
                      <XCircle className="h-3 w-3" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className={cn(
                    "text-xs font-semibold truncate",
                    step.status === "upcoming" ? "text-muted-foreground" : "text-foreground",
                    step.status === "skipped" && "line-through text-red-500",
                  )}>
                    {step.label}
                  </span>
                </div>
                {details && (
                  <ChevronDown className={cn(
                    "h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )} />
                )}
              </button>

              {/* Expanded detail */}
              {details && isExpanded && (
                <div className="px-3 pb-2.5 pt-0 space-y-1.5 border-t border-border/40">
                  {step.team && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[11px] text-muted-foreground">{step.team}</span>
                    </div>
                  )}
                  {step.assignee && (
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[11px] font-medium text-foreground">{step.assignee}</span>
                    </div>
                  )}
                  {step.timestamp && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[10px] text-muted-foreground">{step.timestamp}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// --- Similar Events Panel ---
function SimilarEventsDialog({ ticket }: { ticket: Ticket }) {
  const allTickets = getTickets()
  const similar = allTickets
    .filter(t => t.id !== ticket.id && (t.unit === ticket.unit || (ticket.tags && t.tags?.some(tag => ticket.tags?.includes(tag)))))
    .slice(0, 5)

  const getSimilarity = (t: Ticket) => {
    let score = 0
    if (t.unit === ticket.unit) score += 40
    if (ticket.tags && t.tags) score += ticket.tags.filter(tag => t.tags?.includes(tag)).length * 20
    if (t.ticketType === ticket.ticketType) score += 15
    if (t.impact === ticket.impact) score += 15
    return Math.min(score, 100)
  }

  return (
    <div className="space-y-3">
      {similar.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">유사 이벤트가 없습니다.</p>
      ) : (
        similar.map(t => (
          <Card key={t.id} className="p-3 hover:bg-muted/30 cursor-pointer">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{t.id}</span>
                  <Badge variant="outline" className="text-[10px]">{t.unit}</Badge>
                </div>
                <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.createdDate}</p>
              </div>
              <Badge variant="secondary" className="text-xs shrink-0 bg-emerald-50 text-emerald-700">{getSimilarity(t)}%</Badge>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}

// --- Similar Reports (dummy) ---
function SimilarReportsContent({ ticket }: { ticket: Ticket }) {
  const reports = [
    { id: "RPT-041", title: `${ticket.unit} 열교환기 성능 점검 보고서`, date: "2024-12-15", similarity: 78 },
    { id: "RPT-038", title: `${ticket.unit} 운전 가이��� 개정 보고서`, date: "2024-11-20", similarity: 65 },
    { id: "RPT-022", title: `${ticket.unit || "CDU"} 공정 효율 분석 보고서`, date: "2024-09-10", similarity: 52 },
  ]
  return (
    <div className="space-y-3">
      {reports.map(r => (
        <Card key={r.id} className="p-3 hover:bg-muted/30 cursor-pointer">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-mono text-muted-foreground">{r.id}</span>
              <p className="text-sm font-medium text-foreground mt-0.5">{r.title}</p>
              <p className="text-xs text-muted-foreground">{r.date}</p>
            </div>
            <Badge variant="secondary" className="text-xs shrink-0 bg-blue-50 text-blue-700">{r.similarity}%</Badge>
          </div>
        </Card>
      ))}
    </div>
  )
}

// --- Key Variables Data (주요 운전변수 데이터 생성) ---
function generateKeyVariablesData(unit: string) {
  const baseVariables = [
    // 온도 관련
    { tag: "TI-101", name: "Feed 입구 온도", unit: "°C", baseValue: 245 },
    { tag: "TI-102", name: "1단 반응기 온도", unit: "°C", baseValue: 380 },
    { tag: "TI-103", name: "2단 반응기 온도", unit: "°C", baseValue: 395 },
    { tag: "TI-104", name: "분리기 온도", unit: "°C", baseValue: 280 },
    { tag: "TI-105", name: "탈기기 상부 온도", unit: "°C", baseValue: 125 },
    { tag: "TI-106", name: "탈기기 하부 온도", unit: "°C", baseValue: 185 },
    { tag: "TI-107", name: "스트리퍼 온도", unit: "°C", baseValue: 220 },
    { tag: "TI-108", name: "제품 출구 온도", unit: "°C", baseValue: 95 },
    // 압력 관련
    { tag: "PI-201", name: "반응기 입구 압력", unit: "kg/cm²", baseValue: 155 },
    { tag: "PI-202", name: "반응기 출구 압력", unit: "kg/cm²", baseValue: 148 },
    { tag: "PI-203", name: "분리기 압력", unit: "kg/cm²", baseValue: 52 },
    { tag: "PI-204", name: "흡수탑 압력", unit: "kg/cm²", baseValue: 28 },
    { tag: "PI-205", name: "스트리퍼 압력", unit: "kg/cm²", baseValue: 8.5 },
    { tag: "PI-206", name: "제품 탱크 압력", unit: "kg/cm²", baseValue: 1.2 },
    // 유량 관련
    { tag: "FI-301", name: "Feed 유량", unit: "BPD", baseValue: 12500 },
    { tag: "FI-302", name: "수소 유량", unit: "Nm³/h", baseValue: 45000 },
    { tag: "FI-303", name: "리사이클 유량", unit: "BPD", baseValue: 8500 },
    { tag: "FI-304", name: "퍼지 가스 유량", unit: "Nm³/h", baseValue: 2500 },
    { tag: "FI-305", name: "스팀 유량", unit: "kg/h", baseValue: 3200 },
    { tag: "FI-306", name: "냉각수 유량", unit: "m³/h", baseValue: 850 },
    { tag: "FI-307", name: "제품 유량", unit: "BPD", baseValue: 11800 },
    { tag: "FI-308", name: "오프가스 유량", unit: "Nm³/h", baseValue: 1200 },
    // 레벨 관련
    { tag: "LI-401", name: "분리기 레벨", unit: "%", baseValue: 55 },
    { tag: "LI-402", name: "탈기기 레벨", unit: "%", baseValue: 48 },
    { tag: "LI-403", name: "스트리퍼 레벨", unit: "%", baseValue: 52 },
    { tag: "LI-404", name: "제품 탱크 레벨", unit: "%", baseValue: 65 },
    // 분석 관련
    { tag: "AI-501", name: "H2S 농도", unit: "ppm", baseValue: 15 },
    { tag: "AI-502", name: "NH3 농도", unit: "ppm", baseValue: 8 },
    { tag: "AI-503", name: "수소 순도", unit: "%", baseValue: 99.5 },
    { tag: "AI-504", name: "제품 황 함량", unit: "ppm", baseValue: 5 },
    { tag: "AI-505", name: "제품 질소 함량", unit: "ppm", baseValue: 2 },
    // 기타 운전변수
    { tag: "XI-601", name: "촉매 활성도", unit: "%", baseValue: 92 },
    { tag: "XI-602", name: "히터 Duty", unit: "MMkcal/h", baseValue: 28.5 },
    { tag: "XI-603", name: "컴프레서 부하", unit: "%", baseValue: 78 },
    { tag: "XI-604", name: "열교환기 효율", unit: "%", baseValue: 85 },
    { tag: "XI-605", name: "반응 전환율", unit: "%", baseValue: 94 },
    { tag: "XI-606", name: "수율", unit: "%", baseValue: 88.5 },
    { tag: "XI-607", name: "에너지 소비", unit: "kWh/bbl", baseValue: 12.5 },
    { tag: "XI-608", name: "스팀 소비", unit: "kg/bbl", baseValue: 8.2 },
    { tag: "XI-609", name: "냉각수 소비", unit: "m³/bbl", baseValue: 0.15 },
    { tag: "XI-610", name: "수소 소비", unit: "Nm³/bbl", baseValue: 180 },
  ]
  
  return baseVariables.map(v => ({
    ...v,
    currentValue: +(v.baseValue * (0.95 + Math.random() * 0.1)).toFixed(2),
    avgValue: +(v.baseValue * (0.97 + Math.random() * 0.06)).toFixed(2),
    minValue: +(v.baseValue * 0.92).toFixed(2),
    maxValue: +(v.baseValue * 1.08).toFixed(2),
    status: Math.random() > 0.9 ? "Warning" : Math.random() > 0.95 ? "Critical" : "Normal",
  }))
}

// --- Context Data Panel ---
function ContextDataPanel({ ticket }: { ticket: Ticket }) {
  const [showKeyVariables, setShowKeyVariables] = useState(false)
  const [variablesFromDate, setVariablesFromDate] = useState(ticket.fromTime || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
  const [variablesToDate, setVariablesToDate] = useState(ticket.toTime || new Date().toISOString().split("T")[0])
  const [keyVariablesData, setKeyVariablesData] = useState(() => generateKeyVariablesData(ticket.unit || "HCR"))
  
  const contextData = {
    operatingMode: ticket.unit === "HCR" ? "W600N" : ticket.unit === "VDU" ? "Normal" : "Mixed",
    feedRate: ticket.unit === "CDU" ? "48,500 BPD" : ticket.unit === "HCR" ? "12,200 BPD" : "8,500 BPD",
    productOnSpec: ticket.processStatus === "rejected" ? "Off-Spec" : "On-Spec",
    guideCompliance: ticket.priority === "P1" ? "비준수" : "준수",
  }
  
  const handleRefreshVariables = () => {
    setKeyVariablesData(generateKeyVariablesData(ticket.unit || "HCR"))
  }
  
  // hasAdditionalData moved to left panel

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Gauge className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">컨텍스트 데이터</h3>
        {ticket.fromTime && ticket.toTime && (
          <Badge variant="outline" className="text-[10px] ml-auto">
            {new Date(ticket.fromTime).toLocaleDateString("ko-KR")} ~ {new Date(ticket.toTime).toLocaleDateString("ko-KR")}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-[10px] text-muted-foreground mb-0.5">운전 모드</p>
          <p className="text-sm font-medium text-foreground">{contextData.operatingMode}</p>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-[10px] text-muted-foreground mb-0.5">Feed 처리량</p>
          <p className="text-sm font-medium text-foreground">{contextData.feedRate}</p>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-[10px] text-muted-foreground mb-0.5">Product On-Spec</p>
          <p className={`text-sm font-medium ${contextData.productOnSpec === "On-Spec" ? "text-emerald-600" : "text-red-600"}`}>{contextData.productOnSpec}</p>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-[10px] text-muted-foreground mb-0.5">Guide 준수</p>
          <p className={`text-sm font-medium ${contextData.guideCompliance === "준수" ? "text-emerald-600" : "text-red-600"}`}>{contextData.guideCompliance}</p>
        </div>
      </div>

      {/* 주요 운전변수 버튼 */}
      <div className="mb-4">
        <Dialog open={showKeyVariables} onOpenChange={setShowKeyVariables}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full text-xs gap-2 h-9 justify-center bg-primary/5 border-primary/20 hover:bg-primary/10">
              <Activity className="h-3.5 w-3.5" />
              주요 운전변수 확인 ({keyVariablesData.length}개 항목)
            </Button>
          </DialogTrigger>
          <DialogContent className="!max-w-[1600px] w-[95vw] min-w-[900px] max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader className="shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                주요 운전변수 ({keyVariablesData.length}개)
              </DialogTitle>
              <DialogDescription>
                이벤트 발생 기간 내 주요 운전변수의 평균값 및 현재 상태입니다.
              </DialogDescription>
            </DialogHeader>
            
            {/* 시간 설정 */}
            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium">조회 기간</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={variablesFromDate.split("T")[0]}
                  onChange={(e) => setVariablesFromDate(e.target.value)}
                  className="h-8 text-xs w-36"
                />
                <span className="text-muted-foreground">~</span>
                <Input
                  type="date"
                  value={variablesToDate.split("T")[0]}
                  onChange={(e) => setVariablesToDate(e.target.value)}
                  className="h-8 text-xs w-36"
                />
              </div>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={handleRefreshVariables}>
                <RefreshCcw className="h-3.5 w-3.5" />
                조회
              </Button>
              <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Normal</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Warning</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
              </div>
            </div>
            
            {/* 변수 목록 - 테이블 형태 */}
            <div className="flex-1 overflow-y-auto mt-3 border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-muted-foreground w-[100px]">태그</th>
                    <th className="text-left p-3 font-medium text-muted-foreground min-w-[180px]">변수명</th>
                    <th className="text-center p-3 font-medium text-muted-foreground w-[120px]">평균</th>
                    <th className="text-center p-3 font-medium text-muted-foreground w-[120px]">현재</th>
                    <th className="text-center p-3 font-medium text-muted-foreground w-[120px]">최소</th>
                    <th className="text-center p-3 font-medium text-muted-foreground w-[120px]">최대</th>
                    <th className="text-center p-3 font-medium text-muted-foreground w-[100px]">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {keyVariablesData.map((v, i) => (
                    <tr key={v.tag} className={cn(
                      "border-b last:border-b-0 hover:bg-muted/30 transition-colors",
                      v.status === "Critical" ? "bg-red-50/50" :
                      v.status === "Warning" ? "bg-amber-50/50" : ""
                    )}>
                      <td className="p-3 font-mono font-semibold text-primary">{v.tag}</td>
                      <td className="p-3">{v.name}</td>
                      <td className="p-3 text-center">{v.avgValue} <span className="text-muted-foreground text-xs">{v.unit}</span></td>
                      <td className={cn("p-3 text-center font-medium", v.status !== "Normal" && "text-red-600")}>
                        {v.currentValue} <span className="text-muted-foreground text-xs">{v.unit}</span>
                      </td>
                      <td className="p-3 text-center text-blue-600">{v.minValue} <span className="text-muted-foreground text-xs">{v.unit}</span></td>
                      <td className="p-3 text-center text-red-600">{v.maxValue} <span className="text-muted-foreground text-xs">{v.unit}</span></td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className={cn("text-xs",
                          v.status === "Critical" ? "text-red-600 border-red-200 bg-red-50" :
                          v.status === "Warning" ? "text-amber-600 border-amber-200 bg-amber-50" :
                          "text-emerald-600 border-emerald-200 bg-emerald-50"
                        )}>
                          {v.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      

      {ticket.tags && ticket.tags.length > 0 && (() => {
        const tagTrends = ticket.tags.map(tag => ({ tag, ...generateTagTrend(tag) }))
        return (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">관련 태그 트렌드</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tagTrends.map(({ tag, values, unit, high, low, current }, i) => {
                const isViolation = (high !== null && current > high) || (low !== null && current < low)
                return (
                  <div key={tag} className="p-3 bg-muted/20 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="font-mono text-xs font-semibold">{tag}</span>
                        {isViolation && <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">Limit 초과</Badge>}
                      </div>
                      <span className="text-[10px] text-muted-foreground">[{unit}]</span>
                    </div>
                    <MiniTrendChart values={values} high={high} low={low} color={COLORS[i % COLORS.length]} isAlert={isViolation} />
                    <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-border/30">
                      <span><span className="text-muted-foreground">현재 </span><span className={isViolation ? "text-red-600 font-semibold" : "font-semibold"}>{current} {unit}</span></span>
                      {high !== null && <span><span className="text-muted-foreground">H </span><span className="text-red-500 font-medium">{high}</span></span>}
                      {low !== null && <span><span className="text-muted-foreground">L </span><span className="text-blue-500 font-medium">{low}</span></span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      <Separator className="my-4" />
      <p className="text-xs font-medium text-muted-foreground mb-2">연계 정보</p>
      <div className="flex flex-wrap gap-2">
        {/* 장치 데이터시트 */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 bg-transparent cursor-pointer">
              <Info className="h-3.5 w-3.5" />
              장치 데이터시트
            </Button>
          </DialogTrigger>
          <DialogContent className="!max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                장치 데이터시트
              </DialogTitle>
              <DialogDescription>{ticket.equipment || ticket.unit || "장치"} 사양 정보</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "장치 번호", value: ticket.equipment || "C-201" },
                  { label: "장치명", value: ticket.unit === "HCR" ? "Hydrocracking Reactor" : ticket.unit === "VDU" ? "Vacuum Tower" : "Atmospheric Tower" },
                  { label: "설치 공정", value: ticket.unit || "CDU" },
                  { label: "설계 압력", value: ticket.unit === "HCR" ? "180 kg/cm2" : "2.5 kg/cm2" },
                  { label: "설계 온도", value: ticket.unit === "HCR" ? "450 deg.C" : "400 deg.C" },
                  { label: "운전 압력", value: ticket.unit === "HCR" ? "155 kg/cm2" : "1.2 kg/cm2" },
                  { label: "운전 온도", value: ticket.unit === "HCR" ? "412 deg.C" : "360 deg.C" },
                  { label: "재질", value: "SS321 / SS347" },
                  { label: "제조사", value: "Hyundai Heavy Industries" },
                  { label: "설치 연도", value: "2015" },
                  { label: "최근 검사일", value: "2024-08-15" },
                  { label: "다음 검사 예정", value: "2026-08-15" },
                ].map(item => (
                  <div key={item.label} className="p-2.5 bg-muted/30 rounded-md">
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium mb-2">Nozzle Schedule</p>
                <table className="w-full text-xs">
                  <thead><tr className="border-b text-muted-foreground"><th className="text-left py-1.5 px-2">Nozzle</th><th className="text-left py-1.5 px-2">Size</th><th className="text-left py-1.5 px-2">Service</th><th className="text-left py-1.5 px-2">Rating</th></tr></thead>
                  <tbody>
                    {[
                      { nozzle: "N1", size: "24\"", service: "Feed Inlet", rating: "900#" },
                      { nozzle: "N2", size: "18\"", service: "Vapor Outlet", rating: "900#" },
                      { nozzle: "N3", size: "12\"", service: "Liquid Outlet", rating: "900#" },
                      { nozzle: "N4", size: "2\"", service: "Thermowell", rating: "900#" },
                      { nozzle: "N5", size: "2\"", service: "Pressure Gauge", rating: "900#" },
                    ].map(row => (
                      <tr key={row.nozzle} className="border-b border-border/30">
                        <td className="py-1.5 px-2 font-mono font-medium">{row.nozzle}</td>
                        <td className="py-1.5 px-2">{row.size}</td>
                        <td className="py-1.5 px-2">{row.service}</td>
                        <td className="py-1.5 px-2">{row.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* P&ID 도면 */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 bg-transparent cursor-pointer">
              <FileBarChart className="h-3.5 w-3.5" />
              {"P&ID 도면"}
            </Button>
          </DialogTrigger>
          <DialogContent className="!max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileBarChart className="h-4 w-4 text-primary" />
                {"P&ID 도면"}
              </DialogTitle>
              <DialogDescription>{ticket.unit || "CDU"} 공정 배관 계장도</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: "도면 번호", value: `${ticket.unit || "CDU"}-PID-001` },
                  { label: "Revision", value: "Rev.5 (2024-06-01)" },
                  { label: "승인 상태", value: "Approved" },
                ].map(item => (
                  <div key={item.label} className="p-2 bg-muted/30 rounded-md">
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                    <p className="text-xs font-medium text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
              {/* P&ID schematic visualization */}
              <div className="border border-border rounded-lg bg-muted/10 p-4 relative" style={{ minHeight: 360 }}>
                <svg viewBox="0 0 800 350" className="w-full h-auto">
                  {/* Equipment boxes */}
                  <rect x="50" y="80" width="120" height="180" rx="4" fill="none" stroke="#10b981" strokeWidth="2" />
                  <text x="110" y="170" textAnchor="middle" className="text-[11px]" fill="#10b981" fontWeight="600">{ticket.equipment || "C-201"}</text>
                  <text x="110" y="186" textAnchor="middle" className="text-[9px]" fill="#6b7280">Main Column</text>
                  <rect x="300" y="120" width="100" height="100" rx="4" fill="none" stroke="#3b82f6" strokeWidth="2" />
                  <text x="350" y="170" textAnchor="middle" className="text-[11px]" fill="#3b82f6" fontWeight="600">E-{ticket.unit === "HCR" ? "301" : "201"}</text>
                  <text x="350" y="186" textAnchor="middle" className="text-[9px]" fill="#6b7280">Exchanger</text>
                  <rect x="540" y="100" width="100" height="80" rx="4" fill="none" stroke="#f59e0b" strokeWidth="2" />
                  <text x="590" y="140" textAnchor="middle" className="text-[11px]" fill="#f59e0b" fontWeight="600">D-{ticket.unit === "HCR" ? "301" : "201"}</text>
                  <text x="590" y="156" textAnchor="middle" className="text-[9px]" fill="#6b7280">Separator</text>
                  <circle cx="590" cy="280" r="30" fill="none" stroke="#8b5cf6" strokeWidth="2" />
                  <text x="590" y="283" textAnchor="middle" className="text-[11px]" fill="#8b5cf6" fontWeight="600">P-{ticket.unit === "HCR" ? "301" : "201"}</text>
                  {/* Piping lines */}
                  <line x1="170" y1="170" x2="300" y2="170" stroke="#94a3b8" strokeWidth="2" />
                  <line x1="400" y1="170" x2="540" y2="140" stroke="#94a3b8" strokeWidth="2" />
                  <line x1="590" y1="180" x2="590" y2="250" stroke="#94a3b8" strokeWidth="2" />
                  <polygon points="296,166 304,170 296,174" fill="#94a3b8" />
                  <polygon points="536,137 544,140 536,143" fill="#94a3b8" />
                  {/* Tag annotations */}
                  {(ticket.tags || []).slice(0, 4).map((tag, idx) => {
                    const positions = [{ x: 110, y: 70 }, { x: 240, y: 145 }, { x: 460, y: 125 }, { x: 680, y: 140 }]
                    const pos = positions[idx] || positions[0]
                    return (
                      <g key={tag}>
                        <rect x={pos.x - 28} y={pos.y - 8} width={56} height={16} rx={3} fill="#f0fdf4" stroke="#10b981" strokeWidth="0.5" />
                        <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="#059669" fontSize="9" fontFamily="monospace" fontWeight="600">{tag}</text>
                      </g>
                    )
                  })}
                  {/* Flow arrows label */}
                  <text x="235" y="158" textAnchor="middle" fill="#94a3b8" fontSize="8">Feed</text>
                  <text x="470" y="118" textAnchor="middle" fill="#94a3b8" fontSize="8">Effluent</text>
                </svg>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">{"도면 클릭 시 전체화면 P&ID Viewer가 실행됩니다. (시스템 연동 후 활성화)"}</p>
            </div>
          </DialogContent>
        </Dialog>

        {/* DCS 화면 */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 bg-transparent cursor-pointer">
              <ExternalLink className="h-3.5 w-3.5" />
              DCS 화면
            </Button>
          </DialogTrigger>
          <DialogContent className="!max-w-5xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-primary" />
                DCS 화면
              </DialogTitle>
              <DialogDescription>{ticket.unit || "CDU"} DCS Operator Station 화면</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {/* DCS Overview schematic */}
              <div className="relative border border-border rounded-lg bg-[#1a1a2e] overflow-hidden" style={{ minHeight: 400 }}>
                <svg viewBox="0 0 900 400" className="w-full h-auto">
                  {/* Background grid */}
                  {Array.from({ length: 18 }).map((_, i) => (
                    <line key={`vg${i}`} x1={i * 50} y1="0" x2={i * 50} y2="400" stroke="#ffffff08" strokeWidth="1" />
                  ))}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <line key={`hg${i}`} x1="0" y1={i * 50} x2="900" y2={i * 50} stroke="#ffffff08" strokeWidth="1" />
                  ))}
                  {/* DCS Equipment */}
                  <rect x="60" y="60" width="140" height="220" rx="6" fill="#1e293b" stroke="#22d3ee" strokeWidth="1.5" />
                  <text x="130" y="170" textAnchor="middle" fill="#22d3ee" fontSize="14" fontWeight="700">{ticket.equipment || "C-201"}</text>
                  <text x="130" y="190" textAnchor="middle" fill="#94a3b8" fontSize="10">Main Column</text>
                  <rect x="340" y="120" width="120" height="120" rx="6" fill="#1e293b" stroke="#34d399" strokeWidth="1.5" />
                  <text x="400" y="180" textAnchor="middle" fill="#34d399" fontSize="14" fontWeight="700">E-{ticket.unit === "HCR" ? "301" : "201"}</text>
                  <rect x="600" y="100" width="120" height="100" rx="6" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.5" />
                  <text x="660" y="150" textAnchor="middle" fill="#fbbf24" fontSize="14" fontWeight="700">D-{ticket.unit === "HCR" ? "301" : "201"}</text>
                  {/* Pipes */}
                  <line x1="200" y1="170" x2="340" y2="180" stroke="#475569" strokeWidth="3" />
                  <line x1="460" y1="180" x2="600" y2="150" stroke="#475569" strokeWidth="3" />
                  {/* Tag readouts */}
                  {(ticket.tags || []).map((tag, idx) => {
                    const trend = generateTagTrend(tag)
                    const isAlert = (trend.high !== null && trend.current > trend.high) || (trend.low !== null && trend.current < trend.low)
                    const positions = [{ x: 90, y: 310 }, { x: 260, y: 310 }, { x: 430, y: 310 }, { x: 600, y: 310 }, { x: 770, y: 310 }]
                    const pos = positions[idx % positions.length]
                    return (
                      <g key={tag}>
                        <rect x={pos.x} y={pos.y} width={130} height={56} rx={4} fill="#0f172a" stroke={isAlert ? "#ef4444" : "#334155"} strokeWidth="1" />
                        <text x={pos.x + 8} y={pos.y + 16} fill="#94a3b8" fontSize="10" fontFamily="monospace">{tag}</text>
                        <text x={pos.x + 8} y={pos.y + 36} fill={isAlert ? "#ef4444" : "#22d3ee"} fontSize="16" fontWeight="700" fontFamily="monospace">{trend.current}</text>
                        <text x={pos.x + 90} y={pos.y + 36} fill="#64748b" fontSize="10">{trend.unit}</text>
                        {isAlert && <circle cx={pos.x + 120} cy={pos.y + 14} r={4} fill="#ef4444"><animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" /></circle>}
                        {trend.high !== null && <text x={pos.x + 8} y={pos.y + 50} fill="#ef4444" fontSize="8">H: {trend.high}</text>}
                        {trend.low !== null && <text x={pos.x + 60} y={pos.y + 50} fill="#3b82f6" fontSize="8">L: {trend.low}</text>}
                      </g>
                    )
                  })}
                  {/* Title bar */}
                  <rect x="0" y="0" width="900" height="30" fill="#0f172a" />
                  <text x="15" y="20" fill="#94a3b8" fontSize="12" fontWeight="600">{ticket.unit || "CDU"} - DCS Overview</text>
                  <text x="780" y="20" fill="#64748b" fontSize="10">{new Date().toLocaleString("ko-KR")}</text>
                </svg>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">실제 DCS 연동 시 실시간 운전 화면이 표시됩니다.</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  )
}

// --- Opinion Writing Canvas ---
function OpinionWritingCanvas({
  ticketId, ticketType, ticketUnit, currentUser, onSuccess
}: {
  ticketId: string; ticketType: string; ticketUnit?: string; currentUser: string;
  onSuccess: () => void
}) {
  const [useTemplate, setUseTemplate] = useState(false)
  const [templateType, setTemplateType] = useState("")
  const [templateLabel, setTemplateLabel] = useState("")
  const [freeText, setFreeText] = useState("") // 자유 텍스트 입력
  const [fields, setFields] = useState<{ label: string; value: string }[]>([])
  const [dataBoxes, setDataBoxes] = useState<DataInsertBox[]>([])
  const [attachments, setAttachments] = useState<{ fileName: string; fileUrl: string }[]>([])
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showDataBoxConfig, setShowDataBoxConfig] = useState(false)
  
  // 이미 제출된 의견 확인
  const ticket = getTicketById(ticketId)
  const submittedOpinion = ticket?.opinions?.find(op => op.author === currentUser && op.status === "submitted")
  const hasSubmittedOpinion = !!submittedOpinion

  const handleSelectTemplate = (category: string) => {
    const templateLabels: Record<string, string> = {
      Trouble: "트러블슈팅", Improvement: "개선아이템", Change: "변경 관리", Analysis: "분석 검토"
    }
    setUseTemplate(true)
    setTemplateType(category)
    setTemplateLabel(templateLabels[category] || category)
    const templateFields = TICKET_CATEGORY_TEMPLATES[category] || []
    setFields(templateFields.map(f => ({ label: f.label, value: "" })))
    setShowTemplateDialog(false)
  }
  
  const handleClearTemplate = () => {
    setUseTemplate(false)
    setTemplateType("")
    setTemplateLabel("")
    setFields([])
  }

  const handleFieldChange = (index: number, value: string) => {
    const updated = [...fields]
    updated[index].value = value
    setFields(updated)
  }

  const handleAddDataBox = (box: Omit<DataInsertBox, "id">) => {
    setDataBoxes([...dataBoxes, { id: `box-${Date.now()}`, ...box }])
    setShowDataBoxConfig(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => ({ fileName: f.name, fileUrl: URL.createObjectURL(f) }))
      setAttachments([...attachments, ...newFiles])
    }
  }

  const handleSaveDraft = () => {
    const ticket = getTicketById(ticketId)
    if (!ticket) return
    const opinion: EventOpinion = {
      id: `op-${Date.now()}`, author: currentUser, team: "공정기술팀",
      templateType: useTemplate ? templateType : "FreeText", 
      templateLabel: useTemplate ? templateLabel : "자유 의견", 
      fields: useTemplate ? fields : [{ label: "의견 내용", value: freeText }],
      dataBoxes: dataBoxes.length > 0 ? dataBoxes : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      status: "draft", createdAt: new Date().toISOString(),
    }
    const opinions = [...(ticket.opinions || []), opinion]
    updateTicket(ticketId, { opinions })
    alert("임시 저장되었습니다.")
  }
  
  // 의견 수정 (롤백) 핸들러
  const handleEditOpinion = () => {
    const ticket = getTicketById(ticketId)
    if (!ticket) return
    
    // 기존 제출된 의견을 draft 상태로 변경
    const updatedOpinions = (ticket.opinions || []).map(op => 
      op.author === currentUser && op.status === "submitted" 
        ? { ...op, status: "draft" as const, submittedAt: undefined }
        : op
    )
    
    // 프로세스를 기술검토 단계로 롤백
    const updatedFlow = (ticket.processFlow || []).map(s =>
      s.step === "review" ? { ...s, status: "current" as const } :
      s.step === "additional-review" ? { ...s, status: "upcoming" as const } :
      s.step === "publisher-confirm" ? { ...s, status: "upcoming" as const } :
      s.step === "closed" ? { ...s, status: "upcoming" as const } : s
    )
    
    updateTicket(ticketId, {
      opinions: updatedOpinions,
      processStatus: "review",
      processFlow: updatedFlow,
      messages: [...(ticket.messages || []), {
        id: `msg-${Date.now()}`, ticketId, author: currentUser, role: "assignee" as const,
        messageType: "status_change" as const, content: `${currentUser}님이 의견을 수정하기 위해 기술검토 단계로 되돌렸습니다.`,
        timestamp: new Date().toISOString(),
      }],
    })
    
    // 폼에 기존 의견 데이터 로드
    if (submittedOpinion) {
      if (submittedOpinion.templateType === "FreeText") {
        setUseTemplate(false)
        setFreeText(submittedOpinion.fields?.[0]?.value || "")
      } else {
        setUseTemplate(true)
        setTemplateType(submittedOpinion.templateType || "")
        setTemplateLabel(submittedOpinion.templateLabel || "")
        setFields(submittedOpinion.fields || [])
      }
      setDataBoxes(submittedOpinion.dataBoxes || [])
      setAttachments(submittedOpinion.attachments || [])
    }
    
    onSuccess()
  }

  const handleSubmit = () => {
    // 템플릿 사용 시 필드 검증, 자유 텍스트 시 내용 검증
    if (useTemplate) {
      const emptyRequired = fields.filter(f => !f.value.trim())
      if (emptyRequired.length > 0) {
        alert("모든 필드를 입력해주세요.")
        return
      }
    } else {
      if (!freeText.trim()) {
        alert("의견 내용을 입력해주세요.")
        return
      }
    }
    const ticket = getTicketById(ticketId)
    if (!ticket) return
    const opinion: EventOpinion = {
      id: `op-${Date.now()}`, author: currentUser, team: "공정기술팀",
      templateType: useTemplate ? templateType : "FreeText", 
      templateLabel: useTemplate ? templateLabel : "자유 의견", 
      fields: useTemplate ? fields : [{ label: "의견 내용", value: freeText }],
      dataBoxes: dataBoxes.length > 0 ? dataBoxes : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      status: "submitted", createdAt: new Date().toISOString(), submittedAt: new Date().toISOString(),
    }
    const opinions = [...(ticket.opinions || []), opinion]
    const messages = [...(ticket.messages || []), {
      id: `msg-${Date.now()}`, ticketId, author: currentUser, role: "assignee" as const,
      messageType: "opinion" as const, content: `[${templateLabel}] 의견이 제출되었습니다.`,
      timestamp: new Date().toISOString(),
    }]
    
    // 추가검토가 있고 미완료인 경우 -> 추가검토 단계 유지
    const additionalReviewers = ticket.additionalReviewers || []
    const hasIncompleteAdditionalReview = additionalReviewers.some(r => r.status !== "completed")
    const hasAdditionalReviewStep = ticket.processFlow?.some(s => s.step === "additional-review")
    
    let newProcessStatus: typeof ticket.processStatus
    let updatedFlow = ticket.processFlow || []
    
    if (hasIncompleteAdditionalReview && hasAdditionalReviewStep) {
      // 추가검토가 남아있으면 추가검토 단계로 이동
      newProcessStatus = "additional-review"
      updatedFlow = updatedFlow.map(s =>
        s.step === "review" ? { ...s, status: "completed" as const, timestamp: new Date().toLocaleString("ko-KR") } :
        s.step === "additional-review" ? { ...s, status: "current" as const } : s
      )
    } else {
      // 추가검토가 없거나 모두 완료되면 발행자 확인으로 이동
      newProcessStatus = "publisher-confirm"
      updatedFlow = updatedFlow.map(s =>
        s.step === "review" ? { ...s, status: "completed" as const, timestamp: new Date().toLocaleString("ko-KR") } :
        s.step === "additional-review" ? { ...s, status: "completed" as const, timestamp: new Date().toLocaleString("ko-KR") } :
        s.step === "publisher-confirm" ? { ...s, status: "current" as const, assignee: ticket.requester, team: "요청팀" } : s
      )
    }
    
    updateTicket(ticketId, { 
      opinions, 
      messages,
      processStatus: newProcessStatus,
      processFlow: updatedFlow,
    })
    onSuccess()
  }

  // 이미 의견이 제출된 경우 수정 버튼만 표시
  if (hasSubmittedOpinion && !templateType) {
    return (
      <Card className="p-6 bg-emerald-50/50 border-emerald-200">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          기술검토 의견 제출 완료
        </h3>
        <div className="space-y-3">
          <div className="p-3 bg-white rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1">제출된 의견 유형</p>
            <Badge variant="secondary" className="text-xs">{submittedOpinion?.templateLabel || "의견"}</Badge>
            <p className="text-xs text-muted-foreground mt-2">
              제출일시: {submittedOpinion?.submittedAt ? new Date(submittedOpinion.submittedAt).toLocaleString("ko-KR") : "-"}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5 bg-white text-amber-600 border-amber-200 hover:bg-amber-50" 
            onClick={handleEditOpinion}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            의견 수정하기
          </Button>
          <p className="text-xs text-muted-foreground">
            의견을 수정하면 프로세스가 기술검토 단계로 되돌아갑니다.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          의견 작성
          {useTemplate && <Badge variant="secondary" className="text-xs">{templateLabel}</Badge>}
        </h3>
        <div className="flex items-center gap-2">
          {!useTemplate ? (
            <Button variant="outline" size="sm" className="text-xs gap-1.5 bg-transparent" onClick={() => setShowTemplateDialog(true)}>
              <FileText className="h-3.5 w-3.5" />
              템플릿 사용
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="text-xs" onClick={handleClearTemplate}>
              <X className="h-3.5 w-3.5 mr-1" />
              템플릿 해제
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* 자유 텍스트 입력 (템플릿 미사용 시) */}
        {!useTemplate && (
          <div>
            <Textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="기술검토 의견을 자유롭게 작성해주세요..."
              className="min-h-[160px] text-sm"
            />
          </div>
        )}

        {/* 템플릿 필드 (템플릿 사용 시) */}
        {useTemplate && fields.map((field, idx) => (
          <div key={idx}>
            <Label className="text-xs font-medium">{field.label}</Label>
            <Textarea
              value={field.value}
              onChange={(e) => handleFieldChange(idx, e.target.value)}
              placeholder={`${field.label}을(를) 입력해주세요...`}
              className="mt-1.5 min-h-[80px] text-sm"
            />
          </div>
        ))}

        {dataBoxes.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">연동 데이터</p>
            {dataBoxes.map(box => (
              <div key={box.id} className="relative">
                <DataVisualization dataBox={box} />
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => setDataBoxes(dataBoxes.filter(b => b.id !== box.id))}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {attachments.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">첨부파일</p>
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                <span>{att.fileName}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setAttachments(attachments.filter((_, j) => j !== i))}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 bg-transparent" onClick={() => setShowDataBoxConfig(true)}>
            <PlusCircle className="h-3.5 w-3.5" />
            데이터 연동
          </Button>
          <label>
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 bg-transparent" asChild>
              <span>
                <FileUp className="h-3.5 w-3.5" />
                첨부파일
              </span>
            </Button>
            <input type="file" className="hidden" multiple onChange={handleFileUpload} />
          </label>
        </div>

        <Separator />

<div className="flex items-center justify-between">
          <Button variant="outline" size="sm" className="gap-1.5 bg-transparent" onClick={handleSaveDraft}>
            <Save className="h-3.5 w-3.5" />
            임시 저장
          </Button>
          {hasSubmittedOpinion ? (
            <Button size="sm" className="gap-1.5 bg-amber-600 hover:bg-amber-700" onClick={handleEditOpinion}>
              <RotateCcw className="h-3.5 w-3.5" />
              의견 수정
            </Button>
          ) : (
            <Button size="sm" className="gap-1.5" onClick={handleSubmit}>
              <Send className="h-3.5 w-3.5" />
              의견 제출
            </Button>
          )}
        </div>
      </div>

      {showDataBoxConfig && (
        <Dialog open={showDataBoxConfig} onOpenChange={setShowDataBoxConfig}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>데이터 연동 설정</DialogTitle>
              <DialogDescription>트렌드, DCS 화면, 표 등을 삽입할 수 있습니다.</DialogDescription>
            </DialogHeader>
            <DataInsertBoxConfig onConfirm={handleAddDataBox} onCancel={() => setShowDataBoxConfig(false)} defaultUnit={ticketUnit} />
          </DialogContent>
        </Dialog>
      )}
      <TemplateSelectorDialog open={showTemplateDialog} onSelect={handleSelectTemplate} onCancel={() => setShowTemplateDialog(false)} />
    </Card>
  )
}

// --- Additional Reviewer Assignment (다중 검토자 지원 + 의견 입력) ---
function AdditionalReviewerSection({ ticket, onAssign }: { ticket: Ticket; onAssign: () => void }) {
  const [showAssign, setShowAssign] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState("")
  const [selectedPerson, setSelectedPerson] = useState("")
  const [reviewerOpinions, setReviewerOpinions] = useState<Record<string, string>>({})
  const [showDataConfig, setShowDataConfig] = useState<string | null>(null)
  const [reviewerDataBoxes, setReviewerDataBoxes] = useState<Record<string, DataInsertBox[]>>({})

  const teamOptions = [
    { team: "장치기술팀", members: ["최영호", "한진수", "이재현"] },
    { team: "장치팀", members: ["한정민", "김기동", "박우진"] },
    { team: "생산조정팀", members: ["박성호", "이민석", "강진우"] },
    { team: "촉매기술팀", members: ["윤서연", "장민혁", "김태호"] },
    { team: "에너지관리팀", members: ["정태영", "이승환"] },
    { team: "DX팀", members: ["오진우", "임가은", "송현정"] },
  ]

  const currentReviewers = ticket.additionalReviewers || []
  
  // 검토 의견 제출 핸들러
  const handleSubmitReviewerOpinion = (reviewerId: string, reviewerName: string, reviewerTeam: string) => {
    const opinion = reviewerOpinions[reviewerId]
    if (!opinion?.trim()) {
      alert("검토 의견을 입력해주세요.")
      return
    }
    
    const updatedReviewers = currentReviewers.map(r =>
      r.id === reviewerId 
        ? { ...r, status: "completed" as const, opinion, completedAt: new Date().toISOString() }
        : r
    )
    
    // 모든 추가 검토자가 완료했는지 확인
    const allCompleted = updatedReviewers.every(r => r.status === "completed")
    
    // 프로세스 플로우 업데이트 (추가검토 완료 시 발행자 확인으로)
    let updatedFlow = ticket.processFlow || []
    let newProcessStatus = ticket.processStatus
    
    if (allCompleted) {
      updatedFlow = updatedFlow.map(s =>
        s.step === "additional-review" ? { ...s, status: "completed" as const, timestamp: new Date().toLocaleString("ko-KR") } :
        s.step === "publisher-confirm" ? { ...s, status: "current" as const, assignee: ticket.requester, team: "요청팀" } : s
      )
      newProcessStatus = "publisher-confirm"
    }
    
    // 의견 내용에 실제 텍스트 저장
    const opinionFields = [
      { key: "analysis", label: "검토 분석", value: opinion },
    ]
    const dataBoxes = reviewerDataBoxes[reviewerId] || []
    
    updateTicket(ticket.id, {
      additionalReviewers: updatedReviewers,
      processStatus: newProcessStatus,
      processFlow: updatedFlow,
      opinions: [...(ticket.opinions || []), {
        id: `op-${Date.now()}`,
        author: reviewerName,
        team: reviewerTeam,
        templateType: "additional-review",
        templateLabel: "추가검토 의견",
        fields: opinionFields,
        dataBoxes: dataBoxes.length > 0 ? dataBoxes : undefined,
        status: "submitted",
        createdAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
      }],
      messages: [...(ticket.messages || []), {
        id: `msg-${Date.now()}`, ticketId: ticket.id, author: reviewerName, role: "assignee" as const,
        messageType: "opinion" as const, content: `[추가검토 완료 - ${reviewerTeam}]\n\n${opinion}`,
        timestamp: new Date().toISOString(),
      }],
    })
    
    // Clear the input
    setReviewerOpinions(prev => ({ ...prev, [reviewerId]: "" }))
    setReviewerDataBoxes(prev => ({ ...prev, [reviewerId]: [] }))
    onAssign()
  }
  
  const handleAddDataBox = (reviewerId: string, box: DataInsertBox) => {
    setReviewerDataBoxes(prev => ({
      ...prev,
      [reviewerId]: [...(prev[reviewerId] || []), box]
    }))
    setShowDataConfig(null)
  }

  const handleAssign = () => {
    if (!selectedTeam || !selectedPerson) return
    // Check if already assigned
    if (currentReviewers.some(r => r.name === selectedPerson && r.team === selectedTeam)) {
      alert("이미 배정된 검토자입니다.")
      return
    }
    const newReviewer = {
      id: `rev-${Date.now()}`,
      name: selectedPerson,
      team: selectedTeam,
      status: "pending" as const,
      assignedAt: new Date().toISOString(),
    }
    
    // 추가검토 단계가 없으면 processFlow에 추가
    const hasAdditionalReviewStep = ticket.processFlow?.some(s => s.step === "additional-review")
    let updatedFlow = ticket.processFlow || []
    
    if (!hasAdditionalReviewStep) {
      // review 단계 다음에 additional-review 단계 삽입
      const reviewIndex = updatedFlow.findIndex(s => s.step === "review")
      if (reviewIndex !== -1) {
        updatedFlow = [
          ...updatedFlow.slice(0, reviewIndex + 1),
          { step: "additional-review" as const, label: "추가검토", status: "upcoming" as const },
          ...updatedFlow.slice(reviewIndex + 1),
        ]
      }
    }
    
    // 의견 제출 여부 확인 - 의견이 없으면 기술검토도 current 유지
    const hasSubmittedOpinion = (ticket.opinions || []).some(op => op.status === "submitted")
    
    // 상태 업데이트: 의견 미제출 시 기술검토는 current 유지, 추가검토는 upcoming
    updatedFlow = updatedFlow.map(s => {
      if (s.step === "review") {
        return hasSubmittedOpinion 
          ? { ...s, status: "completed" as const, timestamp: new Date().toLocaleString("ko-KR") }
          : { ...s, status: "current" as const } // 의견 미제출 시 current 유지
      }
      if (s.step === "additional-review") {
        return hasSubmittedOpinion
          ? { ...s, status: "current" as const, assignee: selectedPerson, team: selectedTeam }
          : { ...s, status: "upcoming" as const, assignee: selectedPerson, team: selectedTeam } // 의견 미제출 시 upcoming
      }
      return s
    })
    
    updateTicket(ticket.id, {
      additionalReviewers: [...currentReviewers, newReviewer],
      processStatus: hasSubmittedOpinion ? "additional-review" : "review", // 의견 미제출 시 review 유지
      processFlow: updatedFlow,
      messages: [...(ticket.messages || []), {
        id: `msg-${Date.now()}`, ticketId: ticket.id, author: "System", role: "system" as const,
        messageType: "wp_assignment" as const, content: `${selectedPerson}님(${selectedTeam})에게 추가 검토가 요청되었습니다.`,
        timestamp: new Date().toISOString(),
      }],
    })
    setShowAssign(false)
    setSelectedTeam("")
    setSelectedPerson("")
    onAssign()
  }

  return (
    <Card className="p-4">
      {/* 기존 배정된 검토자 목록 + 의견 입력 */}
      {currentReviewers.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-orange-600" />
            <p className="text-sm font-medium text-orange-800">추가 검토 배정 ({currentReviewers.length}명)</p>
            <span className="text-xs text-muted-foreground ml-auto">
              {currentReviewers.filter(r => r.status === "completed").length}/{currentReviewers.length} 완료
            </span>
          </div>
          <div className="space-y-3">
            {currentReviewers.map((reviewer) => (
              <div key={reviewer.id} className={cn(
                "rounded-lg border overflow-hidden",
                reviewer.status === "completed" ? "bg-emerald-50/30 border-emerald-200" :
                "bg-orange-50/30 border-orange-200"
              )}>
                {/* 검토자 정보 헤더 */}
                <div className="flex items-center gap-3 p-3 border-b border-inherit bg-inherit">
                  <Badge variant="outline" className="text-xs">{reviewer.team}</Badge>
                  <span className="text-sm font-medium text-foreground">{reviewer.name}</span>
                  <Badge variant="secondary" className={`text-xs ml-auto ${
                    reviewer.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                    reviewer.status === "in-progress" ? "bg-amber-100 text-amber-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {reviewer.status === "completed" ? "검토 완료" :
                     reviewer.status === "in-progress" ? "검토 중" : "배정됨"}
                  </Badge>
                </div>
                
                {/* 완료된 검토자: 제출된 의견 표시 */}
                {reviewer.status === "completed" && reviewer.opinion && (
                  <div className="p-3 bg-white/50">
                    <p className="text-xs text-muted-foreground mb-1">제출된 검토 의견</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{reviewer.opinion}</p>
                  </div>
                )}
                
                {/* 미완료 검토자: 의견 입력 필드 (모든 배정된 검토자) */}
                {reviewer.status !== "completed" && (
                  <div className="p-3 space-y-3 bg-white/50">
                    <div>
                      <Label className="text-xs font-medium text-foreground mb-1.5 block">
                        {reviewer.name}님 검토 의견 작성
                      </Label>
                      <Textarea
                        value={reviewerOpinions[reviewer.id] || ""}
                        onChange={(e) => setReviewerOpinions(prev => ({ ...prev, [reviewer.id]: e.target.value }))}
                        placeholder="기술 검토 의견을 작성해주세요. 분석 결과, 권장 사항, 참고 사항 등을 포함할 수 있습니다..."
                        className="min-h-[100px] text-sm"
                      />
                    </div>
                    
                    {/* 데이터 매핑 영역 */}
                    {(reviewerDataBoxes[reviewer.id] || []).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">첨부된 데이터</p>
                        {(reviewerDataBoxes[reviewer.id] || []).map((box, idx) => (
                          <div key={box.id || idx} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-xs">
                            {box.type === "trend" && <Activity className="h-3.5 w-3.5 text-blue-600" />}
                            {box.type === "dcs" && <Monitor className="h-3.5 w-3.5 text-emerald-600" />}
                            {box.type === "table" && <TableIcon className="h-3.5 w-3.5 text-purple-600" />}
                            <span>{box.config.title || `${box.type} 데이터`}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 ml-auto text-muted-foreground hover:text-red-600"
                              onClick={() => setReviewerDataBoxes(prev => ({
                                ...prev,
                                [reviewer.id]: (prev[reviewer.id] || []).filter((_, i) => i !== idx)
                              }))}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5 h-8"
                        onClick={() => setShowDataConfig(reviewer.id)}
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        데이터 추가
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs gap-1.5 h-8 bg-orange-600 hover:bg-orange-700"
                        onClick={() => handleSubmitReviewerOpinion(reviewer.id, reviewer.name, reviewer.team)}
                        disabled={!reviewerOpinions[reviewer.id]?.trim()}
                      >
                        <Send className="h-3.5 w-3.5" />
                        의견 제출
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 데이터 추가 다이얼로그 */}
      {showDataConfig && (
        <Dialog open={!!showDataConfig} onOpenChange={(open) => !open && setShowDataConfig(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>데이터 연동 설정</DialogTitle>
              <DialogDescription>검토 의견에 트렌드, DCS 화면, 표 등을 첨부할 수 있습니다.</DialogDescription>
            </DialogHeader>
            <DataInsertBoxConfig 
              onConfirm={(box) => handleAddDataBox(showDataConfig, box)} 
              onCancel={() => setShowDataConfig(null)} 
              defaultUnit={ticket.unit} 
            />
          </DialogContent>
        </Dialog>
      )}

      {/* 추가 검토자 배정 버튼 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {currentReviewers.length > 0 ? "추가 검토자를 더 배정할 수 있습니다" : "타 팀 추가 검토가 필요한 경우"}
          </p>
        </div>
        <Button variant="outline" size="sm" className="text-xs gap-1.5 bg-transparent" onClick={() => setShowAssign(true)}>
          <UserPlus className="h-3.5 w-3.5" />
          추가 검토자 지정
        </Button>
      </div>

      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>추가 검토자 지정</DialogTitle>
            <DialogDescription>추가 기술검토가 필요한 팀과 담당자를 선택하세요. 여러 명을 배정할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs">팀 선택</Label>
              <Select value={selectedTeam} onValueChange={(v) => { setSelectedTeam(v); setSelectedPerson("") }}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="팀을 선택하세요" /></SelectTrigger>
                <SelectContent>
                  {teamOptions.map(t => <SelectItem key={t.team} value={t.team}>{t.team}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedTeam && (
              <div>
                <Label className="text-xs">담당자 선택</Label>
                <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="담당자를 선택하세요" /></SelectTrigger>
                  <SelectContent>
                    {teamOptions.find(t => t.team === selectedTeam)?.members.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAssign(false)}>취소</Button>
              <Button onClick={handleAssign} disabled={!selectedTeam || !selectedPerson}>배정</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// --- Additional Reviewer Opinion Section (추가검토자 의견 작성) ---
function AdditionalReviewerOpinionSection({ ticket, onSuccess }: { ticket: Ticket; onSuccess: () => void }) {
  const [opinion, setOpinion] = useState("")
  
  // 현재 사용자가 추가 검토자인지 확인
  const currentReviewer = ticket.additionalReviewers?.find(r => 
    r.name === CURRENT_USER && (r.status === "pending" || r.status === "in-progress")
  )
  
  if (!currentReviewer) return null
  
  const handleSubmitOpinion = () => {
    if (!opinion.trim()) {
      alert("의견을 입력해주세요.")
      return
    }
    
    const updatedReviewers = (ticket.additionalReviewers || []).map(r =>
      r.id === currentReviewer.id 
        ? { ...r, status: "completed" as const, opinion, completedAt: new Date().toISOString() }
        : r
    )
    
    // 모든 추가 검토자가 완료했는지 확인
    const allCompleted = updatedReviewers.every(r => r.status === "completed")
    
    // 프로세스 플로우 업데이트 (추가검토 완료 시 발행자 확인으로)
    let updatedFlow = ticket.processFlow || []
    let newProcessStatus = ticket.processStatus
    
    if (allCompleted) {
      updatedFlow = updatedFlow.map(s =>
        s.step === "additional-review" ? { ...s, status: "completed" as const, timestamp: new Date().toLocaleString("ko-KR") } :
        s.step === "publisher-confirm" ? { ...s, status: "current" as const, assignee: ticket.requester, team: "요청팀" } : s
      )
      newProcessStatus = "publisher-confirm"
    }
    
    updateTicket(ticket.id, {
      additionalReviewers: updatedReviewers,
      processStatus: newProcessStatus,
      processFlow: updatedFlow,
      messages: [...(ticket.messages || []), {
        id: `msg-${Date.now()}`, ticketId: ticket.id, author: CURRENT_USER, role: "assignee" as const,
        messageType: "opinion" as const, content: `[추가검토 완료 - ${currentReviewer.team}]\n\n${opinion}`,
        timestamp: new Date().toISOString(),
      }],
    })
    
    setOpinion("")
    onSuccess()
  }
  
  return (
    <Card className="p-4 bg-orange-50 border-orange-200">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-orange-600" />
        <h3 className="text-sm font-semibold text-orange-800">추가검토 배정됨</h3>
        <Badge variant="outline" className="text-xs">{currentReviewer.team}</Badge>
      </div>
      <p className="text-xs text-orange-600 mb-3">
        {currentReviewer.name}님에게 추가 검토가 요청되었습니다. 의견을 작성해주세요.
      </p>
      <Textarea
        value={opinion}
        onChange={(e) => setOpinion(e.target.value)}
        placeholder="추가 검토 의견을 입력해주세요..."
        className="min-h-[100px] text-sm mb-3 bg-white"
      />
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5 bg-orange-600 hover:bg-orange-700" onClick={handleSubmitOpinion}>
          <Send className="h-3.5 w-3.5" />
          의견 제출
        </Button>
      </div>
    </Card>
  )
}

// --- Comments Section ---
function CommentsSection({ ticket, onUpdate }: { ticket: Ticket; onUpdate: () => void }) {
  const [newComment, setNewComment] = useState("")

  const handleAddComment = () => {
    if (!newComment.trim()) return
    const comments = [...(ticket.comments || []), {
      id: `cmt-${Date.now()}`, author: CURRENT_USER, content: newComment, timestamp: new Date().toISOString(),
    }]
    updateTicket(ticket.id, { comments })
    setNewComment("")
    onUpdate()
  }

  return (
    <div className="space-y-4">
      {(ticket.comments || []).map(c => (
        <div key={c.id} className="flex gap-3">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <User className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-medium text-foreground">{c.author}</span>
              <span className="text-[10px] text-muted-foreground">{new Date(c.timestamp).toLocaleString("ko-KR")}</span>
            </div>
            <p className="text-sm text-foreground bg-muted/30 rounded-lg px-3 py-2">{c.content}</p>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 입력하세요..."
          className="min-h-[60px] text-sm"
        />
        <Button size="sm" className="shrink-0 self-end" onClick={handleAddComment} disabled={!newComment.trim()}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// --- Thread History with popup detail ---
function ThreadHistory({ ticket }: { ticket: Ticket }) {
  const [selectedMessage, setSelectedMessage] = useState<typeof ticket.messages[0] | null>(null)
  const messages = [...(ticket.messages || [])].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const getIcon = (type: string, role: string) => {
    if (role === "system") return <AlertCircle className="h-3.5 w-3.5" />
    if (type === "opinion") return <CheckCircle className="h-3.5 w-3.5" />
    if (type === "inquiry") return <MessageSquare className="h-3.5 w-3.5" />
    if (type === "wp_assignment") return <Users className="h-3.5 w-3.5" />
    return <User className="h-3.5 w-3.5" />
  }

  const getBg = (role: string) => {
    if (role === "requester") return "bg-blue-50 border-blue-100"
    if (role === "assignee") return "bg-emerald-50 border-emerald-100"
    return "bg-muted/50 border-border"
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = { opinion: "의견", inquiry: "추가 문의", response: "답변", status_change: "상태 변경", wp_assignment: "배정" }
    return labels[type] || type
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = { requester: "요���자", assignee: "담당자", system: "시스템" }
    return labels[role] || role
  }
  
  // 메시지 내용에서 실제 의견 찾기 (opinions 배열에서)
  const getDetailedContent = (msg: typeof ticket.messages[0]) => {
    // 의견 메시지인 경우 opinions 배열에서 상세 내용 찾기
    if (msg.messageType === "opinion" && msg.role === "assignee") {
      // 해당 시간대에 제출된 의견 찾기
      const matchingOpinion = (ticket.opinions || []).find(op => {
        const opTime = op.submittedAt ? new Date(op.submittedAt).getTime() : 0
        const msgTime = new Date(msg.timestamp).getTime()
        // 30초 이내에 제출된 의견 매칭
        return Math.abs(opTime - msgTime) < 30000 && op.author === msg.author
      })
      
      if (matchingOpinion && matchingOpinion.fields.length > 0) {
        // 제출된 의견의 실제 내용 반환
        return matchingOpinion.fields.map(f => `[${f.label}]\n${f.value}`).join('\n\n')
      }
    }
    
    // 기본 메시지 내용 반환
    return msg.content
  }

  return (
    <>
      <div className="space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">아직 히스토리가 없습니다</p>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={msg.id} 
              className="flex gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setSelectedMessage(msg)}
            >
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {getIcon(msg.messageType, msg.role)}
                </div>
                {idx < messages.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
              </div>
              <div className={`flex-1 p-3 rounded-lg border ${getBg(msg.role)} mb-1`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-foreground">{msg.author}</span>
                  <Badge variant="outline" className="text-[10px]">{getTypeLabel(msg.messageType)}</Badge>
                  <span className="text-[10px] text-muted-foreground ml-auto">{new Date(msg.timestamp).toLocaleString("ko-KR")}</span>
                </div>
                <p className="text-sm text-foreground line-clamp-2">{msg.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Thread Detail Popup */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMessage && getIcon(selectedMessage.messageType, selectedMessage.role)}
              히스토리 상세
            </DialogTitle>
            <DialogDescription>
              {selectedMessage && new Date(selectedMessage.timestamp).toLocaleString("ko-KR")}
            </DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">작성자</Label>
                  <p className="text-sm font-medium">{selectedMessage.author}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">역할</Label>
                  <p className="text-sm">{getRoleLabel(selectedMessage.role)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">유형</Label>
                  <Badge variant="secondary" className="text-xs">{getTypeLabel(selectedMessage.messageType)}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">시간</Label>
                  <p className="text-sm">{new Date(selectedMessage.timestamp).toLocaleString("ko-KR")}</p>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">내용</Label>
                <div className="bg-muted/30 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{getDetailedContent(selectedMessage)}</p>
                </div>
              </div>
              
              {/* 관련 데이터 박스가 있으면 표시 */}
              {selectedMessage.messageType === "opinion" && selectedMessage.role === "assignee" && (() => {
                const matchingOpinion = (ticket.opinions || []).find(op => {
                  const opTime = op.submittedAt ? new Date(op.submittedAt).getTime() : 0
                  const msgTime = new Date(selectedMessage.timestamp).getTime()
                  return Math.abs(opTime - msgTime) < 30000 && op.author === selectedMessage.author
                })
                
                if (matchingOpinion?.dataBoxes && matchingOpinion.dataBoxes.length > 0) {
                  return (
                    <div className="mt-3 pt-3 border-t">
                      <Label className="text-xs text-muted-foreground mb-2 block">첨부 데이터 ({matchingOpinion.dataBoxes.length}개)</Label>
                      <div className="space-y-3">
                        {matchingOpinion.dataBoxes.map((box, i) => (
                          <Card key={i} className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                              {box.type === "trend" && <Activity className="h-4 w-4 text-blue-600" />}
                              {box.type === "dcs" && <Monitor className="h-4 w-4 text-emerald-600" />}
                              {box.type === "table" && <TableIcon className="h-4 w-4 text-purple-600" />}
                              <span className="text-sm font-medium">
                                {box.type === "trend" ? "트렌드" : box.type === "dcs" ? "DCS 화면" : "데이터 표"}
                              </span>
                              {box.config.title && (
                                <span className="text-xs text-muted-foreground">- {box.config.title}</span>
                              )}
                            </div>
                            
                            {/* Trend details */}
                            {box.type === "trend" && (
                              <div className="space-y-2">
                                {box.config.tags && box.config.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {box.config.tags.map(tag => (
                                      <Badge key={tag} variant="outline" className="text-xs font-mono">{tag}</Badge>
                                    ))}
                                  </div>
                                )}
                                {box.config.fromDate && box.config.toDate && (
                                  <p className="text-xs text-muted-foreground">
                                    기간: {new Date(box.config.fromDate).toLocaleDateString("ko-KR")} ~ {new Date(box.config.toDate).toLocaleDateString("ko-KR")}
                                  </p>
                                )}
                                <div className="h-24 bg-gradient-to-r from-blue-50 to-cyan-50 rounded flex items-center justify-center text-xs text-muted-foreground border border-dashed border-blue-200">
                                  <Activity className="h-4 w-4 text-blue-400 mr-1.5" />
                                  ���렌드 그래프 영역
                                </div>
                              </div>
                            )}
                            
                            {/* DCS details */}
                            {box.type === "dcs" && (
                              <div className="space-y-2">
                                {box.config.graphicNumber && (
                                  <p className="text-xs"><span className="text-muted-foreground">Graphic #:</span> {box.config.graphicNumber}</p>
                                )}
                                {box.config.graphicType && (
                                  <p className="text-xs"><span className="text-muted-foreground">유형:</span> {box.config.graphicType}</p>
                                )}
                                <div className="h-24 bg-gradient-to-r from-slate-50 to-gray-100 rounded flex items-center justify-center text-xs text-muted-foreground border border-dashed border-slate-300">
                                  <Monitor className="h-4 w-4 text-slate-400 mr-1.5" />
                                  DCS 화면 캡처 영역
                                </div>
                              </div>
                            )}
                            
                            {/* Table details */}
                            {box.type === "table" && box.config.tableData && (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                  <tbody>
                                    {box.config.tableData.map((row, rIdx) => (
                                      <tr key={rIdx} className={rIdx === 0 ? "bg-muted/50 font-medium" : ""}>
                                        {row.map((cell, cIdx) => (
                                          <td key={cIdx} className="border border-border px-2 py-1">{cell}</td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  )
                }
                return null
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// --- Submitted Opinions View ---
function SubmittedOpinionsView({ opinions }: { opinions?: EventOpinion[] }) {
  const submitted = (opinions || []).filter(o => o.status === "submitted")
  if (submitted.length === 0) return null

  return (
    <div className="space-y-3">
      {submitted.map(op => (
        <Card key={op.id} className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="text-xs">{op.templateLabel}</Badge>
            <span className="text-xs text-muted-foreground">{op.author} ({op.team})</span>
            <span className="text-[10px] text-muted-foreground ml-auto">{op.submittedAt && new Date(op.submittedAt).toLocaleString("ko-KR")}</span>
          </div>
          <div className="space-y-2">
            {op.fields.map((f, i) => (
              <div key={i}>
                <p className="text-[10px] font-medium text-muted-foreground mb-0.5">{f.label}</p>
                <p className="text-sm text-foreground bg-muted/30 rounded px-3 py-2 whitespace-pre-wrap">{f.value}</p>
              </div>
            ))}
          </div>
          {op.dataBoxes && op.dataBoxes.length > 0 && (
            <div className="mt-3 space-y-2">
              {op.dataBoxes.map(box => <DataVisualization key={box.id} dataBox={box} />)}
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

// --- Team Opinions Summary (타 팀 의견 종합) ---
function TeamOpinionsSummary({ ticket }: { ticket: Ticket }) {
  const reviewers = ticket.additionalReviewers || []
  
  if (reviewers.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        추가 검토자가 배정되지 않았습니다.
      </div>
    )
  }

  const completedReviewers = reviewers.filter(r => r.status === "completed")
  const pendingReviewers = reviewers.filter(r => r.status !== "completed")

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">총 {reviewers.length}명 배정</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <span className="text-sm text-emerald-600">{completedReviewers.length}명 완료</span>
        </div>
        {pendingReviewers.length > 0 && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-amber-600">{pendingReviewers.length}명 대기</span>
          </div>
        )}
      </div>

      {/* Completed opinions */}
      {completedReviewers.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">검토 완료 의견</h4>
          {completedReviewers.map((reviewer) => (
            <Card key={reviewer.id} className="p-4 bg-emerald-50/30 border-emerald-100">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs bg-white">{reviewer.team}</Badge>
                <span className="text-sm font-medium text-foreground">{reviewer.name}</span>
                <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 ml-auto">완료</Badge>
              </div>
              {reviewer.opinion ? (
                <div className="bg-white rounded-lg p-3 border border-emerald-100">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{reviewer.opinion}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">의견 내용이 없습니다.</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                <span>배정일: {new Date(reviewer.assignedAt).toLocaleDateString("ko-KR")}</span>
                {reviewer.completedAt && <span>완료일: {new Date(reviewer.completedAt).toLocaleDateString("ko-KR")}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pending reviewers */}
      {pendingReviewers.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">검토 대기</h4>
          {pendingReviewers.map((reviewer) => (
            <Card key={reviewer.id} className="p-4 border-dashed">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{reviewer.team}</Badge>
                <span className="text-sm text-muted-foreground">{reviewer.name}</span>
                <Badge variant="secondary" className={`text-xs ml-auto ${
                  reviewer.status === "in-progress" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                }`}>
                  {reviewer.status === "in-progress" ? "검토 중" : "대기 중"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                배정���: {new Date(reviewer.assignedAt).toLocaleDateString("ko-KR")}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Event Group View (이벤트 그룹보기) ---
function EventGroupView({ ticket }: { ticket: Ticket }) {
  const [viewMode, setViewMode] = useState<"team" | "category">("team")
  const reviewers = ticket.additionalReviewers || []
  
  if (reviewers.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        추가 검토���가 배정되지 않았습니다.
      </div>
    )
  }

  // 팀별 그룹화
  const groupByTeam = () => {
    const grouped: Record<string, typeof reviewers> = {}
    reviewers.forEach(r => {
      if (!grouped[r.team]) grouped[r.team] = []
      grouped[r.team].push(r)
    })
    return grouped
  }

  // 상태별 그룹화
  const groupByStatus = () => {
    const grouped = {
      completed: reviewers.filter(r => r.status === "completed"),
      "in-progress": reviewers.filter(r => r.status === "in-progress"),
      pending: reviewers.filter(r => r.status === "pending"),
    }
    return grouped
  }

  const teamGroups = groupByTeam()
  const statusGroups = groupByStatus()

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === "team" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("team")}
          className="text-xs gap-1.5"
        >
          <Users className="h-3.5 w-3.5" />
          팀별 보기
        </Button>
        <Button
          variant={viewMode === "category" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("category")}
          className="text-xs gap-1.5"
        >
          <Boxes className="h-3.5 w-3.5" />
          상태별 보기
        </Button>
      </div>

      {/* Team View */}
      {viewMode === "team" && (
        <div className="space-y-4">
          {Object.entries(teamGroups).map(([team, members]) => (
            <Card key={team} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs font-medium">{team}</Badge>
                <span className="text-xs text-muted-foreground">
                  {members.filter(m => m.status === "completed").length}/{members.length} 완료
                </span>
              </div>
              <div className="space-y-2">
                {members.map(member => (
                  <div key={member.id} className={cn(
                    "p-3 rounded-lg border",
                    member.status === "completed" ? "bg-emerald-50/50 border-emerald-100" :
                    member.status === "in-progress" ? "bg-amber-50/50 border-amber-100" :
                    "bg-muted/30 border-border"
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{member.name}</span>
                      <Badge variant="secondary" className={`text-xs ml-auto ${
                        member.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                        member.status === "in-progress" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {member.status === "completed" ? "���료" :
                         member.status === "in-progress" ? "검토 중" : "대기"}
                      </Badge>
                    </div>
                    {member.opinion && (
                      <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">{member.opinion}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Category/Status View */}
      {viewMode === "category" && (
        <div className="space-y-4">
          {statusGroups.completed.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" />
                검토 완료 ({statusGroups.completed.length})
              </h4>
              <div className="space-y-2">
                {statusGroups.completed.map(r => (
                  <Card key={r.id} className="p-3 bg-emerald-50/30 border-emerald-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{r.team}</Badge>
                      <span className="text-sm font-medium">{r.name}</span>
                    </div>
                    {r.opinion && <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{r.opinion}</p>}
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {statusGroups["in-progress"].length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                검토 중 ({statusGroups["in-progress"].length})
              </h4>
              <div className="space-y-2">
                {statusGroups["in-progress"].map(r => (
                  <Card key={r.id} className="p-3 bg-amber-50/30 border-amber-100">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{r.team}</Badge>
                      <span className="text-sm">{r.name}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {statusGroups.pending.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                대기 중 ({statusGroups.pending.length})
              </h4>
              <div className="space-y-2">
                {statusGroups.pending.map(r => (
                  <Card key={r.id} className="p-3 border-dashed">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{r.team}</Badge>
                      <span className="text-sm text-muted-foreground">{r.name}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Team leaders for escalation
const TEAM_LEADERS = [
  { id: "leader-1", name: "박영희", team: "공정기술팀", role: "팀장" },
  { id: "leader-2", name: "정수민", team: "장치기술팀", role: "팀장" },
  { id: "leader-3", name: "강동원", team: "운전팀", role: "팀장" },
  { id: "leader-4", name: "김현수", team: "안전환경팀", role: "팀��" },
  { id: "leader-5", name: "유재석", team: "DX팀", role: "팀장" },
  { id: "leader-6", name: "이상훈", team: "Hydroprocessing기술팀", role: "팀장" },
]

// === Main Component ===
export function TicketDetail({ ticket: initialTicket }: TicketDetailProps) {
  const [ticket, setTicket] = useState(initialTicket)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [showClosureReport, setShowClosureReport] = useState(false)
  const [showAcceptDialog, setShowAcceptDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  
  // Escalation state
  const [showEscalationDialog, setShowEscalationDialog] = useState(false)
  const [escalationTarget, setEscalationTarget] = useState("")
  const [escalationReason, setEscalationReason] = useState("")
  
  // Access settings state
  const [showAccessDialog, setShowAccessDialog] = useState(false)
  
  const router = useRouter()

  const refreshTicket = () => {
    const updated = getTicketById(ticket.id)
    if (updated) setTicket(updated)
  }

  useEffect(() => {
    if (ticket.hasUnreadNotification) {
      markNotificationAsRead(ticket.id)
      refreshTicket()
    }
    const handleFocus = () => refreshTicket()
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [ticket.id])

  // Accept event
  const handleAccept = () => {
    const flow = (ticket.processFlow || []).map(s =>
      s.step === "issued" ? { ...s, status: "completed" as const } :
      s.step === "accepted" ? { ...s, status: "completed" as const, assignee: CURRENT_USER, team: "공정기술팀", timestamp: new Date().toLocaleString("ko-KR") } :
      s.step === "review" ? { ...s, status: "current" as const, assignee: CURRENT_USER, team: "공정기술팀" } : s
    )
    updateTicket(ticket.id, {
      processStatus: "review",
      status: "In Progress",
      processFlow: flow,
      messages: [...(ticket.messages || []), {
        id: `msg-${Date.now()}`, ticketId: ticket.id, author: "System", role: "system" as const,
        messageType: "status_change" as const, content: `${CURRENT_USER}님이 이벤트를 접수하였습니다.`,
        timestamp: new Date().toISOString(),
      }],
    })
    setShowAcceptDialog(false)
    refreshTicket()
  }

  // Reject event
  const handleReject = () => {
    const flow: EventProcessStep[] = [
      { step: "issued", label: "이벤트 발행", status: "completed", assignee: ticket.requester, timestamp: ticket.createdDate },
      { step: "rejected", label: "반려", status: "completed", assignee: CURRENT_USER, team: "공정기술팀", timestamp: new Date().toLocaleString("ko-KR") },
    ]
    updateTicket(ticket.id, {
      processStatus: "rejected",
      status: "Closed",
      processFlow: flow,
      messages: [...(ticket.messages || []), {
        id: `msg-${Date.now()}`, ticketId: ticket.id, author: CURRENT_USER, role: "assignee" as const,
        messageType: "opinion" as const, content: rejectReason || "접수 단계에서 반려 처리되었습니다.",
        timestamp: new Date().toISOString(),
      }, {
        id: `msg-${Date.now() + 1}`, ticketId: ticket.id, author: "System", role: "system" as const,
        messageType: "status_change" as const, content: `이벤트가 반려 처리되었습니다. 사유: ${rejectReason || "별도 조치 불필요"}`,
        timestamp: new Date().toISOString(),
      }],
    })
    setShowRejectDialog(false)
    setRejectReason("")
    refreshTicket()
  }

  // Close event
  const handleClose = () => {
    const check = requiresClosureReport({
      type: "ticket", ticketType: ticket.ticketType, priority: ticket.priority,
      impact: ticket.impact, workPackageCount: ticket.workPackages.length,
    })
    setShowCloseDialog(false)
    if (check.required) {
      setShowClosureReport(true)
    } else {
      closeTicket(ticket.id)
      refreshTicket()
    }
  }

  const handleClosureReportSubmit = (report: ClosureReport) => {
    closeTicket(ticket.id)
    
    // 프로세스 플로우 업데이트: closed 완료 처리
    const updatedFlow = (ticket.processFlow || []).map(s =>
      s.step === "closed" ? { ...s, status: "completed" as const, timestamp: new Date().toLocaleString("ko-KR") } :
      { ...s, status: "completed" as const }
    )
    
    updateTicket(ticket.id, { 
      processStatus: "closed",
      status: "Closed",
      closedDate: new Date().toISOString().split("T")[0],
      processFlow: updatedFlow,
      closureReport: {
        id: report.id,
        title: report.title,
        summary: report.summary,
        background: report.background,
        actions: report.actions,
        results: report.results,
        lessons: report.lessons,
        recommendations: report.recommendations,
        teamOpinions: report.teamOpinions,
        createdDate: report.createdDate,
        author: report.author,
      },
      executiveSummary: report.summary, // 이전 호환성을 위해 유지
      messages: [...(ticket.messages || []), {
        id: `msg-${Date.now()}`, ticketId: ticket.id, author: "System", role: "system" as const,
        messageType: "status_change" as const, content: `${ticket.owner}님이 AI 기반 종료 레포트를 작성하고 이벤트를 최종 종결했습니다.`,
        timestamp: new Date().toISOString(),
      }],
    })
    refreshTicket()
    setShowClosureReport(false)
    alert("종료 Report가 조직장에게 결재 요청되었습니다.")
  }

  // Escalation handler
  const handleEscalation = () => {
    if (!escalationTarget || !escalationReason.trim()) return
    const targetLeader = TEAM_LEADERS.find(l => l.id === escalationTarget)
    if (!targetLeader) return
    
    updateTicket(ticket.id, {
      escalation: {
        escalatedTo: targetLeader.name,
        escalatedBy: CURRENT_USER,
        escalatedAt: new Date().toISOString(),
        reason: escalationReason,
        status: "pending",
      },
      // Also add to allowed users if not already
      allowedUsers: [...(ticket.allowedUsers || []), targetLeader.name].filter((v, i, a) => a.indexOf(v) === i),
      messages: [...(ticket.messages || []), {
        id: `msg-${Date.now()}`, ticketId: ticket.id, author: "System", role: "system" as const,
        messageType: "status_change" as const, 
        content: `${CURRENT_USER}님이 ${targetLeader.name} ${targetLeader.role}(${targetLeader.team})에게 에스컬레이션을 요청했습니다. 사유: ${escalationReason}`,
        timestamp: new Date().toISOString(),
      }],
    })
    setShowEscalationDialog(false)
    setEscalationTarget("")
    setEscalationReason("")
    refreshTicket()
    alert(`${targetLeader.name} ${targetLeader.role}에게 에스컬레이션 요청이 전송되었습니다.`)
  }

  // Acknowledge escalation (팀장이 확인)
  const handleAcknowledgeEscalation = () => {
    if (!ticket.escalation) return
    updateTicket(ticket.id, {
      escalation: {
        ...ticket.escalation,
        status: "acknowledged",
        acknowledgedAt: new Date().toISOString(),
      },
      messages: [...(ticket.messages || []), {
        id: `msg-${Date.now()}`, ticketId: ticket.id, author: "System", role: "system" as const,
        messageType: "status_change" as const,
        content: `${ticket.escalation.escalatedTo}님이 에스컬레이션을 확인하고 검토를 시작했습니다.`,
        timestamp: new Date().toISOString(),
      }],
    })
    refreshTicket()
  }

  const isPending = ticket.processStatus === "issued"
  const isActive = ticket.processStatus === "review" || ticket.processStatus === "additional-review" || ticket.processStatus === "accepted"
  
  // 추가검토가 진행중인지 확인 (processStatus와 별개로)
  const hasIncompleteAdditionalReviews = (ticket.additionalReviewers || []).some(r => r.status !== "completed")
  
  // 발행자 확인 단계: 추가검토가 있는 경우 모두 완료되어야 표시
  const additionalReviewers = ticket.additionalReviewers || []
  const hasAdditionalReview = additionalReviewers.length > 0
  const allAdditionalReviewsCompleted = additionalReviewers.every(r => r.status === "completed")
  const isPublisherConfirm = ticket.processStatus === "publisher-confirm" && (!hasAdditionalReview || allAdditionalReviewsCompleted)
  
  // 검토완료 단계: 담당자가 AI 레포트 작성 후 최종 종결
  const isReviewComplete = ticket.processStatus === "review-complete"
  
  const isClosed = ticket.processStatus === "closed" || ticket.processStatus === "rejected"
  
  // 재문의 상태
  const [showReinquiryDialog, setShowReinquiryDialog] = useState(false)
  const [reinquiryTarget, setReinquiryTarget] = useState("")
  const [reinquiryContent, setReinquiryContent] = useState("")
  
  // 재문의 처리 핸들러
  const handleReinquiry = () => {
    if (!reinquiryTarget || !reinquiryContent.trim()) return
    
    const targetProcess = reinquiryTarget === "review" ? "기술검토" : "추가검토"
    const updatedFlow = (ticket.processFlow || []).map(s =>
      s.step === "publisher-confirm" ? { ...s, status: "completed" as const, timestamp: new Date().toLocaleString("ko-KR") } :
      s.step === reinquiryTarget ? { ...s, status: "current" as const } : s
    )
    
    updateTicket(ticket.id, {
      processStatus: reinquiryTarget as "review" | "additional-review",
      processFlow: updatedFlow,
      messages: [...(ticket.messages || []), {
        id: `msg-${Date.now()}`, ticketId: ticket.id, author: CURRENT_USER, role: "requester" as const,
        messageType: "inquiry" as const, content: `[재문의] ${targetProcess}로 재검토 요청\n\n${reinquiryContent}`,
        timestamp: new Date().toISOString(),
      }],
    })
    setShowReinquiryDialog(false)
    setReinquiryTarget("")
    setReinquiryContent("")
    refreshTicket()
  }
  
  // 발행자 최종 확인 완료 -> 종결 단계로 이동 (담당자가 티켓 종결 버튼으로 최종 종결)
  const handlePublisherConfirmComplete = () => {
    const updatedFlow = (ticket.processFlow || []).map(s =>
      s.step === "publisher-confirm" ? { ...s, status: "completed" as const, timestamp: new Date().toLocaleString("ko-KR") } :
      s.step === "closed" ? { ...s, status: "current" as const, assignee: ticket.owner, team: "공정기술팀" } : s
    )
    
    updateTicket(ticket.id, {
      processStatus: "review-complete", // 종결 대기 상태 (발행자 확인 완료, 최종 종결 전)
      processFlow: updatedFlow,
      messages: [...(ticket.messages || []), {
        id: `msg-${Date.now()}`, ticketId: ticket.id, author: "System", role: "system" as const,
        messageType: "status_change" as const, content: `${ticket.requester}님이 검토 결과를 확인했습니다. 담당자의 최종 종결 처리가 필요합니다.`,
        timestamp: new Date().toISOString(),
      }],
    })
    refreshTicket()
  }

  return (
    <div className="space-y-6">
      {/* Process Flow - always at the very top */}
      <ProcessFlowBar steps={ticket.processFlow} processStatus={ticket.processStatus} />

      {/* Pending acceptance banner */}
      {isPending && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-800">새로운 이벤트가 할당되었습니다. 접수 또는 반려를 결정해주세요.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 bg-white text-red-600 border-red-200 hover:bg-red-50" onClick={() => setShowRejectDialog(true)}>
                <XCircle className="h-3.5 w-3.5" />
                반려
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => setShowAcceptDialog(true)}>
                <CheckCircle className="h-3.5 w-3.5" />
                접수
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Publisher Confirm banner - 발행자 확인 단계 */}
      {isPublisherConfirm && (
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-emerald-800">기술검토가 완료되었습니다. 최종 확인 후 종결하거나 추가 문의를 요청��세요.</p>
                <p className="text-xs text-emerald-600 mt-0.5">발행자: {ticket.requester}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 bg-white text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => setShowReinquiryDialog(true)}>
                <MessageSquare className="h-3.5 w-3.5" />
                재문의
              </Button>
              <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={handlePublisherConfirmComplete}>
                <CheckCircle className="h-3.5 w-3.5" />
                검토 완료
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      {/* Review Complete banner - 검토완료 단계 (담당자 최종 종결 처리) */}
      {isReviewComplete && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">발행자가 검토 결과를 확인했습니다. 페이지 하단의 "티켓 종결" 버튼을 통해 AI 레포트를 작성하고 최종 종결해주세요.</p>
                <p className="text-xs text-amber-600 mt-0.5">담당자: {ticket.owner}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Basic Info + Context side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                <Badge variant="secondary" className={`text-xs ${
                  ticket.ticketType === "Trouble" ? "bg-orange-50 text-orange-700" :
                  ticket.ticketType === "Improvement" ? "bg-blue-50 text-blue-700" :
                  ticket.ticketType === "Analysis" ? "bg-emerald-50 text-emerald-700" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {ticket.ticketType === "Trouble" ? "트러블" : ticket.ticketType === "Improvement" ? "개선" : ticket.ticketType === "Analysis" ? "분석" : ticket.ticketType}
                </Badge>
                <Badge className={`text-xs ${ticket.priority === "P1" ? "bg-red-600 text-white" : ticket.priority === "P2" ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {ticket.priority}
                </Badge>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2 text-balance">{ticket.title}</h2>
              <p className="text-sm text-muted-foreground">{ticket.description}</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">요청자</p>
                <p className="text-sm font-medium text-foreground">{ticket.requester}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">담당자</p>
                <p className="text-sm font-medium text-foreground">{ticket.owner}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">공정 / 장치</p>
                <p className="text-sm font-medium text-foreground">{ticket.unit} / {ticket.equipment || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">마감일</p>
                <p className="text-sm font-medium text-foreground">{ticket.dueDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">영향</p>
                <p className="text-sm font-medium text-foreground">{ticket.impact}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">생성일</p>
                <p className="text-sm font-medium text-foreground">{ticket.createdDate}</p>
              </div>
            </div>
          </div>

          {ticket.tags && ticket.tags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] text-muted-foreground mb-1.5">관련 태그</p>
              <div className="flex flex-wrap gap-1.5">
                {ticket.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
              </div>
            </div>
          )}

          <Separator className="my-4" />
          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 bg-transparent">
                  <Search className="h-3.5 w-3.5" />
                  유사 이벤트 확인
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>유사 이벤트</DialogTitle>
                  <DialogDescription>메타정보 기준으로 파악된 유사 이벤트 목록입니다.</DialogDescription>
                </DialogHeader>
                <SimilarEventsDialog ticket={ticket} />
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 bg-transparent">
                  <FileText className="h-3.5 w-3.5" />
                  유사 레포트 확인
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>유사 레포트</DialogTitle>
                  <DialogDescription>메타정보 기준으로 파악된 관련 레포트 목록입니다.</DialogDescription>
                </DialogHeader>
                <SimilarReportsContent ticket={ticket} />
              </DialogContent>
            </Dialog>
            
            {/* 추가 데이터 확인 버튼 (티켓 생성 시 첨부 데이터) */}
            {(ticket.additionalDetails?.text || (ticket.additionalDetails?.dataBoxes && ticket.additionalDetails.dataBoxes.length > 0)) && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700">
                    <Paperclip className="h-3.5 w-3.5" />
                    추가 데이터 확인 ({ticket.additionalDetails?.dataBoxes?.length || 0}개)
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Paperclip className="h-5 w-5 text-blue-600" />
                      추가 데이터
                    </DialogTitle>
                    <DialogDescription>
                      이벤트 생성 시 첨부한 트렌드, DCS 화면, 표 등의 추가 데이터입니다.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 mt-2">
                    {/* 텍스트 설명 */}
                    {ticket.additionalDetails?.text && (
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-2">추가 설명</p>
                        <p className="text-sm whitespace-pre-wrap">{ticket.additionalDetails.text}</p>
                      </div>
                    )}
                    
                    {/* 데이터 박스들 */}
                    {ticket.additionalDetails?.dataBoxes?.map((box, idx) => (
                      <Card key={box.id || idx} className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          {box.type === "trend" && <TrendingUp className="h-4 w-4 text-blue-600" />}
                          {box.type === "dcs" && <Monitor className="h-4 w-4 text-emerald-600" />}
                          {box.type === "table" && <TableIcon className="h-4 w-4 text-purple-600" />}
                          {box.type === "chart" && <BarChart3 className="h-4 w-4 text-orange-600" />}
                          <span className="text-sm font-medium">
                            {box.type === "trend" ? "트렌드 그래프" :
                             box.type === "dcs" ? "DCS 화면" :
                             box.type === "table" ? "데이터 표" :
                             "차트"}
                          </span>
                          {box.config.title && (
                            <span className="text-xs text-muted-foreground">- {box.config.title}</span>
                          )}
                        </div>
                        
                        {/* Trend */}
                        {box.type === "trend" && (
                          <div className="space-y-2">
                            {box.config.tags && box.config.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {box.config.tags.map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs font-mono">{tag}</Badge>
                                ))}
                              </div>
                            )}
                            {box.config.fromDate && box.config.toDate && (
                              <p className="text-xs text-muted-foreground">
                                기간: {new Date(box.config.fromDate).toLocaleDateString("ko-KR")} ~ {new Date(box.config.toDate).toLocaleDateString("ko-KR")}
                              </p>
                            )}
                            <div className="h-32 bg-gradient-to-r from-blue-50 to-cyan-50 rounded flex items-center justify-center text-xs text-muted-foreground border border-dashed border-blue-200">
                              <Activity className="h-5 w-5 text-blue-400 mr-2" />
                              트렌드 그래프 영역
                            </div>
                          </div>
                        )}
                        
                        {/* DCS */}
                        {box.type === "dcs" && (
                          <div className="space-y-2">
                            {box.config.graphicNumber && (
                              <p className="text-xs"><span className="text-muted-foreground">Graphic #:</span> {box.config.graphicNumber}</p>
                            )}
                            {box.config.graphicType && (
                              <p className="text-xs"><span className="text-muted-foreground">유형:</span> {box.config.graphicType}</p>
                            )}
                            <div className="h-40 bg-gradient-to-r from-slate-50 to-gray-100 rounded flex items-center justify-center text-xs text-muted-foreground border border-dashed border-slate-300">
                              <Monitor className="h-5 w-5 text-slate-400 mr-2" />
                              DCS 화면 캡처 영역
                            </div>
                          </div>
                        )}
                        
                        {/* Table */}
                        {box.type === "table" && box.config.tableData && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                              <tbody>
                                {box.config.tableData.map((row, rIdx) => (
                                  <tr key={rIdx} className={rIdx === 0 ? "bg-muted/50 font-medium" : ""}>
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} className="border border-border px-2 py-1.5">{cell}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </Card>
                    ))}
                    
                    {(!ticket.additionalDetails?.text && (!ticket.additionalDetails?.dataBoxes || ticket.additionalDetails.dataBoxes.length === 0)) && (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        추가 데이터가 없습니다.
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </Card>

        {/* Context Data */}
        <ContextDataPanel ticket={ticket} />
      </div>

      {/* Submitted Opinions */}
      <SubmittedOpinionsView opinions={ticket.opinions} />

      {/* Active working area */}
      {isActive && (
        <>
          {/* 추가 검토자 의견 작성 섹션 (추가검토 배정된 경우) */}
          <AdditionalReviewerOpinionSection ticket={ticket} onSuccess={refreshTicket} />
          
          <OpinionWritingCanvas
            ticketId={ticket.id}
            ticketType={ticket.ticketType}
            ticketUnit={ticket.unit}
            currentUser={CURRENT_USER}
            onSuccess={refreshTicket}
          />
          <AdditionalReviewerSection ticket={ticket} onAssign={refreshTicket} />
        </>
      )}
      
      {/* 추가검토가 진행 중�� 때 AdditionalReviewerSection 항상 표시 (isActive가 false여도) */}
      {!isActive && hasIncompleteAdditionalReviews && (
        <AdditionalReviewerSection ticket={ticket} onAssign={refreshTicket} />
      )}

      {/* Thread / Event Group tabs + Comments Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - History & Group View */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <Tabs defaultValue="thread">
              <TabsList className="mb-4">
                <TabsTrigger value="thread">이벤트 히스토리</TabsTrigger>
                {(ticket.additionalReviewers?.length || 0) > 0 && (
                  <TabsTrigger value="event-group">
                    이벤트 그룹보기 ({ticket.additionalReviewers?.filter(r => r.status === "completed").length || 0}/{ticket.additionalReviewers?.length || 0})
                  </TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="thread">
                <ThreadHistory ticket={ticket} />
              </TabsContent>
              <TabsContent value="event-group">
                <EventGroupView ticket={ticket} />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
        
        {/* Side Panel - Comments */}
        <div className="lg:col-span-1">
          <Card className="p-4 sticky top-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              댓글 ({ticket.comments?.length || 0})
            </h3>
            <CommentsSection ticket={ticket} onUpdate={refreshTicket} />
          </Card>
        </div>
      </div>

      {/* Closed event - Full Report View */}
      {isClosed && (ticket.closureReport || ticket.executiveSummary) && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileBarChart className="h-4 w-4" />
              종결 리포트
            </h3>
            {ticket.closedDate && (
              <Badge variant="secondary" className="text-xs">
                종결일: {new Date(ticket.closedDate).toLocaleDateString("ko-KR")}
              </Badge>
            )}
          </div>
          
          {ticket.closureReport ? (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">요약</Label>
                <div className="whitespace-pre-line text-sm text-foreground bg-muted/30 p-3 rounded mt-1">{ticket.closureReport.summary}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">배경</Label>
                <div className="whitespace-pre-line text-sm text-foreground bg-muted/30 p-3 rounded mt-1">{ticket.closureReport.background}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">수행 내용</Label>
                <div className="whitespace-pre-line text-sm text-foreground bg-muted/30 p-3 rounded mt-1">{ticket.closureReport.actions}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">결과</Label>
                <div className="whitespace-pre-line text-sm text-foreground bg-muted/30 p-3 rounded mt-1">{ticket.closureReport.results}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">교훈 및 개선점</Label>
                <div className="whitespace-pre-line text-sm text-foreground bg-muted/30 p-3 rounded mt-1">{ticket.closureReport.lessons}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">후속 조치 권고</Label>
                <div className="whitespace-pre-line text-sm text-foreground bg-muted/30 p-3 rounded mt-1">{ticket.closureReport.recommendations}</div>
              </div>
              {/* 타 팀 의견 포함 */}
              {ticket.closureReport.teamOpinions && ticket.closureReport.teamOpinions.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">타 팀 의견 종합</Label>
                  <div className="space-y-2 mt-1">
                    {ticket.closureReport.teamOpinions.map((op, idx) => (
                      <div key={idx} className="bg-orange-50/50 border border-orange-100 rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{op.team}</Badge>
                          <span className="text-xs text-muted-foreground">{op.reviewer}</span>
                        </div>
                        <p className="text-sm text-foreground">{op.opinion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-xs text-muted-foreground pt-2 border-t">
                작성자: {ticket.closureReport.author} | 작성일: {ticket.closureReport.createdDate}
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-line text-sm text-muted-foreground bg-muted/30 p-4 rounded">{ticket.executiveSummary}</div>
          )}
        </Card>
      )}

      {/* Escalation Banner - show if escalated */}
      {ticket.escalation && (
        <Card className={cn("p-4", 
          ticket.escalation.status === "pending" ? "bg-orange-50 border-orange-200" :
          ticket.escalation.status === "acknowledged" ? "bg-blue-50 border-blue-200" :
          "bg-emerald-50 border-emerald-200"
        )}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <ArrowUpCircle className={cn("h-5 w-5 mt-0.5",
                ticket.escalation.status === "pending" ? "text-orange-600" :
                ticket.escalation.status === "acknowledged" ? "text-blue-600" :
                "text-emerald-600"
              )} />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">에스��레이션</span>
                  <Badge variant="secondary" className={cn("text-xs",
                    ticket.escalation.status === "pending" ? "bg-orange-100 text-orange-700" :
                    ticket.escalation.status === "acknowledged" ? "bg-blue-100 text-blue-700" :
                    "bg-emerald-100 text-emerald-700"
                  )}>
                    {ticket.escalation.status === "pending" ? "대기중" :
                     ticket.escalation.status === "acknowledged" ? "확인됨" : "해결됨"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  <span className="font-medium">{ticket.escalation.escalatedTo}</span>에게 에스컬레이션됨
                </p>
                <p className="text-xs text-muted-foreground">
                  사유: {ticket.escalation.reason}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  요청자: {ticket.escalation.escalatedBy} | {new Date(ticket.escalation.escalatedAt).toLocaleString("ko-KR")}
                </p>
              </div>
            </div>
            {ticket.escalation.status === "pending" && (
              <Button size="sm" variant="outline" className="bg-white gap-1.5" onClick={handleAcknowledgeEscalation}>
                <Eye className="h-3.5 w-3.5" />
                확인
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Access Level Info Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {ticket.accessLevel === "Private" && <Lock className="h-4 w-4 text-muted-foreground" />}
            {ticket.accessLevel === "Team" && <Users className="h-4 w-4 text-muted-foreground" />}
            {ticket.accessLevel === "Public" && <Globe className="h-4 w-4 text-muted-foreground" />}
            <div>
              <p className="text-sm font-medium">
                {ticket.accessLevel === "Private" ? "관련자만 접근 가능" :
                 ticket.accessLevel === "Team" ? "팀 공유" : "전체 공개"}
              </p>
              <p className="text-xs text-muted-foreground">
                {ticket.allowedUsers && ticket.allowedUsers.length > 0 && (
                  <>추가 접근 허용: {ticket.allowedUsers.join(", ")}</>
                )}
                {ticket.allowedTeams && ticket.allowedTeams.length > 0 && (
                  <> | 팀: {ticket.allowedTeams.join(", ")}</>
                )}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setShowAccessDialog(true)}>
            <Settings className="h-3.5 w-3.5" />
            설정
          </Button>
        </div>
      </Card>

      {/* Close/Reopen for active events */}
      {!isClosed && !isPending && (
        <Card className={cn(
          "p-4",
          isReviewComplete ? "bg-amber-50 border-amber-200" : "bg-muted/30"
        )}>
          {isReviewComplete && (
            <p className="text-sm text-amber-800 text-center mb-3 font-medium">
              발행자 확인이 완료되었습니다. AI 레포트를 작성하고 티켓을 최종 종결해주세요.
            </p>
          )}
          <div className="flex gap-2 justify-center">
            <Button variant="outline" className="gap-2 bg-transparent" onClick={() => setShowEscalationDialog(true)}>
              <ArrowUpCircle className="h-4 w-4" />
              에스컬레이션
            </Button>
            <Button 
              variant="default" 
              className={cn(
                "gap-2",
                isReviewComplete && "bg-amber-600 hover:bg-amber-700"
              )} 
              onClick={() => setShowCloseDialog(true)}
            >
              <CheckCircle className="h-4 w-4" />
              티켓 종결
            </Button>
          </div>
        </Card>
      )}

      {isClosed && ticket.processStatus !== "rejected" && (
        <Card className="p-4 bg-muted/30">
          <div className="flex gap-2 justify-center">
            <Button variant="outline" className="gap-2 bg-transparent" onClick={() => {
              updateTicket(ticket.id, { processStatus: "review", status: "In Progress" })
              refreshTicket()
            }}>
              <RotateCcw className="h-4 w-4" />
              이벤트 재오픈
            </Button>
          </div>
        </Card>
      )}

      {/* Dialogs */}
      <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이벤트 접수</AlertDialogTitle>
            <AlertDialogDescription>이 이벤트를 접수하여 기술검토를 시작하시겠습니까?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleAccept}>접수</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이벤트 반려</AlertDialogTitle>
            <AlertDialogDescription>이 이벤트를 반려 처리합니다. 사유를 입력해주세요.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="반려 사유를 입력해주세요..." className="min-h-[100px]" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-destructive text-destructive-foreground">반려</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이벤트 종결</AlertDialogTitle>
            <AlertDialogDescription>이벤트를 종결 처리합니다. 유형 및 중요도에 따라 종료 Report 작성이 요구될 수 있습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose}>진행</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ClosureReportDialog
        open={showClosureReport} onOpenChange={setShowClosureReport}
        title={ticket.title} description={ticket.description}
        type="ticket" ticketType={ticket.ticketType} workPackages={ticket.workPackages.map(wp => wp.title)}
        teamOpinions={(ticket.additionalReviewers || [])
          .filter(r => r.status === "completed" && r.opinion)
          .map(r => ({ team: r.team, reviewer: r.name, opinion: r.opinion! }))}
        onSubmit={handleClosureReportSubmit}
      />

      {/* Reinquiry Dialog - 재��의 */}
      <Dialog open={showReinquiryDialog} onOpenChange={setShowReinquiryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-amber-600" />
              재문의 요청
            </DialogTitle>
            <DialogDescription>
              추가 검토가 필요한 경우 해당 단계로 재문의를 요청할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">재문의 대상</Label>
              <Select value={reinquiryTarget} onValueChange={setReinquiryTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="재문의 대상 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="review">기술검토 (담당자)</SelectItem>
                  {(ticket.additionalReviewers?.length || 0) > 0 && (
                    <SelectItem value="additional-review">추가검토 (타 팀)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">재문의 내용</Label>
              <Textarea
                value={reinquiryContent}
                onChange={(e) => setReinquiryContent(e.target.value)}
                placeholder="추가로 확인이 필요한 내용을 작성해주세요..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowReinquiryDialog(false)}>취소</Button>
            <Button onClick={handleReinquiry} disabled={!reinquiryTarget || !reinquiryContent.trim()} className="gap-1.5 bg-amber-600 hover:bg-amber-700">
              <MessageSquare className="h-4 w-4" />
              재문의 요청
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Escalation Dialog */}
      <Dialog open={showEscalationDialog} onOpenChange={setShowEscalationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-orange-600" />
              에스컬레이션 요청
            </DialogTitle>
            <DialogDescription>
              이 이벤트를 ���장급 또는 상위 결재권자에게 에스컬레이션합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">에스컬레이션 대상</Label>
              <Select value={escalationTarget} onValueChange={setEscalationTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="대상자 선택" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_LEADERS.map(leader => (
                    <SelectItem key={leader.id} value={leader.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{leader.name}</span>
                        <span className="text-xs text-muted-foreground">{leader.team} {leader.role}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">에스컬레이션 사유</Label>
              <Textarea
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                placeholder="에스컬레이션이 필요한 사유를 작성해주세요..."
                className="min-h-[100px]"
              />
            </div>
            <Card className="p-3 bg-amber-50 border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium mb-1">에스컬레이션 시 다음과 같은 조치가 이루어집니다:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                    <li>대상자에게 즉시 알림 발송</li>
                    <li>대상자가 이벤트에 접근 가능하도록 권한 부여</li>
                    <li>이��트 타임라인에 에스컬레이션 이력 기록</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEscalationDialog(false)}>취소</Button>
            <Button onClick={handleEscalation} disabled={!escalationTarget || !escalationReason.trim()} className="gap-1.5 bg-orange-600 hover:bg-orange-700">
              <ArrowUpCircle className="h-4 w-4" />
              에스컬레이션 요청
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Access Settings Dialog */}
      <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              ���근 권한 설정
            </DialogTitle>
            <DialogDescription>
              이 이벤트의 접근 권한을 관리합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-3">
              <Label className="text-sm font-medium">현재 공개 범위</Label>
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                {ticket.accessLevel === "Private" && <Lock className="h-5 w-5 text-muted-foreground" />}
                {ticket.accessLevel === "Team" && <Users className="h-5 w-5 text-muted-foreground" />}
                {ticket.accessLevel === "Public" && <Globe className="h-5 w-5 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium">
                    {ticket.accessLevel === "Private" ? "관련자만" :
                     ticket.accessLevel === "Team" ? "팀 공유" : "전체 공개"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ticket.accessLevel === "Private" ? "발행자, 담당자, 추가 검토자만 접근 가능" :
                     ticket.accessLevel === "Team" ? "선택된 팀 전체가 열람 가능" : "모든 사용자가 열람 가능"}
                  </p>
                </div>
              </div>
            </div>
            
            {ticket.allowedTeams && ticket.allowedTeams.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">공유 팀</Label>
                <div className="flex flex-wrap gap-2">
                  {ticket.allowedTeams.map(team => (
                    <Badge key={team} variant="secondary" className="text-xs">{team}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">추가 접근 허용 사용자</Label>
              {ticket.allowedUsers && ticket.allowedUsers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {ticket.allowedUsers.map(user => (
                    <Badge key={user} variant="outline" className="text-xs flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {user}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">추가로 접근 허용된 사용자가 없습니다.</p>
              )}
            </div>

            <Card className="p-3 bg-muted/50">
              <p className="text-xs text-muted-foreground">
                접근 권한 변경은 이벤트 생성 시 설정하거나, 에스컬레이션을 통해 특정 사용자에게 권한을 부여할 수 있습니다.
              </p>
            </Card>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowAccessDialog(false)}>닫기</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
