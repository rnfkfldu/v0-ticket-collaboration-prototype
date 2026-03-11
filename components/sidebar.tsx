"use client"

import React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Bell, 
  Inbox,
  LayoutDashboard,
  FileText,
  MessageSquare,
  BookOpen,
  Settings,
  Clock,
  AlertTriangle,
  Building2,
  Database,
  HelpCircle,
  BarChart3,
  Activity,
  Monitor,
  Gauge,
  Eye,
  Zap,
  TrendingUp,
  Cpu,
  Target,
  LineChart,
  Layers,
  ThermometerSun,
  Flame,
  Network,
  Box,
  FileBarChart,
  StickyNote,
  History,
  Shield,
  Server,
  Wrench,
  Users,
  CircleHelp,
  Megaphone,
  MessageCircleQuestion,
  Headset,
  CalendarDays,
  Search,
  RefreshCw,
  FolderOpen
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/user-context"

interface SidebarProps {
  unreadAlerts?: number
}

interface MenuItem {
  label: string
  href: string
  icon: React.ElementType
  count?: number
  children?: MenuItem[]
}

interface MenuSection {
  id: string
  label: string
  icon: React.ElementType
  items: MenuItem[]
}

export function Sidebar({ unreadAlerts = 3 }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const pathname = usePathname()
  const { currentUser } = useUser()
  const isTeamLead = currentUser.role === "team-lead" || currentUser.role === "division-head" || currentUser.role === "plant-head"

  // 현재 상위 메뉴 결정 (URL 기반)
  const currentTopMenu = useMemo(() => {
    if (pathname.startsWith("/operations")) return "operations"
    if (pathname.startsWith("/review")) return "review"
    if (pathname.startsWith("/optimization")) return "optimization"
    if (pathname.startsWith("/roadmap")) return "roadmap"
    if (pathname.startsWith("/knowledge")) return "knowledge"
    if (pathname.startsWith("/admin")) return "data-admin"
    if (pathname.startsWith("/oop-outside")) return "oop-outside"
    if (pathname.startsWith("/help")) return "help"
    if (pathname.startsWith("/alerts") || pathname.startsWith("/actions") || pathname.startsWith("/dashboard") || pathname.startsWith("/tickets") || pathname.startsWith("/new-ticket")) return "actions"
    return "operations" // 기본값은 Operations
  }, [pathname])

  // Operations 메뉴 구조
  const operationsMenu: MenuSection[] = [
    {
      id: "live-monitoring",
      label: "실시간 모니터링",
      icon: Monitor,
      items: [
        { label: "일일 운전 현황", href: "/operations", icon: Layers },
        { 
          label: "DCS 모니터링", 
          href: "/operations/monitoring/dcs", 
          icon: Monitor,
          children: [
            { label: "DCS 화면 조회", href: "/operations/monitoring/dcs/screen", icon: Monitor },
            { label: "태그 상세분석", href: "/operations/monitoring/dcs/tag", icon: Target },
            { label: "알람 상황판", href: "/operations/monitoring/dcs/alarm", icon: Bell },
          ]
        },
        { label: "커스텀 대시보드", href: "/operations/custom-dashboard", icon: LayoutDashboard },
      ]
    },
    {
      id: "cross-unit",
      label: "공정 연계 분석",
      icon: Network,
      items: [
        { label: "유틸리티 연계", href: "/operations/cross-unit/utility", icon: Zap },
        { label: "공정간 연계", href: "/operations/cross-unit/process", icon: Network },
      ]
    },
    {
      id: "long-term",
      label: "장기 건전성 관리",
      icon: TrendingUp,
      items: [
        { label: "Fouling", href: "/operations/health/fouling", icon: Flame },
        { label: "Coking", href: "/operations/health/coking", icon: Flame },
        { label: "촉매 Aging", href: "/operations/health/catalyst-aging", icon: Activity },
        { label: "Hydraulics", href: "/operations/health/hydraulics", icon: Layers },
        { label: "Separation", href: "/operations/health/separation", icon: Layers },
        { label: "Energy", href: "/operations/health/energy", icon: Zap },
        { label: "Mechanical", href: "/operations/health/mechanical", icon: Shield },
      ]
    },
  ]

  // 조치/활동 메뉴 구조
  const actionsMenu: MenuSection[] = [
    {
      id: "alerts",
      label: "내 알람",
      icon: Bell,
      items: [
        { label: "전체 알람", href: "/alerts", icon: Bell, count: 12 },
      ]
    },
    {
      id: "workspace",
      label: "내 업무",
      icon: Inbox,
      items: [
        { label: "내 이벤트", href: "/actions/tickets", icon: Inbox },
      ]
    },
    // 팀 대시보드: 팀장에게만 팀 업무 분석 대시보드 표시
    ...(isTeamLead ? [{
      id: "team-dashboard",
      label: "팀 대시보드",
      icon: BarChart3,
      items: [
        { label: "알람 분석 대시보드", href: "/alerts/dashboard", icon: BarChart3 },
        { label: "팀 업무 분석 대시보드", href: "/dashboard", icon: LayoutDashboard },
      ]
    }] : [{
      id: "team-dashboard",
      label: "팀 대시보드",
      icon: BarChart3,
      items: [
        { label: "알람 분석 대시보드", href: "/alerts/dashboard", icon: BarChart3 },
      ]
    }]),
  ]

  // 최적화/인사이트 메뉴 구조
  const optimizationMenu: MenuSection[] = [
    {
      id: "model-optimization",
      label: "모델 기반 최적화",
      icon: Cpu,
      items: [
        { label: "AI / ML 모델", href: "/optimization/ai-ml", icon: Cpu },
        { label: "RTO 모델", href: "/optimization/rto", icon: Activity },
      ]
    },
    {
      id: "experiments",
      label: "모델 실험실",
      icon: Box,
      items: [
        { label: "모델 구축", href: "/optimization/experiments", icon: Cpu },
        { label: "운영 검증", href: "/optimization/experiments?tab=validate", icon: Eye },
      ]
    },
    {
      id: "whatif",
      label: "What-if 시뮬레이션",
      icon: Target,
      items: [
        { label: "시뮬레이션 실행", href: "/optimization/what-if", icon: Target },
        { label: "저장된 시나리오", href: "/optimization/what-if/saved", icon: FolderOpen },
      ]
    },
    {
      id: "opt-insight",
      label: "최적화 인사이트",
      icon: Eye,
      items: [
        { label: "제약조건 분석", href: "/optimization/insight/binding", icon: AlertTriangle },
        { label: "유사 공정 비교", href: "/operations/cross-unit/similar", icon: BarChart3 },
        { label: "한계가치 분석", href: "/optimization/insight/marginal", icon: TrendingUp },
        { label: "LP 벡터 분석", href: "/optimization/insight/lp-vector", icon: LineChart },
        { label: "품질 Giveaway 분석", href: "/optimization/insight/quality-giveaway", icon: Gauge },
        { label: "촉매 수명/사용량", href: "/optimization/insight/catalyst", icon: Activity },
      ]
    },
  ]

  // 지식/문서 메뉴 구조
  const knowledgeMenu: MenuSection[] = [
    {
      id: "doc-search",
      label: "문서 검색",
      icon: Search,
      items: [
        { label: "문서 검색 (AI)", href: "/knowledge/search", icon: Search },
      ]
    },
    {
      id: "cases",
      label: "운영사례/케이스",
      icon: History,
      items: [
        { label: "종결 이벤트/Alert", href: "/knowledge/cases", icon: FileText },
        { label: "운영 로그", href: "/knowledge/cases?tab=logs", icon: Layers },
        { label: "회의록/TOB", href: "/knowledge/cases?tab=meetings", icon: Users },
      ]
    },
    {
      id: "final-reports",
      label: "최종 레포트",
      icon: FileBarChart,
      items: [
        { label: "최종 레포트", href: "/knowledge/final-reports", icon: FileBarChart },
      ]
    },
    {
      id: "guides",
      label: "운영 가이드",
      icon: BookOpen,
      items: [
        { label: "Operation Guide", href: "/knowledge/guides", icon: BookOpen },
        { label: "반복성 가이드", href: "/knowledge/guides?tab=repeatable", icon: RefreshCw },
      ]
    },
    {
      id: "procedures",
      label: "절차서/표준",
      icon: Shield,
      items: [
        { label: "절차서/표준", href: "/knowledge/procedures", icon: Shield },
      ]
    },
    {
      id: "learning",
      label: "학습/용어",
      icon: BookOpen,
      items: [
        { label: "사전/온톨로지 뷰", href: "/knowledge/learning", icon: BookOpen },
      ]
    },
  ]

  // 데이터 및 관리 메뉴 구조
  const dataAdminMenu: MenuSection[] = [
    {
      id: "data-quality",
      label: "데이터 품질 관리",
      icon: Shield,
      items: [
        { label: "데이터 품질 현황", href: "/admin", icon: Shield },
        { label: "SSoT 관리", href: "/admin/ssot", icon: Database },
      ]
    },
    {
      id: "master-data",
      label: "기준정보 관리",
      icon: Server,
      items: [
        { label: "기준정보 관리", href: "/admin/master-data", icon: Server },
      ]
    },
    {
      id: "data-mart",
      label: "데이터 마트",
      icon: Database,
      items: [
        { label: "데이터 마트", href: "/admin/data-mart", icon: Database },
      ]
    },
    {
      id: "reference-data",
      label: "참조 데이터",
      icon: FileText,
      items: [
        { label: "참조 데이터", href: "/admin/reference-data", icon: FileText },
      ]
    },
    {
      id: "alert-management",
      label: "Alert 관리",
      icon: Bell,
      items: [
        { label: "Alert 전체 리스트", href: "/admin/alert-management", icon: Bell },
        { label: "개인화 Alert", href: "/admin/alert-management/personal", icon: Users },
        { label: "Alert 현황", href: "/admin/alert-management/status", icon: BarChart3 },
      ]
    },
    {
      id: "system-settings",
      label: "시스템 설정",
      icon: Settings,
      items: [
        { label: "시스템 설정", href: "/admin/settings", icon: Settings },
      ]
    },
  ]

  // 전략 과제 메뉴 구조
  const roadmapMenu: MenuSection[] = [
    {
      id: "worklist",
      label: "과제 관리",
      icon: FileText,
      items: [
        { label: "과제 목록", href: "/roadmap", icon: FileText },
        { label: "최적화 기회 발굴", href: "/roadmap/opportunities", icon: TrendingUp },
      ]
    },
  ]

  // 외부 협업 메뉴 구조
  const oopOutsideMenu: MenuSection[] = [
    {
      id: "third-party",
      label: "외부 기관 분석",
      icon: Building2,
      items: [
        { label: "외부 분석 데이터", href: "/oop-outside/analysis", icon: Database },
        { label: "라이센서 질의", href: "/oop-outside/licensor", icon: HelpCircle },
      ]
    },
    {
      id: "internal-analysis",
      label: "내부팀 분석",
      icon: Users,
      items: [
        { label: "촉매기술팀", href: "/oop-outside/internal/catalyst-team", icon: Activity },
        { label: "대전연구소", href: "/oop-outside/internal/daejon-lab", icon: Server },
      ]
    },
  ]

  // Help (게시판) 메뉴 구조
  const helpMenu: MenuSection[] = [
    {
      id: "help-board",
      label: "게시판",
      icon: CircleHelp,
      items: [
        { label: "공지사항", href: "/help/notice", icon: Megaphone },
        { label: "시스템 매뉴얼", href: "/help/manual", icon: BookOpen },
        { label: "오류 개선 / 의견 제시", href: "/help/feedback", icon: MessageCircleQuestion },
        { label: "Help Desk", href: "/help/desk", icon: Headset },
      ]
    },
  ]

  // 리뷰/KPI 메뉴 구조
  const reviewMenu: MenuSection[] = [
    {
      id: "review-monthly",
      label: "월간 운전 리뷰",
      icon: BarChart3,
      items: [
        { label: "월간 운전 리뷰", href: "/review/monthly", icon: BarChart3 },
      ]
    },
    {
      id: "review-financial",
      label: "Financial Impact",
      icon: TrendingUp,
      items: [
        { label: "Financial Impact", href: "/review/financial-impact", icon: TrendingUp },
      ]
    },
    {
      id: "review-health",
      label: "시스템 건전성 리뷰",
      icon: Shield,
      items: [
        { label: "시스템 건전성 리뷰", href: "/review/system-health", icon: Shield },
      ]
    },
    {
      id: "review-meetings",
      label: "회의 관리",
      icon: CalendarDays,
      items: [
        { label: "회의 관리", href: "/review/meetings", icon: CalendarDays },
      ]
    },
  ]

  // 현재 메뉴 선택
  const currentMenu = useMemo(() => {
    switch (currentTopMenu) {
      case "operations": return operationsMenu
      case "review": return reviewMenu
      case "optimization": return optimizationMenu
      case "roadmap": return roadmapMenu
      case "knowledge": return knowledgeMenu
      case "data-admin": return dataAdminMenu
      case "oop-outside": return oopOutsideMenu
      case "help": return helpMenu
      default: return actionsMenu
    }
  }, [currentTopMenu])

  // 현재 경로에 맞는 섹션 자동 확장
  useEffect(() => {
    const matchedSection = currentMenu.find(section => 
      section.items.some(item => 
        pathname === item.href || 
        pathname.startsWith(item.href + "/") ||
        item.children?.some(child => pathname === child.href || pathname.startsWith(child.href + "/"))
      )
    )
    if (matchedSection && !expandedSections.includes(matchedSection.id)) {
      setExpandedSections([matchedSection.id])
    }
  }, [pathname, currentMenu])

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }, [])

  // 모든 메뉴 항목의 href를 수집하여 가장 구체적인 매칭만 활성화
  const allHrefs = useMemo(() => {
    const hrefs: string[] = []
    currentMenu.forEach(section => {
      section.items.forEach(item => {
        hrefs.push(item.href)
        item.children?.forEach(child => hrefs.push(child.href))
      })
    })
    return hrefs
  }, [currentMenu])

  const isItemActive = (href: string) => {
    if (href === "/") return pathname === "/"
    // 정확 일치
    if (pathname === href) return true
    // 하위 경로 일치 - 단, 더 구체적인 다른 href가 매칭되면 제외
    if (pathname.startsWith(href + "/")) {
      const hasMoreSpecific = allHrefs.some(
        other => other !== href && other.startsWith(href + "/") && (pathname === other || pathname.startsWith(other + "/"))
      )
      return !hasMoreSpecific
    }
    return false
  }

  const menuTitles: Record<string, string> = {
    operations: "운전 현황",
    actions: "운전 조치",
    review: "리뷰/KPI",
    optimization: "공정 최적화",
    roadmap: "전략 과제",
    knowledge: "지식/문서",
    "data-admin": "데이터/설정",
    "oop-outside": "OOP Outside",
    "help": "게시판"
  }

  return (
    <aside 
      className={cn(
        "h-full bg-card border-r border-border flex flex-col flex-shrink-0 transition-[width] duration-200 ease-out will-change-[width]",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-card">
        {!isCollapsed && (
          <span className="font-semibold text-sm text-foreground">{menuTitles[currentTopMenu]}</span>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 ml-auto"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {currentMenu.map((section, sectionIndex) => (
          <div key={section.id}>
            {sectionIndex > 0 && <div className="h-px bg-border mx-4 my-2" />}
            
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50",
                isCollapsed && "justify-center px-2"
              )}
            >
              <section.icon className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{section.label}</span>
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    expandedSections.includes(section.id) && "rotate-180"
                  )} />
                </>
              )}
            </button>

            {/* Section Items */}
            {!isCollapsed && expandedSections.includes(section.id) && (
              <div className="mt-1 space-y-0.5 px-2">
                {section.items.map((item) => (
                  <div key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={true}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm rounded",
                        isItemActive(item.href)
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.count !== undefined && item.count > 0 && (
                        <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
                          {item.count}
                        </Badge>
                      )}
                    </Link>
                    
                    {/* Sub-items (children) */}
                    {item.children && isItemActive(item.href) && (
                      <div className="ml-6 mt-1 space-y-0.5 border-l-2 border-border pl-3">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            prefetch={true}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1.5 text-xs rounded",
                              isItemActive(child.href)
                                ? "bg-primary/15 text-primary font-medium"
                                : "text-foreground/60 hover:text-foreground hover:bg-muted/50"
                            )}
                          >
                            <child.icon className="h-3 w-3 flex-shrink-0" />
                            <span>{child.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">김</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">김지수</p>
              <p className="text-xs text-muted-foreground truncate">Process Engineering</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </aside>
  )
}
