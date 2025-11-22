"use client";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  CartesianGrid,
} from "recharts";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function getStorageKey(year, monthIndex) {
  return `habit-tracker:${year}-${monthIndex + 1}`;
}

export default function HabitTracker() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const dayCount = daysInMonth(year, monthIndex);

  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState("");
  const [hoverDel, setHoverDel] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load month
  useEffect(() => {
    try {
      const data = localStorage.getItem(getStorageKey(year, monthIndex));
      if (data) setHabits(JSON.parse(data));
      else setHabits([]);
    } catch {}
  }, [year, monthIndex]);

  // Save month
  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(year, monthIndex), JSON.stringify(habits));
    } catch {}
  }, [habits, year, monthIndex]);

  function addHabit() {
    if (!newHabit.trim()) return;
    setHabits([...habits, { id: uid(), name: newHabit.trim(), days: {} }]);
    setNewHabit("");
  }

  function toggleDay(id, day) {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? { ...h, days: { ...h.days, [day]: !h.days[day] } }
          : h
      )
    );
  }

  function deleteHabit(id) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setShowConfirm(null);
  }

  // Recharts data
  const chartData = useMemo(() => {
    const daily = [];
    for (let d = 1; d <= dayCount; d++) {
      let checked = 0;
      habits.forEach((h) => (h.days[d] ? checked++ : null));
      daily.push({ day: d, progress: habits.length ? Math.round((checked / habits.length) * 100) : 0 });
    }
    return daily;
  }, [habits, dayCount]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f0f10] to-black text-gray-200">
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'} border-b border-white/10 p-4`}>
        <h1 className="text-xl font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Habit Tracker
        </h1>

        <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex items-center gap-3'}`}>
          <input
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addHabit()}
            placeholder="Type a habit and press Enter"
            className={`${isMobile ? 'w-full' : 'w-4/12'} bg-gray-800/50 border border-white/10 rounded px-4 py-2 text-sm outline-none`}
          />

          <div className={`flex ${isMobile ? 'justify-between' : 'items-center gap-3'}`}>
            <select 
              value={monthIndex} 
              onChange={(e) => setMonthIndex(Number(e.target.value))} 
              className="bg-gray-800/50 border border-white/10 rounded px-3 py-2 text-sm"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i}> {m} </option>
              ))}
            </select>

            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-gray-800/50 border border-white/10 rounded px-3 py-2 w-20 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="bg-gray-900/40 p-4">
        <div className="text-sm text-gray-300 mb-2">Monthly Progress</div>
        <ResponsiveContainer width="100%" height={isMobile ? 150 : 200}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" stroke="#aaa" fontSize={isMobile ? 8 : 10} />
            <YAxis stroke="#aaa" fontSize={isMobile ? 8 : 10} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
            <Area type="monotone" dataKey="progress" stroke="#14b8a6" fill="#14b8a620" fillOpacity={0.2} />
            <Line type="monotone" dataKey="progress" stroke="#14b8a6" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="overflow-auto border border-white/10 bg-gray-900/20">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="bg-gray-900/40 text-gray-400 text-xs">
              <th className={`${isMobile ? 'px-2 py-1 w-32' : 'px-3 py-2 w-48'} text-center`}>Habit</th>
              {Array.from({ length: dayCount }).map((_, i) => (
                <th key={i} className={`${isMobile ? 'w-4 px-0.5' : 'w-6 px-1'} text-center`}>
                  {isMobile ? (i + 1) : i + 1}
                </th>
              ))}
              <th className={isMobile ? "w-8" : "w-10"}></th>
            </tr>
          </thead>

          <tbody>
            {habits.map((h) => (
              <tr key={h.id} className="border-b border-white/5 hover:bg-gray-800/20">
                <td className={isMobile ? "px-2 py-1" : "px-3 py-2"}>
                  <input
                    value={h.name}
                    onChange={(e) => setHabits(prev => prev.map(x => x.id === h.id ? { ...x, name: e.target.value } : x))}
                    className="bg-transparent w-full outline-none text-sm"
                  />
                </td>

                {Array.from({ length: dayCount }).map((_, i) => (
                  <td key={i} className="text-center py-2">
                    <button
                      className={`${isMobile ? 'w-4 h-4 text-xs' : 'w-6 h-6'} rounded flex items-center justify-center transition
                        ${h.days[i+1] ? "bg-emerald-600" : "bg-white/5 hover:bg-white/10"}`}
                      onClick={() => toggleDay(h.id, i + 1)}
                    >
                      {h.days[i+1] && "✓"}
                    </button>
                  </td>
                ))}

                <td className="text-center relative">
                  <button
                    onMouseEnter={() => setHoverDel(h.id)}
                    onMouseLeave={() => setTimeout(() => setHoverDel(null), 150)}
                    onClick={() => setShowConfirm(h.id)}
                    className={`${isMobile ? 'w-6 h-6 text-sm' : 'w-7 h-7'} rounded bg-white/5 hover:bg-white/10 text-red-400`}
                  >
                    ×
                  </button>

                  {showConfirm === h.id && (
                    <div className={`absolute ${isMobile ? 'left-0 -top-12' : 'left-1/2 -translate-x-1/2 -top-12'} bg-gray-800 border border-white/10 rounded p-2 text-xs shadow-xl z-50`}>
                      <div className="mb-2 text-gray-300">Delete?</div>
                      <div className="flex gap-2">
                        <button onClick={() => deleteHabit(h.id)} className="px-2 py-1 bg-red-600 text-white rounded">Yes</button>
                        <button onClick={() => setShowConfirm(null)} className="px-2 py-1 bg-white/10 text-gray-300 rounded">No</button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Add Habit Button */}
      {isMobile && (
        <div className="fixed bottom-4 right-4">
          <button
            onClick={addHabit}
            className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-emerald-700 transition"
            title="Add Habit"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}