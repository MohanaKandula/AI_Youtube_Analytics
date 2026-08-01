import { toast } from 'sonner';

export interface DownloadReport {
    id: string;
    name: string;
    type: string;
    feature: string;
    timestamp: Date;
    size: string;
    data: any;
}

export class DownloadManager {
    private static STORAGE_KEY = 'downloadedReports';

    static saveReport(report: Omit<DownloadReport, 'id' | 'timestamp'>): DownloadReport {
        const fullReport: DownloadReport = {
            ...report,
            id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date()
        };

        const existing = this.getReports();
        existing.unshift(fullReport);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing.slice(0, 50)));
        
        return fullReport;
    }

    static getReports(): DownloadReport[] {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (!stored) return [];
        return JSON.parse(stored).map((r: any) => ({
            ...r,
            timestamp: new Date(r.timestamp)
        }));
    }

    static deleteReport(id: string): void {
        const existing = this.getReports();
        const filtered = existing.filter(r => r.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    }

    static clearAll(): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
    }

    static downloadJSON(data: any, filename: string, feature: string): void {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.saveReport({
            name: filename,
            type: 'JSON',
            feature,
            size: `${(blob.size / 1024).toFixed(2)} KB`,
            data
        });

        toast.success('Report downloaded successfully!');
    }

    static downloadCSV(data: any[], filename: string, feature: string): void {
        if (!data.length) {
            toast.error('No data to export');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        this.saveReport({
            name: filename,
            type: 'CSV',
            feature,
            size: `${(blob.size / 1024).toFixed(2)} KB`,
            data
        });

        toast.success('CSV report downloaded successfully!');
    }

    static downloadPDF(filename: string, feature: string, content: string): void {
        // Mock PDF generation - in production, use a library like jsPDF
        const pdfContent = `TutorTrace Report\n\n${content}\n\nGenerated on: ${new Date().toLocaleString()}`;
        const blob = new Blob([pdfContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        this.saveReport({
            name: filename,
            type: 'PDF',
            feature,
            size: `${(blob.size / 1024).toFixed(2)} KB`,
            data: { content }
        });

        toast.success('PDF report downloaded successfully!');
    }
}
