"use client";

import { useState, useEffect } from "react";
import axios from "axios";

interface ChartData {
  category: string;
  count: number;
  fill: string;
}

interface UseChartDataReturn {
  data: ChartData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useChartData(): UseChartDataReturn {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/dashboard/chart-data");
      setData(response.data.data);
    } catch (err) {
      console.error("Failed to fetch chart data:", err);
      setError("Failed to load chart data");
      // Set fallback data
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
