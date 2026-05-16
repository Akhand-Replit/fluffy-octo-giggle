import {
  collection, doc, addDoc, updateDoc, setDoc, query, where,
  orderBy, onSnapshot, serverTimestamp, Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface ConversationData {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantPhotos: Record<string, string>;
  type: "direct" | "group";
  groupName?: string;
  lastMessage: string;
  lastMessageSenderId: string;
  updatedAt?: Timestamp;
  unreadCount: Record<string, number>;
}

export interface MessageData {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp?: Timestamp;
  readBy: string[];
}

export function getUserConversations(
  uid: string,
  callback: (conversations: ConversationData[]) => void
): () => void {
  const ref = collection(db, "conversations");
  const q = query(ref, where("participants", "array-contains", uid), orderBy("updatedAt", "desc"));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as ConversationData)));
  });
}

export function getConversationMessages(
  conversationId: string,
  callback: (messages: MessageData[]) => void
): () => void {
  const ref = collection(db, "conversations", conversationId, "messages");
  const q = query(ref, orderBy("timestamp", "asc"));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as MessageData)));
  });
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<void> {
  const msgRef = collection(db, "conversations", conversationId, "messages");
  await addDoc(msgRef, { senderId, senderName, text, timestamp: serverTimestamp(), readBy: [senderId] });
  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessage: text,
    lastMessageSenderId: senderId,
    updatedAt: serverTimestamp(),
  });
}

export async function createOrGetDirectConversation(
  uid1: string,
  uid2: string,
  names: Record<string, string>,
  photos: Record<string, string> = {}
): Promise<string> {
  const convId = [uid1, uid2].sort().join("_");
  const convRef = doc(db, "conversations", convId);
  await setDoc(convRef, {
    participants: [uid1, uid2],
    participantNames: names,
    participantPhotos: photos,
    type: "direct",
    lastMessage: "",
    lastMessageSenderId: "",
    updatedAt: serverTimestamp(),
    unreadCount: { [uid1]: 0, [uid2]: 0 },
  }, { merge: true });
  return convId;
}

export async function markConversationRead(conversationId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, "conversations", conversationId), {
    [`unreadCount.${uid}`]: 0,
  });
}
