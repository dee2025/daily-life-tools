"use client";
import Link from "next/link";

export default function HomePage() {
  const tools = [
    // Productivity Bundle
    {
      icon: "📋",
      title: "Todo App",
      desc: "Organize tasks, priorities & daily goals.",
    },
    {
      icon: "⏱️",
      title: "Pomodoro Timer",
      desc: "Boost focus with structured work intervals.",
    },
    {
      icon: "📅",
      title: "Habit Tracker",
      desc: "Track habits daily & build a routine.",
    },
    {
      icon: "🟧",
      title: "Kanban Board",
      desc: "Visual drag-drop workflow management.",
    },

    // Developer Bundle
    {
      icon: "🧩",
      title: "JSON Formatter",
      desc: "Format and validate JSON instantly.",
    },
    {
      icon: "🛠️",
      title: "Code Snippets",
      desc: "Save and organize code snippets locally.",
    },
    {
      icon: "🧪",
      title: "Regex Tester",
      desc: "Test regular expressions with live output.",
    },
    {
      icon: "📦",
      title: "Text Formatter",
      desc: "Convert and transform text efficiently.",
    },
    {
      icon: "🖼️",
      title: "Image Compressor",
      desc: "Compress images directly in browser.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#18191c] to-[#0f0f10] text-gray-200">
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10 backdrop-blur-xl">
        <h1 className="text-xl font-semibold tracking-tight">
          Daily Life Tools
        </h1>
        <div className="flex gap-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition">
            Home
          </Link>
          <Link href="/notepad" className="hover:text-white transition">
            Notepad
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="text-center px-6 md:px-16 pt-24 pb-16">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
          Your Personal <span className="text-blue-400">Workspace</span>
          <br />
          For Everyday Productivity.
        </h1>

        <p className="text-gray-400 mt-6 text-lg max-w-2xl mx-auto leading-relaxed">
          A suite of tools designed for creators, developers, and thinkers.
          Notepad is ready — more tools from Productivity & Developer bundles
          are coming soon.
        </p>

        <Link
          href="/notepad"
          className="
            inline-block mt-10 px-8 py-3 text-lg font-semibold
            bg-blue-600 hover:bg-blue-700 rounded-xl
            shadow-[0_0_20px_rgba(37,99,235,0.4)]
            transition-all
          "
        >
          Open Notepad
        </Link>
      </section>

      {/* TOOLS GRID */}
      <section className="px-6 md:px-16 pb-20">
        <h2 className="text-2xl md:text-3xl font-semibold mb-8 tracking-tight">
          Tools Available & Coming Soon
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* ACTIVE TOOL: NOTEPAD */}
          <Link href="/notepad">
            <div
              className="
                p-6 rounded-2xl border border-white/10 
                bg-white/[0.03] backdrop-blur-md hover:bg-white/[0.06]
                hover:border-blue-500 transition-all cursor-pointer shadow-lg
                hover:scale-[1.03]
              "
            >
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold">Notepad</h3>
              <p className="text-gray-400 mt-2 leading-relaxed">
                A modern notepad with tabs, image paste, image resizing and
                clean writing UI.
              </p>
            </div>
          </Link>
          {/* <Link href="/pomodoro">
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.08] transition shadow hover:scale-[1.03] cursor-pointer">
              <div className="text-4xl mb-4">⏱️</div>
              <h3 className="text-xl font-semibold">Pomodoro Timer</h3>
              <p className="text-gray-400 mt-2">
                Focus better with structured work & break cycles.
              </p>
            </div>
          </Link> */}

          {/* COMING SOON TOOLS */}
          {tools.map((tool) => (
            <div
              key={tool.title}
              className="
                p-6 rounded-2xl border border-white/10 
                bg-white/[0.03] backdrop-blur-md opacity-40
                cursor-not-allowed relative shadow-lg
              "
            >
              <span className="absolute top-3 right-3 bg-yellow-500/90 text-black px-2 py-1 text-xs font-semibold rounded-md">
                Coming Soon
              </span>

              <div className="text-4xl mb-4">{tool.icon}</div>
              <h3 className="text-xl font-semibold">{tool.title}</h3>

              <p className="text-gray-500 mt-2 leading-relaxed">{tool.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-8 text-gray-500 border-t border-white/10 text-sm">
        Built by Deepak Singh • New tools coming soon.
      </footer>
    </div>
  );
}
