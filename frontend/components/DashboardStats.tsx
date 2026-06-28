import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { FileText, Star, Clock, Briefcase } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import dynamic from 'next/dynamic';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const HighestWasteMap = dynamic(() => import('./HighestWasteMap'), {
  ssr: false,
  loading: () => <div className="h-48 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md" />
});

interface AnalyticsData {
  total_waste: number;
  total_entries: number;
  category_totals: Record<string, number>;
  most_logged_category: string | null;
  latest_entry: string | null;
}

interface HighestAreaData {
  latitude: number;
  longitude: number;
  total_weight: number;
  entry_count: number;
}

interface DashboardStatsProps {
  data: AnalyticsData | null;
  highestArea: HighestAreaData | null;
  isLoading: boolean;
}

const COLORS = ['#387F39', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];

export const DashboardStats: React.FC<DashboardStatsProps> = ({ data, highestArea, isLoading }) => {
  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-slate-200">
              <CardContent className="p-6">
                <Skeleton className="h-10 w-10 mb-4" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const pieData = Object.entries(data.category_totals)
    .filter(([_, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="glass-card hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardContent className="p-4 sm:p-6 flex items-start gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
              <Briefcase className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Waste</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{data.total_waste.toFixed(2)}</span>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">kg</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total waste logged</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardContent className="p-4 sm:p-6 flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Entries</p>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{data.total_entries}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Waste logs submitted</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-orange-500/5 dark:bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardContent className="p-4 sm:p-6 flex items-start gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl">
              <Star className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Most Logged</p>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white capitalize truncate">{data.most_logged_category || '-'}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Highest waste category</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-purple-500/5 dark:bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardContent className="p-4 sm:p-6 flex items-start gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
              <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Latest Entry</p>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white capitalize">
                {data.latest_entry 
                    ? formatDistanceToNow(
                        new Date(!data.latest_entry.includes('Z') && !data.latest_entry.includes('+') ? data.latest_entry + 'Z' : data.latest_entry), 
                        { addSuffix: false }
                      ) 
                    : '-'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Last submission time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Breakdown (Donut) */}
        <Card className="glass-card flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-emerald-800 dark:text-emerald-400">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-8 min-h-[300px]">
            {pieData.length > 0 ? (
              <>
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => {
                          const num = Number(value);
                          return [`${isNaN(num) ? 0 : num.toFixed(2)} kg`, 'Weight'];
                        }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 w-full max-w-sm space-y-4">
                  {pieData.map((entry) => {
                    const percentage = ((entry.value / data.total_waste) * 100).toFixed(0);
                    return (
                      <div key={entry.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{entry.name}</span>
                        </div>
                        <span className="text-slate-600 dark:text-slate-400 text-sm">
                          {entry.value.toFixed(2)} kg <span className="text-slate-400 dark:text-slate-500">({percentage}%)</span>
                        </span>
                      </div>
                    );
                  })}
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-4 flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Total Categories</span>
                    <span className="font-bold text-slate-900 dark:text-white">{pieData.length}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Highest Waste Area */}
        <Card className="glass-card flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-emerald-800 dark:text-emerald-400">Highest Waste Area</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-4 pt-0">
            {highestArea ? (
              <div className="flex flex-col sm:flex-row gap-4 h-full">
                <div className="flex-1 min-h-[200px] sm:min-h-[250px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <HighestWasteMap data={highestArea} />
                </div>
                <div className="w-full sm:w-40 flex flex-col gap-4 shrink-0">
                  <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-100 dark:border-rose-900/50 flex-1 flex flex-col justify-center">
                    <p className="text-xs font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider mb-1">Total Weight</p>
                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-500">{highestArea.total_weight.toFixed(2)} kg</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 flex-1 flex flex-col justify-center">
                    <p className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-1">Total Entries</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">{highestArea.entry_count} logs</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">No location data available</div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
