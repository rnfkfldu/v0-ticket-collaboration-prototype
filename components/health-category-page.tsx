"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  TrendingUp, TrendingDown, Minus, LayoutGrid, List, ChevronRight, AlertTriangle,
  ClipboardList, Eye, X, ArrowUpRight, ArrowDownRight, Settings2, GitCompare,
  Info, ExternalLink, Triangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type HealthCategory, type HealthEquipment, type RelatedTrendTag, type TrafficLight,
  HEALTH_CATEGORIES, PROCESSES, PROCESS_MODES, getEquipmentData, getRelatedTrends,
} from "@/lib/health-data"
import { AppShell } from "@/components/app-shell"
import { useRouter } from "next/navigation"

// ---- Traffic Light Dot ----
function TrafficLightDot({ light, size = "md" }: { light: TrafficLight; size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5"
  const c = light === "red" ? "bg-red-500" : light === "yellow" ? "bg-amber-400" : "bg-emerald-500"
  return <span className={cn(s, "rounded-full inline-block shrink-0", c)} />
}

// ---- Slope Arrow ----
function SlopeArrow({ slope, category }: { slope: number; category: HealthCategory }) {
  const worseningUp = ["coking", "catalyst-aging", "hydraulics", "mechanical"].includes(category)
  const isWorsening = worseningUp ? slope > 0 : slope < 0
  const isFlat = Math.abs(slope) < 0.01
  if (isFlat) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
  if (isWorsening) return <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
  return <ArrowDownRight className="h-3.5 w-3.5 text-emerald-500" />
}

// ---- Mini Sparkline ----
function Sparkline({ data, limit, color = "hsl(var(--primary))", width = 120, height = 32 }: {
  data: number[]; limit?: number; color?: string; width?: number; height?: number
}) {
  if (!data.length) return null
  const min = Math.min(...data, ...(limit ? [limit] : [])) * 0.98
  const max = Math.max(...data, ...(limit ? [limit] : [])) * 1.02
  const range = max - min || 1
  const pad = 2, cw = width - pad * 2, ch = height - pad * 2
  const toX = (i: number) => pad + (i / (data.length - 1)) * cw
  const toY = (v: number) => pad + (1 - (v - min) / range) * ch
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(" ")
  return (
    <svg width={width} height={height} className="shrink-0">
      {limit && <line x1={pad} y1={toY(limit)} x2={width - pad} y2={toY(limit)} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.6" />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1])} r="2" fill={color} />
    </svg>
  )
}

// ---- Projection Trend Chart (Large) ----
function ProjectionTrendChart({ eq, category, showPrevTa, projectionMode }: {
  eq: HealthEquipment; category: HealthCategory; showPrevTa: boolean; projectionMode: "linear" | "ai"
}) {
  const hi = eq.healthIndex
  const data = hi.trend
  const limit = hi.limitValue
  const actionLimit = eq.projection.actionLimit
  const projWeeks = (projectionMode === "ai" && eq.projection.aiEndOfRun) ? eq.projection.aiEndOfRun : eq.projection.linearEndOfRun
  const projLen = Math.min(projWeeks, 24) // project up to 24 weeks
  const lastVal = data[data.length - 1]
  const slope = projectionMode === "ai" && eq.projection.aiModelId
    ? hi.weeklySlope * (0.8 + Math.sin(projWeeks) * 0.3) // AI deviation
    : hi.weeklySlope
  const projData = Array.from({ length: projLen + 1 }, (_, i) => +(lastVal + slope * i).toFixed(2))
  const prevTa = showPrevTa && hi.prevTaTrend ? hi.prevTaTrend : null

  const allVals = [...data, ...projData, ...(prevTa || []), limit, actionLimit]
  const max = Math.max(...allVals) * 1.03
  const min = Math.min(...allVals) * 0.97
  const range = max - min || 1
  const W = 600, H = 180, p = { t: 12, b: 24, l: 48, r: 16 }
  const cw = W - p.l - p.r, ch = H - p.t - p.b
  const totalLen = data.length + projLen
  const toX = (i: number) => p.l + (i / (totalLen - 1)) * cw
  const toY = (v: number) => p.t + (1 - (v - min) / range) * ch

  // Actual path
  const actualPath = data.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(" ")
  // Projection path
  const projPath = projData.map((v, i) => {
    const x = toX(data.length - 1 + i)
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${toY(v).toFixed(1)}`
  }).join(" ")
  // Prev TA path
  const prevPath = prevTa ? prevTa.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(" ") : ""
  // Action window
  const actionMargin = eq.projection.actionMarginWeeks
  const actionStartWeek = Math.max(0, projWeeks - actionMargin)
  const actionX1 = toX(data.length - 1 + actionStartWeek)
  const actionX2 = toX(data.length - 1 + projWeeks)

  const lightColor = eq.trafficLight === "red" ? "#ef4444" : eq.trafficLight === "yellow" ? "#f59e0b" : "#10b981"

  return (
    <Card className={cn("overflow-hidden", eq.projection.needsImmediateAction && "ring-2 ring-red-400")}>
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrafficLightDot light={eq.trafficLight} />
          <span className="font-mono text-sm font-semibold">{eq.id}</span>
          <Badge variant="outline" className="text-[10px] h-5">{eq.process}</Badge>
          {eq.mode && <Badge variant="secondary" className="text-[10px] h-5">{eq.mode}</Badge>}
          {eq.projection.needsImmediateAction && (
            <Badge variant="destructive" className="text-[10px] h-5 gap-0.5">
              <AlertTriangle className="h-3 w-3" /> 즉시 조치
            </Badge>
          )}
          {eq.projection.aiModelId && (
            <Badge variant="outline" className="text-[10px] h-5 border-indigo-300 text-indigo-600">AI 모델</Badge>
          )}
          {!eq.normalized.hasLogic && (
            <Badge variant="outline" className="text-[10px] h-5 border-orange-200 text-orange-500">Raw</Badge>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">[{hi.unit}]</span>
      </div>
      <p className="px-4 text-xs text-muted-foreground -mt-0.5 mb-1">{eq.name}</p>
      <div className="px-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }} preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map(frac => {
            const y = p.t + frac * ch
            const val = max - frac * range
            return <g key={frac}><line x1={p.l} y1={y} x2={W - p.r} y2={y} stroke="currentColor" strokeOpacity={0.05} /><text x={p.l - 4} y={y + 3} fontSize="7" fill="currentColor" fillOpacity={0.3} textAnchor="end">{val.toFixed(0)}</text></g>
          })}
          {/* Divider: now | projection */}
          <line x1={toX(data.length - 1)} y1={p.t} x2={toX(data.length - 1)} y2={p.t + ch} stroke="currentColor" strokeOpacity={0.15} strokeDasharray="4 2" />
          <text x={toX(data.length - 1)} y={p.t + ch + 12} fontSize="7" fill="currentColor" fillOpacity={0.4} textAnchor="middle">현재</text>
          {/* Action window fill */}
          {actionStartWeek < projLen && (
            <rect x={actionX1} y={p.t} width={Math.max(0, actionX2 - actionX1)} height={ch} fill="#fbbf24" opacity="0.08" rx="2" />
          )}
          {/* Limit & action limit lines */}
          <line x1={p.l} y1={toY(limit)} x2={W - p.r} y2={toY(limit)} stroke="#ef4444" strokeWidth="1" strokeDasharray="5 3" />
          <text x={W - p.r + 2} y={toY(limit) + 3} fontSize="7" fill="#ef4444" fillOpacity={0.8}>Limit</text>
          <line x1={p.l} y1={toY(actionLimit)} x2={W - p.r} y2={toY(actionLimit)} stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="3 2" />
          <text x={W - p.r + 2} y={toY(actionLimit) + 3} fontSize="6" fill="#f59e0b" fillOpacity={0.7}>Action</text>
          {/* Prev TA */}
          {prevPath && <path d={prevPath} fill="none" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.5" />}
          {/* Actual data */}
          <path d={`${actualPath} L ${toX(data.length - 1)} ${p.t + ch} L ${toX(0)} ${p.t + ch} Z`} fill={lightColor} opacity="0.06" />
          <path d={actualPath} fill="none" stroke={lightColor} strokeWidth="2" strokeLinecap="round" />
          {/* Projection */}
          <path d={projPath} fill="none" stroke={projectionMode === "ai" ? "#6366f1" : lightColor} strokeWidth="1.5" strokeDasharray="6 3" opacity="0.7" />
          {/* Points */}
          {data.map((v, i) => <circle key={i} cx={toX(i)} cy={toY(v)} r={1.5} fill={lightColor} />)}
          {/* Action window label */}
          {actionStartWeek < projLen && (
            <text x={(actionX1 + actionX2) / 2} y={p.t + 10} fontSize="7" fill="#b45309" textAnchor="middle">Action Window</text>
          )}
        </svg>
      </div>
      <div className="px-4 pb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
        <span>현재 <span className="font-semibold">{hi.currentValue} {hi.unit}</span></span>
        <span className="text-muted-foreground">Limit {limit}</span>
        <span className="text-muted-foreground">Projection {projWeeks}주</span>
        {hi.prevTaValueAtSameRuntime !== undefined && (
          <span className="text-muted-foreground">전 TA {hi.prevTaValueAtSameRuntime} {hi.unit}</span>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <SlopeArrow slope={hi.weeklySlope} category={category} />
          <Badge variant="outline" className={cn("text-[10px] font-mono",
            eq.trafficLight === "red" && "border-red-300 text-red-600",
            eq.trafficLight === "yellow" && "border-amber-300 text-amber-600",
          )}>
            Drift {eq.driftPct > 0 ? "+" : ""}{eq.driftPct.toFixed(0)}%
          </Badge>
        </div>
      </div>
    </Card>
  )
}

// ---- Related Trend Card ----
function TrendChart({ tag }: { tag: RelatedTrendTag }) {
  const { values, limit, lowLimit, unit, tagId, description } = tag
  const allVals = [...values, ...(limit ? [limit] : []), ...(lowLimit ? [lowLimit] : [])]
  const max = Math.max(...allVals) * 1.05, min = Math.min(...allVals) * 0.95, range = max - min || 1
  const W = 320, H = 100, pad = { t: 8, b: 16, l: 36, r: 8 }
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b
  const toX = (i: number) => pad.l + (i / (values.length - 1)) * cw
  const toY = (v: number) => pad.t + (1 - (v - min) / range) * ch
  const typeColors: Record<string, string> = { Temperature: "#ef4444", Pressure: "#3b82f6", Flow: "#10b981", Level: "#8b5cf6", Analysis: "#f59e0b", Control: "#6366f1", Performance: "#0d9488" }
  const color = typeColors[tag.type] || "#6366f1"
  const lastVal = values[values.length - 1]
  const isViolation = (limit && lastVal > limit) || (lowLimit && lastVal < lowLimit)
  const pathD = values.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(" ")

  return (
    <Card className={cn("overflow-hidden", isViolation && "border-red-200")}>
      <div className="px-3 pt-2 pb-0.5 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs font-semibold">{tagId}</span>
          <Badge variant="secondary" className="text-[10px] h-4" style={{ borderColor: color, color }}>{tag.type}</Badge>
          {isViolation && <Badge variant="destructive" className="text-[10px] h-4">Violation</Badge>}
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">[{unit}]</span>
      </div>
      <p className="px-3 text-[11px] text-muted-foreground truncate">{description}</p>
      <div className="px-1 pb-0.5">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" preserveAspectRatio="xMidYMid meet">
          {limit && <line x1={pad.l} y1={toY(limit)} x2={W - pad.r} y2={toY(limit)} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="4 2" />}
          {lowLimit && <line x1={pad.l} y1={toY(lowLimit)} x2={W - pad.r} y2={toY(lowLimit)} stroke="#3b82f6" strokeWidth="0.8" strokeDasharray="4 2" />}
          <path d={`${pathD} L ${toX(values.length - 1)} ${pad.t + ch} L ${toX(0)} ${pad.t + ch} Z`} fill={color} opacity="0.06" />
          <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          {values.map((v, i) => {
            const over = (limit && v > limit) || (lowLimit && v < lowLimit)
            return <circle key={i} cx={toX(i)} cy={toY(v)} r={over ? 2.5 : 1.5} fill={over ? "#ef4444" : color} />
          })}
        </svg>
      </div>
      <div className="px-3 pb-2 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">현재 <span className={cn("font-semibold", isViolation ? "text-red-600" : "text-foreground")}>{lastVal} {unit}</span></span>
        {limit && <span className="text-red-400">Max {limit}</span>}
        {lowLimit && <span className="text-blue-400">Min {lowLimit}</span>}
      </div>
    </Card>
  )
}

// =========================================
// HealthCategoryPage - Main
// =========================================
export function HealthCategoryPage({ category }: { category: HealthCategory }) {
  const router = useRouter()
  const config = HEALTH_CATEGORIES[category]
  const allEquipment = useMemo(() => getEquipmentData(category), [category])

  // Filters
  const [processFilter, setProcessFilter] = useState<string>("all")
  const [modeFilter, setModeFilter] = useState<string>("all")
  const [lightFilter, setLightFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"table" | "trend">("table")

  // Trend options
  const [projectionMode, setProjectionMode] = useState<"linear" | "ai">("ai")
  const [showPrevTa, setShowPrevTa] = useState(false)
  const [showRelatedPanel, setShowRelatedPanel] = useState(false)

  // Selected equipment
  const [selectedEquipId, setSelectedEquipId] = useState<string | null>(null)

  // Normalized logic edit dialog
  const [showNormDialog, setShowNormDialog] = useState(false)
  const [normTarget, setNormTarget] = useState<HealthEquipment | null>(null)

  // Action dialogs
  const [showImprovementDialog, setShowImprovementDialog] = useState(false)
  const [showMonitorDialog, setShowMonitorDialog] = useState(false)
  const [actionTarget, setActionTarget] = useState<HealthEquipment | null>(null)
  const [improvementForm, setImprovementForm] = useState({ title: "", description: "", actionType: "online-cleaning" })
  const [monitorForm, setMonitorForm] = useState({ title: "", description: "" })

  // Modes for selected process
  const availableModes = useMemo(() => {
    if (processFilter === "all") {
      return Array.from(new Set(allEquipment.filter(e => e.mode).map(e => e.mode!))).sort()
    }
    return PROCESS_MODES[processFilter] || []
  }, [processFilter, allEquipment])

  // Filtered
  const filtered = useMemo(() => {
    return allEquipment.filter(e => {
      if (processFilter !== "all" && e.process !== processFilter) return false
      if (modeFilter !== "all" && e.mode !== modeFilter) return false
      if (lightFilter !== "all" && e.trafficLight !== lightFilter) return false
      return true
    })
  }, [allEquipment, processFilter, modeFilter, lightFilter])

  const availableProcesses = useMemo(() => Array.from(new Set(allEquipment.map(e => e.process))).sort(), [allEquipment])
  const relatedTrends = useMemo(() => selectedEquipId ? getRelatedTrends(category, selectedEquipId) : [], [category, selectedEquipId])

  const counts = useMemo(() => ({
    red: filtered.filter(e => e.trafficLight === "red").length,
    yellow: filtered.filter(e => e.trafficLight === "yellow").length,
    green: filtered.filter(e => e.trafficLight === "green").length,
    immediate: filtered.filter(e => e.projection.needsImmediateAction).length,
  }), [filtered])

  const openImprovement = (eq: HealthEquipment) => {
    setActionTarget(eq)
    setImprovementForm({
      title: `[${eq.process}] ${eq.name} - ${config.label} 개선`,
      description: `${eq.id} (${eq.name}) ${eq.healthIndex.name} Drift ${eq.driftPct > 0 ? "+" : ""}${eq.driftPct.toFixed(0)}% 악화.\n현재값: ${eq.healthIndex.currentValue} ${eq.healthIndex.unit}\nProjection: ${eq.projection.linearEndOfRun}주 후 Limit 도달 예상`,
      actionType: "online-cleaning",
    })
    setShowImprovementDialog(true)
  }

  const openMonitor = (eq: HealthEquipment) => {
    setActionTarget(eq)
    setMonitorForm({
      title: `[장기건전성] ${eq.process} ${eq.name} ${eq.healthIndex.name} 모니터링`,
      description: `${eq.id} Drift ${eq.driftPct > 0 ? "+" : ""}${eq.driftPct.toFixed(0)}%. 집중 모니터링 필요.`,
    })
    setShowMonitorDialog(true)
  }

  return (
    <AppShell>
      <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{config.label} 관리</h1>
            <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {counts.immediate > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> 즉시 조치 {counts.immediate}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1.5 border-red-200 text-red-600"><TrafficLightDot light="red" size="sm" /> {counts.red}</Badge>
            <Badge variant="outline" className="gap-1.5 border-amber-200 text-amber-600"><TrafficLightDot light="yellow" size="sm" /> {counts.yellow}</Badge>
            <Badge variant="outline" className="gap-1.5 border-emerald-200 text-emerald-600"><TrafficLightDot light="green" size="sm" /> {counts.green}</Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={processFilter} onValueChange={v => { setProcessFilter(v); setModeFilter("all") }}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="공정" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 공정</SelectItem>
              {availableProcesses.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={modeFilter} onValueChange={setModeFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="운전 모드" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 모드</SelectItem>
              {availableModes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={lightFilter} onValueChange={setLightFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="상태" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="red">위험 (빨강)</SelectItem>
              <SelectItem value="yellow">주의 (노랑)</SelectItem>
              <SelectItem value="green">양호 (초록)</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-xs text-muted-foreground">{filtered.length}건</span>

          {/* Trend mode options */}
          {viewMode === "trend" && (
            <div className="flex items-center gap-3 ml-2 pl-3 border-l">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Projection:</span>
                <div className="flex items-center gap-0.5 border rounded p-0.5">
                  <Button variant={projectionMode === "ai" ? "secondary" : "ghost"} size="sm" className="h-6 px-2 text-[11px]" onClick={() => setProjectionMode("ai")}>AI/ML</Button>
                  <Button variant={projectionMode === "linear" ? "secondary" : "ghost"} size="sm" className="h-6 px-2 text-[11px]" onClick={() => setProjectionMode("linear")}>Linear</Button>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Switch id="prev-ta" checked={showPrevTa} onCheckedChange={setShowPrevTa} className="scale-75" />
                <label htmlFor="prev-ta" className="text-xs text-muted-foreground cursor-pointer">전 TA 비교</label>
              </div>
            </div>
          )}

          <div className="ml-auto flex items-center gap-1 border rounded-md p-0.5">
            <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="sm" className="h-7 px-2.5 text-xs gap-1" onClick={() => setViewMode("table")}>
              <List className="h-3.5 w-3.5" /> 요약
            </Button>
            <Button variant={viewMode === "trend" ? "secondary" : "ghost"} size="sm" className="h-7 px-2.5 text-xs gap-1" onClick={() => setViewMode("trend")}>
              <LayoutGrid className="h-3.5 w-3.5" /> 트렌드
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className={cn("flex gap-6", (selectedEquipId && showRelatedPanel) ? "flex-col xl:flex-row" : "flex-col")}>
          <div className={cn("flex-1 min-w-0", selectedEquipId && showRelatedPanel && "xl:w-3/5")}>

            {viewMode === "table" ? (
              /* ===== TABLE VIEW ===== */
              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-9 text-center">상태</TableHead>
                        <TableHead className="min-w-[80px]">장치 ID</TableHead>
                        <TableHead className="min-w-[150px]">장치명</TableHead>
                        <TableHead className="w-[55px]">공정</TableHead>
                        <TableHead className="w-[80px]">모드</TableHead>
                        <TableHead className="w-[55px]">보정</TableHead>
                        <TableHead className="text-right min-w-[85px]">현재값</TableHead>
                        <TableHead className="w-[120px] text-center">트렌드 (24주)</TableHead>
                        <TableHead className="text-right w-[85px]" title="최근 1주일 기울기">주간 기울기</TableHead>
                        <TableHead className="text-right w-[85px]" title="최근 1개월 평균 기울기">월평균 기울기</TableHead>
                        <TableHead className="text-right w-[80px]" title="(주간 - 월평균) / |월평균| * 100. 30% 이상 주의, 50% 이상 위험">Drift %</TableHead>
                        <TableHead className="text-right w-[80px]" title="전 TA 동일 Run Time 기준값">전 TA</TableHead>
                        <TableHead className="text-right w-[75px]" title="Limit까지 남은 예상 주수">잔여(주)</TableHead>
                        <TableHead className="w-[70px] text-center">조치</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(eq => {
                        const isSelected = selectedEquipId === eq.id
                        const hi = eq.healthIndex
                        return (
                          <TableRow
                            key={eq.id}
                            className={cn("cursor-pointer transition-colors",
                              isSelected && "bg-primary/5",
                              eq.trafficLight === "red" && "bg-red-50/50",
                              eq.projection.needsImmediateAction && "bg-red-50"
                            )}
                            onClick={() => {
                              setSelectedEquipId(isSelected ? null : eq.id)
                              if (!isSelected) setShowRelatedPanel(true)
                            }}
                          >
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-0.5">
                                <TrafficLightDot light={eq.trafficLight} />
                                {eq.projection.needsImmediateAction && <AlertTriangle className="h-3 w-3 text-red-500" />}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs font-medium">{eq.id}</TableCell>
                            <TableCell className="text-sm">
                              <div className="flex items-center gap-1">
                                {eq.name}
                                {isSelected && <ChevronRight className="h-3 w-3 text-primary" />}
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px] h-5">{eq.process}</Badge></TableCell>
                            <TableCell className="text-xs text-muted-foreground">{eq.mode || "-"}</TableCell>
                            <TableCell>
                              <button
                                className="cursor-pointer"
                                onClick={e => { e.stopPropagation(); setNormTarget(eq); setShowNormDialog(true) }}
                                title={eq.normalized.hasLogic ? eq.normalized.description : "Raw Tag (클릭하여 보정 로직 설정)"}
                              >
                                <Badge variant={eq.normalized.hasLogic ? "secondary" : "outline"} className={cn("text-[10px] h-5",
                                  !eq.normalized.hasLogic && "border-orange-200 text-orange-500"
                                )}>
                                  {eq.normalized.hasLogic ? "Norm" : "Raw"}
                                </Badge>
                              </button>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm font-medium">
                              {hi.currentValue}
                              <span className="text-[10px] text-muted-foreground ml-1">{hi.unit}</span>
                            </TableCell>
                            <TableCell>
                              <Sparkline
                                data={hi.trend}
                                limit={hi.limitValue}
                                color={eq.trafficLight === "red" ? "#ef4444" : eq.trafficLight === "yellow" ? "#f59e0b" : "#10b981"}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <SlopeArrow slope={hi.weeklySlope} category={category} />
                                <span className="font-mono text-xs">{hi.weeklySlope > 0 ? "+" : ""}{hi.weeklySlope}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-muted-foreground">
                              {hi.monthlyAvgSlope > 0 ? "+" : ""}{hi.monthlyAvgSlope}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className={cn("text-[10px] font-mono",
                                eq.trafficLight === "red" && "border-red-300 text-red-600 bg-red-50",
                                eq.trafficLight === "yellow" && "border-amber-300 text-amber-600 bg-amber-50",
                                eq.trafficLight === "green" && "border-emerald-300 text-emerald-600 bg-emerald-50",
                              )}>
                                {eq.driftPct > 0 ? "+" : ""}{eq.driftPct.toFixed(0)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-muted-foreground">
                              {hi.prevTaValueAtSameRuntime !== undefined ? hi.prevTaValueAtSameRuntime : "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              <span className={cn(
                                eq.projection.linearEndOfRun <= 4 ? "text-red-600 font-semibold" :
                                eq.projection.linearEndOfRun <= 12 ? "text-amber-600" : "text-muted-foreground"
                              )}>
                                {eq.projection.linearEndOfRun}주
                              </span>
                            </TableCell>
                            <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                              {eq.trafficLight === "red" && (
                                <div className="flex items-center gap-0.5 justify-center">
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="개선과제 등록" onClick={() => openImprovement(eq)}>
                                    <ClipboardList className="h-3.5 w-3.5 text-orange-500" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="집중 모니터링 추가" onClick={() => openMonitor(eq)}>
                                    <Eye className="h-3.5 w-3.5 text-blue-500" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {filtered.length === 0 && (
                        <TableRow><TableCell colSpan={14} className="text-center py-8 text-sm text-muted-foreground">조건에 맞는 장치가 없습니다</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            ) : (
              /* ===== TREND VIEW ===== */
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filtered.map(eq => (
                  <div key={eq.id} className="cursor-pointer" onClick={() => {
                    setSelectedEquipId(selectedEquipId === eq.id ? null : eq.id)
                    setShowRelatedPanel(true)
                  }}>
                    <ProjectionTrendChart eq={eq} category={category} showPrevTa={showPrevTa} projectionMode={projectionMode} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Related trends panel */}
          {selectedEquipId && showRelatedPanel && (
            <div className={cn("shrink-0", viewMode === "table" ? "xl:w-2/5" : "w-full")}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      연관 트렌드 묶음
                      <Badge variant="secondary" className="text-[10px]">{relatedTrends.length}개</Badge>
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setShowRelatedPanel(false); setSelectedEquipId(null) }}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {(() => {
                    const eq = allEquipment.find(e => e.id === selectedEquipId)
                    if (!eq) return null
                    return <p className="text-xs text-muted-foreground mt-1">{eq.id} <span className="font-medium text-foreground">{eq.name}</span> ({eq.process}{eq.mode ? ` / ${eq.mode}` : ""})</p>
                  })()}
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className={cn(viewMode === "table" ? "max-h-[600px]" : "max-h-[400px]")}>
                    <div className={cn("gap-3", viewMode === "table" ? "grid grid-cols-1" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3")}>
                      {relatedTrends.map(tag => <TrendChart key={tag.tagId} tag={tag} />)}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* ===== Dialog: Normalized Logic ===== */}
        <Dialog open={showNormDialog} onOpenChange={setShowNormDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Normalized Logic 설정
              </DialogTitle>
            </DialogHeader>
            {normTarget && (
              <div className="space-y-4 py-2">
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-sm font-medium">{normTarget.id} - {normTarget.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{normTarget.process}{normTarget.mode ? ` / ${normTarget.mode}` : ""} | {normTarget.healthIndex.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">보정 로직명</Label>
                  <Input defaultValue={normTarget.normalized.name} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">보정 수식</Label>
                  <Input defaultValue={normTarget.normalized.formula} className="font-mono text-xs" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">기준 태그 (Reference)</Label>
                  <Input defaultValue={normTarget.normalized.referenceTag || ""} placeholder="예: FI-E101 (Feed Flow)" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">설명</Label>
                  <Textarea rows={2} defaultValue={normTarget.normalized.description} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch defaultChecked={normTarget.normalized.hasLogic} />
                  <Label className="text-xs">Normalized Logic 활성화 (비활성 시 Raw Tag 기준)</Label>
                </div>
                {!normTarget.normalized.hasLogic && (
                  <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
                    <p className="text-xs text-orange-700">현재 Raw Tag 기준으로 모니터링 중입니다. Feed 유량 등 운전 조건 보정이 필요한 경우 위 항목을 설정해 주세요.</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNormDialog(false)}>취소</Button>
              <Button onClick={() => setShowNormDialog(false)}>저장</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===== Dialog: 개선과제 등록 ===== */}
        <Dialog open={showImprovementDialog} onOpenChange={setShowImprovementDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-orange-500" /> 개선과제 등록</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {actionTarget && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                  <TrafficLightDot light="red" />
                  <div>
                    <p className="text-sm font-medium">{actionTarget.id} - {actionTarget.name}</p>
                    <p className="text-xs text-muted-foreground">{actionTarget.process} | Drift {actionTarget.driftPct > 0 ? "+" : ""}{actionTarget.driftPct.toFixed(0)}% | Projection {actionTarget.projection.linearEndOfRun}주</p>
                  </div>
                </div>
              )}
              <div className="space-y-2"><Label className="text-xs">과제명</Label><Input value={improvementForm.title} onChange={e => setImprovementForm({ ...improvementForm, title: e.target.value })} /></div>
              <div className="space-y-2">
                <Label className="text-xs">조치 유형</Label>
                <Select value={improvementForm.actionType} onValueChange={v => setImprovementForm({ ...improvementForm, actionType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online-cleaning">Online Cleaning</SelectItem>
                    <SelectItem value="ta-scope">TA Scope 반영</SelectItem>
                    <SelectItem value="operating-change">운전 조건 변경</SelectItem>
                    <SelectItem value="chemical-treatment">Chemical 처리</SelectItem>
                    <SelectItem value="temp-profile">온도 프로파일 변경</SelectItem>
                    <SelectItem value="inspection">점검/검사</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="text-xs">상세 설명</Label><Textarea rows={4} value={improvementForm.description} onChange={e => setImprovementForm({ ...improvementForm, description: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowImprovementDialog(false)}>취소</Button>
              <Button onClick={() => { setShowImprovementDialog(false); router.push("/roadmap") }}>개선과제 등록</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===== Dialog: 집중 모니터링 추가 ===== */}
        <Dialog open={showMonitorDialog} onOpenChange={setShowMonitorDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-blue-500" /> 집중 모니터링 추가 (Standing Issue)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {actionTarget && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                  <TrafficLightDot light="red" />
                  <div>
                    <p className="text-sm font-medium">{actionTarget.id} - {actionTarget.name}</p>
                    <p className="text-xs text-muted-foreground">{actionTarget.process} | Drift {actionTarget.driftPct > 0 ? "+" : ""}{actionTarget.driftPct.toFixed(0)}%</p>
                  </div>
                </div>
              )}
              <div className="space-y-2"><Label className="text-xs">모니터링 항목명</Label><Input value={monitorForm.title} onChange={e => setMonitorForm({ ...monitorForm, title: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-xs">모니터링 설명</Label><Textarea rows={3} value={monitorForm.description} onChange={e => setMonitorForm({ ...monitorForm, description: e.target.value })} /></div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-xs text-blue-700">등록 시 Daily Monitoring 상세페이지의 Standing Issue 영역에 추가되어 매일 모니터링됩니다.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMonitorDialog(false)}>취소</Button>
              <Button variant="default" className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowMonitorDialog(false)}>모니터링 추가</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
