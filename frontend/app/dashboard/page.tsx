"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { DashboardStats } from '@/components/DashboardStats';
import { WasteTable, WasteLog } from '@/components/WasteTable';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Leaf } from 'lucide-react';

export default function DashboardPage() {
  const [statsData, setStatsData] = useState(null);
  const [highestArea, setHighestArea] = useState(null);
  const [logs, setLogs] = useState<WasteLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [order, setOrder] = useState('desc');

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      // Fetch analytics, highest area, and logs in parallel
      const [analyticsRes, highestAreaRes, logsRes] = await Promise.all([
        api.get('/analytics'),
        api.get('/analytics/highest-area').catch(() => ({ data: null })), // Handle gracefully if no data
        api.get(`/logs?sort_by=${sortBy}&order=${order}`)
      ]);
      
      setStatsData(analyticsRes.data);
      setHighestArea(highestAreaRes.data);
      setLogs(logsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setIsError(true);
      toast.error('Unable to connect to the server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, order]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSortChange = (newSortBy: string, newOrder: string) => {
    setSortBy(newSortBy);
    setOrder(newOrder);
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="bg-rose-50 text-rose-600 p-8 rounded-lg shadow-sm border border-rose-100 max-w-md w-full">
          <h2 className="text-xl font-bold mb-2">Connection Error</h2>
          <p>Unable to connect. Please try again later.</p>
          <button 
            onClick={() => fetchDashboardData()}
            className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <Leaf className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-[#F8FAFC]">Dashboard</h1>
          <p className="text-slate-500 dark:text-[#94A3B8]">Monitor community waste logs and statistics.</p>
        </div>
      </div>

      <DashboardStats data={statsData} highestArea={highestArea} isLoading={isLoading} />
      
      <WasteTable 
        logs={logs} 
        isLoading={isLoading} 
        onSortChange={handleSortChange}
        currentSortBy={sortBy}
        currentOrder={order}
        isAdmin={false}
      />
    </div>
  );
}
