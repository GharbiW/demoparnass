"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Zap, MapPin, Clock, Truck, User, Info, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuickSupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
}

const supTemplates = [
  { id: "tpl-express", label: "Express Lyon-Paris", client: "CARREFOUR", startLocation: "Entrepôt Vénissieux", endLocation: "Plateforme Paris Sud", vehicleType: "Semi-remorque", duration: "6h" },
  { id: "tpl-frigo", label: "Livraison Frigo Marseille", client: "LACTALIS", startLocation: "Port de Marseille", endLocation: "Entrepôt Avignon", vehicleType: "Frigo", duration: "3h" },
  { id: "tpl-urbain", label: "Distribution urbaine Nantes", client: "AMAZON", startLocation: "Entrepôt Nantes", endLocation: "Plateforme Rennes", vehicleType: "VL", duration: "4h" },
  { id: "tpl-adr", label: "Transport ADR Strasbourg", client: "SANOFI", startLocation: "Port de Strasbourg", endLocation: "Entrepôt Reichstett", vehicleType: "ADR", duration: "2h" },
];

export function QuickSupDialog({ open, onOpenChange, defaultDate }: QuickSupDialogProps) {
  const { toast } = useToast();
  const [useTemplate, setUseTemplate] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  // Form state
  const [client, setClient] = useState("");
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("06:00");
  const [endTime, setEndTime] = useState("12:00");
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [vehicleType, setVehicleType] = useState("Semi-remorque");
  const [driverType, setDriverType] = useState("CM");
  const [isSensitive, setIsSensitive] = useState(false);
  const [notes, setNotes] = useState("");

  const handleTemplateSelect = (tplId: string) => {
    const tpl = supTemplates.find(t => t.id === tplId);
    if (tpl) {
      setSelectedTemplate(tplId);
      setClient(tpl.client);
      setStartLocation(tpl.startLocation);
      setEndLocation(tpl.endLocation);
      setVehicleType(tpl.vehicleType);
    }
  };

  const handleCreate = () => {
    if (!client || !startLocation || !endLocation) {
      toast({ title: "Erreur", description: "Renseignez client, départ et arrivée.", variant: "destructive" });
      return;
    }

    toast({
      title: "SUP créée",
      description: `Course SUP ${client} créée pour le ${date} (${startTime}-${endTime})`,
    });
    onOpenChange(false);

    // Reset
    setClient("");
    setStartLocation("");
    setEndLocation("");
    setNotes("");
    setSelectedTemplate("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-600" /> Création rapide SUP
          </DialogTitle>
          <DialogDescription className="text-xs">
            Créez une prestation supplémentaire directement depuis le planning.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Templates */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox checked={useTemplate} onCheckedChange={(c) => setUseTemplate(!!c)} />
              <Label className="text-xs cursor-pointer">Utiliser un template</Label>
            </div>
            {useTemplate && (
              <div className="grid grid-cols-2 gap-2">
                {supTemplates.map(tpl => (
                  <div
                    key={tpl.id}
                    className={`p-2.5 border rounded-lg cursor-pointer transition-all text-xs hover:shadow-sm ${
                      selectedTemplate === tpl.id ? "border-sky-500 bg-sky-50 ring-1 ring-sky-200" : "hover:border-sky-300"
                    }`}
                    onClick={() => handleTemplateSelect(tpl.id)}
                  >
                    <p className="font-semibold">{tpl.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {tpl.client} • {tpl.vehicleType} • {tpl.duration}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Manual form */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Client *</Label>
              <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nom du client" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Heure début *</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Heure fin *</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-8 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Lieu de départ *</Label>
              <Input value={startLocation} onChange={(e) => setStartLocation(e.target.value)} placeholder="Entrepôt, plateforme..." className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Lieu d&apos;arrivée *</Label>
              <Input value={endLocation} onChange={(e) => setEndLocation(e.target.value)} placeholder="Destination" className="h-8 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Type véhicule</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semi-remorque">Semi-remorque</SelectItem>
                  <SelectItem value="Caisse mobile">Caisse mobile</SelectItem>
                  <SelectItem value="Frigo">Frigo</SelectItem>
                  <SelectItem value="ADR">ADR</SelectItem>
                  <SelectItem value="SPL">SPL</SelectItem>
                  <SelectItem value="VL">VL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type conducteur</Label>
              <Select value={driverType} onValueChange={setDriverType}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CM">CM</SelectItem>
                  <SelectItem value="Polyvalent">Polyvalent</SelectItem>
                  <SelectItem value="SPL">SPL</SelectItem>
                  <SelectItem value="VL">VL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={isSensitive} onCheckedChange={(c) => setIsSensitive(!!c)} />
            <Label className="text-xs cursor-pointer">Prestation sensible</Label>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instructions particulières..." className="text-sm min-h-[60px]" />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Créer la SUP
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
