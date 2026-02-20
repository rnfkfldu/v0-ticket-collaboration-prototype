"use client"

import { useState, useCallback, useMemo } from "react"
import { TrendingUp, LayoutGrid, LineChart, Plus, X, Search, Bookmark, Trash2, ChevronRight, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { AVAILABLE_TAGS } from "@/lib/process-data"

// --- Mock Saved Data ---
const SAVED_TREND_GROUPS = [
  {
    id: "tg-1",
    name: "HCR Reactor 온도 모니터링",
    tags: ["TI-3001", "TI-3002", "TI-3003", "TI-3004"],
    unit: "HCR",
    updatedAt: "2026-02-20",
  },
  {
    id: "tg-2",
    name: "VDU 감압탑 압력/온도",
    tags: ["TI-2001", "TI-2002", "PI-2001", "LI-2001"],
    unit: "VDU",
    updatedAt: "2026-02-18",
  },
  {
    id: "tg-3",
    name: "CDU Feed 유량 트래킹",
    tags: ["FI-1001", "TI-1001", "PI-1001"],
    unit: "CDU",
    updatedAt: "2026-02-15",
  },
  {
    id: "tg-4",
    name: "HCR 수소 계통",
    tags: ["FI-3001", "PI-3001", "TIC-3001"],
    unit: "HCR",
    updatedAt: "2026-02-14",
  },
]

const SAVED_DASHBOARDS = [
  {
    id: "db-1",
    name: "HCR 일일 운전 현황판",
    widgets: 8,
    unit: "HCR",
    updatedAt: "2026-02-19",
  },
  {
    id: "db-2",
    name: "VDU 에너지 효율 대시보드",
    widgets: 6,
    unit: "VDU",
    updatedAt: "2026-02-17",
  },
  {
    id: "db-3",
    name: "공정간 유틸리티 비교",
    widgets: 10,
    unit: "전체",
    updatedAt: "2026-02-16",
  },
]

// Generate deterministic mock trend for a tag
function generateTagTrend(tagId: string, points = 48) {
  const seed = tagId.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const rand = (s: number) => ((Math.sin(s) * 10000) % 1 + 1) % 1
  const prefix = tagId.substring(0, 2)
  let base: number, range: number, unit: string, high: number | null, low: number | null
  if (prefix === "TI") {
    base = 280 + (seed % 120); range = 15; unit = "deg.C"; high = base + 20; low = base - 30
  } else if (prefix === "PI") {
    base = 8 + (seed % 20); range = 2; unit = "kg/cm2"; high = base + 4; low = base - 2
  } else if (prefix === "FI") {
    base = 500 + (seed % 1000); range = 50; unit = "m3/h"; high = base + 80; low = base - 80
  } else if (prefix === "LI") {
    base = 50; range = 10; unit = "%"; high = 80; low = 20
  } else {
    base = 100 + (seed % 200); range = 20; unit = ""; high = null; low = null
  }
  const values = Array.from({ length: points }, (_, i) => +(base + (rand(seed + i * 7) * range * 2 - range)).toFixed(1))
  return { values, unit, high, low, current: values[values.length - 1] }
}

function MiniTrendChart({ values, high, low, color = "#6366f1", isAlert = false }: {
  values: number[]; high: number | null; low: number | null; color?: string; isAlert?: boolean
}) {
  const allVals = [...values, ...(high ? [high] : []), ...(low ? [low] : [])]
  const maxV = Math.max(...allVals) * 1.02
  const minV = Math.min(...allVals) * 0.98
  const range = maxV - minV || 1
  const W = 360, H = 100
  const pad = { t: 8, b: 8, l: 4, r: 4 }
  const cw = W - pad.l - pad.r
  const ch = H - pad.t - pad.b
  const toX = (i: number) => pad.l + (i / (values.length - 1)) * cw
  const toY = (v: number) => pad.t + (1 - (v - minV) / range) * ch

  const pathD = values.reduce((acc, v, i) => {
    const x = toX(i), y = toY(v)
    if (i === 0) return `M ${x} ${y}`
    const px = toX(i - 1), py = toY(values[i - 1])
    const cpx = (px + x) / 2
    return `${acc} C ${cpx} ${py}, ${cpx} ${y}, ${x} ${y}`
  }, "")

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {high && <line x1={pad.l} y1={toY(high)} x2={W - pad.r} y2={toY(high)} stroke="#f87171" strokeWidth="1" strokeDasharray="4 2" />}
      {low && <line x1={pad.l} y1={toY(low)} x2={W - pad.r} y2={toY(low)} stroke="#60a5fa" strokeWidth="1" strokeDasharray="4 2" />}
      <path d={`${pathD} L ${toX(values.length - 1)} ${pad.t + ch} L ${toX(0)} ${pad.t + ch} Z`} fill={color} opacity="0.06" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={toX(values.length - 1)} cy={toY(values[values.length - 1])} r={3} fill={isAlert ? "#ef4444" : color} stroke="white" strokeWidth="1.5" />
    </svg>
  )
}

export function FloatingQuickAccess() {
  const [isOpen, setIsOpen] = useState(false)
  const [activePanel, setActivePanel] = useState<"menu" | "trend" | "saved-trends" | "dashboards">("menu")

  // Trend viewer state
  const [tagInput, setTagInput] = useState("")
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Saved trend groups
  const [selectedTrendGroup, setSelectedTrendGroup] = useState<typeof SAVED_TREND_GROUPS[0] | null>(null)

  // Dashboard
  const [selectedDashboard, setSelectedDashboard] = useState<typeof SAVED_DASHBOARDS[0] | null>(null)

  // All available tags flattened
  const allTags = useMemo(() => {
    const tags: string[] = []
    Object.values(AVAILABLE_TAGS).forEach(unitTags => {
      unitTags.forEach(tag => {
        if (!tags.includes(tag)) tags.push(tag)
      })
    })
    return tags.sort()
  }, [])

  const handleTagInput = useCallback((value: string) => {
    setTagInput(value)
    if (value.length > 0) {
      const filtered = allTags.filter(t =>
        t.toLowerCase().includes(value.toLowerCase()) && !activeTags.includes(t)
      ).slice(0, 6)
      setSuggestions(filtered)
    } else {
      setSuggestions([])
    }
  }, [allTags, activeTags])

  const addTag = useCallback((tag: string) => {
    if (!activeTags.includes(tag)) {
      setActiveTags(prev => [...prev, tag])
    }
    setTagInput("")
    setSuggestions([])
  }, [activeTags])

  const removeTag = useCallback((tag: string) => {
    setActiveTags(prev => prev.filter(t => t !== tag))
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      const exact = allTags.find(t => t.toLowerCase() === tagInput.trim().toLowerCase())
      if (exact) {
        addTag(exact)
      } else if (suggestions.length > 0) {
        addTag(suggestions[0])
      }
    }
  }, [tagInput, suggestions, allTags, addTag])

  const openPanel = (panel: "trend" | "saved-trends" | "dashboards") => {
    setActivePanel(panel)
  }

  const handleClose = () => {
    setIsOpen(false)
    setActivePanel("menu")
    setSelectedTrendGroup(null)
    setSelectedDashboard(null)
  }

  const openTrendGroup = (group: typeof SAVED_TREND_GROUPS[0]) => {
    setSelectedTrendGroup(group)
    setActiveTags(group.tags)
    setActivePanel("trend")
  }

  // Tag trends (memoized)
  const tagTrends = useMemo(() => {
    return activeTags.map(tag => ({
      tag,
      ...generateTagTrend(tag),
    }))
  }, [activeTags])

  const colors = ["#6366f1", "#0d9488", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#f97316", "#10b981"]

  return (
    <>
      {/* FAB Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
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
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleClose}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0 space-y-1">
              <button
                onClick={() => openPanel("trend")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-left cursor-pointer"
              >
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <LineChart className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">태그 트렌드 조회</p>
                  <p className="text-xs text-muted-foreground">태그 입력 후 즉시 트렌드 확인</p>
                </div>
              </button>
              <button
                onClick={() => openPanel("saved-trends")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-left cursor-pointer"
              >
                <div className="h-8 w-8 rounded-md bg-teal-500/10 flex items-center justify-center shrink-0">
                  <Bookmark className="h-4 w-4 text-teal-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">저장된 트렌드 묶음</p>
                  <p className="text-xs text-muted-foreground">사전 저장된 태그 그룹 조회</p>
                </div>
              </button>
              <button
                onClick={() => openPanel("dashboards")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors text-left cursor-pointer"
              >
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

      {/* ===== 1) 태그 트렌드 조회 Dialog ===== */}
      <Dialog open={isOpen && activePanel === "trend"} onOpenChange={(open) => { if (!open) handleClose() }}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-primary" />
              태그 트렌드 조회
              {selectedTrendGroup && (
                <Badge variant="secondary" className="ml-2 text-xs font-normal">{selectedTrendGroup.name}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Tag input */}
          <div className="space-y-2">
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
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-10 py-1">
                  {suggestions.map(tag => (
                    <button
                      key={tag}
                      onClick={() => addTag(tag)}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2 cursor-pointer"
                    >
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
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 pr-1"
                    style={{ borderLeft: `3px solid ${colors[i % colors.length]}` }}
                  >
                    <span className="font-mono text-xs">{tag}</span>
                    <button onClick={() => removeTag(tag)} className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 cursor-pointer">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-muted-foreground" onClick={() => setActiveTags([])}>
                  전체 삭제
                </Button>
              </div>
            )}
          </div>

          {/* Trend charts */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            {activeTags.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">태그를 입력하여 트렌드를 확인하세요</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  상단 검색창에 태그 ID를 입력하면 실시간 트렌드가 표시됩니다.
                  여러 태그를 동시에 조회할 수 있습니다.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pb-4">
                {tagTrends.map(({ tag, values, unit, high, low, current }, i) => {
                  const isViolation = (high !== null && current > high) || (low !== null && current < low)
                  return (
                    <Card key={tag} className={cn(
                      "overflow-hidden",
                      isViolation && "border-red-200"
                    )}>
                      <div className="px-3 pt-2.5 pb-0 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                          <span className="font-mono text-sm font-semibold">{tag}</span>
                          {isViolation && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Limit 초과</Badge>}
                        </div>
                        <span className="text-xs text-muted-foreground">[{unit}]</span>
                      </div>
                      <div className="px-2 h-20">
                        <MiniTrendChart values={values} high={high} low={low} color={colors[i % colors.length]} isAlert={isViolation} />
                      </div>
                      <div className="px-3 pb-2.5 flex items-center justify-between text-xs border-t border-border/50 pt-1.5">
                        <div>
                          <span className="text-muted-foreground">현재 </span>
                          <span className={cn("font-semibold", isViolation ? "text-red-600" : "text-foreground")}>
                            {current} {unit}
                          </span>
                        </div>
                        {high !== null && (
                          <div><span className="text-muted-foreground">H </span><span className="text-red-500 font-medium">{high}</span></div>
                        )}
                        {low !== null && (
                          <div><span className="text-muted-foreground">L </span><span className="text-blue-500 font-medium">{low}</span></div>
                        )}
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

      {/* ===== 2) 저장된 트렌드 묶음 Dialog ===== */}
      <Dialog open={isOpen && activePanel === "saved-trends"} onOpenChange={(open) => { if (!open) handleClose() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-teal-600" />
              저장된 트렌드 묶음
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2 pr-2">
              {SAVED_TREND_GROUPS.map(group => (
                <button
                  key={group.id}
                  onClick={() => openTrendGroup(group)}
                  className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">{group.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ===== 3) 커스텀 대시보드 Dialog ===== */}
      <Dialog open={isOpen && activePanel === "dashboards"} onOpenChange={(open) => { if (!open) handleClose() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-amber-600" />
              커스텀 대시보드
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2 pr-2">
              {SAVED_DASHBOARDS.map(db => (
                <button
                  key={db.id}
                  onClick={() => {
                    setSelectedDashboard(db)
                    // In production this would navigate to the dashboard
                    alert(`"${db.name}" 대시보드를 열었습니다.`)
                    handleClose()
                  }}
                  className="w-full text-left p-3 rounded-lg border border-border hover:border-amber-300 hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium group-hover:text-amber-700 transition-colors">{db.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-600 transition-colors" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{db.unit}</Badge>
                    <span className="text-xs text-muted-foreground">위젯 {db.widgets}개</span>
                    <span className="text-xs text-muted-foreground ml-auto">{db.updatedAt}</span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
