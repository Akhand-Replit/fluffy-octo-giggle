import { ApplicationData, updateApplication } from "./applicationService";
import { EventData, Committee } from "./eventService";

export interface AssignmentSuggestion {
  applicationId: string;
  userId: string;
  suggestedCountry: string;
  reason: string;
}

/**
 * Heuristic-based AI assignment suggestion logic.
 * In the future, this can be upgraded to use LLMs (OpenAI/Ollama).
 */
export function suggestCountryAssignments(
  applications: ApplicationData[],
  committee: Committee
): AssignmentSuggestion[] {
  // 1. Get only approved applications for this committee
  const validApps = applications.filter(app => 
    app.status === "approved" && 
    (app.assignedCommittee === committee.name || app.choices.primary.committee === committee.name)
  );

  // 2. Filter out already assigned ones
  const unassignedApps = validApps.filter(app => !app.assignedCountry);
  const availableCountries = [...committee.countries].filter(country => 
    !validApps.some(app => app.assignedCountry === country)
  );

  const suggestions: AssignmentSuggestion[] = [];

  // 3. Simple heuristic: match choices first, then experience length
  // Sort by experience length (proxy for complexity)
  const sortedApps = [...unassignedApps].sort((a, b) => b.experience.length - a.experience.length);

  sortedApps.forEach(app => {
    if (availableCountries.length === 0) return;

    let countryToAssign = "";
    let reason = "";

    // Check if primary choice is available
    if (availableCountries.includes(app.choices.primary.country)) {
      countryToAssign = app.choices.primary.country;
      reason = "Matched primary choice";
    } 
    // Check if secondary choice is available
    else if (availableCountries.includes(app.choices.secondary.country)) {
      countryToAssign = app.choices.secondary.country;
      reason = "Matched secondary choice";
    }
    // Otherwise, assign any available country
    else {
      countryToAssign = availableCountries[0];
      reason = "Auto-assigned based on availability and experience";
    }

    if (countryToAssign) {
      suggestions.push({
        applicationId: (app as any).id,
        userId: app.userId,
        suggestedCountry: countryToAssign,
        reason
      });
      // Remove assigned country from pool
      const index = availableCountries.indexOf(countryToAssign);
      if (index > -1) availableCountries.splice(index, 1);
    }
  });

  return suggestions;
}

export async function applyAIAssignments(suggestions: AssignmentSuggestion[]): Promise<void> {
  await Promise.all(
    suggestions.map(s => 
      updateApplication(s.applicationId, { 
        assignedCountry: s.suggestedCountry 
      })
    )
  );
}
