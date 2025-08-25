import React, { useState, useEffect } from 'react';
import { 
  CreditCardIcon, 
  BanknotesIcon, 
  DevicePhoneMobileIcon,
  ReceiptPercentIcon,
  PrinterIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface Order {
  id: number;
  table_number: number;
  status: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
}

export const POS: React.FC = () => {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('card');
  const [tipAmount, setTipAmount] = useState(0);
  const [tipPercentage, setTipPercentage] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockOrders: Order[] = [
      {
        id: 2001,
        table_number: 5,
        status: 'ready',
        created_at: new Date(Date.now() - 45 * 60000).toISOString(),
        items: [
          { id: 1, product_name: 'Caesar Salad', quantity: 2, price: 12.99 },
          { id: 2, product_name: 'Grilled Salmon', quantity: 1, price: 24.99 },
          { id: 3, product_name: 'Ribeye Steak', quantity: 1, price: 34.99 },
          { id: 4, product_name: 'House Wine', quantity: 2, price: 8.99 },
        ],
        subtotal: 103.94,
        tax: 10.39,
        total: 114.33,
      },
      {
        id: 2002,
        table_number: 3,
        status: 'ready',
        created_at: new Date(Date.now() - 30 * 60000).toISOString(),
        items: [
          { id: 5, product_name: 'Margherita Pizza', quantity: 1, price: 18.99 },
          { id: 6, product_name: 'Pasta Carbonara', quantity: 2, price: 16.99 },
          { id: 7, product_name: 'Tiramisu', quantity: 2, price: 7.99 },
        ],
        subtotal: 68.95,
        tax: 6.90,
        total: 75.85,
      },
      {
        id: 2003,
        table_number: 8,
        status: 'ready',
        created_at: new Date(Date.now() - 60 * 60000).toISOString(),
        items: [
          { id: 8, product_name: 'French Onion Soup', quantity: 3, price: 9.99 },
          { id: 9, product_name: 'Chicken Parmesan', quantity: 2, price: 19.99 },
        ],
        subtotal: 69.95,
        tax: 6.99,
        total: 76.94,
      },
    ];
    setActiveOrders(mockOrders);
  }, []);

  const handleTipPercentage = (percentage: number) => {
    setTipPercentage(percentage);
    if (selectedOrder) {
      const tip = (selectedOrder.total * percentage) / 100;
      setTipAmount(parseFloat(tip.toFixed(2)));
      setCustomAmount('');
    }
  };

  const handleCustomTip = (value: string) => {
    setCustomAmount(value);
    const amount = parseFloat(value) || 0;
    setTipAmount(amount);
    if (selectedOrder && amount > 0) {
      const percentage = (amount / selectedOrder.total) * 100;
      setTipPercentage(parseFloat(percentage.toFixed(1)));
    } else {
      setTipPercentage(0);
    }
  };

  const calculateTotal = () => {
    if (!selectedOrder) return 0;
    return selectedOrder.total + tipAmount;
  };

  const processPayment = async () => {
    if (!selectedOrder) return;
    
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentComplete(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setPaymentComplete(false);
        setSelectedOrder(null);
        setTipAmount(0);
        setTipPercentage(0);
        setCustomAmount('');
        // Remove paid order from list
        setActiveOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
      }, 3000);
    }, 2000);
  };

  const getPaymentIcon = () => {
    switch (paymentMethod) {
      case 'cash':
        return <BanknotesIcon className="h-6 w-6" />;
      case 'card':
        return <CreditCardIcon className="h-6 w-6" />;
      case 'mobile':
        return <DevicePhoneMobileIcon className="h-6 w-6" />;
    }
  };

  if (paymentComplete) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <CheckCircleIcon className="h-24 w-24 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-lg text-gray-600">Total: ${calculateTotal().toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-2">Receipt printed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Orders List */}
      <div className="w-96 bg-gray-50 border-r border-gray-200 overflow-y-auto">
        <div className="p-4 bg-white border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Active Orders</h2>
          <p className="text-sm text-gray-500 mt-1">Select an order to process payment</p>
        </div>
        
        <div className="p-4 space-y-3">
          {activeOrders.map((order) => (
            <button
              key={order.id}
              onClick={() => {
                setSelectedOrder(order);
                setTipAmount(0);
                setTipPercentage(0);
                setCustomAmount('');
              }}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedOrder?.id === order.id
                  ? 'bg-white border-restaurant-500 shadow-md'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-semibold text-gray-900">Table {order.table_number}</span>
                  <span className="ml-2 text-sm text-gray-500">#{order.id}</span>
                </div>
                <span className="text-lg font-bold text-restaurant-600">
                  ${order.total.toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {order.items.length} items • {new Date(order.created_at).toLocaleTimeString()}
              </div>
            </button>
          ))}
        </div>
        
        {activeOrders.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No orders ready for payment</p>
          </div>
        )}
      </div>

      {/* Payment Interface */}
      <div className="flex-1 flex flex-col">
        {selectedOrder ? (
          <>
            {/* Order Details */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                  Checkout - Table {selectedOrder.table_number}
                </h1>

                {/* Items List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Order Items</h3>
                  </div>
                  <div className="px-6 py-4">
                    <div className="space-y-3">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <div>
                            <span className="text-gray-900">
                              {item.quantity}x {item.product_name}
                            </span>
                            {item.notes && (
                              <div className="text-sm text-gray-500 italic">
                                {item.notes}
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="text-gray-900">${selectedOrder.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax (10%)</span>
                        <span className="text-gray-900">${selectedOrder.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span>${selectedOrder.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tip Selection */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <ReceiptPercentIcon className="h-5 w-5 mr-2" />
                      Add Tip
                    </h3>
                  </div>
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {[0, 15, 18, 20].map((percentage) => (
                        <button
                          key={percentage}
                          onClick={() => handleTipPercentage(percentage)}
                          className={`py-3 rounded-md font-medium transition-colors ${
                            tipPercentage === percentage
                              ? 'bg-restaurant-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {percentage === 0 ? 'No Tip' : `${percentage}%`}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-gray-700">Custom amount:</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          value={customAmount}
                          onChange={(e) => handleCustomTip(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-restaurant-500 focus:border-restaurant-500"
                        />
                      </div>
                    </div>
                    
                    {tipAmount > 0 && (
                      <div className="mt-4 p-3 bg-green-50 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-green-800">
                            Tip ({tipPercentage}%)
                          </span>
                          <span className="font-semibold text-green-900">
                            ${tipAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Payment Method</h3>
                  </div>
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setPaymentMethod('card')}
                        className={`py-4 rounded-md border-2 transition-all ${
                          paymentMethod === 'card'
                            ? 'border-restaurant-500 bg-restaurant-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <CreditCardIcon className="h-8 w-8 mx-auto mb-2 text-gray-700" />
                        <div className="text-sm font-medium">Card</div>
                      </button>
                      
                      <button
                        onClick={() => setPaymentMethod('cash')}
                        className={`py-4 rounded-md border-2 transition-all ${
                          paymentMethod === 'cash'
                            ? 'border-restaurant-500 bg-restaurant-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <BanknotesIcon className="h-8 w-8 mx-auto mb-2 text-gray-700" />
                        <div className="text-sm font-medium">Cash</div>
                      </button>
                      
                      <button
                        onClick={() => setPaymentMethod('mobile')}
                        className={`py-4 rounded-md border-2 transition-all ${
                          paymentMethod === 'mobile'
                            ? 'border-restaurant-500 bg-restaurant-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <DevicePhoneMobileIcon className="h-8 w-8 mx-auto mb-2 text-gray-700" />
                        <div className="text-sm font-medium">Mobile</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Footer */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Total with tip</div>
                    <div className="text-3xl font-bold text-gray-900">
                      ${calculateTotal().toFixed(2)}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium flex items-center gap-2"
                    >
                      <PrinterIcon className="h-5 w-5" />
                      Print Receipt
                    </button>
                    <button
                      onClick={processPayment}
                      disabled={isProcessing}
                      className="px-8 py-3 bg-restaurant-600 text-white rounded-md hover:bg-restaurant-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 min-w-[200px] justify-center"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          {getPaymentIcon()}
                          Process Payment
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <CreditCardIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Select an Order
              </h2>
              <p className="text-gray-600">
                Choose an order from the list to process payment
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};