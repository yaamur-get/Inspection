import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SubItem } from "@/types";

interface InclusionsPickerProps {
  /** البنود الفرعية المتاحة تحت نفس البند الرئيسي */
  options: SubItem[];
  /** البند الفرعي الأب — يُستثنى من الخيارات ولا تظهر الأداة قبل اختياره */
  parentSubItemId: string;
  /** معرّفات البنود الفرعية المتضمّنة */
  value: string[];
  onChange: (subItemIds: string[]) => void;
  /** أحجام أصغر للاستخدام داخل بطاقات حالة 2 */
  compact?: boolean;
}

export const InclusionsPicker = ({
  options,
  parentSubItemId,
  value,
  onChange,
  compact = false,
}: InclusionsPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!parentSubItemId) return null;

  const isExpanded = isOpen || value.length > 0;
  const selectableOptions = options.filter(
    (option) => option.id !== parentSubItemId && !value.includes(option.id)
  );
  const nameOf = (subItemId: string) =>
    options.find((option) => option.id === subItemId)?.name_ar || "بند غير معروف";

  return (
    <div className="space-y-3 rounded-xl border-2 border-dashed border-yaamur-secondary-dark p-3">
      <div className="flex items-start justify-between gap-2">
        <Label className={compact ? "text-sm font-semibold" : "text-base font-semibold"}>
          تضمين بنود فرعية
          <span className="mt-1 block text-xs font-normal text-yaamur-text-light">
            تُعرض داخل نفس صف البند في الجداول، والتسعير يبقى للبند الفرعي فقط
          </span>
        </Label>
        {!isExpanded && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 rounded-lg"
            onClick={() => setIsOpen(true)}
          >
            <Plus className="ml-1 h-4 w-4" />
            إضافة
          </Button>
        )}
      </div>

      {isExpanded && (
        <>
          {value.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {value.map((subItemId) => (
                <span
                  key={subItemId}
                  className="inline-flex items-center gap-1 rounded-full bg-yaamur-secondary px-3 py-1 text-sm text-yaamur-text"
                >
                  {nameOf(subItemId)}
                  <button
                    type="button"
                    aria-label={`إزالة ${nameOf(subItemId)}`}
                    className="text-red-600 hover:text-red-700"
                    onClick={() =>
                      onChange(value.filter((selected) => selected !== subItemId))
                    }
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <Select
            value=""
            onValueChange={(subItemId) => onChange([...value, subItemId])}
            disabled={selectableOptions.length === 0}
          >
            <SelectTrigger
              className={compact ? "h-10 rounded-lg text-sm" : "h-12 rounded-xl text-base"}
            >
              <SelectValue
                placeholder={
                  selectableOptions.length === 0
                    ? "لا توجد بنود فرعية أخرى متاحة"
                    : "اختر بنداً فرعياً لتضمينه"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {selectableOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name_ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}
    </div>
  );
};
