import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Calendar,
  Percent,
  PiggyBank,
} from "lucide-react";
import type {
  CalculatorInputs,
  CalculationData,
} from "@/models/CompoundInterest";

const CompoundInterestCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    initialAmount: 10000,
    yearlyContribution: 500,
    annualRate: 7,
    years: 30,
  });

  const [activeTab, setActiveTab] = useState("calculator");

  const calculationData = useMemo<CalculationData[]>(() => {
    const data: CalculationData[] = [];
    let currentPrincipal = inputs.initialAmount;
    let totalContributions = inputs.initialAmount;

    for (let year = 0; year <= inputs.years; year++) {
      const yearData: CalculationData = {
        year,
        principal: currentPrincipal,
        interest: currentPrincipal - totalContributions,
        total: currentPrincipal,
        totalContributions,
      };
      currentPrincipal *= 1 + inputs.annualRate / 100;
      currentPrincipal += inputs.yearlyContribution;
      totalContributions += inputs.yearlyContribution;

      data.push(yearData);
    }

    return data;
  }, [inputs]);

  const finalData = calculationData[calculationData.length - 1];
  const totalInterestEarned = finalData.total - finalData.totalContributions;
  const effectiveRate =
    ((finalData.total / inputs.initialAmount) ** (1 / inputs.years) - 1) * 100;

  const handleInputChange = (field: keyof CalculatorInputs, value: string) => {
    // Don't convert empty string to 0 immediately
    const numValue = value === "" ? 0 : parseFloat(value);

    // Only update if it's a valid number or empty (which becomes 0)
    if (value === "" || !isNaN(numValue)) {
      setInputs((prev) => ({ ...prev, [field]: numValue }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent.toFixed(1)}%`;
  };

  const getDisplayValue = (value: number, field: keyof CalculatorInputs) => {
    return value === 0 ? "" : value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">Year {label}</p>
          <p className="text-blue-600">Total: {formatCurrency(data.total)}</p>
          <p className="text-green-600">
            Interest: {formatCurrency(data.interest)}
          </p>
          <p className="text-gray-600">
            Contributions: {formatCurrency(data.totalContributions)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Calculator className="h-8 w-8 text-blue-600" />
          Compound Growth Calculator
        </h1>
        <p className="text-muted-foreground">
          Visualize the power of compound interest over time
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Panel */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5" />
                  Investment Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="initial">Initial Investment</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="initial"
                      type="number"
                      value={getDisplayValue(
                        inputs.initialAmount,
                        "initialAmount"
                      )}
                      onChange={(e) =>
                        handleInputChange("initialAmount", e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearly">Yearly Contribution</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="yearly"
                      type="number"
                      value={getDisplayValue(
                        inputs.yearlyContribution,
                        "yearlyContribution"
                      )}
                      onChange={(e) =>
                        handleInputChange("yearlyContribution", e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate">Annual Interest Rate</Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="rate"
                      type="number"
                      step="0.1"
                      value={getDisplayValue(inputs.annualRate, "annualRate")}
                      onChange={(e) =>
                        handleInputChange("annualRate", e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="years">Investment Period (Years)</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="years"
                      type="number"
                      value={getDisplayValue(inputs.years, "years")}
                      onChange={(e) =>
                        handleInputChange("years", e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => setActiveTab("analysis")}
                  className="w-full mt-6"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Analysis
                </Button>
              </CardContent>
            </Card>

            {/* Chart Panel */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Growth Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={calculationData}>
                      <defs>
                        <linearGradient
                          id="totalGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                        <linearGradient
                          id="interestGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis
                        dataKey="year"
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: "#6b7280" }}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: "#6b7280" }}
                        tickFormatter={(value) =>
                          `$${(value / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="totalContributions"
                        stackId="1"
                        stroke="#6b7280"
                        fill="#6b7280"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="interest"
                        stackId="1"
                        stroke="#10b981"
                        fill="url(#interestGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Final Amount
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(finalData.total)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Interest Earned
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(totalInterestEarned)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <PiggyBank className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Contributed
                    </p>
                    <p className="text-lg font-bold text-purple-600">
                      {formatCurrency(finalData.totalContributions)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Percent className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Effective Rate
                    </p>
                    <p className="text-lg font-bold text-orange-600">
                      {formatPercent(effectiveRate)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Growth Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={calculationData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="opacity-30"
                    />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) =>
                        `$${(value / 1000).toFixed(0)}k`
                      }
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                      name="Total Value"
                    />
                    <Line
                      type="monotone"
                      dataKey="totalContributions"
                      stroke="#6b7280"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: "#6b7280", strokeWidth: 2, r: 3 }}
                      name="Total Contributions"
                    />
                    <Line
                      type="monotone"
                      dataKey="interest"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }}
                      name="Interest Earned"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Money doubled in:</span>
                  <span className="font-bold">
                    ~{Math.ceil(72 / inputs.annualRate)} years
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Interest vs Contributions:</span>
                  <span className="font-bold">
                    {(
                      (totalInterestEarned / finalData.totalContributions) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly growth rate:</span>
                  <span className="font-bold">
                    {formatPercent(inputs.annualRate / 12)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Final value multiplier:</span>
                  <span className="font-bold">
                    {(finalData.total / inputs.initialAmount).toFixed(1)}x
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Contributions</span>
                    <span>
                      {(
                        (finalData.totalContributions / finalData.total) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-500 h-2 rounded-full"
                      style={{
                        width: `${
                          (finalData.totalContributions / finalData.total) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Interest Earned</span>
                    <span>
                      {((totalInterestEarned / finalData.total) * 100).toFixed(
                        1
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${
                          (totalInterestEarned / finalData.total) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompoundInterestCalculator;
