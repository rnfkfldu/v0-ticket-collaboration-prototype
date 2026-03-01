"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  FileText, Search, CheckCircle, Link, Unlink, Plus, X,
  Pencil, MessageSquare, Send, ChevronLeft, AlertTriangle, Clock,
  Target, Users, Wrench, Calendar, Circle, CheckCircle2, Ban
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getTickets } from "@/lib/storage"
import { INITIAL_WORK_ITEMS } from "@/lib/workbench-data"
import type { WorkItem, LinkedTicket, WorkNote, Milestone, WorklistUseCase } from "@/lib/workbench-data"
import { ClosureReportDialog, requiresClosureReport } from "@/components/closure-report-dialog"
import type { ClosureReport } from "@/components/closure-report-dialog"
import { useRouter, useParams } from "next/navigation"

export default function WorkItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const initialItem = INITIAL_WORK_ITEMS.find(i => i.id === id)

  const [item, setItem] = useState<WorkItem | null>(initialItem || null)
  const [showTicketSearch, setShowTicketSearch] = useState(false)
  const [ticketSearchQuery, setTicketSearchQuery] = useState("")
  const [newNote, setNewNote] = useState("")
  const [showClosureReport, setShowClosureReport] = useState(false)

  const allTickets = getTickets()

  if (!item) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">항목을 찾을 수 없습니다.</p>
            <Button variant="outline" onClick={() => router.push("/roadmap")} className="bg-transparent">
              <ChevronLeft className="h-4 w-4 mr-1" />
              목록으로 돌아가기
            </Button>
          </div>
        </div>
      </AppShell>
    )
  }

  const handleLinkTicket = (ticketId: string) => {
    const ticket = allTickets.find(t => t.id === ticketId)
    if (!ticket || item.linkedTickets.some(lt => lt.id === ticketId)) return
    const newLinked: LinkedTicket = { id: ticket.id, title: ticket.title, status: ticket.status, ticketType: ticket.ticketType }
    setItem(prev => prev ? {
      ...prev,
      linkedTickets: [...prev.linkedTickets, newLinked],
      notes: [{ id: `n-${Date.now()}`, date: new Date().toISOString().split("T")[0], author: "시스템", content: `이벤트 #${ticket.id} "${ticket.title}" 연결됨`, type: "ticket-update" as const }, ...prev.notes]
    } : null)
    setShowTicketSearch(false)
    setTicketSearchQuery("")
  }

  const handleUnlinkTicket = (ticketId: string) => {
    setItem(prev => prev ? {
      ...prev,
      linkedTickets: prev.linkedTickets.filter(t => t.id !== ticketId),
      notes: [{ id: `n-${Date.now()}`, date: new Date().toISOString().split("T")[0], author: "시스템", content: `이벤트 #${ticketId} 연결 해제됨`, type: "ticket-update" as const }, ...prev.notes]
    } : null)
  }

  const handleAddNote = () => {
    if (!newNote.trim()) return
    setItem(prev => prev ? {
      ...prev,
      notes: [{ id: `n-${Date.now()}`, date: new Date().toISOString().split("T")[0], author: "김지수", content: newNote, type: "manual" as const }, ...prev.notes]
    } : null)
    setNewNote("")
  }

  const handleClose = () => {
    const check = requiresClosureReport({
      type: "worklist",
      worklistPriority: item.priority,
      worklistCategory: item.category,
      linkedTicketCount: item.linkedTickets.length,
    })
    if (check.required) {
      setShowClosureReport(true)
    } else {
      setItem(prev => prev ? { ...prev, status: "closed" } : null)
      alert("워크리스트가 종결 처리되었습니다.")
    }
  }

  const handleClosureReportSubmit = (report: ClosureReport) => {
    setItem(prev => prev ? {
      ...prev, status: "closed",
      notes: [{ id: `n-${Date.now()}`, date: new Date().toISOString().split("T")[0], author: "시스템", content: `종료 Report "${report.title}" 결재 제출됨 (승인 대기)`, type: "status-change" as const }, ...prev.notes]
    } : null)
    setShowClosureReport(false)
    alert("종료 Report가 조직장에게 결재 요청되었습니다.")
  }

  const getPriorityStyle = (p: string) => p === "critical" ? "bg-red-500 text-white" : p === "high" ? "bg-amber-500 text-white" : p === "medium" ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"
  const getStatusStyle = (s: string) => s === "approved" ? "border-green-300 text-green-600 bg-green-50" : s === "under-review" ? "border-amber-300 text-amber-600 bg-amber-50" : s === "in-progress" ? "border-blue-300 text-blue-600 bg-blue-50" : s === "completed" || s === "closed" ? "border-slate-300 text-slate-500 bg-slate-50" : "border-blue-300 text-blue-600"
  const isClosed = item.status === "closed" || item.status === "completed"
  
  const getUseCaseInfo = (uc?: WorklistUseCase) => {
    switch (uc) {
      case "team-project": return { label: "팀 프로젝트", icon: Users, color: "text-blue-600" }
      case "problem-solving": return { label: "문제 해결", icon: Wrench, color: "text-amber-600" }
      case "ta-worklist": return { label: "TA Worklist", icon: Calendar, color: "text-green-600" }
      case "optimization": return { label: "최적화", icon: Target, color: "text-purple-600" }
      default: return null
    }
  }
  
  const getMilestoneStatusIcon = (status: Milestone["status"]) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "in-progress": return <Circle className="h-4 w-4 text-blue-600 fill-blue-100" />
      case "blocked": return <Ban className="h-4 w-4 text-red-600" />
      default: return <Circle className="h-4 w-4 text-muted-foreground" />
    }
  }
  
  const useCaseInfo = getUseCaseInfo(item.useCase)
  const milestones = item.milestones || []
  const completedMilestones = milestones.filter(m => m.status === "completed").length

  const ticketSearchResults = allTickets.filter(t =>
    (t.title.toLowerCase().includes(ticketSearchQuery.toLowerCase()) || t.id.includes(ticketSearchQuery)) &&
    !item.linkedTickets.some(lt => lt.id === t.id)
  ).slice(0, 8)

  const closedTickets = item.linkedTickets.filter(t => t.status === "Closed").length
  const progressPct = item.linkedTickets.length > 0 ? Math.round((closedTickets / item.linkedTickets.length) * 100) : 0

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/roadmap")} className="gap-1 -ml-2 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
              Worklist
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-muted-foreground">{item.id}</span>
              <Badge className={cn("text-xs", getPriorityStyle(item.priority))}>{item.priority}</Badge>
              <Badge variant="outline" className={cn("text-xs", getStatusStyle(item.status))}>{item.status}</Badge>
              <Badge variant="outline" className="text-xs">{item.unit}</Badge>
              <Badge variant="secondary" className="text-xs">{item.category}</Badge>
              {useCaseInfo && (
                <Badge variant="secondary" className={cn("text-xs gap-1", useCaseInfo.color)}>
                  <useCaseInfo.icon className="h-3 w-3" />
                  {useCaseInfo.label}
                </Badge>
              )}
            </div>
            {!isClosed && (
              <Button onClick={handleClose} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                종결
              </Button>
            )}
          </div>
          <h1 className="text-xl font-semibold mt-2">{item.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
        </header>

        <main className="p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Left: Main content (2 cols) */}
            <div className="col-span-2 space-y-6">
              {/* Work Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    업무 현황
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {milestones.length > 0 && (
                      <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-100">
                        <div className="text-xl font-bold text-purple-600">{completedMilestones}/{milestones.length}</div>
                        <p className="text-xs text-purple-600 mt-1">마일스톤</p>
                      </div>
                    )}
                    <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                      <div className="text-xl font-bold text-blue-600">{item.linkedTickets.length}</div>
                      <p className="text-xs text-blue-600 mt-1">연결 이벤트</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <div className="text-xl font-bold text-amber-600">
                        {item.linkedTickets.filter(t => t.status === "In Progress" || t.status === "Open").length}
                      </div>
                      <p className="text-xs text-amber-600 mt-1">진행 중</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-green-50 border border-green-100">
                      <div className="text-xl font-bold text-green-600">{closedTickets}</div>
                      <p className="text-xs text-green-600 mt-1">완료</p>
                    </div>
                  </div>
                  
                  {/* Progress bars */}
                  <div className="space-y-3">
                    {milestones.length > 0 && (
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>마일스톤 진행률</span>
                          <span className="font-medium">{Math.round((completedMilestones / milestones.length) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${(completedMilestones / milestones.length) * 100}%` }} />
                        </div>
                      </div>
                    )}
                    {item.linkedTickets.length > 0 && (
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>이벤트 진행률</span>
                          <span className="font-medium">{progressPct}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tabs: Milestones + Tickets + Notes */}
              <Tabs defaultValue={milestones.length > 0 ? "milestones" : "tickets"}>
                <TabsList>
                  {milestones.length > 0 && (
                    <TabsTrigger value="milestones">마일스톤 ({completedMilestones}/{milestones.length})</TabsTrigger>
                  )}
                  <TabsTrigger value="tickets">연결 이벤트 ({item.linkedTickets.length})</TabsTrigger>
                  <TabsTrigger value="notes">관리 이력 ({item.notes.length})</TabsTrigger>
                </TabsList>
                
                {/* Milestones Tab */}
                {milestones.length > 0 && (
                  <TabsContent value="milestones" className="mt-4 space-y-3">
                    <div className="space-y-3">
                      {milestones.map((ms, idx) => (
                        <div key={ms.id} className={cn(
                          "flex items-start gap-3 p-4 rounded-lg border transition-colors",
                          ms.status === "completed" ? "bg-green-50/50 border-green-200" :
                          ms.status === "in-progress" ? "bg-blue-50/50 border-blue-200" :
                          ms.status === "blocked" ? "bg-red-50/50 border-red-200" :
                          "bg-muted/20 border-border"
                        )}>
                          <div className="flex flex-col items-center gap-1">
                            {getMilestoneStatusIcon(ms.status)}
                            {idx < milestones.length - 1 && (
                              <div className={cn(
                                "w-0.5 h-8",
                                ms.status === "completed" ? "bg-green-300" : "bg-muted"
                              )} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-sm">{ms.name}</span>
                              <div className="flex items-center gap-2">
                                {ms.targetDate && (
                                  <span className="text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3 inline mr-1" />
                                    {ms.targetDate}
                                  </span>
                                )}
                                <Badge variant="outline" className={cn(
                                  "text-xs",
                                  ms.status === "completed" ? "border-green-300 text-green-600" :
                                  ms.status === "in-progress" ? "border-blue-300 text-blue-600" :
                                  ms.status === "blocked" ? "border-red-300 text-red-600" :
                                  "border-muted text-muted-foreground"
                                )}>
                                  {ms.status === "completed" ? "완료" :
                                   ms.status === "in-progress" ? "진행 중" :
                                   ms.status === "blocked" ? "차단됨" : "대기"}
                                </Badge>
                              </div>
                            </div>
                            {ms.description && (
                              <p className="text-xs text-muted-foreground mt-1">{ms.description}</p>
                            )}
                            {ms.linkedTicketIds.length > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                <Link className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  연결 이벤트: {ms.linkedTicketIds.map(tid => `#${tid}`).join(", ")}
                                </span>
                              </div>
                            )}
                            {ms.completedDate && (
                              <span className="text-xs text-green-600 mt-1 block">완료: {ms.completedDate}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Problem solving specific info */}
                    {item.useCase === "problem-solving" && item.problemStatement && (
                      <Card className="mt-4 border-amber-200 bg-amber-50/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                            <Wrench className="h-4 w-4" />
                            문제 정의
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{item.problemStatement}</p>
                          {item.triedApproaches && item.triedApproaches.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-amber-200">
                              <p className="text-xs text-muted-foreground mb-2">시도한 접근법:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {item.triedApproaches.map((approach, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">{approach}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Team project specific info */}
                    {item.useCase === "team-project" && item.teamMembers && item.teamMembers.length > 0 && (
                      <Card className="mt-4 border-blue-200 bg-blue-50/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                            <Users className="h-4 w-4" />
                            참여 팀원
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {item.teamMembers.map((member, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">{member}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                )}

                <TabsContent value="tickets" className="mt-4 space-y-3">
                  {item.linkedTickets.map(ticket => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Link className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <button
                            onClick={() => router.push(`/tickets/${ticket.id}`)}
                            className="text-sm font-medium hover:text-primary truncate block text-left"
                          >
                            #{ticket.id} {ticket.title}
                          </button>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{ticket.ticketType}</Badge>
                            <Badge variant={ticket.status === "Closed" ? "secondary" : "outline"} className="text-xs">{ticket.status}</Badge>
                          </div>
                        </div>
                      </div>
                      {!isClosed && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleUnlinkTicket(ticket.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {item.linkedTickets.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                      <Link className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">연결된 이벤트이 없습니다.</p>
                    </div>
                  )}

                  {!isClosed && (
                    <>
                      {showTicketSearch ? (
                        <Card className="p-4 space-y-3 bg-muted/20">
                          <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="이벤트 검색 (ID 또는 제목)..."
                              value={ticketSearchQuery}
                              onChange={e => setTicketSearchQuery(e.target.value)}
                              className="text-sm"
                              autoFocus
                            />
                            <Button variant="ghost" size="sm" onClick={() => { setShowTicketSearch(false); setTicketSearchQuery("") }}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          {ticketSearchQuery && (
                            <div className="max-h-48 overflow-y-auto space-y-1">
                              {ticketSearchResults.map(t => (
                                <button
                                  key={t.id}
                                  onClick={() => handleLinkTicket(t.id)}
                                  className="w-full flex items-center gap-2 p-2.5 rounded hover:bg-muted text-left text-sm"
                                >
                                  <span className="text-muted-foreground font-mono text-xs">#{t.id}</span>
                                  <span className="truncate">{t.title}</span>
                                  <Badge variant="outline" className="text-xs ml-auto shrink-0">{t.status}</Badge>
                                </button>
                              ))}
                              {ticketSearchResults.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-3">검색 결과가 없습니다</p>
                              )}
                            </div>
                          )}
                        </Card>
                      ) : (
                        <Button variant="outline" className="w-full bg-transparent gap-2" onClick={() => setShowTicketSearch(true)}>
                          <Plus className="h-4 w-4" />
                          이벤트 연결
                        </Button>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="notes" className="mt-4 space-y-3">
                  {!isClosed && (
                    <div className="flex gap-2">
                      <Textarea
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        placeholder="관리 메모를 작성하세요..."
                        className="min-h-20 text-sm flex-1"
                      />
                      <Button className="shrink-0 self-end" onClick={handleAddNote} disabled={!newNote.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="space-y-2">
                    {item.notes.map(note => (
                      <div key={note.id} className={cn(
                        "p-3 rounded-lg border text-sm",
                        note.type === "manual" ? "bg-card" :
                        note.type === "ticket-update" ? "bg-blue-50/50 border-blue-200/50" :
                        "bg-amber-50/50 border-amber-200/50"
                      )}>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          {note.type === "manual" ? <MessageSquare className="h-3 w-3" /> : note.type === "ticket-update" ? <Link className="h-3 w-3 text-blue-500" /> : <AlertTriangle className="h-3 w-3 text-amber-500" />}
                          <span className="font-medium">{note.author}</span>
                          <span>{note.date}</span>
                        </div>
                        <p className="text-sm">{note.content}</p>
                      </div>
                    ))}
                    {item.notes.length === 0 && (
                      <div className="text-center py-10 text-muted-foreground text-sm">기록된 이력이 없습니다.</div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right: Info sidebar (1 col) */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">기본 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Category", value: item.category },
                    { label: "담당", value: item.owner },
                    { label: "기대 효과", value: item.expectedBenefit || "-" },
                    { label: "예상 비용", value: item.estimatedCost || "-" },
                    { label: "소요 기간", value: item.duration || "-" },
                    { label: "시작", value: item.startDate || "-" },
                    { label: "목표 완료", value: item.targetDate || "-" },
                    { label: "진행률", value: `${item.progress}%` },
                  ].map(info => (
                    <div key={info.label}>
                      <Label className="text-xs text-muted-foreground">{info.label}</Label>
                      <p className="text-sm font-medium mt-0.5">{info.value}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Status timeline */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">상태 이력</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {item.notes.filter(n => n.type === "status-change").length > 0 ? (
                      item.notes.filter(n => n.type === "status-change").slice(0, 5).map(note => (
                        <div key={note.id} className="flex gap-2 text-xs">
                          <Clock className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p>{note.content}</p>
                            <span className="text-muted-foreground">{note.date}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">상태 변경 이력이 없습니다.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <ClosureReportDialog
        open={showClosureReport}
        onOpenChange={setShowClosureReport}
        title={item.title}
        description={item.description}
        type="worklist"
        linkedTickets={item.linkedTickets.map(t => ({ id: t.id, title: t.title }))}
        onSubmit={handleClosureReportSubmit}
      />
    </AppShell>
  )
}
