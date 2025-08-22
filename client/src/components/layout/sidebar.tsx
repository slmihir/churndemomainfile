import { Link, useLocation } from "wouter";

export default function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: "fas fa-tachometer-alt" },
    { path: "/playbooks", label: "Playbooks", icon: "fas fa-play-circle" },
    { path: "/analytics", label: "Analytics", icon: "fas fa-chart-line" },
    { path: "/customers", label: "Customers", icon: "fas fa-users" },
    { path: "/settings", label: "Settings", icon: "fas fa-cog" },
  ];

  return (
    <aside className="w-64 border-r border-border bg-sidebar-background dark:bg-[#0c0c0c] dark:text-white">
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-foreground flex items-center justify-center text-background text-[11px]">CG</div>
          <h1 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">ChurnGuard</h1>
        </div>
      </div>

      <nav className="mt-2">
        {navItems.map((item) => {
          const isActive = location === item.path || (item.path === "/" && location === "/dashboard");

          return (
            <Link key={item.path} href={item.path}>
              <div
                className={`group relative mx-2 my-1 flex items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground dark:bg-foreground/10 dark:text-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent dark:text-white/70 dark:hover:text-white dark:hover:bg-foreground/10"
                }`}
              >
                <span className="absolute left-0 top-1/2 hidden h-5 -translate-y-1/2 rounded-r-sm bg-foreground group-hover:block w-0.5" />
                <span className="inline-flex h-4 w-4 items-center justify-center">
                  <i className={`${item.icon} text-[12px]`}></i>
                </span>
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
