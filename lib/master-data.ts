// 기준정보 관리 - Master Data Types and Initial Data

// ===== 1. 공정 단위 (Process Unit) =====
export interface ProcessUnit {
  id: string
  name: string
  fullName: string
  description: string
  defaultAssignee: string
  backupAssignees: string[]
  dcsScreenId: string
  pidDrawingId: string
  operationGuideId?: string
}

export const PROCESS_UNITS: ProcessUnit[] = [
  { id: "CDU", name: "CDU", fullName: "Crude Distillation Unit", description: "원유 상압증류 공정", defaultAssignee: "김운전", backupAssignees: ["이현장", "박교대"], dcsScreenId: "DCS-CDU-001", pidDrawingId: "PID-CDU-001" },
  { id: "VDU", name: "VDU", fullName: "Vacuum Distillation Unit", description: "감압증류 공정", defaultAssignee: "김운전", backupAssignees: ["이현장", "박교대"], dcsScreenId: "DCS-VDU-001", pidDrawingId: "PID-VDU-001" },
  { id: "HCR", name: "HCR", fullName: "Hydrocracker", description: "수첨분해 공정", defaultAssignee: "최기술", backupAssignees: ["김엔지니어", "이공정"], dcsScreenId: "DCS-HCR-001", pidDrawingId: "PID-HCR-001", operationGuideId: "OG-HCR-001" },
  { id: "VGOFCC", name: "VGOFCC", fullName: "VGO Fluid Catalytic Cracker", description: "VGO 유동층 촉매분해 공정", defaultAssignee: "최기술", backupAssignees: ["김엔지니어"], dcsScreenId: "DCS-FCC-001", pidDrawingId: "PID-FCC-001" },
  { id: "CCR", name: "CCR", fullName: "Continuous Catalytic Reformer", description: "연속촉매개질 공정", defaultAssignee: "박엔지니어", backupAssignees: ["김엔지니어"], dcsScreenId: "DCS-CCR-001", pidDrawingId: "PID-CCR-001" },
  { id: "NHT", name: "NHT", fullName: "Naphtha Hydrotreater", description: "나프타 수첨탈황 공정", defaultAssignee: "박엔지니어", backupAssignees: ["이공정"], dcsScreenId: "DCS-NHT-001", pidDrawingId: "PID-NHT-001" },
  { id: "SRU", name: "SRU", fullName: "Sulfur Recovery Unit", description: "유황회수 공정", defaultAssignee: "이환경", backupAssignees: ["김유틸"], dcsScreenId: "DCS-SRU-001", pidDrawingId: "PID-SRU-001" },
  { id: "UTIL", name: "UTIL", fullName: "Utilities", description: "유틸리티 공정", defaultAssignee: "김유틸", backupAssignees: ["이환경"], dcsScreenId: "DCS-UTIL-001", pidDrawingId: "PID-UTIL-001" },
]

// ===== 2. 설비 마스터 (Equipment Master) =====
export interface Equipment {
  id: string
  name: string
  type: "열교환기" | "반응기" | "탑" | "펌프" | "압축기" | "가열로" | "저장탱크" | "기타"
  processUnit: string
  pidNumber: string
  manufacturer?: string
  installDate?: string
  lastMaintenanceDate?: string
  criticality: "A" | "B" | "C"  // A: 핵심, B: 중요, C: 일반
  relatedTags: string[]
  dcsScreenId?: string
}

export const EQUIPMENT_MASTER: Equipment[] = [
  { id: "E-2001", name: "HCR Feed/Effluent Exchanger #1", type: "열교환기", processUnit: "HCR", pidNumber: "PID-HCR-001-A", manufacturer: "Alfa Laval", installDate: "2015-03-15", lastMaintenanceDate: "2024-04-10", criticality: "A", relatedTags: ["TI-2001", "TI-2002", "FI-2001"], dcsScreenId: "DCS-HCR-EX01" },
  { id: "E-2002", name: "HCR Feed/Effluent Exchanger #2", type: "열교환기", processUnit: "HCR", pidNumber: "PID-HCR-001-A", manufacturer: "Alfa Laval", installDate: "2015-03-15", lastMaintenanceDate: "2024-04-10", criticality: "A", relatedTags: ["TI-2003", "TI-2004", "FI-2001"], dcsScreenId: "DCS-HCR-EX01" },
  { id: "R-2001", name: "HCR Reactor #1", type: "반응기", processUnit: "HCR", pidNumber: "PID-HCR-002", manufacturer: "Chevron Lummus", installDate: "2010-06-20", lastMaintenanceDate: "2023-10-15", criticality: "A", relatedTags: ["TI-2101", "TI-2102", "TI-2103", "PI-2101"], dcsScreenId: "DCS-HCR-RX01" },
  { id: "R-2002", name: "HCR Reactor #2", type: "반응기", processUnit: "HCR", pidNumber: "PID-HCR-002", manufacturer: "Chevron Lummus", installDate: "2010-06-20", lastMaintenanceDate: "2023-10-15", criticality: "A", relatedTags: ["TI-2201", "TI-2202", "TI-2203", "PI-2201"], dcsScreenId: "DCS-HCR-RX02" },
  { id: "H-1001", name: "CDU Atmospheric Heater", type: "가열로", processUnit: "CDU", pidNumber: "PID-CDU-003", manufacturer: "Heurtey Petrochem", installDate: "2008-01-10", lastMaintenanceDate: "2024-01-20", criticality: "A", relatedTags: ["TI-1001", "TI-1002", "FI-1001", "FI-1002"], dcsScreenId: "DCS-CDU-HT01" },
  { id: "T-1001", name: "CDU Atmospheric Column", type: "탑", processUnit: "CDU", pidNumber: "PID-CDU-001", manufacturer: "Process Engineering", installDate: "2005-06-15", criticality: "A", relatedTags: ["TI-1101", "TI-1102", "PI-1101", "LI-1101"], dcsScreenId: "DCS-CDU-COL" },
  { id: "P-2001A", name: "HCR Feed Pump A", type: "펌프", processUnit: "HCR", pidNumber: "PID-HCR-004", manufacturer: "Sulzer", installDate: "2015-03-15", lastMaintenanceDate: "2024-06-01", criticality: "B", relatedTags: ["FI-2001", "PI-2001A", "VI-2001A"], dcsScreenId: "DCS-HCR-PM01" },
  { id: "P-2001B", name: "HCR Feed Pump B", type: "펌프", processUnit: "HCR", pidNumber: "PID-HCR-004", manufacturer: "Sulzer", installDate: "2015-03-15", lastMaintenanceDate: "2024-07-15", criticality: "B", relatedTags: ["FI-2001", "PI-2001B", "VI-2001B"], dcsScreenId: "DCS-HCR-PM01" },
  { id: "C-3001", name: "FCC Main Air Blower", type: "압축기", processUnit: "VGOFCC", pidNumber: "PID-FCC-005", manufacturer: "Elliott", installDate: "2012-09-01", lastMaintenanceDate: "2024-03-10", criticality: "A", relatedTags: ["FI-3001", "PI-3001", "VI-3001", "TI-3001"], dcsScreenId: "DCS-FCC-CM01" },
]

// ===== 3. Tag 마스터 (Tag Master) =====
export interface TagMaster {
  id: string
  description: string
  descriptionKo: string
  type: "Temperature" | "Pressure" | "Flow" | "Level" | "Analysis" | "Vibration" | "Control"
  unit: string
  processUnit: string
  equipmentId?: string
  highLimit?: number
  highHighLimit?: number
  lowLimit?: number
  lowLowLimit?: number
  normalMin?: number
  normalMax?: number
  isKeyVariable: boolean  // 주요 운전변수 여부
  isMonitored: boolean    // 모니터링 대상 여부
}

export const TAG_MASTER: TagMaster[] = [
  { id: "TI-2001", description: "HCR Reactor #1 Inlet Temp", descriptionKo: "HCR 반응기#1 입구 온도", type: "Temperature", unit: "°C", processUnit: "HCR", equipmentId: "R-2001", highLimit: 400, highHighLimit: 410, lowLimit: 350, normalMin: 370, normalMax: 390, isKeyVariable: true, isMonitored: true },
  { id: "TI-2002", description: "HCR Reactor #1 Bed#1 Temp", descriptionKo: "HCR 반응기#1 베드#1 온도", type: "Temperature", unit: "°C", processUnit: "HCR", equipmentId: "R-2001", highLimit: 420, highHighLimit: 430, normalMin: 380, normalMax: 410, isKeyVariable: true, isMonitored: true },
  { id: "TI-2003", description: "HCR Reactor #1 Bed#2 Temp", descriptionKo: "HCR 반응기#1 베드#2 온도", type: "Temperature", unit: "°C", processUnit: "HCR", equipmentId: "R-2001", highLimit: 425, highHighLimit: 435, normalMin: 385, normalMax: 415, isKeyVariable: true, isMonitored: true },
  { id: "PI-2001", description: "HCR Reactor Pressure", descriptionKo: "HCR 반응기 압력", type: "Pressure", unit: "kg/cm2", processUnit: "HCR", equipmentId: "R-2001", highLimit: 160, highHighLimit: 165, lowLimit: 140, lowLowLimit: 135, normalMin: 145, normalMax: 155, isKeyVariable: true, isMonitored: true },
  { id: "FI-2001", description: "HCR Feed Flow", descriptionKo: "HCR 원료 유량", type: "Flow", unit: "BPD", processUnit: "HCR", lowLimit: 8000, normalMin: 10000, normalMax: 15000, isKeyVariable: true, isMonitored: true },
  { id: "TI-1001", description: "CDU Heater COT", descriptionKo: "CDU 가열로 출구 온도", type: "Temperature", unit: "°C", processUnit: "CDU", equipmentId: "H-1001", highLimit: 370, highHighLimit: 380, normalMin: 350, normalMax: 365, isKeyVariable: true, isMonitored: true },
  { id: "PI-1001", description: "CDU Column Pressure", descriptionKo: "CDU 상압탑 압력", type: "Pressure", unit: "kg/cm2", processUnit: "CDU", equipmentId: "T-1001", highLimit: 1.8, lowLimit: 1.2, normalMin: 1.4, normalMax: 1.6, isKeyVariable: true, isMonitored: true },
  { id: "LI-1001", description: "CDU Column Bottom Level", descriptionKo: "CDU 상압탑 하부 레벨", type: "Level", unit: "%", processUnit: "CDU", equipmentId: "T-1001", highLimit: 80, lowLimit: 30, normalMin: 45, normalMax: 65, isKeyVariable: false, isMonitored: true },
  { id: "AI-2001", description: "HCR Product Sulfur", descriptionKo: "HCR 제품 유황분", type: "Analysis", unit: "ppm", processUnit: "HCR", highLimit: 10, normalMin: 2, normalMax: 8, isKeyVariable: true, isMonitored: true },
  { id: "VI-2001A", description: "HCR Feed Pump A Vibration", descriptionKo: "HCR 공급펌프A 진동", type: "Vibration", unit: "mm/s", processUnit: "HCR", equipmentId: "P-2001A", highLimit: 7.1, highHighLimit: 11.2, normalMax: 4.5, isKeyVariable: false, isMonitored: true },
]

// ===== 4. 담당자 매핑 (Personnel Mapping) =====
export interface PersonnelMapping {
  id: string
  processUnit: string
  role: "운전" | "공정기술" | "정비" | "계측" | "안전" | "품질"
  primaryAssignee: string
  backupAssignees: string[]
  shiftType?: "A조" | "B조" | "C조" | "D조" | "상주"
  contactInfo?: string
}

export const PERSONNEL_MAPPING: PersonnelMapping[] = [
  { id: "PM-001", processUnit: "HCR", role: "운전", primaryAssignee: "김운전", backupAssignees: ["이현장", "박교대"], shiftType: "A조" },
  { id: "PM-002", processUnit: "HCR", role: "공정기술", primaryAssignee: "최기술", backupAssignees: ["김엔지니어", "이공정"], shiftType: "상주", contactInfo: "내선 1234" },
  { id: "PM-003", processUnit: "HCR", role: "정비", primaryAssignee: "박정비", backupAssignees: ["김정비"], shiftType: "상주" },
  { id: "PM-004", processUnit: "CDU", role: "운전", primaryAssignee: "이운전", backupAssignees: ["김운전", "박교대"], shiftType: "B조" },
  { id: "PM-005", processUnit: "CDU", role: "공정기술", primaryAssignee: "김엔지니어", backupAssignees: ["최기술"], shiftType: "상주" },
  { id: "PM-006", processUnit: "VGOFCC", role: "운전", primaryAssignee: "박운전", backupAssignees: ["이현장"], shiftType: "C조" },
  { id: "PM-007", processUnit: "VGOFCC", role: "공정기술", primaryAssignee: "최기술", backupAssignees: ["김엔지니어"], shiftType: "상주" },
  { id: "PM-008", processUnit: "VDU", role: "운전", primaryAssignee: "김운전", backupAssignees: ["이현장"], shiftType: "A조" },
]

// ===== 5. DCS 화면 매핑 (DCS Screen Mapping) =====
export interface DCSScreen {
  id: string
  name: string
  description: string
  processUnit: string
  screenType: "Overview" | "Detail" | "Trend" | "Alarm" | "Control"
  relatedEquipments: string[]
  relatedTags: string[]
  thumbnailPath?: string
}

export const DCS_SCREENS: DCSScreen[] = [
  { id: "DCS-HCR-001", name: "HCR Overview", description: "HCR 공정 전체 개요 화면", processUnit: "HCR", screenType: "Overview", relatedEquipments: ["R-2001", "R-2002", "E-2001", "E-2002"], relatedTags: ["TI-2001", "TI-2002", "PI-2001", "FI-2001"] },
  { id: "DCS-HCR-RX01", name: "HCR Reactor #1 Detail", description: "HCR 반응기#1 상세 화면", processUnit: "HCR", screenType: "Detail", relatedEquipments: ["R-2001"], relatedTags: ["TI-2101", "TI-2102", "TI-2103", "PI-2101"] },
  { id: "DCS-HCR-EX01", name: "HCR Exchanger Train", description: "HCR 열교환기 계열 화면", processUnit: "HCR", screenType: "Detail", relatedEquipments: ["E-2001", "E-2002"], relatedTags: ["TI-2001", "TI-2002", "TI-2003", "TI-2004"] },
  { id: "DCS-CDU-001", name: "CDU Overview", description: "CDU 공정 전체 개요 화면", processUnit: "CDU", screenType: "Overview", relatedEquipments: ["H-1001", "T-1001"], relatedTags: ["TI-1001", "PI-1001", "LI-1001", "FI-1001"] },
  { id: "DCS-CDU-HT01", name: "CDU Heater Detail", description: "CDU 가열로 상세 화면", processUnit: "CDU", screenType: "Detail", relatedEquipments: ["H-1001"], relatedTags: ["TI-1001", "TI-1002", "FI-1001", "FI-1002"] },
  { id: "DCS-FCC-001", name: "FCC Overview", description: "VGOFCC 공정 전체 개요 화면", processUnit: "VGOFCC", screenType: "Overview", relatedEquipments: ["C-3001"], relatedTags: ["FI-3001", "PI-3001", "TI-3001"] },
]

// ===== 6. 유사 이벤트/리포트 매칭 규칙 (Similarity Rules) =====
export interface SimilarityRule {
  id: string
  name: string
  description: string
  type: "event" | "report"
  matchCriteria: {
    processUnit?: boolean   // 동일 공정 여부
    equipment?: boolean     // 동일 설비 여부
    tagPattern?: boolean    // 동일 태그 패턴 여부
    category?: boolean      // 동일 카테고리 여부
    keyword?: string[]      // 키워드 매칭
  }
  weightFactors: {
    processUnit: number
    equipment: number
    tagPattern: number
    category: number
    keyword: number
  }
  minimumScore: number      // 최소 유사도 점수 (0-100)
  maxResults: number        // 최대 결과 수
  enabled: boolean
}

export const SIMILARITY_RULES: SimilarityRule[] = [
  {
    id: "SR-001",
    name: "동일 공정/설비 이벤트 매칭",
    description: "동일 공정, 동일 설비에서 발생한 유사 이벤트 찾기",
    type: "event",
    matchCriteria: { processUnit: true, equipment: true, category: true },
    weightFactors: { processUnit: 30, equipment: 40, tagPattern: 10, category: 15, keyword: 5 },
    minimumScore: 60,
    maxResults: 10,
    enabled: true
  },
  {
    id: "SR-002",
    name: "태그 패턴 기반 이벤트 매칭",
    description: "동일 태그가 관련된 과거 이벤트 찾기",
    type: "event",
    matchCriteria: { tagPattern: true, processUnit: true },
    weightFactors: { processUnit: 20, equipment: 10, tagPattern: 50, category: 15, keyword: 5 },
    minimumScore: 50,
    maxResults: 15,
    enabled: true
  },
  {
    id: "SR-003",
    name: "키워드 기반 리포트 매칭",
    description: "키워드 유사도 기반 관련 리포트 찾기",
    type: "report",
    matchCriteria: { processUnit: true, keyword: ["온도", "압력", "유량", "진동", "fouling", "coking"] },
    weightFactors: { processUnit: 20, equipment: 10, tagPattern: 20, category: 20, keyword: 30 },
    minimumScore: 40,
    maxResults: 20,
    enabled: true
  },
]

// ===== 7. 이상징후 감지 기준 (Anomaly Detection Thresholds) =====
export interface AnomalyDetectionConfig {
  id: string
  name: string
  description: string
  processUnit: string
  targetTags: string[]
  detectionType: "threshold" | "rate-of-change" | "pattern" | "correlation"
  parameters: {
    threshold?: { high?: number; low?: number }
    rateOfChange?: { maxChangePerMinute: number }
    patternId?: string
    correlationTags?: string[]
  }
  severity: "critical" | "warning" | "info"
  enabled: boolean
  linkedAlertId?: string
}

export const ANOMALY_DETECTION_CONFIGS: AnomalyDetectionConfig[] = [
  {
    id: "AD-001",
    name: "HCR Reactor Temp Runaway Detection",
    description: "HCR 반응기 온도 급상승 감지",
    processUnit: "HCR",
    targetTags: ["TI-2001", "TI-2002", "TI-2003"],
    detectionType: "rate-of-change",
    parameters: { rateOfChange: { maxChangePerMinute: 2.0 } },
    severity: "critical",
    enabled: true,
    linkedAlertId: "ALT-M001"
  },
  {
    id: "AD-002",
    name: "HCR Feed/Reactor Pressure Correlation",
    description: "HCR 공급압력-반응기압력 상관관계 이탈 감지",
    processUnit: "HCR",
    targetTags: ["PI-2001"],
    detectionType: "correlation",
    parameters: { correlationTags: ["FI-2001", "PI-2001"] },
    severity: "warning",
    enabled: true
  },
  {
    id: "AD-003",
    name: "CDU Heater COT Pattern",
    description: "CDU 가열로 출구온도 이상 패턴 감지",
    processUnit: "CDU",
    targetTags: ["TI-1001"],
    detectionType: "pattern",
    parameters: { patternId: "PATTERN-CDU-COT-001" },
    severity: "warning",
    enabled: true
  },
]

// ===== 8. 장기 모니터링 설정 (Long-term Monitoring) =====
export interface LongTermMonitoringConfig {
  id: string
  name: string
  description: string
  processUnit: string
  category: "fouling" | "coking" | "catalyst-aging" | "mechanical" | "energy" | "separation"
  targetEquipment: string
  healthIndexTag: string
  healthIndexUnit: string
  referenceValue: number       // 기준값 (설계값 또는 Clean 상태 값)
  limitValue: number           // 한계값 (Action 필요 시점)
  normalizedBy?: string        // 정규화 기준 태그 (예: Feed Flow)
  trendPeriod: "weekly" | "monthly"
  projectionEnabled: boolean
  alertThreshold?: number      // Alert 발생 기준 (% of limit)
}

export const LONGTERM_MONITORING_CONFIGS: LongTermMonitoringConfig[] = [
  {
    id: "LM-001",
    name: "HCR Feed/Effluent Exchanger Fouling",
    description: "HCR Feed/Effluent 열교환기 오염도 모니터링",
    processUnit: "HCR",
    category: "fouling",
    targetEquipment: "E-2001",
    healthIndexTag: "HI-2001-U",
    healthIndexUnit: "W/m2K",
    referenceValue: 850,
    limitValue: 450,
    normalizedBy: "FI-2001",
    trendPeriod: "weekly",
    projectionEnabled: true,
    alertThreshold: 70
  },
  {
    id: "LM-002",
    name: "HCR Reactor Catalyst Aging",
    description: "HCR 반응기 촉매 노화 모니터링 (WABT 기준)",
    processUnit: "HCR",
    category: "catalyst-aging",
    targetEquipment: "R-2001",
    healthIndexTag: "WABT-2001",
    healthIndexUnit: "°C",
    referenceValue: 370,
    limitValue: 415,
    trendPeriod: "monthly",
    projectionEnabled: true,
    alertThreshold: 80
  },
  {
    id: "LM-003",
    name: "CDU Heater Coking",
    description: "CDU 가열로 코킹 모니터링 (TMT 기준)",
    processUnit: "CDU",
    category: "coking",
    targetEquipment: "H-1001",
    healthIndexTag: "TMT-1001",
    healthIndexUnit: "°C",
    referenceValue: 520,
    limitValue: 590,
    trendPeriod: "weekly",
    projectionEnabled: true,
    alertThreshold: 75
  },
]

// ===== 9. 컨텍스트 데이터 매핑 (Context Data Mapping) =====
export interface ContextDataMapping {
  id: string
  triggerType: "event-create" | "alert-triggered" | "anomaly-detected"
  processUnit: string
  autoLoadItems: {
    dcsScreen: boolean
    relatedTags: boolean
    recentAlerts: boolean
    maintenanceHistory: boolean
    similarEvents: boolean
    similarReports: boolean
    operationGuide: boolean
    healthStatus: boolean
  }
  defaultTimeRange: "1h" | "4h" | "8h" | "24h" | "7d"
}

export const CONTEXT_MAPPINGS: ContextDataMapping[] = [
  {
    id: "CM-001",
    triggerType: "event-create",
    processUnit: "HCR",
    autoLoadItems: {
      dcsScreen: true,
      relatedTags: true,
      recentAlerts: true,
      maintenanceHistory: true,
      similarEvents: true,
      similarReports: true,
      operationGuide: true,
      healthStatus: true
    },
    defaultTimeRange: "4h"
  },
  {
    id: "CM-002",
    triggerType: "alert-triggered",
    processUnit: "HCR",
    autoLoadItems: {
      dcsScreen: true,
      relatedTags: true,
      recentAlerts: true,
      maintenanceHistory: false,
      similarEvents: true,
      similarReports: false,
      operationGuide: false,
      healthStatus: true
    },
    defaultTimeRange: "1h"
  },
  {
    id: "CM-003",
    triggerType: "event-create",
    processUnit: "CDU",
    autoLoadItems: {
      dcsScreen: true,
      relatedTags: true,
      recentAlerts: true,
      maintenanceHistory: true,
      similarEvents: true,
      similarReports: true,
      operationGuide: false,
      healthStatus: true
    },
    defaultTimeRange: "4h"
  },
]

// ===== Helper Functions =====
export function getPersonnelForUnit(processUnit: string, role?: PersonnelMapping["role"]): PersonnelMapping[] {
  return PERSONNEL_MAPPING.filter(p => 
    p.processUnit === processUnit && (!role || p.role === role)
  )
}

export function getEquipmentForUnit(processUnit: string): Equipment[] {
  return EQUIPMENT_MASTER.filter(e => e.processUnit === processUnit)
}

export function getTagsForEquipment(equipmentId: string): TagMaster[] {
  return TAG_MASTER.filter(t => t.equipmentId === equipmentId)
}

export function getDCSScreensForUnit(processUnit: string): DCSScreen[] {
  return DCS_SCREENS.filter(s => s.processUnit === processUnit)
}

export function getContextMapping(processUnit: string, triggerType: ContextDataMapping["triggerType"]): ContextDataMapping | undefined {
  return CONTEXT_MAPPINGS.find(c => c.processUnit === processUnit && c.triggerType === triggerType)
}
