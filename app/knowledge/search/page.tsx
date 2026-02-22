"use client"

import { useState, useRef, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search, Send, Bot, User, FileText, Clock, ChevronRight,
  BookOpen, Sparkles, ExternalLink, RotateCcw, MessageSquare, Plus, Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  sources?: { title: string; type: string; id: string }[]
}

interface ConversationThread {
  id: string
  title: string
  date: string
  messageCount: number
  preview: string
}

const PAST_THREADS: ConversationThread[] = [
  { id: "t1", title: "HCR WABT 상승 원인 분석", date: "2025-02-04", messageCount: 8, preview: "WABT 상승 추이와 관련된 과거 사례를 찾아줘..." },
  { id: "t2", title: "CDU Feed Pump 비상 절차", date: "2025-02-03", messageCount: 5, preview: "CDU Feed Pump Trip 시 대응 절차를 알려줘..." },
  { id: "t3", title: "VDU Heater Coking 관련 레포트", date: "2025-02-01", messageCount: 12, preview: "VDU Heater Coking 진행 관련 과거 분석 자료..." },
  { id: "t4", title: "FCC 촉매 재생 주기 최적화", date: "2025-01-28", messageCount: 6, preview: "FCC 촉매 재생 주기를 최적화한 사례가 있어?" },
  { id: "t5", title: "E-101 Fouling 세정 이력", date: "2025-01-25", messageCount: 9, preview: "E-101 열교환기 세정 이력과 효과 분석..." },
  { id: "t6", title: "Opportunity Crude 운전 영향", date: "2025-01-20", messageCount: 7, preview: "기회 원유 처리 시 운전 주의사항 정리..." },
  { id: "t7", title: "SRU Tail Gas 농도 초과 대응", date: "2025-01-15", messageCount: 4, preview: "SRU Tail Gas SO2 농도 초과 시 조치 방법..." },
  { id: "t8", title: "HCR 수율 최적화 LP Vector", date: "2025-01-10", messageCount: 11, preview: "HCR 수율 최적화를 위한 LP Vector 분석..." },
]

const INITIAL_MESSAGE: ChatMessage = {
  id: "init",
  role: "assistant",
  content: "안녕하세요! OOP 문서 검색 AI입니다.\n\n운전 사례, 레포트, 가이드, 절차서 등 모든 OOP 문서를 자연어로 검색할 수 있습니다. 질문해 주세요.",
  timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
}

const QUICK_QUERIES = [
  "HCR WABT 상승 관련 과거 사례 조회",
  "CDU 원유 전환 시 운전 가이드",
  "최근 3개월 종결된 Fouling 관련 이벤트",
  "VDU Heater Coking 관련 레포트",
  "비상 대응 절차 - Steam Loss",
]

function simulateResponse(query: string): { content: string; sources: ChatMessage["sources"] } {
  const q = query.toLowerCase()
  if (q.includes("wabt") || q.includes("촉매") || q.includes("hcr")) {
    return {
      content: "HCR WABT 관련 문서를 검색했습니다.\n\n**주요 검색 결과:**\n\n1. **HCR WABT 상승 원인 분석 보고서** (KA-001)\n   - 2024.12.20 / 김철수 / 촉매 WABT 상승 추이 분석 및 EOR 시점 예측\n   - Arabian Medium 전환 영향 평가 포함\n\n2. **HCR 수율 최적화 LP Vector 분석** (KA-009)\n   - 2021.05.12 / 박엔지니어 / LP Vector 기반 수율 최적화 제안\n\n3. **운전 가이드: HCR Reactor 온도 조정**\n   - Reactor Inlet 온도 변동 시 Feed Rate 및 Quench 조정 절차\n\n추가로 관련 이벤트 이력 3건, 알람 이력 5건이 있습니다. 특정 항목의 상세 내용을 확인하시겠습니까?",
      sources: [
        { title: "HCR WABT 상승 원인 분석 보고서", type: "레포트", id: "KA-001" },
        { title: "HCR 수율 최적화 LP Vector 분석", type: "분석", id: "KA-009" },
        { title: "HCR Reactor 온도 조정 가이드", type: "가이드", id: "G-001" },
      ],
    }
  }
  if (q.includes("fouling") || q.includes("열교환기") || q.includes("세정")) {
    return {
      content: "Fouling 관련 문서를 검색했습니다.\n\n**주요 검색 결과:**\n\n1. **E-101 Fouling 세정 효과 분석** (KA-002)\n   - 2024.11.15 / 박엔지니어 / 화학 세정 전후 UA값 비교\n\n2. **장기건전성 모니터링 - Fouling 현황**\n   - 현재 Red 1건, Yellow 3건 감지 중\n   - F-E102A Feed/Effluent HEX #2A 즉시 조치 필요\n\n3. **이벤트 TKT-2024-0045: E-101 세정 계획**\n   - 종결 / Online Cleaning 실시 후 UA값 85% 회복\n\n관련 트렌드나 상세 분석이 필요하시면 말씀해 주세요.",
      sources: [
        { title: "E-101 Fouling 세정 효과 분석", type: "레포트", id: "KA-002" },
        { title: "Fouling 건전성 현황", type: "모니터링", id: "HEALTH-F" },
        { title: "E-101 세정 계획 이벤트", type: "이벤트", id: "TKT-2024-0045" },
      ],
    }
  }
  if (q.includes("비상") || q.includes("절차") || q.includes("steam") || q.includes("trip")) {
    return {
      content: "비상 대응 절차 관련 문서를 검색했습니다.\n\n**주요 검색 결과:**\n\n1. **SCN-001: CDU Feed Pump Total Failure**\n   - Decision Tree 기반 대응 절차 / 최종 검토: 2025.01.15\n\n2. **SCN-002: Steam Header Pressure Loss**\n   - Boiler 추가 가동 / 감량 운전 절차 포함\n\n3. **SCN-003: HCR Compressor Trip**\n   - Auto Restart / Manual 대응 절차\n\n해당 절차서의 Decision Tree를 바로 확인하시겠습니까?",
      sources: [
        { title: "CDU Feed Pump Failure 절차", type: "절차서", id: "SCN-001" },
        { title: "Steam Header Loss 절차", type: "절차서", id: "SCN-002" },
        { title: "HCR Compressor Trip 절차", type: "절차서", id: "SCN-003" },
      ],
    }
  }
  return {
    content: `"${query}"에 대해 OOP 문서를 검색 중입니다.\n\n관련 레포트 2건, 운전 가이드 1건, 이벤트 이력 4건을 찾았습니다.\n\n더 구체적인 키워드(공정명, 장치명, 기간 등)를 포함하시면 정확한 결과를 제공합니다.`,
    sources: [
      { title: "관련 레포트 (2건)", type: "레포트", id: "search" },
      { title: "관련 이벤트 이력 (4건)", type: "이벤트", id: "search" },
    ],
  }
}

export default function DocSearchPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    setTimeout(() => {
      const { content, sources } = simulateResponse(input)
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content,
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        sources,
      }
      setMessages(prev => [...prev, aiMsg])
      setIsLoading(false)
    }, 1200)
  }

  const handleNewChat = () => {
    setMessages([INITIAL_MESSAGE])
    setSelectedThread(null)
  }

  const handleSelectThread = (t: ConversationThread) => {
    setSelectedThread(t.id)
    setMessages([
      { id: "h1", role: "user", content: t.preview, timestamp: "09:00" },
      { id: "h2", role: "assistant", content: `"${t.title}" 관련 이전 대화 내역을 불러왔습니다. 총 ${t.messageCount}개의 메시지가 있습니다.\n\n이전 검색 결과를 기반으로 추가 질문하실 수 있습니다.`, timestamp: "09:01" },
    ])
  }

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-48px)]">
        {/* Sidebar - conversation history */}
        <div className={cn(
          "border-r border-border bg-card flex flex-col shrink-0 transition-all duration-200",
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        )}>
          <div className="p-3 border-b flex items-center justify-between">
            <h2 className="text-sm font-semibold">대화 이력</h2>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleNewChat}>
              <Plus className="h-3 w-3" />
              새 대화
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {PAST_THREADS.map(t => (
                <button
                  key={t.id}
                  className={cn(
                    "w-full text-left p-2.5 rounded-lg transition-colors group",
                    selectedThread === t.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                  )}
                  onClick={() => handleSelectThread(t)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{t.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{t.preview}</p>
                    </div>
                    <Trash2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                    <span>{t.date}</span>
                    <span>{t.messageCount}개 메시지</span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="border-b border-border bg-card px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <MessageSquare className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-semibold">문서 검색 (AI)</h1>
                <p className="text-[11px] text-muted-foreground">레포트, 이벤트, 가이드, 절차서 등 OOP 전체 문서를 자연어로 검색</p>
              </div>
            </div>
            <div className="ml-auto">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleNewChat}>
                <RotateCcw className="h-3 w-3" /> 초기화
              </Button>
            </div>
          </header>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map(msg => (
                <div key={msg.id} className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    msg.role === "assistant" ? "bg-primary/10" : "bg-muted"
                  )}>
                    {msg.role === "assistant" ? <Bot className="h-4 w-4 text-primary" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className={cn(
                    "max-w-[85%] rounded-xl px-4 py-3",
                    msg.role === "assistant" ? "bg-muted/60" : "bg-primary text-primary-foreground"
                  )}>
                    <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
                        <p className="text-[11px] font-medium text-muted-foreground">참조 문서</p>
                        {msg.sources.map((s, i) => (
                          <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-background/60 cursor-pointer hover:bg-background transition-colors">
                            <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-xs truncate flex-1">{s.title}</span>
                            <Badge variant="outline" className="text-[9px] h-4 shrink-0">{s.type}</Badge>
                            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}
                    <span className={cn(
                      "text-[10px] mt-2 block",
                      msg.role === "assistant" ? "text-muted-foreground" : "text-primary-foreground/70"
                    )}>{msg.timestamp}</span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted/60 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      문서 검색 중...
                    </div>
                  </div>
                </div>
              )}

              {/* Quick queries shown only on initial state */}
              {messages.length === 1 && (
                <div className="mt-8">
                  <p className="text-xs text-muted-foreground mb-3">자주 검색하는 질문</p>
                  <div className="grid grid-cols-1 gap-2">
                    {QUICK_QUERIES.map((q, i) => (
                      <button
                        key={i}
                        className="text-left p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors flex items-center gap-3 group"
                        onClick={() => { setInput(q); }}
                      >
                        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm">{q}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-border bg-card p-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-2">
                <Input
                  placeholder="문서를 검색하세요... (예: HCR WABT 상승 관련 과거 사례)"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                OOP 레포트, 이벤트 이력, 운전 가이드, 절차서, 용어 등 전체 문서를 AI 기반으로 검색합니다
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
