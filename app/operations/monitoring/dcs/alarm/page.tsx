"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Bell, 
  Clock,
  TrendingUp,
  Monitor
} from "lucide-react"
import { cn } from "@/lib/utils"

const RECENT_ALARMS = [
  { id: 1, tagId: "TI-2001", name: "HCR Reactor Inlet High", time: "09:45:32", severity: "high", unit: "HCR" },
  { id: 2, tagId: "PI-3001", name: "CCR Regenerator Pressure", time: "09:30:15", severity: "medium", unit: "CCR" },
  { id: 3, tagId: "LI-1002", name: "CDU Column Level Low", time: "08:55:00", severity: "low", unit: "CDU" },
]

export default function AlarmContextPage() {
  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Alarm Context View</h1>
          <p className="text-muted-foreground">알람 발생 시점 공정 상황 분석</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Recent Alarms */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                금일 알람
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {RECENT_ALARMS.map((alarm) => (
                <button
                  key={alarm.id}
                  className="w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm">{alarm.tagId}</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        alarm.severity === "high" && "border-red-300 text-red-600",
                        alarm.severity === "medium" && "border-amber-300 text-amber-600"
                      )}
                    >
                      {alarm.severity}
                    </Badge>
                  </div>
                  <p className="text-sm">{alarm.name}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {alarm.time}
                    <Badge variant="secondary" className="text-xs">{alarm.unit}</Badge>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Context View */}
          <Card className="col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">알람 시점 공정 상황</CardTitle>
                <Badge variant="outline">TI-2001 @ 09:45:32</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="font-medium">관련 태그 트렌드</span>
                  </div>
                  <div className="h-40 bg-muted/30 rounded flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">알람 시점 전후 트렌드</span>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Monitor className="h-4 w-4 text-primary" />
                    <span className="font-medium">DCS 화면 스냅샷</span>
                  </div>
                  <div className="h-40 bg-slate-900 rounded flex items-center justify-center">
                    <span className="text-sm text-slate-400">알람 시점 DCS 화면</span>
                  </div>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <span className="font-medium">운전 상황 요약</span>
                <p className="text-sm text-muted-foreground mt-2">
                  알람 발생 10분 전부터 Reactor Inlet Temperature가 점진적으로 상승하는 추세를 보였습니다.
                  동시에 Feed Flow(FI-2001)가 약 3% 감소하였으며, 이로 인해 체류시간이 증가하면서
                  온도 상승에 기여한 것으로 분석됩니다.
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm">상세 분석</Button>
                <Button size="sm" variant="outline">이벤트 생성</Button>
                <Button size="sm" variant="outline">리포트 생성</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
