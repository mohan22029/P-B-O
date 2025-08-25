import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react";

interface ImpactWidgetProps {
  title?: string;
  pmpmChange: number;
  costSavings: number;
  membersAffected?: number; // Make optional
  className?: string;
}

export function ImpactWidget({
  title = "Impact Analysis",
  pmpmChange,
  costSavings,
  membersAffected,
  className
}: ImpactWidgetProps) {
  const isSaving = pmpmChange > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center">
            {isSaving ? (
              <TrendingDown className="h-5 w-5 mr-2 text-success" />
            ) : (
              <TrendingUp className="h-5 w-5 mr-2 text-destructive" />
            )}
            <span className="text-sm font-medium">PMPM Change</span>
          </div>
          <span className={`font-bold text-lg ${isSaving ? 'text-success' : 'text-destructive'}`}>
            ${Math.abs(pmpmChange).toFixed(2)}
          </span>
        </div>

        <div className="p-4 border rounded-lg text-center">
          <p className="text-sm text-muted-foreground">Potential Monthly Saving per Member</p>
          <p className={`text-2xl font-bold ${costSavings > 0 ? 'text-success' : 'text-destructive'}`}>
            ${costSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {membersAffected && (
           <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              <span className="text-sm font-medium">Affected Members</span>
            </div>
            <span className="font-bold text-lg">
              {membersAffected.toLocaleString()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}