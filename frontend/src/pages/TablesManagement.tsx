import React, { useState, useEffect } from "react";
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { useTranslation } from "react-i18next";

import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Users,
  Square,
  Circle,
  Hexagon,
  Triangle,
  Eye,
  EyeOff,
  Wifi,
  Battery,
  Accessibility,
  Baby,
  Sofa,
  Sun,
  MapPin,
  List,
} from "lucide-react";
import { toast } from "react-toastify";
import { PageHeader } from "../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL || "${API_BASE_URL}";

interface Area {
  id: number;
  name: string;
  description?: string;
  capacity: number;
  outdoor: boolean;
  smoking_allowed: boolean;
  color: string;
  icon: string;
}

interface Table {
  id?: number;
  company_id: number;
  area_id?: number;
  table_number: string;
  capacity: number;
  min_capacity: number;
  max_capacity: number;
  shape:
    | "square"
    | "rectangle"
    | "round"
    | "oval"
    | "l-shaped"
    | "u-shaped"
    | "custom";
  width?: number;
  length?: number;
  height?: number;
  position_x?: number;
  position_y?: number;
  rotation?: number;
  has_power_outlet?: boolean;
  has_usb_charging?: boolean;
  wheelchair_accessible?: boolean;
  high_chair_compatible?: boolean;
  booth_seating?: boolean;
  window_view?: boolean;
  preferred_for?: string;
  notes?: string;
  is_joinable?: boolean;
  join_group?: string;
  status?:
    | "available"
    | "occupied"
    | "reserved"
    | "cleaning"
    | "maintenance"
    | "blocked";
  is_active?: boolean;
  area_name?: string;
}

const shapeIcons = {
  square: Square,
  rectangle: Square,
  round: Circle,
  oval: Circle,
  "l-shaped": Hexagon,
  "u-shaped": Hexagon,
  custom: Triangle,
};

const statusColors = {
  available: "#10B981",
  occupied: "#EF4444",
  reserved: "#F59E0B",
  cleaning: "#6B7280",
  maintenance: "#8B5CF6",
  blocked: "#DC2626",
};

const statusTranslations = {
  available: "Disponible",
  occupied: "Ocupada",
  reserved: "Reservada",
  cleaning: "Limpieza",
  maintenance: "Mantenimiento",
  blocked: "Bloqueada",
};

export const TablesManagement: React.FC = () => {
  const { t } = useTranslation();
  const [tables, setTables] = useState<Table[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [formData, setFormData] = useState<Table>({
    company_id: 1, // TODO: Get from auth context
    table_number: "",
    capacity: 4,
    min_capacity: 1,
    max_capacity: 8,
    shape: "square",
    width: 1.0,
    length: 1.0,
    height: 0.75,
    has_power_outlet: false,
    has_usb_charging: false,
    wheelchair_accessible: true,
    high_chair_compatible: true,
    booth_seating: false,
    window_view: false,
    preferred_for: "",
    notes: "",
    is_joinable: true,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load areas
      const areasRes = await fetch(`${API_URL}/api/areas`);
      if (areasRes.ok) {
        const areasData = await areasRes.json();
        setAreas(areasData);
      }

      // Load tables
      const tablesRes = await fetch(
        `${API_URL}/api/tables-enhanced?company_id=1`,
      );
      if (tablesRes.ok) {
        const tablesData = await tablesRes.json();
        setTables(tablesData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const url = editingTable
        ? `${API_URL}/api/tables-enhanced/${editingTable.id}`
        : `${API_URL}/api/tables-enhanced`;

      const method = editingTable ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingTable ? t("common.updated") : t("common.created"));
        loadData();
        handleCloseModal();
      } else {
        toast.error(t("common.error"));
      }
    } catch (error) {
      console.error("Error saving table:", error);
      toast.error(t("common.error"));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("common.confirmDelete"))) return;

    try {
      const response = await fetch(`${API_URL}/api/tables-enhanced/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(t("common.deleted"));
        loadData();
      }
    } catch (error) {
      console.error("Error deleting table:", error);
      toast.error(t("common.error"));
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/tables-enhanced/${id}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );

      if (response.ok) {
        toast.success("Estado actualizado");
        loadData();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(t("common.error"));
    }
  };

  const handleOpenModal = (table?: Table) => {
    if (table) {
      setEditingTable(table);
      setFormData(table);
    } else {
      setEditingTable(null);
      setFormData({
        company_id: 1,
        table_number: "",
        capacity: 4,
        min_capacity: 1,
        max_capacity: 8,
        shape: "square",
        width: 1.0,
        length: 1.0,
        height: 0.75,
        has_power_outlet: false,
        has_usb_charging: false,
        wheelchair_accessible: true,
        high_chair_compatible: true,
        booth_seating: false,
        window_view: false,
        preferred_for: "",
        notes: "",
        is_joinable: true,
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTable(null);
  };

  const filteredTables = tables.filter((table) => {
    const matchesSearch = table.table_number
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesArea = !selectedArea || table.area_id === selectedArea;
    return matchesSearch && matchesArea;
  });

  const ShapeIcon = ({ shape }: { shape: string }) => {
    const Icon = shapeIcons[shape as keyof typeof shapeIcons] || Square;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <PageHeader
        title="Gestión de Mesas"
        subtitle={`${filteredTables.length} mesas • ${areas.length} áreas`}
      />

      <div className="flex-1 overflow-y-auto">
        {/* Toolbar */}
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar mesa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Area Filter */}
              <select
                value={selectedArea || ""}
                onChange={(e) =>
                  setSelectedArea(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las áreas</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>

              {/* View Mode */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 rounded-lg ${viewMode === "grid" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                >
                  <Square className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2 rounded-lg ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>

              {/* Add Button */}
              <button
                onClick={() => handleOpenModal()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Nueva Mesa
              </button>
            </div>
          </div>
        </div>

        {/* Tables Grid/List */}
        <div className="max-w-7xl mx-auto px-6 pb-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando mesas...</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTables.map((table) => (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor:
                            statusColors[table.status || "available"] + "20",
                        }}
                      >
                        <ShapeIcon shape={table.shape} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">
                          Mesa {table.table_number}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {table.area_name || "Sin área"}
                        </p>
                      </div>
                    </div>
                    <div
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor:
                          statusColors[table.status || "available"] + "20",
                        color: statusColors[table.status || "available"],
                      }}
                    >
                      {statusTranslations[table.status || "available"]}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{table.capacity} personas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>
                        {table.width}x{table.length}m
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex gap-2 mb-3">
                    {table.has_power_outlet && (
                      <div className="p-1 bg-green-100 rounded" title="Enchufe">
                        <Wifi className="h-4 w-4 text-green-600" />
                      </div>
                    )}
                    {table.has_usb_charging && (
                      <div className="p-1 bg-blue-100 rounded" title="USB">
                        <Battery className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    {table.wheelchair_accessible && (
                      <div
                        className="p-1 bg-purple-100 rounded"
                        title="Accesible"
                      >
                        <Accessibility className="h-4 w-4 text-purple-600" />
                      </div>
                    )}
                    {table.high_chair_compatible && (
                      <div
                        className="p-1 bg-pink-100 rounded"
                        title="Silla bebé"
                      >
                        <Baby className="h-4 w-4 text-pink-600" />
                      </div>
                    )}
                    {table.booth_seating && (
                      <div className="p-1 bg-orange-100 rounded" title="Booth">
                        <Sofa className="h-4 w-4 text-orange-600" />
                      </div>
                    )}
                    {table.window_view && (
                      <div className="p-1 bg-yellow-100 rounded" title="Vista">
                        <Sun className="h-4 w-4 text-yellow-600" />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-3 border-t">
                    <select
                      value={table.status}
                      onChange={(e) =>
                        handleUpdateStatus(table.id!, e.target.value)
                      }
                      className="text-sm px-2 py-1 border rounded"
                    >
                      {Object.entries(statusTranslations).map(
                        ([key, value]) => (
                          <option key={key} value={key}>
                            {value}
                          </option>
                        ),
                      )}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(table)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(table.id!)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mesa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Área
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Capacidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Forma
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Características
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTables.map((table) => (
                    <tr key={table.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">
                          Mesa {table.table_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {table.area_name || "Sin área"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {table.min_capacity}-{table.max_capacity} (
                        {table.capacity} normal)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <ShapeIcon shape={table.shape} />
                          <span className="capitalize">{table.shape}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor:
                              statusColors[table.status || "available"] + "20",
                            color: statusColors[table.status || "available"],
                          }}
                        >
                          {statusTranslations[table.status || "available"]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1">
                          {table.has_power_outlet && (
                            <Wifi className="h-4 w-4 text-gray-400" />
                          )}
                          {table.has_usb_charging && (
                            <Battery className="h-4 w-4 text-gray-400" />
                          )}
                          {table.wheelchair_accessible && (
                            <Accessibility className="h-4 w-4 text-gray-400" />
                          )}
                          {table.window_view && (
                            <Sun className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(table)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(table.id!)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-6">
                    {editingTable ? "Editar Mesa" : "Nueva Mesa"}
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Basic Info */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Número de Mesa
                      </label>
                      <input
                        type="text"
                        value={formData.table_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            table_number: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: 1, A1, T1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Área
                      </label>
                      <select
                        value={formData.area_id || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            area_id: Number(e.target.value) || undefined,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sin área</option>
                        {areas.map((area) => (
                          <option key={area.id} value={area.id}>
                            {area.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Capacity */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Capacidad Normal
                      </label>
                      <input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            capacity: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Capacidad Mínima
                      </label>
                      <input
                        type="number"
                        value={formData.min_capacity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            min_capacity: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Capacidad Máxima
                      </label>
                      <input
                        type="number"
                        value={formData.max_capacity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            max_capacity: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>

                    {/* Shape */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Forma
                      </label>
                      <select
                        value={formData.shape}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            shape: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="square">Cuadrada</option>
                        <option value="rectangle">Rectangular</option>
                        <option value="round">Redonda</option>
                        <option value="oval">Ovalada</option>
                        <option value="l-shaped">Forma L</option>
                        <option value="u-shaped">Forma U</option>
                        <option value="custom">Personalizada</option>
                      </select>
                    </div>

                    {/* Dimensions */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Ancho (metros)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.width}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            width: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Largo (metros)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.length}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            length: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Preferred For */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Preferida Para
                      </label>
                      <input
                        type="text"
                        value={formData.preferred_for || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            preferred_for: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: romántico, negocios, familia, eventos"
                      />
                    </div>

                    {/* Notes */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Notas
                      </label>
                      <textarea
                        value={formData.notes || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Observaciones adicionales..."
                      />
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mt-6">
                    <h3 className="font-medium mb-3">Características</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.has_power_outlet}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              has_power_outlet: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                        <span className="text-sm">Enchufe eléctrico</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.has_usb_charging}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              has_usb_charging: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                        <span className="text-sm">Carga USB</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.wheelchair_accessible}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              wheelchair_accessible: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                        <span className="text-sm">Accesible silla ruedas</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.high_chair_compatible}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              high_chair_compatible: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                        <span className="text-sm">Silla para bebé</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.booth_seating}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              booth_seating: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                        <span className="text-sm">Asiento tipo booth</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.window_view}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              window_view: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                        <span className="text-sm">Vista a ventana</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.is_joinable}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              is_joinable: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                        <span className="text-sm">Se puede unir</span>
                      </label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                    <button
                      onClick={handleCloseModal}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Save className="h-5 w-5" />
                      {editingTable ? "Actualizar" : "Crear"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
