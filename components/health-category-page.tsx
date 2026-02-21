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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  TrendingUp, TrendingDown, Minus, LayoutGrid, List, ChevronRight, AlertTriangle,
  ClipboardList, Eye, X, ArrowUpRight, ArrowDownRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type HealthCategory, type HealthEquipment, type RelatedTrendTag, type TrafficLight,
  HEALTH_CATEGORIES, PROCESSES, getEquipmentData, getRelatedTrends,
} from "@/lib/health-data"
import { AppShell } from "@/components/app-shell"
import { useRouter } from "next/navigation"

// ---- Traffic light indicator ----
function TrafficLightDot({ light, size = "md" }: { light: TrafficLight; size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5"
  const color = light === "red" ? "bg-red-500" : light === "yellow" ? "bg-amber-400" : "bg-emerald-500"
  return <span className={cn(s, "rounded-full inline-block shrink-0", color)} />
}

// ---- Slope direction indicator ----
function SlopeArrow({ slope, category }: { slope: number; category: HealthCategory }) {
  // For fouling/separation/energy: negative slope = worsening (U down, eff down)
  // For coking/catalyst/hydraulics/mechanical: positive slope = worsening (temp up, dP up, vib up)
  const worseningUp = ["coking", "catalyst-aging", "hydraulics", "mechanical"].includes(category)
  const isWorsening = worseningUp ? slope > 0 : slope < 0
  const isImproving = worseningUp ? slope < 0 : slope > 0
  const isFlat = Math.abs(slope) < 0.01

  if (isFlat) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
  if (isWorsening) return <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
  return <ArrowDownRight className="h-3.5 w-3.5 text-emerald-500" />
}

// ---- Mini sparkline SVG ----
function Sparkline({ data, limit, color = "hsl(var(--primary))", width = 120, height = 32 }: {
  data: number[]; limit?: number; color?: string; width?: number; height?: number
}) {
  if (!data.length) return null
  const min = Math.min(...data, ...(limit ? [limit] : [])) * 0.98
  const max = Math.max(...data, ...(limit ? [limit] : [])) * 1.02
  const range = max - min || 1
  const pad = 2
  const cw = width - pad * 2
  const ch = height - pad * 2
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

// ---- Large trend chart for related trends ----
function TrendChart({ tag }: { tag: RelatedTrendTag }) {
  const { values, limit, lowLimit, unit, tagId, description } = tag
  const allVals = [...values, ...(limit ? [limit] : []), ...(lowLimit ? [lowLimit] : [])]
  const max = Math.max(...allVals) * 1.05
  const min = Math.min(...allVals) * 0.95
  const range = max - min || 1
  const W = 320, H = 100, pad = { t: 8, b: 16, l: 36, r: 8 }
  const cw = W - pad.l - pad.r
  const ch = H - pad.t - pad.b
  const toX = (i: number) => pad.l + (i / (values.length - 1)) * cw
  const toY = (v: number) => pad.t + (1 - (v - min) / range) * ch

  const typeColors: Record<string, string> = {
    Temperature: "#ef4444", Pressure: "#3b82f6", Flow: "#10b981", Level: "#8b5cf6",
    Analysis: "#f59e0b", Control: "#6366f1", Performance: "#0d9488",
  }
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
          {/* Y axis labels */}
          <text x={pad.l - 3} y={pad.t + 4} fontSize="7" fill="currentColor" fillOpacity="0.35" textAnchor="end">{max.toFixed(0)}</text>
          <text x={pad.l - 3} y={pad.t + ch} fontSize="7" fill="currentColor" fillOpacity="0.35" textAnchor="end">{min.toFixed(0)}</text>
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
// HealthCategoryPage - 공통 카테고리 상세
// =========================================
export function HealthCategoryPage({ category }: { category: HealthCategory }) {
  const router = useRouter()
  const config = HEALTH_CATEGORIES[category]
  const allEquipment = useMemo(() => getEquipmentData(category), [category])

  // Filters
  const [processFilter, setProcessFilter] = useState<string>("all")
  const [lightFilter, setLightFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"table" | "trend">("table")

  // Selected equipment for related trends
  const [selectedEquipId, setSelectedEquipId] = useState<string | null>(null)

  // Action dialogs
  const [showImprovementDialog, setShowImprovementDialog] = useState(false)
  const [showMonitorDialog, setShowMonitorDialog] = useState(false)
  const [actionTarget, setActionTarget] = useState<HealthEquipment | null>(null)
  const [improvementForm, setImprovementForm] = useState({ title: "", description: "", actionType: "online-cleaning" })
  const [monitorForm, setMonitorForm] = useState({ title: "", description: "" })

  // Filtered equipment
  const filtered = useMemo(() => {
    return allEquipment.filter(e => {
      if (processFilter !== "all" && e.process !== processFilter) return false
      if (lightFilter !== "all" && e.trafficLight !== lightFilter) return false
      return true
    })
  }, [allEquipment, processFilter, lightFilter])

  // Available processes for this category
  const availableProcesses = useMemo(() => {
    return Array.from(new Set(allEquipment.map(e => e.process))).sort()
  }, [allEquipment])

  // Related trends for selected equipment
  const relatedTrends = useMemo(() => {
    if (!selectedEquipId) return []
    return getRelatedTrends(category, selectedEquipId)
  }, [category, selectedEquipId])

  // Counts
  const counts = useMemo(() => ({
    red: allEquipment.filter(e => e.trafficLight === "red").length,
    yellow: allEquipment.filter(e => e.trafficLight === "yellow").length,
    green: allEquipment.filter(e => e.trafficLight === "green").length,
  }), [allEquipment])

  // Open action dialog
  const openImprovement = (eq: HealthEquipment) => {
    setActionTarget(eq)
    setImprovementForm({
      title: `[${eq.process}] ${eq.name} - ${config.label} 개선`,
      description: `${eq.id} (${eq.name})의 ${eq.healthIndex.name} 악화 추세 감지.\n현재값: ${eq.healthIndex.currentValue} ${eq.healthIndex.unit}\n이번주 기울기: ${eq.healthIndex.weeklySlope} (평균대비 ${eq.slopeRatio.toFixed(1)}배)`,
      actionType: "online-cleaning",
    })
    setShowImprovementDialog(true)
  }

  const openMonitor = (eq: HealthEquipment) => {
    setActionTarget(eq)
    setMonitorForm({
      title: `[장기건전성] ${eq.process} ${eq.name} ${eq.healthIndex.name} 모니터링`,
      description: `${eq.id}의 ${eq.healthIndex.name} 악화 추세 (기울기 비율 ${eq.slopeRatio.toFixed(1)}x). 집중 모니터링 필요.`,
    })
    setShowMonitorDialog(true)
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{config.label} 관리</h1>
            <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Traffic light summary badges */}
            <Badge variant="outline" className="gap-1.5 border-red-200 text-red-600">
              <TrafficLightDot light="red" size="sm" /> {counts.red}
            </Badge>
            <Badge variant="outline" className="gap-1.5 border-amber-200 text-amber-600">
              <TrafficLightDot light="yellow" size="sm" /> {counts.yellow}
            </Badge>
            <Badge variant="outline" className="gap-1.5 border-emerald-200 text-emerald-600">
              <TrafficLightDot light="green" size="sm" /> {counts.green}
            </Badge>
          </div>
        </div>

        {/* Filters + view toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={processFilter} onValueChange={setProcessFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="공정 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 공정</SelectItem>
              {availableProcesses.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={lightFilter} onValueChange={setLightFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="red">빨간색 (위험)</SelectItem>
              <SelectItem value="yellow">노란색 (주의)</SelectItem>
              <SelectItem value="green">초록색 (양호)</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-1 border rounded-md p-0.5">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm" className="h-7 px-2.5 text-xs gap-1"
              onClick={() => setViewMode("table")}
            >
              <List className="h-3.5 w-3.5" /> 요약
            </Button>
            <Button
              variant={viewMode === "trend" ? "secondary" : "ghost"}
              size="sm" className="h-7 px-2.5 text-xs gap-1"
              onClick={() => setViewMode("trend")}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> 트렌드
            </Button>
          </div>
        </div>

        {/* Main content area */}
        <div className={cn("flex gap-6", selectedEquipId && viewMode === "table" ? "flex-col lg:flex-row" : "flex-col")}>
          {/* Left: Equipment list */}
          <div className={cn("flex-1 min-w-0", selectedEquipId && viewMode === "table" && "lg:w-3/5")}>
            {viewMode === "table" ? (
              /* ===== TABLE VIEW ===== */
              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-9 text-center">상태</TableHead>
                        <TableHead className="min-w-[80px]">장치 ID</TableHead>
                        <TableHead className="min-w-[160px]">장치명</TableHead>
                        <TableHead className="w-[60px]">공정</TableHead>
                        <TableHead className="w-[70px]">유형</TableHead>
                        <TableHead className="text-right min-w-[90px]">{allEquipment[0]?.healthIndex.name || "Health Index"}</TableHead>
                        <TableHead className="w-[120px] text-center">트렌드</TableHead>
                        <TableHead className="text-right w-[80px]">이번주</TableHead>
                        <TableHead className="text-right w-[80px]">평균</TableHead>
                        <TableHead className="text-right w-[60px]">비율</TableHead>
                        <TableHead className="w-[80px] text-center">조치</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(eq => {
                        const isSelected = selectedEquipId === eq.id
                        return (
                          <TableRow
                            key={eq.id}
                            className={cn(
                              "cursor-pointer transition-colors",
                              isSelected && "bg-primary/5",
                              eq.trafficLight === "red" && "bg-red-50/50"
                            )}
                            onClick={() => setSelectedEquipId(isSelected ? null : eq.id)}
                          >
                            <TableCell className="text-center">
                              <TrafficLightDot light={eq.trafficLight} />
                            </TableCell>
                            <TableCell className="font-mono text-xs font-medium">{eq.id}</TableCell>
                            <TableCell className="text-sm">
                              <div className="flex items-center gap-1">
                                {eq.name}
                                {isSelected && <ChevronRight className="h-3 w-3 text-primary" />}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] h-5">{eq.process}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{eq.equipmentType}</TableCell>
                            <TableCell className="text-right font-mono text-sm font-medium">
                              {eq.healthIndex.currentValue}
                              <span className="text-[10px] text-muted-foreground ml-1">{eq.healthIndex.unit}</span>
                            </TableCell>
                            <TableCell>
                              <Sparkline
                                data={eq.healthIndex.trend}
                                limit={eq.healthIndex.limitValue}
                                color={eq.trafficLight === "red" ? "#ef4444" : eq.trafficLight === "yellow" ? "#f59e0b" : "#10b981"}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <SlopeArrow slope={eq.healthIndex.weeklySlope} category={category} />
                                <span className="font-mono text-xs">{eq.healthIndex.weeklySlope > 0 ? "+" : ""}{eq.healthIndex.weeklySlope}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-muted-foreground">
                              {eq.healthIndex.avgSlope > 0 ? "+" : ""}{eq.healthIndex.avgSlope}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant="outline"
                                className={cn("text-[10px] font-mono",
                                  eq.trafficLight === "red" && "border-red-300 text-red-600 bg-red-50",
                                  eq.trafficLight === "yellow" && "border-amber-300 text-amber-600 bg-amber-50",
                                  eq.trafficLight === "green" && "border-emerald-300 text-emerald-600 bg-emerald-50",
                                )}
                              >
                                x{eq.slopeRatio.toFixed(1)}
                              </Badge>
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
                        <TableRow>
                          <TableCell colSpan={11} className="text-center py-8 text-sm text-muted-foreground">
                            조건에 맞는 장치가 없습니다
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            ) : (
              /* ===== TREND VIEW (2-column grid) ===== */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filtered.map(eq => {
                  const isSelected = selectedEquipId === eq.id
                  const hi = eq.healthIndex
                  const data = hi.trend
                  const allVals = [...data, hi.limitValue]
                  const max = Math.max(...allVals) * 1.05
                  const min = Math.min(...allVals) * 0.95
                  const range = max - min || 1
                  const W = 400, H = 130
                  const p = { t: 10, b: 18, l: 40, r: 10 }
                  const cw = W - p.l - p.r
                  const ch = H - p.t - p.b
                  const toX = (i: number) => p.l + (i / (data.length - 1)) * cw
                  const toY = (v: number) => p.t + (1 - (v - min) / range) * ch
                  const pathD = data.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(" ")
                  const lightColor = eq.trafficLight === "red" ? "#ef4444" : eq.trafficLight === "yellow" ? "#f59e0b" : "#10b981"

                  return (
                    <Card
                      key={eq.id}
                      className={cn("cursor-pointer transition-all", isSelected && "ring-2 ring-primary")}
                      onClick={() => setSelectedEquipId(isSelected ? null : eq.id)}
                    >
                      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrafficLightDot light={eq.trafficLight} />
                          <span className="font-mono text-sm font-semibold">{eq.id}</span>
                          <Badge variant="outline" className="text-[10px] h-4">{eq.process}</Badge>
                          {eq.trafficLight === "red" && (
                            <div className="flex gap-0.5 ml-1" onClick={e => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" title="개선과제 등록" onClick={() => openImprovement(eq)}>
                                <ClipboardList className="h-3 w-3 text-orange-500" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" title="집중 모니터링 추가" onClick={() => openMonitor(eq)}>
                                <Eye className="h-3 w-3 text-blue-500" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">[{hi.unit}]</span>
                      </div>
                      <p className="px-4 text-xs text-muted-foreground -mt-0.5">{eq.name}</p>
                      <div className="px-2 pb-0.5">
                        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24" preserveAspectRatio="xMidYMid meet">
                          <line x1={p.l} y1={toY(hi.limitValue)} x2={W - p.r} y2={toY(hi.limitValue)} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="4 2" />
                          <path d={`${pathD} L ${toX(data.length - 1)} ${p.t + ch} L ${toX(0)} ${p.t + ch} Z`} fill={lightColor} opacity="0.07" />
                          <path d={pathD} fill="none" stroke={lightColor} strokeWidth="2" strokeLinecap="round" />
                          {data.map((v, i) => <circle key={i} cx={toX(i)} cy={toY(v)} r={1.5} fill={lightColor} />)}
                          <text x={p.l - 3} y={toY(hi.limitValue) + 3} fontSize="7" fill="#ef4444" fillOpacity="0.6" textAnchor="end">Limit</text>
                        </svg>
                      </div>
                      <div className="px-4 pb-3 flex items-center justify-between text-[11px]">
                        <span>현재 <span className="font-semibold">{hi.currentValue}</span></span>
                        <span className="text-muted-foreground">Limit {hi.limitValue}</span>
                        <div className="flex items-center gap-1">
                          <SlopeArrow slope={hi.weeklySlope} category={category} />
                          <Badge variant="outline" className={cn("text-[10px] font-mono",
                            eq.trafficLight === "red" && "border-red-300 text-red-600",
                            eq.trafficLight === "yellow" && "border-amber-300 text-amber-600",
                          )}>x{eq.slopeRatio.toFixed(1)}</Badge>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: Related trends panel */}
          {selectedEquipId && (
            <div className={cn("shrink-0", viewMode === "table" ? "lg:w-2/5" : "w-full")}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      연관 트렌드 묶음
                      <Badge variant="secondary" className="text-[10px]">{relatedTrends.length}개</Badge>
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedEquipId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {(() => {
                    const eq = allEquipment.find(e => e.id === selectedEquipId)
                    if (!eq) return null
                    return (
                      <p className="text-xs text-muted-foreground mt-1">
                        {eq.id} <span className="font-medium text-foreground">{eq.name}</span> ({eq.process}) - {eq.healthIndex.name}: {eq.healthIndex.currentValue} {eq.healthIndex.unit}
                      </p>
                    )
                  })()}
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className={cn(viewMode === "table" ? "max-h-[600px]" : "max-h-[400px]")}>
                    <div className={cn("gap-3", viewMode === "table" ? "grid grid-cols-1" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3")}>
                      {relatedTrends.map(tag => (
                        <TrendChart key={tag.tagId} tag={tag} />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* ===== Dialog: 개선과제 등록 ===== */}
        <Dialog open={showImprovementDialog} onOpenChange={setShowImprovementDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-orange-500" />
                개선과제 등록
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {actionTarget && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                  <TrafficLightDot light="red" />
                  <div>
                    <p className="text-sm font-medium">{actionTarget.id} - {actionTarget.name}</p>
                    <p className="text-xs text-muted-foreground">{actionTarget.process} | {actionTarget.healthIndex.name}: {actionTarget.healthIndex.currentValue} {actionTarget.healthIndex.unit} | 기울기 비율 x{actionTarget.slopeRatio.toFixed(1)}</p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-xs">과제명</Label>
                <Input value={improvementForm.title} onChange={e => setImprovementForm({ ...improvementForm, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">조치 유형</Label>
                <Select value={improvementForm.actionType} onValueChange={v => setImprovementForm({ ...improvementForm, actionType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online-cleaning">Online Cleaning</SelectItem>
                    <SelectItem value="ta-scope">TA Scope 반영</SelectItem>
                    <SelectItem value="operating-change">운전 조건 변경</SelectItem>
                    <SelectItem value="chemical-treatment">Chemical 처리</SelectItem>
                    <SelectItem value="inspection">점검/검사</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">상세 설명</Label>
                <Textarea rows={4} value={improvementForm.description} onChange={e => setImprovementForm({ ...improvementForm, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowImprovementDialog(false)}>취소</Button>
              <Button onClick={() => {
                setShowImprovementDialog(false)
                router.push("/roadmap")
              }}>
                개선과제 등록
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===== Dialog: 집중 모니터링 추가 ===== */}
        <Dialog open={showMonitorDialog} onOpenChange={setShowMonitorDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                집중 모니터링 추가 (Standing Issue)
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {actionTarget && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                  <TrafficLightDot light="red" />
                  <div>
                    <p className="text-sm font-medium">{actionTarget.id} - {actionTarget.name}</p>
                    <p className="text-xs text-muted-foreground">{actionTarget.process} | {actionTarget.healthIndex.name}: {actionTarget.healthIndex.currentValue} {actionTarget.healthIndex.unit}</p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-xs">모니터링 항목명</Label>
                <Input value={monitorForm.title} onChange={e => setMonitorForm({ ...monitorForm, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">모니터링 설명</Label>
                <Textarea rows={3} value={monitorForm.description} onChange={e => setMonitorForm({ ...monitorForm, description: e.target.value })} />
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-xs text-blue-700">
                  등록 시 Daily Monitoring 상세페이지의 Standing Issue 영역에 추가되어 매일 모니터링됩니다.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMonitorDialog(false)}>취소</Button>
              <Button variant="default" className="bg-blue-600 hover:bg-blue-700" onClick={() => {
                setShowMonitorDialog(false)
              }}>
                모니터링 추가
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
