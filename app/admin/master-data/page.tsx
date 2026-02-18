"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Server, 
  Database,
  Tag,
  Users,
  Settings,
  Edit,
  ArrowRight,
  BookOpen
} from "lucide-react"

const MASTER_DATA_CATEGORIES = [
  { id: "tags", name: "Tag Master", icon: Tag, count: 1247, description: "공정 태그 정의 및 속성 관리" },
  { id: "equipment", name: "Equipment Master", icon: Server, count: 156, description: "설비 정보 및 계층 구조" },
  { id: "users", name: "User Management", icon: Users, count: 45, description: "사용자 계정 및 권한 관리" },
  { id: "units", name: "Unit Master", icon: Database, count: 8, description: "공정 유닛 정보 관리" },
  { id: "operation-guide", name: "Operation Guide Master", icon: BookOpen, count: 32, description: "운전 가이드 템플릿 및 기준 관리" },
]

export default function MasterDataPage() {
  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Master Data Management</h1>
            <p className="text-muted-foreground">기준 정보 관리</p>
          </div>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            일괄 업로드
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {MASTER_DATA_CATEGORIES.map((cat) => (
            <Card key={cat.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <cat.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{cat.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">{cat.description}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{cat.count.toLocaleString()}건</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      관리
                    </Button>
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
