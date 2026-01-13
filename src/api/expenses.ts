export interface Expense {
    id: string;
    title: string;
    amount: number;
    category: string;
    date: string;
    notes?: string;
}

export const expensesApi = {
    getExpenses: async (category?: string): Promise<Expense[]> => {
        const url = category && category !== "All"
            ? `http://localhost:8000/expenses?category=${encodeURIComponent(category)}`
            : 'http://localhost:8000/expenses';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch expenses');
        return await response.json();
    },
    
    createExpense: async (expense: {
        title: string;
        amount: number;
        category: string;
        date: string;
        description?: string;
    }): Promise<Expense> => {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        const response = await fetch('http://localhost:8000/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...expense,
                loggedBy: user?.id
            })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create expense');
        }
        return await response.json();
    },
    
    getStats: async () => {
        const response = await fetch('http://localhost:8000/expenses/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        return await response.json();
    },

    deleteExpense: async (expenseId: string): Promise<void> => {
        const response = await fetch(`http://localhost:8000/expenses/${expenseId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete expense');
        }
    }
};
