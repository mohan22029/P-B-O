// src/App.js
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  LineChart as LineChartIcon,
  Activity
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { toast } from "sonner";

const App = () => {
  const [drugs, setDrugs] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState("");
  const [steps, setSteps] = useState(5);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDrugs();
  }, []);

  const fetchDrugs = async () => {
    try {
      const response = await fetch("/drugs");
      if (!response.ok) throw new Error("Failed to fetch drugs");
      const data = await response.json();
      setDrugs(data);
      if (data.length > 0) setSelectedDrug(data[0]);
    } catch (error) {
      toast.error("Failed to load drugs: " + error.message);
    }
  };

  const handleForecast = async () => {
    if (!selectedDrug) return;
    setLoading(true);
    try {
      const response = await fetch("/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ drug: selectedDrug, steps: steps.toString() })
      });
      if (!response.ok) throw new Error("Forecast failed");
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setForecastData(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate time series data
  const timeSeriesData = forecastData ? [
    ...forecastData.historical_years.map((year, i) => ({
      period: year,
      actual: forecastData.historical_spending[i],
      predicted: forecastData.historical_spending[i],
      confidence_lower: forecastData.historical_spending[i] * 0.9,
      confidence_upper: forecastData.historical_spending[i] * 1.1,
      category: 'historical'
    })),
    ...forecastData.forecast_years.map((year, i) => ({
      period: year,
      predicted: forecastData.forecast[i],
      confidence_lower: forecastData.confidence_lower[i],
      confidence_upper: forecastData.confidence_upper[i],
      category: 'forecast'
    }))
  ] : [];

  // Calculate trend, change, confidence, risk
  const lastHistorical = forecastData ? forecastData.historical_spending[forecastData.historical_spending.length - 1] : 0;
  const lastForecast = forecastData ? forecastData.forecast[forecastData.forecast.length - 1] : 0;
  const changePercent = lastHistorical ? ((lastForecast - lastHistorical) / lastHistorical) * 100 : 0;

  let trend = 'stable';
  if (changePercent > 10) trend = 'increasing';
  else if (changePercent < -10) trend = 'decreasing';

  let avgCIWidth = 0;
  if (forecastData) {
    forecastData.forecast.forEach((f, i) => {
      avgCIWidth += ((forecastData.confidence_upper[i] - forecastData.confidence_lower[i]) / f) * 100;
    });
    avgCIWidth /= forecastData.forecast.length;
  }
  const confidence = Math.max(50, 100 - avgCIWidth).toFixed(0);

  let risk_level = 'low';
  if (Math.abs(changePercent) > 30 || confidence < 70) {
    risk_level = 'high';
  } else if (Math.abs(changePercent) > 15 || confidence < 85) {
    risk_level = 'medium';
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-destructive" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-success" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'low': return <Badge className="bg-success text-white">Low Risk</Badge>;
      case 'medium': return <Badge className="bg-warning text-white">Medium Risk</Badge>;
      case 'high': return <Badge className="bg-destructive text-white">High Risk</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold">Drug Cost Forecast Dashboard</h1>
      <div className="flex gap-4 mt-4">
        <Select value={selectedDrug} onValueChange={setSelectedDrug}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select Drug" />
          </SelectTrigger>
          <SelectContent>
            {drugs.map(drug => <SelectItem key={drug} value={drug}>{drug}</SelectItem>)}
          </SelectContent>
        </Select>
        <input
          type="number"
          value={steps}
          onChange={(e) => setSteps(parseInt(e.target.value))}
          min={1}
          className="border p-2 rounded-lg"
        />
        <Button onClick={handleForecast} disabled={loading}>
          {loading ? "Loading..." : "Generate Forecast"}
        </Button>
      </div>

      {forecastData && (
        <>
          <div className="grid md:grid-cols-4 gap-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className={`p-2 bg-${trend === 'increasing' ? 'destructive' : trend === 'decreasing' ? 'success' : 'primary'}/10 rounded-lg`}>
                    {getTrendIcon(trend)}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Trend</p>
                    <p className="text-2xl font-bold capitalize">{trend}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className={`p-2 bg-${risk_level === 'low' ? 'success' : risk_level === 'medium' ? 'warning' : 'destructive'}/10 rounded-lg`}>
                    <AlertTriangle className={`h-4 w-4 text-${risk_level === 'low' ? 'success' : risk_level === 'medium' ? 'warning' : 'destructive'}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Risk Level</p>
                    <p className="text-2xl font-bold capitalize">{risk_level}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Confidence</p>
                    <p className="text-2xl font-bold">{confidence}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className={`p-2 bg-${changePercent > 0 ? 'destructive' : 'success'}/10 rounded-lg`}>
                    <LineChartIcon className={`h-4 w-4 text-${changePercent > 0 ? 'destructive' : 'success'}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">{steps}Y Change</p>
                    <p className={`text-2xl font-bold text-${changePercent > 0 ? 'destructive' : 'success'}`}>
                      {(lastForecast - lastHistorical).toFixed(2)} ({changePercent.toFixed(1)}%)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChartIcon className="h-5 w-5 mr-2" />
                Cost Forecast Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Area type="monotone" dataKey="confidence_upper" stackId="1" stroke="none" fillOpacity={0.1} fill="#3498db" />
                  <Area type="monotone" dataKey="confidence_lower" stackId="1" stroke="none" fill="white" />
                  <Line type="monotone" dataKey="actual" stroke="#3498db" strokeWidth={2} />
                  <Line type="monotone" dataKey="predicted" stroke="#f39c12" strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </CardContent>
            </Card>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Forecast Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">{forecastData.drug}</h4>
                  <p className="text-sm text-muted-foreground">Current Annual: ${lastHistorical.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">1 Year Forecast:</span>
                    <span className="font-medium">${forecastData.forecast[0].toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{Math.min(3, steps)} Year Forecast:</span>
                    <span className="font-medium">${forecastData.forecast[Math.min(2, steps-1)].toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{steps} Year Forecast:</span>
                    <span className="font-medium">${lastForecast.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Trend:</span>
                  <div className="flex items-center">
                    {getTrendIcon(trend)}
                    <span className="ml-1 capitalize">{trend}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Risk Level:</span>
                  {getRiskBadge(risk_level)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Confidence:</span>
                  <span className="font-medium">{confidence}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default App;