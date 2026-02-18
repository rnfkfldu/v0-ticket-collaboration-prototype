"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Calendar, Download } from "lucide-react"
import { useState } from "react"

export default function LongTermTrendsPage() {
  const [period, setPeriod] = useState("6m")

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Long-Term Trends</h1>
            <p className="text-muted-foreground">장기 성능 추세 분석</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1개월</SelectItem>
                <SelectItem value="3m">3개월</SelectItem>
                <SelectItem value="6m">6개월</SelectItem>
                <SelectItem value="1y">1년</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              내보내기
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {[
            { title: "HCR WABT Trend", unit: "HCR", trend: "+7°C/6개월" },
            { title: "CCR Yield Trend", unit: "CCR", trend: "-0.3%/6개월" },
            { title: "CDU Preheat Train ΔT", unit: "CDU", trend: "-5°C/6개월" },
            { title: "Energy Intensity", unit: "전체", trend: "+2.1%/6개월" },
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <LineChart className="h-4 w-4" />
                    {item.title}
                  </CardTitle>
                  <Badge variant="outline">{item.unit}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-sm text-muted-foreground">장기 트렌드 차트</span>
                </div>
                <p className="text-sm">
                  <span className="text-muted-foreground">추세: </span>
                  <span className="font-medium">{item.trend}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
