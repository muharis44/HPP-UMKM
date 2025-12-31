import { useEffect, useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import DataTable from '../components/ui/DataTable';
import { api } from '../lib/api';
import type { Supplier } from '../types/database';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const { data } = await api.suppliers.getAll();
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = useMemo(() => {
    if (!searchQuery) return suppliers;
    const query = searchQuery.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.contact_person?.toLowerCase().includes(query) ||
        s.phone?.includes(query)
    );
  }, [suppliers, searchQuery]);

  const openForm = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setForm({
        name: supplier.name,
        contact_person: supplier.contact_person || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
      });
    } else {
      setEditingSupplier(null);
      setForm({ name: '', contact_person: '', phone: '', email: '', address: '' });
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) return;

    setSaving(true);
    try {
      const data = {
        name: form.name,
        contact_person: form.contact_person || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
      };

      if (editingSupplier) {
        await api.suppliers.update(editingSupplier.id, data);
      } else {
        await api.suppliers.create(data);
      }

      setIsFormOpen(false);
      fetchSuppliers();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus supplier ini?')) return;

    try {
      await api.suppliers.delete(Number(id));
      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Nama Supplier',
      render: (s: Supplier) => (
        <div>
          <p className="font-medium text-slate-800">{s.name}</p>
          {s.contact_person && <p className="text-xs text-slate-500">{s.contact_person}</p>}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Kontak',
      render: (s: Supplier) => (
        <div className="space-y-1">
          {s.phone && (
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <Phone className="w-3 h-3" />
              {s.phone}
            </div>
          )}
          {s.email && (
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <Mail className="w-3 h-3" />
              {s.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Alamat',
      render: (s: Supplier) =>
        s.address ? (
          <div className="flex items-start gap-1 text-sm text-slate-600">
            <MapPin className="w-3 h-3 mt-1 shrink-0" />
            <span className="line-clamp-2">{s.address}</span>
          </div>
        ) : (
          '-'
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s: Supplier) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            s.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {s.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (s: Supplier) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openForm(s)}
            className="p-2 hover:bg-slate-100 rounded-lg text-blue-600"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(s.id)}
            className="p-2 hover:bg-slate-100 rounded-lg text-red-600"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Supplier</h1>
          <p className="text-slate-600">Kelola data supplier bahan baku</p>
        </div>
        <Button onClick={() => openForm()}>
          <Plus className="w-4 h-4" />
          Tambah Supplier
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={filteredSuppliers}
            keyExtractor={(s) => s.id}
            searchPlaceholder="Cari supplier..."
            onSearch={setSearchQuery}
            loading={loading}
            emptyMessage="Belum ada data supplier"
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingSupplier ? 'Edit Supplier' : 'Tambah Supplier'}
      >
        <div className="space-y-4">
          <Input
            label="Nama Supplier"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="PT. Supplier"
            required
          />

          <Input
            label="Nama Kontak"
            value={form.contact_person}
            onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
            placeholder="Nama person"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Telepon"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="08xxxxxxxxxx"
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@supplier.com"
            />
          </div>

          <Input
            label="Alamat"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Alamat lengkap"
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
