"use client";

import { useState } from "react";
import { ChatSidebar } from "@/components/dashboard/ChatSidebar";
import { ChatWindow } from "@/components/dashboard/ChatWindow";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

export default function MessagesPage() {
  const { user, profile } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedChatName, setSelectedChatName] = useState<string>("");

  if (!user) return null;

  const userName = profile?.displayName || user.displayName || user.email || "Me";
  const userPhoto = user.photoURL || undefined;

  function handleSelect(id: string, name: string) {
    setSelectedChatId(id);
    setSelectedChatName(name);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-[calc(100vh-10rem)] w-full max-w-6xl mx-auto glass-card rounded-3xl overflow-hidden flex border border-border/50 shadow-2xl"
    >
      <div className="hidden md:block h-full shrink-0">
        <ChatSidebar
          uid={user.uid}
          userName={userName}
          userPhoto={userPhoto}
          selectedId={selectedChatId}
          onSelect={handleSelect}
        />
      </div>

      <div className="flex-1 h-full min-w-0">
        <ChatWindow
          conversationId={selectedChatId}
          conversationName={selectedChatName}
          uid={user.uid}
          userName={userName}
        />
      </div>
    </motion.div>
  );
}
