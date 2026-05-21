"use client";

import { useState, useEffect } from "react";
import { Mail, Search, Download, Trash2, Loader2, Calendar, ShieldAlert } from "lucide-react";
import { getSubscribers, deleteSubscriber } from "./actions";

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dbSource, setDbSource] = useState("");

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    setLoading(true);
    const res = await getSubscribers();
    if (res.success) {
      setSubscribers(res.data || []);
      setDbSource(res.source || "default");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this subscriber?")) return;
    setDeletingId(id);
    const res = await deleteSubscriber(id);
    if (res.success) {
      setSubscribers(subscribers.filter((s) => s.id !== id && s.email !== id));
    }
    setDeletingId(null);
  };

  const exportToCSV = () => {
    if (subscribers.length === 0) return;
    
    // Header
    const csvRows = [["ID", "Email Address", "Source Channel", "Date Subscribed"]];
    
    // Rows
    subscribers.forEach((s) => {
      csvRows.push([
        s.id || "",
        s.email || "",
        s.source || "unknown",
        s.created_at ? new Date(s.created_at).toISOString() : ""
      ]);
    });
    
    // Convert to CSV string
    const csvContent = "data:text/csv;charset=utf-8," 
      + csvRows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smartxman_newsletter_subscribers_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSubs = subscribers.filter((s) => 
    s.email?.toLowerCase().includes(search.toLowerCase()) || 
    s.source?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Mail className="w-8 h-8 text-brand-600" />
            Newsletter Subscribers
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Manage your audience, track subscription channels, and export lead databases to Excel/CSV.
          </p>
          {dbSource && (
            <span className="inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500 uppercase tracking-wider">
              Storage: {dbSource === "supabase" ? "Supabase Table" : "Local Fallback Database"}
            </span>
          )}
        </div>

        <button
          onClick={exportToCSV}
          disabled={filteredSubs.length === 0}
          className="flex items-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export to CSV
        </button>
      </div>

      {/* Main Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search subscribers by email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-black uppercase tracking-wider text-xs">Subscriber Email</th>
                <th className="px-6 py-4 font-black uppercase tracking-wider text-xs">Signup Channel</th>
                <th className="px-6 py-4 font-black uppercase tracking-wider text-xs">Date Joined</th>
                <th className="px-6 py-4 font-black uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-bold">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-600 mb-2" />
                    Loading subscriber records...
                  </td>
                </tr>
              ) : filteredSubs.length > 0 ? (
                filteredSubs.map((sub) => (
                  <tr key={sub.id || sub.email} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {sub.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-semibold bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg uppercase tracking-wider">
                        {sub.source || "General"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(sub.id || sub.email)}
                        disabled={deletingId === (sub.id || sub.email)}
                        className="p-2 text-slate-400 hover:text-red-650 transition-colors disabled:opacity-50"
                        title="Remove Subscriber"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-bold">
                    No newsletter subscriber records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
