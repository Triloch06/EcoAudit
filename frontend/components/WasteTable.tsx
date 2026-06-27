"use client";

import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpDown, Search, Download, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { exportService, logsService } from '@/services/api';
import { toast } from 'sonner';

export interface WasteLog {
  id: string;
  category: string;
  weight: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  created_at: string;
  user_email?: string;
}

interface WasteTableProps {
  logs: WasteLog[];
  isLoading: boolean;
  onSortChange: (sortBy: string, order: string) => void;
  currentSortBy: string;
  currentOrder: string;
  isAdmin?: boolean;
  onLogDeleted?: () => void;
}

export const WasteTable: React.FC<WasteTableProps> = ({ 
  logs, 
  isLoading, 
  onSortChange,
  currentSortBy,
  currentOrder,
  isAdmin = false,
  onLogDeleted
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter logs based on search term and date
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check if the log date matches the filter (e.g. "2023-10-05")
    let matchesDate = true;
    if (dateFilter) {
      // The stored string might be "YYYY-MM-DDTHH:MM:SS"
      const logDate = log.created_at.split('T')[0];
      matchesDate = logDate === dateFilter;
    }
    
    return matchesSearch && matchesDate;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: string) => {
    if (currentSortBy === field) {
      onSortChange(field, currentOrder === 'desc' ? 'asc' : 'desc');
    } else {
      onSortChange(field, 'desc');
    }
  };

  const handleExport = async (type: 'excel' | 'pdf') => {
    try {
      const url = type === 'excel' 
        ? await exportService.exportExcel() 
        : await exportService.exportPdf();
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', type === 'excel' ? 'waste_logs.xlsx' : 'waste_logs.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this log?")) {
      try {
        await logsService.deleteLog(id);
        toast.success("Log deleted successfully");
        if (onLogDeleted) {
          onLogDeleted();
        }
      } catch (error) {
        console.error("Failed to delete log:", error);
        toast.error("Failed to delete log");
      }
    }
  };

  return (
    <Card className="border-slate-200 dark:border-none shadow-sm mt-6 dark:bg-[#1E293B]">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
        <CardTitle className="text-xl text-slate-900 dark:text-[#F8FAFC]">Waste Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-[#1E293B]">
              <TableRow className="dark:border-slate-700">
                <TableHead className="font-semibold text-slate-700 dark:text-[#E2E8F0]">Category</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-[#E2E8F0]">
                  <Button variant="ghost" onClick={() => handleSort('weight')} className="px-0 font-semibold hover:bg-transparent -ml-3 dark:hover:text-white">
                    Weight (kg) <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-[#E2E8F0]">Location (Lat, Lng)</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-[#E2E8F0]">Accuracy (m)</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-[#E2E8F0]">
                  <Button variant="ghost" onClick={() => handleSort('date')} className="px-0 font-semibold hover:bg-transparent -ml-3 dark:hover:text-white">
                    Date & Time <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                {isAdmin && <TableHead className="font-semibold text-slate-700 dark:text-[#E2E8F0]">User</TableHead>}
                {isAdmin && <TableHead className="font-semibold text-slate-700 dark:text-[#E2E8F0]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Loading records...
                  </TableCell>
                </TableRow>
              ) : paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p>No waste logs found.</p>
                      <p className="text-sm">Start by submitting your first waste entry.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((log, index) => (
                  <TableRow key={log.id} className="dark:border-slate-700 dark:hover:bg-[#1E293B] dark:odd:bg-[#111827] dark:even:bg-[#0F172A]">
                    <TableCell className="font-medium dark:text-slate-200">{log.category}</TableCell>
                    <TableCell className="dark:text-slate-300">{log.weight.toFixed(2)}</TableCell>
                    <TableCell className="text-slate-500 dark:text-[#94A3B8] font-mono text-sm">
                      {log.latitude.toFixed(5)}, {log.longitude.toFixed(5)}
                    </TableCell>
                    <TableCell className="dark:text-slate-300">±{Math.round(log.accuracy)}</TableCell>
                    <TableCell className="text-slate-500 dark:text-[#94A3B8] text-sm">
                      {new Date(!log.created_at.includes('Z') && !log.created_at.includes('+') ? log.created_at + 'Z' : log.created_at).toLocaleString()}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-slate-500 dark:text-[#94A3B8] text-sm">
                        {log.user_email || 'Unknown'}
                      </TableCell>
                    )}
                    {isAdmin && (
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDelete(log.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Controls Section (Moved below table) */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
              <Input
                type="text"
                placeholder="Search category..."
                className="pl-9 bg-white dark:bg-[#111827] dark:text-slate-200 dark:border-slate-700 focus:border-[#10B981] focus:ring-[#10B981]/25"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="relative">
              <Input
                type="date"
                className="bg-white dark:bg-[#111827] dark:text-slate-200 dark:border-slate-700 w-full sm:w-[150px] focus:border-[#10B981] focus:ring-[#10B981]/25"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="default" className="flex gap-2 bg-[#166534] hover:bg-[#15803D] text-white border-none" onClick={() => handleExport('excel')}>
                <Download className="h-4 w-4" /> Excel
              </Button>
              <Button variant="default" className="flex gap-2 bg-[#991B1B] hover:bg-[#B91C1C] text-white border-none" onClick={() => handleExport('pdf')}>
                <Download className="h-4 w-4" /> PDF
              </Button>
            </div>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="dark:bg-[#111827] dark:text-slate-300 dark:border-slate-700 dark:hover:bg-[#1E293B]"
              >
                Previous
              </Button>
              <div className="text-sm text-slate-500 dark:text-[#94A3B8]">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="dark:bg-[#111827] dark:text-slate-300 dark:border-slate-700 dark:hover:bg-[#1E293B]"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
