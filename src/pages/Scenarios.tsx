import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  Play, 
  Save, 
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockScenarioResults } from "@/lib/mock-data";

export default function Scenarios() {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Scenario Analysis</h1>
          <p className="text-muted-foreground">
            Model formulary changes and predict their impact on costs and access
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
          <Button>
            <Calculator className="h-4 w-4 mr-2" />
            New Scenario
          </Button>
        </div>
      </div>

      {/* Scenario Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Build New Scenario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Scenario Types */}
            <div>
              <h3 className="font-semibold mb-3">Scenario Type</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-20 flex-col">
                  <TrendingDown className="h-6 w-6 mb-2" />
                  Tier Changes
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Calculator className="h-6 w-6 mb-2" />
                  TE Switches
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button variant="secondary" className="justify-start">
                  Move all brands to non-preferred
                </Button>
                <Button variant="secondary" className="justify-start">
                  Apply generic substitutions
                </Button>
                <Button variant="secondary" className="justify-start">
                  Add PA for specialty drugs
                </Button>
                <Button variant="secondary" className="justify-start">
                  Optimize diabetes portfolio
                </Button>
              </div>
            </div>

            {/* Run Scenario */}
            <div className="pt-4 border-t">
              <Button size="lg" className="w-full">
                <Play className="h-5 w-5 mr-2" />
                Run Scenario Analysis
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Impact Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Impact Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Projected PMPM</span>
                <span className="font-bold">$462.18</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cost Savings</span>
                <span className="font-bold text-success">$1.8M</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Access Score</span>
                <span className="font-bold">95.7%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Members Affected</span>
                <span className="font-bold">4,230</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Previous Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario Name</TableHead>
                <TableHead>Projected Savings</TableHead>
                <TableHead>New PMPM</TableHead>
                <TableHead>Access Score</TableHead>
                <TableHead>ROI</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockScenarioResults.map((scenario, index) => (
                <TableRow 
                  key={index}
                  className={selectedScenario === scenario.scenario_name ? "bg-muted/50" : ""}
                >
                  <TableCell className="font-medium">
                    {scenario.scenario_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-success" />
                      <span className="font-bold text-success">
                        ${(scenario.projected_savings / 1000000).toFixed(1)}M
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">
                      ${scenario.new_pmpm.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {scenario.access_score >= 95 ? (
                        <TrendingUp className="h-4 w-4 mr-1 text-success" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1 text-warning" />
                      )}
                      <span className={scenario.access_score >= 95 ? "text-success" : "text-warning"}>
                        {scenario.access_score.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={scenario.roi_percentage > 15 ? "default" : "secondary"}>
                      {scenario.roi_percentage.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      Completed
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedScenario(scenario.scenario_name)}
                      >
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        Implement
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}