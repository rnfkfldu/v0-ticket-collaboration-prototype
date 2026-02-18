"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Send, 
  Building2, 
  MessageSquare, 
  Clock, 
  CheckCircle,
  FileText,
  Search,
  ExternalLink,
  Calendar,
  User,
  Paperclip,
  ChevronRight,
  Star,
  Archive,
  Zap,
  AlertTriangle,
  Phone
} from "lucide-react"
import { saveTicket } from "@/lib/storage"
import { useRouter } from "next/navigation"

// 라이센서 목록
const LICENSORS = [
  { id: "uop", name: "UOP (Honeywell)", specialty: "HCR, CCR, Isomerization", contact: "techsupport@uop.com" },
  { id: "axens", name: "Axens", specialty: "Hydroprocessing, Aromatics", contact: "support@axens.net" },
  { id: "shell", name: "Shell Catalysts & Technologies", specialty: "Hydrocracking, SMDS", contact: "catalyst@shell.com" },
  { id: "chevron", name: "Chevron Lummus Global", specialty: "ISOCRACKING, LC-FINING", contact: "tech@clg.com" },
  { id: "exxon", name: "ExxonMobil Chemical", specialty: "Lube Base Stock, Aromatics", contact: "techservice@exxonmobil.com" },
]

// 샘플 질의 이력
const SAMPLE_QUERIES = [
  {
    id: "Q-2025-001",
    licensor: "UOP (Honeywell)",
    licensorId: "uop",
    subject: "HCR Catalyst Activity Decline 관련 문의",
    status: "answered",
    priority: "high",
    createdDate: "2025-01-15",
    lastUpdate: "2025-01-18",
    category: "Technical Support",
    unit: "HCR",
    messages: [
      { author: "김지수", role: "internal", content: "HCR Unit Catalyst Activity가 예상보다 빠르게 감소하고 있습니다. WABT 기준 약 5°C/month 증가 추세입니다. 정상 범위인지, 추가 조치가 필요한지 검토 부탁드립니다.", timestamp: "2025-01-15 10:30" },
      { author: "John Smith (UOP)", role: "licensor", content: "귀사의 HCR 운전 데이터를 검토하였습니다. 5°C/month의 WABT 증가는 정상 범위 내에 있으나, Feed Quality 변화와 관련이 있을 수 있습니다. 첨부한 Technical Bulletin을 참고하시기 바랍니다.", timestamp: "2025-01-18 15:20" }
    ],
    attachments: ["HCR_Performance_Data.xlsx", "UOP_Technical_Bulletin_2025-01.pdf"],
    isStarred: true
  },
  {
    id: "Q-2025-002",
    licensor: "Axens",
    licensorId: "axens",
    subject: "CCR Regenerator Chloride Balance 이상",
    status: "pending",
    priority: "medium",
    createdDate: "2025-01-20",
    lastUpdate: "2025-01-20",
    category: "Technical Support",
    unit: "CCR",
    messages: [
      { author: "박영희", role: "internal", content: "CCR Regenerator의 Chloride Balance가 최근 불안정합니다. Chloride 주입량 대비 배출량이 맞지 않는 상황입니다. 점검 항목 및 조치 방안 자문 부탁드립니다.", timestamp: "2025-01-20 09:15" }
    ],
    attachments: ["CCR_Chloride_Data.xlsx"],
    isStarred: false
  },
  {
    id: "Q-2024-045",
    licensor: "Shell Catalysts & Technologies",
    licensorId: "shell",
    subject: "Hydrocracker Yield Pattern Optimization",
    status: "closed",
    priority: "low",
    createdDate: "2024-12-10",
    lastUpdate: "2024-12-20",
    category: "Performance Review",
    unit: "HCR",
    messages: [
      { author: "이철수", role: "internal", content: "연간 Performance Review를 위한 Yield Pattern 최적화 방안을 문의드립니다.", timestamp: "2024-12-10 14:00" },
      { author: "Sarah Lee (Shell)", role: "licensor", content: "Performance Review 결과 및 최적화 권고안을 첨부 드립니다. 주요 권고사항은 (1) H2/Oil Ratio 조정, (2) Space Velocity 최적화입니다.", timestamp: "2024-12-20 11:30" }
    ],
    attachments: ["Performance_Review_2024.pdf", "Optimization_Recommendations.pdf"],
    isStarred: true
  }
]

const CATEGORIES = ["Technical Support", "Performance Review", "Troubleshooting", "Design Review", "Training Request", "General Inquiry"]

export default function LicensorQueryPage() {
  const router = useRouter()
  const [showNewQueryDialog, setShowNewQueryDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterLicensor, setFilterLicensor] = useState<string>("all")
  const [selectedQuery, setSelectedQuery] = useState<typeof SAMPLE_QUERIES[0] | null>(null)
  const [activeTab, setActiveTab] = useState("active")
  const [newReply, setNewReply] = useState("")

  // 새 질의 폼 상태
  const [newLicensor, setNewLicensor] = useState("")
  const [newSubject, setNewSubject] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [newUnit, setNewUnit] = useState("")
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium")
  const [newContent, setNewContent] = useState("")
  const [queryMode, setQueryMode] = useState<"normal" | "urgent">("normal")
  const [showUrgentTalkDialog, setShowUrgentTalkDialog] = useState(false)
  const [urgentMessage, setUrgentMessage] = useState("")
  const [urgentLicensor, setUrgentLicensor] = useState("")

  const activeQueries = SAMPLE_QUERIES.filter(q => q.status !== "closed")
  const closedQueries = SAMPLE_QUERIES.filter(q => q.status === "closed")

  const filteredQueries = (activeTab === "active" ? activeQueries : closedQueries).filter(query => {
    const matchesSearch = query.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || query.status === filterStatus
    const matchesLicensor = filterLicensor === "all" || query.licensorId === filterLicensor
    return matchesSearch && matchesStatus && matchesLicensor
  })

  const handleCreateQuery = () => {
    alert(`라이센서 질의가 생성되었습니다: ${newSubject}`)
    setShowNewQueryDialog(false)
    // Reset form
    setNewLicensor("")
    setNewSubject("")
    setNewCategory("")
    setNewUnit("")
    setNewPriority("medium")
    setNewContent("")
    setQueryMode("normal")
  }

  const handleUrgentTalk = () => {
    if (!urgentLicensor || !urgentMessage.trim()) return
    const licensor = LICENSORS.find(l => l.id === urgentLicensor)
    alert(`긴급 메시지가 ${licensor?.name}에 전송되었습니다.\n\n메시지: ${urgentMessage}\n\n담당자가 곧 연락드릴 예정입니다.`)
    setShowUrgentTalkDialog(false)
    setUrgentLicensor("")
    setUrgentMessage("")
  }

  const handleSendReply = () => {
    if (!newReply.trim()) return
    alert("답변이 전송되었습니다.")
    setNewReply("")
  }

  const convertToTicket = (query: typeof SAMPLE_QUERIES[0]) => {
    const newTicket = {
      id: Date.now().toString(),
      title: `[라이센서 질의] ${query.subject}`,
      description: `라이센서: ${query.licensor}\n카테고리: ${query.category}\n\n${query.messages.map(m => `[${m.timestamp}] ${m.author}: ${m.content}`).join('\n\n')}`,
      ticketType: "Request" as const,
      priority: query.priority === "high" ? "P1" as const : query.priority === "medium" ? "P2" as const : "P3" as const,
      impact: "Quality" as const,
      owner: "김지수",
      requester: "김지수",
      status: "Open" as const,
      createdDate: query.createdDate,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      accessLevel: "Team" as const,
      allowedTeams: ["Process Engineering"],
      unit: query.unit,
      messages: query.messages.map((m, i) => ({
        id: `msg-${i}`,
        ticketId: "",
        author: m.author,
        role: m.role === "internal" ? "requester" as const : "assignee" as const,
        messageType: "response" as const,
        content: m.content,
        timestamp: m.timestamp
      })),
      workPackages: []
    }
    saveTicket(newTicket)
    alert("라이센서 질의가 티켓으로 변환되었습니다.")
    router.push("/")
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold text-foreground">라이센서 질의 관리</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 bg-transparent border-red-500 text-red-500 hover:bg-red-50" onClick={() => setShowUrgentTalkDialog(true)}>
                <Zap className="h-4 w-4" />
                긴급 톡
              </Button>
              <Button className="gap-2" onClick={() => setShowNewQueryDialog(true)}>
                <Plus className="h-4 w-4" />
                새 질의 작성
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* 설명 */}
          <Card className="mb-6 bg-amber-50 border-amber-200">
            <CardContent className="py-4">
              <p className="text-sm text-amber-800">
                <strong>중요:</strong> 라이센서(UOP, Axens, Shell 등)와의 기술 질의 내용은 정유공장의 핵심 기술 자산입니다. 
                모든 질의 내용은 티켓으로 변환하여 영구적으로 보관하시기 바랍니다.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-4 gap-6">
            {/* 좌측: 질의 목록 */}
            <div className="col-span-1 space-y-4">
              {/* 라이센서 바로가기 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">라이센서 포털</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {LICENSORS.map(licensor => (
                    <Button 
                      key={licensor.id} 
                      variant="ghost" 
                      className="w-full justify-start text-xs h-8"
                      onClick={() => window.open("#", "_blank")}
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      {licensor.name}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* 통계 */}
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">진행 중</span>
                    <Badge variant="secondary">{activeQueries.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">답변 대기</span>
                    <Badge variant="outline">{SAMPLE_QUERIES.filter(q => q.status === "pending").length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">완료</span>
                    <Badge>{closedQueries.length}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 중앙: 질의 목록 */}
            <div className="col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="active">진행 중 ({activeQueries.length})</TabsTrigger>
                    <TabsTrigger value="closed">완료 ({closedQueries.length})</TabsTrigger>
                  </TabsList>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-48"
                    />
                  </div>
                </div>

                <TabsContent value={activeTab} className="space-y-3">
                  {filteredQueries.map(query => (
                    <Card 
                      key={query.id} 
                      className={`cursor-pointer hover:shadow-md transition-shadow ${selectedQuery?.id === query.id ? "border-primary" : ""}`}
                      onClick={() => setSelectedQuery(query)}
                    >
                      <CardContent className="py-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {query.isStarred && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                              <Badge variant={query.status === "answered" ? "default" : query.status === "pending" ? "secondary" : "outline"}>
                                {query.status === "answered" ? "답변완료" : query.status === "pending" ? "대기중" : "종료"}
                              </Badge>
                              <Badge variant={query.priority === "high" ? "destructive" : query.priority === "medium" ? "secondary" : "outline"}>
                                {query.priority === "high" ? "긴급" : query.priority === "medium" ? "보통" : "낮음"}
                              </Badge>
                            </div>
                            <h4 className="font-medium text-sm mb-1">{query.subject}</h4>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{query.licensor}</span>
                              <span>{query.unit}</span>
                              <span>{query.lastUpdate}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>

            {/* 우측: 질의 상세 */}
            <div className="col-span-1">
              {selectedQuery ? (
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{selectedQuery.id}</Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Star className={`h-4 w-4 ${selectedQuery.isStarred ? "text-yellow-500 fill-yellow-500" : ""}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-sm">{selectedQuery.subject}</CardTitle>
                    <CardDescription className="text-xs">
                      {selectedQuery.licensor} | {selectedQuery.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* 메시지 */}
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {selectedQuery.messages.map((msg, i) => (
                        <div key={i} className={`p-2 rounded-lg text-xs ${msg.role === "internal" ? "bg-muted" : "bg-primary/10"}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs">{msg.author[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{msg.author}</span>
                            <span className="text-muted-foreground">{msg.timestamp}</span>
                          </div>
                          <p className="text-muted-foreground">{msg.content}</p>
                        </div>
                      ))}
                    </div>

                    {/* 첨부파일 */}
                    {selectedQuery.attachments.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium mb-2">첨부파일</p>
                        <div className="space-y-1">
                          {selectedQuery.attachments.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Paperclip className="h-3 w-3" />
                              <span className="truncate">{file}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 답변 입력 */}
                    {selectedQuery.status !== "closed" && (
                      <div className="pt-2 border-t">
                        <Textarea 
                          placeholder="추가 질의 입력..." 
                          className="text-xs min-h-16 mb-2"
                          value={newReply}
                          onChange={(e) => setNewReply(e.target.value)}
                        />
                        <Button size="sm" className="w-full" onClick={handleSendReply}>
                          <Send className="h-3 w-3 mr-1" />
                          전송
                        </Button>
                      </div>
                    )}

                    {/* 티켓 변환 */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full bg-transparent"
                      onClick={() => convertToTicket(selectedQuery)}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      티켓으로 자산화
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">질의를 선택하세요</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>

        {/* 새 질의 다이얼로그 */}
        <Dialog open={showNewQueryDialog} onOpenChange={setShowNewQueryDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                새 라이센서 질의 작성
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">라이센서 선택 *</label>
                <Select value={newLicensor} onValueChange={setNewLicensor}>
                  <SelectTrigger>
                    <SelectValue placeholder="라이센서 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {LICENSORS.map(l => (
                      <SelectItem key={l.id} value={l.id}>
                        <div>
                          <div>{l.name}</div>
                          <div className="text-xs text-muted-foreground">{l.specialty}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">제목 *</label>
                <Input 
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="질의 제목을 입력하세요"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">카테고리</label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit</label>
                  <Select value={newUnit} onValueChange={setNewUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {["CDU", "VDU", "HCR", "CCR", "NHT", "RFCC"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">우선순위</label>
                  <Select value={newPriority} onValueChange={(v: "high" | "medium" | "low") => setNewPriority(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">긴급</SelectItem>
                      <SelectItem value="medium">보통</SelectItem>
                      <SelectItem value="low">낮음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">질의 내용 *</label>
                <Textarea 
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="질의 내용을 상세히 작성해주세요"
                  className="min-h-32"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">첨부파일</label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50">
                  <Paperclip className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">파일 첨부</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewQueryDialog(false)}>취소</Button>
              <Button onClick={handleCreateQuery} disabled={!newLicensor || !newSubject || !newContent}>
                <Send className="h-4 w-4 mr-1" />
                질의 전송
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 긴급 톡 다이얼로그 */}
        <Dialog open={showUrgentTalkDialog} onOpenChange={setShowUrgentTalkDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Zap className="h-5 w-5" />
                긴급 라이센서 톡
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Card className="bg-red-50 border-red-200">
                <CardContent className="py-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <p className="text-xs text-red-700">
                      긴급 톡은 라이센서 담당자에게 즉시 알림이 전송됩니다. 
                      긴급한 기술 지원이 필요한 경우에만 사용해주세요.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">라이센서 선택 *</label>
                <Select value={urgentLicensor} onValueChange={setUrgentLicensor}>
                  <SelectTrigger>
                    <SelectValue placeholder="라이센서 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {LICENSORS.map(l => (
                      <SelectItem key={l.id} value={l.id}>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>{l.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {urgentLicensor && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">담당자 연락처</p>
                  <p className="text-sm font-medium">{LICENSORS.find(l => l.id === urgentLicensor)?.contact}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">긴급 메시지 *</label>
                <Textarea 
                  value={urgentMessage}
                  onChange={(e) => setUrgentMessage(e.target.value)}
                  placeholder="긴급 상황을 간략히 설명해주세요 (예: HCR Unit 긴급 셧다운 상황, 즉시 기술 지원 필요)"
                  className="min-h-24"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">콜백 연락처</label>
                <Input 
                  defaultValue="010-1234-5678"
                  placeholder="담당자가 연락할 번호"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUrgentTalkDialog(false)}>취소</Button>
              <Button 
                variant="destructive" 
                onClick={handleUrgentTalk} 
                disabled={!urgentLicensor || !urgentMessage.trim()}
                className="gap-2"
              >
                <Zap className="h-4 w-4" />
                긴급 전송
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
