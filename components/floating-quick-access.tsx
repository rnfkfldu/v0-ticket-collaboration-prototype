"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  TrendingUp, LayoutGrid, LineChart, Plus, X, Search, Bookmark, Trash2,
  ChevronRight, Tag, Save, Layers, FolderPlus, Check, Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { AVAILABLE_TAGS } from "@/lib/process-data"

// --- Types ---
interface TrendGroup {
  id: string
  name: string
  tags: string[]
  unit: string
  updatedAt: string
}

interface DashboardItem {
  id: string
  name: string
  widgets: number
  unit: string
  updatedAt: string
  description: string
}

// --- Initial Data ---
const INITIAL_TREND_GROUPS: TrendGroup[] = [
  { id: "tg-1", name: "HCR Reactor 온도 모니터링", tags: ["TI-3001", "TI-3002", "TI-3003", "TI-3004"], unit: "HCR", updatedAt: "2026-02-20" },
  { id: "tg-2", name: "VDU 감압탑 압력/온도", tags: ["TI-2001", "TI-2002", "PI-2001", "LI-2001"], unit: "VDU", updatedAt: "2026-02-18" },
  { id: "tg-3", name: "CDU Feed 유량 트래킹", tags: ["FI-1001", "TI-1001", "PI-1001"], unit: "CDU", updatedAt: "2026-02-15" },
  { id: "tg-4", name: "HCR 수소 계통", tags: ["FI-3001", "PI-3001", "TIC-3001"], unit: "HCR", updatedAt: "2026-02-14" },
]

const INITIAL_DASHBOARDS: DashboardItem[] = [
  { id: "db-1", name: "HCR 일일 운전 현황판", widgets: 8, unit: "HCR", updatedAt: "2026-02-19", description: "Reactor 온도/압력, 유량, 촉매 성능 종합" },
  { id: "db-2", name: "VDU 에너지 효율 대시보드", widgets: 6, unit: "VDU", updatedAt: "2026-02-17", description: "감압탑 에너지 소비, 열회수율 추적" },
  { id: "db-3", name: "공정간 유틸리티 비교", widgets: 10, unit: "전체", updatedAt: "2026-02-16", description: "Steam/전기/냉각수 사용량 공정간 비교" },
]

// --- Trend Generation ---
function generateTagTrend(tagId: string, points = 48) {
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

// --- Chart Components ---
function TrendChart({ values, high, low, color = "#6366f1", isAlert = false, height = "h-28" }: {
  values: number[]; high: number | null; low: number | null; color?: string; isAlert?: boolean; height?: string
}) {
  const allVals = [...values, ...(high ? [high] : []), ...(low ? [low] : [])]
  const maxV = Math.max(...allVals) * 1.02
  const minV = Math.min(...allVals) * 0.98
  const range = maxV - minV || 1
  const W = 500, H = 140
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

function OverlayTrendChart({ tags, colors }: { tags: { tag: string; values: number[]; high: number | null; low: number | null }[]; colors: string[] }) {
  const allValues = tags.flatMap(t => [...t.values, ...(t.high ? [t.high] : []), ...(t.low ? [t.low] : [])])
  const maxV = Math.max(...allValues) * 1.02
  const minV = Math.min(...allValues) * 0.98
  const range = maxV - minV || 1
  const W = 700, H = 300
  const pad = { t: 16, b: 24, l: 50, r: 16 }
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b
  const toX = (i: number, len: number) => pad.l + (i / (len - 1)) * cw
  const toY = (v: number) => pad.t + (1 - (v - minV) / range) * ch

  // Y-axis labels
  const yTicks = Array.from({ length: 5 }, (_, i) => minV + (range * i) / 4)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-72" preserveAspectRatio="xMidYMid meet">
      {/* Y-axis grid + labels */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={pad.l} y1={toY(v)} x2={W - pad.r} y2={toY(v)} stroke="currentColor" strokeOpacity={0.06} />
          <text x={pad.l - 6} y={toY(v) + 3} fontSize="9" fill="currentColor" fillOpacity={0.4} textAnchor="end">{v.toFixed(0)}</text>
        </g>
      ))}
      {/* Each tag line */}
      {tags.map((t, idx) => {
        const pathD = t.values.reduce((acc, v, i) => {
          const x = toX(i, t.values.length), y = toY(v)
          if (i === 0) return `M ${x} ${y}`
          const px = toX(i - 1, t.values.length), py = toY(t.values[i - 1]), cpx = (px + x) / 2
          return `${acc} C ${cpx} ${py}, ${cpx} ${y}, ${x} ${y}`
        }, "")
        const color = colors[idx % colors.length]
        return (
          <g key={t.tag}>
            <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={0.85} />
            <circle cx={toX(t.values.length - 1, t.values.length)} cy={toY(t.values[t.values.length - 1])} r={4} fill={color} stroke="white" strokeWidth="1.5" />
          </g>
        )
      })}
      {/* Limit lines from first tag */}
      {tags[0]?.high && <line x1={pad.l} y1={toY(tags[0].high)} x2={W - pad.r} y2={toY(tags[0].high)} stroke="#f87171" strokeWidth="1" strokeDasharray="6 3" opacity={0.6} />}
      {tags[0]?.low && <line x1={pad.l} y1={toY(tags[0].low)} x2={W - pad.r} y2={toY(tags[0].low)} stroke="#60a5fa" strokeWidth="1" strokeDasharray="6 3" opacity={0.6} />}
    </svg>
  )
}

const COLORS = ["#6366f1", "#0d9488", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#f97316", "#10b981"]

export function FloatingQuickAccess() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [activePanel, setActivePanel] = useState<"menu" | "trend" | "saved-trends" | "dashboards">("menu")

  // --- 1) Trend Viewer State (always fresh) ---
  const [tagInput, setTagInput] = useState("")
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"individual" | "overlay">("individual")

  // --- Save dialog state ---
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveMode, setSaveMode] = useState<"new" | "existing">("new")
  const [newGroupName, setNewGroupName] = useState("")
  const [saveTargetId, setSaveTargetId] = useState("")
  const [savedMsg, setSavedMsg] = useState("")

  // --- 2) Saved Trend Groups (mutable) ---
  const [trendGroups, setTrendGroups] = useState<TrendGroup[]>(INITIAL_TREND_GROUPS)
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false)
  const [newGroupFormName, setNewGroupFormName] = useState("")
  const [newGroupFormUnit, setNewGroupFormUnit] = useState("")
  const [newGroupFormTags, setNewGroupFormTags] = useState("")

  // --- 3) Dashboard state ---
  const [dashboards] = useState<DashboardItem[]>(INITIAL_DASHBOARDS)
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardItem | null>(null)

  // Context ref for saving back from trend
  const [fromGroupName, setFromGroupName] = useState<string | null>(null)

  // All available tags
  const allTags = useMemo(() => {
    const tags: string[] = []
    Object.values(AVAILABLE_TAGS).forEach(unitTags => {
      unitTags.forEach(tag => { if (!tags.includes(tag)) tags.push(tag) })
    })
    return tags.sort()
  }, [])

  const handleTagInput = useCallback((value: string) => {
    setTagInput(value)
    if (value.length > 0) {
      setSuggestions(allTags.filter(t => t.toLowerCase().includes(value.toLowerCase()) && !activeTags.includes(t)).slice(0, 8))
    } else {
      setSuggestions([])
    }
  }, [allTags, activeTags])

  const addTag = useCallback((tag: string) => {
    if (!activeTags.includes(tag)) setActiveTags(prev => [...prev, tag])
    setTagInput(""); setSuggestions([])
  }, [activeTags])

  const removeTag = useCallback((tag: string) => { setActiveTags(prev => prev.filter(t => t !== tag)) }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      const exact = allTags.find(t => t.toLowerCase() === tagInput.trim().toLowerCase())
      if (exact) addTag(exact)
      else if (suggestions.length > 0) addTag(suggestions[0])
    }
  }, [tagInput, suggestions, allTags, addTag])

  // --- Requirement 1: Always start fresh ---
  const openTrendFresh = () => {
    setActiveTags([])
    setTagInput("")
    setSuggestions([])
    setViewMode("individual")
    setFromGroupName(null)
    setSavedMsg("")
    setActivePanel("trend")
  }

  const openTrendWithTags = (tags: string[], groupName: string | null) => {
    setActiveTags(tags)
    setTagInput("")
    setSuggestions([])
    setViewMode("individual")
    setFromGroupName(groupName)
    setSavedMsg("")
    setActivePanel("trend")
  }

  const handleClose = () => {
    setIsOpen(false)
    setActivePanel("menu")
    setSelectedDashboard(null)
    setShowSaveDialog(false)
    setShowNewGroupDialog(false)
    setSavedMsg("")
  }

  // --- Save trend to group ---
  const handleSaveTrend = () => {
    if (saveMode === "new" && newGroupName.trim()) {
      const ng: TrendGroup = {
        id: `tg-${Date.now()}`,
        name: newGroupName.trim(),
        tags: [...activeTags],
        unit: "사용자",
        updatedAt: new Date().toISOString().slice(0, 10),
      }
      setTrendGroups(prev => [ng, ...prev])
      setShowSaveDialog(false)
      setSavedMsg(`"${ng.name}" 묶음이 생성되었습니다.`)
      setNewGroupName("")
    } else if (saveMode === "existing" && saveTargetId) {
      setTrendGroups(prev => prev.map(g => {
        if (g.id === saveTargetId) {
          const merged = Array.from(new Set([...g.tags, ...activeTags]))
          return { ...g, tags: merged, updatedAt: new Date().toISOString().slice(0, 10) }
        }
        return g
      }))
      const target = trendGroups.find(g => g.id === saveTargetId)
      setShowSaveDialog(false)
      setSavedMsg(`"${target?.name}" 묶음에 추가되었습니다.`)
    }
  }

  // --- Create new group in saved-trends ---
  const handleCreateGroup = () => {
    if (!newGroupFormName.trim()) return
    const tags = newGroupFormTags.split(",").map(t => t.trim()).filter(Boolean)
    const ng: TrendGroup = {
      id: `tg-${Date.now()}`,
      name: newGroupFormName.trim(),
      tags,
      unit: newGroupFormUnit.trim() || "사용자",
      updatedAt: new Date().toISOString().slice(0, 10),
    }
    setTrendGroups(prev => [ng, ...prev])
    setShowNewGroupDialog(false)
    setNewGroupFormName(""); setNewGroupFormUnit(""); setNewGroupFormTags("")
  }

  const deleteGroup = (id: string) => { setTrendGroups(prev => prev.filter(g => g.id !== id)) }

  // Tag trends
  const tagTrends = useMemo(() => activeTags.map(tag => ({ tag, ...generateTagTrend(tag) })), [activeTags])

  return (
    <>
      {/* ===== FAB Button ===== */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all cursor-pointer"
            size="icon"
          >
            <TrendingUp className="h-6 w-6" />
            <span className="sr-only">빠른 조회</span>
          </Button>
        )}

        {isOpen && activePanel === "menu" && (
          <Card className="w-64 shadow-2xl border-border animate-in fade-in slide-in-from-bottom-4 duration-200">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">빠른 조회</CardTitle>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 cursor-pointer" onClick={handleClose}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0 space-y-1">
              <button onClick={openTrendFresh} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-left cursor-pointer">
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <LineChart className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">태그 트렌드 조회</p>
                  <p className="text-xs text-muted-foreground">태그 입력 후 즉시 트렌드 확인</p>
                </div>
              </button>
              <button onClick={() => setActivePanel("saved-trends")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-left cursor-pointer">
                <div className="h-8 w-8 rounded-md bg-teal-500/10 flex items-center justify-center shrink-0">
                  <Bookmark className="h-4 w-4 text-teal-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">저장된 트렌드 묶음</p>
                  <p className="text-xs text-muted-foreground">사전 저장된 태그 그룹 조회</p>
                </div>
              </button>
              <button onClick={() => setActivePanel("dashboards")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-left cursor-pointer">
                <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                  <LayoutGrid className="h-4 w-4 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">커스텀 대시보드</p>
                  <p className="text-xs text-muted-foreground">저장된 대시보드 바로 열기</p>
                </div>
              </button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ===== 1) 태그 트렌드 조회 Dialog (Larger, with overlay/save) ===== */}
      <Dialog open={isOpen && activePanel === "trend"} onOpenChange={(open) => { if (!open) handleClose() }}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[92vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary" />
                태그 트렌드 조회
                {fromGroupName && <Badge variant="secondary" className="ml-2 text-xs font-normal">{fromGroupName}</Badge>}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {/* View mode toggle */}
                {activeTags.length >= 2 && (
                  <div className="flex items-center gap-1 border border-border rounded-md p-0.5">
                    <button
                      onClick={() => setViewMode("individual")}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer",
                        viewMode === "individual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      개별 보기
                    </button>
                    <button
                      onClick={() => setViewMode("overlay")}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer",
                        viewMode === "overlay" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      겹쳐 보기
                    </button>
                  </div>
                )}
                {/* Save button */}
                {activeTags.length > 0 && (
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs cursor-pointer" onClick={() => { setShowSaveDialog(true); setSaveMode("new"); setNewGroupName(""); setSaveTargetId("") }}>
                    <Save className="h-3.5 w-3.5" />
                    트렌드 저장
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Saved confirmation */}
          {savedMsg && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 shrink-0">
              <Check className="h-4 w-4" />
              {savedMsg}
              <button onClick={() => setSavedMsg("")} className="ml-auto text-green-500 hover:text-green-700 cursor-pointer"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}

          {/* Tag input */}
          <div className="space-y-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={tagInput}
                onChange={(e) => handleTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="태그 ID를 입력하세요 (예: TI-3001)"
                className="pl-9"
                autoFocus
              />
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-10 py-1 max-h-48 overflow-auto">
                  {suggestions.map(tag => (
                    <button key={tag} onClick={() => addTag(tag)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2 cursor-pointer">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono">{tag}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {activeTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {activeTags.map((tag, i) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1" style={{ borderLeft: `3px solid ${COLORS[i % COLORS.length]}` }}>
                    <span className="font-mono text-xs">{tag}</span>
                    <button onClick={() => removeTag(tag)} className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 cursor-pointer">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-muted-foreground cursor-pointer" onClick={() => setActiveTags([])}>
                  전체 삭제
                </Button>
              </div>
            )}
          </div>

          {/* Trend display area */}
          <ScrollArea className="flex-1 -mx-6 px-6 min-h-0">
            {activeTags.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">태그를 입력하여 트렌드를 확인하세요</p>
                <p className="text-xs text-muted-foreground max-w-sm">상단 검색창에 태그 ID를 입력하면 실시간 트렌드가 표시됩니다.</p>
              </div>
            ) : viewMode === "overlay" ? (
              /* ===== Overlay view ===== */
              <div className="space-y-3 pb-4">
                {/* Legend */}
                <div className="flex flex-wrap gap-3 px-1">
                  {tagTrends.map(({ tag, current, unit }, i) => (
                    <div key={tag} className="flex items-center gap-1.5 text-xs">
                      <div className="w-3 h-0.5 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-mono font-medium">{tag}</span>
                      <span className="text-muted-foreground">({current} {unit})</span>
                    </div>
                  ))}
                </div>
                <Card className="p-4">
                  <OverlayTrendChart tags={tagTrends} colors={COLORS} />
                </Card>
                {/* Summary table */}
                <div className="border border-border rounded-md overflow-hidden">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-muted/50 border-b border-border">
                      <th className="text-left px-3 py-2 font-medium">태그</th>
                      <th className="text-right px-3 py-2 font-medium">현재값</th>
                      <th className="text-right px-3 py-2 font-medium">단위</th>
                      <th className="text-right px-3 py-2 font-medium">High</th>
                      <th className="text-right px-3 py-2 font-medium">Low</th>
                      <th className="text-right px-3 py-2 font-medium">Min</th>
                      <th className="text-right px-3 py-2 font-medium">Max</th>
                    </tr></thead>
                    <tbody>
                      {tagTrends.map(({ tag, values, unit, high, low, current }, i) => (
                        <tr key={tag} className="border-b border-border/50 last:border-0">
                          <td className="px-3 py-1.5 font-mono font-medium flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            {tag}
                          </td>
                          <td className="px-3 py-1.5 text-right font-semibold">{current}</td>
                          <td className="px-3 py-1.5 text-right text-muted-foreground">{unit}</td>
                          <td className="px-3 py-1.5 text-right text-red-500">{high ?? "-"}</td>
                          <td className="px-3 py-1.5 text-right text-blue-500">{low ?? "-"}</td>
                          <td className="px-3 py-1.5 text-right">{Math.min(...values).toFixed(1)}</td>
                          <td className="px-3 py-1.5 text-right">{Math.max(...values).toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* ===== Individual view ===== */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pb-4">
                {tagTrends.map(({ tag, values, unit, high, low, current }, i) => {
                  const isViolation = (high !== null && current > high) || (low !== null && current < low)
                  return (
                    <Card key={tag} className={cn("overflow-hidden", isViolation && "border-red-200")}>
                      <div className="px-3 pt-2.5 pb-0 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="font-mono text-sm font-semibold">{tag}</span>
                          {isViolation && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Limit 초과</Badge>}
                        </div>
                        <span className="text-xs text-muted-foreground">[{unit}]</span>
                      </div>
                      <div className="px-2">
                        <TrendChart values={values} high={high} low={low} color={COLORS[i % COLORS.length]} isAlert={isViolation} height="h-28" />
                      </div>
                      <div className="px-3 pb-2.5 flex items-center justify-between text-xs border-t border-border/50 pt-1.5">
                        <div>
                          <span className="text-muted-foreground">현재 </span>
                          <span className={cn("font-semibold", isViolation ? "text-red-600" : "text-foreground")}>{current} {unit}</span>
                        </div>
                        {high !== null && <div><span className="text-muted-foreground">H </span><span className="text-red-500 font-medium">{high}</span></div>}
                        {low !== null && <div><span className="text-muted-foreground">L </span><span className="text-blue-500 font-medium">{low}</span></div>}
                        <div>
                          <span className="text-muted-foreground">범위 </span>
                          <span className="font-medium">{Math.min(...values).toFixed(1)} ~ {Math.max(...values).toFixed(1)}</span>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ===== Save Trend Dialog (sub) ===== */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5 text-primary" />
              트렌드 저장
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">현재 조회중인 {activeTags.length}개 태그를 트렌드 묶음으로 저장합니다.</p>
            <div className="flex flex-wrap gap-1">
              {activeTags.map(tag => <Badge key={tag} variant="secondary" className="font-mono text-xs">{tag}</Badge>)}
            </div>
            {/* Mode selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setSaveMode("new")}
                className={cn("flex-1 px-3 py-2.5 rounded-md border text-sm font-medium transition-colors cursor-pointer",
                  saveMode === "new" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <FolderPlus className="h-4 w-4 mb-1 mx-auto" />
                <div>새 묶음 만들기</div>
              </button>
              <button
                onClick={() => setSaveMode("existing")}
                className={cn("flex-1 px-3 py-2.5 rounded-md border text-sm font-medium transition-colors cursor-pointer",
                  saveMode === "existing" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <Bookmark className="h-4 w-4 mb-1 mx-auto" />
                <div>기존 묶음에 추가</div>
              </button>
            </div>
            {saveMode === "new" ? (
              <div className="space-y-2">
                <Label className="text-sm">묶음 이름</Label>
                <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="예: HCR Reactor 온도 트래킹" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm">대상 묶음 선택</Label>
                <div className="space-y-1.5 max-h-40 overflow-auto">
                  {trendGroups.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setSaveTargetId(g.id)}
                      className={cn("w-full text-left px-3 py-2 rounded-md border text-sm transition-colors cursor-pointer",
                        saveTargetId === g.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                      )}
                    >
                      <div className="font-medium">{g.name}</div>
                      <div className="text-xs text-muted-foreground">{g.tags.length}개 태그 | {g.unit}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)} className="cursor-pointer">취소</Button>
            <Button onClick={handleSaveTrend} disabled={(saveMode === "new" && !newGroupName.trim()) || (saveMode === "existing" && !saveTargetId)} className="cursor-pointer">
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== 2) 저장된 트렌드 묶음 Dialog ===== */}
      <Dialog open={isOpen && activePanel === "saved-trends"} onOpenChange={(open) => { if (!open) handleClose() }}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-teal-600" />
                저장된 트렌드 묶음
              </DialogTitle>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs cursor-pointer" onClick={() => setShowNewGroupDialog(true)}>
                <Plus className="h-3.5 w-3.5" />
                새 묶음 만들기
              </Button>
            </div>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6 min-h-0">
            {trendGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bookmark className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">저장된 트렌드 묶음이 없습니다</p>
                <p className="text-xs text-muted-foreground">위의 "새 묶음 만들기" 버튼으로 생성하세요.</p>
              </div>
            ) : (
              <div className="space-y-2 pr-2 pb-4">
                {trendGroups.map(group => (
                  <div key={group.id} className="relative group/item">
                    <button
                      onClick={() => openTrendWithTags(group.tags, group.name)}
                      className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium">{group.name}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">{group.unit}</Badge>
                        <span className="text-xs text-muted-foreground">{group.tags.length}개 태그</span>
                        <span className="text-xs text-muted-foreground ml-auto">{group.updatedAt}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {group.tags.map(tag => (
                          <span key={tag} className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                        ))}
                      </div>
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteGroup(group.id) }}
                      className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 transition-opacity h-7 w-7 rounded-md bg-background border border-border flex items-center justify-center hover:bg-red-50 hover:border-red-200 cursor-pointer"
                      title="삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* New group creation sub-dialog */}
      <Dialog open={showNewGroupDialog} onOpenChange={setShowNewGroupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-teal-600" />
              새 트렌드 묶음 만들기
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">묶음 이름</Label>
              <Input value={newGroupFormName} onChange={e => setNewGroupFormName(e.target.value)} placeholder="예: HCR Reactor 핵심 태그" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">공정 단위</Label>
              <Input value={newGroupFormUnit} onChange={e => setNewGroupFormUnit(e.target.value)} placeholder="예: HCR, VDU, CDU" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">태그 ID (쉼표로 구분)</Label>
              <Input value={newGroupFormTags} onChange={e => setNewGroupFormTags(e.target.value)} placeholder="예: TI-3001, TI-3002, PI-3001" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewGroupDialog(false)} className="cursor-pointer">취소</Button>
            <Button onClick={handleCreateGroup} disabled={!newGroupFormName.trim()} className="cursor-pointer">생성</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== 3) 커스텀 대시보드 Dialog ===== */}
      <Dialog open={isOpen && activePanel === "dashboards" && !selectedDashboard} onOpenChange={(open) => { if (!open) handleClose() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-amber-600" />
              커스텀 대시보드
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2 pr-2">
              {dashboards.map(db => (
                <button
                  key={db.id}
                  onClick={() => { setSelectedDashboard(db) }}
                  className="w-full text-left p-3 rounded-lg border border-border hover:border-amber-300 hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium group-hover:text-amber-700 transition-colors">{db.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-600 transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{db.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{db.unit}</Badge>
                    <span className="text-xs text-muted-foreground">위젯 {db.widgets}개</span>
                    <span className="text-xs text-muted-foreground ml-auto">{db.updatedAt}</span>
                  </div>
                </button>
              ))}
              {/* Link to full page */}
              <button
                onClick={() => { handleClose(); router.push("/operations/custom-dashboard") }}
                className="w-full text-center py-3 text-sm text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer"
              >
                커스텀 대시보드 관리 페이지로 이동
              </button>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ===== Dashboard Rendered View ===== */}
      <Dialog open={isOpen && activePanel === "dashboards" && !!selectedDashboard} onOpenChange={(open) => { if (!open) { setSelectedDashboard(null); handleClose() } }}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[92vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-amber-600" />
                {selectedDashboard?.name}
                <Badge variant="outline" className="ml-2 text-xs">{selectedDashboard?.unit}</Badge>
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs cursor-pointer" onClick={() => { handleClose(); router.push(`/operations/custom-dashboard?id=${selectedDashboard?.id}`) }}>
                  <Eye className="h-3.5 w-3.5" />
                  전체화면 보기
                </Button>
                <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => setSelectedDashboard(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6 min-h-0">
            {selectedDashboard && <DashboardRenderer dashboard={selectedDashboard} />}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ===== Dashboard Renderer =====
function DashboardRenderer({ dashboard }: { dashboard: DashboardItem }) {
  // Generate mock widgets
  const widgets = useMemo(() => {
    const seed = dashboard.id.charCodeAt(3) || 1
    const types: ("trend" | "kpi" | "table" | "gauge")[] = ["trend", "kpi", "trend", "gauge", "table", "trend", "kpi", "trend", "gauge", "table"]
    const tagPools: Record<string, string[]> = {
      "HCR": ["TI-3001", "TI-3002", "PI-3001", "FI-3001", "TI-3003", "TI-3004", "FI-3002", "PDI-3001"],
      "VDU": ["TI-2001", "TI-2002", "PI-2001", "LI-2001", "FI-2001", "TI-2003"],
      "전체": ["TI-3001", "PI-2001", "FI-1001", "TI-1001", "LI-2001", "TI-2002", "FI-3001", "PI-3001", "TI-3003", "FI-2001"],
    }
    const tags = tagPools[dashboard.unit] || tagPools["전체"]
    return Array.from({ length: dashboard.widgets }, (_, i) => ({
      id: `w-${i}`,
      type: types[i % types.length],
      tag: tags[i % tags.length],
      title: `${tags[i % tags.length]} ${types[i % types.length] === "trend" ? "트렌드" : types[i % types.length] === "kpi" ? "KPI" : types[i % types.length] === "table" ? "데이터 테이블" : "게이지"}`,
      ...generateTagTrend(tags[i % tags.length], 30),
    }))
  }, [dashboard])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pb-4">
      {widgets.map((w, idx) => {
        if (w.type === "kpi") {
          const isOver = w.high !== null && w.current > w.high
          return (
            <Card key={w.id} className="p-4">
              <p className="text-xs text-muted-foreground mb-1 font-mono">{w.tag}</p>
              <p className={cn("text-2xl font-bold tabular-nums", isOver ? "text-red-600" : "text-foreground")}>{w.current}</p>
              <p className="text-xs text-muted-foreground">{w.unit}</p>
              {w.high !== null && <p className="text-xs mt-1">H: <span className="text-red-500 font-medium">{w.high}</span></p>}
            </Card>
          )
        }
        if (w.type === "gauge") {
          const pct = w.high ? Math.min(100, (w.current / w.high) * 100) : 50
          const color = pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#22c55e"
          return (
            <Card key={w.id} className="p-4 flex flex-col items-center">
              <p className="text-xs text-muted-foreground mb-2 font-mono">{w.tag}</p>
              <svg viewBox="0 0 120 80" className="w-24 h-16">
                <path d="M 10 70 A 50 50 0 0 1 110 70" fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth="8" strokeLinecap="round" />
                <path d="M 10 70 A 50 50 0 0 1 110 70" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${pct * 1.57} 157`} />
                <text x="60" y="65" textAnchor="middle" fontSize="14" fontWeight="bold" fill="currentColor">{pct.toFixed(0)}%</text>
              </svg>
              <p className="text-xs text-muted-foreground mt-1">{w.current} {w.unit}</p>
            </Card>
          )
        }
        if (w.type === "table") {
          return (
            <Card key={w.id} className="col-span-2 p-3">
              <p className="text-xs font-medium mb-2">{w.title}</p>
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-1 px-2">시간</th>
                  <th className="text-right py-1 px-2">값</th>
                  <th className="text-right py-1 px-2">상태</th>
                </tr></thead>
                <tbody>
                  {w.values.slice(-5).map((v, i) => {
                    const isOver = w.high !== null && v > w.high
                    return (
                      <tr key={i} className="border-b border-border/30">
                        <td className="py-1 px-2 text-muted-foreground">{`${String(8 + i * 2).padStart(2, "0")}:00`}</td>
                        <td className="py-1 px-2 text-right font-mono">{v}</td>
                        <td className="py-1 px-2 text-right">
                          <span className={cn("inline-block w-2 h-2 rounded-full", isOver ? "bg-red-500" : "bg-green-500")} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>
          )
        }
        // trend (default, also spans 2 cols)
        const isViolation = w.high !== null && w.current > w.high
        return (
          <Card key={w.id} className={cn("col-span-2 overflow-hidden", isViolation && "border-red-200")}>
            <div className="px-3 pt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold">{w.tag}</span>
                {isViolation && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">초과</Badge>}
              </div>
              <span className="text-xs text-muted-foreground">{w.current} {w.unit}</span>
            </div>
            <div className="px-1">
              <TrendChart values={w.values} high={w.high} low={w.low} color={COLORS[idx % COLORS.length]} isAlert={isViolation} height="h-20" />
            </div>
          </Card>
        )
      })}
    </div>
  )
}
