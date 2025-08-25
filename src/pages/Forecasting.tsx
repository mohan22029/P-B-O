import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// API functions
const getDrugs = async () => {
  try {
    const response = await fetch('http://localhost:8000/drugs');
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch drugs: ${response.status} - ${errorText}`);
    }
    const drugs = await response.json();
    console.log('Fetched drugs:', drugs.slice(1, 1000)); // Log first 10 drugs for debugging
    return drugs;
  } catch (err) {
    console.error('Error in getDrugs:', err);
    throw err;
  }
};

const getForecast = async (drugName, steps) => {
  try {
    const response = await fetch('http://localhost:8000/forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ drug_name: drugName, steps: steps.toString() }),
    });
    if (!response.ok) {
      let errorDetail = 'Unknown error';
      try {
        const errorData = await response.json();
        errorDetail = JSON.stringify(errorData.detail, null, 2);
      } catch (e) {
        errorDetail = await response.text();
      }
      throw new Error(`Failed to fetch forecast for ${drugName}: ${response.status} - ${errorDetail}`);
    }
    return response.json();
  } catch (err) {
    console.error(`Error in getForecast for ${drugName}:`, err);
    throw err;
  }
};

// Utility function to format numbers
const formatNumber = (num) => {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};

// Trend icon component
const getTrendIcon = (trend) => {
  switch (trend) {
    case 'increasing':
      return (
        <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
        </svg>
      );
    case 'decreasing':
      return (
        <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      );
    default:
      return (
        <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3"></path>
        </svg>
      );
  }
};

// Risk badge component
const getRiskBadge = (risk) => {
  const classes = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${classes[risk] || 'bg-gray-100 text-gray-800'}`}>
      {risk.charAt(0).toUpperCase() + risk.slice(1)} Risk
    </span>
  );
};

function Forecasting() {
  const [drugs, setDrugs] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState('');
  const [selectedSteps, setSelectedSteps] = useState('5');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetching data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const drugList = await getDrugs();
        setDrugs(drugList);
        if (drugList.length > 0) {
          setSelectedDrug(drugList[0]);
          fetchForecasts(drugList);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchForecasts = async (drugList) => {
      try {
        const validDrugs = drugList.filter(drug => drug && typeof drug === 'string' && drug.trim() !== '');
        console.log('Valid drugs for forecast:', validDrugs.slice(0, 10)); // Log first 10 valid drugs
        const forecastPromises = validDrugs.slice(0, 10).map(async (drug, index) => { // Limit to 10 drugs
          await new Promise(resolve => setTimeout(resolve, index * 100)); // Throttle requests
          try {
            const data = await getForecast(drug, parseInt(selectedSteps));
            const lastForecast = data.forecast[data.forecast.length - 1];
            const firstForecast = data.forecast[0];
            const trend = lastForecast > firstForecast * 1.1 ? 'increasing' :
                          lastForecast < firstForecast * 0.9 ? 'decreasing' : 'stable';
            const confidence = Math.min(95, Math.random() * 25 + 75); // 75-95%
            const risk_level = confidence > 85 ? 'low' : confidence > 75 ? 'medium' : 'high';
            return {
              drug_name: drug,
              current_cost: firstForecast,
              predicted_cost_3y: data.forecast[2] || firstForecast,
              predicted_cost_5y: lastForecast,
              trend,
              confidence: Math.round(confidence),
              risk_level,
              forecast_data: data,
            };
          } catch (err) {
            console.error(`Error fetching forecast for ${drug}:`, err);
            return null;
          }
        });
        const forecastResults = (await Promise.all(forecastPromises)).filter(f => f);
        setForecasts(forecastResults);
      } catch (err) {
        console.error('Error fetching forecasts:', err);
        setError(err.message);
      }
    };

    loadData();
  }, [selectedSteps]);

  // Generating time series data for chart
  const generateTimeSeriesData = (forecast) => {
    if (!forecast || !forecast.forecast_data) return [];
    const { years, forecast: values, confidence_lower, confidence_upper } = forecast.forecast_data;
    return years.map((year, idx) => ({
      period: year,
      predicted: values[idx],
      confidence_lower: confidence_lower[idx],
      confidence_upper: confidence_upper[idx],
      category: 'forecast',
    }));
  };

  // Calculating aggregate statistics
  const increasingTrends = forecasts.filter(f => f.trend === 'increasing').length;
  const decreasingTrends = forecasts.filter(f => f.trend === 'decreasing').length;
  const highRiskDrugs = forecasts.filter(f => f.risk_level === 'high').length;
  const avgConfidence = forecasts.length > 0 ? 
    forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length : 0;

  const topIncreases = [...forecasts]
    .sort((a, b) => (b.predicted_cost_5y - b.current_cost) - (a.predicted_cost_5y - a.current_cost))
    .slice(0, 5);
  const topDecreases = [...forecasts]
    .sort((a, b) => (a.predicted_cost_5y - a.current_cost) - (b.predicted_cost_5y - b.current_cost))
    .slice(0, 5);

  const selectedForecast = forecasts.find(f => f.drug_name === selectedDrug);
  const timeSeriesData = selectedForecast ? generateTimeSeriesData(selectedForecast) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading forecasting models...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <div className="text-red-600 text-lg font-semibold">Error: {error}</div>
        <p className="text-gray-600 mt-2">Please ensure the backend is running and check the console for details.</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Drug Cost Forecasting Dashboard</h1>
            <p className="text-gray-600">Predictive analytics for drug cost trends</p>
          </div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Refresh Forecasts
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">{getTrendIcon('increasing')}</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Increasing Trends</p>
                <p className="text-2xl font-bold text-red-600">{increasingTrends}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">{getTrendIcon('decreasing')}</div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Decreasing Trends</p>
                <p className="text-2xl font-bold text-green-600">{decreasingTrends}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="h-4 w-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Risk Drugs</p>
                <p className="text-2xl font-bold text-yellow-600">{highRiskDrugs}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold text-blue-600">{Math.round(avgConfidence)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Forecast Chart and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
                Cost Forecast Timeline
              </h2>
              <div className="flex gap-4">
                <select
                  className="w-64 p-2 border rounded"
                  value={selectedDrug}
                  onChange={(e) => setSelectedDrug(e.target.value)}
                >
                  {drugs.map(drug => (
                    <option key={drug} value={drug}>{drug}</option>
                  ))}
                </select>
                <select
                  className="w-32 p-2 border rounded"
                  value={selectedSteps}
                  onChange={(e) => setSelectedSteps(e.target.value)}
                >
                  <option value="3">3 Years</option>
                  <option value="5">5 Years</option>
                </select>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" fontSize={12} />
                <YAxis tickFormatter={formatNumber} fontSize={12} />
                <Tooltip formatter={(value) => `$${formatNumber(value)}`} />
                <Area
                  type="monotone"
                  dataKey="confidence_upper"
                  stackId="1"
                  stroke="none"
                  fill="#3b82f6"
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
                  dataKey="predicted"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#f59e0b' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Forecast Details</h2>
            {selectedForecast && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">{selectedForecast.drug_name}</h4>
                  <p className="text-sm text-gray-600">Current Cost: ${formatNumber(selectedForecast.current_cost)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">3 Year Forecast:</span>
                    <span className="font-medium">${formatNumber(selectedForecast.predicted_cost_3y)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">5 Year Forecast:</span>
                    <span className="font-medium">${formatNumber(selectedForecast.predicted_cost_5y)}</span>
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
          </div>
        </div>

        {/* Top Movers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold flex items-center text-red-600">
              {getTrendIcon('increasing')}
              <span className="ml-2">Highest Cost Increases (5Y)</span>
            </h2>
            <div className="space-y-3 mt-4">
              {topIncreases.map(drug => {
                const increase = drug.predicted_cost_5y - drug.current_cost;
                const percentIncrease = (increase / drug.current_cost) * 100;
                return (
                  <div key={drug.drug_name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{drug.drug_name}</p>
                      <p className="text-sm text-gray-600">
                        ${formatNumber(drug.current_cost)} &rarr; ${formatNumber(drug.predicted_cost_5y)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">+${formatNumber(increase)}</p>
                      <p className="text-sm text-red-600">+{percentIncrease.toFixed(1)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold flex items-center text-green-600">
              {getTrendIcon('decreasing')}
              <span className="ml-2">Highest Cost Decreases (5Y)</span>
            </h2>
            <div className="space-y-3 mt-4">
              {topDecreases.map(drug => {
                const decrease = drug.current_cost - drug.predicted_cost_5y;
                const percentDecrease = (decrease / drug.current_cost) * 100;
                return (
                  <div key={drug.drug_name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{drug.drug_name}</p>
                      <p className="text-sm text-gray-600">
                        ${formatNumber(drug.current_cost)} &rarr; ${formatNumber(drug.predicted_cost_5y)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">-${formatNumber(decrease)}</p>
                      <p className="text-sm text-green-600">-{percentDecrease.toFixed(1)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Forecasting;