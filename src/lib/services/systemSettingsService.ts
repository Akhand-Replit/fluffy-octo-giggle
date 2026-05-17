import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface SystemSettings {
  platformFeePercent: number;
  maxEventCapacity: number;
  allowGuestArticleComments: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  defaultEventTheme: string;
  supportEmail: string;
  termsLastUpdated: any;
  privacyLastUpdated: any;
}

const DEFAULT_SETTINGS: SystemSettings = {
  platformFeePercent: 7,
  maxEventCapacity: 5000,
  allowGuestArticleComments: false,
  maintenanceMode: false,
  maintenanceMessage: "System is under maintenance. Please check back later.",
  defaultEventTheme: "light",
  supportEmail: "support@example.com",
  termsLastUpdated: serverTimestamp(),
  privacyLastUpdated: serverTimestamp(),
};

const SETTINGS_DOC_REF = "systemSettings/global";

export async function getSystemSettings(): Promise<SystemSettings> {
  const docRef = doc(db, SETTINGS_DOC_REF);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as SystemSettings;
  }
  // Initialize default if not exists
  await setDoc(docRef, DEFAULT_SETTINGS);
  const newSnap = await getDoc(docRef);
  return newSnap.data() as SystemSettings;
}

export async function updateSystemSettings(updates: Partial<SystemSettings>): Promise<void> {
  const docRef = doc(db, SETTINGS_DOC_REF);
  await updateDoc(docRef, updates);
}
