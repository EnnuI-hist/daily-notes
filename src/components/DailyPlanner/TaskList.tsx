import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskItem } from './TaskItem';
import {
  CalendarDays,
  CheckCircle2,
  CalendarArrowRight,
  Filter,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { getTodayDateString, getTomorrowDateString } from '../../utils/dateUtils';

type TaskFilter = 'all' | 'today' | 'tomorrow' | 'someday' | 'completed';

export const TaskList: React.FC = () => {
  const {
    tasks,
    currentTab,
    selectedTag,
    rolloverUnfinishedTasksToTomorrow,
    clearCompletedTasks,
  } = useApp();

  const [subFilter, setSubFilter] = useState<TaskFilter>('all');
  const today = getTodayDateString();
  const tomorrow = getTomorrowDateString();

  // Today specific calculations
  const todayTasks = tasks.filter(t => t.dueDate === today);
  const todayCompletedCount = todayTasks.filter(t => t.completed).length;
  const todayTotalCount = todayTasks.length;
  const todayProgressPercent =
    todayTotalCount > 0 ? Math.round((todayCompletedCount / todayTotalCount) * 100) : 0;

  const unfinishedTodayCount = tasks.filter(t => !t.completed && t.dueDate <= today).length;

  // Filter tasks based on current tab, tag, and subfilter
  const filteredTasks = tasks.filter(task => {
    // 1. Tag filter
    if (selectedTag && !task.tags?.includes(selectedTag)) {
      return false;
    }

    // 2. Tab filter
    if (currentTab === 'today') {
      return task.dueDate === today;
    }

    if (currentTab === 'archive') {
      return task.completed;
    }

    // 3. 'all-tasks' view with subfilters
    if (currentTab === 'all-tasks') {
      if (subFilter === 'today') return task.dueDate === today && !task.completed;
      if (subFilter === 'tomorrow') return task.dueDate === tomorrow && !task.completed;
      if (subFilter === 'someday') return !task.dueDate && !task.completed;
      if (subFilter === 'completed') return task.completed;
      return true; // 'all'
    }

    return true;
  });

  // Sort: uncompleted first, then by priority (high > medium > low), then by creation date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Today's Focus Card & Progress Header */}
      {currentTab === 'today' && !selectedTag && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-violet-50/40 dark:from-indigo-950/20 dark:to-violet-950/10 border border-indigo-100/80 dark:border-indigo-900/40 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Прогресс дня
                </span>
                {todayTotalCount > 0 && todayCompletedCount === todayTotalCount && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                    <Sparkles className="w-3 h-3" />
                    100% Выполнено!
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {todayTotalCount === 0
                  ? 'На сегодня пока нет задач — добавьте их через строку ввода сверху'
                  : `${todayCompletedCount} из ${todayTotalCount} выполнено (${todayProgressPercent}%)`}
              </div>
            </div>

            {/* Quick Rollover Button */}
            {unfinishedTodayCount > 0 && (
              <button
                type="button"
                onClick={rolloverUnfinishedTasksToTomorrow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-zinc-700 text-xs font-medium border border-indigo-200 dark:border-indigo-800/80 shadow-2xs transition-all cursor-pointer hover:shadow-xs active:scale-95 shrink-0"
                title="Перенести невыполненные задачи на завтра"
              >
                <CalendarArrowRight className="w-3.5 h-3.5" />
                <span>Перенести невыполненное ({unfinishedTodayCount})</span>
              </button>
            )}
          </div>

          {/* Animated Progress Bar */}
          {todayTotalCount > 0 && (
            <div className="w-full bg-zinc-200/80 dark:bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${todayProgressPercent}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Subfilter Bar for All Tasks */}
      {currentTab === 'all-tasks' && !selectedTag && (
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-1 overflow-x-auto text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400 mr-1 shrink-0" />
            {(
              [
                { id: 'all', label: 'Все' },
                { id: 'today', label: 'Сегодня' },
                { id: 'tomorrow', label: 'Завтра' },
                { id: 'someday', label: 'Без даты' },
                { id: 'completed', label: 'Выполненные' },
              ] as { id: TaskFilter; label: string }[]
            ).map(tab => (
              <button
                key={tab.id}
                onClick={() => setSubFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  subFilter === tab.id
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {unfinishedTodayCount > 0 && (
            <button
              onClick={rolloverUnfinishedTasksToTomorrow}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <CalendarArrowRight className="w-3.5 h-3.5" />
              <span>Перенести {unfinishedTodayCount} на завтра</span>
            </button>
          )}
        </div>
      )}

      {/* Archive Header with Clear Button */}
      {currentTab === 'archive' && (
        <div className="flex items-center justify-between pb-2 border-b border-zinc-200/80 dark:border-zinc-800/80 text-xs">
          <span className="text-zinc-500 dark:text-zinc-400">
            Всего выполненных задач: {sortedTasks.length}
          </span>
          {sortedTasks.length > 0 && (
            <button
              onClick={clearCompletedTasks}
              className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Очистить завершенные</span>
            </button>
          )}
        </div>
      )}

      {/* Task List Items */}
      {sortedTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-3">
            {currentTab === 'archive' ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <CalendarDays className="w-6 h-6" />
            )}
          </div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {currentTab === 'archive'
              ? 'Архив пуст'
              : selectedTag
              ? `Нет задач с тегом #${selectedTag}`
              : 'В этом списке пока пусто'}
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mt-1">
            {currentTab === 'archive'
              ? 'Выполняйте задачи в ежедневнике, и они сохранятся здесь.'
              : 'Введите мысль или задачу в верхней строке и нажмите Enter.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sortedTasks.map(task => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};
