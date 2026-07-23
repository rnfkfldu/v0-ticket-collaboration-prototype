"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Headset, Mail, Phone, Clock, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HelpDeskPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <Headset className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">고객지원</h1>
          </div>
        </header>
        <main className="p-6 max-w-3xl space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-6 text-center">
              <Headset className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-bold mb-2">OOP 시스템 Help Desk</h2>
              <p className="text-muted-foreground">시스템 관련 문의사항이 있으시면 아래 채널로 연락해주세요.</p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  전화 문의
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-mono font-bold">02-1234-5678</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>평일 09:00 ~ 18:00</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  이메일 문의
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-mono font-bold">oop-help@company.com</p>
                <p className="text-sm text-muted-foreground mt-2">24시간 접수 가능 (영업일 기준 1일 내 답변)</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                담당자 연락처
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">DX팀 김태영</p>
                    <p className="text-xs text-muted-foreground">시스템 운영 총괄</p>
                  </div>
                  <Badge variant="outline">내선 1234</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">DX팀 이민수</p>
                    <p className="text-xs text-muted-foreground">데이터 연동 / DCS 관련</p>
                  </div>
                  <Badge variant="outline">내선 1235</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">IT운영팀 박성민</p>
                    <p className="text-xs text-muted-foreground">인프라 / 접근 권한</p>
                  </div>
                  <Badge variant="outline">내선 2100</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button variant="outline" className="gap-2 bg-transparent" onClick={() => window.open("https://company.service-now.com", "_blank")}>
              <Headset className="h-4 w-4" />
              IT Service Portal 바로가기
            </Button>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
