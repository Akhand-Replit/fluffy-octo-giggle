import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc, setDoc, serverTimestamp, query, where, orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface PermissionsMap {
  canViewApplications: boolean;
  canMarkDelegates: boolean;
  canSendAnnouncements: boolean;
  canManageSchedule: boolean;
  canViewFinancials: boolean;
  canApproveResults: boolean;
}

export const DEFAULT_PERMISSIONS: PermissionsMap = {
  canViewApplications: false,
  canMarkDelegates: false,
  canSendAnnouncements: false,
  canManageSchedule: false,
  canViewFinancials: false,
  canApproveResults: false,
};

export const ROLE_PRESETS: Record<string, Partial<PermissionsMap>> = {
  "co-organizer": {
    canViewApplications: true,
    canSendAnnouncements: true,
    canManageSchedule: true,
    canViewFinancials: true,
    canApproveResults: true,
  },
  usg: {
    canViewApplications: true,
    canManageSchedule: true,
  },
  director: {
    canViewApplications: true,
    canMarkDelegates: true,
  },
  chair: {
    canMarkDelegates: true,
  },
  "vice-chair": {
    canMarkDelegates: true,
  },
  observer: {},
  "faculty-advisor": {},
};

export interface StaffMember {
  id?: string;
  uid: string;
  name: string;
  email: string;
  role: "co-organizer" | "usg" | "director" | "chair" | "vice-chair" | "observer" | "faculty-advisor";
  committeeId: string | null;
  permissions: PermissionsMap;
  inviteStatus: "invited" | "applied" | "accepted" | "rejected";
  addedAt?: any;
}

export async function getEventStaff(eventId: string): Promise<StaffMember[]> {
  try {
    const snap = await getDocs(collection(db, "events", eventId, "staff"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffMember));
  } catch (error) {
    console.error("Error fetching staff:", error);
    return [];
  }
}

export async function addStaffMember(
  eventId: string,
  member: Omit<StaffMember, "id" | "addedAt">
): Promise<{ success: boolean; id?: string; error?: any }> {
  try {
    const ref = await addDoc(collection(db, "events", eventId, "staff"), {
      ...member,
      addedAt: serverTimestamp(),
    });
    return { success: true, id: ref.id };
  } catch (error) {
    console.error("Error adding staff member:", error);
    return { success: false, error };
  }
}

export async function updateStaffMember(
  eventId: string,
  staffId: string,
  data: Partial<StaffMember>
): Promise<{ success: boolean; error?: any }> {
  try {
    await updateDoc(doc(db, "events", eventId, "staff", staffId), data as any);
    return { success: true };
  } catch (error) {
    console.error("Error updating staff member:", error);
    return { success: false, error };
  }
}

export async function removeStaffMember(
  eventId: string,
  staffId: string
): Promise<{ success: boolean; error?: any }> {
  try {
    await deleteDoc(doc(db, "events", eventId, "staff", staffId));
    return { success: true };
  } catch (error) {
    console.error("Error removing staff member:", error);
    return { success: false, error };
  }
}
