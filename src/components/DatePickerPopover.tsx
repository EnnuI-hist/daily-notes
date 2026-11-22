import React, { useEffect, useRef, useState } from 'react';
import { Sun, ArrowRight, X, CalendarDays } from 'lucide-react';
import { getTodayDateString, getTomorrowDateString } from '../utils/date';

interface DatePickerPopoverProps {
  currentDate?: string | null;
  onSelectDate: (date: string | null) => void;
  onClose: () => void;
  position?: 'bottom-left' | 'bottom-right';
}

export const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({
  currentDate,
  onSelectDate,
  onClose,
  position = 'bottom-right',
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const customDateInputRef = useRef<HTMLInputElement>(null);

  const today = getTodayDateString();
  const tomorrow = getTomorrowDateString();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleCustomDateClick = () => {
    setShowCustomDate(true);
    setTimeout(() => {
      customDateInputRef.current?.showPicker?.();
      customDateInputRef.current?.focus();
    }, 50);
  };

  const alignClass = position === 'bottom-left' ? 'left-0' : 'right-0';

  return (
    <div
      ref={popoverRef}
      className={`absolute top-full mt-1.5 ${alignClass} z-40 w-48 bg-white dark:bg-[#161619] rounded-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-xl p-1.5 flex flex-col gap-0.5 text-xs text-zinc-700 dark:text-zinc-200 animate-in fade-in zoom-in-95 duration-100 select-none`}
    >
      <button
        type="button"
        onClick={() => {
          onSelectDate(today);
          onClose();
        }}
        className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer text-left ${
          currentDate === today ? 'font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Сегодня</span>
        </div>
        {currentDate === today && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
      </button>

      <button
        type="button"
        onClick={() => {
          onSelectDate(tomorrow);
          onClose();
        }}
        className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer text-left ${
          currentDate === tomorrow ? 'font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
          <span>Завтра</span>
        </div>
        {currentDate === tomorrow && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
      </button>

      {/* Custom Date Picker */}
      <div className="relative">
        <button
          type="button"
          onClick={handleCustomDateClick}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer text-left ${
            currentDate && currentDate !== today && currentDate !== tomorrow
              ? 'font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40'
              : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 text-zinc-400" />
            <span>Выбрать дату...</span>
          </div>
        </button>

        <input
          ref={customDateInputRef}
          type="date"
          value={currentDate || ''}
          onChange={e => {
            if (e.target.value) {
              onSelectDate(e.target.value);
              onClose();
            }
          }}
          className={
            showCustomDate
              ? 'w-full mt-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg text-xs text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 focus:outline-none'
              : 'sr-only'
          }
        />
      </div>

      {/* Clear date if currently set */}
      {currentDate && (
        <>
          <div className="my-1 border-t border-zinc-100 dark:border-zinc-800/80" />
          <button
            type="button"
            onClick={() => {
              onSelectDate(null);
              onClose();
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
          >
            <X className="w-3.5 h-3.5" />
            <span>Убрать дату</span>
          </button>
        </>
      )}
    </div>
  );
};
