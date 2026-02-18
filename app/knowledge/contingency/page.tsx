"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Shield, Search, ChevronRight, ChevronDown, AlertTriangle, CheckCircle, ArrowRight, GitBranch, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface DecisionNode {
  id: string
  question: string
  yesAction?: string
  noAction?: string
  yesNext?: DecisionNode
  noNext?: DecisionNode
  actionPlan?: ActionPlan
}

interface ActionPlan {
  title: string
  steps: string[]
  responsible: string
  estimatedTime: string
  severity: "critical" | "major" | "minor"
}

const CONTINGENCY_SCENARIOS = [
  {
    id: "SCN-001",
    category: "process",
    unit: "CDU",
    title: "CDU Feed Pump Total Failure",
    riskLevel: "critical",
    lastReviewed: "2025-01-15",
    status: "approved",
    decisionTree: {
      id: "d1",
      question: "Standby Pump 가동 가능한가?",
      yesAction: "Standby Pump 즉시 가동",
      noNext: {
        id: "d2",
        question: "부분 운전 (감량) 가능한가?",
        yesAction: "감량 운전 모드 전환 (50% capacity)",
        noNext: {
          id: "d3",
          question: "타 Unit에서 Feed 우회 가능한가?",
          yesAction: "Feed 우회 라인 개통",
          noAction: "Emergency Shutdown 절차 개시",
        }
      }
    },
    actionPlans: [
      { title: "Standby Pump 가동", steps: ["P-101B 즉시 기동", "Flow 안정화 확인", "P-101A 원인 조사"], responsible: "Operations", estimatedTime: "15분", severity: "minor" as const },
      { title: "감량 운전 전환", steps: ["Feed Rate 50% 감량", "Column 온도 프로파일 조정", "제품 Routing 변경"], responsible: "Operations + Process Eng.", estimatedTime: "30분", severity: "major" as const },
      { title: "Emergency Shutdown", steps: ["ESB 누름", "비상 대응 팀 소집", "환경부서 통보", "원인 조사 착수"], responsible: "Plant Manager", estimatedTime: "즉시", severity: "critical" as const },
    ]
  },
  {
    id: "SCN-002",
    category: "utility",
    unit: "Utility",
    title: "Steam Header Pressure Loss (40kg/cm2)",
    riskLevel: "critical",
    lastReviewed: "2025-01-10",
    status: "approved",
    decisionTree: {
      id: "d1",
      question: "Boiler 추가 가동 가능한가?",
      yesAction: "대기 Boiler 즉시 기동",
      noNext: {
        id: "d2",
        question: "Steam 사용량 감축 가능한가?",
        yesAction: "비필수 Steam 소비처 차단",
        noAction: "전체 감량 운전 개시",
      }
    },
    actionPlans: [
      { title: "대기 Boiler 기동", steps: ["B-003 기동 절차 개시", "Steam Header 압력 모니터링", "각 Unit 통보"], responsible: "Utility Team", estimatedTime: "20분", severity: "major" as const },
      { title: "전체 감량 운전", steps: ["각 Unit 감량 지시", "우선순위별 Steam 배분", "경영진 보고"], responsible: "Plant Manager", estimatedTime: "1시간", severity: "critical" as const },
    ]
  },
  {
    id: "SCN-003",
    category: "process",
    unit: "HCR",
    title: "HCR Compressor Trip",
    riskLevel: "high",
    lastReviewed: "2024-12-20",
    status: "approved",
    decisionTree: {
      id: "d1",
      question: "자동 Restart 가능한가?",
      yesAction: "Auto Restart 절차 진행",
      noNext: {
        id: "d2",
        question: "Recycle Gas 우회 가능한가?",
        yesAction: "우회 운전 + 수동 Restart 시도",
        noAction: "HCR Unit Shutdown 절차 개시",
      }
    },
    actionPlans: [
      { title: "Auto Restart", steps: ["Interlock Reset", "Compressor Auto Start", "H2 Makeup 조정"], responsible: "Operations", estimatedTime: "10분", severity: "minor" as const },
      { title: "HCR Shutdown", steps: ["Feed 차단", "H2 Purge 개시", "Reactor 온도 관리", "인접 Unit 통보"], responsible: "Operations + Process Eng.", estimatedTime: "2시간", severity: "critical" as const },
    ]
  },
  {
    id: "SCN-004",
    category: "utility",
    unit: "Utility",
    title: "Cooling Water Pump Failure",
    riskLevel: "high",
    lastReviewed: "2025-01-05",
    status: "under-review",
    decisionTree: {
      id: "d1",
      question: "Spare Pump 즉시 가동 가능한가?",
      yesAction: "Spare Pump 기동",
      noNext: {
        id: "d2",
        question: "CW 사용량 부분 감축 가능한가?",
        yesAction: "비필수 Cooler Bypass",
        noAction: "관련 Unit 긴급 감량",
      }
    },
    actionPlans: [
      { title: "Spare Pump 기동", steps: ["CWP-B 기동", "CW Header 압력 확인", "고장 펌프 원인 조사"], responsible: "Utility Team", estimatedTime: "10분", severity: "minor" as const },
    ]
  },
]

export default function ContingencyPlanPage() {
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [unitFilter, setUnitFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selectedScenario, setSelectedScenario] = useState<typeof CONTINGENCY_SCENARIOS[0] | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["d1", "d2", "d3"]))

  const filtered = CONTINGENCY_SCENARIOS
    .filter(s => categoryFilter === "all" || s.category === categoryFilter)
    .filter(s => unitFilter === "all" || s.unit === unitFilter)
    .filter(s => s.title.toLowerCase().includes(search.toLowerCase()))

  const renderDecisionTree = (node: DecisionNode, depth: number = 0) => (
    <div key={node.id} className={cn("ml-4", depth > 0 && "border-l-2 border-primary/30 pl-4")}>
      <div className="p-3 bg-muted/30 rounded-lg mb-2 border">
        <div className="flex items-center gap-2 mb-2">
          <GitBranch className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{node.question}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {(node.yesAction || node.yesNext) && (
            <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
              <span className="text-green-700 font-medium text-xs">YES</span>
              {node.yesAction && <p className="text-green-700 mt-1">{node.yesAction}</p>}
              {node.yesNext && renderDecisionTree(node.yesNext, depth + 1)}
            </div>
          )}
          {(node.noAction || node.noNext) && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
              <span className="text-red-700 font-medium text-xs">NO</span>
              {node.noAction && <p className="text-red-700 mt-1">{node.noAction}</p>}
              {node.noNext && renderDecisionTree(node.noNext, depth + 1)}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-6 py-4">
          <h1 className="text-lg font-semibold">Operation Contingency Plan</h1>
          <p className="text-sm text-muted-foreground mt-1">공정 및 Utility Fail 시나리오별 Decision Tree 및 Action Plan 관리</p>
        </header>

        <main className="p-6 space-y-6">
          {/* 필터 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="시나리오 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="process">공정</SelectItem>
                <SelectItem value="utility">Utility</SelectItem>
              </SelectContent>
            </Select>
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Unit" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                <SelectItem value="CDU">CDU</SelectItem>
                <SelectItem value="VDU">VDU</SelectItem>
                <SelectItem value="HCR">HCR</SelectItem>
                <SelectItem value="CCR">CCR</SelectItem>
                <SelectItem value="Utility">Utility</SelectItem>
              </SelectContent>
            </Select>
            <Button className="gap-2 ml-auto"><FileText className="h-4 w-4" /> 새 시나리오 등록</Button>
          </div>

          {/* 시나리오 리스트 */}
          <div className="space-y-3">
            {filtered.map(scenario => (
              <Card key={scenario.id} className="cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => setSelectedScenario(scenario)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", scenario.riskLevel === "critical" ? "bg-red-100" : "bg-amber-100")}>
                      <AlertTriangle className={cn("h-5 w-5", scenario.riskLevel === "critical" ? "text-red-600" : "text-amber-600")} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{scenario.title}</h3>
                        <Badge variant="outline" className="text-xs">{scenario.unit}</Badge>
                        <Badge className={cn("text-xs", scenario.riskLevel === "critical" ? "bg-red-500 text-white" : "bg-amber-500 text-white")}>{scenario.riskLevel}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Category: {scenario.category}</span>
                        <span>Action Plans: {scenario.actionPlans.length}건</span>
                        <span>Last Reviewed: {scenario.lastReviewed}</span>
                        <Badge variant="outline" className={cn("text-xs", scenario.status === "approved" ? "border-green-300 text-green-600" : "border-amber-300 text-amber-600")}>{scenario.status === "approved" ? "Approved" : "Under Review"}</Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 상세 다이얼로그 */}
          <Dialog open={!!selectedScenario} onOpenChange={() => setSelectedScenario(null)}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              {selectedScenario && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {selectedScenario.title}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-6 pt-4">
                    {/* Decision Tree */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <GitBranch className="h-4 w-4" /> Decision Tree
                      </h3>
                      {renderDecisionTree(selectedScenario.decisionTree)}
                    </div>

                    {/* Action Plans */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Action Plans</h3>
                      <div className="space-y-3">
                        {selectedScenario.actionPlans.map((plan, idx) => (
                          <Card key={idx} className={cn("border-l-4", plan.severity === "critical" ? "border-l-red-500" : plan.severity === "major" ? "border-l-amber-500" : "border-l-blue-500")}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm">{plan.title}</h4>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{plan.responsible}</Badge>
                                  <Badge variant="outline" className="text-xs">{plan.estimatedTime}</Badge>
                                </div>
                              </div>
                              <ol className="space-y-1">
                                {plan.steps.map((step, sIdx) => (
                                  <li key={sIdx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs flex-shrink-0">{sIdx + 1}</span>
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </AppShell>
  )
}
