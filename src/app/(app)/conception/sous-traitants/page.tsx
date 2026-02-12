"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  Phone,
  Mail,
  MapPin,
  Star,
  StarHalf,
  Truck,
  FileText,
  CheckCircle2,
  XCircle,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Subcontractor {
  id: string;
  name: string;
  siret: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  specialty: string;
  vehicleTypes: string[];
  zones: string[];
  rating: number;
  coursesAssigned: number;
  isActive: boolean;
  notes?: string;
  contractStart?: string;
  contractEnd?: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const initialSubcontractors: Subcontractor[] = [
  {
    id: "ST-001",
    name: "Trans Express SAS",
    siret: "123 456 789 00012",
    contact: "Jean Martin",
    phone: "01 23 45 67 89",
    email: "contact@transexpress.fr",
    address: "12 Rue de la Logistique",
    city: "Lyon",
    specialty: "Longue distance",
    vehicleTypes: ["Semi-remorque", "Caisse mobile"],
    zones: ["Rhône-Alpes", "Île-de-France", "PACA"],
    rating: 4.5,
    coursesAssigned: 23,
    isActive: true,
    contractStart: "2024-01-01",
    contractEnd: "2025-12-31",
    notes: "Partenaire fiable, ponctualité excellente.",
  },
  {
    id: "ST-002",
    name: "RapidFret SARL",
    siret: "987 654 321 00034",
    contact: "Marie Dupont",
    phone: "04 56 78 90 12",
    email: "direction@rapidfret.fr",
    address: "8 Avenue du Transport",
    city: "Paris",
    specialty: "Express & urbain",
    vehicleTypes: ["VL", "Caisse mobile"],
    zones: ["Île-de-France", "Nord"],
    rating: 4.2,
    coursesAssigned: 15,
    isActive: true,
    contractStart: "2024-03-01",
    contractEnd: "2026-02-28",
  },
  {
    id: "ST-003",
    name: "EcoTransport & Co",
    siret: "456 789 012 00056",
    contact: "Pierre Durand",
    phone: "06 12 34 56 78",
    email: "info@ecotransport.fr",
    address: "25 Boulevard Vert",
    city: "Marseille",
    specialty: "Frigo & ADR",
    vehicleTypes: ["Frigo", "ADR", "Semi-remorque"],
    zones: ["PACA", "Occitanie", "Rhône-Alpes"],
    rating: 4.8,
    coursesAssigned: 31,
    isActive: true,
    contractStart: "2023-06-01",
    contractEnd: "2025-05-31",
    notes: "Spécialiste chaîne du froid, habilitations ADR complètes.",
  },
  {
    id: "ST-004",
    name: "ProLog SAS",
    siret: "321 654 987 00078",
    contact: "Sophie Bernard",
    phone: "02 34 56 78 90",
    email: "commercial@prolog.fr",
    address: "3 Impasse des Entrepôts",
    city: "Lille",
    specialty: "Polyvalent",
    vehicleTypes: ["Semi-remorque", "SPL", "VL"],
    zones: ["Nord", "Île-de-France"],
    rating: 3.9,
    coursesAssigned: 8,
    isActive: true,
    contractStart: "2024-09-01",
    contractEnd: "2025-08-31",
  },
  {
    id: "ST-005",
    name: "NordTrans (désactivé)",
    siret: "654 321 098 00090",
    contact: "Luc Moreau",
    phone: "03 45 67 89 01",
    email: "luc@nordtrans.fr",
    address: "17 Rue du Rail",
    city: "Strasbourg",
    specialty: "Longue distance",
    vehicleTypes: ["Semi-remorque"],
    zones: ["Grand-Est", "Allemagne"],
    rating: 3.2,
    coursesAssigned: 0,
    isActive: false,
    notes: "Contrat suspendu suite à retards répétés.",
  },
];

const emptySubcontractor: Omit<Subcontractor, "id" | "coursesAssigned"> = {
  name: "",
  siret: "",
  contact: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  specialty: "",
  vehicleTypes: [],
  zones: [],
  rating: 3,
  isActive: true,
  notes: "",
  contractStart: "",
  contractEnd: "",
};

// ─── Stars Component ────────────────────────────────────────────────────────

function RatingStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < fullStars) return <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />;
        if (i === fullStars && hasHalf) return <StarHalf key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />;
        return <Star key={i} className="h-3.5 w-3.5 text-slate-300" />;
      })}
      <span className="text-xs text-muted-foreground ml-1">({rating})</span>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function SousTraitantsPage() {
  const { toast } = useToast();
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>(initialSubcontractors);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSpecialty, setFilterSpecialty] = useState("all");
  
  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSubcontractor, setEditingSubcontractor] = useState<Subcontractor | null>(null);
  const [formData, setFormData] = useState(emptySubcontractor);

  // Derived
  const specialties = useMemo(() => 
    Array.from(new Set(subcontractors.map(s => s.specialty))).sort(),
    [subcontractors]
  );

  const filteredSubcontractors = useMemo(() => {
    let filtered = subcontractors;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.contact.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.siret.includes(q)
      );
    }
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(s => filterStatus === "active" ? s.isActive : !s.isActive);
    }
    
    if (filterSpecialty !== "all") {
      filtered = filtered.filter(s => s.specialty === filterSpecialty);
    }
    
    return filtered.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return b.rating - a.rating;
    });
  }, [subcontractors, searchQuery, filterStatus, filterSpecialty]);

  const stats = useMemo(() => ({
    total: subcontractors.length,
    active: subcontractors.filter(s => s.isActive).length,
    totalCourses: subcontractors.reduce((sum, s) => sum + s.coursesAssigned, 0),
    avgRating: +(subcontractors.filter(s => s.isActive).reduce((sum, s) => sum + s.rating, 0) / subcontractors.filter(s => s.isActive).length).toFixed(1),
  }), [subcontractors]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleCreate = () => {
    setEditingSubcontractor(null);
    setFormData(emptySubcontractor);
    setEditDialogOpen(true);
  };

  const handleEdit = (sc: Subcontractor) => {
    setEditingSubcontractor(sc);
    setFormData({
      name: sc.name,
      siret: sc.siret,
      contact: sc.contact,
      phone: sc.phone,
      email: sc.email,
      address: sc.address,
      city: sc.city,
      specialty: sc.specialty,
      vehicleTypes: sc.vehicleTypes,
      zones: sc.zones,
      rating: sc.rating,
      isActive: sc.isActive,
      notes: sc.notes,
      contractStart: sc.contractStart,
      contractEnd: sc.contractEnd,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (sc: Subcontractor) => {
    setEditingSubcontractor(sc);
    setDeleteDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.siret) {
      toast({ title: "Erreur", description: "Le nom et le SIRET sont obligatoires.", variant: "destructive" });
      return;
    }

    if (editingSubcontractor) {
      // Update
      setSubcontractors(prev => prev.map(s => 
        s.id === editingSubcontractor.id 
          ? { ...s, ...formData }
          : s
      ));
      toast({ title: "Sous-traitant modifié", description: `${formData.name} a été mis à jour.` });
    } else {
      // Create
      const newId = `ST-${String(subcontractors.length + 1).padStart(3, '0')}`;
      setSubcontractors(prev => [...prev, {
        ...formData,
        id: newId,
        coursesAssigned: 0,
      } as Subcontractor]);
      toast({ title: "Sous-traitant créé", description: `${formData.name} a été ajouté à la liste.` });
    }

    setEditDialogOpen(false);
  };

  const handleConfirmDelete = () => {
    if (editingSubcontractor) {
      setSubcontractors(prev => prev.filter(s => s.id !== editingSubcontractor.id));
      toast({ title: "Sous-traitant supprimé", description: `${editingSubcontractor.name} a été supprimé.` });
    }
    setDeleteDialogOpen(false);
  };

  const toggleVehicleType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(type)
        ? prev.vehicleTypes.filter(t => t !== type)
        : [...prev.vehicleTypes, type],
    }));
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-headline">Sous-traitants</h1>
          <p className="text-xs text-muted-foreground">
            Gestion des partenaires sous-traitants pour l&apos;affectation des courses
          </p>
        </div>
        <Button size="sm" className="h-8 text-xs" onClick={handleCreate}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Nouveau sous-traitant
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="border-sky-200 bg-sky-50/50">
          <CardContent className="px-4 py-3 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-sky-600" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-sky-600 font-medium">Total</p>
              <p className="text-xl font-bold text-sky-700">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="px-4 py-3 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-emerald-600 font-medium">Actifs</p>
              <p className="text-xl font-bold text-emerald-700">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="px-4 py-3 flex items-center gap-3">
            <Package className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-amber-600 font-medium">Courses affectées</p>
              <p className="text-xl font-bold text-amber-700">{stats.totalCourses}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-violet-200 bg-violet-50/50">
          <CardContent className="px-4 py-3 flex items-center gap-3">
            <Star className="h-5 w-5 text-violet-600" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-violet-600 font-medium">Note moyenne</p>
              <p className="text-xl font-bold text-violet-700">{stats.avgRating}/5</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, contact, ville, SIRET..."
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="inactive">Inactifs</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes spécialités</SelectItem>
            {specialties.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-380px)]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="text-xs h-8">Nom</TableHead>
                  <TableHead className="text-xs h-8">Contact</TableHead>
                  <TableHead className="text-xs h-8">Ville</TableHead>
                  <TableHead className="text-xs h-8">Spécialité</TableHead>
                  <TableHead className="text-xs h-8">Véhicules</TableHead>
                  <TableHead className="text-xs h-8">Note</TableHead>
                  <TableHead className="text-xs h-8">Courses</TableHead>
                  <TableHead className="text-xs h-8">Statut</TableHead>
                  <TableHead className="text-xs h-8 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubcontractors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-sm text-muted-foreground">
                      Aucun sous-traitant trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubcontractors.map(sc => (
                    <TableRow key={sc.id} className={cn("cursor-pointer hover:bg-muted/50", !sc.isActive && "opacity-60")}>
                      <TableCell className="py-2">
                        <div>
                          <p className="text-xs font-semibold">{sc.name}</p>
                          <p className="text-[10px] text-muted-foreground">{sc.siret}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="space-y-0.5">
                          <p className="text-xs">{sc.contact}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5" />{sc.phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-xs">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />{sc.city}
                        </span>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="secondary" className="text-[10px]">{sc.specialty}</Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-wrap gap-0.5">
                          {sc.vehicleTypes.map(vt => (
                            <Badge key={vt} variant="outline" className="text-[9px] h-4">{vt}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <RatingStars rating={sc.rating} />
                      </TableCell>
                      <TableCell className="py-2 text-xs font-medium">{sc.coursesAssigned}</TableCell>
                      <TableCell className="py-2">
                        {sc.isActive ? (
                          <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200">Actif</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Inactif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(sc)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600" onClick={() => handleDelete(sc)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ─── Edit/Create Dialog ─── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingSubcontractor ? `Modifier: ${editingSubcontractor.name}` : "Nouveau sous-traitant"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingSubcontractor ? "Modifiez les informations du sous-traitant." : "Remplissez les informations pour créer un nouveau partenaire."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Raison sociale *</Label>
                <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Nom de l'entreprise" className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">SIRET *</Label>
                <Input value={formData.siret} onChange={(e) => setFormData(prev => ({ ...prev, siret: e.target.value }))} placeholder="XXX XXX XXX XXXXX" className="h-8 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Contact principal</Label>
                <Input value={formData.contact} onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))} placeholder="Nom du contact" className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Téléphone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="01 23 45 67 89" className="h-8 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="contact@example.fr" className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ville</Label>
                <Input value={formData.city} onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} placeholder="Ville" className="h-8 text-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Adresse</Label>
              <Input value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} placeholder="Adresse complète" className="h-8 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Spécialité</Label>
                <Select value={formData.specialty} onValueChange={(v) => setFormData(prev => ({ ...prev, specialty: v }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Longue distance">Longue distance</SelectItem>
                    <SelectItem value="Express & urbain">Express & urbain</SelectItem>
                    <SelectItem value="Frigo & ADR">Frigo & ADR</SelectItem>
                    <SelectItem value="Polyvalent">Polyvalent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Note (/5)</Label>
                <Select value={String(formData.rating)} onValueChange={(v) => setFormData(prev => ({ ...prev, rating: parseFloat(v) }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(r => (
                      <SelectItem key={r} value={String(r)}>{r}/5</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Types de véhicules</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {["Semi-remorque", "Caisse mobile", "Frigo", "ADR", "SPL", "VL"].map(type => (
                  <div key={type} className="flex items-center gap-1.5">
                    <Checkbox
                      checked={formData.vehicleTypes.includes(type)}
                      onCheckedChange={() => toggleVehicleType(type)}
                    />
                    <Label className="text-xs cursor-pointer">{type}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Début contrat</Label>
                <Input type="date" value={formData.contractStart || ""} onChange={(e) => setFormData(prev => ({ ...prev, contractStart: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fin contrat</Label>
                <Input type="date" value={formData.contractEnd || ""} onChange={(e) => setFormData(prev => ({ ...prev, contractEnd: e.target.value }))} className="h-8 text-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea value={formData.notes || ""} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Notes internes..." className="text-sm min-h-[60px]" />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox checked={formData.isActive} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))} />
              <Label className="text-xs cursor-pointer">Sous-traitant actif</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={handleSave}>
              {editingSubcontractor ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ─── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce sous-traitant ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de supprimer <strong>{editingSubcontractor?.name}</strong>.
              {(editingSubcontractor?.coursesAssigned || 0) > 0 && (
                <> Ce sous-traitant a actuellement <strong>{editingSubcontractor?.coursesAssigned} courses affectées</strong>. Elles devront être réaffectées.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-rose-600 hover:bg-rose-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
