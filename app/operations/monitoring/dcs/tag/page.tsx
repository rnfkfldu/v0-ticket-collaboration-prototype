"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  TrendingUp,
  Clock,
  Info,
  History
} from "lucide-react"

export default function TagDrilldownPage() {
  const [searchTag, setSearchTag] = useState("TI-2001")

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Tag Drill-down</h1>
          <p className="text-muted-foreground">개별 태그 상세 분석</p>
        </div>

        <div className="flex gap-3 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Tag ID 검색 (예: TI-2001)" 
              className="pl-9"
              value={searchTag}
              onChange={(e) => setSearchTag(e.target.value)}
            />
          </div>
          <Button>검색</Button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Tag Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
                태그 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-xs text-muted-foreground">Tag ID</span>
                <p className="font-mono font-medium">{searchTag}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">설명</span>
                <p className="text-sm">HCR Reactor Inlet Temperature</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Unit</span>
                <Badge variant="outline">HCR</Badge>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">타입</span>
                <p className="text-sm">Analog Input (AI)</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">단위</span>
                <p className="text-sm">°C</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">운전 범위</span>
                <p className="text-sm">380 ~ 400 °C</p>
              </div>
            </CardContent>
          </Card>

          {/* Current Value */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                현재값
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-5xl font-bold">398.5</p>
                <p className="text-lg text-muted-foreground mt-1">°C</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">정상 범위</Badge>
                  <span className="text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />
                    2025-02-04 10:30:15
                  </span>
                </div>
              </div>
              <div className="h-32 bg-muted/30 rounded-lg flex items-center justify-center mt-4">
                <span className="text-sm text-muted-foreground">실시간 트렌드 차트</span>
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                최근 이력
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { time: "10:30:15", value: "398.5°C", status: "normal" },
                  { time: "10:30:10", value: "398.3°C", status: "normal" },
                  { time: "10:30:05", value: "398.7°C", status: "normal" },
                  { time: "10:30:00", value: "399.1°C", status: "normal" },
                  { time: "10:29:55", value: "399.8°C", status: "warning" },
                ].map((record, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span className="text-xs text-muted-foreground">{record.time}</span>
                    <span className={`text-sm font-medium ${record.status === "warning" ? "text-amber-600" : ""}`}>
                      {record.value}
                    </span>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 bg-transparent" size="sm">
                전체 히스토리 조회
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
