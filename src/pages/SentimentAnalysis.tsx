import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Papa from "papaparse";
import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SentimentType = "Positive" | "Neutral" | "Negative";

interface DrugRecord {
  drug_name: string;
  satisfaction_score: number;
  sentiment: SentimentType;
}

const SentimentAnalysis: React.FC = () => {
  const [data, setData] = useState<DrugRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState<SentimentType | null>(null);

  useEffect(() => {
    const fetchCSV = async () => {
      try {
        const response = await fetch("/backend/data/drug_satisfaction_vader.csv");
        const text = await response.text();

        Papa.parse(text, {
          complete: (results) => {
            const parsed: DrugRecord[] = (results.data as string[][])
              .slice(1)
              .map((cols) => {
                const drug_name = (cols[0] || "").replace(/"/g, "").trim();
                const score = Number((cols[1] || "").replace(/"/g, "").trim()) || 0;

                let sentiment: SentimentType = "Neutral";
                if (score >= 70) sentiment = "Positive";
                else if (score < 40) sentiment = "Negative";

                return { drug_name, satisfaction_score: score, sentiment };
              })
              .filter((row) => row.drug_name !== "");
            setData(parsed);
            setLoading(false);
          },
        });
      } catch (error) {
        console.error("Error loading CSV:", error);
        setLoading(false);
      }
    };
    fetchCSV();
  }, []);

  if (loading) return <p className="text-center p-6">Loading data...</p>;

  const filteredData = data.filter((d) =>
    d.drug_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // KPI metrics
  const totalDrugs = filteredData.length;
  const positiveCount = filteredData.filter((d) => d.sentiment === "Positive").length;
  const neutralCount = filteredData.filter((d) => d.sentiment === "Neutral").length;
  const negativeCount = filteredData.filter((d) => d.sentiment === "Negative").length;

  const sentimentDistribution = [
    { name: "Positive", value: positiveCount, fill: "#4ade80" },
    { name: "Neutral", value: neutralCount, fill: "#facc15" },
    { name: "Negative", value: negativeCount, fill: "#f87171" },
  ];

  // 🔎 Apply sentiment filter also to chart
  const chartData = selectedSentiment
    ? filteredData.filter((d) => d.sentiment === selectedSentiment)
    : filteredData;

  const satisfactionData = chartData.map((d) => ({
    drug_name: d.drug_name,
    satisfaction_score: d.satisfaction_score,
  }));

  // Drill-down table (existing feature kept)
  const sentimentFilteredData = selectedSentiment
    ? filteredData.filter((d) => d.sentiment === selectedSentiment)
    : [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Drug Satisfaction Analysis</h1>

      {/* 🔍 Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search drug by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border rounded-lg shadow-sm 
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Total Drugs", value: totalDrugs, color: "" },
          { title: "Positive", value: positiveCount, color: "text-green-500" },
          { title: "Neutral", value: neutralCount, color: "text-yellow-500" },
          { title: "Negative", value: negativeCount, color: "text-red-500" },
        ].map((kpi, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle>{kpi.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={sentimentDistribution}
                onClick={(state: any) => {
                  if (state && state.activeLabel) {
                    setSelectedSentiment(state.activeLabel as SentimentType);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {sentimentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Satisfaction Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>
              Satisfaction Score Distribution{" "}
              {selectedSentiment && <span>({selectedSentiment})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={satisfactionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="drug_name" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="satisfaction_score" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Drill-down Table */}
      {selectedSentiment && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedSentiment} Drugs ({sentimentFilteredData.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full border-collapse border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2 text-left">Drug Name</th>
                  <th className="border px-4 py-2">Satisfaction Score</th>
                </tr>
              </thead>
              <tbody>
                {sentimentFilteredData.map((drug, idx) => (
                  <tr key={idx}>
                    <td className="border px-4 py-2">{drug.drug_name}</td>
                    <td className="border px-4 py-2 text-center">{drug.satisfaction_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => setSelectedSentiment(null)}
              className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Clear Filter
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SentimentAnalysis;
