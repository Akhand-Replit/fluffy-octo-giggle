import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface NotificationPreferences {
  emailOnApproval: boolean;
  emailOnRejection: boolean;
  emailOnNewEvent: boolean;
  pushNotifications: boolean;
}

export interface PrivacySettings {
  showProfile: boolean;
  showApplicationHistory: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  photoURL?: string;
  institution?: string;
  bio?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  notificationPreferences?: NotificationPreferences;
  privacySettings?: PrivacySettings;
  onboardingComplete?: boolean;
  isAdmin?: boolean;
  proStatus?: 'none' | 'pending' | 'active' | 'rejected' | 'expired';
  proFeatures?: string[];
  proAppliedAt?: any;
  proActivatedAt?: any;
  proExpiresAt?: any;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const data = snap.data();
      return { uid: snap.id, ...data } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  try {
    await updateDoc(doc(db, "users", uid), data as Record<string, unknown>);
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}

export async function updateUserRole(uid: string, role: string): Promise<void> {
  try {
    const { setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "users", uid), { role }, { merge: true });
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
}
