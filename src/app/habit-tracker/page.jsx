
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MONTHS = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const storageKey = (year, month) => `habit-tracker:${year}-${month + 1}`;

const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const isValidHabits = (value) => Array.isArray(value);

function ProgressRing({ value, size = 72 }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
        <circle
          cx="36" cy="36" r={radius}
          fill="none" stroke="#26312e" strokeWidth="6"
        />
        <circle
          cx="36" cy="36" r={radius}
          fill="none" stroke="#34d399" strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute text-sm font-semibold text-white">
        {value}%
      </span>
    </div>
  );
}

function StatCard({ label, value, subtitle, symbol, accent = false }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#171b1a] p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-zinc-400 sm:text-sm">
          {label}
        </span>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${
            accent
              ? "bg-emerald-400/10 text-emerald-400"
              : "bg-white/[0.05] text-zinc-300"
          }`}
        >
          {symbol}
        </span>
      </div>
      <div className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {value}
      </div>
      <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
    </div>
  );
}

function DayButton({ checked, disabled, day, onClick, today = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={`Day ${day}: ${checked ? "completed" : "not completed"}`}
      aria-pressed={checked}
      className={[
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold transition-all sm:h-8 sm:w-8",
        checked
          ? "border-emerald-400 bg-emerald-400 text-[#062a1c] shadow-[0_0_12px_rgba(52,211,153,0.13)]"
          : today
            ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300"
            : "border-white/[0.06] bg-[#222826] text-zinc-500 hover:border-emerald-400/40 hover:text-white",
        disabled ? "cursor-not-allowed opacity-30" : "cursor-pointer",
      ].join(" ")}
    >
      {checked ? "✓" : day}
    </button>
  );
}

export default function HabitTracker() {
  const [initialDate] = useState(() => new Date());
  const [year, setYear] = useState(initialDate.getFullYear());
  const [monthIndex, setMonthIndex] = useState(initialDate.getMonth());

  const [habits, setHabits] = useState([]);
  const [loadedKey, setLoadedKey] = useState(null);
  const [newHabit, setNewHabit] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const currentKey = storageKey(year, monthIndex);
  const dataReady = loadedKey === currentKey;
  const dayCount = new Date(year, monthIndex + 1, 0).getDate();

  const isCurrentMonth =
    initialDate.getFullYear() === year &&
    initialDate.getMonth() === monthIndex;

  const today = isCurrentMonth ? initialDate.getDate() : null;

  // Load the selected month.
  useEffect(() => {
    let saved = [];

    try {
      const raw = localStorage.getItem(currentKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValidHabits(parsed)) saved = parsed;
      }
    } catch (error) {
      console.error("Failed to load habits:", error);
    }

    setHabits(saved);
    setLoadedKey(currentKey);
  }, [currentKey]);

  // Never overwrite storage with another month's habits.
  useEffect(() => {
    if (!dataReady) return;

    try {
      localStorage.setItem(currentKey, JSON.stringify(habits));
    } catch (error) {
      console.error("Failed to save habits:", error);
    }
  }, [habits, currentKey, dataReady]);

  const stats = useMemo(() => {
    const totalHabits = habits.length;
    const totalPossible = totalHabits * dayCount;

    let completed = 0;
    let perfectDays = 0;

    const chartData = Array.from({ length: dayCount }, (_, i) => {
      const day = i + 1;
      const count = habits.filter((h) => h.days?.[day]).length;
      completed += count;

      if (totalHabits > 0 && count === totalHabits) {
        perfectDays++;
      }

      return {
        day,
        progress: totalHabits
          ? Math.round((count / totalHabits) * 100)
          : 0,
      };
    });

    return {
      totalHabits,
      completed,
      perfectDays,
      completionRate: totalPossible
        ? Math.round((completed / totalPossible) * 100)
        : 0,
      chartData,
    };
  }, [habits, dayCount]);

  function navigateMonth(direction) {
    const nextDate = new Date(year, monthIndex + direction, 1);
    setYear(nextDate.getFullYear());
    setMonthIndex(nextDate.getMonth());
    setDeleteId(null);
  }

  function goToday() {
    const date = new Date();
    setYear(date.getFullYear());
    setMonthIndex(date.getMonth());
  }

  function addHabit(e) {
    e?.preventDefault();
    const name = newHabit.trim();

    if (!name || !dataReady) return;

    setHabits((prev) => [
      ...prev,
      { id: makeId(), name, days: {} },
    ]);

    setNewHabit("");
    setShowAdd(false);
  }

  function updateHabitName(id, name) {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, name } : h))
    );
  }

  function toggleDay(id, day) {
    if (!dataReady) return;

    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              days: {
                ...h.days,
                [day]: !h.days?.[day],
              },
            }
          : h
      )
    );
  }

  function deleteHabit() {
    setHabits((prev) => prev.filter((h) => h.id !== deleteId));
    setDeleteId(null);
  }

  const getCompletedDays = (habit) =>
    Array.from({ length: dayCount }, (_, i) => i + 1).filter(
      (day) => habit.days?.[day]
    ).length;

  return (
    <main className="min-h-screen bg-[#101413] text-zinc-100">
      {/* Soft background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[450px] w-[450px] rounded-full bg-emerald-500/[0.035] blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-4 py-5 sm:px-6 sm:py-8 lg:px-10">
        {/* Header */}
        <header className="mb-7 flex flex-col gap-5 sm:mb-9 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400 text-lg font-bold text-[#09291d]">
                ✓
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                Personal Workspace
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Habit Tracker
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Build better routines, one day at a time.
            </p>
          </div>

          <button
            onClick={() => setShowAdd(true)}
            disabled={!dataReady}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-[#082a1c] transition hover:bg-emerald-300 disabled:opacity-50"
          >
            <span className="text-xl leading-none">+</span>
            Add New Habit
          </button>
        </header>

        {/* Month navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-[#171b1a] p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-lg hover:bg-white/10"
              aria-label="Previous month"
            >
              ‹
            </button>

            <div className="min-w-[145px] text-center sm:min-w-[190px]">
              <div className="text-sm font-semibold text-white sm:text-base">
                {MONTHS[monthIndex]} {year}
              </div>
            </div>

            <button
              onClick={() => navigateMonth(1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-lg hover:bg-white/10"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <button
            onClick={goToday}
            className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
          >
            Today
          </button>
        </div>

        {/* Statistics */}
        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard
            label="Total Habits"
            value={stats.totalHabits}
            subtitle="Habits this month"
            symbol="◈"
          />
          <StatCard
            label="Completion Rate"
            value={`${stats.completionRate}%`}
            subtitle="Overall monthly progress"
            symbol="%"
            accent
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            subtitle="Successful check-ins"
            symbol="✓"
            accent
          />
          <StatCard
            label="Perfect Days"
            value={stats.perfectDays}
            subtitle="All habits completed"
            symbol="★"
          />
        </section>

        {/* Chart */}
        <section className="mb-6 rounded-2xl border border-white/[0.07] bg-[#171b1a] p-4 sm:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white sm:text-lg">
                Monthly Progress
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Daily habit completion percentage
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Completion
            </div>
          </div>

          <div className="h-[190px] w-full sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.chartData}
                margin={{ top: 5, right: 5, left: -24, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="habitArea" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="#34d399"
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="95%"
                      stopColor="#34d399"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#ffffff"
                  strokeOpacity={0.05}
                  vertical={false}
                />

                <XAxis
                  dataKey="day"
                  tick={{ fill: "#717b76", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={12}
                  interval="preserveStartEnd"
                  minTickGap={15}
                />

                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#717b76", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(v) => `${v}%`}
                />

                <Tooltip
                  contentStyle={{
                    background: "#242a27",
                    border: "1px solid #38433d",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [`${value}%`, "Completion"]}
                  labelFormatter={(label) => `Day ${label}`}
                />

                <Area
                  type="monotone"
                  dataKey="progress"
                  stroke="#34d399"
                  strokeWidth={2.5}
                  fill="url(#habitArea)"
                  activeDot={{ r: 5, fill: "#34d399" }}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Habits section */}
        <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#171b1a]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] p-4 sm:p-6">
            <div>
              <h2 className="text-base font-semibold text-white sm:text-lg">
                Your Habits
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Track your daily consistency
              </p>
            </div>

            <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-3 py-1.5 text-xs font-medium text-emerald-400">
              {stats.totalHabits} Habits
            </span>
          </div>

          {!dataReady ? (
            <div className="p-14 text-center text-sm text-zinc-500">
              Loading habits...
            </div>
          ) : habits.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400/10 text-3xl text-emerald-400">
                +
              </div>
              <h3 className="text-lg font-semibold text-white">
                No habits added yet
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                Start by adding a daily habit you want to build.
                Small steps create lasting progress.
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="mt-5 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-[#082a1c] hover:bg-emerald-300"
              >
                + Create Your First Habit
              </button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-20 min-w-[210px] border-b border-r border-white/[0.07] bg-[#1b211e] px-5 py-4 text-left text-xs font-medium text-zinc-400">
                        Habit
                      </th>

                      {Array.from({ length: dayCount }, (_, i) => {
                        const day = i + 1;
                        const date = new Date(year, monthIndex, day);
                        return (
                          <th
                            key={day}
                            className={`min-w-[42px] border-b border-white/[0.07] px-1 py-3 text-center ${
                              today === day
                                ? "bg-emerald-400/[0.07]"
                                : "bg-[#1b211e]"
                            }`}
                          >
                            <div className="text-[10px] font-medium text-zinc-500">
                              {WEEKDAYS[date.getDay()].slice(0, 1)}
                            </div>
                            <div
                              className={`mt-1 text-xs ${
                                today === day
                                  ? "font-bold text-emerald-400"
                                  : "text-zinc-300"
                              }`}
                            >
                              {day}
                            </div>
                          </th>
                        );
                      })}

                      <th className="sticky right-0 z-10 min-w-[96px] border-b border-l border-white/[0.07] bg-[#1b211e] px-4 text-center text-xs font-medium text-zinc-400">
                        Progress
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {habits.map((habit) => {
                      const count = getCompletedDays(habit);
                      const percent = Math.round((count / dayCount) * 100);

                      return (
                        <tr key={habit.id} className="group">
                          <td className="sticky left-0 z-10 border-b border-r border-white/[0.05] bg-[#171b1a] px-4 py-4 group-hover:bg-[#202622]">
                            <div className="flex items-center gap-2">
                              <input
                                value={habit.name}
                                onChange={(e) =>
                                  updateHabitName(habit.id, e.target.value)
                                }
                                aria-label="Habit name"
                                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none focus:text-emerald-300"
                              />
                              <button
                                onClick={() => setDeleteId(habit.id)}
                                title="Delete habit"
                                className="rounded-md px-2 py-1 text-base text-zinc-600 hover:bg-red-400/10 hover:text-red-400"
                              >
                                ×
                              </button>
                            </div>
                          </td>

                          {Array.from({ length: dayCount }, (_, i) => {
                            const day = i + 1;
                            return (
                              <td
                                key={day}
                                className={`border-b border-white/[0.05] px-1 py-3 text-center ${
                                  today === day
                                    ? "bg-emerald-400/[0.04]"
                                    : ""
                                }`}
                              >
                                <div className="flex justify-center">
                                  <DayButton
                                    day={day}
                                    today={today === day}
                                    checked={!!habit.days?.[day]}
                                    onClick={() => toggleDay(habit.id, day)}
                                  />
                                </div>
                              </td>
                            );
                          })}

                          <td className="sticky right-0 z-10 border-b border-l border-white/[0.05] bg-[#171b1a] px-3 text-center group-hover:bg-[#202622]">
                            <div className="text-xs font-semibold text-emerald-400">
                              {percent}%
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-emerald-400 transition-all"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <div className="mt-1.5 text-[10px] text-zinc-500">
                              {count}/{dayCount}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 p-3 md:hidden">
                {habits.map((habit, index) => {
                  const count = getCompletedDays(habit);
                  const percent = Math.round((count / dayCount) * 100);

                  return (
                    <div
                      key={habit.id}
                      className="rounded-2xl border border-white/[0.07] bg-[#1d2320] p-4"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-xs font-semibold text-emerald-400">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <div className="min-w-0 flex-1">
                            <input
                              value={habit.name}
                              onChange={(e) =>
                                updateHabitName(habit.id, e.target.value)
                              }
                              aria-label="Habit name"
                              className="w-full bg-transparent text-sm font-semibold text-white outline-none focus:text-emerald-300"
                            />
                            <div className="mt-1 text-xs text-zinc-500">
                              {count} of {dayCount} days completed
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <ProgressRing value={percent} size={54} />
                          <button
                            onClick={() => setDeleteId(habit.id)}
                            aria-label={`Delete ${habit.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-zinc-500 hover:bg-red-400/10 hover:text-red-400"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-7 gap-y-3 gap-x-1">
                        {Array.from({ length: dayCount }, (_, i) => {
                          const day = i + 1;
                          return (
                            <div key={day} className="flex justify-center">
                              <DayButton
                                day={day}
                                today={today === day}
                                checked={!!habit.days?.[day]}
                                onClick={() => toggleDay(habit.id, day)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {habits.length > 0 && dataReady && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] px-4 py-4 sm:px-6">
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-emerald-400" />
                  Completed
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-[#343c37]" />
                  Pending
                </span>
              </div>
              <span className="text-xs text-zinc-600">
                Changes saved automatically
              </span>
            </div>
          )}
        </section>

        <footer className="py-7 text-center text-xs text-zinc-600">
          Progress is built one day at a time.
        </footer>
      </div>

      {/* Add habit modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowAdd(false);
          }}
        >
          <form
            onSubmit={addHabit}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1c221f] p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Create New Habit
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  What would you like to track?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="text-xl text-zinc-500 hover:text-white"
              >
                ×
              </button>
            </div>

            <label className="mb-2 block text-xs font-medium text-zinc-300">
              Habit Name
            </label>

            <input
              autoFocus
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              maxLength={80}
              placeholder="e.g. Read for 30 minutes"
              className="h-12 w-full rounded-xl border border-white/10 bg-[#101413] px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-400/60"
            />

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newHabit.trim()}
                className="flex-1 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-[#082a1c] hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add Habit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1c221f] p-6 shadow-2xl"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-400/10 text-2xl text-red-400">
              !
            </div>
            <h3 id="delete-title" className="text-lg font-semibold text-white">
              Delete this habit?
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              This will remove the habit and its progress for the
              selected month. This action cannot be undone.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={deleteHabit}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white hover:bg-red-400"
              >
                Delete Habit
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
