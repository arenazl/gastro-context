import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { PageHeader } from '../components/PageHeader';
import { GlassPanel, AnimatedCard, FloatingButton, GradientText } from '../components/AnimatedComponents';
import {
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  UserIcon,
  ShoppingCartIcon,
  PlusIcon,
  MinusIcon,
  CheckCircleIcon,
  XMarkIcon,
  CalculatorIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';

interface OrderItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: number;
  table_number?: number;
  customer_name?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
}

export const POSModern: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('card');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock active order
  useEffect(() => {
    loadCurrentOrder();
  }, []);

  const loadCurrentOrder = () => {
    // Mock data
    const mockOrder: Order = {
      id: 101,
      table_number: 5,
      customer_name: 'John Doe',
      items: [
        { id: 1, product_id: 1, name: 'Caesar Salad', price: 12.99, quantity: 2, subtotal: 25.98 },
        { id: 2, product_id: 2, name: 'Grilled Salmon', price: 24.99, quantity: 1, subtotal: 24.99 },
        { id: 3, product_id: 3, name: 'Tiramisu', price: 8.99, quantity: 2, subtotal: 17.98 },
        { id: 4, product_id: 4, name: 'Cappuccino', price: 4.50, quantity: 3, subtotal: 13.50 }
      ],
      subtotal: 82.45,
      tax: 8.25,
      discount: 0,
      total: 90.70,
      status: 'pending_payment'
    };
    setCurrentOrder(mockOrder);
  };

  const updateQuantity = (itemId: number, delta: number) => {
    if (!currentOrder) return;
    
    const updatedItems = currentOrder.items.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return {
          ...item,
          quantity: newQuantity,
          subtotal: item.price * newQuantity
        };
      }
      return item;
    }).filter(item => item.quantity > 0);

    const subtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * 0.1;
    const discount = subtotal * (discountPercent / 100);
    const total = subtotal + tax - discount;

    setCurrentOrder({
      ...currentOrder,
      items: updatedItems,
      subtotal,
      tax,
      discount,
      total
    });
  };

  const applyDiscount = (percent: number) => {
    if (!currentOrder) return;
    
    setDiscountPercent(percent);
    const discount = currentOrder.subtotal * (percent / 100);
    const total = currentOrder.subtotal + currentOrder.tax - discount;
    
    setCurrentOrder({
      ...currentOrder,
      discount,
      total
    });
  };

  const processPayment = async () => {
    setLoading(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowPaymentModal(false);
      setShowReceiptModal(true);
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return BanknotesIcon;
      case 'card': return CreditCardIcon;
      case 'mobile': return DevicePhoneMobileIcon;
      default: return CreditCardIcon;
    }
  };

  const quickAmounts = [50, 100, 150, 200];
  const change = cashReceived ? parseFloat(cashReceived) - (currentOrder?.total || 0) : 0;

  return (
    <div>
      {/* Page Header with Actions */}
      <PageHeader 
        title="Punto de Venta"
        subtitle={currentOrder ? `Orden #${currentOrder.id} • Mesa ${currentOrder.table_number} • Total: $${currentOrder.total.toFixed(2)}` : 'No hay orden activa'}
        actions={[
          {
            label: 'Calculadora',
            onClick: () => console.log('Abrir calculadora'),
            variant: 'secondary',
            icon: CalculatorIcon
          },
          {
            label: 'Imprimir',
            onClick: () => window.print(),
            variant: 'primary',
            icon: PrinterIcon
          }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          <GlassPanel delay={0.1}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold" style={{ color: theme.colors.text }}>
                {t('orders.currentOrder')}
              </h2>
              {currentOrder && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5" style={{ color: theme.colors.textMuted }} />
                    <span style={{ color: theme.colors.text }}>{currentOrder.customer_name}</span>
                  </div>
                  <div className="px-3 py-1 rounded-lg" style={{ backgroundColor: theme.colors.primary + '20' }}>
                    <span style={{ color: theme.colors.primary }}>{t('orders.table')} {currentOrder.table_number}</span>
                  </div>
                </div>
              )}
            </div>

            {currentOrder ? (
              <div className="space-y-3">
                {currentOrder.items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: theme.colors.surface }}
                  >
                    <div className="flex-1">
                      <p className="font-medium" style={{ color: theme.colors.text }}>
                        {item.name}
                      </p>
                      <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                        ${item.price.toFixed(2)} {t('orders.each')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <motion.button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 rounded-lg"
                          style={{ backgroundColor: theme.colors.error + '20' }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <MinusIcon className="h-4 w-4" style={{ color: theme.colors.error }} />
                        </motion.button>
                        <span className="w-8 text-center font-medium" style={{ color: theme.colors.text }}>
                          {item.quantity}
                        </span>
                        <motion.button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 rounded-lg"
                          style={{ backgroundColor: theme.colors.success + '20' }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <PlusIcon className="h-4 w-4" style={{ color: theme.colors.success }} />
                        </motion.button>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="font-bold" style={{ color: theme.colors.primary }}>
                          ${item.subtotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingCartIcon className="h-12 w-12 mx-auto mb-3" style={{ color: theme.colors.textMuted }} />
                <p style={{ color: theme.colors.textMuted }}>{t('orders.noActiveOrder')}</p>
              </div>
            )}
          </GlassPanel>

          {/* Quick Discounts */}
          <GlassPanel delay={0.2}>
            <h3 className="font-medium mb-4" style={{ color: theme.colors.text }}>
              {t('orders.quickDiscounts')}
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {[0, 5, 10, 15].map((percent) => (
                <motion.button
                  key={percent}
                  onClick={() => applyDiscount(percent)}
                  className="p-3 rounded-lg font-medium transition-all"
                  style={{
                    backgroundColor: discountPercent === percent ? theme.colors.primary : theme.colors.surface,
                    color: discountPercent === percent ? 'white' : theme.colors.text
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {percent === 0 ? t('orders.noDiscount') : `${percent}% OFF`}
                </motion.button>
              ))}
            </div>
          </GlassPanel>
        </div>

        {/* Payment Summary */}
        <div className="space-y-6">
          <AnimatedCard delay={0.3} className="p-6">
            <h3 className="font-semibold mb-4" style={{ color: theme.colors.text }}>
              {t('orders.paymentSummary')}
            </h3>
            
            {currentOrder && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span style={{ color: theme.colors.textMuted }}>{t('orders.subtotal')}</span>
                  <span style={{ color: theme.colors.text }}>${currentOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: theme.colors.textMuted }}>{t('orders.tax')} (10%)</span>
                  <span style={{ color: theme.colors.text }}>${currentOrder.tax.toFixed(2)}</span>
                </div>
                {currentOrder.discount > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: theme.colors.success }}>{t('orders.discount')} ({discountPercent}%)</span>
                    <span style={{ color: theme.colors.success }}>-${currentOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-3 border-t" style={{ borderColor: theme.colors.border }}>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold" style={{ color: theme.colors.text }}>{t('orders.total')}</span>
                    <motion.span
                      className="text-2xl font-bold"
                      style={{ color: theme.colors.primary }}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      ${currentOrder.total.toFixed(2)}
                    </motion.span>
                  </div>
                </div>
              </div>
            )}
          </AnimatedCard>

          {/* Payment Methods */}
          <AnimatedCard delay={0.4} className="p-6">
            <h3 className="font-semibold mb-4" style={{ color: theme.colors.text }}>
              {t('orders.paymentMethod')}
            </h3>
            <div className="space-y-3">
              {(['card', 'cash', 'mobile'] as const).map((method) => {
                const Icon = getPaymentIcon(method);
                return (
                  <motion.button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className="w-full p-3 rounded-lg flex items-center gap-3 transition-all"
                    style={{
                      backgroundColor: paymentMethod === method ? theme.colors.primary + '20' : theme.colors.surface,
                      border: `2px solid ${paymentMethod === method ? theme.colors.primary : 'transparent'}`
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon 
                      className="h-5 w-5" 
                      style={{ color: paymentMethod === method ? theme.colors.primary : theme.colors.text }}
                    />
                    <span 
                      className="font-medium capitalize"
                      style={{ color: paymentMethod === method ? theme.colors.primary : theme.colors.text }}
                    >
                      {method === 'mobile' ? t('orders.mobilePayment') : t(`orders.${method}`)}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </AnimatedCard>

          {/* Process Payment Button */}
          <FloatingButton
            onClick={() => setShowPaymentModal(true)}
            variant="primary"
            className="w-full"
            disabled={!currentOrder || currentOrder.items.length === 0}
          >
            <CreditCardIcon className="h-5 w-5 mr-2" />
            {t('orders.processPayment')}
          </FloatingButton>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && currentOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <GlassPanel>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                    {paymentMethod === 'cash' ? 'Cash Payment' : paymentMethod === 'card' ? 'Card Payment' : 'Mobile Payment'}
                  </h2>
                  <motion.button
                    onClick={() => setShowPaymentModal(false)}
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: theme.colors.surface }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <XMarkIcon className="h-5 w-5" style={{ color: theme.colors.textMuted }} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
                    <p className="text-sm mb-1" style={{ color: theme.colors.textMuted }}>Amount Due</p>
                    <p className="text-3xl font-bold" style={{ color: theme.colors.primary }}>
                      ${currentOrder.total.toFixed(2)}
                    </p>
                  </div>

                  {paymentMethod === 'cash' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                          Cash Received
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg text-lg"
                          style={{
                            backgroundColor: theme.colors.surface,
                            color: theme.colors.text,
                            border: `1px solid ${theme.colors.border}`
                          }}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {quickAmounts.map(amount => (
                          <motion.button
                            key={amount}
                            onClick={() => setCashReceived(amount.toString())}
                            className="p-2 rounded-lg text-sm font-medium"
                            style={{
                              backgroundColor: theme.colors.primary + '20',
                              color: theme.colors.primary
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            ${amount}
                          </motion.button>
                        ))}
                      </div>

                      {cashReceived && parseFloat(cashReceived) >= currentOrder.total && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: theme.colors.success + '20' }}
                        >
                          <p className="text-sm" style={{ color: theme.colors.success }}>Change</p>
                          <p className="text-2xl font-bold" style={{ color: theme.colors.success }}>
                            ${change.toFixed(2)}
                          </p>
                        </motion.div>
                      )}
                    </>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="text-center py-8">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <CreditCardIcon className="h-16 w-16 mx-auto mb-4" style={{ color: theme.colors.primary }} />
                      </motion.div>
                      <p style={{ color: theme.colors.text }}>Ready to process card payment</p>
                      <p className="text-sm mt-2" style={{ color: theme.colors.textMuted }}>
                        Insert, tap, or swipe card
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'mobile' && (
                    <div className="text-center py-8">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <DevicePhoneMobileIcon className="h-16 w-16 mx-auto mb-4" style={{ color: theme.colors.primary }} />
                      </motion.div>
                      <p style={{ color: theme.colors.text }}>Scan QR code or tap phone</p>
                      <p className="text-sm mt-2" style={{ color: theme.colors.textMuted }}>
                        Waiting for mobile payment
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <motion.button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-3 rounded-lg font-medium"
                    style={{
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <FloatingButton
                    onClick={processPayment}
                    variant="primary"
                    className="flex-1"
                    disabled={paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < currentOrder.total)}
                  >
                    {loading ? (
                      <motion.div
                        className="h-5 w-5 border-2 rounded-full mr-2"
                        style={{
                          borderColor: 'rgba(255,255,255,0.3)',
                          borderTopColor: 'white'
                        }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                    )}
                    Confirm Payment
                  </FloatingButton>
                </div>
              </GlassPanel>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceiptModal && currentOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReceiptModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm"
            >
              <GlassPanel>
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <CheckCircleIcon className="h-16 w-16 mx-auto mb-4" style={{ color: theme.colors.success }} />
                  </motion.div>
                  <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>
                    Payment Successful!
                  </h2>
                  <p className="mt-2" style={{ color: theme.colors.textMuted }}>
                    Transaction completed
                  </p>
                </div>

                <div className="space-y-3 p-4 rounded-lg" style={{ backgroundColor: theme.colors.surface }}>
                  <div className="text-center pb-3 border-b" style={{ borderColor: theme.colors.border }}>
                    <p className="font-bold" style={{ color: theme.colors.text }}>Restaurant Name</p>
                    <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                      {new Date().toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {currentOrder.items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span style={{ color: theme.colors.text }}>
                          {item.quantity}x {item.name}
                        </span>
                        <span style={{ color: theme.colors.text }}>
                          ${item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t" style={{ borderColor: theme.colors.border }}>
                    <div className="flex justify-between font-bold">
                      <span style={{ color: theme.colors.text }}>Total</span>
                      <span style={{ color: theme.colors.primary }}>${currentOrder.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span style={{ color: theme.colors.textMuted }}>Payment Method</span>
                      <span className="capitalize" style={{ color: theme.colors.text }}>{paymentMethod}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <FloatingButton
                    onClick={() => {
                      setShowReceiptModal(false);
                      window.print();
                    }}
                    variant="secondary"
                    className="flex-1"
                  >
                    <PrinterIcon className="h-5 w-5 mr-2" />
                    Print
                  </FloatingButton>
                  <FloatingButton
                    onClick={() => {
                      setShowReceiptModal(false);
                      setCurrentOrder(null);
                      setCashReceived('');
                      setDiscountPercent(0);
                    }}
                    variant="primary"
                    className="flex-1"
                  >
                    New Order
                  </FloatingButton>
                </div>
              </GlassPanel>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};