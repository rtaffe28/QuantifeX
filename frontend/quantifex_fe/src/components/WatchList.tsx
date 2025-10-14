import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, TrendingUp } from "lucide-react";
import { Autocomplete, TextField } from "@mui/material";
import watchlistService from "@/api/watchlist";
import tickerService from "@/api/ticker";

interface WatchlistItem {
  id: number;
  ticker: string;
  name?: string;
}

interface StockTicker {
  symbol: string;
  name: string;
}

interface ChartData {
  date: string;
  price: number;
  volume: number;
  impliedVolatility?: number;
}

const WatchList: React.FC = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [allTickers, setAllTickers] = useState<StockTicker[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string>("");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadWatchlist();
    loadAllTickers();
  }, []);

  useEffect(() => {
    if (selectedTicker) {
      loadChartData(selectedTicker);
    }
  }, [selectedTicker]);

  const loadWatchlist = async () => {
    try {
      const response = await watchlistService.getWatchlist();
      setWatchlist(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedTicker(response.data[0].ticker);
      }
    } catch (error) {
      console.error("Failed to load watchlist:", error);
    }
  };

  const loadAllTickers = async () => {
    try {
      const response = await tickerService.getTickers();
      setAllTickers(response.data || []);
    } catch (error) {
      console.error("Failed to load tickers:", error);
    }
  };

  const loadChartData = async (ticker: string) => {
    try {
      setIsLoading(true);
      const mockData: ChartData[] = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        price: 100 + Math.random() * 50 + i * 2,
        volume: Math.floor(Math.random() * 1000000),
        impliedVolatility: 0.2 + Math.random() * 0.3,
      }));
      setChartData(mockData);
    } catch (error) {
      console.error("Failed to load chart data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToWatchlist = async (ticker: StockTicker | null) => {
    if (!ticker) return;

    try {
      await watchlistService.addToWatchlist(ticker.symbol);
      await loadWatchlist();
      setSelectedTicker(ticker.symbol);
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
    }
  };

  const removeFromWatchlist = async (id: number) => {
    try {
      await watchlistService.deleteFromWatchlist(id);
      await loadWatchlist();
      if (watchlist.length > 1) {
        const remaining = watchlist.filter((item) => item.id !== id);
        if (remaining.length > 0) {
          setSelectedTicker(remaining[0].ticker);
        }
      } else {
        setSelectedTicker("");
        setChartData([]);
      }
    } catch (error) {
      console.error("Failed to remove from watchlist:", error);
    }
  };

  const SimpleChart: React.FC<{ data: ChartData[] }> = ({ data }) => {
    if (data.length === 0) return null;

    const maxPrice = Math.max(...data.map((d) => d.price));
    const minPrice = Math.min(...data.map((d) => d.price));
    const priceRange = maxPrice - minPrice;

    return (
      <div className="space-y-4">
        <div className="h-64 border rounded-lg p-4 bg-background">
          <h3 className="text-sm font-medium mb-2">Price History</h3>
          <div className="h-48 relative">
            <svg className="w-full h-full">
              <polyline
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                points={data
                  .map((point, index) => {
                    const x = (index / (data.length - 1)) * 100;
                    const y =
                      100 - ((point.price - minPrice) / priceRange) * 100;
                    return `${x},${y}`;
                  })
                  .join(" ")}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>

        <div className="h-64 border rounded-lg p-4 bg-background">
          <h3 className="text-sm font-medium mb-2">Implied Volatility</h3>
          <div className="h-48 relative">
            <svg className="w-full h-full">
              <polyline
                fill="none"
                stroke="hsl(var(--destructive))"
                strokeWidth="2"
                points={data
                  .map((point, index) => {
                    const x = (index / (data.length - 1)) * 100;
                    const y = 100 - ((point.impliedVolatility || 0) / 1) * 100;
                    return `${x},${y}`;
                  })
                  .join(" ")}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Left Panel */}
      <div className="w-80 space-y-4">
        {/* Search Bar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Add Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <Autocomplete
              options={allTickers}
              getOptionLabel={(option) => `${option.symbol} - ${option.name}`}
              filterOptions={(options, { inputValue }) => {
                return options.filter(
                  (option) =>
                    option.symbol
                      .toLowerCase()
                      .includes(inputValue.toLowerCase()) ||
                    option.name.toLowerCase().includes(inputValue.toLowerCase())
                );
              }}
              onChange={(event, value) => addToWatchlist(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search tickers..."
                  variant="outlined"
                  size="small"
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.symbol}>
                  <div>
                    <div className="font-medium">{option.symbol}</div>
                    <div className="text-sm text-gray-500">{option.name}</div>
                  </div>
                </li>
              )}
              noOptionsText="No tickers found"
            />
          </CardContent>
        </Card>

        {/* Watchlist */}
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Watchlist</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              <div className="space-y-2 p-4">
                {watchlist.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No stocks in watchlist</p>
                    <p className="text-sm">Search and add stocks above</p>
                  </div>
                ) : (
                  watchlist.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTicker === item.ticker
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedTicker(item.ticker)}
                    >
                      <div>
                        <Badge variant="outline" className="font-mono">
                          {item.ticker}
                        </Badge>
                        {item.name && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.name}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromWatchlist(item.id);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Charts */}
      <div className="flex-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedTicker
                ? `${selectedTicker} Analytics`
                : "Select a Stock"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : selectedTicker ? (
              <SimpleChart data={chartData} />
            ) : (
              <div className="flex items-center justify-center h-96 text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select a stock from your watchlist to view charts</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WatchList;
