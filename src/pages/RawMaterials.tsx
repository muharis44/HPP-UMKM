import { useEffect, useState, useMemo } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import DataTable from '../components/ui/DataTable';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/format';

interface RawMaterial {
  id: number;
  name: string;
  sku: string;
  supplier_id: number | null;
  supplier_name?: string;
  unit: string;
  purchase_price: number;
  minimum_stock: number;
  current_stock: number;
  description?: string;
}

interface Supplier {
  id: number;
  name: string;
}

export default function RawMaterials() {
  const { isAdmin } = useAuth();
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    supplier_id: '',
    unit: '',
    purchase_price: '',
    minimum_stock: '0',
    current_stock: '0',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: materialsData }, { data: suppliersData }] = await Promise.all([
        api.rawMaterials.getAll(),
        api.suppliers.getAll(),
      ]);
      setMaterials(materialsData || []);
      setSuppliers(suppliersData || []);
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
        m.sku.toLowerCase().includes(query) ||
        m.supplier_name?.toLowerCase().includes(query)
    );
  }, [materials, searchQuery]);

  const openForm = (material?: RawMaterial) => {
    if (material) {
      setEditingMaterial(material);
      setForm({
        name: material.name,
        sku: material.sku,
        supplier_id: material.supplier_id?.toString() || '',
        unit: material.unit,
        purchase_price: material.purchase_price.toString(),
        minimum_stock: material.minimum_stock.toString(),
        current_stock: material.current_stock.toString(),
        description: material.description || '',
      });
    } else {
      setEditingMaterial(null);
      setForm({
        name: '',
        sku: '',
        supplier_id: '',
        unit: '',
        purchase_price: '',
        minimum_stock: '0',
        current_stock: '0',
        description: '',
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.sku || !form.unit || !form.purchase_price) return;

    setSaving(true);
    try {
      const data = {
        name: form.name,
        sku: form.sku,
        supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
        unit: form.unit,
        purchase_price: parseFloat(form.purchase_price),
        minimum_stock: parseFloat(form.minimum_stock) || 0,
        current_stock: parseFloat(form.current_stock) || 0,
        description: form.description || null,
      };

      if (editingMaterial) {
        await api.rawMaterials.update(editingMaterial.id, data);
      } else {
        await api.rawMaterials.create(data);
      }

      setIsFormOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus bahan baku ini?')) return;

    try {
      await api.rawMaterials.delete(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const columns = [
    {
      key: 'sku',
      header: 'SKU',
      render: (m: RawMaterial) => <span className="font-mono text-sm">{m.sku}</span>,
    },
    {
      key: 'name',
      header: 'Nama Bahan',
      render: (m: RawMaterial) => (
        <div>
          <p className="font-medium text-slate-800">{m.name}</p>
          {m.supplier_name && <p className="text-xs text-slate-500">{m.supplier_name}</p>}
        </div>
      ),
    },
    { key: 'unit', header: 'Satuan' },
    {
      key: 'purchase_price',
      header: 'Harga Beli',
      render: (m: RawMaterial) => <span className="font-medium">{formatCurrency(m.purchase_price)}</span>,
    },
    {
      key: 'current_stock',
      header: 'Stok',
      render: (m: RawMaterial) => (
        <span className={m.current_stock <= m.minimum_stock ? 'text-red-600 font-medium' : ''}>
          {m.current_stock} {m.unit}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (m: RawMaterial) => (
        <div className="flex items-center gap-1">
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
      ),
    },
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
            keyExtractor={(m) => m.id.toString()}
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
              label="SKU"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
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
            <Input
              label="Satuan"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="kg, L, pcs, etc"
              required
            />
            <Input
              label="Harga Beli (Rp)"
              type="number"
              value={form.purchase_price}
              onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
              placeholder="0"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Stok Minimum"
              type="number"
              value={form.minimum_stock}
              onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })}
              placeholder="0"
            />
            <Input
              label="Stok Saat Ini"
              type="number"
              value={form.current_stock}
              onChange={(e) => setForm({ ...form, current_stock: e.target.value })}
              placeholder="0"
            />
          </div>

          <Select
            label="Supplier"
            value={form.supplier_id}
            onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
            options={[
              { value: '', label: 'Pilih Supplier (Opsional)' },
              ...suppliers.map((s) => ({ value: s.id.toString(), label: s.name })),
            ]}
          />

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
    </div>
  );
}
