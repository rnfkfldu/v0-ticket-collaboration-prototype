"use client"

import { useState, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Search, FolderOpen, Calendar, User, Target, Play, Download, Trash2,
  FileText, BarChart3, TrendingUp, ChevronRight, Eye, Clock, Cpu,
  ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

// 저장된 시나리오 타입
interface SavedScenario {
  id: string
  name: string
  description: string
  modelId: string
  modelName: string
  modelType: "rto" | "ml" | "first-principle"
  process: string
  baselineType: "current" | "date" | "plan"
  baselineDate?: string
  simulationType: "single" | "iteration"
  createdAt: string
  createdBy: string
  tags: string[]
  // 단건 시뮬레이션 결과
  singleResults?: {
    kpis: { name: string; before: number; after: number; unit: string; change: number }[]
  }
  // 반복 시뮬레이션 결과
  iterationResults?: {
    inputVar1: string
    inputVar2?: string
    outputVar: string
    dataPoints: number
  }
  status: "saved" | "applied" | "archived"
}

// 더미 저장된 시나리오 데이터
const SAVED_SCENARIOS: SavedScenario[] = [
  {
    id: "SCN-001",
    name: "HCR 반응기 온도 최적화",
    description: "HCR 반응기 온도를 385°C에서 390°C로 조정 시 수율 변화 분석",
    modelId: "RTO-HCR-001",
    modelName: "HCR Yield Optimizer",
    modelType: "rto",
    process: "HCR",
    baselineType: "current",
    simulationType: "single",
    createdAt: "2026-02-25 14:30",
    createdBy: "김철수",
    tags: ["수율최적화", "온도조절"],
    singleResults: {
      kpis: [
        { name: "W600N 수율", before: 42.5, after: 44.2, unit: "%", change: 4.0 },
        { name: "에너지 소비", before: 125, after: 128, unit: "MW", change: 2.4 },
        { name: "수소 소비", before: 180, after: 185, unit: "Nm³/hr", change: 2.8 },
      ]
    },
    status: "saved"
  },
  {
    id: "SCN-002",
    name: "VGOFCC Feed 비율 민감도 분석",
    description: "BAV 비율 10~50% 변화에 따른 Gasoline 수율 변화 분석",
    modelId: "ML-FCC-002",
    modelName: "FCC Conversion Predictor",
    modelType: "ml",
    process: "VGOFCC",
    baselineType: "date",
    baselineDate: "2026-02-20",
    simulationType: "iteration",
    createdAt: "2026-02-24 10:15",
    createdBy: "김철수",
    tags: ["민감도분석", "Feed최적화"],
    iterationResults: {
      inputVar1: "BAV 비율",
      outputVar: "Gasoline 수율",
      dataPoints: 9
    },
    status: "applied"
  },
  {
    id: "SCN-003",
    name: "CDU 분별증류탑 Cut Point 조정",
    description: "Naphtha/Kerosene Cut Point 변경에 따른 제품 품질 예측",
    modelId: "FP-CDU-001",
    modelName: "CDU Fractionation Model",
    modelType: "first-principle",
    process: "CDU",
    baselineType: "plan",
    simulationType: "single",
    createdAt: "2026-02-23 16:45",
    createdBy: "박영희",
    tags: ["분별증류", "품질최적화"],
    singleResults: {
      kpis: [
        { name: "Naphtha 수율", before: 18.2, after: 19.1, unit: "%", change: 4.9 },
        { name: "Kerosene 수율", before: 12.5, after: 11.8, unit: "%", change: -5.6 },
        { name: "Flash Point", before: 42, after: 45, unit: "°C", change: 7.1 },
      ]
    },
    status: "saved"
  },
  {
    id: "SCN-004",
    name: "HCR 2변수 민감도 분석",
    description: "반응기 온도 & 압력 동시 변화에 따른 전환율 3D 분석",
    modelId: "RTO-HCR-001",
    modelName: "HCR Yield Optimizer",
    modelType: "rto",
    process: "HCR",
    baselineType: "current",
    simulationType: "iteration",
    createdAt: "2026-02-22 09:20",
    createdBy: "김철수",
    tags: ["3D분석", "다변수"],
    iterationResults: {
      inputVar1: "반응기 온도",
      inputVar2: "반응기 압력",
      outputVar: "전환율",
      dataPoints: 25
    },
    status: "archived"
  },
  {
    id: "SCN-005",
    name: "VDU 진공도 최적화",
    description: "진공도 변화에 따른 HVGO 품질 변화 시뮬레이션",
    modelId: "ML-VDU-001",
    modelName: "VDU Quality Predictor",
    modelType: "ml",
    process: "VDU",
    baselineType: "current",
    simulationType: "single",
    createdAt: "2026-02-21 11:30",
    createdBy: "이수진",
    tags: ["진공최적화", "품질예측"],
    singleResults: {
      kpis: [
        { name: "HVGO 점도", before: 125, after: 118, unit: "cSt", change: -5.6 },
        { name: "Flash Point", before: 220, after: 225, unit: "°C", change: 2.3 },
      ]
    },
    status: "saved"
  },
]

// 시나리오 저장 함수 (localStorage 사용)
export function saveScenario(scenario: Omit<SavedScenario, "id" | "createdAt" | "status">) {
  const scenarios = getSavedScenarios()
  const newScenario: SavedScenario = {
    ...scenario,
    id: `SCN-${String(scenarios.length + 6).padStart(3, "0")}`,
    createdAt: new Date().toLocaleString("ko-KR", { 
      year: "numeric", month: "2-digit", day: "2-digit", 
      hour: "2-digit", minute: "2-digit" 
    }).replace(/\. /g, "-").replace(".", ""),
    status: "saved"
  }
  scenarios.push(newScenario)
  if (typeof window !== "undefined") {
    localStorage.setItem("whatif-scenarios", JSON.stringify(scenarios))
  }
  return newScenario
}

export function getSavedScenarios(): SavedScenario[] {
  if (typeof window === "undefined") return SAVED_SCENARIOS
  const stored = localStorage.getItem("whatif-scenarios")
  if (stored) {
    try {
      return [...SAVED_SCENARIOS, ...JSON.parse(stored)]
    } catch {
      return SAVED_SCENARIOS
    }
  }
  return SAVED_SCENARIOS
}

export default function SavedScenariosPage() {
  const [scenarios] = useState<SavedScenario[]>(SAVED_SCENARIOS)
  const [searchQuery, setSearchQuery] = useState("")
  const [processFilter, setProcessFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedScenario, setSelectedScenario] = useState<SavedScenario | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  const filteredScenarios = useMemo(() => {
    return scenarios.filter(s => {
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !s.description.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (processFilter !== "all" && s.process !== processFilter) return false
      if (typeFilter !== "all" && s.simulationType !== typeFilter) return false
      if (statusFilter !== "all" && s.status !== statusFilter) return false
      return true
    })
  }, [scenarios, searchQuery, processFilter, typeFilter, statusFilter])

  const getModelTypeLabel = (type: string) => {
    switch (type) {
      case "rto": return "RTO"
      case "ml": return "AI/ML"
      case "first-principle": return "First Principle"
      default: return type
    }
  }

  const getModelTypeColor = (type: string) => {
    switch (type) {
      case "rto": return "bg-blue-500"
      case "ml": return "bg-purple-500"
      case "first-principle": return "bg-emerald-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "saved": return <Badge variant="secondary">저장됨</Badge>
      case "applied": return <Badge className="bg-green-600">운전 적용</Badge>
      case "archived": return <Badge variant="outline">보관됨</Badge>
      default: return null
    }
  }

  const handleViewDetail = (scenario: SavedScenario) => {
    setSelectedScenario(scenario)
    setShowDetailDialog(true)
  }

  return (
    <AppShell>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                저장된 시나리오
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                What-if 시뮬레이션 결과를 관리하고 재활용합니다
              </p>
            </div>
            <Link href="/optimization/what-if">
              <Button className="gap-2">
                <Play className="h-4 w-4" />
                새 시뮬레이션
              </Button>
            </Link>
          </div>
        </header>

        {/* Filters */}
        <div className="border-b border-border bg-card px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="시나리오 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={processFilter} onValueChange={setProcessFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="공정" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 공정</SelectItem>
                <SelectItem value="HCR">HCR</SelectItem>
                <SelectItem value="VGOFCC">VGOFCC</SelectItem>
                <SelectItem value="CDU">CDU</SelectItem>
                <SelectItem value="VDU">VDU</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="시뮬레이션 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 유형</SelectItem>
                <SelectItem value="single">단건 시뮬레이션</SelectItem>
                <SelectItem value="iteration">반복 시뮬레이션</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="saved">저장됨</SelectItem>
                <SelectItem value="applied">운전 적용</SelectItem>
                <SelectItem value="archived">보관됨</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Scenarios List */}
        <ScrollArea className="flex-1 p-6">
          <div className="grid gap-4">
            {filteredScenarios.length === 0 ? (
              <Card className="py-16">
                <CardContent className="text-center text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>저장된 시나리오가 없습니다</p>
                  <Link href="/optimization/what-if">
                    <Button variant="link" className="mt-2">새 시뮬레이션 시작하기</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              filteredScenarios.map((scenario) => (
                <Card 
                  key={scenario.id} 
                  className="hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => handleViewDetail(scenario)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={cn("text-white text-xs", getModelTypeColor(scenario.modelType))}>
                            {getModelTypeLabel(scenario.modelType)}
                          </Badge>
                          <Badge variant="outline">{scenario.process}</Badge>
                          <Badge variant={scenario.simulationType === "iteration" ? "secondary" : "outline"}>
                            {scenario.simulationType === "iteration" ? "반복 시뮬레이션" : "단건 시뮬레이션"}
                          </Badge>
                          {getStatusBadge(scenario.status)}
                        </div>
                        <h3 className="font-semibold text-base mt-2">{scenario.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{scenario.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Cpu className="h-3 w-3" />
                            {scenario.modelName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {scenario.createdAt}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {scenario.createdBy}
                          </span>
                        </div>
                        {scenario.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {scenario.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Quick Results Preview */}
                      <div className="shrink-0 w-48">
                        {scenario.simulationType === "single" && scenario.singleResults && (
                          <div className="space-y-1">
                            {scenario.singleResults.kpis.slice(0, 2).map((kpi, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground truncate">{kpi.name}</span>
                                <span className={cn(
                                  "font-medium flex items-center gap-1",
                                  kpi.change > 0 ? "text-green-600" : kpi.change < 0 ? "text-red-600" : ""
                                )}>
                                  {kpi.change > 0 ? <ArrowUpRight className="h-3 w-3" /> : 
                                   kpi.change < 0 ? <ArrowDownRight className="h-3 w-3" /> : 
                                   <Minus className="h-3 w-3" />}
                                  {Math.abs(kpi.change).toFixed(1)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {scenario.simulationType === "iteration" && scenario.iterationResults && (
                          <div className="text-sm">
                            <div className="text-muted-foreground">
                              {scenario.iterationResults.inputVar1}
                              {scenario.iterationResults.inputVar2 && ` × ${scenario.iterationResults.inputVar2}`}
                            </div>
                            <div className="font-medium mt-1">
                              → {scenario.iterationResults.outputVar}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {scenario.iterationResults.dataPoints}개 데이터 포인트
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                시나리오 상세
              </DialogTitle>
            </DialogHeader>
            {selectedScenario && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={cn("text-white", getModelTypeColor(selectedScenario.modelType))}>
                      {getModelTypeLabel(selectedScenario.modelType)}
                    </Badge>
                    <Badge variant="outline">{selectedScenario.process}</Badge>
                    {getStatusBadge(selectedScenario.status)}
                  </div>
                  <h3 className="text-lg font-semibold">{selectedScenario.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{selectedScenario.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">모델</span>
                    <p className="font-medium">{selectedScenario.modelName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">베이스라인</span>
                    <p className="font-medium">
                      {selectedScenario.baselineType === "current" ? "현재값" :
                       selectedScenario.baselineType === "date" ? `특정 날짜 (${selectedScenario.baselineDate})` :
                       "운영계획서"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">생성일</span>
                    <p className="font-medium">{selectedScenario.createdAt}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">생성자</span>
                    <p className="font-medium">{selectedScenario.createdBy}</p>
                  </div>
                </div>

                <Separator />

                {/* Results */}
                <div>
                  <h4 className="font-medium mb-3">시뮬레이션 결과</h4>
                  {selectedScenario.simulationType === "single" && selectedScenario.singleResults && (
                    <div className="space-y-2">
                      {selectedScenario.singleResults.kpis.map((kpi, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <span className="font-medium">{kpi.name}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground">
                              {kpi.before} → {kpi.after} {kpi.unit}
                            </span>
                            <Badge className={cn(
                              kpi.change > 0 ? "bg-green-100 text-green-700" : 
                              kpi.change < 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                            )}>
                              {kpi.change > 0 ? "+" : ""}{kpi.change.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedScenario.simulationType === "iteration" && selectedScenario.iterationResults && (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">입력 변수</span>
                          <p className="font-medium">
                            {selectedScenario.iterationResults.inputVar1}
                            {selectedScenario.iterationResults.inputVar2 && 
                              `, ${selectedScenario.iterationResults.inputVar2}`}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">출력 변수</span>
                          <p className="font-medium">{selectedScenario.iterationResults.outputVar}</p>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-muted-foreground">
                        총 {selectedScenario.iterationResults.dataPoints}개 데이터 포인트 생성
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Excel 다운로드
              </Button>
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                보고서 생성
              </Button>
              <Link href={`/optimization/what-if?load=${selectedScenario?.id}`}>
                <Button className="gap-2">
                  <Play className="h-4 w-4" />
                  시뮬레이션 재실행
                </Button>
              </Link>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
