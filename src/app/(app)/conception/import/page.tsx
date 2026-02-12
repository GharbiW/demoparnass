"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Package,
  Truck,
  Users,
  Route,
  Info,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ImportTemplate {
  id: string;
  name: string;
  description: string;
  type: "plan_a" | "plan_b" | "custom";
  client: string;
  coursesCount: number;
  tourneesCount: number;
  week: string;
  lastUsed?: string;
}

interface ValidationResult {
  field: string;
  status: "valid" | "warning" | "error";
  message: string;
  count: number;
}

interface ImportStep {
  step: number;
  label: string;
  status: "pending" | "active" | "completed" | "error";
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const templates: ImportTemplate[] = [
  {
    id: "TPL-001",
    name: "Plan A — Viapost Colissimo (semaine type)",
    description: "Planning semaine standard pour Viapost Colissimo. 5 jours, 42 courses, 8 tournées.",
    type: "plan_a",
    client: "Viapost / Colissimo",
    coursesCount: 42,
    tourneesCount: 8,
    week: "Lun-Ven standard",
    lastUsed: "2026-01-15",
  },
  {
    id: "TPL-002",
    name: "Plan B — Viapost Colissimo (semaine chargée)",
    description: "Planning semaine haute saison avec courses supplémentaires. 6 jours, 56 courses, 12 tournées.",
    type: "plan_b",
    client: "Viapost / Colissimo",
    coursesCount: 56,
    tourneesCount: 12,
    week: "Lun-Sam (haute saison)",
    lastUsed: "2026-01-08",
  },
  {
    id: "TPL-003",
    name: "Template Carrefour — Distribution régionale",
    description: "Planning type distribution régionale Carrefour Rhône-Alpes.",
    type: "custom",
    client: "Carrefour",
    coursesCount: 35,
    tourneesCount: 7,
    week: "Lun-Ven",
  },
  {
    id: "TPL-004",
    name: "Template Amazon — Last mile Lyon",
    description: "Planning last mile Amazon zone Lyon et périphérie.",
    type: "custom",
    client: "Amazon",
    coursesCount: 65,
    tourneesCount: 15,
    week: "Lun-Sam",
  },
];

const mockValidation: ValidationResult[] = [
  { field: "Courses", status: "valid", message: "42 courses valides, format correct", count: 42 },
  { field: "Tournées", status: "valid", message: "8 tournées avec codes uniques", count: 8 },
  { field: "Conducteurs", status: "warning", message: "3 conducteurs introuvables dans la base — seront créés en draft", count: 3 },
  { field: "Véhicules", status: "valid", message: "Tous les VIN correspondent à des véhicules existants", count: 12 },
  { field: "Horaires", status: "valid", message: "Toutes les plages horaires sont cohérentes", count: 42 },
  { field: "Clients", status: "valid", message: "Client Viapost/Colissimo trouvé", count: 1 },
  { field: "Doublons", status: "warning", message: "2 courses potentiellement dupliquées (mêmes horaires/lieu)", count: 2 },
  { field: "Contraintes ADR", status: "valid", message: "Habilitations ADR vérifiées", count: 4 },
];

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ImportPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [targetWeek, setTargetWeek] = useState("S+1");
  const [importStatus, setImportStatus] = useState<"idle" | "validating" | "validated" | "importing" | "done">("idle");
  const [importProgress, setImportProgress] = useState(0);

  const steps: ImportStep[] = [
    { step: 1, label: "Sélectionner source", status: selectedTemplate ? "completed" : "active" },
    { step: 2, label: "Configurer", status: selectedTemplate && importStatus === "idle" ? "active" : selectedTemplate ? "completed" : "pending" },
    { step: 3, label: "Valider", status: importStatus === "validating" ? "active" : importStatus === "validated" || importStatus === "importing" || importStatus === "done" ? "completed" : "pending" },
    { step: 4, label: "Importer", status: importStatus === "importing" ? "active" : importStatus === "done" ? "completed" : "pending" },
  ];

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    setImportStatus("idle");
    setImportProgress(0);
  };

  const handleValidate = () => {
    setImportStatus("validating");
    setTimeout(() => {
      setImportStatus("validated");
      toast({ title: "Validation terminée", description: "Le fichier a été validé avec succès. 2 avertissements." });
    }, 1500);
  };

  const handleImport = () => {
    setImportStatus("importing");
    setImportProgress(0);
    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setImportStatus("done");
          toast({ title: "Import terminé !", description: "42 courses et 8 tournées ont été importées avec succès." });
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const selected = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-headline">Import de données</h1>
          <p className="text-xs text-muted-foreground">
            Importez un planning existant pour les premiers tests — évitez de partir d&apos;une page blanche
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {steps.map((step, idx) => (
          <div key={step.step} className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              step.status === "completed" ? "bg-emerald-100 text-emerald-700" :
              step.status === "active" ? "bg-sky-100 text-sky-700" :
              step.status === "error" ? "bg-rose-100 text-rose-700" :
              "bg-slate-100 text-slate-500"
            )}>
              {step.status === "completed" ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <span className="w-5 h-5 flex items-center justify-center rounded-full border text-[10px] font-bold">
                  {step.step}
                </span>
              )}
              {step.label}
            </div>
            {idx < steps.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-slate-300" />}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList>
          <TabsTrigger value="templates" className="text-xs">
            <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> Templates
          </TabsTrigger>
          <TabsTrigger value="upload" className="text-xs">
            <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload fichier
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {templates.map(tpl => (
              <Card
                key={tpl.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedTemplate === tpl.id ? "border-sky-500 ring-2 ring-sky-200 shadow-md" : "hover:border-sky-300"
                )}
                onClick={() => handleSelectTemplate(tpl.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold">{tpl.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{tpl.description}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] shrink-0",
                        tpl.type === "plan_a" ? "border-emerald-300 text-emerald-700" :
                        tpl.type === "plan_b" ? "border-amber-300 text-amber-700" :
                        "border-slate-300"
                      )}
                    >
                      {tpl.type === "plan_a" ? "Plan A" : tpl.type === "plan_b" ? "Plan B" : "Custom"}
                    </Badge>
                  </div>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-sky-700">{tpl.coursesCount}</p>
                      <p className="text-[10px] text-muted-foreground">Courses</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-700">{tpl.tourneesCount}</p>
                      <p className="text-[10px] text-muted-foreground">Tournées</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700 mt-1">{tpl.client}</p>
                      <p className="text-[10px] text-muted-foreground">Client</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700 mt-1">{tpl.week}</p>
                      <p className="text-[10px] text-muted-foreground">Période</p>
                    </div>
                  </div>
                  {tpl.lastUsed && (
                    <p className="text-[10px] text-muted-foreground mt-2">Dernier import: {tpl.lastUsed}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Configuration */}
          {selected && (
            <Card className="border-sky-200">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm">Configuration de l&apos;import</CardTitle>
                <CardDescription className="text-xs">Template sélectionné: <strong>{selected.name}</strong></CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Semaine cible</Label>
                    <Select value={targetWeek} onValueChange={setTargetWeek}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="S+1">S+1 (semaine prochaine)</SelectItem>
                        <SelectItem value="S+2">S+2</SelectItem>
                        <SelectItem value="current">Semaine courante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Mode</Label>
                    <Select defaultValue="replace">
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="replace">Remplacer le planning existant</SelectItem>
                        <SelectItem value="merge">Fusionner avec l&apos;existant</SelectItem>
                        <SelectItem value="add">Ajouter uniquement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button size="sm" className="h-8 text-xs" onClick={handleValidate} disabled={importStatus !== "idle"}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Valider les données
                    </Button>
                  </div>
                </div>

                {/* Validation results */}
                {(importStatus === "validated" || importStatus === "importing" || importStatus === "done") && (
                  <div className="space-y-3">
                    <Separator />
                    <h4 className="text-xs font-semibold">Résultats de validation</h4>
                    <div className="space-y-1.5">
                      {mockValidation.map((v, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            {v.status === "valid" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : v.status === "warning" ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-rose-600" />
                            )}
                            <span className="text-xs font-medium">{v.field}</span>
                            <span className="text-[10px] text-muted-foreground">{v.message}</span>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">{v.count}</Badge>
                        </div>
                      ))}
                    </div>

                    {/* Import button */}
                    {importStatus === "validated" && (
                      <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={handleImport}>
                        <Upload className="h-3.5 w-3.5 mr-1.5" /> Lancer l&apos;import
                      </Button>
                    )}

                    {/* Progress */}
                    {importStatus === "importing" && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-sky-600" />
                          <span className="text-xs font-medium">Import en cours...</span>
                        </div>
                        <Progress value={importProgress} className="h-2" />
                      </div>
                    )}

                    {/* Done */}
                    {importStatus === "done" && (
                      <Card className="border-emerald-200 bg-emerald-50/50">
                        <CardContent className="px-4 py-3 flex items-center gap-3">
                          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                          <div>
                            <p className="text-sm font-semibold text-emerald-700">Import terminé avec succès !</p>
                            <p className="text-xs text-emerald-600">{selected.coursesCount} courses et {selected.tourneesCount} tournées importées pour {targetWeek}</p>
                          </div>
                          <Button size="sm" variant="outline" className="ml-auto h-7 text-xs" onClick={() => window.location.href = '/conception/planning'}>
                            <ArrowRight className="h-3 w-3 mr-1" /> Voir le planning
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-4">
          <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
            <CardContent className="py-16 flex flex-col items-center justify-center gap-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-10 w-10 text-emerald-600" />
                <FileText className="h-10 w-10 text-sky-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">Déposez votre fichier ou cliquez pour sélectionner</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Formats acceptés: .xlsx, .csv, .json — Taille max: 10 Mo
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="h-8 text-xs">
                  <Upload className="h-3.5 w-3.5 mr-1.5" /> Sélectionner un fichier
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs">
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Télécharger le modèle
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-sky-600" /> Format attendu du fichier
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-8">Colonne</TableHead>
                    <TableHead className="text-xs h-8">Type</TableHead>
                    <TableHead className="text-xs h-8">Obligatoire</TableHead>
                    <TableHead className="text-xs h-8">Exemple</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { col: "course_id", type: "Texte", required: true, example: "CRS-001" },
                    { col: "date", type: "Date (YYYY-MM-DD)", required: true, example: "2026-02-16" },
                    { col: "start_time", type: "Heure (HH:mm)", required: true, example: "06:30" },
                    { col: "end_time", type: "Heure (HH:mm)", required: true, example: "14:00" },
                    { col: "start_location", type: "Texte", required: true, example: "Entrepôt Vénissieux" },
                    { col: "end_location", type: "Texte", required: true, example: "Plateforme Paris Sud" },
                    { col: "client", type: "Texte", required: true, example: "Colissimo" },
                    { col: "vehicle_type", type: "Enum", required: true, example: "Semi-remorque" },
                    { col: "tournee_code", type: "Texte", required: false, example: "T-LGN-001" },
                    { col: "driver_id", type: "Texte", required: false, example: "DRV-001" },
                    { col: "vehicle_id", type: "Texte (VIN)", required: false, example: "VIN-12345" },
                    { col: "is_sensitive", type: "Booléen", required: false, example: "false" },
                    { col: "skills_required", type: "Texte (CSV)", required: false, example: "ADR,Aéroportuaire" },
                  ].map(row => (
                    <TableRow key={row.col}>
                      <TableCell className="py-1.5 text-xs font-mono">{row.col}</TableCell>
                      <TableCell className="py-1.5 text-xs">{row.type}</TableCell>
                      <TableCell className="py-1.5">
                        {row.required ? (
                          <Badge className="text-[10px] bg-rose-100 text-rose-700">Obligatoire</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Optionnel</Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-1.5 text-xs font-mono text-muted-foreground">{row.example}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
