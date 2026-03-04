"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Zap, Droplets, Flame, Wind } from "lucide-react"

const UTILITIES = [
  { name: "Steam (HP)", icon: Wind, usage: 85, capacity: "120 T/hr", status: "normal" },
  { name: "Steam (MP)", icon: Wind, usage: 72, capacity: "80 T/hr", status: "normal" },
  { name: "Steam (LP)", icon: Wind, usage: 68, capacity: "150 T/hr", status: "normal" },
  { name: "Cooling Water", icon: Droplets, usage: 78, capacity: "5000 m3/hr", status: "normal" },
  { name: "Fuel Gas", icon: Flame, usage: 65, capacity: "50,000 Nm3/hr", status: "normal" },
  { name: "Electric Power", icon: Zap, usage: 82, capacity: "45 MW", status: "warning" },
]

export default function UtilityInterconnectionPage() {
  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">유틸리티 연계</h1>
          <p className="text-muted-foreground">유틸리티 공급 현황 및 공정 간 연계</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {UTILITIES.map((util) => (
            <Card key={util.name} className={util.status === "warning" ? "border-amber-300" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <util.icon className="h-5 w-5 text-primary" />
                    {util.name}
                  </CardTitle>
                  <Badge variant={util.status === "normal" ? "secondary" : "outline"} 
                    className={util.status === "warning" ? "border-amber-300 text-amber-600" : ""}>
                    {util.status === "normal" ? "정상" : "주의"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">사용량</span>
                    <span className="font-medium">{util.usage}%</span>
                  </div>
                  <Progress value={util.usage} className={util.usage > 80 ? "bg-amber-100" : ""} />
                  <p className="text-xs text-muted-foreground">설계 용량: {util.capacity}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
