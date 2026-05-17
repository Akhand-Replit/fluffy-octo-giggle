import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  onSnapshot, query, where, serverTimestamp, arrayUnion, Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

// ── Food Coupons ──────────────────────────────────────────────────────────────

export interface FoodSlot {
  id?: string;
  mealName: string;
  timeWindow: string;
  venue: string;
  day: string;
}

export async function getFoodSlots(eventId: string): Promise<FoodSlot[]> {
  try {
    const snap = await getDocs(collection(db, "events", eventId, "foodSlots"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FoodSlot));
  } catch { return []; }
}

// ── Transport ─────────────────────────────────────────────────────────────────

export interface TransportRoute {
  id?: string;
  routeName: string;
  pickupPoint: string;
  dropoffPoint: string;
  departureTime: string;
  returnTime: string;
  capacity: number;
  registeredDelegates: string[];
}

export async function getTransportRoutes(eventId: string): Promise<TransportRoute[]> {
  try {
    const snap = await getDocs(collection(db, "events", eventId, "transportRoutes"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as TransportRoute));
  } catch { return []; }
}

export async function registerForTransport(
  eventId: string,
  routeId: string,
  applicationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const routeRef = doc(db, "events", eventId, "transportRoutes", routeId);
    const routeSnap = await getDoc(routeRef);
    if (!routeSnap.exists()) return { success: false, error: "Route not found" };
    const routeData = routeSnap.data() as TransportRoute;
    if ((routeData.registeredDelegates || []).length >= routeData.capacity)
      return { success: false, error: "Route is full" };
    if ((routeData.registeredDelegates || []).includes(applicationId))
      return { success: false, error: "Already registered" };
    await updateDoc(routeRef, { registeredDelegates: arrayUnion(applicationId) });
    return { success: true };
  } catch (error: any) { return { success: false, error: error.message }; }
}

// ── Accommodation ─────────────────────────────────────────────────────────────

export interface AccommodationBlock {
  id?: string;
  blockName: string;
  roomType: string;
  pricePerNight: number;
  availableRooms: number;
}

export interface AccommodationRequest {
  id?: string;
  delegateUid: string;
  blockId: string;
  blockName: string;
  status: "pending" | "confirmed" | "rejected";
  requestedAt?: any;
}

export async function getAccommodationBlocks(eventId: string): Promise<AccommodationBlock[]> {
  try {
    const snap = await getDocs(collection(db, "events", eventId, "accommodationBlocks"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AccommodationBlock));
  } catch { return []; }
}

export async function getAccommodationRequest(
  eventId: string,
  delegateUid: string
): Promise<AccommodationRequest | null> {
  try {
    const q = query(
      collection(db, "events", eventId, "accommodationRequests"),
      where("delegateUid", "==", delegateUid)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as AccommodationRequest;
  } catch { return null; }
}

export async function requestAccommodation(
  eventId: string,
  data: Omit<AccommodationRequest, "id" | "requestedAt">
): Promise<{ success: boolean; id?: string; error?: any }> {
  try {
    const ref = await addDoc(
      collection(db, "events", eventId, "accommodationRequests"),
      { ...data, requestedAt: serverTimestamp() }
    );
    return { success: true, id: ref.id };
  } catch (error) { return { success: false, error }; }
}

// ── Live MUN ──────────────────────────────────────────────────────────────────

export interface LiveSession {
  id?: string;
  title: string;
  committeeName: string;
  currentSpeaker: string;
  topic: string;
  status: "live" | "idle";
}

export function subscribeLiveSessions(
  eventId: string,
  callback: (sessions: LiveSession[]) => void
) {
  return onSnapshot(collection(db, "events", eventId, "liveSessions"), (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as LiveSession)));
  });
}

// ── Study Guide ───────────────────────────────────────────────────────────────

export interface StudyGuide {
  url: string;
  fileName: string;
  uploadedAt: any;
  uploadedBy: string;
}

export async function getStudyGuide(
  eventId: string,
  committeeName: string
): Promise<StudyGuide | null> {
  try {
    const snap = await getDoc(doc(db, "events", eventId, "studyGuides", committeeName));
    if (!snap.exists()) return null;
    return snap.data() as StudyGuide;
  } catch { return null; }
}

export async function saveStudyGuide(
  eventId: string,
  committeeName: string,
  data: StudyGuide
): Promise<{ success: boolean; error?: any }> {
  try {
    await updateDoc(doc(db, "events", eventId, "studyGuides", committeeName), data as any);
    return { success: true };
  } catch {
    // doc may not exist, use set
    try {
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "events", eventId, "studyGuides", committeeName), data);
      return { success: true };
    } catch (error) { return { success: false, error }; }
  }
}

export async function deleteStudyGuide(
  eventId: string,
  committeeName: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "events", eventId, "studyGuides", committeeName));
    return { success: true };
  } catch (error) { return { success: false, error }; }
}
