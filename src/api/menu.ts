import { fetchClient } from './client';

export const getMenuData = () => fetchClient('/menu');
export const getCategories = () => fetchClient('/menu/categories'); // Optional if /menu already returns both
