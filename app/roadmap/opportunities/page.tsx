"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Target, 
  TrendingUp, 
  DollarSign,
  Zap,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react"

const opportunities = [
  {
    id: 1,
    title: "HCR Hydrogen Optimization",
    description: "H2/Oil Ratio 최적화를 통한 수소 소비 절감",
    potential: "$120K/년",
    status: "reviewing",
    confidence: 85,
    unit: "HCR"
  },
  {
    id: 2,
    title: "CDU Reflux Ratio Adjustment",
    description: "증류탑 환류비 조정으로 에너지 절감",
    potential: "$85K/년",
    status: "implementing",
    confidence: 92,
    unit: "CDU"
  },
  {
    id: 3,
    title: "CCR Regenerator Temperature",
    description: "재생기 온도 최적화를 통한 촉매 수명 연장",
    potential: "$200K/년",
    status: "identified",
    confidence: 78,
    unit: "CCR"
  },
]

export default function OptimizationPage() {
  return (
    <AppShell>
      <div className="flex flex-col h-full">
        <header className="border-b bg-background/95 backdrop-blur px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">최적화 기회 발굴</h1>
              <p className="text-sm text-muted-foreground">AI 기반 공정 최적화 기회 식별</p>
            </div>
            <Button>
              <Target className="h-4 w-4 mr-2" />
              새 분석 시작
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Potential</p>
                    <p className="text-2xl font-bold text-green-600">$405K/년</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Opportunities</p>
                    <p className="text-2xl font-bold">3</p>
                  </div>
                  <Target className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Implementing</p>
                    <p className="text-2xl font-bold text-blue-600">1</p>
                  </div>
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Confidence</p>
                    <p className="text-2xl font-bold">85%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Opportunities List */}
          <Card>
            <CardHeader>
              <CardTitle>최적화 기회 목록</CardTitle>
              <CardDescription>AI가 식별한 공정 개선 기회</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {opportunities.map((opp) => (
                  <div key={opp.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{opp.title}</h3>
                          <Badge variant="outline">{opp.unit}</Badge>
                          <Badge 
                            variant={
                              opp.status === "implementing" ? "default" :
                              opp.status === "reviewing" ? "secondary" : "outline"
                            }
                          >
                            {opp.status === "implementing" && <Zap className="h-3 w-3 mr-1" />}
                            {opp.status === "reviewing" && <Clock className="h-3 w-3 mr-1" />}
                            {opp.status === "identified" && <AlertCircle className="h-3 w-3 mr-1" />}
                            {opp.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{opp.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{opp.potential}</p>
                        <p className="text-xs text-muted-foreground">예상 절감액</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs text-muted-foreground">Confidence</span>
                        <Progress value={opp.confidence} className="w-32 h-2" />
                        <span className="text-xs font-medium">{opp.confidence}%</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        상세 보기 <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AppShell>
  )
}
