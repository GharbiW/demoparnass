"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Filter, Shield, Fuel, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdvancedFilters {
  client: string;
  vehicleType: string;
  driverType: string;
  vehicle: string;
  driver: string;
  servicePickupLocation: string;
  includeWeekend: boolean;
  sensitiveOnly: boolean;
  prestationType: string;
  alertLevel: string;
  energy: string;
  hasFormation: string; // 'ADR' | 'Aéroportuaire' | 'Habilitation sûreté' | 'all'
}

interface AdvancedFiltersProps {
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  availableClients: string[];
  availableVehicles: Array<{ vin: string; immatriculation: string; type: string }>;
  availableDrivers: Array<{ id: string; name: string; type: string }>;
  onReset: () => void;
}

const defaultFilters: AdvancedFilters = {
  client: "all",
  vehicleType: "all",
  driverType: "all",
  vehicle: "all",
  driver: "all",
  servicePickupLocation: "all",
  includeWeekend: true,
  sensitiveOnly: false,
  prestationType: "all",
  alertLevel: "all",
  energy: "all",
  hasFormation: "all",
};

export function AdvancedFiltersPanel({
  filters,
  onFiltersChange,
  availableClients,
  availableVehicles,
  availableDrivers,
  onReset,
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "includeWeekend") return !value; // Weekend is active if excluded
    if (key === "sensitiveOnly") return value;
    return value !== "all" && value !== "";
  }).length;

  const updateFilter = (key: keyof AdvancedFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Button
          variant={isExpanded ? "default" : "outline"}
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 text-xs"
        >
          <Filter className="h-3.5 w-3.5 mr-1.5" />
          Filtres avancés
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-4 px-1.5 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 text-xs"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="p-4 border rounded-lg bg-card space-y-4 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Client */}
            <div className="space-y-1.5">
              <Label className="text-xs">Client</Label>
              <Select value={filters.client} onValueChange={(v) => updateFilter("client", v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Tous les clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les clients</SelectItem>
                  {availableClients.map((client) => (
                    <SelectItem key={client} value={client}>
                      {client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type véhicule */}
            <div className="space-y-1.5">
              <Label className="text-xs">Type véhicule</Label>
              <Select value={filters.vehicleType} onValueChange={(v) => updateFilter("vehicleType", v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Tous types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="Semi-remorque">Semi-remorque</SelectItem>
                  <SelectItem value="Caisse mobile">Caisse mobile</SelectItem>
                  <SelectItem value="Frigo">Frigo</SelectItem>
                  <SelectItem value="ADR">ADR</SelectItem>
                  <SelectItem value="SPL">SPL</SelectItem>
                  <SelectItem value="VL">VL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Permis conducteur */}
            <div className="space-y-1.5">
              <Label className="text-xs">Permis conducteur</Label>
              <Select value={filters.driverType} onValueChange={(v) => updateFilter("driverType", v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Tous permis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous permis</SelectItem>
                  <SelectItem value="CM">CM</SelectItem>
                  <SelectItem value="Polyvalent">Polyvalent</SelectItem>
                  <SelectItem value="SPL">SPL</SelectItem>
                  <SelectItem value="VL">VL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Véhicule spécifique */}
            <div className="space-y-1.5">
              <Label className="text-xs">Véhicule</Label>
              <Select value={filters.vehicle} onValueChange={(v) => updateFilter("vehicle", v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Tous véhicules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous véhicules</SelectItem>
                  {availableVehicles.map((v) => (
                    <SelectItem key={v.vin} value={v.vin}>
                      {v.immatriculation} ({v.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conducteur spécifique */}
            <div className="space-y-1.5">
              <Label className="text-xs">Conducteur</Label>
              <Select value={filters.driver} onValueChange={(v) => updateFilter("driver", v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Tous conducteurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous conducteurs</SelectItem>
                  {availableDrivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type prestation */}
            <div className="space-y-1.5">
              <Label className="text-xs">Type prestation</Label>
              <Select value={filters.prestationType} onValueChange={(v) => updateFilter("prestationType", v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Tous types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="régulière">Régulière</SelectItem>
                  <SelectItem value="sup">SUP</SelectItem>
                  <SelectItem value="spot">Spot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Niveau alerte */}
            <div className="space-y-1.5">
              <Label className="text-xs">Niveau alerte</Label>
              <Select value={filters.alertLevel} onValueChange={(v) => updateFilter("alertLevel", v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Tous niveaux" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous niveaux</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Énergie */}
            <div className="space-y-1.5">
              <Label className="text-xs">Énergie</Label>
              <Select value={filters.energy} onValueChange={(v) => updateFilter("energy", v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Toutes énergies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes énergies</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Gaz">Gaz</SelectItem>
                  <SelectItem value="Électrique">Électrique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Formations/Habilitations */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <BadgeCheck className="h-3 w-3" />
                Formations
              </Label>
              <Select value={filters.hasFormation} onValueChange={(v) => updateFilter("hasFormation", v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Toutes formations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes formations</SelectItem>
                  <SelectItem value="ADR">ADR</SelectItem>
                  <SelectItem value="Aéroportuaire">Aéroportuaire</SelectItem>
                  <SelectItem value="Habilitation sûreté">Habilitation sûreté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-6 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeWeekend"
                checked={filters.includeWeekend}
                onCheckedChange={(checked) => updateFilter("includeWeekend", checked)}
              />
              <Label htmlFor="includeWeekend" className="text-xs cursor-pointer">
                Inclure week-end
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sensitiveOnly"
                checked={filters.sensitiveOnly}
                onCheckedChange={(checked) => updateFilter("sensitiveOnly", checked)}
              />
              <Label htmlFor="sensitiveOnly" className="text-xs cursor-pointer flex items-center gap-1">
                <Shield className="h-3 w-3 text-violet-600" />
                Sensibles uniquement
              </Label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { defaultFilters };
