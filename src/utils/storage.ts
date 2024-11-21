import { Product } from '../types/product';

const STORAGE_KEY = 'inventory_v1';

export const StorageService = {
  saveProducts: (products: Product[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      throw new Error('Impossible de sauvegarder les données');
    }
  },

  loadProducts: (): Product[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      return [];
    }
  },

  backupData: (products: Product[]): string => {
    try {
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: products
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Erreur lors de la création de la sauvegarde:', error);
      throw new Error('Impossible de créer la sauvegarde');
    }
  }
};