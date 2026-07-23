"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Search, ChevronRight, Link, Layers, Plus, Users, Wrench, Calendar, Target, AlertTriangle, CheckCircle, X, GripVertical, Trash2, GitBranch } from "lucide-react"
import { EventRelationCanvas } from "@/components/event-relation-canvas"
import { cn } from "@/lib/utils"
import { type WorkItem, type Milestone, type WorklistUseCase, type LinkedTicket } from "@/lib/workbench-data"
import { getWorklists, saveWorklist, getTickets } from "@/lib/storage"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/user-context"

export default function WorkbenchPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [useCaseFilter, setUseCaseFilter] = useState("all")
  const router = useRouter()
  const { currentUser } = useUser()
  const isTeamLead = currentUser.role === "team-lead" || currentUser.role === "division-head" || currentUser.role === "plant-head"

  // Worklist creation dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createStep, setCreateStep] = useState(1)
  const [createMode, setCreateMode] = useState<"simple" | "advanced">("simple") // simple = 간편 모드, advanced = 상세 모드
  const [newWorklist, setNewWorklist] = useState<Partial<WorkItem>>({
    title: "",
    description: "",
    unit: "",
    category: "",
    priority: "medium",
    useCase: "problem-solving",
    problemStatement: "",
    milestones: [],
    teamMembers: [],
    parallelTracks: [],
    linkedTickets: [],
  })
  const [newMilestone, setNewMilestone] = useState({ name: "", description: "", targetDate: "", assignee: "" })
  
  // Ticket linking state
  const [showTicketLinkDialog, setShowTicketLinkDialog] = useState(false)
  const [ticketSearchQuery, setTicketSearchQuery] = useState("")
  const availableTickets = getTickets()
  
  // Event relations state
  const [eventRelations, setEventRelations] = useState<Array<{
    id: string
    sourceId: string
    targetId: string
    type: "parent-child" | "sequence"
  }>>([])
  const [eventDueDates, setEventDueDates] = useState<Array<{
    eventId: string
    dueDate: string
  }>>([])
  const [showCanvasView, setShowCanvasView] = useState(false)

  // Mutable work items list from storage
  const [items, setItems] = useState<WorkItem[]>(() => getWorklists())
  
  const categories = [...new Set(items.map(i => i.category))]
  const units = [...new Set(items.map(i => i.unit))]

  const filtered = items
    .filter(i => statusFilter === "all" || i.status === statusFilter)
    .filter(i => categoryFilter === "all" || i.category === categoryFilter)
    .filter(i => useCaseFilter === "all" || i.useCase === useCaseFilter)
    .filter(i => i.title.toLowerCase().includes(search.toLowerCase()) || i.unit.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()))

  const getPriorityStyle = (p: string) => p === "critical" ? "bg-red-500 text-white" : p === "high" ? "bg-amber-500 text-white" : p === "medium" ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"
  const getStatusStyle = (s: string) => s === "approved" ? "border-green-300 text-green-600" : s === "under-review" ? "border-amber-300 text-amber-600" : s === "in-progress" ? "border-blue-300 text-blue-600" : s === "completed" || s === "closed" ? "border-slate-300 text-slate-500" : "border-purple-300 text-purple-600"
  const getUseCaseLabel = (uc?: WorklistUseCase) => {
    switch (uc) {
      case "team-project": return "팀 프로젝트"
      case "problem-solving": return "문제 해결"
      case "ta-worklist": return "TA Worklist"
      case "optimization": return "최적화"
      default: return "-"
    }
  }

  const addMilestone = () => {
    if (!newMilestone.name.trim()) return
    const milestone: Milestone = {
      id: `ms-${Date.now()}`,
      name: newMilestone.name,
      description: newMilestone.description,
      targetDate: newMilestone.targetDate,
      status: "not-started",
      linkedTicketIds: [],
      order: (newWorklist.milestones?.length || 0) + 1
    }
    setNewWorklist(prev => ({
      ...prev,
      milestones: [...(prev.milestones || []), milestone]
    }))
    setNewMilestone({ name: "", description: "", targetDate: "" })
  }

  const removeMilestone = (id: string) => {
    setNewWorklist(prev => ({
      ...prev,
      milestones: (prev.milestones || []).filter(m => m.id !== id)
    }))
  }

  const handleCreateWorklist = () => {
    // Create new worklist item
    const newId = `WL-${String(items.length + 1).padStart(3, "0")}`
    const newItem: WorkItem = {
      id: newId,
      title: newWorklist.title || "새 워크리스트",
      unit: newWorklist.unit || "Cross-Unit",
      category: newWorklist.category || "기타",
      priority: (newWorklist.priority as WorkItem["priority"]) || "medium",
      status: "planning",
      owner: currentUser.name,
      description: newWorklist.description || "",
      progress: 0,
      startDate: new Date().toISOString().slice(0, 7),
      targetDate: newWorklist.targetDate || (newWorklist.milestones?.length 
        ? newWorklist.milestones[newWorklist.milestones.length - 1].targetDate 
        : undefined),
      linkedTickets: newWorklist.linkedTickets || [],
      notes: [{
        id: `n-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        author: currentUser.name,
        content: "워크리스트가 생성되었습니다.",
        type: "status-change"
      }],
      useCase: createMode === "simple" ? undefined : newWorklist.useCase,
      milestones: createMode === "simple" ? [] : newWorklist.milestones,
      problemStatement: newWorklist.problemStatement,
      triedApproaches: [],
      teamMembers: newWorklist.teamMembers,
      parallelTracks: newWorklist.parallelTracks,
    }
    
    // Save to storage
    saveWorklist(newItem)
    
    // Add to local items list
    setItems(prev => [newItem, ...prev])
    
    // Reset form and close dialog
    setShowCreateDialog(false)
    setCreateStep(1)
    setCreateMode("simple")
    setNewWorklist({
      title: "",
      description: "",
      unit: "",
      category: "",
      priority: "medium",
      useCase: "problem-solving",
      problemStatement: "",
      milestones: [],
      teamMembers: [],
      parallelTracks: [],
      linkedTickets: [],
    })
    
    // Navigate to the detail page
    router.push(`/roadmap/${newId}`)
  }
  
  const handleLinkTicket = (ticketId: string) => {
    const ticket = availableTickets.find(t => t.id === ticketId)
    if (!ticket || newWorklist.linkedTickets?.some(lt => lt.id === ticketId)) return
    const newLinked: LinkedTicket = { 
      id: ticket.id, 
      title: ticket.title, 
      status: ticket.status, 
      ticketType: ticket.ticketType 
    }
    setNewWorklist(prev => ({
      ...prev,
      linkedTickets: [...(prev.linkedTickets || []), newLinked]
    }))
    setShowTicketLinkDialog(false)
    setTicketSearchQuery("")
  }
  
  const handleUnlinkTicket = (ticketId: string) => {
    setNewWorklist(prev => ({
      ...prev,
      linkedTickets: (prev.linkedTickets || []).filter(t => t.id !== ticketId)
    }))
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">과제 목록</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">다양한 팀 / 공정 / 태스크가 공존하는 중장기 업무 관리 공간. 복수 이벤트 그룹핑을 통해 워크리스트를 종합 관리합니다.</p>
            </div>
<Button onClick={() => { setCreateStep(0); setShowCreateDialog(true) }} className="gap-2">
  <Plus className="h-4 w-4" />
  워크리스트 생성
            </Button>
          </div>
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
            <Select value={useCaseFilter} onValueChange={setUseCaseFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="유형" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 유형</SelectItem>
                <SelectItem value="team-project">팀 프로젝트</SelectItem>
                <SelectItem value="problem-solving">문제 해결</SelectItem>
                <SelectItem value="ta-worklist">TA Worklist</SelectItem>
                <SelectItem value="optimization">최적화</SelectItem>
              </SelectContent>
            </Select>
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
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground w-24">유형</th>
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
                      onClick={() => router.push(`/actions/tasks/${item.id}`)}
                    >
                      <td className="p-3 font-mono text-xs text-muted-foreground">{item.id}</td>
                      <td className="p-3 text-sm font-medium text-primary hover:underline">{item.title}</td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{item.unit}</Badge></td>
                      <td className="p-3"><Badge variant="secondary" className="text-xs">{getUseCaseLabel(item.useCase)}</Badge></td>
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
                    <tr><td colSpan={10} className="p-8 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Create Worklist Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open)
        if (!open) {
          setCreateStep(1)
          setCreateMode("simple")
        }
      }}>
        <DialogContent className="max-w-2xl h-[85vh] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              워크리스트 생성
            </DialogTitle>
            <DialogDescription>
              {createMode === "simple" 
                ? "워크리스트를 생성하고 관련 이벤트를 연결합니다"
                : "새로운 워크리스트를 생성하고 마일스톤을 설계합니다"}
            </DialogDescription>
          </DialogHeader>
          
          {/* Mode Selection - Step 0 */}
          {createStep === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 py-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">워크리스트 생성 방식 선택</h3>
                <p className="text-sm text-muted-foreground">사용 목적에 맞는 방식을 선택하세요</p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                <Card 
                  className={cn(
                    "cursor-pointer p-6 transition-all hover:border-primary",
                    createMode === "simple" && "border-primary bg-primary/5"
                  )}
                  onClick={() => setCreateMode("simple")}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                      <Link className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="font-medium mb-1">간편 모드</h4>
                    <p className="text-xs text-muted-foreground">
                      워크리스트만 빠르게 생성하고 관련 이벤트를 연결합니다
                    </p>
                    <div className="flex flex-wrap gap-1 mt-3 justify-center">
                      <Badge variant="secondary" className="text-[10px]">빠른 생성</Badge>
                      <Badge variant="secondary" className="text-[10px]">이벤트 연결</Badge>
                    </div>
                  </div>
                </Card>
                <Card 
                  className={cn(
                    "cursor-pointer p-6 transition-all hover:border-primary",
                    createMode === "advanced" && "border-primary bg-primary/5"
                  )}
                  onClick={() => setCreateMode("advanced")}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                      <Layers className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-medium mb-1">상세 모드</h4>
                    <p className="text-xs text-muted-foreground">
                      유형 선택, 마일스톤 설계, 팀원 배정까지 상세하게 설정합니다
                    </p>
                    <div className="flex flex-wrap gap-1 mt-3 justify-center">
                      <Badge variant="secondary" className="text-[10px]">마일스톤</Badge>
                      <Badge variant="secondary" className="text-[10px]">팀원 배정</Badge>
                    </div>
                  </div>
                </Card>
              </div>
              <Button onClick={() => setCreateStep(1)} className="mt-4">
                다음
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
          
          {/* Step Indicator - Only show for step 1+ */}
          {createStep >= 1 && (
            <div className="flex items-center gap-2 py-2 border-b shrink-0">
              {createMode === "simple" ? (
                // Simple mode steps
                [1, 2].map(step => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium",
                      createStep >= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {createStep > step ? <CheckCircle className="h-4 w-4" /> : step}
                    </div>
                    <span className={cn("text-sm", createStep >= step ? "text-foreground" : "text-muted-foreground")}>
                      {step === 1 ? "기본 정보" : "이벤트 연결"}
                    </span>
                    {step < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                ))
              ) : (
                // Advanced mode steps
                [1, 2, 3].map(step => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium",
                      createStep >= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {createStep > step ? <CheckCircle className="h-4 w-4" /> : step}
                    </div>
                    <span className={cn("text-sm", createStep >= step ? "text-foreground" : "text-muted-foreground")}>
                      {step === 1 ? "기본 정보" : step === 2 ? "유형 선택" : "마일스톤 설계"}
                    </span>
                    {step < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                ))
              )}
            </div>
          )}
          
          <ScrollArea className="flex-1 min-h-0 pr-4">
            {/* Step 1: Basic Info */}
            {createStep === 1 && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>워크리스트 제�� *</Label>
                  <Input 
                    placeholder="예: VDU 분리도 개선 프로젝트"
                    value={newWorklist.title}
                    onChange={e => setNewWorklist(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>설명</Label>
                  <Textarea 
                    placeholder="워크리스트의 목적과 배경을 설명해 주세요"
                    value={newWorklist.description}
                    onChange={e => setNewWorklist(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>관련 Unit</Label>
                    <Select value={newWorklist.unit} onValueChange={v => setNewWorklist(prev => ({ ...prev, unit: v }))}>
                      <SelectTrigger><SelectValue placeholder="Unit 선택" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cross-Unit">Cross-Unit</SelectItem>
                        {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>카테고리</Label>
                    <Select value={newWorklist.category} onValueChange={v => setNewWorklist(prev => ({ ...prev, category: v }))}>
                      <SelectTrigger><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        <SelectItem value="기타">기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>우선순위</Label>
                    <Select value={newWorklist.priority} onValueChange={v => setNewWorklist(prev => ({ ...prev, priority: v as any }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>목표 완료일</Label>
                    <Input 
                      type="date"
                      value={newWorklist.targetDate}
                      onChange={e => setNewWorklist(prev => ({ ...prev, targetDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 - Simple Mode: Ticket Linking */}
            {createStep === 2 && createMode === "simple" && (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">관련 이벤트 연결 (선택)</Label>
                    <p className="text-sm text-muted-foreground mt-1">이 워크리스트와 관련된 기존 이벤트를 연결하고 관계를 설정합니다.</p>
                  </div>
                  {(newWorklist.linkedTickets?.length || 0) >= 2 && (
                    <Button 
                      variant={showCanvasView ? "default" : "outline"} 
                      size="sm"
                      className="gap-2"
                      onClick={() => setShowCanvasView(!showCanvasView)}
                    >
                      <GitBranch className="h-4 w-4" />
                      {showCanvasView ? "리스트 보기" : "관계 캔버스"}
                    </Button>
                  )}
                </div>
                
                {/* Canvas View - 이벤트 관계 설정 */}
                {showCanvasView && (newWorklist.linkedTickets?.length || 0) >= 2 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        노드를 드래그하여 위치를 조정하고, 연결 버튼을 드래그하여 이벤트 간 관계를 설정하세요.
                      </p>
                      {eventRelations.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {eventRelations.length}개 관계 설정됨
                        </Badge>
                      )}
                    </div>
                    <EventRelationCanvas
                      events={newWorklist.linkedTickets?.map(t => ({
                        id: t.id,
                        title: t.title,
                        status: t.status,
                        ticketType: t.ticketType,
                        dueDate: eventDueDates.find(d => d.eventId === t.id)?.dueDate
                      })) || []}
                      relations={eventRelations}
                      onRelationsChange={setEventRelations}
                      onRemoveEvent={(eventId) => handleUnlinkTicket(eventId)}
                      eventDueDates={eventDueDates}
                      onDueDatesChange={setEventDueDates}
                      className="h-[350px]"
                    />
                  </div>
                )}
                
                {/* List View - 기존 리스트 뷰 */}
                {!showCanvasView && (
                  <>
                    {/* Linked tickets list */}
                    {(newWorklist.linkedTickets?.length || 0) > 0 && (
                      <div className="space-y-2">
                        {newWorklist.linkedTickets?.map(ticket => (
                          <div key={ticket.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                            <Link className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{ticket.title}</p>
                              <p className="text-xs text-muted-foreground">#{ticket.id}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">{ticket.ticketType}</Badge>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUnlinkTicket(ticket.id)}>
                              <X className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                
                {/* Search and add tickets */}
                <Card className="border-dashed">
                  <CardContent className="p-4 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="이벤트 검색 (제목 또는 ID)"
                        value={ticketSearchQuery}
                        onChange={e => setTicketSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    {ticketSearchQuery && (
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {availableTickets
                          .filter(t => 
                            t.title.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
                            t.id.toLowerCase().includes(ticketSearchQuery.toLowerCase())
                          )
                          .filter(t => !newWorklist.linkedTickets?.some(lt => lt.id === t.id))
                          .slice(0, 5)
                          .map(ticket => (
                            <div 
                              key={ticket.id}
                              className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                              onClick={() => handleLinkTicket(ticket.id)}
                            >
                              <Plus className="h-4 w-4 text-primary" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{ticket.title}</p>
                                <p className="text-xs text-muted-foreground">#{ticket.id}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">{ticket.ticketType}</Badge>
                            </div>
                          ))
                        }
                        {availableTickets.filter(t => 
                          t.title.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
                          t.id.toLowerCase().includes(ticketSearchQuery.toLowerCase())
                        ).filter(t => !newWorklist.linkedTickets?.some(lt => lt.id === t.id)).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">검색 결과가 없습니다</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <p className="text-xs text-muted-foreground">
                  이벤트 연결 없이 생성해도 됩니다. 워크리스트 상세 페이지에서 언제든 연결할 수 있습니다.
                  {(newWorklist.linkedTickets?.length || 0) >= 2 && " 2개 이상 연결 시 관계 캔버스에서 모-자/전-후 관계를 설정할 수 있습니다."}
                </p>
              </div>
            )}
            
            {/* Step 2 - Advanced Mode: Use Case Selection */}
            {createStep === 2 && createMode === "advanced" && (
              <div className="space-y-4 py-4">
                <Label className="text-base font-medium">워크리스트 유형 선택</Label>
                <p className="text-sm text-muted-foreground">업무 시나리오에 맞는 유형을 선택하세요</p>
                
                <RadioGroup 
                  value={newWorklist.useCase} 
                  onValueChange={v => setNewWorklist(prev => ({ ...prev, useCase: v as WorklistUseCase }))}
                  className="space-y-3"
                >
                  {/* Team Project */}
                  <div className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border-2 transition-colors cursor-pointer",
                    newWorklist.useCase === "team-project" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
                  )} onClick={() => setNewWorklist(prev => ({ ...prev, useCase: "team-project" }))}>
                    <RadioGroupItem value="team-project" id="team-project" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <Label htmlFor="team-project" className="font-medium cursor-pointer">팀 프로젝트</Label>
                        {isTeamLead && <Badge variant="outline" className="text-xs">팀장 권장</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        여러 검토가 다각적/병렬적으로 진행되어야 하는 팀 단위 과제. 마일스톤별로 담당자를 지정하고 병렬 트랙을 관리합니다.
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">병렬 트랙 관리</Badge>
                        <Badge variant="secondary" className="text-xs">팀원 할당</Badge>
                        <Badge variant="secondary" className="text-xs">일정 조율</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Problem Solving */}
                  <div className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border-2 transition-colors cursor-pointer",
                    newWorklist.useCase === "problem-solving" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
                  )} onClick={() => setNewWorklist(prev => ({ ...prev, useCase: "problem-solving" }))}>
                    <RadioGroupItem value="problem-solving" id="problem-solving" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-amber-600" />
                        <Label htmlFor="problem-solving" className="font-medium cursor-pointer">문제 해결</Label>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        고질적인 문제를 해결하기 위한 다양한 시도들을 하나로 묶어 관리합니다. 
                        예: VDU 분리도 저하 문제 - Packing 교체, 케미컬 주입, 운전변수 변경 등
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">문제 정의</Badge>
                        <Badge variant="secondary" className="text-xs">시도 이력</Badge>
                        <Badge variant="secondary" className="text-xs">효과 분석</Badge>
                      </div>
                    </div>
                  </div>

                  {/* TA Worklist */}
                  <div className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border-2 transition-colors cursor-pointer",
                    newWorklist.useCase === "ta-worklist" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
                  )} onClick={() => setNewWorklist(prev => ({ ...prev, useCase: "ta-worklist" }))}>
                    <RadioGroupItem value="ta-worklist" id="ta-worklist" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-green-600" />
                        <Label htmlFor="ta-worklist" className="font-medium cursor-pointer">TA Worklist</Label>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        TA(Turnaround) 기간 중 수행할 작업들을 관리합니다. 검사, 정비, 교체 작업을 일정과 함께 관리합니다.
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">TA 일정 연동</Badge>
                        <Badge variant="secondary" className="text-xs">작업 순서</Badge>
                        <Badge variant="secondary" className="text-xs">자재 연계</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Optimization */}
                  <div className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border-2 transition-colors cursor-pointer",
                    newWorklist.useCase === "optimization" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
                  )} onClick={() => setNewWorklist(prev => ({ ...prev, useCase: "optimization" }))}>
                    <RadioGroupItem value="optimization" id="optimization" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-600" />
                        <Label htmlFor="optimization" className="font-medium cursor-pointer">최적화 과제</Label>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        에너지 절감, 수율 향상 등 최적화 목표를 달성하기 위한 과제를 관리합니다.
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">KPI 목표</Badge>
                        <Badge variant="secondary" className="text-xs">시뮬레이션 연계</Badge>
                        <Badge variant="secondary" className="text-xs">효과 측정</Badge>
                      </div>
                    </div>
                  </div>
                </RadioGroup>

                {/* Additional fields based on use case */}
                {newWorklist.useCase === "problem-solving" && (
                  <div className="space-y-3 pt-4 border-t">
                    <Label>문제 정의</Label>
                    <Textarea
                      placeholder="예: VDU 분리도가 지속적으로 저하되어 HVGO 품질이 Spec을 벗어남"
                      value={newWorklist.problemStatement}
                      onChange={e => setNewWorklist(prev => ({ ...prev, problemStatement: e.target.value }))}
                      className="min-h-16"
                    />
                  </div>
                )}

                {newWorklist.useCase === "team-project" && isTeamLead && (
                  <div className="space-y-3 pt-4 border-t">
                    <Label>참여 팀원</Label>
                    <Input
                      placeholder="팀원 이름 (쉼표로 구분)"
                      value={newWorklist.teamMembers?.join(", ")}
                      onChange={e => setNewWorklist(prev => ({ ...prev, teamMembers: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Milestone Design (Advanced Mode Only) */}
            {createStep === 3 && createMode === "advanced" && (
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-base font-medium">마일스톤 설계</Label>
                  <p className="text-sm text-muted-foreground">워크리스트의 주요 단계를 마일스톤으로 정의하세요. 각 마일스톤에 이벤트를 연결할 수 있습니다.</p>
                </div>

                {/* Existing milestones */}
                {(newWorklist.milestones?.length || 0) > 0 && (
                  <div className="space-y-2">
                    {newWorklist.milestones?.map((ms, idx) => (
                      <div key={ms.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{ms.name}</p>
                          {ms.description && <p className="text-xs text-muted-foreground">{ms.description}</p>}
                        </div>
                        {ms.targetDate && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {ms.targetDate}
                          </Badge>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeMilestone(ms.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new milestone */}
                <Card className="border-dashed">
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">마일스톤 이름</Label>
                        <Input
                          placeholder="예: 원인 분석 완료"
                          value={newMilestone.name}
                          onChange={e => setNewMilestone(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">목표일</Label>
                        <Input
                          type="date"
                          value={newMilestone.targetDate}
                          onChange={e => setNewMilestone(prev => ({ ...prev, targetDate: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">설명 (선택)</Label>
                      <Input
                        placeholder="마일스톤 설명"
                        value={newMilestone.description}
                        onChange={e => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={addMilestone} disabled={!newMilestone.name.trim()} className="w-full gap-2">
                      <Plus className="h-4 w-4" />
                      마일스톤 추가
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick templates */}
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">빠른 템플릿:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                      const templates: Milestone[] = [
                        { id: "t1", name: "문제 정의", status: "not-started", linkedTicketIds: [], order: 1 },
                        { id: "t2", name: "원인 분석", status: "not-started", linkedTicketIds: [], order: 2 },
                        { id: "t3", name: "대안 검토", status: "not-started", linkedTicketIds: [], order: 3 },
                        { id: "t4", name: "실행 및 검증", status: "not-started", linkedTicketIds: [], order: 4 },
                        { id: "t5", name: "효과 확인", status: "not-started", linkedTicketIds: [], order: 5 },
                      ]
                      setNewWorklist(prev => ({ ...prev, milestones: templates }))
                    }}>
                      문제 해결 템플릿
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                      const templates: Milestone[] = [
                        { id: "t1", name: "Scope 정의", status: "not-started", linkedTicketIds: [], order: 1 },
                        { id: "t2", name: "자재 발주", status: "not-started", linkedTicketIds: [], order: 2 },
                        { id: "t3", name: "사전 준비", status: "not-started", linkedTicketIds: [], order: 3 },
                        { id: "t4", name: "TA 실행", status: "not-started", linkedTicketIds: [], order: 4 },
                        { id: "t5", name: "Start-up", status: "not-started", linkedTicketIds: [], order: 5 },
                      ]
                      setNewWorklist(prev => ({ ...prev, milestones: templates }))
                    }}>
                      TA 템플릿
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                      const templates: Milestone[] = [
                        { id: "t1", name: "기회 발굴", status: "not-started", linkedTicketIds: [], order: 1 },
                        { id: "t2", name: "시뮬레이션", status: "not-started", linkedTicketIds: [], order: 2 },
                        { id: "t3", name: "테스트 실행", status: "not-started", linkedTicketIds: [], order: 3 },
                        { id: "t4", name: "효과 검증", status: "not-started", linkedTicketIds: [], order: 4 },
                        { id: "t5", name: "표준화", status: "not-started", linkedTicketIds: [], order: 5 },
                      ]
                      setNewWorklist(prev => ({ ...prev, milestones: templates }))
                    }}>
                      최적화 템플릿
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Dialog Footer - Only show for step 1+ */}
          {createStep >= 1 && (
            <DialogFooter className="border-t pt-4 shrink-0">
              {createStep > 1 && (
                <Button variant="outline" onClick={() => setCreateStep(prev => prev - 1)}>
                  이전
                </Button>
              )}
              <div className="flex-1" />
              {/* Simple Mode: 2 steps (1: basic info, 2: ticket link) */}
              {createMode === "simple" ? (
                createStep < 2 ? (
                  <Button onClick={() => setCreateStep(prev => prev + 1)} disabled={!newWorklist.title?.trim()}>
                    다음
                  </Button>
                ) : (
                  <Button onClick={handleCreateWorklist} disabled={!newWorklist.title?.trim()}>
                    워크리스트 생성
                  </Button>
                )
              ) : (
                /* Advanced Mode: 3 steps */
                createStep < 3 ? (
                  <Button onClick={() => setCreateStep(prev => prev + 1)} disabled={createStep === 1 && !newWorklist.title?.trim()}>
                    다음
                  </Button>
                ) : (
                  <Button onClick={handleCreateWorklist} disabled={!newWorklist.title?.trim()}>
                    워크리스트 생성
                  </Button>
                )
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
