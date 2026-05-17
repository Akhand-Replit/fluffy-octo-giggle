import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface Committee {
  name: string;
  countries: string[];
  capacity?: number;
  chairs?: string[];
}

export interface TicketingTier {
  name: string;
  price: number;
  capacity: number;
}

export interface ScheduleItem {
  title: string;
  startTime: string;
  endTime: string;
  type: "main" | "session" | "break" | "social";
  location: string;
  description?: string;
}

export interface MarkingTemplate {
  id: string;
  name: string;
  maxScore: number;
}

export interface EventData {
  id: string;
  title: string;
  date: string;
  location: string;
  format: string;
  description: string;
  committees: Committee[];
  coverUrl?: string;
  schedule?: ScheduleItem[];

  // Organizer specific fields
  organizerId?: string;
  status?: "draft" | "published";
  ticketingTiers?: TicketingTier[];
  totalCapacity?: number;
  executiveBoard?: any[];
  
  // Settings
  theme?: string;
  certificateTemplate?: string;
  countryAssignmentMode?: "manual" | "ai";
  optionalModules?: string[];
  markingTemplates?: MarkingTemplate[];
  
  // Assignment Tracking
  assignmentDeadline?: string | any;
  assignmentStatus?: "pending" | "in_progress" | "completed" | "auto_assigned" | "overdue";
  deadlineRemindersSent?: Record<string, any>;
  
  // Audit
  lastEditedAt?: string | any;
  lastEditedBy?: string;
}

export async function getEventById(eventId: string): Promise<EventData | null> {
  try {
    const eventSnap = await getDoc(doc(db, "events", eventId));
    if (eventSnap.exists()) {
      return { id: eventSnap.id, ...eventSnap.data() } as EventData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching event:", error);
    return null;
  }
}

export async function getEventsByIds(eventIds: string[]): Promise<EventData[]> {
  if (!eventIds || eventIds.length === 0) return [];
  const uniqueIds = Array.from(new Set(eventIds));
  const chunks = [];
  for (let i = 0; i < uniqueIds.length; i += 30) {
    chunks.push(uniqueIds.slice(i, i + 30));
  }
  
  try {
    const results = await Promise.all(
      chunks.map(async chunk => {
        const q = query(collection(db, "events"), where("__name__", "in", chunk));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as EventData));
      })
    );
    return results.flat();
  } catch (error) {
    console.error("Error fetching events by ids:", error);
    return [];
  }
}

export async function getAllEvents(): Promise<EventData[]> {
  try {
    const snap = await getDocs(collection(db, "events"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EventData));
  } catch (error) {
    console.error("Error fetching all events:", error);
    return [];
  }
}

export async function createEvent(data: Omit<EventData, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "events"), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
}

export async function getOrganizerEvents(organizerUid: string): Promise<EventData[]> {
  try {
    const snap = await getDocs(
      query(collection(db, "events"), where("organizerId", "==", organizerUid))
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as EventData));
  } catch (error) {
    console.error("Error fetching organizer events:", error);
    return [];
  }
}

export interface OrganizerStats {
  totalEvents: number;
  publishedEvents: number;
  totalApplications: number;
  totalApproved: number;
}

export async function getOrganizerStats(organizerUid: string): Promise<OrganizerStats> {
  try {
    const events = await getOrganizerEvents(organizerUid);
    const totalEvents = events.length;
    const publishedEvents = events.filter(e => e.status === "published").length;

    let totalApplications = 0;
    let totalApproved = 0;

    for (const event of events) {
      const appsSnap = await getDocs(
        query(collection(db, "applications"), where("eventId", "==", event.id))
      );
      totalApplications += appsSnap.size;
      totalApproved += appsSnap.docs.filter(d => d.data().status === "approved").length;
    }

    return { totalEvents, publishedEvents, totalApplications, totalApproved };
  } catch (error) {
    console.error("Error fetching organizer stats:", error);
    return { totalEvents: 0, publishedEvents: 0, totalApplications: 0, totalApproved: 0 };
  }
}

export async function updateEvent(eventId: string, data: Partial<Omit<EventData, "id">>): Promise<void> {
  try {
    await updateDoc(doc(db, "events", eventId), { ...data, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
}
