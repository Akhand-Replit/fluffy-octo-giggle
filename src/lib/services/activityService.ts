import { collection, addDoc, getDocs, query, orderBy, limit, where, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export type ActivityType =
  | "application_submitted"
  | "application_approved"
  | "application_rejected"
  | "position_paper_submitted"
  | "event_published"
  | "marking_submitted";

export interface ActivityData {
  id: string;
  userId: string;
  actorName: string;
  actorRole: string;
  actorPhotoURL?: string;
  type: ActivityType;
  action: string;
  targetId: string;
  targetTitle: string;
  createdAt?: Timestamp;
  isPublic: boolean;
}

export async function logActivity(data: Omit<ActivityData, "id" | "createdAt">): Promise<void> {
  try {
    await addDoc(collection(db, "activities"), { ...data, createdAt: serverTimestamp() });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}

export async function getRecentActivities(limitCount = 20): Promise<ActivityData[]> {
  try {
    const q = query(collection(db, "activities"), orderBy("createdAt", "desc"), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityData));
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
}

export async function getUserActivities(userId: string, limitCount = 20): Promise<ActivityData[]> {
  try {
    const q = query(
      collection(db, "activities"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityData));
  } catch (error) {
    console.error("Error fetching user activities:", error);
    return [];
  }
}
