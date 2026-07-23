"use client"

import React from "react"
import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useUser, getProcessesByDivision, type Division } from "@/lib/user-context"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Activity,
  AlertTriangle,
  CheckCircle,
  Zap,
  Droplets,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  FileText,
  Cpu,
  Lightbulb,
  Gauge,
  Flame,
  ChevronRight,
  ExternalLink,
  Calculator,
  PieChart,
  Layers,
} from "lucide-react"
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, PieChart as RechartsPie, Pie
} from "recharts"

// Financial Impact 데이터
const MONTHS = ["2024-08","2024-09","2024-10","2024-11","2024-12","2025-01"]
const MONTH_LABELS = ["8월","9월","10월","11월","12월","1월"]

// 모델별 수익 기여 데이터
const modelProfitContribution = [
  { 
    id: "rto-cdu",
    name: "CDU RTO 최적화", 
    category: "RTO",
    unit: "CDU",
    monthlyBenefit: 850, // 백만원/월
    ytdBenefit: 5100, // 연간 누적 (백만원)
    targetBenefit: 10000, // 연간 목표 (백만원)
    status: "active",
    lastOptimized: "2025-02-02 14:30",
    description: "원유 처리 최적화를 통한 에너지 비용 절감 및 제품 수율 향상",
    kpis: [
      { name: "에너지 비용 절감", value: 320, unit: "백만원/월" },
      { name: "수율 향상 기여", value: 530, unit: "백만원/월" },
    ],
    trend: [620, 680, 750, 810, 820, 850],
  },
  { 
    id: "ml-fouling",
    name: "Fouling 예측 모델", 
    category: "AI/ML",
    unit: "HCR",
    monthlyBenefit: 420,
    ytdBenefit: 2520,
    targetBenefit: 5000,
    status: "active",
    lastOptimized: "2025-02-01 09:15",
    description: "열교환기 Fouling 예측을 통한 최적 세정 주기 결정 및 효율 유지",
    kpis: [
      { name: "세정 비용 절감", value: 180, unit: "백만원/월" },
      { name: "효율 손실 방지", value: 240, unit: "백만원/월" },
    ],
    trend: [350, 380, 390, 400, 410, 420],
  },
  { 
    id: "rto-hcr",
    name: "HCR Reactor 최적화", 
    category: "RTO",
    unit: "HCR",
    monthlyBenefit: 680,
    ytdBenefit: 4080,
    targetBenefit: 8000,
    status: "active",
    lastOptimized: "2025-02-02 10:45",
    description: "반응기 온도/압력 최적화를 통한 전환율 극대화 및 촉매 수명 연장",
    kpis: [
      { name: "전환율 향상", value: 450, unit: "백만원/월" },
      { name: "촉매 수명 연장", value: 230, unit: "백만원/월" },
    ],
    trend: [580, 610, 640, 660, 670, 680],
  },
  { 
    id: "ml-quality",
    name: "제품 품질 예측", 
    category: "AI/ML",
    unit: "BTX",
    monthlyBenefit: 280,
    ytdBenefit: 1680,
    targetBenefit: 3500,
    status: "active",
    lastOptimized: "2025-02-02 08:00",
    description: "실시간 품질 예측을 통한 Giveaway 최소화",
    kpis: [
      { name: "Giveaway 감소", value: 280, unit: "백만원/월" },
    ],
    trend: [200, 220, 240, 260, 270, 280],
  },
  { 
    id: "rto-vdu",
    name: "VDU 분리 최적화", 
    category: "RTO",
    unit: "VDU",
    monthlyBenefit: 520,
    ytdBenefit: 3120,
    targetBenefit: 6000,
    status: "active",
    lastOptimized: "2025-02-01 16:20",
    description: "진공 조건 최적화를 통한 제품 분리 효율 향상",
    kpis: [
      { name: "제품 수율 향상", value: 380, unit: "백만원/월" },
      { name: "에너지 절감", value: 140, unit: "백만원/월" },
    ],
    trend: [420, 450, 480, 500, 510, 520],
  },
  { 
    id: "ml-energy",
    name: "에너지 최적화 ML", 
    category: "AI/ML",
    unit: "Utility",
    monthlyBenefit: 350,
    ytdBenefit: 2100,
    targetBenefit: 4200,
    status: "active",
    lastOptimized: "2025-02-02 06:00",
    description: "유틸리티 사용량 최적화를 통한 에너지 비용 절감",
    kpis: [
      { name: "스팀 비용 절감", value: 200, unit: "백만원/월" },
      { name: "전력 비용 절감", value: 150, unit: "백만원/월" },
    ],
    trend: [280, 300, 320, 330, 340, 350],
  },
]

// 카테고리별 집계
const categoryTotals = {
  RTO: modelProfitContribution.filter(m => m.category === "RTO").reduce((sum, m) => sum + m.monthlyBenefit, 0),
  "AI/ML": modelProfitContribution.filter(m => m.category === "AI/ML").reduce((sum, m) => sum + m.monthlyBenefit, 0),
}

// 월별 총 수익 추이
const monthlyTotalBenefit = MONTH_LABELS.map((month, idx) => ({
  month,
  RTO: modelProfitContribution.filter(m => m.category === "RTO").reduce((sum, m) => sum + m.trend[idx], 0),
  "AI/ML": modelProfitContribution.filter(m => m.category === "AI/ML").reduce((sum, m) => sum + m.trend[idx], 0),
  total: modelProfitContribution.reduce((sum, m) => sum + m.trend[idx], 0),
}))

// ROI 계산
const investmentData = {
  totalInvestment: 15000, // 백만원 (모델 개발 및 운영 비용)
  ytdBenefit: modelProfitContribution.reduce((sum, m) => sum + m.ytdBenefit, 0),
  projectedAnnualBenefit: modelProfitContribution.reduce((sum, m) => sum + m.monthlyBenefit * 12, 0),
}

// 잠재 기회 데이터
const potentialOpportunities = [
  { 
    name: "CCR Catalyst 최적화", 
    estimatedBenefit: 450, 
    effort: "Medium",
    status: "평가 중",
    description: "촉매 재생 주기 최적화를 통한 비용 절감"
  },
  { 
    name: "Hydrogen Network 최적화", 
    estimatedBenefit: 380, 
    effort: "High",
    status: "검토 예정",
    description: "수소 네트워크 전체 최적화"
  },
  { 
    name: "Crude Blend 최적화", 
    estimatedBenefit: 620, 
    effort: "Medium",
    status: "PoC 진행 중",
    description: "원유 배합 최적화를 통한 마진 극대화"
  },
]

// 파이 차트 색상
const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(220, 70%, 60%)']

function formatCurrency(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}억`
  return `${value.toLocaleString()}백만`
}

function DeltaBadge({ current, prev, suffix = "" }: { current: number; prev: number; suffix?: string }) {
  const delta = current - prev
  const pctChange = prev !== 0 ? ((delta / prev) * 100).toFixed(1) : "0"
  if (Math.abs(delta) < 0.5) return <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Minus className="h-3 w-3" /> 변동 없음</span>
  return (
    <span className={cn("text-xs flex items-center gap-0.5", delta > 0 ? "text-green-600" : "text-red-600")}>
      {delta > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {delta > 0 ? "+" : ""}{pctChange}%
    </span>
  )
}

export default function FinancialImpactPage() {
  const { visibleProcesses } = useUser()
  const [selectedPeriod, setSelectedPeriod] = useState("2025-01")
  const [selectedCategory, setSelectedCategory] = useState<"all" | "RTO" | "AI/ML">("all")
  const [activeTab, setActiveTab] = useState("overview")

  const totalMonthlyBenefit = modelProfitContribution.reduce((sum, m) => sum + m.monthlyBenefit, 0)
  const totalYtdBenefit = modelProfitContribution.reduce((sum, m) => sum + m.ytdBenefit, 0)
  const totalTargetBenefit = modelProfitContribution.reduce((sum, m) => sum + m.targetBenefit, 0)
  const achievementRate = (totalYtdBenefit / totalTargetBenefit * 100).toFixed(1)

  const filteredModels = selectedCategory === "all" 
    ? modelProfitContribution 
    : modelProfitContribution.filter(m => m.category === selectedCategory)

  const pieData = modelProfitContribution.map(m => ({
    name: m.name,
    value: m.monthlyBenefit,
  }))

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground text-balance">Financial Impact</h1>
              <p className="text-sm text-muted-foreground">모델 기반 최적화의 재무적 성과 분석</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as "all" | "RTO" | "AI/ML")}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 모델</SelectItem>
                  <SelectItem value="RTO">RTO 모델</SelectItem>
                  <SelectItem value="AI/ML">AI/ML 모델</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-01">2025년 1월</SelectItem>
                  <SelectItem value="2024-12">2024년 12월</SelectItem>
                  <SelectItem value="2024-11">2024년 11월</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                리포트 생성
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">전체 현황</TabsTrigger>
              <TabsTrigger value="by-model">모델별 상세</TabsTrigger>
              <TabsTrigger value="roi">ROI 분석</TabsTrigger>
              <TabsTrigger value="opportunities">잠재 기회</TabsTrigger>
            </TabsList>

            {/* Tab 1: Overview */}
            <TabsContent value="overview" className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">월간 총 수익 기여</p>
                        <p className="text-2xl font-bold">{formatCurrency(totalMonthlyBenefit)}<span className="text-sm font-normal text-muted-foreground ml-1">원/월</span></p>
                      </div>
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-green-100 text-green-600">
                        <DollarSign className="h-5 w-5" />
                      </div>
                    </div>
                    <DeltaBadge current={totalMonthlyBenefit} prev={totalMonthlyBenefit - 180} />
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">연간 누적 수익</p>
                        <p className="text-2xl font-bold">{formatCurrency(totalYtdBenefit)}<span className="text-sm font-normal text-muted-foreground ml-1">원</span></p>
                      </div>
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      목표 대비 {achievementRate}% 달성
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">활성 모델 수</p>
                        <p className="text-2xl font-bold">{modelProfitContribution.filter(m => m.status === "active").length}<span className="text-sm font-normal text-muted-foreground ml-1">개</span></p>
                      </div>
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600">
                        <Cpu className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>RTO: {modelProfitContribution.filter(m => m.category === "RTO").length}개</span>
                      <span>/</span>
                      <span>AI/ML: {modelProfitContribution.filter(m => m.category === "AI/ML").length}개</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">예상 연간 ROI</p>
                        <p className="text-2xl font-bold">{((investmentData.projectedAnnualBenefit / investmentData.totalInvestment) * 100).toFixed(0)}<span className="text-sm font-normal text-muted-foreground ml-1">%</span></p>
                      </div>
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-amber-100 text-amber-600">
                        <Calculator className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">투자비 대비 수익률</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Trend */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      월별 수익 기여 추이
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyTotalBenefit}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}`} />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toLocaleString()}백만원`, '']}
                            labelFormatter={(label) => `${label}`}
                          />
                          <Legend />
                          <Area type="monotone" dataKey="RTO" name="RTO 모델" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                          <Area type="monotone" dataKey="AI/ML" name="AI/ML 모델" stackId="1" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.6} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Contribution by Model */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <PieChart className="h-4 w-4" />
                      모델별 수익 기여 비중
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center">
                      <ResponsiveContainer width="50%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value.toLocaleString()}백만원/월`, '']} />
                        </RechartsPie>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {pieData.map((item, idx) => (
                          <div key={item.name} className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span className="flex-1 truncate">{item.name}</span>
                            <span className="font-mono font-medium">{((item.value / totalMonthlyBenefit) * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Category Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">카테고리별 성과 요약</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Activity className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">RTO 모델</h4>
                          <p className="text-xs text-muted-foreground">{modelProfitContribution.filter(m => m.category === "RTO").length}개 모델 운영 중</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">월간 수익 기여</span>
                          <span className="font-medium">{formatCurrency(categoryTotals.RTO)}원</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">전체 비중</span>
                          <span className="font-medium">{((categoryTotals.RTO / totalMonthlyBenefit) * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-chart-2/5 border border-chart-2/20">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                          <Cpu className="h-5 w-5 text-chart-2" />
                        </div>
                        <div>
                          <h4 className="font-medium">AI/ML 모델</h4>
                          <p className="text-xs text-muted-foreground">{modelProfitContribution.filter(m => m.category === "AI/ML").length}개 모델 운영 중</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">월간 수익 기여</span>
                          <span className="font-medium">{formatCurrency(categoryTotals["AI/ML"])}원</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">전체 비중</span>
                          <span className="font-medium">{((categoryTotals["AI/ML"] / totalMonthlyBenefit) * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: By Model */}
            <TabsContent value="by-model" className="space-y-4">
              <div className="grid gap-4">
                {filteredModels.map((model) => (
                  <Card key={model.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        {/* Model Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{model.name}</h3>
                            <Badge variant={model.category === "RTO" ? "default" : "secondary"} className="text-xs">
                              {model.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{model.unit}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{model.description}</p>
                          
                          {/* KPI Breakdown */}
                          <div className="flex flex-wrap gap-3">
                            {model.kpis.map((kpi, idx) => (
                              <div key={idx} className="px-3 py-1.5 bg-muted/50 rounded text-xs">
                                <span className="text-muted-foreground">{kpi.name}:</span>
                                <span className="font-medium ml-1">{kpi.value} {kpi.unit}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Metrics */}
                        <div className="flex gap-6 items-start">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">월간 수익</p>
                            <p className="text-xl font-bold text-green-600">{model.monthlyBenefit}</p>
                            <p className="text-[10px] text-muted-foreground">백만원/월</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">연간 누적</p>
                            <p className="text-xl font-bold">{formatCurrency(model.ytdBenefit)}</p>
                            <p className="text-[10px] text-muted-foreground">원</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">목표 달성률</p>
                            <p className="text-xl font-bold">{((model.ytdBenefit / model.targetBenefit) * 100).toFixed(0)}%</p>
                            <div className="w-16 h-1.5 bg-muted rounded-full mt-1">
                              <div 
                                className="h-full bg-primary rounded-full" 
                                style={{ width: `${Math.min((model.ytdBenefit / model.targetBenefit) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Mini Trend */}
                        <div className="w-32 h-16">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={model.trend.map((v, i) => ({ month: MONTH_LABELS[i], value: v }))}>
                              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Tab 3: ROI Analysis */}
            <TabsContent value="roi" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">투자 대비 수익 분석</CardTitle>
                    <CardDescription>모델 개발 및 운영 투자비 대비 수익 현황</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">총 투자비</p>
                          <p className="text-2xl font-bold">{formatCurrency(investmentData.totalInvestment)}원</p>
                          <p className="text-xs text-muted-foreground mt-1">개발 + 운영 비용</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm text-muted-foreground mb-1">누적 수익</p>
                          <p className="text-2xl font-bold text-green-700">{formatCurrency(investmentData.ytdBenefit)}원</p>
                          <p className="text-xs text-green-600 mt-1">연간 누적 기준</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-muted-foreground mb-1">예상 연간 수익</p>
                          <p className="text-2xl font-bold text-blue-700">{formatCurrency(investmentData.projectedAnnualBenefit)}원</p>
                          <p className="text-xs text-blue-600 mt-1">현재 추세 기준</p>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-3">ROI 계산</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between py-2 border-b">
                            <span>투자비 회수 기간</span>
                            <span className="font-medium">{(investmentData.totalInvestment / (investmentData.projectedAnnualBenefit / 12)).toFixed(1)}개월</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span>연간 ROI</span>
                            <span className="font-medium text-green-600">{((investmentData.projectedAnnualBenefit / investmentData.totalInvestment) * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span>순현재가치 (NPV, 5년)</span>
                            <span className="font-medium text-green-600">{formatCurrency(investmentData.projectedAnnualBenefit * 4 - investmentData.totalInvestment)}원</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">투자 회수 현황</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center py-4">
                        <div className="relative inline-flex items-center justify-center">
                          <svg className="w-32 h-32 transform -rotate-90">
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              stroke="hsl(var(--muted))"
                              strokeWidth="8"
                              fill="none"
                            />
                            <circle
                              cx="64"
                              cy="64"
                              r="56"
                              stroke="hsl(var(--primary))"
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={`${(investmentData.ytdBenefit / investmentData.totalInvestment) * 351.86} 351.86`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute text-center">
                            <p className="text-2xl font-bold">{((investmentData.ytdBenefit / investmentData.totalInvestment) * 100).toFixed(0)}%</p>
                            <p className="text-xs text-muted-foreground">회수율</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-center text-sm text-muted-foreground">
                        <p>투자비 {formatCurrency(investmentData.totalInvestment)}원 중</p>
                        <p className="font-medium text-foreground">{formatCurrency(investmentData.ytdBenefit)}원 회수 완료</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab 4: Opportunities */}
            <TabsContent value="opportunities" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    잠재 최적화 기회
                  </CardTitle>
                  <CardDescription>추가 수익 창출이 가능한 최적화 기회</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {potentialOpportunities.map((opp, idx) => (
                      <div key={idx} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{opp.name}</h4>
                              <Badge variant="outline" className={cn("text-xs",
                                opp.status === "PoC 진행 중" ? "text-blue-600 border-blue-300" :
                                opp.status === "평가 중" ? "text-amber-600 border-amber-300" :
                                "text-muted-foreground"
                              )}>
                                {opp.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{opp.description}</p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-lg font-bold text-green-600">+{opp.estimatedBenefit}</p>
                            <p className="text-xs text-muted-foreground">백만원/월 예상</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>구현 난이도:</span>
                            <Badge variant="secondary" className={cn("text-xs",
                              opp.effort === "High" ? "bg-red-100 text-red-700" :
                              opp.effort === "Medium" ? "bg-amber-100 text-amber-700" :
                              "bg-green-100 text-green-700"
                            )}>
                              {opp.effort}
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm" className="text-xs">
                            상세 보기 <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">총 잠재 수익</p>
                        <p className="text-sm text-muted-foreground">모든 기회 실현 시 예상 추가 수익</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          +{potentialOpportunities.reduce((sum, o) => sum + o.estimatedBenefit, 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">백만원/월</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AppShell>
  )
}
