"use client";

import { User, Shield, Mail, Key, Loader2, Search, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { getUsers, toggleUserRole } from "./actions";
import Link from "next/link";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const res = await getUsers();
    if (res.success) {
      setUsers(res.data);
    }
    setLoading(false);
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    if (!confirm(`Are you sure you want to change this user's role to ${currentRole === "admin" ? "user" : "admin"}?`)) {
      return;
    }
    setTogglingId(userId);
    const res = await toggleUserRole(userId, currentRole);
    if (res.success) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: currentRole === "admin" ? "user" : "admin" } : u));
    } else {
      alert("Failed to toggle role: " + res.error);
    }
    setTogglingId(null);
  };

  const filteredUsers = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Manage Users</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Configure role permissions, view joined dates, and promote users.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user name or email..." 
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Profile</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Email</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Joined Date</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Role Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                      <span>Fetching users from Supabase...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-black text-sm uppercase border border-brand-200/20">
                          {item.name ? item.name.charAt(0) : item.email.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white leading-tight">{item.name || "Anonymous Member"}</p>
                          <p className="text-[10px] font-bold text-slate-400 tracking-wide uppercase mt-0.5">{item.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-semibold">{item.email}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full ${
                        item.role === "admin" 
                          ? "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400" 
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        <Shield className="w-3.5 h-3.5" />
                        {item.role || "user"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleRole(item.id, item.role)}
                        disabled={togglingId === item.id}
                        className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-brand-600 dark:hover:bg-brand-600 hover:text-white dark:hover:text-white text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] rounded-xl transition-all disabled:opacity-50"
                      >
                        {togglingId === item.id ? (
                          <Loader2 className="w-3 animate-spin mx-auto" />
                        ) : item.role === "admin" ? (
                          "Demote to User"
                        ) : (
                          "Promote to Admin"
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No users found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
