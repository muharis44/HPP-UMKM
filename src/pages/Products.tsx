import { useEffect, useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, FileText, DollarSign } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import CreatableSelect from '../components/ui/CreatableSelect';
import DataTable from '../components/ui/DataTable';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Product, RawMaterial, ProductBom, ProductAdditionalCost, Category } from '../types/database';
import { formatCurrency } from '../utils/format';

const COST_TYPES = [
  { value: 'labor', label: 'Tenaga Kerja' },
  { value: 'overhead', label: 'Overhead' },
  { value: 'packaging', label: 'Kemasan' },
  { value: 'other', label: 'Lainnya' },
];

type ProductBomWithMaterial = ProductBom & { raw_materials: RawMaterial };

export default function Products() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBomOpen, setIsBomOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [bomItems, setBomItems] = useState<ProductBomWithMaterial[]>([]);
  const [additionalCosts, setAdditionalCosts] = useState<ProductAdditionalCost[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: '',
    name: '',
    category: '',
    description: '',
  });

  const [bomForm, setBomForm] = useState({
    raw_material_id: '',
    quantity: '',
  });

  const [costForm, setCostForm] = useState({
    cost_type: 'labor' as 'labor' | 'overhead' | 'packaging' | 'other',
    cost_name: '',
    amount: '',
  });

  const [priceForm, setPriceForm] = useState({
    selling_price: '',
    margin_percentage: '',
    useMargin: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: productsData }, { data: materialsData }, { data: categoriesData }] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('raw_materials').select('*').eq('is_active', true).order('name'),
        supabase.from('categories').select('*').eq('is_active', true).order('name'),
      ]);
      setProducts(productsData || []);
      setMaterials(materialsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.code.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const categoryOptions = useMemo(() =>
    categories.map((c) => ({ value: c.name, label: c.name })),
    [categories]
  );

  const handleCreateCategory = async (inputValue: string) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name: inputValue })
        .select()
        .single();

      if (error) throw error;

      setCategories([...categories, data]);
      return { value: data.name, label: data.name };
    } catch (error) {
      console.error('Error creating category:', error);
      return null;
    }
  };

  const openForm = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setForm({
        code: product.code,
        name: product.name,
        category: product.category || '',
        description: product.description || '',
      });
    } else {
      setEditingProduct(null);
      setForm({ code: '', name: '', category: '', description: '' });
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.name) return;

    setSaving(true);
    try {
      const data = {
        code: form.code,
        name: form.name,
        category: form.category || null,
        description: form.description || null,
      };

      if (editingProduct) {
        await supabase.from('products').update(data).eq('id', editingProduct.id);
      } else {
        await supabase.from('products').insert(data);
      }

      setIsFormOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;

    try {
      await supabase.from('products').delete().eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const openBom = async (product: Product) => {
    setSelectedProduct(product);

    const [{ data: bomData }, { data: costsData }] = await Promise.all([
      supabase
        .from('product_bom')
        .select('*, raw_materials(*)')
        .eq('product_id', product.id),
      supabase
        .from('product_additional_costs')
        .select('*')
        .eq('product_id', product.id),
    ]);

    setBomItems((bomData as ProductBomWithMaterial[]) || []);
    setAdditionalCosts(costsData || []);
    setBomForm({ raw_material_id: '', quantity: '' });
    setCostForm({ cost_type: 'labor', cost_name: '', amount: '' });
    setIsBomOpen(true);
  };

  const addBomItem = async () => {
    if (!selectedProduct || !bomForm.raw_material_id || !bomForm.quantity) return;

    setSaving(true);
    try {
      await supabase.from('product_bom').upsert({
        product_id: selectedProduct.id,
        raw_material_id: bomForm.raw_material_id,
        quantity: parseFloat(bomForm.quantity),
      });

      const { data } = await supabase
        .from('product_bom')
        .select('*, raw_materials(*)')
        .eq('product_id', selectedProduct.id);

      setBomItems((data as ProductBomWithMaterial[]) || []);
      setBomForm({ raw_material_id: '', quantity: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding BOM:', error);
    } finally {
      setSaving(false);
    }
  };

  const removeBomItem = async (id: string) => {
    try {
      await supabase.from('product_bom').delete().eq('id', id);
      setBomItems(bomItems.filter((b) => b.id !== id));
      fetchData();
    } catch (error) {
      console.error('Error removing BOM:', error);
    }
  };

  const addCost = async () => {
    if (!selectedProduct || !costForm.cost_name || !costForm.amount) return;

    setSaving(true);
    try {
      await supabase.from('product_additional_costs').insert({
        product_id: selectedProduct.id,
        cost_type: costForm.cost_type,
        cost_name: costForm.cost_name,
        amount: parseFloat(costForm.amount),
      });

      const { data } = await supabase
        .from('product_additional_costs')
        .select('*')
        .eq('product_id', selectedProduct.id);

      setAdditionalCosts(data || []);
      setCostForm({ cost_type: 'labor', cost_name: '', amount: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding cost:', error);
    } finally {
      setSaving(false);
    }
  };

  const removeCost = async (id: string) => {
    try {
      await supabase.from('product_additional_costs').delete().eq('id', id);
      setAdditionalCosts(additionalCosts.filter((c) => c.id !== id));
      fetchData();
    } catch (error) {
      console.error('Error removing cost:', error);
    }
  };

  const openPrice = (product: Product) => {
    setSelectedProduct(product);
    setPriceForm({
      selling_price: product.selling_price.toString(),
      margin_percentage: product.margin_percentage.toString(),
      useMargin: false,
    });
    setIsPriceOpen(true);
  };

  const calculatePrice = () => {
    if (!selectedProduct) return;
    const margin = parseFloat(priceForm.margin_percentage) || 0;
    const hpp = selectedProduct.current_hpp;
    const price = hpp * (1 + margin / 100);
    setPriceForm({ ...priceForm, selling_price: price.toFixed(0) });
  };

  const handleSavePrice = async () => {
    if (!selectedProduct) return;

    setSaving(true);
    try {
      const sellingPrice = parseFloat(priceForm.selling_price) || 0;
      const hpp = selectedProduct.current_hpp;
      const margin = hpp > 0 ? ((sellingPrice - hpp) / hpp) * 100 : 0;

      await supabase
        .from('products')
        .update({
          selling_price: sellingPrice,
          margin_percentage: margin,
        })
        .eq('id', selectedProduct.id);

      setIsPriceOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving price:', error);
    } finally {
      setSaving(false);
    }
  };

  const materialCost = bomItems.reduce(
    (sum, b) => sum + b.quantity * b.raw_materials.current_price,
    0
  );
  const additionalCostTotal = additionalCosts.reduce((sum, c) => sum + c.amount, 0);
  const totalHpp = materialCost + additionalCostTotal;

  const columns = [
    {
      key: 'code',
      header: 'Kode',
      render: (p: Product) => <span className="font-mono text-sm">{p.code}</span>,
    },
    {
      key: 'name',
      header: 'Nama Produk',
      render: (p: Product) => (
        <div>
          <p className="font-medium text-slate-800">{p.name}</p>
          {p.category && <p className="text-xs text-slate-500 capitalize">{p.category}</p>}
        </div>
      ),
    },
    {
      key: 'current_hpp',
      header: 'HPP',
      render: (p: Product) => <span className="font-medium">{formatCurrency(p.current_hpp)}</span>,
    },
    {
      key: 'selling_price',
      header: 'Harga Jual',
      render: (p: Product) => (
        <span className="font-medium text-emerald-600">{formatCurrency(p.selling_price)}</span>
      ),
    },
    {
      key: 'margin',
      header: 'Margin',
      render: (p: Product) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            p.margin_percentage >= 30
              ? 'bg-green-100 text-green-700'
              : p.margin_percentage >= 15
              ? 'bg-amber-100 text-amber-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {p.margin_percentage.toFixed(1)}%
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (p: Product) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openBom(p)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
            title="Resep/BOM"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={() => openPrice(p)}
            className="p-2 hover:bg-slate-100 rounded-lg text-emerald-600"
            title="Harga Jual"
          >
            <DollarSign className="w-4 h-4" />
          </button>
          <button
            onClick={() => openForm(p)}
            className="p-2 hover:bg-slate-100 rounded-lg text-blue-600"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={() => handleDelete(p.id)}
              className="p-2 hover:bg-slate-100 rounded-lg text-red-600"
              title="Hapus"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Produk</h1>
          <p className="text-slate-600">Kelola produk dan resep/BOM</p>
        </div>
        <Button onClick={() => openForm()}>
          <Plus className="w-4 h-4" />
          Tambah Produk
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={filteredProducts}
            keyExtractor={(p) => p.id}
            searchPlaceholder="Cari produk..."
            onSearch={setSearchQuery}
            loading={loading}
            emptyMessage="Belum ada data produk"
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingProduct ? 'Edit Produk' : 'Tambah Produk'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Kode Produk"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="PRD001"
              required
            />
            <Input
              label="Nama Produk"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nama produk"
              required
            />
          </div>

          <CreatableSelect
            label="Kategori"
            value={form.category}
            onChange={(value) => setForm({ ...form, category: value })}
            options={categoryOptions}
            onCreateOption={handleCreateCategory}
            placeholder="Pilih atau tambah kategori..."
            createLabel="Tambah kategori"
          />

          <Input
            label="Deskripsi"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Deskripsi produk (opsional)"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isBomOpen}
        onClose={() => setIsBomOpen(false)}
        title={`Resep/BOM - ${selectedProduct?.name}`}
        size="xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">Biaya Bahan</p>
              <p className="text-xl font-bold text-blue-800">{formatCurrency(materialCost)}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-600">Biaya Tambahan</p>
              <p className="text-xl font-bold text-amber-800">{formatCurrency(additionalCostTotal)}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm text-emerald-600">Total HPP</p>
              <p className="text-xl font-bold text-emerald-800">{formatCurrency(totalHpp)}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-800 mb-3">Bahan Baku</h3>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <Select
                value={bomForm.raw_material_id}
                onChange={(e) => setBomForm({ ...bomForm, raw_material_id: e.target.value })}
                options={materials
                  .filter((m) => !bomItems.find((b) => b.raw_material_id === m.id))
                  .map((m) => ({
                    value: m.id,
                    label: `${m.name} (${formatCurrency(m.current_price)}/${m.unit})`,
                  }))}
                className="flex-1"
              />
              <Input
                type="number"
                value={bomForm.quantity}
                onChange={(e) => setBomForm({ ...bomForm, quantity: e.target.value })}
                placeholder="Jumlah"
                className="w-full sm:w-32"
              />
              <Button onClick={addBomItem} loading={saving}>
                Tambah
              </Button>
            </div>

            <div className="space-y-2">
              {bomItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-slate-800">{item.raw_materials.name}</p>
                    <p className="text-sm text-slate-500">
                      {item.quantity} {item.raw_materials.unit} x{' '}
                      {formatCurrency(item.raw_materials.current_price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium">
                      {formatCurrency(item.quantity * item.raw_materials.current_price)}
                    </p>
                    <button
                      onClick={() => removeBomItem(item.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {bomItems.length === 0 && (
                <p className="text-center text-slate-500 py-4">Belum ada bahan baku</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-800 mb-3">Biaya Tambahan</h3>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <Select
                value={costForm.cost_type}
                onChange={(e) =>
                  setCostForm({
                    ...costForm,
                    cost_type: e.target.value as 'labor' | 'overhead' | 'packaging' | 'other',
                  })
                }
                options={COST_TYPES}
                className="w-full sm:w-40"
              />
              <Input
                value={costForm.cost_name}
                onChange={(e) => setCostForm({ ...costForm, cost_name: e.target.value })}
                placeholder="Nama biaya"
                className="flex-1"
              />
              <Input
                type="number"
                value={costForm.amount}
                onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })}
                placeholder="Jumlah (Rp)"
                className="w-full sm:w-32"
              />
              <Button onClick={addCost} loading={saving}>
                Tambah
              </Button>
            </div>

            <div className="space-y-2">
              {additionalCosts.map((cost) => (
                <div
                  key={cost.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-slate-800">{cost.cost_name}</p>
                    <p className="text-xs text-slate-500 capitalize">{cost.cost_type}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium">{formatCurrency(cost.amount)}</p>
                    <button
                      onClick={() => removeCost(cost.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {additionalCosts.length === 0 && (
                <p className="text-center text-slate-500 py-4">Belum ada biaya tambahan</p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPriceOpen}
        onClose={() => setIsPriceOpen(false)}
        title={`Harga Jual - ${selectedProduct?.name}`}
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">HPP Saat Ini</p>
            <p className="text-2xl font-bold text-slate-800">
              {selectedProduct && formatCurrency(selectedProduct.current_hpp)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useMargin"
              checked={priceForm.useMargin}
              onChange={(e) => setPriceForm({ ...priceForm, useMargin: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <label htmlFor="useMargin" className="text-sm text-slate-700">
              Hitung berdasarkan margin
            </label>
          </div>

          {priceForm.useMargin ? (
            <div className="space-y-4">
              <Input
                label="Margin (%)"
                type="number"
                value={priceForm.margin_percentage}
                onChange={(e) => setPriceForm({ ...priceForm, margin_percentage: e.target.value })}
                placeholder="30"
              />
              <Button variant="secondary" onClick={calculatePrice} className="w-full">
                Hitung Harga Jual
              </Button>
            </div>
          ) : null}

          <Input
            label="Harga Jual (Rp)"
            type="number"
            value={priceForm.selling_price}
            onChange={(e) => setPriceForm({ ...priceForm, selling_price: e.target.value })}
            placeholder="0"
          />

          {selectedProduct && priceForm.selling_price && (
            <div className="p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm text-emerald-600">Estimasi Margin</p>
              <p className="text-xl font-bold text-emerald-800">
                {selectedProduct.current_hpp > 0
                  ? (
                      ((parseFloat(priceForm.selling_price) - selectedProduct.current_hpp) /
                        selectedProduct.current_hpp) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </p>
              <p className="text-sm text-emerald-600">
                Keuntungan: {formatCurrency(parseFloat(priceForm.selling_price) - selectedProduct.current_hpp)}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsPriceOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSavePrice} loading={saving}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
