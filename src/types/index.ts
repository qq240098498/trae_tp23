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
