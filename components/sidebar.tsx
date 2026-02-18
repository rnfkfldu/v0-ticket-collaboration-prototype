"use client"

import React from "react"

import { useState, useEffect, useMemo } from "react"
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
  CalendarDays
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useUser, type ScopeMode } from "@/lib/user-context"

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
  const { currentUser, scopeMode, setScopeMode, visibleProcesses } = useUser()

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
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      items: [{ label: "Overview", href: "/operations", icon: LayoutDashboard }]
    },
    {
      id: "live-monitoring",
      label: "Live Monitoring",
      icon: Monitor,
      items: [
        { label: "Unit Monitoring", href: "/operations/monitoring/unit", icon: Layers },
        { label: "Custom Dashboards", href: "/operations/monitoring/custom", icon: LayoutDashboard },
        { 
          label: "DCS Monitoring", 
          href: "/operations/monitoring/dcs", 
          icon: Monitor,
          children: [
            { label: "DCS Screen View", href: "/operations/monitoring/dcs/screen", icon: Monitor },
            { label: "Tag Drill-down", href: "/operations/monitoring/dcs/tag", icon: Target },
            { label: "Alarm Context View", href: "/operations/monitoring/dcs/alarm", icon: Bell },
          ]
        },
      ]
    },
    {
      id: "cross-unit",
      label: "Cross-Unit View",
      icon: Network,
      items: [
        { label: "Utility Interconnection", href: "/operations/cross-unit/utility", icon: Zap },
        { label: "Process Interconnection", href: "/operations/cross-unit/process", icon: Network },
        { label: "Similar Process Comparison", href: "/operations/cross-unit/similar", icon: BarChart3 },
      ]
    },
    {
      id: "long-term",
      label: "Long-Term Health",
      icon: TrendingUp,
      items: [
        { label: "Overview", href: "/operations/health/overview", icon: LayoutDashboard },
        { label: "Deposition", href: "/operations/health/deposition", icon: Flame },
        { label: "Catalyst Performance", href: "/operations/health/catalyst", icon: ThermometerSun },
        { label: "Integrity Risk", href: "/operations/health/integrity", icon: Shield },
        { label: "Worklist", href: "/operations/health/worklist", icon: FileText },
      ]
    },
  ]

  // Actions 메뉴 구조 (기존)
  const actionsMenu: MenuSection[] = [
    {
      id: "alerts",
      label: "Deviation & Alerts",
      icon: Bell,
      items: [
        { label: "전체 알람", href: "/alerts", icon: Bell, count: 12 },
        { label: "알람 분석 대시보드", href: "/alerts/dashboard", icon: BarChart3 },
      ]
    },
    {
      id: "workspace",
      label: "My Action",
      icon: Inbox,
      items: [
        { label: "내 티켓", href: "/actions/tickets", icon: Inbox },
        { label: "대시보드", href: "/dashboard", icon: LayoutDashboard },
      ]
    },
  ]

  // Optimization 메뉴 구조
  const optimizationMenu: MenuSection[] = [
    {
      id: "model-optimization",
      label: "Model-Based Optimization",
      icon: Cpu,
      items: [
        { label: "AI / ML Models", href: "/optimization/ai-ml", icon: Cpu },
        { label: "RTO Models", href: "/optimization/rto", icon: Activity },
      ]
    },
    {
      id: "experiments",
      label: "Experiments (Model Sandbox)",
      icon: Box,
      items: [
        { label: "Model Sandbox", href: "/optimization/experiments", icon: Box },
      ]
    },
    {
      id: "whatif",
      label: "What-if Simulation",
      icon: Target,
      items: [
        { label: "What-if Simulation", href: "/optimization/what-if", icon: Target },
      ]
    },
    {
      id: "opt-insight",
      label: "Optimization Insight",
      icon: Eye,
      items: [
        { label: "Binding Constraint Analysis", href: "/optimization/insight/binding", icon: AlertTriangle },
        { label: "Marginal Value Analysis", href: "/optimization/insight/marginal", icon: TrendingUp },
        { label: "LP Vector Analysis", href: "/optimization/insight/lp-vector", icon: LineChart },
        { label: "Quality Giveaway Analysis", href: "/optimization/insight/quality-giveaway", icon: Gauge },
      ]
    },
  ]

  // Knowledge 메뉴 구조
  const knowledgeMenu: MenuSection[] = [
    {
      id: "knowledge-asset",
      label: "Knowledge Asset",
      icon: Layers,
      items: [
        { label: "Knowledge Asset", href: "/knowledge/assets", icon: Layers },
        { label: "Reports", href: "/knowledge/reports", icon: FileBarChart },
      ]
    },
    {
      id: "playbooks",
      label: "Operating Playbooks",
      icon: BookOpen,
      items: [
        { label: "Operating Playbooks", href: "/knowledge", icon: BookOpen },
      ]
    },
    {
      id: "contingency",
      label: "Operation Contingency Plan",
      icon: Shield,
      items: [
        { label: "Contingency Plan", href: "/knowledge/contingency", icon: Shield },
      ]
    },
    {
      id: "history",
      label: "Operating History",
      icon: History,
      items: [
        { label: "Process Unit History", href: "/knowledge/history/process", icon: Activity },
        { label: "Alert History", href: "/knowledge/history/alert", icon: Bell },
        { label: "Action History", href: "/knowledge/history/action", icon: Wrench },
      ]
    },
    {
      id: "team-knowledge",
      label: "Team Knowledge",
      icon: Users,
      items: [
        { label: "Team Knowledge", href: "/knowledge/team", icon: Users },
      ]
    },
    {
      id: "terminology",
      label: "용어 관리",
      icon: BookOpen,
      items: [
        { label: "용어 관리", href: "/knowledge/terminology", icon: BookOpen },
      ]
    },
    {
      id: "notes",
      label: "Personal Notes",
      icon: StickyNote,
      items: [
        { label: "Personal Notes", href: "/knowledge/notes", icon: StickyNote },
      ]
    },
    {
      id: "logs",
      label: "System Logs",
      icon: FileText,
      items: [
        { label: "System Logs", href: "/knowledge/logs", icon: FileText },
      ]
    },
  ]

  // Data & Admin 메뉴 구조
  const dataAdminMenu: MenuSection[] = [
    {
      id: "data-quality",
      label: "Data Quality Monitoring",
      icon: Shield,
      items: [
        { label: "Data Quality Monitoring", href: "/admin", icon: Shield },
        { label: "SSoT Management", href: "/admin/ssot", icon: Database },
      ]
    },
    {
      id: "master-data",
      label: "Master Data Management",
      icon: Server,
      items: [
        { label: "Master Data Management", href: "/admin/master-data", icon: Server },
      ]
    },
    {
      id: "data-mart",
      label: "Data Mart",
      icon: Database,
      items: [
        { label: "Data Mart", href: "/admin/data-mart", icon: Database },
      ]
    },
    {
      id: "reference-data",
      label: "Reference Data",
      icon: FileText,
      items: [
        { label: "Reference Data", href: "/admin/reference-data", icon: FileText },
      ]
    },
    {
      id: "system-settings",
      label: "System Settings",
      icon: Settings,
      items: [
        { label: "System Settings", href: "/admin/settings", icon: Settings },
      ]
    },
  ]

  // Workbench 메뉴 구조
  const roadmapMenu: MenuSection[] = [
    {
      id: "worklist",
      label: "Worklist",
      icon: FileText,
      items: [
        { label: "Worklist", href: "/roadmap", icon: FileText },
        { label: "Optimization Opportunities", href: "/roadmap/opportunities", icon: TrendingUp },
      ]
    },
  ]

  // OOP Outside 메뉴 구조 (기존 3rd Party)
  const oopOutsideMenu: MenuSection[] = [
    {
      id: "third-party",
      label: "3rd Party 분석",
      icon: Building2,
      items: [
        { label: "3rd Party 분석 데이터", href: "/oop-outside/analysis", icon: Database },
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

  // Review 메뉴 구조
  const reviewMenu: MenuSection[] = [
    {
      id: "review-monthly",
      label: "Monthly Review",
      icon: BarChart3,
      items: [
        { label: "Monthly Review", href: "/review/monthly", icon: BarChart3 },
      ]
    },
    {
      id: "review-health",
      label: "System Health Review",
      icon: Shield,
      items: [
        { label: "System Health Review", href: "/review/system-health", icon: Shield },
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

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const isItemActive = (href: string) => {
    // 홈 경로("/")는 정확히 일치할 때만 활성화
    if (href === "/") {
      return pathname === "/"
    }
    // 그 외는 정확히 일치하거나 하위 경로일 때 활성화
    return pathname === href || pathname.startsWith(href + "/")
  }

  const menuTitles: Record<string, string> = {
    operations: "Operations",
    actions: "Actions",
    review: "Review",
    optimization: "Optimization",
    roadmap: "Workbench",
    knowledge: "Knowledge",
    "data-admin": "Data & Admin",
    "oop-outside": "OOP Outside",
    "help": "게시판"
  }

  return (
    <aside 
      className={cn(
        "h-full bg-card border-r border-border flex flex-col transition-all duration-300 flex-shrink-0",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4">
        {!isCollapsed && (
          <span className="font-semibold text-sm text-muted-foreground">{menuTitles[currentTopMenu]}</span>
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

      {/* Scope Toggle - 담당공정 / 전체공정 */}
      {!isCollapsed && (
        <div className="px-3 py-2 border-b border-border">
          <div className="flex items-center rounded-md bg-muted p-0.5">
            <button
              className={cn(
                "flex-1 text-xs py-1.5 px-2 rounded-sm font-medium transition-colors text-center",
                scopeMode === "my-processes"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setScopeMode("my-processes")}
            >
              담당공정 ({currentUser.assignedProcessIds.length})
            </button>
            <button
              className={cn(
                "flex-1 text-xs py-1.5 px-2 rounded-sm font-medium transition-colors text-center",
                scopeMode === "all-processes"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setScopeMode("all-processes")}
            >
              전체공정 (50)
            </button>
          </div>
          {!isCollapsed && scopeMode === "my-processes" && (
            <p className="text-xs text-muted-foreground mt-1.5 px-1">
              {currentUser.roleLabel} {currentUser.name}
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {currentMenu.map((section, sectionIndex) => (
          <div key={section.id}>
            {sectionIndex > 0 && <div className="h-px bg-border mx-4 my-2" />}
            
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
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
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                        isItemActive(item.href)
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                            className={cn(
                              "flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors",
                              isItemActive(child.href)
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
