import { useState, useEffect } from "react";
import { X, UserPlus } from "lucide-react";
import type { Child } from "@/types";

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Child, "id">) => void;
  editingChild?: Child | null;
}

export default function AddChildModal({
  isOpen,
  onClose,
  onSubmit,
  editingChild,
}: AddChildModalProps) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingChild) {
      setName(editingChild.name);
      setBirthDate(editingChild.birthDate);
      setGender(editingChild.gender);
    } else {
      setName("");
      setBirthDate("");
      setGender("male");
    }
    setErrors({});
  }, [editingChild, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = "请输入孩子姓名";
    }
    if (!birthDate) {
      newErrors.birthDate = "请选择出生日期";
    } else {
      const today = new Date();
      const selected = new Date(birthDate);
      if (selected > today) {
        newErrors.birthDate = "出生日期不能晚于今天";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ name: name.trim(), birthDate, gender });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <UserPlus className="text-primary-600" size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {editingChild ? "编辑孩子信息" : "添加孩子"}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              姓名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入孩子姓名"
              className={`input-field ${
                errors.name ? "border-danger-400 focus:ring-danger-100" : ""
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-danger-500">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              出生日期
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className={`input-field ${
                errors.birthDate
                  ? "border-danger-400 focus:ring-danger-100"
                  : ""
              }`}
            />
            {errors.birthDate && (
              <p className="mt-1 text-sm text-danger-500">
                {errors.birthDate}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              性别
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender("male")}
                className={`py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  gender === "male"
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>👦</span> 男孩
              </button>
              <button
                type="button"
                onClick={() => setGender("female")}
                className={`py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  gender === "female"
                    ? "bg-pink-500 text-white shadow-lg shadow-pink-500/30"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>👧</span> 女孩
              </button>
            </div>
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
              {editingChild ? "保存" : "添加"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
