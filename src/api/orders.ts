

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
        const response = await fetch('http://localhost:8000/orders/create', {
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
     * Uses direct DB read (RLS protected).
     */
    getOrders: async () => {
        const response = await fetch('http://localhost:8000/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        return await response.json();
    }
};
