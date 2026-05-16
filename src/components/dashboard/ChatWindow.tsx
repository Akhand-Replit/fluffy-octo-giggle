"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreVertical, Send } from "lucide-react";
import { motion } from "framer-motion";
import { getConversationMessages, sendMessage, markConversationRead, MessageData } from "@/lib/services/messageService";
import { format } from "date-fns";

interface ChatWindowProps {
  conversationId: string | null;
  conversationName: string;
  uid: string;
  userName: string;
}

export function ChatWindow({ conversationId, conversationName, uid, userName }: ChatWindowProps) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    markConversationRead(conversationId, uid).catch(() => {});
    const unsub = getConversationMessages(conversationId, msgs => {
      setMessages(msgs);
    });
    return unsub;
  }, [conversationId, uid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!conversationId || !inputText.trim() || sending) return;
    setSending(true);
    const text = inputText.trim();
    setInputText("");
    await sendMessage(conversationId, uid, userName, text);
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function getInitials(name: string) {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  }

  function formatTime(msg: MessageData): string {
    if (!msg.timestamp) return "";
    try {
      return format(msg.timestamp.toDate(), "h:mm a");
    } catch {
      return "";
    }
  }

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background/20 backdrop-blur-sm">
        <div className="text-center text-muted-foreground">
          <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-medium">Select a conversation</p>
          <p className="text-sm">Choose a chat from the sidebar or start a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-background/20 backdrop-blur-sm relative">
      {/* Header */}
      <div className="h-16 border-b border-border/40 px-6 flex items-center justify-between bg-background/40 backdrop-blur-xl shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border border-border/50">
            <AvatarFallback className="bg-primary/20 text-primary">
              {getInitials(conversationName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-foreground">{conversationName}</h2>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === uid;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex max-w-[75%] ${isMe ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
                  {!isMe && (
                    <Avatar className="w-8 h-8 shrink-0 mb-1 border border-border/50">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {getInitials(msg.senderName || "?")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    {!isMe && (
                      <span className="text-xs text-muted-foreground mb-1 mx-1">{msg.senderName}</span>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-sm shadow-md shadow-primary/20"
                        : "bg-secondary text-secondary-foreground rounded-bl-sm border border-border/50"
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 mx-1">{formatTime(msg)}</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/40 bg-background/40 backdrop-blur-xl shrink-0">
        <div className="flex items-end gap-2 bg-secondary/30 border border-border/50 rounded-2xl p-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
          <Input
            placeholder="Type your message..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 shadow-none"
          />
          <Button
            size="icon"
            className="shrink-0 rounded-xl shadow-lg shadow-primary/20"
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
          >
            <Send className="w-4 h-4 ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
