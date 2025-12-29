import { useEffect, useState, useMemo } from 'react';
import { Edit2, Shield, User } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types/database';
import { formatDate } from '../utils/format';

export default function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [newRole, setNewRole] = useState<'admin' | 'staff'>('staff');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (u) => u.full_name.toLowerCase().includes(query) || u.role.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const openEdit = (user: UserProfile) => {
    setEditingUser(user);
    setNewRole(user.role);
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    setSaving(true);
    try {
      await supabase.from('user_profiles').update({ role: newRole }).eq('id', editingUser.id);
      setIsEditOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Nama',
      render: (u: UserProfile) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="font-medium text-slate-800">{u.full_name}</p>
            <p className="text-xs text-slate-500">ID: {u.id.slice(0, 8)}...</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u: UserProfile) => (
        <div className="flex items-center gap-2">
          {u.role === 'admin' ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
              <Shield className="w-3 h-3" />
              Admin
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              <User className="w-3 h-3" />
              Staff
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Bergabung',
      render: (u: UserProfile) => <span className="text-slate-600">{formatDate(u.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (u: UserProfile) => (
        <button
          onClick={() => openEdit(u)}
          className="p-2 hover:bg-slate-100 rounded-lg text-blue-600"
          title="Edit Role"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pengguna</h1>
        <p className="text-slate-600">Kelola pengguna dan hak akses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Pengguna</p>
                <p className="text-3xl font-bold text-slate-800">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Admin</p>
                <p className="text-3xl font-bold text-slate-800">
                  {users.filter((u) => u.role === 'admin').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Staff</p>
                <p className="text-3xl font-bold text-slate-800">
                  {users.filter((u) => u.role === 'staff').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={filteredUsers}
            keyExtractor={(u) => u.id}
            searchPlaceholder="Cari pengguna..."
            onSearch={setSearchQuery}
            loading={loading}
            emptyMessage="Belum ada pengguna"
          />
        </CardContent>
      </Card>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Ubah Role Pengguna" size="sm">
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">Pengguna</p>
            <p className="font-medium text-slate-800">{editingUser?.full_name}</p>
          </div>

          <Select
            label="Role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as 'admin' | 'staff')}
            options={[
              { value: 'admin', label: 'Admin - Akses penuh' },
              { value: 'staff', label: 'Staff - Akses terbatas' },
            ]}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsEditOpen(false)}>
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
