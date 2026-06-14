export interface Child {
  id: string;
  name: string;
  birthDate: string;
  gender: "male" | "female";
}

export interface VaccineSchedule {
  code: string;
  name: string;
  doses: number;
  ageMonths: number[];
  description: string;
}

export interface VaccineRecord {
  id: string;
  childId: string;
  vaccineCode: string;
  vaccineName: string;
  dose: number;
  scheduledDate: string;
  isVaccinated: boolean;
  vaccinationDate?: string;
  institution?: string;
  batchNumber?: string;
}

export type VaccineStatus = "vaccinated" | "pending" | "overdue";

export interface SelfPaidVaccine {
  code: string;
  name: string;
  doses: number;
  ageMonths: number[];
  description: string;
  priceRange: string;
  pricePerDose: number;
}

export type SelfPaidVaccineStatus =
  | "recommended"
  | "vaccinated"
  | "skipped";

export interface SelfPaidVaccineRecord {
  id: string;
  childId: string;
  vaccineCode: string;
  vaccineName: string;
  dose: number;
  scheduledDate: string;
  status: SelfPaidVaccineStatus;
  vaccinationDate?: string;
  institution?: string;
  batchNumber?: string;
}

export interface HealthCheckupRecord {
  id: string;
  childId: string;
  checkupDate: string;
  height?: number;
  weight?: number;
  headCircumference?: number;
  note?: string;
}

export interface GrowthPercentile {
  p3: number;
  p15: number;
  p50: number;
  p85: number;
  p97: number;
}

export type GrowthMetricType = "height" | "weight" | "headCircumference";

export interface GrowthDataPoint {
  ageMonths: number;
  value: number;
  percentile?: number;
  status: "normal" | "attention";
}

export type AdverseReactionType =
  | "fever"
  | "crying"
  | "local_redness"
  | "local_swelling"
  | "fatigue"
  | "poor_appetite"
  | "vomiting"
  | "diarrhea"
  | "rash"
  | "other";

export interface AdverseReactionRecord {
  id: string;
  childId: string;
  vaccineRecordId: string;
  vaccineName: string;
  vaccineDose: number;
  reactionDate: string;
  reactions: AdverseReactionType[];
  otherReaction?: string;
  feverTemperature?: number;
  treatment: string;
  notes?: string;
  severity: "mild" | "moderate" | "severe";
}
