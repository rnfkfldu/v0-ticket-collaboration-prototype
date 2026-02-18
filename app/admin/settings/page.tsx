"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Settings, 
  Bell,
  Shield,
  Database,
  Mail,
  Clock,
  Save
} from "lucide-react"

export default function SystemSettingsPage() {
  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">시스템 설정 및 환경 구성</p>
        </div>

        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">일반</TabsTrigger>
            <TabsTrigger value="notifications">알림</TabsTrigger>
            <TabsTrigger value="security">보안</TabsTrigger>
            <TabsTrigger value="integrations">연동</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  일반 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>자동 데이터 갱신</Label>
                    <p className="text-sm text-muted-foreground">실시간 데이터 자동 새로고침</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>갱신 주기</Label>
                    <p className="text-sm text-muted-foreground">데이터 갱신 간격 (초)</p>
                  </div>
                  <Input type="number" defaultValue="30" className="w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>다크 모드</Label>
                    <p className="text-sm text-muted-foreground">화면 테마 설정</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  알림 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>이메일 알림</Label>
                    <p className="text-sm text-muted-foreground">중요 알람 이메일 발송</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>푸시 알림</Label>
                    <p className="text-sm text-muted-foreground">브라우저 푸시 알림</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS 알림</Label>
                    <p className="text-sm text-muted-foreground">긴급 알람 SMS 발송</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  보안 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>2단계 인증</Label>
                    <p className="text-sm text-muted-foreground">로그인 시 추가 인증 요구</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>세션 타임아웃 (분)</Label>
                    <p className="text-sm text-muted-foreground">비활성 시 자동 로그아웃</p>
                  </div>
                  <Input type="number" defaultValue="30" className="w-24" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  외부 시스템 연동
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "DCS Interface", status: "connected" },
                  { name: "Historian", status: "connected" },
                  { name: "LIMS", status: "connected" },
                  { name: "CMMS", status: "disconnected" },
                ].map((system) => (
                  <div key={system.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{system.name}</span>
                    <Badge variant={system.status === "connected" ? "secondary" : "outline"}
                      className={system.status === "connected" ? "bg-green-100 text-green-700" : ""}>
                      {system.status === "connected" ? "연결됨" : "미연결"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button>
            <Save className="h-4 w-4 mr-2" />
            설정 저장
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
