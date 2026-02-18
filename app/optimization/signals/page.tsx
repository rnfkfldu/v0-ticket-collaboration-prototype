"use client"

import React from "react"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  Filter,
  Search,
  Bell,
  CheckCircle,
  Clock,
  DollarSign,
  Thermometer,
  Droplets,
  Gauge,
  ExternalLink
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const SIGNALS = [
  {
    id: "SIG-001",
    title: "HCR Reactor WABT 최적화 여지",
    unit: "HCR",
    category: "temperature",
    impact: "high",
    estimatedGain: "$45K/월",
    confidence: 92,
    status: "active",
    description: "현재 WABT 대비 2-3C 낮은 운전이 가능하며, 촉매 수명 연장 및 에너지 절감 효과 예상",
    source: "AI/ML Model",
    detectedAt: "2025-02-01",
    relatedTag: "TI-2001"
  },
  {
    id: "SIG-002",
    title: "CDU Feed Preheat 최적화",
    unit: "CDU",
    category: "energy",
    impact: "medium",
    estimatedGain: "$28K/월",
    confidence: 85,
    status: "active",
    description: "Heat integration 개선을 통한 Fired heater duty 절감 가능",
    source: "RTO Model",
    detectedAt: "2025-01-28",
    relatedTag: "TI-1015"
  },
  {
    id: "SIG-003",
    title: "VDU Reflux Ratio 조정",
    unit: "VDU",
    category: "yield",
    impact: "high",
    estimatedGain: "$62K/월",
    confidence: 78,
    status: "reviewing",
    description: "Reflux ratio 감소를 통한 제품 수율 향상 및 에너지 절감 동시 달성 가능",
    source: "AI/ML Model",
    detectedAt: "2025-02-03",
    relatedTag: "FI-1502"
  },
  {
    id: "SIG-004",
    title: "CCR Regenerator Air Flow 최적화",
    unit: "CCR",
    category: "process",
    impact: "low",
    estimatedGain: "$12K/월",
    confidence: 88,
    status: "implemented",
    description: "촉매 재생 효율 향상을 위한 Air flow 미세 조정",
    source: "RTO Model",
    detectedAt: "2025-01-15",
    relatedTag: "FI-3001"
  },
  {
    id: "SIG-005",
    title: "Hydrogen Makeup 절감",
    unit: "HCR",
    category: "cost",
    impact: "medium",
    estimatedGain: "$35K/월",
    confidence: 81,
    status: "active",
    description: "H2 소비량 최적화를 통한 원가 절감",
    source: "AI/ML Model",
    detectedAt: "2025-02-02",
    relatedTag: "FI-2050"
  },
]

const IMPACT_CONFIG: Record<string, { label: string; color: string }> = {
  high: { label: "High", color: "bg-red-100 text-red-700 border-red-200" },
  medium: { label: "Medium", color: "bg-amber-100 text-amber-700 border-amber-200" },
  low: { label: "Low", color: "bg-green-100 text-green-700 border-green-200" },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-blue-100 text-blue-700 border-blue-200" },
  reviewing: { label: "Reviewing", color: "bg-purple-100 text-purple-700 border-purple-200" },
  implemented: { label: "Implemented", color: "bg-green-100 text-green-700 border-green-200" },
  dismissed: { label: "Dismissed", color: "bg-gray-100 text-gray-700 border-gray-200" },
}

const CATEGORY_ICON: Record<string, React.ElementType> = {
  temperature: Thermometer,
  energy: Zap,
  yield: TrendingUp,
  process: Gauge,
  cost: DollarSign,
}

export default function OptimizationSignalsPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [unitFilter, setUnitFilter] = useState("all")
  const [impactFilter, setImpactFilter] = useState("all")

  const filtered = SIGNALS.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase())
    const matchUnit = unitFilter === "all" || s.unit === unitFilter
    const matchImpact = impactFilter === "all" || s.impact === impactFilter
    return matchSearch && matchUnit && matchImpact
  })

  const totalGain = SIGNALS.filter(s => s.status === "active" || s.status === "reviewing")
    .reduce((sum, s) => sum + Number.parseInt(s.estimatedGain.replace(/[^0-9]/g, "")), 0)

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <h1 className="text-lg font-semibold">Optimization Signals</h1>
            <p className="text-sm text-muted-foreground mt-1">AI/ML 및 RTO 모델이 감지한 최적화 기회 신호</p>
          </div>
        </header>

        <main className="p-6 space-y-6">
          {/* 요약 카드 */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-blue-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Active Signals</p>
                    <p className="text-2xl font-bold">{SIGNALS.filter(s => s.status === "active").length}</p>
                  </div>
                  <Zap className="h-8 w-8 text-blue-500/30" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">예상 총 이득</p>
                    <p className="text-2xl font-bold text-green-600">${totalGain}K/월</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">평균 Confidence</p>
                    <p className="text-2xl font-bold">{Math.round(SIGNALS.reduce((s, sig) => s + sig.confidence, 0) / SIGNALS.length)}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-muted-foreground/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Implemented</p>
                    <p className="text-2xl font-bold">{SIGNALS.filter(s => s.status === "implemented").length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500/30" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 필터 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Signal 검색..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Unit" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 Unit</SelectItem>
                <SelectItem value="CDU">CDU</SelectItem>
                <SelectItem value="VDU">VDU</SelectItem>
                <SelectItem value="HCR">HCR</SelectItem>
                <SelectItem value="CCR">CCR</SelectItem>
              </SelectContent>
            </Select>
            <Select value={impactFilter} onValueChange={setImpactFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Impact" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 Impact</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Signal 목록 */}
          <div className="space-y-3">
            {filtered.map(signal => {
              const CategoryIcon = CATEGORY_ICON[signal.category] || Zap
              return (
                <Card key={signal.id} className="hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <CategoryIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-medium">{signal.title}</h3>
                          <Badge variant="outline" className={cn("text-xs", IMPACT_CONFIG[signal.impact].color)}>
                            {IMPACT_CONFIG[signal.impact].label} Impact
                          </Badge>
                          <Badge variant="outline" className={cn("text-xs", STATUS_CONFIG[signal.status].color)}>
                            {STATUS_CONFIG[signal.status].label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{signal.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">{signal.unit}</Badge>
                          <span>Source: {signal.source}</span>
                          <span>Confidence: {signal.confidence}%</span>
                          <span>Tag: {signal.relatedTag}</span>
                          <span>{signal.detectedAt}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-green-600">{signal.estimatedGain}</p>
                        <p className="text-xs text-muted-foreground">예상 이득</p>
                        <Button size="sm" variant="outline" className="mt-2 gap-1 bg-transparent text-xs">
                          상세 <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </main>
      </div>
    </AppShell>
  )
}
