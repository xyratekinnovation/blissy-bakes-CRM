
export interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    image: string;
    stock: number;
    isAvailable: boolean;
}

export const productsApi = {
    /**
     * Fetches all products from the Python backend.
     */
    getProducts: async (category?: string): Promise<Product[]> => {
        const url = category && category !== "All" 
            ? `http://localhost:8000/products?category=${encodeURIComponent(category)}`
            : 'http://localhost:8000/products';
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch products');
        return await response.json();
    },

    /**
     * Fetches a single product by ID.
     */
    getProduct: async (productId: string): Promise<Product> => {
        const response = await fetch(`http://localhost:8000/products/${productId}`);
        if (!response.ok) throw new Error('Failed to fetch product');
        return await response.json();
    },

    /**
     * Creates a new product with optional image file upload.
     */
    createProduct: async (product: {
        name: string;
        price: number;
        category: string;
        imageFile?: File;
        imageUrl?: string;
        stock?: number;
        minStock?: number;
        isAvailable?: boolean;
    }): Promise<Product> => {
        const formData = new FormData();
        formData.append('name', product.name);
        formData.append('price', product.price.toString());
        formData.append('category', product.category);
        formData.append('stock', (product.stock || 0).toString());
        formData.append('minStock', (product.minStock || 5).toString());
        // FastAPI Form() expects string "true"/"false" for boolean
        formData.append('isAvailable', product.isAvailable !== false ? 'true' : 'false');
        
        if (product.imageFile) {
            formData.append('image', product.imageFile);
        } else if (product.imageUrl) {
            formData.append('imageUrl', product.imageUrl);
        }
        
        const response = await fetch('http://localhost:8000/products', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to create product' }));
            throw new Error(error.detail || 'Failed to create product');
        }
        return await response.json();
    },

    /**
     * Updates an existing product with optional image file upload.
     */
    updateProduct: async (productId: string, product: {
        name?: string;
        price?: number;
        category?: string;
        imageFile?: File;
        imageUrl?: string;
        isAvailable?: boolean;
    }): Promise<Product> => {
        const formData = new FormData();
        
        if (product.name !== undefined) formData.append('name', product.name);
        if (product.price !== undefined) formData.append('price', product.price.toString());
        if (product.category !== undefined) formData.append('category', product.category);
        if (product.isAvailable !== undefined) {
            formData.append('isAvailable', product.isAvailable ? 'true' : 'false');
        }
        
        if (product.imageFile) {
            formData.append('image', product.imageFile);
        } else if (product.imageUrl !== undefined) {
            formData.append('imageUrl', product.imageUrl || '');
        }
        
        const response = await fetch(`http://localhost:8000/products/${productId}`, {
            method: 'PUT',
            body: formData
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to update product' }));
            throw new Error(error.detail || 'Failed to update product');
        }
        return await response.json();
    },

    /**
     * Deletes a product.
     */
    deleteProduct: async (productId: string): Promise<void> => {
        const response = await fetch(`http://localhost:8000/products/${productId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete product');
        }
    }
};
