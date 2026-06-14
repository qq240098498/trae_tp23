import { Syringe, CheckCircle, Clock, AlertTriangle, Undo2 } from "lucide-react";
import type { VaccineRecord, VaccineStatus } from "@/types";
import { getDaysUntil, isOverdue } from "@/utils/dateUtils";

interface VaccineTimelineItemProps {
  record: VaccineRecord;
  onMarkVaccinated: (record: VaccineRecord) => void;
  onUnmarkVaccinated: (recordId: string) => void;
}

function getStatus(
  scheduledDate: string,
  isVaccinated: boolean
): VaccineStatus {
  if (isVaccinated) return "vaccinated";
  if (isOverdue(scheduledDate, isVaccinated)) return "overdue";
  return "pending";
}

export default function VaccineTimelineItem({
  record,
  onMarkVaccinated,
  onUnmarkVaccinated,
}: VaccineTimelineItemProps) {
  const status = getStatus(record.scheduledDate, record.isVaccinated);
  const daysUntil = getDaysUntil(record.scheduledDate);

  const statusConfig = {
    vaccinated: {
      bg: "bg-success-50",
      border: "border-success-200",
      accent: "bg-success-500",
      text: "text-success-700",
      label: "已接种",
      icon: CheckCircle,
      ring: "ring-success-200",
    },
    pending: {
      bg: "bg-primary-50",
      border: "border-primary-200",
      accent: "bg-primary-500",
      text: "text-primary-700",
      label: "待接种",
      icon: Clock,
      ring: "ring-primary-200",
    },
    overdue: {
      bg: "bg-danger-50",
      border: "border-danger-200",
      accent: "bg-danger-500",
      text: "text-danger-700",
      label: "已逾期",
      icon: AlertTriangle,
      ring: "ring-danger-200",
    },
  }[status];

  const StatusIcon = statusConfig.icon;

  const getDaysText = () => {
    if (status === "vaccinated") return null;
    if (daysUntil === 0) return "今天应接种";
    if (daysUntil > 0) return `${daysUntil}天后接种`;
    return `已逾期${Math.abs(daysUntil)}天`;
  };

  return (
    <div className="relative pl-10 pb-6 last:pb-0">
      <div
        className={`absolute left-4 top-4 w-0.5 h-full ${
          status === "vaccinated" ? "bg-success-200" : "bg-gray-200"
        }`}
        style={{ bottom: "0" }}
      />
      <div
        className={`absolute left-2 top-0 w-6 h-6 rounded-full ${
          statusConfig.accent
        } ring-4 ${statusConfig.ring} flex items-center justify-center z-10`}
      >
        <CheckCircle size={12} className="text-white" fill="white" />
      </div>

      <div
        className={`card p-5 ${statusConfig.bg} ${statusConfig.border} border transition-all duration-300 hover:-translate-y-0.5`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h4 className="font-semibold text-gray-800 text-lg">
                {record.vaccineName}
              </h4>
              <span className="text-sm px-2.5 py-1 rounded-full bg-white/70 text-gray-600 font-medium">
                第{record.dose}剂
              </span>
              <span
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}
              >
                <StatusIcon size={12} />
                {statusConfig.label}
              </span>
            </div>

            <div className="mt-3 space-y-1.5">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Syringe size={14} className="text-gray-400" />
                <span>应接种日期：</span>
                <span className="font-medium text-gray-800">
                  {record.scheduledDate}
                </span>
                {getDaysText() && (
                  <span
                    className={`ml-2 ${
                      status === "overdue"
                        ? "text-danger-600 font-medium"
                        : status === "pending" && daysUntil <= 7
                        ? "text-warning-600 font-medium"
                        : "text-gray-500"
                    }`}
                  >
                    ({getDaysText()})
                  </span>
                )}
              </p>

              {record.isVaccinated && (
                <>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle size={14} className="text-success-500" />
                    <span>接种日期：</span>
                    <span className="font-medium text-gray-800">
                      {record.vaccinationDate}
                    </span>
                  </p>
                  {record.institution && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-3.5 text-center text-gray-400">
                        🏥
                      </span>
                      <span>接种机构：</span>
                      <span className="font-medium text-gray-800">
                        {record.institution}
                      </span>
                    </p>
                  )}
                  {record.batchNumber && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-3.5 text-center text-gray-400">
                        📋
                      </span>
                      <span>疫苗批号：</span>
                      <span className="font-medium text-gray-800">
                        {record.batchNumber}
                      </span>
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex-shrink-0">
            {!record.isVaccinated ? (
              <button
                onClick={() => onMarkVaccinated(record)}
                className={`px-5 py-2.5 rounded-full font-medium transition-all duration-200 shadow-md hover:shadow-lg ${
                  status === "overdue"
                    ? "bg-danger-500 text-white hover:bg-danger-600"
                    : "bg-primary-500 text-white hover:bg-primary-600"
                }`}
              >
                标记已接种
              </button>
            ) : (
              <button
                onClick={() => onUnmarkVaccinated(record.id)}
                className="px-4 py-2 rounded-full font-medium text-gray-500 hover:text-danger-600 hover:bg-danger-50 transition-all duration-200 flex items-center gap-1.5"
                title="撤销接种"
              >
                <Undo2 size={16} />
                撤销
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
