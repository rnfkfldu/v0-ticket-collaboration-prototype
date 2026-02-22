"use client"

import { useState, useRef, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search, Send, Bot, User, FileText, Clock, MessageSquare, Plus,
  ThumbsUp, ThumbsDown, ExternalLink, Loader2, ChevronRight, Trash2, BookOpen
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: { title: string; type: string; relevance: number; href: string }[]
  timestamp: string
}

interface Conversation {
  id: string
  title: string
  lastMessage: string
  date: string
  messageCount: number
}

const PAST_CONVERSATIONS: Conversation[] = [
  { id: "conv-1", title: "HCR WABT 상승 원인 관련 문서", lastMessage: "HCR WABT 상승 추이와 관련된 보고서 3건을 찾았습니다...", date: "2025-02-04", messageCount: 6 },
  { id: "conv-2", title: "E-101 Fouling 세정 이력", lastMessage: "E-101 화학 세정 관련 절차서와 분석 보고서입니다...", date: "2025-02-03", messageCount: 4 },
  { id: "conv-3", title: "CDU Crude Blend 변경 사례", lastMessage: "Opportunity Crude 도입 시 운전 영향 분석 보고서...", date: "2025-02-01", messageCount: 8 },
  { id: "conv-4", title: "FCC 촉매 교체 기준", lastMessage: "FCC 촉매 교체 관련 SOP와 Pilot 평가 보고서...", date: "2025-01-28", messageCount: 3 },
  { id: "conv-5", title: "VDU Heater Coking 관리", lastMessage: "VDU Heater Coking 진행 추이 분석 보고서...", date: "2025-01-25", messageCount: 5 },
  { id: "conv-6", title: "2024 4Q Monthly Review 참고", lastMessage: "2024년 4분기 월간 운전 리뷰 리포트입니다...", date: "2025-01-20", messageCount: 2 },
]

const SUGGESTED_QUERIES = [
  "HCR 촉매 수명 관련 최근 분석 보고서 찾아줘",
  "CDU 열교환기 Fouling 관련 세정 이력이 있어?",
  "FCC 촉매 재생 최적화 관련 문서",
  "지난 TA 때 VDU Heater Coking 조치 이력",
]

export default function DocSearchPage() {
  const [conversations] = useState(PAST_CONVERSATIONS)
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const handleSend = (text?: string) => {
    const query = text || input
    if (!query.trim()) return
    const userMsg: ChatMessage = { id: `m-${Date.now()}`, role: "user", content: query, timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `m-${Date.now() + 1}`,
        role: "assistant",
        content: getAIResponse(query),
        sources: getAISources(query),
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages(prev => [...prev, botMsg])
      setIsTyping(false)
    }, 1500)
  }

  const loadConversation = (convId: string) => {
    setSelectedConvId(convId)
    const conv = conversations.find(c => c.id === convId)
    if (!conv) return
    setMessages([
      { id: "hist-1", role: "user", content: conv.title.replace(" 관련 문서", "").replace(" 관련", "") + "에 대해서 알려줘", timestamp: "10:00" },
      { id: "hist-2", role: "assistant", content: conv.lastMessage, sources: [
        { title: `${conv.title} 분석 보고서`, type: "분석", relevance: 95, href: "#" },
        { title: `${conv.title.split(" ")[0]} 운전 가이드`, type: "가이드", relevance: 82, href: "#" },
      ], timestamp: "10:01" },
    ])
  }

  const startNewChat = () => {
    setSelectedConvId(null)
    setMessages([])
    setInput("")
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-card shrink-0">
          <div className="px-6 py-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">문서 검색</h1>
              <Badge variant="outline" className="ml-2 text-[10px]">GenAI</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">AI 기반으로 보고서, 절차서, 운전 가이드, 이력 등 모든 문서를 자연어로 검색합니다</p>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Conversation History */}
          <aside className="w-72 border-r border-border bg-muted/20 flex flex-col shrink-0">
            <div className="p-3 border-b border-border">
              <Button onClick={startNewChat} className="w-full gap-2" size="sm">
                <Plus className="h-4 w-4" />
                새 대화
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <p className="text-[10px] font-medium text-muted-foreground px-2 py-1.5">이전 대화</p>
              <div className="space-y-0.5">
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    className={cn(
                      "w-full text-left p-2.5 rounded-lg transition-colors group",
                      selectedConvId === conv.id
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/60"
                    )}
                    onClick={() => loadConversation(conv.id)}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{conv.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-muted-foreground">{conv.date}</span>
                          <span className="text-[9px] text-muted-foreground">{conv.messageCount}개 메시지</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Right: Chat Area */}
          <main className="flex-1 flex flex-col min-w-0">
            {messages.length === 0 ? (
              /* Empty state */
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="max-w-lg text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">문서를 검색해 보세요</h2>
                  <p className="text-sm text-muted-foreground mb-8">보고서, SOP, 운전 가이드, 이벤트 이력 등 모든 문서를 자연어로 질문할 수 있습니다.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SUGGESTED_QUERIES.map((q, i) => (
                      <button
                        key={i}
                        className="p-3 text-left text-xs rounded-lg border border-border hover:bg-muted/50 hover:border-primary/30 transition-colors"
                        onClick={() => handleSend(q)}
                      >
                        <Search className="h-3.5 w-3.5 text-muted-foreground mb-1.5" />
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Chat messages */
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map(msg => (
                  <div key={msg.id} className={cn("flex gap-3", msg.role === "user" && "justify-end")}>
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className={cn("max-w-[75%]", msg.role === "user" ? "order-first" : "")}>
                      <div className={cn(
                        "rounded-xl p-4 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-muted/50 border border-border"
                      )}>
                        {msg.content}
                      </div>
                      {/* Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          <p className="text-[10px] font-medium text-muted-foreground px-1">참고 문서</p>
                          {msg.sources.map((src, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border text-xs hover:bg-muted/30 transition-colors cursor-pointer">
                              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="flex-1 truncate font-medium">{src.title}</span>
                              <Badge variant="outline" className="text-[9px] h-4 shrink-0">{src.type}</Badge>
                              <span className="text-[10px] text-emerald-600 font-medium shrink-0">{src.relevance}%</span>
                              <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Feedback for assistant */}
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-1.5 mt-2 px-1">
                          <span className="text-[10px] text-muted-foreground mr-1">{msg.timestamp}</span>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><ThumbsUp className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><ThumbsDown className="h-3 w-3" /></Button>
                        </div>
                      )}
                      {msg.role === "user" && (
                        <div className="text-right mt-1 px-1">
                          <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                        </div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="rounded-xl p-4 bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        문서를 검색하고 있습니다...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input area */}
            <div className="border-t border-border p-4 bg-card shrink-0">
              <div className="flex items-center gap-2 max-w-3xl mx-auto">
                <Input
                  placeholder="문서에 대해 질문하세요... (예: HCR 촉매 교체 기준 문서 찾아줘)"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                  className="flex-1"
                />
                <Button onClick={() => handleSend()} disabled={!input.trim() || isTyping} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2">AI가 OOP 시스템 내 문서를 검색하여 답변합니다. 정확한 정보는 원문을 확인하세요.</p>
            </div>
          </main>
        </div>
      </div>
    </AppShell>
  )
}

function getAIResponse(query: string): string {
  if (query.includes("촉매") && query.includes("HCR")) {
    return "HCR 촉매 관련 문서 3건을 찾았습니다.\n\n1. 'HCR WABT 상승 원인 분석 보고서' (2024-12-20) - HCR 촉매 WABT 상승 추이 분석 및 EOR 시점 예측 보고서로, Arabian Medium 전환에 따른 영향도 평가가 포함되어 있습니다.\n\n2. 'HCR 수율 최적화 LP Vector 분석' (2021-05-12) - HCR 수율 최적화를 위한 LP Vector 분석으로 운전 조건 변경에 따른 촉매 부하 변화를 다루고 있습니다.\n\n3. 'Bio Diesel 원료 혼합 테스트 결과' (2024-06-15) - Bio Diesel 혼합비 변경이 촉매에 미치는 영향 분석 결과입니다."
  }
  if (query.includes("Fouling") || query.includes("세정") || query.includes("열교환기")) {
    return "CDU 열교환기 Fouling 및 세정 관련 문서 2건을 찾았습니다.\n\n1. 'E-101 Fouling 세정 효과 분석' (2024-11-15) - E-101 화학 세정 전후 UA값 비교 분석 보고서로, 세정 주기 최적화 제안이 포함되어 있습니다.\n\n2. CDU 열교환기 네트워크 Fouling 관리 절차서 (SOP-CDU-005) - 정기 세정 절차 및 Online Cleaning 판단 기준을 다루고 있습니다."
  }
  if (query.includes("FCC") && query.includes("촉매")) {
    return "FCC 촉매 관련 문서 2건을 찾았습니다.\n\n1. 'FCC 신규 촉매 Pilot 평가 보고서' (2023-11-20) - 신규 촉매 후보 3종에 대한 Pilot 테스트 결과 및 성능 비교 분석 보고서입니다.\n\n2. FCC Catalyst Management 운전 가이드 (OG-FCC-003) - 촉매 보충량 계산, E-Cat 관리 기준, 재생 최적화 가이드입니다."
  }
  if (query.includes("VDU") || query.includes("Coking") || query.includes("TA")) {
    return "VDU Heater Coking 관련 문서를 찾았습니다.\n\n1. 'VDU Heater Coking 진행 추이 분석' (2024-08-10) - VDU Heater 튜브 내 Coking 진행 추이와 TMT 관리 기준을 다룬 분석 보고서입니다. 이전 TA에서 수행한 Decoking 결과와 비교 데이터도 포함되어 있습니다.\n\n2. TA-2023 VDU Heater 정비 보고서 - Mechanical Decoking 작업 결과 및 튜브 두께 측정 기록입니다."
  }
  return `"${query}"에 대한 검색 결과입니다.\n\n관련 문서 2건을 확인했습니다. 아래 참고 문서에서 상세 내용을 확인하실 수 있습니다. 추가 질문이 있으시면 말씀해 주세요.`
}

function getAISources(query: string): { title: string; type: string; relevance: number; href: string }[] {
  if (query.includes("촉매") && query.includes("HCR")) {
    return [
      { title: "HCR WABT 상승 원인 분석 보고서", type: "종료 Report", relevance: 96, href: "#" },
      { title: "HCR 수율 최적화 LP Vector 분석", type: "분석", relevance: 84, href: "#" },
      { title: "Bio Diesel 원료 혼합 테스트 결과", type: "종료 Report", relevance: 71, href: "#" },
    ]
  }
  if (query.includes("Fouling") || query.includes("세정") || query.includes("열교환기")) {
    return [
      { title: "E-101 Fouling 세정 효과 분석", type: "분석", relevance: 94, href: "#" },
      { title: "CDU 열교환기 네트워크 Fouling 관리 절차서", type: "SOP", relevance: 78, href: "#" },
    ]
  }
  if (query.includes("FCC") && query.includes("촉매")) {
    return [
      { title: "FCC 신규 촉매 Pilot 평가 보고서", type: "분석", relevance: 92, href: "#" },
      { title: "FCC Catalyst Management 운전 가이드", type: "가이드", relevance: 85, href: "#" },
    ]
  }
  if (query.includes("VDU") || query.includes("Coking") || query.includes("TA")) {
    return [
      { title: "VDU Heater Coking 진행 추이 분석", type: "분석", relevance: 93, href: "#" },
      { title: "TA-2023 VDU Heater 정비 보고서", type: "TA Report", relevance: 80, href: "#" },
    ]
  }
  return [
    { title: "관련 문서 1", type: "문서", relevance: 75, href: "#" },
    { title: "관련 문서 2", type: "문서", relevance: 62, href: "#" },
  ]
}
