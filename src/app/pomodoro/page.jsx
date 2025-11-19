"use client";

import { useEffect, useState, useRef } from "react";

export default function Pomodoro() {
  const MODES = {
    pomodoro: 25 * 60,
    short: 5 * 60,
    long: 15 * 60,
  };

  const [mode, setMode] = useState("pomodoro");
  const [seconds, setSeconds] = useState(MODES.pomodoro);
  const [isRunning, setIsRunning] = useState(false);

  const intervalRef = useRef(null);

  // Load saved state
  useEffect(() => {
    const saved = localStorage.getItem("pomo-new-ui");
    if (saved) {
      const parsed = JSON.parse(saved);
      setMode(parsed.mode);
      setSeconds(parsed.seconds);
      setIsRunning(parsed.isRunning);
    }
  }, []);

  // Save state
  useEffect(() => {
    localStorage.setItem(
      "pomo-new-ui",
      JSON.stringify({ mode, seconds, isRunning })
    );
  }, [mode, seconds, isRunning]);

  const maxTime = MODES[mode];

  // Timer Logic
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return maxTime;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode]);

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const percentage = ((maxTime - seconds) / maxTime) * 100;
  const dashOffset = 440 - (440 * percentage) / 100;

  return (
    <div className="min-h-screen bg-[#0d0f11] text-white flex flex-col items-center py-16 px-6">

      {/* Mode Switch */}
      <div className="flex gap-3 mb-10">
        {[
          { key: "pomodoro", label: "Pomodoro" },
          { key: "short", label: "Short Break" },
          { key: "long", label: "Long Break" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => {
              setMode(item.key);
              setSeconds(MODES[item.key]);
              setIsRunning(false);
            }}
            className={`
              px-5 py-2 rounded-full border text-sm transition
              ${
                mode === item.key
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "border-gray-600 text-gray-300 hover:bg-[#1a1c1f]"
              }
            `}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Timer Circle */}
      <div className="relative w-64 h-64 mb-10">
        <svg className="w-full h-full rotate-[-90deg]">
          {/* Background Circle */}
          <circle
            cx="128"
            cy="128"
            r="100"
            stroke="#24272b"
            strokeWidth="12"
            fill="transparent"
          />

          {/* Progress Circle */}
          <circle
            cx="128"
            cy="128"
            r="100"
            stroke="url(#gradientStroke)"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray="440"
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-300"
          />

          <defs>
            <linearGradient id="gradientStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d66efd" />
              <stop offset="100%" stopColor="#ff6b8b" />
            </linearGradient>
          </defs>
        </svg>

        {/* TIME INSIDE CIRCLE */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-5xl font-semibold">{formatTime(seconds)}</p>

          {isRunning ? (
            <button
              onClick={() => setIsRunning(false)}
              className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 rounded-lg shadow transition"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={() => setIsRunning(true)}
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition"
            >
              Start
            </button>
          )}
        </div>
      </div>

      {/* Time Adjust Buttons */}
      <div className="flex items-center gap-6 bg-[#1a1c1f] px-6 py-3 rounded-full border border-[#2a2d31]">
        <button
          onClick={() => setSeconds((prev) => Math.max(prev - 300, 0))}
          className="text-lg px-3 py-1 rounded-lg hover:bg-[#2a2d31] transition"
        >
          -5
        </button>

        <p className="text-gray-300 text-sm">{Math.floor(maxTime / 60)} min</p>

        <button
          onClick={() => setSeconds((prev) => prev + 300)}
          className="text-lg px-3 py-1 rounded-lg hover:bg-[#2a2d31] transition"
        >
          +5
        </button>
      </div>
    </div>
  );
}
