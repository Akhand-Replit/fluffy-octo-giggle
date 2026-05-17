"use client";

import { EventData } from "@/lib/services/eventService";
import { Shirt } from "lucide-react";

interface DressCodeModuleProps {
  event: EventData;
}

export function DressCodeModule({ event }: DressCodeModuleProps) {
  const e = event as any;
  const dresscode: string | undefined = e.dresscode;
  const dresscodeDescription: string | undefined = e.dresscodeDescription;
  const dresscodeImageUrl: string | undefined = e.dresscodeImageUrl;

  if (!dresscode) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <Shirt className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-1">No dress code specified</h3>
        <p className="text-sm text-muted-foreground">The organizer hasn't added dress code information yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
          <Shirt className="w-5 h-5 text-rose-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Dress Code</h2>
          <p className="text-sm text-muted-foreground">Conference attire requirements</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {dresscodeImageUrl && (
          <div className="w-full h-56 overflow-hidden">
            <img
              src={dresscodeImageUrl}
              alt="Dress code reference"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 mb-6">
            <Shirt className="w-4 h-4 text-rose-500" />
            <span className="text-rose-600 font-bold text-lg">{dresscode}</span>
          </div>

          {dresscodeDescription && (
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <p className="leading-relaxed">{dresscodeDescription}</p>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Expected", desc: "Follow the dress code above for all sessions", color: "green" },
              { label: "Opening Ceremony", desc: "Formal attire required at all times", color: "blue" },
              { label: "Non-compliance", desc: "May result in restricted session access", color: "red" },
            ].map(({ label, desc, color }) => (
              <div key={label} className={`rounded-xl p-4 bg-${color}-500/5 border border-${color}-500/10`}>
                <p className={`text-xs font-bold uppercase tracking-wider text-${color}-600 mb-1`}>{label}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
