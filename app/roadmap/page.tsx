"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ChevronRight, Link, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { INITIAL_WORK_ITEMS } from "@/lib/workbench-data"
import { useRouter } from "next/navigation"

export default function WorkbenchPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const router = useRouter()

  const items = INITIAL_WORK_ITEMS
  const categories = [...new Set(items.map(i => i.category))]

  const filtered = items
    .filter(i => statusFilter === "all" || i.status === statusFilter)
    .filter(i => categoryFilter === "all" || i.category === categoryFilter)
    .filter(i => i.title.toLowerCase().includes(search.toLowerCase()) || i.unit.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()))

  const getPriorityStyle = (p: string) => p === "critical" ? "bg-red-500 text-white" : p === "high" ? "bg-amber-500 text-white" : p === "medium" ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"
  const getStatusStyle = (s: string) => s === "approved" ? "border-green-300 text-green-600" : s === "under-review" ? "border-amber-300 text-amber-600" : s === "in-progress" ? "border-blue-300 text-blue-600" : s === "completed" || s === "closed" ? "border-slate-300 text-slate-500" : "border-purple-300 text-purple-600"

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Worklist</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">다양한 팀 / 공정 / 태스크가 공존하는 중장기 업무 관리 공간. 복수 이벤트 그룹핑을 통해 워크리스트를 종합 관리합니다.</p>
        </header>

        <main className="p-6 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-5 gap-4">
            <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{items.length}</div><p className="text-xs text-muted-foreground">전체 항목</p></CardContent></Card>
            <Card className="border-blue-200"><CardContent className="pt-4"><div className="text-2xl font-bold text-blue-600">{items.filter(i => i.status === "in-progress").length}</div><p className="text-xs text-muted-foreground">In Progress</p></CardContent></Card>
            <Card className="border-amber-200"><CardContent className="pt-4"><div className="text-2xl font-bold text-amber-600">{items.filter(i => i.status === "under-review" || i.status === "planning").length}</div><p className="text-xs text-muted-foreground">Review / Planning</p></CardContent></Card>
            <Card className="border-green-200"><CardContent className="pt-4"><div className="text-2xl font-bold text-green-600">{items.filter(i => i.status === "approved").length}</div><p className="text-xs text-muted-foreground">Approved</p></CardContent></Card>
            <Card className="border-slate-200"><CardContent className="pt-4"><div className="text-2xl font-bold text-slate-500">{items.filter(i => i.status === "completed" || i.status === "closed").length}</div><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="항목 / Unit / 카테고리 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="카테고리" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 카테고리</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="under-review">Under Review</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground w-20">ID</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">항목</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground w-24">Unit</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground w-28">카테고리</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground w-20">Priority</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground w-24">Status</th>
                    <th className="text-center p-3 text-xs font-medium text-muted-foreground w-16">진행률</th>
                    <th className="text-center p-3 text-xs font-medium text-muted-foreground w-16">이벤트</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground w-8" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr
                      key={item.id}
                      className={cn("border-b hover:bg-muted/30 transition-colors cursor-pointer", (item.status === "closed" || item.status === "completed") && "opacity-60")}
                      onClick={() => router.push(`/roadmap/${item.id}`)}
                    >
                      <td className="p-3 font-mono text-xs text-muted-foreground">{item.id}</td>
                      <td className="p-3 text-sm font-medium text-primary hover:underline">{item.title}</td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{item.unit}</Badge></td>
                      <td className="p-3 text-xs text-muted-foreground">{item.category}</td>
                      <td className="p-3"><Badge className={cn("text-xs", getPriorityStyle(item.priority))}>{item.priority}</Badge></td>
                      <td className="p-3"><Badge variant="outline" className={cn("text-xs", getStatusStyle(item.status))}>{item.status}</Badge></td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${item.progress}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{item.progress}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {item.linkedTickets.length > 0 ? (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Link className="h-3 w-3" />
                            {item.linkedTickets.length}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={9} className="p-8 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </main>
      </div>
    </AppShell>
  )
}
