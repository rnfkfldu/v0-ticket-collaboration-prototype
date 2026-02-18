"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Flame, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

const EXCHANGERS = [
  { id: "E-1001", name: "CDU Preheat #1", unit: "CDU", uaRatio: 92, foulingRate: 0.8, status: "good" },
  { id: "E-1002", name: "CDU Preheat #2", unit: "CDU", uaRatio: 85, foulingRate: 1.2, status: "normal" },
  { id: "E-2001", name: "HCR Feed/Effluent", unit: "HCR", uaRatio: 78, foulingRate: 2.1, status: "warning" },
  { id: "E-2002", name: "HCR Product Cooler", unit: "HCR", uaRatio: 88, foulingRate: 1.0, status: "normal" },
  { id: "E-3001", name: "CCR Reactor Heater", unit: "CCR", uaRatio: 95, foulingRate: 0.5, status: "good" },
]

export default function FoulingPage() {
  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Heat Exchanger Fouling</h1>
          <p className="text-muted-foreground">열교환기 오염 현황 모니터링</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">열교환기 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {EXCHANGERS.map((ex) => (
                <div 
                  key={ex.id}
                  className={cn(
                    "flex items-center gap-6 p-4 border rounded-lg",
                    ex.status === "warning" && "border-amber-300 bg-amber-50/50"
                  )}
                >
                  <div className="flex items-center gap-3 w-48">
                    <Flame className={cn(
                      "h-5 w-5",
                      ex.status === "good" && "text-green-500",
                      ex.status === "normal" && "text-primary",
                      ex.status === "warning" && "text-amber-500"
                    )} />
                    <div>
                      <p className="font-medium">{ex.id}</p>
                      <p className="text-xs text-muted-foreground">{ex.name}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{ex.unit}</Badge>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">UA Ratio</span>
                      <span className="text-sm font-medium">{ex.uaRatio}%</span>
                    </div>
                    <Progress value={ex.uaRatio} />
                  </div>
                  <div className="text-right w-28">
                    <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                      <TrendingDown className="h-3 w-3" />
                      Fouling Rate
                    </span>
                    <p className={cn(
                      "font-medium",
                      ex.foulingRate > 1.5 && "text-amber-600"
                    )}>{ex.foulingRate}%/월</p>
                  </div>
                  <Badge variant={ex.status === "warning" ? "outline" : "secondary"}
                    className={cn(ex.status === "warning" && "border-amber-300 text-amber-600")}>
                    {ex.status === "good" ? "양호" : ex.status === "normal" ? "정상" : "주의"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
