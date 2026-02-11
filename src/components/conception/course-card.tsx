
"use client";

import { UnassignedCourse } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertCircle, Clock, Truck, User, MapPin } from "lucide-react";
import { ConstraintBadge } from "./constraint-badge";
import { TrajetVisualizer } from "./trajet-visualizer";
import { isMultiPointTrajet } from "@/lib/assignment-constraints";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CourseCardProps {
  course: UnassignedCourse;
  onAssign?: (course: UnassignedCourse) => void;
  compact?: boolean;
}

export function CourseCard({ course, onAssign, compact = false }: CourseCardProps) {
  const isMultiPoint = isMultiPointTrajet(course);
  const displayDate = course.requiredDate ? format(new Date(course.requiredDate), "d MMM yyyy", { locale: fr }) : format(new Date(course.date), "d MMM yyyy", { locale: fr });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {course.client}
              {course.isSensitive && (
                <Badge variant="destructive" className="text-xs">Sensible</Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {course.type === 'sup' ? 'SUP' : course.type === 'spot' ? 'Spot' : 'Régulière'}
              </Badge>
            </CardTitle>
            {course.codeArticle && (
              <p className="text-xs text-muted-foreground mt-1">Code: {course.codeArticle}</p>
            )}
          </div>
          {onAssign && (
            <Button size="sm" onClick={() => onAssign(course)}>
              Assigner
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Trajet visualization */}
        {compact ? (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {course.segments?.[0]?.startLocation ?? course.startLocation}
            </span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">
              {course.segments?.[(course.segments?.length ?? 1) - 1]?.endLocation ?? course.endLocation}
            </span>
            {isMultiPoint && (
              <Badge variant="outline" className="text-xs ml-2">
                +{(course.segments?.length ?? 1) - 1} étapes
              </Badge>
            )}
          </div>
        ) : (
          <TrajetVisualizer course={course} showDetails={false} />
        )}

        {/* Date and time */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{displayDate}</span>
            {course.requiredStartTime && (
              <span className="ml-1">à {course.requiredStartTime}</span>
            )}
          </div>
          {course.deadline && (
            <div className="flex items-center gap-1 text-orange-600">
              <AlertCircle className="h-3 w-3" />
              <span>Échéance: {format(new Date(course.deadline), "d MMM yyyy", { locale: fr })}</span>
            </div>
          )}
        </div>

        {/* Requirements */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <Truck className="h-3 w-3" />
            {course.requiredVehicleType}
          </Badge>
          {course.requiredDriverType && (
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <User className="h-3 w-3" />
              {course.requiredDriverType}
            </Badge>
          )}
          {course.requiredDriverSkills.length > 0 && (
            course.requiredDriverSkills.map(skill => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))
          )}
          {course.requiredVehicleEnergy && (
            <Badge variant="outline" className="text-xs">
              {course.requiredVehicleEnergy}
            </Badge>
          )}
        </div>

        {/* Constraints and warnings */}
        {course.constraintWarnings && course.constraintWarnings.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {course.constraintWarnings.map((warning, idx) => (
              <ConstraintBadge 
                key={idx} 
                level="warning" 
                message={warning}
              />
            ))}
          </div>
        )}

        {course.blockReason && (
          <ConstraintBadge 
            level="error" 
            message={course.blockReason}
          />
        )}

        {/* Assignment status */}
        {course.assignmentStatus === 'partial' && (
          <Badge variant="outline" className="text-xs text-orange-600">
            Assignation partielle ({course.assignedSegments ?? 0}/{course.segments?.length ?? 0} segments)
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
