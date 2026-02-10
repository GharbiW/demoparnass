
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Info, Lightbulb, Loader2, RefreshCw, X } from "lucide-react";
import { recommendations as mockRecommendations, Recommendation } from "@/lib/recommendations-data";
import { useToast } from "@/hooks/use-toast";

export function AiCortexRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>(mockRecommendations);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setRecommendations(mockRecommendations.slice(0, Math.floor(Math.random() * mockRecommendations.length) + 1));
      setLoading(false);
      toast({
        title: "Recommandations mises à jour",
        description: "De nouvelles suggestions ont été générées par l'IA.",
      })
    }, 1000);
  };
  
  const handleAction = (recId: string, action: 'approve' | 'reject') => {
    setRecommendations(prev => prev.filter(r => r.recommendationId !== recId));
    toast({
        title: `Recommandation ${action === 'approve' ? 'approuvée' : 'rejetée'}`,
        description: `L'action pour ${recId} a été enregistrée.`,
    })
  }

  const RecommendationCard = ({ rec }: { rec: Recommendation }) => (
    <div className="p-4 bg-muted/40 rounded-lg">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-sm">{rec.title}</p>
          <p className="text-xs text-muted-foreground">{rec.description}</p>
        </div>
        <Badge variant="secondary" className="whitespace-nowrap">{rec.impact}</Badge>
      </div>
      <CardFooter className="px-0 pt-3 pb-0 justify-end gap-2">
        <Button size="sm" variant="ghost" className="h-7 text-xs"><Info className="mr-1"/>Expliquer</Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAction(rec.recommendationId, 'reject')}><X className="mr-1"/>Ignorer</Button>
        <Button size="sm" className="h-7 text-xs" onClick={() => handleAction(rec.recommendationId, 'approve')}><Check className="mr-1"/>Approuver</Button>
      </CardFooter>
    </div>
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center"><Lightbulb className="mr-2 text-accent"/>Recommandations IA (Cortex)</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 overflow-y-auto">
        {loading ? (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            </div>
        ) : recommendations.length > 0 ? (
            recommendations.map(rec => <RecommendationCard key={rec.recommendationId} rec={rec} />)
        ) : (
            <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">Aucune nouvelle recommandation.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
