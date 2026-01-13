import { API_BASE_URL } from '@/lib/api-config';

export interface InventoryItem {
    id: string;
    productId: string;
    name: string;
    category: string;
    stock: number;
    unit: string;
    minStock: number;
    lastRestock: string;
}

export const inventoryApi = {
    /**
     * Fetches all inventory items from the Python backend.
     */
    getInventory: async (category?: string): Promise<InventoryItem[]> => {
        const url = category && category !== "All"
            ? `${API_BASE_URL}/inventory?category=${encodeURIComponent(category)}`
            : `${API_BASE_URL}/inventory`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch inventory');
        return await response.json();
    },

    /**
     * Fetches low stock items.
     */
    getLowStockItems: async (): Promise<InventoryItem[]> => {
        const response = await fetch(`${API_BASE_URL}/inventory/low-stock`);
        if (!response.ok) throw new Error('Failed to fetch low stock items');
        return await response.json();
    },

    /**
     * Restocks an inventory item.
     */
    restockItem: async (inventoryId: string, newStock: number): Promise<InventoryItem> => {
        const response = await fetch(`${API_BASE_URL}/inventory/${inventoryId}/restock`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newStock })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to restock item');
        }
        
        const data = await response.json();
        return data.inventory;
    },

    /**
     * Gets inventory statistics.
     */
    getStats: async () => {
        const response = await fetch(`${API_BASE_URL}/inventory/stats`);
        if (!response.ok) throw new Error('Failed to fetch inventory stats');
        return await response.json();
    },

    /**
     * Creates a new inventory item.
     */
    createInventoryItem: async (item: {
        productId: string;
        stock: number;
        minStock?: number;
    }): Promise<InventoryItem> => {
        const response = await fetch(`${API_BASE_URL}/inventory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create inventory item');
        }
        return await response.json();
    },

    /**
     * Deletes an inventory item.
     */
    deleteInventoryItem: async (inventoryId: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/inventory/${inventoryId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete inventory item');
        }
    }
};
