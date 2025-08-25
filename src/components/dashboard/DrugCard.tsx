import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface Drug {
  drug_name: string;
  generic_name: string;
  therapeutic_class: string;
  pmpm_cost: number;
  ndc: string;
}

interface DrugCardProps {
  drug: Drug;
  className?: string;
}

export function DrugCard({ drug, className }: DrugCardProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{drug.drug_name}</CardTitle>
            <Badge variant="outline">NDC: {drug.ndc}</Badge>
        </div>
        <CardDescription>{drug.generic_name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Therapeutic Class:</span>
          <span className="font-medium text-right">{drug.therapeutic_class}</span>
        </div>
        <div className="flex justify-between items-center border-t pt-2 mt-2">
          <span className="text-muted-foreground">PMPM Cost:</span>
          <span className="font-bold text-lg text-primary">${drug.pmpm_cost?.toFixed(2) ?? 'N/A'}</span>
        </div>
      </CardContent>
    </Card>
  );
}