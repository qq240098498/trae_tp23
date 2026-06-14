import { useState, useMemo, useRef } from "react";
import {
  Plus,
  Stethoscope,
  Syringe,
  ShieldAlert,
  CheckCircle2,
  Coins,
  XCircle,
  Sparkles,
  Download,
  Ruler,
  TrendingUp,
  Scale,
  Baby,
  AlertCircle,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import ChildCard from "@/components/ChildCard";
import AddChildModal from "@/components/AddChildModal";
import VaccineRecordModal from "@/components/VaccineRecordModal";
import VaccineTimelineItem from "@/components/VaccineTimelineItem";
import SelfPaidVaccineTimelineItem from "@/components/SelfPaidVaccineTimelineItem";
import SelfPaidVaccineRecordModal from "@/components/SelfPaidVaccineRecordModal";
import HealthCheckupModal from "@/components/HealthCheckupModal";
import HealthCheckupItem from "@/components/HealthCheckupItem";
import GrowthChart, { type GrowthChartRef } from "@/components/GrowthChart";
import EmptyState from "@/components/EmptyState";
import AdverseReactionModal from "@/components/AdverseReactionModal";
import AdverseReactionHistory from "@/components/AdverseReactionHistory";
import type {
  Child,
  VaccineRecord,
  SelfPaidVaccineRecord,
  HealthCheckupRecord,
  GrowthMetricType,
  AdverseReactionRecord,
} from "@/types";
import { isOverdue, getDaysUntil } from "@/utils/dateUtils";
import { exportGrowthPdf } from "@/utils/pdfExport";

type FilterType = "all" | "pending" | "vaccinated" | "overdue";
type SelfPaidFilterType = "all" | "recommended" | "vaccinated" | "skipped";
type TabType = "vaccine" | "selfPaid" | "checkup" | "adverseReaction";

export default function Home() {
  const {
    children,
    vaccineRecords,
    selfPaidVaccineRecords,
    healthCheckupRecords,
    adverseReactionRecords,
    selectedChildId,
    addChild,
    updateChild,
    deleteChild,
    selectChild,
    markVaccinated,
    unmarkVaccinated,
    markSelfPaidVaccinated,
    skipSelfPaidVaccine,
    resetSelfPaidVaccine,
    addHealthCheckupRecord,
    updateHealthCheckupRecord,
    deleteHealthCheckupRecord,
    addAdverseReactionRecord,
    updateAdverseReactionRecord,
    deleteAdverseReactionRecord,
  } = useAppStore();

  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [isVaccineRecordModalOpen, setIsVaccineRecordModalOpen] =
    useState(false);
  const [editingRecord, setEditingRecord] = useState<VaccineRecord | null>(
    null
  );
  const [isSelfPaidModalOpen, setIsSelfPaidModalOpen] = useState(false);
  const [editingSelfPaidRecord, setEditingSelfPaidRecord] =
    useState<SelfPaidVaccineRecord | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selfPaidFilter, setSelfPaidFilter] =
    useState<SelfPaidFilterType>("all");
  const [activeTab, setActiveTab] = useState<TabType>("vaccine");
  const [isCheckupModalOpen, setIsCheckupModalOpen] = useState(false);
  const [editingCheckupRecord, setEditingCheckupRecord] =
    useState<HealthCheckupRecord | null>(null);
  const [growthMetric, setGrowthMetric] = useState<GrowthMetricType>("height");
  const heightChartRef = useRef<GrowthChartRef>(null);
  const weightChartRef = useRef<GrowthChartRef>(null);
  const headChartRef = useRef<GrowthChartRef>(null);
  const [isAdverseReactionModalOpen, setIsAdverseReactionModalOpen] =
    useState(false);
  const [adverseReactionVaccineRecord, setAdverseReactionVaccineRecord] =
    useState<VaccineRecord | null>(null);
  const [editingAdverseReaction, setEditingAdverseReaction] =
    useState<AdverseReactionRecord | null>(null);

  const selectedChild = children.find((c) => c.id === selectedChildId);

  const childRecords = useMemo(() => {
    if (!selectedChildId) return [];
    return vaccineRecords.filter((r) => r.childId === selectedChildId);
  }, [vaccineRecords, selectedChildId]);

  const sortedRecords = useMemo(() => {
    return [...childRecords].sort((a, b) => {
      if (a.isVaccinated !== b.isVaccinated) {
        return a.isVaccinated ? 1 : -1;
      }
      return (
        new Date(a.scheduledDate).getTime() -
        new Date(b.scheduledDate).getTime()
      );
    });
  }, [childRecords]);

  const filteredRecords = useMemo(() => {
    return sortedRecords.filter((record) => {
      switch (filter) {
        case "pending":
          return (
            !record.isVaccinated &&
            !isOverdue(record.scheduledDate, record.isVaccinated)
          );
        case "vaccinated":
          return record.isVaccinated;
        case "overdue":
          return isOverdue(record.scheduledDate, record.isVaccinated);
        default:
          return true;
      }
    });
  }, [sortedRecords, filter]);

  const stats = useMemo(() => {
    const total = childRecords.length;
    const vaccinated = childRecords.filter((r) => r.isVaccinated).length;
    const overdue = childRecords.filter((r) =>
      isOverdue(r.scheduledDate, r.isVaccinated)
    ).length;
    const upcoming = childRecords.filter(
      (r) =>
        !r.isVaccinated &&
        !isOverdue(r.scheduledDate, r.isVaccinated) &&
        getDaysUntil(r.scheduledDate) <= 30
    ).length;
    return { total, vaccinated, overdue, upcoming };
  }, [childRecords]);

  const selfPaidChildRecords = useMemo(() => {
    if (!selectedChildId) return [];
    return selfPaidVaccineRecords.filter((r) => r.childId === selectedChildId);
  }, [selfPaidVaccineRecords, selectedChildId]);

  const sortedSelfPaidRecords = useMemo(() => {
    return [...selfPaidChildRecords].sort((a, b) => {
      const aPriority =
        a.status === "recommended" ? 0 : a.status === "skipped" ? 2 : 1;
      const bPriority =
        b.status === "recommended" ? 0 : b.status === "skipped" ? 2 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return (
        new Date(a.scheduledDate).getTime() -
        new Date(b.scheduledDate).getTime()
      );
    });
  }, [selfPaidChildRecords]);

  const filteredSelfPaidRecords = useMemo(() => {
    return sortedSelfPaidRecords.filter((record) => {
      switch (selfPaidFilter) {
        case "recommended":
          return record.status === "recommended";
        case "vaccinated":
          return record.status === "vaccinated";
        case "skipped":
          return record.status === "skipped";
        default:
          return true;
      }
    });
  }, [sortedSelfPaidRecords, selfPaidFilter]);

  const selfPaidStats = useMemo(() => {
    const total = selfPaidChildRecords.length;
    const vaccinated = selfPaidChildRecords.filter(
      (r) => r.status === "vaccinated"
    ).length;
    const recommended = selfPaidChildRecords.filter(
      (r) => r.status === "recommended"
    ).length;
    const skipped = selfPaidChildRecords.filter(
      (r) => r.status === "skipped"
    ).length;
    const overdue = selfPaidChildRecords.filter(
      (r) => r.status === "recommended" && isOverdue(r.scheduledDate, false)
    ).length;
    return { total, vaccinated, recommended, skipped, overdue };
  }, [selfPaidChildRecords]);

  const checkupRecords = useMemo(() => {
    if (!selectedChildId) return [];
    return healthCheckupRecords.filter((r) => r.childId === selectedChildId);
  }, [healthCheckupRecords, selectedChildId]);

  const sortedCheckupRecords = useMemo(() => {
    return [...checkupRecords].sort(
      (a, b) =>
        new Date(b.checkupDate).getTime() - new Date(a.checkupDate).getTime()
    );
  }, [checkupRecords]);

  const checkupStats = useMemo(() => {
    const total = checkupRecords.length;
    const hasHeight = checkupRecords.filter((r) => r.height !== undefined).length;
    const hasWeight = checkupRecords.filter((r) => r.weight !== undefined).length;
    const hasHead = checkupRecords.filter(
      (r) => r.headCircumference !== undefined).length;
    const lastRecord = sortedCheckupRecords[0];
    return { total, hasHeight, hasWeight, hasHead, lastRecord };
  }, [checkupRecords, sortedCheckupRecords]);

  const childAdverseReactions = useMemo(() => {
    if (!selectedChildId) return [];
    return adverseReactionRecords.filter(
      (r) => r.childId === selectedChildId
    );
  }, [adverseReactionRecords, selectedChildId]);

  const adverseReactionStats = useMemo(() => {
    const total = childAdverseReactions.length;
    const mild = childAdverseReactions.filter(
      (r) => r.severity === "mild"
    ).length;
    const moderate = childAdverseReactions.filter(
      (r) => r.severity === "moderate"
    ).length;
    const severe = childAdverseReactions.filter(
      (r) => r.severity === "severe"
    ).length;
    const hasFever = childAdverseReactions.filter((r) =>
      r.reactions.includes("fever")
    ).length;
    return { total, mild, moderate, severe, hasFever };
  }, [childAdverseReactions]);

  const getVaccineAdverseReactions = (
    vaccineRecordId: string
  ): AdverseReactionRecord[] => {
    return adverseReactionRecords.filter(
      (r) => r.vaccineRecordId === vaccineRecordId
    );
  };

  const getChildVaccineStats = (childId: string) => {
    const records = vaccineRecords.filter((r) => r.childId === childId);
    return {
      vaccinated: records.filter((r) => r.isVaccinated).length,
      total: records.length,
    };
  };

  const handleAddChild = () => {
    setEditingChild(null);
    setIsAddChildModalOpen(true);
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    setIsAddChildModalOpen(true);
  };

  const handleDeleteChild = (childId: string) => {
    const child = children.find((c) => c.id === childId);
    if (window.confirm(`确定要删除「${child?.name}」的所有记录吗？`)) {
      deleteChild(childId);
    }
  };

  const handleSubmitChild = (data: Omit<Child, "id">) => {
    if (editingChild) {
      updateChild(editingChild.id, data);
    } else {
      addChild(data);
    }
  };

  const handleMarkVaccinated = (record: VaccineRecord) => {
    setEditingRecord(record);
    setIsVaccineRecordModalOpen(true);
  };

  const handleUnmarkVaccinated = (recordId: string) => {
    if (window.confirm("确定要撤销此接种记录吗？")) {
      unmarkVaccinated(recordId);
    }
  };

  const handleVaccineRecordSubmit = (
    recordId: string,
    vaccinationDate: string,
    institution?: string,
    batchNumber?: string
  ) => {
    markVaccinated(recordId, vaccinationDate, institution, batchNumber);
  };

  const handleMarkSelfPaidVaccinated = (record: SelfPaidVaccineRecord) => {
    setEditingSelfPaidRecord(record);
    setIsSelfPaidModalOpen(true);
  };

  const handleSkipSelfPaid = (recordId: string) => {
    if (window.confirm("确定标记为不打算接种吗？")) {
      skipSelfPaidVaccine(recordId);
    }
  };

  const handleResetSelfPaid = (recordId: string) => {
    resetSelfPaidVaccine(recordId);
  };

  const handleUnmarkSelfPaidVaccinated = (recordId: string) => {
    if (window.confirm("确定要撤销此接种记录吗？")) {
      resetSelfPaidVaccine(recordId);
    }
  };

  const handleSelfPaidRecordSubmit = (
    recordId: string,
    vaccinationDate: string,
    institution?: string,
    batchNumber?: string
  ) => {
    markSelfPaidVaccinated(recordId, vaccinationDate, institution, batchNumber);
  };

  const handleAddCheckup = () => {
    setEditingCheckupRecord(null);
    setIsCheckupModalOpen(true);
  };

  const handleEditCheckup = (record: HealthCheckupRecord) => {
    setEditingCheckupRecord(record);
    setIsCheckupModalOpen(true);
  };

  const handleDeleteCheckup = (recordId: string) => {
    if (window.confirm("确定要删除这条体检记录吗？")) {
      deleteHealthCheckupRecord(recordId);
    }
  };

  const handleCheckupSubmit = (
    data: Omit<HealthCheckupRecord, "id"> & { id?: string }
  ) => {
    if (editingCheckupRecord) {
      updateHealthCheckupRecord(editingCheckupRecord.id, data);
    } else {
      addHealthCheckupRecord(data);
    }
  };

  const handleAddAdverseReaction = (record: VaccineRecord) => {
    setAdverseReactionVaccineRecord(record);
    const reactions = getVaccineAdverseReactions(record.id);
    if (reactions.length > 0) {
      setEditingAdverseReaction(reactions[0]);
    } else {
      setEditingAdverseReaction(null);
    }
    setIsAdverseReactionModalOpen(true);
  };

  const handleEditAdverseReaction = (
    record: AdverseReactionRecord
  ) => {
    const vaccineRec = vaccineRecords.find(
      (r) => r.id === record.vaccineRecordId
    );
    setAdverseReactionVaccineRecord(vaccineRec || null);
    setEditingAdverseReaction(record);
    setIsAdverseReactionModalOpen(true);
  };

  const handleDeleteAdverseReaction = (recordId: string) => {
    if (window.confirm("确定要删除这条副反应记录吗？")) {
      deleteAdverseReactionRecord(recordId);
    }
  };

  const handleAdverseReactionSubmit = (
    data: Omit<AdverseReactionRecord, "id"> & { id?: string }
  ) => {
    if (data.id) {
      updateAdverseReactionRecord(data.id, data);
    } else {
      addAdverseReactionRecord(data);
    }
  };

  const handleExportPdf = async () => {
    if (!selectedChild) return;

    const chartSvgs = {
      height: heightChartRef.current?.getSvgElement() || null,
      weight: weightChartRef.current?.getSvgElement() || null,
      headCircumference: headChartRef.current?.getSvgElement() || null,
    };

    try {
      await exportGrowthPdf({
        child: selectedChild,
        records: checkupRecords,
        chartSvgs,
      });
    } catch (error) {
      console.error("导出 PDF 失败:", error);
      alert("导出 PDF 失败，请重试");
    }
  };

  if (children.length === 0) {
    return (
      <div className="min-h-screen">
        <EmptyState onAddChild={handleAddChild} />
        <AddChildModal
          isOpen={isAddChildModalOpen}
          onClose={() => setIsAddChildModalOpen(false)}
          onSubmit={handleSubmitChild}
          editingChild={editingChild}
        />
      </div>
    );
  }

  const filterOptions: { key: FilterType; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: "全部", icon: <Stethoscope size={16} /> },
    { key: "pending", label: "待接种", icon: <Syringe size={16} /> },
    { key: "overdue", label: "已逾期", icon: <ShieldAlert size={16} /> },
    { key: "vaccinated", label: "已接种", icon: <CheckCircle2 size={16} /> },
  ];

  const selfPaidFilterOptions: {
    key: SelfPaidFilterType;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { key: "all", label: "全部", icon: <Stethoscope size={16} /> },
    { key: "recommended", label: "建议接种", icon: <Sparkles size={16} /> },
    { key: "vaccinated", label: "已接种", icon: <CheckCircle2 size={16} /> },
    { key: "skipped", label: "不打算接种", icon: <XCircle size={16} /> },
  ];

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <span className="text-2xl">👶</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  儿童健康记录
                </h1>
                <p className="text-xs text-gray-500">疫苗接种管理助手</p>
              </div>
            </div>
            <button
              onClick={handleAddChild}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              添加孩子
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-80 flex-shrink-0">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-1 mb-3">
                我的孩子
              </h2>
              {children.map((child) => {
                const childStats = getChildVaccineStats(child.id);
                return (
                  <ChildCard
                    key={child.id}
                    child={child}
                    isSelected={selectedChildId === child.id}
                    onSelect={() => selectChild(child.id)}
                    onEdit={() => handleEditChild(child)}
                    onDelete={() => handleDeleteChild(child.id)}
                    vaccinatedCount={childStats.vaccinated}
                    totalCount={childStats.total}
                  />
                );
              })}
              <button
                onClick={handleAddChild}
                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50/50 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
              >
                <Plus size={20} />
                添加孩子
              </button>
            </div>
          </aside>

          <section className="flex-1 min-w-0">
            {selectedChild ? (
              <>
                <div className="card p-6 mb-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${
                        selectedChild.gender === "male"
                          ? "bg-blue-100"
                          : "bg-pink-100"
                      }`}
                    >
                      {selectedChild.gender === "male" ? "👦" : "👧"}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-800">
                        {selectedChild.name}
                      </h2>
                      <p className="text-gray-500">
                        出生于 {selectedChild.birthDate}
                      </p>
                    </div>
                    {activeTab === "checkup" && checkupRecords.length > 0 && (
                      <button
                        onClick={handleExportPdf}
                        className="btn-outline flex items-center gap-2 text-sm"
                      >
                        <Download size={16} />
                        导出PDF
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {activeTab === "vaccine" && (
                      <>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-xs text-gray-500 mb-1">总疫苗剂数</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {stats.total}
                          </p>
                        </div>
                        <div className="bg-success-50 rounded-xl p-4">
                          <p className="text-xs text-success-600 mb-1">已接种</p>
                          <p className="text-2xl font-bold text-success-700">
                            {stats.vaccinated}
                          </p>
                        </div>
                        <div className="bg-primary-50 rounded-xl p-4">
                          <p className="text-xs text-primary-600 mb-1">30天内到期</p>
                          <p className="text-2xl font-bold text-primary-700">
                            {stats.upcoming}
                          </p>
                        </div>
                        <div className="bg-danger-50 rounded-xl p-4">
                          <p className="text-xs text-danger-600 mb-1">已逾期</p>
                          <p className="text-2xl font-bold text-danger-700">
                            {stats.overdue}
                          </p>
                        </div>
                      </>
                    )}
                    {activeTab === "selfPaid" && (
                      <>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-xs text-gray-500 mb-1">总剂数</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {selfPaidStats.total}
                          </p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-4">
                          <p className="text-xs text-amber-600 mb-1">建议接种</p>
                          <p className="text-2xl font-bold text-amber-700">
                            {selfPaidStats.recommended}
                          </p>
                        </div>
                        <div className="bg-success-50 rounded-xl p-4">
                          <p className="text-xs text-success-600 mb-1">已接种</p>
                          <p className="text-2xl font-bold text-success-700">
                            {selfPaidStats.vaccinated}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-xs text-gray-500 mb-1">不打算接种</p>
                          <p className="text-2xl font-bold text-gray-600">
                            {selfPaidStats.skipped}
                          </p>
                        </div>
                      </>
                    )}
                    {activeTab === "checkup" && (
                      <>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-xs text-gray-500 mb-1">体检次数</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {checkupStats.total}
                          </p>
                        </div>
                        <div className="bg-primary-50 rounded-xl p-4">
                          <p className="text-xs text-primary-600 mb-1">身高记录</p>
                          <p className="text-2xl font-bold text-primary-700">
                            {checkupStats.hasHeight}
                          </p>
                        </div>
                        <div className="bg-success-50 rounded-xl p-4">
                          <p className="text-xs text-success-600 mb-1">体重记录</p>
                          <p className="text-2xl font-bold text-success-700">
                            {checkupStats.hasWeight}
                          </p>
                        </div>
                        <div className="bg-warning-50 rounded-xl p-4">
                          <p className="text-xs text-warning-600 mb-1">头围记录</p>
                          <p className="text-2xl font-bold text-warning-700">
                            {checkupStats.hasHead}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl">
                      <button
                        onClick={() => setActiveTab("vaccine")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                          activeTab === "vaccine"
                            ? "bg-white text-primary-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <Syringe size={16} />
                        疫苗接种
                      </button>
                      <button
                        onClick={() => setActiveTab("selfPaid")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                          activeTab === "selfPaid"
                            ? "bg-white text-amber-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <Sparkles size={16} />
                        自费疫苗
                      </button>
                      <button
                        onClick={() => setActiveTab("checkup")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                          activeTab === "checkup"
                            ? "bg-white text-success-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <Stethoscope size={16} />
                        体检记录
                      </button>
                      <button
                        onClick={() => setActiveTab("adverseReaction")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                          activeTab === "adverseReaction"
                            ? "bg-white text-warning-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <AlertCircle size={16} />
                        副反应
                      </button>
                    </div>

                    {activeTab === "checkup" && (
                      <button
                        onClick={handleAddCheckup}
                        className="btn-success flex items-center gap-2 text-sm"
                      >
                        <Plus size={16} />
                        添加记录
                      </button>
                    )}
                  </div>

                  {activeTab === "vaccine" && (
                    <>
                      {childAdverseReactions.length > 0 &&
                        stats.upcoming > 0 && (
                          <div className="mb-4 p-4 bg-warning-50 border border-warning-200 rounded-xl flex items-start gap-3">
                            <AlertCircle
                              className="text-warning-500 flex-shrink-0 mt-0.5"
                              size={20}
                            />
                            <div>
                              <p className="text-sm font-medium text-warning-800">
                                副反应历史提醒
                              </p>
                              <p className="text-sm text-warning-700 mt-1">
                                该宝宝之前接种疫苗后出现过副反应，下次接种前请留意。如有疑虑，建议咨询医生。
                              </p>
                              <p className="text-xs text-warning-600 mt-2">
                                历史副反应 {childAdverseReactions.length} 次，
                                其中重度 {adverseReactionStats.severe} 次
                              </p>
                            </div>
                          </div>
                        )}

                      <div className="flex flex-wrap gap-2 mb-4">
                        {filterOptions.map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => setFilter(opt.key)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                              filter === opt.key
                                ? "bg-primary-500 text-white shadow-md"
                                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {opt.icon}
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {filteredRecords.length > 0 ? (
                        <div className="mt-4">
                          {filteredRecords.map((record) => (
                            <VaccineTimelineItem
                              key={record.id}
                              record={record}
                              onMarkVaccinated={handleMarkVaccinated}
                              onUnmarkVaccinated={handleUnmarkVaccinated}
                              onAddAdverseReaction={handleAddAdverseReaction}
                              adverseReactions={getVaccineAdverseReactions(
                                record.id
                              )}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-400">
                          <Syringe size={48} className="mx-auto mb-3 opacity-30" />
                          <p>暂无{filterOptions.find((f) => f.key === filter)?.label}的疫苗记录</p>
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === "selfPaid" && (
                    <>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selfPaidFilterOptions.map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => setSelfPaidFilter(opt.key)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                              selfPaidFilter === opt.key
                                ? "bg-amber-500 text-white shadow-md"
                                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {opt.icon}
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {selfPaidStats.overdue > 0 && (
                        <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-xl flex items-center gap-3">
                          <ShieldAlert className="text-danger-500 flex-shrink-0" size={22} />
                          <p className="text-sm text-danger-700">
                            有 <span className="font-bold">{selfPaidStats.overdue}</span> 剂自费疫苗已超过建议接种日期，请尽快安排。
                          </p>
                        </div>
                      )}

                      {filteredSelfPaidRecords.length > 0 ? (
                        <div className="mt-4">
                          {filteredSelfPaidRecords.map((record) => (
                            <SelfPaidVaccineTimelineItem
                              key={record.id}
                              record={record}
                              onMarkVaccinated={handleMarkSelfPaidVaccinated}
                              onSkip={handleSkipSelfPaid}
                              onReset={handleResetSelfPaid}
                              onUnmarkVaccinated={handleUnmarkSelfPaidVaccinated}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-400">
                          <Coins size={48} className="mx-auto mb-3 opacity-30" />
                          <p>暂无{selfPaidFilterOptions.find((f) => f.key === selfPaidFilter)?.label}的自费疫苗记录</p>
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === "checkup" && (
                    <>
                      {checkupRecords.length > 0 ? (
                        <>
                          <div className="mb-8">
                            <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                              <TrendingUp className="text-primary-500" size={20} />
                              生长百分位趋势图
                            </h4>

                            <div className="flex flex-wrap gap-2 mb-4">
                              {(["height", "weight", "headCircumference"] as GrowthMetricType[]).map((metric) => (
                                <button
                                  key={metric}
                                  onClick={() => setGrowthMetric(metric)}
                                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                                    growthMetric === metric
                                      ? "bg-success-500 text-white shadow-md"
                                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                  }`}
                                >
                                  {metric === "height" && <Ruler size={16} />}
                                  {metric === "weight" && <Scale size={16} />}
                                  {metric === "headCircumference" && <Baby size={16} />}
                                  {metric === "height" && "身高"}
                                  {metric === "weight" && "体重"}
                                  {metric === "headCircumference" && "头围"}
                                </button>
                              ))}
                            </div>

                            <div className="hidden">
                              <GrowthChart
                                ref={heightChartRef}
                                child={selectedChild}
                                records={checkupRecords}
                                metric="height"
                              />
                              <GrowthChart
                                ref={weightChartRef}
                                child={selectedChild}
                                records={checkupRecords}
                                metric="weight"
                              />
                              <GrowthChart
                                ref={headChartRef}
                                child={selectedChild}
                                records={checkupRecords}
                                metric="headCircumference"
                              />
                            </div>

                            {growthMetric === "height" && (
                              <GrowthChart
                                child={selectedChild}
                                records={checkupRecords}
                                metric="height"
                              />
                            )}
                            {growthMetric === "weight" && (
                              <GrowthChart
                                child={selectedChild}
                                records={checkupRecords}
                                metric="weight"
                              />
                            )}
                            {growthMetric === "headCircumference" && (
                              <GrowthChart
                                child={selectedChild}
                                records={checkupRecords}
                                metric="headCircumference"
                              />
                            )}
                          </div>

                          <div>
                            <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                              <Stethoscope className="text-success-500" size={20} />
                              体检记录历史
                            </h4>
                            <div className="mt-4">
                              {sortedCheckupRecords.map((record) => (
                                <HealthCheckupItem
                                  key={record.id}
                                  record={record}
                                  child={selectedChild}
                                  onEdit={handleEditCheckup}
                                  onDelete={handleDeleteCheckup}
                                />
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-16 text-gray-400">
                          <div className="w-20 h-20 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Stethoscope size={40} className="opacity-40" />
                          </div>
                          <p className="text-lg mb-2">还没有体检记录</p>
                          <p className="text-sm mb-6">记录身高、体重、头围，跟踪宝宝生长发育</p>
                          <button
                            onClick={handleAddCheckup}
                            className="btn-success inline-flex items-center gap-2"
                          >
                            <Plus size={18} />
                            添加第一条记录
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === "adverseReaction" && (
                    <>
                      <div className="mb-6">
                        <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <AlertCircle
                            className="text-warning-500"
                            size={20}
                          />
                          副反应历史
                        </h4>
                        <AdverseReactionHistory
                          records={childAdverseReactions}
                          onEdit={handleEditAdverseReaction}
                          onDelete={handleDeleteAdverseReaction}
                        />
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="card p-12 text-center text-gray-400">
                <div className="w-20 h-20 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <span className="text-4xl">👈</span>
                </div>
                <p className="text-lg">请从左侧选择一个孩子查看疫苗时间表</p>
              </div>
            )}
          </section>
        </div>
      </main>

      <AddChildModal
        isOpen={isAddChildModalOpen}
        onClose={() => setIsAddChildModalOpen(false)}
        onSubmit={handleSubmitChild}
        editingChild={editingChild}
      />

      <VaccineRecordModal
        isOpen={isVaccineRecordModalOpen}
        onClose={() => setIsVaccineRecordModalOpen(false)}
        onSubmit={handleVaccineRecordSubmit}
        record={editingRecord}
      />

      <SelfPaidVaccineRecordModal
        isOpen={isSelfPaidModalOpen}
        onClose={() => setIsSelfPaidModalOpen(false)}
        onSubmit={handleSelfPaidRecordSubmit}
        record={editingSelfPaidRecord}
      />

      <HealthCheckupModal
        isOpen={isCheckupModalOpen}
        onClose={() => setIsCheckupModalOpen(false)}
        onSubmit={handleCheckupSubmit}
        childId={selectedChildId || ""}
        editingRecord={editingCheckupRecord}
      />

      <AdverseReactionModal
        isOpen={isAdverseReactionModalOpen}
        onClose={() => setIsAdverseReactionModalOpen(false)}
        onSubmit={handleAdverseReactionSubmit}
        vaccineRecord={adverseReactionVaccineRecord}
        editingRecord={editingAdverseReaction}
      />
    </div>
  );
}
