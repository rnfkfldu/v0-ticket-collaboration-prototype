"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Monitor, 
  Maximize2,
  RefreshCw
} from "lucide-react"

const DCS_SCREENS = [
  { id: "G-CDU-001", name: "CDU Main Column", unit: "CDU" },
  { id: "G-CDU-002", name: "CDU Preheat Train", unit: "CDU" },
  { id: "G-VDU-001", name: "VDU Main Column", unit: "VDU" },
  { id: "G-HCR-001", name: "HCR Reactor Section", unit: "HCR" },
  { id: "G-HCR-002", name: "HCR Fractionator", unit: "HCR" },
  { id: "G-CCR-001", name: "CCR Reactor Section", unit: "CCR" },
  { id: "G-CCR-002", name: "CCR Regenerator", unit: "CCR" },
]

export default function DCSScreenViewPage() {
  const [selectedScreen, setSelectedScreen] = useState("G-HCR-001")
  const [selectedUnit, setSelectedUnit] = useState("all")

  const filteredScreens = DCS_SCREENS.filter(s => selectedUnit === "all" || s.unit === selectedUnit)

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">DCS Screen View</h1>
            <p className="text-muted-foreground">DCS 화면 실시간 조회</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
            <Button variant="outline" size="sm">
              <Maximize2 className="h-4 w-4 mr-2" />
              전체화면
            </Button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Screen List */}
          <Card className="w-64 flex-shrink-0">
            <CardHeader className="pb-2">
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger className="w-full">
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
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                {filteredScreens.map((screen) => (
                  <button
                    key={screen.id}
                    onClick={() => setSelectedScreen(screen.id)}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                      selectedScreen === screen.id 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{screen.name}</p>
                        <p className={`text-xs ${selectedScreen === screen.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {screen.id}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Screen View */}
          <Card className="flex-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {DCS_SCREENS.find(s => s.id === selectedScreen)?.name}
                </CardTitle>
                <Badge variant="outline">{selectedScreen}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">DCS Screen: {selectedScreen}</p>
                  <p className="text-sm mt-2">실시간 공정 흐름도가 여기에 표시됩니다</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
