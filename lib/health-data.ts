// 장기 건전성 관리 - 7개 카테고리 데이터 모델 (확장판)

export type HealthCategory =
  | "fouling"
  | "coking"
  | "catalyst-aging"
  | "hydraulics"
  | "separation"
  | "energy"
  | "mechanical"

export type TrafficLight = "red" | "yellow" | "green"

// 공정별 운전 모드 정의
export const PROCESS_MODES: Record<string, string[]> = {
  HCR: ["W150N", "W600N", "G-III", "UCO Max"],
  FCC: ["Max Gasoline", "Max LCO", "Max Propylene"],
  CDU: ["HS Mode", "RFCC Mode", "Export Mode"],
  VDU: ["HVGO Max", "LVGO Max", "Asphalt Mode"],
  SRU: ["2-Bed", "3-Bed", "SCOT Mode"],
  KD: ["Full Load", "Partial Load", "Turndown"],
  CCR: ["Reformate Max", "Aromatics Max", "Semi-Regen"],
  MFC: ["Max Ethylene", "Max Propylene", "Flexible"],
  PE: ["HDPE-B", "HDPE-F", "LLDPE-B", "LLDPE-C4", "LLDPE-C6", "LLDPE-C8", "mPE-F", "mPE-S", "ULDPE"],
}

// Normalized 로직 정의
export interface NormalizedLogic {
  id: string
  name: string
  description: string
  formula: string          // 보정 수식 표시
  referenceTag?: string    // 보정 기준 태그 (예: Feed Flow)
  hasLogic: boolean        // false인 경우 Raw Tag 기준
}

export interface HealthEquipment {
  id: string
  name: string
  process: string
  mode?: string             // 운전 모드
  equipmentType: string
  healthIndex: {
    name: string
    unit: string
    currentValue: number
    designValue: number
    limitValue: number
    // Drift 판정 기준
    monthlyAvgSlope: number   // 최근 1개월 평균 기울기
    weeklySlope: number       // 최근 1주일 기울기
    trend: number[]           // 최근 24주 트렌드 데이터
    prevTaTrend?: number[]    // 이전 TA 주기 동일 Run Time의 트렌드
    prevTaValueAtSameRuntime?: number // 이전 TA 동일 Run Time 기준 값
  }
  normalized: NormalizedLogic
  trafficLight: TrafficLight
  driftPct: number            // 기울기 변화율 (%) = (weekly - monthlyAvg) / |monthlyAvg| * 100
  // Projection 관련
  projection: {
    linearEndOfRun: number    // Linear 외삽 기준 Limit 도달 예상 주수
    aiModelId?: string        // 연결된 AI 모델 ID (있으면 AI Projection 가능)
    aiEndOfRun?: number       // AI 모델 기준 Limit 도달 예상 주수
    actionLimit: number       // Action 필요 기준값
    actionMarginWeeks: number // Action 준비 Margin (주)
    needsImmediateAction: boolean
  }
}

export interface RelatedTrendTag {
  tagId: string
  description: string
  unit: string
  type: "Temperature" | "Pressure" | "Flow" | "Level" | "Analysis" | "Control" | "Performance"
  values: number[]
  limit?: number
  lowLimit?: number
}

export interface HealthCategoryConfig {
  id: HealthCategory
  label: string
  description: string
  icon: string
  equipmentTypes: string[]
  healthIndexName: string
  healthIndexUnit: string
}

// ---- 카테고리 설정 ----
export const HEALTH_CATEGORIES: Record<HealthCategory, HealthCategoryConfig> = {
  fouling: {
    id: "fouling",
    label: "Fouling",
    description: "열교환기, 공랭기, 쿨러, 네트워크의 오염/침적 관리",
    icon: "Flame",
    equipmentTypes: ["열교환기", "공랭기", "쿨러", "네트워크"],
    healthIndexName: "U값 (총괄열전달계수)",
    healthIndexUnit: "W/m2K",
  },
  coking: {
    id: "coking",
    label: "Coking",
    description: "가열로 코일, 반응기, Fractionator Bottom 코킹 관리",
    icon: "Flame",
    equipmentTypes: ["가열로 코일", "반응기", "Fractionator Bottom"],
    healthIndexName: "TMT / Skin Temp",
    healthIndexUnit: "deg.C",
  },
  "catalyst-aging": {
    id: "catalyst-aging",
    label: "촉매 Aging",
    description: "모든 촉매 반응기 (HCR, HDS, FCC 등) 촉매 성능 추적",
    icon: "Activity",
    equipmentTypes: ["촉매 반응기"],
    healthIndexName: "WABT",
    healthIndexUnit: "deg.C",
  },
  hydraulics: {
    id: "hydraulics",
    label: "Hydraulics",
    description: "탑, 필터, 베드, 배관의 유압 건전성 관리",
    icon: "ArrowDownUp",
    equipmentTypes: ["탑", "필터", "베드", "배관"],
    healthIndexName: "차압 (dP)",
    healthIndexUnit: "kg/cm2",
  },
  separation: {
    id: "separation",
    label: "Separation",
    description: "CDU/VDU/Stripping/Recovery Unit 분리 효율 관리",
    icon: "Layers",
    equipmentTypes: ["CDU Column", "VDU Column", "Stripper", "Recovery Unit"],
    healthIndexName: "분리 효율",
    healthIndexUnit: "%",
  },
  energy: {
    id: "energy",
    label: "Energy",
    description: "Heater, Steam, Utilities, HEN 에너지 효율 관리",
    icon: "Zap",
    equipmentTypes: ["Heater", "Steam System", "Utility", "HEN"],
    healthIndexName: "열효율",
    healthIndexUnit: "%",
  },
  mechanical: {
    id: "mechanical",
    label: "Mechanical",
    description: "펌프, 압축기, 회전기계 기계적 건전성 관리",
    icon: "Cog",
    equipmentTypes: ["펌프", "압축기", "회전기계"],
    healthIndexName: "진동 수준",
    healthIndexUnit: "mm/s",
  },
}

export const PROCESSES = ["HCR", "FCC", "CDU", "VDU", "SRU", "KD", "CCR", "MFC", "PE"] as const

// ---- 신호등 판정: 30% 기준 ----
export function calculateTrafficLight(weeklySlope: number, monthlyAvgSlope: number): { light: TrafficLight; driftPct: number } {
  if (monthlyAvgSlope === 0) {
    if (Math.abs(weeklySlope) < 0.01) return { light: "green", driftPct: 0 }
    return { light: weeklySlope > 0 ? "yellow" : "green", driftPct: 100 }
  }
  const pct = ((weeklySlope - monthlyAvgSlope) / Math.abs(monthlyAvgSlope)) * 100
  if (pct >= 50) return { light: "red", driftPct: pct }
  if (pct >= 30) return { light: "yellow", driftPct: pct }
  return { light: "green", driftPct: pct }
}

// ---- Seeded random ----
function sr(seed: number) { return ((Math.sin(seed) * 10000) % 1 + 1) % 1 }

function genTrend(base: number, vol: number, slope: number, len: number, seed: number): number[] {
  return Array.from({ length: len }, (_, i) => +(base + slope * i + (sr(seed + i * 7) - 0.5) * vol).toFixed(2))
}

// ---- Equipment builder ----
function mkE(
  id: string, name: string, process: string, mode: string | undefined, equipType: string,
  hiName: string, hiUnit: string, current: number, design: number, limit: number,
  monthlySlope: number, weeklySlope: number, seed: number,
  normLogic: NormalizedLogic,
  aiModelId?: string,
): HealthEquipment {
  const { light, driftPct } = calculateTrafficLight(Math.abs(weeklySlope), Math.abs(monthlySlope))
  const trend = genTrend(current - weeklySlope * 23, Math.abs(weeklySlope) * 3, weeklySlope / 2, 24, seed)
  const prevTaTrend = genTrend(current - weeklySlope * 23 - (sr(seed + 99) * 20 - 10), Math.abs(weeklySlope) * 2.5, monthlySlope / 2.5, 24, seed + 500)
  const prevTaVal = +(current + (sr(seed + 200) - 0.5) * 30).toFixed(1)

  // Linear projection: weeks until limit
  const remainToLimit = Math.abs(limit - current)
  const weeklyRate = Math.abs(weeklySlope) || 0.01
  const linearWeeks = Math.round(remainToLimit / weeklyRate)
  const aiWeeks = aiModelId ? Math.round(linearWeeks * (0.7 + sr(seed + 300) * 0.5)) : undefined
  const actionLimit = limit + (limit > current ? -Math.abs(limit - current) * 0.15 : Math.abs(limit - current) * 0.15)
  const actionMargin = 4 + Math.round(sr(seed + 400) * 8)
  const weeksToAction = (aiWeeks ?? linearWeeks) - actionMargin

  return {
    id, name, process, mode, equipmentType: equipType,
    healthIndex: {
      name: hiName, unit: hiUnit, currentValue: current, designValue: design, limitValue: limit,
      monthlyAvgSlope: monthlySlope, weeklySlope, trend, prevTaTrend, prevTaValueAtSameRuntime: prevTaVal,
    },
    normalized: normLogic,
    trafficLight: light,
    driftPct,
    projection: {
      linearEndOfRun: linearWeeks,
      aiModelId,
      aiEndOfRun: aiWeeks,
      actionLimit,
      actionMarginWeeks: actionMargin,
      needsImmediateAction: weeksToAction <= 0,
    },
  }
}

// Normalized logic helpers
const normU = (id: string): NormalizedLogic => ({ id, name: "Normalized U-value", description: "Feed 유량 보정된 U값 (Kern Method)", formula: "U_norm = U_raw * (F_design/F_actual)^0.8", referenceTag: "FI-" + id.split("-")[1], hasLogic: true })
const normTMT = (id: string): NormalizedLogic => ({ id, name: "Normalized TMT", description: "Heat Duty 보정된 TMT", formula: "TMT_norm = TMT_raw * (Q_design/Q_actual)^0.6", referenceTag: "QI-" + id.split("-")[1], hasLogic: true })
const normWABT = (id: string): NormalizedLogic => ({ id, name: "Normalized WABT", description: "Feed 유량 및 H2/HC Ratio 보정된 WABT", formula: "WABT_norm = WABT_raw + f(F, H2HC)", referenceTag: "FI-" + id.split("-")[1], hasLogic: true })
const normDP = (id: string): NormalizedLogic => ({ id, name: "Normalized dP", description: "유량 보정된 차압", formula: "dP_norm = dP_raw * (F_design/F_actual)^2", referenceTag: "FI-" + id.split("-")[1], hasLogic: true })
const rawTag = (id: string, name: string): NormalizedLogic => ({ id, name, description: "보정 로직 미설정 - Raw Tag 기준", formula: "-", hasLogic: false })

// =========================================================
// 카테고리별 장비 데이터 (공정당 10+ 변수)
// =========================================================
export function getEquipmentData(category: HealthCategory): HealthEquipment[] {
  const data: Record<HealthCategory, HealthEquipment[]> = {
    fouling: [
      // HCR - 12 items
      mkE("F-E101A", "Feed/Effluent HEX #1A", "HCR", "W150N", "열교환기", "U값", "W/m2K", 520, 750, 350, -4.5, -8.2, 101, normU("F-E101A")),
      mkE("F-E101B", "Feed/Effluent HEX #1B", "HCR", "W150N", "열교환기", "U값", "W/m2K", 540, 750, 350, -4.2, -4.0, 102, normU("F-E101B")),
      mkE("F-E102A", "Feed/Effluent HEX #2A", "HCR", "W600N", "열교환기", "U값", "W/m2K", 480, 750, 350, -5.1, -12.5, 103, normU("F-E102A"), "AI-MDL-F01"),
      mkE("F-E102B", "Feed/Effluent HEX #2B", "HCR", "W600N", "열교환기", "U값", "W/m2K", 495, 750, 350, -4.8, -5.0, 104, normU("F-E102B")),
      mkE("F-E103", "Product Cooler", "HCR", "G-III", "열교환기", "U값", "W/m2K", 610, 700, 400, -3.0, -3.2, 105, normU("F-E103")),
      mkE("F-E104", "Recycle Gas Cooler", "HCR", "G-III", "열교환기", "U값", "W/m2K", 560, 680, 380, -2.8, -2.5, 106, rawTag("F-E104", "Raw U값")),
      mkE("F-E105", "Stripper Reboiler", "HCR", "W150N", "열교환기", "U값", "W/m2K", 430, 650, 350, -3.5, -7.2, 107, normU("F-E105"), "AI-MDL-F02"),
      mkE("F-A101", "Reactor Eff. Air Cooler", "HCR", "W150N", "공랭기", "U값", "W/m2K", 340, 500, 250, -3.5, -6.1, 108, rawTag("F-A101", "Raw U값")),
      mkE("F-A102", "Product Air Cooler", "HCR", "W600N", "공랭기", "U값", "W/m2K", 310, 480, 240, -2.8, -4.5, 109, rawTag("F-A102", "Raw U값")),
      mkE("F-C101", "H2 Compressor IC", "HCR", "W150N", "쿨러", "U값", "W/m2K", 420, 550, 300, -2.0, -1.8, 110, normU("F-C101")),
      mkE("F-C102", "Product Trim Cooler", "HCR", "G-III", "쿨러", "U값", "W/m2K", 385, 520, 280, -2.5, -3.8, 111, normU("F-C102")),
      mkE("F-N101", "Feed Preheat Network", "HCR", "W150N", "네트워크", "U값", "W/m2K", 510, 700, 380, -4.0, -5.5, 112, normU("F-N101"), "AI-MDL-F03"),
      // CDU - 11 items
      mkE("F-E201A", "Preheat Train HEX #1", "CDU", "HS Mode", "열교환기", "U값", "W/m2K", 610, 800, 400, -3.2, -3.8, 201, normU("F-E201A")),
      mkE("F-E201B", "Preheat Train HEX #2", "CDU", "HS Mode", "열교환기", "U값", "W/m2K", 580, 800, 400, -3.0, -2.8, 202, normU("F-E201B")),
      mkE("F-E202A", "Desalter HEX #1", "CDU", "RFCC Mode", "열교환기", "U값", "W/m2K", 430, 800, 400, -4.8, -9.6, 203, normU("F-E202A"), "AI-MDL-F04"),
      mkE("F-E202B", "Desalter HEX #2", "CDU", "RFCC Mode", "열교환기", "U값", "W/m2K", 450, 780, 400, -4.5, -5.0, 204, normU("F-E202B")),
      mkE("F-E203", "OH Condenser", "CDU", "HS Mode", "열교환기", "U값", "W/m2K", 550, 720, 380, -2.5, -2.3, 205, normU("F-E203")),
      mkE("F-E204", "Kero Product Cooler", "CDU", "HS Mode", "열교환기", "U값", "W/m2K", 520, 700, 370, -2.0, -1.9, 206, rawTag("F-E204", "Raw U값")),
      mkE("F-E205", "Diesel Product Cooler", "CDU", "RFCC Mode", "열교환기", "U값", "W/m2K", 490, 680, 360, -3.1, -4.8, 207, normU("F-E205")),
      mkE("F-A201", "OH Air Cooler", "CDU", "HS Mode", "공랭기", "U값", "W/m2K", 320, 500, 240, -2.2, -3.5, 208, rawTag("F-A201", "Raw U값")),
      mkE("F-C201", "Product Final Cooler", "CDU", "HS Mode", "쿨러", "U값", "W/m2K", 560, 700, 380, -2.0, -2.1, 209, normU("F-C201")),
      mkE("F-N201", "Preheat Network", "CDU", "RFCC Mode", "네트워크", "U값", "W/m2K", 550, 750, 400, -4.8, -5.2, 210, normU("F-N201"), "AI-MDL-F05"),
      mkE("F-N202", "Hot End Network", "CDU", "HS Mode", "네트워크", "U값", "W/m2K", 480, 700, 380, -3.5, -3.8, 211, normU("F-N202")),
      // VDU - 10 items
      mkE("F-E301", "LVGO Cooler", "VDU", "HVGO Max", "열교환기", "U값", "W/m2K", 490, 680, 370, -4.0, -4.5, 301, normU("F-E301")),
      mkE("F-E302", "HVGO Cooler", "VDU", "HVGO Max", "열교환기", "U값", "W/m2K", 460, 660, 360, -3.8, -5.8, 302, normU("F-E302"), "AI-MDL-F06"),
      mkE("F-E303", "Slop Wax Cooler", "VDU", "LVGO Max", "열교환기", "U값", "W/m2K", 510, 680, 380, -2.5, -2.2, 303, rawTag("F-E303", "Raw U값")),
      mkE("F-E304", "VR Cooler", "VDU", "Asphalt Mode", "열교환기", "U값", "W/m2K", 380, 600, 320, -4.2, -7.5, 304, normU("F-E304")),
      mkE("F-E305", "Feed/HVGO HEX", "VDU", "HVGO Max", "열교환기", "U값", "W/m2K", 520, 700, 380, -3.0, -3.1, 305, normU("F-E305")),
      mkE("F-A301", "LVGO Air Cooler", "VDU", "LVGO Max", "공랭기", "U값", "W/m2K", 280, 450, 220, -2.0, -1.8, 306, rawTag("F-A301", "Raw U값")),
      mkE("F-A302", "Vacuum OH Air Cooler", "VDU", "HVGO Max", "공랭기", "U값", "W/m2K", 300, 470, 230, -2.5, -3.8, 307, rawTag("F-A302", "Raw U값")),
      mkE("F-C301", "Product Trim Cooler", "VDU", "HVGO Max", "쿨러", "U값", "W/m2K", 560, 700, 380, -2.0, -2.1, 308, normU("F-C301")),
      mkE("F-N301", "VDU Preheat Network", "VDU", "HVGO Max", "네트워크", "U값", "W/m2K", 440, 650, 350, -3.5, -5.2, 309, normU("F-N301")),
      mkE("F-N302", "HVGO Circuit Network", "VDU", "LVGO Max", "네트워크", "U값", "W/m2K", 470, 660, 360, -3.0, -3.2, 310, normU("F-N302")),
      // CCR - 6 items
      mkE("F-E401", "OH Condenser", "CCR", "Reformate Max", "열교환기", "U값", "W/m2K", 390, 600, 320, -3.9, -7.8, 401, normU("F-E401")),
      mkE("F-E402", "Feed/Effluent HEX", "CCR", "Reformate Max", "열교환기", "U값", "W/m2K", 420, 620, 340, -3.2, -3.5, 402, normU("F-E402")),
      mkE("F-E403", "Stabilizer Reboiler", "CCR", "Aromatics Max", "열교환기", "U값", "W/m2K", 480, 650, 360, -2.8, -2.5, 403, rawTag("F-E403", "Raw U값")),
      mkE("F-A401", "Reactor Eff. Air Cooler", "CCR", "Reformate Max", "공랭기", "U값", "W/m2K", 290, 460, 230, -2.5, -4.0, 404, rawTag("F-A401", "Raw U값")),
      mkE("F-C401", "Net Gas Cooler", "CCR", "Aromatics Max", "쿨러", "U값", "W/m2K", 350, 520, 280, -2.0, -2.2, 405, normU("F-C401")),
      mkE("F-N401", "CCR Preheat Network", "CCR", "Reformate Max", "네트워크", "U값", "W/m2K", 400, 600, 320, -3.0, -4.5, 406, normU("F-N401")),
      // FCC - 5 items
      mkE("F-E501", "Slurry Settler HEX", "FCC", "Max Gasoline", "열교환기", "U값", "W/m2K", 350, 550, 280, -4.5, -8.0, 501, normU("F-E501"), "AI-MDL-F07"),
      mkE("F-E502", "Main Frac OH Cond", "FCC", "Max LCO", "열교환기", "U값", "W/m2K", 410, 600, 320, -3.0, -3.2, 502, normU("F-E502")),
      mkE("F-E503", "LCO Cooler", "FCC", "Max Gasoline", "열교환기", "U값", "W/m2K", 380, 560, 300, -2.8, -4.2, 503, rawTag("F-E503", "Raw U값")),
      mkE("F-A501", "Gas Con OH Air Cooler", "FCC", "Max Propylene", "공랭기", "U값", "W/m2K", 260, 420, 200, -2.2, -3.5, 504, rawTag("F-A501", "Raw U값")),
      mkE("F-N501", "HCO Circuit Network", "FCC", "Max Gasoline", "네트워크", "U값", "W/m2K", 430, 620, 340, -3.5, -5.0, 505, normU("F-N501")),
    ],
    coking: [
      // CDU
      mkE("C-H101A", "Charge Heater Pass 1", "CDU", "HS Mode", "가열로 코일", "TMT", "deg.C", 545, 400, 580, 0.9, 1.8, 601, normTMT("C-H101A"), "AI-MDL-C01"),
      mkE("C-H101B", "Charge Heater Pass 2", "CDU", "HS Mode", "가열로 코일", "TMT", "deg.C", 538, 400, 580, 1.0, 1.2, 602, normTMT("C-H101B")),
      mkE("C-H101C", "Charge Heater Pass 3", "CDU", "RFCC Mode", "가열로 코일", "TMT", "deg.C", 552, 400, 580, 0.8, 1.5, 603, normTMT("C-H101C")),
      mkE("C-H101D", "Charge Heater Pass 4", "CDU", "RFCC Mode", "가열로 코일", "TMT", "deg.C", 548, 400, 580, 0.9, 0.8, 604, normTMT("C-H101D")),
      mkE("C-F101", "CDU Frac. Bottom", "CDU", "HS Mode", "Fractionator Bottom", "TMT", "deg.C", 358, 300, 380, 0.4, 0.5, 605, rawTag("C-F101", "Raw TMT")),
      // VDU
      mkE("C-H201A", "VDU Heater Pass 1", "VDU", "HVGO Max", "가열로 코일", "TMT", "deg.C", 562, 400, 580, 1.1, 2.5, 606, normTMT("C-H201A"), "AI-MDL-C02"),
      mkE("C-H201B", "VDU Heater Pass 2", "VDU", "HVGO Max", "가열로 코일", "TMT", "deg.C", 555, 400, 580, 1.0, 1.5, 607, normTMT("C-H201B")),
      mkE("C-H201C", "VDU Heater Pass 3", "VDU", "LVGO Max", "가열로 코일", "TMT", "deg.C", 540, 400, 580, 0.8, 0.9, 608, normTMT("C-H201C")),
      mkE("C-F201", "VDU Frac. Bottom", "VDU", "HVGO Max", "Fractionator Bottom", "TMT", "deg.C", 372, 300, 380, 0.8, 2.1, 609, rawTag("C-F201", "Raw TMT")),
      // HCR
      mkE("C-R101", "HCR Reactor Bed #1", "HCR", "W150N", "반응기", "TMT", "deg.C", 425, 350, 460, 0.7, 0.8, 610, normTMT("C-R101")),
      mkE("C-R102", "HCR Reactor Bed #2", "HCR", "W600N", "반응기", "TMT", "deg.C", 430, 350, 460, 0.6, 1.5, 611, normTMT("C-R102"), "AI-MDL-C03"),
      mkE("C-R103", "HCR Reactor Bed #3", "HCR", "G-III", "반응기", "TMT", "deg.C", 418, 350, 460, 0.5, 0.6, 612, normTMT("C-R103")),
      // FCC
      mkE("C-H301", "FCC Feed Preheater", "FCC", "Max Gasoline", "가열로 코일", "TMT", "deg.C", 530, 400, 570, 0.7, 1.1, 613, normTMT("C-H301")),
      mkE("C-F301", "FCC Main Frac Bottom", "FCC", "Max Gasoline", "Fractionator Bottom", "TMT", "deg.C", 365, 300, 385, 0.5, 0.8, 614, rawTag("C-F301", "Raw TMT")),
    ],
    "catalyst-aging": [
      mkE("A-R101", "HCR 1st Stage Reactor", "HCR", "W150N", "촉매 반응기", "WABT", "deg.C", 388, 360, 410, 0.25, 0.45, 701, normWABT("A-R101"), "AI-MDL-A01"),
      mkE("A-R102", "HCR 2nd Stage Reactor", "HCR", "W150N", "촉매 반응기", "WABT", "deg.C", 392, 360, 410, 0.35, 0.72, 702, normWABT("A-R102"), "AI-MDL-A02"),
      mkE("A-R103", "HCR Guard Bed", "HCR", "W600N", "촉매 반응기", "WABT", "deg.C", 375, 360, 410, 0.20, 0.22, 703, normWABT("A-R103")),
      mkE("A-R104", "HCR Post Treat Reactor", "HCR", "G-III", "촉매 반응기", "WABT", "deg.C", 370, 355, 400, 0.18, 0.20, 704, normWABT("A-R104")),
      mkE("A-R201", "CCR Reactor #1", "CCR", "Reformate Max", "촉매 반응기", "WABT", "deg.C", 502, 480, 530, 0.30, 0.38, 705, normWABT("A-R201")),
      mkE("A-R202", "CCR Reactor #2", "CCR", "Reformate Max", "촉매 반응기", "WABT", "deg.C", 498, 480, 530, 0.25, 0.28, 706, normWABT("A-R202")),
      mkE("A-R203", "CCR Reactor #3", "CCR", "Aromatics Max", "촉매 반응기", "WABT", "deg.C", 495, 480, 530, 0.22, 0.24, 707, normWABT("A-R203")),
      mkE("A-R301", "FCC Riser Reactor", "FCC", "Max Gasoline", "촉매 반응기", "WABT", "deg.C", 525, 500, 550, 0.40, 0.85, 708, normWABT("A-R301"), "AI-MDL-A03"),
      mkE("A-R302", "FCC Regen Reactor", "FCC", "Max LCO", "촉매 반응기", "WABT", "deg.C", 690, 670, 720, 0.35, 0.50, 709, rawTag("A-R302", "Raw WABT")),
      mkE("A-R401", "KD HDS Reactor #1", "KD", "Full Load", "촉매 반응기", "WABT", "deg.C", 365, 340, 390, 0.28, 0.32, 710, normWABT("A-R401")),
      mkE("A-R402", "KD HDS Reactor #2", "KD", "Full Load", "촉매 반응기", "WABT", "deg.C", 358, 340, 390, 0.22, 0.25, 711, normWABT("A-R402")),
      mkE("A-R501", "SRU Claus Reactor #1", "SRU", "3-Bed", "촉매 반응기", "WABT", "deg.C", 305, 280, 330, 0.30, 0.55, 712, rawTag("A-R501", "Raw WABT")),
      mkE("A-R502", "SRU Claus Reactor #2", "SRU", "3-Bed", "촉매 반응기", "WABT", "deg.C", 298, 280, 330, 0.25, 0.28, 713, rawTag("A-R502", "Raw WABT")),
      mkE("A-R601", "MFC Cracking Reactor", "MFC", "Max Ethylene", "촉매 반응기", "WABT", "deg.C", 845, 820, 880, 0.45, 0.60, 714, normWABT("A-R601")),
    ],
    hydraulics: [
      mkE("H-T101", "CDU Main Column", "CDU", "HS Mode", "탑", "dP", "kg/cm2", 0.42, 0.2, 0.65, 0.008, 0.012, 801, normDP("H-T101")),
      mkE("H-T102", "CDU Stabilizer", "CDU", "RFCC Mode", "탑", "dP", "kg/cm2", 0.35, 0.15, 0.55, 0.005, 0.006, 802, normDP("H-T102")),
      mkE("H-T103", "CDU Naphtha Splitter", "CDU", "HS Mode", "탑", "dP", "kg/cm2", 0.28, 0.1, 0.45, 0.004, 0.005, 803, normDP("H-T103")),
      mkE("H-T201", "VDU Vacuum Column", "VDU", "HVGO Max", "탑", "dP", "mmHg", 18.5, 10, 25, 0.20, 0.35, 804, normDP("H-T201"), "AI-MDL-H01"),
      mkE("H-T202", "VDU LVGO Stripper", "VDU", "LVGO Max", "탑", "dP", "mmHg", 5.2, 2, 8, 0.10, 0.12, 805, normDP("H-T202")),
      mkE("H-FL01", "HCR Feed Filter A", "HCR", "W150N", "필터", "dP", "kg/cm2", 1.2, 0.3, 1.8, 0.04, 0.08, 806, normDP("H-FL01")),
      mkE("H-FL02", "HCR Feed Filter B", "HCR", "W600N", "필터", "dP", "kg/cm2", 0.95, 0.3, 1.8, 0.03, 0.04, 807, normDP("H-FL02")),
      mkE("H-FL03", "CCR Feed Filter", "CCR", "Reformate Max", "필터", "dP", "kg/cm2", 0.85, 0.3, 1.5, 0.04, 0.05, 808, normDP("H-FL03")),
      mkE("H-B101", "HCR Reactor Bed #1 dP", "HCR", "W150N", "베드", "dP", "kg/cm2", 0.95, 0.4, 1.5, 0.03, 0.065, 809, normDP("H-B101"), "AI-MDL-H02"),
      mkE("H-B102", "HCR Reactor Bed #2 dP", "HCR", "W600N", "베드", "dP", "kg/cm2", 0.82, 0.4, 1.5, 0.025, 0.03, 810, normDP("H-B102")),
      mkE("H-P101", "CDU Transfer Line", "CDU", "HS Mode", "배관", "dP", "kg/cm2", 0.28, 0.1, 0.5, 0.004, 0.005, 811, rawTag("H-P101", "Raw dP")),
      mkE("H-P201", "VDU Vacuum Line", "VDU", "HVGO Max", "배관", "dP", "mmHg", 3.5, 1, 6, 0.05, 0.08, 812, rawTag("H-P201", "Raw dP")),
    ],
    separation: [
      mkE("S-C101", "CDU Atm Column", "CDU", "HS Mode", "CDU Column", "분리효율", "%", 94.2, 98, 88, -0.10, -0.18, 901, rawTag("S-C101", "Raw 효율"), "AI-MDL-S01"),
      mkE("S-C102", "CDU Atm Column (RFCC)", "CDU", "RFCC Mode", "CDU Column", "분리효율", "%", 93.5, 98, 88, -0.12, -0.15, 902, rawTag("S-C102", "Raw 효율")),
      mkE("S-C201", "VDU Vacuum Column", "VDU", "HVGO Max", "VDU Column", "분리효율", "%", 91.5, 96, 85, -0.15, -0.32, 903, rawTag("S-C201", "Raw 효율"), "AI-MDL-S02"),
      mkE("S-C202", "VDU (LVGO Mode)", "VDU", "LVGO Max", "VDU Column", "분리효율", "%", 92.0, 96, 85, -0.12, -0.14, 904, rawTag("S-C202", "Raw 효율")),
      mkE("S-S101", "Naphtha Stripper", "CDU", "HS Mode", "Stripper", "분리효율", "%", 96.8, 99, 90, -0.06, -0.05, 905, rawTag("S-S101", "Raw 효율")),
      mkE("S-S102", "Kero Stripper", "CDU", "HS Mode", "Stripper", "분리효율", "%", 95.5, 99, 90, -0.08, -0.07, 906, rawTag("S-S102", "Raw 효율")),
      mkE("S-S201", "VDU Side Stripper", "VDU", "HVGO Max", "Stripper", "분리효율", "%", 93.1, 98, 88, -0.12, -0.25, 907, rawTag("S-S201", "Raw 효율")),
      mkE("S-R101", "LPG Recovery Unit", "FCC", "Max Gasoline", "Recovery Unit", "분리효율", "%", 92.0, 97, 86, -0.18, -0.40, 908, rawTag("S-R101", "Raw 효율"), "AI-MDL-S03"),
      mkE("S-R102", "Ethylene Recovery", "MFC", "Max Ethylene", "Recovery Unit", "분리효율", "%", 94.5, 98, 90, -0.10, -0.12, 909, rawTag("S-R102", "Raw 효율")),
      mkE("S-R103", "Propylene Recovery", "MFC", "Max Propylene", "Recovery Unit", "분리효율", "%", 93.8, 97, 89, -0.11, -0.15, 910, rawTag("S-R103", "Raw 효율")),
    ],
    energy: [
      mkE("E-H101", "CDU Charge Heater", "CDU", "HS Mode", "Heater", "열효율", "%", 88.5, 92, 82, -0.15, -0.22, 1001, rawTag("E-H101", "Raw 열효율")),
      mkE("E-H102", "CDU Charge Heater (RFCC)", "CDU", "RFCC Mode", "Heater", "열효율", "%", 87.0, 92, 82, -0.18, -0.25, 1002, rawTag("E-H102", "Raw 열효율")),
      mkE("E-H201", "VDU Charge Heater", "VDU", "HVGO Max", "Heater", "열효율", "%", 85.2, 92, 80, -0.20, -0.45, 1003, rawTag("E-H201", "Raw 열효율"), "AI-MDL-E01"),
      mkE("E-H301", "HCR Charge Heater", "HCR", "W150N", "Heater", "열효율", "%", 87.1, 90, 82, -0.16, -0.18, 1004, rawTag("E-H301", "Raw 열효율")),
      mkE("E-H302", "HCR Stripper Reboiler", "HCR", "W600N", "Heater", "열효율", "%", 86.5, 90, 82, -0.12, -0.14, 1005, rawTag("E-H302", "Raw 열효율")),
      mkE("E-ST01", "HP Steam System", "CDU", "HS Mode", "Steam System", "열효율", "%", 91.0, 95, 85, -0.07, -0.08, 1006, rawTag("E-ST01", "Raw 열효율")),
      mkE("E-ST02", "MP Steam System", "HCR", "W150N", "Steam System", "열효율", "%", 89.5, 94, 84, -0.08, -0.10, 1007, rawTag("E-ST02", "Raw 열효율")),
      mkE("E-U101", "CW System", "VDU", "HVGO Max", "Utility", "열효율", "%", 89.3, 93, 83, -0.12, -0.15, 1008, rawTag("E-U101", "Raw 열효율")),
      mkE("E-U102", "Instrument Air System", "CDU", "HS Mode", "Utility", "열효율", "%", 92.0, 95, 87, -0.05, -0.04, 1009, rawTag("E-U102", "Raw 열효율")),
      mkE("E-N101", "CDU Preheat HEN", "CDU", "HS Mode", "HEN", "열효율", "%", 82.5, 90, 75, -0.25, -0.55, 1010, rawTag("E-N101", "Raw 열효율"), "AI-MDL-E02"),
      mkE("E-N201", "VDU Preheat HEN", "VDU", "HVGO Max", "HEN", "열효율", "%", 84.0, 91, 76, -0.20, -0.30, 1011, rawTag("E-N201", "Raw 열효율")),
      mkE("E-N301", "HCR Heat Recovery HEN", "HCR", "W150N", "HEN", "열효율", "%", 85.8, 90, 78, -0.15, -0.20, 1012, rawTag("E-N301", "Raw 열효율")),
    ],
    mechanical: [
      mkE("M-P101", "HCR Feed Pump A", "HCR", "W150N", "펌프", "진동", "mm/s", 3.8, 0, 7.0, 0.08, 0.15, 1101, rawTag("M-P101", "Raw 진동")),
      mkE("M-P102", "HCR Feed Pump B", "HCR", "W150N", "펌프", "진동", "mm/s", 2.5, 0, 7.0, 0.06, 0.05, 1102, rawTag("M-P102", "Raw 진동")),
      mkE("M-P103", "HCR Recycle Pump", "HCR", "W600N", "펌프", "진동", "mm/s", 3.2, 0, 7.0, 0.07, 0.10, 1103, rawTag("M-P103", "Raw 진동")),
      mkE("M-P201", "CDU Reflux Pump A", "CDU", "HS Mode", "펌프", "진동", "mm/s", 4.2, 0, 7.0, 0.10, 0.22, 1104, rawTag("M-P201", "Raw 진동"), "AI-MDL-M01"),
      mkE("M-P202", "CDU Reflux Pump B", "CDU", "HS Mode", "펌프", "진동", "mm/s", 3.0, 0, 7.0, 0.06, 0.07, 1105, rawTag("M-P202", "Raw 진동")),
      mkE("M-P301", "VDU Bottom Pump", "VDU", "HVGO Max", "펌프", "진동", "mm/s", 3.5, 0, 7.0, 0.09, 0.12, 1106, rawTag("M-P301", "Raw 진동")),
      mkE("M-K101", "H2 Makeup Compressor", "HCR", "W150N", "압축기", "진동", "mm/s", 5.1, 0, 8.0, 0.15, 0.35, 1107, rawTag("M-K101", "Raw 진동"), "AI-MDL-M02"),
      mkE("M-K102", "Recycle Gas Compressor", "HCR", "W600N", "압축기", "진동", "mm/s", 4.5, 0, 8.0, 0.12, 0.18, 1108, rawTag("M-K102", "Raw 진동")),
      mkE("M-K201", "Wet Gas Compressor", "FCC", "Max Gasoline", "압축기", "진동", "mm/s", 4.8, 0, 8.0, 0.18, 0.30, 1109, rawTag("M-K201", "Raw 진동")),
      mkE("M-K301", "CCR Net Gas Compressor", "CCR", "Reformate Max", "압축기", "진동", "mm/s", 3.8, 0, 8.0, 0.10, 0.12, 1110, rawTag("M-K301", "Raw 진동")),
      mkE("M-R101", "SRU Blower", "SRU", "3-Bed", "회전기계", "진동", "mm/s", 3.2, 0, 6.0, 0.08, 0.10, 1111, rawTag("M-R101", "Raw 진동")),
      mkE("M-R201", "CDU Air Blower", "CDU", "HS Mode", "회전기계", "진동", "mm/s", 2.8, 0, 6.0, 0.05, 0.06, 1112, rawTag("M-R201", "Raw 진동")),
    ],
  }
  return data[category] || []
}

// ---- 연관 트렌드 태그 ----
export function getRelatedTrends(category: HealthCategory, equipId: string): RelatedTrendTag[] {
  const seed = equipId.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const mkT = (tagId: string, desc: string, unit: string, type: RelatedTrendTag["type"], base: number, vol: number, s: number, limit?: number, lowLimit?: number): RelatedTrendTag => ({
    tagId, description: desc, unit, type,
    values: genTrend(base, vol, 0, 24, s),
    limit, lowLimit,
  })

  const map: Record<HealthCategory, (s: number) => RelatedTrendTag[]> = {
    fouling: (s) => [
      mkT("TI-FO01", "Shell Side Inlet Temp", "deg.C", "Temperature", 180, 8, s+1, 220),
      mkT("TI-FO02", "Shell Side Outlet Temp", "deg.C", "Temperature", 150, 6, s+2, 200),
      mkT("TI-FO03", "Tube Side Inlet Temp", "deg.C", "Temperature", 280, 10, s+3),
      mkT("TI-FO04", "Tube Side Outlet Temp", "deg.C", "Temperature", 240, 8, s+4),
      mkT("FI-FO01", "Shell Side Flow", "m3/h", "Flow", 350, 20, s+5, 500, 200),
      mkT("FI-FO02", "Tube Side Flow", "m3/h", "Flow", 280, 15, s+6, 400, 150),
      mkT("PDI-FO01", "Exchanger dP (Shell)", "kg/cm2", "Pressure", 0.8, 0.15, s+7, 1.5),
      mkT("PDI-FO02", "Exchanger dP (Tube)", "kg/cm2", "Pressure", 0.6, 0.1, s+8, 1.2),
      mkT("TI-FO05", "CW Inlet Temp", "deg.C", "Temperature", 28, 3, s+9, 35),
      mkT("FI-FO03", "CW Flow", "m3/h", "Flow", 500, 30, s+10, undefined, 300),
    ],
    coking: (s) => [
      mkT("TI-CK01", "Coil Outlet Temp", "deg.C", "Temperature", 380, 12, s+1, 420),
      mkT("TI-CK02", "Skin Temp (Max)", "deg.C", "Temperature", 540, 15, s+2, 580),
      mkT("TI-CK03", "Firebox Temp", "deg.C", "Temperature", 850, 25, s+3, 950),
      mkT("FI-CK01", "Coil Flow Rate", "m3/h", "Flow", 120, 10, s+4, undefined, 80),
      mkT("FI-CK02", "Fuel Gas Flow", "Nm3/h", "Flow", 3500, 200, s+5, 5000),
      mkT("AI-CK01", "Excess O2", "%", "Analysis", 3.2, 0.8, s+6, 6.0, 1.5),
      mkT("PI-CK01", "Draft Pressure", "mmH2O", "Pressure", -12, 3, s+7),
      mkT("TI-CK04", "BWT (Bridge Wall Temp)", "deg.C", "Temperature", 780, 20, s+8, 900),
    ],
    "catalyst-aging": (s) => [
      mkT("PI-CA01", "Reactor Pressure", "kg/cm2", "Pressure", 155, 3, s+1, 170, 140),
      mkT("TI-CA01", "Reactor Outlet Temp", "deg.C", "Temperature", 400, 8, s+2, 420),
      mkT("FI-CA01", "Feed Flow", "m3/h", "Flow", 280, 15, s+3, 350, 200),
      mkT("FI-CA02", "H2/HC Ratio", "Nm3/m3", "Flow", 800, 40, s+4, undefined, 600),
      mkT("AI-CA01", "Feed Sulfur", "ppm", "Analysis", 2500, 200, s+5, 4000),
      mkT("AI-CA02", "Product Sulfur", "ppm", "Analysis", 15, 5, s+6, 50),
      mkT("PDI-CA01", "Reactor dP", "kg/cm2", "Pressure", 1.2, 0.2, s+7, 2.0),
      mkT("XI-CA01", "Conversion Rate", "%", "Performance", 92, 2, s+8, undefined, 85),
      mkT("AI-CA03", "Feed Nitrogen", "ppm", "Analysis", 800, 80, s+9, 1500),
      mkT("TI-CA02", "Quench Zone dT", "deg.C", "Temperature", 25, 5, s+10, 40),
    ],
    hydraulics: (s) => [
      mkT("FI-HY01", "Feed Flow Rate", "m3/h", "Flow", 450, 25, s+1, 600, 300),
      mkT("PI-HY01", "Top Pressure", "kg/cm2", "Pressure", 1.5, 0.2, s+2, 2.5),
      mkT("PI-HY02", "Bottom Pressure", "kg/cm2", "Pressure", 1.9, 0.2, s+3, 3.0),
      mkT("LI-HY01", "Tray Level", "%", "Level", 55, 8, s+4, 80, 20),
      mkT("TI-HY01", "Top Temperature", "deg.C", "Temperature", 120, 5, s+5, 150),
      mkT("FI-HY02", "Reflux Flow", "m3/h", "Flow", 180, 12, s+6, 250, 100),
      mkT("FI-HY03", "Vapor Flow", "Nm3/h", "Flow", 2000, 150, s+7, 3000),
    ],
    separation: (s) => [
      mkT("TI-SP01", "Column Top Temp", "deg.C", "Temperature", 125, 4, s+1, 145),
      mkT("TI-SP02", "Column Bottom Temp", "deg.C", "Temperature", 345, 8, s+2, 380),
      mkT("PI-SP01", "Column Pressure", "kg/cm2", "Pressure", 1.2, 0.15, s+3, 1.8),
      mkT("FI-SP01", "Feed Flow", "m3/h", "Flow", 520, 30, s+4, 700, 350),
      mkT("FI-SP02", "Reflux Ratio", "-", "Control", 3.5, 0.3, s+5, 5.0, 2.0),
      mkT("AI-SP01", "Product Purity", "%", "Analysis", 95, 1.5, s+6, undefined, 90),
      mkT("AI-SP02", "Overlap (5-95)", "deg.C", "Analysis", 12, 3, s+7, 20),
      mkT("TI-SP03", "Draw Tray Temp", "deg.C", "Temperature", 250, 10, s+8, 280),
    ],
    energy: (s) => [
      mkT("TI-EN01", "Stack Temp", "deg.C", "Temperature", 185, 10, s+1, 250),
      mkT("FI-EN01", "Fuel Consumption", "Nm3/h", "Flow", 4200, 300, s+2, 5500),
      mkT("AI-EN01", "Excess O2", "%", "Analysis", 3.5, 0.6, s+3, 6.0, 1.5),
      mkT("TI-EN02", "Feed Preheat Temp", "deg.C", "Temperature", 280, 8, s+4, undefined, 240),
      mkT("XI-EN01", "Energy Intensity", "Gcal/kBBL", "Performance", 85, 5, s+5, 100),
      mkT("FI-EN02", "Steam Generation", "ton/h", "Flow", 45, 5, s+6, undefined, 30),
      mkT("TI-EN03", "Flue Gas Temp", "deg.C", "Temperature", 210, 12, s+7, 280),
    ],
    mechanical: (s) => [
      mkT("VI-MC01", "Bearing Vibration (DE)", "mm/s", "Performance", 3.5, 0.8, s+1, 7.0),
      mkT("VI-MC02", "Bearing Vibration (NDE)", "mm/s", "Performance", 2.8, 0.6, s+2, 7.0),
      mkT("TI-MC01", "Bearing Temp (DE)", "deg.C", "Temperature", 65, 5, s+3, 90),
      mkT("TI-MC02", "Bearing Temp (NDE)", "deg.C", "Temperature", 58, 4, s+4, 90),
      mkT("PI-MC01", "Discharge Pressure", "kg/cm2", "Pressure", 12, 1.5, s+5, 16),
      mkT("FI-MC01", "Seal Oil Flow", "L/min", "Flow", 8, 1.2, s+6, undefined, 4),
      mkT("AI-MC01", "Lube Oil Quality", "ppm", "Analysis", 15, 5, s+7, 40),
      mkT("XI-MC01", "Efficiency", "%", "Performance", 82, 3, s+8, undefined, 75),
    ],
  }
  return map[category]?.(seed) || []
}

// 카테고리별 요약
export function getCategorySummary(category: HealthCategory): { red: number; yellow: number; green: number; total: number; immediateAction: number } {
  const eq = getEquipmentData(category)
  return {
    red: eq.filter(e => e.trafficLight === "red").length,
    yellow: eq.filter(e => e.trafficLight === "yellow").length,
    green: eq.filter(e => e.trafficLight === "green").length,
    total: eq.length,
    immediateAction: eq.filter(e => e.projection.needsImmediateAction).length,
  }
}
