import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Download, 
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock
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
import { mockFormulary } from "@/lib/mock-data";
import { FormularyEntry } from "@/types/pbm";

const getTierColor = (tier: FormularyEntry['tier']) => {
  switch (tier) {
    case 'Preferred':
      return 'bg-tier-preferred text-white';
    case 'Non-Preferred':
      return 'bg-tier-non-preferred text-white';
    case 'Specialty':
      return 'bg-tier-specialty text-white';
    case 'Excluded':
      return 'bg-tier-excluded text-white';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function Formulary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [paFilter, setPaFilter] = useState<string>("all");

  const filteredFormulary = mockFormulary.filter((entry) => {
    const matchesSearch = entry.drug_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.ndc.includes(searchTerm);
    const matchesTier = tierFilter === "all" || entry.tier === tierFilter;
    const matchesPA = paFilter === "all" || 
                     (paFilter === "pa_required" && entry.pa_required) ||
                     (paFilter === "no_pa" && !entry.pa_required);
    
    return matchesSearch && matchesTier && matchesPA;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Formulary Management</h1>
          <p className="text-muted-foreground">
            Manage drug tiers, prior authorizations, and step therapy requirements
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Drug
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Drugs</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">PA Required</p>
                <p className="text-2xl font-bold">234</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Step Therapy</p>
                <p className="text-2xl font-bold">156</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Copay</p>
                <p className="text-2xl font-bold">$24</p>
              </div>
              <div className="h-8 w-8 text-muted-foreground">$</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by drug name or NDC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="Preferred">Preferred</SelectItem>
                <SelectItem value="Non-Preferred">Non-Preferred</SelectItem>
                <SelectItem value="Specialty">Specialty</SelectItem>
                <SelectItem value="Excluded">Excluded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paFilter} onValueChange={setPaFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Prior Auth" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pa_required">PA Required</SelectItem>
                <SelectItem value="no_pa">No PA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Formulary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Formulary Entries ({filteredFormulary.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NDC</TableHead>
                <TableHead>Drug Name</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Copay</TableHead>
                <TableHead>Prior Auth</TableHead>
                <TableHead>Step Therapy</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFormulary.map((entry) => (
                <TableRow key={entry.ndc}>
                  <TableCell className="font-mono text-sm">
                    {entry.ndc}
                  </TableCell>
                  <TableCell className="font-medium">
                    {entry.drug_name}
                  </TableCell>
                  <TableCell>
                    <Badge className={getTierColor(entry.tier)}>
                      {entry.tier}
                    </Badge>
                  </TableCell>
                  <TableCell>${entry.copay}</TableCell>
                  <TableCell>
                    {entry.pa_required ? (
                      <Badge variant="secondary">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Required
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not Required</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.step_therapy ? (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Yes
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        Impact
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}