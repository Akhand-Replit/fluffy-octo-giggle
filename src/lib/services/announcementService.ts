import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface AudienceFilter {
  roles: string[];
  committees: string[];
  paymentStatus: "paid" | "unpaid" | "all";
}

export interface Announcement {
  id?: string;
  subject: string;
  body: string;
  audience: AudienceFilter;
  status: "draft" | "queued" | "sent" | "failed";
  sentBy: string;
  recipientCount: number;
  createdAt?: any;
  sentAt?: any;
}

export async function getAnnouncements(eventId: string): Promise<Announcement[]> {
  try {
    const snap = await getDocs(
      query(collection(db, "events", eventId, "announcements"), orderBy("createdAt", "desc"))
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return [];
  }
}

export async function saveAnnouncement(
  eventId: string,
  data: Omit<Announcement, "id" | "createdAt">
): Promise<{ success: boolean; id?: string; error?: any }> {
  try {
    const ref = await addDoc(collection(db, "events", eventId, "announcements"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: ref.id };
  } catch (error) {
    console.error("Error saving announcement:", error);
    return { success: false, error };
  }
}

export async function updateAnnouncement(
  eventId: string,
  announcementId: string,
  data: Partial<Announcement>
): Promise<{ success: boolean; error?: any }> {
  try {
    await updateDoc(doc(db, "events", eventId, "announcements", announcementId), data as any);
    return { success: true };
  } catch (error) {
    console.error("Error updating announcement:", error);
    return { success: false, error };
  }
}

export async function deleteAnnouncement(
  eventId: string,
  announcementId: string
): Promise<{ success: boolean; error?: any }> {
  try {
    await deleteDoc(doc(db, "events", eventId, "announcements", announcementId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return { success: false, error };
  }
}
