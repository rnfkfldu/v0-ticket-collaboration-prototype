"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  AlertTriangle, 
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  Eye
} from "lucide-react"
import { cn } from "@/lib/utils"

const ANOMALIES = [
  {
    id: 1,
    type: "Control Valve",
    target: "FV-2001 (HCR Feed Flow Valve)",
    description: "밸브 개도 대비 유량 편차 증가 감지",
    severity: "warning",
    confidence: 85,
    detectedAt: "2025-02-04 09:15",
    status: "active"
  },
  {
    id: 2,
    type: "Heat Exchanger",
    target: "E-1001 (CDU Preheat Exchanger)",
    description: "열전달 효율 저하 추세 (Fouling 의심)",
    severity: "info",
    confidence: 72,
    detectedAt: "2025-02-03 14:30",
    status: "monitoring"
  },
  {
    id: 3,
    type: "Compressor",
    target: "C-3001 (CCR Recycle Compressor)",
    description: "진동 패턴 변화 감지",
    severity: "warning",
    confidence: 78,
    detectedAt: "2025-02-04 08:45",
    status: "active"
  },
]

export default function AnomalyDetectionPage() {
  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Anomaly Detection</h1>
            <p className="text-muted-foreground">AI 기반 이상 징후 탐지 현황</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
              <AlertTriangle className="h-3 w-3" />
              활성 이상징후 2
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Eye className="h-3 w-3" />
              모니터링 1
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Activity className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-muted-foreground">모니터링 태그</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">이상 징후 감지</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold">94.2%</p>
                <p className="text-sm text-muted-foreground">모델 정확도</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">금주 해결</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">감지된 이상 징후</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ANOMALIES.map((anomaly) => (
              <div 
                key={anomaly.id}
                className={cn(
                  "p-4 border rounded-lg",
                  anomaly.severity === "warning" && "border-amber-200 bg-amber-50/50",
                  anomaly.severity === "info" && "border-blue-200 bg-blue-50/50"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">{anomaly.type}</Badge>
                      <Badge 
                        variant={anomaly.status === "active" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {anomaly.status === "active" ? "활성" : "모니터링"}
                      </Badge>
                    </div>
                    <h3 className="font-medium">{anomaly.target}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{anomaly.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {anomaly.detectedAt}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs text-muted-foreground mb-1">신뢰도</p>
                    <p className="text-lg font-bold">{anomaly.confidence}%</p>
                    <Progress value={anomaly.confidence} className="w-20 h-1.5 mt-1" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline">상세 분석</Button>
                  <Button size="sm" variant="outline">이벤트 생성</Button>
                  <Button size="sm" variant="outline">무시</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
