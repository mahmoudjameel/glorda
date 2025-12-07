import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Notification {
  id: number;
  recipientType: string;
  recipientId: number | null;
  title: string;
  body: string;
  actionType: string;
  actionRef: Record<string, any> | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

interface NotificationBellProps {
  role: "merchant" | "admin";
}

export default function NotificationBell({ role }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const apiPrefix = role === "admin" ? "/api/admin" : "/api/merchant";

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications", role],
    queryFn: async () => {
      const res = await fetch(`${apiPrefix}/notifications`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["notifications-count", role],
    queryFn: async () => {
      const res = await fetch(`${apiPrefix}/notifications/unread-count`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch count");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const unreadCount = unreadData?.count || 0;

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await fetch(`${apiPrefix}/notifications/${notificationId}/read`, {
        method: "PATCH",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", role] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count", role] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await fetch(`${apiPrefix}/notifications/read-all`, {
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", role] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count", role] });
    },
  });

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString("ar-SA");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="font-semibold text-sm">الإشعارات</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllReadMutation.mutate()}
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="h-3 w-3 ml-1" />
              قراءة الكل
            </Button>
          )}
        </div>
        
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            لا توجد إشعارات
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={cn(
                "flex flex-col items-start gap-1 p-3 cursor-pointer",
                !notification.isRead && "bg-primary/5"
              )}
              onClick={() => {
                if (!notification.isRead) {
                  markReadMutation.mutate(notification.id);
                }
              }}
              data-testid={`notification-item-${notification.id}`}
            >
              <div className="flex items-start justify-between w-full gap-2">
                <span className={cn(
                  "font-medium text-sm",
                  !notification.isRead && "text-primary"
                )}>
                  {notification.title}
                </span>
                {!notification.isRead && (
                  <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {notification.body}
              </p>
              <span className="text-xs text-muted-foreground/70">
                {formatTime(notification.createdAt)}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
