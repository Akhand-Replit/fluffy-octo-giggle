"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export function useProStatus() {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<"none"|"pending"|"active"|"rejected"|"expired">(profile?.proStatus || "none");
  const [expiresAt, setExpiresAt] = useState<Date|null>(profile?.proExpiresAt?.toDate?.() || null);
  const [isPro, setIsPro] = useState(profile?.proStatus === "active");

  useEffect(() => {
    if (!user?.uid) return;

    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const pStatus = data.proStatus || "none";
        const pExpiresAt = data.proExpiresAt?.toDate?.() || null;
        
        let finalStatus = pStatus;
        let finalIsPro = pStatus === "active";

        if (pStatus === "active" && pExpiresAt && pExpiresAt < new Date()) {
          finalStatus = "expired";
          finalIsPro = false;
        }

        setStatus(finalStatus);
        setIsPro(finalIsPro);
        setExpiresAt(pExpiresAt);
      }
    });

    return () => unsub();
  }, [user?.uid]);

  const refresh = () => {
    // onSnapshot handles real-time updates natively
  };

  return { isPro, status, expiresAt, refresh };
}
