"use client"

import { useState, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { 
  Activity, TrendingUp, Gauge, Info, RefreshCw, CheckCircle, XCircle,
  Settings, ArrowLeft, Clock, Target, DollarSign
} from "lucide-react"
import { cn } from "@/lib/utils"

const RTO_MODELS = [
  { id: "RTO-001", dept: "HOU부문", team: "HCR팀", desc: "[수율 최적화] HCR 공정 Reactor Severity 최적화", mlops: "active" as const, accuracy: 93.1, benefit: 15200, uptime: 97.8, lastRun: "10분 전", process: "HCR", variables: 24, constraints: 18, tags: ["TI-3001","TI-3002","PI-3001","FI-3001","FIC-2001"], unit: "\u00b0C" },
  { id: "RTO-002", dept: "HOU부문", team: "HCR팀", desc: "[에너지 최적화] HCR 공정 Furnace Fuel Optimization", mlops: "active" as const, accuracy: 90.5, benefit: 8700, uptime: 96.2, lastRun: "8분 전", process: "HCR", variables: 18, constraints: 12, tags: ["TI-3001","PI-3001","FI-3001"], unit: "Gcal/h" },
  { id: "RTO-003", dept: "HOU부문", team: "VGOFCC팀", desc: "[수율 최적화] FCC 공정 Conversion Maximization", mlops: "active" as const, accuracy: 88.7, benefit: 22100, uptime: 95.1, lastRun: "12분 전", process: "FCC", variables: 32, constraints: 28, tags: ["TI-4001","TI-4002","PI-4001","FI-4001"], unit: "vol%" },
  { id: "RTO-004", dept: "정유생산부문", team: "정유4팀", desc: "[수율 최적화] CCR 공정 Octane Number 최적화", mlops: "active" as const, accuracy: 91.2, benefit: 11400, uptime: 94.5, lastRun: "15분 전", process: "CCR", variables: 20, constraints: 15, tags: ["TI-4001","PI-4001","FI-4001"], unit: "RON" },
  { id: "RTO-005", dept: "정유생산부문", team: "정유3팀", desc: "[에너지 최적화] CDU 공정 Heat Integration 최적화", mlops: "stopped" as const, accuracy: 86.3, benefit: 0, uptime: 0, lastRun: "2시간 전", process: "CDU", variables: 28, constraints: 22, tags: ["TI-1001","TI-1002","PI-1001","FI-1001"], unit: "Gcal/h" },
  { id: "RTO-006", dept: "정유생산부문", team: "정유3팀", desc: "[운전 최적화] CDU 공정 Cut Point Optimization", mlops: "active" as const, accuracy: 89.8, benefit: 18500, uptime: 96.7, lastRun: "5분 전", process: "CDU", variables: 35, constraints: 30, tags: ["TI-1001","PI-1001","FI-1001","LI-1001"], unit: "\u00b0C" },
  { id: "RTO-007", dept: "HOU부문", team: "VDU팀", desc: "[수율 최적화] VDU 공정 HVGO Recovery 최적화", mlops: "active" as const, accuracy: 87.4, benefit: 9800, uptime: 93.8, lastRun: "18분 전", process: "VDU", variables: 22, constraints: 16, tags: ["TI-2001","TI-2002","PI-2001","FI-2001"], unit: "vol%" },
  { id: "RTO-008", dept: "HOU부문", team: "HCR팀", desc: "[운전 최적화] DHT 공정 H2 Consumption 최소화", mlops: "active" as const, accuracy: 90.1, benefit: 7200, uptime: 95.4, lastRun: "20분 전", process: "DHT", variables: 16, constraints: 10, tags: ["TI-5001","PI-5001","FI-5001"], unit: "Nm\u00b3/h" },
  { id: "RTO-009", dept: "정유생산부문", team: "정유탈황2팀", desc: "[에너지 최적화] NHT 공정 Reactor Temp Profile 최적화", mlops: "stopped" as const, accuracy: null, benefit: 0, uptime: 0, lastRun: "1일 전", process: "NHT", variables: 14, constraints: 8, tags: ["TI-6001","PI-6001","FI-6001"], unit: "\u00b0C" },
  { id: "RTO-010", dept: "HOU부문", team: "VGOFCC팀", desc: "[Quality Giveaway] FCC 공정 Gasoline Sulfur 최소화", mlops: "active" as const, accuracy: 92.3, benefit: 13600, uptime: 97.1, lastRun: "7분 전", process: "FCC", variables: 26, constraints: 20, tags: ["TI-4001","PI-4001","FI-4001","AI-4001"], unit: "ppm" },
]

function generateTrendData(baseValue: number, variance: number, count: number) {
  const data = []
  let v = baseValue
  for (let i = 0; i < count; i++) {
    v += (Math.random() - 0.5) * variance
    const optimized = v - Math.abs((Math.random() - 0.3) * variance * 0.5)
    const target = baseValue * 0.95
    const d = new Date(2026, 1, 18)
    d.setHours(d.getHours() + i * 4)
    data.push({ time: `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:00`, actual: +v.toFixed(2), optimized: +optimized.toFixed(2), target: +target.toFixed(2) })
  }
  return data
}

export default function RTOModelsPage() {
  const [view, setView] = useState<"list" | "detail">("list")
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [deptFilter, setDeptFilter] = useState("all")
  const [teamFilter, setTeamFilter] = useState("all")
  const [processFilter, setProcessFilter] = useState("all")
  const [detailTab, setDetailTab] = useState("optimization")

  const filteredModels = useMemo(() => {
    return RTO_MODELS.filter(m => {
      if (searchQuery && !m.desc.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (deptFilter !== "all" && m.dept !== deptFilter) return false
      if (teamFilter !== "all" && m.team !== teamFilter) return false
      if (processFilter !== "all" && m.process !== processFilter) return false
      return true
    })
  }, [searchQuery, deptFilter, teamFilter, processFilter])

  const activeCount = RTO_MODELS.filter(m => m.mlops === "active").length
  const totalBenefit = RTO_MODELS.reduce((s, m) => s + m.benefit, 0)
  const avgAccuracy = RTO_MODELS.filter(m => m.accuracy).reduce((s, m) => s + (m.accuracy || 0), 0) / (RTO_MODELS.filter(m => m.accuracy).length || 1)

  const selectedModel = RTO_MODELS.find(m => m.id === selectedModelId)

  const departments = [...new Set(RTO_MODELS.map(m => m.dept).filter(Boolean))]
  const teams = [...new Set(RTO_MODELS.map(m => m.team).filter(Boolean))]
  const processes = [...new Set(RTO_MODELS.map(m => m.process).filter(Boolean))]

  return (
    <AppShell>
      {view === "list" ? (
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">RTO 모델</h1>
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 border rounded-md overflow-hidden text-sm">
                  {["D","W","M","Y"].map((p,i) => (
                    <button key={p} className={cn("px-3 py-1.5 text-xs font-medium transition-colors", i === 1 ? "bg-foreground text-background" : "hover:bg-muted")}>{p}</button>
                  ))}
                </div>
                <Input type="date" defaultValue="2026-02-18" className="h-8 w-36 text-xs" />
                <span className="text-muted-foreground text-xs">-</span>
                <Input type="date" defaultValue="2026-02-25" className="h-8 w-36 text-xs" />
                <Separator orientation="vertical" className="h-6" />
                <span className="text-xs text-muted-foreground">부문</span>
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                  <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{[{v:"all",l:"전체 선택"},...departments.map(d=>({v:d,l:d}))].map(o=><SelectItem key={o.v} value={o.v} className="text-xs">{o.l}</SelectItem>)}</SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">팀</span>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{[{v:"all",l:"전체 선택"},...teams.map(d=>({v:d,l:d}))].map(o=><SelectItem key={o.v} value={o.v} className="text-xs">{o.l}</SelectItem>)}</SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">공정</span>
                <Select value={processFilter} onValueChange={setProcessFilter}>
                  <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{[{v:"all",l:"전체 선택"},...processes.map(d=>({v:d,l:d}))].map(o=><SelectItem key={o.v} value={o.v} className="text-xs">{o.l}</SelectItem>)}</SelectContent>
                </Select>
                <div className="ml-auto flex gap-2">
                  <Button variant="outline" size="sm" className="h-8 gap-1.5"><RefreshCw className="h-3 w-3" /></Button>
                  <Button size="sm" className="h-8 bg-teal-600 hover:bg-teal-700 text-white">조회</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-teal-600 text-white">
              <CardContent className="py-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center"><Settings className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm opacity-80">가동 모델 수</p>
                  <p className="text-xl font-bold">{activeCount} <span className="text-sm font-normal opacity-70">/ {RTO_MODELS.length}</span></p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-amber-600" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">모델 정확도</p>
                  <p className="text-xl font-bold">{avgAccuracy.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">/ 90 (%)</span></p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center"><DollarSign className="h-5 w-5 text-green-600" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">일일 예상 이익</p>
                  <p className="text-xl font-bold">${totalBenefit.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">/일</span></p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center"><Activity className="h-5 w-5 text-blue-600" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">평균 가동률</p>
                  <p className="text-xl font-bold">{(RTO_MODELS.filter(m=>m.uptime).reduce((s,m)=>s+(m.uptime||0),0)/(RTO_MODELS.filter(m=>m.uptime).length||1)).toFixed(0)} <span className="text-sm font-normal text-muted-foreground">/ 95 (%)</span></p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Model list table */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-base font-semibold">RTO 모델 리스트</h2>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">부문</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">팀</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Model Description</th>
                      <th className="text-center px-4 py-2.5 font-medium text-muted-foreground text-xs">모델 정보</th>
                      <th className="text-center px-4 py-2.5 font-medium text-muted-foreground text-xs">가동 여부</th>
                      <th className="text-center px-4 py-2.5 font-medium text-muted-foreground text-xs">정확도 (%)</th>
                      <th className="text-center px-4 py-2.5 font-medium text-muted-foreground text-xs">예상 이익 ($/일)</th>
                      <th className="text-center px-4 py-2.5 font-medium text-muted-foreground text-xs">가동률 (%)</th>
                      <th className="text-center px-4 py-2.5 font-medium text-muted-foreground text-xs">마지막 실행</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModels.map(model => (
                      <tr key={model.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => { setSelectedModelId(model.id); setView("detail"); setDetailTab("optimization") }}>
                        <td className="px-4 py-2.5 text-xs">{model.dept}</td>
                        <td className="px-4 py-2.5 text-xs">{model.team}</td>
                        <td className="px-4 py-2.5 text-xs text-teal-700 hover:underline font-medium max-w-[400px]">{model.desc}</td>
                        <td className="px-4 py-2.5 text-center"><Info className="h-3.5 w-3.5 text-blue-500 inline-block" /></td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge variant="outline" className={cn("text-[10px]", model.mlops === "active" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-red-50 text-red-600 border-red-200")}>
                            {model.mlops === "active" ? "가동중" : "중지"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-center text-xs">{model.accuracy ?? "No Data"}</td>
                        <td className="px-4 py-2.5 text-center text-xs font-medium text-green-600">{model.benefit ? `$${model.benefit.toLocaleString()}` : "-"}</td>
                        <td className="px-4 py-2.5 text-center text-xs">{model.uptime || "No Data"}</td>
                        <td className="px-4 py-2.5 text-center text-xs text-muted-foreground">{model.lastRun}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-center gap-3 py-3 border-t text-xs text-muted-foreground">
                <span>총 {filteredModels.length}건</span>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-xs">1</Button>
                <Select defaultValue="30">
                  <SelectTrigger className="h-7 w-16 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="30" className="text-xs">30</SelectItem></SelectContent>
                </Select>
                <span>/page</span>
              </div>
            </Card>
          </div>
        </div>
      ) : selectedModel ? (
        /* ============ DETAIL VIEW ============ */
        <div className="p-6 space-y-5">
          <div className="space-y-3">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => setView("list")}>
              <ArrowLeft className="h-4 w-4" /> RTO 모델 목록
            </Button>
            <h1 className="text-lg font-bold">{selectedModel.desc}</h1>
            <Card>
              <CardContent className="py-2.5">
                <div className="flex items-center gap-3 flex-wrap text-xs">
                  <span className="text-muted-foreground">부문</span>
                  <Input readOnly value={selectedModel.dept} className="h-7 w-28 text-xs bg-muted/30" />
                  <span className="text-muted-foreground">공정</span>
                  <Input readOnly value={selectedModel.process} className="h-7 w-20 text-xs bg-muted/30" />
                  <span className="text-muted-foreground">변수</span>
                  <Badge variant="secondary" className="text-xs">{selectedModel.variables}개</Badge>
                  <span className="text-muted-foreground">제약조건</span>
                  <Badge variant="secondary" className="text-xs">{selectedModel.constraints}개</Badge>
                  <div className="ml-auto flex gap-2">
                    <Button variant="outline" size="sm" className="h-7"><RefreshCw className="h-3 w-3" /></Button>
                    <Button size="sm" className="h-7 bg-teal-600 hover:bg-teal-700 text-white">조회</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-6 border-b">
            {[
              { id: "optimization", label: "최적화 모니터링" },
              { id: "variables", label: "변수/제약조건" },
              { id: "uptime", label: "가동률 모니터링" },
            ].map(tab => (
              <button key={tab.id}
                className={cn("pb-2 text-sm font-medium border-b-2 transition-colors cursor-pointer", detailTab === tab.id ? "border-teal-600 text-teal-700" : "border-transparent text-muted-foreground hover:text-foreground")}
                onClick={() => setDetailTab(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Overview</h2>
              <div className="flex items-center gap-2 text-xs">
                <Input type="date" defaultValue="2026-02-18" className="h-7 w-32 text-xs" />
                <span className="text-muted-foreground">-</span>
                <Input type="date" defaultValue="2026-02-25" className="h-7 w-32 text-xs" />
                <div className="flex border rounded-md overflow-hidden ml-2">
                  {["D","W","M","Y"].map((p,i) => (
                    <button key={p} className={cn("px-2.5 py-1 text-xs font-medium transition-colors", i === 0 ? "bg-foreground text-background" : "hover:bg-muted")}>{p}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-5">
              {/* Summary sidebar */}
              <Card className="w-72 shrink-0 bg-[#2d3748] text-white">
                <CardContent className="py-4 space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm">Summary</h3>
                    <p className="text-xs text-white/60 mt-0.5">Model Accuracy (%)</p>
                    <div className="flex items-center justify-center my-4">
                      <div className="relative">
                        <svg width="120" height="120" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="50" fill="none" stroke="#4a5568" strokeWidth="10" />
                          {selectedModel.accuracy && (
                            <circle cx="60" cy="60" r="50" fill="none" stroke="#38b2ac"
                              strokeWidth="10" strokeLinecap="round"
                              strokeDasharray={`${(selectedModel.accuracy / 100) * 314} 314`}
                              transform="rotate(-90 60 60)" />
                          )}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold">{selectedModel.accuracy ? `${selectedModel.accuracy}%` : "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-white/60">예상 일일 이익</p>
                    <div className="flex items-center gap-2 bg-white/10 rounded px-2.5 py-1.5 text-sm">
                      <DollarSign className="h-3.5 w-3.5 text-green-400" />
                      ${selectedModel.benefit.toLocaleString()}/일
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-white/60">마지막 실행</p>
                    <div className="flex items-center gap-2 bg-white/10 rounded px-2.5 py-1.5 text-sm">
                      <Clock className="h-3.5 w-3.5 text-teal-400" />
                      {selectedModel.lastRun}
                    </div>
                  </div>
                  <Separator className="bg-white/20" />
                  <div>
                    <p className="text-xs font-semibold mb-2">Quick Link</p>
                    <Button variant="outline" size="sm" className="w-full text-xs border-white/30 text-white hover:bg-white/10 bg-transparent">
                      모델 개선 요청
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Trend chart */}
              <Card className="flex-1">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">RTO 최적화 Trend</h3>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-orange-400 inline-block" /> Actual</span>
                      <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-teal-500 inline-block" /> Optimized</span>
                      <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-gray-400 inline-block" /> Target</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{selectedModel.unit}</p>
                  {(() => {
                    const trendData = generateTrendData(100, 4, 42)
                    const W = 700, H = 250, pad = { t: 15, b: 35, l: 45, r: 15 }
                    const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b
                    const allV = trendData.flatMap(d => [d.actual, d.optimized, d.target])
                    const maxV = Math.max(...allV) * 1.005, minV = Math.min(...allV) * 0.995
                    const range = maxV - minV || 1
                    const toX = (i: number) => pad.l + (i / (trendData.length - 1)) * cw
                    const toY = (v: number) => pad.t + (1 - (v - minV) / range) * ch
                    const mkPath = (vals: number[]) => vals.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ")
                    const ySteps = 5
                    return (
                      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 250 }}>
                        {Array.from({ length: ySteps + 1 }).map((_, i) => {
                          const v = minV + (range / ySteps) * i
                          const y = toY(v)
                          return (<g key={i}>
                            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
                            <text x={pad.l - 5} y={y + 3} textAnchor="end" fontSize="8" fill="#9ca3af">{v.toFixed(1)}</text>
                          </g>)
                        })}
                        {trendData.filter((_, i) => i % 6 === 0).map((d, i) => (
                          <text key={i} x={toX(i * 6)} y={H - 5} textAnchor="middle" fontSize="7" fill="#9ca3af">{d.time}</text>
                        ))}
                        <path d={mkPath(trendData.map(d => d.target))} fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="4 2" />
                        <path d={mkPath(trendData.map(d => d.actual))} fill="none" stroke="#f97316" strokeWidth="1.2" />
                        <path d={mkPath(trendData.map(d => d.optimized))} fill="none" stroke="#14b8a6" strokeWidth="1.5" />
                      </svg>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Analyze */}
          <div className="space-y-3">
            <h2 className="font-semibold">Analyze</h2>
            <div className="grid grid-cols-2 gap-5">
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">기간 별 이익 실현율</h3>
                    <Select defaultValue="3m">
                      <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="3m" className="text-xs">3 Months</SelectItem></SelectContent>
                    </Select>
                  </div>
                  {(() => {
                    const bars = ["2025-10","2025-11","2025-12","2026-01","2026-02"].map(m => ({ month: m, value: 60 + Math.random() * 35 }))
                    const W = 350, H = 160, pad = { t: 10, b: 25, l: 30, r: 10 }
                    const gap = (W - pad.l - pad.r) / bars.length
                    const bw = gap * 0.6
                    return (
                      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 160 }}>
                        {[50, 75, 100].map(v => {
                          const y = pad.t + (1 - v/100) * (H - pad.t - pad.b)
                          return <text key={v} x={pad.l - 3} y={y + 3} textAnchor="end" fontSize="7" fill="#9ca3af">{v}%</text>
                        })}
                        {bars.map((b, i) => {
                          const x = pad.l + i * gap + gap * 0.2
                          const h = (b.value / 100) * (H - pad.t - pad.b)
                          const y = H - pad.b - h
                          return (<g key={i}>
                            <rect x={x} y={y} width={bw} height={h} fill="#2dd4bf" rx="2" />
                            <text x={x + bw/2} y={H - 8} textAnchor="middle" fontSize="7" fill="#6b7280">{b.month}</text>
                          </g>)
                        })}
                      </svg>
                    )
                  })()}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <h3 className="text-sm font-semibold mb-3">최적화 변수 현황</h3>
                  <div className="space-y-2">
                    {selectedModel.tags.slice(0, 5).map((tag, i) => (
                      <div key={tag} className="flex items-center gap-3 text-xs">
                        <span className="font-mono w-20 text-muted-foreground">{tag}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500 rounded-full" style={{ width: `${65 + Math.random() * 30}%` }} />
                        </div>
                        <span className="w-16 text-right text-muted-foreground">{(80 + Math.random() * 18).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}
