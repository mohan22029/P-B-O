import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Search,
  Filter,
  Download,
  Plus,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Database,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { apiService, type Drug } from "../lib/api";
import { toast } from "sonner";

const getTherapeuticEquivalenceBadge = (te_code: string | null) => {
  if (!te_code || te_code === "NA") {
    return <Badge variant="secondary">No TE</Badge>;
  }

  const color = te_code.startsWith("AB") ? "bg-success text-white" : "bg-warning text-white";
  return <Badge className={color}>{te_code}</Badge>;
};

const formatCurrency = (value: string | number | null | undefined) => {
  if (value == null) return "N/A";
  if (typeof value === "string") {
    const numValue = parseFloat(value.replace(/[$,]/g, ""));
    return isNaN(numValue) ? value : `$${numValue.toLocaleString()}`;
  }
  return `$${value.toLocaleString()}`;
};

const formatNumber = (value: string | number | null | undefined) => {
  if (value == null) return "N/A";
  if (typeof value === "string") {
    const numValue = parseInt(value.replace(/,/g, ""));
    return isNaN(numValue) ? value : numValue.toLocaleString();
  }
  return value.toLocaleString();
};

export default function DrugDatabase() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedTE, setSelectedTE] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDrug, setNewDrug] = useState<Partial<Drug>>({});

  useEffect(() => {
    loadDrugs();
  }, []);

  const loadDrugs = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDrugs();
      const validDrugs = response.drugs.map(drug => ({
        ...drug,
        total_drug_cost: drug.total_drug_cost ?? 0,
        pmpm_cost: drug.pmpm_cost ?? 0,
        member_count: drug.member_count ?? 0,
        avg_age: drug.avg_age ?? 0,
      }));
      setDrugs(validDrugs);
    } catch (error) {
      toast.error("Failed to load drugs: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const therapeuticClasses = useMemo(() => {
    const classes = [...new Set(drugs.map(drug => drug.therapeutic_class))];
    return classes.sort();
  }, [drugs]);

  const filteredDrugs = useMemo(() => {
    return drugs.filter(drug => {
      const matchesSearch =
        drug.drug_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drug.generic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drug.ndc.includes(searchTerm) ||
        drug.atc_code.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesClass = selectedClass === "all" || drug.therapeutic_class === selectedClass;

      const matchesTE =
        selectedTE === "all" ||
        (selectedTE === "ab" &&
          (drug.therapeutic_equivalence_code === "AB" ||
            drug.therapeutic_equivalence_code === "AB1")) ||
        (selectedTE === "na" &&
          (drug.therapeutic_equivalence_code === "NA" ||
            !drug.therapeutic_equivalence_code));

      return matchesSearch && matchesClass && matchesTE;
    });
  }, [drugs, searchTerm, selectedClass, selectedTE]);

  const summaryStats = useMemo(() => {
    const totalCost = filteredDrugs.reduce((sum, drug) => {
      const cost =
        typeof drug.total_drug_cost === "string"
          ? parseFloat(drug.total_drug_cost.replace(/[$,]/g, "")) || 0
          : (drug.total_drug_cost ?? 0);
      return sum + cost;
    }, 0);

    const totalMembers = filteredDrugs.reduce((sum, drug) => {
      const members =
        typeof drug.member_count === "string"
          ? parseInt(drug.member_count.replace(/,/g, "")) || 0
          : (drug.member_count ?? 0);
      return sum + members;
    }, 0);

    const avgAge =
      filteredDrugs.reduce((sum, drug) => sum + (drug.avg_age ?? 0), 0) /
      (filteredDrugs.length || 1);

    return {
      totalDrugs: filteredDrugs.length,
      totalCost,
      totalMembers,
      avgAge: Math.round(avgAge),
    };
  }, [filteredDrugs]);

  const handleAddDrug = async () => {
    try {
      await apiService.addDrug(newDrug);
      toast.success("Drug added successfully!");
      setIsAddDialogOpen(false);
      setNewDrug({});
      loadDrugs();
    } catch (error) {
      toast.error("Failed to add drug: " + (error as Error).message);
    }
  };

  const exportData = () => {
    const csvContent = [
      Object.keys(filteredDrugs[0] || {}).join(","),
      ...filteredDrugs.map(drug => Object.values(drug).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "drug_database.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading drug database...</span>
      </div>
    );
  }

  if (!drugs.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="h-6 w-6 text-warning mr-2" />
        <span>No drugs found in the database.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Drug Database</h1>
          <p className="text-muted-foreground">
            Comprehensive pharmaceutical database with therapeutic equivalence analysis
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Drug
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Drug</DialogTitle>
                <DialogDescription>
                  Enter the details for the new drug entry.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ndc">NDC</Label>
                  <Input
                    id="ndc"
                    value={newDrug.ndc || ""}
                    onChange={e => setNewDrug({ ...newDrug, ndc: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="drug_name">Drug Name</Label>
                  <Input
                    id="drug_name"
                    value={newDrug.drug_name || ""}
                    onChange={e => setNewDrug({ ...newDrug, drug_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="generic_name">Generic Name</Label>
                  <Input
                    id="generic_name"
                    value={newDrug.generic_name || ""}
                    onChange={e => setNewDrug({ ...newDrug, generic_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="therapeutic_class">Therapeutic Class</Label>
                  <Input
                    id="therapeutic_class"
                    value={newDrug.therapeutic_class || ""}
                    onChange={e => setNewDrug({ ...newDrug, therapeutic_class: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="pmpm_cost">PMPM Cost</Label>
                  <Input
                    id="pmpm_cost"
                    type="number"
                    value={newDrug.pmpm_cost || ""}
                    onChange={e =>
                      setNewDrug({ ...newDrug, pmpm_cost: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={newDrug.state || ""}
                    onChange={e => setNewDrug({ ...newDrug, state: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDrug}>Add Drug</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-4 w-4 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Drugs</p>
                <p className="text-2xl font-bold">{summaryStats.totalDrugs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-success/10 rounded-lg">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">
                  ${summaryStats.totalCost.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-info/10 rounded-lg">
                <Users className="h-4 w-4 text-info" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{summaryStats.totalMembers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Calendar className="h-4 w-4 text-warning" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg Age</p>
                <p className="text-2xl font-bold">{summaryStats.avgAge} years</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by drug name, NDC, ATC code..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full md:w-64">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Therapeutic Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {therapeuticClasses.map(cls => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTE} onValueChange={setSelectedTE}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Therapeutic Equivalence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All TE Codes</SelectItem>
                <SelectItem value="ab">AB Rated</SelectItem>
                <SelectItem value="na">No TE Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Drug Database Table */}
      <Card>
        <CardHeader>
          <CardTitle>Drug Database ({filteredDrugs.length} drugs)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NDC</TableHead>
                  <TableHead>Drug Name</TableHead>
                  <TableHead>Generic Name</TableHead>
                  <TableHead>Therapeutic Class</TableHead>
                  <TableHead>TE Code</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>PMPM</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Clinical Efficacy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrugs.map(drug => (
                  <TableRow key={drug.ndc}>
                    <TableCell className="font-mono text-sm">{drug.ndc}</TableCell>
                    <TableCell className="font-medium">{drug.drug_name}</TableCell>
                    <TableCell className="text-muted-foreground">{drug.generic_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{drug.therapeutic_class}</Badge>
                    </TableCell>
                    <TableCell>
                      {getTherapeuticEquivalenceBadge(drug.therapeutic_equivalence_code)}
                    </TableCell>
                    <TableCell>{formatCurrency(drug.total_drug_cost)}</TableCell>
                    <TableCell>{formatCurrency(drug.pmpm_cost)}</TableCell>
                    <TableCell>{formatNumber(drug.member_count)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{drug.state}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={drug.clinical_efficacy}>
                      {drug.clinical_efficacy}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}