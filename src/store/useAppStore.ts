import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Child,
  VaccineRecord,
  SelfPaidVaccineRecord,
} from "@/types";
import { VACCINE_SCHEDULES } from "@/data/vaccineSchedules";
import { SELF_PAID_VACCINES } from "@/data/selfPaidVaccines";
import { addMonths, generateId } from "@/utils/dateUtils";

interface AppState {
  children: Child[];
  vaccineRecords: VaccineRecord[];
  selfPaidVaccineRecords: SelfPaidVaccineRecord[];
  selectedChildId: string | null;
  addChild: (child: Omit<Child, "id">) => void;
  updateChild: (id: string, child: Partial<Child>) => void;
  deleteChild: (id: string) => void;
  selectChild: (id: string | null) => void;
  addVaccineRecord: (record: Omit<VaccineRecord, "id">) => void;
  updateVaccineRecord: (
    id: string,
    record: Partial<VaccineRecord>
  ) => void;
  markVaccinated: (
    recordId: string,
    vaccinationDate: string,
    institution?: string,
    batchNumber?: string
  ) => void;
  unmarkVaccinated: (recordId: string) => void;
  generateVaccineRecords: (childId: string, birthDate: string) => void;
  getRecordsByChild: (childId: string) => VaccineRecord[];
  generateSelfPaidVaccineRecords: (
    childId: string,
    birthDate: string
  ) => void;
  markSelfPaidVaccinated: (
    recordId: string,
    vaccinationDate: string,
    institution?: string,
    batchNumber?: string
  ) => void;
  skipSelfPaidVaccine: (recordId: string) => void;
  resetSelfPaidVaccine: (recordId: string) => void;
  getSelfPaidRecordsByChild: (childId: string) => SelfPaidVaccineRecord[];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      children: [],
      vaccineRecords: [],
      selfPaidVaccineRecords: [],
      selectedChildId: null,

      addChild: (childData) => {
        const id = generateId();
        const newChild: Child = { ...childData, id };
        set((state) => ({
          children: [...state.children, newChild],
          selectedChildId: state.selectedChildId || id,
        }));
        get().generateVaccineRecords(id, childData.birthDate);
        get().generateSelfPaidVaccineRecords(id, childData.birthDate);
      },

      updateChild: (id, childData) => {
        set((state) => ({
          children: state.children.map((c) =>
            c.id === id ? { ...c, ...childData } : c
          ),
        }));
      },

      deleteChild: (id) => {
        set((state) => ({
          children: state.children.filter((c) => c.id !== id),
          vaccineRecords: state.vaccineRecords.filter(
            (r) => r.childId !== id
          ),
          selfPaidVaccineRecords: state.selfPaidVaccineRecords.filter(
            (r) => r.childId !== id
          ),
          selectedChildId:
            state.selectedChildId === id
              ? state.children.filter((c) => c.id !== id)[0]?.id || null
              : state.selectedChildId,
        }));
      },

      selectChild: (id) => {
        set({ selectedChildId: id });
        if (id) {
          const state = get();
          const child = state.children.find((c) => c.id === id);
          const hasSelfPaidRecords = state.selfPaidVaccineRecords.some(
            (r) => r.childId === id
          );
          if (child && !hasSelfPaidRecords) {
            state.generateSelfPaidVaccineRecords(id, child.birthDate);
          }
        }
      },

      addVaccineRecord: (recordData) => {
        const id = generateId();
        const newRecord: VaccineRecord = { ...recordData, id };
        set((state) => ({
          vaccineRecords: [...state.vaccineRecords, newRecord],
        }));
      },

      updateVaccineRecord: (id, recordData) => {
        set((state) => ({
          vaccineRecords: state.vaccineRecords.map((r) =>
            r.id === id ? { ...r, ...recordData } : r
          ),
        }));
      },

      markVaccinated: (
        recordId,
        vaccinationDate,
        institution,
        batchNumber
      ) => {
        set((state) => ({
          vaccineRecords: state.vaccineRecords.map((r) =>
            r.id === recordId
              ? {
                  ...r,
                  isVaccinated: true,
                  vaccinationDate,
                  institution,
                  batchNumber,
                }
              : r
          ),
        }));
      },

      unmarkVaccinated: (recordId) => {
        set((state) => ({
          vaccineRecords: state.vaccineRecords.map((r) =>
            r.id === recordId
              ? {
                  ...r,
                  isVaccinated: false,
                  vaccinationDate: undefined,
                  institution: undefined,
                  batchNumber: undefined,
                }
              : r
          ),
        }));
      },

      generateVaccineRecords: (childId, birthDate) => {
        const records: VaccineRecord[] = [];

        VACCINE_SCHEDULES.forEach((schedule) => {
          schedule.ageMonths.forEach((ageMonth, doseIndex) => {
            const scheduledDate = addMonths(birthDate, ageMonth);
            records.push({
              id: generateId(),
              childId,
              vaccineCode: schedule.code,
              vaccineName: schedule.name,
              dose: doseIndex + 1,
              scheduledDate,
              isVaccinated: false,
            });
          });
        });

        set((state) => ({
          vaccineRecords: [...state.vaccineRecords, ...records],
        }));
      },

      getRecordsByChild: (childId) => {
        return get().vaccineRecords.filter((r) => r.childId === childId);
      },

      generateSelfPaidVaccineRecords: (childId, birthDate) => {
        const records: SelfPaidVaccineRecord[] = [];

        SELF_PAID_VACCINES.forEach((vaccine) => {
          vaccine.ageMonths.forEach((ageMonth, doseIndex) => {
            const scheduledDate = addMonths(birthDate, ageMonth);
            records.push({
              id: generateId(),
              childId,
              vaccineCode: vaccine.code,
              vaccineName: vaccine.name,
              dose: doseIndex + 1,
              scheduledDate,
              status: "recommended",
            });
          });
        });

        set((state) => ({
          selfPaidVaccineRecords: [
            ...state.selfPaidVaccineRecords,
            ...records,
          ],
        }));
      },

      markSelfPaidVaccinated: (
        recordId,
        vaccinationDate,
        institution,
        batchNumber
      ) => {
        set((state) => ({
          selfPaidVaccineRecords: state.selfPaidVaccineRecords.map(
            (r) =>
              r.id === recordId
                ? {
                    ...r,
                    status: "vaccinated",
                    vaccinationDate,
                    institution,
                    batchNumber,
                  }
                : r
          ),
        }));
      },

      skipSelfPaidVaccine: (recordId) => {
        set((state) => ({
          selfPaidVaccineRecords: state.selfPaidVaccineRecords.map(
            (r) =>
              r.id === recordId
                ? {
                    ...r,
                    status: "skipped",
                    vaccinationDate: undefined,
                    institution: undefined,
                    batchNumber: undefined,
                  }
                : r
          ),
        }));
      },

      resetSelfPaidVaccine: (recordId) => {
        set((state) => ({
          selfPaidVaccineRecords: state.selfPaidVaccineRecords.map(
            (r) =>
              r.id === recordId
                ? {
                    ...r,
                    status: "recommended",
                    vaccinationDate: undefined,
                    institution: undefined,
                    batchNumber: undefined,
                  }
                : r
          ),
        }));
      },

      getSelfPaidRecordsByChild: (childId) => {
        return get().selfPaidVaccineRecords.filter(
          (r) => r.childId === childId
        );
      },
    }),
    {
      name: "child-health-record-storage",
    }
  )
);
