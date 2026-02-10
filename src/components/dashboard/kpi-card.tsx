import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { KpiCardProps } from "@/lib/types";
import { ArrowUp, ArrowDown } from "lucide-react";


export function KpiCard({ title, value, change, changeType, icon: Icon, description }: KpiCardProps) {
  const isIncrease = changeType === 'increase';
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
           <p className="text-xs text-muted-foreground flex items-center">
            <span className={cn("flex items-center", isIncrease ? "text-green-600" : "text-red-600")}>
              {isIncrease ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
              {change}
            </span>
            <span className="ml-1">par rapport à hier</span>
          </p>
        )}
        <CardDescription className="text-xs mt-2">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
