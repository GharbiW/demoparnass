
"use client";

import { UnassignedCourse, TrajetSegment } from "@/lib/types";
import { ArrowRight, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TrajetVisualizerProps {
  course: UnassignedCourse;
  selectedSegments?: number[];
  onSegmentSelect?: (segmentIndex: number) => void;
  showDetails?: boolean;
  className?: string;
}

export function TrajetVisualizer({ 
  course, 
  selectedSegments = [], 
  onSegmentSelect,
  showDetails = false,
  className 
}: TrajetVisualizerProps) {
  const segments = course.segments ?? [];
  const isMultiPoint = segments.length > 1;
  const allSegmentsSelected = selectedSegments.length === segments.length;

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Trajet {isMultiPoint ? 'multi-points' : ''}</span>
          {isMultiPoint && (
            <Badge variant="outline" className="text-xs">
              {segments.length} segments
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          {segments.map((segment, index) => {
            const isSelected = selectedSegments.includes(segment.sequence);
            const isLast = index === segments.length - 1;

            return (
              <div key={segment.id} className="relative flex items-start gap-2">
                {/* Segment number */}
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold mt-0.5 flex-shrink-0 z-10",
                  isSelected 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {segment.sequence}
                </div>

                {/* Segment path */}
                <div className={cn(
                  "flex-1 p-2 rounded border transition-colors",
                  isSelected 
                    ? "border-primary bg-primary/5" 
                    : "border-border bg-muted/30",
                  onSegmentSelect && "cursor-pointer hover:border-primary/50"
                )}
                onClick={() => onSegmentSelect?.(segment.sequence)}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{segment.startLocation}</div>
                      {showDetails && segment.estimatedDuration && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Durée estimée: {Math.floor(segment.estimatedDuration / 60)}h{segment.estimatedDuration % 60 > 0 ? `${segment.estimatedDuration % 60}min` : ''}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 text-right">
                      <div className="text-sm font-medium">{segment.endLocation}</div>
                    </div>
                  </div>
                </div>

                {/* Connector line (except for last segment) */}
                {!isLast && (
                  <div className="absolute left-3 top-8 w-0.5 h-6 bg-border" />
                )}
              </div>
            );
          })}
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="text-xs text-muted-foreground">
              <div><strong>Client:</strong> {course.client}</div>
              {course.codeArticle && (
                <div><strong>Code article:</strong> {course.codeArticle}</div>
              )}
              <div><strong>Date requise:</strong> {new Date(course.requiredDate ?? course.date).toLocaleDateString('fr-FR')}</div>
              {course.requiredStartTime && (
                <div><strong>Heure de départ:</strong> {course.requiredStartTime}</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
