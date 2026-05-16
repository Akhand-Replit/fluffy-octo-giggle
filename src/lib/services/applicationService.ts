import { collection, addDoc, serverTimestamp, doc, query, where, getDocs, orderBy, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface ApplicationChoice {
  committee: string;
  country: string;
}

export interface ApplicationData {
  eventId: string;
  userId: string;
  applicantName?: string;
  applicantEmail?: string;
  role: "Delegate" | "Observer" | "Head Delegate" | string;
  choices: {
    primary: ApplicationChoice;
    secondary: ApplicationChoice;
    tertiary: ApplicationChoice;
  };
  experience: string;
  motivation: string;
  status: "pending" | "approved" | "rejected" | "past";
  assignedCommittee?: string;
  assignedCountry?: string;
  createdAt?: any;
}

export async function submitApplication(application: ApplicationData): Promise<{ success: boolean; id?: string; error?: any }> {
  try {
    const applicationsRef = collection(db, "applications");
    const docRef = await addDoc(applicationsRef, {
      ...application,
      createdAt: serverTimestamp()
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error submitting application:", error);
    return { success: false, error };
  }
}

export async function getUserApplications(userId: string): Promise<ApplicationData[]> {
  try {
    const applicationsRef = collection(db, "applications");
    const q = query(
      applicationsRef, 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as ApplicationData));
  } catch (error) {
    console.error("Error fetching user applications:", error);
    return [];
  }
}

export async function getApplicationsByEvent(eventId: string): Promise<ApplicationData[]> {
  try {
    const applicationsRef = collection(db, "applications");
    const q = query(
      applicationsRef,
      where("eventId", "==", eventId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as ApplicationData));
  } catch (error) {
    console.error("Error fetching applications by event:", error);
    return [];
  }
}

export async function updateApplication(applicationId: string, data: Partial<ApplicationData>): Promise<{ success: boolean; error?: any }> {
  try {
    const appRef = doc(db, "applications", applicationId);
    await updateDoc(appRef, data);
    return { success: true };
  } catch (error) {
    console.error("Error updating application:", error);
    return { success: false, error };
  }
}
