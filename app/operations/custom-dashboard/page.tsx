"use client"

import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  LayoutGrid, Plus, ArrowLeft, Settings, Trash2, Clock, ChevronRight, Edit2,
  BarChart3, TrendingUp, Gauge, Table, X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AVAILABLE_TAGS } from "@/lib/process-data"

// --- Shared Dashboard Data (same as floating component) ---
interface DashboardItem {
  id: string
  name: string
  description: string
  unit: string
  widgets: WidgetConfig[]
  updatedAt: string
}

interface WidgetConfig {
  id: string
  type: "trend" | "kpi" | "gauge" | "table"
  tag: string
  title: string
  colSpan: number
}

function generateTagTrend(tagId: string, points = 30) {
  const seed = tagId.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const rand = (s: number) => ((Math.sin(s) * 10000) % 1 + 1) % 1
  const prefix = tagId.substring(0, 2)
  let base: number, range: number, unit: string, high: number | null, low: number | null
  if (prefix === "TI") { base = 280 + (seed % 120); range = 15; unit = "deg.C"; high = base + 20; low = base - 30 }
  else if (prefix === "PI") { base = 8 + (seed % 20); range = 2; unit = "kg/cm2"; high = base + 4; low = base - 2 }
  else if (prefix === "FI") { base = 500 + (seed % 1000); range = 50; unit = "m3/h"; high = base + 80; low = base - 80 }
  else if (prefix === "LI") { base = 50; range = 10; unit = "%"; high = 80; low = 20 }
  else { base = 100 + (seed % 200); range = 20; unit = ""; high = null; low = null }
  const values = Array.from({ length: points }, (_, i) => +(base + (rand(seed + i * 7) * range * 2 - range)).toFixed(1))
  return { values, unit, high, low, current: values[values.length - 1] }
}

const COLORS = ["#6366f1", "#0d9488", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#f97316", "#10b981"]

// --- Initial Dashboards ---
const INITIAL_DASHBOARDS: DashboardItem[] = [
  {
    id: "db-1",
    name: "HCR 일일 운전 현황판",
    description: "Reactor 온도/압력, 유량, 촉매 성능 종합",
    unit: "HCR",
    updatedAt: "2026-02-19",
    widgets: [
      { id: "w1", type: "trend", tag: "TI-3001", title: "Reactor Inlet 온도", colSpan: 2 },
      { id: "w2", type: "kpi", tag: "TI-3002", title: "Reactor Outlet 온도", colSpan: 1 },
      { id: "w3", type: "gauge", tag: "PI-3001", title: "Reactor 압력", colSpan: 1 },
      { id: "w4", type: "trend", tag: "FI-3001", title: "Feed 유량", colSpan: 2 },
      { id: "w5", type: "table", tag: "TI-3003", title: "Bed#1 온도 로그", colSpan: 2 },
      { id: "w6", type: "kpi", tag: "FI-3002", title: "H2 Makeup", colSpan: 1 },
      { id: "w7", type: "gauge", tag: "PDI-3001", title: "Reactor dP", colSpan: 1 },
    ],
  },
  {
    id: "db-2",
    name: "VDU 에너지 효율 대시보드",
    description: "감압탑 에너지 소비, 열회수율 추적",
    unit: "VDU",
    updatedAt: "2026-02-17",
    widgets: [
      { id: "w1", type: "trend", tag: "TI-2001", title: "Column Top 온도", colSpan: 2 },
      { id: "w2", type: "trend", tag: "TI-2002", title: "Column Bottom 온도", colSpan: 2 },
      { id: "w3", type: "kpi", tag: "PI-2001", title: "Column 압력", colSpan: 1 },
      { id: "w4", type: "gauge", tag: "LI-2001", title: "Bottom Level", colSpan: 1 },
      { id: "w5", type: "table", tag: "FI-2001", title: "Feed 유량 로그", colSpan: 2 },
    ],
  },
  {
    id: "db-3",
    name: "공정간 유틸리티 비교",
    description: "Steam/전기/냉각수 사용량 공정간 비교",
    unit: "전체",
    updatedAt: "2026-02-16",
    widgets: [
      { id: "w1", type: "trend", tag: "TI-3001", title: "HCR 열소비", colSpan: 2 },
      { id: "w2", type: "trend", tag: "TI-2001", title: "VDU 열소비", colSpan: 2 },
      { id: "w3", type: "kpi", tag: "TI-1001", title: "CDU Column Top", colSpan: 1 },
      { id: "w4", type: "kpi", tag: "PI-1001", title: "CDU 압력", colSpan: 1 },
      { id: "w5", type: "gauge", tag: "FI-1001", title: "Crude Feed", colSpan: 1 },
      { id: "w6", type: "gauge", tag: "LI-2001", title: "VDU Level", colSpan: 1 },
      { id: "w7", type: "table", tag: "TI-3002", title: "HCR Outlet 로그", colSpan: 2 },
      { id: "w8", type: "trend", tag: "PI-3001", title: "HCR Reactor 압력", colSpan: 2 },
      { id: "w9", type: "kpi", tag: "FI-3001", title: "HCR Feed", colSpan: 1 },
      { id: "w10", type: "kpi", tag: "FI-2001", title: "VDU Feed", colSpan: 1 },
    ],
  },
]

// --- Chart Components (shared with floating) ---
function TrendChart({ values, high, low, color = "#6366f1", height = "h-24" }: {
  values: number[]; high: number | null; low: number | null; color?: string; height?: string
}) {
  const allVals = [...values, ...(high ? [high] : []), ...(low ? [low] : [])]
  const maxV = Math.max(...allVals) * 1.02, minV = Math.min(...allVals) * 0.98
  const range = maxV - minV || 1
  const W = 500, H = 130
  const pad = { t: 10, b: 10, l: 6, r: 6 }
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b
  const toX = (i: number) => pad.l + (i / (values.length - 1)) * cw
  const toY = (v: number) => pad.t + (1 - (v - minV) / range) * ch
  const pathD = values.reduce((acc, v, i) => {
    const x = toX(i), y = toY(v)
    if (i === 0) return `M ${x} ${y}`
    const px = toX(i - 1), py = toY(values[i - 1]), cpx = (px + x) / 2
    return `${acc} C ${cpx} ${py}, ${cpx} ${y}, ${x} ${y}`
  }, "")
  const isAlert = (high !== null && values[values.length - 1] > high)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("w-full", height)} preserveAspectRatio="xMidYMid meet">
      {high && <line x1={pad.l} y1={toY(high)} x2={W - pad.r} y2={toY(high)} stroke="#f87171" strokeWidth="1" strokeDasharray="4 2" />}
      {low && <line x1={pad.l} y1={toY(low)} x2={W - pad.r} y2={toY(low)} stroke="#60a5fa" strokeWidth="1" strokeDasharray="4 2" />}
      <path d={`${pathD} L ${toX(values.length - 1)} ${pad.t + ch} L ${toX(0)} ${pad.t + ch} Z`} fill={color} opacity="0.06" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={toX(values.length - 1)} cy={toY(values[values.length - 1])} r={3} fill={isAlert ? "#ef4444" : color} stroke="white" strokeWidth="1.5" />
    </svg>
  )
}

export default function CustomDashboardPage() {
  const searchParams = useSearchParams()
  const initialId = searchParams.get("id")

  const [dashboards, setDashboards] = useState<DashboardItem[]>(INITIAL_DASHBOARDS)
  const [selectedId, setSelectedId] = useState<string | null>(initialId)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newUnit, setNewUnit] = useState("")

  const selected = dashboards.find(d => d.id === selectedId) || null

  const handleCreate = () => {
    if (!newName.trim()) return
    const nd: DashboardItem = {
      id: `db-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim(),
      unit: newUnit.trim() || "사용자",
      updatedAt: new Date().toISOString().slice(0, 10),
      widgets: [],
    }
    setDashboards(prev => [nd, ...prev])
    setSelectedId(nd.id)
    setShowCreateDialog(false)
    setNewName(""); setNewDesc(""); setNewUnit("")
  }

  const handleDelete = (id: string) => {
    setDashboards(prev => prev.filter(d => d.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  // ===== List View =====
  if (!selected) {
    return (
      <AppShell>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                커스텀 대시보드
              </h1>
              <p className="text-sm text-muted-foreground mt-1">사용자가 구성한 대시보드를 관리하고 조회합니다.</p>
            </div>
            <Button className="gap-1.5 cursor-pointer" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4" />
              새 대시보드
            </Button>
          </div>

          {dashboards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <LayoutGrid className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">아직 생성된 대시보드가 없습니다</p>
              <p className="text-xs text-muted-foreground mb-4">위의 "새 대시보드" 버튼으로 나만의 대시보드를 만들어보세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboards.map(db => (
                <Card key={db.id} className="hover:shadow-md transition-shadow cursor-pointer group relative" onClick={() => setSelectedId(db.id)}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                        <LayoutGrid className="h-5 w-5 text-amber-600" />
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(db.id) }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-red-50 hover:border-red-200 cursor-pointer"
                        title="삭제"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{db.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{db.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{db.unit}</Badge>
                      <span className="text-xs text-muted-foreground">위젯 {db.widgets.length}개</span>
                      <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {db.updatedAt}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  새 대시보드 만들기
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">대시보드 이름</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="예: HCR 촉매 성능 대시보드" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">설명</Label>
                  <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="대시보드의 용도나 범위를 입력하세요" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">공정 단위</Label>
                  <Input value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="예: HCR, VDU, CDU, 전체" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="cursor-pointer">취소</Button>
                <Button onClick={handleCreate} disabled={!newName.trim()} className="cursor-pointer">생성</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AppShell>
    )
  }

  // ===== Detail View (Dashboard Rendered) =====
  return (
    <AppShell>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="gap-1.5 cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
              목록
            </Button>
            <div className="h-5 w-px bg-border" />
            <h1 className="text-lg font-bold flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-amber-600" />
              {selected.name}
            </h1>
            <Badge variant="outline">{selected.unit}</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {selected.updatedAt} 수정
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{selected.description}</p>

        {/* Widgets Grid */}
        {selected.widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-lg">
            <LayoutGrid className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">아직 위젯이 없습니다</p>
            <p className="text-xs text-muted-foreground mb-4">대시보드에 트렌드, KPI, 게이지, 테이블 위젯을 추가해보세요.</p>
            <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer">
              <Plus className="h-4 w-4" />
              위젯 추가
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {selected.widgets.map((w, idx) => {
              const trend = generateTagTrend(w.tag)
              const isAlert = trend.high !== null && trend.current > trend.high

              if (w.type === "kpi") {
                return (
                  <Card key={w.id} className={cn("p-4", w.colSpan === 2 ? "col-span-2" : "col-span-1")}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">{w.title}</p>
                      <span className="font-mono text-[10px] text-muted-foreground">{w.tag}</span>
                    </div>
                    <p className={cn("text-3xl font-bold tabular-nums", isAlert ? "text-red-600" : "text-foreground")}>{trend.current}</p>
                    <p className="text-xs text-muted-foreground mt-1">{trend.unit}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      {trend.high !== null && <span>H: <span className="text-red-500 font-medium">{trend.high}</span></span>}
                      {trend.low !== null && <span>L: <span className="text-blue-500 font-medium">{trend.low}</span></span>}
                    </div>
                  </Card>
                )
              }

              if (w.type === "gauge") {
                const pct = trend.high ? Math.min(100, (trend.current / trend.high) * 100) : 50
                const color = pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#22c55e"
                return (
                  <Card key={w.id} className={cn("p-4 flex flex-col items-center", w.colSpan === 2 ? "col-span-2" : "col-span-1")}>
                    <p className="text-xs text-muted-foreground mb-2 self-start">{w.title}</p>
                    <svg viewBox="0 0 120 80" className="w-28 h-20 my-1">
                      <path d="M 10 70 A 50 50 0 0 1 110 70" fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth="8" strokeLinecap="round" />
                      <path d="M 10 70 A 50 50 0 0 1 110 70" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${pct * 1.57} 157`} />
                      <text x="60" y="60" textAnchor="middle" fontSize="14" fontWeight="bold" fill="currentColor">{pct.toFixed(0)}%</text>
                    </svg>
                    <p className="text-sm font-semibold">{trend.current} <span className="text-xs font-normal text-muted-foreground">{trend.unit}</span></p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{w.tag}</p>
                  </Card>
                )
              }

              if (w.type === "table") {
                return (
                  <Card key={w.id} className={cn("p-4", w.colSpan === 2 ? "col-span-2" : "col-span-1")}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium">{w.title}</p>
                      <span className="font-mono text-[10px] text-muted-foreground">{w.tag}</span>
                    </div>
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-1.5 px-2">시간</th>
                        <th className="text-right py-1.5 px-2">값</th>
                        <th className="text-right py-1.5 px-2">단위</th>
                        <th className="text-right py-1.5 px-2">상태</th>
                      </tr></thead>
                      <tbody>
                        {trend.values.slice(-6).map((v, i) => {
                          const over = trend.high !== null && v > trend.high
                          return (
                            <tr key={i} className="border-b border-border/30">
                              <td className="py-1.5 px-2 text-muted-foreground">{`${String(6 + i * 3).padStart(2, "0")}:00`}</td>
                              <td className="py-1.5 px-2 text-right font-mono font-medium">{v}</td>
                              <td className="py-1.5 px-2 text-right text-muted-foreground">{trend.unit}</td>
                              <td className="py-1.5 px-2 text-right">
                                <span className={cn("inline-block w-2 h-2 rounded-full", over ? "bg-red-500" : "bg-green-500")} />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </Card>
                )
              }

              // trend
              return (
                <Card key={w.id} className={cn("overflow-hidden", w.colSpan === 2 ? "col-span-2" : "col-span-1", isAlert && "border-red-200")}>
                  <div className="px-4 pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{w.title}</span>
                      {isAlert && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">초과</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">{w.tag}</span>
                      <span className="font-semibold text-foreground">{trend.current} {trend.unit}</span>
                    </div>
                  </div>
                  <div className="px-2">
                    <TrendChart values={trend.values} high={trend.high} low={trend.low} color={COLORS[idx % COLORS.length]} height="h-24" />
                  </div>
                  <div className="px-4 pb-2.5 flex items-center justify-between text-xs border-t border-border/50 pt-1.5">
                    {trend.high !== null && <span className="text-muted-foreground">H: <span className="text-red-500 font-medium">{trend.high}</span></span>}
                    {trend.low !== null && <span className="text-muted-foreground">L: <span className="text-blue-500 font-medium">{trend.low}</span></span>}
                    <span className="text-muted-foreground">범위: {Math.min(...trend.values).toFixed(1)} ~ {Math.max(...trend.values).toFixed(1)}</span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
