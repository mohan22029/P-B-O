import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiService, type Drug } from "@/lib/api";
import {
  Activity,
  AlertTriangle,
  LineChart as LineChartIcon,
  Target,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { toast } from "sonner";

interface ForecastData {
  period: string;
  actual?: number;
  predicted: number;
  confidence_lower: number;
  confidence_upper: number;
  category: string;
}

interface DrugForecast {
  drug_name: string;
  current_cost: number;
  predicted_cost_3m: number;
  predicted_cost_6m: number;
  predicted_cost_12m: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  risk_level: 'low' | 'medium' | 'high';
}

// Generate mock forecast data based on drug properties
const generateForecastData = (drugs: Drug[]): DrugForecast[] => {
  return drugs.map(drug => {
    const baseCost = drug.pmpm_cost;
    const volatility = Math.random() * 0.3 + 0.1; // 10-40% volatility
    const trendFactor = Math.random() * 0.4 - 0.2; // -20% to +20% trend
    
    const predicted_3m = baseCost * (1 + trendFactor * 0.25 + (Math.random() - 0.5) * volatility);
    const predicted_6m = baseCost * (1 + trendFactor * 0.5 + (Math.random() - 0.5) * volatility);
    const predicted_12m = baseCost * (1 + trendFactor + (Math.random() - 0.5) * volatility);
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (predicted_12m > baseCost * 1.1) trend = 'increasing';
    else if (predicted_12m < baseCost * 0.9) trend = 'decreasing';
    
    const confidence = Math.random() * 30 + 70; // 70-100% confidence
    const risk_level = confidence > 85 ? 'low' : confidence > 70 ? 'medium' : 'high';
    
    return {
      drug_name: drug.drug_name,
      current_cost: baseCost,
      predicted_cost_3m: Math.max(0, predicted_3m),
      predicted_cost_6m: Math.max(0, predicted_6m),
      predicted_cost_12m: Math.max(0, predicted_12m),
      trend,
      confidence: Math.round(confidence),
      risk_level
    };
  });
};

const generateTimeSeriesData = (forecast: DrugForecast): ForecastData[] => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data: ForecastData[] = [];
  
  // Historical data (6 months)
  for (let i = -6; i <= 0; i++) {
    const monthIndex = (new Date().getMonth() + i + 12) % 12;
    const variation = (Math.random() - 0.5) * 0.2;
    const actual = forecast.current_cost * (1 + variation);
    
    data.push({
      period: months[monthIndex],
      actual: actual,
      predicted: actual,
      confidence_lower: actual * 0.9,
      confidence_upper: actual * 1.1,
      category: 'historical'
    });
  }
  
  // Future predictions
  const predictions = [
    { months: 3, cost: forecast.predicted_cost_3m },
    { months: 6, cost: forecast.predicted_cost_6m },
    { months: 12, cost: forecast.predicted_cost_12m }
  ];
  
  predictions.forEach(pred => {
    const monthIndex = (new Date().getMonth() + pred.months) % 12;
    const confidenceRange = pred.cost * (1 - forecast.confidence / 100) * 0.5;
    
    data.push({
      period: months[monthIndex],
      predicted: pred.cost,
      confidence_lower: pred.cost - confidenceRange,
      confidence_upper: pred.cost + confidenceRange,
      category: 'forecast'
    });
  });
  
  return data;
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'increasing': return <TrendingUp className="h-4 w-4 text-destructive" />;
    case 'decreasing': return <TrendingDown className="h-4 w-4 text-success" />;
    default: return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
};

const getRiskBadge = (risk: string) => {
  switch (risk) {
    case 'low': return <Badge className="bg-success text-white">Low Risk</Badge>;
    case 'medium': return <Badge className="bg-warning text-white">Medium Risk</Badge>;
    case 'high': return <Badge className="bg-destructive text-white">High Risk</Badge>;
    default: return <Badge variant="secondary">Unknown</Badge>;
  }
};

export default function Forecasting() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [forecasts, setForecasts] = useState<DrugForecast[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<string>("");
  const [selectedTimeframe, setSelectedTimeframe] = useState("12m");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDrugs();
      setDrugs(response.drugs);
      
      // Generate forecast data
      const forecastData = generateForecastData(response.drugs.slice(0, 50)); // Limit for performance
      setForecasts(forecastData);
      
      if (forecastData.length > 0) {
        setSelectedDrug(forecastData[0].drug_name);
      }
    } catch (error) {
      toast.error("Failed to load data: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const selectedForecast = forecasts.find(f => f.drug_name === selectedDrug);
  const timeSeriesData = selectedForecast ? generateTimeSeriesData(selectedForecast) : [];

  // Aggregate statistics
  const increasingTrends = forecasts.filter(f => f.trend === 'increasing').length;
  const decreasingTrends = forecasts.filter(f => f.trend === 'decreasing').length;
  const highRiskDrugs = forecasts.filter(f => f.risk_level === 'high').length;
  const avgConfidence = forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length;

  // Top cost increases
  const topIncreases = [...forecasts]
    .sort((a, b) => (b.predicted_cost_12m - b.current_cost) - (a.predicted_cost_12m - a.current_cost))
    .slice(0, 5);

  // Top cost decreases
  const topDecreases = [...forecasts]
    .sort((a, b) => (a.predicted_cost_12m - a.current_cost) - (b.predicted_cost_12m - b.current_cost))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading forecasting models...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Drug Cost Forecasting</h1>
          <p className="text-muted-foreground">
            AI-powered predictive analytics for drug cost trends and budget planning
          </p>
        </div>
        <Button onClick={loadData}>
          Refresh Forecasts
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-destructive" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Increasing Trends</p>
                <p className="text-2xl font-bold text-destructive">{increasingTrends}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-success/10 rounded-lg">
                <TrendingDown className="h-4 w-4 text-success" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Decreasing Trends</p>
                <p className="text-2xl font-bold text-success">{decreasingTrends}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-warning" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-warning">{highRiskDrugs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg Confidence</p>
                <p className="text-2xl font-bold">{Math.round(avgConfidence)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drug Selection and Time Series */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChartIcon className="h-5 w-5 mr-2" />
              Cost Forecast Timeline
            </CardTitle>
            <div className="flex gap-4">
              <Select value={selectedDrug} onValueChange={setSelectedDrug}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select drug" />
                </SelectTrigger>
                <SelectContent>
                  {forecasts.map((forecast) => (
                    <SelectItem key={forecast.drug_name} value={forecast.drug_name}>
                      {forecast.drug_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3m">3 Months</SelectItem>
                  <SelectItem value="6m">6 Months</SelectItem>
                  <SelectItem value="12m">12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Cost']} />
                <Area
                  type="monotone"
                  dataKey="confidence_upper"
                  stackId="1"
                  stroke="none"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.1}
                />
                <Area
                  type="monotone"
                  dataKey="confidence_lower"
                  stackId="1"
                  stroke="none"
                  fill="white"
                  fillOpacity={1}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="hsl(var(--warning))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(var(--warning))' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Selected Drug Details */}
        <Card>
          <CardHeader>
            <CardTitle>Forecast Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedForecast && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">{selectedForecast.drug_name}</h4>
                  <p className="text-sm text-muted-foreground">Current PMPM: ${selectedForecast.current_cost.toFixed(2)}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">3 Month Forecast:</span>
                    <span className="font-medium">${selectedForecast.predicted_cost_3m.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">6 Month Forecast:</span>
                    <span className="font-medium">${selectedForecast.predicted_cost_6m.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">12 Month Forecast:</span>
                    <span className="font-medium">${selectedForecast.predicted_cost_12m.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Trend:</span>
                  <div className="flex items-center">
                    {getTrendIcon(selectedForecast.trend)}
                    <span className="ml-1 capitalize">{selectedForecast.trend}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Risk Level:</span>
                  {getRiskBadge(selectedForecast.risk_level)}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Confidence:</span>
                  <span className="font-medium">{selectedForecast.confidence}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Cost Increases */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <TrendingUp className="h-5 w-5 mr-2" />
              Highest Cost Increases (12M)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topIncreases.map((drug, index) => {
                const increase = drug.predicted_cost_12m - drug.current_cost;
                const percentIncrease = (increase / drug.current_cost) * 100;
                
                return (
                  <div key={drug.drug_name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{drug.drug_name}</p>
                      <p className="text-sm text-muted-foreground">
                        ${drug.current_cost.toFixed(2)} → ${drug.predicted_cost_12m.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-destructive">
                        +${increase.toFixed(2)}
                      </p>
                      <p className="text-sm text-destructive">
                        +{percentIncrease.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Cost Decreases */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-success">
              <TrendingDown className="h-5 w-5 mr-2" />
              Highest Cost Decreases (12M)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDecreases.map((drug, index) => {
                const decrease = drug.current_cost - drug.predicted_cost_12m;
                const percentDecrease = (decrease / drug.current_cost) * 100;
                
                return (
                  <div key={drug.drug_name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{drug.drug_name}</p>
                      <p className="text-sm text-muted-foreground">
                        ${drug.current_cost.toFixed(2)} → ${drug.predicted_cost_12m.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">
                        -${decrease.toFixed(2)}
                      </p>
                      <p className="text-sm text-success">
                        -{percentDecrease.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}