import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import type { RiskAlert } from "@shared/schema";

export default function TopBar() {
  const queryClient = useQueryClient();
  const { data: alerts } = useQuery<RiskAlert[]>({
    queryKey: ["/api/alerts"],
  });

  const unreadCount = alerts?.filter((alert: any) => !alert.isRead).length || 0;

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const markAlertRead = useMutation({
    mutationFn: async (id: number) => apiRequest("PATCH", `/api/alerts/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/alerts"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = (alerts || []).filter((a) => !a.isRead);
      await Promise.all(unread.map((a) => apiRequest("PATCH", `/api/alerts/${a.id}/read`)));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/alerts"] }),
  });

  const [theme, setTheme] = useState<string>(() => localStorage.getItem('theme') || 'system');

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effective = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
    root.classList.toggle('dark', effective === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <header className="sticky top-0 z-30 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">Churn Dashboard</h2>
          <Badge variant="outline" className="h-5 rounded-full border-border text-[11px] leading-none text-foreground/70">
            Live
          </Badge>
        </div>
        <div className="relative flex items-center gap-3" ref={dropdownRef}>
          <div className="mr-2">
            <label className="sr-only" htmlFor="theme-select">Theme</label>
            <select
              id="theme-select"
              className="rounded-md border border-border bg-background px-2 py-1 text-[12px] focus-visible:ring-2 focus-visible:ring-ring"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              aria-label="Theme"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <button
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-foreground/60 hover:text-foreground/90 hover:border-border"
            onClick={() => setIsOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={isOpen}
          >
            <span className="sr-only">Notifications</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                {unreadCount}
              </span>
            )}
          </button>
          {isOpen && (
            <div className="absolute right-0 top-10 z-40 w-80 rounded-md border border-border bg-background shadow-xl">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
                <p className="text-[12px] font-medium text-foreground/70">Notifications</p>
                <button
                  className="text-[11px] text-foreground/60 hover:text-foreground"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending || !unreadCount}
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {(alerts || []).slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-start gap-2 rounded-md border border-border/60 p-3 mb-2 last:mb-0">
                    <div className="mt-1 h-2 w-2 rounded-full" style={{ background: a.severity === 'critical' ? 'var(--danger)' : a.severity === 'high' ? 'var(--warning)' : 'var(--muted-foreground)' }} />
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-foreground">{a.title}</p>
                      <p className="text-[12px] text-foreground/70">{a.description}</p>
                      <p className="text-[11px] text-foreground/50 mt-1">{new Date(a.createdAt as any).toLocaleString()}</p>
                    </div>
                    {!a.isRead && (
                      <button
                        className="text-[11px] text-foreground/60 hover:text-foreground"
                        onClick={() => markAlertRead.mutate(a.id)}
                        disabled={markAlertRead.isPending}
                      >
                        Mark read
                      </button>
                    )}
                    {a.isRead && (
                      <span className="text-[11px] text-foreground/40">Read</span>
                    )}
                  </div>
                ))}
                {!(alerts || []).length && (
                  <p className="text-[12px] text-foreground/60 px-2 py-6 text-center">No notifications</p>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[13px] font-medium text-foreground">Sarah Chen</p>
              <p className="text-[11px] text-foreground/60">Customer Success</p>
            </div>
            <div className="h-8 w-8 rounded-md bg-muted" />
          </div>
        </div>
      </div>
    </header>
  );
}
