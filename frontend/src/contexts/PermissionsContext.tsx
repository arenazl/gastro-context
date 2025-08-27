import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config/api';

interface UserPermissions {
  can_take_orders: boolean;
  can_process_payments: boolean;
  can_access_kitchen: boolean;
  can_manage_inventory: boolean;
  can_view_reports: boolean;
  can_manage_employees: boolean;
  can_manage_suppliers: boolean;
  is_admin: boolean;
  department_name?: string;
  role_name?: string;
}

interface PermissionsContextType {
  permissions: UserPermissions;
  loading: boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  isAdmin: () => boolean;
  canAccess: (resource: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const defaultPermissions: UserPermissions = {
  can_take_orders: false,
  can_process_payments: false,
  can_access_kitchen: false,
  can_manage_inventory: false,
  can_view_reports: false,
  can_manage_employees: false,
  can_manage_suppliers: false,
  is_admin: false,
  department_name: undefined,
  role_name: undefined,
};

const PermissionsContext = createContext<PermissionsContextType | null>(null);

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
  const [loading, setLoading] = useState(true);

  const loadPermissions = async () => {
    if (!user?.id) {
      setPermissions(defaultPermissions);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/permissions`);
      
      if (response.ok) {
        const userPermissions = await response.json();
        setPermissions(userPermissions);
      } else {
        console.warn('Failed to load user permissions, using default');
        setPermissions(defaultPermissions);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions(defaultPermissions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, [user?.id]);

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (permissions.is_admin) return true; // Admin has all permissions
    return !!permissions[permission];
  };

  const isAdmin = (): boolean => {
    return permissions.is_admin;
  };

  const canAccess = (resource: string): boolean => {
    // Define resource access rules
    const resourcePermissions: Record<string, keyof UserPermissions | 'admin_only'> = {
      // Pages/Modules
      'employees': 'can_manage_employees',
      'inventory': 'can_manage_inventory',
      'suppliers': 'can_manage_suppliers',
      'kitchen': 'can_access_kitchen',
      'reports': 'can_view_reports',
      'pos': 'can_take_orders',
      'payments': 'can_process_payments',
      
      // Admin-only features
      'settings': 'admin_only',
      'users-management': 'admin_only',
      'system-logs': 'admin_only',
      'backup-restore': 'admin_only',
      
      // Employee management specific
      'create-employee': 'can_manage_employees',
      'edit-employee': 'can_manage_employees',
      'delete-employee': 'can_manage_employees',
      'view-salaries': 'can_manage_employees',
      
      // Kitchen access
      'kitchen-orders': 'can_access_kitchen',
      'update-order-status': 'can_access_kitchen',
      
      // Inventory management
      'manage-stock': 'can_manage_inventory',
      'create-purchase-order': 'can_manage_inventory',
      'receive-inventory': 'can_manage_inventory',
      
      // Reporting
      'sales-reports': 'can_view_reports',
      'inventory-reports': 'can_view_reports',
      'employee-reports': 'can_manage_employees',
    };

    const requiredPermission = resourcePermissions[resource];
    
    if (!requiredPermission) {
      return true; // Allow access to undefined resources by default
    }
    
    if (requiredPermission === 'admin_only') {
      return isAdmin();
    }
    
    return hasPermission(requiredPermission);
  };

  const refreshPermissions = async () => {
    await loadPermissions();
  };

  return (
    <PermissionsContext.Provider value={{
      permissions,
      loading,
      hasPermission,
      isAdmin,
      canAccess,
      refreshPermissions
    }}>
      {children}
    </PermissionsContext.Provider>
  );
};