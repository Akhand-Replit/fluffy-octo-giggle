import { ref, onDisconnect, set, onValue, serverTimestamp as rtdbServerTimestamp } from "firebase/database";
import { doc, setDoc, serverTimestamp, onSnapshot, getDocs, query, where, collection } from "firebase/firestore";
import { db, rtdb } from "@/lib/firebase/client";

export type PresenceState = "online" | "away" | "offline";

export interface PresenceData {
  state: PresenceState;
  lastChangedAt: any;
}

export function initPresence(uid: string): () => void {
  const userStatusRef = ref(rtdb, `/status/${uid}`);
  const connectedRef = ref(rtdb, ".info/connected");

  const unsubscribe = onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      const con = onDisconnect(userStatusRef);
      con.set({
        state: "offline",
        lastChangedAt: rtdbServerTimestamp(),
      }).then(() => {
        set(userStatusRef, {
          state: "online",
          lastChangedAt: rtdbServerTimestamp(),
        });
      });
    }
  });

  return () => {
    unsubscribe();
    set(userStatusRef, {
      state: "offline",
      lastChangedAt: rtdbServerTimestamp(),
    });
  };
}

// Subscribe to Firestore mirrored presence, honoring privacy settings
export function subscribeToPresence(
  uid: string,
  callback: (presence: PresenceData) => void
): () => void {
  const userRef = doc(db, "users", uid);
  return onSnapshot(userRef, (snap) => {
    if (!snap.exists()) {
      callback({ state: "offline", lastChangedAt: null });
      return;
    }
    const data = snap.data();
    if (data.privacySettings?.showProfile === false) {
      callback({ state: "offline", lastChangedAt: null });
      return;
    }
    const presence = data.presence || { state: "offline", lastChangedAt: null };
    callback(presence);
  });
}

// Since we cannot do 'in' array of length 0, we handle it
export function subscribeToMultiplePresence(
  uids: string[],
  callback: (presenceMap: Record<string, PresenceData>) => void
): () => void {
  if (!uids || uids.length === 0) {
    callback({});
    return () => {};
  }
  
  // Chunk UIDs into 30s
  const chunks = [];
  for (let i = 0; i < uids.length; i += 30) {
    chunks.push(uids.slice(i, i + 30));
  }

  const unsubscribes = chunks.map(chunk => {
    const q = query(collection(db, "users"), where("__name__", "in", chunk));
    return onSnapshot(q, (snap) => {
      const map: Record<string, PresenceData> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.privacySettings?.showProfile === false) {
          map[d.id] = { state: "offline", lastChangedAt: null };
        } else {
          map[d.id] = data.presence || { state: "offline", lastChangedAt: null };
        }
      });
      callback(map);
    });
  });

  return () => {
    unsubscribes.forEach(unsub => unsub());
  };
}
