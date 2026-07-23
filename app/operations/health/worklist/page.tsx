"use client"

import React from "react"
import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Wrench,
  Droplets,
  Target,
  Shield,
  ThermometerSun,
  Flame,
  ExternalLink,
  ChevronRight,
  ArrowUpDown,
  Pause,
  Link2,
  Unlink,
  X,
  Ticket,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

// Types
type ActionType = "Operating Change" | "Chemical Injection" | "Cleaning" | "Inspection" | "Replacement" | "TA"
type ActionStatus = "Proposed" | "Approved" | "In Progress" | "Completed" | "Deferred"
type DegLink = { type: string; unit: string; equipment: string }

interface LinkedTicket {
  id: string
  title: string
  ticketType: string
  status: string
  priority: string
}

interface ReviewNote {
  id: string
  author: string
  date: string
  content: string
}

interface WorklistItem {
  id: string
  title: string
  actionType: ActionType
  status: ActionStatus
  priority: "P1" | "P2" | "P3" | "P4"
  degradationLink: DegLink
  linkedTickets: LinkedTicket[]
  owner: string
  dueDate: string
  createdDate: string
  description: string
  reviewNotes: ReviewNote[]
}

const ACTION_ICONS: Record<ActionType, React.ElementType> = {
  "Operating Change": Target,
  "Chemical Injection": Droplets,
  Cleaning: Wrench,
  Inspection: Shield,
  Replacement: ThermometerSun,
  TA: FileText,
}

const STATUS_CONFIG: Record<ActionStatus, { color: string; bg: string; icon: React.ElementType }> = {
  Proposed: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: FileText },
  Approved: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: CheckCircle },
  "In Progress": { color: "text-primary", bg: "bg-primary/10 border-primary/20", icon: Clock },
  Completed: { color: "text-green-700", bg: "bg-green-50 border-green-200", icon: CheckCircle },
  Deferred: { color: "text-slate-500", bg: "bg-slate-50 border-slate-200", icon: Pause },
}

const TICKET_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  Improvement: { label: "개선", color: "bg-blue-100 text-blue-700" },
  Trouble: { label: "트러블", color: "bg-orange-100 text-orange-700" },
  Change: { label: "변경", color: "bg-amber-100 text-amber-700" },
  Analysis: { label: "분석", color: "bg-emerald-100 text-emerald-700" },
  ModelImprovement: { label: "모델개선", color: "bg-violet-100 text-violet-700" },
  ProcessTest: { label: "실공정테스트", color: "bg-teal-100 text-teal-700" },
  Request: { label: "요청", color: "bg-sky-100 text-sky-700" },
}

// Available tickets to link (mock)
const AVAILABLE_TICKETS: LinkedTicket[] = [
  { id: "TKT-2025-0180", title: "E-2001 Fouling 대응 Chemical Cleaning 검토", ticketType: "Improvement", status: "In Progress", priority: "P2" },
  { id: "TKT-2025-0195", title: "HCR Catalyst WABT 상승률 분석", ticketType: "Analysis", status: "Open", priority: "P2" },
  { id: "TKT-2025-0201", title: "HDS Catalyst 교체 사양 검토", ticketType: "Change", status: "Open", priority: "P1" },
  { id: "TKT-2025-0210", title: "VDU Heater Coking 개선", ticketType: "Improvement", status: "In Progress", priority: "P3" },
  { id: "TKT-2025-0215", title: "CDU Overhead Corrosion Monitor", ticketType: "Analysis", status: "Open", priority: "P4" },
  { id: "model-1", title: "HCR RTO 모델 성능 저하 - 재구성 요청", ticketType: "ModelImprovement", status: "Open", priority: "P2" },
  { id: "test-1", title: "HCR Quench 분배 비율 변경 테스트", ticketType: "ProcessTest", status: "In Progress", priority: "P2" },
  { id: "test-2", title: "CDU Desalter Wash Water 비율 최적화 테스트", ticketType: "ProcessTest", status: "Open", priority: "P3" },
]

const INITIAL_ITEMS: WorklistItem[] = [
  {
    id: "WL-001",
    title: "E-2001 Chemical Cleaning 계획",
    actionType: "Chemical Injection",
    status: "Approved",
    priority: "P2",
    degradationLink: { type: "Deposition", unit: "HCR", equipment: "E-2001 Feed/Effluent HX" },
    linkedTickets: [
      { id: "TKT-2025-0180", title: "E-2001 Fouling 대응 Chemical Cleaning 검토", ticketType: "Improvement", status: "In Progress", priority: "P2" },
      { id: "TKT-2025-0210", title: "VDU Heater Coking 개선", ticketType: "Improvement", status: "In Progress", priority: "P3" },
    ],
    owner: "공정팀 김철수",
    dueDate: "2025-04-15",
    createdDate: "2025-01-20",
    description: "HCR Feed/Effluent HX의 Fouling Index 55% 도달. UA 감소율 가속 중. Chemical cleaning 실시하여 열전달 성능 회복 필요.",
    reviewNotes: [
      { id: "rn-1", author: "김철수", date: "2025-01-25", content: "Fouling rate 주간 0.3% 상승 확인. Chemical cleaning vendor 견적 요청 완료." },
      { id: "rn-2", author: "이영희", date: "2025-02-01", content: "정기보전 시 동시 시행 검토. 운전팀 일정 조율 중." },
    ],
  },
  {
    id: "WL-002",
    title: "HCR Catalyst Performance Review",
    actionType: "Operating Change",
    status: "In Progress",
    priority: "P2",
    degradationLink: { type: "Catalyst Performance", unit: "HCR", equipment: "HC-R1/R2 Catalyst" },
    linkedTickets: [
      { id: "TKT-2025-0195", title: "HCR Catalyst WABT 상승률 분석", ticketType: "Analysis", status: "Open", priority: "P2" },
      { id: "model-1", title: "HCR RTO 모델 성능 저하 - 재구성 요청", ticketType: "ModelImprovement", status: "Open", priority: "P2" },
      { id: "test-1", title: "HCR Quench 분배 비율 변경 테스트", ticketType: "ProcessTest", status: "In Progress", priority: "P2" },
    ],
    owner: "공정팀 이영희",
    dueDate: "2025-03-15",
    createdDate: "2025-02-01",
    description: "WABT 상승 가속 감지. Feed Ni+V 증가와의 상관관계 확인 후 temperature profile 조정 방안 검토.",
    reviewNotes: [
      { id: "rn-3", author: "이영희", date: "2025-02-05", content: "Quench 분배 비율 테스트 진행 중. 2주 결과 확인 후 판단 예정." },
    ],
  },
  {
    id: "WL-003",
    title: "HDS Catalyst 교체 TA 등록",
    actionType: "TA",
    status: "Proposed",
    priority: "P1",
    degradationLink: { type: "Catalyst Performance", unit: "HDS", equipment: "HDS Catalyst Bed" },
    linkedTickets: [
      { id: "TKT-2025-0201", title: "HDS Catalyst 교체 사양 검토", ticketType: "Change", status: "Open", priority: "P1" },
    ],
    owner: "공정팀 박안전",
    dueDate: "2025-06-01",
    createdDate: "2025-02-05",
    description: "HDS Catalyst Activity Index 82% 도달 (ETA 92일). 다음 TA 시 교체 필수. Catalyst 발주 및 TA scope에 포함 검토.",
    reviewNotes: [],
  },
  {
    id: "WL-004",
    title: "VDU Heater Decoking 계획 수립",
    actionType: "Cleaning",
    status: "Proposed",
    priority: "P3",
    degradationLink: { type: "Deposition", unit: "VDU", equipment: "VDU Heater Tubes" },
    linkedTickets: [],
    owner: "정비팀 최정비",
    dueDate: "2025-09-01",
    createdDate: "2025-01-15",
    description: "VDU Heater tube skin temp 서서히 상승 중. Coking Index 45%. ETA까지 545일 여유 있으나 다음 TA 시 decoking 계획 수립 필요.",
    reviewNotes: [],
  },
  {
    id: "WL-005",
    title: "CDU Overhead UT Inspection 계획",
    actionType: "Inspection",
    status: "Deferred",
    priority: "P4",
    degradationLink: { type: "Integrity Risk", unit: "CDU", equipment: "CDU Overhead System" },
    linkedTickets: [
      { id: "TKT-2025-0215", title: "CDU Overhead Corrosion Monitor", ticketType: "Analysis", status: "Open", priority: "P4" },
    ],
    owner: "설비팀 정설비",
    dueDate: "2025-12-01",
    createdDate: "2024-12-10",
    description: "Corrosion Driving Force Index 안정적이나 장기 모니터링 차원에서 UT 검사 수행. 현재 Deferred 상태 (우선순위 낮음).",
    reviewNotes: [],
  },
  {
    id: "WL-006",
    title: "E-2001 Operating Adjustment (유량 조정)",
    actionType: "Operating Change",
    status: "Completed",
    priority: "P3",
    degradationLink: { type: "Deposition", unit: "HCR", equipment: "E-2001 Feed/Effluent HX" },
    linkedTickets: [
      { id: "TKT-2025-0180", title: "E-2001 Fouling 대응 Chemical Cleaning 검토", ticketType: "Improvement", status: "In Progress", priority: "P2" },
    ],
    owner: "공정팀 김철수",
    dueDate: "2025-01-10",
    createdDate: "2024-12-20",
    description: "Fouling 가속 대응으로 feed rate 5% 감소 운전. Fouling rate 안정화 확인 후 종료.",
    reviewNotes: [
      { id: "rn-4", author: "김철수", date: "2025-01-10", content: "Feed rate 감소 후 Fouling rate 안정화 확인. 운전 복귀 완료." },
    ],
  },
]

export default function WorklistPage() {
  const [items, setItems] = useState<WorklistItem[]>(INITIAL_ITEMS)
  const [filterStatus, setFilterStatus] = useState<"all" | ActionStatus>("all")
  const [filterType, setFilterType] = useState<"all" | ActionType>("all")
  const [sortBy, setSortBy] = useState<"due" | "priority" | "created">("due")
  const [selectedItem, setSelectedItem] = useState<WorklistItem | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkTargetItemId, setLinkTargetItemId] = useState<string | null>(null)
  const [linkSearchQuery, setLinkSearchQuery] = useState("")
  const [newReviewNote, setNewReviewNote] = useState("")

  // Create form state
  const [newTitle, setNewTitle] = useState("")
  const [newType, setNewType] = useState<ActionType>("Operating Change")
  const [newDesc, setNewDesc] = useState("")
  const [newOwner, setNewOwner] = useState("")
  const [newDue, setNewDue] = useState("")
  const [newPriority, setNewPriority] = useState<"P1" | "P2" | "P3" | "P4">("P3")

  const filteredItems = items
    .filter((i) => filterStatus === "all" || i.status === filterStatus)
    .filter((i) => filterType === "all" || i.actionType === filterType)
    .sort((a, b) => {
      if (sortBy === "priority") return a.priority.localeCompare(b.priority)
      if (sortBy === "created") return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })

  const statusCounts: Record<string, number> = {}
  for (const item of items) {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1
  }

  const handleStatusChange = (id: string, newStatus: ActionStatus) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: newStatus } : i))
    if (selectedItem?.id === id) {
      setSelectedItem({ ...selectedItem, status: newStatus })
    }
  }

  const handleLinkTicket = (itemId: string, ticket: LinkedTicket) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId && !i.linkedTickets.find((t) => t.id === ticket.id)
          ? { ...i, linkedTickets: [...i.linkedTickets, ticket] }
          : i
      )
    )
    if (selectedItem?.id === itemId) {
      setSelectedItem((prev) =>
        prev && !prev.linkedTickets.find((t) => t.id === ticket.id)
          ? { ...prev, linkedTickets: [...prev.linkedTickets, ticket] }
          : prev
      )
    }
  }

  const handleUnlinkTicket = (itemId: string, ticketId: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, linkedTickets: i.linkedTickets.filter((t) => t.id !== ticketId) } : i
      )
    )
    if (selectedItem?.id === itemId) {
      setSelectedItem((prev) =>
        prev ? { ...prev, linkedTickets: prev.linkedTickets.filter((t) => t.id !== ticketId) } : prev
      )
    }
  }

  const handleAddReviewNote = (itemId: string) => {
    if (!newReviewNote.trim()) return
    const note: ReviewNote = {
      id: `rn-${Date.now()}`,
      author: "김철수",
      date: new Date().toISOString().split("T")[0],
      content: newReviewNote.trim(),
    }
    setItems((prev) =>
      prev.map((i) => i.id === itemId ? { ...i, reviewNotes: [...i.reviewNotes, note] } : i)
    )
    if (selectedItem?.id === itemId) {
      setSelectedItem((prev) => prev ? { ...prev, reviewNotes: [...prev.reviewNotes, note] } : prev)
    }
    setNewReviewNote("")
  }

  const handleCreate = () => {
    const newItem: WorklistItem = {
      id: `WL-${String(items.length + 1).padStart(3, "0")}`,
      title: newTitle,
      actionType: newType,
      status: "Proposed",
      priority: newPriority,
      degradationLink: { type: "-", unit: "-", equipment: "-" },
      linkedTickets: [],
      owner: newOwner,
      dueDate: newDue,
      createdDate: new Date().toISOString().split("T")[0],
      description: newDesc,
      reviewNotes: [],
    }
    setItems((prev) => [newItem, ...prev])
    setShowCreateDialog(false)
    setNewTitle("")
    setNewDesc("")
    setNewOwner("")
    setNewDue("")
  }

  const availableToLink = AVAILABLE_TICKETS.filter((t) => {
    const item = items.find((i) => i.id === linkTargetItemId)
    if (!item) return true
    return !item.linkedTickets.find((lt) => lt.id === t.id)
  }).filter((t) =>
    !linkSearchQuery || t.title.toLowerCase().includes(linkSearchQuery.toLowerCase()) || t.id.toLowerCase().includes(linkSearchQuery.toLowerCase())
  )

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Long-Term Action Worklist</h1>
            <p className="text-muted-foreground mt-1">장기 열화 대응 업무 항목 관리 - 복수의 이벤트과 검토 내용 연결</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            항목 추가
          </Button>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-5 gap-3">
          {(["Proposed", "Approved", "In Progress", "Completed", "Deferred"] as ActionStatus[]).map((status) => {
            const cfg = STATUS_CONFIG[status]
            const count = statusCounts[status] || 0
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(filterStatus === status ? "all" : status)}
                className={cn(
                  "p-3 border rounded-lg text-center transition-all",
                  filterStatus === status ? "ring-2 ring-primary" : "hover:bg-muted/30",
                  cfg.bg
                )}
              >
                <p className={cn("text-2xl font-bold", cfg.color)}>{count}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{status}</p>
              </button>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Action Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 유형</SelectItem>
              <SelectItem value="Operating Change">Operating Change</SelectItem>
              <SelectItem value="Chemical Injection">Chemical Injection</SelectItem>
              <SelectItem value="Cleaning">Cleaning</SelectItem>
              <SelectItem value="Inspection">Inspection</SelectItem>
              <SelectItem value="Replacement">Replacement</SelectItem>
              <SelectItem value="TA">TA</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-40">
              <ArrowUpDown className="h-3.5 w-3.5 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="due">기한 순</SelectItem>
              <SelectItem value="priority">우선순위 순</SelectItem>
              <SelectItem value="created">생성일 순</SelectItem>
            </SelectContent>
          </Select>
          {filterStatus !== "all" && (
            <Button variant="ghost" size="sm" onClick={() => setFilterStatus("all")} className="text-xs bg-transparent">
              필터 초기화
            </Button>
          )}
          <span className="text-sm text-muted-foreground ml-auto">{filteredItems.length}건</span>
        </div>

        {/* Worklist Table */}
        <Card>
          <CardContent className="pt-0 px-0">
            <div className="border rounded-lg overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[50px_1fr_130px_100px_70px_120px_100px_140px_40px] bg-muted/50 px-4 py-2.5 text-xs font-medium text-muted-foreground border-b">
                <span>ID</span>
                <span>Title</span>
                <span>Action Type</span>
                <span>Status</span>
                <span>P</span>
                <span>Owner</span>
                <span>Due Date</span>
                <span>연결 이벤트</span>
                <span />
              </div>
              {filteredItems.map((item) => {
                const stCfg = STATUS_CONFIG[item.status]
                const Icon = ACTION_ICONS[item.actionType]
                const isOverdue = new Date(item.dueDate) < new Date() && item.status !== "Completed"
                return (
                  <div
                    key={item.id}
                    onClick={() => { setSelectedItem(item); setShowDetailDialog(true) }}
                    className={cn(
                      "grid grid-cols-[50px_1fr_130px_100px_70px_120px_100px_140px_40px] px-4 py-3 items-center text-sm border-b last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer",
                      isOverdue && "bg-red-50/30"
                    )}
                  >
                    <span className="font-mono text-xs text-muted-foreground">{item.id.split("-")[1]}</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium truncate">{item.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.actionType}</span>
                    <Badge variant="outline" className={cn("text-xs w-fit", stCfg.bg, stCfg.color)}>
                      {item.status}
                    </Badge>
                    <Badge variant={item.priority === "P1" ? "destructive" : "secondary"} className="text-xs w-fit">
                      {item.priority}
                    </Badge>
                    <span className="text-xs truncate">{item.owner}</span>
                    <span className={cn("text-xs font-mono", isOverdue ? "text-red-600 font-medium" : "text-muted-foreground")}>
                      {item.dueDate}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.linkedTickets.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <Ticket className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium text-primary">{item.linkedTickets.length}건</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                )
              })}
              {filteredItems.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">해당 조건의 항목이 없습니다.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedItem && (() => {
            const stCfg = STATUS_CONFIG[selectedItem.status]
            const Icon = ACTION_ICONS[selectedItem.actionType]
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {selectedItem.title}
                  </DialogTitle>
                  <DialogDescription>{selectedItem.id} | {selectedItem.actionType}</DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="overview" className="mt-2">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="overview">개요</TabsTrigger>
                    <TabsTrigger value="tickets" className="gap-1.5">
                      연결 이벤트
                      {selectedItem.linkedTickets.length > 0 && (
                        <Badge variant="secondary" className="text-xs h-5 min-w-5 px-1">{selectedItem.linkedTickets.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="review" className="gap-1.5">
                      검토 이력
                      {selectedItem.reviewNotes.length > 0 && (
                        <Badge variant="secondary" className="text-xs h-5 min-w-5 px-1">{selectedItem.reviewNotes.length}</Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Status</span>
                        <div><Badge variant="outline" className={cn("text-xs", stCfg.bg, stCfg.color)}>{selectedItem.status}</Badge></div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Priority</span>
                        <div><Badge variant={selectedItem.priority === "P1" ? "destructive" : "secondary"} className="text-xs">{selectedItem.priority}</Badge></div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Due Date</span>
                        <p className="text-sm font-medium">{selectedItem.dueDate}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Description</span>
                      <p className="text-sm p-3 bg-muted/30 rounded-lg">{selectedItem.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Owner</span>
                        <p className="text-sm">{selectedItem.owner}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Created</span>
                        <p className="text-sm">{selectedItem.createdDate}</p>
                      </div>
                    </div>

                    {/* Degradation Link */}
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">관련 Degradation</span>
                      <Link
                        href={`/operations/health/degradation?type=${encodeURIComponent(selectedItem.degradationLink.type)}&unit=${selectedItem.degradationLink.unit}`}
                        className="flex items-center gap-2 p-2.5 border rounded-lg hover:bg-muted/30 transition-colors"
                        onClick={() => setShowDetailDialog(false)}
                      >
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">{selectedItem.degradationLink.unit} - {selectedItem.degradationLink.equipment}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                      </Link>
                    </div>

                    {/* Status Change */}
                    <div className="space-y-1.5 pt-2 border-t">
                      <span className="text-xs text-muted-foreground font-medium">상태 변경</span>
                      <div className="flex gap-2 flex-wrap">
                        {(["Proposed", "Approved", "In Progress", "Completed", "Deferred"] as ActionStatus[]).map((st) => (
                          <Button
                            key={st}
                            size="sm"
                            variant={selectedItem.status === st ? "default" : "outline"}
                            className={cn("text-xs", selectedItem.status !== st && "bg-transparent")}
                            onClick={() => handleStatusChange(selectedItem.id, st)}
                          >
                            {st}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Linked Tickets Tab */}
                  <TabsContent value="tickets" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">연결된 이벤트 ({selectedItem.linkedTickets.length})</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-transparent"
                        onClick={() => {
                          setLinkTargetItemId(selectedItem.id)
                          setLinkSearchQuery("")
                          setShowLinkDialog(true)
                        }}
                      >
                        <Link2 className="h-3.5 w-3.5 mr-1.5" />
                        이벤트 연결
                      </Button>
                    </div>

                    {selectedItem.linkedTickets.length === 0 ? (
                      <div className="p-8 text-center border rounded-lg border-dashed">
                        <Ticket className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">연결된 이벤트이 없습니다</p>
                        <p className="text-xs text-muted-foreground mt-1">이벤트을 연결하여 검토 진행 상황을 추적하세요</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedItem.linkedTickets.map((ticket) => {
                          const typeInfo = TICKET_TYPE_LABELS[ticket.ticketType] || { label: ticket.ticketType, color: "bg-muted text-muted-foreground" }
                          return (
                            <div key={ticket.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors group">
                              <Ticket className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                                  <Badge variant="secondary" className={cn("text-xs", typeInfo.color)}>{typeInfo.label}</Badge>
                                  <Badge variant={ticket.priority === "P1" ? "destructive" : "secondary"} className="text-xs">{ticket.priority}</Badge>
                                </div>
                                <p className="text-sm font-medium mt-0.5 truncate">{ticket.title}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Link
                                  href={`/tickets/${ticket.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 rounded hover:bg-muted transition-colors"
                                >
                                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                </Link>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleUnlinkTicket(selectedItem.id, ticket.id)
                                  }}
                                  className="p-1.5 rounded hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Unlink className="h-3.5 w-3.5 text-red-500" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </TabsContent>

                  {/* Review Notes Tab */}
                  <TabsContent value="review" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      {selectedItem.reviewNotes.length === 0 && (
                        <div className="p-6 text-center border rounded-lg border-dashed">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                          <p className="text-sm text-muted-foreground">검토 내용이 없습니다</p>
                        </div>
                      )}
                      {selectedItem.reviewNotes.map((note) => (
                        <div key={note.id} className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-medium">{note.author}</span>
                            <span className="text-xs text-muted-foreground">{note.date}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{note.content}</p>
                        </div>
                      ))}
                    </div>

                    {/* Add new review note */}
                    <div className="pt-3 border-t space-y-2">
                      <Label className="text-xs text-muted-foreground">검토 내용 추가</Label>
                      <Textarea
                        value={newReviewNote}
                        onChange={(e) => setNewReviewNote(e.target.value)}
                        placeholder="검토 내용을 입력하세요..."
                        className="min-h-20"
                      />
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          disabled={!newReviewNote.trim()}
                          onClick={() => handleAddReviewNote(selectedItem.id)}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          추가
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter className="mt-4 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowDetailDialog(false)} className="bg-transparent">닫기</Button>
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Link Ticket Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-lg max-h-[70vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              이벤트 연결
            </DialogTitle>
            <DialogDescription>이 업무 항목에 연결할 이벤트을 선택하세요. 복수 선택 가능합니다.</DialogDescription>
          </DialogHeader>

          <Input
            placeholder="이벤트 ID 또는 제목으로 검색..."
            value={linkSearchQuery}
            onChange={(e) => setLinkSearchQuery(e.target.value)}
            className="mt-2"
          />

          <div className="space-y-2 max-h-80 overflow-y-auto mt-2">
            {availableToLink.map((ticket) => {
              const typeInfo = TICKET_TYPE_LABELS[ticket.ticketType] || { label: ticket.ticketType, color: "bg-muted text-muted-foreground" }
              return (
                <button
                  key={ticket.id}
                  className="w-full text-left p-3 border rounded-lg hover:bg-muted/30 transition-colors flex items-center gap-3"
                  onClick={() => {
                    if (linkTargetItemId) {
                      handleLinkTicket(linkTargetItemId, ticket)
                    }
                  }}
                >
                  <Ticket className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                      <Badge variant="secondary" className={cn("text-xs", typeInfo.color)}>{typeInfo.label}</Badge>
                    </div>
                    <p className="text-sm truncate mt-0.5">{ticket.title}</p>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              )
            })}
            {availableToLink.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">
                <p className="text-sm">연결 가능한 이벤트이 없습니다</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)} className="bg-transparent">닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Worklist 항목 추가</DialogTitle>
            <DialogDescription>Long-Term Health 관련 중장기 업무 항목을 추가합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Title *</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="업무 제목" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Action Type</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as ActionType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operating Change">Operating Change</SelectItem>
                    <SelectItem value="Chemical Injection">Chemical Injection</SelectItem>
                    <SelectItem value="Cleaning">Cleaning</SelectItem>
                    <SelectItem value="Inspection">Inspection</SelectItem>
                    <SelectItem value="Replacement">Replacement</SelectItem>
                    <SelectItem value="TA">TA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Priority</Label>
                <Select value={newPriority} onValueChange={(v) => setNewPriority(v as typeof newPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P1">P1 - 긴급</SelectItem>
                    <SelectItem value="P2">P2 - 높음</SelectItem>
                    <SelectItem value="P3">P3 - 보통</SelectItem>
                    <SelectItem value="P4">P4 - 낮음</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Description *</Label>
              <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="업무 상세 내용..." className="min-h-24" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Owner</Label>
                <Input value={newOwner} onChange={(e) => setNewOwner(e.target.value)} placeholder="담당자" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Due Date *</Label>
                <Input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="bg-transparent">취소</Button>
            <Button onClick={handleCreate} disabled={!newTitle.trim() || !newDesc.trim() || !newDue}>
              <Plus className="h-4 w-4 mr-2" />
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
