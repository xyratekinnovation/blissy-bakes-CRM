

export const reportsApi = {
    /**
     * Fetches dashboard statistics via Python backend.
     */
    getDashboardStats: async (period: 'today' | 'week' | 'month' = 'today') => {
        const response = await fetch(`http://localhost:8000/analytics/dashboard-stats?period=${period}`);

        if (!response.ok) throw new Error('Failed to fetch stats');
        return await response.json();
    },

    /**
     * Generates a daily sales report Excel file.
     * Returns a download URL.
     */
    exportDailyReport: async (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];

        const response = await fetch('http://localhost:8000/analytics/export-daily', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: dateStr })
        });

        if (!response.ok) throw new Error('Failed to export report');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        return { success: true, downloadUrl: url };
    }
};
