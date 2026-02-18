"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Cpu, 
  Activity,
  RefreshCw,
  Play,
  Pause,
  TrendingUp,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"

const MODELS = [
  { id: "M001", name: "HCR Yield Predictor", type: "Regression", accuracy: 94.2, status: "active", lastTrain: "2025-01-28", predictions: 1247 },
  { id: "M002", name: "Fouling Rate Estimator", type: "Time Series", accuracy: 89.5, status: "active", lastTrain: "2025-02-01", predictions: 856 },
  { id: "M003", name: "Anomaly Detection (HCR)", type: "Classification", accuracy: 92.1, status: "active", lastTrain: "2025-01-30", predictions: 3420 },
  { id: "M004", name: "Energy Optimizer", type: "Optimization", accuracy: 87.3, status: "paused", lastTrain: "2025-01-15", predictions: 512 },
  { id: "M005", name: "Quality Predictor", type: "Regression", accuracy: 91.8, status: "active", lastTrain: "2025-02-02", predictions: 2104 },
]

export default function AIMLModelsPage() {
  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI / ML Models</h1>
            <p className="text-muted-foreground">AI/ML 모델 현황 및 관리</p>
          </div>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            모델 재학습
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Cpu className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">5</p>
              <p className="text-sm text-muted-foreground">배포된 모델</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Activity className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold">4</p>
              <p className="text-sm text-muted-foreground">활성 모델</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">91.0%</p>
              <p className="text-sm text-muted-foreground">평균 정확도</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-8 w-8 mx-auto text-amber-500 mb-2" />
              <p className="text-2xl font-bold">8,139</p>
              <p className="text-sm text-muted-foreground">금월 예측 건수</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">모델 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MODELS.map((model) => (
                <div key={model.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Cpu className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{model.name}</span>
                      <Badge variant="outline" className="text-xs">{model.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      마지막 학습: {model.lastTrain} | 예측: {model.predictions.toLocaleString()}건
                    </p>
                  </div>
                  <div className="w-32">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">정확도</span>
                      <span className="font-medium">{model.accuracy}%</span>
                    </div>
                    <Progress value={model.accuracy} className="h-1.5" />
                  </div>
                  <Badge variant={model.status === "active" ? "secondary" : "outline"}
                    className={cn(model.status === "active" ? "bg-green-100 text-green-700" : "")}>
                    {model.status === "active" ? "활성" : "일시중지"}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    {model.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
