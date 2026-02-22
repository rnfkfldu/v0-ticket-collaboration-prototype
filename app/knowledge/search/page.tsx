"use client"

import { useState, useRef, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Search, Send, FileText, BookOpen, Sparkles, Clock, ChevronRight,
  MessageSquare, Plus, Trash2, RotateCcw, ExternalLink, Copy, ThumbsUp, ThumbsDown
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: { title: string; type: string; id: string; relevance: number }[]
  timestamp: string
}

interface ChatSession {
  id: string
  title: string
  date: string
  messageCount: number
  preview: string
}

const PAST_SESSIONS: ChatSession[] = [
  { id: "s1", title: "HCR WABT 상승 원인 조회", date: "2025-02-04", messageCount: 6, preview: "HCR WABT 상승 추이와 관련된 과거 사례를 찾아줘" },
  { id: "s2", title: "E-101 Fouling 세정 이력", date: "2025-02-03", messageCount: 4, preview: "CDU E-101 열교환기 세정 이력과 효과 분석 자료" },
  { id: "s3", title: "FCC 촉매 교체 가이드", date: "2025-02-01", messageCount: 8, preview: "FCC 촉매 교체 시 주의사항과 SOP 문서" },
  { id: "s4", title: "VDU Heater Coking 관련 문서", date: "2025-01-28", messageCount: 5, preview: "VDU Heater Coking 진행 추이 분석 관련 레포트" },
  { id: "s5", title: "Steam Header 비상대응 절차", date: "2025-01-25", messageCount: 3, preview: "40kg Steam Header Pressure Loss 시 컨틴젼시 플랜" },
  { id: "s6", title: "CDU 원유 전환 시 운전 가이드", date: "2025-01-22", messageCount: 7, preview: "Crude Grade 변경 시 Operation Guide 확인" },
  { id: "s7", title: "CCR Regenerator 운전 이력", date: "2025-01-18", messageCount: 4, preview: "CCR 촉매 재생기 과거 트러블 이력 검색" },
]

const SUGGESTED_QUERIES = [
  "HCR 촉매 WABT 상승 관련 과거 분석 보고서를 찾아줘",
  "CDU 원유 Grade 변경 시 운전 가이드 및 SOP",
  "최근 6개월 내 열교환기 Fouling 관련 조치 이력",
  "FCC 촉매 활성도 저하 시 대응 절차",
]

const MOCK_RESPONSE: ChatMessage = {
  id: "a1",
  role: "assistant",
  content: `HCR WABT 상승과 관련된 문서를 검색했습니다. 총 **4건**의 관련 자료가 확인되었습니다.

**1. KA-001 | HCR WABT 상승 원인 분석 보고서** (2024-12-20)
- HCR 촉매 WABT 상승 추이 분석 및 EOR 시점 예측
- Arabian Medium 전환에 따른 영향도 평가 포함
- 결론: 현재 추세 기준 EOR까지 약 8개월 잔여

**2. KA-009 | HCR 수율 최적화 LP Vector 분석** (2021-05-12)
- Feed 조건 변화에 따른 WABT 영향 인자 분석
- Severity 조정 시 WABT trade-off 관계 정리

**3. 운전 가이드 | HCR Reactor 온도 조정 가이드** (v3)
- Reactor inlet 온도 변동 시 Feed rate 및 Quench 조정 절차
- WABT 상한 기준 및 조치 기준 포함

**4. 종결 이벤트 | TKT-2024-0156 HCR 촉매 교체 검토** (2024-11)
- 촉매 교체 시기 판단 근거 및 경제성 분석 포함

추가로 궁금한 사항이 있으시면 질문해 주세요.`,
  sources: [
    { title: "HCR WABT 상승 원인 분석 보고서", type: "최종 레포트", id: "KA-001", relevance: 97 },
    { title: "HCR 수율 최적화 LP Vector 분석", type: "최종 레포트", id: "KA-009", relevance: 82 },
    { title: "HCR Reactor 온도 조정 가이드", type: "운영 가이드", id: "GD-001", relevance: 78 },
    { title: "HCR 촉매 교체 검토 이벤트", type: "종결 이벤트", id: "TKT-2024-0156", relevance: 71 },
  ],
  timestamp: "10:32",
}

export default function DocSearchPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(true)
  const [historySearch, setHistorySearch] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const filteredSessions = PAST_SESSIONS.filter(s =>
    !historySearch || s.title.toLowerCase().includes(historySearch.toLowerCase())
  )

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: input, timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsLoading(true)
    setTimeout(() => {
      setMessages(prev => [...prev, { ...MOCK_RESPONSE, id: `a-${Date.now()}`, timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) }])
      setIsLoading(false)
    }, 1500)
  }

  const handleNewChat = () => {
    setMessages([])
    setInput("")
  }

  const handleLoadSession = (session: ChatSession) => {
    setMessages([
      { id: "u-hist", role: "user", content: session.preview, timestamp: "09:00" },
      { ...MOCK_RESPONSE, id: "a-hist", timestamp: "09:01" },
    ])
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const SOURCE_COLORS: Record<string, string> = {
    "최종 레포트": "bg-blue-50 text-blue-700 border-blue-200",
    "운영 가이드": "bg-green-50 text-green-700 border-green-200",
    "종결 이벤트": "bg-amber-50 text-amber-700 border-amber-200",
    "SOP": "bg-purple-50 text-purple-700 border-purple-200",
  }

  return (
    <AppShell>
      <div className="h-[calc(100vh-3.5rem)] flex bg-background">
        {/* Left: Chat History */}
        <div className={cn("border-r border-border bg-card flex flex-col transition-all", showHistory ? "w-72" : "w-0 overflow-hidden")}>
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">대화 내역</h2>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleNewChat}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="대화 검색..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredSessions.map(s => (
              <button
                key={s.id}
                type="button"
                className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors border-b border-border/50"
                onClick={() => handleLoadSession(s)}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <MessageSquare className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-xs font-medium truncate">{s.title}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground ml-5">
                  <span>{s.date}</span>
                  <span>{s.messageCount}건</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="border-b border-border px-4 py-2.5 flex items-center gap-3 bg-card">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowHistory(!showHistory)}>
              <ChevronRight className={cn("h-4 w-4 transition-transform", showHistory && "rotate-180")} />
            </Button>
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">AI 문서 검색</span>
            <span className="text-xs text-muted-foreground">GenAI 기반 통합 문서 검색 / RAG</span>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleNewChat}>
                <RotateCcw className="h-3 w-3" /> 새 대화
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">무엇을 찾으시나요?</h2>
                <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
                  레포트, 운영 가이드, SOP, 이벤트 이력 등 OOP 내 모든 문서를 AI가 검색합니다
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl w-full">
                  {SUGGESTED_QUERIES.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      className="flex items-start gap-2.5 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                      onClick={() => { setInput(q); }}
                    >
                      <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-xs">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map(msg => (
                  <div key={msg.id} className={cn("flex gap-3", msg.role === "user" && "justify-end")}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <div className={cn(
                      "rounded-xl px-4 py-3 max-w-[85%]",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border"
                    )}>
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">참조 문서</span>
                          {msg.sources.map((src, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-muted/50 cursor-pointer">
                              <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="font-medium truncate">{src.title}</span>
                              <Badge variant="outline" className={cn("text-[9px] h-4 shrink-0", SOURCE_COLORS[src.type] || "")}>
                                {src.type}
                              </Badge>
                              <span className="text-muted-foreground ml-auto shrink-0">{src.relevance}%</span>
                              <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                            </div>
                          ))}
                        </div>
                      )}
                      {msg.role === "assistant" && (
                        <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Copy className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><ThumbsUp className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><ThumbsDown className="h-3 w-3" /></Button>
                          <span className="text-[10px] text-muted-foreground ml-auto">{msg.timestamp}</span>
                        </div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <span className="text-[10px] text-muted-foreground self-end shrink-0">{msg.timestamp}</span>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                    </div>
                    <div className="bg-card border border-border rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:200ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:400ms]" />
                        </div>
                        문서를 검색하고 있습니다...
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border bg-card px-4 py-3">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="검색할 내용을 입력하세요... (예: HCR 촉매 WABT 관련 분석 보고서)"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    className="pr-10 h-10"
                  />
                </div>
                <Button onClick={handleSend} disabled={!input.trim() || isLoading} className="h-10 px-4">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                <span>검색 범위: 최종 레포트, 운영 가이드, SOP, 이벤트 이력, 운영 로그</span>
                <span className="ml-auto">RAG + Embedding 기반 검색</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
