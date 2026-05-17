import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface Marking {
  id?: string;
  eventId: string;
  committeeId: string;
  delegateId: string; // The userId of the delegate
  applicationId: string;
  dateStr?: string; // YYYY-MM-DD for daily marking
  scores: Record<string, number>; // templateId -> score
  feedback: string;
  gradedBy: string; // The userId of the chair
  createdAt?: any;
  updatedAt?: any;
}

export async function submitMarking(marking: Omit<Marking, "id">): Promise<{ success: boolean; id?: string; error?: any }> {
  try {
    const markingsRef = collection(db, "markings");
    const docRef = await addDoc(markingsRef, {
      ...marking,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error submitting marking:", error);
    return { success: false, error };
  }
}

export async function getMarkingsByCommittee(eventId: string, committeeId: string): Promise<Marking[]> {
  try {
    const markingsRef = collection(db, "markings");
    const q = query(
      markingsRef,
      where("eventId", "==", eventId),
      where("committeeId", "==", committeeId),
      orderBy("updatedAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Marking));
  } catch (error) {
    console.error("Error fetching markings:", error);
    return [];
  }
}

export async function getDelegateMarking(applicationId: string, delegateId?: string): Promise<Marking | null> {
  try {
    const markingsRef = collection(db, "markings");
    const constraints: any[] = [where("applicationId", "==", applicationId)];
    if (delegateId) {
      constraints.push(where("delegateId", "==", delegateId));
    }
    const q = query(markingsRef, ...constraints);
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Marking;
  } catch (error) {
    console.error("Error fetching delegate marking:", error);
    return null;
  }
}

export async function getDailyMarkings(eventId: string, committeeId: string, dateStr: string): Promise<Marking[]> {
  try {
    const markingsRef = collection(db, "markings");
    const q = query(
      markingsRef,
      where("eventId", "==", eventId),
      where("committeeId", "==", committeeId),
      where("dateStr", "==", dateStr)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Marking));
  } catch (error) {
    console.error("Error fetching daily markings:", error);
    return [];
  }
}

import { setDoc } from "firebase/firestore";

export async function saveDailyMarking(marking: Omit<Marking, "id">): Promise<{ success: boolean; id?: string; error?: any }> {
  try {
    // Generate deterministic ID based on committee, delegate, and date
    const markingId = `${marking.committeeId}_${marking.delegateId}_${marking.dateStr}`;
    const docRef = doc(db, "markings", markingId);
    
    await setDoc(docRef, {
      ...marking,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return { success: true, id: markingId };
  } catch (error) {
    console.error("Error saving daily marking:", error);
    return { success: false, error };
  }
}
