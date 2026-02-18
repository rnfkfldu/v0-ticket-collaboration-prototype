"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { 
  TrendingUp, 
  TrendingDown,
  Minus,
  Search,
  Filter,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"

const VARIABLES = [
  { tagId: "TI-1001", name: "CDU Column Top Temp", unit: "CDU", value: 125.3, min: 120, max: 130, uom: "°C", trend: "stable" },
  { tagId: "TI-1002", name: "CDU Column Bottom Temp", unit: "CDU", value: 365.2, min: 360, max: 370, uom: "°C", trend: "up" },
  { tagId: "PI-1001", name: "CDU Column Pressure", unit: "CDU", value: 2.15, min: 2.0, max: 2.5, uom: "bar", trend: "stable" },
  { tagId: "FI-1001", name: "CDU Feed Flow", unit: "CDU", value: 485.6, min: 450, max: 500, uom: "m3/h", trend: "down" },
  { tagId: "TI-2001", name: "HCR Reactor Inlet Temp", unit: "HCR", value: 398.5, min: 380, max: 400, uom: "°C", trend: "up" },
  { tagId: "TI-2002", name: "HCR Reactor Outlet Temp", unit: "HCR", value: 415.2, min: 400, max: 420, uom: "°C", trend: "stable" },
  { tagId: "PI-2001", name: "HCR Reactor Pressure", unit: "HCR", value: 165.3, min: 160, max: 170, uom: "bar", trend: "stable" },
  { tagId: "TI-3001", name: "CCR Regenerator Temp", unit: "CCR", value: 525.8, min: 520, max: 540, uom: "°C", trend: "down" },
  { tagId: "AI-3001", name: "CCR Chloride Content", unit: "CCR", value: 1.85, min: 1.5, max: 2.0, uom: "ppm", trend: "stable" },
]

export default function KeyVariablesPage() {
  const [selectedUnit, setSelectedUnit] = useState("all")
  const [search, setSearch] = useState("")

  const filteredVars = VARIABLES.filter(v => {
    if (selectedUnit !== "all" && v.unit !== selectedUnit) return false
    if (search && !v.tagId.toLowerCase().includes(search.toLowerCase()) && !v.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const getValueStatus = (value: number, min: number, max: number) => {
    const range = max - min
    const margin = range * 0.1
    if (value < min + margin || value > max - margin) return "warning"
    return "normal"
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Key Operating Variables</h1>
            <p className="text-muted-foreground">주요 운전 변수 실시간 모니터링</p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Tag ID 또는 이름 검색..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={selectedUnit} onValueChange={setSelectedUnit}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Unit 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 Unit</SelectItem>
              <SelectItem value="CDU">CDU</SelectItem>
              <SelectItem value="VDU">VDU</SelectItem>
              <SelectItem value="HCR">HCR</SelectItem>
              <SelectItem value="CCR">CCR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">변수 목록 ({filteredVars.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-left text-sm">
                    <th className="px-4 py-3 font-medium">Tag ID</th>
                    <th className="px-4 py-3 font-medium">변수명</th>
                    <th className="px-4 py-3 font-medium">Unit</th>
                    <th className="px-4 py-3 font-medium text-right">현재값</th>
                    <th className="px-4 py-3 font-medium text-center">범위</th>
                    <th className="px-4 py-3 font-medium text-center">추세</th>
                    <th className="px-4 py-3 font-medium text-center">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredVars.map((v) => {
                    const status = getValueStatus(v.value, v.min, v.max)
                    return (
                      <tr key={v.tagId} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-sm">{v.tagId}</td>
                        <td className="px-4 py-3 text-sm">{v.name}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">{v.unit}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn(
                            "font-bold",
                            status === "warning" && "text-amber-600"
                          )}>
                            {v.value} {v.uom}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                          {v.min} ~ {v.max}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {v.trend === "up" && <TrendingUp className="h-4 w-4 text-green-500 mx-auto" />}
                          {v.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500 mx-auto" />}
                          {v.trend === "stable" && <Minus className="h-4 w-4 text-muted-foreground mx-auto" />}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={status === "normal" ? "secondary" : "outline"} className={cn(
                            "text-xs",
                            status === "warning" && "bg-amber-100 text-amber-700 border-amber-300"
                          )}>
                            {status === "normal" ? "정상" : "경계"}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
