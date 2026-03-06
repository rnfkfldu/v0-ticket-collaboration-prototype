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
function MessageBubble({ 
  message, 
  isOwn,
  participants
}: { 
  message: any
  isOwn: boolean
  participants: { name: string; team: string }[]
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
                  "flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer hover:shadow-md transition-shadow",
                  isOwn ? "bg-amber-50 border-amber-200" : "bg-muted/50"
                )}
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

// 타임라인 뷰 컴포넌트
function TimelineView({ messages, participants }: { messages: any[], participants: { name: string; team: string }[] }) {
  // 날짜별로 그룹화
  const groupedByDate = messages.reduce((acc, msg) => {
    const date = new Date(msg.timestamp).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
    if (!acc[date]) acc[date] = []
    acc[date].push(msg)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="space-y-6 p-4">
      {Object.entries(groupedByDate).map(([date, msgs]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground px-2">{date}</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-3">
            {(msgs as any[]).map((msg, idx) => {
              const participant = participants.find(p => p.name === msg.author)
              const hasData = msg.dataBoxes && msg.dataBoxes.length > 0
              return (
                <div key={msg.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      hasData ? "bg-blue-500" : "bg-amber-400"
                    )} />
                    {idx < (msgs as any[]).length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{msg.author}</span>
                      {participant?.team && (
                        <Badge variant="outline" className="text-[9px]">{participant.team}</Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{msg.content}</p>
                    {hasData && (
                      <div className="flex gap-2 mt-2">
                        {msg.dataBoxes.map((box: DataInsertBox) => (
                          <Badge key={box.id} variant="secondary" className="text-[10px] gap-1">
                            {box.type === "trend" && <Activity className="h-3 w-3" />}
                            {box.type === "dcs" && <Monitor className="h-3 w-3" />}
                            {box.config.title}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
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
            <TimelineView messages={localMessages.filter(m => m.author !== "System")} participants={participants} />
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
    </div>
  )
}
