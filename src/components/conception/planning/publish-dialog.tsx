"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  AlertTriangle,
  Send,
  Lock,
  Clock,
  Package,
  Shield,
  User,
  Truck,
} from "lucide-react";
import { PlanningHealthMetrics } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: PlanningHealthMetrics;
  weekLabel: string;
  versionLabel: string;
  onPublish: (note: string) => void;
}

export function PublishDialog({
  open,
  onOpenChange,
  metrics,
  weekLabel,
  versionLabel,
  onPublish,
}: PublishDialogProps) {
  const [note, setNote] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const placedPercent = metrics.coursesTotal > 0
    ? Math.round((metrics.coursesPlaced / metrics.coursesTotal) * 100)
    : 0;
  const remaining = metrics.coursesTotal - metrics.coursesPlaced;
  const totalAbsent = metrics.absentDrivers.reduce((s, d) => s + d.count, 0);
  const criticalAlerts = metrics.alertsByLevel.critical;

  const canPublish = placedPercent >= 50; // Business rule: at least 50% placed
  const hasWarnings = remaining > 0 || criticalAlerts > 0;

  const handlePublish = () => {
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      setPublished(true);
      onPublish(note);
      setTimeout(() => {
        setPublished(false);
        onOpenChange(false);
      }, 1500);
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Send className="h-4 w-4" />
            Publier le Plan de Transport
          </DialogTitle>
          <DialogDescription className="text-xs">
            Publication du plan {weekLabel} — {versionLabel}
          </DialogDescription>
        </DialogHeader>

        {published ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <p className="text-sm font-semibold text-emerald-700">Plan publié avec succès !</p>
            <p className="text-xs text-muted-foreground">Le plan est désormais figé pour la Conception et visible par l'Exploitation.</p>
          </div>
        ) : (
          <>
            {/* Health summary */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Taux de placement</span>
                <span className={cn("text-sm font-bold", placedPercent >= 80 ? "text-emerald-600" : placedPercent >= 60 ? "text-amber-600" : "text-rose-600")}>
                  {placedPercent}%
                </span>
              </div>
              <Progress value={placedPercent} className="h-2" />

              <div className="grid grid-cols-3 gap-2">
                <Card className="border-muted">
                  <CardContent className="px-3 py-2 text-center">
                    <Package className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-bold">{remaining}</p>
                    <p className="text-[10px] text-muted-foreground">Courses restantes</p>
                  </CardContent>
                </Card>
                <Card className="border-muted">
                  <CardContent className="px-3 py-2 text-center">
                    <User className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-bold">{totalAbsent}</p>
                    <p className="text-[10px] text-muted-foreground">Conducteurs absents</p>
                  </CardContent>
                </Card>
                <Card className="border-muted">
                  <CardContent className="px-3 py-2 text-center">
                    <AlertTriangle className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-bold">{criticalAlerts}</p>
                    <p className="text-[10px] text-muted-foreground">Alertes critiques</p>
                  </CardContent>
                </Card>
              </div>

              {hasWarnings && (
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardContent className="px-4 py-2.5">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <div className="text-xs text-amber-700 space-y-1">
                        {remaining > 0 && <p>{remaining} courses ne sont pas encore affectées.</p>}
                        {criticalAlerts > 0 && <p>{criticalAlerts} alertes critiques non résolues.</p>}
                        {totalAbsent > 0 && <p>{totalAbsent} conducteurs absents non remplacés.</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator />

              <Card className="border-sky-200 bg-sky-50/30">
                <CardContent className="px-4 py-2.5">
                  <div className="flex items-start gap-2">
                    <Lock className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-sky-700 space-y-1">
                      <p className="font-semibold">Après publication :</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>Le plan S+1 sera figé pour la Conception</li>
                        <li>Il ne sera plus modifiable que par l'Exploitation</li>
                        <li>Un snapshot sera créé pour l'analyse réel vs plan</li>
                        <li>Une nouvelle version ({versionLabel}) sera sauvegardée</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-1.5">
                <Label className="text-xs">Note de publication (optionnelle)</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex: Plan validé en réunion conception-exploitation du mardi..."
                  className="text-sm min-h-[60px]"
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={!canPublish || publishing}
                className={cn(!canPublish && "opacity-50 cursor-not-allowed")}
              >
                {publishing ? (
                  <><Clock className="h-3.5 w-3.5 mr-1 animate-spin" /> Publication en cours...</>
                ) : (
                  <><Send className="h-3.5 w-3.5 mr-1" /> Publier {weekLabel}</>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
