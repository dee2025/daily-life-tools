"use client";
import Link from "next/link";

export default function HomePage() {
  const tools = [
    // Active Tools
    {
      icon: "📝",
      title: "Notepad",
      desc: "Modern notepad with tabs, image paste & clean UI.",
      status: "active",
      href: "/notepad",
      gradient: "from-emerald-500 to-cyan-500"
    },
    {
      icon: "⏱️",
      title: "Pomodoro Timer",
      desc: "Focus better with structured work & break cycles.",
      status: "active", 
      href: "/pomodoro",
      gradient: "from-violet-500 to-purple-500"
    },

    // Productivity Bundle (Coming Soon)
    {
      icon: "📋",
      title: "Todo App",
      desc: "Organize tasks, priorities & daily goals.",
      status: "coming",
      gradient: "from-gray-600 to-gray-700"
    },
    {
      icon: "📅",
      title: "Habit Tracker",
      desc: "Track habits daily & build a routine.",
      status: "coming",
      gradient: "from-gray-600 to-gray-700"
    },
    {
      icon: "🟧",
      title: "Kanban Board",
      desc: "Visual drag-drop workflow management.",
      status: "coming",
      gradient: "from-gray-600 to-gray-700"
    },

    // Developer Bundle (Coming Soon)
    {
      icon: "🧩",
      title: "JSON Formatter",
      desc: "Format and validate JSON instantly.",
      status: "coming",
      gradient: "from-gray-600 to-gray-700"
    },
    {
      icon: "🛠️",
      title: "Code Snippets",
      desc: "Save and organize code snippets locally.",
      status: "coming",
      gradient: "from-gray-600 to-gray-700"
    },
    {
      icon: "🧪",
      title: "Regex Tester",
      desc: "Test regular expressions with live output.",
      status: "coming",
      gradient: "from-gray-600 to-gray-700"
    },
    {
      icon: "📦",
      title: "Text Formatter",
      desc: "Convert and transform text efficiently.",
      status: "coming",
      gradient: "from-gray-600 to-gray-700"
    },
    {
      icon: "🖼️",
      title: "Image Compressor",
      desc: "Compress images directly in browser.",
      status: "coming",
      gradient: "from-gray-600 to-gray-700"
    },
  ];

  const activeTools = tools.filter(tool => tool.status === "active");
  const comingTools = tools.filter(tool => tool.status === "coming");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f0f10] to-black text-gray-200">
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 py-5 border-b border-white/10 backdrop-blur-xl sticky top-0 z-50 bg-gray-900/80">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full animate-pulse"></div>
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Daily Life Tools
          </h1>
        </div>
        <div className="flex gap-6 text-sm">
          <Link 
            href="/" 
            className="text-white px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
          >
            Home
          </Link>
          <Link 
            href="/notepad" 
            className="text-gray-400 px-4 py-2 rounded-xl hover:bg-white/5 hover:text-white transition-all duration-300"
          >
            Notepad
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="text-center px-6 md:px-16 pt-20 pb-16 max-w-7xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 mb-8">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          Streamlined productivity suite for modern workflows
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
          Your Personal{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Digital Workspace
          </span>
        </h1>

        <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
          A curated collection of tools designed for creators, developers, and thinkers. 
          Clean, fast, and focused on what matters.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/notepad"
            className="
              px-8 py-4 font-semibold rounded-2xl
              bg-gradient-to-r from-emerald-500 to-cyan-500
              hover:from-emerald-600 hover:to-cyan-600
              shadow-lg hover:shadow-xl hover:scale-105
              transition-all duration-300
            "
          >
            Start with Notepad
          </Link>
          <Link
            href="/pomodoro"
            className="
              px-8 py-4 font-semibold rounded-2xl
              bg-white/5 border border-white/10
              hover:bg-white/10 hover:border-white/20
              shadow-lg hover:shadow-xl hover:scale-105
              transition-all duration-300
            "
          >
            Try Pomodoro
          </Link>
        </div>
      </section>

      {/* ACTIVE TOOLS */}
      <section className="px-6 md:px-16 pb-16 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Available Now
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/20 to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeTools.map((tool) => (
            <Link key={tool.title} href={tool.href}>
              <div
                className="
                  group p-6 rounded-2xl border border-white/10 
                  bg-white/[0.03] backdrop-blur-md hover:bg-white/[0.06]
                  transition-all duration-500 cursor-pointer shadow-lg
                  hover:shadow-2xl hover:scale-[1.02] relative overflow-hidden
                "
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${tool.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">{tool.icon}</div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/30">
                    Active
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold mb-2 group-hover:text-white transition-colors">
                  {tool.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {tool.desc}
                </p>
                
                <div className="mt-4 text-sm text-emerald-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Click to open →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* COMING SOON TOOLS */}
      <section className="px-6 md:px-16 pb-20 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Coming Soon
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {comingTools.map((tool) => (
            <div
              key={tool.title}
              className="
                group p-6 rounded-2xl border border-white/10 
                bg-white/[0.02] backdrop-blur-md
                cursor-not-allowed relative overflow-hidden
                shadow-lg opacity-60 hover:opacity-80 transition-all duration-300
              "
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-60"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl text-gray-500">{tool.icon}</div>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full border border-amber-500/30">
                    Coming Soon
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold mb-2 text-gray-400">
                  {tool.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  {tool.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-12 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full animate-pulse"></div>
            <p className="text-gray-400 text-sm">
              Built by Deepak Singh • More tools in development
            </p>
          </div>
          <p className="text-gray-500 text-xs">
            Designed for focus, built for productivity
          </p>
        </div>
      </footer>
    </div>
  );
}