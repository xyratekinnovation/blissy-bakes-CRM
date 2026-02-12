import { API_BASE_URL } from '@/lib/api-config';

export interface CreateOrderPayload {
    customer: {
        id?: string;
        fullName?: string;
        phoneNumber: string;
        notes?: string;
    };
    items: Array<{
        id: string;
        quantity: number;
        price: number;
    }>;
    paymentMethod: 'cash' | 'card' | 'upi' | 'other';
    totalAmount: number;
    staffId?: string;
    notes?: string;
}

export const ordersApi = {
    /**
     * Creates a new order via the Python backend.
     * This handles inventory updates and customer creation transactionally.
     */
    createOrder: async (payload: CreateOrderPayload) => {
        const response = await fetch(`${API_BASE_URL}/orders/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to create order');
        }

        return await response.json();
    },

    /**
     * Fetches recent orders.
     */
    getOrders: async () => {
        const response = await fetch(`${API_BASE_URL}/orders`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        return await response.json();
    },

    /**
     * Fetches a single order by ID.
     */
    getOrder: async (orderId: string) => {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        if (!response.ok) throw new Error('Failed to fetch order');
        return await response.json();
    },

    /**
     * Updates an existing order (items, customer, total, etc.).
     */
    updateOrder: async (orderId: string, payload: CreateOrderPayload) => {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to update order');
        }
        return await response.json();
    },

    /**
     * Deletes an order and restores inventory.
     */
    deleteOrder: async (orderId: string) => {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to delete order');
        }
        return await response.json();
    }
};
