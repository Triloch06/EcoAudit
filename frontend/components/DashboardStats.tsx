import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, ListOrdered, Award, Clock, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import dynamic from 'next/dynamic';

const getCategoryBorderColor = (category: string) => {
  switch(category.toLowerCase()) {
    case 'plastic': return '#3B82F6';
    case 'organic': return '#10B981';
    case 'paper': return '#EAB308';
    case 'metal': return '#94A3B8';
    case 'glass': return '#06B6D4';
    case 'e-waste': return '#8B5CF6';
    default: return '#1E293B';
  }
};

const HighestWasteMap = dynamic(() => import('./HighestWasteMap'), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-slate-100 animate-pulse rounded-md" />
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

const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

export const DashboardStats: React.FC<DashboardStatsProps> = ({ data, highestArea, isLoading }) => {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const pieData = Object.entries(data.category_totals).map(([name, value], index) => ({
    name,
    value,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Waste Card */}
            <Card className="border-slate-200 dark:border-none shadow-sm md:col-span-1 bg-emerald-50 dark:bg-[#ECFDF5]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#10B981]" />
                  Total Waste
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-900 dark:text-[#047857]">
                  {data.total_waste.toFixed(2)} <span className="text-sm text-emerald-700 dark:text-[#047857]/80">kg</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-none shadow-sm dark:bg-[#111827]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-slate-500 dark:text-[#CBD5E1] uppercase tracking-wider">
                  Total Entries
                </CardTitle>
                <ListOrdered className="h-4 w-4 text-[#3B82F6]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-[#60A5FA]">{data.total_entries}</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-none shadow-sm dark:bg-[#111827]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-slate-500 dark:text-[#CBD5E1] uppercase tracking-wider">
                  Most Logged
                </CardTitle>
                <Award className="h-4 w-4 text-[#F59E0B]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-[#F59E0B] capitalize truncate">
                  {data.most_logged_category || '-'}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-none shadow-sm dark:bg-[#111827]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-slate-500 dark:text-[#CBD5E1] uppercase tracking-wider">
                  Latest Entry
                </CardTitle>
                <Clock className="h-4 w-4 text-[#A78BFA]" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-slate-900 dark:text-[#A78BFA] truncate">
                  {data.latest_entry 
                    ? formatDistanceToNow(
                        new Date(!data.latest_entry.includes('Z') && !data.latest_entry.includes('+') ? data.latest_entry + 'Z' : data.latest_entry), 
                        { addSuffix: true }
                      ) 
                    : '-'}
                </div>
              </CardContent>
            </Card>
          </div>

          <h3 className="text-lg font-semibold text-slate-800 dark:text-[#F8FAFC] mt-6 mb-3">Category Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Object.entries(data.category_totals)
              .sort((a, b) => b[1] - a[1])
              .map(([category, weight]) => {
                const percentage = data.total_waste > 0 ? ((weight / data.total_waste) * 100).toFixed(1) : '0';
                return (
                  <Card key={category} className="border-slate-200 dark:border-none shadow-sm dark:bg-[#1E293B]" style={{ borderTop: `4px solid ${getCategoryBorderColor(category)}` }}>
                    <CardHeader className="pb-1 pt-4 px-4">
                      <CardTitle className="text-sm font-medium text-slate-700 dark:text-[#CBD5E1] capitalize">{category}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{weight.toFixed(1)} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">kg</span></div>
                      <div className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">{percentage}% of total</div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>

        {/* Right Column - Map Only */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-200 dark:border-none shadow-sm dark:bg-[#1E293B]">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-700 dark:text-[#CBD5E1]">Highest Waste Area</CardTitle>
            </CardHeader>
            <CardContent>
              {highestArea ? (
                <HighestWasteMap data={highestArea} />
              ) : (
                <div className="h-64 w-full bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center rounded-md text-slate-400 text-sm">
                  <MapPin className="h-8 w-8 mb-2 opacity-50" />
                  No location data
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
      </div>
    </div>
  );
};
