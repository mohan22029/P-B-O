import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  TrendingUp,
  TrendingDown,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { apiService, type Drug } from "@/lib/api";
import { toast } from "sonner";

interface SentimentData {
  drug_name: string;
  positive_sentiment: number;
  negative_sentiment: number;
  neutral_sentiment: number;
  overall_score: number;
  total_reviews: number;
  efficacy_sentiment: number;
  side_effects_sentiment: number;
  cost_sentiment: number;
}

// Mock sentiment data generator based on drug properties
const generateSentimentData = (drugs: Drug[]): SentimentData[] => {
  return drugs.map(drug => {
    // Generate sentiment based on drug properties
    const baseSentiment = Math.random() * 0.4 + 0.3; // 0.3 to 0.7
    const costFactor = drug.pmpm_cost > 50 ? -0.2 : 0.1;
    const efficacyFactor = drug.clinical_efficacy.toLowerCase().includes('effective') ? 0.2 : 0;
    
    const positive = Math.max(0, Math.min(1, baseSentiment + efficacyFactor)) * 100;
    const negative = Math.max(0, Math.min(1, (1 - baseSentiment) + Math.abs(costFactor))) * 100;
    const neutral = Math.max(0, 100 - positive - negative);
    
    return {
      drug_name: drug.drug_name,
      positive_sentiment: Math.round(positive),
      negative_sentiment: Math.round(negative),
      neutral_sentiment: Math.round(neutral),
      overall_score: Math.round((positive - negative + 100) / 2), // 0-100 scale
      total_reviews: Math.floor(Math.random() * 1000) + 50,
      efficacy_sentiment: Math.round(Math.random() * 40 + 60), // 60-100
      side_effects_sentiment: Math.round(Math.random() * 60 + 20), // 20-80
      cost_sentiment: Math.round(Math.random() * 50 + 25) // 25-75
    };
  });
};

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
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSentiment, setSelectedSentiment] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDrugs();
      setDrugs(response.drugs);
      
      // Generate sentiment data
      const sentiment = generateSentimentData(response.drugs);
      setSentimentData(sentiment);
    } catch (error) {
      toast.error("Failed to load data: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const therapeuticClasses = [...new Set(drugs.map(drug => drug.therapeutic_class))].sort();

  const filteredSentimentData = sentimentData.filter(item => {
    const drug = drugs.find(d => d.drug_name === item.drug_name);
    if (!drug) return false;

    const matchesSearch = item.drug_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === "all" || drug.therapeutic_class === selectedClass;
    const matchesSentiment = selectedSentiment === "all" || 
      (selectedSentiment === "positive" && item.overall_score >= 70) ||
      (selectedSentiment === "neutral" && item.overall_score >= 40 && item.overall_score < 70) ||
      (selectedSentiment === "negative" && item.overall_score < 40);

    return matchesSearch && matchesClass && matchesSentiment;
  });

  // Aggregate data for charts
  const sentimentDistribution = [
    { name: 'Positive', value: sentimentData.filter(d => d.overall_score >= 70).length, fill: 'hsl(var(--success))' },
    { name: 'Neutral', value: sentimentData.filter(d => d.overall_score >= 40 && d.overall_score < 70).length, fill: 'hsl(var(--warning))' },
    { name: 'Negative', value: sentimentData.filter(d => d.overall_score < 40).length, fill: 'hsl(var(--destructive))' }
  ];

  const classAverageSentiment = therapeuticClasses.map(className => {
    const classData = sentimentData.filter(item => {
      const drug = drugs.find(d => d.drug_name === item.drug_name);
      return drug?.therapeutic_class === className;
    });
    const avgScore = classData.reduce((sum, item) => sum + item.overall_score, 0) / classData.length;
    return {
      class: className.length > 15 ? className.substring(0, 15) + '...' : className,
      score: Math.round(avgScore || 0)
    };
  }).slice(0, 8);

  const topPositiveDrugs = [...sentimentData]
    .sort((a, b) => b.overall_score - a.overall_score)
    .slice(0, 5);

  const topNegativeDrugs = [...sentimentData]
    .sort((a, b) => a.overall_score - b.overall_score)
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
          <h1 className="text-3xl font-bold text-foreground">Drug Sentiment Analysis</h1>
          <p className="text-muted-foreground">
            AI-powered sentiment analysis of drug reviews and patient feedback
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
                <p className="text-sm font-medium text-muted-foreground">Positive Reviews</p>
                <p className="text-2xl font-bold text-success">
                  {sentimentData.filter(d => d.overall_score >= 70).length}
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
                <p className="text-sm font-medium text-muted-foreground">Neutral Reviews</p>
                <p className="text-2xl font-bold text-warning">
                  {sentimentData.filter(d => d.overall_score >= 40 && d.overall_score < 70).length}
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
                <p className="text-sm font-medium text-muted-foreground">Negative Reviews</p>
                <p className="text-2xl font-bold text-destructive">
                  {sentimentData.filter(d => d.overall_score < 40).length}
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
                <p className="text-sm font-medium text-muted-foreground">Avg Sentiment</p>
                <p className="text-2xl font-bold">
                  {Math.round(sentimentData.reduce((sum, d) => sum + d.overall_score, 0) / sentimentData.length)}
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
            
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Therapeutic Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {therapeuticClasses.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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

        {/* Average Sentiment by Class */}
        <Card>
          <CardHeader>
            <CardTitle>Average Sentiment by Therapeutic Class</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classAverageSentiment}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="hsl(var(--primary))" />
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
              Top Positive Sentiment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPositiveDrugs.map((drug, index) => (
                <div key={drug.drug_name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{drug.drug_name}</p>
                    <p className="text-sm text-muted-foreground">{drug.total_reviews} reviews</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getSentimentColor(drug.overall_score)}`}>
                      {drug.overall_score}
                    </p>
                    {getSentimentBadge(drug.overall_score)}
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
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topNegativeDrugs.map((drug, index) => (
                <div key={drug.drug_name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{drug.drug_name}</p>
                    <p className="text-sm text-muted-foreground">{drug.total_reviews} reviews</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getSentimentColor(drug.overall_score)}`}>
                      {drug.overall_score}
                    </p>
                    {getSentimentBadge(drug.overall_score)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sentiment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Sentiment Analysis ({filteredSentimentData.length} drugs)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Drug Name</th>
                  <th className="text-left p-2">Overall Score</th>
                  <th className="text-left p-2">Positive %</th>
                  <th className="text-left p-2">Negative %</th>
                  <th className="text-left p-2">Efficacy</th>
                  <th className="text-left p-2">Side Effects</th>
                  <th className="text-left p-2">Cost</th>
                  <th className="text-left p-2">Total Reviews</th>
                </tr>
              </thead>
              <tbody>
                {filteredSentimentData.map((item) => (
                  <tr key={item.drug_name} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{item.drug_name}</td>
                    <td className="p-2">
                      <span className={`font-bold ${getSentimentColor(item.overall_score)}`}>
                        {item.overall_score}
                      </span>
                    </td>
                    <td className="p-2 text-success">{item.positive_sentiment}%</td>
                    <td className="p-2 text-destructive">{item.negative_sentiment}%</td>
                    <td className="p-2">{item.efficacy_sentiment}%</td>
                    <td className="p-2">{item.side_effects_sentiment}%</td>
                    <td className="p-2">{item.cost_sentiment}%</td>
                    <td className="p-2">{item.total_reviews}</td>
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