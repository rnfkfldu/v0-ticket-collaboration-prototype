"use client"

import { useState, useRef, useEffect } from "react"
import type { Ticket, DataInsertBox } from "@/lib/types"
import { updateTicket } from "@/lib/storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { 
  Zap, Send, User, Clock, Building2, ChevronLeft, Activity, 
  Monitor, PlusCircle, Table as TableIcon, X, UserPlus,
  MessageSquare, History, FileText, Sparkles, CheckCircle, Loader2,
  RotateCcw, Pencil, TrendingUp, ArrowUpCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { DataInsertBoxConfig } from "@/components/data-insert-box-config"

// 참여자 추가 다이얼로그
function AddParticipantDialog({
  open,
  onClose,
  onAdd,
  existingParticipants
}: {
  open: boolean
  onClose: () => void
  onAdd: (participant: { name: string; team: string }) => void
  existingParticipants: string[]
}) {
  const [selectedTeam, setSelectedTeam] = useState("")
  const [selectedPerson, setSelectedPerson] = useState("")

  const teams = [
    { name: "공정기술팀", members: ["김지수", "박영희", "이정민", "최현우"] },
    { name: "생산조정팀", members: ["박성호", "이민석", "정태영"] },
    { name: "설비기술팀", members: ["한동훈", "윤서연", "강민호"] },
    { name: "품질관리팀", members: ["서지현", "임태호"] },
    { name: "에너지관리팀", members: ["정태영", "김현수"] },
    { name: "안전환경팀", members: ["오승민", "배현진"] },
  ]

  const availableMembers = selectedTeam 
    ? teams.find(t => t.name === selectedTeam)?.members.filter(m => !existingParticipants.includes(m)) || []
    : []

  const handleAdd = () => {
    if (selectedPerson && selectedTeam) {
      onAdd({ name: selectedPerson, team: selectedTeam })
      setSelectedTeam("")
      setSelectedPerson("")
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            참여자 추가
          </DialogTitle>
          <DialogDescription>
            다른 팀의 전문가를 대화에 초대하여 의견을 구할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>팀 선택</Label>
            <Select value={selectedTeam} onValueChange={(v) => { setSelectedTeam(v); setSelectedPerson("") }}>
              <SelectTrigger>
                <SelectValue placeholder="팀을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(t => (
                  <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedTeam && (
            <div className="space-y-2">
              <Label>담당자 선택</Label>
              <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                <SelectTrigger>
                  <SelectValue placeholder="담당자를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.length > 0 ? availableMembers.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  )) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">추가 가능한 인원이 없습니다</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>취소</Button>
            <Button size="sm" onClick={handleAdd} disabled={!selectedPerson}>추가</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// AI 레포트 생성 다이얼로그
function QuickInquiryReportDialog({
  open,
  onClose,
  ticket,
  messages,
  onSubmit
}: {
  open: boolean
  onClose: () => void
  ticket: Ticket
  messages: any[]
  onSubmit: () => void
}) {
  const [step, setStep] = useState<"generating" | "editing" | "preview">("generating")
  const [isGenerating, setIsGenerating] = useState(false)
  const [title, setTitle] = useState(`${ticket.title} - 빠른문의 종결 레포트`)
  const [summary, setSummary] = useState("")
  const [keyPoints, setKeyPoints] = useState("")
  const [conclusions, setConclusions] = useState("")
  const [followUp, setFollowUp] = useState("")

  const generateReport = () => {
    setIsGenerating(true)
    setTimeout(() => {
      // AI 기반 요약 생성 시뮬레이션
      const participants = [...new Set(messages.map(m => m.author))].join(", ")
      const messageCount = messages.length
      
      setSummary(`${ticket.unit} 공정 관련 "${ticket.title}" 문의에 대해 ${participants}의 의견 교환을 통해 해결되었습니다. 총 ${messageCount}건의 메시지가 교환되었으며, 핵심 내용이 아래와 같이 정리되었습니다.`)
      setKeyPoints(`1. 문의 배경: ${ticket.description}\n2. 주요 논의 사항: 운전 파라미터 확인 및 조정 방안 검토\n3. 데이터 분석 결과: 관련 트렌드 및 DCS 화면 검토 완료`)
      setConclusions(`- 현 상황은 정상 운전 범위 내로 판단됨\n- 지속적인 모니터링 권장\n- 필요시 추가 분석 진행 예정`)
      setFollowUp(`- 모니터링 주기: 일 1회\n- 담당자: ${ticket.owner}\n- 특이사항 발생 시 즉시 보고`)
      
      setIsGenerating(false)
      setStep("editing")
    }, 1500)
  }

  useEffect(() => {
    if (open && step === "generating" && !isGenerating) {
      generateReport()
    }
    if (!open) {
      setStep("generating")
      setIsGenerating(false)
    }
  }, [open])

  const handleSubmit = () => {
    onSubmit()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            빠른문의 종결 및 자산화
          </DialogTitle>
          <DialogDescription>
            AI가 대화 내용을 분석하여 레포트를 생성합니다. 검토 후 저장하면 조직 자산으로 등록됩니다.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 py-2">
          {["AI 생성", "검토/수정", "미리보기"].map((label, i) => {
            const stepIndex = i === 0 ? "generating" : i === 1 ? "editing" : "preview"
            const isActive = step === stepIndex
            const isDone = (step === "editing" && i === 0) || (step === "preview" && i <= 1)
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <div className={cn("h-px w-8", isDone || isActive ? "bg-amber-500" : "bg-border")} />}
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                  isActive ? "bg-amber-500 text-white" :
                  isDone ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
                )}>
                  {isDone ? <CheckCircle className="h-3 w-3" /> : <span>{i + 1}</span>}
                  {label}
                </div>
              </div>
            )
          })}
        </div>

        {step === "generating" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
              {isGenerating ? (
                <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
              ) : (
                <Sparkles className="h-8 w-8 text-amber-500" />
              )}
            </div>
            <div className="text-center">
              <p className="font-medium">{isGenerating ? "AI가 대화 내용을 분석 중..." : "레포트 생성 준비 중"}</p>
              <p className="text-sm text-muted-foreground mt-1">총 {messages.length}개의 메시지를 분석합니다</p>
            </div>
          </div>
        )}

        {step === "editing" && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-700">AI 초안 생성 완료</span>
              </div>
              <Button variant="ghost" size="sm" onClick={generateReport} className="text-xs gap-1">
                <RotateCcw className="h-3 w-3" />
                재생성
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label>레포트 제목</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>요약</Label>
              <Textarea value={summary} onChange={e => setSummary(e.target.value)} className="min-h-20" />
            </div>
            <div className="space-y-2">
              <Label>핵심 논의 사항</Label>
              <Textarea value={keyPoints} onChange={e => setKeyPoints(e.target.value)} className="min-h-20" />
            </div>
            <div className="space-y-2">
              <Label>결론</Label>
              <Textarea value={conclusions} onChange={e => setConclusions(e.target.value)} className="min-h-16" />
            </div>
            <div className="space-y-2">
              <Label>후속 조치</Label>
              <Textarea value={followUp} onChange={e => setFollowUp(e.target.value)} className="min-h-16" />
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 py-2">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-amber-50 p-4 border-b">
                <h3 className="font-semibold">{title}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>작성자: {ticket.owner}</span>
                  <span>작성일: {new Date().toLocaleDateString("ko-KR")}</span>
                  <Badge className="bg-amber-100 text-amber-700">빠른문의</Badge>
                </div>
              </div>
              <div className="p-4 space-y-4 text-sm">
                {[
                  { label: "요약", content: summary },
                  { label: "핵심 논의 사항", content: keyPoints },
                  { label: "결론", content: conclusions },
                  { label: "후속 조치", content: followUp },
                ].map(s => (
                  <div key={s.label}>
                    <h4 className="font-semibold text-foreground mb-1">{s.label}</h4>
                    <p className="text-muted-foreground whitespace-pre-line bg-muted/30 p-3 rounded">{s.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "editing" && (
            <>
              <Button variant="outline" onClick={onClose}>취소</Button>
              <Button onClick={() => setStep("preview")} className="bg-amber-500 hover:bg-amber-600">미리보기</Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("editing")}>
                <Pencil className="h-4 w-4 mr-1" />
                수정
              </Button>
              <Button onClick={handleSubmit} className="bg-amber-500 hover:bg-amber-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                종결 및 자산화
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// 메시지 버블 컴포넌트
function MessageBubble({ message, isOwn, participants, onDataBoxClick }: { 
  message: any
  isOwn: boolean
  participants: { name: string; team: string }[]
  onDataBoxClick?: (box: DataInsertBox) => void
}) {
  const participant = participants.find(p => p.name === message.author)
  const teamColor = participant?.team === "공정기술팀" ? "bg-primary/10 text-primary" :
                    participant?.team === "생산조정팀" ? "bg-amber-100 text-amber-700" :
                    participant?.team === "설비기술팀" ? "bg-emerald-100 text-emerald-700" :
                    participant?.team === "품질관리팀" ? "bg-purple-100 text-purple-700" :
                    "bg-muted text-muted-foreground"

  return (
    <div className={cn("flex gap-3", isOwn && "flex-row-reverse")}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className={cn("text-xs", teamColor)}>
          {message.author.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
      <div className={cn("max-w-[75%] space-y-1", isOwn && "items-end")}>
        <div className={cn("flex items-center gap-2", isOwn && "flex-row-reverse")}>
          <span className="text-xs font-medium">{message.author}</span>
          {participant?.team && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">{participant.team}</Badge>
          )}
          <span className="text-[10px] text-muted-foreground">
            {new Date(message.timestamp).toLocaleString("ko-KR", { 
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" 
            })}
          </span>
        </div>
        <div className={cn(
          "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
          isOwn 
            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-tr-sm" 
            : "bg-muted rounded-tl-sm"
        )}>
          {message.content}
        </div>
        {/* 첨부된 데이터 박스 */}
        {message.dataBoxes && message.dataBoxes.length > 0 && (
          <div className="space-y-2 mt-2">
            {message.dataBoxes.map((box: DataInsertBox) => (
              <div 
                key={box.id} 
                className={cn(
                  "flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]",
                  isOwn ? "bg-amber-50 border-amber-200 hover:border-amber-400" : "bg-muted/50 hover:bg-muted"
                )}
                onClick={() => onDataBoxClick?.(box)}
              >
                {box.type === "trend" && <Activity className="h-4 w-4 text-blue-600" />}
                {box.type === "dcs" && <Monitor className="h-4 w-4 text-emerald-600" />}
                {box.type === "table" && <TableIcon className="h-4 w-4 text-purple-600" />}
                <span className="font-medium">{box.config.title || `${box.type} 데이터`}</span>
                <Badge variant="outline" className="text-[10px] ml-auto">클릭하여 보기</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// 타임라인 뷰 - 주요 이벤트만 요약하여 표시
function TimelineView({ messages, participants, ticket }: { messages: any[], participants: { name: string; team: string }[], ticket: Ticket }) {
  // 타임라인 이벤트 추출
  type TimelineEvent = {
    id: string
    type: "created" | "first_response" | "participant_joined" | "data_attached" | "status_change" | "closed"
    title: string
    description: string
    timestamp: string
    icon: "zap" | "message" | "user" | "data" | "check" | "flag"
    color: string
    metadata?: any
  }

  const events: TimelineEvent[] = []

  // 1. 문의 생성
  const firstMsg = messages[0]
  if (firstMsg) {
    events.push({
      id: "created",
      type: "created",
      title: "빠른 문의 생성",
      description: `${ticket.requester}님이 "${ticket.title}" 문의를 등록했습니다.`,
      timestamp: firstMsg.timestamp,
      icon: "zap",
      color: "bg-amber-500",
    })
  }

  // 2. 최초 응답
  const firstResponse = messages.find(m => m.role === "assignee" && m.messageType !== "status_change")
  if (firstResponse) {
    events.push({
      id: "first_response",
      type: "first_response",
      title: "최초 응답",
      description: `${firstResponse.author}님이 문의에 응답했습니다.`,
      timestamp: firstResponse.timestamp,
      icon: "message",
      color: "bg-emerald-500",
    })
  }

  // 3. 참여자 추가 이벤트
  const participantMsgs = messages.filter(m => m.messageType === "status_change" && m.content?.includes("참여"))
  participantMsgs.forEach(msg => {
    events.push({
      id: msg.id,
      type: "participant_joined",
      title: "참여자 추가",
      description: msg.content,
      timestamp: msg.timestamp,
      icon: "user",
      color: "bg-blue-500",
    })
  })

  // 4. 데이터 첨부 이벤트
  messages.forEach(msg => {
    if (msg.dataBoxes && msg.dataBoxes.length > 0) {
      msg.dataBoxes.forEach((box: DataInsertBox) => {
        events.push({
          id: `data-${box.id}`,
          type: "data_attached",
          title: box.type === "trend" ? "트렌드 데이터 첨부" : box.type === "dcs" ? "DCS 화면 첨부" : "테이블 데이터 첨부",
          description: `${msg.author}님이 "${box.config.title || box.type}" 데이터를 첨부했습니다.`,
          timestamp: msg.timestamp,
          icon: "data",
          color: box.type === "trend" ? "bg-blue-500" : box.type === "dcs" ? "bg-emerald-500" : "bg-purple-500",
          metadata: { box },
        })
      })
    }
  })

  // 5. 상태 변경 이벤트 (종결 등)
  const statusMsgs = messages.filter(m => m.messageType === "status_change" && !m.content?.includes("참여"))
  statusMsgs.forEach(msg => {
    events.push({
      id: msg.id,
      type: "status_change",
      title: msg.content?.includes("종결") ? "문의 종결" : "상태 변경",
      description: msg.content,
      timestamp: msg.timestamp,
      icon: msg.content?.includes("종결") ? "flag" : "check",
      color: msg.content?.includes("종결") ? "bg-slate-500" : "bg-amber-500",
    })
  })

  // 시간순 정렬
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  // 통계 요약
  const totalMessages = messages.filter(m => m.messageType !== "status_change").length
  const dataCount = messages.reduce((acc, m) => acc + (m.dataBoxes?.length || 0), 0)
  const participantCount = participants.length

  const getIcon = (icon: string) => {
    switch (icon) {
      case "zap": return <Zap className="h-4 w-4 text-white" />
      case "message": return <MessageSquare className="h-4 w-4 text-white" />
      case "user": return <UserPlus className="h-4 w-4 text-white" />
      case "data": return <Activity className="h-4 w-4 text-white" />
      case "check": return <CheckCircle className="h-4 w-4 text-white" />
      case "flag": return <FileText className="h-4 w-4 text-white" />
      default: return <Clock className="h-4 w-4 text-white" />
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* 요약 통계 */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{totalMessages}</p>
          <p className="text-xs text-amber-700">총 메시지</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{dataCount}</p>
          <p className="text-xs text-blue-700">첨부 데이터</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{participantCount}</p>
          <p className="text-xs text-emerald-700">참여자</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-purple-600">{events.length}</p>
          <p className="text-xs text-purple-700">주요 이벤트</p>
        </div>
      </div>

      {/* 참여자 목록 */}
      <div className="bg-muted/30 rounded-lg p-4">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <User className="h-4 w-4" />
          참여자
        </h4>
        <div className="flex flex-wrap gap-2">
          {participants.map(p => (
            <div key={p.name} className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border">
              <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                {p.name[0]}
              </div>
              <span className="text-sm">{p.name}</span>
              <Badge variant="outline" className="text-[10px]">{p.team}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* 첨부된 데이터 목록 */}
      {dataCount > 0 && (
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            첨부된 데이터
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {messages.flatMap(m => m.dataBoxes || []).map((box: DataInsertBox) => (
              <div key={box.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border text-sm">
                {box.type === "trend" && <Activity className="h-4 w-4 text-blue-600" />}
                {box.type === "dcs" && <Monitor className="h-4 w-4 text-emerald-600" />}
                {box.type === "table" && <TableIcon className="h-4 w-4 text-purple-600" />}
                <span>{box.config.title || `${box.type} 데이터`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 이벤트 타임라인 */}
      <div>
        <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
          <History className="h-4 w-4" />
          이벤트 타임라인
        </h4>
        <div className="relative">
          {events.map((event, idx) => (
            <div key={event.id} className="flex gap-4 pb-6 last:pb-0">
              {/* 타임라인 라인 */}
              <div className="flex flex-col items-center">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", event.color)}>
                  {getIcon(event.icon)}
                </div>
                {idx < events.length - 1 && <div className="w-0.5 flex-1 bg-border mt-2" />}
              </div>
              {/* 이벤트 내용 */}
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{event.title}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString("ko-KR", { 
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" 
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function QuickInquiryDetail({ ticket }: { ticket: Ticket }) {
  const [newMessage, setNewMessage] = useState("")
  const [attachments, setAttachments] = useState<DataInsertBox[]>([])
  const [showDataConfig, setShowDataConfig] = useState(false)
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("chat")
  const [selectedDataBox, setSelectedDataBox] = useState<DataInsertBox | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [localMessages, setLocalMessages] = useState(ticket.messages || [])
  const [participants, setParticipants] = useState<{ name: string; team: string }[]>([
    { name: ticket.requester, team: "생산조정팀" },
    { name: ticket.owner, team: "공정기술팀" },
  ])
  const [isClosed, setIsClosed] = useState(ticket.status === "Closed")
  
  // 로그인 유저 (임시)
  const currentUser = "박영희"
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [localMessages])
  
  const handleSend = () => {
    if (!newMessage.trim() && attachments.length === 0) return
    
    const msg = {
      id: `qi-msg-${Date.now()}`,
      ticketId: ticket.id,
      author: currentUser,
      role: "assignee" as const,
      messageType: "response" as const,
      content: newMessage,
      timestamp: new Date().toISOString(),
      dataBoxes: attachments.length > 0 ? attachments : undefined,
    }
    
    const updatedMessages = [...localMessages, msg]
    setLocalMessages(updatedMessages)
    updateTicket(ticket.id, { messages: updatedMessages })
    setNewMessage("")
    setAttachments([])
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleAddParticipant = (participant: { name: string; team: string }) => {
    setParticipants(prev => [...prev, participant])
    // 시스템 메시지 추가
    const sysMsg = {
      id: `qi-msg-${Date.now()}`,
      ticketId: ticket.id,
      author: "System",
      role: "system" as const,
      messageType: "status_change" as const,
      content: `${participant.name}님(${participant.team})이 대화에 참여했습니다.`,
      timestamp: new Date().toISOString(),
    }
    const updatedMessages = [...localMessages, sysMsg]
    setLocalMessages(updatedMessages)
    updateTicket(ticket.id, { messages: updatedMessages })
  }

  const handleCloseInquiry = () => {
    setIsClosed(true)
    updateTicket(ticket.id, { status: "Closed" })
    // 시스템 메시지 추가
    const sysMsg = {
      id: `qi-msg-${Date.now()}`,
      ticketId: ticket.id,
      author: "System",
      role: "system" as const,
      messageType: "status_change" as const,
      content: `빠른 문의가 종결되었습니다. AI 레포트가 생성되어 조직 자산으로 등록되었습니다.`,
      timestamp: new Date().toISOString(),
    }
    const updatedMessages = [...localMessages, sysMsg]
    setLocalMessages(updatedMessages)
    updateTicket(ticket.id, { messages: updatedMessages })
  }

  const handleAddDataBox = (box: DataInsertBox) => {
    setAttachments(prev => [...prev, box])
    setShowDataConfig(false)
  }

  // 기술검토 요청으로 등급 상향
  const handleUpgradeToTechnicalReview = () => {
    const processFlow = [
      { step: "issued" as const, label: "이벤트 발행", status: "completed" as const, assignee: ticket.requester, team: "생산조정팀", timestamp: ticket.createdDate },
      { step: "accepted" as const, label: "접수", status: "completed" as const, assignee: ticket.owner, team: "공정기술팀", timestamp: new Date().toLocaleString("ko-KR") },
      { step: "review" as const, label: "기술검토", status: "current" as const, assignee: ticket.owner, team: "공정기술팀" },
      { step: "publisher-confirm" as const, label: "발행자 확인", status: "upcoming" as const },
      { step: "closed" as const, label: "종결", status: "upcoming" as const },
    ]
    
    // 기존 채팅 내용을 기술검토 의견으로 변환하여 히스토리에 추가
    const sysMsg = {
      id: `msg-${Date.now()}`,
      ticketId: ticket.id,
      author: "System",
      role: "system" as const,
      messageType: "status_change" as const,
      content: `빠른 문의에서 기술검토 요청으로 전환되었습니다. 기존 대화 내용 ${localMessages.length}건이 이력으로 보존됩니다.`,
      timestamp: new Date().toISOString(),
    }
    
    updateTicket(ticket.id, {
      ticketType: "Improvement",
      processStatus: "review",
      processFlow,
      status: "In Progress",
      messages: [...localMessages, sysMsg],
    })
    
    // 기술검토 상세 페이지로 이동
    window.location.href = `/tickets/${ticket.id}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-background flex flex-col">
      {/* 헤더 */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/actions/tickets">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
              <ChevronLeft className="h-4 w-4" />
              목록
            </Button>
          </Link>
          <div className="h-8 w-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold truncate">{ticket.title}</h1>
              <Badge className={cn(
                "text-[10px] flex-shrink-0",
                isClosed ? "bg-muted text-muted-foreground" : "bg-amber-100 text-amber-700 hover:bg-amber-100"
              )}>
                {isClosed ? "종결됨" : "빠른 문의"}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {ticket.unit}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {ticket.requester}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {ticket.createdDate}
              </span>
            </div>
          </div>
          {/* 액션 버튼들 */}
          {!isClosed && (
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => setShowUpgradeDialog(true)}
              >
                <ArrowUpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">기술검토로 전환</span>
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
                onClick={() => setShowReportDialog(true)}
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">종결 및 자산화</span>
              </Button>
            </div>
          )}
        </div>
        
        {/* 탭 헤더 */}
        <div className="px-4 border-t bg-muted/30">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-10 bg-transparent gap-4 p-0">
              <TabsTrigger 
                value="chat" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none px-1 pb-2"
              >
                <MessageSquare className="h-4 w-4 mr-1.5" />
                대화
              </TabsTrigger>
              <TabsTrigger 
                value="timeline" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none px-1 pb-2"
              >
                <History className="h-4 w-4 mr-1.5" />
                타임라인
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* 참여자 표시 */}
      <div className="px-4 py-2 bg-white border-b flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">참여자:</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {participants.map(p => (
            <Badge key={p.name} variant="secondary" className="text-[10px] gap-1">
              <User className="h-2.5 w-2.5" />
              {p.name}
              <span className="text-muted-foreground">({p.team})</span>
            </Badge>
          ))}
        </div>
        {!isClosed && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground ml-auto"
            onClick={() => setShowAddParticipant(true)}
          >
            <UserPlus className="h-3 w-3" />
            추가
          </Button>
        )}
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" ? (
          <ScrollArea className="h-[calc(100vh-260px)]" ref={scrollRef}>
            <div className="p-4 space-y-4 max-w-3xl mx-auto">
              {/* 시작 메시지 */}
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 rounded-full text-xs text-amber-700">
                  <Zap className="h-3 w-3" />
                  {ticket.requester}님이 빠른 문의를 시작했습니다
                </div>
              </div>
              
              {/* 메시지 목록 */}
              {localMessages.map((msg) => (
                msg.author === "System" ? (
                  <div key={msg.id} className="text-center py-2">
                    <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                      {msg.content}
                    </span>
                  </div>
                ) : (
                  <MessageBubble 
                    key={msg.id} 
                    message={msg} 
                    isOwn={msg.author === currentUser}
                    participants={participants}
                    onDataBoxClick={setSelectedDataBox}
                  />
                )
              ))}

              {isClosed && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-xs text-muted-foreground">
                    <CheckCircle className="h-3 w-3" />
                    이 문의는 종결되었습니다
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="h-[calc(100vh-260px)]">
            <TimelineView messages={localMessages} participants={participants} ticket={ticket} />
          </ScrollArea>
        )}
      </div>

      {/* 입력 영역 */}
      {!isClosed && (
        <div className="border-t bg-white p-3">
          <div className="max-w-3xl mx-auto">
            {/* 첨부된 데이터 미리보기 */}
            {attachments.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {attachments.map((box, idx) => (
                  <div key={box.id} className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs">
                    {box.type === "trend" && <Activity className="h-3 w-3 text-blue-600" />}
                    {box.type === "dcs" && <Monitor className="h-3 w-3 text-emerald-600" />}
                    {box.type === "table" && <TableIcon className="h-3 w-3 text-purple-600" />}
                    <span>{box.config.title}</span>
                    <button 
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2 items-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-shrink-0 h-10 gap-1.5"
                onClick={() => setShowDataConfig(true)}
              >
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">데이터</span>
              </Button>
              <div className="flex-1 relative">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
                  className="min-h-[40px] max-h-[120px] resize-none pr-12 py-2.5"
                  rows={1}
                />
              </div>
              <Button 
                size="sm" 
                className="flex-shrink-0 h-10 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={handleSend}
                disabled={!newMessage.trim() && attachments.length === 0}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
              트렌드, DCS 화면, 표 데이터를 첨부하여 의견을 교환할 수 있습니다
            </p>
          </div>
        </div>
      )}
      
      {/* 데이터 추가 다이얼로그 */}
      <Dialog open={showDataConfig} onOpenChange={setShowDataConfig}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>데이터 추가</DialogTitle>
          </DialogHeader>
          <DataInsertBoxConfig 
            onConfirm={handleAddDataBox} 
            onCancel={() => setShowDataConfig(false)} 
            defaultUnit={ticket.unit} 
          />
        </DialogContent>
      </Dialog>

      {/* 참여자 추가 다이얼로그 */}
      <AddParticipantDialog 
        open={showAddParticipant}
        onClose={() => setShowAddParticipant(false)}
        onAdd={handleAddParticipant}
        existingParticipants={participants.map(p => p.name)}
      />

      {/* 종결 레포트 다이얼로그 */}
      <QuickInquiryReportDialog
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        ticket={ticket}
        messages={localMessages}
        onSubmit={handleCloseInquiry}
      />

      {/* 기술검토 전환 다이얼로그 */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-blue-600" />
              기술검토 요청으로 전환
            </DialogTitle>
            <DialogDescription>
              빠른 문의를 정식 기술검토 요청으로 전환합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">전환 시 변경사항</h4>
              <ul className="text-xs text-blue-700 space-y-1.5">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  기존 대화 내용 {localMessages.length}건이 이력으로 보존됩니다.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  정식 프로세스 플로우(접수→기술검토→발행자확인→종결)가 적용됩니다.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  추가 검토자 배정, Work Package 관리 등 고급 기능을 사용할 수 있습니다.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  공식 기술검토 의견서 및 종결 레포트가 작성됩니다.
                </li>
              </ul>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700">
                <strong>참고:</strong> 전환 후에는 빠른 문의 형태로 되돌릴 수 없습니다.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              취소
            </Button>
            <Button 
              onClick={handleUpgradeToTechnicalReview}
              className="bg-blue-600 hover:bg-blue-700 gap-1.5"
            >
              <ArrowUpCircle className="h-4 w-4" />
              기술검토로 전환
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 데이터 뷰어 다이얼로그 */}
      <Dialog open={!!selectedDataBox} onOpenChange={(open) => !open && setSelectedDataBox(null)}>
        <DialogContent className="!max-w-[95vw] !w-[1400px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDataBox?.type === "trend" && <Activity className="h-5 w-5 text-blue-600" />}
              {selectedDataBox?.type === "dcs" && <Monitor className="h-5 w-5 text-emerald-600" />}
              {selectedDataBox?.type === "table" && <TableIcon className="h-5 w-5 text-purple-600" />}
              {selectedDataBox?.config.title || "데이터 보기"}
            </DialogTitle>
            <DialogDescription>
              {selectedDataBox?.type === "trend" && "트렌드 데이터 조회 결과입니다."}
              {selectedDataBox?.type === "dcs" && "DCS 화면 캡처입니다."}
              {selectedDataBox?.type === "table" && "테이블 데이터입니다."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {selectedDataBox && <DataBoxViewer dataBox={selectedDataBox} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 데이터 박스 뷰어 컴포넌트
function DataBoxViewer({ dataBox }: { dataBox: DataInsertBox }) {
  if (dataBox.type === "trend") {
    return <TrendDataViewer config={dataBox.config} />
  }
  if (dataBox.type === "dcs") {
    return <DCSViewer config={dataBox.config} />
  }
  if (dataBox.type === "table") {
    return <TableDataViewer config={dataBox.config} />
  }
  return null
}

// 트렌드 데이터 뷰어
function TrendDataViewer({ config }: { config: any }) {
  const tags = config.tags || []
  const fromDate = config.fromDate || "2026-03-01"
  const toDate = config.toDate || "2026-03-06"
  
  // 목업 데이터 생성
  const generateMockData = (tag: string) => {
    const data = []
    const baseValue = tag.startsWith("TI") ? 350 : tag.startsWith("PI") ? 150 : tag.startsWith("FI") ? 80 : 100
    for (let i = 0; i < 48; i++) {
      const hour = Math.floor(i / 2)
      const date = new Date(fromDate)
      date.setHours(hour, (i % 2) * 30, 0, 0)
      data.push({
        time: date.toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        value: baseValue + Math.sin(i / 5) * 10 + (Math.random() - 0.5) * 5
      })
    }
    return data
  }
  
  const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6"]
  
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">조회 기간:</span>
          <span className="font-medium">{fromDate} ~ {toDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">태그:</span>
          <span className="font-medium">{tags.join(", ") || "없음"}</span>
        </div>
      </div>
      
      {tags.length > 0 ? (
        <div className="space-y-6">
          {tags.map((tag: string, idx: number) => {
            const data = generateMockData(tag)
            const color = COLORS[idx % COLORS.length]
            return (
              <div key={tag} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-mono font-semibold">{tag}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    현재: <span className="font-medium text-foreground">{data[data.length - 1].value.toFixed(1)}</span>
                  </div>
                </div>
                <div className="h-40 w-full">
                  <svg viewBox="0 0 800 160" className="w-full h-full" preserveAspectRatio="none">
                    {/* Grid lines */}
                    {[0, 40, 80, 120, 160].map(y => (
                      <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#e5e7eb" strokeWidth="1" />
                    ))}
                    {/* Data line */}
                    <polyline
                      points={data.map((d, i) => `${(i / (data.length - 1)) * 800},${160 - ((d.value - Math.min(...data.map(x => x.value))) / (Math.max(...data.map(x => x.value)) - Math.min(...data.map(x => x.value)) || 1)) * 140 - 10}`).join(" ")}
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{data[0].time}</span>
                  <span>{data[data.length - 1].time}</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          조회할 태그가 없습니다.
        </div>
      )}
    </div>
  )
}

// DCS 화면 뷰어
function DCSViewer({ config }: { config: any }) {
  const graphicNumber = config.graphicNumber || "DCS-001"
  
  // 더 많은 목업 계기 데이터
  const mockTags = [
    { tag: "TI-101", value: 354.9, unit: "°C", desc: "Feed 입구 온도" },
    { tag: "PI-201", value: 401.1, unit: "kPa", desc: "반응기 압력" },
    { tag: "FI-301", value: 458.9, unit: "m³/h", desc: "Feed 유량" },
    { tag: "TI-102", value: 369.2, unit: "°C", desc: "1단 반응기 온도" },
    { tag: "TI-103", value: 403.5, unit: "°C", desc: "2단 반응기 온도" },
    { tag: "LI-401", value: 67.3, unit: "%", desc: "분리기 레벨" },
    { tag: "PI-202", value: 385.7, unit: "kPa", desc: "출구 압력" },
    { tag: "FI-302", value: 312.4, unit: "m³/h", desc: "제품 유량" },
    { tag: "TI-104", value: 288.6, unit: "°C", desc: "분리기 온도" },
  ]
  
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Monitor className="h-5 w-5 text-emerald-600" />
        <span className="text-sm text-muted-foreground">화면 번호:</span>
        <Badge variant="secondary" className="text-sm px-3 py-1">{graphicNumber}</Badge>
      </div>
      <div className="border rounded-xl overflow-hidden bg-slate-900 min-h-[600px] flex flex-col">
        {/* 상단 헤더 */}
        <div className="bg-slate-800 px-6 py-3 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400 font-mono text-lg">{graphicNumber}</span>
            <span className="text-slate-400 text-sm">| HCR Unit Overview</span>
          </div>
          <div className="text-slate-500 text-sm">
            {new Date().toLocaleString("ko-KR")}
          </div>
        </div>
        
        {/* 메인 DCS 화면 영역 */}
        <div className="flex-1 p-6">
          {/* 공정 다이어그램 영역 */}
          <div className="bg-slate-800/50 rounded-lg p-6 mb-6 min-h-[200px] flex items-center justify-center border border-slate-700">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto bg-slate-700 rounded-xl flex items-center justify-center mb-4">
                <Monitor className="h-16 w-16 text-emerald-400" />
              </div>
              <p className="text-slate-400 text-lg">공정 P&ID 다이어그램</p>
              <p className="text-slate-500 text-sm mt-2">실제 환경에서는 DCS 시스템과 연동됩니다</p>
            </div>
          </div>
          
          {/* 계기 그리드 - 3x3 */}
          <div className="grid grid-cols-3 gap-4">
            {mockTags.map((item) => (
              <div key={item.tag} className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-emerald-500/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-emerald-400 font-mono text-sm">{item.tag}</p>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <p className="text-white text-3xl font-bold mb-1">
                  {(item.value + (Math.random() - 0.5) * 2).toFixed(1)}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-sm">{item.unit}</p>
                  <p className="text-slate-600 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 하단 상태바 */}
        <div className="bg-slate-800 px-6 py-2 flex items-center justify-between border-t border-slate-700 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-emerald-400">● 정상 운전</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">알람: 0건</span>
          </div>
          <span className="text-slate-500">Last Updated: {new Date().toLocaleTimeString("ko-KR")}</span>
        </div>
      </div>
    </div>
  )
}

// 테이블 데이터 뷰어
function TableDataViewer({ config }: { config: any }) {
  const tableName = config.tableName || "데이터 테이블"
  
  // 목업 테이블 데이터
  const mockData = [
    { tag: "TI-101", desc: "Feed 입구 온도", value: 248.35, unit: "°C", status: "Normal" },
    { tag: "TI-102", desc: "1단 반응기 온도", value: 369.04, unit: "°C", status: "Normal" },
    { tag: "TI-103", desc: "2단 반응기 온도", value: 403.04, unit: "°C", status: "Warning" },
    { tag: "PI-201", desc: "반응기 입구 압력", value: 152.8, unit: "kPa", status: "Normal" },
    { tag: "FI-301", desc: "Feed 유량", value: 137.5, unit: "m³/h", status: "Normal" },
  ]
  
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <TableIcon className="h-4 w-4 text-purple-600" />
        <span className="text-sm text-muted-foreground">테이블:</span>
        <span className="font-medium">{tableName}</span>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">태그</th>
              <th className="text-left p-3 font-medium">설명</th>
              <th className="text-right p-3 font-medium">현재값</th>
              <th className="text-center p-3 font-medium">단위</th>
              <th className="text-center p-3 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((row, i) => (
              <tr key={row.tag} className={cn("border-t", row.status === "Warning" && "bg-amber-50")}>
                <td className="p-3 font-mono text-primary">{row.tag}</td>
                <td className="p-3">{row.desc}</td>
                <td className="p-3 text-right font-medium">{row.value}</td>
                <td className="p-3 text-center text-muted-foreground">{row.unit}</td>
                <td className="p-3 text-center">
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    row.status === "Warning" ? "text-amber-600 border-amber-200 bg-amber-50" : "text-emerald-600 border-emerald-200 bg-emerald-50"
                  )}>
                    {row.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
