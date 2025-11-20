"use client";
import { useEffect, useRef, useState } from "react";

export default function LargePomodoro() {
  const MODES = {
    focus: 25 * 60,
    short: 5 * 60,
    long: 15 * 60,
  };

  const [mode, setMode] = useState("focus");
  const [seconds, setSeconds] = useState(MODES.focus);
  const [title, setTitle] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  // 🔔 Alarm sound reference
  const alarmRef = useRef(null);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem("large-pomo");
    if (saved) {
      const p = JSON.parse(saved);
      setMode(p.mode);
      setSeconds(p.seconds);
      setTitle(p.title);
    }
  }, []);

  // Save state
  useEffect(() => {
    localStorage.setItem(
      "large-pomo",
      JSON.stringify({ mode, seconds, title })
    );
  }, [mode, seconds, title]);

  // Timer logic
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);

          // 🔔 PLAY ALARM SOUND
          if (alarmRef.current) {
            alarmRef.current.currentTime = 0;
            alarmRef.current.play();
          }

          return MODES[mode];
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode]);

  const changeMode = (m) => {
    setMode(m);
    setSeconds(MODES[m]);
    setIsRunning(false);
  };

  // Format time
  const format = (sec) => {
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return { h, m, s };
  };

  const { h, m, s } = format(seconds);

  const getModeColor = () => {
    switch (mode) {
      case "focus":
        return "from-emerald-500 to-cyan-500";
      case "short":
        return "from-amber-500 to-orange-500";
      case "long":
        return "from-violet-500 to-purple-500";
      default:
        return "from-emerald-500 to-cyan-500";
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case "focus":
        return "Focus Session";
      case "short":
        return "Short Break";
      case "long":
        return "Long Break";
      default:
        return "Focus Session";
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-[#0f0f10] to-black text-white flex items-stretch justify-center">
      {/* Pomodoro Frame */}
      <div className="w-full h-screen bg-gray-800/30 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between md:px-8 px-4 py-2 md:py-5 border-b border-white/10 bg-gray-900/80">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full animate-pulse"></div>
            <h1 className="md:text-xl font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Pomodoro Timer
            </h1>
          </div>
          <div className="px-3 py-1 rounded-full bg-gradient-to-r text-white font-medium text-sm">
            <div
              className={`bg-gradient-to-r ${getModeColor()} px-3 py-1 rounded-full`}
            >
              {getModeLabel()}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          {/* Tabs */}
          <div className="flex justify-center mb-6 md:mb-12">
            <div className="flex bg-gray-900/50 rounded-2xl p-1.5 border border-white/10">
              {[
                { key: "focus", label: "Focus", icon: "🎯" },
                { key: "short", label: "Short", icon: "☕" },
                { key: "long", label: "Long", icon: "🌿" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => changeMode(item.key)}
                  className={`
                    flex items-center gap-3 px-4 md:px-6 py-1.5 md:py-3 rounded-xl text-base font-medium transition-all duration-300
                    ${
                      mode === item.key
                        ? `bg-gradient-to-r ${getModeColor()} text-white shadow-lg`
                        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                    }
                  `}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Focus Title */}
          <div className="max-w-2xl mx-auto mb-12">
            <input
              type="text"
              placeholder="What are you focusing on?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-900/30 border border-gray-700/50 rounded-2xl px-6 py-4 outline-none text-gray-300 text-center placeholder-gray-500 text-lg focus:border-gray-600 transition-colors duration-300 hover:border-gray-600 backdrop-blur-sm"
            />
          </div>

          {/* Timer Display */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 md:gap-8 lg:gap-12 mb-4">
              {[
                { label: "HOURS", val: h },
                { label: "MINUTES", val: m },
                { label: "SECONDS", val: s },
              ].map((t, i) => (
                <div className="text-center" key={i}>
                  <div className="text-6xl md:text-8xl lg:text-9xl font-light bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {t.val}
                  </div>
                  <div className="text-gray-500 text-sm md:text-base tracking-widest mt-2">
                    {t.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Control Button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`
                px-16 py-4 rounded-2xl font-semibold text-xl transition-all duration-300
                transform hover:scale-105 active:scale-95 shadow-2xl flex items-center gap-3
                ${
                  isRunning
                    ? "bg-gradient-to-r from-red-500 to-rose-600"
                    : `bg-gradient-to-r ${getModeColor()}`
                }
              `}
            >
              {isRunning ? (
                <>
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  Stop Timer
                </>
              ) : (
                <>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Start Focus
                </>
              )}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto mt-12">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Session Progress</span>
              <span>
                {Math.round(((MODES[mode] - seconds) / MODES[mode]) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${getModeColor()} transition-all duration-1000`}
                style={{
                  width: `${((MODES[mode] - seconds) / MODES[mode]) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-white/10 bg-gray-900/50 text-center text-sm text-gray-500">
          Stay focused • Take breaks • Be productive
        </div>
      </div>

      {/* 🔔 Alarm Audio */}
      <audio ref={alarmRef} src="/alert.mp3" preload="auto"></audio>
    </div>
  );
}
