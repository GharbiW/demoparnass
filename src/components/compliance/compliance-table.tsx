
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ComplianceItem } from "@/lib/compliance-data";
import Link from "next/link";
import { useState } from "react";

interface ComplianceTableProps {
  data: ComplianceItem[];
  type: "driver" | "vehicle";
}

const getDaysUntil = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 3600 * 24));
};

const getStatusInfo = (days: number): { text: string; variant: "destructive" | "secondary" | "outline" } => {
  if (days <= 0) return { text: "Expiré", variant: "destructive" };
  if (days <= 7) return { text: `D-${days}`, variant: "destructive" };
  if (days <= 30) return { text: `D-${days}`, variant: "secondary" };
  return { text: "Valide", variant: "outline" };
};

export function ComplianceTable({ data, type }: ComplianceTableProps) {
    const [sortConfig, setSortConfig] = useState<{key: keyof ComplianceItem, direction: 'asc' | 'desc'} | null>({key: 'expiryDate', direction: 'asc'});
    
    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig) return 0;
        
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (sortConfig.key === 'expiryDate') {
            const aDays = getDaysUntil(aValue as string);
            const bDays = getDaysUntil(bValue as string);
            if (aDays < bDays) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aDays > bDays) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const requestSort = (key: keyof ComplianceItem) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Button variant="ghost" onClick={() => requestSort(type === 'driver' ? 'driverName' : 'vehicleId')}>
              {type === "driver" ? "Chauffeur" : "Véhicule"}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </TableHead>
          <TableHead>
             <Button variant="ghost" onClick={() => requestSort('documentType')}>
                Type Document
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </TableHead>
          <TableHead>
             <Button variant="ghost" onClick={() => requestSort('expiryDate')}>
                Date d'expiration
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((item) => {
          const daysUntil = getDaysUntil(item.expiryDate);
          const status = getStatusInfo(daysUntil);
          const link = type === 'driver' ? `/chauffeurs/${item.ownerId}` : `/vehicles/${item.ownerId}`;
          const ownerName = type === 'driver' ? item.driverName : item.vehicleId;

          return (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <Link href={link} className="hover:underline text-primary">
                    {ownerName}
                </Link>
                <p className="text-xs text-muted-foreground">{item.site}</p>
              </TableCell>
              <TableCell>{item.documentType}</TableCell>
              <TableCell>{item.expiryDate}</TableCell>
              <TableCell>
                <Badge variant={status.variant}>{status.text}</Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Voir le document</DropdownMenuItem>
                    <DropdownMenuItem>Uploader une nouvelle version</DropdownMenuItem>
                    <DropdownMenuItem>Créer une alerte</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
