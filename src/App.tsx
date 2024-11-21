import React, { useState, useEffect } from 'react';
import { Search, Package, BarChart3, DollarSign, Download, PlusCircle, Upload, Trash2, Edit, Save } from 'lucide-react';
import { StatsCard } from './components/StatsCard';
import { ProductForm } from './components/ProductForm';
import { StorageService } from './utils/storage';
import { Product } from './types/product';
import { Toast } from './components/Toast';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    try {
      const loadedProducts = StorageService.loadProducts();
      setProducts(loadedProducts);
    } catch (error) {
      showToast('Erreur lors du chargement des données', 'error');
    }
  }, []);

  useEffect(() => {
    try {
      StorageService.saveProducts(products);
      if (products.length > 0) {
        showToast('Données sauvegardées avec succès', 'success');
      }
    } catch (error) {
      showToast('Erreur lors de la sauvegarde', 'error');
    }
  }, [products]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const totalProducts = products.length;
  const totalItems = products.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const totalValue = products.reduce((acc, curr) => acc + ((curr.quantity || 0) * (curr.price || 0)), 0);

  const handleBackup = () => {
    try {
      const backupUrl = StorageService.backupData(products);
      const link = document.createElement('a');
      link.href = backupUrl;
      link.download = `inventaire_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(backupUrl);
      showToast('Sauvegarde créée avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de la création de la sauvegarde', 'error');
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',');
          
          const importedProducts = lines.slice(1).map((line) => {
            const values = line.split(',');
            const quantity = Number(values[2]);
            const price = Number(values[3]);
            
            return {
              id: Date.now() + Math.random() * 1000000,
              name: values[0]?.trim() || 'Sans nom',
              category: values[1]?.trim() || 'Non catégorisé',
              quantity: isNaN(quantity) ? 0 : quantity,
              price: isNaN(price) ? 0 : price,
              lastUpdated: values[4]?.trim() || new Date().toLocaleDateString()
            };
          });

          setProducts(prevProducts => [...prevProducts, ...importedProducts]);
          showToast('Importation réussie', 'success');
        } catch (error) {
          showToast('Erreur lors de l\'importation du fichier', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ['NOM', 'CATÉGORIE', 'QUANTITÉ', 'PRIX', 'DERNIÈRE MAJ'];
      const csvContent = [
        headers.join(','),
        ...products.map(product => 
          [
            product.name,
            product.category,
            product.quantity,
            product.price,
            product.lastUpdated
          ].join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'inventaire.csv';
      link.click();
      showToast('Exportation réussie', 'success');
    } catch (error) {
      showToast('Erreur lors de l\'exportation', 'error');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = (productId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      setProducts(products.filter(p => p.id !== productId));
      showToast('Produit supprimé avec succès', 'success');
    }
  };

  const handleSubmit = (product: Product) => {
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { ...product, id: editingProduct.id } : p));
      showToast('Produit mis à jour avec succès', 'success');
    } else {
      setProducts([...products, product]);
      showToast('Produit ajouté avec succès', 'success');
    }
    setShowForm(false);
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Gestionnaire d'inventaire</h1>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer">
              <Upload size={20} />
              Importer CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileImport}
              />
            </label>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Download size={20} />
              Exporter CSV
            </button>
            <button
              onClick={handleBackup}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Save size={20} />
              Sauvegarder
            </button>
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              <PlusCircle size={20} />
              Nouveau produit
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Produits uniques"
            value={totalProducts.toString()}
            icon={Package}
            iconColor="text-indigo-600"
            iconBgColor="bg-indigo-100"
          />
          <StatsCard
            title="Articles totaux"
            value={totalItems.toString()}
            icon={BarChart3}
            iconColor="text-emerald-600"
            iconBgColor="bg-emerald-100"
          />
          <StatsCard
            title="Valeur totale"
            value={`${totalValue.toLocaleString()} XAF`}
            icon={DollarSign}
            iconColor="text-amber-600"
            iconBgColor="bg-amber-100"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par nom ou catégorie..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière maj</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Aucun produit trouvé. Commencez par en ajouter un nouveau.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={`product-${product.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{product.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{product.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{product.price.toLocaleString()} XAF</td>
                      <td className="px-6 py-4 whitespace-nowrap">{product.lastUpdated}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

export default App;