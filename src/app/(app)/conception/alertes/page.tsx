"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  AlertTriangle,
  AlertCircle,
  Info,
  Shield,
  Clock,
  Truck,
  Users,
  Fuel,
  Zap,
  Settings,
  Trash2,
  Edit,
  CheckCircle2,
  Target,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AlertRule {
  id: string;
  name: string;
  category: "amplitude" | "energy" | "competence" | "availability" | "placement" | "custom";
  severity: "critical" | "warning" | "info";
  isActive: boolean;
  condition: string;
  threshold: number;
  tolerance: number; // % of tolerance before alert fires
  targetDate?: string; // Date by which tolerance should reach 0
  description: string;
  affectedCount: number; // Current violations
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const initialRules: AlertRule[] = [
  {
    id: "AR-001",
    name: "Amplitude maximale dépassée",
    category: "amplitude",
    severity: "critical",
    isActive: true,
    condition: "Conducteur dépasse l'amplitude journalière autorisée",
    threshold: 12,
    tolerance: 0,
    targetDate: "2026-03-01",
    description: "Alerte critique quand un conducteur est planifié au-delà de 12h d'amplitude.",
    affectedCount: 4,
  },
  {
    id: "AR-002",
    name: "Transition énergie Gaz ↔ Gasoil",
    category: "energy",
    severity: "warning",
    isActive: true,
    condition: "Un véhicule Gaz est affecté à une course nécessitant du Gasoil (ou inversement)",
    threshold: 0,
    tolerance: 15,
    targetDate: "2026-06-01",
    description: "Surveille les changements non conformes de type d'énergie. Tolérance de 15% autorisée jusqu'au 01/06.",
    affectedCount: 7,
  },
  {
    id: "AR-003",
    name: "Formation ADR manquante",
    category: "competence",
    severity: "critical",
    isActive: true,
    condition: "Conducteur sans habilitation ADR sur une course ADR",
    threshold: 0,
    tolerance: 0,
    description: "Aucune tolérance : un conducteur ADR doit obligatoirement être habilité.",
    affectedCount: 1,
  },
  {
    id: "AR-004",
    name: "Véhicule indisponible planifié",
    category: "availability",
    severity: "critical",
    isActive: true,
    condition: "Véhicule en maintenance/panne affecté à une course",
    threshold: 0,
    tolerance: 0,
    description: "Détection de véhicules indisponibles qui sont pourtant planifiés.",
    affectedCount: 3,
  },
  {
    id: "AR-005",
    name: "Taux de placement inférieur à l'objectif",
    category: "placement",
    severity: "warning",
    isActive: true,
    condition: "Le taux de placement global est inférieur au seuil",
    threshold: 80,
    tolerance: 10,
    targetDate: "2026-04-01",
    description: "Alerte quand le taux de placement descend en-dessous de 80%. Tolérance de 10% pendant la montée en charge.",
    affectedCount: 0,
  },
  {
    id: "AR-006",
    name: "Habilitation sûreté expirée",
    category: "competence",
    severity: "warning",
    isActive: true,
    condition: "Habilitation sûreté expirée ou expirant dans 30 jours",
    threshold: 30,
    tolerance: 0,
    description: "Conducteurs avec habilitation sûreté expirant dans les 30 prochains jours.",
    affectedCount: 2,
  },
  {
    id: "AR-007",
    name: "Amplitude minimale non atteinte",
    category: "amplitude",
    severity: "info",
    isActive: false,
    condition: "Conducteur planifié en-dessous de l'amplitude minimale recommandée",
    threshold: 6,
    tolerance: 20,
    description: "Information quand un conducteur est sous-utilisé (< 6h planifiées). Tolérance élevée.",
    affectedCount: 0,
  },
  {
    id: "AR-008",
    name: "Course sensible sans conducteur dédié",
    category: "custom",
    severity: "warning",
    isActive: true,
    condition: "Course marquée sensible sans conducteur habituel",
    threshold: 0,
    tolerance: 5,
    description: "Les courses sensibles doivent être affectées à un conducteur connu. Tolérance de 5% pour les nouveaux clients.",
    affectedCount: 5,
  },
];

const categoryLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  amplitude: { label: "Amplitude", icon: Clock, color: "sky" },
  energy: { label: "Énergie", icon: Fuel, color: "emerald" },
  competence: { label: "Compétence", icon: Shield, color: "violet" },
  availability: { label: "Disponibilité", icon: Truck, color: "amber" },
  placement: { label: "Placement", icon: Target, color: "rose" },
  custom: { label: "Personnalisée", icon: Settings, color: "slate" },
};

const severityLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  critical: { label: "Critique", icon: AlertTriangle, color: "rose" },
  warning: { label: "Warning", icon: AlertCircle, color: "amber" },
  info: { label: "Info", icon: Info, color: "sky" },
};

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AlertRulesPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState<AlertRule[]>(initialRules);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<AlertRule["category"]>("custom");
  const [formSeverity, setFormSeverity] = useState<AlertRule["severity"]>("warning");
  const [formCondition, setFormCondition] = useState("");
  const [formThreshold, setFormThreshold] = useState(0);
  const [formTolerance, setFormTolerance] = useState(0);
  const [formTargetDate, setFormTargetDate] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const filteredRules = rules
    .filter(r => filterCategory === "all" || r.category === filterCategory)
    .filter(r => filterSeverity === "all" || r.severity === filterSeverity)
    .sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

  const stats = {
    total: rules.length,
    active: rules.filter(r => r.isActive).length,
    critical: rules.filter(r => r.isActive && r.severity === "critical").length,
    totalViolations: rules.filter(r => r.isActive).reduce((sum, r) => sum + r.affectedCount, 0),
  };

  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, isActive: !r.isActive } : r));
    const rule = rules.find(r => r.id === ruleId);
    toast({
      title: rule?.isActive ? "Règle désactivée" : "Règle activée",
      description: rule?.name,
    });
  };

  const handleEdit = (rule: AlertRule) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormCategory(rule.category);
    setFormSeverity(rule.severity);
    setFormCondition(rule.condition);
    setFormThreshold(rule.threshold);
    setFormTolerance(rule.tolerance);
    setFormTargetDate(rule.targetDate || "");
    setFormDescription(rule.description);
    setEditDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingRule(null);
    setFormName("");
    setFormCategory("custom");
    setFormSeverity("warning");
    setFormCondition("");
    setFormThreshold(0);
    setFormTolerance(0);
    setFormTargetDate("");
    setFormDescription("");
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName) {
      toast({ title: "Erreur", description: "Le nom est obligatoire.", variant: "destructive" });
      return;
    }

    if (editingRule) {
      setRules(prev => prev.map(r => r.id === editingRule.id ? {
        ...r,
        name: formName,
        category: formCategory,
        severity: formSeverity,
        condition: formCondition,
        threshold: formThreshold,
        tolerance: formTolerance,
        targetDate: formTargetDate || undefined,
        description: formDescription,
      } : r));
      toast({ title: "Règle modifiée", description: formName });
    } else {
      const newRule: AlertRule = {
        id: `AR-${String(rules.length + 1).padStart(3, '0')}`,
        name: formName,
        category: formCategory,
        severity: formSeverity,
        isActive: true,
        condition: formCondition,
        threshold: formThreshold,
        tolerance: formTolerance,
        targetDate: formTargetDate || undefined,
        description: formDescription,
        affectedCount: 0,
      };
      setRules(prev => [...prev, newRule]);
      toast({ title: "Règle créée", description: formName });
    }
    setEditDialogOpen(false);
  };

  const handleDelete = (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    setRules(prev => prev.filter(r => r.id !== ruleId));
    toast({ title: "Règle supprimée", description: rule?.name });
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-headline">Règles d&apos;alertes</h1>
          <p className="text-xs text-muted-foreground">
            Configuration des alertes paramétrables avec objectifs et tolérances
          </p>
        </div>
        <Button size="sm" className="h-8 text-xs" onClick={handleCreate}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Nouvelle règle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="border-sky-200 bg-sky-50/50">
          <CardContent className="px-4 py-3 flex items-center gap-3">
            <Settings className="h-5 w-5 text-sky-600" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-sky-600 font-medium">Règles totales</p>
              <p className="text-xl font-bold text-sky-700">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="px-4 py-3 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-emerald-600 font-medium">Actives</p>
              <p className="text-xl font-bold text-emerald-700">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-rose-600 font-medium">Critiques</p>
              <p className="text-xl font-bold text-rose-700">{stats.critical}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="px-4 py-3 flex items-center gap-3">
            <TrendingDown className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-amber-600 font-medium">Violations actives</p>
              <p className="text-xl font-bold text-amber-700">{stats.totalViolations}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {Object.entries(categoryLabels).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous niveaux</SelectItem>
            <SelectItem value="critical">Critique</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rules Table */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-380px)]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="text-xs h-8 w-12">Actif</TableHead>
                  <TableHead className="text-xs h-8">Règle</TableHead>
                  <TableHead className="text-xs h-8">Catégorie</TableHead>
                  <TableHead className="text-xs h-8">Sévérité</TableHead>
                  <TableHead className="text-xs h-8">Seuil</TableHead>
                  <TableHead className="text-xs h-8">Tolérance</TableHead>
                  <TableHead className="text-xs h-8">Date objectif</TableHead>
                  <TableHead className="text-xs h-8">Violations</TableHead>
                  <TableHead className="text-xs h-8 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.map(rule => {
                  const cat = categoryLabels[rule.category];
                  const sev = severityLabels[rule.severity];
                  const CatIcon = cat.icon;
                  const SevIcon = sev.icon;

                  return (
                    <TableRow key={rule.id} className={cn(!rule.isActive && "opacity-50")}>
                      <TableCell className="py-2">
                        <Switch checked={rule.isActive} onCheckedChange={() => handleToggleRule(rule.id)} />
                      </TableCell>
                      <TableCell className="py-2">
                        <div>
                          <p className="text-xs font-semibold">{rule.name}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{rule.condition}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <CatIcon className="h-3 w-3" /> {cat.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge
                          className={cn("text-[10px] gap-1",
                            rule.severity === "critical" ? "bg-rose-100 text-rose-700 border-rose-200" :
                            rule.severity === "warning" ? "bg-amber-100 text-amber-700 border-amber-200" :
                            "bg-sky-100 text-sky-700 border-sky-200"
                          )}
                        >
                          <SevIcon className="h-3 w-3" /> {sev.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-xs font-mono">
                        {rule.threshold > 0 ? rule.threshold : "—"}
                      </TableCell>
                      <TableCell className="py-2">
                        {rule.tolerance > 0 ? (
                          <div className="flex items-center gap-1">
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${rule.tolerance}%` }}
                              />
                            </div>
                            <span className="text-xs">{rule.tolerance}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">0%</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-xs">
                        {rule.targetDate || "—"}
                      </TableCell>
                      <TableCell className="py-2">
                        {rule.affectedCount > 0 ? (
                          <Badge variant="destructive" className="text-[10px]">
                            {rule.affectedCount}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">0</Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(rule)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600" onClick={() => handleDelete(rule.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingRule ? `Modifier: ${editingRule.name}` : "Nouvelle règle d'alerte"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configurez les paramètres de la règle et ses seuils de tolérance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nom de la règle *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Amplitude maximale" className="h-8 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Catégorie</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v as AlertRule["category"])}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sévérité</Label>
                <Select value={formSeverity} onValueChange={(v) => setFormSeverity(v as AlertRule["severity"])}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critique</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Condition</Label>
              <Input value={formCondition} onChange={(e) => setFormCondition(e.target.value)} placeholder="Décrivez la condition qui déclenche l'alerte" className="h-8 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Seuil (valeur numérique)</Label>
                <Input type="number" value={formThreshold} onChange={(e) => setFormThreshold(Number(e.target.value))} className="h-8 text-sm" min="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tolérance (%)</Label>
                <Input type="number" value={formTolerance} onChange={(e) => setFormTolerance(Number(e.target.value))} className="h-8 text-sm" min="0" max="100" />
                <p className="text-[10px] text-muted-foreground">0% = aucune tolérance (alerte immédiate)</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Date objectif (tolérance → 0%)</Label>
              <Input type="date" value={formTargetDate} onChange={(e) => setFormTargetDate(e.target.value)} className="h-8 text-sm" />
              <p className="text-[10px] text-muted-foreground">Date à laquelle la tolérance doit atteindre 0%</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Description détaillée de la règle" className="h-8 text-sm" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={handleSave}>
              {editingRule ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
