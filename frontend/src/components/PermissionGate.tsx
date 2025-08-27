import React from 'react';
import { usePermissions } from '../contexts/PermissionsContext';
import { Shield, Lock, AlertTriangle } from 'lucide-react';

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: string;
  resource?: string;
  fallback?: React.ReactNode;
  adminOnly?: boolean;
  showFallback?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  resource,
  fallback,
  adminOnly = false,
  showFallback = true
}) => {
  const { hasPermission, isAdmin, canAccess, loading, permissions } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Verificando permisos...</span>
      </div>
    );
  }

  // Check admin-only access
  if (adminOnly && !isAdmin()) {
    if (!showFallback) return null;
    
    return fallback || (
      <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <Shield className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Restringido</h3>
        <p className="text-gray-600 text-center mb-4">
          Esta función requiere permisos de administrador
        </p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-sm text-red-800">
              Rol actual: {permissions.role_name || 'Sin asignar'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Check resource-based access
  if (resource && !canAccess(resource)) {
    if (!showFallback) return null;
    
    return fallback || (
      <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <Lock className="h-16 w-16 text-yellow-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin Permisos</h3>
        <p className="text-gray-600 text-center mb-4">
          No tienes permisos para acceder a este recurso
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800">
              Recurso: {resource} | Rol: {permissions.role_name || 'Sin asignar'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Check specific permission
  if (permission && !hasPermission(permission as any)) {
    if (!showFallback) return null;
    
    return fallback || (
      <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <Lock className="h-16 w-16 text-orange-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Permiso Requerido</h3>
        <p className="text-gray-600 text-center mb-4">
          Tu rol actual no incluye el permiso: <code className="bg-gray-200 px-2 py-1 rounded text-sm">{permission}</code>
        </p>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            <span className="text-sm text-orange-800">
              Rol actual: {permissions.role_name || 'Sin asignar'} ({permissions.department_name || 'Sin departamento'})
            </span>
          </div>
        </div>
      </div>
    );
  }

  // If all checks pass, render children
  return <>{children}</>;
};

// Convenience components for common use cases
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <PermissionGate adminOnly={true} fallback={fallback}>
    {children}
  </PermissionGate>
);

export const RequirePermission: React.FC<{ 
  children: React.ReactNode; 
  permission: string; 
  fallback?: React.ReactNode 
}> = ({ children, permission, fallback }) => (
  <PermissionGate permission={permission} fallback={fallback}>
    {children}
  </PermissionGate>
);

export const RequireResource: React.FC<{ 
  children: React.ReactNode; 
  resource: string; 
  fallback?: React.ReactNode 
}> = ({ children, resource, fallback }) => (
  <PermissionGate resource={resource} fallback={fallback}>
    {children}
  </PermissionGate>
);

// Hook for conditional rendering
export const usePermissionCheck = () => {
  const { hasPermission, isAdmin, canAccess } = usePermissions();
  
  return {
    hasPermission,
    isAdmin,
    canAccess,
    // Convenience methods
    canManageEmployees: () => hasPermission('can_manage_employees'),
    canAccessKitchen: () => hasPermission('can_access_kitchen'),
    canViewReports: () => hasPermission('can_view_reports'),
    canProcessPayments: () => hasPermission('can_process_payments'),
    canTakeOrders: () => hasPermission('can_take_orders'),
    canManageInventory: () => hasPermission('can_manage_inventory'),
  };
};