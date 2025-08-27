import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { 

  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, ShoppingBag, 
  Package, Clock, AlertTriangle, Award, Activity,
  Calendar, Download, RefreshCw, Filter, ChefHat,
  Percent, Target, Brain, Lightbulb, AlertCircle,
  ArrowUp, ArrowDown, Zap, TrendingUp as TrendIcon
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useLocalization } from '../contexts/LocalizationContext';

// Colores para gráficos
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

// Datos hardcodeados pero realistas
const mockData = {
  // KPIs críticos del negocio gastronómico
  criticalKPIs: {
    foodCost: {
      current: 28.5,
      target: 30,
      trend: -2.3,
      status: 'good'
    },
    laborCost: {
      current: 31.2,
      target: 30,
      trend: 1.5,
      status: 'warning'
    },
    primeCoast: {
      current: 59.7,
      target: 60,
      trend: -0.8,
      status: 'good'
    },
    grossProfit: {
      current: 72.3,
      target: 70,
      trend: 2.1,
      status: 'excellent'
    }
  },
  
  // Alertas inteligentes basadas en IA
  aiAlerts: [
    {
      type: 'critical',
      icon: AlertCircle,
      titleKey: 'alerts.criticalStock.title',
      messageKey: 'alerts.criticalStock.message',
      actionKey: 'alerts.criticalStock.action',
      confidence: 92
    },
    {
      type: 'warning',
      icon: TrendIcon,
      titleKey: 'alerts.costAnomaly.title',
      messageKey: 'alerts.costAnomaly.message',
      actionKey: 'alerts.costAnomaly.action',
      confidence: 87
    },
    {
      type: 'success',
      icon: Lightbulb,
      titleKey: 'alerts.opportunity.title',
      messageKey: 'alerts.opportunity.message',
      actionKey: 'alerts.opportunity.action',
      confidence: 94
    },
    {
      type: 'info',
      icon: Brain,
      titleKey: 'alerts.rushHour.title',
      messageKey: 'alerts.rushHour.message',
      actionKey: 'alerts.rushHour.action',
      confidence: 78
    }
  ],
  
  // Métricas en tiempo real
  realTimeMetrics: {
    currentHour: {
      sales: 12450,
      orders: 23,
      avgTicket: 541,
      tablesOccupied: 15,
      kitchenTime: 18
    },
    comparison: {
      salesVsYesterday: 15.3,
      ordersVsLastWeek: 8.7,
      avgTicketVsMonth: -2.1
    }
  },
  
  // Análisis predictivo
  predictions: {
    todayProjected: {
      sales: 87500,
      orders: 145,
      confidence: 85
    },
    weekProjected: {
      sales: 525000,
      orders: 980,
      confidence: 78
    },
    inventoryAlerts: [
      { item: 'Tomate', daysLeft: 2, usage: 'Alto' },
      { item: 'Aceite Oliva', daysLeft: 4, usage: 'Medio' },
      { item: 'Harina', daysLeft: 1, usage: 'Crítico' }
    ]
  },
  
  // Datos para gráficos
  hourlyPerformance: [
    { hour: '10:00', sales: 2300, orders: 4, forecast: 2500 },
    { hour: '11:00', sales: 3400, orders: 7, forecast: 3200 },
    { hour: '12:00', sales: 8900, orders: 18, forecast: 8500 },
    { hour: '13:00', sales: 15600, orders: 31, forecast: 14800 },
    { hour: '14:00', sales: 12300, orders: 24, forecast: 13000 },
    { hour: '15:00', sales: 6700, orders: 13, forecast: 7000 },
    { hour: '16:00', sales: 4500, orders: 9, forecast: 4800 },
  ],
  
  productPerformance: [
    { name: 'Ribeye Steak', sold: 45, revenue: 67500, margin: 68, trend: 'up' },
    { name: 'Pizza Margherita', sold: 89, revenue: 53400, margin: 74, trend: 'up' },
    { name: 'Caesar Salad', sold: 34, revenue: 13600, margin: 82, trend: 'stable' },
    { name: 'Pasta Carbonara', sold: 56, revenue: 33600, margin: 71, trend: 'up' },
    { name: 'Fish & Chips', sold: 23, revenue: 13800, margin: 65, trend: 'down' },
    { name: 'Tiramisu', sold: 67, revenue: 16080, margin: 85, trend: 'up' }
  ],
  
  staffPerformance: [
    { name: 'Juan M.', role: 'Mesero', efficiency: 94, tips: 4500, tables: 45 },
    { name: 'María L.', role: 'Mesero', efficiency: 91, tips: 4200, tables: 42 },
    { name: 'Carlos R.', role: 'Chef', efficiency: 88, dishes: 234, rating: 4.8 },
    { name: 'Ana S.', role: 'Cajero', efficiency: 96, transactions: 156, errors: 1 }
  ],
  
  // Análisis de velocidad de venta
  velocityAnalysis: [
    { product: 'Pizza Margherita', velocity: 8.2, category: 'Alto', stock: 45 },
    { product: 'Ribeye Steak', velocity: 4.1, category: 'Medio', stock: 12 },
    { product: 'Tiramisu', velocity: 6.7, category: 'Alto', stock: 23 },
    { product: 'Fish & Chips', velocity: 2.3, category: 'Bajo', stock: 18 },
    { product: 'Caesar Salad', velocity: 3.4, category: 'Medio', stock: 30 }
  ]
};

export const AnalyticsDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { formatCurrency: localizeFormatCurrency } = useLocalization();
  const [loading, setLoading] = useState(false);
  const [selectedView, setSelectedView] = useState<'executive' | 'operations' | 'financial' | 'predictive'>('executive');
  const [refreshInterval, setRefreshInterval] = useState(60); // segundos
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Simular actualización automática
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // Aquí actualizarías los datos
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const formatCurrency = (value: number) => {
    return localizeFormatCurrency(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Componente para KPI crítico
  const CriticalKPI = ({ title, current, target, trend, status, icon: Icon }: any) => {
    const getStatusColor = () => {
      switch(status) {
        case 'excellent': return 'text-green-600 bg-green-50';
        case 'good': return 'text-blue-600 bg-blue-50';
        case 'warning': return 'text-yellow-600 bg-yellow-50';
        case 'critical': return 'text-red-600 bg-red-50';
        default: return 'text-gray-600 bg-gray-50';
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8">
          <div className={`w-full h-full rounded-full opacity-10 ${getStatusColor()}`}></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${getStatusColor()}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-semibold ${
              trend > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              {Math.abs(trend)}%
            </div>
          </div>
          
          <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{formatPercent(current)}</span>
            <span className="text-sm text-gray-500">/ {formatPercent(target)} {t('pages.analytics.kpis.goal')}</span>
          </div>
          
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  status === 'excellent' ? 'bg-green-500' :
                  status === 'good' ? 'bg-blue-500' :
                  status === 'warning' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${Math.min((current / target) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Componente para alertas inteligentes
  const SmartAlert = ({ alert }: any) => {
    const getAlertStyle = () => {
      switch(alert.type) {
        case 'critical': return 'border-red-500 bg-red-50';
        case 'warning': return 'border-yellow-500 bg-yellow-50';
        case 'success': return 'border-green-500 bg-green-50';
        case 'info': return 'border-blue-500 bg-blue-50';
        default: return 'border-gray-500 bg-gray-50';
      }
    };

    const getIconColor = () => {
      switch(alert.type) {
        case 'critical': return 'text-red-600';
        case 'warning': return 'text-yellow-600';
        case 'success': return 'text-green-600';
        case 'info': return 'text-blue-600';
        default: return 'text-gray-600';
      }
    };

    return (
      <div className={`border-l-4 p-4 rounded-lg ${getAlertStyle()}`}>
        <div className="flex items-start gap-3">
          <alert.icon className={`h-5 w-5 mt-0.5 ${getIconColor()}`} />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm">{t(`pages.analytics.${alert.titleKey}`)}</h4>
            <p className="text-gray-700 text-sm mt-1">{t(`pages.analytics.${alert.messageKey}`)}</p>
            <div className="flex items-center justify-between mt-3">
              <button className="text-xs font-medium text-blue-600 hover:text-blue-800">
                {t(`pages.analytics.${alert.actionKey}`)} →
              </button>
              <span className="text-xs text-gray-500">
                {t('pages.analytics.alerts.confidence')}: {alert.confidence}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Vista Ejecutiva
  const renderExecutiveView = () => (
    <div className="space-y-6">
      {/* KPIs Críticos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CriticalKPI
          title={t('pages.analytics.kpis.foodCost')}
          current={mockData.criticalKPIs.foodCost.current}
          target={mockData.criticalKPIs.foodCost.target}
          trend={mockData.criticalKPIs.foodCost.trend}
          status={mockData.criticalKPIs.foodCost.status}
          icon={ChefHat}
        />
        <CriticalKPI
          title={t('pages.analytics.kpis.laborCost')}
          current={mockData.criticalKPIs.laborCost.current}
          target={mockData.criticalKPIs.laborCost.target}
          trend={mockData.criticalKPIs.laborCost.trend}
          status={mockData.criticalKPIs.laborCost.status}
          icon={Users}
        />
        <CriticalKPI
          title={t('pages.analytics.kpis.primeCost')}
          current={mockData.criticalKPIs.primeCoast.current}
          target={mockData.criticalKPIs.primeCoast.target}
          trend={mockData.criticalKPIs.primeCoast.trend}
          status={mockData.criticalKPIs.primeCoast.status}
          icon={Percent}
        />
        <CriticalKPI
          title={t('pages.analytics.kpis.grossProfit')}
          current={mockData.criticalKPIs.grossProfit.current}
          target={mockData.criticalKPIs.grossProfit.target}
          trend={mockData.criticalKPIs.grossProfit.trend}
          status={mockData.criticalKPIs.grossProfit.status}
          icon={Target}
        />
      </div>

      {/* Alertas Inteligentes */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            {t('pages.analytics.alerts.title')}
          </h3>
          <span className="text-xs text-gray-500">
            {t('pages.analytics.alerts.updatedAgo')} 2 {t('pages.analytics.minutes')}
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {mockData.aiAlerts.map((alert, index) => (
            <SmartAlert key={index} alert={alert} />
          ))}
        </div>
      </div>

      {/* Rendimiento por Hora */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('pages.analytics.charts.salesVsForecast')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={mockData.hourlyPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend />
              <Bar yAxisId="left" dataKey="sales" fill="#3B82F6" name={t('pages.analytics.charts.actualSales')} />
              <Line yAxisId="left" type="monotone" dataKey="forecast" stroke="#10B981" name={t('pages.analytics.charts.forecast')} strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#F59E0B" name={t('pages.analytics.charts.orders')} strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('pages.analytics.charts.topProductsVelocity')}
          </h3>
          <div className="space-y-3">
            {mockData.velocityAnalysis.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{item.product}</p>
                  <p className="text-xs text-gray-500">Stock: {item.stock} unidades</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold">{item.velocity}/hora</p>
                    <p className={`text-xs ${
                      item.category === 'Alto' ? 'text-green-600' :
                      item.category === 'Medio' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>{item.category}</p>
                  </div>
                  <Zap className={`h-4 w-4 ${
                    item.category === 'Alto' ? 'text-green-500' :
                    item.category === 'Medio' ? 'text-yellow-500' :
                    'text-red-500'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Vista Operaciones
  const renderOperationsView = () => (
    <div className="space-y-6">
      {/* Métricas en Tiempo Real */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-6 w-6" />
          {t('pages.analytics.realtime.title')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-blue-100 text-sm">{t('pages.analytics.realtime.sales')} ({t('pages.analytics.realtime.currentHour')})</p>
            <p className="text-2xl font-bold">{formatCurrency(mockData.realTimeMetrics.currentHour.sales)}</p>
            <p className="text-xs text-blue-200 mt-1">
              {mockData.realTimeMetrics.comparison.salesVsYesterday > 0 ? '+' : ''}
              {mockData.realTimeMetrics.comparison.salesVsYesterday}% {t('pages.analytics.realtime.vsYesterday')}
            </p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Pedidos</p>
            <p className="text-2xl font-bold">{mockData.realTimeMetrics.currentHour.orders}</p>
            <p className="text-xs text-blue-200 mt-1">
              {mockData.realTimeMetrics.comparison.ordersVsLastWeek > 0 ? '+' : ''}
              {mockData.realTimeMetrics.comparison.ordersVsLastWeek}% vs semana
            </p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Ticket Promedio</p>
            <p className="text-2xl font-bold">${mockData.realTimeMetrics.currentHour.avgTicket}</p>
            <p className="text-xs text-blue-200 mt-1">
              {mockData.realTimeMetrics.comparison.avgTicketVsMonth > 0 ? '+' : ''}
              {mockData.realTimeMetrics.comparison.avgTicketVsMonth}% vs mes
            </p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Mesas Ocupadas</p>
            <p className="text-2xl font-bold">{mockData.realTimeMetrics.currentHour.tablesOccupied}/23</p>
            <p className="text-xs text-blue-200 mt-1">65% ocupación</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Tiempo Cocina</p>
            <p className="text-2xl font-bold">{mockData.realTimeMetrics.currentHour.kitchenTime} min</p>
            <p className="text-xs text-blue-200 mt-1">Objetivo: 15 min</p>
          </div>
        </div>
      </div>

      {/* Performance del Staff */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('pages.analytics.staff.performanceToday')}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.analytics.staff.employee')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.analytics.staff.role')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.analytics.staff.efficiency')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pages.analytics.staff.metrics')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockData.staffPerformance.map((staff, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {staff.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 mr-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              staff.efficiency >= 90 ? 'bg-green-500' :
                              staff.efficiency >= 80 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${staff.efficiency}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{staff.efficiency}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {staff.role === 'Mesero' && `${staff.tables} mesas • $${staff.tips} propinas`}
                    {staff.role === 'Chef' && `${staff.dishes} platos • ${staff.rating}⭐`}
                    {staff.role === 'Cajero' && `${staff.transactions} trans. • ${staff.errors} errores`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Análisis de Productos */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Análisis de Rentabilidad por Producto
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={mockData.productPerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill="#3B82F6" name="Ingresos ($)" />
            <Bar yAxisId="left" dataKey="sold" fill="#10B981" name="Unidades Vendidas" />
            <Line yAxisId="right" type="monotone" dataKey="margin" stroke="#F59E0B" name="Margen (%)" strokeWidth={3} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // Vista Financiera
  const renderFinancialView = () => (
    <div className="space-y-6">
      {/* Proyecciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Proyección del Día</h3>
            <span className="text-sm text-gray-500">Confianza: {mockData.predictions.todayProjected.confidence}%</span>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Ventas Proyectadas</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(mockData.predictions.todayProjected.sales)}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <span className="text-xs text-gray-500">65% completado</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pedidos Proyectados</p>
              <p className="text-2xl font-bold text-gray-900">{mockData.predictions.todayProjected.orders}</p>
              <p className="text-xs text-gray-500 mt-1">Basado en tendencia actual</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Alertas de Inventario</h3>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="space-y-3">
            {mockData.predictions.inventoryAlerts.map((item, index) => (
              <div key={index} className={`p-3 rounded-lg border ${
                item.usage === 'Crítico' ? 'border-red-300 bg-red-50' :
                item.usage === 'Alto' ? 'border-yellow-300 bg-yellow-50' :
                'border-gray-300 bg-gray-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{item.item}</p>
                    <p className="text-xs text-gray-600">Días restantes: {item.daysLeft}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    item.usage === 'Crítico' ? 'bg-red-200 text-red-800' :
                    item.usage === 'Alto' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {item.usage}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Análisis de Costos Detallado */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Breakdown de Costos Operativos
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: t('pages.analytics.foodCostPercentage'), value: 28.5, fill: '#3B82F6' },
                  { name: t('pages.analytics.laborCostPercentage'), value: 31.2, fill: '#10B981' },
                  { name: 'Alquiler', value: 12, fill: '#F59E0B' },
                  { name: 'Utilities', value: 8, fill: '#8B5CF6' },
                  { name: 'Marketing', value: 5, fill: '#EC4899' },
                  { name: 'Otros', value: 15.3, fill: '#6B7280' }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm text-gray-900 mb-2">Prime Cost Analysis</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('pages.analytics.foodCostPercentage')}</span>
                  <span className="text-sm font-medium">28.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('pages.analytics.laborCostPercentage')}</span>
                  <span className="text-sm font-medium">31.2%</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-sm font-semibold text-gray-900">{t('pages.analytics.totalPrimeCost')}</span>
                  <span className="text-sm font-bold text-gray-900">59.7%</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm text-gray-900 mb-2">Profit Margins</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gross Profit</span>
                  <span className="text-sm font-medium text-green-600">72.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Operating Profit</span>
                  <span className="text-sm font-medium text-green-600">18.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Net Profit</span>
                  <span className="text-sm font-medium text-green-600">12.3%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Vista Predictiva
  const renderPredictiveView = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Análisis Predictivo con IA
          </h3>
          <span className="text-sm text-purple-200">
            Modelo actualizado: hace 3 horas
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-purple-100 text-sm mb-1">Precisión del Modelo</p>
            <p className="text-2xl font-bold">87.3%</p>
            <p className="text-xs text-purple-200 mt-1">Últimos 30 días</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-purple-100 text-sm mb-1">Predicciones Realizadas</p>
            <p className="text-2xl font-bold">1,247</p>
            <p className="text-xs text-purple-200 mt-1">Esta semana</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-purple-100 text-sm mb-1">Ahorro Estimado</p>
            <p className="text-2xl font-bold">$45,200</p>
            <p className="text-xs text-purple-200 mt-1">Por optimización</p>
          </div>
        </div>
      </div>

      {/* Predicciones Semanales */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Predicción Semanal de Demanda
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={[
            { day: 'Lun', predicted: 65000, min: 58000, max: 72000 },
            { day: 'Mar', predicted: 68000, min: 61000, max: 75000 },
            { day: 'Mié', predicted: 72000, min: 65000, max: 79000 },
            { day: 'Jue', predicted: 70000, min: 63000, max: 77000 },
            { day: 'Vie', predicted: 85000, min: 77000, max: 93000 },
            { day: 'Sáb', predicted: 92000, min: 83000, max: 101000 },
            { day: 'Dom', predicted: 88000, min: 79000, max: 97000 }
          ]}>
            <defs>
              <linearGradient id="colorRange" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip formatter={(value: any) => formatCurrency(value)} />
            <Area type="monotone" dataKey="max" stroke="none" fill="url(#colorRange)" />
            <Area type="monotone" dataKey="min" stroke="none" fill="white" />
            <Line type="monotone" dataKey="predicted" stroke="#3B82F6" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recomendaciones Automáticas */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Recomendaciones Automáticas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Oportunidad de Upselling</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Sugerir vino con Ribeye Steak aumentaría ticket promedio en $850 (78% probabilidad de aceptación).
                </p>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800 mt-2">
                  Implementar sugerencia →
                </button>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Optimización de Menú</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Retirar "Fish & Chips" del menú. Baja rotación y margen inferior al promedio.
                </p>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800 mt-2">
                  Ver análisis completo →
                </button>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Optimización de Personal</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Reducir 1 mesero martes y miércoles (13:00-16:00). Ahorro mensual: $18,500.
                </p>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800 mt-2">
                  Ajustar horarios →
                </button>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Gestión de Inventario</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Aumentar pedido de Pizza base en 30% para próximo fin de semana (evento local detectado).
                </p>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-800 mt-2">
                  Crear orden de compra →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <PageHeader
        title={t('pages.analytics.title')}
        subtitle={t('pages.analytics.subtitle')}
      />

      <div className="flex-1 overflow-y-auto">
        {/* Barra de Control Superior */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {/* Tabs de Vista */}
              <button
                onClick={() => setSelectedView('executive')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  selectedView === 'executive'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('pages.analytics.views.executive')}
              </button>
              <button
                onClick={() => setSelectedView('operations')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  selectedView === 'operations'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('pages.analytics.views.operations')}
              </button>
              <button
                onClick={() => setSelectedView('financial')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  selectedView === 'financial'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('pages.analytics.views.financial')}
              </button>
              <button
                onClick={() => setSelectedView('predictive')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  selectedView === 'predictive'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Brain className="h-4 w-4" />
                  {t('pages.analytics.views.predictive')}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              {/* Auto-refresh */}
              <div className="flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="text-sm border-gray-300 rounded-lg"
                >
                  <option value={30}>{t('pages.analytics.autoRefresh.30s')}</option>
                  <option value={60}>{t('pages.analytics.autoRefresh.1m')}</option>
                  <option value={300}>{t('pages.analytics.autoRefresh.5m')}</option>
                  <option value={0}>{t('pages.analytics.autoRefresh.manual')}</option>
                </select>
              </div>

              {/* Última actualización */}
              <span className="text-xs text-gray-500">
                {t('pages.analytics.lastUpdate')}: {lastUpdate.toLocaleTimeString()}
              </span>

              {/* Exportar */}
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium">
                <Download className="h-4 w-4" />
                {t('pages.analytics.buttons.export')}
              </button>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="min-h-[600px]">
          {selectedView === 'executive' && renderExecutiveView()}
          {selectedView === 'operations' && renderOperationsView()}
          {selectedView === 'financial' && renderFinancialView()}
          {selectedView === 'predictive' && renderPredictiveView()}
        </div>
      </div>
    </div>
  );
};