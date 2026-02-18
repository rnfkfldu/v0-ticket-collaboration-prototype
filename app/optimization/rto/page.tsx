"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Activity, 
  Target,
  CheckCircle,
  XCircle,
  Play,
  Settings
} from "lucide-react"
import { cn } from "@/lib/utils"

const RTO_UNITS = [
  { 
    unit: "HCR", 
    name: "HCR Optimizer", 
    status: "running",
    lastRun: "10분 전",
    benefit: "$15,200/일",
    variables: 24,
    constraints: 18
  },
  { 
    unit: "CCR", 
    name: "CCR Optimizer", 
    status: "running",
    lastRun: "8분 전",
    benefit: "$8,500/일",
    variables: 18,
    constraints: 12
  },
  { 
    unit: "CDU", 
    name: "CDU Optimizer", 
    status: "stopped",
    lastRun: "2시간 전",
    benefit: "-",
    variables: 32,
    constraints: 28
  },
]

export default function RTOModelsPage() {
  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">RTO Models</h1>
            <p className="text-muted-foreground">실시간 최적화 모델 현황</p>
          </div>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            RTO 설정
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {RTO_UNITS.map((rto) => (
            <Card key={rto.unit} className={cn(
              rto.status === "stopped" && "border-gray-300 bg-gray-50/50"
            )}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center font-bold",
                      rto.status === "running" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    )}>
                      {rto.unit}
                    </div>
                    <div>
                      <CardTitle className="text-base">{rto.name}</CardTitle>
                      <div className="flex items-center gap-1 mt-1">
                        {rto.status === "running" ? (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            실행 중
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <XCircle className="h-3 w-3 mr-1" />
                            중지됨
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">마지막 실행</span>
                    <p className="font-medium">{rto.lastRun}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">예상 이익</span>
                    <p className="font-medium text-green-600">{rto.benefit}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">최적화 변수</span>
                    <p className="font-medium">{rto.variables}개</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">제약 조건</span>
                    <p className="font-medium">{rto.constraints}개</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant={rto.status === "running" ? "outline" : "default"} className="flex-1">
                    <Play className="h-4 w-4 mr-1" />
                    {rto.status === "running" ? "재실행" : "시작"}
                  </Button>
                  <Button size="sm" variant="outline">상세</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
