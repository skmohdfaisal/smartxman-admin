import Link from "next/link";
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Tag, 
  Percent, 
  MessageSquare, 
  Home, 
  Search, 
  Mail, 
  ClipboardCheck, 
  UploadCloud,
  ChevronRight,
  Menu,
  Shield,
  Bell,
  TrendingUp
} from "lucide-react";
import { checkAdmin } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce server-side role check before rendering any admin content
  const { user } = await checkAdmin();
  const storeUrl = process.env.NODE_ENV === "development" 
    ? "http://localhost:3000" 
    : (process.env.NEXT_PUBLIC_STORE_URL || "https://smartxman.vercel.app");

  const menuSections = [
    {
      title: "Dashboard",
      items: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      ]
    },
    {
      title: "Content",
      items: [
        { label: "Products", href: "/admin/products", icon: Package },
        { label: "Categories", href: "/admin/categories", icon: Tag },
        { label: "Blogs", href: "/admin/blogs", icon: FileText },
        { label: "Deals", href: "/admin/deals", icon: Percent },
      ]
    },
    {
      title: "Operations",
      items: [
        { label: "Product Importer", href: "/admin/product-importer", icon: UploadCloud },
        { label: "Import Review", href: "/admin/import-review", icon: ClipboardCheck },
        { label: "Price Tracker", href: "/admin/price-tracker", icon: TrendingUp },
      ]
    },
    {
      title: "Users",
      items: [
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "Comments", href: "/admin/comments", icon: MessageSquare },
        { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
      ]
    },
    {
      title: "Website",
      items: [
        { label: "Homepage", href: "/admin/homepage", icon: Home },
        { label: "SEO", href: "/admin/seo", icon: Search },
        { label: "Settings", href: "/admin/settings", icon: Settings },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-slate-50/50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 font-sans">
      {/* Admin Sidebar */}
      <aside className="w-68 border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 backdrop-blur-xl flex flex-col hidden md:flex shrink-0">
        <div className="h-20 flex items-center gap-2.5 px-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-brand-600 dark:bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <Link href="/admin" className="text-lg font-black tracking-tighter text-brand-600 dark:text-brand-400 block leading-tight">
              smartXman
            </Link>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-350 uppercase tracking-widest leading-none">Admin Panel</span>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6 scrollbar-thin">
          {menuSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1.5">
              {section.title !== "Dashboard" && (
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3.5 mb-2">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item, idx) => (
                  <Link 
                    key={idx} 
                    href={item.href} 
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[14px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-brand-600 dark:hover:text-brand-400 transition-all duration-200"
                  >
                    <item.icon className="w-5 h-5 opacity-80" /> 
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-black uppercase text-sm border border-brand-200/20">
              {user.email?.charAt(0) || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-700 dark:text-slate-300 truncate">{user.email?.split("@")[0]}</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-350 truncate">{user.email}</p>
            </div>
          </div>
          <a href={storeUrl} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-center justify-center border border-transparent hover:border-red-200/30">
            <LogOut className="w-4 h-4" /> Exit Admin
          </a>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 backdrop-blur-xl flex items-center justify-between px-8 shrink-0">
          {/* Left: Mobile Nav toggle and Title */}
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
              <Menu className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </button>
            <div className="flex items-center gap-2">
              <Link href="/admin" className="text-sm font-semibold text-slate-500 dark:text-slate-350 hover:text-slate-700 dark:hover:text-white transition-colors">Admin</Link>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-400" />
              <span className="text-sm font-black text-slate-900 dark:text-white">Workspace</span>
            </div>
          </div>

          {/* Right: Theme Toggle, Notifications & Quick actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            <button className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all relative border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50">
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white dark:ring-slate-900"></span>
              <Bell className="w-5 h-5" />
            </button>
            
            <a 
              href={storeUrl} 
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl transition-all border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50"
            >
              View Site
            </a>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50/30 dark:bg-slate-950/20 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}

