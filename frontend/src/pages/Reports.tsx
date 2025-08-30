import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, ShoppingBag, 
  Package, Clock, AlertTriangle, Award, Activity,
  Calendar, Download, RefreshCw, Filter
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { toast } from '../lib/toast';


// Colores para gráficos
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

interface KPICard {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

export const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [activeTab, setActiveTab] = useState<'sales' | 'tables' | 'customers' | 'inventory' | 'performance'>('sales');
  
  // Estados para datos
  const [salesData, setSalesData] = useState<any>(null);
  const [tableMetrics, setTableMetrics] = useState<any>(null);
  const [customerMetrics, setCustomerMetrics] = useState<any>(null);
  const [inventoryMetrics, setInventoryMetrics] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  useEffect(() => {
    loadAllReports();
  }, [selectedPeriod]);

  const loadAllReports = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSalesReport(),
        loadTableMetrics(),
        loadCustomerMetrics(),
        loadInventoryMetrics(),
        loadPerformanceMetrics()
      ]);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const loadSalesReport = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reports/sales`);
      if (response.ok) {
        const data = await response.json();
        setSalesData(data);
      }
    } catch (error) {
      console.error('Error loading sales report:', error);
    }
  };

  const loadTableMetrics = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reports/tables`);
      if (response.ok) {
        const data = await response.json();
        setTableMetrics(data);
      }
    } catch (error) {
      console.error('Error loading table metrics:', error);
    }
  };

  const loadCustomerMetrics = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reports/customers`);
      if (response.ok) {
        const data = await response.json();
        setCustomerMetrics(data);
      }
    } catch (error) {
      console.error('Error loading customer metrics:', error);
    }
  };

  const loadInventoryMetrics = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reports/inventory`);
      if (response.ok) {
        const data = await response.json();
        setInventoryMetrics(data);
      }
    } catch (error) {
      console.error('Error loading inventory metrics:', error);
    }
  };

  const loadPerformanceMetrics = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reports/performance`);
      if (response.ok) {
        const data = await response.json();
        setPerformanceMetrics(data);
      }
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-AR').format(value);
  };

  // KPI Cards principales
  const getKPICards = (): KPICard[] => {
    if (!performanceMetrics?.current_kpis) return [];
    
    const kpis = performanceMetrics.current_kpis;
    return [
      {
        title: 'Ventas Hoy',
        value: formatCurrency(kpis.revenue_today || 0),
        change: 12.5,
        icon: <DollarSign className="h-5 w-5" />,
        color: 'bg-green-500'
      },
      {
        title: 'Pedidos Hoy',
        value: kpis.orders_today || 0,
        change: 8.3,
        icon: <ShoppingBag className="h-5 w-5" />,
        color: 'bg-blue-500'
      },
      {
        title: 'Clientes Únicos',
        value: kpis.unique_customers_today || 0,
        change: -2.1,
        icon: <Users className="h-5 w-5" />,
        color: 'bg-purple-500'
      },
      {
        title: 'Tiempo Promedio',
        value: `${Math.round(kpis.avg_order_time || 0)} min`,
        change: -5.2,
        icon: <Clock className="h-5 w-5" />,
        color: 'bg-orange-500'
      }
    ];
  };

  const renderKPICard = (kpi: KPICard) => (
    <div key={kpi.title} className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`${kpi.color} p-3 rounded-lg text-white`}>
          {kpi.icon}
        </div>
        {kpi.change && (
          <div className={`flex items-center gap-1 text-sm ${kpi.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {kpi.change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {Math.abs(kpi.change)}%
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm mb-1">{kpi.title}</h3>
      <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
    </div>
  );

  const renderSalesTab = () => {
    if (!salesData) return <div>Cargando datos de ventas...</div>;

    return (
      <div className="space-y-6">
        {/* Gráfico de ventas diarias */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Ventas Diarias</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesData.daily_sales || []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3B82F6" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Productos más vendidos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Top 10 Productos</h3>
            <div className="space-y-3">
              {(salesData.top_products || []).map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-sm">{product.product_name}</p>
                      <p className="text-xs text-gray-500">{product.category_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{product.quantity_sold} u.</p>
                    <p className="text-xs text-gray-500">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ventas por categoría */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Ventas por Categoría</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={salesData.category_sales || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => entry.category_name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {(salesData.category_sales || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderTablesTab = () => {
    if (!tableMetrics) return <div>Cargando métricas de mesas...</div>;

    return (
      <div className="space-y-6">
        {/* Estado de mesas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Estado Actual de Mesas</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={tableMetrics.table_status || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ocupación por hora */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Ocupación por Hora</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={tableMetrics.hourly_occupancy || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="tables_occupied" stroke="#10B981" name="Mesas Ocupadas" />
                <Line type="monotone" dataKey="orders_count" stroke="#F59E0B" name="Pedidos" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rotación de mesas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Rotación de Mesas (Últimas 24h)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mesa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedidos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duración Promedio
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(tableMetrics.table_turnover || []).slice(0, 10).map((table: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Mesa #{table.table_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {table.capacity} personas
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {table.orders_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Math.round(table.avg_duration_minutes)} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderCustomersTab = () => {
    if (!customerMetrics) return <div>Cargando métricas de clientes...</div>;

    const summary = customerMetrics.summary || {};

    return (
      <div className="space-y-6">
        {/* Resumen de clientes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-600 text-sm mb-1">Total Clientes</h3>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(summary.total_customers || 0)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-600 text-sm mb-1">Clientes Activos</h3>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(summary.active_customers || 0)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-600 text-sm mb-1">Visitas Promedio</h3>
            <p className="text-2xl font-bold text-gray-900">{Math.round(summary.avg_visits || 0)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-600 text-sm mb-1">Gasto Promedio</h3>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.avg_spent || 0)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top clientes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Top 10 Clientes</h3>
            <div className="space-y-3">
              {(customerMetrics.top_customers || []).map((customer: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      customer.customer_type === 'VIP' ? 'bg-purple-500' :
                      customer.customer_type === 'Frequent' ? 'bg-blue-500' :
                      customer.customer_type === 'Regular' ? 'bg-green-500' : 'bg-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.customer_type} • {customer.total_visits} visitas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(customer.total_spent)}</p>
                    <p className="text-xs text-gray-500">{customer.loyalty_points} pts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Distribución de clientes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Distribución de Clientes</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={customerMetrics.customer_distribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.customer_type} (${entry.count})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(customerMetrics.customer_distribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderInventoryTab = () => {
    if (!inventoryMetrics) return <div>Cargando métricas de inventario...</div>;

    return (
      <div className="space-y-6">
        {/* Alertas de stock bajo */}
        {inventoryMetrics.low_stock_items && inventoryMetrics.low_stock_items.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
              <p className="text-sm font-medium text-yellow-800">
                {inventoryMetrics.low_stock_items.length} productos con stock bajo o agotado
              </p>
            </div>
          </div>
        )}

        {/* Productos con bajo stock */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Productos con Bajo Stock</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Actual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Mínimo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(inventoryMetrics.low_stock_items || []).map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.stock_quantity} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.min_stock} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.stock_status === 'Out of Stock' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.stock_status === 'Out of Stock' ? 'Agotado' : 'Stock Bajo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Valor del inventario */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Valor del Inventario por Categoría</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={inventoryMetrics.inventory_value || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category_name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Bar dataKey="inventory_value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Rotación de inventario */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Rotación de Inventario (30 días)</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {(inventoryMetrics.inventory_turnover || []).map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product_name}</p>
                    <p className="text-xs text-gray-500">Stock: {item.current_stock} • Vendido: {item.quantity_sold}</p>
                  </div>
                  <div className={`text-right px-2 py-1 rounded ${
                    item.turnover_rate > 2 ? 'bg-green-100 text-green-800' :
                    item.turnover_rate > 1 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    <p className="font-semibold text-sm">{item.turnover_rate}x</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPerformanceTab = () => {
    if (!performanceMetrics) return <div>Cargando métricas de rendimiento...</div>;

    const comparison = performanceMetrics.period_comparison || [];
    const currentWeek = comparison.find((p: any) => p.period === 'current_week') || {};
    const previousWeek = comparison.find((p: any) => p.period === 'previous_week') || {};

    const growthData = [
      {
        metric: 'Pedidos',
        current: currentWeek.orders || 0,
        previous: previousWeek.orders || 0,
        growth: previousWeek.orders ? ((currentWeek.orders - previousWeek.orders) / previousWeek.orders * 100).toFixed(1) : 0
      },
      {
        metric: 'Ingresos',
        current: currentWeek.revenue || 0,
        previous: previousWeek.revenue || 0,
        growth: previousWeek.revenue ? ((currentWeek.revenue - previousWeek.revenue) / previousWeek.revenue * 100).toFixed(1) : 0
      },
      {
        metric: 'Ticket Promedio',
        current: currentWeek.avg_ticket || 0,
        previous: previousWeek.avg_ticket || 0,
        growth: previousWeek.avg_ticket ? ((currentWeek.avg_ticket - previousWeek.avg_ticket) / previousWeek.avg_ticket * 100).toFixed(1) : 0
      }
    ];

    return (
      <div className="space-y-6">
        {/* Comparación semanal */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Comparación Semanal</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {growthData.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2">{item.metric}</h4>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {item.metric === 'Ingresos' || item.metric === 'Ticket Promedio'
                        ? formatCurrency(item.current)
                        : formatNumber(item.current)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Anterior: {item.metric === 'Ingresos' || item.metric === 'Ticket Promedio'
                        ? formatCurrency(item.previous)
                        : formatNumber(item.previous)}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-semibold ${
                    Number(item.growth) > 0 ? 'text-green-600' : Number(item.growth) < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {Number(item.growth) > 0 ? <TrendingUp className="h-4 w-4" /> : 
                     Number(item.growth) < 0 ? <TrendingDown className="h-4 w-4" /> : null}
                    {item.growth}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar de métricas clave */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Métricas de Rendimiento</h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={[
              { subject: 'Ventas', A: 85, fullMark: 100 },
              { subject: 'Clientes', A: 72, fullMark: 100 },
              { subject: 'Eficiencia', A: 90, fullMark: 100 },
              { subject: 'Satisfacción', A: 88, fullMark: 100 },
              { subject: 'Rotación', A: 65, fullMark: 100 },
              { subject: 'Inventario', A: 78, fullMark: 100 }
            ]}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Rendimiento" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Reportes y Métricas"
        subtitle="Análisis detallado del rendimiento del restaurante"
      />

      <div className="">
        {/* Barra de herramientas */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Hoy</option>
                <option value="week">Esta Semana</option>
                <option value="month">Este Mes</option>
                <option value="quarter">Este Trimestre</option>
                <option value="year">Este Año</option>
              </select>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Calendar className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Filter className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadAllReports}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {getKPICards().map(renderKPICard)}
        </div>

        {/* Tabs de navegación */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('sales')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sales'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Ventas
                </div>
              </button>
              <button
                onClick={() => setActiveTab('tables')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tables'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Mesas
                </div>
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'customers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Clientes
                </div>
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'inventory'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Inventario
                </div>
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'performance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Rendimiento
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Contenido de tabs */}
        <div className="min-h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'sales' && renderSalesTab()}
              {activeTab === 'tables' && renderTablesTab()}
              {activeTab === 'customers' && renderCustomersTab()}
              {activeTab === 'inventory' && renderInventoryTab()}
              {activeTab === 'performance' && renderPerformanceTab()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};