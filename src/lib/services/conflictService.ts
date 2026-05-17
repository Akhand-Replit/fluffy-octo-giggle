import { collectionGroup, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface ConflictRecord {
  eventId: string;
  eventName: string;
  date: string;
  country: string;
}

export async function checkConflict(userId: string, country: string, excludeEventId: string): Promise<ConflictRecord | null> {
  try {
    const q = query(
      collectionGroup(db, "applications"),
      where("userId", "==", userId),
      where("assignedCountry", "==", country),
      where("status", "==", "approved")
    );
    const snap = await getDocs(q);

    // Manual filter for eventId since inequality (!=) might be tricky with multiple where clauses
    const pastApp = snap.docs.find(d => {
      const data = d.data();
      return data.eventId !== excludeEventId;
    });

    if (pastApp) {
      const data = pastApp.data();
      // Assume event title/date was denormalized, or we need to fetch event.
      // For performance, we assume it's just recorded, but if not we can return a generic message
      return {
        eventId: data.eventId,
        eventName: data.eventTitle || "a past event",
        date: data.eventDate || "previously",
        country: country
      };
    }
    return null;
  } catch (error) {
    console.error("Error checking conflict:", error);
    return null;
  }
}

export async function batchCheckConflicts(applicants: any[], countries: string[], eventId: string): Promise<Map<string, ConflictRecord>> {
  const conflicts = new Map<string, ConflictRecord>();
  // To avoid hitting limits, we check conflicts sequentially or in small batches
  // In a real pro app, we might use a cloud function or better caching.
  for (const app of applicants) {
    for (const country of countries) {
      const conflict = await checkConflict(app.userId, country, eventId);
      if (conflict) {
        conflicts.set(`${app.userId}_${country}`, conflict);
      }
    }
  }
  return conflicts;
}
