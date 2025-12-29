import { useEffect, useState } from 'react';
import { Calculator, TrendingUp, History } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Select from '../components/ui/Select';
import { supabase } from '../lib/supabase';
import type { Product, ProductHppHistory, ProductBom, ProductAdditionalCost, RawMaterial } from '../types/database';
import { formatCurrency, formatDateTime } from '../utils/format';

type ProductBomWithMaterial = ProductBom & { raw_materials: RawMaterial };

export default function HppCalculator() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [bomItems, setBomItems] = useState<ProductBomWithMaterial[]>([]);
  const [additionalCosts, setAdditionalCosts] = useState<ProductAdditionalCost[]>([]);
  const [hppHistory, setHppHistory] = useState<ProductHppHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchProductDetails(selectedProductId);
    } else {
      setSelectedProduct(null);
      setBomItems([]);
      setAdditionalCosts([]);
      setHppHistory([]);
    }
  }, [selectedProductId]);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').eq('is_active', true).order('name');
    setProducts(data || []);
  };

  const fetchProductDetails = async (productId: string) => {
    setLoading(true);
    try {
      const [
        { data: product },
        { data: bom },
        { data: costs },
        { data: history },
      ] = await Promise.all([
        supabase.from('products').select('*').eq('id', productId).single(),
        supabase.from('product_bom').select('*, raw_materials(*)').eq('product_id', productId),
        supabase.from('product_additional_costs').select('*').eq('product_id', productId),
        supabase
          .from('product_hpp_history')
          .select('*')
          .eq('product_id', productId)
          .order('calculated_at', { ascending: false })
          .limit(20),
      ]);

      setSelectedProduct(product);
      setBomItems((bom as ProductBomWithMaterial[]) || []);
      setAdditionalCosts(costs || []);
      setHppHistory(history || []);
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setLoading(false);
    }
  };

  const materialCost = bomItems.reduce(
    (sum, b) => sum + b.quantity * b.raw_materials.current_price,
    0
  );
  const additionalCostTotal = additionalCosts.reduce((sum, c) => sum + c.amount, 0);
  const totalHpp = materialCost + additionalCostTotal;

  const chartData = hppHistory
    .slice()
    .reverse()
    .map((h) => ({
      date: new Date(h.calculated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      hpp: h.hpp_value,
      material: h.material_cost,
      additional: h.additional_cost,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Kalkulator HPP</h1>
        <p className="text-slate-600">Analisis detail perhitungan HPP produk</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="max-w-md">
            <Select
              label="Pilih Produk"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              options={products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }))}
            />
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {selectedProduct && !loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Biaya Bahan</p>
                    <p className="text-xl font-bold text-slate-800">{formatCurrency(materialCost)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Biaya Tambahan</p>
                    <p className="text-xl font-bold text-slate-800">{formatCurrency(additionalCostTotal)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total HPP</p>
                    <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalHpp)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Margin</p>
                    <p className="text-xl font-bold text-green-600">
                      {selectedProduct.margin_percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-slate-800">Rincian Bahan Baku</h2>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Bahan</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Harga</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {bomItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800">{item.raw_materials.name}</p>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {item.quantity} {item.raw_materials.unit}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {formatCurrency(item.raw_materials.current_price)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-800">
                            {formatCurrency(item.quantity * item.raw_materials.current_price)}
                          </td>
                        </tr>
                      ))}
                      {bomItems.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                            Belum ada bahan baku
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {bomItems.length > 0 && (
                      <tfoot className="bg-slate-50">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right font-semibold text-slate-700">
                            Total Biaya Bahan
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">
                            {formatCurrency(materialCost)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-slate-800">Biaya Tambahan</h2>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Jenis</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Nama</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {additionalCosts.map((cost) => (
                        <tr key={cost.id}>
                          <td className="px-4 py-3 capitalize text-slate-600">{cost.cost_type}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{cost.cost_name}</td>
                          <td className="px-4 py-3 text-right font-medium text-slate-800">
                            {formatCurrency(cost.amount)}
                          </td>
                        </tr>
                      ))}
                      {additionalCosts.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                            Belum ada biaya tambahan
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {additionalCosts.length > 0 && (
                      <tfoot className="bg-slate-50">
                        <tr>
                          <td colSpan={2} className="px-4 py-3 text-right font-semibold text-slate-700">
                            Total Biaya Tambahan
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">
                            {formatCurrency(additionalCostTotal)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <h2 className="text-lg font-semibold text-slate-800">Tren HPP</h2>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          stroke="#64748b"
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            formatCurrency(value),
                            name === 'hpp' ? 'HPP' : name === 'material' ? 'Bahan' : 'Tambahan',
                          ]}
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="hpp"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ fill: '#10b981' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="material"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="additional"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={{ fill: '#f59e0b' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-500">
                    Belum ada data historis
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <History className="w-5 h-5 text-slate-600" />
                <h2 className="text-lg font-semibold text-slate-800">Riwayat HPP</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {hppHistory.map((h) => (
                    <div key={h.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-slate-600">{formatDateTime(h.calculated_at)}</p>
                        <p className="font-bold text-emerald-600">{formatCurrency(h.hpp_value)}</p>
                      </div>
                      <div className="flex gap-4 mt-1 text-xs text-slate-500">
                        <span>Bahan: {formatCurrency(h.material_cost)}</span>
                        <span>Tambahan: {formatCurrency(h.additional_cost)}</span>
                      </div>
                    </div>
                  ))}
                  {hppHistory.length === 0 && (
                    <p className="text-center text-slate-500 py-4">Belum ada riwayat</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-800">Simulasi Margin</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[10, 20, 30, 50].map((margin) => {
                  const price = totalHpp * (1 + margin / 100);
                  const profit = price - totalHpp;
                  return (
                    <div key={margin} className="p-4 bg-slate-50 rounded-lg text-center">
                      <p className="text-sm text-slate-600">Margin {margin}%</p>
                      <p className="text-lg font-bold text-slate-800">{formatCurrency(price)}</p>
                      <p className="text-sm text-emerald-600">+{formatCurrency(profit)}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
