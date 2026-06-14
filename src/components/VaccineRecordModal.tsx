import { useState, useEffect } from "react";
import { X, Syringe, Building, Hash, Calendar } from "lucide-react";
import type { VaccineRecord } from "@/types";
import { formatDate } from "@/utils/dateUtils";

interface VaccineRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    recordId: string,
    vaccinationDate: string,
    institution?: string,
    batchNumber?: string
  ) => void;
  record: VaccineRecord | null;
}

export default function VaccineRecordModal({
  isOpen,
  onClose,
  onSubmit,
  record,
}: VaccineRecordModalProps) {
  const [vaccinationDate, setVaccinationDate] = useState("");
  const [institution, setInstitution] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (record && record.isVaccinated) {
      setVaccinationDate(record.vaccinationDate || "");
      setInstitution(record.institution || "");
      setBatchNumber(record.batchNumber || "");
    } else {
      setVaccinationDate(formatDate(new Date()));
      setInstitution("");
      setBatchNumber("");
    }
    setErrors({});
  }, [record, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!vaccinationDate) {
      newErrors.vaccinationDate = "请选择接种日期";
    } else if (record) {
      const vaccDate = new Date(vaccinationDate);
      const scheduledDate = new Date(record.scheduledDate);
      if (vaccDate < scheduledDate) {
        newErrors.vaccinationDate = "接种日期不能早于应接种日期";
      }
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (vaccDate > today) {
        newErrors.vaccinationDate = "接种日期不能晚于今天";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !record) return;
    onSubmit(
      record.id,
      vaccinationDate,
      institution.trim() || undefined,
      batchNumber.trim() || undefined
    );
    onClose();
  };

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
              <Syringe className="text-success-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {record.isVaccinated ? "修改接种记录" : "标记已接种"}
              </h2>
              <p className="text-sm text-gray-500">
                {record.vaccineName} · 第{record.dose}剂
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-5 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-500">应接种日期</p>
          <p className="text-lg font-semibold text-gray-800">
            {record.scheduledDate}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar size={16} className="text-primary-500" />
              接种日期 <span className="text-danger-500">*</span>
            </label>
            <input
              type="date"
              value={vaccinationDate}
              onChange={(e) => setVaccinationDate(e.target.value)}
              className={`input-field ${
                errors.vaccinationDate
                  ? "border-danger-400 focus:ring-danger-100"
                  : ""
              }`}
            />
            {errors.vaccinationDate && (
              <p className="mt-1 text-sm text-danger-500">
                {errors.vaccinationDate}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Building size={16} className="text-primary-500" />
              接种机构（可选）
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="请输入接种机构名称"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Hash size={16} className="text-primary-500" />
              疫苗批号（可选）
            </label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="请输入疫苗批号"
              className="input-field"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-outline"
            >
              取消
            </button>
            <button type="submit" className="flex-1 btn-success">
              {record.isVaccinated ? "保存修改" : "确认接种"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
