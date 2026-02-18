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
  DollarSign,
  FileText,
  ClipboardList,
  Truck,
  Upload,
  ExternalLink,
  RefreshCw,
  Eye,
  ChevronRight,
  Fuel,
  Zap,
  Flame,
  Droplets,
  Shield,
  AlertTriangle,
  Settings,
  Link2
} from "lucide-react"

// Price Data (가격 데이터)
const PRICE_DATA = [
  { 
    id: "feed_product_price", 
    name: "Feed & Product Price Set", 
    description: "원료 및 제품 가격 데이터",
    icon: DollarSign,
    source: "ERP Interface",
    tables: 8, 
    records: "24K",
    lastUpdate: "매일 09:00", 
    status: "synced",
    items: [
      { name: "Crude Oil Prices", records: "5.2K", source: "Argus/Platts" },
      { name: "Product Prices (Domestic)", records: "8.4K", source: "ERP" },
      { name: "Product Prices (Export)", records: "6.1K", source: "Trading" },
      { name: "Intermediate Prices", records: "4.3K", source: "Internal" },
    ]
  },
  { 
    id: "utility_cost", 
    name: "Utility Cost Data", 
    description: "유틸리티 원가 및 단가 데이터",
    icon: Zap,
    source: "Cost Accounting",
    tables: 6, 
    records: "12K",
    lastUpdate: "월초 갱신", 
    status: "synced",
    items: [
      { name: "Steam Cost (by pressure)", records: "2.8K", source: "회계시스템" },
      { name: "Power Cost", records: "3.2K", source: "한전 정산" },
      { name: "Cooling Water Cost", records: "2.1K", source: "용수 정산" },
      { name: "Fuel Gas Cost", records: "3.9K", source: "내부 배분" },
    ]
  },
  { 
    id: "fuel_price", 
    name: "Fuel & Energy Price", 
    description: "연료 및 에너지 원가 데이터",
    icon: Fuel,
    source: "Energy Management",
    tables: 5, 
    records: "8K",
    lastUpdate: "주간 갱신", 
    status: "synced",
    items: [
      { name: "Natural Gas Price", records: "2.4K", source: "KOGAS" },
      { name: "LPG Price", records: "1.8K", source: "Trading" },
      { name: "Internal Fuel Price", records: "3.8K", source: "Cost Center" },
    ]
  },
]

// External Interface Data (외부 인터페이스 데이터)
const EXTERNAL_DATA = [
  { 
    id: "work_permit", 
    name: "작업허가서 (PTW)", 
    description: "작업 허가 및 안전 관리 데이터",
    icon: ClipboardList,
    source: "안전관리시스템",
    tables: 12, 
    records: "45K",
    lastUpdate: "실시간", 
    status: "synced",
    items: [
      { name: "Hot Work Permits", records: "12K", source: "PTW System" },
      { name: "Cold Work Permits", records: "18K", source: "PTW System" },
      { name: "Confined Space Entry", records: "8K", source: "PTW System" },
      { name: "Electrical Work Permits", records: "7K", source: "PTW System" },
    ]
  },
  { 
    id: "mofas", 
    name: "MOFAS Data", 
    description: "현장 안전 관리 시스템 데이터",
    icon: Shield,
    source: "MOFAS Interface",
    tables: 15, 
    records: "128K",
    lastUpdate: "실시간", 
    status: "synced",
    items: [
      { name: "Gas Detection Data", records: "42K", source: "MOFAS" },
      { name: "Fire Detection Data", records: "28K", source: "MOFAS" },
      { name: "Emergency Shutdown Records", records: "3.2K", source: "MOFAS" },
      { name: "Safety Interlock Status", records: "54.8K", source: "MOFAS" },
    ]
  },
  { 
    id: "maintenance_order", 
    name: "정비 오더 (MO)", 
    description: "정비 작업 오더 및 이력",
    icon: Settings,
    source: "CMMS/EAM",
    tables: 18, 
    records: "89K",
    lastUpdate: "4시간 전", 
    status: "synced",
    items: [
      { name: "Preventive Maintenance", records: "32K", source: "SAP PM" },
      { name: "Corrective Maintenance", records: "28K", source: "SAP PM" },
      { name: "Predictive Maintenance", records: "18K", source: "SAP PM" },
      { name: "Shutdown Maintenance", records: "11K", source: "SAP PM" },
    ]
  },
]

// Other Reference Data (기타 참조 데이터)
const OTHER_DATA = [
  { 
    id: "weather", 
    name: "기상 데이터", 
    description: "현장 기상 관측 및 예보 데이터",
    icon: Droplets,
    source: "기상청 API",
    tables: 4, 
    records: "156K",
    lastUpdate: "1시간 전", 
    status: "synced",
    items: [
      { name: "현장 기상 관측", records: "52K", source: "AWS" },
      { name: "기상 예보", records: "48K", source: "기상청" },
      { name: "특보 이력", records: "2.8K", source: "기상청" },
    ]
  },
  { 
    id: "shipping", 
    name: "출하/선적 데이터", 
    description: "제품 출하 및 선적 스케줄",
    icon: Truck,
    source: "물류시스템",
    tables: 8, 
    records: "34K",
    lastUpdate: "2시간 전", 
    status: "synced",
    items: [
      { name: "Tank Truck Loading", records: "18K", source: "TMS" },
      { name: "Vessel Loading", records: "8K", source: "Marine" },
      { name: "Pipeline Transfer", records: "8K", source: "Pipeline" },
    ]
  },
  { 
    id: "regulatory", 
    name: "규제/환경 데이터", 
    description: "환경 규제 및 배출 허용 기준",
    icon: AlertTriangle,
    source: "환경관리시스템",
    tables: 10, 
    records: "28K",
    lastUpdate: "일간 갱신", 
    status: "synced",
    items: [
      { name: "Emission Limits", records: "4.2K", source: "환경부" },
      { name: "Discharge Standards", records: "3.8K", source: "환경부" },
      { name: "Compliance Reports", records: "12K", source: "내부" },
      { name: "Permit Conditions", records: "8K", source: "내부" },
    ]
  },
]

export default function ReferenceDataPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("price")

  const getCategoryData = () => {
    switch (selectedCategory) {
      case "price": return PRICE_DATA
      case "external": return EXTERNAL_DATA
      case "other": return OTHER_DATA
      default: return PRICE_DATA
    }
  }

  const currentData = getCategoryData()

  const filteredData = currentData.filter(dm => 
    dm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dm.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "synced":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">동기화됨</Badge>
      case "pending":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">대기중</Badge>
      case "error":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">오류</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Reference Data</h1>
            <p className="text-muted-foreground">외부 인터페이스 및 참조 데이터 카탈로그</p>
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
              <Upload className="h-4 w-4 mr-2" />
              수동 업로드
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              전체 동기화
            </Button>
          </div>
        </div>

        {/* 카테고리 탭 */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList>
            <TabsTrigger value="price" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Price Data
            </TabsTrigger>
            <TabsTrigger value="external" className="gap-2">
              <Link2 className="h-4 w-4" />
              External Interface
            </TabsTrigger>
            <TabsTrigger value="other" className="gap-2">
              <Database className="h-4 w-4" />
              Other Reference
            </TabsTrigger>
          </TabsList>

          {["price", "external", "other"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
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
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {dm.source}
                          </Badge>
                          {getStatusBadge(dm.status)}
                        </div>
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
                            <FileText className="h-3 w-3" /> 레코드
                          </span>
                          <p className="font-medium">{dm.records}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> 갱신 주기
                          </span>
                          <p className="font-medium">{dm.lastUpdate}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Link2 className="h-3 w-3" /> 소스
                          </span>
                          <p className="font-medium">{dm.source}</p>
                        </div>
                      </div>

                      {/* 하위 데이터 항목 */}
                      <div className="space-y-2 mb-4">
                        <span className="text-sm font-medium text-muted-foreground">포함 데이터셋</span>
                        <div className="grid grid-cols-2 gap-2">
                          {dm.items.map((item, idx) => (
                            <div key={idx} className="p-2 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{item.name}</span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>{item.records} records</span>
                                <span>from {item.source}</span>
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
                          <RefreshCw className="h-4 w-4 mr-2" />
                          동기화
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                          <Settings className="h-4 w-4 mr-2" />
                          인터페이스 설정
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
          ))}
        </Tabs>
      </div>
    </AppShell>
  )
}
