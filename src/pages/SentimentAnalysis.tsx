import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  MessageSquare,
  PieChart as PieChartIcon,
  Search,
  ThumbsDown,
  ThumbsUp,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from "sonner";

interface DrugSatisfactionData {
  drug_name: string;
  satisfaction_score: number;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
}

const getSentimentColor = (score: number) => {
  if (score >= 70) return 'text-success';
  if (score >= 40) return 'text-warning';
  return 'text-destructive';
};

const getSentimentBadge = (score: number) => {
  if (score >= 70) return <Badge className="bg-success text-white">Positive</Badge>;
  if (score >= 40) return <Badge className="bg-warning text-white">Neutral</Badge>;
  return <Badge className="bg-destructive text-white">Negative</Badge>;
};

export default function SentimentAnalysis() {
  const [satisfactionData, setSatisfactionData] = useState<DrugSatisfactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // In a real app, you would fetch this from an API endpoint
      // For this example, we'll fetch the local CSV file
      const response = await fetch('backend/data/drug_satisfaction_vader.csv');
      const csvText = await response.text();
      
      const rows = csvText.split('\n').slice(1); // Skip header row
      const data = rows.map(row => {
        const [drug_name, satisfaction_score, sentiment] = row.split(',');
        return {
          drug_name,
          satisfaction_score: parseFloat(satisfaction_score),
          sentiment: sentiment as 'Positive' | 'Neutral' | 'Negative'
        };
      }).filter(item => item.drug_name); // Filter out any empty rows

      setSatisfactionData(data);
    } catch (error) {
      toast.error("Failed to load data: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const filteredSatisfactionData = satisfactionData.filter(item => {
    const matchesSearch = item.drug_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSentiment = selectedSentiment === "all" || 
      item.sentiment.toLowerCase() === selectedSentiment;

    return matchesSearch && matchesSentiment;
  });

  // Aggregate data for charts
  const sentimentDistribution = [
    { name: 'Positive', value: satisfactionData.filter(d => d.sentiment === 'Positive').length, fill: 'hsl(var(--success))' },
    { name: 'Neutral', value: satisfactionData.filter(d => d.sentiment === 'Neutral').length, fill: 'hsl(var(--warning))' },
    { name: 'Negative', value: satisfactionData.filter(d => d.sentiment === 'Negative').length, fill: 'hsl(var(--destructive))' }
  ];
  
  const topPositiveDrugs = [...satisfactionData]
    .sort((a, b) => b.satisfaction_score - a.satisfaction_score)
    .slice(0, 5);

  const topNegativeDrugs = [...satisfactionData]
    .sort((a, b) => a.satisfaction_score - b.satisfaction_score)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading sentiment analysis...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Drug Satisfaction Analysis</h1>
          <p className="text-muted-foreground">
            Analysis of drug satisfaction scores from patient feedback
          </p>
        </div>
        <Button onClick={loadData}>
          Refresh Analysis
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-success/10 rounded-lg">
                <ThumbsUp className="h-4 w-4 text-success" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Positive Drugs</p>
                <p className="text-2xl font-bold text-success">
                  {sentimentDistribution.find(s => s.name === 'Positive')?.value || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-warning/10 rounded-lg">
                <MessageSquare className="h-4 w-4 text-warning" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Neutral Drugs</p>
                <p className="text-2xl font-bold text-warning">
                  {sentimentDistribution.find(s => s.name === 'Neutral')?.value || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <ThumbsDown className="h-4 w-4 text-destructive" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Negative Drugs</p>
                <p className="text-2xl font-bold text-destructive">
                  {sentimentDistribution.find(s => s.name === 'Negative')?.value || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg. Satisfaction</p>
                <p className="text-2xl font-bold">
                  {Math.round(satisfactionData.reduce((sum, d) => sum + d.satisfaction_score, 0) / satisfactionData.length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by drug name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedSentiment} onValueChange={setSelectedSentiment}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiments</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="h-5 w-5 mr-2" />
              Sentiment Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                >
                  {sentimentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Histogram of Scores could be added here if desired */}
        <Card>
            <CardHeader>
                <CardTitle>Satisfaction Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={satisfactionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="drug_name" hide={true}/>
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="satisfaction_score" fill="hsl(var(--primary))" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Positive Drugs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-success">
              <TrendingUp className="h-5 w-5 mr-2" />
              Top 5 Positive Drugs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPositiveDrugs.map((drug) => (
                <div key={drug.drug_name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{drug.drug_name}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getSentimentColor(drug.satisfaction_score)}`}>
                      {drug.satisfaction_score.toFixed(2)}
                    </p>
                    {getSentimentBadge(drug.satisfaction_score)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Negative Drugs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <TrendingDown className="h-5 w-5 mr-2" />
              Top 5 Negative Drugs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topNegativeDrugs.map((drug) => (
                <div key={drug.drug_name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{drug.drug_name}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getSentimentColor(drug.satisfaction_score)}`}>
                      {drug.satisfaction_score.toFixed(2)}
                    </p>
                    {getSentimentBadge(drug.satisfaction_score)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Satisfaction Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Drug Satisfaction ({filteredSatisfactionData.length} drugs)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Drug Name</th>
                  <th className="text-left p-2">Satisfaction Score</th>
                  <th className="text-left p-2">Sentiment</th>
                </tr>
              </thead>
              <tbody>
                {filteredSatisfactionData.map((item) => (
                  <tr key={item.drug_name} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{item.drug_name}</td>
                    <td className="p-2">
                      <span className={`font-bold ${getSentimentColor(item.satisfaction_score)}`}>
                        {item.satisfaction_score.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-2">
                        {getSentimentBadge(item.satisfaction_score)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}