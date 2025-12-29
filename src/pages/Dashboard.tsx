import { useEffect, useState } from 'react';
import { Package, Boxes, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import type { Product, RawMaterial } from '../types/database';
import { formatCurrency } from '../utils/format';

interface DashboardStats {
  totalProducts: number;
  totalMaterials: number;
  highestHpp: Product | null;
  lowestHpp: Product | null;
  lowStockMaterials: RawMaterial[];
}

interface HppTrend {
  month: string;
  avgHpp: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalMaterials: 0,
    highestHpp: null,
    lowestHpp: null,
    lowStockMaterials: [],
  });
  const [hppTrend, setHppTrend] = useState<HppTrend[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        { count: productCount },
        { count: materialCount },
        { data: products },
        { data: lowStock },
        { data: hppHistory },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('raw_materials').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*').eq('is_active', true).order('current_hpp', { ascending: false }),
        supabase.from('raw_materials').select('*').lt('current_stock', supabase.rpc('get_min_stock')).limit(5),
        supabase.from('product_hpp_history').select('*').order('calculated_at', { ascending: false }).limit(100),
      ]);

      const activeProducts = products || [];
      const highestHpp = activeProducts[0] || null;
      const lowestHpp = activeProducts.length > 0 ? activeProducts[activeProducts.length - 1] : null;

      const { data: lowStockMaterials } = await supabase
        .from('raw_materials')
        .select('*')
        .eq('is_active', true);

      const filteredLowStock = (lowStockMaterials || []).filter(m => m.current_stock <= m.min_stock);

      const trendData = processHppTrend(hppHistory || []);

      setStats({
        totalProducts: productCount || 0,
        totalMaterials: materialCount || 0,
        highestHpp,
        lowestHpp,
        lowStockMaterials: filteredLowStock.slice(0, 5),
      });
      setHppTrend(trendData);
      setRecentProducts(activeProducts.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processHppTrend = (history: { calculated_at: string; hpp_value: number }[]): HppTrend[] => {
    const monthlyData: Record<string, { total: number; count: number }> = {};

    history.forEach((item) => {
      const date = new Date(item.calculated_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, count: 0 };
      }
      monthlyData[monthKey].total += Number(item.hpp_value);
      monthlyData[monthKey].count += 1;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: formatMonth(month),
        avgHpp: data.total / data.count,
      }));
  };

  const formatMonth = (monthKey: string): string => {
    const [year, month] = monthKey.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${months[parseInt(month) - 1]} ${year.slice(-2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-600">Ringkasan data produk dan bahan baku</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Produk</p>
                <p className="text-3xl font-bold text-slate-800">{stats.totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Bahan Baku</p>
                <p className="text-3xl font-bold text-slate-800">{stats.totalMaterials}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Boxes className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">HPP Tertinggi</p>
                <p className="text-lg font-bold text-slate-800 truncate">
                  {stats.highestHpp ? formatCurrency(stats.highestHpp.current_hpp) : '-'}
                </p>
                <p className="text-xs text-slate-500 truncate">{stats.highestHpp?.name || '-'}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">HPP Terendah</p>
                <p className="text-lg font-bold text-slate-800 truncate">
                  {stats.lowestHpp ? formatCurrency(stats.lowestHpp.current_hpp) : '-'}
                </p>
                <p className="text-xs text-slate-500 truncate">{stats.lowestHpp?.name || '-'}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-800">Tren HPP Bulanan</h2>
          </CardHeader>
          <CardContent>
            {hppTrend.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hppTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#64748b" />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="#64748b"
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Rata-rata HPP']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgHpp"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                Belum ada data HPP
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-800">Stok Rendah</h2>
          </CardHeader>
          <CardContent>
            {stats.lowStockMaterials.length > 0 ? (
              <div className="space-y-3">
                {stats.lowStockMaterials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200"
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{material.name}</p>
                      <p className="text-xs text-slate-600">
                        Stok: {material.current_stock} {material.unit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-8">Semua stok aman</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-800">Produk Terbaru</h2>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Kode</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Nama Produk</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Kategori</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">HPP</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Harga Jual</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentProducts.length > 0 ? (
                  recentProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">{product.code}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{product.category || '-'}</td>
                      <td className="px-6 py-4 text-sm text-right text-slate-800">
                        {formatCurrency(product.current_hpp)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-slate-800">
                        {formatCurrency(product.selling_price)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.margin_percentage >= 30
                              ? 'bg-green-100 text-green-700'
                              : product.margin_percentage >= 15
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {product.margin_percentage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Belum ada produk
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
