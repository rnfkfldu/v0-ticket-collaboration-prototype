"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { Ticket, EventProcessStep, EventOpinion, DataInsertBox } from "@/lib/types"
import { ClosureReportDialog, requiresClosureReport } from "@/components/closure-report-dialog"
import type { ClosureReport } from "@/components/closure-report-dialog"
import { DataVisualization } from "@/components/data-visualization"
import { DataInsertBoxConfig } from "@/components/data-insert-box-config"
import { TemplateSelectorDialog } from "@/components/template-selector-dialog"
import { TICKET_CATEGORY_TEMPLATES } from "@/lib/ticket-templates"
import { getTickets, markNotificationAsRead, closeTicket, getTicketById, updateTicket } from "@/lib/storage"
import {
  Calendar, User, Target, AlertCircle, CheckCircle, XCircle, Clock, ArrowRight,
  FileSearch, FileText, Send, Save, PlusCircle, Trash2, FileUp, X, RotateCcw,
  Activity, Gauge, Info, Wrench, FileBarChart, Link2, MessageSquare, ChevronRight,
  Search, Users, UserPlus, ExternalLink, Boxes
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog"

interface TicketDetailProps {
  ticket: Ticket
}

const CURRENT_USER = "김지수"

// --- Process Flow Component ---
function ProcessFlowBar({ steps, processStatus }: { steps?: EventProcessStep[]; processStatus?: string }) {
  if (!steps || steps.length === 0) return null

  const getStepStyle = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-600 text-white border-emerald-600"
      case "current": return "bg-amber-500 text-white border-amber-500 ring-2 ring-amber-200"
      case "skipped": return "bg-red-100 text-red-600 border-red-300 line-through"
      default: return "bg-muted text-muted-foreground border-border"
    }
  }

  const getConnectorStyle = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-400"
      case "current": return "bg-amber-300"
      default: return "bg-border"
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        업무 프로세스
      </h3>
      <div className="flex items-start gap-0 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <div key={step.step + index} className="flex items-start">
            <div className="flex flex-col items-center min-w-[120px]">
              <div className={`flex items-center justify-center w-full px-3 py-2 rounded-lg border text-xs font-medium ${getStepStyle(step.status)}`}>
                {step.label}
              </div>
              {(step.assignee || step.team || step.timestamp) && (
                <div className="mt-2 text-center space-y-0.5">
                  {step.team && <p className="text-[10px] text-muted-foreground">{step.team}</p>}
                  {step.assignee && <p className="text-[10px] font-medium text-foreground">{step.assignee}</p>}
                  {step.timestamp && <p className="text-[10px] text-muted-foreground">{step.timestamp}</p>}
                </div>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className="flex items-center pt-3 px-1">
                <div className={`h-0.5 w-6 ${getConnectorStyle(step.status)}`} />
                <ChevronRight className={`h-3 w-3 ${step.status === "completed" ? "text-emerald-400" : "text-muted-foreground"}`} />
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

// --- Similar Events Panel ---
function SimilarEventsDialog({ ticket }: { ticket: Ticket }) {
  const allTickets = getTickets()
  const similar = allTickets
    .filter(t => t.id !== ticket.id && (t.unit === ticket.unit || (ticket.tags && t.tags?.some(tag => ticket.tags?.includes(tag)))))
    .slice(0, 5)

  const getSimilarity = (t: Ticket) => {
    let score = 0
    if (t.unit === ticket.unit) score += 40
    if (ticket.tags && t.tags) score += ticket.tags.filter(tag => t.tags?.includes(tag)).length * 20
    if (t.ticketType === ticket.ticketType) score += 15
    if (t.impact === ticket.impact) score += 15
    return Math.min(score, 100)
  }

  return (
    <div className="space-y-3">
      {similar.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">유사 이벤트가 없습니다.</p>
      ) : (
        similar.map(t => (
          <Card key={t.id} className="p-3 hover:bg-muted/30 cursor-pointer">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{t.id}</span>
                  <Badge variant="outline" className="text-[10px]">{t.unit}</Badge>
                </div>
                <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.createdDate}</p>
              </div>
              <Badge variant="secondary" className="text-xs shrink-0 bg-emerald-50 text-emerald-700">{getSimilarity(t)}%</Badge>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}

// --- Similar Reports (dummy) ---
function SimilarReportsContent({ ticket }: { ticket: Ticket }) {
  const reports = [
    { id: "RPT-041", title: `${ticket.unit} 열교환기 성능 점검 보고서`, date: "2024-12-15", similarity: 78 },
    { id: "RPT-038", title: `${ticket.unit} 운전 가이드 개정 보고서`, date: "2024-11-20", similarity: 65 },
    { id: "RPT-022", title: `${ticket.unit || "CDU"} 공정 효율 분석 보고서`, date: "2024-09-10", similarity: 52 },
  ]
  return (
    <div className="space-y-3">
      {reports.map(r => (
        <Card key={r.id} className="p-3 hover:bg-muted/30 cursor-pointer">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-mono text-muted-foreground">{r.id}</span>
              <p className="text-sm font-medium text-foreground mt-0.5">{r.title}</p>
              <p className="text-xs text-muted-foreground">{r.date}</p>
            </div>
            <Badge variant="secondary" className="text-xs shrink-0 bg-blue-50 text-blue-700">{r.similarity}%</Badge>
          </div>
        </Card>
      ))}
    </div>
  )
}

// --- Context Data Panel ---
function ContextDataPanel({ ticket }: { ticket: Ticket }) {
  const contextData = {
    operatingMode: ticket.unit === "HCR" ? "W600N" : ticket.unit === "VDU" ? "Normal" : "Mixed",
    feedRate: ticket.unit === "CDU" ? "48,500 BPD" : ticket.unit === "HCR" ? "12,200 BPD" : "8,500 BPD",
    productOnSpec: ticket.processStatus === "rejected" ? "Off-Spec" : "On-Spec",
    guideCompliance: ticket.priority === "P1" ? "비준수" : "준수",
    keyVariables: [
      { name: "주요 온도", value: ticket.unit === "HCR" ? "412 C" : "128 C", status: ticket.priority === "P1" ? "Critical" : "Normal" },
      { name: "주요 압력", value: ticket.unit === "HCR" ? "155 kg/cm2" : "1.2 kg/cm2", status: "Normal" },
      { name: "유량", value: ticket.unit === "CDU" ? "48,500 BPD" : "12,200 BPD", status: "Normal" },
    ],
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Gauge className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">컨텍스트 데이터</h3>
        {ticket.fromTime && ticket.toTime && (
          <Badge variant="outline" className="text-[10px] ml-auto">
            {new Date(ticket.fromTime).toLocaleDateString("ko-KR")} ~ {new Date(ticket.toTime).toLocaleDateString("ko-KR")}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-[10px] text-muted-foreground mb-0.5">운전 모드</p>
          <p className="text-sm font-medium text-foreground">{contextData.operatingMode}</p>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-[10px] text-muted-foreground mb-0.5">Feed 처리량</p>
          <p className="text-sm font-medium text-foreground">{contextData.feedRate}</p>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-[10px] text-muted-foreground mb-0.5">Product On-Spec</p>
          <p className={`text-sm font-medium ${contextData.productOnSpec === "On-Spec" ? "text-emerald-600" : "text-red-600"}`}>{contextData.productOnSpec}</p>
        </div>
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-[10px] text-muted-foreground mb-0.5">Guide 준수</p>
          <p className={`text-sm font-medium ${contextData.guideCompliance === "준수" ? "text-emerald-600" : "text-red-600"}`}>{contextData.guideCompliance}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">주요 운전변수</p>
        <div className="space-y-1.5">
          {contextData.keyVariables.map((v, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-muted/20 rounded">
              <span className="text-xs text-muted-foreground">{v.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">{v.value}</span>
                <Badge variant="outline" className={`text-[10px] ${v.status === "Critical" ? "text-red-600 border-red-200 bg-red-50" : v.status === "Warning" ? "text-amber-600 border-amber-200 bg-amber-50" : "text-emerald-600 border-emerald-200 bg-emerald-50"}`}>
                  {v.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {ticket.tags && ticket.tags.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">관련 태그 트렌드</p>
          <div className="p-4 bg-muted/20 rounded-lg border border-dashed border-border">
            <div className="flex items-center gap-2 mb-2">
              {ticket.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
            <div className="h-24 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">태그 트렌드 차트 (시스템 연동 시 표시)</p>
            </div>
          </div>
        </div>
      )}

      <Separator className="my-4" />
      <p className="text-xs font-medium text-muted-foreground mb-2">연계 정보</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 bg-transparent">
          <Info className="h-3.5 w-3.5" />
          장치 데이터시트
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 bg-transparent">
          <FileBarChart className="h-3.5 w-3.5" />
          {"P&ID 도면"}
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 bg-transparent">
          <ExternalLink className="h-3.5 w-3.5" />
          DCS 화면
        </Button>
      </div>
    </Card>
  )
}

// --- Opinion Writing Canvas ---
function OpinionWritingCanvas({
  ticketId, ticketType, ticketUnit, currentUser, onSuccess
}: {
  ticketId: string; ticketType: string; ticketUnit?: string; currentUser: string;
  onSuccess: () => void
}) {
  const [templateType, setTemplateType] = useState("")
  const [templateLabel, setTemplateLabel] = useState("")
  const [fields, setFields] = useState<{ label: string; value: string }[]>([])
  const [dataBoxes, setDataBoxes] = useState<DataInsertBox[]>([])
  const [attachments, setAttachments] = useState<{ fileName: string; fileUrl: string }[]>([])
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showDataBoxConfig, setShowDataBoxConfig] = useState(false)

  const handleSelectTemplate = (category: string) => {
    const templateLabels: Record<string, string> = {
      Trouble: "트러블슈팅", Improvement: "개선아이템", Change: "변경 관리", Analysis: "분석 검토"
    }
    setTemplateType(category)
    setTemplateLabel(templateLabels[category] || category)
    const templateFields = TICKET_CATEGORY_TEMPLATES[category] || []
    setFields(templateFields.map(f => ({ label: f.label, value: "" })))
    setShowTemplateDialog(false)
  }

  const handleFieldChange = (index: number, value: string) => {
    const updated = [...fields]
    updated[index].value = value
    setFields(updated)
  }

  const handleAddDataBox = (box: Omit<DataInsertBox, "id">) => {
    setDataBoxes([...dataBoxes, { id: `box-${Date.now()}`, ...box }])
    setShowDataBoxConfig(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => ({ fileName: f.name, fileUrl: URL.createObjectURL(f) }))
      setAttachments([...attachments, ...newFiles])
    }
  }

  const handleSaveDraft = () => {
    const ticket = getTicketById(ticketId)
    if (!ticket) return
    const opinion: EventOpinion = {
      id: `op-${Date.now()}`, author: currentUser, team: "공정기술팀",
      templateType, templateLabel, fields,
      dataBoxes: dataBoxes.length > 0 ? dataBoxes : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      status: "draft", createdAt: new Date().toISOString(),
    }
    const opinions = [...(ticket.opinions || []), opinion]
    updateTicket(ticketId, { opinions })
    alert("임시 저장되었습니다.")
  }

  const handleSubmit = () => {
    const emptyRequired = fields.filter(f => !f.value.trim())
    if (emptyRequired.length > 0) {
      alert("모든 필드를 입력해주세요.")
      return
    }
    const ticket = getTicketById(ticketId)
    if (!ticket) return
    const opinion: EventOpinion = {
      id: `op-${Date.now()}`, author: currentUser, team: "공정기술팀",
      templateType, templateLabel, fields,
      dataBoxes: dataBoxes.length > 0 ? dataBoxes : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      status: "submitted", createdAt: new Date().toISOString(), submittedAt: new Date().toISOString(),
    }
    const opinions = [...(ticket.opinions || []), opinion]
    const messages = [...(ticket.messages || []), {
      id: `msg-${Date.now()}`, ticketId, author: currentUser, role: "assignee" as const,
      messageType: "opinion" as const, content: `[${templateLabel}] 의견이 제출되었습니다.`,
      timestamp: new Date().toISOString(),
    }]
    updateTicket(ticketId, { opinions, messages })
    onSuccess()
  }

  if (!templateType) {
    return (
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          의견 작성
        </h3>
        <p className="text-xs text-muted-foreground mb-4">작성 템플릿을 선택하여 의견을 작성하세요.</p>
        <Button variant="outline" className="gap-2 bg-transparent" onClick={() => setShowTemplateDialog(true)}>
          <PlusCircle className="h-4 w-4" />
          템플릿 선택
        </Button>
        <TemplateSelectorDialog open={showTemplateDialog} onSelect={handleSelectTemplate} onCancel={() => setShowTemplateDialog(false)} />
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          의견 작성
          <Badge variant="secondary" className="text-xs">{templateLabel}</Badge>
        </h3>
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setTemplateType(""); setFields([]); setDataBoxes([]); setAttachments([]) }}>
          <X className="h-3.5 w-3.5 mr-1" />
          초기화
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, idx) => (
          <div key={idx}>
            <Label className="text-xs font-medium">{field.label}</Label>
            <Textarea
              value={field.value}
              onChange={(e) => handleFieldChange(idx, e.target.value)}
              placeholder={`${field.label}을(를) 입력해주세요...`}
              className="mt-1.5 min-h-[80px] text-sm"
            />
          </div>
        ))}

        {dataBoxes.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">연동 데이터</p>
            {dataBoxes.map(box => (
              <div key={box.id} className="relative">
                <DataVisualization dataBox={box} />
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => setDataBoxes(dataBoxes.filter(b => b.id !== box.id))}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {attachments.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">첨부파일</p>
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                <span>{att.fileName}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setAttachments(attachments.filter((_, j) => j !== i))}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 bg-transparent" onClick={() => setShowDataBoxConfig(true)}>
            <PlusCircle className="h-3.5 w-3.5" />
            데이터 연동
          </Button>
          <label>
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 bg-transparent" asChild>
              <span>
                <FileUp className="h-3.5 w-3.5" />
                첨부파일
              </span>
            </Button>
            <input type="file" className="hidden" multiple onChange={handleFileUpload} />
          </label>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" className="gap-1.5 bg-transparent" onClick={handleSaveDraft}>
            <Save className="h-3.5 w-3.5" />
            임시 저장
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleSubmit}>
            <Send className="h-3.5 w-3.5" />
            의견 제출
          </Button>
        </div>
      </div>

      {showDataBoxConfig && (
        <Dialog open={showDataBoxConfig} onOpenChange={setShowDataBoxConfig}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>데이터 연동 설정</DialogTitle>
              <DialogDescription>트렌드, DCS 화면, 표 등을 삽입할 수 있습니다.</DialogDescription>
            </DialogHeader>
            <DataInsertBoxConfig onConfirm={handleAddDataBox} onCancel={() => setShowDataBoxConfig(false)} defaultUnit={ticketUnit} />
          </DialogContent>
        </Dialog>
      )}
      <TemplateSelectorDialog open={showTemplateDialog} onSelect={handleSelectTemplate} onCancel={() => setShowTemplateDialog(false)} />
    </Card>
  )
}

// --- Additional Reviewer Assignment ---
function AdditionalReviewerSection({ ticket, onAssign }: { ticket: Ticket; onAssign: () => void }) {
  const [showAssign, setShowAssign] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState("")
  const [selectedPerson, setSelectedPerson] = useState("")

  const teamOptions = [
    { team: "장치기술팀", members: ["최영호", "한진수", "이재현"] },
    { team: "장치팀", members: ["한정민", "김기동", "박우진"] },
    { team: "생산조정팀", members: ["박성호", "이민석", "강진우"] },
    { team: "촉매기술팀", members: ["윤서연", "장민혁", "김태호"] },
    { team: "에너지관리팀", members: ["정태영", "이승환"] },
    { team: "DX팀", members: ["오진우", "임가은", "송현정"] },
  ]

  const handleAssign = () => {
    if (!selectedTeam || !selectedPerson) return
    updateTicket(ticket.id, {
      additionalReviewer: { name: selectedPerson, team: selectedTeam, status: "pending", assignedAt: new Date().toISOString() },
      processStatus: "additional-review",
      processFlow: ticket.processFlow?.map(s =>
        s.step === "review" ? { ...s, status: "completed" as const, timestamp: new Date().toLocaleString("ko-KR") } :
        s.step === "additional-review" ? { ...s, status: "current" as const, assignee: selectedPerson, team: selectedTeam } : s
      ) || [],
      messages: [...(ticket.messages || []), {
        id: `msg-${Date.now()}`, ticketId: ticket.id, author: "System", role: "system" as const,
        messageType: "wp_assignment" as const, content: `${selectedPerson}님(${selectedTeam})에게 추가 검토가 요청되었습니다.`,
        timestamp: new Date().toISOString(),
      }],
    })
    setShowAssign(false)
    onAssign()
  }

  // Check if additional-review step doesn't exist yet, add it
  const hasAdditionalStep = ticket.processFlow?.some(s => s.step === "additional-review")

  if (ticket.additionalReviewer) {
    return (
      <Card className="p-4 bg-orange-50/50 border-orange-200">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-orange-600" />
          <p className="text-sm font-medium text-orange-800">추가 검토 배정</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">{ticket.additionalReviewer.team}</Badge>
          <span className="text-sm text-foreground">{ticket.additionalReviewer.name}</span>
          <Badge variant="secondary" className={`text-xs ml-auto ${
            ticket.additionalReviewer.status === "completed" ? "bg-emerald-100 text-emerald-700" :
            ticket.additionalReviewer.status === "in-progress" ? "bg-amber-100 text-amber-700" :
            "bg-slate-100 text-slate-600"
          }`}>
            {ticket.additionalReviewer.status === "completed" ? "검토 완료" :
             ticket.additionalReviewer.status === "in-progress" ? "검토 중" : "배정됨"}
          </Badge>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">타 팀 추가 검토가 필요한 경우</p>
        </div>
        <Button variant="outline" size="sm" className="text-xs gap-1.5 bg-transparent" onClick={() => setShowAssign(true)}>
          <UserPlus className="h-3.5 w-3.5" />
          추가 검토자 지정
        </Button>
      </div>

      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>추가 검토자 지정</DialogTitle>
            <DialogDescription>추가 기술검토가 필요한 팀과 담당자를 선택하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs">팀 선택</Label>
              <Select value={selectedTeam} onValueChange={(v) => { setSelectedTeam(v); setSelectedPerson("") }}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="팀을 선택하세요" /></SelectTrigger>
                <SelectContent>
                  {teamOptions.map(t => <SelectItem key={t.team} value={t.team}>{t.team}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedTeam && (
              <div>
                <Label className="text-xs">담당자 선택</Label>
                <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="담당자를 선택하세요" /></SelectTrigger>
                  <SelectContent>
                    {teamOptions.find(t => t.team === selectedTeam)?.members.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAssign(false)}>취소</Button>
              <Button onClick={handleAssign} disabled={!selectedTeam || !selectedPerson}>배정</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// --- Comments Section ---
function CommentsSection({ ticket, onUpdate }: { ticket: Ticket; onUpdate: () => void }) {
  const [newComment, setNewComment] = useState("")

  const handleAddComment = () => {
    if (!newComment.trim()) return
    const comments = [...(ticket.comments || []), {
      id: `cmt-${Date.now()}`, author: CURRENT_USER, content: newComment, timestamp: new Date().toISOString(),
    }]
    updateTicket(ticket.id, { comments })
    setNewComment("")
    onUpdate()
  }

  return (
    <div className="space-y-4">
      {(ticket.comments || []).map(c => (
        <div key={c.id} className="flex gap-3">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <User className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-medium text-foreground">{c.author}</span>
              <span className="text-[10px] text-muted-foreground">{new Date(c.timestamp).toLocaleString("ko-KR")}</span>
            </div>
            <p className="text-sm text-foreground bg-muted/30 rounded-lg px-3 py-2">{c.content}</p>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 입력하세요..."
          className="min-h-[60px] text-sm"
        />
        <Button size="sm" className="shrink-0 self-end" onClick={handleAddComment} disabled={!newComment.trim()}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// --- Thread History ---
function ThreadHistory({ ticket }: { ticket: Ticket }) {
  const messages = [...(ticket.messages || [])].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const getIcon = (type: string, role: string) => {
    if (role === "system") return <AlertCircle className="h-3.5 w-3.5" />
    if (type === "opinion") return <CheckCircle className="h-3.5 w-3.5" />
    if (type === "inquiry") return <MessageSquare className="h-3.5 w-3.5" />
    if (type === "wp_assignment") return <Users className="h-3.5 w-3.5" />
    return <User className="h-3.5 w-3.5" />
  }

  const getBg = (role: string) => {
    if (role === "requester") return "bg-blue-50 border-blue-100"
    if (role === "assignee") return "bg-emerald-50 border-emerald-100"
    return "bg-muted/50 border-border"
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = { opinion: "의견", inquiry: "추가 문의", response: "답변", status_change: "상태 변경", wp_assignment: "배정" }
    return labels[type] || type
  }

  return (
    <div className="space-y-3">
      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">아직 히스토리가 없습니다</p>
      ) : (
        messages.map((msg, idx) => (
          <div key={msg.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {getIcon(msg.messageType, msg.role)}
              </div>
              {idx < messages.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
            </div>
            <div className={`flex-1 p-3 rounded-lg border ${getBg(msg.role)} mb-1`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-foreground">{msg.author}</span>
                <Badge variant="outline" className="text-[10px]">{getTypeLabel(msg.messageType)}</Badge>
                <span className="text-[10px] text-muted-foreground ml-auto">{new Date(msg.timestamp).toLocaleString("ko-KR")}</span>
              </div>
              <p className="text-sm text-foreground">{msg.content}</p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// --- Submitted Opinions View ---
function SubmittedOpinionsView({ opinions }: { opinions?: EventOpinion[] }) {
  const submitted = (opinions || []).filter(o => o.status === "submitted")
  if (submitted.length === 0) return null

  return (
    <div className="space-y-3">
      {submitted.map(op => (
        <Card key={op.id} className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="text-xs">{op.templateLabel}</Badge>
            <span className="text-xs text-muted-foreground">{op.author} ({op.team})</span>
            <span className="text-[10px] text-muted-foreground ml-auto">{op.submittedAt && new Date(op.submittedAt).toLocaleString("ko-KR")}</span>
          </div>
          <div className="space-y-2">
            {op.fields.map((f, i) => (
              <div key={i}>
                <p className="text-[10px] font-medium text-muted-foreground mb-0.5">{f.label}</p>
                <p className="text-sm text-foreground bg-muted/30 rounded px-3 py-2 whitespace-pre-wrap">{f.value}</p>
              </div>
            ))}
          </div>
          {op.dataBoxes && op.dataBoxes.length > 0 && (
            <div className="mt-3 space-y-2">
              {op.dataBoxes.map(box => <DataVisualization key={box.id} dataBox={box} />)}
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

// === Main Component ===
export function TicketDetail({ ticket: initialTicket }: TicketDetailProps) {
  const [ticket, setTicket] = useState(initialTicket)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [showClosureReport, setShowClosureReport] = useState(false)
  const [showAcceptDialog, setShowAcceptDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const router = useRouter()

  const refreshTicket = () => {
    const updated = getTicketById(ticket.id)
    if (updated) setTicket(updated)
  }

  useEffect(() => {
    if (ticket.hasUnreadNotification) {
      markNotificationAsRead(ticket.id)
      refreshTicket()
    }
    const handleFocus = () => refreshTicket()
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [ticket.id])

  // Accept event
  const handleAccept = () => {
    const flow = (ticket.processFlow || []).map(s =>
      s.step === "issued" ? { ...s, status: "completed" as const } :
      s.step === "accepted" ? { ...s, status: "completed" as const, assignee: CURRENT_USER, team: "공정기술팀", timestamp: new Date().toLocaleString("ko-KR") } :
      s.step === "review" ? { ...s, status: "current" as const, assignee: CURRENT_USER, team: "공정기술팀" } : s
    )
    updateTicket(ticket.id, {
      processStatus: "review",
      status: "In Progress",
      processFlow: flow,
      messages: [...(ticket.messages || []), {
        id: `msg-${Date.now()}`, ticketId: ticket.id, author: "System", role: "system" as const,
        messageType: "status_change" as const, content: `${CURRENT_USER}님이 이벤트를 접수하였습니다.`,
        timestamp: new Date().toISOString(),
      }],
    })
    setShowAcceptDialog(false)
    refreshTicket()
  }

  // Reject event
  const handleReject = () => {
    const flow: EventProcessStep[] = [
      { step: "issued", label: "이벤트 발행", status: "completed", assignee: ticket.requester, timestamp: ticket.createdDate },
      { step: "rejected", label: "반려", status: "completed", assignee: CURRENT_USER, team: "공정기술팀", timestamp: new Date().toLocaleString("ko-KR") },
    ]
    updateTicket(ticket.id, {
      processStatus: "rejected",
      status: "Closed",
      processFlow: flow,
      messages: [...(ticket.messages || []), {
        id: `msg-${Date.now()}`, ticketId: ticket.id, author: CURRENT_USER, role: "assignee" as const,
        messageType: "opinion" as const, content: rejectReason || "접수 단계에서 반려 처리되었습니다.",
        timestamp: new Date().toISOString(),
      }, {
        id: `msg-${Date.now() + 1}`, ticketId: ticket.id, author: "System", role: "system" as const,
        messageType: "status_change" as const, content: `이벤트가 반려 처리되었습니다. 사유: ${rejectReason || "별도 조치 불필요"}`,
        timestamp: new Date().toISOString(),
      }],
    })
    setShowRejectDialog(false)
    setRejectReason("")
    refreshTicket()
  }

  // Close event
  const handleClose = () => {
    const check = requiresClosureReport({
      type: "ticket", ticketType: ticket.ticketType, priority: ticket.priority,
      impact: ticket.impact, workPackageCount: ticket.workPackages.length,
    })
    setShowCloseDialog(false)
    if (check.required) {
      setShowClosureReport(true)
    } else {
      closeTicket(ticket.id)
      refreshTicket()
    }
  }

  const handleClosureReportSubmit = (report: ClosureReport) => {
    closeTicket(ticket.id)
    updateTicket(ticket.id, { processStatus: "closed", processFlow: ticket.processFlow?.map(s => ({ ...s, status: "completed" as const })) })
    refreshTicket()
    setShowClosureReport(false)
    alert("종료 Report가 조직장에게 결재 요청되었습니다.")
  }

  const isPending = ticket.processStatus === "issued"
  const isActive = ticket.processStatus === "review" || ticket.processStatus === "additional-review" || ticket.processStatus === "accepted"
  const isReviewComplete = ticket.processStatus === "review-complete"
  const isClosed = ticket.processStatus === "closed" || ticket.processStatus === "rejected"

  return (
    <div className="space-y-6">
      {/* Process Flow - always at the very top */}
      <ProcessFlowBar steps={ticket.processFlow} processStatus={ticket.processStatus} />

      {/* Pending acceptance banner */}
      {isPending && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-800">새로운 이벤트가 할당되었습니다. 접수 또는 반려를 결정해주세요.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 bg-white text-red-600 border-red-200 hover:bg-red-50" onClick={() => setShowRejectDialog(true)}>
                <XCircle className="h-3.5 w-3.5" />
                반려
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => setShowAcceptDialog(true)}>
                <CheckCircle className="h-3.5 w-3.5" />
                접수
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Basic Info + Context side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                <Badge variant="secondary" className={`text-xs ${
                  ticket.ticketType === "Trouble" ? "bg-orange-50 text-orange-700" :
                  ticket.ticketType === "Improvement" ? "bg-blue-50 text-blue-700" :
                  ticket.ticketType === "Analysis" ? "bg-emerald-50 text-emerald-700" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {ticket.ticketType === "Trouble" ? "트러블" : ticket.ticketType === "Improvement" ? "개선" : ticket.ticketType === "Analysis" ? "분석" : ticket.ticketType}
                </Badge>
                <Badge className={`text-xs ${ticket.priority === "P1" ? "bg-red-600 text-white" : ticket.priority === "P2" ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {ticket.priority}
                </Badge>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2 text-balance">{ticket.title}</h2>
              <p className="text-sm text-muted-foreground">{ticket.description}</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">요청자</p>
                <p className="text-sm font-medium text-foreground">{ticket.requester}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">담당자</p>
                <p className="text-sm font-medium text-foreground">{ticket.owner}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">공정 / 장치</p>
                <p className="text-sm font-medium text-foreground">{ticket.unit} / {ticket.equipment || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">마감일</p>
                <p className="text-sm font-medium text-foreground">{ticket.dueDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">영향</p>
                <p className="text-sm font-medium text-foreground">{ticket.impact}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">생성일</p>
                <p className="text-sm font-medium text-foreground">{ticket.createdDate}</p>
              </div>
            </div>
          </div>

          {ticket.tags && ticket.tags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] text-muted-foreground mb-1.5">관련 태그</p>
              <div className="flex flex-wrap gap-1.5">
                {ticket.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
              </div>
            </div>
          )}

          <Separator className="my-4" />
          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 bg-transparent">
                  <Search className="h-3.5 w-3.5" />
                  유사 이벤트 확인
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>유사 이벤트</DialogTitle>
                  <DialogDescription>메타정보 기준으로 파악된 유사 이벤트 목록입니다.</DialogDescription>
                </DialogHeader>
                <SimilarEventsDialog ticket={ticket} />
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8 bg-transparent">
                  <FileText className="h-3.5 w-3.5" />
                  유사 레포트 확인
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>유사 레포트</DialogTitle>
                  <DialogDescription>메타정보 기준으로 파악된 관련 레포트 목록입니다.</DialogDescription>
                </DialogHeader>
                <SimilarReportsContent ticket={ticket} />
              </DialogContent>
            </Dialog>
          </div>
        </Card>

        {/* Context Data */}
        <ContextDataPanel ticket={ticket} />
      </div>

      {/* Submitted Opinions */}
      <SubmittedOpinionsView opinions={ticket.opinions} />

      {/* Active working area */}
      {isActive && (
        <>
          <OpinionWritingCanvas
            ticketId={ticket.id}
            ticketType={ticket.ticketType}
            ticketUnit={ticket.unit}
            currentUser={CURRENT_USER}
            onSuccess={refreshTicket}
          />
          <AdditionalReviewerSection ticket={ticket} onAssign={refreshTicket} />
        </>
      )}

      {/* Review complete -> close */}
      {isReviewComplete && (
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-800">검토가 완료되었습니다. 종결 처리하세요.</p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => setShowCloseDialog(true)}>
              <CheckCircle className="h-3.5 w-3.5" />
              종결
            </Button>
          </div>
        </Card>
      )}

      {/* Thread / Comments tabs */}
      <Card className="p-6">
        <Tabs defaultValue="thread">
          <TabsList className="mb-4">
            <TabsTrigger value="thread">이벤트 히스토리</TabsTrigger>
            <TabsTrigger value="comments">댓글</TabsTrigger>
          </TabsList>
          <TabsContent value="thread">
            <ThreadHistory ticket={ticket} />
          </TabsContent>
          <TabsContent value="comments">
            <CommentsSection ticket={ticket} onUpdate={refreshTicket} />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Closed event summary */}
      {isClosed && ticket.executiveSummary && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">완료 보고서</h3>
          <div className="whitespace-pre-line text-sm text-muted-foreground bg-muted/30 p-4 rounded">{ticket.executiveSummary}</div>
          {ticket.closedDate && <p className="text-xs text-muted-foreground mt-3">완료일: {new Date(ticket.closedDate).toLocaleDateString("ko-KR")}</p>}
        </Card>
      )}

      {/* Close/Reopen for active events */}
      {!isClosed && !isPending && (
        <Card className="p-4 bg-muted/30">
          <div className="flex gap-2 justify-center">
            <Button variant="default" className="gap-2" onClick={() => setShowCloseDialog(true)}>
              <CheckCircle className="h-4 w-4" />
              종결
            </Button>
          </div>
        </Card>
      )}

      {isClosed && ticket.processStatus !== "rejected" && (
        <Card className="p-4 bg-muted/30">
          <div className="flex gap-2 justify-center">
            <Button variant="outline" className="gap-2 bg-transparent" onClick={() => {
              updateTicket(ticket.id, { processStatus: "review", status: "In Progress" })
              refreshTicket()
            }}>
              <RotateCcw className="h-4 w-4" />
              이벤트 재오픈
            </Button>
          </div>
        </Card>
      )}

      {/* Dialogs */}
      <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이벤트 접수</AlertDialogTitle>
            <AlertDialogDescription>이 이벤트를 접수하여 기술검토를 시작하시겠습니까?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleAccept}>접수</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이벤트 반려</AlertDialogTitle>
            <AlertDialogDescription>이 이벤트를 반려 처리합니다. 사유를 입력해주세요.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="반려 사유를 입력해주세요..." className="min-h-[100px]" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-destructive text-destructive-foreground">반려</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이벤트 종결</AlertDialogTitle>
            <AlertDialogDescription>이벤트를 종결 처리합니다. 유형 및 중요도에 따라 종료 Report 작성이 요구될 수 있습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose}>진행</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ClosureReportDialog
        open={showClosureReport} onOpenChange={setShowClosureReport}
        title={ticket.title} description={ticket.description}
        type="ticket" ticketType={ticket.ticketType} workPackages={ticket.workPackages.map(wp => wp.title)}
        onSubmit={handleClosureReportSubmit}
      />
    </div>
  )
}
