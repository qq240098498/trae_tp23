import {
  AlertCircle,
  Edit2,
  Trash2,
  Stethoscope,
  FileText,
} from "lucide-react";
import type {
  AdverseReactionRecord,
  AdverseReactionType,
} from "@/types";

interface AdverseReactionHistoryProps {
  records: AdverseReactionRecord[];
  onEdit: (record: AdverseReactionRecord) => void;
  onDelete: (recordId: string) => void;
}

const REACTION_LABELS: Record<AdverseReactionType, string> = {
  fever: "发烧",
  crying: "哭闹不安",
  local_redness: "局部红肿",
  local_swelling: "局部硬结",
  fatigue: "精神不振",
  poor_appetite: "食欲不佳",
  vomiting: "呕吐",
  diarrhea: "腹泻",
  rash: "皮疹",
  other: "其他",
};

const SEVERITY_CONFIG = {
  mild: {
    label: "轻度",
    bg: "bg-success-50",
    border: "border-success-200",
    text: "text-success-700",
    dot: "bg-success-500",
  },
  moderate: {
    label: "中度",
    bg: "bg-warning-50",
    border: "border-warning-200",
    text: "text-warning-700",
    dot: "bg-warning-500",
  },
  severe: {
    label: "重度",
    bg: "bg-danger-50",
    border: "border-danger-200",
    text: "text-danger-700",
    dot: "bg-danger-500",
  },
};

export default function AdverseReactionHistory({
  records,
  onEdit,
  onDelete,
}: AdverseReactionHistoryProps) {
  const sortedRecords = [...records].sort(
    (a, b) =>
      new Date(b.reactionDate).getTime() - new Date(a.reactionDate).getTime()
  );

  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <FileText size={32} className="opacity-40" />
        </div>
        <p className="text-lg mb-2">暂无副反应记录</p>
        <p className="text-sm">接种疫苗后可在此记录副反应情况</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedRecords.map((record) => {
        const severityConfig = SEVERITY_CONFIG[record.severity];
        return (
          <div
            key={record.id}
            className={`card p-4 ${severityConfig.bg} ${severityConfig.border} border transition-all duration-300 hover:-translate-y-0.5`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${severityConfig.dot}`}
                    />
                    <h4 className="font-semibold text-gray-800">
                      {record.vaccineName} · 第{record.vaccineDose}剂
                    </h4>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${severityConfig.bg} ${severityConfig.text} border ${severityConfig.border}`}
                  >
                    {severityConfig.label}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <AlertCircle size={14} className="text-gray-400" />
                    <span>反应日期：</span>
                    <span className="font-medium text-gray-800">
                      {record.reactionDate}
                    </span>
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {record.reactions.map((reaction) => (
                      <span
                        key={reaction}
                        className="text-xs px-2 py-1 rounded-full bg-white/70 text-gray-600"
                      >
                        {REACTION_LABELS[reaction]}
                        {reaction === "fever" && record.feverTemperature
                          ? ` ${record.feverTemperature}℃`
                          : ""}
                      </span>
                    ))}
                    {record.otherReaction && (
                      <span className="text-xs px-2 py-1 rounded-full bg-white/70 text-gray-600">
                        {record.otherReaction}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Stethoscope size={14} className="text-gray-400" />
                    <span>处理方式：</span>
                    <span className="font-medium text-gray-800">
                      {record.treatment}
                    </span>
                  </p>

                  {record.notes && (
                    <p className="text-sm text-gray-500 flex items-start gap-2">
                      <FileText size={14} className="text-gray-400 mt-0.5" />
                      <span className="line-clamp-2">{record.notes}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 flex gap-1">
                <button
                  onClick={() => onEdit(record)}
                  className="p-2 rounded-full hover:bg-white/70 text-gray-400 hover:text-primary-500 transition-colors"
                  title="编辑"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onDelete(record.id)}
                  className="p-2 rounded-full hover:bg-white/70 text-gray-400 hover:text-danger-500 transition-colors"
                  title="删除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
