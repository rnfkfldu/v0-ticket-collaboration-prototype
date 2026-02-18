"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Database, 
  Download,
  Search,
  Table,
  Clock,
  HardDrive,
  Activity,
  Beaker,
  Gauge,
  Thermometer,
  Droplets,
  Zap,
  FileSpreadsheet,
  ChevronRight,
  RefreshCw,
  Eye
} from "lucide-react"

// Operation Data (OPAN 등)
const OPERATION_DATA = [
  { 
    id: "opan", 
    name: "OPAN (Operation Analytics)", 
    description: "일일 운전 데이터 분석 결과",
    icon: Activity,
    tables: 45, 
    records: "1.2M",
    lastUpdate: "10분 전", 
    size: "45.2 GB",
    status: "active",
    items: [
      { name: "Daily Operating Summary", records: "365K", updated: "매일 06:00" },
      { name: "Hourly Process Variables", records: "8.7M", updated: "매시간" },
      { name: "Shift Handover Data", records: "2.1K", updated: "교대 시" },
    ]
  },
  { 
    id: "process_trend", 
    name: "Process Trend Data", 
    description: "공정 트렌드 및 히스토리 데이터",
    icon: Gauge,
    tables: 32, 
    records: "15.8M",
    lastUpdate: "실시간", 
    size: "128.5 GB",
    status: "active",
    items: [
      { name: "Temperature Trends", records: "4.2M", updated: "1분 주기" },
      { name: "Pressure Trends", records: "3.8M", updated: "1분 주기" },
      { name: "Flow Trends", records: "4.5M", updated: "1분 주기" },
    ]
  },
  { 
    id: "energy", 
    name: "Energy Consumption Data", 
    description: "에너지 사용량 및 효율 데이터",
    icon: Zap,
    tables: 18, 
    records: "520K",
    lastUpdate: "30분 전", 
    size: "22.1 GB",
    status: "active",
    items: [
      { name: "Utility Consumption", records: "180K", updated: "매시간" },
      { name: "Steam Balance", records: "95K", updated: "매시간" },
      { name: "Power Usage", records: "245K", updated: "15분 주기" },
    ]
  },
]

// Chemical Analysis Data
const CHEMICAL_DATA = [
  { 
    id: "lab_analysis", 
    name: "Laboratory Analysis", 
    description: "실험실 분석 결과 데이터",
    icon: Beaker,
    tables: 24, 
    records: "89K",
    lastUpdate: "2시간 전", 
    size: "8.2 GB",
    status: "active",
    items: [
      { name: "Feed Quality Analysis", records: "12K", updated: "4시간 주기" },
      { name: "Product Specs", records: "28K", updated: "8시간 주기" },
      { name: "Intermediate Samples", records: "49K", updated: "수시" },
    ]
  },
  { 
    id: "online_analyzer", 
    name: "Online Analyzer Data", 
    description: "실시간 분석기 데이터",
    icon: Thermometer,
    tables: 15, 
    records: "2.4M",
    lastUpdate: "실시간", 
    size: "35.6 GB",
    status: "active",
    items: [
      { name: "GC Analyzer Results", records: "1.2M", updated: "5분 주기" },
      { name: "NIR Analyzer", records: "680K", updated: "1분 주기" },
      { name: "Density/Viscosity", records: "520K", updated: "1분 주기" },
    ]
  },
  { 
    id: "water_quality", 
    name: "Water Quality Data", 
    description: "용수 및 폐수 품질 데이터",
    icon: Droplets,
    tables: 12, 
    records: "156K",
    lastUpdate: "1시간 전", 
    size: "4.8 GB",
    status: "active",
    items: [
      { name: "Cooling Water Quality", records: "52K", updated: "4시간 주기" },
      { name: "Boiler Feed Water", records: "48K", updated: "4시간 주기" },
      { name: "Wastewater Analysis", records: "56K", updated: "8시간 주기" },
    ]
  },
]

export default function DataMartPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("operation")

  const currentData = selectedCategory === "operation" ? OPERATION_DATA : CHEMICAL_DATA

  const filteredData = currentData.filter(dm => 
    dm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dm.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Data Mart</h1>
            <p className="text-muted-foreground">OOP 내부 생성 운전 데이터 카탈로그</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="데이터 검색..." 
                className="pl-9 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              전체 갱신
            </Button>
          </div>
        </div>

        {/* 카테고리 탭 */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList>
            <TabsTrigger value="operation" className="gap-2">
              <Activity className="h-4 w-4" />
              Operation Data
            </TabsTrigger>
            <TabsTrigger value="chemical" className="gap-2">
              <Beaker className="h-4 w-4" />
              Chemical Analysis Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="operation" className="mt-6">
            <div className="grid gap-6">
              {filteredData.map((dm) => (
                <Card key={dm.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <dm.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{dm.name}</CardTitle>
                          <CardDescription>{dm.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-sm mb-4 p-3 bg-muted/30 rounded-lg">
                      <div>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Table className="h-3 w-3" /> 테이블
                        </span>
                        <p className="font-medium">{dm.tables}개</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <FileSpreadsheet className="h-3 w-3" /> 레코드
                        </span>
                        <p className="font-medium">{dm.records}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> 갱신
                        </span>
                        <p className="font-medium">{dm.lastUpdate}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <HardDrive className="h-3 w-3" /> 용량
                        </span>
                        <p className="font-medium">{dm.size}</p>
                      </div>
                    </div>

                    {/* 하위 데이터 항목 */}
                    <div className="space-y-2 mb-4">
                      <span className="text-sm font-medium text-muted-foreground">포함 데이터셋</span>
                      <div className="grid grid-cols-3 gap-2">
                        {dm.items.map((item, idx) => (
                          <div key={idx} className="p-2 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{item.name}</span>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{item.records} records</span>
                              <span>{item.updated}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        <Eye className="h-4 w-4 mr-2" />
                        데이터 조회
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        <Search className="h-4 w-4 mr-2" />
                        스키마 탐색
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="chemical" className="mt-6">
            <div className="grid gap-6">
              {filteredData.map((dm) => (
                <Card key={dm.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                          <dm.icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{dm.name}</CardTitle>
                          <CardDescription>{dm.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-sm mb-4 p-3 bg-muted/30 rounded-lg">
                      <div>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Table className="h-3 w-3" /> 테이블
                        </span>
                        <p className="font-medium">{dm.tables}개</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <FileSpreadsheet className="h-3 w-3" /> 레코드
                        </span>
                        <p className="font-medium">{dm.records}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> 갱신
                        </span>
                        <p className="font-medium">{dm.lastUpdate}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <HardDrive className="h-3 w-3" /> 용량
                        </span>
                        <p className="font-medium">{dm.size}</p>
                      </div>
                    </div>

                    {/* 하위 데이터 항목 */}
                    <div className="space-y-2 mb-4">
                      <span className="text-sm font-medium text-muted-foreground">포함 데이터셋</span>
                      <div className="grid grid-cols-3 gap-2">
                        {dm.items.map((item, idx) => (
                          <div key={idx} className="p-2 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{item.name}</span>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{item.records} records</span>
                              <span>{item.updated}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        <Eye className="h-4 w-4 mr-2" />
                        데이터 조회
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        <Search className="h-4 w-4 mr-2" />
                        스키마 탐색
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
