import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

// ─── Knowledge Base ───────────────────────────────────────────────────────────

interface KBEntry {
  keywords: string[];
  answer: string;
}

const KNOWLEDGE_BASE: KBEntry[] = [
  {
    keywords: ["annotate", "annotation", "draw", "pen", "highlight"],
    answer:
      "To annotate a PDF, open it from your dashboard by clicking 'Teach'. You'll see annotation tools at the top: Pen (freehand draw), Shapes (rectangle, circle, arrow), Text, Highlighter, and Eraser. Select a tool, choose a color, and draw directly on the PDF.",
  },
  {
    keywords: ["save", "auto-save", "autosave"],
    answer:
      "All your annotations are saved automatically as you draw. You don't need to click any save button. Your work is preserved even if you close the PDF and reopen it later.",
  },
  {
    keywords: [
      "mark taught",
      "taught status",
      "completed",
      "teaching session",
      "mark as taught",
    ],
    answer:
      "After finishing a teaching session, click the 'Mark as Taught' button at the top of the teaching view. This updates the status so the admin can see which PDFs have been covered.",
  },
  {
    keywords: [
      "pdf not loading",
      "pdf not showing",
      "blank pdf",
      "can't view",
      "cannot view",
      "not loading",
      "not showing",
    ],
    answer:
      "If a PDF isn't loading, try: 1) Refresh the page. 2) Check your internet connection. 3) Log out and log back in. 4) If the issue persists, contact your admin — the PDF may need to be re-uploaded.",
  },
  {
    keywords: [
      "assign",
      "not assigned",
      "no pdf",
      "missing pdf",
      "not visible",
      "where is my pdf",
    ],
    answer:
      "If you can't see a PDF that should be assigned to you, contact your admin. Admins can assign PDFs to you from the Admin Panel. Once assigned, it will appear in your dashboard.",
  },
  {
    keywords: [
      "login",
      "password",
      "username",
      "sign in",
      "credentials",
      "forgot password",
    ],
    answer:
      "Your login credentials (username and password) are created by your admin. Contact your admin if you forgot your credentials or need them reset. They can update your details from the Faculty Management section.",
  },
  {
    keywords: ["logout", "sign out", "exit", "lock", "log out"],
    answer:
      "To log out, click the 'Logout' button in the top-right corner of your dashboard. Your session will be cleared securely.",
  },
  {
    keywords: ["color", "pen color", "change color", "brush", "colour"],
    answer:
      "To change annotation color, look for the color picker in the annotation toolbar. You can choose from preset colors or enter a custom color. Select your desired color before drawing.",
  },
  {
    keywords: ["arrow", "shape", "rectangle", "circle", "line"],
    answer:
      "Use the Shapes tool in the annotation toolbar to draw rectangles, circles, lines, and arrows. Select the shape type from the dropdown, then click and drag on the PDF to draw.",
  },
  {
    keywords: [
      "erase",
      "delete annotation",
      "undo",
      "remove annotation",
      "eraser",
    ],
    answer:
      "Use the Eraser tool to remove annotations. Click the Eraser in the toolbar, then click or drag over annotations to erase them. You can also use the Undo button to revert your last action.",
  },
  {
    keywords: [
      "zoom",
      "fullscreen",
      "fit page",
      "page size",
      "zoom in",
      "zoom out",
    ],
    answer:
      "Use the zoom controls at the top of the teaching view to zoom in (+) or zoom out (-). You can also fit the page to the screen by clicking the 'Fit Page' button.",
  },
  {
    keywords: [
      "navigate",
      "next page",
      "previous page",
      "go to page",
      "page number",
      "navigation",
    ],
    answer:
      "Use the arrow buttons (< >) at the bottom of the PDF viewer to navigate between pages. You can also type a page number directly in the page input field.",
  },
  {
    keywords: [
      "department",
      "subject",
      "profile",
      "my department",
      "my subject",
    ],
    answer:
      "Your department and subject are assigned by your admin. If you need to update your department or subject information, contact your admin.",
  },
  {
    keywords: ["subscription", "plan", "access", "expired", "restricted"],
    answer:
      "Your access to PDFs depends on your institution's subscription plan. If you're seeing access restrictions, contact your admin to check the subscription status.",
  },
  {
    keywords: [
      "contact admin",
      "help",
      "support",
      "issue",
      "problem",
      "not working",
    ],
    answer:
      "For any issues not resolved here, please contact your admin directly. Admins can be reached through your institution's communication channels.",
  },
];

const FALLBACK_ANSWER =
  "I'm not sure about that. Here are some things I can help with: PDF annotation, saving your work, navigating PDFs, login issues, or how to mark a session as taught. Try asking about one of these topics!";

function findAnswer(query: string): string {
  const lower = query.toLowerCase();
  for (const entry of KNOWLEDGE_BASE) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.answer;
    }
  }
  return FALLBACK_ANSWER;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ─── Quick Suggestion Chips ───────────────────────────────────────────────────

const SUGGESTIONS = [
  "How do I annotate a PDF?",
  "How to save my work?",
  "Mark a PDF as taught",
  "PDF not loading",
  "Contact my admin",
];

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-muted-foreground/60"
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 0.7,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`flex items-end gap-2 mb-4 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Bot className="h-3.5 w-3.5 text-primary" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
            : "bg-muted text-foreground rounded-2xl rounded-bl-sm"
        }`}
      >
        {message.content}
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FacultyAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll is triggered by message/typing changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Show welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome: Message = {
        id: "welcome",
        role: "assistant",
        content:
          "👋 Hi! I'm your AI Assistant. I can help you with PDF annotation, saving work, navigation, login issues, and more. What do you need help with?",
        timestamp: new Date(),
      };
      setMessages([welcome]);
    }
  }, [isOpen, messages.length]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Simulate thinking delay
    const delay = 800 + Math.random() * 400;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const answer = findAnswer(trimmed);
    const assistantMsg: Message = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: answer,
      timestamp: new Date(),
    };

    setIsTyping(false);
    setMessages((prev) => [...prev, assistantMsg]);

    if (!isOpen) {
      setHasUnread(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const showSuggestions = messages.length <= 1 && !isTyping;

  return (
    <>
      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            data-ocid="faculty.ai_assistant.panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-24 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-elevated flex flex-col overflow-hidden"
            style={{ maxHeight: "min(560px, calc(100vh - 8rem))" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm leading-tight">
                    AI Assistant
                  </p>
                  <p className="text-xs text-primary-foreground/70 leading-tight">
                    Ask me anything about the portal
                  </p>
                </div>
              </div>
              <Button
                data-ocid="faculty.ai_assistant.close_button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
                onClick={() => setIsOpen(false)}
                aria-label="Close AI Assistant"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages Area */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 pt-4 pb-2">
              <div>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {isTyping && <TypingIndicator />}

                {/* Quick suggestions */}
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="mt-2 mb-3"
                  >
                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                      Quick suggestions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSuggestionClick(s)}
                          className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors duration-150 font-medium"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="px-4 py-3 border-t border-border bg-background">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  data-ocid="faculty.ai_assistant.input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your question..."
                  disabled={isTyping}
                  className="flex-1 h-9 text-sm bg-muted/40 border-border focus-visible:ring-primary/50"
                  autoComplete="off"
                />
                <Button
                  data-ocid="faculty.ai_assistant.submit_button"
                  type="submit"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                  disabled={!inputValue.trim() || isTyping}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        data-ocid="faculty.ai_assistant.button"
        onClick={() => setIsOpen((v) => !v)}
        animate={{ y: [0, -4, 0] }}
        transition={{
          duration: 2.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          repeatDelay: 1,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Open AI Assistant"
        type="button"
      >
        <MessageCircle className="h-6 w-6" />
        {/* Unread indicator */}
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent border-2 border-card">
            <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-75" />
          </span>
        )}
      </motion.button>
    </>
  );
}
