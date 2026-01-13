

export interface Customer {
    id: string;
    full_name: string;
    phone_number: string;
    email?: string;
    notes?: string;
    total_orders: number;
    total_spent: number;
}

export const customersApi = {
    /**
     * Fetches all customers.
     * This uses the standard Supabase client. 
     * Ensure RLS policies in Supabase allow read access for authenticated staff.
     */
    getCustomers: async () => {
        const response = await fetch('http://localhost:8000/customers');
        if (!response.ok) throw new Error('Failed to fetch customers');
        return await response.json();
    },

    /**
     * Search customers by phone or name.
     */
    searchCustomers: async (query: string) => {
        const response = await fetch(`http://localhost:8000/customers?q=${query}`);
        if (!response.ok) throw new Error('Failed to search customers');
        return await response.json();
    }
};
