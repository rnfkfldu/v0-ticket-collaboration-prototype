"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  Plus,
  Edit,
  Trash2,
  Star,
  Clock,
  User
} from "lucide-react"

const DASHBOARDS = [
  { id: 1, name: "HCR 주요 지표", description: "수소화분해 공정 핵심 운전 변수", tags: 12, starred: true, updatedAt: "2025-02-04", owner: "김지수" },
  { id: 2, name: "에너지 모니터링", description: "전체 공정 에너지 사용량 추적", tags: 8, starred: true, updatedAt: "2025-02-03", owner: "이민호" },
  { id: 3, name: "CCR 촉매 현황", description: "연속재생 촉매 성능 지표", tags: 6, starred: false, updatedAt: "2025-02-01", owner: "김지수" },
  { id: 4, name: "품질 관리", description: "제품 품질 스펙 모니터링", tags: 15, starred: false, updatedAt: "2025-01-28", owner: "박영희" },
]

export default function CustomDashboardsPage() {
  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Custom Dashboards</h1>
            <p className="text-muted-foreground">개인화된 모니터링 대시보드 관리</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            새 대시보드
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {DASHBOARDS.map((dash) => (
            <Card key={dash.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <LayoutDashboard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {dash.name}
                        {dash.starred && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">{dash.description}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">{dash.tags} 태그</Badge>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {dash.owner}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {dash.updatedAt}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
