import { Stethoscope, Ruler, Scale, Baby, Edit2, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import type { HealthCheckupRecord, Child } from "@/types";
import { getAgeText } from "@/utils/dateUtils";
import { getRecordAnalysis } from "@/utils/pdfExport";

interface HealthCheckupItemProps {
  record: HealthCheckupRecord;
  child: Child;
  onEdit: (record: HealthCheckupRecord) => void;
  onDelete: (recordId: string) => void;
}

export default function HealthCheckupItem({
  record,
  child,
  onEdit,
  onDelete,
}: HealthCheckupItemProps) {
  const analysis = getRecordAnalysis(child, record);
  const ageText = getAgeText(child.birthDate);

  const hasAttention =
    analysis.heightStatus === "attention" ||
    analysis.weightStatus === "attention" ||
    analysis.headCircumferenceStatus === "attention";

  return (
    <div className="relative pl-8 pb-6 last:pb-0">
      <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-4 border-primary-500 bg-white" />
      <div className="absolute left-[7px] top-5 bottom-0 w-0.5 bg-gray-200" />

      <div
        className={`ml-4 p-4 rounded-2xl border transition-all duration-200 ${
          hasAttention
            ? "bg-danger-50/50 border-danger-200"
            : "bg-gray-50/50 border-gray-100 hover:border-primary-200 hover:bg-white"
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                hasAttention ? "bg-danger-100" : "bg-primary-100"
              }`}
            >
              <Stethoscope
                size={16}
                className={hasAttention ? "text-danger-600" : "text-primary-600"}
              />
            </div>
            <div>
              <p className="font-semibold text-gray-800">
                {record.checkupDate}
              </p>
              <p className="text-xs text-gray-500">
                {ageText}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(record)}
              className="p-2 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 transition-colors"
              title="编辑"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => onDelete(record.id)}
              className="p-2 rounded-lg text-gray-400 hover:text-danger-500 hover:bg-danger-50 transition-colors"
              title="删除"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          {record.height !== undefined && (
            <div className="bg-white rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Ruler size={14} className="text-primary-500" />
                <span className="text-xs text-gray-500">身高</span>
              </div>
              <p className="text-lg font-bold text-gray-800">
                {record.height}
                <span className="text-xs font-normal text-gray-500 ml-1">
                  cm
                </span>
              </p>
              {analysis.heightPercentile !== undefined && (
                <div className="flex items-center gap-1 mt-1">
                  {analysis.heightStatus === "normal" ? (
                    <CheckCircle size={12} className="text-success-500" />
                  ) : (
                    <AlertTriangle size={12} className="text-danger-500" />
                  )}
                  <span
                    className={`text-xs ${
                      analysis.heightStatus === "normal"
                        ? "text-success-600"
                        : "text-danger-600"
                    }`}
                  >
                    P{analysis.heightPercentile.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          )}

          {record.weight !== undefined && (
            <div className="bg-white rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Scale size={14} className="text-success-500" />
                <span className="text-xs text-gray-500">体重</span>
              </div>
              <p className="text-lg font-bold text-gray-800">
                {record.weight}
                <span className="text-xs font-normal text-gray-500 ml-1">
                  kg
                </span>
              </p>
              {analysis.weightPercentile !== undefined && (
                <div className="flex items-center gap-1 mt-1">
                  {analysis.weightStatus === "normal" ? (
                    <CheckCircle size={12} className="text-success-500" />
                  ) : (
                    <AlertTriangle size={12} className="text-danger-500" />
                  )}
                  <span
                    className={`text-xs ${
                      analysis.weightStatus === "normal"
                        ? "text-success-600"
                        : "text-danger-600"
                    }`}
                  >
                    P{analysis.weightPercentile.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          )}

          {record.headCircumference !== undefined && (
            <div className="bg-white rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Baby size={14} className="text-warning-500" />
                <span className="text-xs text-gray-500">头围</span>
              </div>
              <p className="text-lg font-bold text-gray-800">
                {record.headCircumference}
                <span className="text-xs font-normal text-gray-500 ml-1">
                  cm
                </span>
              </p>
              {analysis.headCircumferencePercentile !== undefined && (
                <div className="flex items-center gap-1 mt-1">
                  {analysis.headCircumferenceStatus === "normal" ? (
                    <CheckCircle size={12} className="text-success-500" />
                  ) : (
                    <AlertTriangle
                      size={12}
                      className="text-danger-500"
                    />
                  )}
                  <span
                    className={`text-xs ${
                      analysis.headCircumferenceStatus === "normal"
                        ? "text-success-600"
                        : "text-danger-600"
                    }`}
                  >
                    P{analysis.headCircumferencePercentile.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {record.note && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-sm text-gray-600">{record.note}</p>
          </div>
        )}

        {hasAttention && (
          <div className="mt-3 p-2 bg-danger-100/50 rounded-lg flex items-start gap-2">
          <AlertTriangle size={16} className="text-danger-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-danger-700">
            有指标超出正常范围，建议咨询儿保医生。
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
