import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface Applicant {
  id: string;
  name: string;
  email: string;
  experience: string;
  preferences: string[];
  assignedCountry: string | null;
  conflictWarning?: string | null;
}

interface CountryAssignmentRowProps {
  applicant: Applicant;
  availableCountries: string[];
  conflicts?: Record<string, string>; // country -> conflict warning
  onAssign: (applicantId: string, country: string) => void;
}

export function CountryAssignmentRow({ applicant, availableCountries, conflicts, onAssign }: CountryAssignmentRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">{applicant.name}</h4>
          {applicant.assignedCountry && conflicts?.[applicant.assignedCountry] && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 cursor-help">
                    <AlertCircle className="w-3 h-3 mr-1" /> Conflict
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{conflicts[applicant.assignedCountry]}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {applicant.assignedCountry && (!conflicts || !conflicts[applicant.assignedCountry]) && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Assigned
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{applicant.email}</p>
        <div className="mt-2 text-xs">
          <span className="font-medium">Preferences: </span>
          <span className="text-muted-foreground">{applicant.preferences.join(', ')}</span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Experience: </span>{applicant.experience}
        </div>
      </div>
      
      <div className="w-full sm:w-64 shrink-0">
        <Select 
          value={applicant.assignedCountry ?? "unassigned"} 
          onValueChange={(val) => { if (val !== null) onAssign(applicant.id, val); }}
        >
          <SelectTrigger className={applicant.assignedCountry && conflicts?.[applicant.assignedCountry] ? "border-amber-300 ring-amber-100" : ""}>
            <SelectValue placeholder="Assign Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned" className="text-muted-foreground italic">Unassigned</SelectItem>
            {availableCountries.map(country => {
              const conflictMsg = conflicts?.[country];
              return (
                <SelectItem key={country} value={country}>
                  <div className="flex items-center justify-between w-full pr-2">
                    <span>{country}</span>
                    {conflictMsg && (
                       <TooltipProvider>
                         <Tooltip>
                           <TooltipTrigger>
                             <span className="text-amber-500 ml-2" title={conflictMsg}>🟡</span>
                           </TooltipTrigger>
                           <TooltipContent><p>{conflictMsg}</p></TooltipContent>
                         </Tooltip>
                       </TooltipProvider>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
