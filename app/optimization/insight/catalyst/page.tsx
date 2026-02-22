"use client"

import { useState, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DollarSign, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus,
  ExternalLink, Cpu, Flame, Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

// ---- Fixed Bed Catalyst Data ----
interface FixedBedCatalyst {
  id: string
  unit: string
  reactor: string
  catalystType: string
  healthIndex: string // e.g. WABT
  currentValue: number
  limitValue: number
  remainingLifeWeeks: number
  remainingLifePct: number
  currentSeverity: number // 현재 Severity (%)
  maxSeverityPotential: number // Severity 상향 가능 Potential (%)
  annualSavingKrw: number // 연간 절감 가능 (만원)
  options: { label: string; impact: string; saving: number }[]
  aiModelId?: string
  trend: number[]
}

const FIXED_BED_DATA: FixedBedCatalyst[] = [
  {
    id: "FB-R101", unit: "HCR", reactor: "1st Stage Reactor", catalystType: "NiMo/Al2O3",
    healthIndex: "WABT", currentValue: 388, limitValue: 415, remainingLifeWeeks: 32, remainingLifePct: 38,
    currentSeverity: 72, maxSeverityPotential: 12, annualSavingKrw: 85000,
    options: [
      { label: "Feed Sulfur 상향 (1.5% -> 2.0%)", impact: "잔여 수명 -6주, Severity +5%", saving: 42000 },
      { label: "LHSV 상향 (+5%)", impact: "잔여 수명 -4주, Severity +3%", saving: 28000 },
      { label: "Reactor Inlet T 상향 (+3C)", impact: "잔여 수명 -8주, Severity +4%", saving: 35000 },
    ],
    aiModelId: "AI-MDL-C01",
    trend: [365, 368, 370, 372, 374, 375, 377, 378, 380, 381, 382, 383, 384, 385, 386, 387, 388],
  },
  {
    id: "FB-R102", unit: "HCR", reactor: "2nd Stage Reactor", catalystType: "NiMo/Al2O3",
    healthIndex: "WABT", currentValue: 395, limitValue: 415, remainingLifeWeeks: 18, remainingLifePct: 22,
    currentSeverity: 82, maxSeverityPotential: 8, annualSavingKrw: 52000,
    options: [
      { label: "Feed Sulfur 상향 (1.5% -> 1.8%)", impact: "잔여 수명 -3주, Severity +3%", saving: 22000 },
      { label: "LHSV 상향 (+3%)", impact: "잔여 수명 -2주, Severity +2%", saving: 15000 },
      { label: "H2/HC Ratio 하향 (-0.2)", impact: "잔여 수명 -5주, Severity +3%", saving: 18000 },
    ],
    aiModelId: "AI-MDL-C02",
    trend: [378, 380, 382, 383, 384, 386, 387, 388, 389, 390, 391, 392, 393, 394, 394, 395, 395],
  },
  {
    id: "FB-R201", unit: "HDS", reactor: "Naphtha HDS Reactor", catalystType: "CoMo/Al2O3",
    healthIndex: "WABT", currentValue: 342, limitValue: 370, remainingLifeWeeks: 48, remainingLifePct: 56,
    currentSeverity: 65, maxSeverityPotential: 18, annualSavingKrw: 42000,
    options: [
      { label: "Feed Sulfur 상향 (500 -> 800 ppm)", impact: "잔여 수명 -10주, Severity +8%", saving: 25000 },
      { label: "SV 상향 (+8%)", impact: "잔여 수명 -6주, Severity +5%", saving: 18000 },
      { label: "Off-spec Feed 처리량 증대", impact: "잔여 수명 -8주, Severity +5%", saving: 20000 },
    ],
    trend: [320, 322, 324, 326, 327, 328, 330, 331, 332, 334, 335, 336, 338, 339, 340, 341, 342],
  },
  {
    id: "FB-R301", unit: "CCR", reactor: "CCR 1st Reactor", catalystType: "Pt-Re/Al2O3",
    healthIndex: "WAIT", currentValue: 505, limitValue: 530, remainingLifeWeeks: 26, remainingLifePct: 32,
    currentSeverity: 75, maxSeverityPotential: 10, annualSavingKrw: 38000,
    options: [
      { label: "Feed End Point 상향 (+5C)", impact: "잔여 수명 -4주, Severity +4%", saving: 15000 },
      { label: "Severity 상향 (RON +1)", impact: "잔여 수명 -6주, Severity +6%", saving: 28000 },
    ],
    aiModelId: "AI-MDL-C03",
    trend: [488, 490, 492, 493, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 504, 505, 505],
  },
  {
    id: "FB-R401", unit: "SRU", reactor: "Claus Reactor #1", catalystType: "Al2O3 (Claus)",
    healthIndex: "dP", currentValue: 0.42, limitValue: 0.60, remainingLifeWeeks: 52, remainingLifePct: 65,
    currentSeverity: 58, maxSeverityPotential: 22, annualSavingKrw: 15000,
    options: [
      { label: "H2S Feed 상향 (+10%)", impact: "잔여 수명 -8주, Severity +8%", saving: 8000 },
      { label: "운전온도 하향 (-5C)", impact: "잔여 수명 +4주, 효율 -1%", saving: 5000 },
    ],
    trend: [0.28, 0.29, 0.30, 0.31, 0.32, 0.33, 0.34, 0.35, 0.36, 0.37, 0.38, 0.39, 0.39, 0.40, 0.41, 0.41, 0.42],
  },
]

// ---- Fluid Reactor Catalyst Data ----
interface FluidCatalyst {
  id: string
  unit: string
  process: string // FCC, VRHCR, CCR
  catalystName: string
  aiOptimalUsage: number // AI 최적 사용량 (ton/day)
  actualUsage: number // 실제 사용량 (ton/day)
  excessPct: number // 초과 사용률 (%)
  annualExcessCostKrw: number // 연간 초과 비용 (만원)
  savingPotentialKrw: number // 절감 가능 (만원)
  aiModelId: string
  usageTrend: { optimal: number; actual: number }[] // 최근 12주
}

const FLUID_DATA: FluidCatalyst[] = [
  {
    id: "FL-FCC01", unit: "FCC", process: "FCC", catalystName: "E-Cat (USY Zeolite)",
    aiOptimalUsage: 8.2, actualUsage: 9.5, excessPct: 15.9, annualExcessCostKrw: 128000, savingPotentialKrw: 95000,
    aiModelId: "AI-MDL-FL01",
    usageTrend: Array.from({ length: 12 }, (_, i) => ({ optimal: 8.0 + Math.sin(i * 0.5) * 0.3, actual: 9.2 + Math.sin(i * 0.4) * 0.5 })),
  },
  {
    id: "FL-FCC02", unit: "FCC", process: "FCC", catalystName: "Fresh Cat Additive (ZSM-5)",
    aiOptimalUsage: 1.1, actualUsage: 1.4, excessPct: 27.3, annualExcessCostKrw: 45000, savingPotentialKrw: 32000,
    aiModelId: "AI-MDL-FL02",
    usageTrend: Array.from({ length: 12 }, (_, i) => ({ optimal: 1.0 + Math.sin(i * 0.6) * 0.15, actual: 1.3 + Math.sin(i * 0.3) * 0.2 })),
  },
  {
    id: "FL-VRH01", unit: "VRHCR", process: "VRHCR", catalystName: "VRDS Catalyst (NiMo)",
    aiOptimalUsage: 3.5, actualUsage: 3.8, excessPct: 8.6, annualExcessCostKrw: 62000, savingPotentialKrw: 45000,
    aiModelId: "AI-MDL-FL03",
    usageTrend: Array.from({ length: 12 }, (_, i) => ({ optimal: 3.4 + Math.sin(i * 0.4) * 0.2, actual: 3.7 + Math.sin(i * 0.5) * 0.25 })),
  },
  {
    id: "FL-CCR01", unit: "CCR", process: "CCR", catalystName: "Pt-Sn/Al2O3 (Continuous)",
    aiOptimalUsage: 0.45, actualUsage: 0.48, excessPct: 6.7, annualExcessCostKrw: 18000, savingPotentialKrw: 12000,
    aiModelId: "AI-MDL-FL04",
    usageTrend: Array.from({ length: 12 }, (_, i) => ({ optimal: 0.44 + Math.sin(i * 0.3) * 0.02, actual: 0.47 + Math.sin(i * 0.5) * 0.03 })),
  },
]

// ---- Mini Chart ----
function MiniTrend({ data, limit, width = 100, height = 28 }: { data: number[]; limit: number; width?: number; height?: number }) {
  if (!data.length) return null
  const min = Math.min(...data, limit) * 0.98
  const max = Math.max(...data, limit) * 1.02
  const range = max - min || 1
  const p = 2
  const toX = (i: number) => p + (i / (data.length - 1)) * (width - p * 2)
  const toY = (v: number) => p + (1 - (v - min) / range) * (height - p * 2)
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(" ")
  return (
    <svg width={width} height={height} className="shrink-0">
      <line x1={p} y1={toY(limit)} x2={width - p} y2={toY(limit)} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.5" />
      <path d={path} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1])} r="2" fill="#6366f1" />
    </svg>
  )
}

function UsageCompareChart({ data, width = 200, height = 48 }: { data: { optimal: number; actual: number }[]; width?: number; height?: number }) {
  if (!data.length) return null
  const allVals = data.flatMap(d => [d.optimal, d.actual])
  const min = Math.min(...allVals) * 0.92
  const max = Math.max(...allVals) * 1.08
  const range = max - min || 1
  const p = 2
  const toX = (i: number) => p + (i / (data.length - 1)) * (width - p * 2)
  const toY = (v: number) => p + (1 - (v - min) / range) * (height - p * 2)
  const optPath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(d.optimal).toFixed(1)}`).join(" ")
  const actPath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(d.actual).toFixed(1)}`).join(" ")
  // fill area between
  const areaPath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(d.actual).toFixed(1)}`).join(" ") +
    data.slice().reverse().map((d, i) => `L ${toX(data.length - 1 - i).toFixed(1)} ${toY(d.optimal).toFixed(1)}`).join(" ") + " Z"
  return (
    <svg width={width} height={height} className="shrink-0">
      <path d={areaPath} fill="#ef4444" opacity="0.08" />
      <path d={optPath} fill="none" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="3 2" />
      <path d={actPath} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function CatalystInsightPage() {
  const router = useRouter()
  const [unitFilter, setUnitFilter] = useState<string>("all")
  const [expandedFixed, setExpandedFixed] = useState<string | null>(null)

  const filteredFixed = useMemo(() =>
    unitFilter === "all" ? FIXED_BED_DATA : FIXED_BED_DATA.filter(d => d.unit === unitFilter), [unitFilter])
  const filteredFluid = useMemo(() =>
    unitFilter === "all" ? FLUID_DATA : FLUID_DATA.filter(d => d.unit === unitFilter), [unitFilter])

  const totalFixedSaving = filteredFixed.reduce((s, d) => s + d.annualSavingKrw, 0)
  const totalFluidSaving = filteredFluid.reduce((s, d) => s + d.savingPotentialKrw, 0)
  const totalSaving = totalFixedSaving + totalFluidSaving
  const allUnits = Array.from(new Set([...FIXED_BED_DATA.map(d => d.unit), ...FLUID_DATA.map(d => d.unit)])).sort()

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-6 py-4">
          <h1 className="text-lg font-semibold">촉매 수명 / 사용량 분석</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fixed Bed 촉매 잔여 수명 기반 Severity 상향 Potential 및 Fluid 반응기 촉매 사용량 최적화 인사이트
          </p>
        </header>

        <main className="p-6 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-green-200/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">{(totalSaving / 10000).toFixed(1)}억원</p>
                    <p className="text-xs text-muted-foreground">Total Saving Potential / 년</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{(totalFixedSaving / 10000).toFixed(1)}억원</p>
                    <p className="text-xs text-muted-foreground">Fixed Bed Severity 상향</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{(totalFluidSaving / 10000).toFixed(1)}억원</p>
                    <p className="text-xs text-muted-foreground">Fluid 촉매 사용량 절감</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div>
                  <p className="text-2xl font-bold">{filteredFixed.length + filteredFluid.length}</p>
                  <p className="text-xs text-muted-foreground">분석 대상 항목</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="공정" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 공정</SelectItem>
                {allUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="fixed-bed" className="space-y-4">
            <TabsList>
              <TabsTrigger value="fixed-bed" className="gap-1.5"><Flame className="h-3.5 w-3.5" /> Fixed Bed 촉매</TabsTrigger>
              <TabsTrigger value="fluid" className="gap-1.5"><Activity className="h-3.5 w-3.5" /> Fluid 반응기 촉매</TabsTrigger>
            </TabsList>

            {/* ===== FIXED BED TAB ===== */}
            <TabsContent value="fixed-bed" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    Fixed Bed 촉매 수명 Margin 기반 Severity 상향 Potential
                    <Badge variant="secondary" className="text-[10px]">{filteredFixed.length}건</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[90px]">장치</TableHead>
                          <TableHead className="min-w-[130px]">Reactor</TableHead>
                          <TableHead className="w-[60px]">공정</TableHead>
                          <TableHead className="w-[100px]">촉매 종류</TableHead>
                          <TableHead className="text-right w-[80px]">현재값</TableHead>
                          <TableHead className="w-[100px] text-center">트렌드</TableHead>
                          <TableHead className="text-right w-[70px]">잔여수명</TableHead>
                          <TableHead className="text-right w-[80px]">현 Severity</TableHead>
                          <TableHead className="text-right w-[90px]">상향 Potential</TableHead>
                          <TableHead className="text-right w-[90px]">연간 절감</TableHead>
                          <TableHead className="w-[50px]">AI</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFixed.map(d => {
                          const isExpanded = expandedFixed === d.id
                          const lifePctColor = d.remainingLifePct <= 20 ? "text-red-600" : d.remainingLifePct <= 40 ? "text-amber-600" : "text-emerald-600"
                          return (
                            <>
                              <TableRow
                                key={d.id}
                                className={cn("cursor-pointer transition-colors", isExpanded && "bg-primary/5")}
                                onClick={() => setExpandedFixed(isExpanded ? null : d.id)}
                              >
                                <TableCell className="font-mono text-xs font-medium">{d.id}</TableCell>
                                <TableCell className="text-sm">{d.reactor}</TableCell>
                                <TableCell><Badge variant="outline" className="text-[10px] h-5">{d.unit}</Badge></TableCell>
                                <TableCell className="text-xs text-muted-foreground">{d.catalystType}</TableCell>
                                <TableCell className="text-right font-mono text-sm">
                                  {d.currentValue} <span className="text-[10px] text-muted-foreground">{d.healthIndex === "dP" ? "kg/cm2" : "C"}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <MiniTrend data={d.trend} limit={d.limitValue} />
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex flex-col items-end">
                                    <span className={cn("font-mono text-sm font-semibold", lifePctColor)}>{d.remainingLifeWeeks}주</span>
                                    <span className="text-[10px] text-muted-foreground">{d.remainingLifePct}%</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm">{d.currentSeverity}%</TableCell>
                                <TableCell className="text-right">
                                  <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 text-xs font-mono">
                                    +{d.maxSeverityPotential}%
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="font-mono text-sm font-semibold text-green-600">{(d.annualSavingKrw / 10000).toFixed(1)}억</span>
                                </TableCell>
                                <TableCell>
                                  {d.aiModelId && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={e => { e.stopPropagation(); router.push(`/optimization/ai-ml?model=${d.aiModelId}`) }}
                                    >
                                      <Cpu className="h-3.5 w-3.5 text-indigo-500" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                              {isExpanded && (
                                <TableRow key={`${d.id}-detail`}>
                                  <TableCell colSpan={11} className="bg-muted/30 p-0">
                                    <div className="p-4 space-y-3">
                                      <h4 className="text-xs font-semibold text-muted-foreground">Severity 상향 옵션</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {d.options.map((opt, i) => (
                                          <Card key={i} className="border-dashed">
                                            <CardContent className="p-3 space-y-2">
                                              <p className="text-sm font-medium">{opt.label}</p>
                                              <p className="text-xs text-muted-foreground">{opt.impact}</p>
                                              <div className="flex items-center justify-between">
                                                <Badge variant="outline" className="text-[10px] border-green-300 text-green-600">
                                                  연 {(opt.saving / 10000).toFixed(1)}억 절감
                                                </Badge>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))}
                                      </div>
                                      <p className="text-[11px] text-muted-foreground">
                                        * 잔여 수명이 충분한 촉매의 경우, TA 전 마진을 활용하여 Severity를 상향함으로써 추가 수익을 확보할 수 있습니다.
                                        촉매 수명 소진 시점은 AI 모델 기반으로 계산됩니다.
                                      </p>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== FLUID TAB ===== */}
            <TabsContent value="fluid" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    Fluid 반응기 촉매 사용량 AI 최적 대비 실측 비교
                    <Badge variant="secondary" className="text-[10px]">{filteredFluid.length}건</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[90px]">ID</TableHead>
                          <TableHead className="min-w-[130px]">촉매</TableHead>
                          <TableHead className="w-[60px]">공정</TableHead>
                          <TableHead className="text-right w-[90px]">AI 최적 (t/d)</TableHead>
                          <TableHead className="text-right w-[90px]">실제 (t/d)</TableHead>
                          <TableHead className="text-right w-[80px]">초과율</TableHead>
                          <TableHead className="w-[200px] text-center">사용량 트렌드 (12주)</TableHead>
                          <TableHead className="text-right w-[100px]">연간 초과비용</TableHead>
                          <TableHead className="text-right w-[100px]">절감 Potential</TableHead>
                          <TableHead className="w-[50px]">AI</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFluid.map(d => (
                          <TableRow key={d.id}>
                            <TableCell className="font-mono text-xs font-medium">{d.id}</TableCell>
                            <TableCell className="text-sm">{d.catalystName}</TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px] h-5">{d.process}</Badge></TableCell>
                            <TableCell className="text-right font-mono text-sm text-emerald-600">{d.aiOptimalUsage.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono text-sm font-semibold">{d.actualUsage.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className={cn("text-xs font-mono",
                                d.excessPct >= 20 ? "border-red-300 text-red-600 bg-red-50" :
                                d.excessPct >= 10 ? "border-amber-300 text-amber-600 bg-amber-50" :
                                "border-emerald-300 text-emerald-600 bg-emerald-50"
                              )}>
                                +{d.excessPct.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <UsageCompareChart data={d.usageTrend} />
                                <div className="flex flex-col gap-0.5 text-[9px]">
                                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500 rounded inline-block" style={{ borderTop: "1px dashed #10b981" }} /> AI</span>
                                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 rounded inline-block" /> 실제</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm text-red-600">{(d.annualExcessCostKrw / 10000).toFixed(1)}억</TableCell>
                            <TableCell className="text-right font-mono text-sm font-semibold text-green-600">{(d.savingPotentialKrw / 10000).toFixed(1)}억</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => router.push(`/optimization/ai-ml?model=${d.aiModelId}`)}
                              >
                                <Cpu className="h-3.5 w-3.5 text-indigo-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-muted/30 border">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium">촉매 사용량 최적화 안내</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Fluid 반응기(FCC, VRHCR, CCR)의 촉매 사용량은 AI 모델이 Feed 성상, 목표 제품 품질, 운전 조건을 종합하여 최적량을 산출합니다.
                          실제 사용량이 AI 최적 대비 과다한 경우 비용 누수가 발생하며, 위 표는 그 차이와 절감 가능액을 보여줍니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AppShell>
  )
}
