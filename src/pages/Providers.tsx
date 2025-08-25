import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { KPICard } from "@/components/dashboard/KPICard";
import { 
  Search, 
  User, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  PillBottle,
  Users,
  Star
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockPrescribers } from "@/lib/mock-data";

export default function Providers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");

  const filteredPrescribers = mockPrescribers.filter((prescriber) => {
    const matchesSearch = prescriber.prescriber_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescriber.npi.includes(searchTerm);
    const matchesSpecialty = specialtyFilter === "all" || prescriber.specialty === specialtyFilter;
    
    return matchesSearch && matchesSpecialty;
  });

  const getPerformanceScore = (prescriber: any) => {
    // Mock performance calculation
    const costEfficiency = (prescriber.total_cost / prescriber.total_claims);
    const genericRate = Math.random() * 30 + 70; // Mock generic rate
    const score = Math.min(100, Math.max(0, 100 - (costEfficiency - 50) + (genericRate - 80)));
    return Math.round(score);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Provider Analytics</h1>
          <p className="text-muted-foreground">
            Monitor prescriber performance and identify optimization opportunities
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">Export Report</Button>
          <Button>Provider Outreach</Button>
        </div>
      </div>

      {/* Provider KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title="Total Prescribers"
          value="2,847"
          change={5.2}
          icon={<Users className="h-4 w-4" />}
        />
        <KPICard
          title="Avg Cost per Claim"
          value={87.45}
          change={-3.1}
          format="currency"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPICard
          title="Generic Fill Rate"
          value={84.2}
          change={2.8}
          format="percentage"
          icon={<PillBottle className="h-4 w-4" />}
        />
        <KPICard
          title="High Performers"
          value="234"
          change={12.1}
          icon={<Star className="h-4 w-4" />}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by provider name or NPI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Filter by specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                <SelectItem value="Internal Medicine">Internal Medicine</SelectItem>
                <SelectItem value="Cardiology">Cardiology</SelectItem>
                <SelectItem value="Endocrinology">Endocrinology</SelectItem>
                <SelectItem value="Psychiatry">Psychiatry</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Provider Table */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Performance ({filteredPrescribers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>NPI</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Total Claims</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Cost/Claim</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrescribers.map((prescriber) => {
                const costPerClaim = prescriber.total_cost / prescriber.total_claims;
                const performanceScore = getPerformanceScore(prescriber);
                
                return (
                  <TableRow key={prescriber.npi}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{prescriber.prescriber_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {prescriber.unique_beneficiaries} patients
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {prescriber.npi}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {prescriber.specialty}
                      </Badge>
                    </TableCell>
                    <TableCell>{prescriber.state}</TableCell>
                    <TableCell>{prescriber.total_claims.toLocaleString()}</TableCell>
                    <TableCell>
                      ${prescriber.total_cost.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {costPerClaim > 60 ? (
                          <TrendingUp className="h-4 w-4 mr-1 text-destructive" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1 text-success" />
                        )}
                        <span className="font-mono">
                          ${costPerClaim.toFixed(2)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Star className={`h-4 w-4 mr-1 ${getScoreColor(performanceScore)}`} />
                        <span className={`font-bold ${getScoreColor(performanceScore)}`}>
                          {performanceScore}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          Recommendations
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}