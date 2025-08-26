import axios from 'axios';
import { AlertCircle, BarChart2, DollarSign, Info, Pill, Shield, ShieldAlert, ShieldCheck, ShieldX, TestTube2, TrendingDown } from 'lucide-react';
import React, { useEffect, useState } from 'react';

// --- Configuration ---
const API_BASE_URL = 'http://localhost:8000/api';

// --- Type Definitions ---
interface Drug {
  drug_name: string;
  generic_name: string;
  pmpm_cost: number;
  therapeutic_class: string;
  [key: string]: any; // Allow other properties
}

interface RecommendationResponse {
  original_drugs: Drug[];
  recommended_drugs?: Drug[];
  analysis?: any;
  error?: string;
}

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
const Button = ({ className, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    disabled={disabled}
    {...props}
  />
);
const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" {...props}>
    {children}
  </select>
);

// --- Dashboard Sub-Components ---

const KPICard = ({ title, value, icon, format }: { title: string; value: number; icon: React.ReactNode; format?: 'currency' | 'number' }) => {
  const formattedValue = format === 'currency'
    ? `$${(value || 0).toFixed(2)}`
    : (value || 0).toLocaleString();

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

const DrugCard = ({ drug, className }: { drug: Drug; className?: string }) => {
  if (!drug) return <Card className={`p-4 text-center text-gray-500 ${className}`}>No Drug Data</Card>;
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{drug.drug_name}</CardTitle>
        <CardDescription>{drug.generic_name}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="font-semibold text-gray-700">PMPM Cost</p>
          <p className="text-blue-600 font-bold">${(drug.pmpm_cost || 0).toFixed(2)}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-700">Therapeutic Class</p>
          <p>{drug.therapeutic_class}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const SafetyAnalysisCard = ({ title, interaction }: { title: string; interaction: { risk_label: string; description: string } }) => {
  const riskLabel = interaction?.risk_label || "No Interaction";
  const description = interaction?.description || "No interaction information available.";

  const getRiskDetails = (label: string) => {
    switch (label.toLowerCase()) {
      case 'high risk':
        return { icon: <ShieldX className="h-6 w-6 text-red-600" />, color: 'text-red-600', bgColor: 'bg-red-50' };
      case 'potential interaction':
        return { icon: <ShieldAlert className="h-6 w-6 text-yellow-600" />, color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
      case 'low risk':
        return { icon: <ShieldCheck className="h-6 w-6 text-green-600" />, color: 'text-green-600', bgColor: 'bg-green-50' };
      default:
        return { icon: <Shield className="h-6 w-6 text-gray-600" />, color: 'text-gray-600', bgColor: 'bg-gray-50' };
    }
  };

  const { icon, color, bgColor } = getRiskDetails(riskLabel);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`flex items-center p-3 rounded-lg ${bgColor}`}>
          {icon}
          <span className={`ml-3 text-xl font-bold ${color}`}>{riskLabel}</span>
        </div>
        <p className="text-sm text-gray-600 h-24 overflow-y-auto p-2 border rounded-md">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

// --- Main Dashboard Component ---

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [allDrugs, setAllDrugs] = useState<Drug[]>([]);
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>(['', '']);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drug1Suggestions, setDrug1Suggestions] = useState(false); // Added for Drug 1 suggestions
  const [drug2Suggestions, setDrug2Suggestions] = useState(false); // Added for Drug 2 suggestions

  // --- Improved Error Handling ---
  const handleApiError = (err: any, context: string) => {
    console.error(`Error ${context}:`, err);
    if (err.response) {
      const serverMessage = err.response.data?.error || 'No specific error message from server.';
      setError(`Server Error (${err.response.status}): ${serverMessage} Please check the server console for details.`);
    } else if (err.request) {
      setError("Network Error: Could not connect to the server. Is it running?");
    } else {
      setError(`An unexpected error occurred: ${err.message}`);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, drugsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/drug-stats`),
          axios.get(`${API_BASE_URL}/drugs`),
        ]);
        setStats(statsRes.data);
        const sortedDrugs = drugsRes.data.drugs.sort((a: Drug, b: Drug) => a.drug_name.localeCompare(b.drug_name));
        setAllDrugs(sortedDrugs);
      } catch (err: any) {
        handleApiError(err, "fetching initial data");
      }
    };
    fetchData();
  }, []);

  const handleGetRecommendation = async () => {
    const validDrugs = selectedDrugs.filter(Boolean);
    if (validDrugs.length === 0) {
      setError("Please select at least one drug.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setRecommendation(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/recommend`, {
        drug_names: validDrugs
      });
      setRecommendation(response.data);
    } catch (err: any) {
      handleApiError(err, "getting recommendation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrugSelection = (drugName: string, position: number) => {
    setSelectedDrugs(prev => {
      const newSelection = [...prev];
      newSelection[position] = drugName;
      return newSelection;
    });
    // Hide suggestions after selection
    if (position === 0) {
      setDrug1Suggestions(false);
    } else {
      setDrug2Suggestions(false);
    }
  };

  const renderRecommendationResult = () => {
    if (isLoading) {
      return <Skeleton className="h-72 w-full mt-6" />;
    }
    if (!recommendation) return null;
    if (recommendation.error) {
      return (
        <Alert variant="destructive" className="mt-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Model Response</AlertTitle>
          <AlertDescription>{recommendation.error}</AlertDescription>
        </Alert>
      );
    }
    if (!recommendation.analysis) {
      return (
        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Debug: Missing Analysis</AlertTitle>
          <AlertDescription>
            Recommendation received but missing analysis data. Check server logs for details.
          </AlertDescription>
        </Alert>
      );
    }
    if (recommendation.analysis?.type === 'single_drug' && recommendation.recommended_drugs?.length) {
      const original = recommendation.original_drugs[0];
      const recommended = recommendation.recommended_drugs[0];
      const { analysis } = recommendation;
      return (
        <Card className="mt-6 animate-in fade-in">
          <CardHeader>
            <CardTitle>Single Drug Recommendation Result</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-sm text-gray-500">Original Drug</h3>
              <DrugCard drug={original} />
              <h3 className="font-semibold mb-2 mt-4 text-sm text-gray-500">Recommended Alternative</h3>
              <DrugCard drug={recommended} className="border-2 border-blue-500" />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-lg">Impact Analysis</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-center">
                <div>
                  <p className="text-sm text-gray-500">Potential Saving Per Member</p>
                  <p className="text-3xl font-bold text-green-600">
                    ${(analysis.cost_saving_per_member || 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center justify-center p-3 bg-green-50 rounded-lg">
                  <TrendingDown className="h-6 w-6 mr-2 text-green-600" />
                  <span className="text-xl font-bold text-green-600">
                    {(analysis.percentage_saving || 0).toFixed(1)}% Cost Reduction
                  </span>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      );
    }
    if (recommendation.analysis?.type === 'combination' && recommendation.recommended_drugs?.length) {
      const [orig1, orig2] = recommendation.original_drugs;
      const [rec1, rec2] = recommendation.recommended_drugs;
      const { analysis } = recommendation;
      return (
        <Card className="mt-6 animate-in fade-in">
          <CardHeader><CardTitle>Drug Combination Recommendation Result</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-center text-gray-600">
                  Original Pair (Total: ${((orig1?.pmpm_cost || 0) + (orig2?.pmpm_cost || 0)).toFixed(2)})
                </h3>
                <div className="space-y-4">
                  <DrugCard drug={orig1} />
                  <DrugCard drug={orig2} />
                </div>
              </div>
              <div className='border-2 border-blue-500 rounded-lg p-4'>
                <h3 className="font-semibold mb-2 text-center text-blue-600">
                  Recommended Pair (Total: ${((rec1?.pmpm_cost || 0) + (rec2?.pmpm_cost || 0)).toFixed(2)})
                </h3>
                <div className="space-y-4">
                  <DrugCard drug={rec1} />
                  <DrugCard drug={rec2} />
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="md:col-span-1">
                <CardHeader><CardTitle className="text-lg">Financial Impact</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-center">
                  <div>
                    <p className="text-sm text-gray-500">Total Potential Monthly Saving</p>
                    <p className="text-3xl font-bold text-green-600">
                      ${(analysis.total_cost_saving || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center justify-center p-3 bg-green-50 rounded-lg">
                    <TrendingDown className="h-6 w-6 mr-2 text-green-600" />
                    <span className="text-lg font-bold text-green-600">
                      {(analysis.percentage_saving || 0).toFixed(1)}% Reduction
                    </span>
                  </div>
                </CardContent>
              </Card>
              <SafetyAnalysisCard title="Original Pair Safety" interaction={analysis.original_interaction} />
              <SafetyAnalysisCard title="Recommended Pair Safety" interaction={analysis.recommended_interaction} />
            </div>
          </CardContent>
        </Card>
      );
    }
    return null; // No matching condition, render nothing
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold tracking-tight text-gray-800">PBM Analytics Dashboard</h1>
      
      {error && !stats ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Initialization Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <KPICard title="Total Unique Drugs" value={stats?.total_drugs} icon={<Pill className="h-4 w-4" />} />
          <KPICard title="Avg. PMPM Cost" value={stats?.avg_pmpm_cost} format="currency" icon={<DollarSign className="h-4 w-4" />} />
          <KPICard title="Therapeutic Classes" value={stats?.therapeutic_classes} icon={<BarChart2 className="h-4 w-4" />} />
          <KPICard title="Total Prescriptions" value={stats?.total_prescriptions} icon={<TestTube2 className="h-4 w-4" />} />
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Drug Alternative Recommender</CardTitle>
          <CardDescription>Select one or two drugs to find cost-effective, safe alternatives.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="w-full relative">
            <input
              type="text"
              placeholder="Type Drug 1..."
              value={selectedDrugs[0]}
              onChange={(e) => {
                handleDrugSelection(e.target.value, 0);
                setDrug1Suggestions(true); // Show suggestions when typing
              }}
              onFocus={() => setDrug1Suggestions(true)} // Show suggestions on focus
              onBlur={() => setTimeout(() => setDrug1Suggestions(false), 150)} // Hide suggestions after a delay
              className="w-full p-2 border border-gray-200 rounded-lg shadow-sm text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-300 transition-colors"
            />
            {drug1Suggestions && selectedDrugs[0] && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-sm max-h-60 overflow-y-auto">
                {allDrugs
                  .filter((d) => d.drug_name.toLowerCase().includes(selectedDrugs[0].toLowerCase()))
                  .map((d, i) => (
                    <li
                      key={`${d.drug_name}-1-${i}`}
                      onClick={() => {
                        handleDrugSelection(d.drug_name, 0);
                        setDrug1Suggestions(false); // Hide suggestions after selection
                      }}
                      className="p-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                    >
                      {d.drug_name}
                    </li>
                  ))
                }
              </ul>
            )}
          </div>
          <div className="w-full relative">
            <input
              type="text"
              placeholder="Type Drug 2 (Optional)..."
              value={selectedDrugs[1]}
              onChange={(e) => {
                handleDrugSelection(e.target.value, 1);
                setDrug2Suggestions(true); // Show suggestions when typing
              }}
              onFocus={() => setDrug2Suggestions(true)} // Show suggestions on focus
              onBlur={() => setTimeout(() => setDrug2Suggestions(false), 150)} // Hide suggestions after a delay
              className="w-full p-2 border border-gray-200 rounded-lg shadow-sm text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-300 transition-colors"
            />
            {drug2Suggestions && selectedDrugs[1] && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-sm max-h-60 overflow-y-auto">
                {allDrugs
                  .filter((d) => d.drug_name.toLowerCase().includes(selectedDrugs[1].toLowerCase()))
                  .map((d, i) => (
                    <li
                      key={`${d.drug_name}-2-${i}`}
                      onClick={() => {
                        handleDrugSelection(d.drug_name, 1);
                        setDrug2Suggestions(false); // Hide suggestions after selection
                      }}
                      className="p-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                    >
                      {d.drug_name}
                    </li>
                  ))
                }
              </ul>
            )}
          </div>
          <Button
            onClick={handleGetRecommendation}
            disabled={isLoading || !allDrugs.length || selectedDrugs.filter(Boolean).length === 0}
            className="w-full md:w-auto flex-shrink-0"
          >
            {isLoading ? "Analyzing..." : "Get Recommendation"}
          </Button>
        </CardContent>
      </Card>
      
      {error && stats && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {renderRecommendationResult()}
    </div>
  );
}