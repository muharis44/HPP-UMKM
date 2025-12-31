const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'An error occurred' };
    }

    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}

export const api = {
  auth: {
    register: (email: string, password: string, full_name?: string) =>
      fetchApi('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name }),
      }),

    login: (email: string, password: string) =>
      fetchApi('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    logout: () =>
      fetchApi('/api/auth/logout', {
        method: 'POST',
      }),

    getCurrentUser: () => fetchApi('/api/auth/user'),
  },

  suppliers: {
    getAll: () => fetchApi('/api/suppliers'),
    getById: (id: number) => fetchApi(`/api/suppliers/${id}`),
    create: (data: any) =>
      fetchApi('/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: any) =>
      fetchApi(`/api/suppliers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      fetchApi(`/api/suppliers/${id}`, {
        method: 'DELETE',
      }),
  },

  rawMaterials: {
    getAll: () => fetchApi('/api/raw-materials'),
    getById: (id: number) => fetchApi(`/api/raw-materials/${id}`),
    create: (data: any) =>
      fetchApi('/api/raw-materials', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: any) =>
      fetchApi(`/api/raw-materials/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      fetchApi(`/api/raw-materials/${id}`, {
        method: 'DELETE',
      }),
  },

  products: {
    getAll: () => fetchApi('/api/products'),
    getById: (id: number) => fetchApi(`/api/products/${id}`),
    calculateHPP: (id: number) => fetchApi(`/api/products/${id}/hpp`),
    create: (data: any) =>
      fetchApi('/api/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: any) =>
      fetchApi(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      fetchApi(`/api/products/${id}`, {
        method: 'DELETE',
      }),
  },

  masterData: {
    getCategories: () => fetchApi('/api/master-data/categories'),
    createCategory: (data: any) =>
      fetchApi('/api/master-data/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateCategory: (id: number, data: any) =>
      fetchApi(`/api/master-data/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteCategory: (id: number) =>
      fetchApi(`/api/master-data/categories/${id}`, {
        method: 'DELETE',
      }),
    getUnits: () => fetchApi('/api/master-data/units'),
    createUnit: (data: any) =>
      fetchApi('/api/master-data/units', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateUnit: (id: number, data: any) =>
      fetchApi(`/api/master-data/units/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteUnit: (id: number) =>
      fetchApi(`/api/master-data/units/${id}`, {
        method: 'DELETE',
      }),
  },
};
