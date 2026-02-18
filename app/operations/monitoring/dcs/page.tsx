"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Monitor, 
  Target,
  Bell,
  ArrowRight,
  Activity
} from "lucide-react"

const DCS_FEATURES = [
  {
    title: "DCS Screen View",
    description: "DCS 화면 실시간 조회 및 공정 흐름도 확인",
    href: "/operations/monitoring/dcs/screen",
    icon: Monitor,
    stats: "24개 화면"
  },
  {
    title: "Tag Drill-down",
    description: "개별 태그 상세 분석 및 히스토리 조회",
    href: "/operations/monitoring/dcs/tag",
    icon: Target,
    stats: "1,247개 태그"
  },
  {
    title: "Alarm Context View",
    description: "알람 발생 시점의 공정 상황 분석",
    href: "/operations/monitoring/dcs/alarm",
    icon: Bell,
    stats: "금일 알람 15건"
  },
]

export default function DCSMonitoringPage() {
  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">DCS Monitoring</h1>
          <p className="text-muted-foreground">분산제어시스템 통합 모니터링</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {DCS_FEATURES.map((feature) => (
            <Link key={feature.href} href={feature.href}>
              <Card className="h-full hover:shadow-md transition-all hover:border-primary/50 cursor-pointer">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{feature.stats}</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              DCS 연결 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {["DCS-A (CDU/VDU)", "DCS-B (HCR)", "DCS-C (CCR)", "DCS-D (Utility)"].map((dcs, i) => (
                <div key={dcs} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">{dcs}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">연결됨 | 지연: {2 + i}ms</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
