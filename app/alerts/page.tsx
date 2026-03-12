"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { saveTicket, addWorkPackageToTicket, getTickets } from "@/lib/storage"
import { UNIT_OWNERS, AVAILABLE_TAGS } from "@/lib/process-data"
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  Calendar,
  TrendingUp,
  CheckCircle,
  Eye,
  FileText,
  Clock,
  Activity,
  Gauge,
  MessageSquare,
  ExternalLink,
  Calculator,
  Zap,
  AlertCircle,
  BarChart3,
  Users,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Monitor,
  ClipboardList,
  Pencil,
  Plus,
  Link as LinkIcon,
  Save,
  X,
  ShieldCheck,
  BookOpen,
  History,
  RotateCcw,
  LayoutGrid,
  Maximize2,
  FileImage,
  ChevronUp,
  Wrench,
  Sparkles,
  Target,
  Flame,
  Thermometer,
  FileBarChart,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { HEALTH_CATEGORIES, PROCESSES, getEquipmentData, type HealthCategory } from "@/lib/health-data"
import { getPersonalizedAlarms, getCustomKPIs, saveCustomKPI, deleteCustomKPI, getFocusMonitoringItems, type PersonalizedAlarm, type CustomKPI, type FocusMonitoringItem } from "@/lib/personalized-alarms"
import { useUser, type UserRole } from "@/lib/user-context"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

// Alert 타입 정의
type AlertType = "alert" | "notice" | "event"
type AlertStatus = "unread" | "acknowledged" | "resolved"
type AlertGrade = "high" | "medium" | "low"
type AlertState = "new" | "standing" | "shelved"

interface AlertItem {
  id: string
  type: AlertType
  subType: string
  title: string
  description: string
  timestamp: string
  status: AlertStatus
  severity?: "critical" | "warning" | "info"
  unit?: string
  linkedTicketId?: string
  // Alert 전용 필드
  alertGrade?: AlertGrade
  alertState?: AlertState
  triggerCondition?: string
  triggerSetpoint?: { high?: number; low?: number }
  alarmHistory?: { timestamp: string; value: number; action: string }[]
  alarmBackground?: string
  shelvedReason?: string
  shelvedUntil?: string
  // 현재 알람 발생 이력 (지속/재발생)
  occurrenceHistory?: { timestamp: string; type: "sustained" | "recurred"; value: number; duration?: string }[]
  data?: {
    tagId?: string
    value?: number
    limit?: number
    trend?: number[]
    items?: { name: string; status: string; value?: string }[]
  }
  // 이상징후 카테고리별 데이터
  anomalyCategories?: {
    id: string
    name: string
    description: string
    top3: { tagId: string; description: string; severity: "high" | "medium" | "low"; deviation: string; detail: string }[]
  }[]
  // Daily Monitoring AI 상세
  dailyMonitoringDetail?: {
    aiSummary: string
    keyVariables: { name: string; value: string; change: string; status: "normal" | "warning" | "critical" }[]
    diagrams: string[]
  }
  // DCS 수정 요청 상세
  dcsModificationDetail?: {
    esrId: string
    esrTitle: string
    changeItems: { item: string; before: string; after: string }[]
    requestor: string
    appliedDate: string
  }
  // 장기건전성 모니터링 상세
  healthMonitoring?: {
    equipId: string
    equipName: string
    process: string
    category: string           // Fouling, Coking, etc.
    healthIndexName: string
    healthIndexUnit: string
    currentValue: number
    limitValue: number
    actionLimit: number
    trend: number[]            // 24주 트렌드
    projectionWeeks: number    // Limit 도달 예상 주수
    projectionTrend: number[]  // 외삽 데이터
    prevTaTrend?: number[]     // 이전 TA 주기 비교
    driftPct: number           // Drift 변화율
    actionMarginWeeks: number
    needsImmediateAction: boolean
    aiModelId?: string
    relatedTrends: { tagId: string; name: string; value: number; unit: string; status: "normal" | "warning" | "critical" }[]
    suggestedActions: string[]
  }
  // 문서 리뷰 요청 상세 (월간 리포트, Contingency Plan 등)
  documentReview?: {
    docType: "monthly-report" | "contingency-plan" | "living-document"
    docTitle: string
    docVersion: string
    latestVersion: string
    period?: string
    frequency: string  // "월 1회", "연 2회" 등
    deadline: string
    sections: { title: string; content: string; hasChange?: boolean }[]
    reviewHistory: { date: string; reviewer: string; version: string; comment: string }[]
    isReviewed?: boolean
  }
}

// Standing Issue 타입 정의
interface StandingIssue {
  id: string
  title: string
  description: string
  category: "long-term" | "special" | "monitoring" | "daily-report"
  status: "active" | "resolved" | "watching"
  unit?: string
  linkedTicketId?: string
  linkedTicketTitle?: string
  registeredBy: string   // 등록자 ID -- 팀장 My Action 필터링용
  createdDate: string
  lastUpdated: string
  updates: { date: string; content: string; author: string }[]
}

// Standing Issue 초기 데이터
const INITIAL_STANDING_ISSUES: StandingIssue[] = [
  {
    id: "SI-001",
    title: "HCR Catalyst WABT 상승 추세",
    description: "촉매 활성 저하로 인한 WABT 상승 진행 중. 6개월간 +7C 상승. EOR까지 약 8개월 잔여 예상.",
    category: "long-term",
    status: "watching",
    unit: "HCR",
    linkedTicketId: "1",
    linkedTicketTitle: "HCR 촉매 교체 검토",
    registeredBy: "u-engineer-1",
    createdDate: "2024-08-15",
    lastUpdated: "2025-02-01",
    updates: [
      { date: "2025-02-01", content: "WABT 396.5C 도달. Feed 전환(Arabian Medium) 영향으로 +1.5C 추가 상승.", author: "김철수" },
      { date: "2025-01-15", content: "WABT 395C. 월간 상승률 1.2C/월로 안정적.", author: "김철수" },
    ]
  },
  {
    id: "SI-002",
    title: "P-201B Seal Oil Leak 모니터링",
    description: "P-201B 펌프에서 Seal Oil Leak 발견. 경미한 수준으로 정비팀에서 모니터링 중.",
    category: "special",
    status: "active",
    unit: "CDU",
    registeredBy: "u-engineer-2",
    createdDate: "2025-02-01",
    lastUpdated: "2025-02-02",
    updates: [
      { date: "2025-02-02", content: "Leak 양 변화 없음. 정비팀 일일 점검 지속 중.", author: "박정비" },
      { date: "2025-02-01", content: "최초 발견. Seal Oil Leak 경미 수준, 현장 모니터링 시작.", author: "이현장" },
    ]
  },
  {
    id: "SI-003",
    title: "E-101 Fouling 진행 관찰",
    description: "E-101 열교환기 UA값 3개월간 12% 감소. 세정 시기 검토 중.",
    category: "long-term",
    status: "watching",
    unit: "CDU",
    linkedTicketId: "2",
    linkedTicketTitle: "E-101 세정 ���������획",
    registeredBy: "u-engineer-1",
    createdDate: "2024-11-20",
    lastUpdated: "2025-01-30",
    updates: [
      { date: "2025-01-30", content: "UA값 88% 수준 유지. 다음 TA 시 세정 계획 확정.", author: "김철수" },
    ]
  },
  {
    id: "SI-004",
    title: "Arabian Medium 전환 운전 영향 관찰",
    description: "02/01부터 Arabian Light에서 Arabian Medium으로 원유 전환. S함량 +0.3%p 증가에 따른 공정 영향 모니터링.",
    category: "monitoring",
    status: "active",
    unit: "CDU",
    createdDate: "2025-02-01",
    lastUpdated: "2025-02-02",
    updates: [
      { date: "2025-02-02", content: "CDU Overhead pH 5.8로 소폭 하락(-0.2). 아민 주입량 조정 검토.", author: "김철수" },
      { date: "2025-02-01", content: "원유 전환 시작. HCR WABT +1.5C 상승 대응 완료.", author: "김철수" },
    ]
  },
]

// 샘플 알람 데이터
const SAMPLE_ALERTS: AlertItem[] = [
  // Alert 타입
  {
    id: "ALT-001",
    type: "alert",
    subType: "operation-guide",
    title: "TI-2001 High Temperature Alert",
    description: "Reactor Inlet Temperature가 Operation Guide Max를 초과했습니다.",
    timestamp: "2025-02-02 14:32",
    status: "unread",
    severity: "critical",
    unit: "HCR",
    alertGrade: "high",
    alertState: "new",
    triggerCondition: "TI-2001 > 400°C",
    triggerSetpoint: { high: 400, low: 350 },
    alarmHistory: [
      { timestamp: "2025-01-15 09:20", value: 405, action: "인지 후 조치" },
      { timestamp: "2025-01-28 14:45", value: 402, action: "이벤트 발행 (TKT-2025-0128)" },
      { timestamp: "2024-12-20 11:30", value: 408, action: "Shelved (계획정비)" }
    ],
    alarmBackground: "HCR Reactor 안전운전을 위해 설정. 온도 초과 시 촉매 비활성화 및 코킹 가능성 증가. Safety Study(2023) 결과 반영.",
    occurrenceHistory: [
      { timestamp: "2025-02-02 14:32", type: "recurred", value: 412, duration: "진행 중" },
      { timestamp: "2025-02-02 10:15", type: "sustained", value: 408, duration: "2시간 17분" },
      { timestamp: "2025-02-02 06:00", type: "sustained", value: 405, duration: "1시간 42분" },
      { timestamp: "2025-02-02 02:00", type: "sustained", value: 406, duration: "1시간 05분" },
      { timestamp: "2025-02-01 22:00", type: "recurred", value: 403, duration: "52분" },
      { timestamp: "2025-02-01 18:00", type: "sustained", value: 402, duration: "1시간 31분" },
      { timestamp: "2025-02-01 14:00", type: "recurred", value: 401, duration: "38분" },
      { timestamp: "2025-02-01 10:30", type: "recurred", value: 404, duration: "25분" },
    ],
    data: {
      tagId: "TI-2001",
      value: 412,
      limit: 400,
      trend: [385, 390, 395, 398, 402, 408, 412]
    }
  },
  {
    id: "ALT-002",
    type: "alert",
    subType: "operation-guide",
    title: "PI-3001 Low Pressure Alert",
    description: "Regenerator Pressure가 Operation Guide Min 이하로 떨어졌습니다.",
    timestamp: "2025-02-02 13:15",
    status: "acknowledged",
    severity: "warning",
    unit: "CCR",
    alertGrade: "medium",
    alertState: "standing",
    triggerCondition: "PI-3001 < 2.5 bar",
    triggerSetpoint: { high: 3.5, low: 2.5 },
    alarmHistory: [
      { timestamp: "2025-02-01 08:10", value: 2.4, action: "인지" },
      { timestamp: "2025-01-20 16:30", value: 2.3, action: "이벤트 발행" }
    ],
    alarmBackground: "CCR Regenerator 정상 운전 압력 범위. 저압 시 촉매 재생 효율 저하 우려.",
    data: {
      tagId: "PI-3001",
      value: 2.1,
      limit: 2.5,
      trend: [2.8, 2.7, 2.5, 2.4, 2.3, 2.2, 2.1]
    }
  },
  {
    id: "ALT-003",
    type: "alert",
    subType: "operation-guide",
    title: "FI-1001 Feed Flow Low Alert",
    description: "CDU Feed Flow가 Operation Guide Min 이하로 떨어졌습니다.",
    timestamp: "2025-02-01 22:45",
    status: "resolved",
    severity: "info",
    unit: "CDU",
    alertGrade: "low",
    alertState: "shelved",
    triggerCondition: "FI-1001 < 800 m3/hr",
    triggerSetpoint: { high: 1200, low: 800 },
    alarmHistory: [
      { timestamp: "2025-02-01 22:45", value: 780, action: "Shelved (계획 감량)" }
    ],
    alarmBackground: "CDU Feed 정상 운전 범위. 저유량 시 제품 ��질 영향 가능.",
    shelvedReason: "2월 계획 감량 운전 중 (2025-02-01 ~ 2025-02-07)",
    shelvedUntil: "2025-02-07",
    data: {
      tagId: "FI-1001",
      value: 780,
      limit: 800,
      trend: [850, 830, 810, 795, 785, 782, 780]
    }
  },
  // 장기건전성 모니터링 Alert
  {
    id: "ALT-004",
    type: "alert",
    subType: "health-monitoring",
    title: "TI-2931 열교환기 Fouling 관련 즉시 조치 필요",
    description: "F-E102A Feed/Effluent HEX #2A의 U값이 급격히 하락하여 Limit 접근 중. 즉시 Cleaning 등 조치가 필요합니다.",
    timestamp: "2025-02-02 10:15",
    status: "unread",
    severity: "critical",
    unit: "HCR",
    alertGrade: "high",
    alertState: "new",
    triggerCondition: "U값 Drift > +50% & Projection < 4주",
    triggerSetpoint: { high: 750, low: 350 },
    alarmHistory: [
      { timestamp: "2025-02-02 10:15", value: 480, action: "Auto Alert - Drift 급등 감지" },
      { timestamp: "2025-01-20 08:00", value: 510, action: "Yellow Alert 발생" },
      { timestamp: "2025-01-05 09:30", value: 545, action: "모니터링 시작" },
    ],
    alarmBackground: "HCR Feed/Effluent 열교환기 Fouling 장기 모니터링 항목. W600N 모드 전환 후 Fouling Rate 가속화 확인. Action Window 내 Online Cleaning 또는 운전 조건 변경이 필요한 상황.",
    occurrenceHistory: [
      { timestamp: "2025-02-02 10:15", type: "sustained", value: 480, duration: "진행 중" },
      { timestamp: "2025-02-02 06:00", type: "sustained", value: 485, duration: "4시간 15분" },
      { timestamp: "2025-02-02 02:00", type: "sustained", value: 492, duration: "4시간 00분" },
      { timestamp: "2025-02-01 22:00", type: "sustained", value: 498, duration: "4시간 00분" },
      { timestamp: "2025-02-01 18:00", type: "recurred", value: 502, duration: "3시간 28분" },
    ],
    data: {
      tagId: "TI-2931",
      value: 480,
      limit: 350,
      trend: [580, 575, 568, 560, 555, 548, 540, 535, 530, 525, 520, 515, 512, 508, 505, 502, 500, 498, 495, 492, 490, 487, 483, 480]
    },
    healthMonitoring: {
      equipId: "F-E102A",
      equipName: "Feed/Effluent HEX #2A",
      process: "HCR",
      category: "Fouling",
      healthIndexName: "U값 (총괄열전달계수)",
      healthIndexUnit: "W/m2K",
      currentValue: 480,
      limitValue: 350,
      actionLimit: 410,
      trend: [580, 575, 568, 560, 555, 548, 540, 535, 530, 525, 520, 515, 512, 508, 505, 502, 500, 498, 495, 492, 490, 487, 483, 480],
      projectionWeeks: 3,
      projectionTrend: [480, 465, 450, 435, 420, 405, 390, 375, 360, 345],
      prevTaTrend: [610, 605, 598, 592, 585, 580, 575, 570, 565, 560, 555, 550, 548, 545, 542, 540, 538, 535, 530, 528, 525, 520, 518, 515],
      driftPct: 145,
      actionMarginWeeks: 4,
      needsImmediateAction: true,
      aiModelId: "AI-MDL-F01",
      relatedTrends: [
        { tagId: "FI-2001", name: "Feed Flow", value: 285, unit: "m3/h", status: "normal" },
        { tagId: "TI-2010", name: "Shell Inlet Temp", value: 195, unit: "deg.C", status: "warning" },
        { tagId: "TI-2011", name: "Shell Outlet Temp", value: 158, unit: "deg.C", status: "normal" },
        { tagId: "PDI-2001", name: "Shell dP", value: 1.35, unit: "kg/cm2", status: "critical" },
        { tagId: "TI-2020", name: "Tube Inlet Temp", value: 290, unit: "deg.C", status: "normal" },
        { tagId: "TI-2021", name: "Tube Outlet Temp", value: 248, unit: "deg.C", status: "warning" },
      ],
      suggestedActions: [
        "Online Cleaning 실시 (Chemical Injection)",
        "운전 조건 변경 - Feed Rate 감량 검토",
        "Bypass 운전으로 ��환 후 Cleaning ���행",
        "TA Scope 반영 검토 (Mechanical Cleaning)",
      ],
    },
  },
  // Notice 타입
  {
    id: "NTC-001",
    type: "notice",
    subType: "anomaly",
    title: "이상징후 모니터링 리포트 (주간)",
    description: "2025년 5주차 이상징후 분석 결과입니다. 4개 카테고리에서 총 12건 중 주의 항목 5건이 감지되었습니다.",
    timestamp: "2025-02-02 09:00",
    status: "unread",
    severity: "warning",
    data: {
      items: [
        { name: "FV-2001 Control Valve Opening", status: "warning", value: "92% (정상: 60-80%)" },
        { name: "E-101 Fouling Factor", status: "warning", value: "0.0008 (주의기준: 0.0007)" },
        { name: "P-201 Vibration", status: "normal", value: "2.1mm/s (정상)" }
      ]
    },
    anomalyCategories: [
      {
        id: "cat-1",
        name: "유사운전조건 기준 Deviation 정도",
        description: "유사한 피드조건/운전모드에서 예전대비 현재의 운전점이 얼마나 달라졌는지 보여주고, 많이 달라진 항목은 이상치로 관리",
        top3: [
          { tagId: "TI-2001", description: "HCR Reactor Inlet Temp", severity: "high", deviation: "+8.2C vs 동일 피드조건 평균", detail: "Arabian Medium 처리 시 과거 6회 평균 대비 온도가 유의미하게 높음. WABT 상승 추세와 연계 가능." },
          { tagId: "FI-1001", description: "CDU Feed Flow Rate", severity: "medium", deviation: "-3.5% vs 동일 모드 평균", detail: "Full Rate 운전 모드에서 Feed Flow가 과거 대비 소폭 낮음. 계기 Drift 가능성 검토 필요." },
          { tagId: "PI-3001", description: "CCR Regenerator Pressure", severity: "low", deviation: "-0.2 bar vs 동일 조건", detail: "정상 편차 범위 내이나 모니터링 지속 필요." },
        ]
      },
      {
        id: "cat-2",
        name: "갑작스런 Peak / Oscillation 감지",
        description: "계기 이상 탐지 목적 - 급격한 스파이크 또는 진동 패턴을 감지하여 계기 이상 여부 판단",
        top3: [
          { tagId: "FV-2001", description: "HCR Feed Control Valve", severity: "high", deviation: "Opening 92% (정상: 60-80%)", detail: "Control Valve Opening이 지속적으로 높은 상태. Sticking 또는 Positioner 이상 의심. Oscillation 패턴도 감지됨." },
          { tagId: "TI-4501", description: "VDU Column Bottom Temp", severity: "medium", deviation: "30분 주기 ±2C 진동", detail: "온도 제어루프에서 주기적 진동 패턴 감지. PID Tuning 검토 권장." },
          { tagId: "LI-2001", description: "HCR Separator Level", severity: "low", deviation: "간헐적 Spike (4회/일)", detail: "Level Transmitter 노이즈 가능성. 다음 정기 Calibration 시 확인 필요." },
        ]
      },
      {
        id: "cat-3",
        name: "장기적인 Drift 감지",
        description: "Fouling, Aging 등 시간에 따른 변동 이상 탐지 목적 - 서서히 진행되는 성능 저하 모니터링",
        top3: [
          { tagId: "E-101-UA", description: "E-101 Heat Exchanger UA Value", severity: "high", deviation: "-12% over 3 months", detail: "E-101 열교환기 UA 값이 3개월간 12% 감소. Fouling 진행 중으로 판단됨. 세정 시기 검토 필요." },
          { tagId: "WABT", description: "HCR Catalyst WABT", severity: "medium", deviation: "+7C over 6 months", detail: "촉매 활성 저하로 인한 WABT 상승 진행 중. EOR까지 약 8개월 잔여 예상." },
          { tagId: "K-301-EFF", description: "K-301 Compressor Efficiency", severity: "low", deviation: "-1.5% over 2 months", detail: "압축기 효율 소폭 감소. 계절적 요인 또는 Fouling 초기 단계 가능성." },
        ]
      },
      {
        id: "cat-4",
        name: "DR Reconciled Data 대비 실측지 Drift",
        description: "Data Reconciliation 결과와 실측지 간의 차이가 커지는 항목 모니터링",
        top3: [
          { tagId: "FI-1501", description: "VDU Side Draw Flow", severity: "high", deviation: "실측 대비 DR +8.3%", detail: "Flow Meter 정확도 저하 의심. 마지막 Calibration 이후 6개월 경과. 교정 또는 교체 검토." },
          { tagId: "TI-2501", description: "HCR Product Temp", severity: "medium", deviation: "실측 대비 DR -3.1C", detail: "Thermocouple 위치에 의한 측정 오차 가능성. 설치 위치 점검 권장." },
          { tagId: "FI-3001", description: "CCR H2 Makeup Flow", severity: "low", deviation: "실측 대비 DR +2.1%", detail: "정상 편차 범위 내. 지속 모니터링." },
        ]
      },
    ]
  },
  {
    id: "NTC-002",
    type: "notice",
    subType: "long-term",
    title: "장기 모니터링 리포트 (주간)",
    description: "촉매 성능 및 열교환기 효율에 대한 장기 트렌드 분석 결과입니다.",
    timestamp: "2025-02-02 09:00",
    status: "unread",
    severity: "info",
    data: {
      items: [
        { name: "Catalyst Activity (WABT)", status: "warning", value: "395°C → 402°C (6개월간 +7°C)" },
        { name: "E-101 UA Value", status: "normal", value: "안정적 (변동률 < 2%)" },
        { name: "Compressor Efficiency", status: "normal", value: "82% (목표 80% 이상)" }
      ]
    }
  },
  {
    id: "NTC-003",
    type: "notice",
    subType: "efficiency",
    title: "효율성 모니터링 리포트 (주간)",
    description: "KPI 달성률 및 운영 효율성 지표 검토가 필요합니다.",
    timestamp: "2025-02-02 09:00",
    status: "unread",
    severity: "info",
    data: {
      items: [
        { name: "처리량 준��율", status: "normal", value: "98.5% (목표 95%)" },
        { name: "온스펙 비율", status: "normal", value: "99.2% (목표 98%)" },
        { name: "AI 모델 정확도", status: "warning", value: "87% (목표 90%)" },
        { name: "에너지 효율", status: "normal", value: "목표 대비 +2.1%" }
      ]
    }
  },
  {
    id: "NTC-004",
    type: "notice",
    subType: "communication",
    title: "이벤트 업데이트: HCR 촉매 교체 검토",
    description: "Process Engineering팀 박영희님이 의견을 추가했습니다.",
    timestamp: "2025-02-02 11:30",
    status: "unread",
    severity: "info",
    unit: "HCR",
    linkedTicketId: "1"
  },
  {
    id: "NTC-005",
    type: "notice",
    subType: "custom-alarm",
    title: "커스텀 알람: FI-1001 Feed Flow",
    description: "개인 설정한 모니터링 조건이 트리거되었습니다. (설정값: > 450 m3/hr)",
    timestamp: "2025-02-02 10:45",
    status: "unread",
    severity: "warning",
    unit: "CDU",
    data: {
      tagId: "FI-1001",
      value: 462,
      limit: 450,
      trend: [420, 435, 442, 448, 455, 460, 462]
    }
  },
  {
    id: "NTC-006",
    type: "notice",
    subType: "external-data",
    title: "외부 데이터 업데이트: UOP 촉매 분석 리포트",
    description: "UOP로부터 HCR 촉매 성능 테스트 결과가 도착했습니다. 검토 및 특이사항 기록이 필요합니다.",
    timestamp: "2025-02-01 16:00",
    status: "unread",
    severity: "info",
    unit: "HCR"
  },
  {
    id: "NTC-007",
    type: "notice",
    subType: "auto-calc",
    title: "���동 계산 완료: 월간 Operation Cost",
    description: "2025년 1월 운영비용 자동 계산이 완료되었습니다. 데이터 정합성 검토가 필요합니다.",
    timestamp: "2025-02-01 08:00",
    status: "unread",
    severity: "info",
    data: {
      items: [
        { name: "총 에너지 비용", status: "normal", value: "₩2.4B (예산 대비 -3%)" },
        { name: "촉매/케미컬 비용", status: "warning", value: "₩850M (예산 대비 +8%)" },
        { name: "처리량", status: "normal", value: "1,250,000 bbl (계획 대비 101%)" }
      ]
    }
  },
  // Daily Monitoring AI 요약 (GenAI)
  {
    id: "NTC-008",
    type: "notice",
    subType: "daily-monitoring",
    title: "Daily Monitoring AI 요약 (2025-02-02)",
    description: "GenAI가 금일 운전 현황을 요약했습니다. 전반적 운전 모드 및 주요 변동사항을 확인하세요.",
    timestamp: "2025-02-02 07:00",
    status: "unread",
    severity: "info",
    data: {
      items: [
        { name: "운영 모드", status: "normal", value: "정상 Full Rate 운전 (CDU 100%, HCR 95%)" },
        { name: "Feed 변경사항", status: "warning", value: "02/01부터 Arabian Light → Arabian Medium 전환 (S함량 +0.3%p)" },
        { name: "주요 변수 변경", status: "normal", value: "HCR WABT +1.5C (Feed 변경 대응), VDU Heater Outlet 안정" },
        { name: "TOB 현장 특이사항", status: "warning", value: "P-201B Seal Oil Leak 발견 (경미), 정비팀 모니터링 중" },
        { name: "환경 지표", status: "normal", value: "SO2/NOx 배출 정상 범위, 폐수 COD 안정" }
      ]
    },
    dailyMonitoringDetail: {
      aiSummary: "금일 전체 공정은 안정적인 Full Rate 운전을 유지하고 있습니다. 다만, 02/01부터 진행된 Arabian Light → Arabian Medium 원유 전환으로 인해 HCR Unit의 WABT가 1.5°C 상승하였으며, 이는 피드 황함량 증가(+0.3%p)에 대한 정상적인 대응입니다. VDU Heater Outlet 온도는 안정적이며, CDU Overhead 시스템 부식 지표도 정상 범위입니다.\n\n현장 특이사항으로 P-201B Seal Oil Leak이 발견되었으나 경미한 수준으로, 정비팀에서 모니터링 중입니다. 환경 배출 지표(SO2, NOx, 폐수 COD)는 모두 허용 범위 내에 있습니다.\n\n종합 판정: 정상 운전 유지, P-201B 상태 지속 관찰 권장",
      keyVariables: [
        { name: "CDU Feed Rate", value: "1,180 m3/hr", change: "+0.5%", status: "normal" },
        { name: "HCR WABT", value: "396.5°C", change: "+1.5°C", status: "warning" },
        { name: "VDU Heater Outlet", value: "372°C", change: "±0°C", status: "normal" },
        { name: "CCR RON", value: "99.1", change: "-0.1", status: "normal" },
        { name: "CDU Overhead pH", value: "5.8", change: "-0.2", status: "normal" },
        { name: "SO2 Emission", value: "42 ppm", change: "+3 ppm", status: "normal" },
      ],
      diagrams: ["CDU Process Flow", "HCR Reactor Profile", "VDU Column Profile"]
    }
  },
  // Weekly Monitoring AI 요약
  {
    id: "NTC-012",
    type: "notice",
    subType: "weekly-monitoring",
    title: "Weekly Monitoring AI 요약 (2025년 5주차)",
    description: "GenAI가 금주 운전 현황을 종합 분석했습니다. 장기 건전성 및 이상징후 탐지 결과를 확인하세요.",
    timestamp: "2025-02-02 09:00",
    status: "unread",
    severity: "warning",
    data: {
      items: [
        { name: "장기 건전성 종합", status: "warning", value: "전체 118건 중 Red 46건, Yellow 13건" },
        { name: "이상징후 탐지", status: "warning", value: "Danger 8건, Warning 11건, Normal 9건" },
        { name: "주요 이슈", status: "warning", value: "F-E101A Fouling 가속, FV-2001 Valve Sticking 의심" },
      ]
    }
  },
  // DCS 모듈 수정 요청
  {
    id: "NTC-009",
    type: "notice",
    subType: "dcs-modification",
    title: "DCS 모듈 수정 요청: HCR Reactor Control Logic 변경",
    description: "HCR Reactor Temperature Control Loop의 PID Tuning Parameter가 변경되었습니다.",
    timestamp: "2025-02-02 08:30",
    status: "unread",
    severity: "warning",
    unit: "HCR",
    data: {
      items: [
        { name: "변경 DCS 화면", status: "warning", value: "HCR-001: Reactor Temperature Control" },
        { name: "변경 적용", status: "warning", value: "TIC-2001 PID: P=2.5→3.0, I=120→90s, D=0→5s" },
        { name: "연결 ESR", status: "normal", value: "ESR-2025-0042: HCR APC 고도화 프로젝트" },
        { name: "변경 요청자", status: "normal", value: "DX팀 이민수 (ESR 담당)" },
        { name: "적용 일시", status: "normal", value: "2025-02-02 06:00 (야간 작업)" }
      ]
    },
    dcsModificationDetail: {
      esrId: "ESR-2025-0042",
      esrTitle: "HCR APC 고도화 프로젝트 - Phase 2",
      changeItems: [
        { item: "TIC-2001 P Gain", before: "2.5", after: "3.0" },
        { item: "TIC-2001 I Time", before: "120s", after: "90s" },
        { item: "TIC-2001 D Time", before: "0s", after: "5s" }
      ],
      requestor: "DX팀 이민수",
      appliedDate: "2025-02-02 06:00"
    }
  },
  // 월간 리포트 리뷰 요청
  {
    id: "NTC-010",
    type: "notice",
    subType: "monthly-report-review",
    title: "월간 Operation Report 리뷰 요청 (2025년 1월)",
    description: "2025년 1월 월간 운전 실적 보고서가 발행되었습니다. 담당 책임자 리뷰 후 Knowledge Asset에 최종 반영됩니다.",
    timestamp: "2025-02-03 09:00",
    status: "unread",
    severity: "info",
    unit: "전체",
    documentReview: {
      docType: "monthly-report",
      docTitle: "2025년 1월 월간 Operation Report",
      docVersion: "v1.0 (Draft)",
      latestVersion: "v1.0",
      period: "2025-01-01 ~ 2025-01-31",
      frequency: "월 1회",
      deadline: "2025-02-07",
      sections: [
        { title: "1. 생산 실적 요약", content: "CDU 월평균 처리량 52,100 bbl/d (계획 대비 100.2%). VDU 월평균 28,300 bbl/d (99.6%). HCR Feed 120.3 m3/h, Conversion 88.2%.", hasChange: false },
        { title: "2. 에너지 효율 (EII)", content: "EII: 98.2 (목표 97 이하 - 미달). CDU Heater Efficiency 91.3%. 한파로 인한 증기 소모량 증가가 주요 원인.", hasChange: true },
        { title: "3. 안전/환경", content: "무사고 연속 432일. SO2 배출 월평균 12.3 ppm (허용 35 ppm). 폐수 COD 85 mg/L (허용 120 mg/L).", hasChange: false },
        { title: "4. 주요 이슈 및 대응", content: "HCR WABT 상승 추세 지속 (月末 395C). E-101 Fouling 진행 UA값 88%. P-201B Seal Oil Leak 발견 (경미).", hasChange: true },
        { title: "5. 다음 달 계획", content: "Arabian Medium 전환 운전 예정. HCR 촉매 활성 모니터링 강화. E-101 세정 시기 검토.", hasChange: false }
      ],
      reviewHistory: [
        { date: "2025-01-06", reviewer: "김철수", version: "2024년 12월 Report v1.0", comment: "CDU 처리량 소폭 증가 확인, 에너지 효율 개선 필요" },
        { date: "2024-12-05", reviewer: "김철수", version: "2024년 11월 Report v1.0", comment: "동절기 운전 대비 점검 완료" }
      ]
    }
  },
  // Contingency Plan 리뷰 요청 (Living Document)
  {
    id: "NTC-011",
    type: "notice",
    subType: "contingency-plan-review",
    title: "Contingency Plan 리뷰 요청: HCR 비상운전 절차서",
    description: "HCR 비상운전 절차서의 반기 정기 리뷰가 필요합니다. 최신 운전 조건 반영 여부를 확인하고 승인해주세요.",
    timestamp: "2025-02-01 10:00",
    status: "unread",
    severity: "warning",
    unit: "HCR",
    documentReview: {
      docType: "contingency-plan",
      docTitle: "HCR 비상운전 절차서 (Emergency Operation Procedure)",
      docVersion: "v3.2",
      latestVersion: "v3.2",
      frequency: "연 2회 (반기)",
      deadline: "2025-02-15",
      sections: [
        { title: "1. 적용 범위", content: "HCR Unit (Reactor Section, Fractionation Section, H2 System) 비�� 상��� 발생 시 대응 절차.", hasChange: false },
        { title: "2. 비상 시나리오별 대응", content: "Scenario A: Reactor Runaway - WABT 급상승 시 Quench Gas 주입 및 Feed Cut 절차. Scenario B: H2 Compressor Trip - 단계별 Reactor Depressuring 절차.", hasChange: true },
        { title: "3. 운전 조건 변경 반영", content: "2024년 하반기 촉매 교체 후 Max WABT 한계 변경: 405C -> 410C. Quench Gas 주입 기준 WABT 변경: 395C -> 400C.", hasChange: true },
        { title: "4. 비상 연락 체계", content: "1차: 당직 Operation Supervisor → 2차: Process Engineer → 3차: Plant Manager. 외부: 소방서, 환경부 신고 기준 유지.", hasChange: false },
        { title: "5. 훈련 이력", content: "최근 훈련: 2024-11-15 (Reactor Runaway Drill). 참여 인원: 생산팀 A/B조, 공정기술팀. 결과: 양호 (대응시간 12분, 목표 15분 이내).", hasChange: false }
      ],
      reviewHistory: [
        { date: "2024-08-10", reviewer: "박영희", version: "v3.1", comment: "촉매 교체 전 기준으로 리뷰 완료. 교체 후 WABT 한계 재검토 필요" },
        { date: "2024-02-05", reviewer: "김철수", version: "v3.0", comment: "H2 Compressor Trip 시나리오 추가. 연락 체계 업데이트" },
        { date: "2023-08-12", reviewer: "김철수", version: "v2.5", comment: "정기 리뷰 - 특이사항 없음" }
      ]
    }
  },
  // Event 타입
  {
  id: "EVT-001",
    type: "event",
    subType: "licensor-review",
    title: "라이센서 분기 리뷰 예정",
    description: "UOP와 2025년 1분기 Performance Review가 2주 후 예정되어 있습니다.",
    timestamp: "2025-02-15 10:00",
    status: "unread",
    severity: "info",
    unit: "HCR"
  },
  {
    id: "EVT-002",
    type: "event",
    subType: "mode-switch",
    title: "Mode Switch 예정: HCR Diesel → Gasoline",
    description: "2025-02-05 Mode Switch 예정. 가이드 발행이 필요합니다.",
    timestamp: "2025-02-05 06:00",
    status: "unread",
    severity: "warning",
    unit: "HCR"
  },
  {
    id: "EVT-003",
    type: "event",
    subType: "scheduled",
    title: "하절기 운전 모드 전환 D-30",
    description: "하절기 운전 가이드라인 검토 및 준비가 필요합니다.",
    timestamp: "2025-03-01 00:00",
    status: "unread",
    severity: "info"
  }
]

// 팀장용 운영 KPI 목표 데이터
const TEAM_KPI_DATA = {
  engineers: [
    { id: "u-engineer-1", name: "김철수", team: "생산팀", processes: ["HCR", "VGOFCC"], dailyMonitoring: 92, weeklyMonitoring: 88, liveDocsUpdated: true, alertsHandled: 12, alertsPending: 2, ticketsActive: 3, avgResponseTime: "2.1h" },
    { id: "u-engineer-2", name: "박영희", team: "생산팀", processes: ["1CDU", "2CDU", "1VDU"], dailyMonitoring: 85, weeklyMonitoring: 90, liveDocsUpdated: true, alertsHandled: 8, alertsPending: 1, ticketsActive: 2, avgResponseTime: "1.8h" },
    { id: "u-engineer-3", name: "최진우", team: "생산팀", processes: ["RFCC", "VRHR"], dailyMonitoring: 78, weeklyMonitoring: 82, liveDocsUpdated: false, alertsHandled: 15, alertsPending: 4, ticketsActive: 5, avgResponseTime: "3.2h" },
    { id: "u-engineer-4", name: "한미영", team: "생산팀", processes: ["1KD", "2KD", "3KD"], dailyMonitoring: 95, weeklyMonitoring: 94, liveDocsUpdated: true, alertsHandled: 10, alertsPending: 0, ticketsActive: 1, avgResponseTime: "1.5h" },
    { id: "u-engineer-5", name: "송재현", team: "생산팀", processes: ["VBU", "RHDS"], dailyMonitoring: 88, weeklyMonitoring: 85, liveDocsUpdated: true, alertsHandled: 7, alertsPending: 1, ticketsActive: 2, avgResponseTime: "2.4h" },
  ],
  teamSummary: {
    avgDailyMonitoring: 88,
    avgWeeklyMonitoring: 88,
    liveDocsComplianceRate: 80,
    totalAlertsHandled: 52,
    totalAlertsPending: 8,
    totalActiveTickets: 13,
    avgResponseTime: "2.2h"
  }
}

// 팀장 전용 Notice 데이터 (에스컬레이션, 완료 승인 요청)
type TeamLeadNoticeType = "escalation-new" | "escalation-upgraded" | "completion-approval"
interface TeamLeadNotice {
  id: string
  type: TeamLeadNoticeType
  title: string
  description: string
  timestamp: string
  status: "unread" | "read"
  ticketId?: string
  process: string
  engineer: string
  priority: string
  // 에스컬레이션 상세
  escalationReason?: string
  previousPriority?: string
  // 완료 승인 상세
  completionReport?: {
    summary: string
    rootCause: string
    actions: string[]
    preventiveMeasures: string[]
    attachments: string[]
  }
}

const TEAM_LEAD_NOTICES: TeamLeadNotice[] = [
  // 신규 중요 이벤트 (팀원에게 P1 이벤트 생성)
  { 
    id: "TLN-001", 
    type: "escalation-new", 
    title: "HCR Reactor Temp 지속 상승 - 촉매 성능 저하 의심", 
    description: "김철수님에게 P1 이벤트가 신규 생성되었습니다.",
    timestamp: "2025-02-17 09:30",
    status: "unread",
    ticketId: "TKT-2025-0215",
    process: "HCR",
    engineer: "김철수",
    priority: "P1",
    escalationReason: "신규 P1 이벤트 생성"
  },
  // 우선순위 상향 에스컬레이션
  { 
    id: "TLN-002", 
    type: "escalation-upgraded", 
    title: "E-101 Fouling 가속화 - 세정 시기 결정 필요", 
    description: "박영희님의 이벤트가 P3 → P2로 상향되었습니다.",
    timestamp: "2025-02-16 14:20",
    status: "unread",
    ticketId: "TKT-2025-0212",
    process: "CDU",
    engineer: "박영희",
    priority: "P2",
    previousPriority: "P3",
    escalationReason: "상황 악화로 우선순위 상향"
  },
  // 완료 승인 요청
  { 
    id: "TLN-003", 
    type: "completion-approval", 
    title: "RFCC Regenerator 압력 안정화 작업 완료", 
    description: "최진우님이 이벤트 종결을 위해 팀장 승인을 요청했습니다.",
    timestamp: "2025-02-15 16:45",
    status: "unread",
    ticketId: "TKT-2025-0210",
    process: "RFCC",
    engineer: "최진우",
    priority: "P2",
    completionReport: {
      summary: "Regenerator 압력 변동 문제 해결 완료. 제어 밸브 튜닝 및 모니터링 로직 개선으로 안정화 달성.",
      rootCause: "PIC-1501 제어기 게인 값이 공정 변화에 따라 부적절해진 것으로 확인됨. 촉매 활성도 변화로 인한 반응 dynamics 변화가 주요 원인.",
      actions: [
        "PIC-1501 게인값 재튜닝 (Kp: 1.2→0.8, Ti: 120s→180s)",
        "압력 변동 감지 로직 추가 (±0.3 kg/cm2 이상 시 알람)",
        "Regenerator 온도-압력 상관관계 모니터링 강화"
      ],
      preventiveMeasures: [
        "분기별 제어기 성능 검토 일정 추가",
        "촉매 교체 시 제어기 파라미터 재검토 절차 수립",
        "압력 변동 트렌드 일일 모니터링 항목 추가"
      ],
      attachments: ["튜닝_결과_리포트.pdf", "압력_안정화_트렌드.xlsx"]
    }
  },
  // 추가 완료 승인 요청
  { 
    id: "TLN-004", 
    type: "completion-approval", 
    title: "VBU Catalyst 성능 저하 분석 및 대응 완료", 
    description: "송재현님이 이벤트 종결을 위해 팀장 승인을 요청했습니다.",
    timestamp: "2025-02-14 11:30",
    status: "read",
    ticketId: "TKT-2025-0208",
    process: "VBU",
    engineer: "송재현",
    priority: "P3",
    completionReport: {
      summary: "VBU 촉매 활성도 저하 원인 분석 완료. 피드 중 금속 성분 증가가 원인으로 확인됨.",
      rootCause: "최근 원유 블렌딩 비율 변경으로 피드 내 Ni, V 함량이 증가하여 촉매 피독 가속화.",
      actions: [
        "피드 금속 함량 모니터링 강화",
        "Guard bed 교체 주기 단축 (6개월→4개월)",
        "촉매 활성도 예측 모델 업데이트"
      ],
      preventiveMeasures: [
        "원유 블렌딩 변경 시 사전 영향 평가 절차 추가",
        "월별 촉매 성능 리뷰 미팅 정례화"
      ],
      attachments: ["촉매_분석_리포트.pdf", "금속함량_추이.xlsx", "Guard_bed_교체_계획.docx"]
    }
  },
]

export default function AlertsPage() {
  const router = useRouter()
  const { currentUser, isManagement, visibleProcesses } = useUser()
  const isTeamLead = currentUser.role === "team-lead" || currentUser.role === "division-head" || currentUser.role === "plant-head"
  
const [alerts, setAlerts] = useState<AlertItem[]>(SAMPLE_ALERTS)
const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(SAMPLE_ALERTS[0])
// 팀장 전용 Notice 선택 상태
const [selectedTeamLeadNotice, setSelectedTeamLeadNotice] = useState<TeamLeadNotice | null>(null)
const [showApprovalDialog, setShowApprovalDialog] = useState(false)
const [approvalComment, setApprovalComment] = useState("")
  const [showTicketDialog, setShowTicketDialog] = useState(false)
  const [ticketTitle, setTicketTitle] = useState("")
  const [ticketDescription, setTicketDescription] = useState("")
  const [ticketType, setTicketType] = useState<"Improvement" | "Trouble" | "Change" | "Analysis">("Trouble")
  const [ticketPriority, setTicketPriority] = useState<"P1" | "P2" | "P3" | "P4">("P2")
  const [ticketImpact, setTicketImpact] = useState<"Safety" | "Quality" | "Throughput" | "Cost" | "Energy">("Throughput")
  const [ticketDueDate, setTicketDueDate] = useState("")
  const [reviewComment, setReviewComment] = useState("")
  const [engineerOpinion, setEngineerOpinion] = useState<"normal" | "caution" | "ticket" | null>(null)
  const [engineerLog, setEngineerLog] = useState("")
  
  // Shelved Alert 다이얼로그 상태
  const [showShelvedDialog, setShowShelvedDialog] = useState(false)
  const [shelvedCategory, setShelvedCategory] = useState<string>("")
  const [shelvedReason, setShelvedReason] = useState("")
  const [shelvedUntil, setShelvedUntil] = useState("")
  const shelvedCategories = [
    { id: "known-issue", label: "공지된 이슈", desc: "이미 알려진 문제로 별도 조치 불필요" },
    { id: "no-action", label: "액션 없음", desc: "현재 조치가 필요하지 않은 상태" },
    { id: "project", label: "프로젝트", desc: "프로젝트/정비 등 계획된 작업 관련" },
    { id: "temporary", label: "일시 문제", desc: "일시적 상황으로 자연 해소 예상" },
  ]
  
  // 장기건전성 조치 입력 다이얼로그 상태
  const [showHealthActionDialog, setShowHealthActionDialog] = useState(false)
  const [healthActionType, setHealthActionType] = useState("online-cleaning")
  const [healthActionDesc, setHealthActionDesc] = useState("")
  const [healthActionUrgency, setHealthActionUrgency] = useState("urgent")

  // 이상징후 카테고리 상세 팝업 상태
  const [showAnomalyCategoryDialog, setShowAnomalyCategoryDialog] = useState(false)
  const [selectedAnomalyCategory, setSelectedAnomalyCategory] = useState<{id: string; name: string; description: string; top3: {tagId: string; description: string; severity: "high"|"medium"|"low"; deviation: string; detail: string}[]} | null>(null)
  
  // 관련 트렌드 전체보기 다이얼로그
  const [showFullTrendDialog, setShowFullTrendDialog] = useState(false)

  // DCS ESR 상세 팝업 상태
  const [showEsrDialog, setShowEsrDialog] = useState(false)
  
  // DCS CSR 요청 팝업 상태
  const [showCsrDialog, setShowCsrDialog] = useState(false)
  const [csrDescription, setCsrDescription] = useState("")
  
  // Daily Monitoring 판정 상태
  const [dailyMonitoringAction, setDailyMonitoringAction] = useState<"normal" | "caution" | "ticket" | null>(null)
  const [weeklyMonitoringAction, setWeeklyMonitoringAction] = useState<"normal" | "caution" | "ticket" | null>(null)
  const [expandedAnomalyCard, setExpandedAnomalyCard] = useState<string | null>(null)
  
  // Standing Issue 상태
  const [standingIssues, setStandingIssues] = useState<StandingIssue[]>(INITIAL_STANDING_ISSUES)
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null)
  const [issueUpdateContent, setIssueUpdateContent] = useState("")
  
  // DCS 화면 및 장치 정보 상태
  const [activeDcsScreen, setActiveDcsScreen] = useState(0)
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false)
  const [showPidDialog, setShowPidDialog] = useState(false)
  const [showDatasheetDialog, setShowDatasheetDialog] = useState(false)
  const [showAllVariables, setShowAllVariables] = useState(false)
  const [showAlarmHistoryDialog, setShowAlarmHistoryDialog] = useState(false)

  // Daily Monitoring 운전변수 트렌드 상태
  const [expandedVarTag, setExpandedVarTag] = useState<string | null>(null)
  const [showVarTrendDialog, setShowVarTrendDialog] = useState(false)
  const [selectedVarForTrend, setSelectedVarForTrend] = useState<{tag:string;name:string;val:string;guide:string;range:string;trend:number[]} | null>(null)

  // 변수 추가 다이얼로그
  const [showAddVarDialog, setShowAddVarDialog] = useState(false)
  const [addVarSearch, setAddVarSearch] = useState("")
  const [monitoredVarTags, setMonitoredVarTags] = useState<string[]>([])

  // Custom KPI 추가 상태 - select from variable list
  const [showAddKpiDialog, setShowAddKpiDialog] = useState(false)
  const [kpiSearchQuery, setKpiSearchQuery] = useState("")
  const [kpiName, setKpiName] = useState("")
  const [kpiValue, setKpiValue] = useState("")
  const [kpiTarget, setKpiTarget] = useState("")
  const [kpiUnit, setKpiUnit] = useState("")
  const [customKpis, setCustomKpis] = useState<CustomKPI[]>([])
  const [personalizedAlarms, setPersonalizedAlarms] = useState<PersonalizedAlarm[]>([])
  const [focusMonitoringItems, setFocusMonitoringItems] = useState<FocusMonitoringItem[]>([])

  // Load personalized data on mount
  useEffect(() => {
    const loadData = () => {
      setCustomKpis(getCustomKPIs())
      setPersonalizedAlarms(getPersonalizedAlarms())
      setFocusMonitoringItems(getFocusMonitoringItems())
    }
    loadData()
    const handleAlarmChange = () => setPersonalizedAlarms(getPersonalizedAlarms())
    const handleKpiChange = () => setCustomKpis(getCustomKPIs())
    const handleFocusChange = () => setFocusMonitoringItems(getFocusMonitoringItems())
    window.addEventListener("personalized-alarms-changed", handleAlarmChange)
    window.addEventListener("custom-kpis-changed", handleKpiChange)
    window.addEventListener("focus-monitoring-changed", handleFocusChange)
    return () => {
      window.removeEventListener("personalized-alarms-changed", handleAlarmChange)
      window.removeEventListener("custom-kpis-changed", handleKpiChange)
      window.removeEventListener("focus-monitoring-changed", handleFocusChange)
    }
  }, [])

  const handleAddKpi = useCallback(() => {
    if (!kpiName || !kpiValue || !kpiTarget) return
    saveCustomKPI({ name: kpiName, value: parseFloat(kpiValue), target: parseFloat(kpiTarget), unit: kpiUnit })
    setKpiName(""); setKpiValue(""); setKpiTarget(""); setKpiUnit("")
    setShowAddKpiDialog(false)
  }, [kpiName, kpiValue, kpiTarget, kpiUnit])

  // Tag -> Equipment hierarchy
  const TAG_EQ: Record<string, { process: string; zone: string; equipment: string; eqId: string; eqType: string; installed: string; lastTA: string }> = {
    "TI-2001": { process: "HCR", zone: "1st Stage Section", equipment: "C-201 Reactor", eqId: "R-2001", eqType: "Fixed Bed Reactor", installed: "2015", lastTA: "2024-06" },
    "TI-2002": { process: "HCR", zone: "2nd Stage Section", equipment: "C-202 Reactor", eqId: "R-2002", eqType: "Fixed Bed Reactor", installed: "2015", lastTA: "2024-06" },
    "TI-2003": { process: "HCR", zone: "1st Stage Section", equipment: "C-201 Reactor", eqId: "R-2001", eqType: "Fixed Bed Reactor", installed: "2015", lastTA: "2024-06" },
    "PI-2001": { process: "HCR", zone: "1st Stage Section", equipment: "C-201 Reactor", eqId: "R-2001", eqType: "Fixed Bed Reactor", installed: "2015", lastTA: "2024-06" },
    "FI-2001": { process: "HCR", zone: "Feed Section", equipment: "P-201 Feed Pump", eqId: "P-2001", eqType: "Centrifugal Pump", installed: "2015", lastTA: "2024-06" },
    "AI-2001": { process: "HCR", zone: "1st Stage Section", equipment: "C-201 Reactor", eqId: "R-2001", eqType: "Fixed Bed Reactor", installed: "2015", lastTA: "2024-06" },
    "FI-2010": { process: "HCR", zone: "Quench Section", equipment: "Quench System", eqId: "Q-2001", eqType: "Quench Gas System", installed: "2015", lastTA: "2024-06" },
    "TI-1001": { process: "CDU", zone: "Atmospheric Section", equipment: "C-101 Column", eqId: "C-1001", eqType: "Distillation Column", installed: "2010", lastTA: "2024-06" },
    "TI-1002": { process: "CDU", zone: "Vacuum Section", equipment: "C-102 Column", eqId: "C-1002", eqType: "Vacuum Column", installed: "2010", lastTA: "2024-06" },
    "PI-1001": { process: "CDU", zone: "Atmospheric Section", equipment: "C-101 Column", eqId: "C-1001", eqType: "Distillation Column", installed: "2010", lastTA: "2024-06" },
    "PI-3001": { process: "VDU", zone: "Vacuum Section", equipment: "C-301 Column", eqId: "C-3001", eqType: "Vacuum Distillation Column", installed: "2012", lastTA: "2024-06" },
    "TI-3001": { process: "VDU", zone: "Feed Section", equipment: "H-301 Furnace", eqId: "H-3001", eqType: "Fired Heater", installed: "2012", lastTA: "2024-06" },
    "TI-4001": { process: "FCC", zone: "Regenerator Section", equipment: "Regenerator", eqId: "R-4001", eqType: "FCC Regenerator", installed: "2013", lastTA: "2024-06" },
    "TI-4002": { process: "FCC", zone: "Reactor Section", equipment: "FCC Reactor", eqId: "R-4002", eqType: "Riser Reactor", installed: "2013", lastTA: "2024-06" },
    "LI-1001": { process: "CDU", zone: "Atmospheric Section", equipment: "D-101 Drum", eqId: "D-1001", eqType: "Reflux Drum", installed: "2010", lastTA: "2024-06" },
  }
  const getTagEq = (tagId?: string) => {
    if (!tagId) return null
    return TAG_EQ[tagId] || { process: selectedAlert?.unit || "HCR", zone: "General Section", equipment: "Unknown", eqId: "-", eqType: "-", installed: "-", lastTA: "-" }
  }

  // All process tags for search (100+ tags)
  const ALL_PROCESS_TAGS = React.useMemo(() => [
    // CDU Tags
    { tag: "TI-1001", name: "Column Top Temp", process: "CDU", unit: "\u00b0C", guide: 125, range: "120~130" },
    { tag: "TI-1002", name: "Column Mid Temp", process: "CDU", unit: "\u00b0C", guide: 245, range: "240~250" },
    { tag: "TI-1003", name: "Column Bottom Temp", process: "CDU", unit: "\u00b0C", guide: 358, range: "350~365" },
    { tag: "TI-1004", name: "Furnace Inlet Temp", process: "CDU", unit: "\u00b0C", guide: 275, range: "270~280" },
    { tag: "TI-1005", name: "Furnace Outlet Temp", process: "CDU", unit: "\u00b0C", guide: 365, range: "360~370" },
    { tag: "TI-1006", name: "OVHD Temp", process: "CDU", unit: "\u00b0C", guide: 110, range: "105~115" },
    { tag: "TI-1007", name: "Kero Draw Temp", process: "CDU", unit: "\u00b0C", guide: 190, range: "180~200" },
    { tag: "TI-1008", name: "LGO Draw Temp", process: "CDU", unit: "\u00b0C", guide: 270, range: "260~280" },
    { tag: "TI-1009", name: "HGO Draw Temp", process: "CDU", unit: "\u00b0C", guide: 325, range: "315~335" },
    { tag: "TI-1010", name: "Desalter Outlet Temp", process: "CDU", unit: "\u00b0C", guide: 135, range: "130~140" },
    { tag: "PI-1001", name: "Column Top Press", process: "CDU", unit: "kg/cm2", guide: 1.5, range: "1.2~1.8" },
    { tag: "PI-1002", name: "Column Bottom Press", process: "CDU", unit: "kg/cm2", guide: 1.9, range: "1.7~2.1" },
    { tag: "PI-1003", name: "Furnace Draft", process: "CDU", unit: "mmH2O", guide: -5, range: "-8~-2" },
    { tag: "FI-1001", name: "Feed Flow Rate", process: "CDU", unit: "m3/h", guide: 350, range: "300~370" },
    { tag: "FI-1002", name: "Reflux Flow Rate", process: "CDU", unit: "m3/h", guide: 90, range: "80~100" },
    { tag: "FI-1003", name: "Steam Flow", process: "CDU", unit: "T/h", guide: 4.5, range: "3.5~5.5" },
    { tag: "FI-1004", name: "Kero Product Flow", process: "CDU", unit: "m3/h", guide: 42, range: "35~50" },
    { tag: "FI-1005", name: "LGO Product Flow", process: "CDU", unit: "m3/h", guide: 38, range: "30~45" },
    { tag: "LI-1001", name: "Column Level", process: "CDU", unit: "%", guide: 50, range: "40~60" },
    { tag: "LI-1002", name: "Reflux Drum Level", process: "CDU", unit: "%", guide: 50, range: "30~70" },
    { tag: "AI-1001", name: "AR Flash Point", process: "CDU", unit: "\u00b0C", guide: 65, range: ">65" },
    { tag: "AI-1002", name: "Naphtha EP", process: "CDU", unit: "\u00b0C", guide: 180, range: "175~185" },
    // HCR Tags
    { tag: "TI-3001", name: "1st Reactor Inlet Temp", process: "HCR", unit: "\u00b0C", guide: 370, range: "365~380" },
    { tag: "TI-3002", name: "1st Reactor Outlet Temp", process: "HCR", unit: "\u00b0C", guide: 395, range: "390~405" },
    { tag: "TI-3003", name: "2nd Reactor Inlet Temp", process: "HCR", unit: "\u00b0C", guide: 380, range: "375~390" },
    { tag: "TI-3004", name: "2nd Reactor Outlet Temp", process: "HCR", unit: "\u00b0C", guide: 410, range: "400~420" },
    { tag: "TI-3005", name: "HPHT Sep Temp", process: "HCR", unit: "\u00b0C", guide: 255, range: "245~265" },
    { tag: "TI-3006", name: "Fractionator Top Temp", process: "HCR", unit: "\u00b0C", guide: 130, range: "120~140" },
    { tag: "TI-3007", name: "Fractionator Bottom Temp", process: "HCR", unit: "\u00b0C", guide: 345, range: "335~355" },
    { tag: "TI-3008", name: "Recycle Compressor Out", process: "HCR", unit: "\u00b0C", guide: 65, range: "55~75" },
    { tag: "TI-3009", name: "H2 Makeup Temp", process: "HCR", unit: "\u00b0C", guide: 45, range: "35~55" },
    { tag: "TI-3010", name: "Feed Preheat Outlet", process: "HCR", unit: "\u00b0C", guide: 310, range: "300~320" },
    { tag: "PI-3001", name: "1st Reactor Press", process: "HCR", unit: "kg/cm2", guide: 155, range: "150~160" },
    { tag: "PI-3002", name: "2nd Reactor Press", process: "HCR", unit: "kg/cm2", guide: 152, range: "148~158" },
    { tag: "PI-3003", name: "HP Separator Press", process: "HCR", unit: "kg/cm2", guide: 150, range: "145~155" },
    { tag: "PI-3004", name: "Recycle Gas Press", process: "HCR", unit: "kg/cm2", guide: 158, range: "153~163" },
    { tag: "FI-3001", name: "Feed Flow Rate", process: "HCR", unit: "m3/h", guide: 280, range: "250~310" },
    { tag: "FI-3002", name: "H2 Makeup Flow", process: "HCR", unit: "Nm3/h", guide: 85000, range: "75000~95000" },
    { tag: "FI-3003", name: "Recycle Gas Flow", process: "HCR", unit: "Nm3/h", guide: 120000, range: "105000~135000" },
    { tag: "FI-3004", name: "Quench Gas Flow 1st", process: "HCR", unit: "Nm3/h", guide: 15000, range: "10000~20000" },
    { tag: "FI-3005", name: "Quench Gas Flow 2nd", process: "HCR", unit: "Nm3/h", guide: 18000, range: "12000~24000" },
    { tag: "LI-3001", name: "HP Sep Level", process: "HCR", unit: "%", guide: 50, range: "40~60" },
    { tag: "LI-3002", name: "LP Sep Level", process: "HCR", unit: "%", guide: 50, range: "40~60" },
    { tag: "AI-3001", name: "H2 Purity", process: "HCR", unit: "mol%", guide: 99.5, range: ">99.0" },
    { tag: "AI-3002", name: "Product Sulfur", process: "HCR", unit: "ppm", guide: 5, range: "<10" },
    // VDU Tags
    { tag: "TI-2001", name: "VDU Column Top Temp", process: "VDU", unit: "\u00b0C", guide: 95, range: "85~105" },
    { tag: "TI-2002", name: "VDU Feed Temp", process: "VDU", unit: "\u00b0C", guide: 395, range: "385~405" },
    { tag: "TI-2003", name: "VDU Bottom Temp", process: "VDU", unit: "\u00b0C", guide: 350, range: "340~360" },
    { tag: "TI-2004", name: "LVGO Draw Temp", process: "VDU", unit: "\u00b0C", guide: 200, range: "190~210" },
    { tag: "TI-2005", name: "HVGO Draw Temp", process: "VDU", unit: "\u00b0C", guide: 320, range: "310~330" },
    { tag: "PI-2001", name: "VDU Column Top Vacuum", process: "VDU", unit: "mmHg", guide: 25, range: "20~30" },
    { tag: "PI-2002", name: "VDU Flash Zone Press", process: "VDU", unit: "mmHg", guide: 40, range: "35~50" },
    { tag: "FI-2001", name: "VDU Feed Flow", process: "VDU", unit: "m3/h", guide: 180, range: "160~200" },
    { tag: "FI-2002", name: "LVGO Product Flow", process: "VDU", unit: "m3/h", guide: 45, range: "35~55" },
    { tag: "FI-2003", name: "HVGO Product Flow", process: "VDU", unit: "m3/h", guide: 62, range: "50~75" },
    { tag: "LI-2001", name: "VDU Bottom Level", process: "VDU", unit: "%", guide: 55, range: "40~65" },
    // FPU Tags
    { tag: "TI-5001", name: "FPU Reactor Temp", process: "FPU", unit: "\u00b0C", guide: 340, range: "330~350" },
    { tag: "TI-5002", name: "FPU Stripper Top Temp", process: "FPU", unit: "\u00b0C", guide: 180, range: "170~190" },
    { tag: "TI-5003", name: "FPU Feed Preheat Temp", process: "FPU", unit: "\u00b0C", guide: 290, range: "280~300" },
    { tag: "PI-5001", name: "FPU Reactor Press", process: "FPU", unit: "kg/cm2", guide: 42, range: "38~46" },
    { tag: "FI-5001", name: "FPU Feed Flow", process: "FPU", unit: "m3/h", guide: 85, range: "70~100" },
    { tag: "FI-5002", name: "FPU H2 Flow", process: "FPU", unit: "Nm3/h", guide: 22000, range: "18000~26000" },
    { tag: "LI-5001", name: "FPU Sep Level", process: "FPU", unit: "%", guide: 50, range: "35~65" },
    // CCR Tags
    { tag: "TI-4001", name: "CCR Reactor #1 Inlet", process: "CCR", unit: "\u00b0C", guide: 530, range: "520~540" },
    { tag: "TI-4002", name: "CCR Reactor #2 Inlet", process: "CCR", unit: "\u00b0C", guide: 530, range: "520~540" },
    { tag: "TI-4003", name: "CCR Regenerator Temp", process: "CCR", unit: "\u00b0C", guide: 525, range: "515~535" },
    { tag: "PI-4001", name: "CCR Reactor Press", process: "CCR", unit: "kg/cm2", guide: 3.5, range: "3.0~4.0" },
    { tag: "FI-4001", name: "CCR Feed Flow", process: "CCR", unit: "m3/h", guide: 120, range: "100~140" },
    { tag: "FI-4002", name: "CCR H2 Flow", process: "CCR", unit: "Nm3/h", guide: 35000, range: "28000~42000" },
    // NHT/DHT Tags
    { tag: "TI-6001", name: "NHT Reactor Inlet Temp", process: "NHT", unit: "\u00b0C", guide: 310, range: "300~320" },
    { tag: "TI-6002", name: "NHT Reactor Outlet Temp", process: "NHT", unit: "\u00b0C", guide: 325, range: "315~335" },
    { tag: "PI-6001", name: "NHT Reactor Press", process: "NHT", unit: "kg/cm2", guide: 32, range: "28~36" },
    { tag: "FI-6001", name: "NHT Feed Flow", process: "NHT", unit: "m3/h", guide: 95, range: "80~110" },
    { tag: "TI-7001", name: "DHT Reactor Inlet Temp", process: "DHT", unit: "\u00b0C", guide: 355, range: "345~365" },
    { tag: "TI-7002", name: "DHT Reactor Outlet Temp", process: "DHT", unit: "\u00b0C", guide: 375, range: "365~385" },
    { tag: "PI-7001", name: "DHT Reactor Press", process: "DHT", unit: "kg/cm2", guide: 65, range: "58~72" },
    { tag: "FI-7001", name: "DHT Feed Flow", process: "DHT", unit: "m3/h", guide: 150, range: "130~170" },
    // Utility Tags
    { tag: "PI-9001", name: "HP Steam Header Press", process: "Utility", unit: "kg/cm2", guide: 42, range: "40~44" },
    { tag: "PI-9002", name: "MP Steam Header Press", process: "Utility", unit: "kg/cm2", guide: 12, range: "10~14" },
    { tag: "PI-9003", name: "LP Steam Header Press", process: "Utility", unit: "kg/cm2", guide: 3.5, range: "3.0~4.0" },
    { tag: "TI-9001", name: "CW Supply Temp", process: "Utility", unit: "\u00b0C", guide: 28, range: "25~32" },
    { tag: "TI-9002", name: "CW Return Temp", process: "Utility", unit: "\u00b0C", guide: 38, range: "34~42" },
    { tag: "FI-9001", name: "Fuel Gas Flow", process: "Utility", unit: "Nm3/h", guide: 5000, range: "4000~6000" },
    { tag: "FI-9002", name: "Instrument Air Flow", process: "Utility", unit: "Nm3/h", guide: 3500, range: "2800~4200" },
    { tag: "PI-9004", name: "Fuel Gas Press", process: "Utility", unit: "kg/cm2", guide: 2.5, range: "2.0~3.0" },
    { tag: "PI-9005", name: "Instrument Air Press", process: "Utility", unit: "kg/cm2", guide: 7.0, range: "6.5~7.5" },
    { tag: "PI-9006", name: "N2 Header Press", process: "Utility", unit: "kg/cm2", guide: 8.0, range: "7.0~9.0" },
  ], [])

  // Default health monitoring items for display
  const DEFAULT_HEALTH_MONITORS = React.useMemo(() => [
    { id: "FM-D1", equipId: "F-E101A", equipName: "Feed/Effluent HEX #1A", process: "HCR", mode: "W150N", healthIndexUnit: "W/m2K", currentValue: 520, limitValue: 350, projection: 21, prevTaValue: 515.8, driftPct: 82, color: "#ef4444", trend: [580, 575, 568, 560, 555, 548, 542, 538, 535, 530, 525, 520] },
    { id: "FM-D2", equipId: "F-E101B", equipName: "Feed/Effluent HEX #1B", process: "HCR", mode: "W150N", healthIndexUnit: "W/m2K", currentValue: 540, limitValue: 350, projection: 48, prevTaValue: 540.8, driftPct: -5, color: "#10b981", trend: [542, 541, 540, 539, 540, 541, 540, 539, 540, 541, 540, 540] },
    { id: "FM-D3", equipId: "F-E102A", equipName: "Feed/Effluent HEX #2A", process: "HCR", mode: "W600N", healthIndexUnit: "W/m2K", currentValue: 480, limitValue: 350, projection: 15, prevTaValue: 510.2, driftPct: 65, color: "#ef4444", trend: [530, 525, 520, 515, 508, 502, 498, 495, 490, 487, 483, 480] },
    { id: "FM-D4", equipId: "F-E103", equipName: "Product Cooler", process: "HCR", mode: "G-III", healthIndexUnit: "W/m2K", currentValue: 610, limitValue: 350, projection: 52, prevTaValue: 620.5, driftPct: -8, color: "#10b981", trend: [618, 616, 615, 614, 613, 612, 611, 610, 610, 611, 610, 610] },
    { id: "FM-D5", equipId: "F-E104", equipName: "Recycle Gas Cooler", process: "HCR", mode: "G-III", healthIndexUnit: "W/m2K", currentValue: 560, limitValue: 350, projection: 34, prevTaValue: 595.0, driftPct: 38, color: "#f59e0b", trend: [595, 592, 588, 585, 580, 578, 575, 572, 568, 565, 562, 560] },
    { id: "FM-D6", equipId: "F-A101", equipName: "Reactor Eff. Air Cooler", process: "HCR", mode: "W150N", healthIndexUnit: "W/m2K", currentValue: 340, limitValue: 350, projection: -2, prevTaValue: 420.0, driftPct: 105, color: "#ef4444", trend: [420, 410, 400, 392, 385, 378, 370, 365, 358, 352, 345, 340] },
  ], [])

  // 문서 리뷰 상태
  const [docReviewComment, setDocReviewComment] = useState("")
  const [docReviewConfirmed, setDocReviewConfirmed] = useState(false)
  const [expandedReviewSections, setExpandedReviewSections] = useState<string[]>([])

  // Standing Issue 추가 등록 다이얼로그 상태
  const [showDailyReportDialog, setShowDailyReportDialog] = useState(false)
  const [dailyReportText, setDailyReportText] = useState("")
  const [dailyReportLinkedTicketId, setDailyReportLinkedTicketId] = useState("")
  const [dailyReportTitle, setDailyReportTitle] = useState("")
  const [dailyReportCategory, setDailyReportCategory] = useState<"long-term" | "special" | "monitoring" | "daily-report">("daily-report")
  const [dailyReportUnit, setDailyReportUnit] = useState("")

  // 특이사항 없음 / 주의 팝업 상태
  const [showNoIssueDialog, setShowNoIssueDialog] = useState(false)
  const [noIssueAdditionalNote, setNoIssueAdditionalNote] = useState("")
  const [noIssueCategories, setNoIssueCategories] = useState<string[]>([])
  const [showCautionDialog, setShowCautionDialog] = useState(false)
  const [cautionCategory, setCautionCategory] = useState("")
  const [cautionHashtags, setCautionHashtags] = useState<string[]>([])
  const [cautionHashtagInput, setCautionHashtagInput] = useState("")
  const [cautionAdditionalLog, setCautionAdditionalLog] = useState("")

  // 추천 해시태그 (과거 사례 기반)
  const recommendedHashtags = [
    "#온도이상", "#압력변동", "#유량변화", "#촉매성능", "#열교환기", 
    "#부식모니터링", "#Fouling", "#진동이상", "#에너지효율", "#품질이탈",
    "#정비필요", "#운전조건변경", "#원료변화", "#환경규제", "#안전관련"
  ]

  // 오늘의 운전 분류 카테고리
  const operationCategories = [
    { id: "normal", label: "정상 운전", icon: "✓", description: "특별한 이벤트 없이 정상 운전" },
    { id: "equipment-sw", label: "장치 S/W", icon: "🔄", description: "Pump, Compressor 등 장치 전환" },
    { id: "process-test", label: "공정 테스트", icon: "🧪", description: "Performance Test, Yield Test 등" },
    { id: "feed-change", label: "원료 전환", icon: "🛢️", description: "Crude 또는 Feed 원료 변경" },
    { id: "rate-change", label: "운전부하 변경", icon: "📊", description: "Feed Rate 증감, Turn-down 등" },
    { id: "maintenance", label: "정비 작업", icon: "🔧", description: "예방정비, 긴급정비 진행" },
    { id: "startup-shutdown", label: "S/U · S/D", icon: "⚡", description: "Unit Start-up 또는 Shutdown" },
    { id: "catalyst", label: "촉매 관련", icon: "⚗️", description: "촉매 활성화, 재생, 교체 등" },
  ]

  // 오늘 TOB 기반 이벤트 요약 (모의 데이터)
  const getTodayEventSummary = () => {
    if (!selectedAlert) return ""
    const summaries = [
      `HCR Unit 정상 Full Rate 운전 유지. ${selectedAlert.unit || "HCR"} 주요 운전변수 모두 Guide 범위 내 운전 중.`,
      `Arabian Medium 원유 전환 운전 2일차. WABT +1.5°C 상승하였으나 정상 대응 범위.`,
      `금일 P-201B Seal Oil Leak 발견, 경미한 수준으로 정비팀 모니터링 중. 그 외 특이사항 없음.`
    ]
    return summaries[Math.floor(Math.random() * summaries.length)]
  }

  // 섹션 확장 상태
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    alert: true,
    notice: true,
    event: true
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const getTypeIcon = (type: AlertType, subType: string) => {
    if (type === "alert") return <AlertTriangle className="h-4 w-4" />
    if (type === "event") return <Calendar className="h-4 w-4" />
    
    switch (subType) {
      case "anomaly": return <Activity className="h-4 w-4" />
      case "long-term": return <TrendingUp className="h-4 w-4" />
      case "efficiency": return <Gauge className="h-4 w-4" />
      case "communication": return <MessageSquare className="h-4 w-4" />
      case "custom-alarm": return <Bell className="h-4 w-4" />
      case "external-data": return <ExternalLink className="h-4 w-4" />
      case "auto-calc": return <Calculator className="h-4 w-4" />
      case "daily-monitoring": return <Eye className="h-4 w-4" />
      case "weekly-monitoring": return <BarChart3 className="h-4 w-4" />
      case "dcs-modification": return <Monitor className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "critical": return "bg-red-500"
      case "warning": return "bg-amber-500"
      default: return "bg-blue-500"
    }
  }

  const getSubTypeLabel = (subType: string) => {
    switch (subType) {
      case "operation-guide": return "Operation Guide"
      case "anomaly": return "이상징후"
      case "long-term": return "장기 모니터링"
      case "efficiency": return "효율성"
      case "communication": return "이벤트 업데이트"
      case "custom-alarm": return "커스텀 알람"
      case "external-data": return "외부 데이터"
      case "auto-calc": return "자동 계산"
      case "daily-monitoring": return "Daily Monitoring"
      case "weekly-monitoring": return "Weekly Monitoring"
      case "dcs-modification": return "DCS 수정 요청"
      case "licensor-review": return "라이센서 리뷰"
      case "mode-switch": return "Mode Switch"
      case "scheduled": return "예정 이벤트"
      default: return subType
    }
  }

  const handleAcknowledge = (alertId: string) => {
    const now = new Date().toISOString().slice(0, 16).replace("T", " ")
    setAlerts(alerts.map(a => {
      if (a.id !== alertId) return a
      const updatedHistory = a.alarmHistory ? [
        { timestamp: now, value: a.data?.value ?? 0, action: `인지 처리 (Standing Alert 전환) - 발생 ${a.occurrenceHistory?.length ?? 0}회` },
        ...a.alarmHistory
      ] : a.alarmHistory
      return { ...a, status: "acknowledged" as AlertStatus, alertState: "standing" as AlertState, occurrenceHistory: [], alarmHistory: updatedHistory }
    }))
  }

  const handleShelveAlert = (alertId: string) => {
    if (!shelvedCategory || !shelvedUntil) {
      alert("Shelved 처리 사유와 재검토 시점을 선택해주세요.")
      return
    }
    const categoryLabel = shelvedCategories.find(c => c.id === shelvedCategory)?.label || shelvedCategory
    const fullReason = shelvedReason.trim() ? `[${categoryLabel}] ${shelvedReason.trim()}` : `[${categoryLabel}]`
    setAlerts(alerts.map(a => a.id === alertId ? { 
      ...a, 
      status: "resolved", 
      alertState: "shelved" as AlertState,
      shelvedReason: fullReason,
      shelvedUntil: shelvedUntil
    } : a))
    setShowShelvedDialog(false)
    setShelvedCategory("")
    setShelvedReason("")
    setShelvedUntil("")
    alert(`알람이 Shelved 처리되었습니다.\n사유: ${categoryLabel}\n재개 시점: ${shelvedUntil}`)
  }

  const getAlertGradeLabel = (grade?: AlertGrade) => {
    switch (grade) {
      case "high": return { label: "상", color: "bg-red-500 text-white" }
      case "medium": return { label: "중", color: "bg-amber-500 text-white" }
      case "low": return { label: "하", color: "bg-blue-500 text-white" }
      default: return { label: "-", color: "bg-gray-300" }
    }
  }

  const getAlertStateLabel = (state?: AlertState) => {
    switch (state) {
      case "new": return { label: "New Alert", color: "bg-red-100 text-red-700 border-red-300" }
      case "standing": return { label: "Standing Alert", color: "bg-amber-100 text-amber-700 border-amber-300" }
      case "shelved": return { label: "Shelved Alert", color: "bg-gray-100 text-gray-600 border-gray-300" }
      default: return { label: "-", color: "bg-gray-100" }
    }
  }

  const handleCreateTicket = (alert: AlertItem) => {
    setSelectedAlert(alert)
    setTicketTitle(alert.title)
    setTicketDescription(`${alert.description}\n\n[자동 생성된 참조 데이터]\n- 발생시각: ${alert.timestamp}\n- Unit: ${alert.unit || "N/A"}${alert.data?.tagId ? `\n- Tag: ${alert.data.tagId}\n- 측정값: ${alert.data.value}\n- 기준값: ${alert.data.limit}` : ""}`)
    setShowTicketDialog(true)
  }

  const handleSubmitTicket = () => {
    const unit = selectedAlert?.unit || "VDU"
    const ticketId = `EVT-${Date.now().toString().slice(-6)}`
    const timestamp = new Date().toLocaleString("ko-KR")
    const CURRENT_USER = "김지수"
    
    const newTicket = {
      id: ticketId,
      title: ticketTitle,
      description: ticketDescription,
      ticketType: ticketType,
      priority: ticketPriority,
      impact: ticketImpact,
      owner: UNIT_OWNERS[unit] || "미배정",
      requester: CURRENT_USER,
      status: "Open" as const,
      createdDate: new Date().toISOString().split("T")[0],
      dueDate: ticketDueDate,
      bottleneck: "시작 전",
      accessLevel: "Team" as const,
      unit: unit,
      context: {
        unit: unit,
      },
      workPackages: [],
      messages: [{
        id: `msg-${Date.now()}`,
        ticketId: ticketId,
        author: CURRENT_USER,
        role: "requester" as const,
        messageType: "opinion" as const,
        content: `새로운 이벤트가 발행되었습니다: ${ticketTitle}`,
        timestamp: new Date().toISOString(),
      }],
      // 이벤트 프로세스 플로우 초기화
      processStatus: "issued" as const,
      processFlow: [
        { step: "issued" as const, label: "이벤트 발행", status: "current" as const, assignee: CURRENT_USER, team: "공정기술팀", timestamp },
        { step: "accepted" as const, label: "접수", status: "upcoming" as const },
        { step: "review" as const, label: "기술검토", status: "upcoming" as const },
        { step: "publisher-confirm" as const, label: "발행자 확인", status: "upcoming" as const },
        { step: "closed" as const, label: "종결", status: "upcoming" as const },
      ],
      opinions: [],
      comments: [],
    }

    saveTicket(newTicket)

    // 기본 Work Package 추가
    const defaultWorkPackages = [
      {
        ticketId: newTicket.id,
        wpType: "Analysis" as const,
        title: "현�� 분석",
        description: "문제 또는 개선사항에 대한 근본 원인 및 데이터 분석",
        ownerTeam: "Process Engineering",
        status: "Not Started" as const,
        dueDate: "",
      },
      {
        ticketId: newTicket.id,
        wpType: "Decision" as const,
        title: "의사결정",
        description: "분석 결과를 바탕으로 ��행 방안 결정",
        ownerTeam: "Operations Coordination",
        status: "Not Started" as const,
        dueDate: "",
      },
      {
        ticketId: newTicket.id,
        wpType: "Execution" as const,
        title: "실행",
        description: "결정된 방안의 실제 실행 및 구현",
        ownerTeam: "Project / Facility",
        status: "Not Started" as const,
        dueDate: "",
      },
      {
        ticketId: newTicket.id,
        wpType: "Validation" as const,
        title: "검증",
        description: "실행 결과의 효과성 검증 및 모니터링",
        ownerTeam: "DX / Modeling",
        status: "Not Started" as const,
        dueDate: "",
      },
    ]

    defaultWorkPackages.forEach((wp) => {
      addWorkPackageToTicket(newTicket.id, wp)
    })

    if (selectedAlert) {
      setAlerts(alerts.map(a => a.id === selectedAlert.id ? { ...a, status: "resolved" } : a))
    }
    
    setShowTicketDialog(false)
    setTicketTitle("")
    setTicketDescription("")
    setTicketType("Trouble")
    setTicketPriority("P2")
    setTicketImpact("Throughput")
    setTicketDueDate("")
    
    // 생성된 이벤트으로 이동
    router.push(`/tickets/${newTicket.id}`)
  }

  const handleReviewAction = (alertId: string, action: "normal" | "caution" | "immediate") => {
    if (action === "immediate") {
      const alertItem = alerts.find(a => a.id === alertId)
      if (alertItem) handleCreateTicket(alertItem)
    } else {
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, status: "resolved" } : a))
    }
    setReviewComment("")
  }

  const handleEngineerOpinionSubmit = (alertId: string) => {
    if (engineerOpinion === "ticket") {
      const alertItem = alerts.find(a => a.id === alertId)
      if (alertItem) {
        setTicketTitle(alertItem.title)
        
        // 상세 설명에 엔지니어 의견과 관련 데이터 포함
        let desc = alertItem.description
        desc += "\n\n### 엔지니어 검토 의견"
        desc += `\n- 판정: 이벤트화 (즉시 조치 필요)`
        desc += `\n- 검토일시: ${new Date().toLocaleString("ko-KR")}`
        if (engineerLog) {
          desc += `\n- 검토 의견: ${engineerLog}`
        }
        
        desc += "\n\n### 자동 생성된 참조 데이터"
        desc += `\n- 발생시각: ${alertItem.timestamp}`
        desc += `\n- Unit: ${alertItem.unit || "N/A"}`
        
        if (alertItem.data?.items) {
          desc += "\n\n### 상세 항목"
          alertItem.data.items.forEach(item => {
            desc += `\n- ${item.name}: ${item.value} (${item.status === "warning" ? "��의" : "정상"})`
          })
        }
        
        setTicketDescription(desc)
        
        // 기본값 설정
        setTicketType("Trouble")
        setTicketPriority("P2")
        if (alertItem.subType === "anomaly") setTicketType("Analysis")
        if (alertItem.subType === "efficiency") setTicketType("Improvement")
        
        setShowTicketDialog(true)
      }
    } else {
      const statusLabel = engineerOpinion === "normal" ? "정상" : "주의"
      alert(`엔지니어 의견이 저장되었습니다.\n\n판정: ${statusLabel}\n로그: ${engineerLog || "없음"}`)
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, status: "resolved" } : a))
    }
    setEngineerOpinion(null)
    setEngineerLog("")
  }

  // Standing Issue 업데이트 핸들러
  const handleUpdateStandingIssue = (issueId: string) => {
    if (!issueUpdateContent.trim()) return
    setStandingIssues(prev => prev.map(issue => 
      issue.id === issueId ? {
        ...issue,
        lastUpdated: new Date().toISOString().split("T")[0],
        updates: [
          { date: new Date().toISOString().split("T")[0], content: issueUpdateContent, author: "나 (현재 사용자)" },
          ...issue.updates
        ]
      } : issue
    ))
    setEditingIssueId(null)
    setIssueUpdateContent("")
  }

// 알림 선택 시 리뷰 상태 초기화
const handleSelectAlert = (alert: AlertItem) => {
  setSelectedAlert(alert)
  setSelectedTeamLeadNotice(null) // 팀장 Notice 선택 해제
  setDocReviewComment("")
    setDocReviewConfirmed(false)
    setExpandedReviewSections([])
    setActiveDcsScreen(0)
    setShowEquipmentDialog(false)
    setShowPidDialog(false)
    setShowDatasheetDialog(false)
    setShowAllVariables(false)
  }

  // Standing Issue 추가 등록 핸들러
  const handleDailyReportSubmit = () => {
    if (!dailyReportTitle.trim() || !dailyReportText.trim()) return

    const newIssue: StandingIssue = {
      id: `SI-${String(standingIssues.length + 1).padStart(3, "0")}`,
      title: dailyReportTitle,
      description: dailyReportText,
      category: dailyReportCategory,
      status: "active",
      unit: dailyReportUnit || undefined,
      linkedTicketId: dailyReportLinkedTicketId || undefined,
      linkedTicketTitle: dailyReportLinkedTicketId ? getTickets().find(t => t.id === dailyReportLinkedTicketId)?.title : undefined,
      createdDate: new Date().toISOString().split("T")[0],
      lastUpdated: new Date().toISOString().split("T")[0],
      updates: [
        { date: new Date().toISOString().split("T")[0], content: dailyReportText, author: "나 (현재 사용자)" }
      ]
    }

    setStandingIssues(prev => [newIssue, ...prev])
    setShowDailyReportDialog(false)
    setDailyReportTitle("")
    setDailyReportText("")
    setDailyReportLinkedTicketId("")
    setDailyReportCategory("daily-report")
    setDailyReportUnit("")
  }

  // Notice 정렬: daily-monitoring을 최상위, 그 다음 anomaly, 나머지는 시간순
  const noticeSortOrder: Record<string, number> = { "daily-monitoring": 0, "weekly-monitoring": 1, "monthly-report-review": 2, "contingency-plan-review": 3, "anomaly": 4, "dcs-modification": 5 }
  const sortedNotices = alerts.filter(a => a.type === "notice").sort((a, b) => {
    const orderA = noticeSortOrder[a.subType] ?? 99
    const orderB = noticeSortOrder[b.subType] ?? 99
    return orderA - orderB
  })
  
  // 팀장의 경우 Alert는 "상" 등급만 표시 (전체 담당 공정 기준)
  const filteredAlerts = isTeamLead 
    ? alerts.filter(a => a.type === "alert" && a.alertGrade === "high")
    : alerts.filter(a => a.type === "alert")
  
  const alertsByType = {
    alert: filteredAlerts,
    notice: sortedNotices,
    event: alerts.filter(a => a.type === "event")
  }

  const unreadCounts = {
    alert: alertsByType.alert.filter(a => a.status === "unread").length,
    notice: alertsByType.notice.filter(a => a.status === "unread").length,
    event: alertsByType.event.filter(a => a.status === "unread").length
  }

  // --- 모니터링 그룹: 태그별 연관 태그 그룹 ---
  const MONITORING_GROUPS: Record<string, { name: string; tags: { id: string; desc: string; unit: string; type: string }[] }> = {
    "HCR-Reactor": {
      name: "HCR Reactor Section",
      tags: [
        { id: "TI-3001", desc: "Reactor Inlet Temp", unit: "deg.C", type: "Temperature" },
        { id: "TI-3002", desc: "Reactor Outlet Temp", unit: "deg.C", type: "Temperature" },
        { id: "TI-3003", desc: "Reactor Bed #1 Temp", unit: "deg.C", type: "Temperature" },
        { id: "TI-3004", desc: "Reactor Bed #2 Temp", unit: "deg.C", type: "Temperature" },
        { id: "PI-3001", desc: "Reactor Inlet Pressure", unit: "kg/cm2", type: "Pressure" },
        { id: "PDI-3001", desc: "Reactor dP", unit: "kg/cm2", type: "Pressure" },
        { id: "FI-3001", desc: "Feed Flow", unit: "m3/h", type: "Flow" },
        { id: "FI-3002", desc: "H2 Makeup Flow", unit: "Nm3/h", type: "Flow" },
        { id: "FI-3003", desc: "Quench Flow", unit: "Nm3/h", type: "Flow" },
        { id: "AI-3001", desc: "H2 Purity", unit: "%", type: "Analysis" },
      ],
    },
    "HCR-Fractionation": {
      name: "HCR Fractionation Section",
      tags: [
        { id: "TI-3010", desc: "Fractionator Top Temp", unit: "deg.C", type: "Temperature" },
        { id: "TI-3011", desc: "Fractionator Bottom Temp", unit: "deg.C", type: "Temperature" },
        { id: "PI-3010", desc: "Fractionator Pressure", unit: "kg/cm2", type: "Pressure" },
        { id: "LI-3010", desc: "Fractionator Level", unit: "%", type: "Level" },
        { id: "FI-3010", desc: "Naphtha Product Flow", unit: "m3/h", type: "Flow" },
        { id: "FI-3011", desc: "Diesel Product Flow", unit: "m3/h", type: "Flow" },
      ],
    },
    "VDU-Column": {
      name: "VDU Vacuum Column Section",
      tags: [
        { id: "TI-2001", desc: "Column Top Temp", unit: "deg.C", type: "Temperature" },
        { id: "TI-2002", desc: "Column Bottom Temp", unit: "deg.C", type: "Temperature" },
        { id: "TI-2003", desc: "LVGO Draw Temp", unit: "deg.C", type: "Temperature" },
        { id: "TI-2004", desc: "HVGO Draw Temp", unit: "deg.C", type: "Temperature" },
        { id: "PI-2001", desc: "Column Top Pressure", unit: "mmHg", type: "Pressure" },
        { id: "LI-2001", desc: "Column Bottom Level", unit: "%", type: "Level" },
        { id: "FI-2001", desc: "Feed Flow", unit: "m3/h", type: "Flow" },
        { id: "FI-2002", desc: "LVGO Product Flow", unit: "m3/h", type: "Flow" },
      ],
    },
    "CDU-Column": {
      name: "CDU Atmospheric Column Section",
      tags: [
        { id: "TI-1001", desc: "Column Top Temp", unit: "deg.C", type: "Temperature" },
        { id: "TI-1002", desc: "Column Bottom Temp", unit: "deg.C", type: "Temperature" },
        { id: "PI-1001", desc: "Column Pressure", unit: "kg/cm2", type: "Pressure" },
        { id: "FI-1001", desc: "Crude Feed Flow", unit: "m3/h", type: "Flow" },
        { id: "LI-1001", desc: "Column Bottom Level", unit: "%", type: "Level" },
        { id: "TIC-1001", desc: "Top Temp Controller", unit: "deg.C", type: "Temperature" },
      ],
    },
  }

  // 태그 ID로 해당 모니터링 그룹 찾기
  function getMonitoringGroup(tagId: string) {
    for (const [key, group] of Object.entries(MONITORING_GROUPS)) {
      if (group.tags.some(t => t.id === tagId)) return { key, ...group }
    }
    // 태그 prefix로 유닛 추론 후 가장 적합한 그룹 반환
    const prefix = tagId?.split("-")[0]
    const unitNum = tagId?.match(/-(\d)/)?.[1]
    if (unitNum === "3") return { key: "HCR-Reactor", ...MONITORING_GROUPS["HCR-Reactor"] }
    if (unitNum === "2") return { key: "VDU-Column", ...MONITORING_GROUPS["VDU-Column"] }
    if (unitNum === "1") return { key: "CDU-Column", ...MONITORING_GROUPS["CDU-Column"] }
    return { key: "HCR-Reactor", ...MONITORING_GROUPS["HCR-Reactor"] }
  }

  // 모의 트렌드 데이터 생성 (태그별)
  function generateMockTrend(tagId: string, tagType: string): { values: number[]; limit: number | null; lowLimit: number | null; unit: string } {
    const seed = tagId.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    const rand = (s: number) => ((Math.sin(s) * 10000) % 1 + 1) % 1
    if (tagType === "Temperature") {
      const base = 300 + (seed % 150)
      const limit = base + 20 + (seed % 15)
      const values = Array.from({ length: 10 }, (_, i) => +(base + (rand(seed + i) * 30 - 10)).toFixed(1))
      return { values, limit, lowLimit: null, unit: "deg.C" }
    }
    if (tagType === "Pressure") {
      const base = 5 + (seed % 30)
      const limit = base + 5
      const values = Array.from({ length: 10 }, (_, i) => +(base + (rand(seed + i) * 6 - 2)).toFixed(2))
      return { values, limit, lowLimit: base - 3, unit: "kg/cm2" }
    }
    if (tagType === "Flow") {
      const base = 100 + (seed % 500)
      const values = Array.from({ length: 10 }, (_, i) => +(base + (rand(seed + i) * 80 - 30)).toFixed(1))
      return { values, limit: base + 60, lowLimit: base - 40, unit: "m3/h" }
    }
    if (tagType === "Level") {
      const base = 50
      const values = Array.from({ length: 10 }, (_, i) => +(base + (rand(seed + i) * 30 - 15)).toFixed(1))
      return { values, limit: 80, lowLimit: 20, unit: "%" }
    }
    // Analysis
    const base = 80 + (seed % 15)
    const values = Array.from({ length: 10 }, (_, i) => +(base + (rand(seed + i) * 10 - 5)).toFixed(1))
    return { values, limit: null, lowLimit: 70, unit: "%" }
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background flex">
        {/* 좌측 알림 리스트 패널 */}
        <div className="w-80 border-r border-border flex flex-col bg-card">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">전체 알람</h1>
              <Badge variant="destructive" className="ml-auto">
                {unreadCounts.alert + unreadCounts.notice + unreadCounts.event}
              </Badge>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2">
              {/* Alert 섹션 */}
              <div className="mb-2">
                <button
                  onClick={() => toggleSection("alert")}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {expandedSections.alert ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-sm">{isTeamLead ? "Alert (상 등급)" : "Alert"}</span>
                  {unreadCounts.alert > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs">{unreadCounts.alert}</Badge>
                  )}
                </button>
                {expandedSections.alert && (
                  <div className="ml-2 space-y-1 mt-1">
                    {alertsByType.alert.map(item => {
                      const gradeInfo = getAlertGradeLabel(item.alertGrade)
                      const stateInfo = getAlertStateLabel(item.alertState)
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectAlert(item)}
                          className={cn(
                            "w-full text-left p-2 rounded-lg transition-colors",
                            selectedAlert?.id === item.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50",
                            item.alertState === "new" && "border-l-2 border-l-red-500"
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <Badge className={cn("text-xs px-1.5 py-0 shrink-0", gradeInfo.color)}>{gradeInfo.label}</Badge>
                            <Badge variant="outline" className={cn("text-xs px-1.5 py-0 shrink-0", stateInfo.color)}>{stateInfo.label}</Badge>
                            <span className="text-xs text-muted-foreground shrink-0">{item.unit}</span>
                            {item.alertState === "new" && item.occurrenceHistory && item.occurrenceHistory.length > 1 && (
                              <span className="flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold shrink-0" title={`${item.occurrenceHistory.length}회 발생`}>
                                {item.occurrenceHistory.length}
                              </span>
                            )}
                          </div>
                          <p className={cn("text-sm mt-1", item.alertState === "new" ? "font-bold" : "font-medium")}>{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Notice 섹션 - 팀원만 표시 (팀장은 Notice 안 봄) */}
              {!isTeamLead && (
                <div className="mb-2">
                  <button
                    onClick={() => toggleSection("notice")}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {expandedSections.notice ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Info className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">Notice</span>
                    {unreadCounts.notice > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">{unreadCounts.notice}</Badge>
                    )}
                  </button>
                  {expandedSections.notice && (
                    <div className="ml-2 space-y-1 mt-1">
                      {alertsByType.notice.map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectAlert(item)}
                          className={cn(
                            "w-full text-left p-2 rounded-lg transition-colors",
                            selectedAlert?.id === item.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50",
                            item.status === "unread" && "border-l-2 border-l-blue-500"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {getTypeIcon(item.type, item.subType)}
                            <Badge variant="outline" className="text-xs">{getSubTypeLabel(item.subType)}</Badge>
                          </div>
                          <p className="text-sm font-medium truncate mt-1">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Event 섹션 - 팀원만 표시 */}
              {!isTeamLead && (
                <div className="mb-2">
                  <button
                    onClick={() => toggleSection("event")}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {expandedSections.event ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Calendar className="h-4 w-4 text-amber-500" />
                    <span className="font-medium text-sm">Event</span>
                    {unreadCounts.event > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">{unreadCounts.event}</Badge>
                    )}
                  </button>
                  {expandedSections.event && (
                    <div className="ml-2 space-y-1 mt-1">
                      {alertsByType.event.map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectAlert(item)}
                          className={cn(
                            "w-full text-left p-2 rounded-lg transition-colors",
                            selectedAlert?.id === item.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50",
                            item.status === "unread" && "border-l-2 border-l-amber-500"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {getTypeIcon(item.type, item.subType)}
                            <Badge variant="outline" className="text-xs">{getSubTypeLabel(item.subType)}</Badge>
                          </div>
                          <p className="text-sm font-medium truncate mt-1">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 팀장 전용: Notice 섹션 (에스컬레이션, 완료 승인 요청) */}
              {isTeamLead && (
                <div className="mb-2">
                  <button
                    onClick={() => toggleSection("notice")}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {expandedSections.notice ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Info className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">Notice</span>
                    <Badge variant="secondary" className="ml-auto text-xs">{TEAM_LEAD_NOTICES.filter(n => n.status === "unread").length}</Badge>
                  </button>
                  {expandedSections.notice && (
                    <div className="ml-2 space-y-1 mt-1">
                      {TEAM_LEAD_NOTICES.map(notice => (
                        <button
                          key={notice.id}
                          onClick={() => { setSelectedTeamLeadNotice(notice); setSelectedAlert(null); }}
                          className={cn(
                            "w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors",
                            selectedTeamLeadNotice?.id === notice.id ? "bg-primary/10 border border-primary/30" : "",
                            notice.status === "unread" && "border-l-2 border-l-blue-500"
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            {notice.type === "escalation-new" && <Badge className="text-xs px-1.5 py-0 bg-red-500 text-white">신규 P1</Badge>}
                            {notice.type === "escalation-upgraded" && <Badge className="text-xs px-1.5 py-0 bg-orange-500 text-white">에스컬레이션</Badge>}
                            {notice.type === "completion-approval" && <Badge className="text-xs px-1.5 py-0 bg-green-600 text-white">승인 요청</Badge>}
                            <span className="text-xs text-muted-foreground">{notice.process}</span>
                          </div>
                          <p className={cn("text-sm mt-1", notice.status === "unread" ? "font-bold" : "font-medium")}>{notice.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{notice.engineer} | {notice.timestamp}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 우측 세부 화면 */}
        <div className="flex-1 flex flex-col">
          {/* 팀장 전용 Notice 상세 화면 */}
          {isTeamLead && selectedTeamLeadNotice ? (
            <>
              {/* Notice 헤더 */}
              <div className="p-6 border-b border-border bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn(
                    "p-2 rounded-full text-white",
                    selectedTeamLeadNotice.type === "escalation-new" ? "bg-red-500" :
                    selectedTeamLeadNotice.type === "escalation-upgraded" ? "bg-orange-500" : "bg-green-600"
                  )}>
                    {selectedTeamLeadNotice.type === "completion-approval" ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {selectedTeamLeadNotice.type === "escalation-new" && <Badge className="bg-red-500 text-white">신규 중요 이벤트</Badge>}
                      {selectedTeamLeadNotice.type === "escalation-upgraded" && <Badge className="bg-orange-500 text-white">우선순위 에스컬레이션</Badge>}
                      {selectedTeamLeadNotice.type === "completion-approval" && <Badge className="bg-green-600 text-white">완료 승인 요청</Badge>}
                      <Badge variant="outline">{selectedTeamLeadNotice.process}</Badge>
                      <Badge variant="secondary">{selectedTeamLeadNotice.priority}</Badge>
                    </div>
                  </div>
                </div>
                <h2 className="text-xl font-semibold">{selectedTeamLeadNotice.title}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" />{selectedTeamLeadNotice.engineer}</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{selectedTeamLeadNotice.timestamp}</span>
                </div>
              </div>

              {/* Notice 콘텐츠 */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  <p className="text-muted-foreground">{selectedTeamLeadNotice.description}</p>

                  {/* 에스컬레이션 상세 */}
                  {(selectedTeamLeadNotice.type === "escalation-new" || selectedTeamLeadNotice.type === "escalation-upgraded") && (
                    <Card className="border-orange-200 bg-orange-50/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          에스컬레이션 정보
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">사유</p>
                            <p className="text-sm font-medium">{selectedTeamLeadNotice.escalationReason}</p>
                          </div>
                          {selectedTeamLeadNotice.previousPriority && (
                            <div>
                              <p className="text-xs text-muted-foreground">우선순위 변경</p>
                              <p className="text-sm font-medium">{selectedTeamLeadNotice.previousPriority} → {selectedTeamLeadNotice.priority}</p>
                            </div>
                          )}
                        </div>
                        {selectedTeamLeadNotice.ticketId && (
                          <Link href={`/tickets/${selectedTeamLeadNotice.ticketId.replace("TKT-", "")}`}>
                            <Button variant="outline" size="sm" className="gap-2">
                              <ExternalLink className="h-4 w-4" />
                              이벤트 상세 보기
                            </Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* 완료 승인 요청 상세 */}
                  {selectedTeamLeadNotice.type === "completion-approval" && selectedTeamLeadNotice.completionReport && (
                    <>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            완료 보고서 요약
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{selectedTeamLeadNotice.completionReport.summary}</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Target className="h-4 w-4 text-red-500" />
                            근본 원인 (Root Cause)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{selectedTeamLeadNotice.completionReport.rootCause}</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-blue-500" />
                            수행 조치
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {selectedTeamLeadNotice.completionReport.actions.map((action, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                            재발 방지 대책
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {selectedTeamLeadNotice.completionReport.preventiveMeasures.map((measure, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-medium shrink-0">{i + 1}</span>
                                <span>{measure}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {selectedTeamLeadNotice.completionReport.attachments.length > 0 && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <FileImage className="h-4 w-4" />
                              첨부 파일
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {selectedTeamLeadNotice.completionReport.attachments.map((file, i) => (
                                <Badge key={i} variant="secondary" className="gap-1">
                                  <FileText className="h-3 w-3" />
                                  {file}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* 승인 버튼 */}
                      <div className="flex gap-3 pt-4 border-t">
                        <Button 
                          className="flex-1 gap-2" 
                          onClick={() => setShowApprovalDialog(true)}
                        >
                          <CheckCircle className="h-4 w-4" />
                          승인하기
                        </Button>
                        <Button variant="outline" className="gap-2">
                          <MessageSquare className="h-4 w-4" />
                          코멘트 추가
                        </Button>
                        {selectedTeamLeadNotice.ticketId && (
                          <Link href={`/tickets/${selectedTeamLeadNotice.ticketId.replace("TKT-", "")}`}>
                            <Button variant="outline" className="gap-2">
                              <ExternalLink className="h-4 w-4" />
                              이벤트 상세
                            </Button>
                          </Link>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : selectedAlert ? (
            <>
              {/* 헤더 */}
              <div className="p-6 border-b border-border bg-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("p-2 rounded-full text-white", getSeverityColor(selectedAlert.severity))}>
                    {getTypeIcon(selectedAlert.type, selectedAlert.subType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{selectedAlert.type.toUpperCase()}</Badge>
                      <Badge variant="secondary">{getSubTypeLabel(selectedAlert.subType)}</Badge>
                      {selectedAlert.unit && <Badge>{selectedAlert.unit}</Badge>}
                      {selectedAlert.status === "unread" && (
                        <span className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
                <h2 className="text-xl font-semibold">{selectedAlert.title}</h2>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{selectedAlert.timestamp}</span>
                </div>
              </div>

              {/* 콘텐츠 */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  <p className="text-muted-foreground">{selectedAlert.description}</p>

                  {/* Alert 타입: 알람 정보 + Operation 컨텍스트 */}
                  {selectedAlert.type === "alert" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* 알람 정보 */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            알람 정보
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {/* Process hierarchy breadcrumb */}
                            {(() => {
                              const eq = getTagEq(selectedAlert.data?.tagId)
                              return eq ? (
                                <div className="flex items-center gap-1 text-xs flex-wrap bg-muted/30 rounded-md px-2.5 py-1.5">
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary font-semibold">{eq.process}</Badge>
                                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <span className="text-muted-foreground">{eq.zone}</span>
                                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <button className="font-medium text-primary hover:underline cursor-pointer flex items-center gap-0.5" onClick={() => setShowEquipmentDialog(true)}>
                                    {eq.equipment}<ExternalLink className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                              ) : null
                            })()}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Tag ID</span>
                                <p className="font-medium text-sm font-mono">{selectedAlert.data?.tagId || "-"}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">알람 등급</span>
                                <Badge className={cn("text-xs", getAlertGradeLabel(selectedAlert.alertGrade).color)}>
                                  {getAlertGradeLabel(selectedAlert.alertGrade).label}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground">Trigger 조건</span>
                              <p className="font-mono text-xs bg-muted/50 px-2 py-1 rounded">{selectedAlert.triggerCondition || "-"}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground">Setpoint</span>
                              <div className="flex gap-2 flex-wrap">
                                {selectedAlert.triggerSetpoint?.high && (
                                  <Badge variant="outline" className="text-red-600 border-red-300 text-xs">High: {selectedAlert.triggerSetpoint.high}</Badge>
                                )}
                                {selectedAlert.triggerSetpoint?.low && (
                                  <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">Low: {selectedAlert.triggerSetpoint.low}</Badge>
                                )}
                              </div>
                            </div>
                            {selectedAlert.alarmBackground && (
                              <div className="p-2 bg-muted/30 rounded-lg">
                                <span className="text-xs text-muted-foreground">설정 배경</span>
                                <p className="text-xs mt-1">{selectedAlert.alarmBackground}</p>
                              </div>
                            )}
                            {/* 알람 발생 이력 요약 */}
                            {selectedAlert.occurrenceHistory && selectedAlert.occurrenceHistory.length > 0 && (
                              <div className="p-2.5 bg-red-50/50 border border-red-200/50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-red-700 flex items-center gap-1.5">
                                    <Bell className="h-3.5 w-3.5" />
                                    알람 ��생 이력
                                  </span>
                                  <Badge variant="destructive" className="text-[10px] h-5">
                                    {selectedAlert.occurrenceHistory.length}회 발생
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">최초 발생</span>
                                    <p className="font-medium mt-0.5">{selectedAlert.occurrenceHistory[selectedAlert.occurrenceHistory.length - 1]?.timestamp}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">최근 발생</span>
                                    <p className="font-medium mt-0.5">{selectedAlert.occurrenceHistory[0]?.timestamp}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  {selectedAlert.occurrenceHistory.filter(o => o.type === "sustained").length > 0 && (
                                    <span>지속 {selectedAlert.occurrenceHistory.filter(o => o.type === "sustained").length}회</span>
                                  )}
                                  {selectedAlert.occurrenceHistory.filter(o => o.type === "sustained").length > 0 && selectedAlert.occurrenceHistory.filter(o => o.type === "recurred").length > 0 && (
                                    <span>/</span>
                                  )}
                                  {selectedAlert.occurrenceHistory.filter(o => o.type === "recurred").length > 0 && (
                                    <span>재발생 {selectedAlert.occurrenceHistory.filter(o => o.type === "recurred").length}회</span>
                                  )}
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full mt-2 text-xs h-7 border-red-200 text-red-700 hover:bg-red-100 bg-transparent"
                                  onClick={() => setShowAlarmHistoryDialog(true)}
                                >
                                  <History className="h-3 w-3 mr-1.5" />
                                  전체 히스토리 보기
                                </Button>
                              </div>
                            )}
                            {/* Action buttons */}
                            <div className="grid grid-cols-1 gap-1.5 mt-2">
                              <Button variant="outline" size="sm" className="w-full text-xs justify-start" onClick={() => setShowEquipmentDialog(true)}>
                                <Wrench className="h-3.5 w-3.5 mr-1.5" />
                                장치 정보 및 정비이력 보기
                              </Button>
                              <Button variant="outline" size="sm" className="w-full text-xs justify-start" onClick={() => setShowPidDialog(true)}>
                                <FileImage className="h-3.5 w-3.5 mr-1.5" />
                                관련 P&ID 도면 보기
                              </Button>
                              <Button variant="outline" size="sm" className="w-full text-xs justify-start" onClick={() => setShowDatasheetDialog(true)}>
                                <FileText className="h-3.5 w-3.5 mr-1.5" />
                                관련 데이터시트 보기
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Operation 컨텍스트 - 알람 발생 당시 공정 상태 */}
                      <Card className="lg:col-span-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            Operation Context (알람 발생 시점)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                            <div className="p-2.5 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">운전 모드</span>
                              <p className="font-medium text-sm mt-0.5">Normal Operation</p>
                              <Badge variant="secondary" className="text-xs mt-1">Arabian Medium 전환 중</Badge>
                            </div>
                            <div className="p-2.5 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">처리량 (Feed Rate)</span>
                              <p className="font-medium text-sm mt-0.5">120.5 m3/h</p>
                              <span className="text-xs text-green-600">Guide: 100~130 m3/h</span>
                            </div>
                            <div className="p-2.5 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">Operation Guide</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                <p className="font-medium text-sm text-red-600">1건 위반</p>
                              </div>
                              <span className="text-xs text-muted-foreground">TI-2001 High</span>
                            </div>
                            <div className="p-2.5 bg-muted/30 rounded-lg">
                              <span className="text-xs text-muted-foreground">원유 종류</span>
                              <p className="font-medium text-sm mt-0.5">Arabian Medium</p>
                              <span className="text-xs text-amber-600">S: 2.59% (Heavy)</span>
                            </div>
                          </div>
                          {/* 관련 트렌드 차트 (Operation Context 내에 포함) */}
                          {selectedAlert.data?.trend && (() => {
                    const trend = selectedAlert.data.trend
                    const limit = selectedAlert.data.limit || 0
                    const lowLimit = selectedAlert.triggerSetpoint?.low
                    const allVals = [...trend, limit, ...(lowLimit ? [lowLimit] : [])]
                    const maxV = Math.max(...allVals) * 1.08
                    const minV = Math.min(...allVals) * 0.92
                    const range = maxV - minV || 1
                    const W = 600
                    const H = 180
                    const pad = { t: 16, b: 28, l: 48, r: 16 }
                    const cw = W - pad.l - pad.r
                    const ch = H - pad.t - pad.b
                    const toX = (i: number) => pad.l + (i / (trend.length - 1)) * cw
                    const toY = (v: number) => pad.t + (1 - (v - minV) / range) * ch
                    const linePoints = trend.map((v, i) => `${toX(i)},${toY(v)}`).join(" ")
                    // smooth path
                    const pathD = trend.reduce((acc, v, i) => {
                      const x = toX(i)
                      const y = toY(v)
                      if (i === 0) return `M ${x} ${y}`
                      const px = toX(i - 1)
                      const py = toY(trend[i - 1])
                      const cpx = (px + x) / 2
                      return `${acc} C ${cpx} ${py}, ${cpx} ${y}, ${x} ${y}`
                    }, "")
                    // fill area
                    const areaD = `${pathD} L ${toX(trend.length - 1)} ${pad.t + ch} L ${toX(0)} ${pad.t + ch} Z`
                    // find first violation index
                    const firstViolIdx = trend.findIndex((v, i) => {
                      const overHigh = limit && v > limit
                      const underLow = lowLimit && v < lowLimit
                      return (overHigh || underLow) && (i === 0 || ((!limit || trend[i-1] <= limit) && (!lowLimit || trend[i-1] >= lowLimit)))
                    })
                    const timeLabels = ["12:00", "12:30", "13:00", "13:30", "14:00", "14:15", "14:32"]

                    return (
                      <div className="mt-4 border rounded-lg overflow-hidden">
                        <div className="px-3 py-2 bg-muted/50 flex items-center justify-between">
                          <div className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            관련 트렌드 - {selectedAlert.data.tagId}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block rounded" /> Actual</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-400 inline-block rounded border-t border-dashed" /> Guide Max</span>
                            {lowLimit && <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block rounded border-t border-dashed" /> Guide Min</span>}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 gap-1 text-[10px] ml-2"
                              onClick={() => setShowFullTrendDialog(true)}
                            >
                              <LayoutGrid className="h-3 w-3" />
                              전체보기
                            </Button>
                          </div>
                        </div>
                        <div className="p-3">
                          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-52" preserveAspectRatio="xMidYMid meet">
                            {/* Grid lines */}
                            {[0.25, 0.5, 0.75].map(frac => {
                              const y = pad.t + frac * ch
                              const val = maxV - frac * range
                              return (
                                <g key={frac}>
                                  <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="currentColor" strokeOpacity={0.07} />
                                  <text x={pad.l - 6} y={y + 3} fontSize="9" fill="currentColor" fillOpacity={0.4} textAnchor="end">{val.toFixed(0)}</text>
                                </g>
                              )
                            })}
                            {/* Y-axis labels */}
                            <text x={pad.l - 6} y={toY(maxV) + 3} fontSize="9" fill="currentColor" fillOpacity={0.4} textAnchor="end">{maxV.toFixed(0)}</text>
                            <text x={pad.l - 6} y={toY(minV) + 3} fontSize="9" fill="currentColor" fillOpacity={0.4} textAnchor="end">{minV.toFixed(0)}</text>
                            {/* Guide High line */}
                            {limit > 0 && (
                              <g>
                                <line x1={pad.l} y1={toY(limit)} x2={W - pad.r} y2={toY(limit)} stroke="#f87171" strokeWidth="1.5" strokeDasharray="6 3" />
                                <text x={W - pad.r + 4} y={toY(limit) + 3} fontSize="9" fill="#ef4444">Max {limit}</text>
                              </g>
                            )}
                            {/* Guide Low line */}
                            {lowLimit && (
                              <g>
                                <line x1={pad.l} y1={toY(lowLimit)} x2={W - pad.r} y2={toY(lowLimit)} stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="6 3" />
                                <text x={W - pad.r + 4} y={toY(lowLimit) + 3} fontSize="9" fill="#3b82f6">Min {lowLimit}</text>
                              </g>
                            )}
                            {/* Area fill */}
                            <path d={areaD} fill="url(#trendGrad)" opacity="0.3" />
                            <defs>
                              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            {/* Trend line */}
                            <path d={pathD} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" />
                            {/* Over-limit segments in red */}
                            {trend.map((v, i) => {
                              if (i === 0) return null
                              const overNow = (limit && v > limit) || (lowLimit && v < lowLimit)
                              const overPrev = (limit && trend[i-1] > limit) || (lowLimit && trend[i-1] < lowLimit)
                              if (!overNow && !overPrev) return null
                              const px = toX(i - 1), py = toY(trend[i-1])
                              const x = toX(i), y = toY(v)
                              const cpx = (px + x) / 2
                              return <path key={i} d={`M ${px} ${py} C ${cpx} ${py}, ${cpx} ${y}, ${x} ${y}`} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                            })}
                            {/* Data points */}
                            {trend.map((v, i) => {
                              const isOver = (limit && v > limit) || (lowLimit && v < lowLimit)
                              return (
                                <g key={i}>
                                  <circle cx={toX(i)} cy={toY(v)} r={isOver ? 4.5 : 3} fill={isOver ? "#ef4444" : "#0d9488"} stroke="white" strokeWidth="1.5" />
                                  <text x={toX(i)} y={toY(v) - 8} fontSize="8" fill={isOver ? "#ef4444" : "currentColor"} fillOpacity={isOver ? 1 : 0.5} textAnchor="middle" fontWeight={isOver ? "bold" : "normal"}>{v}</text>
                                </g>
                              )
                            })}
                            {/* Violation hairline */}
                            {firstViolIdx >= 0 && (
                              <g>
                                <line x1={toX(firstViolIdx)} y1={pad.t - 4} x2={toX(firstViolIdx)} y2={pad.t + ch + 4} stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 2" />
                                <rect x={toX(firstViolIdx) - 22} y={pad.t - 14} width="44" height="14" rx="3" fill="#dc2626" />
                                <text x={toX(firstViolIdx)} y={pad.t - 4} fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">위반 시점</text>
                              </g>
                            )}
                            {/* Time labels */}
                            {trend.map((_, i) => (
                              <text key={i} x={toX(i)} y={H - 4} fontSize="8" fill="currentColor" fillOpacity={0.4} textAnchor="middle">{timeLabels[i] || `T-${trend.length - 1 - i}`}</text>
                            ))}
                          </svg>
                          <div className="flex justify-between mt-3 p-3 bg-muted/30 rounded-lg">
                            <div>
                              <span className="text-xs text-muted-foreground">현재값 (Actual)</span>
                              <p className="text-base font-bold">{selectedAlert.data.value}</p>
                            </div>
                            <div className="text-center">
                              <span className="text-xs text-muted-foreground">편차</span>
                              <p className={cn("text-base font-bold", selectedAlert.data.value > limit ? "text-red-500" : lowLimit && selectedAlert.data.value < lowLimit ? "text-blue-500" : "text-green-500")}>
                                {limit ? `${selectedAlert.data.value > limit ? "+" : ""}${(selectedAlert.data.value - limit).toFixed(1)}` : "-"}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-muted-foreground">Guide</span>
                              <p className="text-base font-bold text-muted-foreground">{limit || "-"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* 장기건전성 모니터링 - Projection Trend with Action Window */}
                  {selectedAlert.subType === "health-monitoring" && selectedAlert.healthMonitoring && (() => {
                    const hm = selectedAlert.healthMonitoring
                    const data = hm.trend
                    const proj = hm.projectionTrend
                    const prev = hm.prevTaTrend
                    const allV = [...data, ...proj, ...(prev || []), hm.limitValue, hm.actionLimit]
                    const maxV = Math.max(...allV) * 1.03
                    const minV = Math.min(...allV) * 0.97
                    const rng = maxV - minV || 1
                    const W = 700, H = 220, pd = { t: 16, b: 28, l: 52, r: 16 }
                    const cw = W - pd.l - pd.r, ch = H - pd.t - pd.b
                    const totalLen = data.length + proj.length
                    const tX = (i: number) => pd.l + (i / (totalLen - 1)) * cw
                    const tY = (v: number) => pd.t + (1 - (v - minV) / rng) * ch
                    const actualD = data.map((v, i) => `${i === 0 ? "M" : "L"} ${tX(i).toFixed(1)} ${tY(v).toFixed(1)}`).join(" ")
                    const projD = proj.map((v, i) => `${i === 0 ? "M" : "L"} ${tX(data.length - 1 + i).toFixed(1)} ${tY(v).toFixed(1)}`).join(" ")
                    const prevD = prev ? prev.map((v, i) => `${i === 0 ? "M" : "L"} ${tX(i).toFixed(1)} ${tY(v).toFixed(1)}`).join(" ") : ""
                    const actionStartIdx = Math.max(0, hm.projectionWeeks - hm.actionMarginWeeks)
                    const actionX1 = tX(data.length - 1 + actionStartIdx)
                    const actionX2 = tX(data.length - 1 + Math.min(hm.projectionWeeks, proj.length - 1))

                    return (
                      <Card className="ring-2 ring-red-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            장기건전성 Projection Trend - {hm.equipId}
                            {hm.aiModelId && <Badge variant="outline" className="text-[10px] border-indigo-300 text-indigo-600">AI Model: {hm.aiModelId}</Badge>}
                          </CardTitle>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-red-500 inline-block rounded" /> Actual</span>
                            <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-indigo-500 inline-block rounded border-t border-dashed" /> Projection</span>
                            {prev && <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-slate-400 inline-block rounded border-t border-dashed" /> Prev TA</span>}
                            <span className="flex items-center gap-1"><span className="w-4 h-1.5 bg-amber-200 inline-block rounded" /> Action Window</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56" preserveAspectRatio="xMidYMid meet">
                            {/* Grid */}
                            {[0.25, 0.5, 0.75].map(f => {
                              const y = pd.t + f * ch
                              const val = maxV - f * rng
                              return <g key={f}><line x1={pd.l} y1={y} x2={W - pd.r} y2={y} stroke="currentColor" strokeOpacity={0.06} /><text x={pd.l - 5} y={y + 3} fontSize="8" fill="currentColor" fillOpacity={0.35} textAnchor="end">{val.toFixed(0)}</text></g>
                            })}
                            {/* Now divider */}
                            <line x1={tX(data.length - 1)} y1={pd.t} x2={tX(data.length - 1)} y2={pd.t + ch} stroke="currentColor" strokeOpacity={0.2} strokeDasharray="5 3" />
                            <text x={tX(data.length - 1)} y={pd.t + ch + 14} fontSize="8" fill="currentColor" fillOpacity={0.5} textAnchor="middle">현재 (W24)</text>
                            {/* Action window fill */}
                            <rect x={actionX1} y={pd.t} width={Math.max(0, actionX2 - actionX1)} height={ch} fill="#fbbf24" opacity="0.12" rx="3" />
                            <text x={(actionX1 + actionX2) / 2} y={pd.t + 14} fontSize="9" fill="#b45309" textAnchor="middle" fontWeight="bold">Action Window</text>
                            {/* Limit line */}
                            <line x1={pd.l} y1={tY(hm.limitValue)} x2={W - pd.r} y2={tY(hm.limitValue)} stroke="#ef4444" strokeWidth="1.2" strokeDasharray="6 3" />
                            <text x={W - pd.r + 3} y={tY(hm.limitValue) + 3} fontSize="8" fill="#ef4444">Limit {hm.limitValue}</text>
                            {/* Action limit */}
                            <line x1={pd.l} y1={tY(hm.actionLimit)} x2={W - pd.r} y2={tY(hm.actionLimit)} stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="4 2" />
                            <text x={W - pd.r + 3} y={tY(hm.actionLimit) + 3} fontSize="7" fill="#f59e0b">Action {hm.actionLimit}</text>
                            {/* Prev TA */}
                            {prevD && <path d={prevD} fill="none" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.5" />}
                            {/* Actual area + line */}
                            <path d={`${actualD} L ${tX(data.length - 1)} ${pd.t + ch} L ${tX(0)} ${pd.t + ch} Z`} fill="#ef4444" opacity="0.06" />
                            <path d={actualD} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                            {/* Projection line */}
                            <path d={projD} fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="8 4" />
                            {/* Data points */}
                            {data.filter((_, i) => i % 3 === 0 || i === data.length - 1).map((_v, _i) => {
                              const idx = _i === Math.floor(data.length / 3) ? data.length - 1 : _i * 3
                              const v = data[idx]
                              return <circle key={idx} cx={tX(idx)} cy={tY(v)} r={idx === data.length - 1 ? 4 : 2} fill="#ef4444" />
                            })}
                            {/* Week labels */}
                            {[0, 6, 12, 18, data.length - 1].map(i => <text key={i} x={tX(i)} y={H - 6} fontSize="7" fill="currentColor" fillOpacity={0.4} textAnchor="middle">W{i + 1}</text>)}
                            {proj.length > 1 && [Math.floor(proj.length / 2), proj.length - 1].map(i => <text key={`p${i}`} x={tX(data.length - 1 + i)} y={H - 6} fontSize="7" fill="#6366f1" fillOpacity={0.6} textAnchor="middle">+{i}w</text>)}
                          </svg>

                          {/* Summary metrics */}
                          <div className="grid grid-cols-4 gap-3 mt-3 p-3 bg-muted/30 rounded-lg">
                            <div>
                              <span className="text-[11px] text-muted-foreground">현재값</span>
                              <p className="text-lg font-bold text-red-600">{hm.currentValue} <span className="text-xs font-normal">{hm.healthIndexUnit}</span></p>
                            </div>
                            <div>
                              <span className="text-[11px] text-muted-foreground">Drift 변화율</span>
                              <p className="text-lg font-bold text-red-600">+{hm.driftPct}%</p>
                            </div>
                            <div>
                              <span className="text-[11px] text-muted-foreground">Limit 도달</span>
                              <p className="text-lg font-bold text-red-600">{hm.projectionWeeks}��</p>
                            </div>
                            <div>
                              <span className="text-[11px] text-muted-foreground">Action Window</span>
                              <p className="text-lg font-bold text-amber-600">{hm.needsImmediateAction ? "즉시" : `${hm.actionMarginWeeks}주 전`}</p>
                            </div>
                          </div>

                          {/* Related variables */}
                          <div className="mt-4">
                            <h4 className="text-xs font-semibold mb-2">관련 변수 현황</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {hm.relatedTrends.map(rt => (
                                <div key={rt.tagId} className={cn("flex items-center justify-between p-2 rounded border text-xs",
                                  rt.status === "critical" && "bg-red-50 border-red-200",
                                  rt.status === "warning" && "bg-amber-50 border-amber-200",
                                  rt.status === "normal" && "bg-background"
                                )}>
                                  <div>
                                    <span className="font-mono font-medium">{rt.tagId}</span>
                                    <span className="text-muted-foreground ml-1.5">{rt.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold">{rt.value} {rt.unit}</span>
                                    <span className={cn("w-2 h-2 rounded-full",
                                      rt.status === "critical" && "bg-red-500",
                                      rt.status === "warning" && "bg-amber-400",
                                      rt.status === "normal" && "bg-emerald-500"
                                    )} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Suggested actions */}
                          <div className="mt-4">
                            <h4 className="text-xs font-semibold mb-2">권장 조치 사항</h4>
                            <div className="space-y-1.5">
                              {hm.suggestedActions.map((action, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs p-2 rounded bg-muted/50">
                                  <Badge variant="outline" className="text-[10px] h-4 shrink-0 mt-0.5">{i + 1}</Badge>
                                  <span>{action}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })()}

                  {/* Alert 타입: DCS 화면 스냅샷 (다중 그래픽 전환) */}
                  {selectedAlert.type === "alert" && (() => {
                    const dcsScreens = [
                      { id: "reactor-overview", label: "Reactor Overview", section: "Reactor Section" },
                      { id: "feed-section", label: "Feed Section", section: "Feed Preheat Train" },
                      { id: "fractionation", label: "Fractionation", section: "Product Separation" },
                    ]
                    return (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Monitor className="h-4 w-4" />
                              DCS 화면 스냅샷 (알람 발생 시점)
                            </div>
                          </CardTitle>
                          <div className="flex gap-1 mt-2">
                            {dcsScreens.map((scr, idx) => (
                              <button
                                key={scr.id}
                                className={cn(
                                  "px-3 py-1.5 text-xs rounded-t border border-b-0 font-medium",
                                  idx === activeDcsScreen
                                    ? "bg-slate-900 text-white border-slate-700"
                                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                                )}
                                onClick={() => setActiveDcsScreen(idx)}
                              >
                                {scr.label}
                                {idx === 0 && <span className="ml-1.5 w-1.5 h-1.5 bg-red-500 rounded-full inline-block animate-pulse" />}
                              </button>
                            ))}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="relative aspect-[16/8] bg-slate-900 rounded-b-lg rounded-tr-lg overflow-hidden">
                            <div className="absolute inset-0 p-4">
                              <div className="h-full flex flex-col">
                                <div className="flex items-center justify-between mb-2 text-slate-400 text-xs">
                                  <span>{selectedAlert.unit} - {dcsScreens[activeDcsScreen]?.section}</span>
                                  <span>{selectedAlert.timestamp}</span>
                                </div>
                                {activeDcsScreen === 0 ? (
                                  <>
                                    <div className="flex-1 grid grid-cols-4 gap-3">
                                      <div className="bg-slate-800 rounded p-2 flex flex-col">
                                        <span className="text-slate-500 text-xs mb-1">Feed</span>
                                        <div className="flex-1 flex items-center justify-center">
                                          <div className="w-14 h-10 border border-slate-600 rounded flex items-center justify-center"><span className="text-slate-400 text-xs">P-2001</span></div>
                                        </div>
                                        <div className="text-xs text-green-400 mt-1">120.5 m3/h</div>
                                      </div>
                                      <div className="bg-slate-800 rounded p-2 flex flex-col border-2 border-red-500">
                                        <span className="text-slate-500 text-xs mb-1">Reactor</span>
                                        <div className="flex-1 flex items-center justify-center relative">
                                          <div className="w-20 h-14 border-2 border-red-500 rounded-lg flex flex-col items-center justify-center bg-red-900/30">
                                            <span className="text-red-400 text-xs font-bold">R-2001</span>
                                            <span className="text-red-300 text-xs">{selectedAlert.data?.tagId}</span>
                                          </div>
                                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full animate-pulse" />
                                        </div>
                                        <div className="text-xs text-red-400 mt-1 font-bold">{selectedAlert.data?.value} (HIGH)</div>
                                      </div>
                                      <div className="bg-slate-800 rounded p-2 flex flex-col">
                                        <span className="text-slate-500 text-xs mb-1">Separator</span>
                                        <div className="flex-1 flex items-center justify-center">
                                          <div className="w-14 h-10 border border-slate-600 rounded flex items-center justify-center"><span className="text-slate-400 text-xs">V-2001</span></div>
                                        </div>
                                        <div className="text-xs text-green-400 mt-1">35.2 bar</div>
                                      </div>
                                      <div className="bg-slate-800 rounded p-2 flex flex-col">
                                        <span className="text-slate-500 text-xs mb-1">H2 System</span>
                                        <div className="flex-1 flex items-center justify-center">
                                          <div className="w-14 h-10 border border-slate-600 rounded flex items-center justify-center"><span className="text-slate-400 text-xs">C-2001</span></div>
                                        </div>
                                        <div className="text-xs text-green-400 mt-1">1,050 Nm3</div>
                                      </div>
                                    </div>
                                    <div className="mt-2 grid grid-cols-6 gap-1.5">
                                      {[
                                        { tag: "FI-2001", val: "120.5", ok: true }, { tag: selectedAlert.data?.tagId || "TI-2001", val: String(selectedAlert.data?.value), ok: false },
                                        { tag: "PI-2001", val: "35.2", ok: true }, { tag: "TI-2003", val: "396.5", ok: true },
                                        { tag: "AI-2001", val: "1050", ok: true }, { tag: "FI-2010", val: "15200", ok: true },
                                      ].map((t, i) => (
                                        <div key={i} className={cn("p-1 rounded text-center", t.ok ? "bg-slate-800" : "bg-red-900/50 border border-red-500")}>
                                          <span className="text-slate-500 text-[10px] block">{t.tag}</span>
                                          <span className={cn("text-xs", t.ok ? "text-green-400" : "text-red-400 font-bold")}>{t.val}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                ) : activeDcsScreen === 1 ? (
                                  <div className="flex-1 flex items-center justify-center">
                                    <div className="grid grid-cols-3 gap-6">
                                      {[
                                        { name: "E-2001\nFeed/Effluent", temp: "285/310°C", color: "green" },
                                        { name: "E-2002\nFeed Heater", temp: "310/395°C", color: "green" },
                                        { name: "F-2001\nCharge Heater", temp: "395/412°C", color: "red" },
                                      ].map((eq, i) => (
                                        <div key={i} className="flex flex-col items-center gap-2">
                                          <div className={cn("w-20 h-16 border-2 rounded-lg flex flex-col items-center justify-center",
                                            eq.color === "red" ? "border-red-500 bg-red-900/20" : "border-slate-600 bg-slate-800"
                                          )}>
                                            <span className={cn("text-xs", eq.color === "red" ? "text-red-400" : "text-slate-400")}>{eq.name.split("\n")[0]}</span>
                                            <span className="text-slate-500 text-[10px]">{eq.name.split("\n")[1]}</span>
                                          </div>
                                          <span className={cn("text-xs", eq.color === "red" ? "text-red-400 font-bold" : "text-green-400")}>{eq.temp}</span>
                                          {i < 2 && <div className="absolute" />}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex-1 flex items-center justify-center">
                                    <div className="grid grid-cols-3 gap-6">
                                      {[
                                        { name: "V-2001\nHP Sep", press: "35.2 bar", level: "65%" },
                                        { name: "V-2002\nLP Sep", press: "8.5 bar", level: "55%" },
                                        { name: "T-2001\nStripper", press: "3.2 bar", level: "48%" },
                                      ].map((eq, i) => (
                                        <div key={i} className="flex flex-col items-center gap-2">
                                          <div className="w-20 h-16 border border-slate-600 bg-slate-800 rounded-lg flex flex-col items-center justify-center">
                                            <span className="text-slate-400 text-xs">{eq.name.split("\n")[0]}</span>
                                            <span className="text-slate-500 text-[10px]">{eq.name.split("\n")[1]}</span>
                                          </div>
                                          <div className="text-center">
                                            <span className="text-green-400 text-xs block">{eq.press}</span>
                                            <span className="text-slate-400 text-[10px]">Level: {eq.level}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">캡처 시간: {selectedAlert.timestamp}</span>
                              <span className="text-xs text-muted-foreground">({activeDcsScreen + 1}/{dcsScreens.length} 화면)</span>
                            </div>
                            <Button variant="outline" size="sm" className="text-xs bg-transparent">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              DCS 화면 열기
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })()}

                  {/* Alert 타입: 과거 알람 발생 이력 및 해결 방법 */}
                  {selectedAlert.type === "alert" && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          과거 알람 발생 이력 ({selectedAlert.data?.tagId})
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">이 태그에서 발생했던 과거 알람과 해결 방법</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* 과거 알람 이력 1 */}
                          <div className="border rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between p-3 bg-muted/30">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">High Alarm</Badge>
                                <span className="text-sm font-medium">2024-10-15 14:32</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">해결됨</Badge>
                            </div>
                            <div className="p-3 space-y-2">
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground">발생값:</span>
                                <span className="font-mono">398.5°C</span>
                                <span className="text-muted-foreground">지속시간:</span>
                                <span>23분</span>
                              </div>
                              <div className="p-2 bg-green-50 border border-green-100 rounded text-sm">
                                <span className="font-medium text-green-700">해결 방법:</span>
                                <span className="text-green-600 ml-2">Feed Flow 감소 조치 (120 → 105 m3/h), 15분 후 정상 복귀</span>
                              </div>
                              <Button variant="link" className="text-xs p-0 h-auto" onClick={() => router.push("/tickets/1")}>
                                관련 이벤트 TKT-2024-0892 보기
                              </Button>
                            </div>
                          </div>

                          {/* 과거 알람 이력 2 */}
                          <div className="border rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between p-3 bg-muted/30">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">High-High Alarm</Badge>
                                <span className="text-sm font-medium">2024-08-22 09:15</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">해결됨</Badge>
                            </div>
                            <div className="p-3 space-y-2">
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground">발생값:</span>
                                <span className="font-mono">412.3°C</span>
                                <span className="text-muted-foreground">지속시간:</span>
                                <span>8분</span>
                              </div>
                              <div className="p-2 bg-green-50 border border-green-100 rounded text-sm">
                                <span className="font-medium text-green-700">해결 방법:</span>
                                <span className="text-green-600 ml-2">긴급 감량 운전 실시, Quench 주입량 증가, 촉매 활성도 점검 후 정상화</span>
                              </div>
                              <Button variant="link" className="text-xs p-0 h-auto" onClick={() => router.push("/tickets/1")}>
                                관련 이벤트 TKT-2024-0654 보기
                              </Button>
                            </div>
                          </div>

                          {/* 과거 알람 이력 3 */}
                          <div className="border rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between p-3 bg-muted/30">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">High Alarm</Badge>
                                <span className="text-sm font-medium">2024-06-10 16:48</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">해결됨</Badge>
                            </div>
                            <div className="p-3 space-y-2">
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground">발생값:</span>
                                <span className="font-mono">396.1°C</span>
                                <span className="text-muted-foreground">지속시간:</span>
                                <span>45분</span>
                              </div>
                              <div className="p-2 bg-green-50 border border-green-100 rounded text-sm">
                                <span className="font-medium text-green-700">해결 방법:</span>
                                <span className="text-green-600 ml-2">Thermocouple 오작동으로 확인, 센서 교체 후 정상화 (계기 문제)</span>
                              </div>
                              <Button variant="link" className="text-xs p-0 h-auto" onClick={() => router.push("/tickets/1")}>
                                관련 이벤트 TKT-2024-0421 보기
                              </Button>
                            </div>
                          </div>

                          <div className="text-center pt-2">
                            <Button variant="link" className="text-xs">
                              전체 이력 보기 (총 12건)
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Alert 타입: Shelved 정보 (Shelved 상태인 경우) */}
                  {selectedAlert.type === "alert" && selectedAlert.alertState === "shelved" && (
                    <Card className="border-gray-300 bg-gray-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-gray-600">
                          <Eye className="h-4 w-4" />
                          Shelved 정보
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs text-muted-foreground">Shelved 사유</span>
                            <p className="text-sm">{selectedAlert.shelvedReason}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">재개 예정일</span>
                            <p className="text-sm font-medium">{selectedAlert.shelvedUntil}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 이상징후 Notice: 카테고리 기반 Top3 */}
                  {selectedAlert.subType === "anomaly" && selectedAlert.anomalyCategories && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          이상징후 카테고리별 Top 3
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedAlert.anomalyCategories.map((cat) => (
                            <button
                              key={cat.id}
                              className="w-full text-left border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                              onClick={() => { setSelectedAnomalyCategory(cat); setShowAnomalyCategoryDialog(true) }}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-medium text-sm">{cat.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {cat.top3.filter(t => t.severity === "high").length > 0 ? `High ${cat.top3.filter(t => t.severity === "high").length}건` : "정상"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">{cat.description}</p>
                              <div className="space-y-1.5">
                                {cat.top3.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-3 text-xs">
                                    <span className={cn(
                                      "w-2 h-2 rounded-full shrink-0",
                                      item.severity === "high" ? "bg-red-500" : item.severity === "medium" ? "bg-amber-500" : "bg-green-500"
                                    )} />
                                    <span className="font-mono shrink-0 w-20">{item.tagId}</span>
                                    <span className="text-muted-foreground truncate flex-1">{item.description}</span>
                                    <span className="font-medium shrink-0 text-right">{item.deviation.split(" ")[0]}</span>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-primary mt-2 flex items-center gap-1">
                                상세 보기 <ArrowRight className="h-3 w-3" />
                              </p>
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Daily Monitoring AI 요약 상세 - Enhanced with DailyMonitoringOverview */}
                  {selectedAlert.subType === "daily-monitoring" && selectedAlert.dailyMonitoringDetail && (
                    <>
                      {/* ===== 1. AI Summary ===== */}
                      <Card className="border-l-4 border-l-teal-500">
                        <CardContent className="py-4">
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                              <Sparkles className="h-4 w-4 text-teal-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-sm font-semibold">AI Daily Summary</h3>
                                <Badge variant="secondary" className="text-[10px]">GenAI</Badge>
                                <span className="text-[10px] text-muted-foreground ml-auto">2026-02-25 07:00 생성</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-[10px] ml-2 border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                                  onClick={() => {
                                    handleCreateTicket({
                                      ...selectedAlert,
                                      title: `[Daily Summary] ${selectedAlert.title}`,
                                      description: selectedAlert.dailyMonitoringDetail?.aiSummary || selectedAlert.description
                                    })
                                  }}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  이벤트 생성
                                </Button>
                              </div>
                              <div className="p-3 bg-muted/40 rounded-lg mb-3">
                                <p className="text-xs font-medium text-muted-foreground mb-1.5">생산팀 TOB 요약</p>
                                <p className="text-xs leading-relaxed">{selectedAlert.dailyMonitoringDetail.aiSummary}</p>
                              </div>
                              <div className="p-3 bg-muted/40 rounded-lg">
                                <p className="text-xs font-medium text-muted-foreground mb-1.5">주요 운전변수 변화 요약</p>
                                <div className="space-y-1.5">
                                  {selectedAlert.dailyMonitoringDetail.keyVariables.map((v, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs">
                                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", v.status === "warning" ? "bg-amber-500" : v.status === "critical" ? "bg-red-500" : "bg-green-500")} />
                                      <span className="font-medium w-36 shrink-0">{v.name}</span>
                                      <span className="text-muted-foreground">{v.change}</span>
                                      <span className="font-mono">{v.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* ===== 2. Quick Link Buttons ===== */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-xs gap-1.5 bg-card"><Monitor className="h-3.5 w-3.5" />DCS</Button>
                        <Button variant="outline" size="sm" className="text-xs gap-1.5 bg-card"><FileBarChart className="h-3.5 w-3.5" />SFD</Button>
                        <Button variant="outline" size="sm" className="text-xs gap-1.5 bg-card"><BookOpen className="h-3.5 w-3.5" />TOB</Button>
                        <Button variant="outline" size="sm" className="text-xs gap-1.5 bg-card"><ClipboardList className="h-3.5 w-3.5" />운영계획서</Button>
                      </div>

                      {/* ===== 3. 주요 운영 현황 ===== */}
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Gauge className="h-4 w-4" />주요 운영 현황
                            </CardTitle>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                              onClick={() => {
                                handleCreateTicket({
                                  ...selectedAlert,
                                  title: `[운영현황] ${selectedAlert.unit || "HCR"} 운영 이슈`,
                                  description: "주요 운영 현황에서 감지된 이슈"
                                })
                              }}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              이벤트 생성
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* 1) Operating Mode - Current & Future */}
                            <div className="p-2.5 bg-muted/30 rounded-lg space-y-2">
                              <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-primary shrink-0" />
                                <span className="text-xs font-medium text-muted-foreground">운전 모드</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 bg-card rounded border">
                                  <p className="text-[10px] text-muted-foreground mb-1">현재 운전모드</p>
                                  <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/10">
                                    {selectedAlert.unit?.includes("HCR") ? "W150N / Full Rate" : "HS Mode"}
                                  </Badge>
                                </div>
                                <div className="p-2 bg-card rounded border">
                                  <p className="text-[10px] text-muted-foreground mb-1">향후 운전모드 (예정)</p>
                                  <Badge variant="outline" className="text-xs">
                                    {selectedAlert.unit?.includes("HCR") ? "W600N / Full Rate" : "RFCC Mode"}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground ml-1.5">{'(3/15~)'}</span>
                                </div>
                              </div>
                            </div>

                            {/* 2) Feed 처리량 by Area */}
                            <div>
                              <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
                                <BarChart3 className="h-3.5 w-3.5 text-blue-500" />Feed 처리량 (Area별 Target vs Actual)
                              </p>
                              <table className="w-full text-xs">
                                <thead><tr className="border-b bg-muted/30">
                                  <th className="text-left px-2 py-1 font-medium text-muted-foreground">Area</th>
                                  <th className="text-right px-2 py-1 font-medium text-muted-foreground">Target (BD)</th>
                                  <th className="text-right px-2 py-1 font-medium text-muted-foreground">Actual (BD)</th>
                                  <th className="text-right px-2 py-1 font-medium text-muted-foreground">Gap</th>
                                  <th className="text-center px-2 py-1 font-medium text-muted-foreground w-12">달성률</th>
                                </tr></thead>
                                <tbody>
                                  {[
                                    { area: "HCR 1st Stage", target: 42000, actual: 41250 },
                                    { area: "HCR 2nd Stage", target: 38000, actual: 37800 },
                                    { area: "FPU", target: 12000, actual: 11500 },
                                  ].map(f => {
                                    const gap = f.actual - f.target
                                    const pctVal = (f.actual / f.target * 100).toFixed(1)
                                    return (
                                      <tr key={f.area} className="border-b last:border-0">
                                        <td className="px-2 py-1.5 font-medium">{f.area}</td>
                                        <td className="px-2 py-1.5 text-right font-mono">{f.target.toLocaleString()}</td>
                                        <td className="px-2 py-1.5 text-right font-mono font-medium">{f.actual.toLocaleString()}</td>
                                        <td className={cn("px-2 py-1.5 text-right font-mono", gap >= 0 ? "text-green-600" : "text-red-600")}>{gap >= 0 ? "+" : ""}{gap.toLocaleString()}</td>
                                        <td className="px-2 py-1.5 text-center">
                                          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", parseFloat(pctVal) >= 98 ? "bg-green-100 text-green-700" : parseFloat(pctVal) >= 95 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                                            {pctVal}%
                                          </span>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* 3) Product Spec Target vs Actual - Kept */}
                            <div>
                              <p className="text-xs font-medium mb-2 flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-teal-500" />Product Spec (Target vs Actual)</p>
                              <table className="w-full text-xs">
                                <thead><tr className="border-b bg-muted/30">
                                  <th className="text-left px-2 py-1 font-medium text-muted-foreground">Product</th>
                                  <th className="text-left px-2 py-1 font-medium text-muted-foreground">Spec</th>
                                  <th className="text-right px-2 py-1 font-medium text-muted-foreground">Target</th>
                                  <th className="text-right px-2 py-1 font-medium text-muted-foreground">Actual</th>
                                  <th className="text-center px-2 py-1 font-medium text-muted-foreground w-10">OK</th>
                                </tr></thead>
                                <tbody>
                                  {[
                                    { prod: "LPG", spec: "C5+ Content", tgt: "2.0 vol%", act: "1.8 vol%", ok: true },
                                    { prod: "Naphtha", spec: "EP", tgt: "180\u00b0C", act: "178\u00b0C", ok: true },
                                    { prod: "Kero", spec: "Flash Point", tgt: "38\u00b0C", act: "39\u00b0C", ok: true },
                                    { prod: "LGO", spec: "Sulfur", tgt: "10 ppm", act: "9 ppm", ok: true },
                                    { prod: "HGO", spec: "Pour Point", tgt: "-9\u00b0C", act: "-10\u00b0C", ok: true },
                                    { prod: "AR", spec: "CCR", tgt: "8.0 wt%", act: "7.8 wt%", ok: true },
                                  ].map(s => (
                                    <tr key={s.prod} className="border-b last:border-0">
                                      <td className="px-2 py-1 font-medium">{s.prod}</td>
                                      <td className="px-2 py-1 text-muted-foreground">{s.spec}</td>
                                      <td className="px-2 py-1 text-right font-mono">{s.tgt}</td>
                                      <td className="px-2 py-1 text-right font-mono">{s.act}</td>
                                      <td className="px-2 py-1 text-center"><span className={cn("w-2 h-2 rounded-full inline-block", s.ok ? "bg-green-500" : "bg-amber-500")} /></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* 4) Product 유량, 수율, DR - Comparison Table */}
                            <div>
                              <p className="text-xs font-medium mb-2 flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-indigo-500" />Product 유량 / 수율 / DR 비교</p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead><tr className="border-b bg-muted/30">
                                    <th className="text-left px-2 py-1 font-medium text-muted-foreground">Product</th>
                                    <th className="text-right px-2 py-1 font-medium text-muted-foreground">유량 (BD)</th>
                                    <th className="text-right px-2 py-1 font-medium text-muted-foreground">수율 (%)</th>
                                    <th className="text-right px-2 py-1 font-medium text-muted-foreground">DR Target</th>
                                    <th className="text-right px-2 py-1 font-medium text-muted-foreground">DR Actual</th>
                                    <th className="text-center px-2 py-1 font-medium text-muted-foreground w-10">ST</th>
                                  </tr></thead>
                                  <tbody>
                                    {[
                                      { prod: "LPG", flow: 5839, yield: 1.8, drTgt: 1.5, drAct: 1.8 },
                                      { prod: "Naphtha", flow: 45990, yield: 14.0, drTgt: 14.5, drAct: 14.0 },
                                      { prod: "Kero", flow: 36603, yield: 11.1, drTgt: 11.0, drAct: 11.1 },
                                      { prod: "LK", flow: 23049, yield: 7.0, drTgt: 7.2, drAct: 7.0 },
                                      { prod: "LGO", flow: 33680, yield: 10.2, drTgt: 10.5, drAct: 10.2 },
                                      { prod: "HGO", flow: 38710, yield: 11.7, drTgt: 12.0, drAct: 11.7 },
                                      { prod: "AR", flow: 145812, yield: 44.2, drTgt: 43.3, drAct: 44.2 },
                                    ].map(p => {
                                      const drGap = Math.abs(p.drAct - p.drTgt)
                                      const ok = drGap <= 1.0
                                      return (
                                        <tr key={p.prod} className="border-b last:border-0">
                                          <td className="px-2 py-1 font-medium">{p.prod}</td>
                                          <td className="px-2 py-1 text-right font-mono">{p.flow.toLocaleString()}</td>
                                          <td className="px-2 py-1 text-right font-mono">{p.yield.toFixed(1)}</td>
                                          <td className="px-2 py-1 text-right font-mono text-muted-foreground">{p.drTgt.toFixed(1)}</td>
                                          <td className="px-2 py-1 text-right font-mono font-medium">{p.drAct.toFixed(1)}</td>
                                          <td className="px-2 py-1 text-center"><span className={cn("w-2 h-2 rounded-full inline-block", ok ? "bg-green-500" : "bg-amber-500")} /></td>
                                        </tr>
                                      )
                                    })}
                                    <tr className="border-t font-semibold bg-muted/20">
                                      <td className="px-2 py-1">SUM</td>
                                      <td className="px-2 py-1 text-right font-mono">329,683</td>
                                      <td className="px-2 py-1 text-right font-mono">100.0</td>
                                      <td className="px-2 py-1 text-right font-mono text-muted-foreground">100.0</td>
                                      <td className="px-2 py-1 text-right font-mono">100.0</td>
                                      <td className="px-2 py-1"></td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* 5) 주요 퍼포먼스 지표 - Custom addable */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-emerald-500" />주요 퍼포먼스 지표</p>
                                <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-primary" onClick={() => setShowAddKpiDialog(true)}>
                                  <Plus className="h-3 w-3" />지표 추가
                                </Button>
                              </div>
                              {/* Default KPIs */}
                              {[
                                { name: "COT (Coil Outlet Temp)", value: 366.2, target: 370, unit: "\u00b0C", id: "default-1" },
                                { name: "Energy Intensity", value: 12.7, target: 12.0, unit: "Gcal/kBD", id: "default-2" },
                              ].map(kpi => {
                                const pct = Math.min((kpi.value / kpi.target) * 100, 120)
                                const isGood = kpi.value >= kpi.target * 0.95
                                return (
                                  <div key={kpi.id} className="space-y-1 mb-2">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-medium">{kpi.name}</span>
                                      <span className={cn("font-mono font-semibold", isGood ? "text-green-600" : "text-amber-600")}>
                                        {kpi.value} {kpi.unit} <span className="text-muted-foreground font-normal">/ {kpi.target}</span>
                                      </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-1.5">
                                      <div className={cn("h-1.5 rounded-full", isGood ? "bg-green-500" : "bg-amber-500")} style={{ width: `${Math.min(pct, 100)}%` }} />
                                    </div>
                                  </div>
                                )
                              })}
                              {/* Custom KPIs from storage */}
                              {customKpis.map(kpi => {
                                const pct = kpi.target > 0 ? Math.min((kpi.value / kpi.target) * 100, 120) : 50
                                const isGood = kpi.target > 0 ? kpi.value >= kpi.target * 0.95 : true
                                return (
                                  <div key={kpi.id} className="space-y-1 mb-2 group">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-medium flex items-center gap-1">
                                        {kpi.name}
                                        <Badge variant="outline" className="text-[8px] h-3.5 px-1">Custom</Badge>
                                        <button onClick={() => deleteCustomKPI(kpi.id)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 cursor-pointer"><X className="h-3 w-3 text-muted-foreground hover:text-red-500" /></button>
                                      </span>
                                      <span className={cn("font-mono font-semibold", isGood ? "text-green-600" : "text-amber-600")}>
                                        {kpi.value} {kpi.unit} <span className="text-muted-foreground font-normal">/ {kpi.target}</span>
                                      </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-1.5">
                                      <div className={cn("h-1.5 rounded-full", isGood ? "bg-green-500" : "bg-amber-500")} style={{ width: `${Math.min(pct, 100)}%` }} />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* ===== 4. 주요 운전변수 현황 ===== */}
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Thermometer className="h-4 w-4" />주요 운전변수 현황
                              <Badge variant="secondary" className="text-[10px]">Operation Guide vs Actual</Badge>
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                기준: 2026-02-25 07:00
                              </div>
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-primary" onClick={() => setShowAddVarDialog(true)}>
                                <Plus className="h-3 w-3" />변수 추가
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                                onClick={() => {
                                  handleCreateTicket({
                                    ...selectedAlert,
                                    title: `[운전변수] ${selectedAlert.unit || "HCR"} 변수 이상`,
                                    description: "주요 운전변수에서 감지된 이상 현황"
                                  })
                                }}
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                이벤트 생성
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead><tr className="border-b bg-muted/30">
                                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground w-6">ST</th>
                                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Tag</th>
                                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Description</th>
                                <th className="text-right px-2 py-1.5 font-medium text-muted-foreground">Actual</th>
                                <th className="text-right px-2 py-1.5 font-medium text-muted-foreground">Guide</th>
                                <th className="text-center px-2 py-1.5 font-medium text-muted-foreground">Range</th>
                              </tr></thead>
                              <tbody>
                                {(() => {
                                  const defaultVarData = [
                                    { tag: "TI-1052", name: "Column Top Temp", val: "122.3", guide: "125", range: "120~130", st: "normal", trend: [121.5, 121.8, 122.0, 122.1, 122.3, 122.2, 122.4, 122.3] },
                                    { tag: "PI-1102", name: "Column Top Press", val: "1.35", guide: "1.5", range: "1.2~1.8", st: "normal", trend: [1.33, 1.34, 1.35, 1.34, 1.35, 1.36, 1.35, 1.35] },
                                    { tag: "TI-1352", name: "Furnace Outlet Temp", val: "363.2", guide: "365", range: "360~370", st: "normal", trend: [362.8, 363.0, 363.1, 363.5, 363.2, 363.0, 363.3, 363.2] },
                                    { tag: "FI-1252", name: "Feed Flow Rate", val: "342", guide: "350", range: "300~370", st: "normal", trend: [340, 341, 342, 343, 342, 341, 342, 342] },
                                    { tag: "FI-1452", name: "Reflux Flow Rate", val: "88.5", guide: "90", range: "80~100", st: "normal", trend: [87.5, 88.0, 88.2, 88.5, 88.3, 88.4, 88.5, 88.5] },
                                    { tag: "TI-1552", name: "OVHD Temp", val: "108.1", guide: "110", range: "105~115", st: "normal", trend: [107.8, 108.0, 108.1, 108.2, 108.0, 108.1, 108.1, 108.1] },
                                    { tag: "LI-1652", name: "Column Level", val: "51.2", guide: "50", range: "40~60", st: "normal", trend: [50.5, 50.8, 51.0, 51.2, 51.1, 51.0, 51.2, 51.2] },
                                    { tag: "AI-1752", name: "AR Flash Point", val: "69.5", guide: "65", range: ">65", st: "normal", trend: [68.5, 69.0, 69.2, 69.5, 69.3, 69.4, 69.5, 69.5] },
                                    { tag: "TI-2025", name: "Desalter Outlet", val: "134.8", guide: "135", range: "130~140", st: "normal", trend: [134.2, 134.5, 134.6, 134.8, 134.7, 134.8, 134.8, 134.8] },
                                    { tag: "PI-2125", name: "Column Bottom Press", val: "1.85", guide: "1.9", range: "1.7~2.1", st: "normal", trend: [1.83, 1.84, 1.85, 1.84, 1.85, 1.86, 1.85, 1.85] },
                                    { tag: "TI-2225", name: "Kero Draw Temp", val: "188.4", guide: "190", range: "180~195", st: "normal", trend: [187.8, 188.0, 188.2, 188.4, 188.3, 188.4, 188.4, 188.4] },
                                    { tag: "TI-2325", name: "LGO Draw Temp", val: "268.7", guide: "270", range: "260~280", st: "normal", trend: [268.0, 268.2, 268.5, 268.7, 268.6, 268.7, 268.7, 268.7] },
                                    { tag: "TI-2425", name: "HGO Draw Temp", val: "323.1", guide: "325", range: "315~335", st: "normal", trend: [322.5, 322.8, 323.0, 323.1, 323.0, 323.1, 323.1, 323.1] },
                                    { tag: "FI-2525", name: "Steam Flow", val: "4.5", guide: "4.5", range: "3.5~5.5", st: "normal", trend: [4.4, 4.5, 4.5, 4.5, 4.4, 4.5, 4.5, 4.5] },
                                    { tag: "TI-2625", name: "Condenser Outlet", val: "54.2", guide: "55", range: "48~60", st: "normal", trend: [53.8, 54.0, 54.1, 54.2, 54.1, 54.2, 54.2, 54.2] },
                                  ]
                                  // Add custom monitored variables
                                  const customVars = monitoredVarTags.map(tagId => {
                                    const tagInfo = ALL_PROCESS_TAGS.find(t => t.tag === tagId)
                                    if (!tagInfo) return null
                                    const baseVal = tagInfo.guide + (Math.random() - 0.5) * tagInfo.guide * 0.03
                                    return {
                                      tag: tagInfo.tag, name: tagInfo.name, val: baseVal.toFixed(1), guide: String(tagInfo.guide),
                                      range: tagInfo.range, st: "normal" as const, isCustom: true,
                                      trend: Array.from({length: 8}, () => tagInfo.guide + (Math.random() - 0.5) * tagInfo.guide * 0.02)
                                    }
                                  }).filter(Boolean) as typeof defaultVarData
                                  const allVars = [...defaultVarData, ...customVars]
                                  return allVars.map(v => (
                                    <tr
                                      key={v.tag}
                                      className={cn("border-b cursor-pointer hover:bg-muted/30 transition-colors", v.st === "warning" && "bg-amber-50/50")}
                                      onClick={() => {
                                        setSelectedVarForTrend(v)
                                        setShowVarTrendDialog(true)
                                      }}
                                    >
                                      <td className="px-2 py-1.5"><span className={cn("w-2 h-2 rounded-full inline-block", v.st === "warning" ? "bg-amber-500" : "bg-green-500")} /></td>
                                      <td className="px-2 py-1.5 font-mono text-muted-foreground">{v.tag}</td>
                                      <td className="px-2 py-1.5 flex items-center gap-1">
                                        {v.name}
                                        {("isCustom" in v) && <Badge variant="outline" className="text-[8px] h-3.5 px-1">추가</Badge>}
                                      </td>
                                      <td className="px-2 py-1.5 text-right font-mono font-medium">{v.val}</td>
                                      <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">{v.guide}</td>
                                      <td className="px-2 py-1.5 text-center text-muted-foreground">
                                        <span className="flex items-center justify-center gap-1">
                                          {v.range}
                                          <ExternalLink className="h-2.5 w-2.5 opacity-40" />
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>

                      {/* ===== 5. 추가 모니터링 항목 ===== */}
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Eye className="h-4 w-4" />추가 모니터링 항목
                            </CardTitle>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                              onClick={() => {
                                handleCreateTicket({
                                  ...selectedAlert,
                                  title: `[모니터링] ${selectedAlert.unit || "HCR"} 추가 모니터링 이슈`,
                                  description: "추가 모니터링 항목에서 감지된 이슈"
                                })
                              }}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              이벤트 생성
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            {/* 개인화 알람 섹션 */}
                            {(() => {
                              const personalAlarms = getPersonalizedAlarms()
                              if (personalAlarms.length === 0) return null
                              return (
                                <div>
                                  <p className="text-xs font-medium mb-3 flex items-center gap-1.5">
                                    <Bell className="h-3.5 w-3.5 text-indigo-500" />
                                    개인화 알람
                                    <Badge variant="secondary" className="text-[8px] h-4">{personalAlarms.length}</Badge>
                                  </p>
                                  <div className="grid grid-cols-2 gap-3">
                                    {personalAlarms.filter(a => a.active).map(alarm => {
                                      // Generate a mock current value for demonstration
                                      const mockCurrentValue = alarm.min && alarm.max 
                                        ? alarm.min + Math.random() * (alarm.max - alarm.min) * 1.2
                                        : 50 + Math.random() * 50
                                      const isTriggered = (alarm.max !== undefined && mockCurrentValue > alarm.max) || 
                                                         (alarm.min !== undefined && mockCurrentValue < alarm.min)
                                      return (
                                        <div key={alarm.id} className={cn("border rounded-lg p-3 bg-card", isTriggered && "border-red-300 bg-red-50/50")}>
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", isTriggered ? "bg-red-500 animate-pulse" : "bg-green-500")} />
                                            <span className="text-xs font-semibold font-mono">{alarm.tagId}</span>
                                            <Badge variant="outline" className="text-[9px] h-4">{alarm.unit}</Badge>
                                            {isTriggered && <Badge className="text-[9px] h-4 bg-red-500">알람 발생</Badge>}
                                          </div>
                                          <p className="text-[10px] text-muted-foreground mb-2">{alarm.tagDescription || alarm.tagId}</p>
                                          <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">
                                              범위: {alarm.min ?? "-"} ~ {alarm.max ?? "-"} {alarm.unit}
                                            </span>
                                            <span className={cn("font-semibold", isTriggered ? "text-red-600" : "text-foreground")}>
                                              현재: {mockCurrentValue.toFixed(1)}
                                            </span>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })()}

                            {/* 장기 건전성 집중 모니터링 - Detailed trend cards */}
                            <div>
                              <p className="text-xs font-medium mb-3 flex items-center gap-1.5">
                                <Flame className="h-3.5 w-3.5 text-red-500" />장기 건전성 집중 모니터링
                                <Badge variant="secondary" className="text-[8px] h-4">{DEFAULT_HEALTH_MONITORS.length}</Badge>
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                {DEFAULT_HEALTH_MONITORS.map(item => {
                                  const isGood = item.driftPct <= 0
                                  const isWarning = item.driftPct > 0 && item.driftPct < 80
                                  const isCritical = item.driftPct >= 80
                                  const trendColor = isCritical ? "#ef4444" : isWarning ? "#f59e0b" : "#10b981"
                                  return (
                                    <div key={item.id} className="border rounded-lg p-3 bg-card">
                                      {/* Header with equip info */}
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-green-500")} />
                                        <span className="text-xs font-semibold">{item.equipId}</span>
                                        <Badge variant="outline" className="text-[9px] h-4">{item.process}</Badge>
                                        <Badge variant="outline" className="text-[9px] h-4">{item.mode}</Badge>
                                        <span className="ml-auto text-[10px] text-muted-foreground">[{item.healthIndexUnit}]</span>
                                      </div>
                                      <p className="text-[10px] text-muted-foreground mb-2">{item.equipName}</p>

                                      {/* SVG Trend Chart */}
                                      <div className="relative h-24 mb-2">
                                        <svg viewBox="0 0 240 80" className="w-full h-full" preserveAspectRatio="none">
                                          {/* Background grid */}
                                          <line x1="0" y1="20" x2="240" y2="20" stroke="currentColor" strokeOpacity="0.06" />
                                          <line x1="0" y1="40" x2="240" y2="40" stroke="currentColor" strokeOpacity="0.06" />
                                          <line x1="0" y1="60" x2="240" y2="60" stroke="currentColor" strokeOpacity="0.06" />

                                          {/* Limit line */}
                                          {(() => {
                                            const mn = Math.min(...item.trend, item.limitValue) * 0.95
                                            const mx = Math.max(...item.trend, item.limitValue) * 1.02
                                            const limitY = 75 - ((item.limitValue - mn) / (mx - mn)) * 70
                                            return (
                                              <>
                                                {/* Below-limit danger zone */}
                                                <rect x="0" y={limitY} width="240" height={75 - limitY} fill={isCritical ? "#fecaca" : "#fef3c7"} opacity="0.3" />
                                                <line x1="0" y1={limitY} x2="240" y2={limitY} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="4,3" />
                                                <text x="242" y={limitY + 3} fontSize="6" fill="#ef4444" fontFamily="monospace">Limit</text>
                                              </>
                                            )
                                          })()}

                                          {/* Projection line (dashed) */}
                                          {(() => {
                                            const mn = Math.min(...item.trend, item.limitValue) * 0.95
                                            const mx = Math.max(...item.trend, item.limitValue) * 1.02
                                            const lastVal = item.trend[item.trend.length - 1]
                                            const lastY = 75 - ((lastVal - mn) / (mx - mn)) * 70
                                            const projEnd = item.limitValue
                                            const projY = 75 - ((projEnd - mn) / (mx - mn)) * 70
                                            const lastX = ((item.trend.length - 1) / (item.trend.length - 1)) * 180
                                            return (
                                              <line x1={lastX} y1={lastY} x2="240" y2={Math.min(projY, 75)} stroke="#818cf8" strokeWidth="0.8" strokeDasharray="3,2" />
                                            )
                                          })()}

                                          {/* Actual trend line */}
                                          {(() => {
                                            const mn = Math.min(...item.trend, item.limitValue) * 0.95
                                            const mx = Math.max(...item.trend, item.limitValue) * 1.02
                                            const points = item.trend.map((val, i) => {
                                              const x = (i / (item.trend.length - 1)) * 180
                                              const y = 75 - ((val - mn) / (mx - mn)) * 70
                                              return `${x},${y}`
                                            }).join(" ")
                                            return (
                                              <polyline points={points} fill="none" stroke={trendColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            )
                                          })()}

                                          {/* Current value marker */}
                                          {(() => {
                                            const mn = Math.min(...item.trend, item.limitValue) * 0.95
                                            const mx = Math.max(...item.trend, item.limitValue) * 1.02
                                            const lastVal = item.trend[item.trend.length - 1]
                                            const lastX = 180
                                            const lastY = 75 - ((lastVal - mn) / (mx - mn)) * 70
                                            return <circle cx={lastX} cy={lastY} r="2.5" fill={trendColor} />
                                          })()}

                                          {/* Vertical "현재" line */}
                                          <line x1="180" y1="2" x2="180" y2="78" stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.5" strokeDasharray="2,2" />
                                          <text x="178" y="8" fontSize="5" fill="currentColor" opacity="0.4" textAnchor="end" fontFamily="sans-serif">현재</text>
                                        </svg>
                                      </div>

                                      {/* Metrics row */}
                                      <div className="flex items-center gap-2 text-[10px] flex-wrap">
                                        <span className="text-muted-foreground">��재 <span className="font-mono font-semibold text-foreground">{item.currentValue}</span> {item.healthIndexUnit}</span>
                                        <span className="text-muted-foreground">Limit <span className="font-mono">{item.limitValue}</span></span>
                                        <span className="text-muted-foreground">Projection <span className="font-mono">{item.projection}주</span></span>
                                        <span className="text-muted-foreground">전 TA <span className="font-mono">{item.prevTaValue}</span> {item.healthIndexUnit}</span>
                                        <Badge 
                                          className={cn(
                                            "ml-auto text-[9px] h-4 px-1.5 gap-0.5",
                                            isCritical ? "bg-red-100 text-red-700 hover:bg-red-100" : isWarning ? "bg-amber-100 text-amber-700 hover:bg-amber-100" : "bg-green-100 text-green-700 hover:bg-green-100"
                                          )}
                                        >
                                          {item.driftPct > 0 && <ArrowRight className="h-2.5 w-2.5 rotate-[-45deg]" />}
                                          Drift {item.driftPct > 0 ? "+" : ""}{item.driftPct}%
                                        </Badge>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                              {focusMonitoringItems.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-[10px] text-muted-foreground mb-2">사용자 등록 항목</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    {focusMonitoringItems.map(item => (
                                      <div key={item.id} className="p-2 border border-red-100 bg-red-50/30 rounded text-xs">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                          <span className="font-medium">{item.equipId}</span>
                                          <Badge variant="outline" className="text-[8px] h-3.5">{item.process}</Badge>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">{item.healthIndexName}: {item.currentValue} {item.healthIndexUnit} | Drift {item.driftPct > 0 ? "+" : ""}{item.driftPct.toFixed(0)}%</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Standing Issue 영역 */}
                      <Card className="border-amber-200/50">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <ClipboardList className="h-4 w-4 text-amber-600" />
                              Standing Issue
                              <Badge variant="secondary" className="ml-1 text-xs">{standingIssues.filter(i => i.status !== "resolved").length}</Badge>
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 border-primary/50 text-primary hover:bg-primary/5 bg-transparent"
                                onClick={() => setShowDailyReportDialog(true)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                추가 등록
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {standingIssues.filter(i => i.status !== "resolved").map((issue) => (
                              <div key={issue.id} className={cn(
                                "border rounded-lg overflow-hidden",
                                issue.category === "daily-report" && "border-primary/30 bg-primary/5"
                              )}>
                                {/* Issue 헤더 */}
                                <div className="flex items-center justify-between p-3 bg-muted/30">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Badge variant="outline" className={cn(
                                      "text-xs shrink-0",
                                      issue.category === "long-term" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                      issue.category === "special" ? "bg-red-50 text-red-700 border-red-200" :
                                      issue.category === "monitoring" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                      "bg-primary/10 text-primary border-primary/30"
                                    )}>
                                      {issue.category === "long-term" ? "장기" : issue.category === "special" ? "특이" : issue.category === "monitoring" ? "관찰" : "일일보고"}
                                    </Badge>
                                    <Badge variant={issue.status === "active" ? "destructive" : "secondary"} className="text-xs shrink-0">
                                      {issue.status === "active" ? "활성" : "관찰중"}
                                    </Badge>
                                    {issue.unit && (
                                      <Badge variant="outline" className="text-xs shrink-0">{issue.unit}</Badge>
                                    )}
                                    <span className="text-sm font-medium truncate">{issue.title}</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{issue.lastUpdated}</span>
                                </div>
                                
                                {/* Issue 내용 */}
                                <div className="p-3 space-y-2">
                                  <p className="text-sm text-muted-foreground">{issue.description}</p>
                                  
                                  {/* 연결 이벤트 */}
                                  {issue.linkedTicketId && (
                                    <button
                                      onClick={() => router.push(`/tickets/${issue.linkedTicketId}`)}
                                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                                    >
                                      <LinkIcon className="h-3 w-3" />
                                      {issue.linkedTicketTitle || `Ticket #${issue.linkedTicketId}`}
                                    </button>
                                  )}
                                  
                                  {/* 최근 업데이트 */}
                                  {issue.updates.length > 0 && (
                                    <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                                      <span className="font-medium text-muted-foreground">최근 업데이트:</span>
                                      <p className="mt-0.5">{issue.updates[0].content}</p>
                                      <span className="text-muted-foreground">{issue.updates[0].date} - {issue.updates[0].author}</span>
                                    </div>
                                  )}
                                  
                                  {/* 업데이트 입력 영역 */}
                                  {editingIssueId === issue.id ? (
                                    <div className="mt-2 space-y-2">
                                      <Textarea
                                        value={issueUpdateContent}
                                        onChange={(e) => setIssueUpdateContent(e.target.value)}
                                        placeholder="업데이트 내용을 입력하세요..."
                                        className="min-h-16 text-sm"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          className="bg-transparent text-xs"
                                          onClick={() => { setEditingIssueId(null); setIssueUpdateContent("") }}
                                        >
                                          <X className="h-3 w-3 mr-1" />
                                          취소
                                        </Button>
                                        <Button 
                                          size="sm"
                                          className="text-xs"
                                          onClick={() => handleUpdateStandingIssue(issue.id)}
                                          disabled={!issueUpdateContent.trim()}
                                        >
                                          <Save className="h-3 w-3 mr-1" />
                                          저장
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex justify-end gap-2 mt-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-xs h-7 px-2"
                                        onClick={() => setEditingIssueId(issue.id)}
                                      >
                                        <Pencil className="h-3 w-3 mr-1" />
                                        업데이트
                                      </Button>
                                      {!issue.linkedTicketId && (
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => {
                                            handleCreateTicket({
                                              ...selectedAlert,
                                              title: `[Standing Issue] ${issue.title}`,
                                              description: issue.description
                                            })
                                          }}
                                        >
                                          <FileText className="h-3 w-3 mr-1" />
                                          이벤트 생성
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}

                            {standingIssues.filter(i => i.status !== "resolved").length === 0 && (
                              <div className="text-center py-6 text-muted-foreground text-sm">
                                등록된 Standing Issue가 없습니다.
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* DCS 수정 요청 상세 */}
                  {selectedAlert.subType === "dcs-modification" && selectedAlert.data?.items && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          변경 상세 정보
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedAlert.data.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <span className="text-sm font-medium">{item.name}</span>
                              <div className="flex items-center gap-3">
                                {item.name === "연결 ESR" ? (
                                  <button
                                    onClick={() => setShowEsrDialog(true)}
                                    className="text-sm text-primary underline hover:text-primary/80 cursor-pointer"
                                  >
                                    {item.value}
                                  </button>
                                ) : (
                                  <span className="text-sm text-muted-foreground">{item.value}</span>
                                )}
                                <Badge variant={item.status === "warning" ? "destructive" : "secondary"}>
                                  {item.status === "warning" ? "변경" : "정보"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Notice: 장기모니터링 상세 - 건전성 현황 대시보드 인라인 */}
                  {selectedAlert.subType === "long-term" && (() => {
                    const cats = Object.values(HEALTH_CATEGORIES)
                    const catData = cats.map(cat => {
                      const equip = getEquipmentData(cat.id)
                      const red = equip.filter(e => e.trafficLight === "red")
                      const yellow = equip.filter(e => e.trafficLight === "yellow")
                      const green = equip.filter(e => e.trafficLight === "green")
                      return { ...cat, red, yellow, green, total: equip.length }
                    })
                    const totals = catData.reduce((a, c) => ({
                      red: a.red + c.red.length, yellow: a.yellow + c.yellow.length,
                      green: a.green + c.green.length, total: a.total + c.total,
                    }), { red: 0, yellow: 0, green: 0, total: 0 })

                    return (
                      <Card className="border-blue-200/50">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              장기 건전성 현황
                            </CardTitle>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50"
                              onClick={() => router.push("/operations/health/overview")}
                            >
                              <ExternalLink className="h-3 w-3" />
                              전체 화면
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Summary bar */}
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-muted-foreground">전체 <span className="font-semibold text-foreground">{totals.total}</span></span>
                            <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /><span className="font-semibold text-red-600">{totals.red}</span></div>
                            <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /><span className="font-semibold text-amber-600">{totals.yellow}</span></div>
                            <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /><span className="font-semibold text-emerald-600">{totals.green}</span></div>
                            {totals.total > 0 && (
                              <div className="flex h-2 flex-1 rounded-full overflow-hidden bg-muted ml-auto">
                                <div className="bg-red-500" style={{ width: `${(totals.red / totals.total) * 100}%` }} />
                                <div className="bg-amber-400" style={{ width: `${(totals.yellow / totals.total) * 100}%` }} />
                                <div className="bg-emerald-500" style={{ width: `${(totals.green / totals.total) * 100}%` }} />
                              </div>
                            )}
                          </div>

                          {/* Category mini-cards */}
                          <div className="grid grid-cols-1 gap-2">
                            {catData.map(cat => (
                              <div
                                key={cat.id}
                                className={cn(
                                  "flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                                  cat.red.length > 0 ? "border-red-200 bg-red-50/30" : "border-border"
                                )}
                                onClick={() => router.push(`/operations/health/${cat.id}`)}
                              >
                                <div className="shrink-0">
                                  <Activity className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold">{cat.label}</span>
                                    <span className="text-[10px] text-muted-foreground truncate">{cat.healthIndexName}</span>
                                  </div>
                                  {cat.red.length > 0 && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                                      <span className="text-[10px] text-red-600 truncate">
                                        {cat.red.slice(0, 2).map(e => e.id).join(", ")}
                                        {cat.red.length > 2 && ` 외 ${cat.red.length - 2}건`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-red-500" />
                                    <span className="text-[11px] font-semibold text-red-600">{cat.red.length}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                                    <span className="text-[11px] font-semibold text-amber-600">{cat.yellow.length}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="text-[11px] font-semibold text-emerald-600">{cat.green.length}</span>
                                  </div>
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })()}

                  {/* ===== Weekly Monitoring 요약 상세 ===== */}
                  {selectedAlert.subType === "weekly-monitoring" && (() => {
                    // Health data from HEALTH_CATEGORIES
                    const cats = Object.values(HEALTH_CATEGORIES)
                    const catData = cats.map(cat => {
                      const equip = getEquipmentData(cat.id)
                      const red = equip.filter(e => e.trafficLight === "red")
                      const yellow = equip.filter(e => e.trafficLight === "yellow")
                      const green = equip.filter(e => e.trafficLight === "green")
                      return { ...cat, red, yellow, green, total: equip.length }
                    })
                    const totals = catData.reduce((a, c) => ({
                      red: a.red + c.red.length, yellow: a.yellow + c.yellow.length,
                      green: a.green + c.green.length, total: a.total + c.total,
                    }), { red: 0, yellow: 0, green: 0, total: 0 })

                    // Anomaly data
                    const anomalyData = {
                      similarOp: { danger: 4, warning: 5, normal: 5, tags: 14 },
                      instrument: { peakFlatline: 2, oscillation: 4, peak: 3, flatline: 2, hunting: 2 },
                      drift: { driftExpand: 2, watchNeeded: 2, monitorItems: 7 },
                    }
                    const anomTotals = { danger: 8, warning: 11, normal: 9 }

                    return (
                      <>
                        {/* 1. AI Weekly Summary */}
                        <Card className="border-l-4 border-l-indigo-500">
                          <CardContent className="py-4">
                            <div className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                                <Sparkles className="h-4 w-4 text-indigo-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-sm font-semibold">AI Weekly Summary</h3>
                                  <Badge variant="secondary" className="text-[10px]">GenAI</Badge>
                                  <span className="text-[10px] text-muted-foreground ml-auto">2025-02-02 09:00 생성</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-[10px] ml-2 border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                                    onClick={() => {
                                      handleCreateTicket({
                                        ...selectedAlert,
                                        title: `[Weekly Summary] ${selectedAlert.unit || "HCR"} 주간 이슈`,
                                        description: "금주 공정 운전 검토 결과 발생한 이슈"
                                      })
                                    }}
                                  >
                                    <FileText className="h-3 w-3 mr-1" />
                                    이벤트 생성
                                  </Button>
                                </div>
                                <div className="p-3 bg-muted/40 rounded-lg mb-3">
                                  <p className="text-xs leading-relaxed">
                                    {"금주(2025년 5주차) 전반적인 공정 운전은 안정적으로 유지되었으나, 장기 건전성 관점에서 일부 주의가 필요합니다. 전체 118개 모��터링 항목 중 Red 46건(39%)으로 전주 대비 3건 증가하였으며, 특히 Fouling 카테고리에서 F-E101A, F-E102A의 열교환 성능 저하가 가속화되고 있습니다.\n\n이상징후 탐지에서는 총 28건이 감지되었으며 Danger 8건 중 FV-2001 Control Valve Sticking 의심 건과 E-101 UA Value 지속 하락이 중점 관리 대상입니다. DR 데이터 대비 Drift 감지에서 FI-1501 Flow Meter 교정 필요성이 재확인되었습니다.\n\n종합 판정: 전주 대비 건전성 지표 소폭 악화. F-E101A 세정 일정 검토 및 FV-2001 정비 점검 권장."}
                                  </p>
                                </div>
                                <div className="p-3 bg-muted/40 rounded-lg">
                                  <p className="text-xs font-medium text-muted-foreground mb-1.5">주간 핵심 변동 사항</p>
                                  <div className="space-y-1.5">
                                    {[
                                      { name: "Fouling Red 항목", value: "18건 (+3)", change: "전주 대비 증가", status: "warning" as const },
                                      { name: "Anomaly Danger", value: "8건 (+1)", change: "FV-2001 신규", status: "warning" as const },
                                      { name: "WABT 상승 추세", value: "402\u00b0C (+2\u00b0C/주)", change: "지속 관찰", status: "warning" as const },
                                      { name: "에너지 효율 (EII)", value: "97.8 (개선)", change: "-0.4", status: "normal" as const },
                                      { name: "처리량 준수율", value: "98.5%", change: "+0.3%p", status: "normal" as const },
                                      { name: "무사고 일수", value: "439일", change: "+7일", status: "normal" as const },
                                    ].map((v, i) => (
                                      <div key={i} className="flex items-center gap-2 text-xs">
                                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", v.status === "warning" ? "bg-amber-500" : "bg-green-500")} />
                                        <span className="font-medium w-36 shrink-0">{v.name}</span>
                                        <span className="text-muted-foreground">{v.change}</span>
                                        <span className="font-mono ml-auto">{v.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* 2. 운영 지표 모니터링 (효율성 모니터링) */}
                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Gauge className="h-4 w-4" />
                                효율성 모니터링
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground">2025-02-02 기준 주간 평균</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-[10px] border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                                  onClick={() => {
                                    handleCreateTicket({
                                      ...selectedAlert,
                                      title: `[효율성] ${selectedAlert.unit || "HCR"} KPI 이슈`,
                                      description: "효율성 모니터링에서 감지된 이슈"
                                    })
                                  }}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  이벤트 생성
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-5 gap-2">
                              {[
                                { name: "처리량 준수율", value: 98.5, target: 98.0, unit: "%", trend: "up", delta: "+0.3%p", status: "good" },
                                { name: "프로덕트 온스펙 비율", value: 99.2, target: 99.0, unit: "%", trend: "up", delta: "+0.1%p", status: "good" },
                                { name: "AI 모델 정확도", value: 94.8, target: 95.0, unit: "%", trend: "down", delta: "-0.4%p", status: "warn" },
                                { name: "AI 모델 가동률", value: 97.1, target: 95.0, unit: "%", trend: "up", delta: "+1.2%p", status: "good" },
                                { name: "RTO 모델 가동률", value: 91.3, target: 95.0, unit: "%", trend: "down", delta: "-2.1%p", status: "bad" },
                              ].map((kpi, i) => {
                                const pct = Math.min(100, (kpi.value / kpi.target) * 100)
                                return (
                                  <div key={i} className="border rounded-lg p-3 text-center space-y-2">
                                    <p className="text-[10px] text-muted-foreground leading-tight h-7 flex items-center justify-center">{kpi.name}</p>
                                    <p className={cn(
                                      "text-lg font-bold font-mono",
                                      kpi.status === "good" ? "text-emerald-600" : kpi.status === "warn" ? "text-amber-600" : "text-red-600"
                                    )}>
                                      {kpi.value}<span className="text-xs font-normal text-muted-foreground ml-0.5">{kpi.unit}</span>
                                    </p>
                                    {/* progress bar */}
                                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                      <div
                                        className={cn(
                                          "h-full rounded-full transition-all",
                                          kpi.status === "good" ? "bg-emerald-500" : kpi.status === "warn" ? "bg-amber-400" : "bg-red-500"
                                        )}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <div className="flex items-center justify-center gap-1 text-[10px]">
                                      <span className="text-muted-foreground">목표 {kpi.target}{kpi.unit}</span>
                                    </div>
                                    <Badge className={cn(
                                      "text-[9px] h-4",
                                      kpi.status === "good" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : kpi.status === "warn" ? "bg-amber-100 text-amber-700 hover:bg-amber-100" : "bg-red-100 text-red-700 hover:bg-red-100"
                                    )}>
                                      {kpi.trend === "up" ? "\u25B2" : "\u25BC"} {kpi.delta}
                                    </Badge>
                                  </div>
                                )
                              })}
                            </div>
                          </CardContent>
                        </Card>

                        {/* 3. 장기 건전성 현황 (장기 모니터링) */}
                        <Card className="border-blue-200/50">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                장기 건전성 현황
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-[10px] border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                                  onClick={() => {
                                    handleCreateTicket({
                                      ...selectedAlert,
                                      title: `[장기모니터링] ${selectedAlert.unit || "HCR"} 건전성 이슈`,
                                      description: "장기 건전성 모니터링에서 감지된 이슈"
                                    })
                                  }}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  이벤트 생성
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50"
                                  onClick={() => router.push("/operations/health/overview")}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  전체 화면
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {/* Summary bar */}
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-muted-foreground">전체 <span className="font-semibold text-foreground">{totals.total}</span></span>
                              <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /><span className="font-semibold text-red-600">{totals.red}</span></div>
                              <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="font-semibold text-amber-600">{totals.yellow}</span></div>
                              <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><span className="font-semibold text-emerald-600">{totals.green}</span></div>
                              {totals.total > 0 && (
                                <div className="flex h-2.5 flex-1 rounded-full overflow-hidden bg-muted ml-auto">
                                  <div className="bg-red-500" style={{ width: `${(totals.red / totals.total) * 100}%` }} />
                                  <div className="bg-amber-400" style={{ width: `${(totals.yellow / totals.total) * 100}%` }} />
                                  <div className="bg-emerald-500" style={{ width: `${(totals.green / totals.total) * 100}%` }} />
                                </div>
                              )}
                            </div>

                            {/* Category rows */}
                            <div className="grid grid-cols-1 gap-2">
                              {catData.map(cat => (
                                <div
                                  key={cat.id}
                                  className={cn(
                                    "flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                                    cat.red.length > 0 ? "border-red-200 bg-red-50/30" : "border-border"
                                  )}
                                  onClick={() => router.push(`/operations/health/${cat.id}`)}
                                >
                                  <div className="shrink-0">
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold">{cat.label}</span>
                                      <span className="text-[10px] text-muted-foreground truncate">{cat.healthIndexName}</span>
                                    </div>
                                    {cat.red.length > 0 && (
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                                        <span className="text-[10px] text-red-600 truncate">
                                          {cat.red.slice(0, 2).map(e => e.id).join(", ")}
                                          {cat.red.length > 2 && ` 외 ${cat.red.length - 2}건`}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="flex items-center gap-1">
                                      <span className="h-2 w-2 rounded-full bg-red-500" />
                                      <span className="text-[11px] font-semibold text-red-600">{cat.red.length}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                                      <span className="text-[11px] font-semibold text-amber-600">{cat.yellow.length}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                      <span className="text-[11px] font-semibold text-emerald-600">{cat.green.length}</span>
                                    </div>
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* 5. Anomaly Detection (이상징후 ��니터링) - Expandable Cards */}
                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                이상징후 모니터링
                              </CardTitle>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
                                onClick={() => {
                                  handleCreateTicket({
                                    ...selectedAlert,
                                    title: `[이상징후] ${selectedAlert.unit || "HCR"} Anomaly 탐지`,
                                    description: "이상징후 모니터링에서 감지된 이슈"
                                  })
                                }}
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                이벤트 생성
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {/* Anomaly detail tag data */}
                            {(() => {
                              const anomCards = [
                                {
                                  id: "similar", borderColor: "border-l-emerald-400",
                                  icon: <Zap className="h-3.5 w-3.5 text-emerald-600" />,
                                  iconBg: "bg-emerald-50",
                                  title: "유사운전시점 비교",
                                  desc: "과거 유사 운전 데이터 대비 이상 변수 탐지",
                                  badges: [
                                    { label: `Danger ${anomalyData.similarOp.danger}`, cls: "bg-red-100 text-red-700 hover:bg-red-100" },
                                    { label: `Warning ${anomalyData.similarOp.warning}`, cls: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
                                    { label: `Normal ${anomalyData.similarOp.normal}`, cls: "bg-green-100 text-green-700 hover:bg-green-100" },
                                  ],
                                  footer: `분석 태그: ${anomalyData.similarOp.tags}건`,
                                  tags: {
                                    danger: [
                                      { tag: "TI-3001", name: "1st Reactor Inlet Temp", value: "382.1\u00b0C", note: "Guide 대비 +12\u00b0C 지속 상승" },
                                      { tag: "FV-2001", name: "Control Valve Position", value: "78.3%", note: "Sticking 의심 - 비선형 응답" },
                                      { tag: "TI-3004", name: "2nd Reactor Outlet Temp", value: "422.5\u00b0C", note: "유사 구간 대비 고온 운전" },
                                      { tag: "PI-3001", name: "1st Reactor Press", value: "162.3 kg/cm2", note: "상한 근접 운전" },
                                    ],
                                    warning: [
                                      { tag: "FI-3002", name: "H2 Makeup Flow", value: "92,100 Nm3/h", note: "유량 점진 증가 추세" },
                                      { tag: "TI-1352", name: "Furnace Outlet Temp", value: "368.2\u00b0C", note: "Guide 근접" },
                                      { tag: "AI-3002", name: "Product Sulfur", value: "8.2 ppm", note: "Spec 상한 접근" },
                                      { tag: "LI-1001", name: "Column Level", value: "62.5%", note: "상한 Range 부근" },
                                      { tag: "FI-1252", name: "Feed Flow Rate", value: "365 m3/h", note: "고부하 운전" },
                                    ],
                                    normal: [
                                      { tag: "TI-1052", name: "Column Top Temp", value: "122.3\u00b0C", note: "안정" },
                                      { tag: "PI-1102", name: "Column Top Press", value: "1.35 kg/cm2", note: "안정" },
                                      { tag: "FI-1452", name: "Reflux Flow Rate", value: "88.5 m3/h", note: "안정" },
                                      { tag: "TI-1552", name: "OVHD Temp", value: "108.1\u00b0C", note: "안정" },
                                      { tag: "AI-1752", name: "AR Flash Point", value: "69.5\u00b0C", note: "Spec 충족" },
                                    ],
                                  }
                                },
                                {
                                  id: "instrument", borderColor: "border-l-blue-400",
                                  icon: <Gauge className="h-3.5 w-3.5 text-blue-600" />,
                                  iconBg: "bg-blue-50",
                                  title: "계기 오류 탐지",
                                  desc: "Peak, Flatline, Oscillation 등 계기 이상 감지",
                                  badges: [
                                    { label: `Peak/Flatline ${anomalyData.instrument.peakFlatline}`, cls: "bg-purple-100 text-purple-700 hover:bg-purple-100" },
                                    { label: `Oscillation ${anomalyData.instrument.oscillation}`, cls: "bg-orange-100 text-orange-700 hover:bg-orange-100" },
                                  ],
                                  footer: null,
                                  subInfo: (
                                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                      <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-red-400" />Peak {anomalyData.instrument.peak}</span>
                                      <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3 text-blue-400" />Flatline {anomalyData.instrument.flatline}</span>
                                      <span className="flex items-center gap-1"><Activity className="h-3 w-3 text-amber-400" />Hunting {anomalyData.instrument.hunting}</span>
                                    </div>
                                  ),
                                  tags: {
                                    danger: [
                                      { tag: "TI-2625", name: "Condenser Outlet", value: "Peak", note: "순간 스파이크 반복 (3회/h)" },
                                      { tag: "FI-9001", name: "Fuel Gas Flow", value: "Flatline", note: "2시간 이상 고정값 출력" },
                                      { tag: "PI-1003", name: "Furnace Draft", value: "Oscillation", note: "진폭 증가 추세" },
                                    ],
                                    warning: [
                                      { tag: "TI-2005", name: "HVGO Draw Temp", value: "Oscillation", note: "미세 진동 감지" },
                                      { tag: "FI-2002", name: "LVGO Product Flow", value: "Hunting", note: "제어 헌팅 발생" },
                                      { tag: "LI-3001", name: "HP Sep Level", value: "Peak", note: "간헐적 스파이크" },
                                      { tag: "PI-9002", name: "MP Steam Header", value: "Hunting", note: "압력 헌팅" },
                                    ],
                                    normal: [],
                                  }
                                },
                                {
                                  id: "drift", borderColor: "border-l-purple-400",
                                  icon: <TrendingUp className="h-3.5 w-3.5 text-purple-600" />,
                                  iconBg: "bg-purple-50",
                                  title: "DR 데이터 대비 Drift 감지",
                                  desc: "RTDB vs DR 수치 편차 점진적 확대 탐지",
                                  badges: [
                                    { label: `Drift 확대 ${anomalyData.drift.driftExpand}`, cls: "bg-red-100 text-red-700 hover:bg-red-100" },
                                    { label: `관찰 필요 ${anomalyData.drift.watchNeeded}`, cls: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
                                  ],
                                  footer: `모니터링 항목: ${anomalyData.drift.monitorItems}건`,
                                  tags: {
                                    danger: [
                                      { tag: "FI-1501", name: "Side Draw Flow", value: "Drift +4.2%", note: "DR 대비 편차 지속 확대, 교정 필요" },
                                      { tag: "TI-2003", name: "VDU Bottom Temp", value: "Drift +2.8\u00b0C", note: "주간 편차 누적" },
                                    ],
                                    warning: [
                                      { tag: "PI-2001", name: "VDU Column Vacuum", value: "Drift -1.5 mmHg", note: "관찰 중" },
                                      { tag: "FI-3005", name: "Quench Gas Flow 2nd", value: "Drift +1.8%", note: "소폭 증가 추세" },
                                    ],
                                    normal: [
                                      { tag: "TI-1005", name: "Furnace Outlet Temp", value: "Drift <0.5%", note: "정상 범위" },
                                      { tag: "FI-1001", name: "Feed Flow Rate", value: "Drift <0.3%", note: "안정적" },
                                      { tag: "PI-1001", name: "Column Top Press", value: "Drift <0.2%", note: "정상" },
                                    ],
                                  }
                                },
                              ]

                              return (
                                <>
                                  <div className="grid grid-cols-3 gap-3">
                                    {anomCards.map(card => {
                                      const isExpanded = expandedAnomalyCard === card.id
                                      return (
                                        <div
                                          key={card.id}
                                          className={cn(
                                            "border-l-4 rounded-lg border p-3 bg-card transition-all cursor-pointer",
                                            card.borderColor,
                                            isExpanded ? "ring-2 ring-primary/20 bg-muted/20" : "hover:bg-muted/30"
                                          )}
                                          onClick={() => setExpandedAnomalyCard(isExpanded ? null : card.id)}
                                        >
                                          <div className="flex items-center gap-2 mb-2">
                                            <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", card.iconBg)}>
                                              {card.icon}
                                            </div>
                                            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground ml-auto transition-transform", isExpanded && "rotate-180")} />
                                          </div>
                                          <h4 className="text-xs font-semibold mb-1">{card.title}</h4>
                                          <p className="text-[10px] text-muted-foreground mb-2">{card.desc}</p>
                                          <div className="flex flex-wrap gap-1.5 mb-2">
                                            {card.badges.map((b, bi) => (
                                              <Badge key={bi} className={cn("text-[9px] h-4", b.cls)}>{b.label}</Badge>
                                            ))}
                                          </div>
                                          {"subInfo" in card && card.subInfo}
                                          {card.footer && <p className="text-[10px] text-muted-foreground">{card.footer}</p>}
                                        </div>
                                      )
                                    })}
                                  </div>

                                  {/* Expanded tag list */}
                                  {expandedAnomalyCard && (() => {
                                    const card = anomCards.find(c => c.id === expandedAnomalyCard)
                                    if (!card) return null
                                    const sections: { level: string; color: string; dotColor: string; items: typeof card.tags.danger }[] = [
                                      ...(card.tags.danger.length > 0 ? [{ level: "Danger", color: "text-red-700 bg-red-50", dotColor: "bg-red-500", items: card.tags.danger }] : []),
                                      ...(card.tags.warning.length > 0 ? [{ level: "Warning", color: "text-amber-700 bg-amber-50", dotColor: "bg-amber-400", items: card.tags.warning }] : []),
                                      ...(card.tags.normal.length > 0 ? [{ level: "Normal", color: "text-emerald-700 bg-emerald-50", dotColor: "bg-emerald-500", items: card.tags.normal }] : []),
                                    ]
                                    return (
                                      <div className="border rounded-lg p-3 bg-muted/10 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                        <div className="flex items-center gap-2">
                                          <h4 className="text-xs font-semibold">{card.title} - 상세 태그 목록</h4>
                                          <Badge variant="secondary" className="text-[9px] h-4">
                                            {card.tags.danger.length + card.tags.warning.length + card.tags.normal.length}건
                                          </Badge>
                                        </div>
                                        {sections.map(section => (
                                          <div key={section.level}>
                                            <div className="flex items-center gap-2 mb-1.5">
                                              <span className={cn("h-2 w-2 rounded-full", section.dotColor)} />
                                              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", section.color)}>{section.level}</span>
                                              <span className="text-[10px] text-muted-foreground">{section.items.length}건</span>
                                            </div>
                                            <div className="space-y-1 ml-4">
                                              {section.items.map(tag => (
                                                <div key={tag.tag} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/40 text-xs">
                                                  <span className="font-mono text-muted-foreground w-16 shrink-0">{tag.tag}</span>
                                                  <span className="font-medium w-40 shrink-0 truncate">{tag.name}</span>
                                                  <span className="font-mono text-muted-foreground shrink-0">{tag.value}</span>
                                                  <span className="text-[10px] text-muted-foreground truncate ml-auto">{tag.note}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )
                                  })()}

                                  {/* Bottom summary */}
                                  <div className="flex items-center justify-between pt-2 border-t">
                                    <div className="flex items-center gap-4 text-xs">
                                      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Danger {anomTotals.danger}</span>
                                      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />Warning {anomTotals.warning}</span>
                                      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Normal {anomTotals.normal}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">마지막 분석: 2025-02-02 07:00</span>
                                  </div>
                                </>
                              )
                            })()}
                          </CardContent>
                        </Card>
                      </>
                    )
                  })()}

                  {/* 기존 Notice 타입 (이상징후/DCS/Daily Monitoring/장기모니터링/Weekly 제외): 아이템 리스트 */}
                  {selectedAlert.data?.items && !["anomaly", "daily-monitoring", "weekly-monitoring", "dcs-modification", "monthly-report-review", "contingency-plan-review", "long-term"].includes(selectedAlert.subType) && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">상세 항목</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedAlert.data.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <span className="text-sm font-medium">{item.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground">{item.value}</span>
                                <Badge variant={item.status === "warning" ? "destructive" : "secondary"}>
                                  {item.status === "warning" ? "주의" : "정상"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 문서 리뷰 요청 상세 (월간 리포트, Contingency Plan) */}
                  {["monthly-report-review", "contingency-plan-review"].includes(selectedAlert.subType) && selectedAlert.documentReview && (() => {
                    const doc = selectedAlert.documentReview
                    const isContingency = doc.docType === "contingency-plan"
                    return (
                      <>
                        {/* 문서 정보 헤더 */}
                        <Card className={isContingency ? "border-amber-300/50 bg-amber-50/30" : "border-primary/30 bg-primary/5"}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {isContingency ? <ShieldCheck className="h-5 w-5 text-amber-600" /> : <BookOpen className="h-5 w-5 text-primary" />}
                                  <h3 className="font-semibold text-sm">{doc.docTitle}</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground">현재 버전:</span>
                                    <Badge variant="outline" className="text-xs h-5">{doc.docVersion}</Badge>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground">최신 버전:</span>
                                    <Badge variant={doc.docVersion === doc.latestVersion ? "secondary" : "destructive"} className="text-xs h-5">{doc.latestVersion}</Badge>
                                  </div>
                                  {doc.period && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-muted-foreground">대상 기간:</span>
                                      <span>{doc.period}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground">리뷰 주기:</span>
                                    <span>{doc.frequency}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 col-span-2">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">리뷰 마감:</span>
                                    <span className="font-medium text-destructive">{doc.deadline}</span>
                                  </div>
                                </div>
                              </div>
                              {doc.docVersion !== doc.latestVersion && (
                                <Badge variant="destructive" className="flex items-center gap-1 shrink-0">
                                  <RotateCcw className="h-3 w-3" />
                                  버전 불일치
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* 문서 섹션별 내용 */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              문서 내용
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-1">
                            {doc.sections.map((section, i) => {
                              const isExpanded = expandedReviewSections.includes(section.title)
                              return (
                                <div key={i} className={cn("border rounded-lg overflow-hidden", section.hasChange && "border-amber-300")}>
                                  <button
                                    className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/50"
                                    onClick={() => setExpandedReviewSections(prev => 
                                      isExpanded ? prev.filter(t => t !== section.title) : [...prev, section.title]
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                                      <span className="text-sm font-medium">{section.title}</span>
                                      {section.hasChange && (
                                        <Badge variant="outline" className="text-xs h-5 border-amber-400 text-amber-700 bg-amber-50">변경사항</Badge>
                                      )}
                                    </div>
                                  </button>
                                  {isExpanded && (
                                    <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed border-t bg-muted/20 pt-2.5">
                                      {section.content}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </CardContent>
                        </Card>

                        {/* 리뷰 이력 */}
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <History className="h-4 w-4" />
                              리뷰 이력
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {doc.reviewHistory.map((hist, i) => (
                                <div key={i} className="flex gap-3 text-sm">
                                  <div className="flex flex-col items-center">
                                    <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", i === 0 ? "bg-primary" : "bg-muted-foreground/30")} />
                                    {i < doc.reviewHistory.length - 1 && <div className="w-px h-full bg-border mt-1" />}
                                  </div>
                                  <div className="pb-3">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span>{hist.date}</span>
                                      <span className="font-medium text-foreground">{hist.reviewer}</span>
                                      <Badge variant="outline" className="text-xs h-4">{hist.version}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{hist.comment}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* 리뷰 액션 */}
                        <Card className="border-primary/30">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Pencil className="h-4 w-4 text-primary" />
                              리뷰 의견 및 승인
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {isContingency
                                ? "문서 내용을 검토하고 최신 운전 조건이 반영되었는지 확인 후 승인해주세요."
                                : "리포트를 검토하고 의견을 작성해주세요. 승인 시 Knowledge Asset에 최종 저장됩니다."}
                            </p>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {docReviewConfirmed ? (
                              <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-1">
                                <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4" />
                                  리뷰가 완료되었습니다
                                </p>
                                <p className="text-xs text-green-700">
                                  {isContingency
                                    ? `${doc.docTitle} ${doc.latestVersion} 버전이 최신으로 확인되었습니다. 다음 리뷰 예정: 6개월 후`
                                    : `리뷰 내용과 함께 Knowledge Asset에 저��되었습니다. (${doc.docTitle})`}
                                </p>
                              </div>
                            ) : (
                              <>
                                {isContingency && (
                                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                    <div className="text-xs text-amber-800">
                                      <p className="font-medium">Living Document 최신 버전 확인 필수</p>
                                      <p className="mt-0.5">이 문서는 Living Document로 관리됩니다. 변경사항이 표시된 섹션을 반드시 확인하고, 현재 운전 조건과 일치하는지 검증해주세요.</p>
                                    </div>
                                  </div>
                                )}
                                <Textarea
                                  value={docReviewComment}
                                  onChange={(e) => setDocReviewComment(e.target.value)}
                                  placeholder={isContingency
                                    ? "리뷰 의견을 작성하세요... (예: 운전 조건 변경 반영 확인, 추가 수정 필요사항 등)"
                                    : "리포트에 대한 리뷰 의견을 작성하세요... (예: EII 미달 원인 분석 보완 필요 등)"}
                                  className="min-h-20"
                                />
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-muted-foreground">
                                    리뷰 마감: <span className="font-medium text-destructive">{doc.deadline}</span>
                                  </p>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={!docReviewComment.trim()}
                                      onClick={() => {
                                        alert("수정 요청이 전달되었습니다. 문서 담당자에게 통보됩니다.")
                                      }}
                                    >
                                      수정 요청
                                    </Button>
                                    <Button
                                      size="sm"
                                      disabled={!docReviewComment.trim()}
                                      onClick={() => {
                                        setDocReviewConfirmed(true)
                                        setAlerts(alerts.map(a => a.id === selectedAlert.id ? { ...a, status: "resolved" } : a))
                                      }}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1.5" />
                                      {isContingency ? "최신 확인 및 승인" : "리뷰 완료 및 승인"}
                                    </Button>
                                  </div>
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      </>
                    )
                  })()}

                  {/* 이상징후/장기모니��링/효율성 - 엔지니어 의견 섹션 (daily-monitoring은 별도 처리) */}
                  {selectedAlert.type === "notice" && ["anomaly", "long-term", "efficiency"].includes(selectedAlert.subType) && (
                    <Card className="border-primary/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          엔지니어 의견
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">판정 선택</label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEngineerOpinion("normal")}
                              className={cn(
                                "flex-1 p-3 rounded-lg border-2 transition-all text-center",
                                engineerOpinion === "normal" 
                                  ? "border-green-500 bg-green-50 text-green-700" 
                                  : "border-border hover:border-green-300 hover:bg-green-50/50"
                              )}
                            >
                              <CheckCircle className={cn("h-5 w-5 mx-auto mb-1", engineerOpinion === "normal" ? "text-green-500" : "text-muted-foreground")} />
                              <span className="text-sm font-medium">정상</span>
                              <p className="text-xs text-muted-foreground mt-1">특이사항 없음</p>
                            </button>
                            <button
                              onClick={() => setEngineerOpinion("caution")}
                              className={cn(
                                "flex-1 p-3 rounded-lg border-2 transition-all text-center",
                                engineerOpinion === "caution" 
                                  ? "border-amber-500 bg-amber-50 text-amber-700" 
                                  : "border-border hover:border-amber-300 hover:bg-amber-50/50"
                              )}
                            >
                              <AlertCircle className={cn("h-5 w-5 mx-auto mb-1", engineerOpinion === "caution" ? "text-amber-500" : "text-muted-foreground")} />
                              <span className="text-sm font-medium">주의</span>
                              <p className="text-xs text-muted-foreground mt-1">지속 관찰 필요</p>
                            </button>
                            <button
                              onClick={() => setEngineerOpinion("ticket")}
                              className={cn(
                                "flex-1 p-3 rounded-lg border-2 transition-all text-center",
                                engineerOpinion === "ticket" 
                                  ? "border-red-500 bg-red-50 text-red-700" 
                                  : "border-border hover:border-red-300 hover:bg-red-50/50"
                              )}
                            >
                              <FileText className={cn("h-5 w-5 mx-auto mb-1", engineerOpinion === "ticket" ? "text-red-500" : "text-muted-foreground")} />
                              <span className="text-sm font-medium">이벤트화</span>
                              <p className="text-xs text-muted-foreground mt-1">즉시 조치 필요</p>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">추가 로그 (선택사항)</label>
                          <Textarea
                            value={engineerLog}
                            onChange={(e) => setEngineerLog(e.target.value)}
                            placeholder="검토 의견, 특이사항, 후속 조치 계획 등을 기록하세요..."
                            className="min-h-24"
                          />
                        </div>

                        {engineerOpinion && (
                          <div className="flex justify-end">
                            <Button 
                              onClick={() => handleEngineerOpinionSubmit(selectedAlert.id)}
                              className={cn(
                                engineerOpinion === "normal" && "bg-green-600 hover:bg-green-700",
                                engineerOpinion === "caution" && "bg-amber-600 hover:bg-amber-700",
                                engineerOpinion === "ticket" && "bg-red-600 hover:bg-red-700"
                              )}
                            >
                              {engineerOpinion === "ticket" ? "이벤트 생성하기" : "의견 저장"}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* 이벤트 업데이트 상세 */}
                  {selectedAlert.subType === "communication" && (
                    <Card className="border-blue-200 bg-blue-50/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                          업데이트 내용
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 bg-white rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium">박영</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">박영희</p>
                              <p className="text-xs text-muted-foreground">Process Engineering팀 | {selectedAlert.timestamp}</p>
                            </div>
                          </div>
                          <div className="ml-10 mt-2 text-sm text-foreground">
                            <p>촉매 성능 분석 결과를 공유드립니다.</p>
                            <p className="mt-2">현재 WABT 기준 약 7도 상승이 확인되었으며, 6개월 내 촉매 교체가 필요할 것으로 판단됩니다. 상세 데이터는 첨부된 리포트를 참조해주세요.</p>
                            <div className="mt-3 flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                Catalyst_Analysis_Report.pdf
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {selectedAlert.linkedTicketId && (
                          <Button 
                            variant="outline" 
                            className="w-full bg-transparent"
                            onClick={() => router.push(`/tickets/${selectedAlert.linkedTicketId}`)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            이벤트 상세 페이지로 이동
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* 커스텀 알람: 기본 알람 정보 + 트렌드 + 과거 이력 (Alert 컴포넌트 차용) */}
                  {selectedAlert.subType === "custom-alarm" && (
                    <>
                      {/* 알람 기본 정보 */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            알람 기본 정보
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Tag ID</span>
                                <p className="font-medium text-sm">{selectedAlert.data?.tagId || "-"}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">알람 유형</span>
                                <Badge variant="outline" className="text-xs">커스텀 (개인 설정)</Badge>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground">Trigger 조건</span>
                              <p className="font-mono text-xs bg-muted/50 px-2 py-1 rounded">
                                {selectedAlert.data?.tagId} {'>'} {selectedAlert.data?.limit}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-2 bg-red-50 border border-red-100 rounded-lg text-center">
                                <span className="text-xs text-muted-foreground">현재값</span>
                                <p className="text-lg font-bold text-red-600">{selectedAlert.data?.value}</p>
                              </div>
                              <div className="p-2 bg-muted/30 rounded-lg text-center">
                                <span className="text-xs text-muted-foreground">설정값</span>
                                <p className="text-lg font-bold">{selectedAlert.data?.limit}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* 관련 트렌드 (Alert 컴포넌트 차용) */}
                      {selectedAlert.data?.trend && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                관련 트렌드 - {selectedAlert.data.tagId}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs"
                                onClick={() => setShowFullTrendDialog(true)}
                              >
                                <LayoutGrid className="h-3.5 w-3.5" />
                                전체보기
                              </Button>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-48 flex items-end gap-2 relative bg-muted/30 rounded-lg p-4">
                              {selectedAlert.data.trend.map((value, i) => {
                                const max = Math.max(...selectedAlert.data!.trend!, selectedAlert.data!.limit || 0) * 1.05
                                const min = Math.min(...selectedAlert.data!.trend!, selectedAlert.data!.limit || Infinity) * 0.95
                                const range = max - min || 1
                                const height = ((value - min) / range) * 100
                                const isOverLimit = selectedAlert.data!.limit && value > selectedAlert.data!.limit
                                const isFirstViolation = isOverLimit && (i === 0 || !selectedAlert.data!.trend![i-1] || selectedAlert.data!.trend![i-1] <= selectedAlert.data!.limit!)
                                return (
                                  <div key={i} className="flex-1 flex flex-col items-center gap-1 relative">
                                    <span className="text-xs text-muted-foreground mb-1">{value}</span>
                                    <div 
                                      className={cn("w-full rounded-t transition-all", isOverLimit ? "bg-red-500" : "bg-primary")}
                                      style={{ height: `${Math.max(height, 5)}%` }}
                                    />
                                    {isFirstViolation && (
                                      <div className="absolute top-0 bottom-0 left-1/2 border-l-2 border-dashed border-red-600 z-10">
                                        <span className="absolute -top-5 -left-8 text-xs text-red-600 font-medium whitespace-nowrap">위반 시점</span>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                              {selectedAlert.data.limit && (
                                <div className="absolute left-4 right-4 flex items-center gap-2" style={{ 
                                  bottom: `${Math.min(95, Math.max(5, ((selectedAlert.data.limit - Math.min(...selectedAlert.data.trend) * 0.95) / (Math.max(...selectedAlert.data.trend, selectedAlert.data.limit) * 1.05 - Math.min(...selectedAlert.data.trend) * 0.95)) * 100))}%` 
                                }}>
                                  <div className="flex-1 border-t-2 border-dashed border-red-400" />
                                  <span className="text-xs text-red-500 bg-background px-2 py-0.5 rounded">설정값: {selectedAlert.data.limit}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-between mt-4 p-3 bg-muted/30 rounded-lg">
                              <div>
                                <span className="text-sm text-muted-foreground">현재값</span>
                                <p className="text-lg font-bold">{selectedAlert.data.value}</p>
                              </div>
                              <div className="text-center">
                                <span className="text-sm text-muted-foreground">편차</span>
                                <p className={cn("text-lg font-bold", selectedAlert.data.value > (selectedAlert.data.limit || 0) ? "text-red-500" : "text-green-500")}>
                                  {selectedAlert.data.limit ? `${selectedAlert.data.value > selectedAlert.data.limit ? "+" : ""}${(selectedAlert.data.value - selectedAlert.data.limit).toFixed(1)}` : "-"}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-sm text-muted-foreground">설정값</span>
                                <p className="text-lg font-bold text-muted-foreground">{selectedAlert.data.limit}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* 과거 이력 (Alert 컴포넌트 차용) */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            과거 알람 발생 이력 ({selectedAlert.data?.tagId})
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">이 커스텀 알람 조건에서 과거 발생 이력</p>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="border rounded-lg overflow-hidden">
                              <div className="flex items-center justify-between p-3 bg-muted/30">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">커스텀 알람</Badge>
                                  <span className="text-sm font-medium">2025-01-20 11:15</span>
                                </div>
                                <Badge variant="secondary" className="text-xs">확인됨</Badge>
                              </div>
                              <div className="p-3 space-y-2">
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-muted-foreground">발생값:</span>
                                  <span className="font-mono">455 m3/hr</span>
                                  <span className="text-muted-foreground">지속시간:</span>
                                  <span>2시간 30분</span>
                                </div>
                                <div className="p-2 bg-green-50 border border-green-100 rounded text-sm">
                                  <span className="font-medium text-green-700">조치:</span>
                                  <span className="text-green-600 ml-2">모니터링 후 자연 정상화, Feed 공급 조정 확인</span>
                                </div>
                              </div>
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                              <div className="flex items-center justify-between p-3 bg-muted/30">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">커스텀 알람</Badge>
                                  <span className="text-sm font-medium">2024-12-15 08:40</span>
                                </div>
                                <Badge variant="secondary" className="text-xs">해결됨</Badge>
                              </div>
                              <div className="p-3 space-y-2">
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-muted-foreground">발생값:</span>
                                  <span className="font-mono">465 m3/hr</span>
                                  <span className="text-muted-foreground">지속시간:</span>
                                  <span>4시간</span>
                                </div>
                                <div className="p-2 bg-green-50 border border-green-100 rounded text-sm">
                                  <span className="font-medium text-green-700">조치:</span>
                                  <span className="text-green-600 ml-2">Feed 변경(Medium → Light)에 따른 일시적 증가, 이벤트 발행하여 추적</span>
                                </div>
                                <Button variant="link" className="text-xs p-0 h-auto" onClick={() => router.push("/tickets/1")}>
                                  관련 이벤트 TKT-2024-1205 보기
                                </Button>
                              </div>
                            </div>
                            <div className="text-center pt-2">
                              <Button variant="link" className="text-xs">전체 이력 보기 (총 5건)</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* 외부 데이터 업데이트 */}
                  {selectedAlert.subType === "external-data" && (
                    <Card className="border-amber-200 bg-amber-50">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2 mb-4">
                          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                          <p className="text-sm text-amber-800">외부 데이터 검토 후 특이사항을 기록해야 합니다.</p>
                        </div>
                        <Textarea 
                          placeholder="검토 결과 및 특이사항을 입력하세요..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="bg-white min-h-24"
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* 자동 계산 */}
                  {selectedAlert.subType === "auto-calc" && (
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground mb-3">데이터 정합성 검토 의견을 남겨주세요:</p>
                        <Textarea 
                          placeholder="정합성 검토 의견..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="min-h-24"
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Event: Mode Switch */}
                  {selectedAlert.subType === "mode-switch" && (
                    <Card className="border-primary/30 bg-primary/5">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <span className="font-medium">Mode Switch 가이드 발행</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          예정된 Mode Switch에 대한 운전 가이드를 작성하고 관련 팀에 배포합니다.
                        </p>
                        <Button onClick={() => window.location.href = "/new-ticket"}>
                          <FileText className="h-4 w-4 mr-2" />
                          가이드 발행하기
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Event: 라이센서 리뷰 */}
                  {selectedAlert.subType === "licensor-review" && (
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="h-5 w-5 text-primary" />
                          <span className="font-medium">라이센서 분기 리뷰 준비</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Performance 데이터 준비 및 질의사항을 정리하세��.
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Performance 리포트
                          </Button>
                          <Button variant="outline">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            질의사항 준비
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>

              {/* 액션 버튼 영역 */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex justify-end gap-2">
                  {/* Alert 타입: New Alert인 ��우 - 인지 버튼 (Bold 강조) (health-monitoring 제외) */}
                  {selectedAlert.type === "alert" && selectedAlert.alertState === "new" && selectedAlert.subType !== "health-monitoring" && (
                    <Button 
                      onClick={() => handleAcknowledge(selectedAlert.id)}
                      className="font-bold"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      인지 (Standing Alert로 전환)
                    </Button>
                  )}

                  {/* 장기건전성 Health Alert - 조치 입력 + 인지 */}
                  {selectedAlert.subType === "health-monitoring" && selectedAlert.alertState === "new" && (
                    <>
                      <Button 
                        onClick={() => handleAcknowledge(selectedAlert.id)}
                        variant="outline"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        인지 (Standing Alert)
                      </Button>
                      <Button 
                        onClick={() => setShowHealthActionDialog(true)}
                        className="font-bold bg-red-600 hover:bg-red-700"
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        조치 입력
                      </Button>
                    </>
                  )}
                  {selectedAlert.subType === "health-monitoring" && selectedAlert.alertState === "standing" && (
                    <>
                      <Button 
                        onClick={() => setShowHealthActionDialog(true)}
                        className="font-bold"
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        조치 입력
                      </Button>
                      <Button onClick={() => handleCreateTicket(selectedAlert)}>
                        <FileText className="h-4 w-4 mr-2" />
                        이벤트 발행
                      </Button>
                    </>
                  )}

                  {/* Alert 타입: Standing Alert인 경우 - 이벤트 발행 / Shelved 처리 */}
                  {selectedAlert.type === "alert" && selectedAlert.alertState === "standing" && selectedAlert.subType !== "health-monitoring" && (
                    <>
                      <Button onClick={() => handleCreateTicket(selectedAlert)}>
                        <FileText className="h-4 w-4 mr-2" />
                        이벤트 발행
                      </Button>
                      <Button variant="outline" onClick={() => setShowShelvedDialog(true)}>
                        <Clock className="h-4 w-4 mr-2" />
                        Shelved Alert 처리
                      </Button>
                    </>
                  )}

                  {/* Alert 타입: Shelved Alert인 경우 */}
                  {selectedAlert.type === "alert" && selectedAlert.alertState === "shelved" && (
                    <span className="text-sm text-muted-foreground">이 알람은 Shelved 상태입니다. ({selectedAlert.shelvedUntil}까지)</span>
                  )}

                  {/* Notice 타입 (이상징후/장기/효율성): 엔지니어 의견으로 대체됨 - 위 섹션에서 처리 */}
                  {selectedAlert.type === "notice" && ["anomaly", "long-term", "efficiency"].includes(selectedAlert.subType) && (
                    <span className="text-sm text-muted-foreground">위의 엔지니어 의견 섹션에서 판정을 선택하세요</span>
                  )}

                  {/* Notice: 커뮤니케이션 업데이트 */}
                  {selectedAlert.subType === "communication" && selectedAlert.linkedTicketId && (
                    <Button onClick={() => router.push(`/tickets/${selectedAlert.linkedTicketId}`)}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      이벤트 확인하기
                    </Button>
                  )}

                  {/* Notice: 커스텀 알람 */}
                  {selectedAlert.subType === "custom-alarm" && (
                    <>
                      <Button variant="outline" onClick={() => handleAcknowledge(selectedAlert.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        확인
                      </Button>
                      <Button onClick={() => handleCreateTicket(selectedAlert)}>
                        <FileText className="h-4 w-4 mr-2" />
                        이벤트 형성
                      </Button>
                    </>
                  )}

                  {/* Notice: Daily Monitoring - 2가지 버튼 (특이사항 없음, 주의) */}
                  {selectedAlert.subType === "daily-monitoring" && (
                    <>
                      <Button 
                        variant="outline"
                        className="bg-transparent"
                        onClick={() => {
                          setNoIssueAdditionalNote("")
                          setNoIssueCategories(["normal"])
                          setShowNoIssueDialog(true)
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        특이사항 없음
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-amber-300 text-amber-700 hover:bg-amber-50 bg-transparent"
                        onClick={() => {
                          setCautionCategory("")
                          setCautionHashtags([])
                          setCautionHashtagInput("")
                          setCautionAdditionalLog("")
                          setShowCautionDialog(true)
                        }}
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        주의 (운영 로그 추가)
                      </Button>
                    </>
                  )}

                  {/* Notice: Weekly Monitoring - 2가지 버튼 (특이사항 없음, 주의) */}
                  {selectedAlert.subType === "weekly-monitoring" && (
                    <>
                      <Button 
                        variant="outline"
                        className="bg-transparent"
                        onClick={() => {
                          setWeeklyMonitoringAction("normal")
                          alert("특이사항 없음으로 처리되었습니다.")
                          setAlerts(alerts.map(a => a.id === selectedAlert.id ? { ...a, status: "resolved" } : a))
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        특이사항 없음
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-amber-300 text-amber-700 hover:bg-amber-50 bg-transparent"
                        onClick={() => {
                          setWeeklyMonitoringAction("caution")
                          alert("주의 판정으로 저장되었습니다. 운영 로그에 기록됩니다.")
                          setAlerts(alerts.map(a => a.id === selectedAlert.id ? { ...a, status: "acknowledged" } : a))
                        }}
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        주의 (운영 로그 추가)
                      </Button>
                    </>
                  )}

                  {/* Notice: DCS 수정 요청 - 반영완료/수정요청 */}
                  {selectedAlert.subType === "dcs-modification" && (
                    <>
                      <Button 
                        variant="outline"
                        className="bg-transparent"
                        onClick={() => {
                          alert("DCS 수정 사항이 반영 완료로 처리되었습니다.")
                          setAlerts(alerts.map(a => a.id === selectedAlert.id ? { ...a, status: "resolved" } : a))
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        반영완료
                      </Button>
                      <Button 
                        onClick={() => setShowCsrDialog(true)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        수정요청
                      </Button>
                    </>
                  )}

                  {/* Notice: 외부 데이터 / 자동 계산 */}
                  {["external-data", "auto-calc"].includes(selectedAlert.subType) && (
                    <Button onClick={() => handleReviewAction(selectedAlert.id, "normal")} disabled={!reviewComment.trim()}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      검토 완료
                    </Button>
                  )}

                  {/* Event 타입 */}
                  {selectedAlert.type === "event" && !["mode-switch", "licensor-review"].includes(selectedAlert.subType) && (
                    <Button variant="outline" onClick={() => handleAcknowledge(selectedAlert.id)}>
                      확인
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* 팀장 전용: 운영 KPI 대시보드 (알림 미선택 시) */
            isTeamLead ? (
              <div className="flex-1 overflow-auto p-6 bg-background">
                <Tabs defaultValue="kpi" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      팀 운영 대시보드
                    </h2>
                    <TabsList>
                      <TabsTrigger value="kpi">운영 KPI</TabsTrigger>
                      <TabsTrigger value="escalation">에스컬레이션</TabsTrigger>
                      <TabsTrigger value="alerts-summary">Alert 요약</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="kpi" className="space-y-4 mt-4">
                    {/* 팀 전체 요약 KPI */}
                    <div className="grid grid-cols-5 gap-3">
                      <Card className="bg-primary text-primary-foreground">
                        <CardContent className="pt-4 pb-4">
                          <p className="text-xs text-primary-foreground/80">담당 공정 수</p>
                          <p className="text-2xl font-bold mt-1">{visibleProcesses.length}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 pb-4">
                          <p className="text-xs text-muted-foreground">팀 Daily 모니터링</p>
                          <p className="text-2xl font-bold mt-1">{TEAM_KPI_DATA.teamSummary.avgDailyMonitoring}%</p>
                          <Progress value={TEAM_KPI_DATA.teamSummary.avgDailyMonitoring} className="h-1.5 mt-2" />
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 pb-4">
                          <p className="text-xs text-muted-foreground">Live Docs 준수율</p>
                          <p className="text-2xl font-bold mt-1">{TEAM_KPI_DATA.teamSummary.liveDocsComplianceRate}%</p>
                          <Progress value={TEAM_KPI_DATA.teamSummary.liveDocsComplianceRate} className="h-1.5 mt-2" />
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 pb-4">
                          <p className="text-xs text-muted-foreground">Alert 처리</p>
                          <p className="text-2xl font-bold mt-1">
                            <span className="text-green-600">{TEAM_KPI_DATA.teamSummary.totalAlertsHandled}</span>
                            <span className="text-muted-foreground text-sm"> / </span>
                            <span className="text-amber-600">{TEAM_KPI_DATA.teamSummary.totalAlertsPending}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">완료 / 대기</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 pb-4">
                          <p className="text-xs text-muted-foreground">평균 응답시간</p>
                          <p className="text-2xl font-bold mt-1">{TEAM_KPI_DATA.teamSummary.avgResponseTime}</p>
                          <p className="text-xs text-muted-foreground mt-1">목표: 2h 이내</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* 개별 엔지니어 KPI 테이블 */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          엔지니어별 운영 현황
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/40">
                              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">엔지니어</th>
                              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">담당 공정</th>
                              <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground">Daily 모니터링</th>
                              <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground">Weekly 모니터링</th>
                              <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground">Live Docs</th>
                              <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground">Alert 처리</th>
                              <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground">활성 티켓</th>
                              <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground">응답시간</th>
                            </tr>
                          </thead>
                          <tbody>
                            {TEAM_KPI_DATA.engineers.map((eng) => (
                              <tr key={eng.id} className="border-b last:border-b-0 hover:bg-muted/30">
                                <td className="px-3 py-2.5 font-medium">{eng.name}</td>
                                <td className="px-3 py-2.5 text-xs text-muted-foreground">{eng.processes.join(", ")}</td>
                                <td className="text-center px-3 py-2.5">
                                  <div className="flex items-center justify-center gap-2">
                                    <Progress value={eng.dailyMonitoring} className="h-1.5 w-16" />
                                    <span className={cn("text-xs font-medium", eng.dailyMonitoring >= 90 ? "text-green-600" : eng.dailyMonitoring >= 80 ? "text-amber-600" : "text-red-600")}>{eng.dailyMonitoring}%</span>
                                  </div>
                                </td>
                                <td className="text-center px-3 py-2.5">
                                  <div className="flex items-center justify-center gap-2">
                                    <Progress value={eng.weeklyMonitoring} className="h-1.5 w-16" />
                                    <span className={cn("text-xs font-medium", eng.weeklyMonitoring >= 90 ? "text-green-600" : eng.weeklyMonitoring >= 80 ? "text-amber-600" : "text-red-600")}>{eng.weeklyMonitoring}%</span>
                                  </div>
                                </td>
                                <td className="text-center px-3 py-2.5">
                                  {eng.liveDocsUpdated ? (
                                    <Badge className="bg-green-100 text-green-700 border-0">최신</Badge>
                                  ) : (
                                    <Badge variant="destructive" className="text-xs">미갱신</Badge>
                                  )}
                                </td>
                                <td className="text-center px-3 py-2.5">
                                  <span className="text-green-600 font-medium">{eng.alertsHandled}</span>
                                  {eng.alertsPending > 0 && (
                                    <span className="text-amber-600 ml-1">({eng.alertsPending})</span>
                                  )}
                                </td>
                                <td className="text-center px-3 py-2.5">
                                  <Badge variant="outline" className={cn(eng.ticketsActive > 3 ? "border-amber-400 text-amber-700" : "")}>{eng.ticketsActive}</Badge>
                                </td>
                                <td className="text-center px-3 py-2.5 text-xs">{eng.avgResponseTime}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="escalation" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          에스컬레이션 티켓 ({ESCALATED_TICKETS.length})
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">팀장 확인이 필요한 티켓 목록입니다.</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {ESCALATED_TICKETS.map(ticket => (
                          <Link 
                            key={ticket.id}
                            href={`/tickets/${ticket.id.replace("TKT-", "")}`}
                            className="block p-4 border rounded-lg hover:bg-muted/30 transition-colors border-l-4 border-l-orange-500"
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge className={cn("text-xs", ticket.priority === "P1" ? "bg-red-500 text-white" : "bg-amber-500 text-white")}>{ticket.priority}</Badge>
                                  <Badge variant="outline" className="text-xs">{ticket.process}</Badge>
                                  <span className="text-xs text-muted-foreground">{ticket.id}</span>
                                </div>
                                <p className="font-medium">{ticket.title}</p>
                                <p className="text-sm text-orange-600">{ticket.escalationReason}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                  <span>담당: {ticket.engineer}</span>
                                  <span>상태: {ticket.status}</span>
                                  <span>마감: {ticket.dueDate}</span>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                            </div>
                          </Link>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="alerts-summary" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            High 등급 Alert 요약
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {filteredAlerts.map(alert => (
                              <button
                                key={alert.id}
                                onClick={() => handleSelectAlert(alert)}
                                className="w-full text-left p-3 border rounded-lg hover:bg-muted/30 transition-colors border-l-4 border-l-red-500"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge className="text-xs bg-red-500 text-white">상</Badge>
                                  <span className="text-xs text-muted-foreground">{alert.unit}</span>
                                </div>
                                <p className="text-sm font-medium mt-1">{alert.title}</p>
                                <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                              </button>
                            ))}
                            {filteredAlerts.length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-4">High 등급 Alert가 없습니다.</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            공정별 Alert 현황
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {["HCR", "VGOFCC", "RFCC", "VBU", "CDU"].map(process => {
                              const count = alerts.filter(a => a.type === "alert" && a.unit === process).length
                              const highCount = alerts.filter(a => a.type === "alert" && a.unit === process && a.alertGrade === "high").length
                              return (
                                <div key={process} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                  <span className="text-sm font-medium">{process}</span>
                                  <div className="flex items-center gap-2">
                                    {highCount > 0 && <Badge variant="destructive" className="text-xs">상 {highCount}</Badge>}
                                    <Badge variant="outline" className="text-xs">전체 {count}</Badge>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>알림을 선택하여 상세 정보를 확인하세요.</p>
                </div>
              </div>
            )
          )}
        </div>

        {/* 장치 정보 및 이력 팝업 */}
        <Dialog open={showEquipmentDialog} onOpenChange={setShowEquipmentDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                장치 정보 및 정비이력
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-xs text-muted-foreground">Unit / 위치</span>
                  <p className="font-medium text-sm mt-0.5">{selectedAlert?.unit || "-"} / Reactor Section</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-xs text-muted-foreground">관련 장치</span>
                  <p className="font-medium text-sm mt-0.5">R-2001 (HCR Reactor)</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-xs text-muted-foreground">장치 유형</span>
                  <p className="font-medium text-sm mt-0.5">Fixed Bed Reactor</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <span className="text-xs text-muted-foreground">설치 / 최종 T/A</span>
                  <p className="font-medium text-sm mt-0.5">2015 / 2024-06</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  정비 / 검사 이력
                </h4>
                <div className="space-y-2">
                  {[
                    { type: "정비", desc: "Thermocouple 교체", date: "2024-11-15", color: "blue" },
                    { type: "검사", desc: "정기 Calibration", date: "2024-12-20", color: "green" },
                    { type: "점검", desc: "T/A 중 내부 검사 - Catalyst 교체", date: "2024-06-15", color: "amber" },
                    { type: "정비", desc: "Quench Line Valve 교체", date: "2024-06-10", color: "blue" },
                    { type: "검사", desc: "두�� 측정 (UT)", date: "2024-01-20", color: "green" },
                  ].map((item, i) => (
                    <div key={i} className={cn("flex items-center justify-between p-2 rounded border",
                      item.color === "blue" ? "bg-blue-50 border-blue-100" : item.color === "green" ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"
                    )}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs px-1.5 py-0",
                          item.color === "blue" ? "bg-blue-100 text-blue-700 border-blue-200" : item.color === "green" ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200"
                        )}>{item.type}</Badge>
                        <span className="text-xs">{item.desc}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.date}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">관련 Contingency Plan</h4>
                <Button variant="outline" size="sm" className="text-xs w-full justify-start">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
                  HCR 비상운전 절차서 (v3.2) - 최종 리뷰: 2025-02-01
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* P&ID 도면 다이얼로그 */}
        <Dialog open={showPidDialog} onOpenChange={setShowPidDialog}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileImage className="h-5 w-5 text-blue-600" />
                관련 P&ID 도면
                {selectedAlert?.data?.tagId && <Badge variant="secondary" className="font-mono text-xs">{selectedAlert.data.tagId}</Badge>}
              </DialogTitle>
            </DialogHeader>
            {(() => {
              const eq = getTagEq(selectedAlert?.data?.tagId)
              return (
                <div className="space-y-4">
                  {eq && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Badge variant="outline" className="text-[10px]">{eq.process}</Badge>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{eq.zone}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{eq.equipment}</span>
                    </div>
                  )}
                  <Card className="overflow-hidden border-2">
                    <div className="bg-[#f8f9fa] relative" style={{ minHeight: 420 }}>
                      <svg width="100%" height="420" viewBox="0 0 800 420" className="w-full">
                        <defs>
                          <pattern id="pid-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect width="800" height="420" fill="url(#pid-grid)" />
                        {/* Title block */}
                        <rect x="560" y="370" width="230" height="45" fill="white" stroke="#374151" strokeWidth="1" />
                        <text x="570" y="388" fontSize="9" fill="#6b7280" fontFamily="monospace">{'DWG: PID-'}{eq?.process || 'HCR'}{'-'}{eq?.zone?.split(' ')[0] || '001'}{'-001'}</text>
                        <text x="570" y="403" fontSize="8" fill="#9ca3af" fontFamily="monospace">REV.5 | 2024-06-15 | APPROVED</text>
                        {/* Equipment - Reactor */}
                        <rect x="300" y="60" width="100" height="200" rx="8" fill="none" stroke="#1e40af" strokeWidth="2" />
                        <text x="350" y="170" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e40af">{eq?.eqId || 'R-2001'}</text>
                        <text x="350" y="185" textAnchor="middle" fontSize="9" fill="#6b7280">{eq?.equipment || 'Reactor'}</text>
                        {[100, 140, 180, 220].map(y => <line key={y} x1="310" y1={y} x2="390" y2={y} stroke="#93c5fd" strokeWidth="0.5" />)}
                        {/* Feed line */}
                        <line x1="100" y1="120" x2="300" y2="120" stroke="#374151" strokeWidth="2" />
                        <polygon points="295,116 305,120 295,124" fill="#374151" />
                        {/* Product line */}
                        <line x1="400" y1="200" x2="550" y2="200" stroke="#374151" strokeWidth="2" />
                        <polygon points="545,196 555,200 545,204" fill="#374151" />
                        {/* Quench line */}
                        <line x1="350" y1="20" x2="350" y2="60" stroke="#374151" strokeWidth="1.5" strokeDasharray="6 3" />
                        <polygon points="346,55 354,55 350,65" fill="#374151" />
                        {/* Heat exchanger */}
                        <rect x="570" y="160" width="80" height="40" rx="4" fill="none" stroke="#7c3aed" strokeWidth="1.5" />
                        <line x1="580" y1="180" x2="640" y2="180" stroke="#7c3aed" strokeWidth="0.5" strokeDasharray="3 2" />
                        <text x="610" y="215" textAnchor="middle" fontSize="9" fill="#6b7280">E-2001</text>
                        {/* Pump */}
                        <circle cx="150" cy="320" r="20" fill="none" stroke="#ea580c" strokeWidth="1.5" />
                        <line x1="140" y1="310" x2="160" y2="330" stroke="#ea580c" strokeWidth="1" />
                        <text x="150" y="355" textAnchor="middle" fontSize="9" fill="#6b7280">P-2001</text>
                        <line x1="150" y1="300" x2="150" y2="120" stroke="#374151" strokeWidth="1.5" />
                        {/* Separator */}
                        <rect x="550" y="280" width="70" height="50" rx="20" fill="none" stroke="#059669" strokeWidth="1.5" />
                        <text x="585" y="310" textAnchor="middle" fontSize="9" fill="#6b7280">D-2001</text>
                        <line x1="585" y1="200" x2="585" y2="280" stroke="#374151" strokeWidth="1.5" />
                        {/* Highlighted alarm tag */}
                        {selectedAlert?.data?.tagId && (
                          <g>
                            <circle cx="250" cy="110" r="18" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" className="animate-pulse" />
                            <text x="250" y="114" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#dc2626" fontFamily="monospace">{selectedAlert.data.tagId}</text>
                            <line x1="268" y1="110" x2="295" y2="120" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 2" />
                          </g>
                        )}
                        {/* Other tag points */}
                        {[
                          { x: 330, y: 85, label: "PI-2001" },
                          { x: 370, y: 145, label: "TI-2003" },
                          { x: 130, y: 120, label: "FI-2001" },
                          { x: 320, y: 35, label: "FI-2010" },
                          { x: 465, y: 195, label: "AI-2001" },
                        ].filter(t => t.label !== selectedAlert?.data?.tagId).map(t => (
                          <g key={t.label}>
                            <circle cx={t.x} cy={t.y} r="14" fill="white" stroke="#6b7280" strokeWidth="1" />
                            <text x={t.x} y={t.y + 3} textAnchor="middle" fontSize="7" fill="#374151" fontFamily="monospace">{t.label}</text>
                          </g>
                        ))}
                      </svg>
                    </div>
                  </Card>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">도면번호</span>
                      <p className="font-mono font-medium mt-0.5">{'PID-'}{eq?.process || 'HCR'}{'-'}{eq?.zone?.split(' ')[0] || '001'}{'-001'}</p>
                    </div>
                    <div className="p-2.5 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">최종 개정</span>
                      <p className="font-medium mt-0.5">Rev.5 (2024-06-15)</p>
                    </div>
                    <div className="p-2.5 bg-muted/30 rounded-lg">
                      <span className="text-muted-foreground">태그 위치</span>
                      <p className="font-mono font-medium mt-0.5 text-red-600">{selectedAlert?.data?.tagId || '-'} (표시됨)</p>
                    </div>
                  </div>
                </div>
              )
            })()}
          </DialogContent>
        </Dialog>

        {/* 데이터시트 다이얼로그 */}
        <Dialog open={showDatasheetDialog} onOpenChange={setShowDatasheetDialog}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                장치 데이터시트
                {selectedAlert?.data?.tagId && <Badge variant="secondary" className="font-mono text-xs">{selectedAlert.data.tagId}</Badge>}
              </DialogTitle>
            </DialogHeader>
            {(() => {
              const eq = getTagEq(selectedAlert?.data?.tagId)
              return (
                <div className="space-y-4">
                  <Card className="border-l-4 border-l-teal-500">
                    <CardContent className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center">
                          <Wrench className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{eq?.equipment || 'Equipment'}</p>
                          <p className="text-xs text-muted-foreground">{eq?.eqId || '-'} | {eq?.eqType || '-'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <div>
                    <h4 className="text-sm font-medium mb-2">General Specifications</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <tbody className="divide-y">
                          {[
                            ["Equipment ID", eq?.eqId || "-"],
                            ["Equipment Name", eq?.equipment || "-"],
                            ["Type", eq?.eqType || "-"],
                            ["Service", `${eq?.process || '-'} / ${eq?.zone || '-'}`],
                            ["Design Pressure", "42.0 kg/cm\u00b2g"],
                            ["Design Temperature", "450\u00b0C"],
                            ["Operating Pressure", "35.0 kg/cm\u00b2g"],
                            ["Operating Temperature", "380~400\u00b0C"],
                            ["Material (Shell)", "2.25Cr-1Mo Steel (SA-387 Gr.22)"],
                            ["Material (Internals)", "SS 321"],
                            ["Corrosion Allowance", "3.0 mm"],
                            ["Weight (Empty)", "285 ton"],
                            ["Installed Year", eq?.installed || "-"],
                            ["Last T/A", eq?.lastTA || "-"],
                          ].map(([label, value], i) => (
                            <tr key={i} className="hover:bg-muted/20">
                              <td className="px-3 py-2 bg-muted/30 font-medium w-40">{label}</td>
                              <td className="px-3 py-2">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Instrument Data ({selectedAlert?.data?.tagId || '-'})</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <tbody className="divide-y">
                          {[
                            ["Tag Number", selectedAlert?.data?.tagId || "-"],
                            ["Service Description", selectedAlert?.title || "-"],
                            ["Instrument Type", "Thermocouple (Type K)"],
                            ["Range", "0 ~ 600\u00b0C"],
                            ["Accuracy", "\u00b10.5\u00b0C"],
                            ["Process Connection", '1/2" NPT'],
                            ["Insertion Length", "300 mm"],
                            ["DCS Input Type", "4-20 mA"],
                            ["Alarm Setting (HH)", selectedAlert?.triggerSetpoint?.high || "-"],
                            ["Alarm Setting (LL)", selectedAlert?.triggerSetpoint?.low || "-"],
                            ["Last Calibration", "2024-12-20"],
                            ["Calibration Cycle", "6 months"],
                          ].map(([label, value], i) => (
                            <tr key={i} className="hover:bg-muted/20">
                              <td className="px-3 py-2 bg-muted/30 font-medium w-44">{label}</td>
                              <td className="px-3 py-2 font-mono">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t">
                    <span>Document: DS-{eq?.eqId || 'XXX'}-001 Rev.3</span>
                    <span>Last Updated: 2024-06-15</span>
                  </div>
                </div>
              )
            })()}
          </DialogContent>
        </Dialog>

        {/* 현재 알람 발생 이력 다이얼로그 */}
        <Dialog open={showAlarmHistoryDialog} onOpenChange={setShowAlarmHistoryDialog}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-red-500" />
                  현재 알람 발생 이력
                </DialogTitle>
                {selectedAlert?.occurrenceHistory && (
                  <Badge variant="destructive" className="text-xs">
                    {selectedAlert.occurrenceHistory.length}회 발생
                  </Badge>
                )}
              </div>
              <DialogDescription className="sr-only">알람 발생 이력을 확인합니다.</DialogDescription>
              {selectedAlert?.occurrenceHistory && selectedAlert.occurrenceHistory.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  최초 발생: {selectedAlert.occurrenceHistory[selectedAlert.occurrenceHistory.length - 1]?.timestamp}
                  {" | "}
                  {selectedAlert.occurrenceHistory.filter(o => o.type === "sustained").length > 0 && `지속 ${selectedAlert.occurrenceHistory.filter(o => o.type === "sustained").length}회`}
                  {selectedAlert.occurrenceHistory.filter(o => o.type === "sustained").length > 0 && selectedAlert.occurrenceHistory.filter(o => o.type === "recurred").length > 0 && " / "}
                  {selectedAlert.occurrenceHistory.filter(o => o.type === "recurred").length > 0 && `재발생 ${selectedAlert.occurrenceHistory.filter(o => o.type === "recurred").length}회`}
                </p>
              )}
            </DialogHeader>
            {selectedAlert?.occurrenceHistory && selectedAlert.occurrenceHistory.length > 0 && (
              <div className="relative mt-2">
                {/* Vertical timeline line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
                <div className="space-y-0">
                  {selectedAlert.occurrenceHistory.map((occ, idx) => {
                    const isSustained = occ.type === "sustained"
                    const isFirst = idx === 0
                    return (
                      <div key={idx} className={cn("relative flex items-start gap-3 py-2 pl-1", isFirst && "font-medium")}>
                        {/* Timeline dot */}
                        <div className={cn(
                          "relative z-10 flex items-center justify-center h-[30px] w-[30px] rounded-full shrink-0",
                          isFirst ? "bg-red-500" : isSustained ? "bg-amber-100 border-2 border-amber-400" : "bg-red-100 border-2 border-red-400"
                        )}>
                          {isFirst ? (
                            <Bell className="h-3.5 w-3.5 text-white" />
                          ) : isSustained ? (
                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5 text-red-600" />
                          )}
                        </div>
                        {/* Content */}
                        <div className={cn(
                          "flex-1 min-w-0 p-2 rounded-lg border",
                          isFirst ? "bg-red-50/50 border-red-200" : "bg-card border-border"
                        )}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium">{occ.timestamp}</span>
                            <Badge variant="outline" className={cn(
                              "text-[10px] h-4",
                              isSustained ? "border-amber-300 text-amber-700 bg-amber-50" : "border-red-300 text-red-700 bg-red-50"
                            )}>
                              {isSustained ? "지속" : "재발생"}
                            </Badge>
                            {isFirst && (
                              <Badge className="text-[10px] h-4 bg-red-500 text-white hover:bg-red-500">현재</Badge>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">{occ.duration}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs">
                            <span className="text-muted-foreground">발생값:</span>
                            <span className={cn("font-mono font-medium", isFirst ? "text-red-600" : "text-foreground")}>
                              {occ.value}{selectedAlert.data?.tagId?.startsWith("TI") ? "\u00b0C" : selectedAlert.data?.tagId?.startsWith("PI") ? " bar" : selectedAlert.data?.tagId?.startsWith("FI") ? " m3/h" : " W/m2K"}
                            </span>
                            {selectedAlert.data?.limit && (
                              <>
                                <span className="text-muted-foreground">|</span>
                                <span className="text-muted-foreground">Limit: {selectedAlert.data.limit}{selectedAlert.data?.tagId?.startsWith("TI") ? "\u00b0C" : ""}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

{/* 특이사항 없음 다이얼로그 */}
        <Dialog open={showNoIssueDialog} onOpenChange={setShowNoIssueDialog}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                특이사항 없음 확인
              </DialogTitle>
              <DialogDescription>
                오늘의 운전 현황을 확인하고 최종 저장합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* TOB 기반 이벤트 요약 */}
              <div className="p-3 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-medium">오늘의 운전 요약 (AI)</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {getTodayEventSummary()}
                </p>
              </div>

              {/* 오늘의 운전 분류 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">오늘의 운전 분류</Label>
                <p className="text-xs text-muted-foreground">해당하는 운전 상황을 모두 선택하세요 (복수 선택 가능)</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {operationCategories.map((cat) => {
                    const isSelected = noIssueCategories.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setNoIssueCategories(noIssueCategories.filter(c => c !== cat.id))
                          } else {
                            setNoIssueCategories([...noIssueCategories, cat.id])
                          }
                        }}
                        className={cn(
                          "flex items-start gap-2 p-2.5 rounded-lg border text-left transition-all",
                          isSelected 
                            ? "border-green-500 bg-green-50 ring-1 ring-green-500" 
                            : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                        )}
                      >
                        <span className="text-base shrink-0">{cat.icon}</span>
                        <div className="min-w-0">
                          <p className={cn("text-xs font-medium", isSelected && "text-green-700")}>{cat.label}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{cat.description}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0 ml-auto" />
                        )}
                      </button>
                    )
                  })}
                </div>
                {noIssueCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t">
                    <span className="text-xs text-muted-foreground">선택됨:</span>
                    {noIssueCategories.map(catId => {
                      const cat = operationCategories.find(c => c.id === catId)
                      return cat ? (
                        <Badge key={catId} variant="secondary" className="text-[10px] gap-1">
                          {cat.icon} {cat.label}
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}
              </div>

              {/* 추가 메모 입력 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">추가 메모 (선택)</Label>
                <Textarea
                  value={noIssueAdditionalNote}
                  onChange={(e) => setNoIssueAdditionalNote(e.target.value)}
                  placeholder="추가로 기록하고 싶은 내용을 입력하세요..."
                  className="min-h-16 text-sm"
                />
              </div>

              {/* 저장 정보 */}
              <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-green-800">
                    <p className="font-medium">저장 시 처리 내용</p>
                    <ul className="mt-1 space-y-0.5 text-green-700">
                      <li>- Daily Monitoring 완료 처리</li>
                      <li>- 운영 로그에 "특이사항 없음" 기록</li>
                      {noIssueCategories.length > 0 && (
                        <li>- 운전 분류: {noIssueCategories.map(id => operationCategories.find(c => c.id === id)?.label).join(", ")}</li>
                      )}
                      <li>- 담당자: {selectedAlert?.assignee || "김지수"}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setShowNoIssueDialog(false)}>
                취소
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setDailyMonitoringAction("normal")
                  setAlerts(alerts.map(a => a.id === selectedAlert?.id ? { ...a, status: "resolved" } : a))
                  setShowNoIssueDialog(false)
                  setNoIssueCategories([])
                  setNoIssueAdditionalNote("")
                  alert(`특이사항 없음으로 저장되었습니다.${noIssueCategories.length > 0 ? `\n운전 분류: ${noIssueCategories.map(id => operationCategories.find(c => c.id === id)?.label).join(", ")}` : ""}`)
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                저장
              </Button>
            </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {getTodayEventSummary()}
                </p>
              </div>

              {/* 추��� 메모 입력 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">추가 메모 (선택)</Label>
                <Textarea
                  value={noIssueAdditionalNote}
                  onChange={(e) => setNoIssueAdditionalNote(e.target.value)}
                  placeholder="추가로 기록하고 싶은 내용을 입력하세요..."
                  className="min-h-20 text-sm"
                />
              </div>

              {/* 저장 정보 */}
              <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-green-800">
                    <p className="font-medium">저장 시 처리 내용</p>
                    <ul className="mt-1 space-y-0.5 text-green-700">
                      <li>- Daily Monitoring 완료 처리</li>
                      <li>- 운영 로그에 "특이사항 없음" 기록</li>
                      <li>- 담당자: {selectedAlert?.assignee || "김지수"}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setShowNoIssueDialog(false)}>
                취소
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setDailyMonitoringAction("normal")
                  setAlerts(alerts.map(a => a.id === selectedAlert?.id ? { ...a, status: "resolved" } : a))
                  setShowNoIssueDialog(false)
                  alert("특이사항 없음으로 저장되었습니다.")
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                저장
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 주의 (운영 로그 추가) 다이얼로그 */}
        <Dialog open={showCautionDialog} onOpenChange={setShowCautionDialog}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                주의 판정 및 운영 로그 추가
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                문제 유형을 분류하고 상세 내용을 기록합니다.
              </p>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* 1차 카테고라이징 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">문제 유형 (1차 분류) <span className="text-red-500">*</span></Label>
                <Select value={cautionCategory} onValueChange={setCautionCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="문제 유형을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="process-deviation">공정 편차 (Process Deviation)</SelectItem>
                    <SelectItem value="equipment-issue">장치 이상 (Equipment Issue)</SelectItem>
                    <SelectItem value="quality-concern">품질 우려 (Quality Concern)</SelectItem>
                    <SelectItem value="safety-observation">안전 관찰 (Safety Observation)</SelectItem>
                    <SelectItem value="efficiency-drop">효율 저하 (Efficiency Drop)</SelectItem>
                    <SelectItem value="environmental">환경 관련 (Environmental)</SelectItem>
                    <SelectItem value="operational-limit">운전 한계 (Operational Limit)</SelectItem>
                    <SelectItem value="external-factor">외부 요인 (External Factor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 2차 해시태그 설명 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">상세 분류 (해시태그)</Label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {cautionHashtags.map((tag, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary"
                      className="text-xs cursor-pointer hover:bg-destructive/20"
                      onClick={() => setCautionHashtags(cautionHashtags.filter((_, i) => i !== idx))}
                    >
                      {tag}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={cautionHashtagInput}
                    onChange={(e) => setCautionHashtagInput(e.target.value)}
                    placeholder="#태그 입력 후 Enter"
                    className="text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && cautionHashtagInput.trim()) {
                        e.preventDefault()
                        const tag = cautionHashtagInput.startsWith("#") ? cautionHashtagInput : `#${cautionHashtagInput}`
                        if (!cautionHashtags.includes(tag)) {
                          setCautionHashtags([...cautionHashtags, tag])
                        }
                        setCautionHashtagInput("")
                      }
                    }}
                  />
                </div>
                {/* 추천 해시태그 */}
                <div className="mt-2">
                  <span className="text-xs text-muted-foreground mb-1.5 block">추천 태그 (과거 사례 기반)</span>
                  <div className="flex flex-wrap gap-1">
                    {recommendedHashtags.filter(t => !cautionHashtags.includes(t)).slice(0, 8).map((tag, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline"
                        className="text-[10px] cursor-pointer hover:bg-primary/10 hover:border-primary"
                        onClick={() => setCautionHashtags([...cautionHashtags, tag])}
                      >
                        {tag}
                        <Plus className="h-2.5 w-2.5 ml-0.5" />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* 추가 로그 입력 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">상세 내용 및 조치 사항</Label>
                <Textarea
                  value={cautionAdditionalLog}
                  onChange={(e) => setCautionAdditionalLog(e.target.value)}
                  placeholder="문제 상황 설명, 조치 내용, 향후 계획 등을 상세히 기록하세요..."
                  className="min-h-24 text-sm"
                />
              </div>

              {/* 저장 정보 */}
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-800">
                    <p className="font-medium">저장 시 처리 내용</p>
                    <ul className="mt-1 space-y-0.5 text-amber-700">
                      <li>- Daily Monitoring "주의" 판정 처리</li>
                      <li>- 운영 로그에 상세 기록 저장</li>
                      <li>- 지속 관찰 대상으로 등록</li>
                      <li>- 관련 담당자에게 알림 발송</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setShowCautionDialog(false)}>
                취소
              </Button>
              <Button 
                className="bg-amber-600 hover:bg-amber-700"
                disabled={!cautionCategory}
                onClick={() => {
                  setDailyMonitoringAction("caution")
                  setAlerts(alerts.map(a => a.id === selectedAlert?.id ? { ...a, status: "acknowledged" } : a))
                  setShowCautionDialog(false)
                  alert(`주의 판정이 저장되었습니다.\n\n분류: ${cautionCategory}\n태그: ${cautionHashtags.join(", ") || "없음"}`)
                }}
              >
                <Save className="h-4 w-4 mr-2" />
                저장
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 이벤트 생성 다이얼로그 - 새 이벤트과 동일한 양식 */}
        <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                이벤트 생성
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="ticket-title">이벤트 제목 *</Label>
                <Input 
                  id="ticket-title"
                  value={ticketTitle} 
                  onChange={(e) => setTicketTitle(e.target.value)} 
                  placeholder="문제 또는 개선사항에 대한 간략한 설명"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ticket-desc">상세 설명 *</Label>
                <Textarea 
                  id="ticket-desc"
                  value={ticketDescription} 
                  onChange={(e) => setTicketDescription(e.target.value)}
                  className="min-h-32"
                  placeholder="이벤트에 대한 상세 설명"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>이벤트 유형</Label>
                  <Select value={ticketType} onValueChange={(v: typeof ticketType) => setTicketType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Improvement">개선</SelectItem>
                      <SelectItem value="Trouble">문제</SelectItem>
                      <SelectItem value="Change">변경</SelectItem>
                      <SelectItem value="Analysis">분석</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>우선순위</Label>
                  <Select value={ticketPriority} onValueChange={(v: typeof ticketPriority) => setTicketPriority(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P1">P1 - 긴급</SelectItem>
                      <SelectItem value="P2">P2 - 높음</SelectItem>
                      <SelectItem value="P3">P3 - 보통</SelectItem>
                      <SelectItem value="P4">P4 - 낮음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>영향 범위</Label>
                  <Select value={ticketImpact} onValueChange={(v: typeof ticketImpact) => setTicketImpact(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Safety">안전</SelectItem>
                      <SelectItem value="Quality">품질</SelectItem>
                      <SelectItem value="Throughput">처리량</SelectItem>
                      <SelectItem value="Cost">비용</SelectItem>
                      <SelectItem value="Energy">에너지</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>희망 마감일</Label>
                  <Input
                    type="date"
                    value={ticketDueDate}
                    onChange={(e) => setTicketDueDate(e.target.value)}
                  />
                </div>
              </div>

              {selectedAlert?.unit && (
                <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <h4 className="text-sm font-semibold">공정 정보 (자동 입력)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Unit</Label>
                      <p className="text-sm font-medium">{selectedAlert.unit}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">담당자</Label>
                      <p className="text-sm font-medium">{UNIT_OWNERS[selectedAlert.unit] || "미배정"}</p>
                    </div>
                  </div>
                  {selectedAlert.data?.tagId && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">관련 Tag</Label>
                      <Badge variant="secondary">{selectedAlert.data.tagId}</Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTicketDialog(false)}>취소</Button>
              <Button onClick={handleSubmitTicket} disabled={!ticketTitle.trim()}>
                <FileText className="h-4 w-4 mr-2" />
                이벤트 생성
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 이상징후 카테고리 상세 팝업 */}
        <Dialog open={showAnomalyCategoryDialog} onOpenChange={setShowAnomalyCategoryDialog}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {selectedAnomalyCategory && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    {selectedAnomalyCategory.name}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">{selectedAnomalyCategory.description}</p>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {selectedAnomalyCategory.top3.map((item, idx) => (
                    <Card key={idx} className={cn(
                      "border-l-4",
                      item.severity === "high" ? "border-l-red-500" : item.severity === "medium" ? "border-l-amber-500" : "border-l-green-500"
                    )}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge className={cn(
                              "text-xs",
                              item.severity === "high" ? "bg-red-500 text-white" : item.severity === "medium" ? "bg-amber-500 text-white" : "bg-green-500 text-white"
                            )}>
                              {item.severity === "high" ? "High" : item.severity === "medium" ? "Medium" : "Low"}
                            </Badge>
                            <span className="font-mono font-bold text-sm">{item.tagId}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                        </div>
                        <p className="text-sm font-medium mb-1">{item.description}</p>
                        <div className="p-2 bg-muted/30 rounded mb-3">
                          <span className="text-xs text-muted-foreground">Deviation</span>
                          <p className="text-sm font-medium">{item.deviation}</p>
                        </div>
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                          <span className="text-xs font-medium text-blue-700">상세 분석</span>
                          <p className="text-sm text-blue-800 mt-1">{item.detail}</p>
                        </div>
                        {/* 미니 트렌드 시뮬레이션 */}
                        <div className="mt-3 h-16 flex items-end gap-1 bg-muted/20 rounded p-2">
                          {Array.from({ length: 12 }, (_, i) => {
                            const baseH = item.severity === "high" ? 60 : item.severity === "medium" ? 40 : 25
                            const h = baseH + Math.sin(i * 0.8) * 15 + Math.random() * 10
                            return (
                              <div
                                key={i}
                                className={cn("flex-1 rounded-t", i >= 9 ? (item.severity === "high" ? "bg-red-400" : item.severity === "medium" ? "bg-amber-400" : "bg-green-400") : "bg-muted-foreground/20")}
                                style={{ height: `${Math.max(h, 10)}%` }}
                              />
                            )
                          })}
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-muted-foreground">-12h</span>
                          <span className="text-xs text-muted-foreground">현재</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAnomalyCategoryDialog(false)} className="bg-transparent">닫기</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ESR 상세 팝업 (DCS 수정 요청용) */}
        <Dialog open={showEsrDialog} onOpenChange={setShowEsrDialog}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                ESR 상세 정보
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">ESR 번호</span>
                  <p className="font-medium text-sm">ESR-2025-0042</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">상태</span>
                  <Badge className="bg-blue-500 text-white">진행 중</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">ESR 제목</span>
                <p className="font-medium text-sm">HCR APC 고���화 프로젝트 - Phase 2</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">목적 및 배경</span>
                <div className="p-3 bg-muted/30 rounded-lg text-sm">
                  HCR Unit의 Advanced Process Control(APC) 시스템 고도화를 통한 운전 안정�� 향상 및 수율 ��적화. Phase 2에서는 Reactor Temperature Control Loop의 PID 파라미터 최적화 및 Cascade Control 구현을 목표로 함.
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">변경 범위</span>
                <div className="space-y-2">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-3 bg-muted/50 p-2 text-xs font-medium">
                      <span>변경 항목</span>
                      <span>변경 전</span>
                      <span>변경 후</span>
                    </div>
                    <div className="grid grid-cols-3 p-2 text-sm border-t">
                      <span>TIC-2001 P Gain</span>
                      <span className="text-muted-foreground">2.5</span>
                      <span className="font-medium">3.0</span>
                    </div>
                    <div className="grid grid-cols-3 p-2 text-sm border-t">
                      <span>TIC-2001 I Time</span>
                      <span className="text-muted-foreground">120s</span>
                      <span className="font-medium">90s</span>
                    </div>
                    <div className="grid grid-cols-3 p-2 text-sm border-t">
                      <span>TIC-2001 D Time</span>
                      <span className="text-muted-foreground">0s</span>
                      <span className="font-medium">5s</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">담당자</span>
                  <p className="text-sm">DX팀 이민수</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">적용일</span>
                  <p className="text-sm">2025-02-02 06:00</p>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">승인 이력</span>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-100">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">승인</Badge>
                      <span className="text-xs">공정팀 검토 완료 - 김��수 수석</span>
                    </div>
                    <span className="text-xs text-muted-foreground">2025-01-28</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-100">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">승인</Badge>
                      <span className="text-xs">안전팀 검토 완료 - 박안전 팀장</span>
                    </div>
                    <span className="text-xs text-muted-foreground">2025-01-30</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-100">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">적용</Badge>
                      <span className="text-xs">DCS 반영 완료 - IT��영팀</span>
                    </div>
                    <span className="text-xs text-muted-foreground">2025-02-02</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEsrDialog(false)} className="bg-transparent">닫기</Button>
              <Button onClick={() => { setShowEsrDialog(false); router.push("/tickets/1") }}>
                <ExternalLink className="h-4 w-4 mr-2" />
                ESR 상세 페이지 이동
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* CSR 요청 팝업 (DCS 수정요청 - IT운영팀으로) */}
        <Dialog open={showCsrDialog} onOpenChange={setShowCsrDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                DCS 수정 요청 (CSR)
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">IT운영팀으로 DCS Configuration 수정을 요청합니다.</p>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  이 요청은 IT운영팀에 CSR (Configuration Service Request)로 전달됩니다. 수정이 필요한 내용을 상세히 기재해 주세요.
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">연결 ESR</span>
                <p className="text-sm font-medium">ESR-2025-0042: HCR APC 고도화 프로젝트</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="csr-desc">수정 요청 내��� *</Label>
                <Textarea
                  id="csr-desc"
                  value={csrDescription}
                  onChange={(e) => setCsrDescription(e.target.value)}
                  placeholder="수정이 필요한 DCS 화면, 파라미터, 변경 내용 등을 상세히 기재하세요..."
                  className="min-h-32"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>긴급도</Label>
                  <Select defaultValue="normal">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">긴급</SelectItem>
                      <SelectItem value="normal">일반</SelectItem>
                      <SelectItem value="low">낮음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>희망 적용일</Label>
                  <Input type="date" min={new Date().toISOString().split("T")[0]} />
                </div>
              </div>

              {selectedAlert && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <span className="text-xs text-muted-foreground">요청 대상</span>
                  <p className="text-sm font-medium">{selectedAlert.title}</p>
                  <span className="text-xs text-muted-foreground">수신: IT운영팀</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCsrDialog(false); setCsrDescription("") }} className="bg-transparent">취소</Button>
              <Button 
                onClick={() => {
                  alert("CSR이 IT운영팀으로 전달되었습니다.\n\nCSR 번호: CSR-2025-0215\n수신: IT운영팀\n상태: 접수 대기")
                  setShowCsrDialog(false)
                  setCsrDescription("")
                }}
                disabled={!csrDescription.trim()}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                CSR 전송
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Custom KPI 추가 다이얼로그 - 운전변수 리스트에서 선택 */}
        <Dialog open={showAddKpiDialog} onOpenChange={(open) => { setShowAddKpiDialog(open); if (!open) { setKpiSearchQuery(""); setKpiName(""); setKpiValue(""); setKpiTarget(""); setKpiUnit("") } }}>
          <DialogContent className="max-w-md">
<DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                퍼포먼스 지표 추가
              </DialogTitle>
              <DialogDescription className="sr-only">새로운 퍼포먼스 지표를 추가합니다.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs">운전변수에서 선택</Label>
                <Input 
                  value={kpiSearchQuery} 
                  onChange={e => setKpiSearchQuery(e.target.value)} 
                  placeholder="Tag ID 또는 변수명으로 검색..." 
                  className="text-sm" 
                />
                {kpiSearchQuery && (
                  <ScrollArea className="h-40 border rounded-md">
                    <div className="p-1">
                      {ALL_PROCESS_TAGS.filter(t => 
                        t.tag.toLowerCase().includes(kpiSearchQuery.toLowerCase()) ||
                        t.name.toLowerCase().includes(kpiSearchQuery.toLowerCase()) ||
                        t.process.toLowerCase().includes(kpiSearchQuery.toLowerCase())
                      ).slice(0, 15).map(t => (
                        <button
                          key={t.tag}
                          className={cn("w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-muted/60 text-left cursor-pointer", kpiName === `${t.tag} ${t.name}` && "bg-primary/10")}
                          onClick={() => {
                            setKpiName(`${t.tag} ${t.name}`)
                            const baseVal = t.guide + (Math.random() - 0.5) * t.guide * 0.05
                            setKpiValue(baseVal.toFixed(1))
                            setKpiTarget(String(t.guide))
                            setKpiUnit(t.unit)
                            setKpiSearchQuery("")
                          }}
                        >
                          <Badge variant="outline" className="text-[9px] h-4 shrink-0">{t.process}</Badge>
                          <span className="font-mono text-muted-foreground">{t.tag}</span>
                          <span className="flex-1 truncate">{t.name}</span>
                          <span className="text-muted-foreground shrink-0">{t.unit}</span>
                        </button>
                      ))}
                      {ALL_PROCESS_TAGS.filter(t => 
                        t.tag.toLowerCase().includes(kpiSearchQuery.toLowerCase()) ||
                        t.name.toLowerCase().includes(kpiSearchQuery.toLowerCase()) ||
                        t.process.toLowerCase().includes(kpiSearchQuery.toLowerCase())
                      ).length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-3">검색 결과가 없습니다.</p>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
              {kpiName && (
                <div className="p-2.5 bg-muted/30 rounded-lg space-y-2">
                  <p className="text-xs font-medium">{kpiName}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">현재값</Label>
                      <Input type="number" value={kpiValue} onChange={e => setKpiValue(e.target.value)} className="text-xs font-mono h-7" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">목표값 (Guide)</Label>
                      <Input type="number" value={kpiTarget} onChange={e => setKpiTarget(e.target.value)} className="text-xs font-mono h-7" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">단위</Label>
                      <Input value={kpiUnit} onChange={e => setKpiUnit(e.target.value)} className="text-xs h-7" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowAddKpiDialog(false)}>취소</Button>
              <Button size="sm" onClick={handleAddKpi} disabled={!kpiName || !kpiValue || !kpiTarget}>추가</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 변수 추가 다이얼로그 */}
        <Dialog open={showAddVarDialog} onOpenChange={(open) => { setShowAddVarDialog(open); if (!open) setAddVarSearch("") }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm">
                <Thermometer className="h-4 w-4" />
                모니터링 변수 추가
              </DialogTitle>
              <DialogDescription className="sr-only">모니터링할 변수를 추가합니다.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input 
                value={addVarSearch} 
                onChange={e => setAddVarSearch(e.target.value)} 
                placeholder="Tag ID, 변수명 또는 프로세스로 검색 (100+개 태그)..." 
                className="text-sm" 
              />
              <ScrollArea className="h-64 border rounded-md">
                <div className="p-1">
                  {ALL_PROCESS_TAGS
                    .filter(t => 
                      !addVarSearch ||
                      t.tag.toLowerCase().includes(addVarSearch.toLowerCase()) ||
                      t.name.toLowerCase().includes(addVarSearch.toLowerCase()) ||
                      t.process.toLowerCase().includes(addVarSearch.toLowerCase())
                    )
                    .map(t => {
                      const isAdded = monitoredVarTags.includes(t.tag)
                      return (
                        <div key={t.tag} className={cn("flex items-center gap-2 px-2 py-1.5 text-xs rounded", isAdded && "bg-primary/5")}>
                          <Badge variant="outline" className="text-[9px] h-4 shrink-0">{t.process}</Badge>
                          <span className="font-mono text-muted-foreground w-14 shrink-0">{t.tag}</span>
                          <span className="flex-1 truncate">{t.name}</span>
                          <span className="text-muted-foreground shrink-0 text-[10px]">{t.unit}</span>
                          <Button
                            variant={isAdded ? "secondary" : "outline"}
                            size="sm"
                            className={cn("h-5 text-[10px] px-2 shrink-0", isAdded && "text-primary")}
                            onClick={() => {
                              if (isAdded) {
                                setMonitoredVarTags(prev => prev.filter(tag => tag !== t.tag))
                              } else {
                                setMonitoredVarTags(prev => [...prev, t.tag])
                              }
                            }}
                          >
                            {isAdded ? "추가됨" : "추가"}
                          </Button>
                        </div>
                      )
                    })}
                </div>
              </ScrollArea>
              <p className="text-[10px] text-muted-foreground">
                {monitoredVarTags.length}개 변수 추가 선택됨 | 전체 {ALL_PROCESS_TAGS.length}개 태그
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowAddVarDialog(false)}>닫기</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 운전변수 트렌드 팝업 */}
        <Dialog open={showVarTrendDialog} onOpenChange={setShowVarTrendDialog}>
          <DialogContent className="max-w-lg">
            {selectedVarForTrend && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4" />
                    {selectedVarForTrend.tag} - {selectedVarForTrend.name}
                  </DialogTitle>
                  <DialogDescription className="sr-only">운전변수 트렌드를 확인합니다.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">현재값:</span>
                      <span className="font-mono font-semibold">{selectedVarForTrend.val}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Guide:</span>
                      <span className="font-mono">{selectedVarForTrend.guide}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Range:</span>
                      <span className="font-mono">{selectedVarForTrend.range}</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">2026-02-25 07:00 기준</span>
                    </div>
                  </div>
                  <div className="border rounded-lg p-3 bg-muted/20">
                    <p className="text-[10px] text-muted-foreground mb-2">최근 8시간 트렌드</p>
                    <div className="h-32 flex items-end gap-1">
                      {selectedVarForTrend.trend.map((val, i) => {
                        const mn = Math.min(...selectedVarForTrend.trend) * 0.998
                        const mx = Math.max(...selectedVarForTrend.trend) * 1.002
                        const h = mx > mn ? ((val - mn) / (mx - mn)) * 100 : 50
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[9px] font-mono text-muted-foreground">{val}</span>
                            <div className="w-full bg-primary/60 rounded-t transition-all" style={{ height: `${Math.max(h, 8)}%` }} />
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground mt-1.5 border-t pt-1">
                      <span>23:00</span>
                      <span>00:00</span>
                      <span>01:00</span>
                      <span>03:00</span>
                      <span>05:00</span>
                      <span>06:00</span>
                      <span>07:00</span>
                    </div>
                  </div>
                  {/* Guide line indicator */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 bg-primary/60" />
                      <span className="text-muted-foreground">Actual</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 bg-amber-400 border-dashed" style={{ borderTopWidth: 1 }} />
                      <span className="text-muted-foreground">Guide: {selectedVarForTrend.guide}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Standing Issue 추가 등록 다이얼로그 */}
        <Dialog open={showDailyReportDialog} onOpenChange={setShowDailyReportDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Standing Issue 추가 등록
              </DialogTitle>
              <DialogDescription>
                공정 특이사항을 Standing Issue로 등록합니다. 등록 시 기술팀장에게 자동 공유됩니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="daily-report-title">제목 *</Label>
                <Input
                  id="daily-report-title"
                  value={dailyReportTitle}
                  onChange={(e) => setDailyReportTitle(e.target.value)}
                  placeholder="Standing Issue 제목을 입��하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="daily-report-text">특이사항 내용 *</Label>
                <Textarea
                  id="daily-report-text"
                  value={dailyReportText}
                  onChange={(e) => setDailyReportText(e.target.value)}
                  placeholder="일일보고에 반영할 특이사항 내용을 상세히 기재하세요..."
                  className="min-h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>카테고리</Label>
                  <Select value={dailyReportCategory} onValueChange={(v: typeof dailyReportCategory) => setDailyReportCategory(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily-report">일일보고</SelectItem>
                      <SelectItem value="long-term">중장기</SelectItem>
                      <SelectItem value="special">특이사항</SelectItem>
                      <SelectItem value="monitoring">관찰</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>관련 Unit</Label>
                  <Select value={dailyReportUnit} onValueChange={setDailyReportUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CDU">CDU</SelectItem>
                      <SelectItem value="VDU">VDU</SelectItem>
                      <SelectItem value="HCR">HCR</SelectItem>
                      <SelectItem value="CCR">CCR</SelectItem>
                      <SelectItem value="공통">공통</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 관련 이벤트 링크 */}
              <div className="space-y-2">
                <Label>관련 이벤트 연결 (선택)</Label>
                <Select value={dailyReportLinkedTicketId} onValueChange={setDailyReportLinkedTicketId}>
                  <SelectTrigger>
                    <SelectValue placeholder="연결할 이벤트 선택..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">연결하지 않음</SelectItem>
                    {getTickets().slice(0, 10).map(ticket => (
                      <SelectItem key={ticket.id} value={ticket.id}>
                        <span className="flex items-center gap-2">
                          <span className="text-muted-foreground">#{ticket.id}</span>
                          <span className="truncate">{ticket.title}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {dailyReportLinkedTicketId && dailyReportLinkedTicketId !== "none" && (
                  <div className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
                    <LinkIcon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs text-primary">
                      #{dailyReportLinkedTicketId} - {getTickets().find(t => t.id === dailyReportLinkedTicketId)?.title}
                    </span>
                    <button 
                      onClick={() => setDailyReportLinkedTicketId("")}
                      className="ml-auto text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  등록된 Standing Issue는 Daily Monitoring에서 지속 추적 관리되며, 기술팀장 계정의 My Action에 자동 공유됩니다.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => { 
                  setShowDailyReportDialog(false)
                  setDailyReportTitle("")
                  setDailyReportText("")
                  setDailyReportLinkedTicketId("")
                  setDailyReportCategory("daily-report")
                  setDailyReportUnit("")
                }}
                className="bg-transparent"
              >
                취소
              </Button>
              <Button 
                onClick={handleDailyReportSubmit}
                disabled={!dailyReportTitle.trim() || !dailyReportText.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Standing Issue 등록
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Shelved Alert 처리 다이얼로그 */}
        <Dialog open={showShelvedDialog} onOpenChange={setShowShelvedDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Shelved Alert 처리
              </DialogTitle>
              <DialogDescription className="sr-only">알람을 일시적으로 보류 처리합니다.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  Shelved 처리된 알람은 지정된 재개 시점까지 알람 목록에서 숨겨지며, 
                  해당 시점이 되면 자동으로 다시 활성화됩니다.
                </p>
              </div>

              {selectedAlert && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <span className="text-xs text-muted-foreground">대상 알람</span>
                  <p className="text-sm font-medium">{selectedAlert.title}</p>
                  <p className="text-xs text-muted-foreground">{selectedAlert.data?.tagId}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Shelved 처리 사유 *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {shelvedCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={cn(
                        "flex flex-col items-start p-3 rounded-lg border text-left transition-colors",
                        shelvedCategory === cat.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                      )}
                      onClick={() => setShelvedCategory(cat.id)}
                    >
                      <span className={cn("text-sm font-medium", shelvedCategory === cat.id ? "text-primary" : "text-foreground")}>{cat.label}</span>
                      <span className="text-xs text-muted-foreground mt-0.5 leading-snug">{cat.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shelved-reason">상세 사유 (선택)</Label>
                <Textarea
                  id="shelved-reason"
                  value={shelvedReason}
                  onChange={(e) => setShelvedReason(e.target.value)}
                  placeholder="추가 메모가 있으면 입력하세요..."
                  className="min-h-16"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shelved-until">재검토 시점 *</Label>
                <Input
                  id="shelved-until"
                  type="date"
                  value={shelvedUntil}
                  onChange={(e) => setShelvedUntil(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
                <p className="text-xs text-muted-foreground">
                  이 날짜가 되면 알람이 자동으로 재활성화됩니다.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowShelvedDialog(false); setShelvedCategory(""); setShelvedReason(""); setShelvedUntil(""); }}>취소</Button>
              <Button 
                onClick={() => selectedAlert && handleShelveAlert(selectedAlert.id)}
                disabled={!shelvedCategory || !shelvedUntil}
              >
                <Clock className="h-4 w-4 mr-2" />
                Shelved 처리
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===== 장기건전성 조치 입력 -> 티켓화 Dialog ===== */}
        <Dialog open={showHealthActionDialog} onOpenChange={setShowHealthActionDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-red-500" />
                조치 입력 (티켓 생성)
              </DialogTitle>
              <DialogDescription className="sr-only">조치 사항을 입력하고 티켓을 생성합니다.</DialogDescription>
            </DialogHeader>
            {selectedAlert?.healthMonitoring && (
              <div className="space-y-4 py-2">
                {/* 대상 장치 정보 */}
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                    <span className="text-sm font-semibold">{selectedAlert.healthMonitoring.equipId} - {selectedAlert.healthMonitoring.equipName}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <span>현재 {selectedAlert.healthMonitoring.currentValue} {selectedAlert.healthMonitoring.healthIndexUnit}</span>
                    <span>Drift +{selectedAlert.healthMonitoring.driftPct}%</span>
                    <span>잔여 {selectedAlert.healthMonitoring.projectionWeeks}주</span>
                  </div>
                </div>

                {/* 조치 유형 */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">조치 유형</Label>
                  <Select value={healthActionType} onValueChange={setHealthActionType}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online-cleaning">Online Cleaning</SelectItem>
                      <SelectItem value="ta-scope">TA Scope 반영</SelectItem>
                      <SelectItem value="operating-change">운전 조건 변경</SelectItem>
                      <SelectItem value="chemical-treatment">Chemical 처리</SelectItem>
                      <SelectItem value="temp-profile">온도 프로파일 변경</SelectItem>
                      <SelectItem value="catalyst-management">촉매 관리 (보충/교체)</SelectItem>
                      <SelectItem value="inspection">점검/검사</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 긴급도 */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">긴급도</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "urgent", label: "긴급 (즉시)", className: "border-red-300 bg-red-50 text-red-700" },
                      { id: "high", label: "높음 (1주 내)", className: "border-amber-300 bg-amber-50 text-amber-700" },
                      { id: "normal", label: "보통 (TA 반영)", className: "border-emerald-300 bg-emerald-50 text-emerald-700" },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        className={cn(
                          "p-2 rounded-lg border text-xs font-medium transition-colors",
                          healthActionUrgency === opt.id ? opt.className + " ring-1 ring-current" : "border-border hover:bg-muted/50"
                        )}
                        onClick={() => setHealthActionUrgency(opt.id)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 조치 내용 */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">조치 내용</Label>
                  <Textarea
                    rows={4}
                    value={healthActionDesc}
                    onChange={e => setHealthActionDesc(e.target.value)}
                    placeholder="어떤 조치를 어떻게 수행할 것인지 기술하세요..."
                  />
                </div>

                {/* 디폴트 정보 */}
                <div className="p-3 rounded-lg bg-muted/40 border space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground">자동 입력 정보 (티켓에 포함)</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                    <span className="text-muted-foreground">공정: <span className="text-foreground font-medium">{selectedAlert.unit || "N/A"}</span></span>
                    <span className="text-muted-foreground">장치: <span className="text-foreground font-medium">{selectedAlert.healthMonitoring.equipId}</span></span>
                    <span className="text-muted-foreground">Health Index: <span className="text-foreground font-medium">{selectedAlert.healthMonitoring.healthIndexName}</span></span>
                    <span className="text-muted-foreground">Projection: <span className="text-foreground font-medium">{selectedAlert.healthMonitoring.projectionWeeks}주</span></span>
                    {selectedAlert.healthMonitoring.aiModelId && (
                      <span className="text-muted-foreground">AI Model: <span className="text-foreground font-medium">{selectedAlert.healthMonitoring.aiModelId}</span></span>
                    )}
                    <span className="text-muted-foreground">발생일: <span className="text-foreground font-medium">{selectedAlert.timestamp}</span></span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-xs text-blue-700">조치 입력 시 이벤트 티켓이 자동 생성되며, 관련 엔지니어에게 알림이 발송됩니다.</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowHealthActionDialog(false); setHealthActionDesc(""); }}>취소</Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  setShowHealthActionDialog(false)
                  setHealthActionDesc("")
                  if (selectedAlert) handleCreateTicket(selectedAlert)
                }}
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                조치 입력 및 티켓 생성
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===== 관련 트렌드 전체보기 Dialog ===== */}
        <Dialog open={showFullTrendDialog} onOpenChange={setShowFullTrendDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                관련 트렌드 전체보기
                {selectedAlert?.data?.tagId && (
                  <Badge variant="outline" className="ml-2 font-mono text-xs">{selectedAlert.data.tagId}</Badge>
                )}
              </DialogTitle>
              <DialogDescription className="sr-only">관련 트렌드를 전체 화면으로 확인합니다.</DialogDescription>
              {selectedAlert?.data?.tagId && (() => {
                const group = getMonitoringGroup(selectedAlert.data.tagId!)
                return (
                  <p className="text-sm text-muted-foreground mt-1">
                    모니터링 그룹: <span className="font-medium text-foreground">{group.name}</span>
                    <span className="ml-2">({group.tags.length}개 태그)</span>
                  </p>
                )
              })()}
            </DialogHeader>
            <ScrollArea className="flex-1 -mx-6 px-6">
              {selectedAlert?.data?.tagId && (() => {
                const group = getMonitoringGroup(selectedAlert.data.tagId!)
                const sourceTagId = selectedAlert.data.tagId

                return (
                  <div className="space-y-6 pb-4">
                    {/* 그룹별 태그 타입 범례 */}
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(group.tags.map(t => t.type))).map(type => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type}
                          <span className="ml-1 text-muted-foreground">({group.tags.filter(t => t.type === type).length})</span>
                        </Badge>
                      ))}
                    </div>

                    {/* 태그별 개별 트렌드 카드 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {group.tags.map(tag => {
                        const isSourceTag = tag.id === sourceTagId
                        const trendData = isSourceTag && selectedAlert.data?.trend
                          ? { values: selectedAlert.data.trend, limit: selectedAlert.data.limit || null, lowLimit: selectedAlert.triggerSetpoint?.low || null, unit: tag.unit }
                          : generateMockTrend(tag.id, tag.type)
                        const { values, limit, lowLimit: lo } = trendData
                        const allVals = [...values, ...(limit ? [limit] : []), ...(lo ? [lo] : [])]
                        const maxV = Math.max(...allVals) * 1.05
                        const minV = Math.min(...allVals) * 0.95
                        const range = maxV - minV || 1
                        const W = 400, H = 120
                        const pad = { t: 12, b: 20, l: 40, r: 12 }
                        const cw = W - pad.l - pad.r
                        const ch = H - pad.t - pad.b
                        const toX = (i: number) => pad.l + (i / (values.length - 1)) * cw
                        const toY = (v: number) => pad.t + (1 - (v - minV) / range) * ch
                        const pathD = values.reduce((acc, v, i) => {
                          const x = toX(i), y = toY(v)
                          if (i === 0) return `M ${x} ${y}`
                          const px = toX(i - 1), py = toY(values[i - 1])
                          const cpx = (px + x) / 2
                          return `${acc} C ${cpx} ${py}, ${cpx} ${y}, ${x} ${y}`
                        }, "")
                        const lastVal = values[values.length - 1]
                        const isViolation = (limit && lastVal > limit) || (lo && lastVal < lo)
                        const trendColor = isSourceTag ? "#0d9488" : "#6366f1"

                        return (
                          <Card key={tag.id} className={cn(
                            "overflow-hidden transition-shadow",
                            isSourceTag && "ring-2 ring-primary shadow-md",
                            isViolation && !isSourceTag && "border-red-200"
                          )}>
                            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={cn(
                                  "font-mono text-sm font-semibold shrink-0",
                                  isSourceTag ? "text-primary" : isViolation ? "text-red-600" : "text-foreground"
                                )}>
                                  {tag.id}
                                </span>
                                {isSourceTag && <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/30" variant="outline">Alert Source</Badge>}
                                {isViolation && !isSourceTag && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Violation</Badge>}
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0 ml-2">[{trendData.unit}]</span>
                            </div>
                            <p className="px-4 text-xs text-muted-foreground -mt-0.5 mb-1">{tag.desc}</p>
                            <div className="px-2 pb-1">
                              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24" preserveAspectRatio="xMidYMid meet">
                                {/* Grid */}
                                {[0.33, 0.66].map(frac => {
                                  const y = pad.t + frac * ch
                                  const val = maxV - frac * range
                                  return <g key={frac}><line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="currentColor" strokeOpacity={0.06} /><text x={pad.l - 4} y={y + 3} fontSize="7" fill="currentColor" fillOpacity={0.35} textAnchor="end">{val.toFixed(0)}</text></g>
                                })}
                                {/* Limit lines */}
                                {limit && <line x1={pad.l} y1={toY(limit)} x2={W - pad.r} y2={toY(limit)} stroke="#f87171" strokeWidth="1" strokeDasharray="4 2" />}
                                {lo && <line x1={pad.l} y1={toY(lo)} x2={W - pad.r} y2={toY(lo)} stroke="#60a5fa" strokeWidth="1" strokeDasharray="4 2" />}
                                {/* Area */}
                                <path d={`${pathD} L ${toX(values.length-1)} ${pad.t+ch} L ${toX(0)} ${pad.t+ch} Z`} fill={trendColor} opacity="0.08" />
                                {/* Line */}
                                <path d={pathD} fill="none" stroke={trendColor} strokeWidth="2" strokeLinecap="round" />
                                {/* Over-limit red */}
                                {values.map((v, i) => {
                                  if (i === 0) return null
                                  const overNow = (limit && v > limit) || (lo && v < lo)
                                  const overPrev = (limit && values[i-1] > limit) || (lo && values[i-1] < lo)
                                  if (!overNow && !overPrev) return null
                                  const px = toX(i-1), py = toY(values[i-1]), x = toX(i), y = toY(v), cpx = (px+x)/2
                                  return <path key={i} d={`M ${px} ${py} C ${cpx} ${py}, ${cpx} ${y}, ${x} ${y}`} fill="none" stroke="#ef4444" strokeWidth="2" />
                                })}
                                {/* Points */}
                                {values.map((v, i) => {
                                  const isOver = (limit && v > limit) || (lo && v < lo)
                                  return <circle key={i} cx={toX(i)} cy={toY(v)} r={isOver ? 3 : 2} fill={isOver ? "#ef4444" : trendColor} stroke="white" strokeWidth="1" />
                                })}
                              </svg>
                            </div>
                            <div className="px-4 pb-3 flex items-center justify-between text-xs">
                              <div>
                                <span className="text-muted-foreground">현재 </span>
                                <span className={cn("font-semibold", isViolation ? "text-red-600" : "text-foreground")}>
                                  {lastVal} {trendData.unit}
                                </span>
                              </div>
                              {limit && (
                                <div>
                                  <span className="text-muted-foreground">Max </span>
                                  <span className="text-red-500 font-medium">{limit}</span>
                                </div>
                              )}
                              {lo && (
                                <div>
                                  <span className="text-muted-foreground">Min </span>
                                  <span className="text-blue-500 font-medium">{lo}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-muted-foreground">편차 </span>
                                <span className={cn("font-medium", isViolation ? "text-red-600" : "text-green-600")}>
                                  {limit ? `${lastVal > limit ? "+" : ""}${(lastVal - limit).toFixed(1)}` : lo ? `${lastVal < lo ? "" : "+"}${(lastVal - lo).toFixed(1)}` : "-"}
                                </span>
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* 팀장 승인 다이얼로그 */}
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                완료 보고서 승인
              </DialogTitle>
              <DialogDescription className="sr-only">완료 보고서를 승인합니다.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">{selectedTeamLeadNotice?.engineer}</span>님의 
                  <span className="font-semibold"> {selectedTeamLeadNotice?.title}</span> 이벤트 완료 보고서를 승인합니다.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="approval-comment">승인 코멘트 (선택)</Label>
                <Textarea
                  id="approval-comment"
                  placeholder="팀원에게 전달할 피드백이나 코멘트를 입력하세요..."
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  className="min-h-24"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>취소</Button>
              <Button 
                className="gap-2"
                onClick={() => {
                  alert(`승인이 완료되었습니다.\n\n이벤트: ${selectedTeamLeadNotice?.title}\n담당자: ${selectedTeamLeadNotice?.engineer}\n코멘트: ${approvalComment || "(없음)"}`)
                  setShowApprovalDialog(false)
                  setApprovalComment("")
                  setSelectedTeamLeadNotice(null)
                }}
              >
                <CheckCircle className="h-4 w-4" />
                승인 완료
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
