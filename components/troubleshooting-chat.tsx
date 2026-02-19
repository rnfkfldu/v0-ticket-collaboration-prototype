"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Send, Users, AlertTriangle, Plus, X, Clock, CheckCircle, FileText, TrendingUp, Monitor, Link2, AtSign, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { saveTicket } from "@/lib/storage"
import type { Ticket, WorkPackage } from "@/lib/types"
import { DataVisualization } from "./data-visualization"
import { ChatMilestoneTracker } from "./chat-milestone-tracker" // Declare the ChatMilestoneTracker variable

interface ChatMessage {
  id: string
  author: string
  team: string
  content: string
  timestamp: string
  type: "message" | "system" | "action" | "data" | "template"
  dataAttachment?: {
    type: "trend" | "dcs"
    title: string
    config?: any
  }
  templateData?: {
    templateName: string
    templateId: string
    assignedTeam: string
    content?: string
    status: "pending" | "completed"
  }
  mentions?: string[]
}

interface Participant {
  name: string
  team: string
  role: "initiator" | "participant"
  online: boolean
}

const TEAMS = [
  "Process Engineering",
  "Operations",
  "Maintenance",
  "Instrumentation",
  "Safety",
  "Quality",
  "Scheduling",
  "Equipment Engineering"
]

const TEAM_MEMBERS: Record<string, string[]> = {
  "Process Engineering": ["김지수", "이철수", "박영희"],
  "Operations": ["최민수", "정수진", "강현우"],
  "Maintenance": ["윤상철", "임재현", "한미영"],
  "Instrumentation": ["송태호", "오민지", "서준혁"],
  "Safety": ["장은비", "배성민", "조현아"],
  "Quality": ["신유진", "권도현", "류미래"],
  "Scheduling": ["김조정", "박계획", "이운영"],
  "Equipment Engineering": ["최장치", "정설비", "강기계"]
}

// 긴급도별 자동 매핑 팀
const URGENCY_TEAM_MAPPING: Record<"high" | "medium" | "low", { teams: string[]; managers: string[] }> = {
  high: {
    teams: ["Operations", "Process Engineering", "Scheduling", "Equipment Engineering", "Instrumentation", "Maintenance", "Safety"],
    managers: ["부문장 김철수", "팀장 이영희", "팀장 박민수"]
  },
  medium: {
    teams: ["Operations", "Process Engineering", "Maintenance"],
    managers: ["팀장 이영희"]
  },
  low: {
    teams: ["Process Engineering"],
    managers: []
  }
}

// 팀별 문서 양식 (확장)
const TEAM_DOCUMENT_FORMS: Record<string, { id: string; name: string; description: string; fields: string[] }[]> = {
  "Operations": [
    { id: "ops-plan", name: "운영 계획서", description: "일일/주간 운영 계획", fields: ["계획 기간", "주요 운전 목표", "예상 처리량", "특이사항"] },
    { id: "tank-arrange", name: "탱크 어레인지 계획서", description: "탱크 이송 및 배치 계획", fields: ["대상 탱크", "이송량", "예정 시간", "담당자"] },
    { id: "shift-handover", name: "교대 인수인계서", description: "교대 시 운전 현황", fields: ["현재 운전 상태", "주의 사항", "진행 중 작업", "인계자/인수자"] }
  ],
  "Scheduling": [
    { id: "sched-plan", name: "운영 스케줄 계획서", description: "생산 스케줄 조정 계획", fields: ["조정 사유", "변경 전/후 계획", "영향 범위", "승인자"] },
    { id: "feed-change", name: "원료 변경 계획서", description: "원료 전환 계획", fields: ["변경 원료", "전환 시점", "예상 영향", "조치 사항"] }
  ],
  "Equipment Engineering": [
    { id: "equip-review", name: "장치 검토서", description: "장치 상태 기술 검토", fields: ["대상 장치", "검토 항목", "검토 결과", "권고 사항"] },
    { id: "capacity-check", name: "용량 검토서", description: "장치 용량 적정성 검토", fields: ["설계 용량", "현재 부하", "여유율", "개선 방안"] }
  ],
  "Maintenance": [
    { id: "work-permit", name: "작업 허가서", description: "정비 작업 허가 요청", fields: ["작업 내용", "작업 위치", "소요 시간", "안전 조치"] },
    { id: "repair-report", name: "정비 완료 보고서", description: "정비 작업 완료 보고", fields: ["작업 내용", "사용 자재", "작업 결과", "향후 조치"] }
  ],
  "Process Engineering": [
    { id: "root-cause", name: "근본 원인 분석서", description: "RCA 양식", fields: ["현상", "원인 분석", "근본 원인", "재발 방지 대책"] },
    { id: "process-change", name: "공정 변경 요청서", description: "MOC 요청", fields: ["변경 내용", "변경 사유", "위험성 평가", "승인자"] }
  ],
  "Instrumentation": [
    { id: "calibration", name: "계기 교정 기록서", description: "계기 교정 작업 기록", fields: ["대상 계기", "교정 전/후 값", "허용 오차", "담당자"] },
    { id: "loop-check", name: "루프 체크 시트", description: "제어 루프 점검", fields: ["루프 번호", "점검 항목", "점검 결과", "조치 사항"] }
  ],
  "Safety": [
    { id: "safety-review", name: "안전 검토서", description: "작업 안전성 검토", fields: ["작업 내용", "위험 요소", "안전 조치", "검토자"] },
    { id: "incident-report", name: "사고/아차사고 보고서", description: "사고 발생 보고", fields: ["발생 일시", "발생 장소", "사고 내용", "조치 사항"] }
  ],
  "Quality": [
    { id: "quality-check", name: "품질 검사서", description: "제품 품질 검사 기록", fields: ["검사 항목", "규격", "측정값", "판정"] },
    { id: "spec-deviation", name: "규격 이탈 보고서", description: "제품 규격 이탈 시 보고", fields: ["이탈 항목", "규격값", "실측값", "조치 계획"] }
  ]
}

const UNITS = ["CDU", "VDU", "HCR", "CCR", "NHT", "RFCC"]

// 팀별 사전 정의 템플릿
const TEAM_TEMPLATES: Record<string, { id: string; name: string; description: string }[]> = {
  "Operations": [
    { id: "tank-arrange", name: "탱크 어레인지 계획서", description: "탱크 이송 및 배치 계획 양식" },
    { id: "shift-handover", name: "교대 인수인계서", description: "교대 시 운전 현황 인수인계" },
    { id: "emergency-response", name: "비상 대응 보고서", description: "비상 상황 대응 기록" }
  ],
  "Maintenance": [
    { id: "work-permit", name: "작업 허가서", description: "정비 작업 허가 요청서" },
    { id: "equipment-check", name: "장치 점검표", description: "장치별 점검 항목 체크리스트" },
    { id: "repair-report", name: "정비 완료 보고서", description: "정비 작업 완료 보고" }
  ],
  "Process Engineering": [
    { id: "root-cause", name: "근본 원인 분석서", description: "RCA(Root Cause Analysis) 양식" },
    { id: "process-change", name: "공정 변경 요청서", description: "MOC 요청 양식" },
    { id: "optimization-plan", name: "최적화 계획서", description: "공정 최적화 검토 계획" }
  ],
  "Instrumentation": [
    { id: "calibration", name: "계기 교정 기록서", description: "계기 교정 작업 기록" },
    { id: "loop-check", name: "루프 체크 시트", description: "제어 루프 점검 양식" }
  ],
  "Safety": [
    { id: "safety-review", name: "안전 검토서", description: "작업 안전성 검토" },
    { id: "incident-report", name: "사고/아차사고 보고서", description: "사고 발생 보고 양식" }
  ],
  "Quality": [
    { id: "quality-check", name: "품질 검사서", description: "제품 품질 검사 기록" },
    { id: "spec-deviation", name: "규격 이탈 보고서", description: "제품 규격 이탈 시 보고" }
  ]
}

// 초기 참여자 생성 함수
const getInitialParticipants = (level: "high" | "medium" | "low"): Participant[] => {
  const mapping = URGENCY_TEAM_MAPPING[level]
  const participants: Participant[] = [
    { name: "김지수", team: "Process Engineering", role: "initiator", online: true }
  ]
  
  mapping.teams.forEach(team => {
    const members = TEAM_MEMBERS[team]
    if (members && members.length > 0 && team !== "Process Engineering") {
      participants.push({
        name: members[0],
        team,
        role: "participant",
        online: Math.random() > 0.3
      })
    }
  })
  
  mapping.managers.forEach(manager => {
    participants.push({
      name: manager,
      team: "Management",
      role: "participant",
      online: true
    })
  })
  
  return participants
}

export function TroubleshootingChat() {
  const router = useRouter()
  const [isSetup, setIsSetup] = useState(true)
  const [troubleTitle, setTroubleTitle] = useState("")
  const [selectedUnit, setSelectedUnit] = useState("")
  const [urgencyLevel, setUrgencyLevel] = useState<"high" | "medium" | "low">("high")
  const [participants, setParticipants] = useState<Participant[]>(() => getInitialParticipants("high"))
  const [newParticipantTeam, setNewParticipantTeam] = useState("")
  const [newParticipantName, setNewParticipantName] = useState("")
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isResolved, setIsResolved] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 새로운 상태들
  const [showDataDialog, setShowDataDialog] = useState(false)
  const [dataType, setDataType] = useState<"trend" | "dcs">("trend")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [selectedTemplateTeam, setSelectedTemplateTeam] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [templateContents, setTemplateContents] = useState<Record<string, string>>({})
  const [showMentionList, setShowMentionList] = useState(false)
  const [mentionFilter, setMentionFilter] = useState("")
  const [showConvertDialog, setShowConvertDialog] = useState(false)
  const [ticketTitle, setTicketTitle] = useState("")
  const [ticketDescription, setTicketDescription] = useState("")
  const [ticketPriority, setTicketPriority] = useState<"P1" | "P2" | "P3">("P2")
  const [ticketOwner, setTicketOwner] = useState("")
  const [aiSummary, setAiSummary] = useState("")
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [selectedAutoTeams, setSelectedAutoTeams] = useState<string[]>(URGENCY_TEAM_MAPPING.high.teams)
  const [selectedManagers, setSelectedManagers] = useState<string[]>(URGENCY_TEAM_MAPPING.high.managers)
  const [showDocFormDialog, setShowDocFormDialog] = useState(false)
  const [selectedDocTeam, setSelectedDocTeam] = useState("")
  const [selectedDocForm, setSelectedDocForm] = useState<string>("")
  const [docFormValues, setDocFormValues] = useState<Record<string, string>>({})

  // 긴급도 변경 시 자동 팀 매핑
  const handleUrgencyChange = (level: "high" | "medium" | "low") => {
    setUrgencyLevel(level)
    const mapping = URGENCY_TEAM_MAPPING[level]
    setSelectedAutoTeams(mapping.teams)
    setSelectedManagers(mapping.managers)
    
    // 자동 매핑된 팀의 담당자를 참여자로 추가
    const newParticipants: Participant[] = [
      { name: "김지수", team: "Process Engineering", role: "initiator", online: true }
    ]
    
    mapping.teams.forEach(team => {
      const members = TEAM_MEMBERS[team]
      if (members && members.length > 0) {
        newParticipants.push({
          name: members[0],
          team,
          role: "participant",
          online: Math.random() > 0.3
        })
      }
    })
    
    mapping.managers.forEach(manager => {
      newParticipants.push({
        name: manager,
        team: "Management",
        role: "participant",
        online: true
      })
    })
    
    setParticipants(newParticipants)
  }

  // 팀 체크박스 토글
  const toggleTeam = (team: string) => {
    if (selectedAutoTeams.includes(team)) {
      setSelectedAutoTeams(selectedAutoTeams.filter(t => t !== team))
      setParticipants(participants.filter(p => p.team !== team))
    } else {
      setSelectedAutoTeams([...selectedAutoTeams, team])
      const members = TEAM_MEMBERS[team]
      if (members && members.length > 0) {
        setParticipants([...participants, {
          name: members[0],
          team,
          role: "participant",
          online: Math.random() > 0.3
        }])
      }
    }
  }

  // 매니저 체크박스 토글
  const toggleManager = (manager: string) => {
    if (selectedManagers.includes(manager)) {
      setSelectedManagers(selectedManagers.filter(m => m !== manager))
      setParticipants(participants.filter(p => p.name !== manager))
    } else {
      setSelectedManagers([...selectedManagers, manager])
      setParticipants([...participants, {
        name: manager,
        team: "Management",
        role: "participant",
        online: true
      }])
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addParticipant = () => {
    if (newParticipantTeam && newParticipantName) {
      setParticipants([...participants, {
        name: newParticipantName,
        team: newParticipantTeam,
        role: "participant",
        online: Math.random() > 0.3
      }])
      setNewParticipantTeam("")
      setNewParticipantName("")
    }
  }

  const removeParticipant = (name: string) => {
    setParticipants(participants.filter(p => p.name !== name || p.role === "initiator"))
  }

  const startChat = () => {
    if (!troubleTitle || !selectedUnit) return
    
    setIsSetup(false)
    const timestamp = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    
    setMessages([
      {
        id: "1",
        author: "System",
        team: "",
        content: `[${selectedUnit}] ${troubleTitle} - Troubleshooting 채팅방이 개설되었습니다.`,
        timestamp,
        type: "system"
      },
      {
        id: "2",
        author: "System",
        team: "",
        content: `참여자: ${participants.map(p => `${p.name}(${p.team})`).join(", ")}`,
        timestamp,
        type: "system"
      }
    ])
  }

  // @ 멘션 처리
  const handleMessageChange = (value: string) => {
    setNewMessage(value)
    const lastAtIndex = value.lastIndexOf("@")
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentionList(true)
      setMentionFilter("")
    } else if (lastAtIndex !== -1) {
      const afterAt = value.slice(lastAtIndex + 1)
      if (!afterAt.includes(" ")) {
        setShowMentionList(true)
        setMentionFilter(afterAt)
      } else {
        setShowMentionList(false)
      }
    } else {
      setShowMentionList(false)
    }
  }

  const insertMention = (name: string) => {
    const lastAtIndex = newMessage.lastIndexOf("@")
    const newText = newMessage.slice(0, lastAtIndex) + `@${name} `
    setNewMessage(newText)
    setShowMentionList(false)
  }

  const getAllMembers = () => {
    const allMembers: { name: string; team: string }[] = []
    Object.entries(TEAM_MEMBERS).forEach(([team, members]) => {
      members.forEach(name => {
        if (mentionFilter === "" || name.includes(mentionFilter)) {
          allMembers.push({ name, team })
        }
      })
    })
    return allMembers
  }

  const sendMessage = () => {
    if (!newMessage.trim()) return
    
    // Extract mentions from message
    const mentionRegex = /@(\S+)/g
    const mentions: string[] = []
    let match
    while ((match = mentionRegex.exec(newMessage)) !== null) {
      mentions.push(match[1])
    }
    
    const timestamp = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      author: "김지수",
      team: "Process Engineering",
      content: newMessage,
      timestamp,
      type: "message",
      mentions: mentions.length > 0 ? mentions : undefined
    }
    
    setMessages([...messages, newMsg])
    setNewMessage("")

    // Simulate other participants responding
    setTimeout(() => {
      const responders = participants.filter(p => p.role === "participant" && p.online)
      if (responders.length > 0) {
        const responder = responders[Math.floor(Math.random() * responders.length)]
        const responses = [
          "확인했습니다. 현장에서 점검 중입니다.",
          "DCS에서 해당 태그 확인 중입니다.",
          "관련 이력 확인해보겠습니다.",
          "유사한 케이스가 지난달에 있었던 것 같습니다.",
          "추가 데이터 필요하시면 말씀해주세요."
        ]
        const responseMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          author: responder.name,
          team: responder.team,
          content: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
          type: "message"
        }
        setMessages(prev => [...prev, responseMsg])
      }
    }, 2000)
  }

  // 데이터 삽입 (트렌드/DCS)
  const addDataAttachment = () => {
    const timestamp = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    const config = {
      tags: selectedTags.length > 0 ? selectedTags : ["TI-2001", "PI-2001"],
      unit: selectedUnit,
      graphicNumber: dataType === "dcs" ? "G-2001" : undefined
    }
    
    const dataMsg: ChatMessage = {
      id: Date.now().toString(),
      author: "김지수",
      team: "Process Engineering",
      content: dataType === "trend" ? "관련 트렌드 데이터를 첨부합니다." : "DCS 화면을 첨부합니다.",
      timestamp,
      type: "data",
      dataAttachment: {
        type: dataType,
        title: dataType === "trend" ? `${selectedUnit} 트렌드 (${selectedTags.join(", ") || "TI-2001, PI-2001"})` : `${selectedUnit} DCS 화면`,
        config
      }
    }
    setMessages([...messages, dataMsg])
    setShowDataDialog(false)
    setSelectedTags([])
  }

// 문서 양식 요청 전송
  const sendDocFormRequest = () => {
    if (!selectedDocTeam || !selectedDocForm) return
    
    const form = TEAM_DOCUMENT_FORMS[selectedDocTeam]?.find(f => f.id === selectedDocForm)
    if (!form) return
    
    const timestamp = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    const formMsg: ChatMessage = {
      id: Date.now().toString(),
      author: "김지수",
      team: "Process Engineering",
      content: `[문서 양식 요청] ${selectedDocTeam} 팀에 "${form.name}" 작성을 요청합니다.`,
      timestamp,
      type: "template",
      templateData: {
        templateName: form.name,
        templateId: form.id,
        assignedTeam: selectedDocTeam,
        status: "pending"
      }
    }
    setMessages([...messages, formMsg])
    setShowDocFormDialog(false)
    
    // Simulate form being filled
    const assignedTeamCopy = selectedDocTeam
    const formCopy = form
    setTimeout(() => {
      const filledValues = formCopy.fields.reduce((acc, field) => {
        acc[field] = `[${field}] 작성된 내용`
        return acc
      }, {} as Record<string, string>)
      
      const filledMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        author: TEAM_MEMBERS[assignedTeamCopy]?.[0] || "담당자",
        team: assignedTeamCopy,
        content: `"${formCopy.name}" 작성을 완료했습니다.`,
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        type: "template",
        templateData: {
          templateName: formCopy.name,
          templateId: formCopy.id,
          assignedTeam: assignedTeamCopy,
          content: `[${formCopy.name}]\n` + formCopy.fields.map(f => `- ${f}: ${filledValues[f]}`).join("\n"),
          status: "completed"
        }
      }
      setMessages(prev => [...prev, filledMsg])
    }, 4000)
    
    setSelectedDocTeam("")
    setSelectedDocForm("")
    setDocFormValues({})
  }

  // 템플릿 전송
  const sendTemplate = () => {
  if (!selectedTemplateTeam || !selectedTemplate) return
  
  const template = TEAM_TEMPLATES[selectedTemplateTeam]?.find(t => t.id === selectedTemplate)
    if (!template) return
    
    const timestamp = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    const templateMsg: ChatMessage = {
      id: Date.now().toString(),
      author: "김지수",
      team: "Process Engineering",
      content: `${selectedTemplateTeam} 팀에 "${template.name}" 작성을 요청합니다.`,
      timestamp,
      type: "template",
      templateData: {
        templateName: template.name,
        templateId: template.id,
        assignedTeam: selectedTemplateTeam,
        status: "pending"
      }
    }
    setMessages([...messages, templateMsg])
    setShowTemplateDialog(false)
    setSelectedTemplateTeam("")
    setSelectedTemplate("")
    
    // Simulate template being filled after some time
    setTimeout(() => {
      const filledMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        author: TEAM_MEMBERS[selectedTemplateTeam]?.[0] || "담당자",
        team: selectedTemplateTeam,
        content: `"${template.name}" 작성을 완료했습니다.`,
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        type: "template",
        templateData: {
          templateName: template.name,
          templateId: template.id,
          assignedTeam: selectedTemplateTeam,
          content: `[${template.name} 작성 내용]\n- 작성일: ${new Date().toLocaleDateString()}\n- 담당자: ${TEAM_MEMBERS[selectedTemplateTeam]?.[0]}\n- 상세 내용이 기록되었습니다.`,
          status: "completed"
        }
      }
      setMessages(prev => [...prev, filledMsg])
      setTemplateContents(prev => ({
        ...prev,
        [template.id]: filledMsg.templateData?.content || ""
      }))
    }, 5000)
  }

  const resolveIssue = () => {
    const timestamp = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    setMessages([...messages, {
      id: Date.now().toString(),
      author: "System",
      team: "",
      content: "이슈가 해결 완료로 표시되었습니다. 이벤트으로 변환하여 저장하세요.",
      timestamp,
      type: "system"
    }])
    setIsResolved(true)
    setTicketTitle(troubleTitle)
  }

  // AI 요약 생성
  const generateAISummary = () => {
    setIsGeneratingSummary(true)
    
    // Simulate AI summary generation
    setTimeout(() => {
      const userMessages = messages.filter(m => m.type === "message")
      const dataAttachments = messages.filter(m => m.type === "data")
      const templateMessages = messages.filter(m => m.type === "template" && m.templateData?.status === "completed")
      
      const summary = `## 트러블슈팅 요약

### 발생 현상
${troubleTitle} (${selectedUnit} 공정)

### 참여자
${participants.map(p => `- ${p.name} (${p.team})`).join("\n")}

### 주요 논의 내용
${userMessages.slice(0, 5).map(m => `- [${m.author}] ${m.content.slice(0, 50)}...`).join("\n")}

### 첨부된 데이터
${dataAttachments.length > 0 ? dataAttachments.map(d => `- ${d.dataAttachment?.title}`).join("\n") : "- 없음"}

### 작성된 문서
${templateMessages.length > 0 ? templateMessages.map(t => `- ${t.templateData?.templateName} (${t.templateData?.assignedTeam})`).join("\n") : "- 없음"}

### 결론
${urgencyLevel === "high" ? "긴급 대응이 필요했던" : "정기적인"} 트러블슈팅이 완료되었습니다. 총 ${messages.length}개의 메시지가 교환되었으며, ${participants.length}명이 참여했습니다.`

      setAiSummary(summary)
      setTicketDescription(summary)
      setIsGeneratingSummary(false)
    }, 2000)
  }

  // 이벤트으로 변환
  const convertToTicket = () => {
    setShowConvertDialog(true)
    generateAISummary()
  }

  const saveAsTicket = () => {
    // 템플릿 내용을 Work Package로 변환
    const templateWPs: WorkPackage[] = messages
      .filter(m => m.type === "template" && m.templateData?.status === "completed")
      .map((m, index) => ({
        id: `wp-template-${Date.now()}-${index}`,
        ticketId: "",
        wpType: "Analysis" as const,
        title: m.templateData?.templateName || "문서",
        description: `${m.templateData?.assignedTeam} 팀에서 작성한 문서`,
        ownerTeam: m.templateData?.assignedTeam || "",
        status: "Done" as const,
        dueDate: new Date().toISOString().split("T")[0],
        logs: [{
          id: `log-${Date.now()}-${index}`,
          author: m.author,
          content: m.templateData?.content || "",
          timestamp: new Date().toISOString()
        }],
        attachments: []
      }))

    const newTicket: Ticket = {
      id: Date.now().toString(),
      title: ticketTitle || troubleTitle,
      description: ticketDescription || aiSummary,
      ticketType: "Trouble",
      priority: ticketPriority,
      impact: "Throughput",
      owner: ticketOwner || "김지수",
      requester: "김지수",
      status: "Closed",
      createdDate: new Date().toISOString().split("T")[0],
      dueDate: new Date().toISOString().split("T")[0],
      closedDate: new Date().toISOString(),
      accessLevel: "Team",
      allowedTeams: participants.map(p => p.team),
      unit: selectedUnit,
      workPackages: templateWPs,
      messages: messages.map(m => ({
        id: m.id,
        ticketId: "",
        author: m.author,
        role: m.author === "김지수" ? "requester" as const : "assignee" as const,
        messageType: "response" as const,
        content: m.content,
        timestamp: new Date().toISOString()
      })),
      executiveSummary: aiSummary
    }

    saveTicket(newTicket)
    router.push("/")
  }

  const addTrendData = () => {
    setDataType("trend")
    setShowDataDialog(true)
  }

  if (isSetup) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Troubleshooting 채팅방 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trouble Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">트러블 제목 *</label>
              <Input
                placeholder="예: CDU Overhead 온도 급상승"
                value={troubleTitle}
                onChange={(e) => setTroubleTitle(e.target.value)}
              />
            </div>

            {/* Unit Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">관련 공정 *</label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="공정 선택" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Urgency Level */}
            <div className="space-y-2">
              <label className="text-sm font-medium">긴급도</label>
              <div className="flex gap-2">
                <Button
                  variant={urgencyLevel === "high" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleUrgencyChange("high")}
                  className={urgencyLevel === "high" ? "bg-red-500 hover:bg-red-600" : ""}
                >
                  긴급
                </Button>
                <Button
                  variant={urgencyLevel === "medium" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleUrgencyChange("medium")}
                  className={urgencyLevel === "medium" ? "bg-orange-500 hover:bg-orange-600" : ""}
                >
                  보통
                </Button>
                <Button
                  variant={urgencyLevel === "low" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleUrgencyChange("low")}
                  className={urgencyLevel === "low" ? "bg-blue-500 hover:bg-blue-600" : ""}
                >
                  낮음
                </Button>
              </div>
            </div>

            {/* 자동 매핑된 팀 체크박스 */}
            <div className="space-y-3">
              <label className="text-sm font-medium">참여 팀 (긴급도에 따라 자동 선택됨)</label>
              <div className="grid grid-cols-2 gap-2">
                {TEAMS.map(team => (
                  <label key={team} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={selectedAutoTeams.includes(team)}
                      onChange={() => toggleTeam(team)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{team}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 매니저 자동 포함 */}
            {(urgencyLevel === "high" || urgencyLevel === "medium") && (
              <div className="space-y-3">
                <label className="text-sm font-medium">자동 포함 매니저</label>
                <div className="flex flex-wrap gap-2">
                  {URGENCY_TEAM_MAPPING[urgencyLevel].managers.map(manager => (
                    <label key={manager} className="flex items-center gap-2 px-3 py-1.5 border rounded-full cursor-pointer hover:bg-muted/50">
                      <input
                        type="checkbox"
                        checked={selectedManagers.includes(manager)}
                        onChange={() => toggleManager(manager)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium">{manager}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Participants */}
            <div className="space-y-3">
              <label className="text-sm font-medium">참여자 초대</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {participants.map(p => (
                  <Badge 
                    key={p.name} 
                    variant={p.role === "initiator" ? "default" : "secondary"}
                    className="flex items-center gap-1 py-1"
                  >
                    <span className={`w-2 h-2 rounded-full ${p.online ? "bg-green-500" : "bg-gray-400"}`}></span>
                    {p.name} ({p.team})
                    {p.role !== "initiator" && (
                      <X 
                        className="h-3 w-3 cursor-pointer ml-1" 
                        onClick={() => removeParticipant(p.name)}
                      />
                    )}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Select value={newParticipantTeam} onValueChange={setNewParticipantTeam}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="팀 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAMS.map(team => (
                      <SelectItem key={team} value={team}>{team}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={newParticipantName} 
                  onValueChange={setNewParticipantName}
                  disabled={!newParticipantTeam}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="담당자 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {newParticipantTeam && TEAM_MEMBERS[newParticipantTeam]?.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={addParticipant}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={startChat}
              disabled={!troubleTitle || !selectedUnit}
            >
              채팅방 시작
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

return (
  <div className="max-w-6xl mx-auto">
  <div className="grid grid-cols-5 gap-4 h-[calc(100vh-200px)]">
    {/* Milestone Tracker */}
    <div className="col-span-1">
      <Card className="h-full overflow-y-auto">
        <CardContent className="p-3">
          <ChatMilestoneTracker 
            messages={messages} 
            troubleTitle={troubleTitle} 
            isResolved={isResolved} 
          />
        </CardContent>
      </Card>
    </div>
    
    {/* Chat Area */}
    <div className="col-span-3 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="py-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={urgencyLevel === "high" ? "destructive" : urgencyLevel === "medium" ? "default" : "secondary"}>
                    {urgencyLevel === "high" ? "긴급" : urgencyLevel === "medium" ? "보통" : "낮음"}
                  </Badge>
                  <CardTitle className="text-base">[{selectedUnit}] {troubleTitle}</CardTitle>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  진행중
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.type === "system" ? "justify-center" : msg.author === "김지수" ? "justify-end" : "justify-start"}`}>
                  {msg.type === "system" ? (
                    <div className="bg-muted px-4 py-2 rounded-full text-sm text-muted-foreground">
                      {msg.content}
                    </div>
                  ) : (
                    <div className={`max-w-[70%] ${msg.author === "김지수" ? "items-end" : "items-start"} flex flex-col`}>
                      {msg.author !== "김지수" && (
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-primary/10">{msg.author[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{msg.author}</span>
                          <span className="text-xs text-muted-foreground">{msg.team}</span>
                        </div>
                      )}
                      <div className={`rounded-lg px-4 py-2 ${msg.author === "김지수" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.content.split(/(@\S+)/g).map((part, i) => 
                            part.startsWith("@") ? (
                              <span key={i} className="text-blue-400 font-medium">{part}</span>
                            ) : part
                          )}
                        </p>
                        {msg.dataAttachment && (
                          <div className="mt-2 rounded border overflow-hidden bg-background">
                            <div className="flex items-center gap-2 text-xs p-2 bg-muted/50 border-b">
                              {msg.dataAttachment.type === "trend" ? <TrendingUp className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                              {msg.dataAttachment.title}
                            </div>
                            <div className="p-2">
                              <DataVisualization 
                                box={{
                                  id: msg.id,
                                  type: msg.dataAttachment.type,
                                  config: msg.dataAttachment.config || {}
                                }}
                              />
                            </div>
                          </div>
                        )}
                        {msg.templateData && (
                          <div className={`mt-2 rounded border ${msg.templateData.status === "completed" ? "border-green-500 bg-green-500/10" : "border-orange-500 bg-orange-500/10"}`}>
                            <div className="flex items-center gap-2 p-2">
                              <FileText className={`h-4 w-4 ${msg.templateData.status === "completed" ? "text-green-500" : "text-orange-500"}`} />
                              <span className="text-sm font-medium">{msg.templateData.templateName}</span>
                              <Badge variant={msg.templateData.status === "completed" ? "default" : "secondary"} className="text-xs">
                                {msg.templateData.status === "completed" ? "작성 완료" : "작성 대기"}
                              </Badge>
                            </div>
                            {msg.templateData.status === "completed" && msg.templateData.content && (
                              <div className="px-3 pb-2 text-xs text-muted-foreground whitespace-pre-wrap">
                                {msg.templateData.content}
                              </div>
                            )}
                            {msg.templateData.status === "pending" && (
                              <div className="px-3 pb-2 text-xs text-muted-foreground">
                                {msg.templateData.assignedTeam} 팀에서 작성 중...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">{msg.timestamp}</span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </CardContent>
            <div className="p-4 border-t">
              {isResolved ? (
                <Button className="w-full" onClick={convertToTicket}>
                  <FileText className="h-4 w-4 mr-2" />
                  이벤트으로 변환하여 저장
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={addTrendData} title="트렌드 데이터 추가">
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => { setDataType("dcs"); setShowDataDialog(true) }} title="DCS 화면 추가">
                      <Monitor className="h-4 w-4" />
                    </Button>
<Button variant="outline" size="icon" onClick={() => setShowTemplateDialog(true)} title="템플릿 요청">
  <Link2 className="h-4 w-4" />
  </Button>
  <Button variant="outline" size="icon" onClick={() => setShowDocFormDialog(true)} title="문서 양식 요청" className="bg-transparent">
  <FileText className="h-4 w-4" />
  </Button>
  <Button variant="outline" size="icon" onClick={() => setNewMessage(newMessage + "@")} title="사용자 멘션">
                      <AtSign className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="relative">
                    {showMentionList && (
                      <div className="absolute bottom-full left-0 w-64 mb-1 bg-card border rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                        <div className="p-2 text-xs text-muted-foreground border-b">사용자 선택</div>
                        {getAllMembers().map(member => (
                          <div 
                            key={member.name}
                            className="px-3 py-2 hover:bg-muted cursor-pointer flex items-center gap-2"
                            onClick={() => insertMention(member.name)}
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs">{member.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{member.name}</span>
                            <span className="text-xs text-muted-foreground">{member.team}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        placeholder="메시지를 입력하세요... (@로 멘션)"
                        value={newMessage}
                        onChange={(e) => handleMessageChange(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        className="flex-1"
                      />
                      <Button onClick={sendMessage}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                참여자 ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {participants.map(p => (
                <div key={p.name} className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full ${p.online ? "bg-green-500" : "bg-gray-400"}`}></span>
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.team}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {!isResolved && (
            <Button variant="outline" className="w-full bg-transparent" onClick={resolveIssue}>
              <CheckCircle className="h-4 w-4 mr-2" />
              이슈 해결 완료
            </Button>
          )}
        </div>
      </div>

      {/* 데이터 삽입 다이얼로그 */}
      <Dialog open={showDataDialog} onOpenChange={setShowDataDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dataType === "trend" ? "트렌드 데이터 삽입" : "DCS 화면 삽입"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button 
                variant={dataType === "trend" ? "default" : "outline"} 
                size="sm"
                onClick={() => setDataType("trend")}
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                트렌드
              </Button>
              <Button 
                variant={dataType === "dcs" ? "default" : "outline"} 
                size="sm"
                onClick={() => setDataType("dcs")}
              >
                <Monitor className="h-4 w-4 mr-1" />
                DCS 화면
              </Button>
            </div>
            {dataType === "trend" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">태그 선택</label>
                <div className="flex flex-wrap gap-2">
                  {["TI-2001", "TI-2002", "PI-2001", "FI-2001", "LI-2001"].map(tag => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(selectedTags.filter(t => t !== tag))
                        } else {
                          setSelectedTags([...selectedTags, tag])
                        }
                      }}
                    >
                      {selectedTags.includes(tag) ? "+" : ""} {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {dataType === "dcs" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">그래픽 번호: G-2001 ({selectedUnit})</label>
                <p className="text-sm text-muted-foreground">선택한 공정의 DCS 화면을 삽입합니다.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDataDialog(false)}>취소</Button>
            <Button onClick={addDataAttachment}>삽입</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 템��릿 전송 다이얼로그 */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>템플릿 요청 전송</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">대상 팀 선택</label>
              <Select value={selectedTemplateTeam} onValueChange={(v) => { setSelectedTemplateTeam(v); setSelectedTemplate("") }}>
                <SelectTrigger>
                  <SelectValue placeholder="팀 선택" />
                </SelectTrigger>
                <SelectContent>
                  {TEAMS.map(team => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTemplateTeam && (
              <div className="space-y-2">
                <label className="text-sm font-medium">템플릿 선택</label>
                <div className="space-y-2">
                  {TEAM_TEMPLATES[selectedTemplateTeam]?.map(template => (
                    <div
                      key={template.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedTemplate === template.id ? "border-primary bg-primary/5" : "hover:border-muted-foreground"}`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-muted-foreground">{template.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>취소</Button>
            <Button onClick={sendTemplate} disabled={!selectedTemplateTeam || !selectedTemplate}>
              <Link2 className="h-4 w-4 mr-1" />
              요청 전송
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 이벤트 변환 다이얼로그 */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              이벤트으로 변환
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">이벤트 제목 *</label>
              <Input 
                value={ticketTitle} 
                onChange={(e) => setTicketTitle(e.target.value)}
                placeholder="이벤트 제목 입력"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">우선순위</label>
                <Select value={ticketPriority} onValueChange={(v: "P1" | "P2" | "P3") => setTicketPriority(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P1">P1 - 긴급</SelectItem>
                    <SelectItem value="P2">P2 - 높음</SelectItem>
                    <SelectItem value="P3">P3 - 보통</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">담당자</label>
                <Select value={ticketOwner} onValueChange={setTicketOwner}>
                  <SelectTrigger>
                    <SelectValue placeholder="담당자 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {participants.map(p => (
                      <SelectItem key={p.name} value={p.name}>{p.name} (${p.team})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">AI 요약</label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={generateAISummary}
                  disabled={isGeneratingSummary}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {isGeneratingSummary ? "생성 중..." : "다시 생성"}
                </Button>
              </div>
              {isGeneratingSummary ? (
                <div className="h-32 flex items-center justify-center bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    AI가 대화 내용을 분석하고 있습니다...
                  </div>
                </div>
              ) : (
                <Textarea 
                  value={ticketDescription} 
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="AI가 대화 내용을 요약합니다..."
                  className="min-h-[200px] font-mono text-xs"
                />
              )}
            </div>

            {messages.some(m => m.type === "template" && m.templateData?.status === "completed") && (
              <div className="space-y-2">
                <label className="text-sm font-medium">포함될 문서 ({messages.filter(m => m.type === "template" && m.templateData?.status === "completed").length}건)</label>
                <div className="space-y-2">
                  {messages.filter(m => m.type === "template" && m.templateData?.status === "completed").map(m => (
                    <div key={m.id} className="p-2 bg-muted rounded-lg flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{m.templateData?.templateName}</span>
                      <span className="text-xs text-muted-foreground">- {m.templateData?.assignedTeam}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">위 문서들은 이벤트의 Work Package로 자동 저장됩니다.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>취소</Button>
            <Button onClick={saveAsTicket} disabled={!ticketTitle || isGeneratingSummary}>
              <FileText className="h-4 w-4 mr-1" />
              이벤트 저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 문서 양식 요청 다이얼로그 */}
      <Dialog open={showDocFormDialog} onOpenChange={setShowDocFormDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              문서 양식 요청
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">대상 팀 선택</label>
              <Select value={selectedDocTeam} onValueChange={(v) => { setSelectedDocTeam(v); setSelectedDocForm("") }}>
                <SelectTrigger>
                  <SelectValue placeholder="팀 선택" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(TEAM_DOCUMENT_FORMS).map(team => (
                    <SelectItem key={team} value={team}>[{team}]</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedDocTeam && TEAM_DOCUMENT_FORMS[selectedDocTeam] && (
              <div className="space-y-2">
                <label className="text-sm font-medium">문서 양식 선택</label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {TEAM_DOCUMENT_FORMS[selectedDocTeam].map(form => (
                    <div
                      key={form.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedDocForm === form.id ? "border-primary bg-primary/5" : "hover:border-muted-foreground"}`}
                      onClick={() => setSelectedDocForm(form.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{selectedDocTeam}</Badge>
                        <span className="font-medium text-sm">{form.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{form.description}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {form.fields.map(field => (
                          <span key={field} className="text-xs bg-muted px-2 py-0.5 rounded">{field}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocFormDialog(false)}>취소</Button>
            <Button onClick={sendDocFormRequest} disabled={!selectedDocTeam || !selectedDocForm}>
              <FileText className="h-4 w-4 mr-1" />
              양식 요청 전송
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
