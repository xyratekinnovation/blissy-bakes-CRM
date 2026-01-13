export interface Staff {
    id: string;
    fullName: string;
    phoneNumber: string;
    role: string;
    isActive: boolean;
    createdAt?: string;
}

export const staffApi = {
    /**
     * Fetches all staff members.
     */
    getStaff: async (): Promise<Staff[]> => {
        const response = await fetch('http://localhost:8000/staff');
        if (!response.ok) throw new Error('Failed to fetch staff');
        return await response.json();
    },

    /**
     * Creates a new staff member.
     */
    createStaff: async (staff: {
        fullName: string;
        phoneNumber: string;
        role?: string;
        pin?: string;
    }): Promise<Staff> => {
        const response = await fetch('http://localhost:8000/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(staff)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create staff member');
        }
        return await response.json();
    },

    /**
     * Updates an existing staff member.
     */
    updateStaff: async (staffId: string, staff: {
        fullName?: string;
        phoneNumber?: string;
        role?: string;
        isActive?: boolean;
        pin?: string;
    }): Promise<Staff> => {
        const response = await fetch(`http://localhost:8000/staff/${staffId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(staff)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update staff member');
        }
        return await response.json();
    },

    /**
     * Deletes a staff member.
     */
    deleteStaff: async (staffId: string): Promise<void> => {
        const response = await fetch(`http://localhost:8000/staff/${staffId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete staff member');
        }
    }
};
