import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Ruler, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Unit, Category } from '../types/database';

type Tab = 'units' | 'categories';

export default function MasterData() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('units');
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  const [unitForm, setUnitForm] = useState({ name: '', symbol: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: unitsData }, { data: categoriesData }] = await Promise.all([
        supabase.from('units').select('*').order('name'),
        supabase.from('categories').select('*').order('name'),
      ]);
      setUnits(unitsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openUnitModal = (unit?: Unit) => {
    if (unit) {
      setEditingUnit(unit);
      setUnitForm({ name: unit.name, symbol: unit.symbol });
    } else {
      setEditingUnit(null);
      setUnitForm({ name: '', symbol: '' });
    }
    setIsUnitModalOpen(true);
  };

  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ name: category.name, description: category.description || '' });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '' });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveUnit = async () => {
    if (!unitForm.name || !unitForm.symbol) return;

    setSaving(true);
    try {
      if (editingUnit) {
        await supabase
          .from('units')
          .update({ name: unitForm.name, symbol: unitForm.symbol })
          .eq('id', editingUnit.id);
      } else {
        await supabase.from('units').insert({ name: unitForm.name, symbol: unitForm.symbol });
      }
      setIsUnitModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving unit:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name) return;

    setSaving(true);
    try {
      if (editingCategory) {
        await supabase
          .from('categories')
          .update({ name: categoryForm.name, description: categoryForm.description || null })
          .eq('id', editingCategory.id);
      } else {
        await supabase
          .from('categories')
          .insert({ name: categoryForm.name, description: categoryForm.description || null });
      }
      setIsCategoryModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm('Yakin ingin menghapus satuan ini?')) return;
    try {
      await supabase.from('units').delete().eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error deleting unit:', error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return;
    try {
      await supabase.from('categories').delete().eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const toggleUnitStatus = async (unit: Unit) => {
    try {
      await supabase.from('units').update({ is_active: !unit.is_active }).eq('id', unit.id);
      fetchData();
    } catch (error) {
      console.error('Error toggling unit status:', error);
    }
  };

  const toggleCategoryStatus = async (category: Category) => {
    try {
      await supabase.from('categories').update({ is_active: !category.is_active }).eq('id', category.id);
      fetchData();
    } catch (error) {
      console.error('Error toggling category status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Master Data</h1>
        <p className="text-slate-600">Kelola satuan dan kategori produk</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('units')}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'units'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          <Ruler className="w-4 h-4" />
          Satuan
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'categories'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-600 hover:text-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          Kategori
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === 'units' ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Daftar Satuan</h2>
            <Button onClick={() => openUnitModal()} size="sm">
              <Plus className="w-4 h-4" />
              Tambah Satuan
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Simbol</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {units.map((unit) => (
                    <tr key={unit.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-800">{unit.name}</td>
                      <td className="px-6 py-4 font-mono text-slate-600">{unit.symbol}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleUnitStatus(unit)}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            unit.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {unit.is_active ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openUnitModal(unit)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-blue-600"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteUnit(unit.id)}
                              className="p-2 hover:bg-slate-100 rounded-lg text-red-600"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {units.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        Belum ada data satuan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Daftar Kategori</h2>
            <Button onClick={() => openCategoryModal()} size="sm">
              <Plus className="w-4 h-4" />
              Tambah Kategori
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Deskripsi</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-800">{category.name}</td>
                      <td className="px-6 py-4 text-slate-600">{category.description || '-'}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleCategoryStatus(category)}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            category.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {category.is_active ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openCategoryModal(category)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-blue-600"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="p-2 hover:bg-slate-100 rounded-lg text-red-600"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        Belum ada data kategori
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        title={editingUnit ? 'Edit Satuan' : 'Tambah Satuan'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Nama Satuan"
            value={unitForm.name}
            onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
            placeholder="Kilogram"
            required
          />
          <Input
            label="Simbol"
            value={unitForm.symbol}
            onChange={(e) => setUnitForm({ ...unitForm, symbol: e.target.value })}
            placeholder="kg"
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsUnitModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveUnit} loading={saving}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Nama Kategori"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            placeholder="Makanan"
            required
          />
          <Input
            label="Deskripsi"
            value={categoryForm.description}
            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            placeholder="Deskripsi kategori (opsional)"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsCategoryModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveCategory} loading={saving}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
