import { Loader2, Sparkles } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-pulse">
      {/* Title & Badge Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-3 w-full max-w-md">
          <div className="h-6 w-36 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
          <div className="h-10 w-64 bg-slate-250 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-4 w-80 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="h-11 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-11 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0"></div>
            <div className="space-y-2.5 flex-1">
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
              <div className="h-7 w-12 bg-slate-250 dark:bg-slate-800 rounded-lg"></div>
              <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid (Recent lists) Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Products */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-850 gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 bg-slate-250 dark:bg-slate-800 rounded-lg"></div>
                    <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                  </div>
                </div>
                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Recent Users */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-4.5 w-10 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-2xl border border-slate-50 dark:border-slate-850">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0"></div>
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-24 bg-slate-250 dark:bg-slate-800 rounded-lg"></div>
                  <div className="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
