"use client";

import { useState, useEffect } from "react";
import { Settings, Globe, Shield, Save, Loader2, RefreshCw, CheckCircle } from "lucide-react";
import { getSiteSettings, saveSiteSettings } from "./actions";

export default function AdminSettings() {
  const [settings, setSettings] = useState<any>({
    site_name: "",
    contact_email: "",
    amazon_associate_tag: "",
    amazon_marketplace: "",
    footer_disclosure: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [dbSource, setDbSource] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const res = await getSiteSettings();
    if (res.success && res.data) {
      setSettings(res.data);
      setDbSource(res.source || "default");
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await saveSiteSettings(settings);
    if (res.success) {
      setMessage({ type: "success", text: "Settings saved successfully!" });
      setDbSource(res.source || "local");
    } else {
      setMessage({ type: "error", text: res.error || "Failed to save settings." });
    }
    setSaving(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Settings className="w-8 h-8 text-brand-600" />
            Platform Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Configure site branding, support emails, and default Amazon API affiliate tags.
          </p>
          {dbSource && (
            <span className="inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500 uppercase tracking-wider">
              Database: {dbSource === "supabase" ? "Supabase Cloud" : "Local settings.json"}
            </span>
          )}
        </div>
        <button
          onClick={loadSettings}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-bold text-slate-700 dark:text-slate-300"
        >
          <RefreshCw className="w-4 h-4" />
          Reload
        </button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-16 text-center text-slate-500">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
            <span className="font-bold text-slate-700 dark:text-slate-300">Fetching configurations...</span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          {message && (
            <div
              className={`p-4 rounded-xl border text-sm font-semibold flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-green-50/50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400"
                  : "bg-red-50/50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400"
              }`}
            >
              <CheckCircle className="w-5 h-5 shrink-0" />
              {message.text}
            </div>
          )}

          {/* Branding Section */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-slate-400" />
              Branding & General
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Website Name
                </label>
                <input
                  type="text"
                  name="site_name"
                  value={settings.site_name || ""}
                  onChange={handleChange}
                  placeholder="e.g. smartXman"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Support & Contact Email
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={settings.contact_email || ""}
                  onChange={handleChange}
                  placeholder="e.g. contact@smartxman.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Amazon Affiliate settings */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-slate-400" />
              Amazon Affiliate Credentials
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Amazon Associate Tag
                </label>
                <input
                  type="text"
                  name="amazon_associate_tag"
                  value={settings.amazon_associate_tag || ""}
                  onChange={handleChange}
                  placeholder="e.g. smartxman-21"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Default Amazon Marketplace
                </label>
                <input
                  type="text"
                  name="amazon_marketplace"
                  value={settings.amazon_marketplace || ""}
                  onChange={handleChange}
                  placeholder="e.g. www.amazon.in"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Footer Affiliate Disclosure Text
              </label>
              <textarea
                name="footer_disclosure"
                value={settings.footer_disclosure || ""}
                onChange={handleChange}
                rows={3}
                placeholder="Amazon disclosure text here..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-black uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-brand-500/10 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Platform Settings
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
