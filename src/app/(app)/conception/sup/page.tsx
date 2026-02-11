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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Truck,
  User,
  Clock,
  MapPin,
  CalendarDays,
  Package,
  AlertTriangle,
  Shield,
  Zap,
  Send,
  FileText,
  Trash2,
  Copy,
  CheckCircle2,
  Building2,
  ArrowRight,
  Route,
  Calendar,
  Fuel,
  BadgeCheck,
  X,
  Sparkles,
  Eye,
  Edit,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Client list
const clients = [
  "CARREFOUR", "LECLERC", "INTERMARCHE", "SYSTEME U", "AMAZON", "DASSAULT",
  "MICHELIN", "NESTLE", "SANOFI", "LACTALIS", "DANONE", "AIRBUS",
  "LVMH", "PROCTER & GAMBLE", "SAFRAN", "SODEXO", "L'OREAL", "TOTALENERGIES",
];

const locations: Record<string, string[]> = {
  Lyon: ["Entrepôt Vénissieux", "Plateforme Lyon Nord", "Port de Lyon", "Hub Lyon Sud"],
  Paris: ["Entrepôt St-Quentin", "Plateforme Paris Sud", "CDG Hub", "Orly Hub"],
  Marseille: ["Port de Marseille", "Entrepôt Avignon", "Plateforme Miramas"],
  Nantes: ["Entrepôt Nantes", "Plateforme Rennes", "Port de St-Nazaire"],
  Lille: ["Entrepôt Lesquin", "Plateforme Dourges"],
  Bordeaux: ["Site de Mérignac", "Port de Bordeaux"],
  Strasbourg: ["Port de Strasbourg", "Entrepôt Reichstett"],
  Toulouse: ["Plateforme Eurocentre", "Aéroport de Blagnac"],
};

const allLocations = Object.values(locations).flat();
const vehicleTypes = ["Semi-remorque", "Caisse mobile", "Frigo", "ADR", "SPL", "VL"];
const driverTypes = ["CM", "Polyvalent", "SPL", "VL"];
const energyTypes = ["Diesel", "Gaz", "Électrique"];
const skillOptions = ["ADR", "Aéroportuaire", "Habilitation sûreté"];

type SupStop = {
  id: string;
  location: string;
  time: string;
  type: "chargement" | "livraison" | "étape";
};

type SupDraft = {
  id: string;
  client: string;
  reference: string;
  date: string;
  stops: SupStop[];
  vehicleType: string;
  vehicleEnergy: string;
  driverType: string;
  skills: string[];
  isSensitive: boolean;
  notes: string;
  status: "draft" | "submitted" | "validated";
  createdAt: string;
};

// Mock existing SUPs
const existingSups: SupDraft[] = [
  {
    id: "SUP-2024-001",
    client: "SANOFI",
    reference: "PRE-SUP-001",
    date: format(addDays(new Date(), 2), "yyyy-MM-dd"),
    stops: [
      { id: "s1", location: "CDG Hub", time: "06:00", type: "chargement" },
      { id: "s2", location: "Entrepôt Vénissieux", time: "12:00", type: "livraison" },
    ],
    vehicleType: "ADR",
    vehicleEnergy: "Diesel",
    driverType: "CM",
    skills: ["ADR"],
    isSensitive: true,
    notes: "Produits pharmaceutiques — température contrôlée requise",
    status: "submitted",
    createdAt: format(new Date(), "yyyy-MM-dd HH:mm"),
  },
  {
    id: "SUP-2024-002",
    client: "AMAZON",
    reference: "PRE-SUP-002",
    date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    stops: [
      { id: "s1", location: "Entrepôt St-Quentin", time: "04:00", type: "chargement" },
      { id: "s2", location: "Plateforme Dourges", time: "07:30", type: "étape" },
      { id: "s3", location: "Entrepôt Lesquin", time: "09:00", type: "livraison" },
    ],
    vehicleType: "Semi-remorque",
    vehicleEnergy: "Diesel",
    driverType: "Polyvalent",
    skills: [],
    isSensitive: false,
    notes: "",
    status: "validated",
    createdAt: format(addDays(new Date(), -1), "yyyy-MM-dd HH:mm"),
  },
  {
    id: "SUP-2024-003",
    client: "CARREFOUR",
    reference: "PRE-SUP-003",
    date: format(addDays(new Date(), 3), "yyyy-MM-dd"),
    stops: [
      { id: "s1", location: "Plateforme Lyon Nord", time: "08:00", type: "chargement" },
      { id: "s2", location: "Port de Marseille", time: "13:00", type: "livraison" },
    ],
    vehicleType: "Frigo",
    vehicleEnergy: "Diesel",
    driverType: "CM",
    skills: [],
    isSensitive: false,
    notes: "Produits frais — maintenir chaîne du froid",
    status: "draft",
    createdAt: format(new Date(), "yyyy-MM-dd HH:mm"),
  },
];

const statusConfig = {
  draft: { label: "Brouillon", color: "bg-slate-50 text-slate-600 border-slate-200" },
  submitted: { label: "Soumise", color: "bg-sky-50 text-sky-700 border-sky-200" },
  validated: { label: "Validée", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export default function SupPage() {
  const { toast } = useToast();
  const [sups, setSups] = useState<SupDraft[]>(existingSups);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [viewSup, setViewSup] = useState<SupDraft | null>(null);

  // Form state
  const [form, setForm] = useState({
    client: "",
    date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    vehicleType: "",
    vehicleEnergy: "",
    driverType: "",
    skills: [] as string[],
    isSensitive: false,
    notes: "",
  });
  const [stops, setStops] = useState<SupStop[]>([
    { id: "new-1", location: "", time: "", type: "chargement" },
    { id: "new-2", location: "", time: "", type: "livraison" },
  ]);

  const resetForm = () => {
    setForm({
      client: "",
      date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      vehicleType: "",
      vehicleEnergy: "",
      driverType: "",
      skills: [],
      isSensitive: false,
      notes: "",
    });
    setStops([
      { id: "new-1", location: "", time: "", type: "chargement" },
      { id: "new-2", location: "", time: "", type: "livraison" },
    ]);
  };

  const addStop = () => {
    setStops((prev) => [
      ...prev.slice(0, -1),
      { id: `new-${Date.now()}`, location: "", time: "", type: "étape" },
      prev[prev.length - 1],
    ]);
  };

  const removeStop = (id: string) => {
    if (stops.length <= 2) return;
    setStops((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStop = (id: string, field: keyof SupStop, value: string) => {
    setStops((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const toggleSkill = (skill: string) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleSubmit = (asDraft: boolean) => {
    const newSup: SupDraft = {
      id: `SUP-${new Date().getFullYear()}-${String(sups.length + 1).padStart(3, "0")}`,
      client: form.client,
      reference: `PRE-SUP-${String(sups.length + 1).padStart(3, "0")}`,
      date: form.date,
      stops,
      vehicleType: form.vehicleType,
      vehicleEnergy: form.vehicleEnergy,
      driverType: form.driverType,
      skills: form.skills,
      isSensitive: form.isSensitive,
      notes: form.notes,
      status: asDraft ? "draft" : "submitted",
      createdAt: format(new Date(), "yyyy-MM-dd HH:mm"),
    };
    setSups((prev) => [newSup, ...prev]);
    setIsCreateOpen(false);
    resetForm();
    toast({
      title: asDraft ? "Brouillon enregistré" : "SUP soumise",
      description: `${newSup.id} — ${form.client} — ${format(new Date(form.date), "dd MMM yyyy", { locale: fr })}`,
    });
  };

  // Stats
  const stats = {
    total: sups.length,
    drafts: sups.filter((s) => s.status === "draft").length,
    submitted: sups.filter((s) => s.status === "submitted").length,
    validated: sups.filter((s) => s.status === "validated").length,
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full space-y-4">
        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
              <Zap className="h-6 w-6 text-sky-500" />
              Créer un SUP
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Créer et gérer les prestations supplémentaires ponctuelles
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nouvelle SUP
          </Button>
        </div>

        {/* ─── Stats ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Total SUPs</p>
                <Package className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Brouillons</p>
                <Edit className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-2xl font-bold mt-1">{stats.drafts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Soumises</p>
                <Send className="h-4 w-4 text-sky-400" />
              </div>
              <p className="text-2xl font-bold mt-1 text-sky-600">{stats.submitted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Validées</p>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold mt-1 text-emerald-600">{stats.validated}</p>
            </CardContent>
          </Card>
        </div>

        {/* ─── SUP List ────────────────────────────────────────────────────── */}
        <Card className="flex-1 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">SUPs en cours</CardTitle>
            <CardDescription>Liste de toutes les prestations supplémentaires créées</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-400px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Trajet</TableHead>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Conducteur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sups.map((sup) => {
                    const sc = statusConfig[sup.status];
                    return (
                      <TableRow key={sup.id} className="group cursor-pointer hover:bg-muted/50" onClick={() => setViewSup(sup)}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-indigo-600">{sup.id}</span>
                            {sup.isSensitive && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Shield className="h-3.5 w-3.5 text-rose-500" />
                                </TooltipTrigger>
                                <TooltipContent>SUP sensible</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-sm">{sup.client}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <CalendarDays className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(sup.date), "dd MMM yyyy", { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <MapPin className="h-3 w-3 text-emerald-500" />
                            <span className="truncate max-w-[100px]">{sup.stops[0]?.location || "—"}</span>
                            {sup.stops.length > 2 && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                +{sup.stops.length - 2}
                              </Badge>
                            )}
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <MapPin className="h-3 w-3 text-rose-400" />
                            <span className="truncate max-w-[100px]">{sup.stops[sup.stops.length - 1]?.location || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <Truck className="h-3 w-3 text-muted-foreground" />
                            {sup.vehicleType}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {sup.driverType}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px]", sc.color)}>
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* ─── Create SUP Dialog ───────────────────────────────────────────── */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-sky-500" />
                Créer une prestation supplémentaire (SUP)
              </DialogTitle>
              <DialogDescription>
                Renseignez les détails de la prestation ponctuelle à planifier
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Client & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client *</Label>
                  <Select value={form.client} onValueChange={(v) => setForm({ ...form, client: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date d&apos;exécution *</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
              </div>

              {/* Trajet / Stops */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Route className="h-4 w-4 text-indigo-500" />
                    Trajet
                  </Label>
                  <Button variant="outline" size="sm" onClick={addStop} className="gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter une étape
                  </Button>
                </div>

                <div className="space-y-2">
                  {stops.map((stop, idx) => (
                    <div key={stop.id} className="flex items-center gap-3">
                      {/* Stop indicator */}
                      <div className="flex flex-col items-center w-8">
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                            idx === 0
                              ? "bg-emerald-100"
                              : idx === stops.length - 1
                                ? "bg-rose-100"
                                : "bg-slate-100"
                          )}
                        >
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              idx === 0
                                ? "bg-emerald-500"
                                : idx === stops.length - 1
                                  ? "bg-rose-500"
                                  : "bg-slate-400"
                            )}
                          />
                        </div>
                        {idx < stops.length - 1 && (
                          <div className="w-0.5 h-4 bg-slate-200 mt-0.5" />
                        )}
                      </div>

                      {/* Type */}
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] w-[85px] justify-center",
                          stop.type === "chargement" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                          stop.type === "livraison" && "bg-rose-50 text-rose-700 border-rose-200",
                          stop.type === "étape" && "bg-slate-50 text-slate-600 border-slate-200"
                        )}
                      >
                        {stop.type === "chargement" ? "Chargement" : stop.type === "livraison" ? "Livraison" : "Étape"}
                      </Badge>

                      {/* Location */}
                      <Select value={stop.location} onValueChange={(v) => updateStop(stop.id, "location", v)}>
                        <SelectTrigger className="flex-1 h-8 text-xs">
                          <SelectValue placeholder="Sélectionner un lieu" />
                        </SelectTrigger>
                        <SelectContent>
                          {allLocations.map((loc) => (
                            <SelectItem key={loc} value={loc} className="text-xs">{loc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Time */}
                      <Input
                        type="time"
                        value={stop.time}
                        onChange={(e) => updateStop(stop.id, "time", e.target.value)}
                        className="w-[110px] h-8 text-xs"
                      />

                      {/* Remove (only intermediary stops) */}
                      {idx > 0 && idx < stops.length - 1 && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeStop(stop.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      )}
                      {(idx === 0 || idx === stops.length - 1) && <div className="w-7" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Vehicle & Driver Requirements */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Type de véhicule *</Label>
                  <Select value={form.vehicleType} onValueChange={(v) => setForm({ ...form, vehicleType: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type véhicule" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Énergie</Label>
                  <Select value={form.vehicleEnergy} onValueChange={(v) => setForm({ ...form, vehicleEnergy: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Énergie" />
                    </SelectTrigger>
                    <SelectContent>
                      {energyTypes.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type de conducteur *</Label>
                  <Select value={form.driverType} onValueChange={(v) => setForm({ ...form, driverType: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type conducteur" />
                    </SelectTrigger>
                    <SelectContent>
                      {driverTypes.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Label>Compétences requises</Label>
                <div className="flex flex-wrap gap-2">
                  {skillOptions.map((skill) => (
                    <div key={skill} className="flex items-center gap-1.5">
                      <Checkbox
                        id={`skill-${skill}`}
                        checked={form.skills.includes(skill)}
                        onCheckedChange={() => toggleSkill(skill)}
                      />
                      <Label htmlFor={`skill-${skill}`} className="text-sm cursor-pointer">{skill}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sensitive & Notes */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sensitive"
                    checked={form.isSensitive}
                    onCheckedChange={(checked) => setForm({ ...form, isSensitive: !!checked })}
                  />
                  <Label htmlFor="sensitive" className="text-sm cursor-pointer flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-rose-500" />
                    Marquer comme sensible
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label>Notes / Instructions</Label>
                  <Textarea
                    placeholder="Instructions particulières pour cette prestation..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="h-20 text-sm"
                  />
                </div>
              </div>

              {/* AI Suggestion */}
              <Card className="bg-gradient-to-r from-indigo-50 to-sky-50 border-indigo-200">
                <CardContent className="p-3 flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-indigo-700">Suggestion IA</p>
                    <p className="text-xs text-indigo-600 mt-0.5">
                      Basé sur les SUPs similaires des 30 derniers jours, un conducteur CM avec véhicule Semi-remorque
                      est le plus souvent affecté pour ce type de trajet. Temps moyen : 4h30.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
                Annuler
              </Button>
              <Button variant="secondary" onClick={() => handleSubmit(true)} className="gap-1">
                <FileText className="h-3.5 w-3.5" />
                Enregistrer brouillon
              </Button>
              <Button onClick={() => handleSubmit(false)} className="gap-1">
                <Send className="h-3.5 w-3.5" />
                Soumettre la SUP
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── View SUP Detail Dialog ──────────────────────────────────────── */}
        <Dialog open={!!viewSup} onOpenChange={(open) => { if (!open) setViewSup(null); }}>
          <DialogContent className="max-w-lg">
            {viewSup && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-sky-500" />
                    {viewSup.id}
                    {viewSup.isSensitive && (
                      <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 text-xs">
                        <Shield className="h-3 w-3 mr-0.5" />
                        Sensible
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription>
                    Détails de la prestation supplémentaire
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Client</p>
                      <p className="font-medium">{viewSup.client}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-medium">{format(new Date(viewSup.date), "dd MMM yyyy", { locale: fr })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Type véhicule</p>
                      <p className="font-medium flex items-center gap-1"><Truck className="h-3 w-3 text-muted-foreground" />{viewSup.vehicleType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Type conducteur</p>
                      <p className="font-medium flex items-center gap-1"><User className="h-3 w-3 text-muted-foreground" />{viewSup.driverType}</p>
                    </div>
                  </div>

                  {/* Trajet */}
                  <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Trajet</p>
                    {viewSup.stops.map((stop, idx) => (
                      <div key={stop.id} className="flex items-center gap-2">
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                          idx === 0 ? "bg-emerald-100" : idx === viewSup.stops.length - 1 ? "bg-rose-100" : "bg-slate-200"
                        )}>
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            idx === 0 ? "bg-emerald-500" : idx === viewSup.stops.length - 1 ? "bg-rose-500" : "bg-slate-400"
                          )} />
                        </div>
                        <span className="text-sm font-medium">{stop.location}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{stop.time}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {stop.type === "chargement" ? "Chargement" : stop.type === "livraison" ? "Livraison" : "Étape"}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {viewSup.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <p className="text-xs text-muted-foreground w-full mb-1">Compétences</p>
                      {viewSup.skills.map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  )}

                  {viewSup.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="text-sm mt-0.5">{viewSup.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <Badge variant="outline" className={cn("text-xs", statusConfig[viewSup.status].color)}>
                        {statusConfig[viewSup.status].label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Créée le {viewSup.createdAt}
                    </p>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
