// Formulary.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle, Clock, Download, Filter, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";

const getTierColor = (tier) => {
  switch (tier) {
    case 'Preferred':
      return 'bg-green-500 text-white'; // Example color
    case 'Non-Preferred':
      return 'bg-yellow-500 text-white'; // Example color
    case 'Specialty':
      return 'bg-purple-500 text-white'; // Example color
    case 'Excluded':
      return 'bg-red-500 text-white'; // Example color
    default:
      return 'bg-gray-400 text-white'; // Example color
  }
};

export default function Formulary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [paFilter, setPaFilter] = useState("all");
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50); // This can remain as pageSize internally
  const [stats, setStats] = useState({ total: 0, pa: 0, step: 0 });
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);

  // Effect for fetching stats
  useEffect(() => {
    setLoading(true);
    // Note: Ensure your backend's CORS policy allows requests from your frontend's origin.
    // The provided server.py might be configured for http://localhost:8080 only.
    fetch('http://localhost:8000/api/stats')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setStats(data);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to fetch stats:', err);
        setError('Failed to load stats. Please ensure the backend is running and accessible.');
      })
      .finally(() => setLoading(false));
  }, []);

  // Effect for fetching formulary data
  useEffect(() => {
    setLoading(true);
    // Note: Ensure your backend's CORS policy allows requests from your frontend's origin.
    const url = `http://localhost:8000/api/formulary?search=${encodeURIComponent(searchTerm)}&tier=${tierFilter}&pa=${paFilter}&page=${page}&limit=${pageSize}`;
    
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(({ data, total }) => {
        setData(data);
        setTotal(total);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to fetch formulary:', err);
        setError('Failed to load formulary data. Please ensure the backend is running and accessible.');
      })
      .finally(() => setLoading(false));
  }, [searchTerm, tierFilter, paFilter, page, pageSize]); // Added pageSize to dependency array

  return (
    <div className="space-y-6">
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

      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="p-4 text-red-700 flex items-center">
             <AlertTriangle className="h-5 w-5 mr-3" />
            {error}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Drugs</p>
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">PA Required</p>
                <p className="text-2xl font-bold">{stats.pa.toLocaleString()}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Step Therapy</p>
                <p className="text-2xl font-bold">{stats.step.toLocaleString()}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

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
                {/* UPDATED: Changed placeholder to reflect new backend search capabilities */}
                <Input
                  placeholder="Search by RXCUI or NDC..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1); // Reset to first page on new search
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={tierFilter} onValueChange={(value) => { setTierFilter(value); setPage(1); }}>
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
            <Select value={paFilter} onValueChange={(value) => { setPaFilter(value); setPage(1); }}>
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

      <Card>
        <CardHeader>
          <CardTitle>Formulary Entries ({total.toLocaleString()})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !data.length ? (
            <p>Loading...</p>
          ) : total === 0 && !error ? (
            <p>No results found. Try adjusting your filters.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NDC</TableHead>
                    {/* UPDATED: Changed header to reflect that name is now just the RXCUI */}
                    <TableHead>Drug Identifier (RXCUI)</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Prior Auth</TableHead>
                    <TableHead>Step Therapy</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((entry, index) => (
                    <TableRow key={`${entry.ndc}-${index}`}>
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
              <div className="flex justify-center items-center space-x-4 mt-4">
                <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>
                  Previous
                </Button>
                <span>Page {page} of {Math.ceil(total / pageSize)}</span>
                <Button onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= total || loading}>
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
