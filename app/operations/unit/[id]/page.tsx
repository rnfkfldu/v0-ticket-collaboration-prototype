"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  ExternalLink,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Gauge,
  Thermometer,
  Droplets,
  Wind,
  BarChart3,
  FileText,
  Cpu,
  Search,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  GitCompareArrows,
  Radio,
  TrendingDown,
  Zap,
  Signal,
  Waves,
  CircleDot,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ALL_PROCESSES } from "@/lib/user-context"
import Link from "next/link"

// CDU process flow nodes
const CDU_NODES = [
  { id: "feed", label: "Crude Feed", x: 60, y: 180, w: 100, h: 50, type: "feed" },
  { id: "desalter", label: "Desalter", x: 200, y: 180, w: 90, h: 50, type: "equipment" },
  { id: "furnace", label: "Furnace", x: 340, y: 180, w: 90, h: 50, type: "equipment" },
  { id: "column", label: "CDU Column", x: 490, y: 100, w: 100, h: 160, type: "column" },
  { id: "ovhd", label: "OVHD", x: 650, y: 50, w: 80, h: 35, type: "product" },
  { id: "lk", label: "LK", x: 650, y: 100, w: 80, h: 35, type: "product" },
  { id: "hk", label: "HK", x: 650, y: 150, w: 80, h: 35, type: "product" },
  { id: "lgo", label: "LGO", x: 650, y: 200, w: 80, h: 35, type: "product" },
  { id: "hgo", label: "HGO", x: 650, y: 250, w: 80, h: 35, type: "product" },
  { id: "ar", label: "AR", x: 650, y: 300, w: 80, h: 35, type: "product" },
  { id: "vdu", label: "VDU", x: 780, y: 300, w: 80, h: 35, type: "downstream" },
]

const CDU_CONNECTIONS = [
  { from: "feed", to: "desalter" },
  { from: "desalter", to: "furnace" },
  { from: "furnace", to: "column" },
  { from: "column", to: "ovhd", label: "0 BD" },
  { from: "column", to: "lk", label: "0 BD" },
  { from: "column", to: "hk", label: "0 BD" },
  { from: "column", to: "lgo", label: "0 BD" },
  { from: "column", to: "hgo", label: "0 BD" },
  { from: "column", to: "ar", label: "0 BD" },
  { from: "ar", to: "vdu" },
]

// Generate mock variables
function generateVariables(unitName: string) {
  const hash = unitName.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return [
    { tag: `TI-${1000 + (hash % 100)}`, name: "Column Top Temp", value: (120 + (hash % 30)).toFixed(1), unit: "C", guide: (125).toFixed(1), status: hash % 5 === 0 ? "warning" : "normal" },
    { tag: `PI-${1100 + (hash % 100)}`, name: "Column Pressure", value: (1.2 + (hash % 5) * 0.1).toFixed(2), unit: "kg/cm2", guide: "1.50", status: "normal" },
    { tag: `FI-${1200 + (hash % 100)}`, name: "Feed Flow", value: (330 + (hash % 40)).toFixed(0), unit: "m3/h", guide: "350", status: "normal" },
    { tag: `TI-${1300 + (hash % 100)}`, name: "Furnace Outlet", value: (360 + (hash % 15)).toFixed(1), unit: "C", guide: "365.0", status: hash % 3 === 0 ? "warning" : "normal" },
    { tag: `FI-${1400 + (hash % 100)}`, name: "Reflux Flow", value: (85 + (hash % 20)).toFixed(1), unit: "m3/h", guide: "90.0", status: "normal" },
    { tag: `TI-${1500 + (hash % 100)}`, name: "OVHD Temp", value: (105 + (hash % 15)).toFixed(1), unit: "C", guide: "110.0", status: "normal" },
    { tag: `LI-${1600 + (hash % 100)}`, name: "Column Level", value: (48 + (hash % 10)).toFixed(1), unit: "%", guide: "50.0", status: "normal" },
    { tag: `AI-${1700 + (hash % 100)}`, name: "AR Flash Point", value: (68 + (hash % 12)).toFixed(1), unit: "C", guide: "65.0", status: hash % 4 === 0 ? "warning" : "normal" },
  ]
}

// Feed/product data
function generateFeedData(unitName: string) {
  const hash = unitName.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return {
    feeds: [
      { name: unitName, subLabel: "Feed", actual: (330000 + hash * 100) , capacity: 330000, percentage: 100 },
    ],
    products: [
      { label: "LPG", bd: 7216, pct: 2.2, color: "#ef4444" },
      { label: "WSR", bd: 59460, pct: 18.0, color: "#3b82f6" },
      { label: "LK", bd: 36059, pct: 10.9, color: "#eab308" },
      { label: "HK", bd: 22533, pct: 6.8, color: "#f97316" },
      { label: "LGO", bd: 34611, pct: 10.5, color: "#8b5cf6" },
      { label: "HGO", bd: 42855, pct: 13.0, color: "#6366f1" },
      { label: "AR", bd: 127762, pct: 38.7, color: "#64748b" },
    ]
  }
}

// ================================================================
// Anomaly Detection Sub-Component
// ================================================================

// Mock data for similar dates
function generateSimilarDates(baseDate: string) {
  const dates = []
  const base = new Date(baseDate)
  for (let i = 1; i <= 20; i++) {
    const d = new Date(base)
    d.setDate(d.getDate() - i)
    const sim = Math.max(75, 100 - i * 1.2 - Math.random() * 3)
    dates.push({ date: d.toISOString().slice(0, 10).replace(/-/g, "."), similarity: Math.round(sim) })
  }
  return dates.sort((a, b) => b.similarity - a.similarity)
}

// Mock anomaly tags for similarity comparison
function generateAnomalyTags(unitName: string) {
  const hash = unitName.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const tags = [
    { tag: "Desalter Effluent Water TOC", unit: "mg/L", min: 124.17, max: 221.15, refValue: 201.47, opRange: "~ 250", status: "danger" as const },
    { tag: "Stabilizer TOP P", unit: "kgf/cm\u00b2", min: 11.3, max: 11.8, refValue: 11.68, opRange: "", status: "danger" as const },
    { tag: "Stabilizer BTM P", unit: "kgf/cm\u00b2", min: 11.55, max: 12.06, refValue: 11.92, opRange: "", status: "danger" as const },
    { tag: `72F-101 In T`, unit: "\u00b0C", min: 265.74, max: 273.72, refValue: 269.37, opRange: "", status: "danger" as const },
    { tag: "Top P", unit: "kgf/cm\u00b2", min: 1.11, max: 1.2, refValue: 1.2, opRange: "", status: "warning" as const },
    { tag: "Top T(A)", unit: "\u00b0C", min: 107.03, max: 115.25, refValue: 110.64, opRange: "107 ~", status: "warning" as const },
    { tag: "OVHD Receiver T", unit: "\u00b0C", min: 46.68, max: 49.9, refValue: 47.1, opRange: "", status: "warning" as const },
    { tag: "Wash Oil Flow Rate", unit: "kl/hr", min: 164.33, max: 201.99, refValue: 173, opRange: "", status: "warning" as const },
    { tag: "Cold Reflux Rate", unit: "kl/hr", min: 629.57, max: 650.93, refValue: 645.15, opRange: "", status: "warning" as const },
    { tag: "Feed Flow Rate", unit: "m\u00b3/h", min: 328.5, max: 345.2, refValue: 338.7, opRange: "300~360", status: "normal" as const },
    { tag: "Column Bottom Temp", unit: "\u00b0C", min: 348.2, max: 355.1, refValue: 351.8, opRange: "345~360", status: "normal" as const },
    { tag: "Furnace Outlet Temp", unit: "\u00b0C", min: 362.1, max: 368.5, refValue: 365.3, opRange: "360~370", status: "normal" as const },
    { tag: "Reflux Drum Level", unit: "%", min: 45.2, max: 52.8, refValue: 49.1, opRange: "40~60", status: "normal" as const },
    { tag: "Steam Flow", unit: "ton/hr", min: 12.3, max: 15.1, refValue: 13.8, opRange: "10~18", status: "normal" as const },
  ]
  // Shift values slightly based on unit
  return tags.map(t => ({ ...t, min: +(t.min + (hash % 5) * 0.1).toFixed(2), max: +(t.max + (hash % 3) * 0.1).toFixed(2) }))
}

// Mock instrument error data
function generateInstrumentErrors(unitName: string) {
  const hash = unitName.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return [
    { tag: `TI-${1000 + hash % 80}A`, name: "Column Tray #5 Temp", type: "flatline" as const, duration: "4h 32m", severity: "danger" as const, value: "142.3\u00b0C", desc: "4시간 이상 동일값 유지 - 계기 고착 의심" },
    { tag: `PI-${1100 + hash % 60}B`, name: "Overhead Drum Press", type: "peak" as const, duration: "순간", severity: "danger" as const, value: "3.8 bar", desc: "정상범위 대비 300% 순간 Peak 감지" },
    { tag: `FI-${1200 + hash % 70}`, name: "Reflux Flow", type: "oscillation" as const, duration: "2h 15m", severity: "warning" as const, value: "88.5 m\u00b3/h", desc: "진동폭 증가 (Hunting) - 밸브 점검 필요" },
    { tag: `TI-${1300 + hash % 50}C`, name: "Reboiler Outlet Temp", type: "peak" as const, duration: "3m", severity: "warning" as const, value: "385.2\u00b0C", desc: "비정상 Peak 2회 감지 (최근 1시간)" },
    { tag: `LI-${1600 + hash % 40}`, name: "Bottom Level", type: "flatline" as const, duration: "1h 48m", severity: "warning" as const, value: "52.0%", desc: "값 변화 없음 - 센서 점검 권장" },
    { tag: `FI-${1400 + hash % 90}A`, name: "Steam Flow Meter", type: "oscillation" as const, duration: "5h 20m", severity: "warning" as const, value: "14.2 ton/hr", desc: "진동 주기 변화 - 계기 보정 필요" },
    { tag: `TI-${1500 + hash % 30}`, name: "OVHD Vapor Temp", type: "peak" as const, duration: "12m", severity: "normal" as const, value: "108.5\u00b0C", desc: "경미한 이상 Peak 1회" },
  ]
}

// Mock DR drift data
function generateDRDriftData(unitName: string) {
  const hash = unitName.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return [
    { tag: "Feed Flow (RTDB)", drTag: "Feed Flow (DR)", unit: "m\u00b3/h", rtdbValue: 338.7, drValue: 335.2, delta: 3.5, trend: "increasing" as const, severity: "danger" as const, daysActive: 12, desc: "RTDB-DR 편차가 12일간 지속 확대 중" },
    { tag: "Product S-Content", drTag: "Product S-Content (DR)", unit: "ppm", rtdbValue: 42.8, drValue: 38.1, delta: 4.7, trend: "increasing" as const, severity: "danger" as const, daysActive: 8, desc: "8일간 편차 4.7ppm으로 확대" },
    { tag: "Naphtha Yield", drTag: "Naphtha Yield (DR)", unit: "%", rtdbValue: 18.2, drValue: 17.5, delta: 0.7, trend: "increasing" as const, severity: "warning" as const, daysActive: 5, desc: "수율 편차 점진적 증가 추세" },
    { tag: "Column Top Temp", drTag: "Column Top Temp (DR)", unit: "\u00b0C", rtdbValue: 122.5, drValue: 121.8, delta: 0.7, trend: "stable" as const, severity: "warning" as const, daysActive: 3, desc: "온도 편차 안정적이나 관찰 필요" },
    { tag: "Furnace Duty", drTag: "Furnace Duty (DR)", unit: "Gcal/h", rtdbValue: 85.3, drValue: 84.9, delta: 0.4, trend: "stable" as const, severity: "normal" as const, daysActive: 1, desc: "정상 범위" },
    { tag: "Column Press", drTag: "Column Press (DR)", unit: "bar", rtdbValue: 1.52, drValue: 1.51, delta: 0.01, trend: "stable" as const, severity: "normal" as const, daysActive: 0, desc: "정상 범위" },
    { tag: "AR Flash Point", drTag: "AR Flash Point (DR)", unit: "\u00b0C", rtdbValue: 68.5, drValue: 68.2, delta: 0.3, trend: "stable" as const, severity: "normal" as const, daysActive: 0, desc: "정상 범위" },
  ]
}

type AnomalyView = "categories" | "similarity" | "instrument" | "drift"

function AnomalyDetectionContent({ unitName, variables }: { unitName: string; variables: ReturnType<typeof generateVariables> }) {
  const [view, setView] = useState<AnomalyView>("categories")
  const [selectedDate] = useState("2026-02-18")
  const [variableTab, setVariableTab] = useState<"main" | "sub">("main")
  const [searchQ, setSearchQ] = useState("")

  const similarDates = useMemo(() => generateSimilarDates(selectedDate), [selectedDate])
  const anomalyTags = useMemo(() => generateAnomalyTags(unitName), [unitName])
  const instrumentErrors = useMemo(() => generateInstrumentErrors(unitName), [unitName])
  const drDriftData = useMemo(() => generateDRDriftData(unitName), [unitName])

  const dangerCount = anomalyTags.filter(t => t.status === "danger").length
  const warningCount2 = anomalyTags.filter(t => t.status === "warning").length
  const normalCount = anomalyTags.filter(t => t.status === "normal").length

  const instDanger = instrumentErrors.filter(e => e.severity === "danger").length
  const instWarning = instrumentErrors.filter(e => e.severity === "warning").length
  const driftDanger = drDriftData.filter(d => d.severity === "danger").length
  const driftWarning = drDriftData.filter(d => d.severity === "warning").length

  // ===== Categories Landing =====
  if (view === "categories") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold">Anomaly Detection</h2>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Category 1: Similar Operation Comparison */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer group border-l-4 border-l-teal-500" onClick={() => setView("similarity")}>
            <CardContent className="py-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center">
                  <GitCompareArrows className="h-5 w-5 text-teal-600" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">유사운전시점 비교</h3>
                <p className="text-xs text-muted-foreground mt-1">과거 유사 운전 데이터 대비 이상 변수 탐지</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {dangerCount > 0 && <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Danger {dangerCount}</Badge>}
                {warningCount2 > 0 && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">Warning {warningCount2}</Badge>}
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Normal {normalCount}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">분석 태그: <span className="font-medium text-foreground">{anomalyTags.length}건</span></div>
            </CardContent>
          </Card>

          {/* Category 2: Instrument Error */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer group border-l-4 border-l-blue-500" onClick={() => setView("instrument")}>
            <CardContent className="py-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Radio className="h-5 w-5 text-blue-600" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">계기 오류 탐지</h3>
                <p className="text-xs text-muted-foreground mt-1">Peak, Flatline, Oscillation 등 계기 이상 감지</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {instDanger > 0 && <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Peak/Flatline {instDanger}</Badge>}
                {instWarning > 0 && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">Oscillation {instWarning}</Badge>}
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="p-1.5 bg-muted/50 rounded text-center">
                  <Zap className="h-3 w-3 mx-auto mb-0.5 text-red-500" />
                  <span>Peak <strong>{instrumentErrors.filter(e=>e.type==="peak").length}</strong></span>
                </div>
                <div className="p-1.5 bg-muted/50 rounded text-center">
                  <Signal className="h-3 w-3 mx-auto mb-0.5 text-orange-500" />
                  <span>Flatline <strong>{instrumentErrors.filter(e=>e.type==="flatline").length}</strong></span>
                </div>
                <div className="p-1.5 bg-muted/50 rounded text-center">
                  <Waves className="h-3 w-3 mx-auto mb-0.5 text-blue-500" />
                  <span>Hunting <strong>{instrumentErrors.filter(e=>e.type==="oscillation").length}</strong></span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category 3: DR Drift */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer group border-l-4 border-l-purple-500" onClick={() => setView("drift")}>
            <CardContent className="py-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-purple-600" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">DR 데이터 대비 Drift 감지</h3>
                <p className="text-xs text-muted-foreground mt-1">RTDB vs DR 수치 편차 점진적 확대 탐지</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {driftDanger > 0 && <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Drift 확대 {driftDanger}</Badge>}
                {driftWarning > 0 && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">관찰 필요 {driftWarning}</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">모니터링 항목: <span className="font-medium text-foreground">{drDriftData.length}건</span></div>
            </CardContent>
          </Card>
        </div>

        {/* Summary overview */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="text-sm">Danger <strong className="text-red-600">{dangerCount + instDanger + driftDanger}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-sm">Warning <strong className="text-amber-600">{warningCount2 + instWarning + driftWarning}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="text-sm">Normal <strong className="text-green-600">{normalCount + instrumentErrors.filter(e=>e.severity==="normal").length + drDriftData.filter(d=>d.severity==="normal").length}</strong></span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">마지막 분석: 2026-02-25 07:00</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ===== Detail View 1: Similar Operation Comparison =====
  if (view === "similarity") {
    const filteredTags = anomalyTags.filter(t => !searchQ || t.tag.toLowerCase().includes(searchQ.toLowerCase()))
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1 -ml-2 h-7" onClick={() => setView("categories")}>
            <ArrowLeft className="h-3.5 w-3.5" /> 이상징후 카테고리
          </Button>
        </div>

        <h2 className="text-base font-bold flex items-center gap-2">
          <GitCompareArrows className="h-5 w-5 text-teal-600" />
          유사운전시점 비교
        </h2>

        {/* Date range and reference date */}
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">유사 날짜</span>
                <select className="h-8 text-xs border rounded px-2">
                  <option>유사 날짜</option>
                </select>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Exclude: 2026-02-17 ~ 2026-02-23</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">기준 날짜</span>
                <input type="date" defaultValue="2026-02-18" className="h-8 w-36 text-xs border rounded px-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Similar date chips */}
        <div className="flex flex-wrap gap-2">
          {similarDates.map((d, i) => {
            const color = d.similarity >= 90 ? "bg-teal-500 text-white" : d.similarity >= 85 ? "bg-teal-400 text-white" : d.similarity >= 80 ? "bg-teal-300 text-teal-900" : "bg-teal-200 text-teal-800"
            return (
              <button key={i} className={cn("px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-transform hover:scale-105", color)}>
                {d.date} ({d.similarity}%)
                <span className="text-[10px] opacity-70">{'\u24D8'}</span>
              </button>
            )
          })}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="py-3 flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-primary" />
              <div>
                <p className="text-[11px] text-muted-foreground leading-tight">{'선택 변수 (주요변수 '}{anomalyTags.length}{'건, 세부변수 0건)'}</p>
                <p className="text-xl font-bold">{anomalyTags.length} <span className="text-xs font-normal text-muted-foreground">건</span></p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-[11px] text-muted-foreground">Normal</p>
                <p className="text-xl font-bold text-green-600">{normalCount} <span className="text-xs font-normal text-muted-foreground">건</span></p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-[11px] text-muted-foreground">Warning</p>
                <p className="text-xl font-bold text-amber-600">{warningCount2} <span className="text-xs font-normal text-muted-foreground">건</span></p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-[11px] text-muted-foreground">Danger</p>
                <p className="text-xl font-bold text-red-600">{dangerCount} <span className="text-xs font-normal text-muted-foreground">건</span></p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs + search + table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-0 border-b">
              {[{k: "main" as const, l: "주요변수"}, {k: "sub" as const, l: "세부변수"}].map(t => (
                <button key={t.k} onClick={() => setVariableTab(t.k)}
                  className={cn("px-4 py-2 text-xs font-medium border-b-2 -mb-[1px] transition-colors",
                    variableTab === t.k ? "border-teal-500 text-teal-700" : "border-transparent text-muted-foreground hover:text-foreground")}>
                  {t.l}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="text-xs h-7 gap-1 text-teal-600 border-teal-300">태그 선택/제외</Button>
          </div>

          <div className="mb-3">
            <div className="relative w-64">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="Search..."
                className="h-8 w-full text-xs border rounded pl-8 pr-3"
              />
            </div>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground w-10">상태</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Tag 이어</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground w-20">단위</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground w-16">Min</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground w-16">Max</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground w-20">기준날짜값</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground w-24">OP.유효값 범위</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground" style={{minWidth: 300}}>이상징후 시각화</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTags.map((tag, i) => {
                    // Generate boxplot-style visualization
                    const statusColor = tag.status === "danger" ? "bg-red-500" : tag.status === "warning" ? "bg-amber-500" : "bg-green-500"
                    // Simulated scatter for visualization
                    const points = Array.from({ length: 20 }, (_, j) => {
                      const seed = (i * 31 + j * 17) % 100
                      return 10 + seed * 0.8
                    })
                    const boxL = Math.min(...points.slice(5, 15))
                    const boxR = Math.max(...points.slice(5, 15))
                    const med = (boxL + boxR) / 2

                    return (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-2.5">
                          <div className={cn("h-3 w-3 rounded-full", statusColor)} />
                        </td>
                        <td className="px-3 py-2.5 font-medium">{tag.tag}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{tag.unit}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{tag.min}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{tag.max}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{tag.refValue}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{tag.opRange}</td>
                        <td className="px-3 py-2.5">
                          {/* Boxplot-style SVG visualization */}
                          <svg width="280" height="24" viewBox="0 0 280 24">
                            {/* Scatter points */}
                            {points.map((x, j) => {
                              const px = (x / 100) * 260 + 10
                              const py = 12 + ((j % 3) - 1) * 3
                              const isOutlier = j < 3 || j > 17
                              return (
                                <circle key={j} cx={px} cy={py} r={isOutlier ? 3 : 2.5}
                                  fill={isOutlier ? (tag.status === "danger" ? "#ef4444" : tag.status === "warning" ? "#f59e0b" : "#3b82f6") : "#14b8a6"}
                                  opacity={isOutlier ? 0.7 : 0.5}
                                  stroke={isOutlier ? "none" : "none"} />
                              )
                            })}
                            {/* Box */}
                            <rect x={(boxL/100)*260+10} y={4} width={((boxR-boxL)/100)*260} height={16} rx={2}
                              fill="none" stroke="#14b8a6" strokeWidth={1.5} opacity={0.8} />
                            {/* Median line */}
                            <line x1={(med/100)*260+10} y1={4} x2={(med/100)*260+10} y2={20} stroke="#0d9488" strokeWidth={2} />
                          </svg>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // ===== Detail View 2: Instrument Error Detection =====
  if (view === "instrument") {
    const typeConfig = {
      peak: { icon: Zap, label: "갑작스런 Peak", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
      flatline: { icon: Signal, label: "계기 고착 (Flatline)", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
      oscillation: { icon: Waves, label: "Oscillation 증가 (Hunting)", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    }
    const grouped = { peak: instrumentErrors.filter(e => e.type === "peak"), flatline: instrumentErrors.filter(e => e.type === "flatline"), oscillation: instrumentErrors.filter(e => e.type === "oscillation") }

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1 -ml-2 h-7" onClick={() => setView("categories")}>
            <ArrowLeft className="h-3.5 w-3.5" /> 이상징후 카테고리
          </Button>
        </div>
        <h2 className="text-base font-bold flex items-center gap-2">
          <Radio className="h-5 w-5 text-blue-600" />
          계기 오류 탐지
        </h2>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {(["peak", "flatline", "oscillation"] as const).map(type => {
            const cfg = typeConfig[type]
            const Icon = cfg.icon
            const items = grouped[type]
            return (
              <Card key={type} className={cn("border-l-4", type === "peak" ? "border-l-red-500" : type === "flatline" ? "border-l-orange-500" : "border-l-blue-500")}>
                <CardContent className="py-4 flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", cfg.bg)}>
                    <Icon className={cn("h-5 w-5", cfg.color)} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{cfg.label}</p>
                    <p className="text-xl font-bold">{items.length}<span className="text-xs font-normal text-muted-foreground ml-1">건</span></p>
                  </div>
                  <div className="ml-auto flex gap-1">
                    {items.filter(e => e.severity === "danger").length > 0 && <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px]">{items.filter(e=>e.severity==="danger").length}</Badge>}
                    {items.filter(e => e.severity === "warning").length > 0 && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px]">{items.filter(e=>e.severity==="warning").length}</Badge>}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Detail per type */}
        {(["peak", "flatline", "oscillation"] as const).map(type => {
          const cfg = typeConfig[type]
          const Icon = cfg.icon
          const items = grouped[type]
          if (items.length === 0) return null
          return (
            <Card key={type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", cfg.color)} />
                  {cfg.label}
                  <Badge variant="secondary" className="text-[10px] ml-1">{items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {items.map((err, i) => (
                    <div key={i} className={cn("p-3 rounded-lg border flex items-start gap-3", cfg.bg, cfg.border)}>
                      <div className={cn("mt-0.5 h-2.5 w-2.5 rounded-full shrink-0", err.severity === "danger" ? "bg-red-500" : err.severity === "warning" ? "bg-amber-500" : "bg-green-500")} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-semibold">{err.tag}</span>
                          <span className="text-xs text-muted-foreground">{err.name}</span>
                          <Badge variant="outline" className="text-[10px] ml-auto">{err.duration}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{err.desc}</p>
                        {/* Simulated waveform */}
                        <div className="mt-2">
                          <svg width="100%" height="36" viewBox="0 0 400 36" className="w-full" preserveAspectRatio="xMidYMid meet">
                            {type === "peak" && (
                              <>
                                <path d="M0 20 Q50 18 100 19 T200 20 Q210 20 215 4 Q220 20 230 20 T350 19 L400 20" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                                <circle cx="215" cy="4" r="3" fill="#ef4444" />
                                <line x1="215" y1="4" x2="215" y2="32" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2 2" />
                              </>
                            )}
                            {type === "flatline" && (
                              <>
                                <path d="M0 18 Q30 16 80 17 Q100 15 120 18" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                                <line x1="120" y1="18" x2="350" y2="18" stroke="#f97316" strokeWidth="2" />
                                <path d="M350 18 Q370 16 400 17" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                                <rect x="120" y="14" width="230" height="8" fill="#f97316" opacity="0.08" rx="2" />
                              </>
                            )}
                            {type === "oscillation" && (
                              <>
                                <path d="M0 20 Q10 18 20 20 Q30 22 40 20 Q50 18 60 20 Q70 22 80 20 Q90 15 100 25 Q110 15 120 25 Q130 12 140 28 Q150 10 160 30 Q170 8 180 32 Q190 6 200 34 Q210 8 220 32 Q230 10 240 30 Q250 12 260 28 Q270 15 280 25 Q290 18 300 22 Q310 18 320 20 Q340 22 380 19 L400 20" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                                <rect x="80" y="2" width="200" height="32" fill="#3b82f6" opacity="0.04" rx="2" />
                              </>
                            )}
                          </svg>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-medium">{err.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // ===== Detail View 3: DR Data Drift =====
  if (view === "drift") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1 -ml-2 h-7" onClick={() => setView("categories")}>
            <ArrowLeft className="h-3.5 w-3.5" /> 이상징후 카테고리
          </Button>
        </div>
        <h2 className="text-base font-bold flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-purple-600" />
          DR 데이터 대비 Drift 감지
          <Badge variant="secondary" className="text-[10px] font-normal">RTDB vs DR 비교</Badge>
        </h2>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="py-3 flex items-center gap-3">
              <TrendingDown className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-[11px] text-muted-foreground">모니터링 항목</p>
                <p className="text-xl font-bold">{drDriftData.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <div>
                <p className="text-[11px] text-muted-foreground">Drift 확대</p>
                <p className="text-xl font-bold text-red-600">{driftDanger}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <div>
                <p className="text-[11px] text-muted-foreground">관찰 필요</p>
                <p className="text-xl font-bold text-amber-600">{driftWarning}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-[11px] text-muted-foreground">정상</p>
                <p className="text-xl font-bold text-green-600">{drDriftData.filter(d=>d.severity==="normal").length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Drift table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-8">상태</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">RTDB Tag</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">DR Tag</th>
                  <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-16">단위</th>
                  <th className="text-right px-3 py-2.5 font-medium text-muted-foreground w-20">RTDB 값</th>
                  <th className="text-right px-3 py-2.5 font-medium text-muted-foreground w-20">DR 값</th>
                  <th className="text-right px-3 py-2.5 font-medium text-muted-foreground w-16">Delta</th>
                  <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-16">추세</th>
                  <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-16">경과(일)</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground" style={{minWidth: 200}}>Drift 시각화</th>
                </tr>
              </thead>
              <tbody>
                {drDriftData.map((item, i) => {
                  const statusColor = item.severity === "danger" ? "bg-red-500" : item.severity === "warning" ? "bg-amber-500" : "bg-green-500"
                  return (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-3 py-3"><div className={cn("h-3 w-3 rounded-full", statusColor)} /></td>
                      <td className="px-3 py-3 font-medium">{item.tag}</td>
                      <td className="px-3 py-3 text-muted-foreground">{item.drTag}</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">{item.unit}</td>
                      <td className="px-3 py-3 text-right font-mono">{item.rtdbValue}</td>
                      <td className="px-3 py-3 text-right font-mono">{item.drValue}</td>
                      <td className={cn("px-3 py-3 text-right font-mono font-semibold",
                        item.severity === "danger" ? "text-red-600" : item.severity === "warning" ? "text-amber-600" : "text-muted-foreground")}>
                        {item.delta}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {item.trend === "increasing" ? (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px]">확대</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">안정</Badge>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center font-mono">{item.daysActive}</td>
                      <td className="px-3 py-3">
                        {/* Drift trend SVG */}
                        <svg width="180" height="28" viewBox="0 0 180 28">
                          {/* RTDB line */}
                          {(() => {
                            const pts = Array.from({ length: 12 }, (_, j) => {
                              const x = 10 + j * 14.5
                              const base = 14
                              const drift = item.trend === "increasing" ? (j / 11) * (item.severity === "danger" ? 8 : 4) : 0
                              return { x, y1: base - drift / 2 + Math.sin(j * 0.8) * 1.5, y2: base + drift / 2 + Math.sin(j * 0.8 + 1) * 1.5 }
                            })
                            const path1 = pts.map((p, j) => `${j === 0 ? "M" : "L"} ${p.x} ${p.y1}`).join(" ")
                            const path2 = pts.map((p, j) => `${j === 0 ? "M" : "L"} ${p.x} ${p.y2}`).join(" ")
                            return (
                              <>
                                <path d={path1} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                                <path d={path2} fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3 2" />
                                {item.trend === "increasing" && (
                                  <path d={`${path1} L ${pts[pts.length-1].x} ${pts[pts.length-1].y2} ${pts.slice().reverse().map((p, j) => `${j === 0 ? "" : "L"} ${p.x} ${p.y2}`).join(" ")} Z`}
                                    fill="#ef4444" opacity="0.1" />
                                )}
                              </>
                            )
                          })()}
                        </svg>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Detail cards for severe items */}
        {drDriftData.filter(d => d.severity !== "normal").map((item, i) => (
          <Card key={i} className={cn("border-l-4", item.severity === "danger" ? "border-l-red-500" : "border-l-amber-500")}>
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", item.severity === "danger" ? "bg-red-500" : "bg-amber-500")} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{item.tag}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{item.drTag}</span>
                    <Badge variant="outline" className="text-[10px] ml-2">Delta {item.delta} {item.unit}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </div>
                <span className="text-xs text-muted-foreground">{item.daysActive}일 경과</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return null
}

export default function UnitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const decodedId = decodeURIComponent(id)

  const process = ALL_PROCESSES.find(p => p.id === decodedId)
  const unitName = process?.name || decodedId

  const variables = useMemo(() => generateVariables(unitName), [unitName])
  const feedData = useMemo(() => generateFeedData(unitName), [unitName])
  const warningCount = variables.filter(v => v.status === "warning").length

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="border-b bg-card px-6 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/operations")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">{unitName}</h1>
              <p className="text-xs text-muted-foreground">Monitoring Detail</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1.5 text-xs">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live
              </Badge>
              <span className="text-xs text-muted-foreground">2026-02-19 07:14:21</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-background">
          <div className="flex h-full">
            {/* Left Summary Panel */}
            <div className="w-72 border-r bg-card p-5 flex-shrink-0 space-y-5 overflow-y-auto">
              <div>
                <h3 className="text-sm font-semibold mb-3">Summary</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">처리량 가이드 준수율</p>
                    <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded border">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">(-)</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Product Spec Guide 준수율</p>
                    <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded border">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">- / 100%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Operation Guide 준수율</p>
                    <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded border">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">- / 100%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Quick Link</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-xs h-8 bg-card justify-center">생산포탈</Button>
                  <Button variant="outline" size="sm" className="text-xs h-8 bg-card justify-center">SFD</Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">알림</h4>
                {warningCount > 0 ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                    주의 변수 {warningCount}건 발생 중
                  </div>
                ) : (
                  <div className="p-2.5 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                    모든 변수 정상 범위
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              <Tabs defaultValue="overview" className="h-full">
                <div className="border-b bg-card px-6">
                  <TabsList className="bg-transparent h-10 p-0 gap-0">
                    <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 text-xs">Unit Overview</TabsTrigger>
                    <TabsTrigger value="variables" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 text-xs">Key Operating Variables</TabsTrigger>
                    <TabsTrigger value="anomaly" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 text-xs">Anomaly Detection</TabsTrigger>
                  </TabsList>
                </div>

                {/* Unit Overview */}
                <TabsContent value="overview" className="p-6 space-y-6 mt-0">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Process Status</h3>
                    <Card className="p-4">
                      <svg viewBox="0 0 900 360" className="w-full h-auto">
                        <defs>
                          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                            <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
                          </marker>
                        </defs>
                        {/* Connections */}
                        {CDU_CONNECTIONS.map((conn, i) => {
                          const from = CDU_NODES.find(n => n.id === conn.from)!
                          const to = CDU_NODES.find(n => n.id === conn.to)!
                          const x1 = from.x + from.w
                          const y1 = from.y + from.h / 2
                          const x2 = to.x
                          const y2 = to.y + to.h / 2
                          return (
                            <g key={i}>
                              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                              {conn.label && (
                                <text x={(x1 + x2) / 2} y={y2 - 8} textAnchor="middle" fontSize="9" fill="#94a3b8">{conn.label}</text>
                              )}
                            </g>
                          )
                        })}
                        {/* Nodes */}
                        {CDU_NODES.map(node => (
                          <g key={node.id}>
                            <rect
                              x={node.x} y={node.y} width={node.w} height={node.h}
                              rx={node.type === "column" ? 8 : 4}
                              fill={node.type === "feed" ? "#f1f5f9" : node.type === "column" ? "#e0f2fe" : node.type === "product" ? "#f0fdf4" : node.type === "downstream" ? "#fef3c7" : "#f8fafc"}
                              stroke={node.type === "column" ? "#0ea5e9" : node.type === "product" ? "#22c55e" : node.type === "downstream" ? "#f59e0b" : "#cbd5e1"}
                              strokeWidth="1.5"
                            />
                            <text x={node.x + node.w / 2} y={node.y + node.h / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="500" fill="#334155">
                              {node.label}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </Card>
                  </div>

                  {/* Analyze Section */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Analyze</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Feed */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Feed 처리량</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 gap-4">
                            {feedData.feeds.map(f => (
                              <div key={f.name} className="text-center space-y-3 p-4 border rounded-lg">
                                <p className="text-sm font-semibold">{f.name}</p>
                                <p className="text-xs text-muted-foreground">{f.subLabel}</p>
                                <div className="relative mx-auto w-28 h-28">
                                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#0d9488" strokeWidth="8" strokeDasharray={`${f.percentage * 2.51} 251`} strokeLinecap="round" />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-lg font-bold text-primary">{f.percentage}%</span>
                                  </div>
                                </div>
                                <div className="text-xs space-y-1">
                                  <div className="flex justify-between"><span className="text-muted-foreground">Actual</span><span className="font-medium">{f.actual.toLocaleString()} BD</span></div>
                                  <div className="flex justify-between"><span className="text-muted-foreground">Capacity</span><span>{f.capacity.toLocaleString()} BD</span></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Product Yield */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Product Yield</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 font-medium text-muted-foreground">Label</th>
                                <th className="text-right py-2 font-medium text-muted-foreground">BD</th>
                                <th className="text-right py-2 font-medium text-muted-foreground">%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {feedData.products.map(p => (
                                <tr key={p.label} className="border-b last:border-0">
                                  <td className="py-2 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                                    {p.label}
                                  </td>
                                  <td className="text-right py-2 font-mono">{p.bd.toLocaleString()}</td>
                                  <td className="text-right py-2">{p.pct}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                {/* Key Operating Variables */}
                <TabsContent value="variables" className="p-6 mt-0">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Thermometer className="h-4 w-4" />
                          Key Operating Variables
                          <Badge variant="secondary" className="text-xs">{variables.length}</Badge>
                        </CardTitle>
                        {warningCount > 0 && (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            {warningCount} Warning
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/40">
                            <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                            <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">Tag ID</th>
                            <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">Description</th>
                            <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground">현재값</th>
                            <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground">Unit</th>
                            <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground">Guide</th>
                          </tr>
                        </thead>
                        <tbody>
                          {variables.map(v => (
                            <tr key={v.tag} className={cn("border-b last:border-0 hover:bg-muted/30", v.status === "warning" && "bg-amber-50/50")}>
                              <td className="px-3 py-2.5">
                                {v.status === "warning" ? (
                                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                                ) : (
                                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">{v.tag}</td>
                              <td className="px-3 py-2.5 text-sm">{v.name}</td>
                              <td className={cn("text-right px-3 py-2.5 font-mono text-sm font-medium", v.status === "warning" ? "text-amber-700" : "text-foreground")}>{v.value}</td>
                              <td className="text-right px-3 py-2.5 text-xs text-muted-foreground">{v.unit}</td>
                              <td className="text-right px-3 py-2.5 text-xs text-muted-foreground">{v.guide}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Anomaly Detection */}
                <TabsContent value="anomaly" className="p-6 mt-0">
                  <AnomalyDetectionContent unitName={unitName} variables={variables} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
