import { useState, useEffect } from "react";
import { X, Stethoscope, Ruler, Scale, Baby, FileText } from "lucide-react";
import type { HealthCheckupRecord } from "@/types";
import { formatDate } from "@/utils/dateUtils";

interface HealthCheckupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<HealthCheckupRecord, "id"> & { id?: string }) => void;
  childId: string;
  editingRecord?: HealthCheckupRecord | null;
}

export default function HealthCheckupModal({
  isOpen,
  onClose,
  onSubmit,
  childId,
  editingRecord,
}: HealthCheckupModalProps) {
  const [checkupDate, setCheckupDate] = useState(formatDate(new Date()));
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [headCircumference, setHeadCircumference] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingRecord) {
      setCheckupDate(editingRecord.checkupDate);
      setHeight(editingRecord.height?.toString() || "");
      setWeight(editingRecord.weight?.toString() || "");
      setHeadCircumference(
        editingRecord.headCircumference?.toString() || ""
      );
      setNote(editingRecord.note || "");
    } else {
      setCheckupDate(formatDate(new Date()));
      setHeight("");
      setWeight("");
      setHeadCircumference("");
      setNote("");
    }
    setErrors({});
  }, [editingRecord, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!checkupDate) {
      newErrors.checkupDate = "请选择体检日期";
    } else {
      const today = new Date();
      const selected = new Date(checkupDate);
      if (selected > today) {
        newErrors.checkupDate = "体检日期不能晚于今天";
      }
    }
    const hasAnyData =
      height.trim() || weight.trim() || headCircumference.trim();
    if (!hasAnyData) {
      newErrors.general = "请至少填写一项测量数据";
    }
    if (height) {
      const h = parseFloat(height);
      if (isNaN(h) || h <= 0 || h > 200) {
        newErrors.height = "请输入有效的身高值(0-200cm)";
      }
    }
    if (weight) {
      const w = parseFloat(weight);
      if (isNaN(w) || w <= 0 || w > 100) {
        newErrors.weight = "请输入有效的体重值(0-100kg)";
      }
    }
    if (headCircumference) {
      const hc = parseFloat(headCircumference);
      if (isNaN(hc) || hc <= 0 || hc > 80) {
        newErrors.headCircumference = "请输入有效的头围值(0-80cm)";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const data: Omit<HealthCheckupRecord, "id"> = {
      childId,
      checkupDate,
      height: height ? parseFloat(height) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      headCircumference: headCircumference
        ? parseFloat(headCircumference)
        : undefined,
      note: note.trim() || undefined,
    };
    if (editingRecord) {
      onSubmit({ ...data, id: editingRecord.id } as HealthCheckupRecord);
    } else {
      onSubmit(data);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
              <Stethoscope className="text-success-600" size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {editingRecord ? "编辑体检记录" : "添加体检记录"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errors.general && (
            <div className="p-3 bg-danger-50 border border-danger-200 rounded-xl text-sm text-danger-600">
              {errors.general}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              体检日期
            </label>
            <input
              type="date"
              value={checkupDate}
              onChange={(e) => setCheckupDate(e.target.value)}
              className={`input-field ${
                errors.checkupDate ? "border-danger-400 focus:ring-danger-100" : ""
              }`}
            />
            {errors.checkupDate && (
              <p className="mt-1 text-sm text-danger-500">
                {errors.checkupDate}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Ruler size={16} className="text-primary-500" />
                身高 (cm)
              </div>
            </label>
            <input
              type="number"
              step="0.1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="请输入身高"
              className={`input-field ${
                errors.height ? "border-danger-400 focus:ring-danger-100" : ""
              }`}
            />
            {errors.height && (
              <p className="mt-1 text-sm text-danger-500">{errors.height}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Scale size={16} className="text-success-500" />
                体重 (kg)
              </div>
            </label>
            <input
              type="number"
              step="0.01"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="请输入体重"
              className={`input-field ${
                errors.weight ? "border-danger-400 focus:ring-danger-100" : ""
              }`}
            />
            {errors.weight && (
              <p className="mt-1 text-sm text-danger-500">{errors.weight}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Baby size={16} className="text-warning-500" />
                头围 (cm)
              </div>
            </label>
            <input
              type="number"
              step="0.1"
              value={headCircumference}
              onChange={(e) => setHeadCircumference(e.target.value)}
              placeholder="请输入头围"
              className={`input-field ${
                errors.headCircumference
                  ? "border-danger-400 focus:ring-danger-100"
                  : ""
              }`}
            />
            {errors.headCircumference && (
              <p className="mt-1 text-sm text-danger-500">
                {errors.headCircumference}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-gray-500" />
                备注
              </div>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="体检备注、医生建议等"
              rows={3}
              className="input-field resize-none"
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
            <button type="submit" className="flex-1 btn-primary">
              {editingRecord ? "保存" : "添加"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
