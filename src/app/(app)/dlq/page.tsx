
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ListFilter, MoreHorizontal, Search, RotateCw, Trash2, Eye } from "lucide-react";

const dlqMessages = [
  {
    id: "DLQ-MSG-001",
    signature: "Invalid_Date_Format",
    source: "AS24-CSV-Upload",
    firstSeen: "2024-07-31 09:15:23",
    count: 125,
    payloadPreview: `{"date": "31/07/2024", "amount": 123.45, ...}`,
  },
  {
    id: "DLQ-MSG-002",
    signature: "Unknown_VIN",
    source: "Telematics-API",
    firstSeen: "2024-07-31 08:55:01",
    count: 42,
    payloadPreview: `{"vin": "VIN-DOESNT-EXIST", "speed": 90, ...}`,
  },
  {
    id: "DLQ-MSG-003",
    signature: "Missing_Required_Field",
    source: "PASSalert-API",
    firstSeen: "2024-07-30 14:30:11",
    count: 12,
    payloadPreview: `{"driverId": "DRV-123", "alertType": "HARSH_BRAKING"}`,
  },
  {
    id: "DLQ-MSG-004",
    signature: "JSON_Parsing_Error",
    source: "AS24-CSV-Upload",
    firstSeen: "2024-07-31 10:05:00",
    count: 5,
    payloadPreview: `...ion": "Shell Paris", "litres": "180,5" ...`,
  },
];

export default function DLQPage() {
  return (
    <div className="flex flex-col h-full space-y-4">
      <h1 className="text-2xl font-bold font-headline">DLQ (Dead Letter Queue)</h1>
      <Card className="flex-grow">
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Console DLQ</CardTitle>
                    <CardDescription>Gérez les erreurs d'ingestion de données.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Rechercher signature..." className="pl-8 w-64" />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-1">
                                <ListFilter className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only">Filtres</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filtrer par</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked>Source: Toutes</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem>Date: 7 derniers jours</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" className="h-9 gap-1">
                        <RotateCw className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only">Tout Reprocesseur</span>
                    </Button>
                     <Button variant="destructive" size="sm" className="h-9 gap-1">
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only">Tout Purger</span>
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">
                            <Checkbox aria-label="Sélectionner tout" />
                        </TableHead>
                        <TableHead>Signature de l'Erreur</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Première Vue</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Aperçu du Payload</TableHead>
                        <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {dlqMessages.map(msg => (
                        <TableRow key={msg.id}>
                            <TableCell>
                                <Checkbox aria-label={`Sélectionner ${msg.id}`} />
                            </TableCell>
                            <TableCell className="font-medium">{msg.signature}</TableCell>
                            <TableCell><Badge variant="outline">{msg.source}</Badge></TableCell>
                            <TableCell>{msg.firstSeen}</TableCell>
                            <TableCell className="font-bold">{msg.count}</TableCell>
                            <TableCell>
                              <pre className="text-xs bg-muted p-2 rounded-md font-code overflow-x-auto">
                                <code>{msg.payloadPreview}</code>
                              </pre>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem><Eye className="mr-2"/> Voir détails</DropdownMenuItem>
                                        <DropdownMenuItem><RotateCw className="mr-2"/> Reprocesseur le groupe</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2"/> Purger le groupe</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
