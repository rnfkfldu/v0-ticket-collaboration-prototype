"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  BookOpen, 
  Database,
  ChevronDown,
  Settings,
  User,
  Bell,
  Bot,
  Send,
  AlertTriangle,
  Clock,
  CheckCircle,
  ExternalLink,
  Globe,
  Plus,
  Target,
  CircleHelp,
  BarChart3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useUser, USER_PROFILES, getRoleDescription, getDepartmentLabel, type UserProfile } from "@/lib/user-context"
import { Wrench } from "lucide-react"

interface MainMenuItem {
  id: string
  label: string
  href: string
  icon: React.ElementType
  description: string
  requiresFlag?: keyof Pick<UserProfile, "showStrategicTasks" | "showDataSettings" | "showOptimization">
}

const mainMenus: MainMenuItem[] = [
  { 
    id: "operations",
    label: "운전 현황", 
    href: "/operations",
    icon: Activity,
    description: "실시간 운전 현황 모니터링"
  },
  { 
    id: "actions",
    label: "운전 조치", 
    href: "/alerts",
    icon: Zap,
    description: "이벤트 및 조치 관리"
  },
  { 
    id: "optimization",
    label: "공정 최적화", 
    href: "/optimization/ai-ml",
    icon: TrendingUp,
    description: "공정 최적화 및 인사이트",
    requiresFlag: "showOptimization"
  },
  { 
    id: "roadmap",
    label: "전략 과제", 
    href: "/roadmap",
    icon: Target,
    description: "TA Worklist 및 전략 과제 관리",
    requiresFlag: "showStrategicTasks"
  },
  { 
    id: "knowledge",
    label: "지식/문서", 
    href: "/knowledge/search",
    icon: BookOpen,
    description: "문서 검색 및 지식 관리"
  },
  { 
    id: "data-admin",
    label: "데이터/설정", 
    href: "/admin",
    icon: Database,
    description: "데이터 관리 및 시스템 설정",
    requiresFlag: "showDataSettings"
  },
  { 
    id: "review",
    label: "리뷰/KPI", 
    href: "/review/monthly",
    icon: BarChart3,
    description: "운전 리뷰 및 KPI 거버넌스"
  },
]

// Get filtered menus based on user role
function getFilteredMenus(user: UserProfile): MainMenuItem[] {
  return mainMenus.filter(menu => {
    if (!menu.requiresFlag) return true
    return user[menu.requiresFlag] !== false
  })
}

// 샘플 알람 데이터
const recentAlerts = [
  {
    id: "ALT-001",
    title: "HCR Reactor Inlet Temp High",
    severity: "critical",
    timestamp: "2분 전",
    unit: "HCR",
    tagId: "TI-2001"
  },
  {
    id: "ALT-002",
    title: "VDU Column Pressure Low",
    severity: "warning",
    timestamp: "15분 전",
    unit: "VDU",
    tagId: "PI-1501"
  },
  {
    id: "ALT-003",
    title: "CDU Feed Flow Deviation",
    severity: "warning",
    timestamp: "32분 전",
    unit: "CDU",
    tagId: "FI-1001"
  },
]

// 샘플 채팅 메시지
interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export function TopNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, setCurrentUser } = useUser()
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [showUserSwitchDialog, setShowUserSwitchDialog] = useState(false)
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "안녕하세요! OOP Assistant입니다. 공정 운전 현황, 데이터 분석, 이벤트 관리 등에 대해 질문해 주세요.",
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    }
  ])

  // 현재 경로에 따라 활성 메뉴 판단
  const getActiveMenu = () => {
    if (pathname.startsWith("/operations")) return "operations"
    if (pathname.startsWith("/review")) return "review"
    if (pathname.startsWith("/optimization")) return "optimization"
    if (pathname.startsWith("/roadmap")) return "roadmap"
    if (pathname.startsWith("/knowledge")) return "knowledge"
    if (pathname.startsWith("/admin")) return "data-admin"
    if (pathname.startsWith("/oop-outside")) return "oop-outside"
    if (pathname.startsWith("/help")) return "help"
    if (pathname.startsWith("/alerts") || pathname.startsWith("/actions") || pathname.startsWith("/dashboard") || pathname.startsWith("/tickets") || pathname.startsWith("/new-ticket")) return "actions"
    return "operations"
  }

  const activeMenu = getActiveMenu()
  const filteredMenus = getFilteredMenus(currentUser)

  const handleSendMessage = () => {
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    }

    setChatMessages([...chatMessages, userMessage])
    setChatInput("")

    // 시뮬레이션된 AI 응답
    setTimeout(() => {
      let responseContent = ""
      const lowerInput = chatInput.toLowerCase()
      
      if (lowerInput.includes("온도") || lowerInput.includes("temperature")) {
        responseContent = "현재 주요 온도 현황입니다:\n\n- HCR Reactor Inlet: 392°C (Guide: 390°C) - 주의\n- VDU Column Top: 125°C (정상)\n- CDU Preheater Outlet: 365°C (정상)\n\nHCR Reactor Inlet 온도가 Guide 대비 2°C 높은 상황입니다. 상세 트렌드를 확인하시겠습니까?"
      } else if (lowerInput.includes("알람") || lowerInput.includes("alert")) {
        responseContent = "현재 활성 알람 현황:\n\n- Critical: 1건 (HCR Reactor Temp High)\n- Warning: 2건\n- Standing Alert: 3건\n\nMy Alert 페이지에서 상세 내용을 확인하실 수 있습니다."
      } else if (lowerInput.includes("이벤트") || lowerInput.includes("ticket")) {
        responseContent = "현재 이벤트 현황입니다:\n\n- Open: 5건\n- In Progress: 8건\n- 마감 임박 (7일 이내): 3건\n\n가장 우선순위가 높은 이벤트은 'HCR 촉매 성능 저하 분석' (P1)입니다."
      } else if (lowerInput.includes("촉매") || lowerInput.includes("catalyst")) {
        responseContent = "HCR 촉매 현황 요약:\n\n- 현재 WABT: 385°C\n- SOR WABT: 370°C\n- EOR Target: 400°C\n- 예상 수명: 약 8개월\n\n최근 WABT 상승률이 증가하고 있어 주의가 필요합니다."
      } else {
        responseContent = `"${chatInput}"에 대해 분석 중입니다. 공정 데이터, 운전 이력, 관련 문서를 검색하여 답변드리겠습니다.\n\n더 구체적인 질문(예: 특정 Unit, Tag, 기간 등)을 해주시면 정확한 정보를 제공해 드릴 수 있습니다.`
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
      }
      setChatMessages(prev => [...prev, assistantMessage])
    }, 1000)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-700 border-red-200"
      case "warning": return "bg-amber-100 text-amber-700 border-amber-200"
      default: return "bg-blue-100 text-blue-700 border-blue-200"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "warning": return <Clock className="h-4 w-4 text-amber-500" />
      default: return <CheckCircle className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#00695C] bg-[#00897B]">
      <div className="flex h-12 items-center px-4">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2.5 mr-8">
          <div className="w-7 h-7 rounded bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-xs">OOP</span>
          </div>
          <span className="font-semibold text-sm text-white hidden md:block tracking-wide">공정운영최적화플랫폼</span>
        </Link>

        {/* 메인 메뉴 */}
        <nav className="flex items-center gap-0.5 flex-1">
          {filteredMenus.map((menu) => {
            const Icon = menu.icon
            const isActive = activeMenu === menu.id
            return (
              <Link
                key={menu.id}
                href={menu.href}
                prefetch={true}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded text-sm font-medium",
                  isActive 
                    ? "bg-white/20 text-white" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <span>{menu.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* 우측 액션 */}
        <div className="flex items-center gap-2">
          {/* 이벤트 생성 버튼 */}
          <Link href="/new-ticket">
            <Button 
              size="sm" 
              className="gap-1.5 bg-white/20 hover:bg-white/30 text-white border-0 h-8 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden md:inline">이벤트 생성</span>
            </Button>
          </Link>

          {/* OOP Assistant 버튼 */}
          <Sheet open={isAssistantOpen} onOpenChange={setIsAssistantOpen}>
            <SheetTrigger asChild>
              <Button size="sm" className="gap-1.5 bg-white/10 hover:bg-white/20 text-white border-0 h-8 text-xs">
                <Bot className="h-3.5 w-3.5" />
                <span className="hidden md:inline">AI Chat</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[500px] flex flex-col p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                  OOP Assistant
                </SheetTitle>
              </SheetHeader>
              
              {/* 채팅 메시지 영역 */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === "user" && "flex-row-reverse"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        message.role === "assistant" ? "bg-primary/10" : "bg-muted"
                      )}>
                        {message.role === "assistant" ? (
                          <Bot className="h-4 w-4 text-primary" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <div className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2",
                        message.role === "assistant" 
                          ? "bg-muted" 
                          : "bg-primary text-primary-foreground"
                      )}>
                        <p className="text-sm whitespace-pre-line">{message.content}</p>
                        <span className={cn(
                          "text-xs mt-1 block",
                          message.role === "assistant" ? "text-muted-foreground" : "text-primary-foreground/70"
                        )}>
                          {message.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* 입력 영역 */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="질문을 입력하세요..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs bg-transparent"
                    onClick={() => setChatInput("현재 알람 현황을 알려줘")}
                  >
                    알람 현황
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs bg-transparent"
                    onClick={() => setChatInput("HCR 촉매 상태는?")}
                  >
                    촉매 상태
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs bg-transparent"
                    onClick={() => setChatInput("내 이벤트 현황")}
                  >
                    이벤트 현황
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* 외부 협업 */}
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
            onClick={() => router.push("/oop-outside")}
            title="외부 협업"
          >
            <Globe className="h-4 w-4" />
          </Button>

          {/* 게시판 */}
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
            onClick={() => router.push("/help/notice")}
            title="게시판"
          >
            <CircleHelp className="h-4 w-4" />
          </Button>

          {/* 알림 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-white/70 hover:text-white hover:bg-white/10 h-8 w-8">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {recentAlerts.length}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">알람</h4>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-xs p-0 h-auto"
                    onClick={() => router.push("/alerts")}
                  >
                    전체 보기
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
              <ScrollArea className="max-h-80">
                <div className="p-2 space-y-2">
                  {recentAlerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                        getSeverityColor(alert.severity)
                      )}
                      onClick={() => router.push(`/alerts?selected=${alert.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{alert.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {alert.unit}
                            </Badge>
                            <span className="text-xs opacity-70">{alert.tagId}</span>
                          </div>
                        </div>
                        <span className="text-xs opacity-70 whitespace-nowrap">{alert.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-3 border-t bg-muted/30">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-red-600 font-medium">Critical: 1</span>
                    <span className="text-amber-600 font-medium">Warning: 2</span>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => router.push("/alerts")}
                  >
                    My Alert
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* 사용자 메뉴 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 text-white/80 hover:text-white hover:bg-white/10 h-8">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-xs leading-tight text-white">{currentUser.name}</span>
                </div>
                <ChevronDown className="h-3 w-3 text-white/60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 border-b">
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">{currentUser.roleLabel} | 담당 {currentUser.assignedProcessIds.length}개 공정</p>
              </div>
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                프로필
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowUserSwitchDialog(true)}>
                <Settings className="h-4 w-4 mr-2" />
                설정 (계정 전환)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 계정 전환 다이얼로그 */}
      <Dialog open={showUserSwitchDialog} onOpenChange={setShowUserSwitchDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>계정 전환</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-3 py-2">
              {USER_PROFILES.map((profile) => {
                const isActive = currentUser.id === profile.id
                return (
                  <button
                    key={profile.id}
                    className={cn(
                      "w-full text-left border rounded-lg p-4 transition-colors cursor-pointer",
                      isActive
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => {
                      setCurrentUser(profile)
                      setShowUserSwitchDialog(false)
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                          isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {profile.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{profile.name}</p>
                          <p className="text-xs text-muted-foreground">{profile.roleLabel}</p>
                        </div>
                      </div>
                      {isActive && (
                        <Badge variant="secondary" className="text-xs">현재</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 ml-11">
                      {getRoleDescription(profile.role)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 ml-11">
                      담당 공정: {profile.assignedProcessIds.length}개
                      {profile.division && ` | ${profile.division} 부문`}
                    </p>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </header>
  )
}
