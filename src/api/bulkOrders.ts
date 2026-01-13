import { API_BASE_URL } from '@/lib/api-config';

export interface BulkOrder {
    id: string;
    customer: string;
    eventType: string;
    date: string;
    items: string;
    total: number;
    advance: number;
    status: "pending" | "confirmed" | "in-progress" | "ready" | "delivered";
}

export const bulkOrdersApi = {
    getBulkOrders: async (status?: string): Promise<BulkOrder[]> => {
        const url = status
            ? `${API_BASE_URL}/bulk-orders?status=${encodeURIComponent(status)}`
            : `${API_BASE_URL}/bulk-orders`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch bulk orders');
        return await response.json();
    },
    
    createBulkOrder: async (order: {
        customer: string;
        eventType: string;
        deliveryDate: string;
        items: string;
        total: number;
        advance: number;
        customerId?: string;
    }): Promise<BulkOrder> => {
        const response = await fetch(`${API_BASE_URL}/bulk-orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create bulk order');
        }
        return await response.json();
    },
    
    updateStatus: async (orderId: string, status: string) => {
        const response = await fetch(`${API_BASE_URL}/bulk-orders/${orderId}/status?status=${status}`, {
            method: 'PUT'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update status');
        }
        return await response.json();
    },

    updateBulkOrder: async (orderId: string, order: {
        status?: string;
        advance?: number;
        total?: number;
        items?: string;
        deliveryDate?: string;
    }): Promise<BulkOrder> => {
        const response = await fetch(`${API_BASE_URL}/bulk-orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update bulk order');
        }
        return await response.json();
    },

    deleteBulkOrder: async (orderId: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/bulk-orders/${orderId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete bulk order');
        }
    }
};
