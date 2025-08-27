import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Edit3, Trash2, Eye, Building2, 
  UserCheck, Clock, Phone, Mail, Calendar, Briefcase,
  ChevronDown, Search, Filter, MoreHorizontal, 
  AlertCircle, CheckCircle, XCircle, DollarSign,
  MapPin, CreditCard, Award, Shield
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { PermissionGate, RequireResource, usePermissionCheck } from '../components/PermissionGate';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config/api';

interface Employee {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  dni: string;
  cuil?: string;
  email?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  hire_date: string;
  current_salary: number;
  salary_type: 'monthly' | 'hourly' | 'commission';
  employment_status: 'active' | 'inactive' | 'suspended' | 'terminated';
  notes?: string;
  is_active: boolean;
  last_login?: string;
  department_name: string;
  role_name: string;
  supervisor_name?: string;
  days_employed: number;
}

interface Department {
  id: number;
  name: string;
  description?: string;
  manager_name?: string;
  employee_count: number;
  is_active: boolean;
}

interface Role {
  id: number;
  name: string;
  description?: string;
  department_id: number;
  department_name: string;
  base_salary: number;
  can_take_orders: boolean;
  can_process_payments: boolean;
  can_access_kitchen: boolean;
  can_manage_inventory: boolean;
  can_view_reports: boolean;
  can_manage_employees: boolean;
  is_admin: boolean;
  is_active: boolean;
}

export const EmployeesManagement: React.FC = () => {
  const { canManageEmployees, canViewReports, isAdmin } = usePermissionCheck();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'employees' | 'departments' | 'roles'>('employees');
  const [employeeFormData, setEmployeeFormData] = useState({
    first_name: '',
    last_name: '',
    dni: '',
    cuil: '',
    email: '',
    phone: '',
    address: '',
    birth_date: '',
    hire_date: '',
    department_id: '',
    role_id: '',
    supervisor_id: '',
    current_salary: 0,
    salary_type: 'monthly' as const,
    employment_status: 'active' as const,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [employeesRes, departmentsRes, rolesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/employees`),
        fetch(`${API_BASE_URL}/api/departments`),
        fetch(`${API_BASE_URL}/api/employee-roles`)
      ]);

      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        setEmployees(employeesData);
      }

      if (departmentsRes.ok) {
        const departmentsData = await departmentsRes.json();
        setDepartments(departmentsData);
      }

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeFormData),
      });

      if (response.ok) {
        toast.success('Empleado creado exitosamente');
        setShowEmployeeForm(false);
        loadData();
        resetEmployeeForm();
      } else {
        throw new Error('Error al crear empleado');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('Error al crear empleado');
    }
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeFormData),
      });

      if (response.ok) {
        toast.success('Empleado actualizado exitosamente');
        setShowEmployeeForm(false);
        loadData();
        resetEmployeeForm();
      } else {
        throw new Error('Error al actualizar empleado');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Error al actualizar empleado');
    }
  };

  const handleDeleteEmployee = async (employeeId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este empleado?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/employees/${employeeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Empleado eliminado exitosamente');
        loadData();
      } else {
        throw new Error('Error al eliminar empleado');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Error al eliminar empleado');
    }
  };

  const resetEmployeeForm = () => {
    setEmployeeFormData({
      first_name: '',
      last_name: '',
      dni: '',
      cuil: '',
      email: '',
      phone: '',
      address: '',
      birth_date: '',
      hire_date: '',
      department_id: '',
      role_id: '',
      supervisor_id: '',
      current_salary: 0,
      salary_type: 'monthly',
      employment_status: 'active',
      notes: ''
    });
    setSelectedEmployee(null);
  };

  const openEmployeeForm = (employee?: Employee) => {
    if (employee) {
      setSelectedEmployee(employee);
      setEmployeeFormData({
        first_name: employee.first_name,
        last_name: employee.last_name,
        dni: employee.dni,
        cuil: employee.cuil || '',
        email: employee.email || '',
        phone: employee.phone || '',
        address: employee.address || '',
        birth_date: employee.birth_date || '',
        hire_date: employee.hire_date,
        department_id: departments.find(d => d.name === employee.department_name)?.id.toString() || '',
        role_id: roles.find(r => r.name === employee.role_name)?.id.toString() || '',
        supervisor_id: '',
        current_salary: employee.current_salary,
        salary_type: employee.salary_type,
        employment_status: employee.employment_status,
        notes: employee.notes || ''
      });
    } else {
      resetEmployeeForm();
    }
    setShowEmployeeForm(true);
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.dni.includes(searchTerm) ||
      employee.employee_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || 
      employee.department_name === departments.find(d => d.id.toString() === selectedDepartment)?.name;
    
    return matchesSearch && matchesDepartment;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case 'suspended':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'terminated':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      terminated: 'bg-red-100 text-red-800'
    };
    return configs[status as keyof typeof configs] || configs.inactive;
  };

  const formatSalary = (amount: number, type: string) => {
    const formatted = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
    
    return `${formatted}${type === 'hourly' ? '/hr' : '/mes'}`;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando empleados...</p>
        </div>
      </div>
    );
  }

  return (
    <RequireResource resource="employees">
      <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
        <PageHeader
          title="Gestión de Empleados"
          subtitle="Administra tu equipo de trabajo, departamentos y roles"
        />

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'employees', name: 'Empleados', icon: Users, count: employees.length },
              { id: 'departments', name: 'Departamentos', icon: Building2, count: departments.length },
              { id: 'roles', name: 'Roles', icon: Award, count: roles.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center gap-2 transition-all`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
                <span className={`${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                } ml-2 py-0.5 px-2 text-xs rounded-full`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'employees' && (
          <div className="h-full flex flex-col">
            {/* Filters and Actions */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                {/* Search */}
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar empleados..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Department Filter */}
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">Todos los departamentos</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </option>
                  ))}
                </select>

                {/* Add Employee Button */}
                <PermissionGate permission="can_manage_employees" showFallback={false}>
                  <button
                    onClick={() => openEmployeeForm()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    Nuevo Empleado
                  </button>
                </PermissionGate>
              </div>
            </div>

            {/* Employees List */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-7xl mx-auto p-4">
                {filteredEmployees.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm || selectedDepartment !== 'all' 
                        ? 'No se encontraron empleados' 
                        : 'No hay empleados registrados'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {searchTerm || selectedDepartment !== 'all'
                        ? 'Intenta ajustar los filtros de búsqueda'
                        : 'Comienza agregando tu primer empleado'}
                    </p>
                    <PermissionGate permission="can_manage_employees" showFallback={false}>
                      <button
                        onClick={() => openEmployeeForm()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto transition-colors"
                      >
                        <UserPlus className="h-5 w-5" />
                        Agregar Empleado
                      </button>
                    </PermissionGate>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredEmployees.map((employee) => (
                      <motion.div
                        key={employee.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="p-6">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">
                                  {employee.first_name} {employee.last_name}
                                </h3>
                                {getStatusIcon(employee.employment_status)}
                              </div>
                              <p className="text-sm text-gray-500">
                                {employee.employee_number} • {employee.dni}
                              </p>
                            </div>
                            <div className="relative">
                              <button className="p-2 hover:bg-gray-100 rounded-lg">
                                <MoreHorizontal className="h-4 w-4 text-gray-400" />
                              </button>
                            </div>
                          </div>

                          {/* Department & Role */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{employee.department_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{employee.role_name}</span>
                            </div>
                          </div>

                          {/* Contact Info */}
                          {(employee.email || employee.phone) && (
                            <div className="space-y-2 mb-4">
                              {employee.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">{employee.email}</span>
                                </div>
                              )}
                              {employee.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">{employee.phone}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Employment Info */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {employee.days_employed} días trabajados
                              </span>
                            </div>
                            <PermissionGate resource="view-salaries" showFallback={false}>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {formatSalary(employee.current_salary, employee.salary_type)}
                                </span>
                              </div>
                            </PermissionGate>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(employee.employment_status)}`}>
                              {employee.employment_status === 'active' ? 'Activo' :
                               employee.employment_status === 'inactive' ? 'Inactivo' :
                               employee.employment_status === 'suspended' ? 'Suspendido' : 'Terminado'}
                            </span>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setSelectedEmployee(employee)}
                                className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <PermissionGate permission="can_manage_employees" showFallback={false}>
                                <button
                                  onClick={() => openEmployeeForm(employee)}
                                  className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600"
                                  title="Editar"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEmployee(employee.id)}
                                  className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-red-600"
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </PermissionGate>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Departments Tab */}
        {activeTab === 'departments' && (
          <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Departamentos</h2>
              <button
                onClick={() => setShowDepartmentForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
              >
                <Building2 className="h-4 w-4" />
                Nuevo Departamento
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((department) => (
                <div key={department.id} className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{department.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{department.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {department.employee_count} empleados
                    </span>
                    <div className="flex items-center gap-1">
                      <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600">
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Roles y Permisos</h2>
              <button
                onClick={() => setShowRoleForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
              >
                <Award className="h-4 w-4" />
                Nuevo Rol
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {roles.map((role) => (
                <div key={role.id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{role.name}</h3>
                      <p className="text-sm text-gray-600">{role.department_name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {role.is_admin && (
                        <Shield className="h-4 w-4 text-red-500" title="Administrador" />
                      )}
                      <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600">
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    Salario base: {formatSalary(role.base_salary, 'monthly')}
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {role.can_take_orders && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Tomar pedidos</span>}
                    {role.can_process_payments && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Procesar pagos</span>}
                    {role.can_access_kitchen && <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">Acceso cocina</span>}
                    {role.can_manage_inventory && <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">Inventario</span>}
                    {role.can_view_reports && <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">Ver reportes</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Employee Form Modal */}
      <AnimatePresence>
        {showEmployeeForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowEmployeeForm(false);
                resetEmployeeForm();
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowEmployeeForm(false);
                      resetEmployeeForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    selectedEmployee ? handleUpdateEmployee() : handleCreateEmployee();
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        value={employeeFormData.first_name}
                        onChange={(e) => setEmployeeFormData({...employeeFormData, first_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        required
                        value={employeeFormData.last_name}
                        onChange={(e) => setEmployeeFormData({...employeeFormData, last_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        DNI *
                      </label>
                      <input
                        type="text"
                        required
                        value={employeeFormData.dni}
                        onChange={(e) => setEmployeeFormData({...employeeFormData, dni: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CUIL
                      </label>
                      <input
                        type="text"
                        value={employeeFormData.cuil}
                        onChange={(e) => setEmployeeFormData({...employeeFormData, cuil: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={employeeFormData.email}
                        onChange={(e) => setEmployeeFormData({...employeeFormData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        value={employeeFormData.phone}
                        onChange={(e) => setEmployeeFormData({...employeeFormData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        value={employeeFormData.birth_date}
                        onChange={(e) => setEmployeeFormData({...employeeFormData, birth_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Ingreso *
                      </label>
                      <input
                        type="date"
                        required
                        value={employeeFormData.hire_date}
                        onChange={(e) => setEmployeeFormData({...employeeFormData, hire_date: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Departamento *
                      </label>
                      <select
                        required
                        value={employeeFormData.department_id}
                        onChange={(e) => setEmployeeFormData({...employeeFormData, department_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar departamento</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rol *
                      </label>
                      <select
                        required
                        value={employeeFormData.role_id}
                        onChange={(e) => setEmployeeFormData({...employeeFormData, role_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar rol</option>
                        {roles
                          .filter(role => !employeeFormData.department_id || role.department_id.toString() === employeeFormData.department_id)
                          .map(role => (
                            <option key={role.id} value={role.id.toString()}>
                              {role.name}
                            </option>
                          ))
                        }
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Salario
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={employeeFormData.current_salary}
                        onChange={(e) => setEmployeeFormData({...employeeFormData, current_salary: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Salario
                      </label>
                      <select
                        value={employeeFormData.salary_type}
                        onChange={(e) => setEmployeeFormData({...employeeFormData, salary_type: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="monthly">Mensual</option>
                        <option value="hourly">Por hora</option>
                        <option value="commission">Comisión</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={employeeFormData.address}
                      onChange={(e) => setEmployeeFormData({...employeeFormData, address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas
                    </label>
                    <textarea
                      rows={3}
                      value={employeeFormData.notes}
                      onChange={(e) => setEmployeeFormData({...employeeFormData, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmployeeForm(false);
                        resetEmployeeForm();
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      {selectedEmployee ? 'Actualizar' : 'Crear'} Empleado
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </RequireResource>
  );
};