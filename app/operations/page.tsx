"use client"

import { useMemo, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser, getProcessesByDivision, type Division, ALL_PROCESSES } from "@/lib/user-context"
import Link from "next/link"

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
  const { visibleProcesses, scopeMode, currentUser } = useUser()
  const [search, setSearch] = useState("")
  const [teamFilter, setTeamFilter] = useState("all")
  const [processFilter, setProcessFilter] = useState("all")
  const [page, setPage] = useState(1)
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
            </div>
            <div className="flex items-center gap-2">
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

          {/* Data Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-20">구분</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-24">공정 No.</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">공정 Description</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground w-28">처리량 Guide</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground w-32">Product Spec Guide</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground w-28">Operation Guide</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground w-24">이상징후 탐색</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((process) => (
                    <tr 
                      key={process.id} 
                      className="border-b last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <Badge className="text-xs bg-primary/15 text-primary border-0 font-normal">
                          {scopeMode === "my-processes" ? "담당" : DIVISION_LABELS[process.division]?.substring(0, 3) || "담당"}
                        </Badge>
                      </td>
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
                  ))}
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
        </main>
      </div>
    </AppShell>
  )
}
