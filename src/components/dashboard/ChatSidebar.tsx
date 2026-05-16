"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserConversations, createOrGetDirectConversation, ConversationData } from "@/lib/services/messageService";
import { getAllUsers, UserProfile } from "@/lib/services/userService";
import { formatDistanceToNow } from "date-fns";

interface ChatSidebarProps {
  uid: string;
  userName: string;
  userPhoto?: string;
  selectedId: string | null;
  onSelect: (id: string, name: string) => void;
}

export function ChatSidebar({ uid, userName, userPhoto, selectedId, onSelect }: ChatSidebarProps) {
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    const unsub = getUserConversations(uid, data => {
      setConversations(data);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  async function openNewMessage() {
    setShowNewMsg(true);
    if (allUsers.length === 0) {
      const users = await getAllUsers();
      setAllUsers(users.filter(u => u.uid !== uid));
    }
  }

  async function startConversation(otherUser: UserProfile) {
    setStarting(otherUser.uid);
    const names: Record<string, string> = {
      [uid]: userName || "Me",
      [otherUser.uid]: otherUser.displayName || otherUser.email || "Unknown User",
    };
    const photos: Record<string, string> = {};
    if (userPhoto) photos[uid] = userPhoto;
    if (otherUser.photoURL) photos[otherUser.uid] = otherUser.photoURL;
    const convId = await createOrGetDirectConversation(uid, otherUser.uid, names, photos);
    const convName = otherUser.displayName || otherUser.email || "Unknown User";
    setStarting(null);
    setShowNewMsg(false);
    onSelect(convId, convName);
  }

  function getDisplayName(conv: ConversationData): string {
    if (conv.type === "group") return conv.groupName || "Group";
    const otherId = conv.participants.find(p => p !== uid);
    return otherId ? (conv.participantNames[otherId] || "User") : "Unknown";
  }

  function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  }

  const filtered = conversations.filter(c =>
    getDisplayName(c).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full max-w-sm border-r border-border/40 bg-background/40 backdrop-blur-md">
      <div className="p-4 border-b border-border/40">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-tight">Messages</h2>
          <Button size="icon" variant="ghost" onClick={openNewMessage} title="New message">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 border-b border-border/20">
              <Skeleton className="w-12 h-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            {conversations.length === 0 ? "No conversations yet. Start one!" : "No matches."}
          </div>
        ) : (
          filtered.map(conv => {
            const name = getDisplayName(conv);
            const unread = conv.unreadCount?.[uid] || 0;
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id, name)}
                className={cn(
                  "w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-secondary/50 border-b border-border/20",
                  selectedId === conv.id
                    ? "bg-secondary/50 border-l-4 border-l-primary"
                    : "border-l-4 border-l-transparent"
                )}
              >
                <Avatar className="w-12 h-12 border border-border/50 shrink-0">
                  <AvatarFallback className={conv.type === "group" ? "bg-indigo-500/20 text-indigo-500" : "bg-primary/20 text-primary"}>
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold text-sm truncate pr-2">{name}</h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {conv.updatedAt ? formatDistanceToNow(conv.updatedAt.toDate(), { addSuffix: false }) : ""}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground truncate pr-2">{conv.lastMessage || "No messages yet"}</p>
                    {unread > 0 && (
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* New Message Dialog */}
      <Dialog open={showNewMsg} onOpenChange={setShowNewMsg}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {allUsers
                .filter(u => (u.displayName || u.email || "").toLowerCase().includes(userSearch.toLowerCase()))
                .map(u => (
                  <button
                    key={u.uid}
                    onClick={() => startConversation(u)}
                    disabled={starting === u.uid}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                  >
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {(u.displayName || u.email || "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{u.displayName || u.email}</p>
                      <p className="text-xs text-muted-foreground">{u.role}</p>
                    </div>
                    {starting === u.uid && <span className="ml-auto text-xs text-muted-foreground">Starting...</span>}
                  </button>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
