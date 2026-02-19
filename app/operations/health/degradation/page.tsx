"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from "@/lib/user-context"
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  Flame,
  ThermometerSun,
  Shield,
  Clock,
  Target,
  Wrench,
  Droplets,
  FileText,
  ChevronRight,
  Gauge,
  Zap,
  Eye,
  Layers,
  CalendarClock,
  CheckCircle,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ========== TYPE DEFS ==========
type DegType = "Deposition" | "Catalyst Performance" | "Integrity Risk"
type DepositionSub = "Fouling" | "Coking"
type AccelStatus = "accelerating" | "stable" | "improving"
type LayerTab = "indicator" | "diagnosis" | "action"
type NormMode = "normalized" | "driver-overlay"
type Baseline = "last-ta" | "last-cleaning" | "cycle-start"

// ========== MOCK DATA (extensive) ==========
interface SlopeSet { d1: number; w1: number; m1: number }
interface TrendPoint { time: string; value: number; forecast?: boolean }
interface DriverHypothesis { name: string; likelihood: number; description: string }
interface RawKPI { name: string; value: string; unit: string; trend: "up" | "down" | "flat"; status: "good" | "warning" | "critical" }
interface DriverOverlayOption { id: string; label: string; unit: string }

const ACCEL_CONFIG: Record<AccelStatus, { label: string; color: string; bg: string }> = {
  accelerating: { label: "Accelerating", color: "text-red-700", bg: "bg-red-100 border-red-200" },
  stable: { label: "Stable", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  improving: { label: "Improving", color: "text-green-700", bg: "bg-green-100 border-green-200" },
}

// Deposition > Fouling mock
const FOULING_DATA = {
  indexName: "Fouling Index",
  indexValue: 55,
  slopes: { d1: 0.21, w1: 1.5, m1: 5.8 } as SlopeSet,
  acceleration: "accelerating" as AccelStatus,
  eta: "2025-06-20",
  etaDays: 138,
  baseline: "2024-08-10",
  rawKPIs: [
    { name: "UA Value", value: "1,850", unit: "W/m2K", trend: "down" as const, status: "warning" as const },
    { name: "Delta-T Approach", value: "18.2", unit: "C", trend: "up" as const, status: "warning" as const },
    { name: "Shell-side DP", value: "0.45", unit: "bar", trend: "up" as const, status: "good" as const },
    { name: "Duty Loss", value: "12.3", unit: "%", trend: "up" as const, status: "warning" as const },
  ] as RawKPI[],
  trend: Array.from({ length: 24 }, (_, i) => ({
    time: `M${i + 1}`,
    value: 15 + i * 1.8 + Math.sin(i * 0.3) * 3 + (i > 18 ? (i - 18) * 0.8 : 0),
    forecast: i >= 20,
  })) as TrendPoint[],
  hypotheses: [
    { name: "Salt Deposition", likelihood: 4, description: "Overhead 계통 염분 침착 가능성. Desalter 성능 및 wash water 확인 필요." },
    { name: "Asphaltene Fouling", likelihood: 3, description: "Heavy crude 처리 시 asphaltene 침전 가능성. Feed compatibility 확인." },
    { name: "Particulate Fouling", likelihood: 2, description: "Filter 상태 및 upstream vessel 확인." },
    { name: "Polymer Formation", likelihood: 1, description: "가능성 낮음. Olefin 함유 스트림 여부 확인." },
  ] as DriverHypothesis[],
  driverOverlayOptions: [
    { id: "feed-severity", label: "Feed Sulfur Content", unit: "wt%" },
    { id: "throughput", label: "Throughput", unit: "m3/hr" },
    { id: "feed-gravity", label: "Feed API Gravity", unit: "API" },
    { id: "inlet-temp", label: "Inlet Temperature", unit: "C" },
  ] as DriverOverlayOption[],
}

const COKING_DATA = {
  indexName: "Coking Index",
  indexValue: 45,
  slopes: { d1: 0.08, w1: 0.3, m1: 1.4 } as SlopeSet,
  acceleration: "stable" as AccelStatus,
  eta: "2026-08-01",
  etaDays: 545,
  baseline: "2024-06-01",
  rawKPIs: [
    { name: "Tube Skin Temp (Max)", value: "892", unit: "C", trend: "up" as const, status: "warning" as const },
    { name: "Delta-P (Passes)", value: "0.82", unit: "bar", trend: "up" as const, status: "good" as const },
    { name: "Heater Efficiency", value: "87.5", unit: "%", trend: "down" as const, status: "good" as const },
    { name: "Bridgewall Temp", value: "1,045", unit: "C", trend: "flat" as const, status: "good" as const },
  ] as RawKPI[],
  trend: Array.from({ length: 24 }, (_, i) => ({
    time: `M${i + 1}`,
    value: 10 + i * 1.2 + Math.sin(i * 0.5) * 2,
    forecast: i >= 20,
  })) as TrendPoint[],
  hypotheses: [
    { name: "High-Temperature Cracking", likelihood: 3, description: "고온에 의한 탄화수소 열분해. Tube skin temp 모니터링 필수." },
    { name: "Residence Time 증가", likelihood: 3, description: "유량 감소 또는 pass imbalance로 체류 시간 증가." },
    { name: "Severity Ramp", likelihood: 2, description: "Heater outlet target 상향 이력 확인." },
    { name: "Quench Failure", likelihood: 1, description: "Transfer line quench 시스템 점검." },
  ] as DriverHypothesis[],
  driverOverlayOptions: [
    { id: "tube-skin", label: "Tube Skin Temperature", unit: "C" },
    { id: "feed-rate", label: "Feed Rate", unit: "m3/hr" },
    { id: "outlet-temp", label: "Heater Outlet Temp", unit: "C" },
    { id: "fuel-firing", label: "Fuel Firing Rate", unit: "Gcal/hr" },
  ] as DriverOverlayOption[],
}

const CATALYST_DATA = {
  indexName: "Activity Decay Index",
  indexValue: 72,
  slopes: { d1: 0.12, w1: 0.8, m1: 3.2 } as SlopeSet,
  acceleration: "accelerating" as AccelStatus,
  eta: "2025-09-15",
  etaDays: 225,
  baseline: "2023-06-15",
  rawKPIs: [
    { name: "WABT", value: "396.5", unit: "C", trend: "up" as const, status: "warning" as const },
    { name: "RIT (Reactor Inlet)", value: "372", unit: "C", trend: "up" as const, status: "good" as const },
    { name: "Max Bed Temp", value: "421", unit: "C", trend: "up" as const, status: "warning" as const },
    { name: "Bed Delta-T (R1)", value: "42", unit: "C", trend: "up" as const, status: "good" as const },
  ] as RawKPI[],
  trend: Array.from({ length: 24 }, (_, i) => ({
    time: `M${i + 1}`,
    value: 20 + i * 2.5 + Math.sin(i * 0.4) * 2 + (i > 16 ? (i - 16) * 1.2 : 0),
    forecast: i >= 20,
  })) as TrendPoint[],
  hypotheses: [
    { name: "Metals Poisoning (Ni/V)", likelihood: 4, description: "피드 내 Ni+V 함량 증가로 인한 활성점 피독. Feed assay 및 guard bed 확인." },
    { name: "Nitrogen Inhibition", likelihood: 3, description: "피드 N 함량 변화에 의한 일시적 활성 저하. 가역적 원인." },
    { name: "Coke Deposition (on Catalyst)", likelihood: 3, description: "촉매 표면 coke 침착. 재생(regen) 가능 여부 검토." },
    { name: "Thermal/Hotspot", likelihood: 2, description: "편류 또는 maldistribution에 의한 국소 과열. Bed profile 확인." },
  ] as DriverHypothesis[],
  driverOverlayOptions: [
    { id: "feed-nv", label: "Feed Ni+V", unit: "ppm" },
    { id: "feed-nitrogen", label: "Feed Nitrogen", unit: "ppm" },
    { id: "feed-sulfur", label: "Feed Sulfur", unit: "wt%" },
    { id: "throughput", label: "Throughput (LHSV)", unit: "hr-1" },
  ] as DriverOverlayOption[],
  normalized: { available: true, label: "N-WABT (Normalized WABT)" },
}

const INTEGRITY_DATA = {
  indexName: "Corrosion Driving Force Index",
  indexValue: 30,
  slopes: { d1: 0.02, w1: 0.15, m1: 0.5 } as SlopeSet,
  acceleration: "stable" as AccelStatus,
  eta: "2027-01-01",
  etaDays: 695,
  baseline: "2024-09-20",
  rawKPIs: [
    { name: "Overhead pH", value: "5.8", unit: "", trend: "down" as const, status: "good" as const },
    { name: "Fe Content (Overhead)", value: "2.1", unit: "ppm", trend: "flat" as const, status: "good" as const },
    { name: "Cl Content", value: "15", unit: "ppm", trend: "flat" as const, status: "good" as const },
    { name: "Wall Thickness (last UT)", value: "8.2", unit: "mm", trend: "down" as const, status: "good" as const },
  ] as RawKPI[],
  trend: Array.from({ length: 24 }, (_, i) => ({
    time: `M${i + 1}`,
    value: 8 + i * 0.8 + Math.sin(i * 0.6) * 1.5,
    forecast: i >= 20,
  })) as TrendPoint[],
  hypotheses: [
    { name: "Overhead Corrosion (NH4Cl)", likelihood: 3, description: "Overhead 계통 NH4Cl salt point 이하 운전 가능성. Wash water injection 확인." },
    { name: "Naphthenic Acid Corrosion", likelihood: 2, description: "High-TAN crude 처리 시 고온부 부식 가능성." },
    { name: "Water Dew Point Corrosion", likelihood: 1, description: "Dead leg 또는 저온부에서의 수분 응축." },
  ] as DriverHypothesis[],
  driverOverlayOptions: [
    { id: "overhead-ph", label: "Overhead pH", unit: "" },
    { id: "wash-water", label: "Wash Water Rate", unit: "m3/hr" },
    { id: "overhead-temp", label: "Overhead Temp", unit: "C" },
  ] as DriverOverlayOption[],
}

// ========== HELPER: Mini trend chart (SVG) ==========
function MiniTrendChart({ data, height = 120, baseline, showForecast = true }: { data: TrendPoint[]; height?: number; baseline?: number; showForecast?: boolean }) {
  const w = 600
  const h = height
  const pad = { t: 10, r: 20, b: 25, l: 40 }
  const vals = data.map((d) => d.value)
  const minV = Math.min(...vals) * 0.9
  const maxV = Math.max(...vals) * 1.1
  const xStep = (w - pad.l - pad.r) / (data.length - 1)

  const toX = (i: number) => pad.l + i * xStep
  const toY = (v: number) => pad.t + ((maxV - v) / (maxV - minV)) * (h - pad.t - pad.b)

  const actualPts = data.filter((d) => !d.forecast)
  const forecastPts = data.filter((d) => d.forecast)
  const actualPath = actualPts.map((d, i) => `${i === 0 ? "M" : "L"}${toX(data.indexOf(d))},${toY(d.value)}`).join(" ")
  const forecastStartIdx = forecastPts.length > 0 ? data.indexOf(forecastPts[0]) : -1
  const forecastPath = forecastStartIdx >= 0 ? [data[forecastStartIdx - 1], ...forecastPts].map((d, i) => `${i === 0 ? "M" : "L"}${toX(data.indexOf(d))},${toY(d.value)}`).join(" ") : ""

  // Baseline vertical line
  const blIdx = baseline !== undefined ? baseline : undefined

  // ETA threshold line (at 100% of max trend)
  const threshold = maxV * 0.85

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={pad.l} x2={w - pad.r} y1={toY(minV + (maxV - minV) * f)} y2={toY(minV + (maxV - minV) * f)} stroke="currentColor" className="text-muted/30" strokeWidth={0.5} />
      ))}

      {/* Threshold line */}
      <line x1={pad.l} x2={w - pad.r} y1={toY(threshold)} y2={toY(threshold)} stroke="#ef4444" strokeWidth={1} strokeDasharray="6 3" opacity={0.5} />
      <text x={w - pad.r + 4} y={toY(threshold) + 3} className="fill-red-500 text-[9px]">Limit</text>

      {/* Baseline vertical */}
      {blIdx !== undefined && (
        <>
          <line x1={toX(blIdx)} x2={toX(blIdx)} y1={pad.t} y2={h - pad.b} stroke="#3b82f6" strokeWidth={1} strokeDasharray="4 4" />
          <text x={toX(blIdx) + 4} y={pad.t + 10} className="fill-blue-500 text-[8px]">Baseline</text>
        </>
      )}

      {/* Forecast band */}
      {showForecast && forecastPts.length > 0 && (
        <path
          d={
            [data[forecastStartIdx - 1], ...forecastPts]
              .map((d, i) => `${i === 0 ? "M" : "L"}${toX(data.indexOf(d))},${toY(d.value * 0.92)}`)
              .join(" ") +
            [...[data[forecastStartIdx - 1], ...forecastPts]]
              .reverse()
              .map((d, i) => `${i === 0 ? "L" : "L"}${toX(data.indexOf(d))},${toY(d.value * 1.08)}`)
              .join(" ") + "Z"
          }
          fill="#8b5cf6" opacity={0.08}
        />
      )}

      {/* Actual line */}
      <path d={actualPath} fill="none" stroke="#3b82f6" strokeWidth={2} />

      {/* Forecast line */}
      {showForecast && forecastPath && (
        <path d={forecastPath} fill="none" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="6 3" />
      )}

      {/* X-axis labels */}
      {data.filter((_, i) => i % 4 === 0).map((d, i) => (
        <text key={d.time} x={toX(data.indexOf(d))} y={h - 5} textAnchor="middle" className="fill-muted-foreground text-[8px]">{d.time}</text>
      ))}

      {/* Y-axis labels */}
      {[0, 0.5, 1].map((f) => {
        const val = minV + (maxV - minV) * f
        return <text key={f} x={pad.l - 5} y={toY(val) + 3} textAnchor="end" className="fill-muted-foreground text-[8px]">{val.toFixed(0)}</text>
      })}
    </svg>
  )
}

// ========== MAIN COMPONENT ==========
function DegradationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { visibleProcesses, scopeMode, currentUser } = useUser()

  // Build unit list from user context
  const availableUnits = Array.from(new Set(visibleProcesses.map(p => {
    // Map process IDs to short unit labels used in mock data
    if (p.id.includes("CDU")) return "CDU"
    if (p.id.includes("VDU")) return "VDU"
    if (p.id.includes("HDS")) return "HDS"
    if (p.id.includes("CCR")) return "CCR"
    if (p.id === "HCR") return "HCR"
    return p.id
  }))).sort()

  // Filters
  const [degType, setDegType] = useState<DegType>(
    (searchParams.get("type") as DegType) || "Deposition"
  )
  const [depositionSub, setDepositionSub] = useState<DepositionSub>("Fouling")
  const [selectedUnit, setSelectedUnit] = useState(searchParams.get("unit") || "all")
  const [period, setPeriod] = useState("2y")
  const [baselineSel, setBaselineSel] = useState<Baseline>("last-ta")

  // Layer
  const [layerTab, setLayerTab] = useState<LayerTab>("indicator")

  // Normalization
  const [normMode, setNormMode] = useState<NormMode>("normalized")
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([])

  // Action dialog
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [actionType, setActionType] = useState("")
  const [actionDesc, setActionDesc] = useState("")
  const [actionDue, setActionDue] = useState("")

  // Select data based on type
  const getData = () => {
    if (degType === "Deposition") return depositionSub === "Fouling" ? FOULING_DATA : COKING_DATA
    if (degType === "Catalyst Performance") return CATALYST_DATA
    return INTEGRITY_DATA
  }
  const data = getData()
  const accel = ACCEL_CONFIG[data.acceleration]
  const isIntegrity = degType === "Integrity Risk"

  const toggleDriver = (id: string) => {
    setSelectedDrivers((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : prev.length >= 3 ? prev : [...prev, id]
    )
  }

  const handleCreateAction = () => {
    alert(`Worklist에 항목이 추가되었습니다.\n\n유형: ${actionType}\n설명: ${actionDesc}\n기한: ${actionDue}\n\nWorklist 페이지에서 확인하세요.`)
    setShowActionDialog(false)
    setActionType("")
    setActionDesc("")
    setActionDue("")
  }

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-56px)]">
        {/* ======= LEFT FILTER PANEL ======= */}
        <div className="w-72 border-r bg-card p-4 space-y-5 overflow-y-auto shrink-0">
          <div>
            <h2 className="text-sm font-semibold mb-1">Degradation Monitor</h2>
            <p className="text-xs text-muted-foreground">필터를 설정하여 분석하세요</p>
          </div>

          {/* Unit filter */}
          <div className="space-y-1.5">
            <Label className="text-xs">Unit / Equipment</Label>
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {scopeMode === "my-processes" ? `담당 공정 전체 (${availableUnits.length})` : "전체"}
                </SelectItem>
                {availableUnits.map(unit => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {scopeMode === "my-processes" && (
              <p className="text-xs text-muted-foreground">{currentUser.roleLabel} 담당 범위</p>
            )}
          </div>

          {/* Degradation Type */}
          <div className="space-y-1.5">
            <Label className="text-xs">Degradation Type</Label>
            <div className="space-y-1">
              {([
                { type: "Deposition" as DegType, icon: Flame, color: "text-orange-600", desc: "Fouling / Coking" },
                { type: "Catalyst Performance" as DegType, icon: ThermometerSun, color: "text-blue-600", desc: "Aging (Fixed-bed)" },
                { type: "Integrity Risk" as DegType, icon: Shield, color: "text-slate-500", desc: "Corrosion / Thermal" },
              ]).map(({ type, icon: Icon, color, desc }) => (
                <button
                  key={type}
                  onClick={() => { setDegType(type); setLayerTab("indicator") }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-sm transition-colors",
                    degType === type ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", degType === type ? "text-primary" : color)} />
                  <div>
                    <span className="block leading-tight">{type}</span>
                    <span className="text-xs text-muted-foreground">{desc}</span>
                    {type === "Integrity Risk" && <Badge variant="outline" className="text-xs ml-1 px-1">Beta</Badge>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Deposition sub-type */}
          {degType === "Deposition" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Sub-Type</Label>
              <div className="flex gap-1">
                {(["Fouling", "Coking"] as DepositionSub[]).map((sub) => (
                  <Button
                    key={sub}
                    size="sm"
                    variant={depositionSub === sub ? "default" : "outline"}
                    className={cn("flex-1 text-xs", depositionSub !== sub && "bg-transparent")}
                    onClick={() => setDepositionSub(sub)}
                  >
                    {sub}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Period */}
          <div className="space-y-1.5">
            <Label className="text-xs">기간</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="6m">6개월</SelectItem>
                <SelectItem value="1y">1년</SelectItem>
                <SelectItem value="2y">2년</SelectItem>
                <SelectItem value="cycle">전체 Cycle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Baseline */}
          <div className="space-y-1.5">
            <Label className="text-xs">Baseline 비교 기준</Label>
            <Select value={baselineSel} onValueChange={(v) => setBaselineSel(v as Baseline)}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="last-ta">지난 TA 직후</SelectItem>
                <SelectItem value="last-cleaning">지난 Cleaning 직후</SelectItem>
                <SelectItem value="cycle-start">Cycle 시작점</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Baseline: {data.baseline}</p>
          </div>

          {/* Normalization Toggle */}
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs font-semibold">Normalization Mode</Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={normMode === "driver-overlay"}
                onCheckedChange={(checked) => setNormMode(checked ? "driver-overlay" : "normalized")}
                id="norm-toggle"
              />
              <Label htmlFor="norm-toggle" className="text-xs cursor-pointer">
                {normMode === "normalized" ? "Normalized Index" : "Driver Overlay"}
              </Label>
            </div>
            {normMode === "normalized" && degType === "Catalyst Performance" && CATALYST_DATA.normalized.available && (
              <p className="text-xs text-green-600">N-WABT (Normalized) 적용됨</p>
            )}
            {normMode === "normalized" && degType !== "Catalyst Performance" && (
              <p className="text-xs text-amber-600">정규화 미구현 - Driver Overlay 권장</p>
            )}
            {normMode === "driver-overlay" && (
              <div className="space-y-1.5 mt-1">
                <p className="text-xs text-muted-foreground">원인 변수 선택 (최대 3개)</p>
                {data.driverOverlayOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => toggleDriver(opt.id)}
                    className={cn(
                      "w-full text-left px-2 py-1.5 rounded text-xs transition-colors",
                      selectedDrivers.includes(opt.id) ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50 text-muted-foreground"
                    )}
                  >
                    {opt.label} ({opt.unit})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ======= RIGHT CONTENT ======= */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header with type + status */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-foreground">
                  {degType === "Deposition" ? `Deposition - ${depositionSub}` : degType}
                </h1>
                {isIntegrity && <Badge variant="outline" className="text-xs">Beta</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedUnit === "all" ? "전체 Unit" : selectedUnit} | {period} | Baseline: {baselineSel === "last-ta" ? "지난 TA 직후" : baselineSel === "last-cleaning" ? "지난 Cleaning 직후" : "Cycle 시작점"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={cn("text-sm", accel.bg, accel.color)}>
                {accel.label}
              </Badge>
              <Badge variant="outline" className={cn(
                "text-sm",
                data.etaDays < 180 ? "bg-red-100 border-red-200 text-red-700" :
                  data.etaDays < 365 ? "bg-amber-50 border-amber-200 text-amber-700" :
                    "bg-green-50 border-green-200 text-green-700"
              )}>
                <Clock className="h-3.5 w-3.5 mr-1" />
                ETA: {data.etaDays}일 ({data.eta})
              </Badge>
            </div>
          </div>

          {/* 3-Layer Tabs */}
          <Tabs value={layerTab} onValueChange={(v) => setLayerTab(v as LayerTab)}>
            <TabsList className="grid grid-cols-3 w-full max-w-lg">
              <TabsTrigger value="indicator" className="gap-1.5 text-sm">
                <Gauge className="h-4 w-4" /> Indicator
              </TabsTrigger>
              <TabsTrigger value="diagnosis" className="gap-1.5 text-sm">
                <Eye className="h-4 w-4" /> Diagnosis
              </TabsTrigger>
              <TabsTrigger value="action" className="gap-1.5 text-sm">
                <Wrench className="h-4 w-4" /> Action & Plan
              </TabsTrigger>
            </TabsList>

            {/* ===== LAYER 1: INDICATOR ===== */}
            <TabsContent value="indicator" className="mt-4 space-y-5">
              {/* Index Card + Slopes */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="col-span-1 border-l-4 border-l-primary">
                  <CardContent className="pt-5">
                    <p className="text-xs text-muted-foreground">{data.indexName}</p>
                    <p className="text-4xl font-bold mt-1">{data.indexValue}<span className="text-lg text-muted-foreground">%</span></p>
                    <div className="w-full h-2 bg-muted rounded-full mt-3 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          data.indexValue > 70 ? "bg-red-500" : data.indexValue > 50 ? "bg-amber-500" : "bg-green-500"
                        )}
                        style={{ width: `${data.indexValue}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Slope comparison */}
                {[
                  { label: "1일 평균 기울기", value: data.slopes.d1, unit: "%/day" },
                  { label: "1주 평균 기울기", value: data.slopes.w1, unit: "%/week" },
                  { label: "1개월 평균 기울기", value: data.slopes.m1, unit: "%/month" },
                ].map((s) => (
                  <Card key={s.label}>
                    <CardContent className="pt-5">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-bold mt-1">+{s.value.toFixed(2)}<span className="text-sm text-muted-foreground ml-1">{s.unit}</span></p>
                      <div className="flex items-center gap-1 mt-2">
                        <TrendingUp className="h-3.5 w-3.5 text-red-500" />
                        <span className="text-xs text-red-500">상승 추세</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Main Trend Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      {data.indexName} Trend
                      {normMode === "normalized" && degType === "Catalyst Performance" && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Normalized</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-blue-500 inline-block" /> Actual</span>
                      <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-purple-500 inline-block border-b border-dashed" /> Forecast</span>
                      <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-red-400 inline-block border-b border-dashed" /> Limit</span>
                      <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-blue-400 inline-block border-b border-dashed" /> Baseline</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/20 rounded-lg p-3">
                    <MiniTrendChart data={data.trend} height={220} baseline={4} />
                  </div>
                  {/* ETA Action Window */}
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">Action Window: 임계 도달 예상 {data.etaDays}일 전</span>
                    </div>
                    <span className="text-sm text-amber-600">권장 조치 시점: {data.etaDays > 90 ? `${Math.round(data.etaDays * 0.3)}~${Math.round(data.etaDays * 0.6)}일 후` : "즉시"}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Driver Overlay (if mode active) */}
              {normMode === "driver-overlay" && selectedDrivers.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Driver Overlay ({selectedDrivers.length}개 변수)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/20 rounded-lg p-3">
                      <MiniTrendChart
                        data={data.trend.map((d, i) => ({ ...d, value: d.value * (0.85 + Math.sin(i * 0.7) * 0.15) }))}
                        height={160}
                        showForecast={false}
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      {selectedDrivers.map((dId, idx) => {
                        const opt = data.driverOverlayOptions.find((o) => o.id === dId)
                        const colors = ["text-emerald-600", "text-violet-600", "text-rose-600"]
                        return opt ? (
                          <span key={dId} className={cn("text-xs flex items-center gap-1", colors[idx])}>
                            <span className="w-3 h-0.5 bg-current inline-block" /> {opt.label}
                          </span>
                        ) : null
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Raw KPIs */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Raw KPI 현황</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-3">
                    {data.rawKPIs.map((kpi) => (
                      <div key={kpi.name} className={cn(
                        "p-3 rounded-lg border",
                        kpi.status === "critical" ? "bg-red-50 border-red-200" :
                          kpi.status === "warning" ? "bg-amber-50 border-amber-200" :
                            "bg-muted/30 border-border"
                      )}>
                        <p className="text-xs text-muted-foreground">{kpi.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-bold">{kpi.value}</span>
                          <span className="text-xs text-muted-foreground">{kpi.unit}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {kpi.trend === "up" ? <TrendingUp className="h-3 w-3 text-red-500" /> :
                            kpi.trend === "down" ? <TrendingDown className="h-3 w-3 text-green-500" /> :
                              <Activity className="h-3 w-3 text-muted-foreground" />}
                          <span className="text-xs text-muted-foreground">{kpi.trend === "up" ? "상승" : kpi.trend === "down" ? "하락" : "유지"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== LAYER 2: DIAGNOSIS ===== */}
            <TabsContent value="diagnosis" className="mt-4 space-y-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Driver Likelihood 분석
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">확정 진단이 아닌 가능성(Likelihood) 기반 가설입니다.</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.hypotheses.map((hyp) => (
                      <div key={hyp.name} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="shrink-0 mt-0.5">
                          {/* Likelihood dots */}
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map((dot) => (
                              <div
                                key={dot}
                                className={cn(
                                  "w-3 h-3 rounded-full",
                                  dot <= hyp.likelihood ? "bg-primary" : "bg-muted"
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground mt-1 block">
                            {hyp.likelihood >= 4 ? "Very High" : hyp.likelihood >= 3 ? "High" : hyp.likelihood >= 2 ? "Medium" : "Low"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{hyp.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">{hyp.description}</p>
                        </div>
                        <Badge variant="outline" className={cn(
                          "text-xs shrink-0",
                          hyp.likelihood >= 4 ? "bg-red-100 text-red-700 border-red-200" :
                            hyp.likelihood >= 3 ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-muted text-muted-foreground"
                        )}>
                          {hyp.likelihood}/4
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Normalization & Signal Matching */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Signal Matching - 원인 변수 상관 분석
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/20 rounded-lg p-3 mb-3">
                    <MiniTrendChart data={data.trend} height={160} showForecast={false} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {data.driverOverlayOptions.slice(0, 4).map((opt) => (
                      <div key={opt.id} className="flex items-center justify-between p-2.5 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.unit}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-mono">r = 0.{Math.floor(Math.random() * 40 + 55)}</span>
                          <p className="text-xs text-muted-foreground">상관계수</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Catalyst Performance specific: Bed Profile */}
              {degType === "Catalyst Performance" && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ThermometerSun className="h-4 w-4" />
                      Bed-wise Temperature Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-3">
                      {["Bed 1 (Top)", "Bed 2", "Bed 3", "Bed 4 (Bottom)"].map((bed, idx) => {
                        const deltaT = [42, 38, 35, 28][idx]
                        const distortion = ["+3.2", "+1.8", "+0.5", "-0.8"][idx]
                        return (
                          <div key={bed} className={cn(
                            "p-3 rounded-lg border text-center",
                            idx === 0 ? "bg-amber-50 border-amber-200" : "bg-muted/30"
                          )}>
                            <p className="text-xs text-muted-foreground">{bed}</p>
                            <p className="text-xl font-bold mt-1">{deltaT}<span className="text-sm text-muted-foreground">C</span></p>
                            <p className={cn("text-xs mt-1", Number.parseFloat(distortion) > 2 ? "text-red-600" : "text-muted-foreground")}>
                              Distortion: {distortion}C
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ===== LAYER 3: ACTION & PLAN ===== */}
            <TabsContent value="action" className="mt-4 space-y-5">
              {/* Standard Action Cards */}
              <div className="grid grid-cols-2 gap-4">
                {(() => {
                  const actions = degType === "Deposition" ? [
                    { type: "Operating Adjustment", icon: Target, desc: "운영변수 조정 (유량, 온도, 압력 등)", color: "text-blue-600 bg-blue-100" },
                    { type: "Chemical Injection / Washing", icon: Droplets, desc: "Chemical injection 또는 washing 계획", color: "text-emerald-600 bg-emerald-100" },
                    { type: "Cleaning Plan", icon: Wrench, desc: "오프라인/온라인 Cleaning 계획 수립", color: "text-orange-600 bg-orange-100" },
                    { type: "TA Worklist - 교체/정비", icon: FileText, desc: "TA Worklist에 교체/정비 항목 추가", color: "text-purple-600 bg-purple-100" },
                  ] : degType === "Catalyst Performance" ? [
                    { type: "Temperature Profile 조정", icon: ThermometerSun, desc: "Bed별 온도 조정, severity uplift 등", color: "text-blue-600 bg-blue-100" },
                    { type: "Operating Adjustment", icon: Target, desc: "Feed rate, severity, recycle 조정", color: "text-emerald-600 bg-emerald-100" },
                    { type: "Catalyst Replacement Evaluation", icon: Wrench, desc: "촉매 교체 평가 및 TA 연계", color: "text-orange-600 bg-orange-100" },
                    { type: "TA Worklist 등록", icon: FileText, desc: "TA Worklist에 촉매 교체 항목 추가", color: "text-purple-600 bg-purple-100" },
                  ] : [
                    { type: "Inspection / UT Plan", icon: Shield, desc: "비파괴 검사(UT) 또는 육안 검사 계획", color: "text-blue-600 bg-blue-100" },
                    { type: "Chemical Treatment", icon: Droplets, desc: "방식제 주입, neutralizer 조정", color: "text-emerald-600 bg-emerald-100" },
                    { type: "TA Worklist 등록", icon: FileText, desc: "TA Worklist에 검사/교체 항목 추가", color: "text-purple-600 bg-purple-100" },
                  ]
                  return actions.map((act) => (
                    <Card key={act.type} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setActionType(act.type); setShowActionDialog(true) }}>
                      <CardContent className="pt-5">
                        <div className="flex items-start gap-3">
                          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", act.color)}>
                            <act.icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{act.type}</p>
                            <p className="text-xs text-muted-foreground mt-1">{act.desc}</p>
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                })()}
              </div>

              {/* Decision Template */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    의사결정 템플릿
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">시스템은 결정을 내리지 않습니다. 아래 템플릿을 활용하여 의사결정을 수행하세요.</p>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-6 bg-muted/50 p-3 text-xs font-medium text-muted-foreground">
                      <span>Trigger</span>
                      <span>Options</span>
                      <span>Risk</span>
                      <span>Expected Benefit</span>
                      <span>Owner</span>
                      <span>Due Date</span>
                    </div>
                    <div className="grid grid-cols-6 p-3 text-sm border-t">
                      <span className="text-xs">{data.indexName} {data.indexValue}% 도달</span>
                      <span className="text-xs">{degType === "Deposition" ? "Cleaning / 교체" : degType === "Catalyst Performance" ? "온도 조정 / 교체" : "검사 / 방식"}</span>
                      <span className="text-xs text-amber-600">ETA {data.etaDays}일</span>
                      <span className="text-xs">에너지 절감 / 수율 회복</span>
                      <span className="text-xs text-muted-foreground">담당자 지정</span>
                      <span className="text-xs text-muted-foreground">날짜 지정</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Actions */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      연관 Worklist 항목
                    </CardTitle>
                    <Button variant="link" size="sm" className="text-xs" onClick={() => router.push("/operations/health/worklist")}>
                      전체 보기 <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">E-2001 Chemical Cleaning</p>
                          <p className="text-xs text-muted-foreground">2024-08-10 완료</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">Completed</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <div>
                          <p className="text-sm font-medium">HCR Catalyst Performance Review</p>
                          <p className="text-xs text-muted-foreground">2025-03-15 예정</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Approved</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Action Creation Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Worklist 항목 생성
            </DialogTitle>
            <DialogDescription>
              {actionType} 항목을 Worklist에 추가합니다. 필요 시 Tech Deque 이벤트으로 전환할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Action Type</Label>
              <Input value={actionType} readOnly className="bg-muted/30" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">근거 (Degradation)</Label>
              <Input value={`${degType} - ${data.indexName} ${data.indexValue}% (ETA: ${data.etaDays}d)`} readOnly className="bg-muted/30" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">설명 *</Label>
              <Textarea
                value={actionDesc}
                onChange={(e) => setActionDesc(e.target.value)}
                placeholder="���치 내용을 상세히 기술하세요..."
                className="min-h-24"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Status</Label>
                <Select defaultValue="proposed">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proposed">Proposed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Due Date *</Label>
                <Input type="date" value={actionDue} onChange={(e) => setActionDue(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Owner</Label>
              <Input placeholder="담당자 이름" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)} className="bg-transparent">취소</Button>
            <Button onClick={handleCreateAction} disabled={!actionDesc.trim() || !actionDue}>
              <Plus className="h-4 w-4 mr-2" />
              Worklist에 추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

export default function DegradationPage() {
  return (
    <Suspense fallback={<AppShell><div className="p-6">Loading...</div></AppShell>}>
      <DegradationContent />
    </Suspense>
  )
}
