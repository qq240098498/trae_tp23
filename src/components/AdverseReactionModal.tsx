import { useState, useEffect } from "react";
import {
  X,
  Thermometer,
  AlertCircle,
} from "lucide-react";
import type {
  AdverseReactionRecord,
  AdverseReactionType,
  VaccineRecord,
} from "@/types";
import { formatDate } from "@/utils/dateUtils";

interface AdverseReactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: Omit<AdverseReactionRecord, "id"> & { id?: string }
  ) => void;
  vaccineRecord: VaccineRecord | null;
  editingRecord: AdverseReactionRecord | null;
}

const REACTION_OPTIONS: {
  key: AdverseReactionType;
  label: string;
  icon: string;
}[] = [
  { key: "fever", label: "发烧", icon: "🌡️" },
  { key: "crying", label: "哭闹不安", icon: "😭" },
  { key: "local_redness", label: "局部红肿", icon: "🔴" },
  { key: "local_swelling", label: "局部硬结", icon: "💊" },
  { key: "fatigue", label: "精神不振", icon: "😴" },
  { key: "poor_appetite", label: "食欲不佳", icon: "🍼" },
  { key: "vomiting", label: "呕吐", icon: "🤮" },
  { key: "diarrhea", label: "腹泻", icon: "💩" },
  { key: "rash", label: "皮疹", icon: "🔺" },
  { key: "other", label: "其他", icon: "📝" },
];

const SEVERITY_OPTIONS = [
  { key: "mild", label: "轻度", color: "success" },
  { key: "moderate", label: "中度", color: "warning" },
  { key: "severe", label: "重度", color: "danger" },
] as const;

const TREATMENT_OPTIONS = [
  "物理降温",
  "多喝水",
  "局部热敷",
  "服用退烧药",
  "就医",
  "观察即可",
  "其他处理",
];

export default function AdverseReactionModal({
  isOpen,
  onClose,
  onSubmit,
  vaccineRecord,
  editingRecord,
}: AdverseReactionModalProps) {
  const [reactionDate, setReactionDate] = useState("");
  const [reactions, setReactions] = useState<AdverseReactionType[]>([]);
  const [otherReaction, setOtherReaction] = useState("");
  const [feverTemperature, setFeverTemperature] = useState("");
  const [severity, setSeverity] =
    useState<AdverseReactionRecord["severity"]>("mild");
  const [treatment, setTreatment] = useState("");
  const [customTreatment, setCustomTreatment] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingRecord) {
      setReactionDate(editingRecord.reactionDate);
      setReactions(editingRecord.reactions);
      setOtherReaction(editingRecord.otherReaction || "");
      setFeverTemperature(
        editingRecord.feverTemperature?.toString() || ""
      );
      setSeverity(editingRecord.severity);
      setTreatment(editingRecord.treatment);
      setCustomTreatment("");
      setNotes(editingRecord.notes || "");
    } else if (vaccineRecord) {
      setReactionDate(
        vaccineRecord.vaccinationDate || formatDate(new Date())
      );
      setReactions([]);
      setOtherReaction("");
      setFeverTemperature("");
      setSeverity("mild");
      setTreatment("");
      setCustomTreatment("");
      setNotes("");
    }
    setErrors({});
  }, [editingRecord, vaccineRecord, isOpen]);

  const toggleReaction = (reaction: AdverseReactionType) => {
    setReactions((prev) =>
      prev.includes(reaction)
        ? prev.filter((r) => r !== reaction)
        : [...prev, reaction]
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!reactionDate) {
      newErrors.reactionDate = "请选择副反应出现日期";
    }
    if (reactions.length === 0) {
      newErrors.reactions = "请至少选择一种副反应";
    }
    if (reactions.includes("other") && !otherReaction.trim()) {
      newErrors.otherReaction = "请描述其他副反应";
    }
    if (reactions.includes("fever") && !feverTemperature) {
      newErrors.feverTemperature = "请填写体温";
    }
    if (reactions.includes("fever") && feverTemperature) {
      const temp = parseFloat(feverTemperature);
      if (isNaN(temp) || temp < 35 || temp > 42) {
        newErrors.feverTemperature = "请输入有效的体温（35-42℃）";
      }
    }
    if (!treatment) {
      newErrors.treatment = "请选择处理方式";
    }
    if (treatment === "其他处理" && !customTreatment.trim()) {
      newErrors.customTreatment = "请描述处理方式";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !vaccineRecord) return;

    const finalTreatment =
      treatment === "其他处理" ? customTreatment.trim() : treatment;

    const recordData: Omit<AdverseReactionRecord, "id"> & { id?: string } = {
      childId: vaccineRecord.childId,
      vaccineRecordId: vaccineRecord.id,
      vaccineName: vaccineRecord.vaccineName,
      vaccineDose: vaccineRecord.dose,
      reactionDate,
      reactions,
      otherReaction: otherReaction.trim() || undefined,
      feverTemperature: reactions.includes("fever")
        ? parseFloat(feverTemperature)
        : undefined,
      treatment: finalTreatment,
      notes: notes.trim() || undefined,
      severity,
    };

    if (editingRecord) {
      recordData.id = editingRecord.id;
    }

    onSubmit(recordData);
    onClose();
  };

  if (!isOpen || !vaccineRecord) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center">
              <AlertCircle className="text-warning-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {editingRecord ? "修改副反应记录" : "记录副反应"}
              </h2>
              <p className="text-sm text-gray-500">
                {vaccineRecord.vaccineName} · 第{vaccineRecord.dose}剂
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              副反应出现日期 <span className="text-danger-500">*</span>
            </label>
            <input
              type="date"
              value={reactionDate}
              onChange={(e) => setReactionDate(e.target.value)}
              className={`input-field ${
                errors.reactionDate ? "border-danger-400 focus:ring-danger-100" : ""
              }`}
            />
            {errors.reactionDate && (
              <p className="mt-1 text-sm text-danger-500">
                {errors.reactionDate}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              副反应类型 <span className="text-danger-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REACTION_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => toggleReaction(opt.key)}
                  className={`p-3 rounded-xl text-left transition-all duration-200 border ${
                    reactions.includes(opt.key)
                      ? "bg-warning-50 border-warning-300 text-warning-700"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-lg mr-2">{opt.icon}</span>
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
            {errors.reactions && (
              <p className="mt-2 text-sm text-danger-500">{errors.reactions}</p>
            )}
          </div>

          {reactions.includes("other") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                其他副反应描述 <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={otherReaction}
                onChange={(e) => setOtherReaction(e.target.value)}
                placeholder="请描述具体的副反应"
                className={`input-field ${
                  errors.otherReaction
                    ? "border-danger-400 focus:ring-danger-100"
                    : ""
                }`}
              />
              {errors.otherReaction && (
                <p className="mt-1 text-sm text-danger-500">
                  {errors.otherReaction}
                </p>
              )}
            </div>
          )}

          {reactions.includes("fever") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Thermometer size={16} className="text-danger-500" />
                最高体温（℃） <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="35"
                max="42"
                value={feverTemperature}
                onChange={(e) => setFeverTemperature(e.target.value)}
                placeholder="请输入体温，如 38.5"
                className={`input-field ${
                  errors.feverTemperature
                    ? "border-danger-400 focus:ring-danger-100"
                    : ""
                }`}
              />
              {errors.feverTemperature && (
                <p className="mt-1 text-sm text-danger-500">
                  {errors.feverTemperature}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              严重程度
            </label>
            <div className="flex gap-2">
              {SEVERITY_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSeverity(opt.key)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    severity === opt.key
                      ? opt.color === "success"
                        ? "bg-success-500 text-white shadow-md"
                        : opt.color === "warning"
                        ? "bg-warning-500 text-white shadow-md"
                        : "bg-danger-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              处理方式 <span className="text-danger-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TREATMENT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setTreatment(opt)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    treatment === opt
                      ? "bg-primary-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {errors.treatment && (
              <p className="mt-2 text-sm text-danger-500">{errors.treatment}</p>
            )}
          </div>

          {treatment === "其他处理" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                请描述处理方式 <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={customTreatment}
                onChange={(e) => setCustomTreatment(e.target.value)}
                placeholder="请描述具体的处理方式"
                className={`input-field ${
                  errors.customTreatment
                    ? "border-danger-400 focus:ring-danger-100"
                    : ""
                }`}
              />
              {errors.customTreatment && (
                <p className="mt-1 text-sm text-danger-500">
                  {errors.customTreatment}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              备注（可选）
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="其他需要记录的信息..."
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
              {editingRecord ? "保存修改" : "保存记录"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
