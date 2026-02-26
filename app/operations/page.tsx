"use client"

import { useMemo, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { 
  Activity, 
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BarChart3,
  ShieldCheck,
  FileText,
  Cpu,
  Plus,
  Users,
  ChevronDown,
  LayoutGrid,
  List,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser, getProcessesByDivision, type Division, ALL_PROCESSES } from "@/lib/user-context"
import Link from "next/link"

// 팀장용: 공정별 담당 엔지니어 매핑 (목업)
const PROCESS_ENGINEERS: Record<string, { name: string; status: "normal" | "warning" | "attention" }> = {
  "HCR": { name: "김철수", status: "attention" },
  "VGOFCC": { name: "김철수", status: "normal" },
  "RFCC": { name: "최진우", status: "warning" },
  "VRHR": { name: "최진우", status: "normal" },
  "1KD": { name: "한미영", status: "normal" },
  "2KD": { name: "한미영", status: "normal" },
  "3KD": { name: "한미영", status: "normal" },
  "4KD": { name: "한미영", status: "normal" },
  "VBU": { name: "송재현", status: "normal" },
  "RHDS": { name: "송재현", status: "normal" },
  "VGHDS": { name: "송재현", status: "warning" },
  "SRU": { name: "송재현", status: "normal" },
  "1CDU": { name: "박영희", status: "normal" },
  "2CDU": { name: "박영희", status: "attention" },
  "1VDU": { name: "박영희", status: "normal" },
}

// Generate deterministic mock data for each process
function generateProcessKpis(id: string) {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const throughputCompliance = hash % 5 === 0 ? `${92 + (hash % 8)}%` : "(-)"
  const specCompliance = hash % 7 === 0 ? `${95 + (hash % 5)}%` : "(-)"
  const opGuide = hash % 6 === 0 ? `${90 + (hash % 10)}%` : "(-)"
  const anomalyCount = hash % 4 === 0 ? (hash % 3) : 0
  return { throughputCompliance, specCompliance, opGuide, anomalyCount }
}

const DIVISION_LABELS: Record<Division, string> = {
  Refining: "Refining",
  Chemical: "Chemical",
  Upgrading: "Upgrading",
}

export default function OperationsPage() {
  const { visibleProcesses, scopeMode, currentUser, isManagement } = useUser()
  const isTeamLead = currentUser.role === "team-lead" || currentUser.role === "division-head" || currentUser.role === "plant-head"
  
  const [search, setSearch] = useState("")
  const [teamFilter, setTeamFilter] = useState("all")
  const [processFilter, setProcessFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<"list" | "grouped">(isTeamLead ? "grouped" : "list")
  const pageSize = 30

  const byDivision = useMemo(() => getProcessesByDivision(visibleProcesses), [visibleProcesses])

  const processesWithKpis = useMemo(() => 
    visibleProcesses.map(p => {
      const kpis = generateProcessKpis(p.id)
      const division = Object.entries(byDivision).find(([, ps]) => 
        ps.some(pp => pp.id === p.id)
      )?.[0] as Division | undefined
      return { ...p, ...kpis, division: division || "Refining" as Division }
    }), [visibleProcesses, byDivision]
  )

  const filtered = useMemo(() => {
    let items = processesWithKpis
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
    }
    if (teamFilter !== "all") {
      items = items.filter(p => p.division === teamFilter)
    }
    return items
  }, [processesWithKpis, search, teamFilter])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  // Summary KPIs
  const myProcessCount = visibleProcesses.length
  const withThroughput = processesWithKpis.filter(p => p.throughputCompliance !== "(-)").length
  const withSpec = processesWithKpis.filter(p => p.specCompliance !== "(-)").length
  const withOpGuide = processesWithKpis.filter(p => p.opGuide !== "(-)").length
  const totalAnomalies = processesWithKpis.reduce((s, p) => s + p.anomalyCount, 0)

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Daily Monitoring</h1>
            </div>
          </div>

          {/* Time + Filter controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center rounded border overflow-hidden text-xs">
              {["2H", "D", "W", "M", "Y"].map((t, i) => (
                <button key={t} className={cn("px-3 py-1.5 font-medium transition-colors", i === 1 ? "bg-foreground text-background" : "bg-card hover:bg-muted text-foreground")}>{t}</button>
              ))}
            </div>
            <Input type="date" defaultValue="2026-02-19" className="w-32 h-8 text-xs" />
            <Input type="date" defaultValue="2026-02-19" className="w-32 h-8 text-xs" />
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="팀" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 선택</SelectItem>
                <SelectItem value="Refining">Refining</SelectItem>
                <SelectItem value="Chemical">Chemical</SelectItem>
                <SelectItem value="Upgrading">Upgrading</SelectItem>
              </SelectContent>
            </Select>
            <Select value={processFilter} onValueChange={setProcessFilter}>
              <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="공정" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 선택</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-background">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-white/20 flex items-center justify-center">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-primary-foreground/80">담당 공정 수</p>
                    <p className="text-2xl font-bold">{myProcessCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">처리량 Guide 준수율</p>
                <p className="text-lg font-bold mt-1">
                  <span className="text-primary">({withThroughput})</span>
                  <span className="text-muted-foreground text-sm"> / 100%</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Product Spec Guide 준수율</p>
                <p className="text-lg font-bold mt-1">
                  <span className="text-primary">({withSpec})</span>
                  <span className="text-muted-foreground text-sm"> / 100%</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">Operation Guide 준수율</p>
                <p className="text-lg font-bold mt-1">
                  <span className="text-primary">({withOpGuide})</span>
                  <span className="text-muted-foreground text-sm"> / 100%</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">이상징후 탐색</p>
                </div>
                <p className="text-lg font-bold mt-1">
                  <span className={totalAnomalies > 0 ? "text-amber-600" : "text-muted-foreground"}>({totalAnomalies})</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Process List Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">공정 리스트</h2>
              <span className="text-xs text-muted-foreground">({filtered.length}건)</span>
              {isTeamLead && (
                <Badge variant="outline" className="text-xs ml-2">
                  <Users className="h-3 w-3 mr-1" />
                  팀 전체 공정
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isTeamLead && (
                <div className="flex items-center rounded border overflow-hidden">
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn("p-1.5 transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}
                    title="리스트 뷰"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grouped")}
                    className={cn("p-1.5 transition-colors", viewMode === "grouped" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}
                    title="그룹 뷰"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  className="pl-8 h-8 w-48 text-xs"
                />
              </div>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 bg-card">
                <Plus className="h-3.5 w-3.5" />
                관심공정 추가
              </Button>
            </div>
          </div>

          {/* Data Table - 팀장 그룹 뷰 */}
          {isTeamLead && viewMode === "grouped" ? (
            <div className="space-y-4">
              {/* 엔지니어별 그룹핑 */}
              {(() => {
                const engineerGroups: Record<string, typeof filtered> = {}
                filtered.forEach(p => {
                  const eng = PROCESS_ENGINEERS[p.id]?.name || "미배정"
                  if (!engineerGroups[eng]) engineerGroups[eng] = []
                  engineerGroups[eng].push(p)
                })
                
                return Object.entries(engineerGroups).map(([engineer, processes]) => {
                  const hasWarning = processes.some(p => PROCESS_ENGINEERS[p.id]?.status === "warning")
                  const hasAttention = processes.some(p => PROCESS_ENGINEERS[p.id]?.status === "attention")
                  const anomalyCount = processes.reduce((sum, p) => sum + p.anomalyCount, 0)
                  
                  return (
                    <Card key={engineer} className={cn("overflow-hidden", hasAttention && "border-l-4 border-l-red-500", hasWarning && !hasAttention && "border-l-4 border-l-amber-500")}>
                      <CardHeader className="py-3 px-4 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            {engineer}
                            <Badge variant="outline" className="text-xs">{processes.length}개 공정</Badge>
                            {hasAttention && <Badge variant="destructive" className="text-xs">관심 필요</Badge>}
                            {hasWarning && !hasAttention && <Badge className="text-xs bg-amber-500">주의</Badge>}
                          </CardTitle>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {anomalyCount > 0 && (
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                이상징후 {anomalyCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/20">
                              <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground w-20">상태</th>
                              <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground w-24">공정 No.</th>
                              <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">공정 Description</th>
                              <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground w-28">처리량 Guide</th>
                              <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground w-32">Product Spec Guide</th>
                              <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground w-28">Operation Guide</th>
                              <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground w-24">이상징후</th>
                            </tr>
                          </thead>
                          <tbody>
                            {processes.map((process) => {
                              const engStatus = PROCESS_ENGINEERS[process.id]?.status || "normal"
                              return (
                                <tr 
                                  key={process.id} 
                                  className={cn("border-b last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer", engStatus === "attention" && "bg-red-50/50", engStatus === "warning" && "bg-amber-50/50")}
                                >
                                  <td className="px-4 py-2.5">
                                    {engStatus === "attention" ? (
                                      <Badge variant="destructive" className="text-xs">관심</Badge>
                                    ) : engStatus === "warning" ? (
                                      <Badge className="text-xs bg-amber-500">주의</Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs text-green-600 border-green-300">정상</Badge>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{process.id}</td>
                                  <td className="px-4 py-2.5">
                                    <Link 
                                      href={`/operations/unit/${process.id}`}
                                      className="text-sm text-primary hover:underline font-medium"
                                    >
                                      {process.name}
                                    </Link>
                                  </td>
                                  <td className="text-center px-4 py-2.5 text-xs">
                                    {process.throughputCompliance === "(-)" ? (
                                      <span className="text-muted-foreground/50">(-)</span>
                                    ) : (
                                      <span className="text-foreground font-medium">{process.throughputCompliance}</span>
                                    )}
                                  </td>
                                  <td className="text-center px-4 py-2.5 text-xs">
                                    {process.specCompliance === "(-)" ? (
                                      <span className="text-muted-foreground/50">(-)</span>
                                    ) : (
                                      <span className="text-foreground font-medium">{process.specCompliance}</span>
                                    )}
                                  </td>
                                  <td className="text-center px-4 py-2.5 text-xs">
                                    {process.opGuide === "(-)" ? (
                                      <span className="text-muted-foreground/50">(-)</span>
                                    ) : (
                                      <span className="text-foreground font-medium">{process.opGuide}</span>
                                    )}
                                  </td>
                                  <td className="text-center px-4 py-2.5 text-xs">
                                    {process.anomalyCount > 0 ? (
                                      <Badge variant="destructive" className="text-xs">{process.anomalyCount}</Badge>
                                    ) : (
                                      <span className="text-muted-foreground/50">(-)</span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>
                  )
                })
              })()}
            </div>
          ) : (
            /* 기본 리스트 뷰 */
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-20">구분</th>
                      {isTeamLead && <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-20">담당자</th>}
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-24">공정 No.</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">공정 Description</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground w-28">처리량 Guide</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground w-32">Product Spec Guide</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground w-28">Operation Guide</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground w-24">이상징후 탐색</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((process) => {
                      const engInfo = PROCESS_ENGINEERS[process.id]
                      return (
                        <tr 
                          key={process.id} 
                          className="border-b last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer group"
                        >
                          <td className="px-4 py-3">
                            <Badge className="text-xs bg-primary/15 text-primary border-0 font-normal">
                              {scopeMode === "my-processes" ? "담당" : DIVISION_LABELS[process.division]?.substring(0, 3) || "담당"}
                            </Badge>
                          </td>
                          {isTeamLead && (
                            <td className="px-4 py-3 text-xs">
                              <span className={cn(
                                "font-medium",
                                engInfo?.status === "attention" && "text-red-600",
                                engInfo?.status === "warning" && "text-amber-600"
                              )}>
                                {engInfo?.name || "-"}
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{process.id}</td>
                          <td className="px-4 py-3">
                            <Link 
                              href={`/operations/unit/${process.id}`}
                              className="text-sm text-primary hover:underline font-medium"
                            >
                              {process.name}
                            </Link>
                          </td>
                          <td className="text-center px-4 py-3 text-xs text-muted-foreground">
                            {process.throughputCompliance === "(-)" ? (
                              <span className="text-muted-foreground/50">(-)</span>
                            ) : (
                              <span className="text-foreground font-medium">{process.throughputCompliance}</span>
                            )}
                          </td>
                          <td className="text-center px-4 py-3 text-xs">
                            {process.specCompliance === "(-)" ? (
                              <span className="text-muted-foreground/50">No Data</span>
                            ) : (
                              <span className="text-foreground font-medium">{process.specCompliance}</span>
                            )}
                          </td>
                          <td className="text-center px-4 py-3 text-xs">
                            {process.opGuide === "(-)" ? (
                              <span className="text-muted-foreground/50">No Data</span>
                            ) : (
                              <span className="text-foreground font-medium">{process.opGuide}</span>
                            )}
                          </td>
                          <td className="text-center px-4 py-3 text-xs">
                            {process.anomalyCount > 0 ? (
                              <Badge variant="destructive" className="text-xs">{process.anomalyCount}</Badge>
                            ) : (
                              <span className="text-muted-foreground/50">(-)</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-4 py-3 border-t bg-muted/20">
                <span className="text-xs text-muted-foreground">총 {filtered.length}건</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(1)}>
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <div className="flex items-center gap-1 px-2">
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded bg-primary text-primary-foreground text-xs font-medium">{page}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Select defaultValue="30">
                  <SelectTrigger className="w-20 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">/page</span>
              </div>
            </Card>
          )}
        </main>
      </div>
    </AppShell>
  )
}
