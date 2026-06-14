import { growthStandards } from "@/data/growthStandards";
import type { GrowthPercentile, GrowthMetricType } from "@/types";

export function calculateAgeMonths(
  birthDate: string,
  checkupDate: string
): number {
  const birth = new Date(birthDate);
  const checkup = new Date(checkupDate);
  const years = checkup.getFullYear() - birth.getFullYear();
  const months = checkup.getMonth() - birth.getMonth();
  const days = checkup.getDate() - birth.getDate();
  let ageMonths = years * 12 + months;
  if (days < 0) {
    ageMonths -= 1;
  }
  return Math.max(0, ageMonths);
}

export function calculatePreciseAgeMonths(
  birthDate: string,
  checkupDate: string
): number {
  const birth = new Date(birthDate);
  const checkup = new Date(checkupDate);
  const diffMs = checkup.getTime() - birth.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const preciseMonths = diffDays / 30.4375;
  return Math.max(0, preciseMonths);
}

function interpolatePercentile(
  ageMonths: number,
  standardData: Record<number, GrowthPercentile>
): GrowthPercentile | null {
  const ages = Object.keys(standardData)
    .map(Number)
    .sort((a, b) => a - b);

  if (ageMonths <= ages[0]) {
    return standardData[ages[0]];
  }
  if (ageMonths >= ages[ages.length - 1]) {
    return standardData[ages[ages.length - 1]];
  }

  let lowerAge = ages[0];
  let upperAge = ages[ages.length - 1];
  for (let i = 0; i < ages.length - 1; i++) {
    if (ageMonths >= ages[i] && ageMonths <= ages[i + 1]) {
      lowerAge = ages[i];
      upperAge = ages[i + 1];
      break;
    }
  }

  const lower = standardData[lowerAge];
  const upper = standardData[upperAge];
  const ratio = (ageMonths - lowerAge) / (upperAge - lowerAge);

  const keys: (keyof GrowthPercentile)[] = ["p3", "p15", "p50", "p85", "p97"];
  const result: GrowthPercentile = {} as GrowthPercentile;
  keys.forEach((key) => {
    result[key] = lower[key] + (upper[key] - lower[key]) * ratio;
  });

  return result;
}

export function getGrowthPercentileAtAge(
  gender: "male" | "female",
  metric: GrowthMetricType,
  ageMonths: number
): GrowthPercentile | null {
  const standards = growthStandards[gender];
  if (!standards) return null;
  const metricData = standards[metric];
  if (!metricData) return null;
  return interpolatePercentile(ageMonths, metricData);
}

export function calculatePercentileValue(
  value: number,
  percentileData: GrowthPercentile
): number {
  const keys: (keyof GrowthPercentile)[] = ["p3", "p15", "p50", "p85", "p97"];
  const percentileValues = [3, 15, 50, 85, 97];

  if (value <= percentileData.p3) {
    const ratio = value / percentileData.p3;
    return Math.max(0.1, 3 * ratio);
  }
  if (value >= percentileData.p97) {
    const ratio = (value - percentileData.p97) / percentileData.p97;
    return Math.min(99.9, 97 + 3 * ratio);
  }

  for (let i = 0; i < keys.length - 1; i++) {
    const lowerKey = keys[i];
    const upperKey = keys[i + 1];
    const lowerVal = percentileData[lowerKey];
    const upperVal = percentileData[upperKey];
    const lowerPct = percentileValues[i];
    const upperPct = percentileValues[i + 1];

    if (value >= lowerVal && value <= upperVal) {
      const ratio = (value - lowerVal) / (upperVal - lowerVal);
      return lowerPct + (upperPct - lowerPct) * ratio;
    }
  }

  return 50;
}

export function getGrowthStatus(percentile: number): "normal" | "attention" {
  return percentile >= 3 && percentile <= 97 ? "normal" : "attention";
}

export function getGrowthStandardAges(
  gender: "male" | "female",
  metric: GrowthMetricType
): number[] {
  const standards = growthStandards[gender];
  if (!standards) return [];
  const metricData = standards[metric];
  return Object.keys(metricData).map(Number).sort((a, b) => a - b);
}
