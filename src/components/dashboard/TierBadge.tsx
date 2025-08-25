import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FormularyEntry } from "@/types/pbm";

interface TierBadgeProps {
  tier: FormularyEntry['tier'];
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  const getTierColor = (tier: FormularyEntry['tier']) => {
    switch (tier) {
      case 'Preferred':
        return 'bg-tier-preferred text-white hover:bg-tier-preferred/80';
      case 'Non-Preferred':
        return 'bg-tier-non-preferred text-white hover:bg-tier-non-preferred/80';
      case 'Specialty':
        return 'bg-tier-specialty text-white hover:bg-tier-specialty/80';
      case 'Excluded':
        return 'bg-tier-excluded text-white hover:bg-tier-excluded/80';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Badge className={cn(getTierColor(tier), className)}>
      {tier}
    </Badge>
  );
}