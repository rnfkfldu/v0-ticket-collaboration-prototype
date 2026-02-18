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
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  Users,
  ChevronRight,
  Sparkles,
  Mail,
  AlertTriangle,
  RotateCcw,
  Ticket,
  ExternalLink,
  GripVertical,
  Pencil,
  CircleDot,
  CircleCheck,
  ArrowRight,
  MessageSquare,
  Mic,
  MicOff,
  X,
  Send,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { KpiDimensionFilter, DEFAULT_KPI_DIMENSIONS, type KpiDimensions } from "@/components/kpi-dimension-filter"

// Types
type MeetingType = "weekly" | "monthly"
type MeetingStatus = "scheduled" | "in-progress" | "completed"
type AgendaSource = "ticket" | "manual" | "carryover"
type AgendaStatus = "pending" | "discussed" | "follow-up" | "resolved"

interface AgendaMeetingNote {
  id: string
  timestamp: string
  content: string
  author: string
  type: "text" | "voice-transcript"
}

interface AgendaItem {
  id: string
  title: string
  source: AgendaSource
  ticketId?: string
  ticketType?: string
  description: string
  presenter: string
  status: AgendaStatus
  decision?: string
  followUpNote?: string
  isCarriedOver?: boolean
  originalMeetingId?: string
  meetingNotes?: AgendaMeetingNote[]
}

interface Recipient {
  name: string
  email: string
  role: string
}

interface Meeting {
  id: string
  type: MeetingType
  title: string
  date: string
  time: string
  status: MeetingStatus
  attendees: string[]
  recipients: Recipient[]
  agendas: AgendaItem[]
  aiSummary?: string
  emailSent?: boolean
}

const MEETING_TYPE_CONFIG: Record<MeetingType, { label: string; color: string; bg: string }> = {
  weekly: { label: "주간실무회의", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  monthly: { label: "월간현안보고", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
}

const AGENDA_STATUS_CONFIG: Record<AgendaStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "대기", icon: CircleDot, color: "text-muted-foreground" },
  discussed: { label: "논의완료", icon: CheckCircle, color: "text-blue-600" },
  "follow-up": { label: "Follow-Up", icon: RotateCcw, color: "text-amber-600" },
  resolved: { label: "해결", icon: CircleCheck, color: "text-green-600" },
}

const SOURCE_LABELS: Record<AgendaSource, { label: string; color: string }> = {
  ticket: { label: "티켓", color: "bg-primary/10 text-primary" },
  manual: { label: "수동추가", color: "bg-muted text-muted-foreground" },
  carryover: { label: "캐리오버", color: "bg-amber-100 text-amber-700" },
}

const TICKET_TYPE_LABELS: Record<string, string> = {
  Improvement: "개선",
  Trouble: "트러블",
  Change: "변경",
  Analysis: "분석",
  ModelImprovement: "모델개선",
  ProcessTest: "실공정테스트",
}

// Mock ticket pool for adding agenda from tickets
const TICKET_POOL = [
  { id: "TKT-2025-0180", title: "E-2001 Fouling 대응 Chemical Cleaning 검토", ticketType: "Improvement", priority: "P2" },
  { id: "TKT-2025-0195", title: "HCR Catalyst WABT 상승률 분석", ticketType: "Analysis", priority: "P2" },
  { id: "TKT-2025-0201", title: "HDS Catalyst 교체 사양 검토", ticketType: "Change", priority: "P1" },
  { id: "model-1", title: "HCR RTO 모델 성능 저하 - 재구성 요청", ticketType: "ModelImprovement", priority: "P2" },
  { id: "test-1", title: "HCR Quench 분배 비율 변경 테스트", ticketType: "ProcessTest", priority: "P2" },
  { id: "test-2", title: "CDU Desalter Wash Water 비율 최적화 테스트", ticketType: "ProcessTest", priority: "P3" },
]

const INITIAL_MEETINGS: Meeting[] = [
  {
    id: "MTG-W-20250210",
    type: "weekly",
    title: "2025년 2월 2주차 주간실무회의",
    date: "2025-02-10",
    time: "09:00",
    status: "completed",
    attendees: ["김철수", "이영희", "박안전", "최정비", "정설비"],
    recipients: [
      { name: "기술팀장 장기술", email: "jang@company.com", role: "기술팀장" },
      { name: "공장장 박공장", email: "park@company.com", role: "공장장" },
      { name: "김철수", email: "kim@company.com", role: "기술팀" },
      { name: "이영희", email: "lee@company.com", role: "기술팀" },
    ],
    aiSummary: `## 주간실무회의 요약 (2025.02.10)\n\n### 주요 논의사항\n1. **HCR E-2001 Fouling 대응**: Chemical Cleaning vendor 견적 접수 완료. 3월 정기보전 시 시행 방향으로 합의. 비용 약 1.2억원 예상.\n2. **HCR Catalyst WABT 상승**: Quench 분배 비율 변경 테스트 1주차 결과 공유. 2nd Bed 입구 온도 2.8도 하락 확인. 2주차까지 관찰 후 최종 판단 예정.\n3. **HDS Catalyst 교체**: Activity Index 82% 도달. 6월 TA scope에 포함 확정. Catalyst 발주는 2월 말까지 완료 목표.\n\n### Follow-Up 사항\n- HCR Quench 테스트 2주차 결과 확인 (담당: 이영희, 기한: 2/17)\n- Chemical Cleaning 시행 계획서 작성 (담당: 김철수, 기한: 2/20)\n- HDS Catalyst 발주 품의 진행 (담당: 박안전, 기한: 2/28)`,
    emailSent: true,
    agendas: [
      {
        id: "ag-1",
        title: "E-2001 Fouling 대응 Chemical Cleaning 검토",
        source: "ticket",
        ticketId: "TKT-2025-0180",
        ticketType: "Improvement",
        description: "Chemical Cleaning vendor 견적 검토 및 시행 일정 논의",
        presenter: "김철수",
        status: "follow-up",
        decision: "3월 정기보전 시 시행. 비용 1.2억원 예상.",
        followUpNote: "Chemical Cleaning 시행 계획서 작성 (담당: 김철수, 기한: 2/20)",
      },
      {
        id: "ag-2",
        title: "HCR Catalyst WABT 상승 대응 (Quench 테스트 중간 결과)",
        source: "ticket",
        ticketId: "test-1",
        ticketType: "ProcessTest",
        description: "Quench 분배 비율 변경 테스트 1주차 결과 공유",
        presenter: "이영희",
        status: "follow-up",
        decision: "2nd Bed 입구 온도 2.8도 하락 확인. 2주차까지 관찰 필요.",
        followUpNote: "2주차 결과 확인 (담당: 이영희, 기한: 2/17)",
      },
      {
        id: "ag-3",
        title: "HDS Catalyst 교체 TA 등록 건",
        source: "ticket",
        ticketId: "TKT-2025-0201",
        ticketType: "Change",
        description: "Activity Index 82% 도달. 6월 TA scope 포함 여부 확정",
        presenter: "박안전",
        status: "follow-up",
        decision: "6월 TA scope에 포함 확정.",
        followUpNote: "Catalyst 발주 품의 진행 (담당: 박안전, 기한: 2/28)",
      },
    ],
  },
  {
    id: "MTG-W-20250217",
    type: "weekly",
    title: "2025년 2월 3주차 주간실무회의",
    date: "2025-02-17",
    time: "09:00",
    status: "scheduled",
    attendees: ["김철수", "이영희", "박안전", "최정비", "정설비"],
    recipients: [
      { name: "기술팀장 장기술", email: "jang@company.com", role: "기술팀장" },
      { name: "공장장 박공장", email: "park@company.com", role: "공장장" },
    ],
    agendas: [
      {
        id: "ag-4",
        title: "HCR Quench 테스트 2주차 결과 확인",
        source: "carryover",
        ticketId: "test-1",
        ticketType: "ProcessTest",
        description: "전주 Follow-Up: 2주차 결과 확인 (담당: 이영희)",
        presenter: "이영희",
        status: "pending",
        isCarriedOver: true,
        originalMeetingId: "MTG-W-20250210",
      },
      {
        id: "ag-5",
        title: "Chemical Cleaning 시행 계획서 리뷰",
        source: "carryover",
        ticketId: "TKT-2025-0180",
        ticketType: "Improvement",
        description: "전주 Follow-Up: 시행 계획서 작성 결과 리뷰 (담당: 김철수)",
        presenter: "김철수",
        status: "pending",
        isCarriedOver: true,
        originalMeetingId: "MTG-W-20250210",
      },
      {
        id: "ag-6",
        title: "RTO 모델 재구성 진행 현황",
        source: "ticket",
        ticketId: "model-1",
        ticketType: "ModelImprovement",
        description: "DX Modeling팀과 협의 결과 및 재구성 일정 공유",
        presenter: "김철수",
        status: "pending",
      },
    ],
  },
  {
    id: "MTG-M-20250131",
    type: "monthly",
    title: "2025년 1월 월간현안보고",
    date: "2025-01-31",
    time: "14:00",
    status: "completed",
    attendees: ["김철수", "이영희", "박안전", "최정비", "정설비", "기술팀장 장기술"],
    recipients: [
      { name: "기술팀장 장기술", email: "jang@company.com", role: "기술팀장" },
      { name: "공장장 박공장", email: "park@company.com", role: "공장장" },
      { name: "생산팀장", email: "production@company.com", role: "생산팀장" },
    ],
    aiSummary: `## 월간현안보고 요약 (2025.01.31)\n\n### 주요 현안\n1. HCR 계열 Fouling 가속 - Chemical Cleaning 대응 계획 수립 중\n2. HDS Catalyst 교체 사전 준비 - 6월 TA 연계\n3. CDU Overhead Corrosion 모니터링 정상 유지\n\n### 의사결정 사항\n- HCR Chemical Cleaning 예산 확보 승인\n- HDS Catalyst 발주 선행 승인`,
    emailSent: true,
    agendas: [
      {
        id: "ag-m1",
        title: "1월 장기건전성 종합 현황",
        source: "manual",
        description: "월간 Long-Term Health 전체 현황 브리핑",
        presenter: "김철수",
        status: "discussed",
        decision: "전반적으로 안정. HCR Fouling 가속 건은 중점 관리 대상으로 지정.",
      },
      {
        id: "ag-m2",
        title: "HCR Chemical Cleaning 예산 확보",
        source: "ticket",
        ticketId: "TKT-2025-0180",
        ticketType: "Improvement",
        description: "Chemical Cleaning 예산 1.2억원 확보 요청",
        presenter: "김철수",
        status: "resolved",
        decision: "예산 확보 승인.",
      },
    ],
  },
]

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>(INITIAL_MEETINGS)
  const [filterType, setFilterType] = useState<"all" | MeetingType>("all")
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [showDetailView, setShowDetailView] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAddAgendaDialog, setShowAddAgendaDialog] = useState(false)
  const [kpiDimensions, setKpiDimensions] = useState<KpiDimensions>(DEFAULT_KPI_DIMENSIONS)
  const [showAiSummaryDialog, setShowAiSummaryDialog] = useState(false)
  const [agendaMode, setAgendaMode] = useState<"ticket" | "manual">("ticket")
  const [agendaSearch, setAgendaSearch] = useState("")
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  
  // Agenda detail popup (ticket view + notes)
  const [activeAgendaId, setActiveAgendaId] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [noteInput, setNoteInput] = useState("")
  
  // Recipient management
  const [showRecipientDialog, setShowRecipientDialog] = useState(false)
  const [newRecipientName, setNewRecipientName] = useState("")
  const [newRecipientEmail, setNewRecipientEmail] = useState("")
  const [newRecipientRole, setNewRecipientRole] = useState("")

  // Manual agenda form
  const [manualTitle, setManualTitle] = useState("")
  const [manualDesc, setManualDesc] = useState("")
  const [manualPresenter, setManualPresenter] = useState("")

  // Create meeting form
  const [newMeetingType, setNewMeetingType] = useState<MeetingType>("weekly")
  const [newMeetingDate, setNewMeetingDate] = useState("")
  const [newMeetingTime, setNewMeetingTime] = useState("09:00")
  const [newMeetingTitle, setNewMeetingTitle] = useState("")

  const filteredMeetings = meetings
    .filter((m) => filterType === "all" || m.type === filterType)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const handleAddTicketAgenda = (meetingId: string, ticket: typeof TICKET_POOL[0]) => {
    const newAgenda: AgendaItem = {
      id: `ag-${Date.now()}`,
      title: ticket.title,
      source: "ticket",
      ticketId: ticket.id,
      ticketType: ticket.ticketType,
      description: "",
      presenter: "",
      status: "pending",
    }
    setMeetings((prev) =>
      prev.map((m) => m.id === meetingId ? { ...m, agendas: [...m.agendas, newAgenda] } : m)
    )
    if (selectedMeeting?.id === meetingId) {
      setSelectedMeeting((prev) => prev ? { ...prev, agendas: [...prev.agendas, newAgenda] } : prev)
    }
  }

  const handleAddManualAgenda = (meetingId: string) => {
    if (!manualTitle.trim()) return
    const newAgenda: AgendaItem = {
      id: `ag-${Date.now()}`,
      title: manualTitle,
      source: "manual",
      description: manualDesc,
      presenter: manualPresenter,
      status: "pending",
    }
    setMeetings((prev) =>
      prev.map((m) => m.id === meetingId ? { ...m, agendas: [...m.agendas, newAgenda] } : m)
    )
    if (selectedMeeting?.id === meetingId) {
      setSelectedMeeting((prev) => prev ? { ...prev, agendas: [...prev.agendas, newAgenda] } : prev)
    }
    setManualTitle("")
    setManualDesc("")
    setManualPresenter("")
    setShowAddAgendaDialog(false)
  }

  const handleAgendaStatusChange = (meetingId: string, agendaId: string, status: AgendaStatus) => {
    const updateAgendas = (agendas: AgendaItem[]) =>
      agendas.map((a) => a.id === agendaId ? { ...a, status } : a)
    setMeetings((prev) =>
      prev.map((m) => m.id === meetingId ? { ...m, agendas: updateAgendas(m.agendas) } : m)
    )
    if (selectedMeeting?.id === meetingId) {
      setSelectedMeeting((prev) => prev ? { ...prev, agendas: updateAgendas(prev.agendas) } : prev)
    }
  }

  const handleCloseMeeting = (meetingId: string) => {
    // 1. Mark meeting as completed
    // 2. Carry over follow-up items to next scheduled meeting
    const meeting = meetings.find((m) => m.id === meetingId)
    if (!meeting) return

    const followUps = meeting.agendas.filter((a) => a.status === "follow-up")

    // Find next scheduled meeting of same type
    const nextMeeting = meetings
      .filter((m) => m.type === meeting.type && m.status === "scheduled" && m.id !== meetingId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

    const carryoverAgendas: AgendaItem[] = followUps.map((fu) => ({
      id: `ag-co-${Date.now()}-${fu.id}`,
      title: fu.title,
      source: "carryover" as AgendaSource,
      ticketId: fu.ticketId,
      ticketType: fu.ticketType,
      description: `전주 Follow-Up: ${fu.followUpNote || fu.decision || ""}`,
      presenter: fu.presenter,
      status: "pending" as AgendaStatus,
      isCarriedOver: true,
      originalMeetingId: meetingId,
    }))

    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id === meetingId) return { ...m, status: "completed" as MeetingStatus }
        if (nextMeeting && m.id === nextMeeting.id) {
          return { ...m, agendas: [...carryoverAgendas, ...m.agendas] }
        }
        return m
      })
    )

    // Generate AI summary
    setIsGeneratingSummary(true)
    setTimeout(() => {
      const agendaSummary = meeting.agendas.map((a, i) =>
        `${i + 1}. **${a.title}**: ${a.decision || a.description || "논의 진행"}`
      ).join("\n")
      const followUpSummary = followUps.map((fu) =>
        `- ${fu.followUpNote || fu.title} (담당: ${fu.presenter})`
      ).join("\n")

      const summary = `## ${meeting.title} 요약\n\n### 주요 논의사항\n${agendaSummary}\n\n### Follow-Up 사항\n${followUpSummary || "- 없음"}\n\n### 참석자\n${meeting.attendees.join(", ")}`

      setMeetings((prev) =>
        prev.map((m) => m.id === meetingId ? { ...m, status: "completed" as MeetingStatus, aiSummary: summary } : m)
      )
      setIsGeneratingSummary(false)
      setSelectedMeeting((prev) => prev?.id === meetingId ? { ...prev, status: "completed" as MeetingStatus, aiSummary: summary } : prev)
    }, 2000)
  }

  const handleSendEmail = (meetingId: string) => {
    setMeetings((prev) =>
      prev.map((m) => m.id === meetingId ? { ...m, emailSent: true } : m)
    )
    setSelectedMeeting((prev) => prev?.id === meetingId ? { ...prev, emailSent: true } : prev)
    const meeting = meetings.find(m => m.id === meetingId)
    const recipientNames = meeting?.recipients.map(r => r.name).join(", ") || "수신처 미설정"
    alert(`회의록이 수신처 (${recipientNames})에게 메일로 발송되었습니다.`)
  }

  const handleCreateMeeting = () => {
    if (!newMeetingDate || !newMeetingTitle.trim()) return
    const newMeeting: Meeting = {
      id: `MTG-${newMeetingType === "weekly" ? "W" : "M"}-${newMeetingDate.replaceAll("-", "")}`,
      type: newMeetingType,
      title: newMeetingTitle,
      date: newMeetingDate,
      time: newMeetingTime,
      status: "scheduled",
      attendees: ["김철수", "이영희", "박안전", "최정비", "정설비"],
      recipients: [
        { name: "기술팀장 장기술", email: "jang@company.com", role: "기술팀장" },
      ],
      agendas: [],
    }
    setMeetings((prev) => [newMeeting, ...prev])
    setShowCreateDialog(false)
    setNewMeetingTitle("")
    setNewMeetingDate("")
  }

  const handleAddNote = (meetingId: string, agendaId: string, content: string, type: "text" | "voice-transcript" = "text") => {
    if (!content.trim()) return
    const note: AgendaMeetingNote = { id: `n-${Date.now()}`, timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }), content, author: "김철수", type }
    const updateAgendas = (agendas: AgendaItem[]) => agendas.map(a => a.id === agendaId ? { ...a, meetingNotes: [...(a.meetingNotes || []), note] } : a)
    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, agendas: updateAgendas(m.agendas) } : m))
    setSelectedMeeting(prev => prev ? { ...prev, agendas: updateAgendas(prev.agendas) } : prev)
    setNoteInput("")
  }

  const handleAddRecipient = (meetingId: string) => {
    if (!newRecipientName.trim() || !newRecipientEmail.trim()) return
    const r: Recipient = { name: newRecipientName, email: newRecipientEmail, role: newRecipientRole }
    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, recipients: [...m.recipients, r] } : m))
    setSelectedMeeting(prev => prev ? { ...prev, recipients: [...prev.recipients, r] } : prev)
    setNewRecipientName(""); setNewRecipientEmail(""); setNewRecipientRole("")
  }

  const handleRemoveRecipient = (meetingId: string, email: string) => {
    const filter = (rs: Recipient[]) => rs.filter(r => r.email !== email)
    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, recipients: filter(m.recipients) } : m))
    setSelectedMeeting(prev => prev ? { ...prev, recipients: filter(prev.recipients) } : prev)
  }

  const filteredTicketPool = TICKET_POOL.filter((t) =>
    !agendaSearch || t.title.toLowerCase().includes(agendaSearch.toLowerCase()) || t.id.toLowerCase().includes(agendaSearch.toLowerCase())
  )

  return (
    <AppShell>
      <div className="flex h-full">
        {/* Left: Meeting List */}
        <div className={cn(
          "border-r flex flex-col transition-all",
          showDetailView ? "w-96" : "flex-1"
        )}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
  <h1 className="text-lg font-bold">회의 관리</h1>
  <Button size="sm" onClick={() => setShowCreateDialog(true)}>
  <Plus className="h-4 w-4 mr-1.5" />
  회의 생성
  </Button>
  </div>
  <div className="mb-3 p-2 bg-muted/30 border rounded-lg">
    <KpiDimensionFilter dimensions={kpiDimensions} onChange={setKpiDimensions} />
  </div>
            <div className="flex gap-2">
              {(["all", "weekly", "monthly"] as const).map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={filterType === t ? "default" : "outline"}
                  className={cn("text-xs", filterType !== t && "bg-transparent")}
                  onClick={() => setFilterType(t)}
                >
                  {t === "all" ? "전체" : MEETING_TYPE_CONFIG[t].label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredMeetings.map((meeting) => {
              const cfg = MEETING_TYPE_CONFIG[meeting.type]
              const isActive = selectedMeeting?.id === meeting.id && showDetailView
              const followUpCount = meeting.agendas.filter((a) => a.status === "follow-up").length
              const carryoverCount = meeting.agendas.filter((a) => a.source === "carryover").length

              return (
                <button
                  key={meeting.id}
                  className={cn(
                    "w-full text-left p-4 border-b transition-colors",
                    isActive ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"
                  )}
                  onClick={() => { setSelectedMeeting(meeting); setShowDetailView(true) }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="outline" className={cn("text-xs", cfg.bg, cfg.color)}>{cfg.label}</Badge>
                    {meeting.status === "scheduled" && <Badge variant="secondary" className="text-xs">예정</Badge>}
                    {meeting.status === "in-progress" && <Badge className="text-xs">진행중</Badge>}
                    {meeting.status === "completed" && <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">완료</Badge>}
                    {meeting.emailSent && <Mail className="h-3 w-3 text-green-500 ml-auto" />}
                  </div>
                  <p className="font-medium text-sm truncate">{meeting.title}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{meeting.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{meeting.time}</span>
                    <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{meeting.agendas.length}건</span>
                    {carryoverCount > 0 && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <RotateCcw className="h-3 w-3" />{carryoverCount}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: Meeting Detail */}
        {showDetailView && selectedMeeting && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={cn("text-xs", MEETING_TYPE_CONFIG[selectedMeeting.type].bg, MEETING_TYPE_CONFIG[selectedMeeting.type].color)}>
                    {MEETING_TYPE_CONFIG[selectedMeeting.type].label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{selectedMeeting.date} {selectedMeeting.time}</span>
                </div>
                <h2 className="text-lg font-bold">{selectedMeeting.title}</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{selectedMeeting.attendees.join(", ")}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">수신처: {selectedMeeting.recipients.length}명</span>
                  <Button variant="ghost" size="sm" className="h-5 text-xs px-1.5 text-primary" onClick={() => setShowRecipientDialog(true)}>관리</Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedMeeting.status === "scheduled" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-transparent"
                      onClick={() => {
                        setAgendaMode("ticket")
                        setAgendaSearch("")
                        setShowAddAgendaDialog(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      안건 추가
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setMeetings((prev) => prev.map((m) => m.id === selectedMeeting.id ? { ...m, status: "in-progress" } : m))
                        setSelectedMeeting((prev) => prev ? { ...prev, status: "in-progress" } : prev)
                      }}
                    >
                      회의 시작
                    </Button>
                  </>
                )}
                {selectedMeeting.status === "in-progress" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-transparent"
                      onClick={() => {
                        setAgendaMode("ticket")
                        setAgendaSearch("")
                        setShowAddAgendaDialog(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      안건 추가
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleCloseMeeting(selectedMeeting.id)}
                      disabled={isGeneratingSummary}
                    >
                      {isGeneratingSummary ? (
                        <><Sparkles className="h-4 w-4 mr-1.5 animate-spin" />요약 생성중...</>
                      ) : (
                        <><CheckCircle className="h-4 w-4 mr-1.5" />회의 종료</>
                      )}
                    </Button>
                  </>
                )}
                {selectedMeeting.status === "completed" && selectedMeeting.aiSummary && !selectedMeeting.emailSent && (
                  <Button size="sm" onClick={() => handleSendEmail(selectedMeeting.id)}>
                    <Mail className="h-4 w-4 mr-1.5" />
                    회의록 메일 발송
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <Tabs defaultValue="agenda" className="h-full flex flex-col">
                <div className="px-4 pt-3">
                  <TabsList>
                    <TabsTrigger value="agenda">안건 ({selectedMeeting.agendas.length})</TabsTrigger>
                    <TabsTrigger value="summary" disabled={!selectedMeeting.aiSummary}>
                      AI 회의록 {selectedMeeting.aiSummary && <Sparkles className="h-3.5 w-3.5 ml-1 text-amber-500" />}
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Agenda Tab */}
                <TabsContent value="agenda" className="flex-1 overflow-y-auto px-4 pb-4 mt-4 space-y-3">
                  {selectedMeeting.agendas.length === 0 ? (
                    <div className="p-12 text-center border border-dashed rounded-lg">
                      <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground mb-1">안건이 없습니다</p>
                      <p className="text-xs text-muted-foreground">티켓을 안건화하거나 수동으로 추가하세요</p>
                    </div>
                  ) : (
                    selectedMeeting.agendas.map((agenda, idx) => {
                      const statusCfg = AGENDA_STATUS_CONFIG[agenda.status]
                      const StatusIcon = statusCfg.icon
                      const sourceInfo = SOURCE_LABELS[agenda.source]
                      return (
                        <Card key={agenda.id} className={cn(
                          "transition-colors",
                          agenda.isCarriedOver && "border-amber-200 bg-amber-50/30",
                          selectedMeeting.status === "in-progress" && "cursor-pointer hover:border-primary/50",
                          activeAgendaId === agenda.id && "border-primary ring-1 ring-primary/20"
                        )}
                          onClick={() => { if (selectedMeeting.status === "in-progress") setActiveAgendaId(activeAgendaId === agenda.id ? null : agenda.id) }}
                        >
                          <CardContent className="py-4">
                            <div className="flex items-start gap-3">
                              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-bold text-muted-foreground shrink-0 mt-0.5">
                                {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <Badge variant="secondary" className={cn("text-xs", sourceInfo.color)}>{sourceInfo.label}</Badge>
                                  {agenda.ticketType && (
                                    <Badge variant="outline" className="text-xs">{TICKET_TYPE_LABELS[agenda.ticketType] || agenda.ticketType}</Badge>
                                  )}
                                  {agenda.ticketId && (
                                    <span className="text-xs font-mono text-muted-foreground">{agenda.ticketId}</span>
                                  )}
                                  <div className={cn("flex items-center gap-1 text-xs ml-auto", statusCfg.color)}>
                                    <StatusIcon className="h-3.5 w-3.5" />
                                    {statusCfg.label}
                                  </div>
                                </div>
                                <p className="font-medium text-sm">{agenda.title}</p>
                                {agenda.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{agenda.description}</p>
                                )}
                                {agenda.presenter && (
                                  <p className="text-xs text-muted-foreground mt-1">발표: {agenda.presenter}</p>
                                )}
                                {agenda.decision && (
                                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                                    <span className="font-medium">결정사항:</span> {agenda.decision}
                                  </div>
                                )}
                                {agenda.followUpNote && (
                                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                                    <span className="font-medium">Follow-Up:</span> {agenda.followUpNote}
                                  </div>
                                )}

                                {/* Status change buttons when in-progress */}
                                {selectedMeeting.status === "in-progress" && (
                                  <div className="flex gap-1.5 mt-3" onClick={e => e.stopPropagation()}>
                                    {(["pending", "discussed", "follow-up", "resolved"] as AgendaStatus[]).map((st) => {
                                      const stCfg = AGENDA_STATUS_CONFIG[st]
                                      const StIcon = stCfg.icon
                                      return (
                                        <Button
                                          key={st}
                                          size="sm"
                                          variant={agenda.status === st ? "default" : "outline"}
                                          className={cn("text-xs h-7", agenda.status !== st && "bg-transparent")}
                                          onClick={() => handleAgendaStatusChange(selectedMeeting.id, agenda.id, st)}
                                        >
                                          <StIcon className="h-3 w-3 mr-1" />
                                          {stCfg.label}
                                        </Button>
                                      )
                                    })}
                                  </div>
                                )}

                                {/* Expanded ticket detail + notes panel */}
                                {activeAgendaId === agenda.id && selectedMeeting.status === "in-progress" && (
                                  <div className="mt-4 border-t pt-4" onClick={e => e.stopPropagation()}>
                                    <div className="grid grid-cols-2 gap-4">
                                      {/* Left: Ticket Content */}
                                      <div className="space-y-3">
                                        <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Ticket className="h-3.5 w-3.5" />티켓 상세</h4>
                                        {agenda.ticketId ? (
                                          <div className="p-3 bg-muted/30 rounded-lg border space-y-2">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-mono text-muted-foreground">{agenda.ticketId}</span>
                                              {agenda.ticketType && <Badge variant="outline" className="text-xs">{TICKET_TYPE_LABELS[agenda.ticketType] || agenda.ticketType}</Badge>}
                                            </div>
                                            <p className="text-sm font-medium">{agenda.title}</p>
                                            <p className="text-xs text-muted-foreground">{agenda.description || "상세 내용은 티켓을 참조하세요."}</p>
                                            <div className="text-xs text-muted-foreground">발표자: {agenda.presenter || "-"}</div>
                                            {agenda.decision && <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800"><strong>결정사항:</strong> {agenda.decision}</div>}
                                            <Button variant="outline" size="sm" className="text-xs bg-transparent gap-1"><ExternalLink className="h-3 w-3" />티켓 전체보기</Button>
                                          </div>
                                        ) : (
                                          <div className="p-3 bg-muted/30 rounded-lg border">
                                            <p className="text-sm font-medium">{agenda.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{agenda.description || "수동 등록 안건"}</p>
                                          </div>
                                        )}
                                      </div>

                                      {/* Right: Meeting Notes + Recording */}
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" />회의 노트</h4>
                                          <Button
                                            variant={isRecording ? "destructive" : "outline"}
                                            size="sm"
                                            className={cn("text-xs h-7 gap-1", !isRecording && "bg-transparent")}
                                            onClick={() => {
                                              if (!isRecording) { setIsRecording(true) }
                                              else {
                                                setIsRecording(false)
                                                handleAddNote(selectedMeeting.id, agenda.id, "[음성 녹음 자동 전사] 회의 논의 내용이 자동으로 텍스트 변환됩니다.", "voice-transcript")
                                              }
                                            }}
                                          >
                                            {isRecording ? <><MicOff className="h-3 w-3" />녹음 중지</> : <><Mic className="h-3 w-3" />자동 녹음</>}
                                          </Button>
                                        </div>
                                        {isRecording && (
                                          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 animate-pulse">
                                            <Mic className="h-3.5 w-3.5" />
                                            녹음 중... 음성이 자동 전사됩니다
                                          </div>
                                        )}
                                        {/* Notes list */}
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                          {(agenda.meetingNotes || []).map(note => (
                                            <div key={note.id} className={cn("p-2 rounded-lg text-xs", note.type === "voice-transcript" ? "bg-blue-50 border border-blue-200" : "bg-muted/50 border")}>
                                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                {note.type === "voice-transcript" && <Mic className="h-3 w-3 text-blue-500" />}
                                                <span>{note.timestamp}</span>
                                                <span>{note.author}</span>
                                              </div>
                                              <p>{note.content}</p>
                                            </div>
                                          ))}
                                          {(!agenda.meetingNotes || agenda.meetingNotes.length === 0) && (
                                            <p className="text-xs text-muted-foreground text-center py-3">아직 노트가 없습니다</p>
                                          )}
                                        </div>
                                        {/* Note input */}
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="회의 내용을 입력하세요..."
                                            value={noteInput}
                                            onChange={e => setNoteInput(e.target.value)}
                                            className="text-xs h-8"
                                            onKeyDown={e => { if (e.key === "Enter") handleAddNote(selectedMeeting.id, agenda.id, noteInput) }}
                                          />
                                          <Button size="sm" className="h-8 px-3" onClick={() => handleAddNote(selectedMeeting.id, agenda.id, noteInput)}>
                                            <Send className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </TabsContent>

                {/* AI Summary Tab */}
                <TabsContent value="summary" className="flex-1 overflow-y-auto px-4 pb-4 mt-4">
                  {selectedMeeting.aiSummary ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        <span className="font-medium text-sm">GenAI 기반 회의록 요약</span>
                        {selectedMeeting.emailSent && (
                          <Badge variant="outline" className="ml-auto text-xs text-green-600 border-green-200 bg-green-50">
                            <Mail className="h-3 w-3 mr-1" />발송 완료
                          </Badge>
                        )}
                      </div>
                      <div className="prose prose-sm max-w-none p-4 bg-muted/30 rounded-lg border">
                        {selectedMeeting.aiSummary.split("\n").map((line, i) => {
                          if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-bold mt-4 mb-2 first:mt-0">{line.replace("## ", "")}</h2>
                          if (line.startsWith("### ")) return <h3 key={i} className="text-sm font-bold mt-3 mb-1">{line.replace("### ", "")}</h3>
                          if (line.startsWith("- ")) return <li key={i} className="text-sm ml-4 text-muted-foreground">{line.replace("- ", "")}</li>
                          if (line.match(/^\d+\./)) {
                            const text = line.replace(/^\d+\.\s*/, "")
                            // Parse bold markers
                            const parts = text.split(/\*\*(.*?)\*\*/)
                            return (
                              <p key={i} className="text-sm ml-4 mb-1">
                                {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
                              </p>
                            )
                          }
                          if (line.trim() === "") return <div key={i} className="h-2" />
                          return <p key={i} className="text-sm text-muted-foreground">{line}</p>
                        })}
                      </div>

                      {!selectedMeeting.emailSent && (
                        <Button onClick={() => handleSendEmail(selectedMeeting.id)} className="w-full">
                          <Mail className="h-4 w-4 mr-2" />
                          참석자 전원에게 회의록 메일 발송
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <Sparkles className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">회의 종료 후 AI 요약이 생성됩니다</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>

      {/* Add Agenda Dialog */}
      <Dialog open={showAddAgendaDialog} onOpenChange={setShowAddAgendaDialog}>
        <DialogContent className="max-w-lg max-h-[75vh]">
          <DialogHeader>
            <DialogTitle>안건 추가</DialogTitle>
            <DialogDescription>티켓을 안건화하거나 수동으로 안건을 추가합니다.</DialogDescription>
          </DialogHeader>

          <Tabs value={agendaMode} onValueChange={(v) => setAgendaMode(v as typeof agendaMode)}>
            <TabsList className="w-full">
              <TabsTrigger value="ticket" className="flex-1">티켓에서 추가</TabsTrigger>
              <TabsTrigger value="manual" className="flex-1">수동 추가</TabsTrigger>
            </TabsList>

            <TabsContent value="ticket" className="space-y-3 mt-3">
              <Input
                placeholder="티켓 ID 또는 제목 검색..."
                value={agendaSearch}
                onChange={(e) => setAgendaSearch(e.target.value)}
              />
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredTicketPool.map((ticket) => {
                  const alreadyAdded = selectedMeeting?.agendas.some((a) => a.ticketId === ticket.id)
                  return (
                    <button
                      key={ticket.id}
                      disabled={alreadyAdded}
                      className={cn(
                        "w-full text-left p-3 border rounded-lg flex items-center gap-3 transition-colors",
                        alreadyAdded ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/30"
                      )}
                      onClick={() => {
                        if (selectedMeeting && !alreadyAdded) {
                          handleAddTicketAgenda(selectedMeeting.id, ticket)
                        }
                      }}
                    >
                      <Ticket className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                          <Badge variant="outline" className="text-xs">{TICKET_TYPE_LABELS[ticket.ticketType] || ticket.ticketType}</Badge>
                        </div>
                        <p className="text-sm truncate mt-0.5">{ticket.title}</p>
                      </div>
                      {alreadyAdded ? (
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-3 mt-3">
              <div className="space-y-1.5">
                <Label className="text-sm">안건 제목 *</Label>
                <Input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="오프라인 안건 제목"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">설명</Label>
                <Textarea
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  placeholder="안건 상세 내용..."
                  className="min-h-20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">발표자</Label>
                <Input
                  value={manualPresenter}
                  onChange={(e) => setManualPresenter(e.target.value)}
                  placeholder="발표자 이름"
                />
              </div>
              <Button
                className="w-full"
                disabled={!manualTitle.trim()}
                onClick={() => selectedMeeting && handleAddManualAgenda(selectedMeeting.id)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                안건 추가
              </Button>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAgendaDialog(false)} className="bg-transparent">닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recipient Management Dialog */}
      <Dialog open={showRecipientDialog} onOpenChange={setShowRecipientDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>수신처 관리</DialogTitle>
            <DialogDescription>AI 회의록 발행 시 수신할 대상을 관리합니다.</DialogDescription>
          </DialogHeader>
          {selectedMeeting && (
            <div className="space-y-4 py-2">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedMeeting.recipients.map(r => (
                  <div key={r.email} className="flex items-center gap-3 p-2.5 border rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.email} {r.role && `(${r.role})`}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleRemoveRecipient(selectedMeeting.id, r.email)}>
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">수신자 추가</p>
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="이름" value={newRecipientName} onChange={e => setNewRecipientName(e.target.value)} className="text-xs" />
                  <Input placeholder="이메일" value={newRecipientEmail} onChange={e => setNewRecipientEmail(e.target.value)} className="text-xs" />
                  <Input placeholder="직책" value={newRecipientRole} onChange={e => setNewRecipientRole(e.target.value)} className="text-xs" />
                </div>
                <Button size="sm" className="w-full" disabled={!newRecipientName.trim() || !newRecipientEmail.trim()} onClick={() => handleAddRecipient(selectedMeeting.id)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />추가
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Meeting Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>회의 생성</DialogTitle>
            <DialogDescription>새로운 주간실무회의 또는 월간현안보고를 생성합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">회의 유형</Label>
              <Select value={newMeetingType} onValueChange={(v) => {
                setNewMeetingType(v as MeetingType)
                if (v === "weekly") setNewMeetingTitle(`주간실무회의`)
                if (v === "monthly") setNewMeetingTitle(`월간현안보고`)
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">주간실무회의</SelectItem>
                  <SelectItem value="monthly">월간현안보고</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">제목 *</Label>
              <Input value={newMeetingTitle} onChange={(e) => setNewMeetingTitle(e.target.value)} placeholder="회의 제목" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">일자 *</Label>
                <Input type="date" value={newMeetingDate} onChange={(e) => setNewMeetingDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">시간</Label>
                <Input type="time" value={newMeetingTime} onChange={(e) => setNewMeetingTime(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="bg-transparent">취소</Button>
            <Button onClick={handleCreateMeeting} disabled={!newMeetingDate || !newMeetingTitle.trim()}>
              <Plus className="h-4 w-4 mr-1.5" />
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
