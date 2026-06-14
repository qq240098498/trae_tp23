import type { Child, VaccineRecord } from "@/types";
import { VACCINE_SCHEDULES } from "@/data/vaccineSchedules";
import { calculateAgeMonths } from "./growthUtils";

export interface VaccineCheckItem {
  code: string;
  name: string;
  description: string;
  totalDoses: number;
  completedDoses: number;
  requiredBeforeSchoolAge: boolean;
  ageMonths: number[];
  status: "completed" | "partial" | "missing";
  doseDetails: {
    dose: number;
    ageMonth: number;
    isCompleted: boolean;
    vaccinationDate?: string;
  }[];
}

export interface VaccineCheckReportData {
  child: Child;
  currentAgeMonths: number;
  reportDate: string;
  schoolAgeThreshold: number;
  totalRequiredDoses: number;
  completedDoses: number;
  missingDoses: number;
  overallStatus: "completed" | "partial" | "missing";
  completedVaccines: VaccineCheckItem[];
  partiallyCompletedVaccines: VaccineCheckItem[];
  missingVaccines: VaccineCheckItem[];
  allVaccines: VaccineCheckItem[];
}

const SCHOOL_AGE_MONTHS = 72;

function formatDateCN(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

export function generateVaccineCheckReport(
  child: Child,
  vaccineRecords: VaccineRecord[]
): VaccineCheckReportData {
  const currentAgeMonths = calculateAgeMonths(child.birthDate, new Date().toISOString().split("T")[0]);
  const effectiveAgeMonths = Math.max(currentAgeMonths, SCHOOL_AGE_MONTHS);

  const allVaccines: VaccineCheckItem[] = VACCINE_SCHEDULES.map((schedule) => {
    const records = vaccineRecords.filter(
      (r) => r.vaccineCode === schedule.code
    );

    const relevantAgeMonths = schedule.ageMonths.filter(
      (age) => age <= effectiveAgeMonths
    );

    const requiredBeforeSchoolAge = schedule.ageMonths.some(
      (age) => age <= SCHOOL_AGE_MONTHS
    );

    const doseDetails = relevantAgeMonths.map((ageMonth, idx) => {
      const doseNumber = schedule.ageMonths.indexOf(ageMonth) + 1;
      const record = records.find((r) => r.dose === doseNumber);
      return {
        dose: doseNumber,
        ageMonth,
        isCompleted: record?.isVaccinated ?? false,
        vaccinationDate: record?.vaccinationDate,
      };
    });

    const totalDoses = relevantAgeMonths.length;
    const completedDoses = doseDetails.filter((d) => d.isCompleted).length;

    let status: "completed" | "partial" | "missing";
    if (completedDoses === 0) {
      status = "missing";
    } else if (completedDoses === totalDoses) {
      status = "completed";
    } else {
      status = "partial";
    }

    return {
      code: schedule.code,
      name: schedule.name,
      description: schedule.description,
      totalDoses,
      completedDoses,
      requiredBeforeSchoolAge,
      ageMonths: relevantAgeMonths,
      status,
      doseDetails,
    };
  }).filter((v) => v.totalDoses > 0);

  const completedVaccines = allVaccines.filter((v) => v.status === "completed");
  const partiallyCompletedVaccines = allVaccines.filter(
    (v) => v.status === "partial"
  );
  const missingVaccines = allVaccines.filter((v) => v.status === "missing");

  const totalRequiredDoses = allVaccines.reduce(
    (sum, v) => sum + v.totalDoses,
    0
  );
  const completedDosesCount = allVaccines.reduce(
    (sum, v) => sum + v.completedDoses,
    0
  );
  const missingDosesCount = totalRequiredDoses - completedDosesCount;

  let overallStatus: "completed" | "partial" | "missing";
  if (completedDosesCount === 0) {
    overallStatus = "missing";
  } else if (completedDosesCount === totalRequiredDoses) {
    overallStatus = "completed";
  } else {
    overallStatus = "partial";
  }

  return {
    child,
    currentAgeMonths,
    reportDate: formatDateCN(new Date()),
    schoolAgeThreshold: SCHOOL_AGE_MONTHS,
    totalRequiredDoses,
    completedDoses: completedDosesCount,
    missingDoses: missingDosesCount,
    overallStatus,
    completedVaccines,
    partiallyCompletedVaccines,
    missingVaccines,
    allVaccines,
  };
}

export function ageMonthToText(months: number): string {
  if (months === 0) return "出生时";
  if (months < 12) return `${months}月龄`;
  const years = Math.floor(months / 12);
  const remainMonths = months % 12;
  if (remainMonths === 0) return `${years}岁`;
  return `${years}岁${remainMonths}月`;
}

export function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return formatDateCN(date);
}

export { formatDateCN };
