"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { 
  Target, Play, RotateCcw, Save, Download, TrendingUp, TrendingDown,
  BarChart3, Cpu, Box, CheckCircle, Clock
} from "lucide-react"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"

interface Variable {
  id: string
  name: string
  unit: string
  base: number
  min: number
  max: number
  current: number
}

interface ModelArtifact {
  id: string
  name: string
  process: string
  type: "RTO" | "ML" | "First-Principle"
  description: string
  lastTrained: string
  accuracy: number
  variables: Variable[]
  outputs: { name: string; unit: string; base: string }[]
}

const MODEL_ARTIFACTS: ModelArtifact[] = [
  {
    id: "hcr-rto-yield",
    name: "HCR Yield Optimizer",
    process: "HCR",
    type: "RTO",
    description: "HCR 수율 최적화 RTO 모델 - 반응기 온도/압력/수소비 기반 수율 예측",
    lastTrained: "2025-01-15",
    accuracy: 96.2,
    variables: [
      { id: "feed-rate", name: "Feed Rate", unit: "m3/h", base: 120, min: 80, max: 160, current: 120 },
      { id: "reactor-temp", name: "Reactor Inlet Temp", unit: "C", base: 385, min: 370, max: 400, current: 385 },
      { id: "h2-ratio", name: "H2/HC Ratio", unit: "mol/mol", base: 5.2, min: 4.0, max: 7.0, current: 5.2 },
      { id: "pressure", name: "Reactor Pressure", unit: "kg/cm2", base: 155, min: 140, max: 170, current: 155 },
      { id: "recycle-ratio", name: "Recycle Gas Ratio", unit: "%", base: 72, min: 60, max: 85, current: 72 },
    ],
    outputs: [
      { name: "Conversion", unit: "%", base: "91.2" },
      { name: "Product Yield", unit: "%", base: "77.8" },
      { name: "Energy Index", unit: "idx", base: "1.06" },
    ],
  },
  {
    id: "hcr-catalyst-life",
    name: "HCR Catalyst Life Predictor",
    process: "HCR",
    type: "ML",
    description: "HCR 촉매 수명 예측 ML 모델 - WABT, Feed Quality 기반 EOR 시점 예측",
    lastTrained: "2025-02-01",
    accuracy: 93.8,
    variables: [
      { id: "wabt", name: "WABT", unit: "C", base: 392, min: 380, max: 410, current: 392 },
      { id: "feed-sulfur", name: "Feed Sulfur", unit: "wt%", base: 2.1, min: 1.0, max: 3.5, current: 2.1 },
      { id: "feed-nitrogen", name: "Feed Nitrogen", unit: "ppm", base: 850, min: 500, max: 1500, current: 850 },
      { id: "lhsv", name: "LHSV", unit: "1/h", base: 0.8, min: 0.5, max: 1.2, current: 0.8 },
      { id: "h2pp", name: "H2 Partial Pressure", unit: "bar", base: 130, min: 100, max: 160, current: 130 },
    ],
    outputs: [
      { name: "Remaining Catalyst Life", unit: "months", base: "8.2" },
      { name: "Deactivation Rate", unit: "C/month", base: "1.1" },
      { name: "EOR WABT", unit: "C", base: "415" },
    ],
  },
  {
    id: "cdu-energy",
    name: "CDU Energy Optimizer",
    process: "CDU",
    type: "First-Principle",
    description: "CDU 에너지 최적화 모델 - 증류탑 환류비, 히터 효율 기반 에너지 소비 예측",
    lastTrained: "2025-01-20",
    accuracy: 94.5,
    variables: [
      { id: "crude-rate", name: "Crude Feed Rate", unit: "kBPD", base: 85, min: 60, max: 110, current: 85 },
      { id: "reflux-ratio", name: "Reflux Ratio", unit: "-", base: 2.8, min: 2.0, max: 4.0, current: 2.8 },
      { id: "top-temp", name: "Overhead Temp", unit: "C", base: 118, min: 105, max: 135, current: 118 },
      { id: "heater-cot", name: "Heater COT", unit: "C", base: 365, min: 350, max: 380, current: 365 },
      { id: "stripping-steam", name: "Stripping Steam", unit: "ton/h", base: 4.5, min: 3.0, max: 6.0, current: 4.5 },
    ],
    outputs: [
      { name: "Energy Consumption", unit: "Gcal/h", base: "42.5" },
      { name: "Heater Efficiency", unit: "%", base: "89.2" },
      { name: "Operating Cost", unit: "$/bbl", base: "1.85" },
    ],
  },
  {
    id: "ccr-regen",
    name: "CCR Regeneration Optimizer",
    process: "CCR",
    type: "ML",
    description: "CCR 촉매 재생 최적화 - 재생 조건에 따른 촉매 활성 회복률 예측",
    lastTrained: "2025-01-28",
    accuracy: 91.7,
    variables: [
      { id: "regen-temp", name: "Regeneration Temp", unit: "C", base: 530, min: 500, max: 560, current: 530 },
      { id: "air-rate", name: "Air Flow Rate", unit: "Nm3/h", base: 1200, min: 800, max: 1600, current: 1200 },
      { id: "coke-content", name: "Coke on Catalyst", unit: "wt%", base: 4.2, min: 2.0, max: 7.0, current: 4.2 },
      { id: "cl-ratio", name: "Chloride Ratio", unit: "ppm", base: 1.1, min: 0.5, max: 2.0, current: 1.1 },
    ],
    outputs: [
      { name: "Activity Recovery", unit: "%", base: "97.5" },
      { name: "Coke Burn-off", unit: "%", base: "99.2" },
      { name: "Catalyst Loss", unit: "kg/day", base: "0.8" },
    ],
  },
]

const TYPE_COLORS: Record<string, string> = {
  RTO: "bg-blue-50 text-blue-700 border-blue-200",
  ML: "bg-purple-50 text-purple-700 border-purple-200",
  "First-Principle": "bg-teal-50 text-teal-700 border-teal-200",
}

export default function WhatIfSimulationPage() {
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [variables, setVariables] = useState<Variable[]>([])
  const [isSimulated, setIsSimulated] = useState(false)

  const selectedModel = MODEL_ARTIFACTS.find(m => m.id === selectedModelId)

  const handleSelectModel = (modelId: string) => {
    const model = MODEL_ARTIFACTS.find(m => m.id === modelId)!
    setSelectedModelId(modelId)
    setVariables(model.variables.map(v => ({ ...v })))
    setIsSimulated(false)
  }

  const handleVariableChange = (id: string, value: number) => {
    setVariables(prev => prev.map(v => v.id === id ? { ...v, current: value } : v))
    setIsSimulated(false)
  }

  const handleReset = () => {
    if (selectedModel) {
      setVariables(selectedModel.variables.map(v => ({ ...v })))
      setIsSimulated(false)
    }
  }

  const handleSimulate = () => {
    setIsSimulated(true)
  }

  // Model selection screen
  if (!selectedModelId) {
    return (
      <AppShell>
        <div className="min-h-screen bg-background">
          <header className="border-b border-border bg-card">
            <div className="px-6 py-4">
              <h1 className="text-lg font-semibold">What-if Simulation</h1>
              <p className="text-sm text-muted-foreground mt-1">시뮬레이션에 사용할 모델 아티팩트를 선택하세요</p>
            </div>
          </header>
          <main className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {MODEL_ARTIFACTS.map(model => (
                <button
                  key={model.id}
                  className="text-left p-5 border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  onClick={() => handleSelectModel(model.id)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-muted">
                      {model.type === "RTO" ? <Cpu className="h-5 w-5 text-blue-600" /> :
                       model.type === "ML" ? <Box className="h-5 w-5 text-purple-600" /> :
                       <BarChart3 className="h-5 w-5 text-teal-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{model.name}</h3>
                        <Badge variant="outline" className={cn("text-xs", TYPE_COLORS[model.type])}>{model.type}</Badge>
                      </div>
                      <Badge variant="secondary" className="text-xs mt-0.5">{model.process}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{model.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" />정확도 {model.accuracy}%</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{model.lastTrained}</span>
                    <span>{model.variables.length}개 변수</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {model.outputs.map(o => (
                      <Badge key={o.name} variant="secondary" className="text-xs">{o.name}</Badge>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </main>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => { setSelectedModelId(null); setIsSimulated(false) }}>
                  &larr; 모델 선택
                </Button>
                <Badge variant="outline" className={cn("text-xs", TYPE_COLORS[selectedModel!.type])}>{selectedModel!.type}</Badge>
                <Badge variant="secondary" className="text-xs">{selectedModel!.process}</Badge>
              </div>
              <h1 className="text-lg font-semibold">{selectedModel!.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{selectedModel!.description}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-green-500" />정확도 {selectedModel!.accuracy}%</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Last trained: {selectedModel!.lastTrained}</span>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Left: Input Variables */}
            <div className="col-span-1 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    입력 변수 조정
                    <Button variant="ghost" size="sm" className="text-xs" onClick={handleReset}>
                      <RotateCcw className="h-3 w-3 mr-1" />
                      초기화
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {variables.map(v => {
                    const diff = v.current - v.base
                    const diffPct = v.base !== 0 ? ((diff / v.base) * 100).toFixed(1) : "0"
                    return (
                      <div key={v.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">{v.name}</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-bold">{v.current} {v.unit}</span>
                            {diff !== 0 && (
                              <Badge variant="outline" className={cn("text-xs", diff > 0 ? "text-red-600 border-red-200" : "text-blue-600 border-blue-200")}>
                                {diff > 0 ? "+" : ""}{diffPct}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Slider
                          value={[v.current]}
                          min={v.min}
                          max={v.max}
                          step={v.max - v.min > 100 ? 1 : 0.1}
                          onValueChange={([val]) => handleVariableChange(v.id, Math.round(val * 10) / 10)}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{v.min}</span>
                          <span className="text-foreground/50">Base: {v.base}</span>
                          <span>{v.max}</span>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              <Button className="w-full gap-2" size="lg" onClick={handleSimulate}>
                <Play className="h-4 w-4" />
                시뮬레이션 실행
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2 bg-transparent">
                  <Save className="h-4 w-4" />
                  시나리오 저장
                </Button>
                <Button variant="outline" className="flex-1 gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  결과 내보내기
                </Button>
              </div>
            </div>

            {/* Right: Simulation Results */}
            <div className="col-span-2 space-y-4">
              {!isSimulated ? (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center py-20">
                    <Target className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">시뮬레이션 대기 중</h3>
                    <p className="text-sm text-muted-foreground/70 mt-2">좌측 패널에서 변수를 조정한 후 &ldquo;시뮬레이션 실행&rdquo; 버튼을 클릭하세요</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* KPI Results */}
                  <div className={cn("grid gap-4", selectedModel!.outputs.length <= 3 ? "grid-cols-3" : "grid-cols-4")}>
                    {selectedModel!.outputs.map((out, i) => {
                      const isPositive = i % 2 === 0
                      return (
                        <Card key={out.name} className={cn("border", isPositive ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50")}>
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">{out.name}</p>
                                <p className="text-2xl font-bold">{(Number(out.base) * (1 + (Math.random() * 0.04 - 0.01))).toFixed(1)}{out.unit === "%" || out.unit === "months" ? out.unit : ""}</p>
                              </div>
                              <div className={cn("flex items-center", isPositive ? "text-green-600" : "text-red-600")}>
                                {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                                <span className="text-sm font-medium">{isPositive ? "+" : "-"}{(Math.random() * 3).toFixed(1)}%</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  {/* Comparison Table */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Base Case vs Simulation 비교</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium text-muted-foreground">항목</th>
                            <th className="text-right py-2 font-medium text-muted-foreground">Base</th>
                            <th className="text-right py-2 font-medium text-muted-foreground">Simulation</th>
                            <th className="text-right py-2 font-medium text-muted-foreground">차이</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedModel!.outputs.map((out, i) => {
                            const simVal = (Number(out.base) * (1 + (Math.random() * 0.04 - 0.01))).toFixed(1)
                            const diff = (Number(simVal) - Number(out.base)).toFixed(2)
                            const positive = Number(diff) > 0
                            return (
                              <tr key={out.name} className="border-b last:border-0">
                                <td className="py-2.5">{out.name}</td>
                                <td className="text-right font-mono">{out.base} {out.unit}</td>
                                <td className="text-right font-mono font-medium">{simVal} {out.unit}</td>
                                <td className={cn("text-right font-mono font-medium", positive ? "text-green-600" : "text-red-600")}>{positive ? "+" : ""}{diff}</td>
                              </tr>
                            )
                          })}
                          {variables.filter(v => v.current !== v.base).map(v => (
                            <tr key={v.id} className="border-b last:border-0 text-muted-foreground">
                              <td className="py-2.5 text-xs">{v.name} (입력)</td>
                              <td className="text-right font-mono text-xs">{v.base} {v.unit}</td>
                              <td className="text-right font-mono text-xs font-medium">{v.current} {v.unit}</td>
                              <td className={cn("text-right font-mono text-xs font-medium", v.current > v.base ? "text-red-600" : "text-blue-600")}>
                                {v.current > v.base ? "+" : ""}{(v.current - v.base).toFixed(1)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>

                  {/* Trend Chart Placeholder */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        예상 트렌드 (30일)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">시뮬레이션 기반 예상 트렌드 차트</p>
                          <p className="text-xs mt-1">{selectedModel!.outputs.map(o => o.name).join(", ")} 예측 곡선</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
