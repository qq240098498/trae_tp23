import { User, Trash2, Edit3 } from "lucide-react";
import type { Child } from "@/types";
import { getAgeText } from "@/utils/dateUtils";

interface ChildCardProps {
  child: Child;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  vaccinatedCount: number;
  totalCount: number;
}

export default function ChildCard({
  child,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  vaccinatedCount,
  totalCount,
}: ChildCardProps) {
  const progress = totalCount > 0 ? (vaccinatedCount / totalCount) * 100 : 0;

  return (
    <div
      onClick={onSelect}
      className={`card p-4 cursor-pointer transition-all duration-300 border-2 ${
        isSelected
          ? "border-primary-500 bg-primary-50"
          : "border-transparent hover:border-primary-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
            child.gender === "male"
              ? "bg-blue-100 text-blue-600"
              : "bg-pink-100 text-pink-600"
          }`}
        >
          {child.gender === "male" ? "👦" : "👧"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 truncate">
              {child.name}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-500 transition-colors"
                title="编辑"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-danger-500 transition-colors"
                title="删除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-0.5">
            {getAgeText(child.birthDate)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{child.birthDate}</p>

          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>接种进度</span>
              <span>
                {vaccinatedCount}/{totalCount}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-400 to-success-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
