"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Target, Play, RotateCcw, Save, Download, TrendingUp, TrendingDown,
  BarChart3, Cpu, Box, CheckCircle, Clock, ChevronRight, ChevronLeft,
  Settings2, Layers, Calendar, FileText, ArrowRight, Zap, Activity, LineChart
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
  outputs: { id: string; name: string; unit: string; base: number }[]
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
      { id: "reactor-temp", name: "Reactor Inlet Temp", unit: "°C", base: 385, min: 370, max: 400, current: 385 },
      { id: "h2-ratio", name: "H2/HC Ratio", unit: "mol/mol", base: 5.2, min: 4.0, max: 7.0, current: 5.2 },
      { id: "pressure", name: "Reactor Pressure", unit: "kg/cm2", base: 155, min: 140, max: 170, current: 155 },
      { id: "recycle-ratio", name: "Recycle Gas Ratio", unit: "%", base: 72, min: 60, max: 85, current: 72 },
    ],
    outputs: [
      { id: "conversion", name: "Conversion", unit: "%", base: 91.2 },
      { id: "yield", name: "Product Yield", unit: "%", base: 77.8 },
      { id: "energy", name: "Energy Index", unit: "idx", base: 1.06 },
    ],
  },
  {
    id: "vgofcc-yield",
    name: "VGOFCC Yield Predictor",
    process: "VGOFCC",
    type: "ML",
    description: "VGOFCC 수율 예측 모델 - Feed 조성, 반응 온도 기반 제품 수율 예측",
    lastTrained: "2025-02-10",
    accuracy: 94.5,
    variables: [
      { id: "feed-bav", name: "Feed BAV Ratio", unit: "%", base: 35, min: 10, max: 60, current: 35 },
      { id: "riser-temp", name: "Riser Outlet Temp", unit: "°C", base: 525, min: 500, max: 550, current: 525 },
      { id: "cat-oil", name: "Cat/Oil Ratio", unit: "-", base: 6.5, min: 5.0, max: 8.0, current: 6.5 },
      { id: "feed-rate", name: "Feed Rate", unit: "kBPD", base: 45, min: 30, max: 60, current: 45 },
      { id: "preheat", name: "Feed Preheat Temp", unit: "°C", base: 280, min: 250, max: 320, current: 280 },
    ],
    outputs: [
      { id: "gasoline", name: "Gasoline Yield", unit: "%", base: 48.5 },
      { id: "lpg", name: "LPG Yield", unit: "%", base: 18.2 },
      { id: "lcn", name: "LCN Yield", unit: "%", base: 12.8 },
      { id: "slurry", name: "Slurry Yield", unit: "%", base: 5.2 },
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
      { id: "top-temp", name: "Overhead Temp", unit: "°C", base: 118, min: 105, max: 135, current: 118 },
      { id: "heater-cot", name: "Heater COT", unit: "°C", base: 365, min: 350, max: 380, current: 365 },
      { id: "stripping-steam", name: "Stripping Steam", unit: "ton/h", base: 4.5, min: 3.0, max: 6.0, current: 4.5 },
    ],
    outputs: [
      { id: "energy", name: "Energy Consumption", unit: "Gcal/h", base: 42.5 },
      { id: "efficiency", name: "Heater Efficiency", unit: "%", base: 89.2 },
      { id: "cost", name: "Operating Cost", unit: "$/bbl", base: 1.85 },
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
      { id: "regen-temp", name: "Regeneration Temp", unit: "°C", base: 530, min: 500, max: 560, current: 530 },
      { id: "air-rate", name: "Air Flow Rate", unit: "Nm3/h", base: 1200, min: 800, max: 1600, current: 1200 },
      { id: "coke-content", name: "Coke on Catalyst", unit: "wt%", base: 4.2, min: 2.0, max: 7.0, current: 4.2 },
      { id: "cl-ratio", name: "Chloride Ratio", unit: "ppm", base: 1.1, min: 0.5, max: 2.0, current: 1.1 },
    ],
    outputs: [
      { id: "recovery", name: "Activity Recovery", unit: "%", base: 97.5 },
      { id: "burnoff", name: "Coke Burn-off", unit: "%", base: 99.2 },
      { id: "loss", name: "Catalyst Loss", unit: "kg/day", base: 0.8 },
    ],
  },
]

const TYPE_COLORS: Record<string, string> = {
  RTO: "bg-blue-50 text-blue-700 border-blue-200",
  ML: "bg-purple-50 text-purple-700 border-purple-200",
  "First-Principle": "bg-teal-50 text-teal-700 border-teal-200",
}

const BASELINE_OPTIONS = [
  { id: "current", label: "현재값", description: "실시간 DCS 데이터 기준" },
  { id: "date", label: "특정 날짜", description: "과거 특정 시점 데이터" },
  { id: "plan", label: "운영계획서 계획값", description: "월간/주간 운영 계획 기준" },
]

const STEPS = [
  { id: 1, label: "모델 선택", icon: Cpu },
  { id: 2, label: "베이스라인 선택", icon: Target },
  { id: 3, label: "변수 조절", icon: Settings2 },
  { id: 4, label: "실행 및 결과", icon: Play },
  { id: 5, label: "저장/내보내기", icon: Save },
]

export default function WhatIfSimulationPage() {
  // Mode: basic or advanced
  const [mode, setMode] = useState<"basic" | "advanced">("basic")
  
  // Basic simulation state
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [baselineType, setBaselineType] = useState<string>("current")
  const [baselineDate, setBaselineDate] = useState("2026-02-27")
  const [variables, setVariables] = useState<Variable[]>([])
  const [isSimulating, setIsSimulating] = useState(false)
  const [isSimulated, setIsSimulated] = useState(false)
  const [simulationResults, setSimulationResults] = useState<{name: string; unit: string; base: number; simulated: number; diff: number; diffPct: number}[]>([])
  
  // Advanced simulation state
  const [advSelectedModelId, setAdvSelectedModelId] = useState<string | null>(null)
  const [advBaselineType, setAdvBaselineType] = useState<string>("current")
  const [advInputVar1, setAdvInputVar1] = useState<string>("")
  const [advInputVar2, setAdvInputVar2] = useState<string>("")
  const [advOutputVar, setAdvOutputVar] = useState<string>("")
  const [advVar1Start, setAdvVar1Start] = useState<number>(0)
  const [advVar1End, setAdvVar1End] = useState<number>(100)
  const [advVar1Step, setAdvVar1Step] = useState<number>(5)
  const [advVar2Start, setAdvVar2Start] = useState<number>(0)
  const [advVar2End, setAdvVar2End] = useState<number>(100)
  const [advVar2Step, setAdvVar2Step] = useState<number>(5)
  const [advIsSimulating, setAdvIsSimulating] = useState(false)
  const [advIsSimulated, setAdvIsSimulated] = useState(false)
  const [advProgress, setAdvProgress] = useState(0)
  const [advResults, setAdvResults] = useState<{x: number; y?: number; z: number}[]>([])
  
  const selectedModel = MODEL_ARTIFACTS.find(m => m.id === selectedModelId)
  const advSelectedModel = MODEL_ARTIFACTS.find(m => m.id === advSelectedModelId)
  
  // Basic simulation handlers
  const handleSelectModel = (modelId: string) => {
    const model = MODEL_ARTIFACTS.find(m => m.id === modelId)!
    setSelectedModelId(modelId)
    setVariables(model.variables.map(v => ({ ...v })))
    setIsSimulated(false)
    setSimulationResults([])
  }
  
  const handleVariableChange = (id: string, value: number) => {
    setVariables(prev => prev.map(v => v.id === id ? { ...v, current: value } : v))
  }
  
  const handleReset = () => {
    if (selectedModel) {
      setVariables(selectedModel.variables.map(v => ({ ...v })))
    }
  }
  
  const handleSimulate = async () => {
    setIsSimulating(true)
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    if (selectedModel) {
      const results = selectedModel.outputs.map(out => {
        // Mock simulation - apply some random variation based on variable changes
        const varianceFromChanges = variables.reduce((acc, v) => {
          const changePct = (v.current - v.base) / v.base
          return acc + changePct * (Math.random() * 0.5)
        }, 0)
        const simulated = out.base * (1 + varianceFromChanges * 0.1 + (Math.random() * 0.02 - 0.01))
        const diff = simulated - out.base
        const diffPct = (diff / out.base) * 100
        return {
          name: out.name,
          unit: out.unit,
          base: out.base,
          simulated: Math.round(simulated * 100) / 100,
          diff: Math.round(diff * 100) / 100,
          diffPct: Math.round(diffPct * 10) / 10,
        }
      })
      setSimulationResults(results)
    }
    
    setIsSimulating(false)
    setIsSimulated(true)
  }
  
  const handleNextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1)
  }
  
  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }
  
  // Advanced simulation handlers
  const handleAdvSelectModel = (modelId: string) => {
    const model = MODEL_ARTIFACTS.find(m => m.id === modelId)!
    setAdvSelectedModelId(modelId)
    setAdvInputVar1(model.variables[0]?.id || "")
    setAdvInputVar2("")
    setAdvOutputVar(model.outputs[0]?.id || "")
    const firstVar = model.variables[0]
    if (firstVar) {
      setAdvVar1Start(firstVar.min)
      setAdvVar1End(firstVar.max)
      setAdvVar1Step(Math.round((firstVar.max - firstVar.min) / 10))
    }
    setAdvIsSimulated(false)
    setAdvResults([])
  }
  
  const handleAdvInputVar1Change = (varId: string) => {
    setAdvInputVar1(varId)
    const model = advSelectedModel
    if (model) {
      const v = model.variables.find(v => v.id === varId)
      if (v) {
        setAdvVar1Start(v.min)
        setAdvVar1End(v.max)
        setAdvVar1Step(Math.round((v.max - v.min) / 10))
      }
    }
  }
  
  const handleAdvInputVar2Change = (varId: string) => {
    setAdvInputVar2(varId)
    const model = advSelectedModel
    if (model && varId) {
      const v = model.variables.find(v => v.id === varId)
      if (v) {
        setAdvVar2Start(v.min)
        setAdvVar2End(v.max)
        setAdvVar2Step(Math.round((v.max - v.min) / 5))
      }
    }
  }
  
  const handleAdvSimulate = async () => {
    if (!advSelectedModel) return
    
    setAdvIsSimulating(true)
    setAdvProgress(0)
    
    const results: {x: number; y?: number; z: number}[] = []
    const var1Steps = Math.ceil((advVar1End - advVar1Start) / advVar1Step) + 1
    const var2Steps = advInputVar2 ? Math.ceil((advVar2End - advVar2Start) / advVar2Step) + 1 : 1
    const totalIterations = var1Steps * var2Steps
    let currentIteration = 0
    
    for (let x = advVar1Start; x <= advVar1End; x += advVar1Step) {
      if (advInputVar2) {
        for (let y = advVar2Start; y <= advVar2End; y += advVar2Step) {
          // Mock output calculation
          const outputVar = advSelectedModel.outputs.find(o => o.id === advOutputVar)
          const baseValue = outputVar?.base || 50
          const z = baseValue * (1 + (x - advVar1Start) / (advVar1End - advVar1Start) * 0.1 - (y - advVar2Start) / (advVar2End - advVar2Start) * 0.05 + Math.random() * 0.02)
          results.push({ x, y, z: Math.round(z * 100) / 100 })
          currentIteration++
          setAdvProgress(Math.round((currentIteration / totalIterations) * 100))
          await new Promise(resolve => setTimeout(resolve, 20))
        }
      } else {
        const outputVar = advSelectedModel.outputs.find(o => o.id === advOutputVar)
        const baseValue = outputVar?.base || 50
        const z = baseValue * (1 + (x - advVar1Start) / (advVar1End - advVar1Start) * 0.15 + Math.random() * 0.02 - 0.01)
        results.push({ x, z: Math.round(z * 100) / 100 })
        currentIteration++
        setAdvProgress(Math.round((currentIteration / totalIterations) * 100))
        await new Promise(resolve => setTimeout(resolve, 30))
      }
    }
    
    setAdvResults(results)
    setAdvIsSimulating(false)
    setAdvIsSimulated(true)
  }
  
  // Calculate iteration count for advanced mode
  const advIterationCount = useMemo(() => {
    const var1Steps = Math.ceil((advVar1End - advVar1Start) / advVar1Step) + 1
    const var2Steps = advInputVar2 ? Math.ceil((advVar2End - advVar2Start) / advVar2Step) + 1 : 1
    return var1Steps * var2Steps
  }, [advVar1Start, advVar1End, advVar1Step, advInputVar2, advVar2Start, advVar2End, advVar2Step])
  
  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        {/* Header with mode tabs */}
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  What-if Simulation
                </h1>
                <p className="text-sm text-muted-foreground mt-1">모델 기반 시뮬레이션으로 다양한 운전 시나리오를 분석합니다</p>
              </div>
              <Tabs value={mode} onValueChange={(v) => setMode(v as "basic" | "advanced")}>
                <TabsList>
                  <TabsTrigger value="basic" className="gap-2">
                    <Play className="h-4 w-4" />
                    기본 시뮬레이션
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="gap-2">
                    <Layers className="h-4 w-4" />
                    심화 시뮬레이션
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </header>
        
        {mode === "basic" ? (
          /* ===================== BASIC SIMULATION ===================== */
          <div className="p-6">
            {/* Step indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between max-w-3xl mx-auto">
                {STEPS.map((step, i) => {
                  const StepIcon = step.icon
                  const isCompleted = currentStep > step.id
                  const isCurrent = currentStep === step.id
                  return (
                    <div key={step.id} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                          isCompleted ? "bg-primary border-primary text-primary-foreground" :
                          isCurrent ? "border-primary text-primary bg-primary/10" :
                          "border-muted-foreground/30 text-muted-foreground"
                        )}>
                          {isCompleted ? <CheckCircle className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                        </div>
                        <span className={cn(
                          "text-xs mt-2 font-medium",
                          isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                        )}>{step.label}</span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={cn(
                          "w-20 h-0.5 mx-2",
                          currentStep > step.id ? "bg-primary" : "bg-muted-foreground/20"
                        )} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Step content */}
            <div className="max-w-4xl mx-auto">
              {/* Step 1: Model Selection */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold">Step 1. 시뮬레이션 모델 선택</h2>
                    <p className="text-sm text-muted-foreground mt-1">시뮬레이션에 사용할 모델 아티팩트를 선택하세요</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {MODEL_ARTIFACTS.map(model => (
                      <button
                        key={model.id}
                        className={cn(
                          "text-left p-5 border rounded-xl transition-all group",
                          selectedModelId === model.id
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "hover:border-primary/50 hover:bg-primary/5"
                        )}
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
                              <h3 className="font-semibold text-sm">{model.name}</h3>
                              <Badge variant="outline" className={cn("text-xs", TYPE_COLORS[model.type])}>{model.type}</Badge>
                            </div>
                            <Badge variant="secondary" className="text-xs mt-0.5">{model.process}</Badge>
                          </div>
                          {selectedModelId === model.id && <CheckCircle className="h-5 w-5 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{model.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" />정확도 {model.accuracy}%</span>
                          <span>{model.variables.length}개 변수</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleNextStep} disabled={!selectedModelId} className="gap-2">
                      다음 단계 <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Step 2: Baseline Selection */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold">Step 2. 베이스라인 조건 선택</h2>
                    <p className="text-sm text-muted-foreground mt-1">시뮬레이션의 기준이 될 베이스라인을 선택하세요</p>
                  </div>
                  <Card>
                    <CardContent className="pt-6">
                      <RadioGroup value={baselineType} onValueChange={setBaselineType} className="space-y-4">
                        {BASELINE_OPTIONS.map(opt => (
                          <div key={opt.id} className={cn(
                            "flex items-center space-x-4 p-4 rounded-lg border transition-colors cursor-pointer",
                            baselineType === opt.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                          )} onClick={() => setBaselineType(opt.id)}>
                            <RadioGroupItem value={opt.id} id={opt.id} />
                            <div className="flex-1">
                              <Label htmlFor={opt.id} className="font-medium cursor-pointer">{opt.label}</Label>
                              <p className="text-sm text-muted-foreground">{opt.description}</p>
                            </div>
                            {opt.id === "current" && <Badge variant="secondary">권장</Badge>}
                          </div>
                        ))}
                      </RadioGroup>
                      
                      {baselineType === "date" && (
                        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                          <Label className="text-sm">기준 날짜 선택</Label>
                          <Input
                            type="date"
                            value={baselineDate}
                            onChange={(e) => setBaselineDate(e.target.value)}
                            className="mt-2 max-w-xs"
                          />
                        </div>
                      )}
                      
                      {baselineType === "plan" && (
                        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                          <Label className="text-sm">운영 계획 선택</Label>
                          <Select defaultValue="weekly">
                            <SelectTrigger className="mt-2 max-w-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">주간 운영계획 (2026-W09)</SelectItem>
                              <SelectItem value="monthly">월간 운영계획 (2026-02)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={handlePrevStep} className="gap-2">
                      <ChevronLeft className="h-4 w-4" /> 이전 단계
                    </Button>
                    <Button onClick={handleNextStep} className="gap-2">
                      다음 단계 <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Step 3: Variable Adjustment */}
              {currentStep === 3 && selectedModel && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold">Step 3. 시뮬레이션 변수 조절</h2>
                    <p className="text-sm text-muted-foreground mt-1">시뮬레이션할 운전 조건을 조정하세요</p>
                  </div>
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{selectedModel.name}</CardTitle>
                          <CardDescription>입력 변수 {variables.length}개</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
                          <RotateCcw className="h-4 w-4" /> 초기화
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {variables.map(v => {
                        const diff = v.current - v.base
                        const diffPct = v.base !== 0 ? ((diff / v.base) * 100).toFixed(1) : "0"
                        return (
                          <div key={v.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">{v.name}</Label>
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
                              step={(v.max - v.min) / 100}
                              onValueChange={([val]) => handleVariableChange(v.id, Math.round(val * 100) / 100)}
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
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={handlePrevStep} className="gap-2">
                      <ChevronLeft className="h-4 w-4" /> 이전 단계
                    </Button>
                    <Button onClick={() => { handleSimulate(); handleNextStep(); }} className="gap-2">
                      <Play className="h-4 w-4" /> 시뮬레이션 실행
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Step 4: Results */}
              {currentStep === 4 && selectedModel && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold">Step 4. 실행 및 결과 확인</h2>
                    <p className="text-sm text-muted-foreground mt-1">시뮬레이션 결과를 확인하세요</p>
                  </div>
                  
                  {isSimulating ? (
                    <Card className="py-16">
                      <CardContent className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">시뮬레이션 실행 중...</p>
                      </CardContent>
                    </Card>
                  ) : isSimulated ? (
                    <>
                      {/* KPI Cards */}
                      <div className="grid grid-cols-3 gap-4">
                        {simulationResults.map(r => (
                          <Card key={r.name} className={cn(
                            "border",
                            r.diffPct >= 0 ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"
                          )}>
                            <CardContent className="pt-4 pb-4">
                              <p className="text-xs text-muted-foreground mb-1">{r.name}</p>
                              <div className="flex items-end justify-between">
                                <p className="text-2xl font-bold">{r.simulated}<span className="text-sm font-normal text-muted-foreground ml-1">{r.unit}</span></p>
                                <div className={cn("flex items-center text-sm font-medium", r.diffPct >= 0 ? "text-green-600" : "text-red-600")}>
                                  {r.diffPct >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                                  {r.diffPct >= 0 ? "+" : ""}{r.diffPct}%
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
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
                              {simulationResults.map(r => (
                                <tr key={r.name} className="border-b last:border-0">
                                  <td className="py-2.5 font-medium">{r.name}</td>
                                  <td className="text-right font-mono">{r.base} {r.unit}</td>
                                  <td className="text-right font-mono font-medium">{r.simulated} {r.unit}</td>
                                  <td className={cn("text-right font-mono font-medium", r.diff >= 0 ? "text-green-600" : "text-red-600")}>
                                    {r.diff >= 0 ? "+" : ""}{r.diff} ({r.diffPct}%)
                                  </td>
                                </tr>
                              ))}
                              <tr className="border-t-2">
                                <td colSpan={4} className="py-2 text-xs text-muted-foreground font-medium">입력 변수 변경사항</td>
                              </tr>
                              {variables.filter(v => v.current !== v.base).map(v => (
                                <tr key={v.id} className="text-muted-foreground">
                                  <td className="py-1.5 text-xs">{v.name}</td>
                                  <td className="text-right font-mono text-xs">{v.base} {v.unit}</td>
                                  <td className="text-right font-mono text-xs">{v.current} {v.unit}</td>
                                  <td className={cn("text-right font-mono text-xs", v.current > v.base ? "text-red-500" : "text-blue-500")}>
                                    {v.current > v.base ? "+" : ""}{(v.current - v.base).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card className="py-16">
                      <CardContent className="text-center">
                        <Target className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground">시뮬레이션을 실행해주세요</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={handlePrevStep} className="gap-2">
                      <ChevronLeft className="h-4 w-4" /> 이전 단계
                    </Button>
                    <Button onClick={handleNextStep} disabled={!isSimulated} className="gap-2">
                      다음 단계 <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Step 5: Save & Export */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold">Step 5. 결과 저장 및 내보내기</h2>
                    <p className="text-sm text-muted-foreground mt-1">시뮬레이션 결과를 저장하거나 내보내세요</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-6 hover:border-primary/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <Save className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">시나리오 저장</h3>
                          <p className="text-sm text-muted-foreground">시뮬레이션 조건과 결과를 저장합니다</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-6 hover:border-primary/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-blue-500/10">
                          <Download className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Excel 내보내기</h3>
                          <p className="text-sm text-muted-foreground">결과를 Excel 파일로 다운로드합니다</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-6 hover:border-primary/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-purple-500/10">
                          <FileText className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">보고서 생성</h3>
                          <p className="text-sm text-muted-foreground">PDF 형식의 분석 보고서를 생성합니다</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-6 hover:border-primary/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-green-500/10">
                          <Zap className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">운전 적용 요청</h3>
                          <p className="text-sm text-muted-foreground">시뮬레이션 결과를 실제 운전에 반영 요청합니다</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={handlePrevStep} className="gap-2">
                      <ChevronLeft className="h-4 w-4" /> 이전 단계
                    </Button>
                    <Button onClick={() => { setCurrentStep(1); setSelectedModelId(null); setIsSimulated(false); }} className="gap-2">
                      새 시뮬레이션 시작 <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ===================== ADVANCED SIMULATION ===================== */
          <div className="p-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Left Panel: Configuration */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">1. 모델 선택</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={advSelectedModelId || ""} onValueChange={handleAdvSelectModel}>
                      <SelectTrigger>
                        <SelectValue placeholder="모델 선택..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MODEL_ARTIFACTS.map(m => (
                          <SelectItem key={m.id} value={m.id}>
                            <span className="flex items-center gap-2">
                              {m.name}
                              <Badge variant="outline" className="text-xs">{m.process}</Badge>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">2. 베이스라인 선택</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={advBaselineType} onValueChange={setAdvBaselineType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BASELINE_OPTIONS.map(o => (
                          <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
                
                {advSelectedModel && (
                  <>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">3. 입력/출력 변수 설정</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">입력 변수 1 (필수)</Label>
                          <Select value={advInputVar1} onValueChange={handleAdvInputVar1Change}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="선택..." />
                            </SelectTrigger>
                            <SelectContent>
                              {advSelectedModel.variables.map(v => (
                                <SelectItem key={v.id} value={v.id} disabled={v.id === advInputVar2}>
                                  {v.name} ({v.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-muted-foreground">입력 변수 2 (선택 - 3D 분석)</Label>
                          <Select value={advInputVar2} onValueChange={handleAdvInputVar2Change}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="없음" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">없음 (2D 분석)</SelectItem>
                              {advSelectedModel.variables.filter(v => v.id !== advInputVar1).map(v => (
                                <SelectItem key={v.id} value={v.id}>
                                  {v.name} ({v.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <Label className="text-xs text-muted-foreground">출력 변수</Label>
                          <Select value={advOutputVar} onValueChange={setAdvOutputVar}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="선택..." />
                            </SelectTrigger>
                            <SelectContent>
                              {advSelectedModel.outputs.map(o => (
                                <SelectItem key={o.id} value={o.id}>
                                  {o.name} ({o.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">4. 이터레이션 조건 설정</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {advInputVar1 && (
                          <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                            <Label className="text-xs font-medium">
                              {advSelectedModel.variables.find(v => v.id === advInputVar1)?.name}
                            </Label>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs text-muted-foreground">시작</Label>
                                <Input
                                  type="number"
                                  value={advVar1Start}
                                  onChange={(e) => setAdvVar1Start(Number(e.target.value))}
                                  className="mt-1 h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">종료</Label>
                                <Input
                                  type="number"
                                  value={advVar1End}
                                  onChange={(e) => setAdvVar1End(Number(e.target.value))}
                                  className="mt-1 h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">간격</Label>
                                <Input
                                  type="number"
                                  value={advVar1Step}
                                  onChange={(e) => setAdvVar1Step(Number(e.target.value))}
                                  className="mt-1 h-8"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {advInputVar2 && (
                          <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                            <Label className="text-xs font-medium">
                              {advSelectedModel.variables.find(v => v.id === advInputVar2)?.name}
                            </Label>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs text-muted-foreground">시작</Label>
                                <Input
                                  type="number"
                                  value={advVar2Start}
                                  onChange={(e) => setAdvVar2Start(Number(e.target.value))}
                                  className="mt-1 h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">종료</Label>
                                <Input
                                  type="number"
                                  value={advVar2End}
                                  onChange={(e) => setAdvVar2End(Number(e.target.value))}
                                  className="mt-1 h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">간격</Label>
                                <Input
                                  type="number"
                                  value={advVar2Step}
                                  onChange={(e) => setAdvVar2Step(Number(e.target.value))}
                                  className="mt-1 h-8"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">총 이터레이션:</span>
                          <Badge variant="secondary">{advIterationCount}회</Badge>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Button 
                      className="w-full gap-2" 
                      size="lg" 
                      onClick={handleAdvSimulate}
                      disabled={advIsSimulating || !advInputVar1 || !advOutputVar}
                    >
                      {advIsSimulating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          시뮬레이션 진행 중... ({advProgress}%)
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          시뮬레이션 실행 ({advIterationCount}회)
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
              
              {/* Right Panel: Results */}
              <div className="col-span-2 space-y-4">
                {advIsSimulating && (
                  <Card>
                    <CardContent className="py-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>시뮬레이션 진행 중...</span>
                          <span className="font-medium">{advProgress}%</span>
                        </div>
                        <Progress value={advProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground text-center">
                          {Math.round(advIterationCount * advProgress / 100)} / {advIterationCount} 이터레이션 완료
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {advIsSimulated && advSelectedModel && (
                  <>
                    {/* Visualization */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {advInputVar2 ? (
                              <>
                                <Layers className="h-4 w-4" />
                                3D Surface Plot
                              </>
                            ) : (
                              <>
                                <LineChart className="h-4 w-4" />
                                2D Line Chart
                              </>
                            )}
                          </CardTitle>
                          <Badge variant="outline">
                            {advSelectedModel.variables.find(v => v.id === advInputVar1)?.name}
                            {advInputVar2 && ` × ${advSelectedModel.variables.find(v => v.id === advInputVar2)?.name}`}
                            {` → ${advSelectedModel.outputs.find(o => o.id === advOutputVar)?.name}`}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {advInputVar2 ? (
                          /* 3D Surface Plot Placeholder */
                          <div className="h-80 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20">
                              {/* Grid lines for 3D effect */}
                              <svg className="w-full h-full">
                                {Array.from({ length: 10 }).map((_, i) => (
                                  <line key={`h${i}`} x1="0" y1={`${i * 10}%`} x2="100%" y2={`${i * 10}%`} stroke="currentColor" strokeWidth="0.5" />
                                ))}
                                {Array.from({ length: 10 }).map((_, i) => (
                                  <line key={`v${i}`} x1={`${i * 10}%`} y1="0" x2={`${i * 10}%`} y2="100%" stroke="currentColor" strokeWidth="0.5" />
                                ))}
                              </svg>
                            </div>
                            <div className="text-center z-10">
                              <Layers className="h-16 w-16 mx-auto mb-3 text-purple-400" />
                              <p className="font-medium text-purple-700">3D Surface Plot</p>
                              <p className="text-sm text-purple-600 mt-1">
                                X: {advSelectedModel.variables.find(v => v.id === advInputVar1)?.name}<br />
                                Y: {advSelectedModel.variables.find(v => v.id === advInputVar2)?.name}<br />
                                Z: {advSelectedModel.outputs.find(o => o.id === advOutputVar)?.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">{advResults.length}개 데이터 포인트</p>
                            </div>
                          </div>
                        ) : (
                          /* 2D Line Chart */
                          <div className="h-80 relative">
                            <svg className="w-full h-full">
                              {/* Axes */}
                              <line x1="50" y1="20" x2="50" y2="280" stroke="currentColor" strokeWidth="1" className="text-muted-foreground" />
                              <line x1="50" y1="280" x2="580" y2="280" stroke="currentColor" strokeWidth="1" className="text-muted-foreground" />
                              
                              {/* Y-axis labels */}
                              {Array.from({ length: 5 }).map((_, i) => {
                                const minZ = Math.min(...advResults.map(r => r.z))
                                const maxZ = Math.max(...advResults.map(r => r.z))
                                const val = minZ + (maxZ - minZ) * (4 - i) / 4
                                return (
                                  <text key={i} x="45" y={50 + i * 57.5} textAnchor="end" className="text-xs fill-muted-foreground">
                                    {val.toFixed(1)}
                                  </text>
                                )
                              })}
                              
                              {/* X-axis labels */}
                              {Array.from({ length: 5 }).map((_, i) => {
                                const val = advVar1Start + (advVar1End - advVar1Start) * i / 4
                                return (
                                  <text key={i} x={50 + i * 132.5} y="300" textAnchor="middle" className="text-xs fill-muted-foreground">
                                    {val.toFixed(0)}
                                  </text>
                                )
                              })}
                              
                              {/* Line path */}
                              <path
                                d={advResults.map((r, i) => {
                                  const x = 50 + ((r.x - advVar1Start) / (advVar1End - advVar1Start)) * 530
                                  const minZ = Math.min(...advResults.map(r => r.z))
                                  const maxZ = Math.max(...advResults.map(r => r.z))
                                  const y = 280 - ((r.z - minZ) / (maxZ - minZ)) * 260
                                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                                }).join(' ')}
                                fill="none"
                                stroke="hsl(var(--primary))"
                                strokeWidth="2"
                              />
                              
                              {/* Data points */}
                              {advResults.map((r, i) => {
                                const x = 50 + ((r.x - advVar1Start) / (advVar1End - advVar1Start)) * 530
                                const minZ = Math.min(...advResults.map(r => r.z))
                                const maxZ = Math.max(...advResults.map(r => r.z))
                                const y = 280 - ((r.z - minZ) / (maxZ - minZ)) * 260
                                return (
                                  <circle key={i} cx={x} cy={y} r="4" fill="hsl(var(--primary))" />
                                )
                              })}
                              
                              {/* Axis labels */}
                              <text x="315" y="320" textAnchor="middle" className="text-xs fill-muted-foreground font-medium">
                                {advSelectedModel.variables.find(v => v.id === advInputVar1)?.name} ({advSelectedModel.variables.find(v => v.id === advInputVar1)?.unit})
                              </text>
                              <text x="20" y="150" textAnchor="middle" transform="rotate(-90, 20, 150)" className="text-xs fill-muted-foreground font-medium">
                                {advSelectedModel.outputs.find(o => o.id === advOutputVar)?.name}
                              </text>
                            </svg>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Data Table */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">시뮬레이션 데이터</CardTitle>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                              <Download className="h-4 w-4" />
                              Excel
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2">
                              <Save className="h-4 w-4" />
                              저장
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-48">
                          <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-card">
                              <tr className="border-b">
                                <th className="text-left py-2 px-2 font-medium text-muted-foreground">#</th>
                                <th className="text-right py-2 px-2 font-medium text-muted-foreground">
                                  {advSelectedModel.variables.find(v => v.id === advInputVar1)?.name}
                                </th>
                                {advInputVar2 && (
                                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">
                                    {advSelectedModel.variables.find(v => v.id === advInputVar2)?.name}
                                  </th>
                                )}
                                <th className="text-right py-2 px-2 font-medium text-muted-foreground">
                                  {advSelectedModel.outputs.find(o => o.id === advOutputVar)?.name}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {advResults.slice(0, 50).map((r, i) => (
                                <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                                  <td className="py-1.5 px-2 text-muted-foreground">{i + 1}</td>
                                  <td className="text-right py-1.5 px-2 font-mono">{r.x}</td>
                                  {advInputVar2 && <td className="text-right py-1.5 px-2 font-mono">{r.y}</td>}
                                  <td className="text-right py-1.5 px-2 font-mono font-medium">{r.z}</td>
                                </tr>
                              ))}
                              {advResults.length > 50 && (
                                <tr>
                                  <td colSpan={advInputVar2 ? 4 : 3} className="text-center py-2 text-xs text-muted-foreground">
                                    ... 외 {advResults.length - 50}개 데이터 (전체 데이터는 Excel 내보내기로 확인)
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </>
                )}
                
                {!advIsSimulated && !advIsSimulating && (
                  <Card className="h-[500px] flex items-center justify-center">
                    <CardContent className="text-center">
                      <Layers className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground">심화 시뮬레이션</h3>
                      <p className="text-sm text-muted-foreground/70 mt-2 max-w-sm">
                        입력 변수를 범위로 설정하여 여러 시나리오를 한번에 분석합니다.<br />
                        입력 변수 1개: 2D 차트, 2개: 3D Surface Plot
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
