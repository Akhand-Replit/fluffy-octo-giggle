"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getApplicationsByEvent, updateApplication, ApplicationData } from "@/lib/services/applicationService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Search, Filter, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function ApplicationsPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { user } = useAuth();

  const [applications, setApplications] = useState<(ApplicationData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    async function loadApps() {
      if (!user || !eventId) return;
      const apps = await getApplicationsByEvent(eventId);
      setApplications(apps as (ApplicationData & { id: string })[]);
      setLoading(false);
    }
    loadApps();
  }, [user, eventId]);

  const handleUpdateStatus = async (appId: string, newStatus: "approved" | "rejected") => {
    try {
      await updateApplication(appId, { status: newStatus });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      alert(`Application ${newStatus}`);
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  const filteredApps = applications.filter(a => {
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    const searchString = `${a.applicantName} ${a.applicantEmail}`.toLowerCase();
    const matchesSearch = searchString.includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Applications Management</h2>
          <p className="text-muted-foreground">Review and manage delegate applications for this event.</p>
        </div>
      </div>

      <Card className="glass-card overflow-hidden">
        <CardHeader className="bg-secondary/10 border-b border-border/50">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search applicants..."
                className="pl-9 bg-background/50"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
                <SelectTrigger className="w-[140px] bg-background/50">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-secondary/5 text-xs uppercase tracking-wider text-muted-foreground border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Applicant</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Pref. Committee</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-secondary/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{app.applicantName || "Unknown Delegate"}</span>
                      <span className="text-xs text-muted-foreground">{app.applicantEmail || "No email"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{app.role}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {app.choices?.primary?.committee || "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={app.status === "approved" ? "default" : app.status === "rejected" ? "destructive" : "secondary"} className="capitalize">
                      {app.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {app.status !== "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-500 border-green-500/20 hover:bg-green-500/10 hover:text-green-600"
                          onClick={() => handleUpdateStatus(app.id as string, "approved")}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                      )}
                      {app.status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleUpdateStatus(app.id as string, "rejected")}
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredApps.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No applications found matching your filters.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
