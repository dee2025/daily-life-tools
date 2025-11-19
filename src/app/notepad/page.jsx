"use client";
import { useEffect, useRef, useState } from "react";

export default function Notepad() {
  const editorRef = useRef(null);
  const handlesRef = useRef(null);

  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [selectedImg, setSelectedImg] = useState(null);

  // -------------------------------
  // Load tabs from localStorage
  // -------------------------------
  useEffect(() => {
    const savedTabs = JSON.parse(localStorage.getItem("notepad-tabs"));
    if (savedTabs && savedTabs.length > 0) {
      setTabs(savedTabs);
      setActiveTab(savedTabs[0].id);
    } else {
      createNewTab(); // First tab
    }
  }, []);

  // --------------------------------
  // Save tabs to localStorage
  // --------------------------------
  const saveTabs = (updatedTabs) => {
    setTabs(updatedTabs);
    localStorage.setItem("notepad-tabs", JSON.stringify(updatedTabs));
  };

  // --------------------------------
  // Create a new tab
  // --------------------------------
  const createNewTab = () => {
    const id = Date.now();
    const newTab = { id, title: `Tab ${tabs.length + 1}`, content: "" };

    const updated = [...tabs, newTab];
    saveTabs(updated);
    setActiveTab(id);

    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  // --------------------------------
  // Switch tab
  // --------------------------------
  const switchTab = (id) => {
    const tab = tabs.find((t) => t.id === id);
    setActiveTab(id);

    if (editorRef.current) {
      editorRef.current.innerHTML = tab.content || "";
    }

    hideResizeHandles();
  };

  // --------------------------------
  // Rename tab
  // --------------------------------
  const renameTab = (id, newTitle) => {
    const updated = tabs.map((t) =>
      t.id === id ? { ...t, title: newTitle } : t
    );
    saveTabs(updated);
  };

  // --------------------------------
  // Delete tab
  // --------------------------------
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

  // --------------------------------
  // Save content into active tab
  // --------------------------------
  const saveContent = () => {
    if (!activeTab || !editorRef.current) return;

    const updated = tabs.map((t) =>
      t.id === activeTab ? { ...t, content: editorRef.current.innerHTML } : t
    );

    saveTabs(updated);
  };

  // ============================================================
  // IMAGE INSERT, PASTE, SELECT, RESIZE (same as earlier)
  // ============================================================

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
          const imgHtml = `<img src="${e.target.result}" class="my-3 rounded-md shadow max-w-full" />`;
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
    handlesRef.current.style.display = "none";
    setSelectedImg(null);
  };

  useEffect(() => {
    const box = document.createElement("div");

    box.style.position = "absolute";
    box.style.border = "2px solid #4f7fff";
    box.style.pointerEvents = "none";
    box.style.display = "none";
    box.style.zIndex = "9999";

    ["nw", "ne", "sw", "se"].forEach((pos) => {
      const h = document.createElement("div");
      h.dataset.pos = pos;

      h.style.width = "12px";
      h.style.height = "12px";
      h.style.background = "white";
      h.style.border = "2px solid #4f7fff";
      h.style.borderRadius = "50%";
      h.style.position = "absolute";
      h.style.pointerEvents = "auto";

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

    handles[0].style.left = "-6px";
    handles[0].style.top = "-6px";

    handles[1].style.right = "-6px";
    handles[1].style.top = "-6px";

    handles[2].style.left = "-6px";
    handles[2].style.bottom = "-6px";

    handles[3].style.right = "-6px";
    handles[3].style.bottom = "-6px";
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

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="h-full bg-[#1e1f22] text-gray-200">
      {/* --------------------- TABS BAR ---------------------- */}
      <div className="flex items-center w-full overflow-x-auto no-scrollbar gap-2">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            onDoubleClick={() => {
              const newTitle = prompt("Rename tab:", tab.title);
              if (newTitle) renameTab(tab.id, newTitle);
            }}
            className={`
        group flex items-center px-4 py-2 rounded-t-md border transition-all
        whitespace-nowrap select-none
        ${
          activeTab === tab.id
            ? " border-green-500 bg-green-600 text-white shadow-sm"
            : "bg-[#3a3c42] border-gray-600 text-gray-300 hover:bg-[#323338]"
        }
      `}
          >
            <span className="truncate max-w-[120px]">{tab.title}</span>

            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteTab(tab.id);
              }}
              className="
          ml-3 text-gray-400 hover:text-red-500 
          transition opacity-0 group-hover:opacity-100
        "
            >
              ✕
            </button>
          </div>
        ))}

        {/* New Tab Button */}
        <button
          onClick={createNewTab}
          className="
      flex items-center justify-center w-10 h-10 px-10
      rounded-t-md bg-[#3a3c42] hover:bg-[#323338] 
      text-gray-300 border border-gray-600 text-xl font-bold
      transition select-none cursor-pointer
    "
        >
          +
        </button>
      </div>

      {/* --------------------- EDITOR --------------------- */}
      <div className="">
        <div
          ref={editorRef}
          contentEditable
          spellCheck={true}
          onInput={saveContent}
          onPaste={handlePaste}
          onClick={handleEditorClick}
          className="
 px-4 p-8 shadow  h-[calc(100vh-42px)]
            bg-[#2b2d31] font-mono text-[14px] leading-7
            overflow-y-scroll
           
            bg-[linear-gradient(#3b3d42_1px,transparent_1px)]
            bg-[length:100%_28px]
            outline-none
          "
        ></div>
      </div>
    </div>
  );
}
