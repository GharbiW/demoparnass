
"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Bell, User, Users } from "lucide-react";
import { communications } from "@/lib/communications-data";
import { Badge } from "@/components/ui/badge";

export function NotificationsSheet() {
  const [unreadCount, setUnreadCount] = useState(communications.length);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setUnreadCount(0);
    }
  };

  const getTargetIcon = (target: string) => {
    if (target === 'Tous' || target.startsWith('Site:')) return <Users className="h-4 w-4 text-muted-foreground" />
    return <User className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <Sheet onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {communications.map((comm) => (
            <div key={comm.id} className="rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
                <div className="flex justify-between items-start gap-2">
                    <p className="font-semibold text-sm">{comm.title}</p>
                    <Badge variant="outline">{comm.date}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{comm.content}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                    {getTargetIcon(comm.target)}
                    <span>{comm.target} • Par {comm.author}</span>
                </div>
            </div>
          ))}
           {communications.length === 0 && (
            <p className="text-center text-sm text-muted-foreground pt-10">
              Aucune nouvelle notification.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
