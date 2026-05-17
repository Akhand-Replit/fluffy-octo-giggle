"use client";

import { useEffect, useState } from "react";
import { getFoodSlots, FoodSlot } from "@/lib/services/optionalModulesService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Utensils, Clock, MapPin, QrCode } from "lucide-react";

interface FoodCouponsModuleProps {
  eventId: string;
  applicationId: string;
}

function QRCodeDisplay({ data, label }: { data: string; label: string }) {
  // Visual QR placeholder — add qrcode.react for real scanning
  const hash = data.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
  const cells = Array.from({ length: 25 }, (_, i) => (Math.abs(hash * (i + 1) * 7) % 3 !== 0));

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="p-3 bg-white rounded-xl border-2 border-border shadow-sm">
        <div className="grid grid-cols-5 gap-0.5 w-[80px] h-[80px]">
          {cells.map((filled, i) => (
            <div key={i} className={`rounded-[1px] ${filled ? "bg-foreground" : "bg-white"}`} />
          ))}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground font-mono">{label}</p>
    </div>
  );
}

const mealColors: Record<string, string> = {
  breakfast: "bg-amber-500/10 border-amber-500/20 text-amber-600",
  lunch: "bg-orange-500/10 border-orange-500/20 text-orange-600",
  dinner: "bg-purple-500/10 border-purple-500/20 text-purple-600",
};

export function FoodCouponsModule({ eventId, applicationId }: FoodCouponsModuleProps) {
  const [slots, setSlots] = useState<FoodSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFoodSlots(eventId).then(data => {
      setSlots(data);
      setLoading(false);
    });
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <Utensils className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-1">No food slots configured yet</h3>
        <p className="text-sm text-muted-foreground">Check back once the organizer sets up meal schedules.</p>
      </div>
    );
  }

  const days = [...new Set(slots.map(s => s.day))].sort();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <Utensils className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Food Coupons</h2>
          <p className="text-sm text-muted-foreground">Your digital meal tickets — show QR to staff</p>
        </div>
      </div>

      {days.map(day => (
        <div key={day}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">{day}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slots.filter(s => s.day === day).map(slot => {
              const mealKey = slot.mealName.toLowerCase();
              const colorClass = Object.entries(mealColors).find(([k]) => mealKey.includes(k))?.[1]
                || "bg-primary/10 border-primary/20 text-primary";
              const qrData = `${applicationId}:${slot.id}:${day}`;

              return (
                <Card key={slot.id} className={`glass-card border ${colorClass} rounded-2xl`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Utensils className="w-4 h-4" />
                      {slot.mealName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{slot.timeWindow}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{slot.venue}</span>
                      </div>
                    </div>
                    <div className="flex justify-center pt-2">
                      <QRCodeDisplay data={qrData} label={slot.id?.slice(0, 8) || ""} />
                    </div>
                    <p className="text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      <QrCode className="w-3 h-3" /> Show to staff at the venue
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
