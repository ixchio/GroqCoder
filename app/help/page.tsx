"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  ArrowLeft, 
  Send, 
  Sparkles, 
  Zap, 
  Heart,
  CheckCircle2,
  Loader2,
  HelpCircle,
  Mail,
  Bot,
  User
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  id: string;
  type: "user" | "system" | "sent";
  content: string;
  timestamp: Date;
}

const quickQuestions = [
  { emoji: "🚀", text: "How do I get started?" },
  { emoji: "🔑", text: "How do API keys work?" },
  { emoji: "🎨", text: "Can I customize the design?" },
  { emoji: "💾", text: "How do I save my projects?" },
];

const systemResponses: Record<string, string> = {
  "How do I get started?": "Welcome to Groq Coder! 🎉 Just head to 'New Project', describe what you want to build in the chat, and watch the AI create it for you. It's that simple!",
  "How do API keys work?": "You can add your own API keys in Settings → API Keys. We support OpenAI, DeepSeek, Mistral, and Google Gemini. Your keys are encrypted with AES-256-GCM! 🔐",
  "Can I customize the design?": "Absolutely! After the AI generates your code, you can iterate on it. Just tell the AI what changes you want - colors, layout, animations - anything! ✨",
  "How do I save my projects?": "Your projects are automatically saved to your account. You can find all your projects in the Projects page. You can also fork and share projects from the Gallery! 📁",
};

export default function HelpPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "system",
      content: "Hey there! 👋 I'm here to help you with Groq Coder. Ask me anything or send a message directly to the team!",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
    email: session?.user?.email || "",
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (type: Message["type"], content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleQuickQuestion = (question: string) => {
    addMessage("user", question);
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      const response = systemResponses[question] || "I'm not sure about that. You can send a message to our team for more help!";
      addMessage("system", response);
    }, 800 + Math.random() * 500);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    const userMessage = inputValue.trim();
    addMessage("user", userMessage);
    setInputValue("");
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      // Check for keywords
      const lowerMessage = userMessage.toLowerCase();
      
      if (lowerMessage.includes("contact") || lowerMessage.includes("email") || lowerMessage.includes("team") || lowerMessage.includes("human")) {
        addMessage("system", "Want to reach our team directly? Click the button below to send us a message! 💌");
        setShowContactForm(true);
      } else if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
        addMessage("system", "Hey! 👋 Great to meet you! How can I help you today?");
      } else if (lowerMessage.includes("thanks") || lowerMessage.includes("thank you")) {
        addMessage("system", "You're welcome! 💖 Is there anything else I can help with?");
      } else if (lowerMessage.includes("bug") || lowerMessage.includes("issue") || lowerMessage.includes("problem")) {
        addMessage("system", "Oh no! 😟 I'm sorry you're having trouble. Please send a detailed message to our team and we'll look into it right away!");
        setShowContactForm(true);
      } else {
        addMessage("system", "That's a great question! 🤔 For detailed help, feel free to send a message to our team. We usually respond within 24 hours!");
        setShowContactForm(true);
      }
    }, 800 + Math.random() * 500);
  };

  const handleSendToTeam = async () => {
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setSending(true);
    
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: contactForm.subject,
          message: contactForm.message,
          email: contactForm.email || session?.user?.email || "anonymous",
          name: session?.user?.name || "Anonymous User",
        }),
      });
      
      const data = await res.json();
      
      if (data.ok) {
        addMessage("sent", `📧 Message sent: "${contactForm.subject}"`);
        addMessage("system", "Got it! Your message has been sent to Aman. He'll get back to you soon! 🚀");
        setContactForm({ subject: "", message: "", email: session?.user?.email || "" });
        setShowContactForm(false);
        toast.success("Message sent successfully!");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "6s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "5s" }} />
      </div>

      <div className="relative z-10 flex flex-col h-screen max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 p-6 border-b border-white/5">
          <button
            onClick={() => router.back()}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-105 border border-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-pink-400" />
              Help Center
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            </h1>
            <p className="text-sm text-neutral-400">Chat with us or send a message</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Online</span>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 animate-fade-in ${
                message.type === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div className={`
                w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0
                ${message.type === "user" 
                  ? "bg-gradient-to-br from-pink-500 to-purple-500" 
                  : message.type === "sent"
                  ? "bg-gradient-to-br from-green-500 to-emerald-500"
                  : "bg-gradient-to-br from-cyan-500 to-blue-500"
                }
              `}>
                {message.type === "user" ? (
                  <User className="w-5 h-5 text-white" />
                ) : message.type === "sent" ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>
              
              {/* Message bubble */}
              <div className={`
                max-w-[80%] rounded-2xl px-4 py-3 
                ${message.type === "user" 
                  ? "bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/20" 
                  : message.type === "sent"
                  ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20"
                  : "bg-white/5 border border-white/10"
                }
              `}>
                <p className="text-sm leading-relaxed">{message.content}</p>
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length < 3 && (
          <div className="px-6 pb-4">
            <p className="text-xs text-neutral-500 mb-3">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q) => (
                <button
                  key={q.text}
                  onClick={() => handleQuickQuestion(q.text)}
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm hover:bg-white/10 hover:border-pink-500/30 transition-all duration-300 flex items-center gap-2"
                >
                  <span>{q.emoji}</span>
                  <span>{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Contact Form */}
        {showContactForm && (
          <div className="px-6 pb-4 animate-fade-in">
            <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-2xl p-4 border border-pink-500/20">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-pink-400" />
                <h3 className="font-semibold">Send Message to Team</h3>
              </div>
              <div className="space-y-3">
                <Input
                  placeholder="Subject..."
                  value={contactForm.subject}
                  onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="bg-black/50 border-white/10 focus:border-pink-500/50 rounded-xl"
                />
                <Textarea
                  placeholder="Your message..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  className="bg-black/50 border-white/10 focus:border-pink-500/50 rounded-xl min-h-[100px] resize-none"
                />
                {!session && (
                  <Input
                    placeholder="Your email (optional)"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-black/50 border-white/10 focus:border-pink-500/50 rounded-xl"
                  />
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSendToTeam}
                    disabled={sending}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-xl"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {sending ? "Sending..." : "Send Message"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowContactForm(false)}
                    className="rounded-xl border-white/10 hover:bg-white/5"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-6 border-t border-white/5">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder="Type your message..."
                className="w-full bg-white/5 border-white/10 focus:border-pink-500/50 rounded-xl h-12 pr-12"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-neutral-500 mt-2 text-center flex items-center justify-center gap-1">
            <Heart className="w-3 h-3 text-pink-500" />
            Made with love by Aman
            <Zap className="w-3 h-3 text-yellow-500" />
          </p>
        </div>
      </div>
    </div>
  );
}
