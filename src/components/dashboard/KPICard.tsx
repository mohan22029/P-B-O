import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  format?: 'currency' | 'number';
}

export function KPICard({ title, value, icon, format = 'number' }: KPICardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    }
    return new Intl.NumberFormat('en-US').format(val);
  };

  return (
    <Card className={cn("shadow-sm")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{formatValue(value)}</div>
      </CardContent>
    </Card>
  );
}