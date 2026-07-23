export interface Ticket {
  id: string
  title: string
  description: string
  ticketType: "Improvement" | "Trouble" | "Change" | "Analysis" | "Request" | "ModelImprovement" | "ProcessTest" | "QuickInquiry"
  priority: "P1" | "P2" | "P3" | "P4"
  impact: "Safety" | "Quality" | "Throughput" | "Cost" | "Energy" | "Operations" | "Yield"
  owner: string
  requester: string
  status: "Open" | "In Progress" | "Blocked" | "Closed"
  createdDate: string
  dueDate: string
  bottleneck?: string
  accessLevel: "Private" | "Team" | "Public"
  allowedTeams?: string[]
  // 추가 접근 권한 설정
  allowedUsers?: string[] // 추가로 접근 가능한 사용자 목록
  // 에스컬레이션 정보
  escalation?: {
    escalatedTo: string // 에스컬레이션 대상자 (팀장 등)
    escalatedBy: string // 에스컬레이션 요청자
    escalatedAt: string // 에스컬레이션 시간
    reason: string // 에스컬레이션 사유
    status: "pending" | "acknowledged" | "resolved" // 에스컬레이션 상태
    acknowledgedAt?: string
    resolution?: string
  }
  unit?: string
  area?: string
  equipment?: string
  tags?: string[]
  fromTime?: string
  toTime?: string
  context?: {
    unit: string
    area?: string
    equipment?: string
    tags?: string[]
    timeRange?: string
    notes?: string
  }
  workPackages: WorkPackage[]
  closedDate?: string
  executiveSummary?: string
  categoryFields?: TicketCategoryField[]
  messages: TicketMessage[]
  hasUnreadNotification?: boolean
  additionalDetails?: {
    text: string
    dataBoxes: DataInsertBox[]
  }
  // 모델 개선 요청 전용
  modelRequest?: {
    category: "model-rebuild" | "m2m-network" | "apc-activation"
    targetModel?: string
    receivingTeam?: string
  }
  // 실공정 테스트 전용
  processTest?: {
    hypothesis: string
    testStartDate: string
    testEndDate: string
    targetVariables: string[]
    operatingGuide: string
    feedbackDeadline: string
    feedbackContent?: string
    testStatus: "planned" | "in-progress" | "completed" | "feedback-pending" | "closed"
    reviewedByProduction?: boolean
  }
  // 이벤트 프로세스 플로우
  processStatus?: "issued" | "accepted" | "verbal-closed" | "review" | "additional-review" | "publisher-confirm" | "review-complete" | "closed" | "hold"
  processFlow?: EventProcessStep[]
  // 추가 검토자 (여러 명 가능)
  additionalReviewers?: {
    id: string
    name: string
    team: string
    status: "pending" | "in-progress" | "completed"
    assignedAt: string
    completedAt?: string
    opinion?: string
  }[]
  // 종결 리포트
  closureReport?: {
    id: string
    title: string
    summary: string
    background: string
    actions: string
    results: string
    lessons: string
    recommendations: string
    teamOpinions?: { team: string; reviewer: string; opinion: string }[]
    createdDate: string
    author: string
  }
  // 의견 (opinions)
  opinions?: EventOpinion[]
  // 댓글
  comments?: EventComment[]
  // 임시 저장
  draft?: string
}

export interface EventProcessStep {
  step: "issued" | "accepted" | "verbal-closed" | "review" | "additional-review" | "publisher-confirm" | "review-complete" | "closed"
  label: string
  status: "completed" | "current" | "upcoming" | "skipped"
  assignee?: string
  team?: string
  timestamp?: string
}

export interface EventOpinion {
  id: string
  author: string
  team: string
  templateType: string
  templateLabel: string
  fields: { label: string; value: string }[]
  dataBoxes?: DataInsertBox[]
  attachments?: { fileName: string; fileUrl: string }[]
  status: "draft" | "submitted"
  createdAt: string
  submittedAt?: string
}

export interface EventComment {
  id: string
  author: string
  content: string
  timestamp: string
}

export interface WorkPackage {
  id: string
  ticketId: string
  wpType: "Analysis" | "Decision" | "Execution" | "Validation"
  title: string
  description: string
  ownerTeam: string
  assignee?: string // Added assignee field for individual assignment
  status: "Not Started" | "In Progress" | "Blocked" | "Done"
  dueDate: string
  dependency?: string
  blockageReason?: string
  logs: WorkPackageLog[]
  attachments: WorkPackageAttachment[]
}

export interface WorkPackageLog {
  id: string
  author: string
  content: string
  timestamp: string
}

export interface WorkPackageAttachment {
  id: string
  fileName: string
  fileUrl: string
  uploadedBy: string
  uploadedAt: string
}

export interface ProcessData {
  timestamp: string
  mode: string
  throughput: number
  throughputUnit: string
  temperature?: number
  pressure?: number
  kpis: {
    name: string
    value: number
    unit: string
    status: "Normal" | "Warning" | "Critical"
  }[]
  notes?: string
}

export interface TicketCategoryField {
  label: string
  placeholder: string
  required: boolean
}

export interface TicketHandlingData {
  [key: string]: string
}

export interface DataInsertBox {
  id: string
  type: "trend" | "dcs" | "table" | "chart"
  config: {
    tags?: string[]
    timeRange?: string
    graphicType?: string
    title?: string
    unit?: string
    graphicNumber?: string
    rows?: number
    columns?: number
    tableData?: string[][]
    fromDate?: string
    toDate?: string
  }
}

export interface DirectHandlingContent {
  text: string
  dataBoxes: DataInsertBox[]
}

export interface TicketMessage {
  id: string
  ticketId: string
  author: string
  role: "requester" | "assignee" | "system"
  messageType: "opinion" | "inquiry" | "response" | "status_change" | "wp_assignment"
  content: string
  timestamp: string
  attachments?: WorkPackageAttachment[]
  dataBoxes?: DataInsertBox[]
}

export interface TicketInquiry {
  id: string
  content: string
  author: string
  timestamp: string
}
