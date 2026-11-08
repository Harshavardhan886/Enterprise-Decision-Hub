import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  X,
  Trash2,
  Copy,
  Check,
  TrendingUp,
  ShieldAlert,
  FileCode,
  DollarSign,
  Maximize2,
  Minimize2,
  Sparkles,
} from "lucide-react";
import api from "../../services/api";
import cn from "../../lib/cn";

const QUICK_PROMPTS = [
  {
    icon: DollarSign,
    label: "Profit & Loss Analysis",
    prompt: "What is our profit and loss across departments? Give me the net fiscal health.",
  },
  {
    icon: TrendingUp,
    label: "Department Budgets",
    prompt: "Which departments are overspending and what is our remaining budget headroom?",
  },
  {
    icon: FileCode,
    label: "YAML Policies",
    prompt: "Explain the active YAML governance policies and their SpEL conditions.",
  },
  {
    icon: ShieldAlert,
    label: "Flagged Invoices & Risks",
    prompt: "Are there any high-risk flagged invoices or duplicate fraud attempts?",
  },
];

export default function CopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const [messages, setMessages] = useState([
    {
      id: "welcome-1",
      sender: "bot",
      text: `### 🤖 Welcome to the Enterprise Decision Hub Assistant!

I am your real-time **Financial & Governance Decision Assistant**. I have direct visibility into our live audited enterprise data:

* **Department Budgets & Spend:** Finance, Operations, Engineering, HR, Marketing
* **Profit, Loss & Net Savings:** Real-time variance tracking against allocated fiscal caps
* **YAML Decision Policies:** Dynamic SpEL rules (duplicate fraud, budget overspend, vendor governance)
* **Multi-Model Sentry Scores:** Random Forest, XGBoost, and Isolation Forest anomalies

Ask me any question below or click a quick prompt to begin!`,
      provider: "gemini-1.5-flash",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-edh-copilot", handleOpen);
    return () => window.removeEventListener("open-edh-copilot", handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  const handleClearHistory = () => {
    setMessages([
      {
        id: "welcome-reset",
        sender: "bot",
        text: "Chat history cleared. How can I assist you with enterprise fiscal telemetry or policies?",
        provider: "gemini-1.5-flash",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleSend = async (messageText) => {
    const textToSend = typeof messageText === "string" ? messageText : inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const res = await api.post("/chat", {
        message: textToSend.trim(),
      });

      const botReply = res.data?.reply || "Unable to retrieve response from advisory service.";
      const provider = res.data?.provider || "gemini-1.5-flash";

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: botReply,
          provider: provider,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text: "⚠️ System error connecting to the Assistant service. Please ensure the backend is running.",
          provider: "offline",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (id, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split("\n");

    return lines.map((line, idx) => {
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-bold text-ink text-sm mt-2 mb-1">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={idx} className="font-bold text-ink text-base mt-2.5 mb-1.5">
            {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        const content = line.substring(2);
        return (
          <div key={idx} className="flex items-start gap-2 my-0.5 text-xs text-ink/90">
            <span className="text-accent mt-1 leading-none">•</span>
            <span>{formatInline(content)}</span>
          </div>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={idx} className="my-0.5 text-xs text-ink/90 pl-1">
            {formatInline(line)}
          </div>
        );
      }
      if (line.trim() === "") {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-xs leading-relaxed text-ink/90 my-1">
          {formatInline(line)}
        </p>
      );
    });
  };

  const formatInline = (str) => {
    const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-ink">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[11px] text-accent font-medium"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Trigger Pill / Button */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "group relative flex items-center gap-2.5 rounded-full px-4 py-3 font-semibold text-white shadow-xl transition-all duration-300",
            "bg-gradient-to-r from-accent via-indigo-500 to-sky-500 hover:shadow-accent/25 hover:scale-105 active:scale-95",
            isOpen && "ring-2 ring-white/40 ring-offset-2 ring-offset-canvas"
          )}
          aria-label="Open Enterprise Decision Hub Assistant"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </span>
          <Bot size={18} className="transition-transform group-hover:scale-110" />
          <span className="text-xs tracking-wide">Enterprise Decision Hub Assistant</span>
        </button>
      </div>

      {/* Slide-out / Floating Chat Modal */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 flex flex-col rounded-2xl border border-line bg-surface/95 backdrop-blur-2xl shadow-pop transition-all duration-300",
            isExpanded
              ? "bottom-4 right-4 top-4 w-[calc(100vw-2rem)] max-w-4xl"
              : "bottom-20 right-6 h-[620px] w-[410px] max-w-[calc(100vw-2rem)]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-4 py-3.5 bg-surface-2/60 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-accent via-indigo-600 to-sky-500 text-white shadow-md ring-1 ring-white/20">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-ink">Enterprise Decision Hub Assistant</span>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                </div>
                <p className="text-[10px] text-ink-subtle flex items-center gap-1">
                  <Sparkles size={10} className="text-accent" />
                  Gemini AI Powered • Enterprise Grounded
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-ink-muted">
              <button
                type="button"
                onClick={handleClearHistory}
                title="Clear Chat History"
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-2 hover:text-danger transition-colors"
              >
                <Trash2 size={15} />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                title={isExpanded ? "Collapse View" : "Expand View"}
                className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-2 hover:text-ink transition-colors"
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-2 hover:text-ink transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col max-w-[88%] text-xs",
                  m.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                {/* Bubble */}
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2.5 shadow-sm relative group",
                    m.sender === "user"
                      ? "bg-accent text-white rounded-br-none"
                      : "bg-surface-2 text-ink border border-line/60 rounded-bl-none"
                  )}
                >
                  {m.sender === "bot" ? (
                    <div>{renderFormattedText(m.text)}</div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  )}

                  {m.sender === "bot" && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(m.id, m.text)}
                      title="Copy Answer"
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-surface text-ink-subtle hover:text-ink"
                    >
                      {copiedId === m.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  )}
                </div>

                {/* Subtitle / Timestamp / Provider */}
                <div className="flex items-center gap-1.5 px-1 mt-1 text-[10px] text-ink-subtle">
                  <span>{m.timestamp}</span>
                  {m.provider && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-accent">
                        {m.provider}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 rounded-2xl bg-surface-2 border border-line px-3.5 py-2.5 mr-auto max-w-[70%]">
                <span className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-accent animate-bounce" />
                  <span
                    className="h-2 w-2 rounded-full bg-accent animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-2 w-2 rounded-full bg-accent animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </span>
                <span className="text-[11px] text-ink-subtle font-medium">
                  Auditing enterprise decision telemetry...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div className="border-t border-line/50 px-3 py-2 bg-surface/50 overflow-x-auto scrollbar-none flex items-center gap-1.5">
            {QUICK_PROMPTS.map((qp, idx) => {
              const Icon = qp.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(qp.prompt)}
                  disabled={isLoading}
                  className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-ink-muted hover:border-accent hover:text-accent hover:bg-accent/5 transition-all"
                >
                  <Icon size={12} className="text-accent" />
                  <span>{qp.label}</span>
                </button>
              );
            })}
          </div>

          {/* Input Bar */}
          <div className="border-t border-line p-3 bg-surface-2/40 rounded-b-2xl">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-1.5 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about budgets, profit/loss, invoices, policies..."
                className="flex-1 bg-transparent text-xs text-ink placeholder:text-ink-subtle focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputMessage.trim() || isLoading}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg transition-all",
                  inputMessage.trim() && !isLoading
                    ? "bg-accent text-white hover:bg-accent-hover shadow-sm"
                    : "text-ink-subtle opacity-40 cursor-not-allowed"
                )}
                aria-label="Send Message"
              >
                <Send size={13} />
              </button>
            </div>
            <div className="flex items-center justify-between px-1 mt-1.5 text-[9px] text-ink-subtle">
              <span>Enterprise Grounded • SOC 2 & SpEL Governance</span>
              <span>Press Enter to send</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
