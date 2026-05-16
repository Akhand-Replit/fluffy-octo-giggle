import {
  collection, doc, getDocs, addDoc, updateDoc, serverTimestamp, query, where, orderBy, writeBatch
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface WaitlistEntry {
  id?: string;
  applicantUid: string;
  applicantName: string;
  applicantEmail: string;
  committeeId: string;
  position: number;
  status: "waiting" | "offered" | "accepted" | "expired";
  notifiedAt: any | null;
  createdAt?: any;
}

export async function getWaitlistByCommittee(
  eventId: string,
  committeeId: string
): Promise<WaitlistEntry[]> {
  try {
    const snap = await getDocs(
      query(
        collection(db, "events", eventId, "waitlist"),
        where("committeeId", "==", committeeId),
        orderBy("position", "asc")
      )
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as WaitlistEntry));
  } catch (error) {
    console.error("Error fetching waitlist:", error);
    return [];
  }
}

export async function getFullWaitlist(eventId: string): Promise<WaitlistEntry[]> {
  try {
    const snap = await getDocs(
      query(collection(db, "events", eventId, "waitlist"), orderBy("position", "asc"))
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as WaitlistEntry));
  } catch (error) {
    console.error("Error fetching waitlist:", error);
    return [];
  }
}

export async function addToWaitlist(
  eventId: string,
  entry: Omit<WaitlistEntry, "id" | "createdAt">
): Promise<{ success: boolean; id?: string; error?: any }> {
  try {
    const ref = await addDoc(collection(db, "events", eventId, "waitlist"), {
      ...entry,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: ref.id };
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    return { success: false, error };
  }
}

export async function offerSeat(
  eventId: string,
  entryId: string
): Promise<{ success: boolean; error?: any }> {
  try {
    await updateDoc(doc(db, "events", eventId, "waitlist", entryId), {
      status: "offered",
      notifiedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error offering seat:", error);
    return { success: false, error };
  }
}

export async function updateWaitlistEntry(
  eventId: string,
  entryId: string,
  data: Partial<WaitlistEntry>
): Promise<{ success: boolean; error?: any }> {
  try {
    await updateDoc(doc(db, "events", eventId, "waitlist", entryId), data as any);
    return { success: true };
  } catch (error) {
    console.error("Error updating waitlist entry:", error);
    return { success: false, error };
  }
}
