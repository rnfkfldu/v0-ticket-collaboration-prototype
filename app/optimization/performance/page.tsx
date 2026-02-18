"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  LineChart, 
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign
} from "lucide-react"
import { cn } from "@/lib/utils"

const KPIS = [
  { name: "처리량 달성률", value: 96.5, target: 95, unit: "%", trend: "up", status: "good" },
  { name: "에너지 효율", value: 92.3, target: 94, unit: "%", trend: "down", status: "warning" },
  { name: "제품 품질 달성률", value: 98.1, target: 97, unit: "%", trend: "up", status: "good" },
  { name: "운전 비용 절감", value: 4.2, target: 5, unit: "M$/월", trend: "up", status: "normal" },
]

export default function PerformanceTrackingPage() {
  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Performance Tracking</h1>
          <p className="text-muted-foreground">최적화 성과 추적 및 KPI 모니터링</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {KPIS.map((kpi) => (
            <Card key={kpi.name} className={cn(
              kpi.status === "warning" && "border-amber-300"
            )}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center",
                    kpi.status === "good" && "bg-green-100 text-green-700",
                    kpi.status === "normal" && "bg-primary/10 text-primary",
                    kpi.status === "warning" && "bg-amber-100 text-amber-700"
                  )}>
                    {kpi.name.includes("비용") ? <DollarSign className="h-5 w-5" /> : <Target className="h-5 w-5" />}
                  </div>
                  {kpi.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{kpi.name}</p>
                <p className="text-2xl font-bold mt-1">
                  {kpi.value}{kpi.unit === "%" ? "%" : ` ${kpi.unit}`}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={(kpi.value / kpi.target) * 100} className="flex-1 h-1.5" />
                  <span className="text-xs text-muted-foreground">목표: {kpi.target}{kpi.unit === "%" ? "%" : ""}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              월별 성과 추이
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">월별 KPI 추이 차트</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
