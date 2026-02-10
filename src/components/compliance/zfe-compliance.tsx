
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
import { ZfeComplianceData } from "@/lib/compliance-data";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface ZfeComplianceProps {
  data: ZfeComplianceData[];
}

const getStatusIcon = (status: 'Autorisé' | 'Restreint' | 'Interdit') => {
  switch (status) {
    case 'Autorisé': return <CheckCircle className="text-green-500" />;
    case 'Restreint': return <AlertTriangle className="text-yellow-500" />;
    case 'Interdit': return <XCircle className="text-red-500" />;
    default: return null;
  }
};

const getCritairBadgeVariant = (critair: number) => {
    if (critair <= 1) return 'secondary';
    if (critair <= 3) return 'outline';
    return 'destructive';
}

export function ZfeCompliance({ data }: ZfeComplianceProps) {

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Véhicule</TableHead>
          <TableHead>Crit'Air</TableHead>
          <TableHead>Énergie</TableHead>
          <TableHead className="text-center">ZFE Paris</TableHead>
          <TableHead className="text-center">ZFE Lyon</TableHead>
          <TableHead className="text-center">ZFE Marseille</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((vehicle) => (
          <TableRow key={vehicle.vin}>
            <TableCell className="font-medium">{vehicle.immatriculation}</TableCell>
            <TableCell>
                <Badge variant={getCritairBadgeVariant(vehicle.critair)}>
                    Crit'Air {vehicle.critair}
                </Badge>
            </TableCell>
            <TableCell>{vehicle.energie}</TableCell>
            <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                    {getStatusIcon(vehicle.zfeStatus.paris)}
                    <span>{vehicle.zfeStatus.paris}</span>
                </div>
            </TableCell>
            <TableCell className="text-center">
                 <div className="flex items-center justify-center gap-2">
                    {getStatusIcon(vehicle.zfeStatus.lyon)}
                    <span>{vehicle.zfeStatus.lyon}</span>
                </div>
            </TableCell>
            <TableCell className="text-center">
                 <div className="flex items-center justify-center gap-2">
                    {getStatusIcon(vehicle.zfeStatus.marseille)}
                    <span>{vehicle.zfeStatus.marseille}</span>
                </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
