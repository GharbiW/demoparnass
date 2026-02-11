
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Award, ArrowUpDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "../ui/button";

type Driver = {
    id: string | number;
    name: string;
    site: string;
    scoreSecurite?: number;
    scoreEco?: number;
};

interface LeaderboardTableProps {
  drivers: Driver[];
}

type SortKey = 'scoreSecurite' | 'scoreEco';

const getMedal = (rank: number) => {
    if (rank === 1) return <Award className="text-amber-400" />;
    if (rank === 2) return <Award className="text-slate-400" />;
    if (rank === 3) return <Award className="text-amber-600" />;
    return <span className="w-5 text-center">{rank}</span>;
}

export function LeaderboardTable({ drivers }: LeaderboardTableProps) {
    const [sortConfig, setSortConfig] = useState<{key: SortKey, direction: 'asc' | 'desc'}>({key: 'scoreSecurite', direction: 'desc'});
    
    const sortedDrivers = [...drivers].sort((a, b) => {
        const aVal = a[sortConfig.key] ?? 0;
        const bVal = b[sortConfig.key] ?? 0;
        if (aVal < bVal) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    }

  return (
    <Tabs defaultValue="scoreSecurite" onValueChange={(value) => requestSort(value as SortKey)}>
        <TabsList>
            <TabsTrigger value="scoreSecurite">Sécurité</TabsTrigger>
            <TabsTrigger value="scoreEco">Éco-conduite</TabsTrigger>
        </TabsList>
         <Table className="mt-4">
            <TableHeader>
                <TableRow>
                <TableHead className="w-[80px]">Rang</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Site</TableHead>
                <TableHead className="text-right">
                    <Button variant="ghost" onClick={() => requestSort(sortConfig.key)}>
                        Score
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedDrivers.map((driver, index) => (
                    <TableRow key={driver.id}>
                        <TableCell className="font-medium flex items-center justify-center">
                            {getMedal(index + 1)}
                        </TableCell>
                        <TableCell>{driver.name}</TableCell>
                        <TableCell>{driver.site}</TableCell>
                        <TableCell className="text-right">
                             <Badge variant={(driver[sortConfig.key] ?? 0) > 90 ? 'secondary' : 'outline'}>
                                {driver[sortConfig.key] ?? '-'}
                            </Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </Tabs>
  );
}
