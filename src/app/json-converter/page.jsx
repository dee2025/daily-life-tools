"use client";
import { useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 500;
const DEFAULT_SAMPLE = `{
  "user": {
    "id": 123,
    "name": "Deepak",
    "active": true,
    "roles": ["admin", "editor"],
    "profile": {
      "email": "deepak@example.com",
      "joined": "2025-01-01"
    }
  },
  "tasks": [
    { "id": 1, "title": "Build Pomodoro", "done": true },
    { "id": 2, "title": "Create JSON Tool", "done": false }
  ]
}`;

function encodeForHash(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    return "";
  }
}

function decodeFromHash(s) {
  try {
    return decodeURIComponent(escape(atob(s)));
  } catch {
    return "";
  }
}

function jsonToXml(obj, indent = "") {
  if (obj === null) return `${indent}<null/>`;
  if (typeof obj !== "object") {
    return `${indent}${escapeXml(String(obj))}`;
  }
  if (Array.isArray(obj)) {
    return obj
      .map((item) => `${indent}<item>${jsonToXml(item, "")}</item>`)
      .join("\n");
  }
  let xml = "";
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === null) {
      xml += `${indent}<${key} />\n`;
    } else if (typeof val === "object") {
      xml += `${indent}<${key}>\n${jsonToXml(
        val,
        indent + "  "
      )}\n${indent}</${key}>\n`;
    } else {
      xml += `${indent}<${key}>${escapeXml(String(val))}</${key}>\n`;
    }
  }
  return xml.trim();
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function xmlToJson(xmlStr) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlStr, "application/xml");
    if (doc.querySelector("parsererror")) {
      throw new Error("Invalid XML");
    }
    function nodeToObj(node) {
      if (node.nodeType === 3) return node.nodeValue;
      const obj = {};
      const children = Array.from(node.childNodes).filter((n) => {
        return !(n.nodeType === 3 && !/\S/.test(n.nodeValue));
      });
      if (children.length === 0) return "";
      if (children.length === 1 && children[0].nodeType === 3) {
        return children[0].nodeValue;
      }
      for (const child of children) {
        if (child.nodeType !== 1) continue;
        const name = child.nodeName;
        const val = nodeToObj(child);
        if (obj[name]) {
          if (!Array.isArray(obj[name])) obj[name] = [obj[name]];
          obj[name].push(val);
        } else {
          obj[name] = val;
        }
      }
      return obj;
    }
    const root = doc.children[0];
    const result = {};
    result[root.nodeName] = nodeToObj(root);
    return result;
  } catch (e) {
    throw e;
  }
}

function indexToLineCol(text, idx) {
  const lines = text.slice(0, idx).split("\n");
  const line = lines.length;
  const col = lines[lines.length - 1].length + 1;
  return { line, col };
}

function diffJson(a, b, path = "") {
  const changes = {};
  if (a === b) return changes;
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  ) {
    if (a !== b) {
      changes[path || "/"] = { type: "changed", old: a, new: b };
    }
    return changes;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
      const p = `${path}/${i}`;
      Object.assign(changes, diffJson(a[i], b[i], p));
    }
    return changes;
  }
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const k of keys) {
    const p = path ? `${path}/${k}` : k;
    if (!(k in a)) changes[p] = { type: "added", old: undefined, new: b[k] };
    else if (!(k in b))
      changes[p] = { type: "removed", old: a[k], new: undefined };
    else Object.assign(changes, diffJson(a[k], b[k], p));
  }
  return changes;
}

function JsonTree({
  data,
  path = "",
  collapsedPaths = {},
  toggleCollapse,
  diffMap,
}) {
  if (typeof data !== "object" || data === null) {
    const key = path || "/";
    const diff = diffMap?.[key];
    const cls =
      diff?.type === "added"
        ? "text-green-300"
        : diff?.type === "removed"
        ? "text-red-400 line-through"
        : diff?.type === "changed"
        ? "text-amber-300"
        : "text-gray-300";
    return <div className={`text-sm font-mono ${cls}`}>{String(data)}</div>;
  }

  const isArray = Array.isArray(data);
  const entries = isArray ? data.map((v, i) => [i, v]) : Object.entries(data);

  return (
    <div className="text-sm">
      {entries.map(([k, v]) => {
        const itemPath = path ? `${path}/${k}` : `${k}`;
        const isCollapsed = !!collapsedPaths[itemPath];
        const isLeaf =
          typeof v !== "object" ||
          v === null ||
          (Array.isArray(v) && v.length === 0) ||
          Object.keys(v).length === 0;
        const diff = diffMap?.[itemPath];
        const keyCls =
          diff?.type === "added"
            ? "text-green-300"
            : diff?.type === "removed"
            ? "text-red-400 line-through"
            : diff?.type === "changed"
            ? "text-amber-300"
            : "text-gray-200";

        return (
          <div key={itemPath} className="ml-2 my-1">
            <div className="flex items-center gap-2">
              {!isLeaf ? (
                <button
                  onClick={() => toggleCollapse(itemPath)}
                  className="text-xs w-5 h-5 rounded-md grid place-items-center bg-white/5 hover:bg-white/8 transition-colors cursor-pointer"
                >
                  {isCollapsed ? "▶" : "▼"}
                </button>
              ) : (
                <div className="w-5" />
              )}
              <div className={`font-mono text-xs ${keyCls}`}>{String(k)}:</div>
              <div className="flex-1">
                {isLeaf ? (
                  <span className="font-mono text-sm text-gray-300">
                    {String(v)}
                  </span>
                ) : null}
              </div>
            </div>
            {!isLeaf && !isCollapsed && (
              <div className="pl-6 border-l border-white/5 mt-2">
                <JsonTree
                  data={v}
                  path={itemPath}
                  collapsedPaths={collapsedPaths}
                  toggleCollapse={toggleCollapse}
                  diffMap={diffMap}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function tryGetRootKeys(text) {
  try {
    const p = JSON.parse(text);
    if (p && typeof p === "object") return Object.keys(p).map((k) => k);
  } catch {}
  return [];
}

export default function JSONTool() {
  const [text, setText] = useState(() => {
    try {
      const hash = location?.hash?.slice(1);
      if (hash) {
        const dec = decodeFromHash(hash);
        if (dec) return dec;
      }
    } catch {}
    return localStorage.getItem("json-tool-last") || DEFAULT_SAMPLE;
  });
  const [textB, setTextB] = useState("");
  const [formatted, setFormatted] = useState("");
  const [mode, setMode] = useState("split");
  const [error, setError] = useState("");
  const [collapsedPaths, setCollapsedPaths] = useState({});
  const [autoFormat, setAutoFormat] = useState(true);
  const [xmlText, setXmlText] = useState("");
  const [diffMap, setDiffMap] = useState({});
  const [debounceTimer, setDebounceTimer] = useState(null);
  const fileInputRef = useRef(null);

  const [tooltip, setTooltip] = useState({
    visible: false,
    content: "",
    x: 0,
    y: 0,
  });

  const showTooltip = (content, event) => {
    setTooltip({
      visible: true,
      content,
      x: event.clientX,
      y: event.clientY - 40,
    });
  };

  const hideTooltip = () => {
    setTooltip({ visible: false, content: "", x: 0, y: 0 });
  };

  useEffect(() => {
    if (!autoFormat) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    const t = setTimeout(() => {
      runFormat();
    }, DEBOUNCE_MS);
    setDebounceTimer(t);
    return () => clearTimeout(t);
  }, [text, autoFormat]);

  useEffect(() => {
    try {
      localStorage.setItem("json-tool-last", text);
    } catch {}
  }, [text]);

  const runFormat = () => {
    setError("");
    if (!text.trim()) {
      setFormatted("");
      return;
    }
    try {
      const parsed = JSON.parse(text);
      const pretty = JSON.stringify(parsed, null, 2);
      setFormatted(pretty);
      setDiffMap({});
    } catch (e) {
      setError(e.message);
      setFormatted("");
    }
  };

  const beautifyJSON = () => {
    try {
      const parsed = JSON.parse(text);
      setText(JSON.stringify(parsed, null, 2));
      setFormatted(JSON.stringify(parsed, null, 2));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };

  const minifyJSON = () => {
    try {
      const parsed = JSON.parse(text);
      setText(JSON.stringify(parsed));
      setFormatted(JSON.stringify(parsed));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };

  const copyToClipboard = async (txt) => {
    try {
      await navigator.clipboard.writeText(txt);
    } catch (e) {
      console.warn("Copy failed", e);
    }
  };

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const createShareLink = () => {
    const enc = encodeForHash(formatted || text);
    const url = `${location.origin}${location.pathname}#${enc}`;
    copyToClipboard(url);
    return url;
  };

  const runJsonToXml = () => {
    try {
      const p = JSON.parse(text);
      const xmlBody = jsonToXml(p, "");
      setXmlText(
        `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${xmlBody}\n</root>`
      );
      setError("");
    } catch (e) {
      setError("Invalid JSON: " + (e.message || e));
    }
  };

  const runXmlToJson = () => {
    try {
      const obj = xmlToJson(xmlText);
      const pretty = JSON.stringify(obj, null, 2);
      setText(pretty);
      setError("");
    } catch (e) {
      setError("Invalid XML: " + (e.message || e));
    }
  };

  const runDiff = () => {
    setError("");
    try {
      const a = JSON.parse(text);
      const b = JSON.parse(textB);
      const map = diffJson(a, b, "");
      setDiffMap(map);
      setFormatted(JSON.stringify(a, null, 2));
    } catch (e) {
      setError("Both sides must be valid JSON for Diff: " + (e.message || e));
    }
  };

  const handleFileUpload = (file, setter = setText) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        setter(ev.target.result);
      } catch (e) {}
    };
    reader.readAsText(file);
  };

  const toggleCollapse = (p) => {
    setCollapsedPaths((prev) => {
      const copy = { ...prev };
      if (copy[p]) delete copy[p];
      else copy[p] = true;
      return copy;
    });
  };

  useEffect(() => {
    try {
      const hash = location.hash?.slice(1);
      if (hash) {
        const dec = decodeFromHash(hash);
        if (dec) setText(dec);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        runFormat();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [text]);

  const modes = [
    {
      key: "split",
      label: "Split",
      icon: "⛏️",
      description: "Edit and preview side by side",
    },
    {
      key: "text",
      label: "Text",
      icon: "📝",
      description: "Simple text editor with formatting",
    },
    {
      key: "tree",
      label: "Tree",
      icon: "🌳",
      description: "Visual tree explorer",
    },
    {
      key: "diff",
      label: "Diff",
      icon: "🔍",
      description: "Compare two JSON files",
    },
    {
      key: "convert",
      label: "Convert",
      icon: "🔄",
      description: "Convert between JSON and XML",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f0f10] to-black text-white ">
      {tooltip.visible && (
        <div
          className="fixed z-50 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 shadow-xl"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.content}
        </div>
      )}

      <div className=" mx-auto bg-gray-800/30 backdrop-blur-xl border border-white/10 h-screen  overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 bg-gray-900/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full animate-pulse"></div>
              <div>
                <h1 className="text-xl font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  JSON Toolbox
                </h1>
                <p className="text-sm text-gray-400">
                  Format, validate, and transform JSON data
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {modes.map((modeItem) => (
                <button
                  key={modeItem.key}
                  onClick={() => setMode(modeItem.key)}
                  onMouseEnter={(e) => showTooltip(modeItem.description, e)}
                  onMouseLeave={hideTooltip}
                  className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 cursor-pointer
                  ${
                    mode === modeItem.key
                      ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-emerald-500/30 shadow-lg"
                      : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20"
                  }
                `}
                >
                  <span className="text-sm">{modeItem.icon}</span>
                  <span className="text-sm font-medium">{modeItem.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-gray-900/30 border-b border-white/5 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoFormat}
                onChange={(e) => setAutoFormat(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
              Auto-format
            </label>

            {error && (
              <div className="flex items-center gap-2 text-amber-300 text-sm">
                <div className="w-2 h-2 bg-amber-300 rounded-full animate-pulse"></div>
                {error.length > 50 ? `${error.substring(0, 50)}...` : error}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={beautifyJSON}
              onMouseEnter={(e) =>
                showTooltip("Format JSON with proper indentation", e)
              }
              onMouseLeave={hideTooltip}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors cursor-pointer"
            >
              Beautify
            </button>
            <button
              onClick={minifyJSON}
              onMouseEnter={(e) =>
                showTooltip("Remove all whitespace from JSON", e)
              }
              onMouseLeave={hideTooltip}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors cursor-pointer"
            >
              Minify
            </button>
            <button
              onClick={() => setText("")}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors cursor-pointer"
            >
              Clear
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, setText);
                e.target.value = "";
              }}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={(e) =>
                showTooltip("Upload a JSON file from your computer", e)
              }
              onMouseLeave={hideTooltip}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors cursor-pointer"
            >
              Upload
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => copyToClipboard(formatted || text)}
              onMouseEnter={(e) =>
                showTooltip("Copy formatted JSON to clipboard", e)
              }
              onMouseLeave={hideTooltip}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors cursor-pointer"
            >
              Copy
            </button>
            <button
              onClick={() => downloadFile(formatted || text, "data.json")}
              onMouseEnter={(e) => showTooltip("Download JSON file", e)}
              onMouseLeave={hideTooltip}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors cursor-pointer"
            >
              Download
            </button>
            <button
              onClick={createShareLink}
              onMouseEnter={(e) => showTooltip("Generate shareable link", e)}
              onMouseLeave={hideTooltip}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors cursor-pointer"
            >
              Share
            </button>
          </div>
        </div>

        <div className="p-6">
          {mode === "split" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Edit JSON
                  </h3>
                  <div className="text-xs text-gray-500">
                    Live formatting {autoFormat ? "ON" : "OFF"}
                  </div>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-96 bg-gray-900/40 border border-gray-600 rounded-lg p-4 font-mono text-sm text-gray-200 placeholder-gray-500 resize-none focus:border-emerald-500/50 transition-colors cursor-text"
                  placeholder="Paste your JSON here or start typing..."
                  spellCheck="false"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Tree View
                  </h3>
                  <button
                    onClick={() => setCollapsedPaths({})}
                    className="px-2 py-1 text-xs rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Expand All
                  </button>
                </div>
                <div className="h-96 bg-gray-900/40 border border-gray-600 rounded-lg p-4 overflow-auto">
                  {formatted ? (
                    <JsonTree
                      data={JSON.parse(text)}
                      collapsedPaths={collapsedPaths}
                      toggleCollapse={toggleCollapse}
                    />
                  ) : (
                    <div className="text-gray-500 text-center py-16">
                      <div className="text-4xl mb-2">🌳</div>
                      <div>Enter valid JSON to see the tree view</div>
                      <div className="text-sm text-gray-600 mt-2">
                        Try pasting some JSON on the left
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {mode === "text" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  JSON Editor
                </h3>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-96 bg-gray-900/40 border border-gray-600 rounded-lg p-4 font-mono text-sm text-gray-200 placeholder-gray-500 resize-none focus:border-emerald-500/50 transition-colors cursor-text"
                  placeholder="Start typing your JSON here..."
                  spellCheck="false"
                />
              </div>

              {formatted && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Formatted Result
                  </h3>
                  <textarea
                    value={formatted}
                    readOnly
                    className="w-full h-64 bg-gray-900/30 border border-gray-600 rounded-lg p-4 font-mono text-sm text-gray-300 resize-none cursor-text"
                  />
                </div>
              )}
            </div>
          )}

          {mode === "tree" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    JSON Input
                  </h3>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full h-96 bg-gray-900/40 border border-gray-600 rounded-lg p-4 font-mono text-sm text-gray-200 resize-none focus:border-emerald-500/50 transition-colors cursor-text"
                    placeholder="Enter JSON to explore as a tree..."
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                      Visual Tree
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCollapsedPaths({})}
                        className="px-2 py-1 text-xs rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        Expand All
                      </button>
                    </div>
                  </div>
                  <div className="h-96 bg-gray-900/40 border border-gray-600 rounded-lg p-4 overflow-auto">
                    {formatted ? (
                      <JsonTree
                        data={JSON.parse(text)}
                        collapsedPaths={collapsedPaths}
                        toggleCollapse={toggleCollapse}
                      />
                    ) : (
                      <div className="text-gray-500 text-center py-16">
                        <div className="text-4xl mb-2">📊</div>
                        <div>Valid JSON required for tree view</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === "diff" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Original JSON
                  </h3>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full h-64 bg-gray-900/40 border border-gray-600 rounded-lg p-4 font-mono text-sm text-gray-200 resize-none focus:border-emerald-500/50 transition-colors cursor-text"
                    placeholder="First JSON to compare..."
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Modified JSON
                  </h3>
                  <textarea
                    value={textB}
                    onChange={(e) => setTextB(e.target.value)}
                    className="w-full h-64 bg-gray-900/40 border border-gray-600 rounded-lg p-4 font-mono text-sm text-gray-200 resize-none focus:border-emerald-500/50 transition-colors cursor-text"
                    placeholder="Second JSON to compare..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={runDiff}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  Compare JSON
                </button>
                <button
                  onClick={() => setTextB(text)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Copy Left to Right
                </button>
              </div>

              {Object.keys(diffMap).length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Differences
                  </h3>
                  <div className="bg-gray-900/40 border border-gray-600 rounded-lg p-4 max-h-64 overflow-auto">
                    {Object.entries(diffMap).map(([path, change]) => (
                      <div
                        key={path}
                        className="flex items-center gap-3 py-2 border-b border-white/5 last:border-b-0"
                      >
                        <div
                          className={`
                          px-2 py-1 rounded text-xs font-medium
                          ${
                            change.type === "added"
                              ? "bg-green-500/20 text-green-300"
                              : ""
                          }
                          ${
                            change.type === "removed"
                              ? "bg-red-500/20 text-red-300"
                              : ""
                          }
                          ${
                            change.type === "changed"
                              ? "bg-amber-500/20 text-amber-300"
                              : ""
                          }
                        `}
                        >
                          {change.type.toUpperCase()}
                        </div>
                        <div className="font-mono text-sm text-gray-300 flex-1">
                          {path}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === "convert" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    JSON Input
                  </h3>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full h-64 bg-gray-900/40 border border-gray-600 rounded-lg p-4 font-mono text-sm text-gray-200 resize-none focus:border-emerald-500/50 transition-colors cursor-text"
                    placeholder="JSON to convert to XML..."
                  />
                  <button
                    onClick={runJsonToXml}
                    className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  >
                    Convert to XML
                  </button>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    XML Output
                  </h3>
                  <textarea
                    value={xmlText}
                    onChange={(e) => setXmlText(e.target.value)}
                    className="w-full h-64 bg-gray-900/40 border border-gray-600 rounded-lg p-4 font-mono text-sm text-gray-200 resize-none focus:border-emerald-500/50 transition-colors cursor-text"
                    placeholder="XML will appear here..."
                  />
                  <button
                    onClick={runXmlToJson}
                    className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  >
                    Convert to JSON
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/10 bg-gray-900/60">
          <div className="text-center text-sm text-gray-400">
            <div className="flex items-center justify-center gap-6">
              <span>Format</span>
              <span>•</span>
              <span>Validate</span>
              <span>•</span>
              <span>Convert</span>
              <span>•</span>
              <span>Compare</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
