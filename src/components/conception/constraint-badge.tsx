
"use client";

import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConstraintLevel = 'info' | 'warning' | 'error';

interface ConstraintBadgeProps {
  level: ConstraintLevel;
  message: string;
  className?: string;
}

export function ConstraintBadge({ level, message, className }: ConstraintBadgeProps) {
  const variants = {
    info: {
      variant: 'secondary' as const,
      icon: Info,
      iconClass: 'text-blue-500',
    },
    warning: {
      variant: 'outline' as const,
      icon: AlertTriangle,
      iconClass: 'text-yellow-500',
    },
    error: {
      variant: 'destructive' as const,
      icon: AlertCircle,
      iconClass: 'text-red-500',
    },
  };

  const config = variants[level];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={cn("flex items-center gap-1 text-xs", className)}
    >
      <Icon className={cn("h-3 w-3", config.iconClass)} />
      <span>{message}</span>
    </Badge>
  );
}
