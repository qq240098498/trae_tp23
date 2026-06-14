import { useMemo } from "react";
import {
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ClipboardCheck,
  FileText,
  Syringe,
  Calendar,
} from "lucide-react";
import type { Child, VaccineRecord } from "@/types";
import {
  generateVaccineCheckReport,
  ageMonthToText,
  formatDateDisplay,
  type VaccineCheckReportData,
  type VaccineCheckItem,
} from "@/utils/vaccineCheckReport";

interface VaccineCheckReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  child: Child | null;
  vaccineRecords: VaccineRecord[];
  onExportPdf: () => void;
}

function StatusBadge({
  status,
}: {
  status: "completed" | "partial" | "missing";
}) {
  const config = {
    completed: {
      label: "已完成",
      icon: CheckCircle2,
      className:
        "bg-success-50 text-success-700 border-success-200",
      iconClass: "text-success-500",
    },
    partial: {
      label: "部分完成",
      icon: AlertCircle,
      className: "bg-warning-50 text-warning-700 border-warning-200",
      iconClass: "text-warning-500",
    },
    missing: {
      label: "漏种",
      icon: XCircle,
      className: "bg-danger-50 text-danger-700 border-danger-200",
      iconClass: "text-danger-500",
    },
  };

  const cfg = config[status];
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.className}`}
    >
      <Icon size={12} className={cfg.iconClass} />
      {cfg.label}
    </span>
  );
}

function VaccineItemCard({ item }: { item: VaccineCheckItem }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-800">{item.name}</h4>
            <StatusBadge status={item.status} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <p className="text-lg font-bold text-gray-800">
            {item.completedDoses}
            <span className="text-gray-400 text-sm font-normal">
              /{item.totalDoses}
            </span>
          </p>
          <p className="text-xs text-gray-500">剂次</p>
        </div>
      </div>

      <div className="space-y-2">
        {item.doseDetails.map((dose) => (
          <div
            key={dose.dose}
            className={`flex items-center gap-3 p-2.5 rounded-lg text-sm ${
              dose.isCompleted ? "bg-success-50" : "bg-gray-50"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                dose.isCompleted
                  ? "bg-success-500 text-white"
                  : "bg-gray-300 text-white"
              }`}
            >
              {dose.isCompleted ? (
                <CheckCircle2 size={14} />
              ) : (
                <span className="text-xs font-bold">{dose.dose}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-gray-700">
                第{dose.dose}剂
              </span>
              <span className="text-gray-500 mx-1.5">·</span>
              <span className="text-gray-500">
                应种：{ageMonthToText(dose.ageMonth)}
              </span>
            </div>
            <div className="flex-shrink-0 text-right">
              <Calendar size={12} className="inline mr-1 text-gray-400" />
              <span
                className={
                  dose.isCompleted ? "text-success-600" : "text-gray-400"
                }
              >
                {dose.isCompleted ? formatDateDisplay(dose.vaccinationDate) : "未接种"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VaccineSection({
  title,
  items,
  icon,
  iconBgClass,
  iconClass,
}: {
  title: string;
  items: VaccineCheckItem[];
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  iconBgClass: string;
  iconClass: string;
}) {
  if (items.length === 0) return null;

  const Icon = icon;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBgClass}`}>
          <Icon size={16} className={iconClass} />
        </div>
        <h3 className="text-base font-semibold text-gray-800">
          {title}
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({items.length}种)
          </span>
        </h3>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <VaccineItemCard key={item.code} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function VaccineCheckReportModal({
  isOpen,
  onClose,
  child,
  vaccineRecords,
  onExportPdf,
}: VaccineCheckReportModalProps) {
  const report: VaccineCheckReportData | null = useMemo(() => {
    if (!child) return null;
    return generateVaccineCheckReport(child, vaccineRecords);
  }, [child, vaccineRecords]);

  if (!isOpen || !report) return null;

  const overallStatusConfig = {
    completed: {
      label: "查验合格",
      subLabel: "所有规定疫苗均已完成接种",
      icon: CheckCircle2,
      bgClass: "bg-gradient-to-br from-success-50 to-green-50",
      borderClass: "border-success-200",
      iconClass: "text-success-500",
    },
    partial: {
      label: "部分完成",
      subLabel: "部分疫苗尚未完成全程接种",
      icon: AlertCircle,
      bgClass: "bg-gradient-to-br from-warning-50 to-amber-50",
      borderClass: "border-warning-200",
      iconClass: "text-warning-500",
    },
    missing: {
      label: "需要补种",
      subLabel: "存在未接种的规定疫苗",
      icon: XCircle,
      bgClass: "bg-gradient-to-br from-danger-50 to-red-50",
      borderClass: "border-danger-200",
      iconClass: "text-danger-500",
    },
  };

  const statusCfg = overallStatusConfig[report.overallStatus];
  const OverallIcon = statusCfg.icon;

  const progressPercent =
    report.totalRequiredDoses > 0
      ? (report.completedDoses / report.totalRequiredDoses) * 100
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-slide-up flex flex-col">
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <ClipboardCheck className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  儿童入园/入学预防接种查验报告
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  报告生成日期：{report.reportDate}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div
            className={`rounded-2xl p-5 mb-6 border ${statusCfg.borderClass} ${statusCfg.bgClass}`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center flex-shrink-0 shadow-sm ${statusCfg.iconClass}`}
              >
                <OverallIcon size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      {report.child.name}
                      <span className="text-base font-normal text-gray-500">
                        ({report.child.gender === "male" ? "男" : "女"})
                      </span>
                    </h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      出生日期：{report.child.birthDate} · 当前年龄：
                      {ageMonthToText(report.currentAgeMonths)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${statusCfg.iconClass}`}
                    >
                      {statusCfg.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {statusCfg.subLabel}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">接种完成率</span>
                    <span className="font-semibold text-gray-800">
                      {report.completedDoses}/{report.totalRequiredDoses} 剂 (
                      {progressPercent.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-3 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        report.overallStatus === "completed"
                          ? "bg-gradient-to-r from-success-400 to-green-500"
                          : report.overallStatus === "partial"
                          ? "bg-gradient-to-r from-warning-400 to-amber-500"
                          : "bg-gradient-to-r from-danger-400 to-red-500"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-white/60 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-success-600 mb-1">
                      <CheckCircle2 size={14} />
                      <span className="text-xs font-medium">已完成</span>
                    </div>
                    <p className="text-xl font-bold text-gray-800">
                      {report.completedVaccines.length}
                    </p>
                    <p className="text-xs text-gray-500">种疫苗</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-warning-600 mb-1">
                      <AlertCircle size={14} />
                      <span className="text-xs font-medium">部分完成</span>
                    </div>
                    <p className="text-xl font-bold text-gray-800">
                      {report.partiallyCompletedVaccines.length}
                    </p>
                    <p className="text-xs text-gray-500">种疫苗</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-danger-600 mb-1">
                      <XCircle size={14} />
                      <span className="text-xs font-medium">漏种</span>
                    </div>
                    <p className="text-xl font-bold text-gray-800">
                      {report.missingVaccines.length}
                    </p>
                    <p className="text-xs text-gray-500">种疫苗</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText size={14} className="text-primary-500" />
              <span className="font-medium text-gray-700">说明：</span>
              <span>
                本报告根据国家免疫规划疫苗儿童免疫程序（6岁/入学前）要求生成，如对结果有疑问请咨询接种单位医生。
              </span>
            </div>
          </div>

          <VaccineSection
            title="已完成接种的疫苗"
            items={report.completedVaccines}
            icon={CheckCircle2}
            iconBgClass="bg-success-100"
            iconClass="text-success-600"
          />

          <VaccineSection
            title="部分完成的疫苗（需继续接种）"
            items={report.partiallyCompletedVaccines}
            icon={AlertCircle}
            iconBgClass="bg-warning-100"
            iconClass="text-warning-600"
          />

          <VaccineSection
            title="漏种的疫苗（需尽快补种）"
            items={report.missingVaccines}
            icon={XCircle}
            iconBgClass="bg-danger-100"
            iconClass="text-danger-600"
          />

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <p className="font-medium text-gray-700 mb-1">家长/监护人签字：</p>
                <p className="text-gray-400">________________________</p>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">接种单位盖章：</p>
                <p className="text-gray-400">________________________</p>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-400 text-center">
              <Syringe size={12} className="inline mr-1" />
              本报告由系统自动生成 · 儿童健康记录工具
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="btn-outline flex items-center gap-2"
            >
              <X size={16} />
              关闭
            </button>
            <button
              onClick={onExportPdf}
              className="btn-primary flex items-center gap-2"
            >
              <Download size={16} />
              导出PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
