import { useState } from 'react';
import { User, Lock, Bell, Database } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const handleProfileSave = async () => {
    if (!profileForm.full_name) return;

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await supabase
        .from('user_profiles')
        .update({ full_name: profileForm.full_name })
        .eq('id', user?.id);

      setMessage({ type: 'success', text: 'Profil berhasil diperbarui' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal memperbarui profil' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.new_password || !passwordForm.confirm_password) return;

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({ type: 'error', text: 'Password baru tidak cocok' });
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal 6 karakter' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password berhasil diubah' });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal mengubah password' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Keamanan', icon: Lock },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'data', label: 'Data', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pengaturan</h1>
        <p className="text-slate-600">Kelola akun dan preferensi aplikasi</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="lg:w-64 h-fit">
          <CardContent className="p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        <div className="flex-1">
          {message.text && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-slate-800">Informasi Profil</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{profile?.full_name}</p>
                    <p className="text-sm text-slate-600">{user?.email}</p>
                    <p className="text-xs text-slate-500 capitalize mt-1">Role: {profile?.role}</p>
                  </div>
                </div>

                <hr className="border-slate-200" />

                <Input
                  label="Nama Lengkap"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  placeholder="Nama lengkap Anda"
                />

                <div className="flex justify-end">
                  <Button onClick={handleProfileSave} loading={saving}>
                    Simpan Perubahan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-slate-800">Ubah Password</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Password Baru"
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                />

                <Input
                  label="Konfirmasi Password Baru"
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                  }
                  placeholder="Ulangi password baru"
                />

                <div className="flex justify-end">
                  <Button onClick={handlePasswordChange} loading={saving}>
                    Ubah Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-slate-800">Pengaturan Notifikasi</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">Peringatan Stok Rendah</p>
                    <p className="text-sm text-slate-600">
                      Notifikasi saat stok bahan baku di bawah minimum
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">Perubahan Harga Bahan</p>
                    <p className="text-sm text-slate-600">Notifikasi saat harga bahan baku berubah</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">Update HPP</p>
                    <p className="text-sm text-slate-600">
                      Notifikasi saat HPP produk diperbarui otomatis
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'data' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-slate-800">Manajemen Data</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-medium text-slate-800 mb-2">Export Data</h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Download semua data produk dan bahan baku dalam format CSV
                  </p>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm">
                      Export Produk
                    </Button>
                    <Button variant="secondary" size="sm">
                      Export Bahan Baku
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="font-medium text-amber-800 mb-2">Backup Database</h3>
                  <p className="text-sm text-amber-700 mb-3">
                    Buat backup data untuk keamanan. Backup terakhir: Belum pernah
                  </p>
                  <Button variant="secondary" size="sm">
                    Buat Backup
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
