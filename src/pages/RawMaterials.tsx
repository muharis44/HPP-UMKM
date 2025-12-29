import { useEffect, useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, History, Package as PackageIcon } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import CreatableSelect from '../components/ui/CreatableSelect';
import DataTable from '../components/ui/DataTable';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { RawMaterial, Supplier, RawMaterialPriceHistory, Unit } from '../types/database';
import { formatCurrency, formatDateTime, formatNumber } from '../utils/format';

type RawMaterialWithSupplier = RawMaterial & { suppliers?: Supplier | null };

export default function RawMaterials() {
  const { isAdmin } = useAuth();
  const [materials, setMaterials] = useState<RawMaterialWithSupplier[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [priceHistory, setPriceHistory] = useState<RawMaterialPriceHistory[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: '',
    name: '',
    unit: '',
    current_price: '',
    min_stock: '',
    supplier_id: '',
    description: '',
  });

  const [stockForm, setStockForm] = useState({
    type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: '',
    reference: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: materialsData }, { data: suppliersData }, { data: unitsData }] = await Promise.all([
        supabase.from('raw_materials').select('*, suppliers(*)').order('name'),
        supabase.from('suppliers').select('*').eq('is_active', true).order('name'),
        supabase.from('units').select('*').eq('is_active', true).order('name'),
      ]);
      setMaterials(materialsData || []);
      setSuppliers(suppliersData || []);
      setUnits(unitsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = useMemo(() => {
    if (!searchQuery) return materials;
    const query = searchQuery.toLowerCase();
    return materials.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.code.toLowerCase().includes(query) ||
        m.suppliers?.name?.toLowerCase().includes(query)
    );
  }, [materials, searchQuery]);

  const unitOptions = useMemo(() =>
    units.map((u) => ({ value: u.symbol, label: `${u.name} (${u.symbol})` })),
    [units]
  );

  const supplierOptions = useMemo(() =>
    suppliers.map((s) => ({ value: s.id, label: s.name })),
    [suppliers]
  );

  const handleCreateUnit = async (inputValue: string) => {
    try {
      const { data, error } = await supabase
        .from('units')
        .insert({ name: inputValue, symbol: inputValue.toLowerCase().replace(/\s+/g, '') })
        .select()
        .single();

      if (error) throw error;

      setUnits([...units, data]);
      return { value: data.symbol, label: `${data.name} (${data.symbol})` };
    } catch (error) {
      console.error('Error creating unit:', error);
      return null;
    }
  };

  const handleCreateSupplier = async (inputValue: string) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({ name: inputValue })
        .select()
        .single();

      if (error) throw error;

      setSuppliers([...suppliers, data]);
      return { value: data.id, label: data.name };
    } catch (error) {
      console.error('Error creating supplier:', error);
      return null;
    }
  };

  const openForm = (material?: RawMaterial) => {
    if (material) {
      setEditingMaterial(material);
      setForm({
        code: material.code,
        name: material.name,
        unit: material.unit,
        current_price: material.current_price.toString(),
        min_stock: material.min_stock.toString(),
        supplier_id: material.supplier_id || '',
        description: material.description || '',
      });
    } else {
      setEditingMaterial(null);
      setForm({
        code: '',
        name: '',
        unit: '',
        current_price: '',
        min_stock: '0',
        supplier_id: '',
        description: '',
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.name || !form.unit || !form.current_price) return;

    setSaving(true);
    try {
      const data = {
        code: form.code,
        name: form.name,
        unit: form.unit,
        current_price: parseFloat(form.current_price),
        min_stock: parseFloat(form.min_stock) || 0,
        supplier_id: form.supplier_id || null,
        description: form.description || null,
      };

      if (editingMaterial) {
        await supabase.from('raw_materials').update(data).eq('id', editingMaterial.id);
      } else {
        await supabase.from('raw_materials').insert(data);
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
    if (!confirm('Yakin ingin menghapus bahan baku ini?')) return;

    try {
      await supabase.from('raw_materials').delete().eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const openHistory = async (material: RawMaterial) => {
    setSelectedMaterial(material);
    const { data } = await supabase
      .from('raw_material_price_history')
      .select('*')
      .eq('raw_material_id', material.id)
      .order('changed_at', { ascending: false })
      .limit(20);
    setPriceHistory(data || []);
    setIsHistoryOpen(true);
  };

  const openStock = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setStockForm({ type: 'in', quantity: '', reference: '', notes: '' });
    setIsStockOpen(true);
  };

  const handleStockTransaction = async () => {
    if (!selectedMaterial || !stockForm.quantity) return;

    setSaving(true);
    try {
      await supabase.from('raw_material_stock_transactions').insert({
        raw_material_id: selectedMaterial.id,
        type: stockForm.type,
        quantity: parseFloat(stockForm.quantity),
        reference: stockForm.reference || null,
        notes: stockForm.notes || null,
      });

      setIsStockOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving stock:', error);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'code', header: 'Kode', render: (m: RawMaterialWithSupplier) => (
      <span className="font-mono text-sm">{m.code}</span>
    )},
    { key: 'name', header: 'Nama Bahan', render: (m: RawMaterialWithSupplier) => (
      <div>
        <p className="font-medium text-slate-800">{m.name}</p>
        {m.suppliers && <p className="text-xs text-slate-500">{m.suppliers.name}</p>}
      </div>
    )},
    { key: 'unit', header: 'Satuan' },
    { key: 'current_price', header: 'Harga', render: (m: RawMaterialWithSupplier) => (
      <span className="font-medium">{formatCurrency(m.current_price)}</span>
    )},
    { key: 'current_stock', header: 'Stok', render: (m: RawMaterialWithSupplier) => (
      <span className={m.current_stock <= m.min_stock ? 'text-red-600 font-medium' : ''}>
        {formatNumber(m.current_stock, 2)} {m.unit}
      </span>
    )},
    { key: 'actions', header: 'Aksi', render: (m: RawMaterialWithSupplier) => (
      <div className="flex items-center gap-1">
        <button
          onClick={() => openStock(m)}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
          title="Stok"
        >
          <PackageIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => openHistory(m)}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
          title="Riwayat Harga"
        >
          <History className="w-4 h-4" />
        </button>
        <button
          onClick={() => openForm(m)}
          className="p-2 hover:bg-slate-100 rounded-lg text-blue-600"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        {isAdmin && (
          <button
            onClick={() => handleDelete(m.id)}
            className="p-2 hover:bg-slate-100 rounded-lg text-red-600"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bahan Baku</h1>
          <p className="text-slate-600">Kelola data bahan baku dan stok</p>
        </div>
        <Button onClick={() => openForm()}>
          <Plus className="w-4 h-4" />
          Tambah Bahan
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={filteredMaterials}
            keyExtractor={(m) => m.id}
            searchPlaceholder="Cari bahan baku..."
            onSearch={setSearchQuery}
            loading={loading}
            emptyMessage="Belum ada data bahan baku"
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingMaterial ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Kode Bahan"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="BB001"
              required
            />
            <Input
              label="Nama Bahan"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nama bahan baku"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CreatableSelect
              label="Satuan"
              value={form.unit}
              onChange={(value) => setForm({ ...form, unit: value })}
              options={unitOptions}
              onCreateOption={handleCreateUnit}
              placeholder="Pilih atau tambah satuan..."
              createLabel="Tambah satuan"
            />
            <Input
              label="Harga Beli (Rp)"
              type="number"
              value={form.current_price}
              onChange={(e) => setForm({ ...form, current_price: e.target.value })}
              placeholder="0"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Stok Minimum"
              type="number"
              value={form.min_stock}
              onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
              placeholder="0"
            />
            <CreatableSelect
              label="Supplier"
              value={form.supplier_id}
              onChange={(value) => setForm({ ...form, supplier_id: value })}
              options={supplierOptions}
              onCreateOption={handleCreateSupplier}
              placeholder="Pilih atau tambah supplier..."
              createLabel="Tambah supplier"
            />
          </div>

          <Input
            label="Deskripsi"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Deskripsi bahan (opsional)"
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
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Riwayat Harga - ${selectedMaterial?.name}`}
      >
        <div className="space-y-3">
          {priceHistory.length > 0 ? (
            priceHistory.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-600">{formatDateTime(h.changed_at)}</p>
                  <p className="text-xs text-slate-500">{h.notes || '-'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 line-through">{formatCurrency(h.old_price)}</p>
                  <p className="font-medium text-slate-800">{formatCurrency(h.new_price)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-500 py-8">Belum ada riwayat perubahan harga</p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isStockOpen}
        onClose={() => setIsStockOpen(false)}
        title={`Transaksi Stok - ${selectedMaterial?.name}`}
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">Stok Saat Ini</p>
            <p className="text-2xl font-bold text-slate-800">
              {selectedMaterial && formatNumber(selectedMaterial.current_stock, 2)} {selectedMaterial?.unit}
            </p>
          </div>

          <Select
            label="Jenis Transaksi"
            value={stockForm.type}
            onChange={(e) => setStockForm({ ...stockForm, type: e.target.value as 'in' | 'out' | 'adjustment' })}
            options={[
              { value: 'in', label: 'Masuk (Pembelian)' },
              { value: 'out', label: 'Keluar (Pemakaian)' },
              { value: 'adjustment', label: 'Penyesuaian' },
            ]}
          />

          <Input
            label={stockForm.type === 'adjustment' ? 'Jumlah Stok Baru' : 'Jumlah'}
            type="number"
            value={stockForm.quantity}
            onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
            placeholder="0"
            required
          />

          <Input
            label="Referensi"
            value={stockForm.reference}
            onChange={(e) => setStockForm({ ...stockForm, reference: e.target.value })}
            placeholder="No. PO / Faktur"
          />

          <Input
            label="Catatan"
            value={stockForm.notes}
            onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
            placeholder="Catatan transaksi"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsStockOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleStockTransaction} loading={saving}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
