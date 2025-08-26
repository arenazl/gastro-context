import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { PageHeader } from '../components/PageHeader';
import { GlassPanel } from '../components/AnimatedComponents';
import { toast } from 'react-toastify';
import {
  ClockIcon,
  FireIcon,
  CheckIcon,
  BellIcon,
  ExclamationTriangleIcon,
  UserIcon,
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  TruckIcon,
  HashtagIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';


interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  notes?: string;
}

interface Order {
  id: number;
  table_number: number;
  waiter?: string;
  status: string;
  created_at: string;
  total: number;
  items: OrderItem[];
}

interface KitchenQueueItem {
  id: number;
  order_id: number;
  order_item_id: number;
  product_name: string;
  quantity: number;
  station: string;
  status: string;
  special_instructions?: string;
  table_number: number;
  waiter_name?: string;
  created_at: string;
  started_at?: string;
  waiting_minutes?: number;
  cooking_minutes?: number;
}

interface Column {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  orders: Order[];  // Para todas las columnas, no solo new_orders
  kitchenItems: KitchenQueueItem[];
}

const columns: { [key: string]: Column } = {
  new_orders: {
    id: 'new_orders',
    title: 'Órdenes Nuevas',
    icon: BellIcon,
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    orders: [],
    kitchenItems: []
  },
  viewed: {
    id: 'viewed',
    title: 'Vistas',
    icon: PlayIcon,
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    orders: [],
    kitchenItems: []
  },
  preparing: {
    id: 'preparing',
    title: 'Preparando',
    icon: FireIcon,
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    orders: [],
    kitchenItems: []
  },
  ready: {
    id: 'ready',
    title: 'Listos',
    icon: CheckCircleIcon,
    color: '#10B981',
    bgColor: '#D1FAE5',
    orders: [],
    kitchenItems: []
  },
  delivered: {
    id: 'delivered',
    title: 'Entregados',
    icon: TruckIcon,
    color: '#6B7280',
    bgColor: '#F3F4F6',
    orders: [],
    kitchenItems: []
  }
};

export const KitchenDragDrop: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [data, setData] = useState(columns);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [localKitchenQueue, setLocalKitchenQueue] = useState<{[key: number]: string}>({});

  useEffect(() => {
    loadOrders();
    const interval = autoRefresh ? setInterval(loadOrders, 10000) : null;
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Cargar estado local guardado
  useEffect(() => {
    const saved = localStorage.getItem('kitchenDragDropState');
    if (saved) {
      try {
        setLocalKitchenQueue(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading saved state:', e);
      }
    }
  }, []);

  // Guardar estado local cuando cambia
  useEffect(() => {
    localStorage.setItem('kitchenDragDropState', JSON.stringify(localKitchenQueue));
  }, [localKitchenQueue]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      // Cargar órdenes nuevas (no en cocina aún)
      const ordersResponse = await fetch(`${API_URL}/api/orders`);
      const allOrders = await ordersResponse.json();
      
      // Filtrar órdenes con estado pending o preparing
      const newOrders = allOrders.filter((order: Order) => 
        order.status === 'pending' || order.status === 'preparing'
      );

      // Cargar items ya en la cola de cocina
      const kitchenResponse = await fetch(`${API_URL}/api/kitchen/queue`);
      let kitchenItems: KitchenQueueItem[] = [];
      
      if (kitchenResponse.ok) {
        kitchenItems = await kitchenResponse.json();
      }

      // Organizar los datos en las columnas
      const newData = { ...columns };
      
      // Resetear todas las columnas
      Object.keys(newData).forEach(key => {
        newData[key].orders = [];
        newData[key].kitchenItems = [];
      });

      // Aplicar estados locales guardados
      const processedOrders = new Set<number>();
      
      // Procesar órdenes con estado local guardado
      for (const order of newOrders) {
        const localStatus = localKitchenQueue[order.id];
        if (localStatus) {
          // Mantener la orden como tarjeta completa en la columna correspondiente
          order.status = localStatus;
          newData[localStatus].orders.push(order);
          processedOrders.add(order.id);
        }
      }

      // Agregar órdenes nuevas que NO tienen estado local
      newData.new_orders.orders = newOrders.filter((order: Order) => 
        !processedOrders.has(order.id) && !localKitchenQueue[order.id]
      );

      // Procesar items del servidor (si los hay)
      kitchenItems.forEach(item => {
        // Verificar si este item específico tiene un estado local guardado
        const localItemStatus = localKitchenQueue[`item_${item.id}`];
        
        // Si ya procesamos esta orden completa, saltarla
        if (!processedOrders.has(item.order_id)) {
          // Si hay estado local para este item específico, usarlo
          // Si no, usar el estado del servidor o 'viewed' por defecto
          const status = localItemStatus || item.status || 'viewed';
          if (newData[status]) {
            newData[status].kitchenItems.push({
              ...item,
              status: status
            });
          }
        }
      });

      setData(newData);
    } catch (error) {
      console.error('Error loading orders:', error);
      // Si falla la carga del servidor, mantener el estado local
    } finally {
      setLoading(false);
    }
  };

  const moveOrderToKitchen = async (order: Order, targetStatus: string) => {
    // Actualizar estado local inmediatamente
    setLocalKitchenQueue(prev => ({
      ...prev,
      [order.id]: targetStatus
    }));

    try {
      // Intentar sincronizar con el servidor
      for (const item of order.items) {
        await fetch(`${API_URL}/api/kitchen/queue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: order.id,
            order_item_id: item.id,
            product_name: item.product_name,
            quantity: item.quantity,
            status: targetStatus,
            table_number: order.table_number,
            waiter_name: order.waiter || 'Sin asignar',
            special_instructions: item.notes
          })
        });
      }
      toast.success(`Orden #${order.id} movida a ${columns[targetStatus].title}`);
    } catch (error) {
      // Si falla el servidor, el estado local ya está actualizado
      toast.warning(`Orden #${order.id} movida localmente a ${columns[targetStatus].title}`);
      console.error(error);
    }
  };

  const updateKitchenItemStatus = async (itemId: number, orderId: number, newStatus: string) => {
    // Actualizar estado local del item específico
    setLocalKitchenQueue(prev => ({
      ...prev,
      [`item_${itemId}`]: newStatus  // Usar ID del item, no de la orden
    }));

    try {
      // Intentar sincronizar con el servidor
      const response = await fetch(`${API_URL}/api/kitchen/queue/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        toast.success('Estado actualizado');
      } else {
        // Si el servidor devuelve error, aún así mantener el estado local
        const errorData = await response.json();
        toast.warning(`Estado actualizado localmente (${errorData.error || 'Error del servidor'})`);
      }
    } catch (error) {
      // Si falla el servidor, el estado local ya está actualizado
      toast.warning('Estado actualizado localmente');
      console.error(error);
    }
  };

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && 
        destination.index === source.index) return;

    // Actualizar el estado local inmediatamente para feedback visual
    const newData = { ...data };
    
    // Si estamos moviendo una orden completa (desde cualquier columna)
    if (draggableId.startsWith('order-')) {
      const orderId = parseInt(draggableId.replace('order-', ''));
      const sourceColumn = newData[source.droppableId];
      const orderIndex = sourceColumn.orders.findIndex(o => o.id === orderId);
      const order = sourceColumn.orders[orderIndex];
      
      if (order && source.droppableId !== destination.droppableId) {
        // Remover orden de la columna origen
        const [movedOrder] = sourceColumn.orders.splice(orderIndex, 1);
        
        // Actualizar el estado de la orden
        movedOrder.status = destination.droppableId === 'new_orders' ? 'pending' : destination.droppableId;
        
        // Agregar la orden COMPLETA a la columna destino
        newData[destination.droppableId].orders.push(movedOrder);
        setData(newData);
        
        // Luego sincronizar con el servidor
        await moveOrderToKitchen(order, destination.droppableId);
      }
    } else {
      // Es un item de cocina siendo movido entre estados
      const itemId = parseInt(draggableId.replace('kitchen-', ''));
      
      if (source.droppableId !== destination.droppableId) {
        // Encontrar el item en la columna origen
        const sourceIndex = newData[source.droppableId].kitchenItems.findIndex(
          item => item.id === itemId
        );
        
        if (sourceIndex !== -1) {
          // Mover SOLO el item específico
          const [movedItem] = newData[source.droppableId].kitchenItems.splice(sourceIndex, 1);
          movedItem.status = destination.droppableId;
          
          // Insertar en la posición del destino
          if (destination.index !== undefined) {
            newData[destination.droppableId].kitchenItems.splice(destination.index, 0, movedItem);
          } else {
            newData[destination.droppableId].kitchenItems.push(movedItem);
          }
          
          setData(newData);
          
          // Luego sincronizar con el servidor
          await updateKitchenItemStatus(itemId, movedItem.order_id, destination.droppableId);
        }
      }
    }
  };

  const getTimeColor = (minutes?: number) => {
    if (!minutes) return theme.colors.textMuted;
    if (minutes > 20) return '#EF4444';
    if (minutes > 10) return '#F59E0B';
    return '#10B981';
  };

  const clearLocalState = () => {
    localStorage.removeItem('kitchenDragDropState');
    setLocalKitchenQueue({});
    loadOrders();
    toast.success('Estado local limpiado');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <PageHeader
        title="Cocina - Sistema Drag & Drop"
        subtitle="Arrastra las órdenes entre estados"
        actions={[
          {
            label: autoRefresh ? 'Pausar' : 'Reanudar',
            onClick: () => setAutoRefresh(!autoRefresh),
            variant: autoRefresh ? 'secondary' : 'primary',
            icon: autoRefresh ? PauseIcon : PlayIcon
          },
          {
            label: 'Actualizar',
            onClick: loadOrders,
            variant: 'secondary',
            icon: ArrowPathIcon
          },
          {
            label: 'Limpiar Local',
            onClick: clearLocalState,
            variant: 'danger',
            icon: CheckIcon
          }
        ]}
      />

      <div className="p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-5 gap-4">
            {Object.values(data).map(column => {
              const Icon = column.icon;
              const itemCount = column.orders.length + column.kitchenItems.length;

              return (
                <div key={column.id} className="flex flex-col">
                  {/* Header de columna */}
                  <div 
                    className="p-3 rounded-t-lg flex items-center justify-between"
                    style={{ backgroundColor: column.color }}
                  >
                    <div className="flex items-center gap-2 text-white">
                      <Icon className="h-5 w-5" />
                      <span className="font-semibold">{column.title}</span>
                    </div>
                    <span className="bg-white/20 text-white px-2 py-1 rounded-full text-sm">
                      {itemCount}
                    </span>
                  </div>

                  {/* Área droppable */}
                  <Droppable 
                    droppableId={column.id}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex-1 p-2 rounded-b-lg transition-colors"
                        style={{
                          backgroundColor: snapshot.isDraggingOver 
                            ? column.bgColor 
                            : theme.colors.surface,
                          minHeight: '500px',
                          border: `2px dashed ${snapshot.isDraggingOver ? column.color : 'transparent'}`
                        }}
                      >
                        {/* Órdenes completas (en cualquier columna) */}
                        {column.orders.map((order, index) => (
                          <Draggable
                            key={`order-${order.id}`}
                            draggableId={`order-${order.id}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="mb-2"
                              >
                                <GlassPanel 
                                  className={`p-3 cursor-move transition-all ${
                                    snapshot.isDragging ? 'shadow-lg scale-105' : ''
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <TableCellsIcon className="h-4 w-4" style={{ color: theme.colors.primary }} />
                                      <span className="font-semibold">Mesa {order.table_number}</span>
                                    </div>
                                    <span className="text-sm" style={{ color: theme.colors.textMuted }}>
                                      #{order.id}
                                    </span>
                                  </div>
                                  
                                  <div className="space-y-1">
                                    {order.items.map(item => (
                                      <div key={item.id} className="text-sm flex justify-between">
                                        <span>{item.quantity}x {item.product_name}</span>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="flex items-center justify-between mt-2 pt-2 border-t" 
                                       style={{ borderColor: theme.colors.border }}>
                                    <div className="flex items-center gap-1 text-xs">
                                      <ClockIcon className="h-3 w-3" />
                                      <span>
                                        {new Date(order.created_at).toLocaleTimeString('es-AR', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                    <span className="text-sm font-semibold">
                                      ${order.total?.toFixed(2) || '0.00'}
                                    </span>
                                  </div>
                                </GlassPanel>
                              </div>
                            )}
                          </Draggable>
                        ))}

                        {provided.placeholder}

                        {/* Mensaje cuando no hay items */}
                        {column.orders.length === 0 && column.kitchenItems.length === 0 && !loading && (
                          <div className="text-center py-8" style={{ color: theme.colors.textMuted }}>
                            <Icon className="h-12 w-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">
                              {column.id === 'new_orders' ? 'No hay órdenes nuevas' : 'Arrastra órdenes aquí'}
                            </p>
                            {column.id === 'new_orders' && (
                              <p className="text-xs mt-1">Las órdenes aparecerán aquí automáticamente</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};