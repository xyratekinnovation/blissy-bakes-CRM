import { API_BASE_URL } from '@/lib/api-config';

export interface Offer {
    id: string;
    title: string;
    description: string;
    type: "percent" | "combo" | "festival";
    value: string;
    validUntil: string;
    isActive: boolean;
    code?: string;
}

export const offersApi = {
    getOffers: async (filter?: "all" | "active" | "expired"): Promise<Offer[]> => {
        const isActive = filter === "active" ? true : filter === "expired" ? false : undefined;
        const url = isActive !== undefined
            ? `${API_BASE_URL}/offers?is_active=${isActive}`
            : `${API_BASE_URL}/offers`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch offers');
        return await response.json();
    },
    
    createOffer: async (offer: {
        title: string;
        code?: string;
        type: "percent" | "fixed";
        discountValue: number;
        startDate?: string;
        endDate?: string;
        isActive: boolean;
    }): Promise<Offer> => {
        const response = await fetch(`${API_BASE_URL}/offers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(offer)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create offer');
        }
        return await response.json();
    },
    
    getStats: async () => {
        const response = await fetch(`${API_BASE_URL}/offers/stats`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        return await response.json();
    }
};
