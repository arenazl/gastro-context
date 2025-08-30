import React, { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { motion, AnimatePresence } from 'framer-motion';

import {
  X,
  CreditCard,
  DollarSign,
  Loader2,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Banknote,
  Building2,
  QrCode
} from 'lucide-react';
import { toast } from '../lib/toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    order_id: number;
    items: Array<{
      id: number;
      name: string;
      price: number;
      quantity: number;
      description?: string;
    }>;
    total: number;
    table_number: number;
    customer_name?: string;
    customer_email?: string;
  };
  onPaymentSuccess?: (paymentData: any) => void;
}


export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  orderData,
  onPaymentSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'cash' | 'card'>('mercadopago');
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [mpPublicKey, setMpPublicKey] = useState<string | null>(null);

  // Cargar SDK de MercadoPago cuando se abre el modal
  useEffect(() => {
    if (isOpen && paymentMethod === 'mercadopago' && !window.MercadoPago) {
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [isOpen, paymentMethod]);

  const createPaymentPreference = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/payment/create-preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderData.order_id,
          items: orderData.items,
          total: orderData.total,
          customer_name: orderData.customer_name || 'Cliente Mesa ' + orderData.table_number,
          customer_email: orderData.customer_email || 'cliente@restaurant.com',
          table_number: orderData.table_number
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPreferenceId(data.preference_id);
        setMpPublicKey(data.public_key);
        
        // Inicializar MercadoPago Checkout
        if (window.MercadoPago && data.public_key) {
          const mp = new window.MercadoPago(data.public_key, {
            locale: 'es-AR'
          });

          // Crear checkout
          mp.checkout({
            preference: {
              id: data.preference_id
            },
            render: {
              container: '.mercadopago-button',
              label: 'Pagar con MercadoPago'
            },
            theme: {
              elementsColor: '#6366F1',
              headerColor: '#6366F1'
            }
          });
        }
        
        return data;
      } else {
        throw new Error(data.error || 'Error creando preferencia de pago');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al preparar el pago. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodSelect = async (method: 'mercadopago' | 'cash' | 'card') => {
    setPaymentMethod(method);
    
    if (method === 'mercadopago') {
      // Crear preferencia de pago
      await createPaymentPreference();
    } else if (method === 'cash') {
      // Pago en efectivo - marcar como pendiente
      handleCashPayment();
    } else if (method === 'card') {
      // Pago con tarjeta física
      handleCardPayment();
    }
  };

  const handleCashPayment = () => {
    setLoading(true);
    setTimeout(() => {
      if (onPaymentSuccess) {
        onPaymentSuccess({
          method: 'cash',
          status: 'pending',
          order_id: orderData.order_id
        });
      }
      toast.success('Orden marcada para pago en efectivo');
      setLoading(false);
      onClose();
    }, 1000);
  };

  const handleCardPayment = () => {
    setLoading(true);
    setTimeout(() => {
      if (onPaymentSuccess) {
        onPaymentSuccess({
          method: 'card',
          status: 'processing',
          order_id: orderData.order_id
        });
      }
      toast.info('Procesando pago con tarjeta...');
      setLoading(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Completar Pago</h2>
                <p className="text-indigo-100 mt-1">Mesa #{orderData.table_number}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Resumen de la Orden</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-3 pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-bold">Total a Pagar:</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    ${orderData.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-3">Selecciona el Método de Pago</h3>
              
              {/* MercadoPago */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePaymentMethodSelect('mercadopago')}
                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                  paymentMethod === 'mercadopago'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={loading}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Smartphone className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">MercadoPago</p>
                    <p className="text-sm text-gray-500">Paga con QR, tarjeta o transferencia</p>
                  </div>
                </div>
                {paymentMethod === 'mercadopago' && (
                  <CheckCircle className="h-5 w-5 text-indigo-600" />
                )}
              </motion.button>

              {/* Efectivo */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePaymentMethodSelect('cash')}
                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                  paymentMethod === 'cash'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={loading}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Banknote className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Efectivo</p>
                    <p className="text-sm text-gray-500">Pago en caja</p>
                  </div>
                </div>
                {paymentMethod === 'cash' && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </motion.button>

              {/* Tarjeta */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePaymentMethodSelect('card')}
                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                  paymentMethod === 'card'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={loading}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CreditCard className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Tarjeta de Crédito/Débito</p>
                    <p className="text-sm text-gray-500">Pago con POS físico</p>
                  </div>
                </div>
                {paymentMethod === 'card' && (
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                )}
              </motion.button>
            </div>

            {/* MercadoPago Checkout Button */}
            {paymentMethod === 'mercadopago' && (
              <div className="mt-6">
                <div className="mercadopago-button"></div>
                {loading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    <span className="ml-2 text-gray-600">Preparando pago...</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {paymentMethod && paymentMethod !== 'mercadopago' && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (paymentMethod === 'cash') handleCashPayment();
                    if (paymentMethod === 'card') handleCardPayment();
                  }}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Confirmar Pago
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Declaración global para MercadoPago
declare global {
  interface Window {
    MercadoPago: any;
  }
}