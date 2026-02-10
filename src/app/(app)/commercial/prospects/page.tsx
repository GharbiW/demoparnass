
"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ListFilter, Search, MoreHorizontal, Phone, Mail, Bot, PlusCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { prospects as initialProspects, Prospect } from "@/lib/prospects-data";
import { ProspectEmailDialog } from "@/components/commercial/prospect-email-dialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";

export default function ProspectsPage() {
  const router = useRouter();
  const [prospects, setProspects] = React.useState<Prospect[]>(initialProspects);
  const [selectedProspects, setSelectedProspects] = React.useState<string[]>([]);
  const { toast } = useToast();
  
  // Filter states
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sourceFilter, setSourceFilter] = React.useState("all");
  const [industryFilter, setIndustryFilter] = React.useState("all");

  const uniqueStatuses = ["all", ...Array.from(new Set(initialProspects.map(p => p.status)))];
  const uniqueSources = ["all", ...Array.from(new Set(initialProspects.map(p => p.source)))];
  const uniqueIndustries = ["all", ...Array.from(new Set(initialProspects.map(p => p.industry)))];
  
  const filteredProspects = React.useMemo(() => {
    return prospects.filter(prospect => {
      const searchMatch = searchTerm === "" || 
        prospect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prospect.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prospect.email.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = statusFilter === "all" || prospect.status === statusFilter;
      const sourceMatch = sourceFilter === "all" || prospect.source === sourceFilter;
      const industryMatch = industryFilter === "all" || prospect.industry === industryFilter;
      
      return searchMatch && statusMatch && sourceMatch && industryMatch;
    });
  }, [prospects, searchTerm, statusFilter, sourceFilter, industryFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProspects(filteredProspects.map(p => p.id));
    } else {
      setSelectedProspects([]);
    }
  };

  const handleSelectRow = (prospectId: string, checked: boolean) => {
    if (checked) {
      setSelectedProspects(prev => [...prev, prospectId]);
    } else {
      setSelectedProspects(prev => prev.filter(id => id !== prospectId));
    }
  };

  const handleSendEmailClick = () => {
    if (selectedProspects.length > 0) {
      router.push('/commercial/campaigns/new'); // Redirect to new campaign page
    } else {
      toast({
        variant: "destructive",
        title: "Aucun prospect sélectionné",
        description: "Veuillez sélectionner au moins un prospect.",
      });
    }
  };

  const getStatusVariant = (status: Prospect['status']) => {
      switch(status) {
          case 'Nouveau': return 'default';
          case 'Contacté': return 'secondary';
          case 'En négociation': return 'outline';
          case 'Perdu': return 'destructive';
          default: return 'outline';
      }
  }

  return (
    <>
      <div className="flex flex-col h-full space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold font-headline">Prospection Commerciale</h1>
          <div className="flex items-center gap-2">
            <Button onClick={handleSendEmailClick}>
                <Bot className="mr-2"/> Créer une campagne
            </Button>
            <Button><PlusCircle className="mr-2"/> Ajouter un Prospect</Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <CardTitle>Liste des Prospects</CardTitle>
                    <CardDescription>Gérez vos leads et opportunités commerciales.</CardDescription>
                </div>
                 <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                    <div className="relative flex-grow md:flex-grow-0">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Rechercher..." className="pl-8 w-full md:w-48" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full md:w-[160px]"><SelectValue/></SelectTrigger>
                      <SelectContent>{uniqueStatuses.map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'Tous les statuts' : s}</SelectItem>)}</SelectContent>
                    </Select>
                     <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger className="w-full md:w-[160px]"><SelectValue/></SelectTrigger>
                      <SelectContent>{uniqueSources.map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'Toutes les sources' : s}</SelectItem>)}</SelectContent>
                    </Select>
                     <Select value={industryFilter} onValueChange={setIndustryFilter}>
                      <SelectTrigger className="w-full md:w-[160px]"><SelectValue/></SelectTrigger>
                      <SelectContent>{uniqueIndustries.map(i => <SelectItem key={i} value={i}>{i === 'all' ? 'Tous les secteurs' : i}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"><Checkbox onCheckedChange={handleSelectAll} checked={selectedProspects.length === filteredProspects.length && filteredProspects.length > 0} /></TableHead>
                  <TableHead>Nom & Société</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Secteur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProspects.map((prospect) => (
                  <TableRow key={prospect.id} data-state={selectedProspects.includes(prospect.id) && "selected"}>
                     <TableCell><Checkbox onCheckedChange={(checked) => handleSelectRow(prospect.id, !!checked)} checked={selectedProspects.includes(prospect.id)} /></TableCell>
                    <TableCell>
                      <div className="font-medium">{prospect.name}</div>
                      <div className="text-sm text-muted-foreground">{prospect.company} - {prospect.position}</div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2 text-sm"><Mail className="h-3 w-3"/>{prospect.email}</div>
                        <div className="flex items-center gap-2 text-sm"><Phone className="h-3 w-3"/>{prospect.phone}</div>
                    </TableCell>
                    <TableCell>{prospect.industry}</TableCell>
                    <TableCell><Badge variant={getStatusVariant(prospect.status)}>{prospect.status}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Convertir en Client</DropdownMenuItem>
                          <DropdownMenuItem>Planifier un appel</DropdownMenuItem>
                          <DropdownMenuItem>Marquer comme "Perdu"</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {filteredProspects.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>Aucun prospect ne correspond à vos critères.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
