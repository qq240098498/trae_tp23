import { Baby, Plus } from "lucide-react";

interface EmptyStateProps {
  onAddChild: () => void;
}

export default function EmptyState({ onAddChild }: EmptyStateProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="relative">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-6">
          <Baby size={56} className="text-primary-600" />
        </div>
        <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-success-400 flex items-center justify-center animate-bounce">
          <span className="text-xl">✨</span>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-3">
        欢迎使用儿童健康记录工具
      </h2>
      <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
        添加您的孩子信息，我们将根据国家免疫规划为您自动生成疫苗接种时间表，
        帮助您轻松管理孩子的每一针疫苗接种。
      </p>

      <button
        onClick={onAddChild}
        className="btn-primary px-8 py-3.5 text-base flex items-center gap-2 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all duration-300"
      >
        <Plus size={20} />
        添加第一个孩子
      </button>

      <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg w-full">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-sm font-medium text-gray-700">自动生成时间表</p>
          <p className="text-xs text-gray-400 mt-1">依据国家免疫规划</p>
        </div>
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-green-50 flex items-center justify-center mb-3">
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-sm font-medium text-gray-700">记录接种信息</p>
          <p className="text-xs text-gray-400 mt-1">日期、机构、批号</p>
        </div>
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-yellow-50 flex items-center justify-center mb-3">
            <span className="text-2xl">🔔</span>
          </div>
          <p className="text-sm font-medium text-gray-700">智能提醒</p>
          <p className="text-xs text-gray-400 mt-1">避免遗漏接种</p>
        </div>
      </div>
    </div>
  );
}
