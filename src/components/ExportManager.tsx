import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileJson,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '') + '/api';

interface ExportManagerProps {
  userEmail: string;
  data: any[];
  dataType: string;
  defaultFileName?: string;
}

const ExportManager = ({ userEmail, data, dataType, defaultFileName = 'export' }: ExportManagerProps) => {
  const [fileName, setFileName] = useState(defaultFileName);
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState<'csv' | 'json'>('csv');

  const handleExport = async () => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    if (!fileName.trim()) {
      toast.error('Please enter a file name');
      return;
    }

    setExporting(true);

    try {
      const response = await fetch(`${API_BASE}/export_data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: userEmail,
          export_type: exportType,
          data: data,
          file_name: fileName
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Trigger download
        const downloadUrl = `${API_BASE}${result.download_url}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = result.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Exported ${data.length} records successfully!`);
      } else {
        toast.error('Export failed');
      }
    } catch (error) {
      toast.error('Error during export');
    } finally {
      setExporting(false);
    }
  };

  const ExportOption = ({ 
    type, 
    icon: Icon, 
    title, 
    description, 
    format 
  }: { 
    type: 'csv' | 'json'; 
    icon: any; 
    title: string; 
    description: string; 
    format: string;
  }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setExportType(type)}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        exportType === type
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${
          exportType === type 
            ? 'bg-blue-100 dark:bg-blue-900/40' 
            : 'bg-gray-100 dark:bg-gray-700'
        }`}>
          <Icon size={24} className={
            exportType === type 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-600 dark:text-gray-400'
          } />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
            {exportType === type && (
              <CheckCircle size={20} className="text-blue-500" />
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{description}</p>
          <span className="text-xs text-gray-500 dark:text-gray-500 font-mono">{format}</span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Download size={24} />
          Export Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data Summary */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ready to export</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.length} records
              </p>
            </div>
            <FileText size={32} className="text-gray-400" />
          </div>
        </div>

        {/* File Name Input */}
        <div className="space-y-2">
          <Label htmlFor="fileName" className="text-gray-900 dark:text-white">
            File Name
          </Label>
          <Input
            id="fileName"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Enter file name"
            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
          />
        </div>

        {/* Export Format Selection */}
        <div className="space-y-3">
          <Label className="text-gray-900 dark:text-white">Export Format</Label>
          <div className="grid gap-3">
            <ExportOption
              type="csv"
              icon={FileSpreadsheet}
              title="CSV (Excel Compatible)"
              description="Best for spreadsheet applications like Excel, Google Sheets"
              format=".csv"
            />
            <ExportOption
              type="json"
              icon={FileJson}
              title="JSON"
              description="Best for developers and data processing"
              format=".json"
            />
          </div>
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={exporting || !fileName.trim()}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          size="lg"
        >
          {exporting ? (
            <>
              <Loader2 className="mr-2 animate-spin" size={20} />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2" size={20} />
              Export {exportType.toUpperCase()}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Your file will be downloaded automatically after export
        </p>
      </CardContent>
    </Card>
  );
};

export default ExportManager;
