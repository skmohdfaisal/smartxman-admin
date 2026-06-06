import Link from "next/link";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";

export default function AccessDeniedPage() {
  const storeUrl = process.env.NODE_ENV === "development" 
    ? "http://localhost:3000" 
    : (process.env.NEXT_PUBLIC_STORE_URL || "https://www.smartxman.com");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-10 shadow-xl shadow-slate-100 dark:shadow-none">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-8 animate-bounce">
          <ShieldAlert className="w-10 h-10" />
        </div>
        
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
          Access Denied
        </h1>
        
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          Your account does not have administrator privileges. Only authorized admin users can access the smartXman dashboard.
        </p>

        <div className="flex flex-col gap-3">
          <a 
            href={storeUrl} 
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all shadow-md shadow-brand-500/10 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Homepage
          </a>
          
          <Link 
            href="/auth" 
            className="w-full py-3.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" /> Sign in with different account
          </Link>
        </div>
      </div>
    </div>
  );
}

