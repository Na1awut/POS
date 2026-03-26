const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const adminFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('posplus_admin_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem('posplus_admin_token');
    window.location.href = '/admin/login';
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Error ${response.status}`);
  }
  return response.json();
};

export const isAuthenticated = () => !!localStorage.getItem('posplus_admin_token');
