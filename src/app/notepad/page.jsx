"use client";
import { useEffect, useRef, useState } from "react";

export default function Notepad() {
  const editorRef = useRef(null);
  const handlesRef = useRef(null);

  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [selectedImg, setSelectedImg] = useState(null);

  // Load tabs from localStorage
  useEffect(() => {
    const savedTabs = JSON.parse(localStorage.getItem("notepad-tabs"));
    if (savedTabs && savedTabs.length > 0) {
      setTabs(savedTabs);
      setActiveTab(savedTabs[0].id);
    } else {
      createNewTab();
    }
  }, []);

  const saveTabs = (updatedTabs) => {
    setTabs(updatedTabs);
    localStorage.setItem("notepad-tabs", JSON.stringify(updatedTabs));
  };

  const createNewTab = () => {
    const id = Date.now();
    const newTab = {
      id,
      title: `Note ${tabs.length + 1}`,
      content: "",
      createdAt: new Date().toISOString(),
    };

    const updated = [...tabs, newTab];
    saveTabs(updated);
    setActiveTab(id);

    if (editorRef.current) {
      setTimeout(() => {
        editorRef.current.innerHTML = "";
        editorRef.current.focus();
      }, 100);
    }
  };

  const switchTab = (id) => {
    const tab = tabs.find((t) => t.id === id);
    setActiveTab(id);

    if (editorRef.current) {
      editorRef.current.innerHTML = tab.content || "";
    }

    hideResizeHandles();
  };

  const renameTab = (id, newTitle) => {
    const updated = tabs.map((t) =>
      t.id === id ? { ...t, title: newTitle } : t
    );
    saveTabs(updated);
  };

  const deleteTab = (id) => {
    let updated = tabs.filter((t) => t.id !== id);

    if (updated.length === 0) {
      createNewTab();
      return;
    }

    saveTabs(updated);
    setActiveTab(updated[0].id);
    editorRef.current.innerHTML = updated[0].content;
  };

  const saveContent = () => {
    if (!activeTab || !editorRef.current) return;

    const updated = tabs.map((t) =>
      t.id === activeTab ? { ...t, content: editorRef.current.innerHTML } : t
    );

    saveTabs(updated);
  };

  // Image handling functions (same as before)
  const insertHtmlAtCursor = (html) => {
    editorRef.current.focus();
    const sel = document.getSelection();

    if (!sel || sel.rangeCount === 0) {
      editorRef.current.insertAdjacentHTML("beforeend", html);
      saveContent();
      return;
    }

    const range = sel.getRangeAt(0);
    range.deleteContents();

    const el = document.createElement("div");
    el.innerHTML = html;

    const frag = document.createDocumentFragment();
    let node, lastNode;

    while ((node = el.firstChild)) lastNode = frag.appendChild(node);

    range.insertNode(frag);

    if (lastNode) {
      const newRange = document.createRange();
      newRange.setStartAfter(lastNode);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }

    saveContent();
  };

  const handlePaste = (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.includes("image")) {
        const file = item.getAsFile();
        const reader = new FileReader();

        reader.onload = (e) => {
          const imgHtml = `<img src="${e.target.result}" class="my-4 rounded-lg shadow-lg max-w-full border border-white/10" />`;
          insertHtmlAtCursor(imgHtml);
        };

        reader.readAsDataURL(file);
        event.preventDefault();
        return;
      }
    }

    setTimeout(saveContent, 0);
  };

  const handleEditorClick = (e) => {
    if (e.target.tagName === "IMG") {
      setSelectedImg(e.target);
      showResizeHandles(e.target);
    } else hideResizeHandles();
  };

  const showResizeHandles = (img) => {
    const box = handlesRef.current;
    const rect = img.getBoundingClientRect();

    box.style.display = "block";
    box.style.left = rect.left + "px";
    box.style.top = rect.top + "px";
    box.style.width = rect.width + "px";
    box.style.height = rect.height + "px";
  };

  const hideResizeHandles = () => {
    if (handlesRef.current) {
      handlesRef.current.style.display = "none";
    }
    setSelectedImg(null);
  };

  // Resize handles setup
  useEffect(() => {
    const box = document.createElement("div");

    box.style.position = "fixed";
    box.style.border = "2px solid #10b981";
    box.style.pointerEvents = "none";
    box.style.display = "none";
    box.style.zIndex = "9999";
    box.style.borderRadius = "8px";

    ["nw", "ne", "sw", "se"].forEach((pos) => {
      const h = document.createElement("div");
      h.dataset.pos = pos;

      h.style.width = "14px";
      h.style.height = "14px";
      h.style.background = "#10b981";
      h.style.border = "2px solid #059669";
      h.style.borderRadius = "50%";
      h.style.position = "absolute";
      h.style.pointerEvents = "auto";
      h.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";

      h.style.cursor =
        pos === "nw"
          ? "nwse-resize"
          : pos === "ne"
          ? "nesw-resize"
          : pos === "sw"
          ? "nesw-resize"
          : "nwse-resize";

      box.appendChild(h);
    });

    document.body.appendChild(box);
    handlesRef.current = box;

    return () => box.remove();
  }, []);

  useEffect(() => {
    if (!selectedImg) return;

    const box = handlesRef.current;
    const handles = box.children;
    const rect = selectedImg.getBoundingClientRect();

    box.style.left = rect.left + "px";
    box.style.top = rect.top + "px";
    box.style.width = rect.width + "px";
    box.style.height = rect.height + "px";

    handles[0].style.left = "-7px";
    handles[0].style.top = "-7px";

    handles[1].style.right = "-7px";
    handles[1].style.top = "-7px";

    handles[2].style.left = "-7px";
    handles[2].style.bottom = "-7px";

    handles[3].style.right = "-7px";
    handles[3].style.bottom = "-7px";
  });

  useEffect(() => {
    const box = handlesRef.current;
    if (!box) return;

    let startX, startY, startW, startH, activeHandle;

    const mouseDown = (e) => {
      if (!e.target.dataset.pos) return;
      activeHandle = e.target.dataset.pos;

      startX = e.clientX;
      startY = e.clientY;

      startW = selectedImg.clientWidth;
      startH = selectedImg.clientHeight;

      document.addEventListener("mousemove", mouseMove);
      document.addEventListener("mouseup", mouseUp);
    };

    const mouseMove = (e) => {
      if (!activeHandle) return;

      let dx = e.clientX - startX;
      let dy = e.clientY - startY;

      let newW = startW;
      let newH = startH;

      if (activeHandle.includes("e")) newW = startW + dx;
      if (activeHandle.includes("s")) newH = startH + dy;
      if (activeHandle.includes("w")) newW = startW - dx;
      if (activeHandle.includes("n")) newH = startH - dy;

      if (newW > 40) selectedImg.style.width = newW + "px";
      if (newH > 40) selectedImg.style.height = newH + "px";

      showResizeHandles(selectedImg);
    };

    const mouseUp = () => {
      activeHandle = null;
      saveContent();

      document.removeEventListener("mousemove", mouseMove);
      document.removeEventListener("mouseup", mouseUp);
    };

    box.addEventListener("mousedown", mouseDown);
    return () => box.removeEventListener("mousedown", mouseDown);
  }, [selectedImg]);

  const getWordCount = () => {
    if (!editorRef.current) return 0;
    const text = editorRef.current.innerText || "";
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const getLineCount = () => {
    if (!editorRef.current) return 0;
    const text = editorRef.current.innerText || "";
    return text.trim() ? text.split("\n").length : 0;
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-[#0f0f10] to-black text-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gray-900/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full animate-pulse"></div>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Notepad
          </h1>
          <div className="h-4 w-px bg-white/20 mx-2"></div>
          <span className="text-sm text-gray-400">
            {tabs.length} {tabs.length === 1 ? "tab" : "tabs"}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>{getWordCount()} words</span>
          <span>{getLineCount()} lines</span>
          <div className="h-4 w-px bg-white/20"></div>
          <span className="text-xs bg-white/5 px-2 py-1 rounded-lg">
            Auto-save
          </span>
        </div>
      </div>

   {/* Tabs Bar */}
<div className="flex items-center px-4 sm:px-6 py-3 bg-gray-800/50 border-b border-white/10 backdrop-blur-sm overflow-x-auto no-scrollbar gap-2">
  {/* Scroll Buttons for Mobile */}
  <div className="flex items-center gap-1 sm:hidden">
    <button
      onClick={() => {
        const container = document.querySelector('.tabs-container');
        container.scrollBy({ left: -200, behavior: 'smooth' });
      }}
      className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all"
    >
      ‹
    </button>
    <button
      onClick={() => {
        const container = document.querySelector('.tabs-container');
        container.scrollBy({ left: 200, behavior: 'smooth' });
      }}
      className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all"
    >
      ›
    </button>
  </div>

  {/* Tabs Container */}
  <div className="tabs-container flex items-center flex-1 overflow-x-auto no-scrollbar gap-2 min-w-0">
    {tabs.map((tab) => (
      <div
        key={tab.id}
        onClick={() => switchTab(tab.id)}
        onDoubleClick={() => {
          const newTitle = prompt("Rename tab:", tab.title);
          if (newTitle) renameTab(tab.id, newTitle);
        }}
        className={`
          group flex items-center flex-shrink-0 px-3 sm:px-4 py-2.5 rounded-xl border transition-all duration-300
          whitespace-nowrap select-none min-w-[120px] sm:min-w-[140px] max-w-[160px] sm:max-w-[200px] cursor-pointer
          ${
            activeTab === tab.id
              ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg border-emerald-500/30"
              : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20"
          }
        `}
      >
        {/* Tab Icon */}
        <div className="flex-shrink-0 w-3 h-3 rounded-full bg-white/20 mr-2 sm:mr-3"></div>
        
        {/* Tab Title */}
        <span className="truncate flex-1 text-sm sm:text-base">{tab.title}</span>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteTab(tab.id);
          }}
          className={`
            ml-2 transition-all duration-200 flex items-center justify-center w-5 h-5 rounded flex-shrink-0
            ${
              activeTab === tab.id
                ? "text-white hover:bg-white/20"
                : "text-gray-400 hover:text-red-400 hover:bg-white/10"
            }
            opacity-0 group-hover:opacity-100
          `}
        >
          ×
        </button>
      </div>
    ))}
  </div>

  {/* New Tab Button */}
  <button
    onClick={createNewTab}
    className="
      flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0
      rounded-xl bg-white/5 border border-white/10 
      text-gray-300 hover:bg-white/10 hover:text-white
      transition-all duration-300 hover:scale-105
      shadow-lg hover:shadow-xl
    "
  >
    <span className="text-lg font-semibold">+</span>
  </button>

  {/* Tab Count Indicator */}
  <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10">
    <span className="text-xs text-gray-400 whitespace-nowrap">
      {tabs.length} {tabs.length === 1 ? 'tab' : 'tabs'}
    </span>
  </div>
</div>
      {/* Editor Container */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={editorRef}
          contentEditable
          spellCheck={true}
          onInput={saveContent}
          onPaste={handlePaste}
          onClick={handleEditorClick}
          className="
            w-full h-full px-8 py-8
            bg-gray-800/20 backdrop-blur-sm
            font-mono text-[15px] leading-8
            overflow-y-auto scrollbar-thin
            outline-none
            bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)]
            bg-[length:100%_32px]
            text-gray-300
            selection:bg-emerald-500/30
          "
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px, 100% 32px",
          }}
          placeholder="Start typing... Paste images with Ctrl+V..."
        ></div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900/50 border-t border-white/10 text-sm text-gray-400">
        <div className="flex items-center gap-4">
          <span>⌘ + S to save</span>
          <span>•</span>
          <span>Ctrl + V for images</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Double-click tabs to rename</span>
        </div>
      </div>
    </div>
  );
}
