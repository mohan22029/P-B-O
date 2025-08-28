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
import { toast } from "sonner";

// Define the Drug interface
interface Drug {
  ndc: string;
  drug_name: string;
  generic_name: string;
  therapeutic_class: string;
  therapeutic_equivalence_code?: string | null;
  atc_code?: string;
  total_drug_cost?: number | string | null;
  pmpm_cost?: number | string | null;
  member_count?: number | string | null;
  avg_age?: number | string | null;
  state?: string;
  clinical_efficacy?: string;
  total_prescription_fills?: number;
  drug_interactions?: string;
  repeat_utilization?: number;
  [key: string]: any;
}

// API service
const apiService = {
  getDrugs: async () => {
    try {
      console.log('🔄 Fetching drug database from server...');
      const response = await fetch('http://localhost:8000/api/drugs', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Drug database loaded successfully:', {
        total_count: data.total_count,
        summary: data.summary
      });

      return data;
    } catch (error) {
      console.error('❌ Error fetching drug database:', error);
      throw error;
    }
  },

  addDrug: async (drug: Partial<Drug>) => {
    try {
      console.log('🔄 Adding new drug:', drug.drug_name);
      const response = await fetch('http://localhost:8000/api/drugs/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify(drug),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add drug');
      }
      
      const result = await response.json();
      console.log('✅ Drug added successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error adding drug:', error);
      throw error;
    }
  }
};

// Fixed function - changed "No TE" to "NA"
const getTherapeuticEquivalenceBadge = (te_code: string | null) => {
  if (!te_code || te_code === "NA" || te_code === "null" || te_code === null) {
    return <Badge variant="secondary">NA</Badge>;
  }

  const color = te_code.startsWith("AB") ? "bg-green-500 text-white" : "bg-yellow-500 text-white";
  return <Badge className={color}>{te_code}</Badge>;
};

const formatCurrency = (value: string | number | null | undefined) => {
  if (value == null) return "N/A";
  if (typeof value === "string") {
    const numValue = parseFloat(value.replace(/[$,]/g, ""));
    return isNaN(numValue) ? value : `$${numValue.toLocaleString()}`;
  }
  return `$${Number(value).toLocaleString()}`;
};

const formatNumber = (value: string | number | null | undefined) => {
  if (value == null) return "N/A";
  if (typeof value === "string") {
    const numValue = parseInt(value.replace(/,/g, ""));
    return isNaN(numValue) ? value : numValue.toLocaleString();
  }
  return Number(value).toLocaleString();
};

export default function DrugDatabase() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedTE, setSelectedTE] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDrug, setNewDrug] = useState<Partial<Drug>>({});
  const [serverInfo, setServerInfo] = useState<any>(null);

  useEffect(() => {
    loadDrugs();
  }, []);

  const loadDrugs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Test server connection first
      const healthResponse = await fetch('http://localhost:8000/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ Server health check:', healthData);
        setServerInfo(healthData);
      }

      const response = await apiService.getDrugs();
      
      const validDrugs = response.drugs.map((drug: any, index: number) => ({
        ...drug,
        // Generate unique NDC if missing, using index to ensure uniqueness
        ndc: drug.ndc || `NDC-${index.toString().padStart(5, '0')}`,
        total_drug_cost: drug.total_drug_cost ?? 0,
        pmpm_cost: drug.pmpm_cost ?? 0,
        member_count: drug.member_count ?? 0,
        avg_age: drug.avg_age ?? 0,
        atc_code: drug.atc_code || 'N/A',
        state: drug.state || 'N/A',
        clinical_efficacy: drug.clinical_efficacy || 'Data not available',
        // Ensure therapeutic_equivalence_code is properly handled
        therapeutic_equivalence_code: drug.therapeutic_equivalence_code === null || 
                                    drug.therapeutic_equivalence_code === undefined ||
                                    drug.therapeutic_equivalence_code === "null" ? 
                                    "NA" : drug.therapeutic_equivalence_code,
        // Add a unique identifier for better tracking
        _unique_id: `${drug.drug_name}_${drug.generic_name}_${index}`
      }));
      
      console.log(`✅ Loaded ${validDrugs.length} drugs from database (should be 97)`);
      setDrugs(validDrugs);
    } catch (error) {
      console.error('❌ Error loading drugs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to load drug database: ${errorMessage}`);
      toast.error("Failed to load drugs: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const therapeuticClasses = useMemo(() => {
    // Remove duplicates and filter out empty values
    const classes = [...new Set(drugs.map(drug => drug.therapeutic_class))].filter(Boolean);
    return classes.sort();
  }, [drugs]);

  // IMPROVED FILTERING LOGIC - Keep all unique records
  const filteredDrugs = useMemo(() => {
    console.log('🔄 Applying filters:', { searchTerm, selectedClass, selectedTE });
    
    let filtered = drugs.filter(drug => {
      // Search filter - case insensitive, handle null/undefined values
      let matchesSearch = true;
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        matchesSearch = [
          drug.drug_name,
          drug.generic_name, 
          drug.ndc,
          drug.atc_code
        ].some(field => 
          field && field.toString().toLowerCase().includes(searchLower)
        );
      }

      // Class filter - exact match
      let matchesClass = true;
      if (selectedClass !== "all") {
        matchesClass = drug.therapeutic_class === selectedClass;
      }

      // TE filter - handle different cases properly
      let matchesTE = true;
      if (selectedTE !== "all") {
        const teCode = drug.therapeutic_equivalence_code;
        
        if (selectedTE === "na") {
          // Match NA, null, undefined, empty string, "null"
          matchesTE = !teCode || 
                     teCode === "NA" || 
                     teCode === "null" || 
                     teCode === "" ||
                     teCode.toString().toLowerCase() === "na";
        } else if (selectedTE === "ab") {
          // Match codes that start with "AB" (case insensitive)
          matchesTE = teCode && 
                     teCode !== "NA" && 
                     teCode !== "null" &&
                     teCode.toString().toUpperCase().startsWith("AB");
        }
      }

      return matchesSearch && matchesClass && matchesTE;
    });

    console.log(`✅ Filtered ${filtered.length} drugs from ${drugs.length} total`);

    // **IMPROVED DUPLICATE REMOVAL** - Only remove true duplicates
    const uniqueFiltered = filtered.filter((drug, index, array) => {
      // Only remove duplicates if they have EXACT same drug_name + generic_name + therapeutic_class
      // This is more conservative and won't remove legitimate different formulations
      const duplicateIndex = array.findIndex(d => 
        d.drug_name === drug.drug_name && 
        d.generic_name === drug.generic_name &&
        d.therapeutic_class === drug.therapeutic_class &&
        // Only consider true duplicates if they also have same PMPM cost
        Math.abs((Number(d.pmpm_cost) || 0) - (Number(drug.pmpm_cost) || 0)) < 0.01
      );
      
      // Keep the first occurrence of each unique combination
      return duplicateIndex === index;
    });

    console.log(`✅ After conservative deduplication: ${uniqueFiltered.length} unique drugs`);
    
    // **DEBUG: Show what got filtered out**
    const removedCount = filtered.length - uniqueFiltered.length;
    if (removedCount > 0) {
      console.log(`⚠️ Removed ${removedCount} duplicate entries`);
    }
    
    return uniqueFiltered;
  }, [drugs, searchTerm, selectedClass, selectedTE]);

  const summaryStats = useMemo(() => {
    const totalCost = filteredDrugs.reduce((sum, drug) => {
      const cost =
        typeof drug.total_drug_cost === "string"
          ? parseFloat(drug.total_drug_cost.replace(/[$,]/g, "")) || 0
          : Number(drug.total_drug_cost ?? 0);
      return sum + cost;
    }, 0);

    const totalMembers = filteredDrugs.reduce((sum, drug) => {
      const members =
        typeof drug.member_count === "string"
          ? parseInt(drug.member_count.replace(/,/g, "")) || 0
          : Number(drug.member_count ?? 0);
      return sum + members;
    }, 0);

    const avgAge =
      filteredDrugs.reduce((sum, drug) => sum + Number(drug.avg_age ?? 0), 0) /
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
      await loadDrugs();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error("Failed to add drug: " + errorMessage);
    }
  };

  const exportData = () => {
    if (!filteredDrugs.length) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      'NDC', 'Drug Name', 'Generic Name', 'Therapeutic Class', 'TE Code',
      'Total Cost', 'PMPM Cost', 'Member Count', 'State', 'Clinical Efficacy'
    ];

    const csvContent = [
      headers.join(","),
      ...filteredDrugs.map(drug => [
        drug.ndc || '',
        `"${drug.drug_name || ''}"`,
        `"${drug.generic_name || ''}"`,
        `"${drug.therapeutic_class || ''}"`,
        drug.therapeutic_equivalence_code || '',
        drug.total_drug_cost || 0,
        drug.pmpm_cost || 0,
        drug.member_count || 0,
        drug.state || '',
        `"${drug.clinical_efficacy || ''}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "drug_database.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Data exported successfully!");
  };

  // Enhanced debug function
  const debugFilters = () => {
    console.log('🐛 Enhanced Debug Info:');
    console.log('Total drugs loaded from server:', drugs.length);
    console.log('Expected drugs in database:', 97);
    console.log('Current filters:', { searchTerm, selectedClass, selectedTE });
    console.log('Therapeutic classes available:', therapeuticClasses.length);
    console.log('Filtered drugs:', filteredDrugs.length);
    
    // Check for potential duplicates
    const drugNames = drugs.map(d => d.drug_name);
    const uniqueDrugNames = [...new Set(drugNames)];
    console.log('Unique drug names:', uniqueDrugNames.length);
    console.log('Total drug entries:', drugNames.length);
    
    if (uniqueDrugNames.length !== drugNames.length) {
      console.log('⚠️ Found duplicate drug names:');
      const duplicates = drugNames.filter((name, index) => drugNames.indexOf(name) !== index);
      console.log('Duplicate names:', [...new Set(duplicates)]);
    }
    
    // Show some sample drugs with all their key fields
    console.log('Sample drugs (first 5):');
    drugs.slice(0, 5).forEach((drug, idx) => {
      console.log(`${idx + 1}. ${drug.drug_name} | ${drug.generic_name} | TE: "${drug.therapeutic_equivalence_code}" | NDC: ${drug.ndc}`);
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <span className="ml-2">Loading drug database...</span>
        {serverInfo && (
          <div className="text-xs text-gray-500 mt-2">
            Server: {serverInfo.status} | Dataset: {serverInfo.dataset_size} records
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center max-w-2xl mx-auto">
        <AlertTriangle className="h-8 w-8 text-red-500 mb-4" />
        <div className="text-red-600 text-lg font-semibold mb-2">❌ {error}</div>
        <div className="text-gray-600 mb-4 text-sm">
          <p>Troubleshooting steps:</p>
          <ul className="list-disc list-inside text-left mt-2 space-y-1">
            <li>Make sure the server is running: <code className="bg-gray-200 px-1 rounded">python server.py</code></li>
            <li>Check server health: <a href="http://localhost:8000/health" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">http://localhost:8000/health</a></li>
            <li>Verify the test002.csv file exists in the data/ folder</li>
            <li>Check browser console for detailed errors</li>
          </ul>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadDrugs} variant="default">
            Retry
          </Button>
          <Button 
            onClick={() => fetch('http://localhost:8000/health').then(r => r.json()).then(console.log).catch(console.error)}
            variant="outline"
          >
            Test Connection
          </Button>
        </div>
      </div>
    );
  }

  if (!drugs.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
        <span>No drugs found in the database. Check if test002.csv has data.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header - Enhanced with better info */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Drug Database</h1>
          {/* <p className="text-gray-600">
            Comprehensive pharmaceutical database from test002.csv with therapeutic equivalence analysis
          </p> */}
          {serverInfo && (
            <p className="text-xs text-gray-500 mt-1">
              Server: {serverInfo.status} | Dataset: {serverInfo.dataset_size} records 
              {/* Loaded: {drugs.length} drugs | Showing: {filteredDrugs.length} unique drugs
              {drugs.length !== 97 && (
                <span className="text-red-500"> ⚠️ Expected 97, got {drugs.length}</span>
              )} */}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          {/* <Button variant="outline" onClick={debugFilters} size="sm">
            🐛 Debug
          </Button> */}
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
                  Enter the details for the new drug entry. This will be added to the in-memory database.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ndc">NDC</Label>
                  <Input
                    id="ndc"
                    placeholder="Auto-generated if empty"
                    value={newDrug.ndc || ""}
                    onChange={e => setNewDrug({ ...newDrug, ndc: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="drug_name">Drug Name *</Label>
                  <Input
                    id="drug_name"
                    required
                    value={newDrug.drug_name || ""}
                    onChange={e => setNewDrug({ ...newDrug, drug_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="generic_name">Generic Name *</Label>
                  <Input
                    id="generic_name"
                    required
                    value={newDrug.generic_name || ""}
                    onChange={e => setNewDrug({ ...newDrug, generic_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="therapeutic_class">Therapeutic Class *</Label>
                  <Input
                    id="therapeutic_class"
                    required
                    value={newDrug.therapeutic_class || ""}
                    onChange={e => setNewDrug({ ...newDrug, therapeutic_class: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="pmpm_cost">PMPM Cost</Label>
                  <Input
                    id="pmpm_cost"
                    type="number"
                    step="0.01"
                    value={newDrug.pmpm_cost || ""}
                    onChange={e =>
                      setNewDrug({ ...newDrug, pmpm_cost: parseFloat(e.target.value) || 0 })
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
                <Button 
                  onClick={handleAddDrug}
                  disabled={!newDrug.drug_name || !newDrug.generic_name || !newDrug.therapeutic_class}
                >
                  Add Drug
                </Button>
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
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Drugs</p>
                <p className="text-2xl font-bold">{summaryStats.totalDrugs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
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
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold">{summaryStats.totalMembers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Age</p>
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
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
                <SelectItem value="all">All Classes ({therapeuticClasses.length})</SelectItem>
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
                <SelectItem value="ab">AB Rated Only</SelectItem>
                <SelectItem value="na">NA (No Rating) Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Summary */}
          {(searchTerm || selectedClass !== "all" || selectedTE !== "all") && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchTerm && (
                <Badge variant="outline">
                  Search: "{searchTerm}"
                  <button 
                    onClick={() => setSearchTerm("")} 
                    className="ml-1 text-xs"
                  >
                    ✕
                  </button>
                </Badge>
              )}
              {selectedClass !== "all" && (
                <Badge variant="outline">
                  Class: {selectedClass}
                  <button 
                    onClick={() => setSelectedClass("all")} 
                    className="ml-1 text-xs"
                  >
                    ✕
                  </button>
                </Badge>
              )}
              {selectedTE !== "all" && (
                <Badge variant="outline">
                  TE: {selectedTE.toUpperCase()}
                  <button 
                    onClick={() => setSelectedTE("all")} 
                    className="ml-1 text-xs"
                  >
                    ✕
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drug Database Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Drug Database ({filteredDrugs.length} unique drugs)
            {filteredDrugs.length !== drugs.length && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (filtered from {drugs.length} total)
              </span>
            )}
          </CardTitle>
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
                {filteredDrugs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-gray-500 py-8">
                      No drugs found matching the current filters.
                      <br />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedClass("all");
                          setSelectedTE("all");
                        }}
                        className="mt-2"
                      >
                        Clear All Filters
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDrugs.map((drug, index) => (
                    <TableRow key={drug._unique_id || `${drug.ndc}-${drug.drug_name}-${index}`}>
                      <TableCell className="font-mono text-sm">{drug.ndc || 'N/A'}</TableCell>
                      <TableCell className="font-medium">{drug.drug_name}</TableCell>
                      <TableCell className="text-gray-600">{drug.generic_name}</TableCell>
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
                        <Badge variant="secondary">{drug.state || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={drug.clinical_efficacy}>
                        {drug.clinical_efficacy || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
