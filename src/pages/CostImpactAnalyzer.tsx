// CostImpactAnalyzer.tsx
import axios from 'axios';
import { AlertCircle, DollarSign, Percent, TrendingDown } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Area,
    AreaChart,
} from 'recharts';

// --- UI Components (Card Primitives) ---
const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`} {...props} />
);
const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 pb-2 ${className}`} {...props} />
);
const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-lg font-semibold tracking-tight ${className}`} {...props} />
);
const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm text-gray-500 ${className}`} {...props} />
);
const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 pt-0 ${className}`} {...props} />
);

const Alert = ({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: 'destructive' | 'default' }) => {
  const variantClasses = variant === 'destructive'
    ? 'bg-red-50 border-red-200 text-red-800'
    : 'bg-blue-50 border-blue-200 text-blue-800';
  return <div className={`border p-4 rounded-lg flex items-start space-x-3 ${variantClasses} ${className}`} {...props} />;
};

const AlertTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h5 className={`font-medium ${className}`} {...props} />
);

const AlertDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <div className={`text-sm ${className}`} {...props} />
);

const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-gray-200 rounded-md animate-pulse ${className}`} {...props} />
);

// --- KPI Card Component (same as Dashboard) ---
const KPICard = ({ title, value, icon, format }: { title: string; value: string | number; icon: React.ReactNode; format?: 'currency' | 'percentage' | 'number' }) => {
  const formattedValue = format === 'currency'
    ? `$${(Number(value) || 0).toFixed(2)}`
    : format === 'percentage'
    ? `${(Number(value) || 0).toFixed(1)}%`
    : (Number(value) || 0).toLocaleString();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className="text-gray-400">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
      </CardContent>
    </Card>
  );
};

interface CostRecord {
  id: number;
  original_cost: number;
  reduced_cost: number;
  timestamp: string;
}

export default function CostImpactAnalyzer() {
  const [summary, setSummary] = useState<any>(null);
  const [records, setRecords] = useState<CostRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API base URL
  const API_BASE_URL = 'http://localhost:8000/api';

  useEffect(() => {
    const fetchSummaryAndRecords = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch summary and records in parallel
        const [summaryResp, recordsResp] = await Promise.all([
          axios.get(`${API_BASE_URL}/cia/summary`),
          axios.get(`${API_BASE_URL}/cia/records`)
        ]);

        setSummary(summaryResp.data);
        // normalize records - ensure numeric
        const recs: CostRecord[] = (recordsResp.data.records || []).map((r: any) => ({
          id: Number(r.id),
          original_cost: Number(r.original_cost) || 0,
          reduced_cost: Number(r.reduced_cost) || 0,
          timestamp: r.timestamp || r.created_at || new Date().toISOString()
        }));
        setRecords(recs);
      } catch (err: any) {
        console.error('Error fetching cost data:', err);
        if (err.response) {
          setError(`Server Error (${err.response.status}): ${err.response.data?.error || 'Unknown error'}`);
        } else if (err.request) {
          setError("Network Error: Could not connect to the server. Is it running?");
        } else {
          setError(`An unexpected error occurred: ${err.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummaryAndRecords();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800">Cost Impact Analyzer</h1>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-3 mt-4">
          <Skeleton className="h-72 md:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  // Transform records for chart: reverse chronological -> chronological for chart display
  const chartData = records
    .slice()
    .reverse()
    .map(r => ({
      ...r,
      timestampLabel: new Date(r.timestamp).toLocaleString(),
      original_cost: Number(r.original_cost),
      reduced_cost: Number(r.reduced_cost)
    }));

  // Build cumulative savings data
  let cumulative = 0;
  const cumulativeData = chartData.map(r => {
    const savings = r.original_cost - r.reduced_cost;
    cumulative += savings;
    return {
      ...r,
      cumulative_savings: cumulative
    };
  });

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold tracking-tight text-gray-800">Cost Impact Analyzer</h1>
      
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <KPICard 
            title="Original Total Cost" 
            value={summary?.original_total_cost || 0} 
            format="currency"
            icon={<DollarSign className="h-4 w-4" />} 
          />
          <KPICard 
            title="Reduced Total Cost" 
            value={summary?.reduced_total_cost || 0} 
            format="currency"
            icon={<TrendingDown className="h-4 w-4" />} 
          />
          <KPICard 
            title="Cost Reduction (%)" 
            value={summary?.reduction_percent || 0} 
            format="percentage"
            icon={<Percent className="h-4 w-4" />} 
          />
        </div>
      )}

      {/* Chart + Table layout */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Trend Chart spans 2 columns on medium+ */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Cost Trend Over Time</CardTitle>
            <CardDescription>Compare original vs reduced costs across recorded timestamps.</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="py-8 text-center text-gray-500">No records available to plot.</div>
            ) : (
              <>
                {/* Original vs Reduced Costs */}
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestampLabel" tick={{ fontSize: 11 }} minTickGap={20} />
                      <YAxis />
                      <Tooltip formatter={(value: any) => (typeof value === 'number' ? `$${value.toFixed(2)}` : value)} />
                      <Legend />
                      <Line type="monotone" dataKey="original_cost" name="Original Cost" stroke="#4f46e5" strokeWidth={2} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="reduced_cost" name="Reduced Cost" stroke="#059669" strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* NEW Cumulative Savings Chart */}
                <div style={{ width: '100%', height: 280, marginTop: 32 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulativeData} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestampLabel" tick={{ fontSize: 11 }} minTickGap={20} />
                      <YAxis />
                      <Tooltip formatter={(value: any) => (typeof value === 'number' ? `$${value.toFixed(2)}` : value)} />
                      <Legend />
                      <Area type="monotone" dataKey="cumulative_savings" name="Cumulative Savings" stroke="#16a34a" fill="#bbf7d0" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Before & After Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Before & After Comparison</CardTitle>
            <CardDescription>Original drug cost vs reduced (alternate) cost — latest records first.</CardDescription>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="py-8 text-center text-gray-500">No comparison records available.</div>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Original Cost ($)</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Reduced Cost ($)</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Savings ($)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {records.slice(0, 20).map(r => {
                      const savings = Number(r.original_cost) - Number(r.reduced_cost);
                      return (
                        <tr key={r.id}>
                          <td className="px-3 py-3 text-sm text-gray-700">{new Date(r.timestamp).toLocaleString()}</td>
                          <td className="px-3 py-3 text-sm text-right font-medium">${Number(r.original_cost).toFixed(2)}</td>
                          <td className="px-3 py-3 text-sm text-right font-medium">${Number(r.reduced_cost).toFixed(2)}</td>
                          <td className={`px-3 py-3 text-sm text-right font-medium ${savings > 0 ? 'text-green-600' : 'text-gray-700'}`}>
                            ${savings.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {records.length > 20 && (
                  <div className="mt-3 text-xs text-gray-500">Showing latest 20 records. Use API to fetch more if needed.</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
