import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface SafetyAnalysisCardProps {
  risk: number;
  description: string;
}

export function SafetyAnalysisCard({ risk, description }: SafetyAnalysisCardProps) {
  const details = {
    0: { title: "No Interaction Found", icon: <CheckCircle className="h-6 w-6 text-success" />, color: "text-success", bgColor: "bg-success/10" },
    1: { title: "Low Risk Interaction", icon: <AlertTriangle className="h-6 w-6 text-warning" />, color: "text-warning", bgColor: "bg-warning/10" },
    2: { title: "High Risk Interaction", icon: <AlertTriangle className="h-6 w-6 text-destructive" />, color: "text-destructive", bgColor: "bg-destructive/10" },
  }[risk] || { title: "Safety Analysis", icon: <Shield className="h-6 w-6" />, color: "text-muted-foreground", bgColor: "bg-muted/10" };

  return (
    <Card className={cn(details.bgColor)}>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Shield className="h-5 w-5 mr-2" />
          Safety Note
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-2">
          {details.icon}
          <h3 className={cn("text-lg font-semibold ml-2", details.color)}>{details.title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}