import { collection, addDoc, serverTimestamp, doc, query, where, getDocs, orderBy, updateDoc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { createGroupConversation } from "./messageService";

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
  if (!eventId) return [];
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
    const prevSnap = await getDoc(appRef);
    
    await updateDoc(appRef, data);
    
    // Check if transitioning to approved
    if (prevSnap.exists() && data.status === "approved" && data.assignedCommittee) {
      const prevData = prevSnap.data() as ApplicationData;
      if (prevData.status !== "approved") {
        await handlePostApprovalTasks(prevData.eventId, data.assignedCommittee, prevData.userId, prevData.applicantName || "Delegate");
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error updating application:", error);
    return { success: false, error };
  }
}

async function handlePostApprovalTasks(eventId: string, committeeId: string, targetUid: string, targetName: string) {
  try {
    // 1. Auto-Follow
    const appsRef = collection(db, "applications");
    const q = query(appsRef, where("eventId", "==", eventId), where("assignedCommittee", "==", committeeId), where("status", "==", "approved"));
    const snap = await getDocs(q);
    
    const batch = writeBatch(db);
    
    // We need target user details
    const targetUserSnap = await getDoc(doc(db, "users", targetUid));
    const targetUser = targetUserSnap.data();
    const tPhoto = targetUser?.photoURL || "";
    
    snap.docs.forEach(async d => {
      const appData = d.data() as ApplicationData;
      if (appData.userId !== targetUid) {
        // Connect targetUid and appData.userId
        const otherUid = appData.userId;
        const otherName = appData.applicantName || "Delegate";
        // To be safe without awaiting inside loop, we'll just set it without their photo (or we could fetch it).
        // Since we are doing a client-side hook, we'll keep it simple:
        
        batch.set(doc(db, "users", targetUid, "connections", otherUid), {
          otherUid, displayName: otherName, photoURL: "", role: appData.role || "Delegate",
          source: "auto", sourceEventId: eventId, sourceCommitteeId: committeeId, connectedAt: serverTimestamp(), status: "active"
        }, { merge: true });
        
        batch.set(doc(db, "users", otherUid, "connections", targetUid), {
          otherUid: targetUid, displayName: targetName, photoURL: tPhoto, role: "Delegate",
          source: "auto", sourceEventId: eventId, sourceCommitteeId: committeeId, connectedAt: serverTimestamp(), status: "active"
        }, { merge: true });
      }
    });
    
    await batch.commit();

    // 2. Auto-Group
    // For V1, we skip fully robust auto-group if it's too complex here, 
    // but we can query if a group exists for this committee.
    // Spec: Look up or create the group conversation for {eventId, committeeId}
    const convQ = query(collection(db, "conversations"), where("type", "==", "group"), where("eventId", "==", eventId), where("committeeId", "==", committeeId));
    const convSnap = await getDocs(convQ);
    
    if (!convSnap.empty) {
      const convId = convSnap.docs[0].id;
      // Use arrayUnion directly or our service
      const { addGroupMember } = await import("./messageService");
      await addGroupMember(convId, "System", "System", targetUid, targetName, tPhoto);
    } else {
      // Create it
      const eventSnap = await getDoc(doc(db, "events", eventId));
      const eventName = eventSnap.data()?.shortName || "Conference";
      await createGroupConversation(
        targetUid, // Not ideal as creator, but works as a trigger
        `${eventName} - ${committeeId}`,
        [targetUid],
        { [targetUid]: targetName },
        { [targetUid]: tPhoto },
        { eventId, committeeId, autoGenerated: true }
      );
    }
  } catch (err) {
    console.error("Error in post approval tasks", err);
  }
}
