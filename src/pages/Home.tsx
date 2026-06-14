import { useState, useMemo } from "react";
import { Plus, Stethoscope, Syringe, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import ChildCard from "@/components/ChildCard";
import AddChildModal from "@/components/AddChildModal";
import VaccineRecordModal from "@/components/VaccineRecordModal";
import VaccineTimelineItem from "@/components/VaccineTimelineItem";
import EmptyState from "@/components/EmptyState";
import type { Child, VaccineRecord } from "@/types";
import { isOverdue, getDaysUntil } from "@/utils/dateUtils";

type FilterType = "all" | "pending" | "vaccinated" | "overdue";

export default function Home() {
  const {
    children,
    vaccineRecords,
    selectedChildId,
    addChild,
    updateChild,
    deleteChild,
    selectChild,
    markVaccinated,
    unmarkVaccinated,
  } = useAppStore();

  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [isVaccineRecordModalOpen, setIsVaccineRecordModalOpen] =
    useState(false);
  const [editingRecord, setEditingRecord] = useState<VaccineRecord | null>(
    null
  );
  const [filter, setFilter] = useState<FilterType>("all");

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
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        {selectedChild.name}
                      </h2>
                      <p className="text-gray-500">
                        出生于 {selectedChild.birthDate}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Syringe className="text-primary-500" size={22} />
                      疫苗接种时间表
                    </h3>
                    <div className="flex flex-wrap gap-2">
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
                  </div>

                  {filteredRecords.length > 0 ? (
                    <div className="mt-4">
                      {filteredRecords.map((record) => (
                        <VaccineTimelineItem
                          key={record.id}
                          record={record}
                          onMarkVaccinated={handleMarkVaccinated}
                          onUnmarkVaccinated={handleUnmarkVaccinated}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Syringe size={48} className="mx-auto mb-3 opacity-30" />
                      <p>暂无{filterOptions.find((f) => f.key === filter)?.label}的疫苗记录</p>
                    </div>
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
    </div>
  );
}
