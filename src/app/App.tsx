import { useEffect, useMemo, useState } from 'react';
import { Menu } from './components/Menu';
import { Checkout } from './components/Checkout';
import { ActiveOrders } from './components/ActiveOrders';
import { DailySummary } from './components/DailySummary';
import { LayoutGrid, ClipboardList, BarChart3 } from 'lucide-react';

import { fetchInventory, type InventoryItem } from './components/Inventory';
import { getMenuImageUrl } from './images';

const SHEETS_WEBAPP_URL =
  'https://script.google.com/macros/s/AKfycbxtP9O3OvK0uB13AVmmh6Jrz2gArb1DrESecahSYdiNVt-ida0hPpAgvtp3E8RReXupAw/exec';

const STORAGE_KEYS = {
  orders: 'menu_system_orders_v1',
  nextOrderNumber: 'menu_system_next_order_number_v1',
};

export type MenuCategory = '飲品' | '食品' | '商品';

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: MenuCategory;
  imageUrl?: string;
  requiresMemo?: boolean;
};

export type CartItem = MenuItem & {
  quantity: number;
  memo?: string;
};

export type PaymentMethod =
  | '現金'
  | 'LINE Pay'
  | '街口支付'
  | '刷卡'
  | '代付款';

export type PaymentSplit = {
  method: PaymentMethod;
  amount: number;
};

export type Order = {
  id: string;
  sequence: number;
  items: CartItem[];
  cafeTotal: number;
  paymentSplits: PaymentSplit[];
  status: '製作中' | '完成' | '待付款';
  serviceType?: '內用' | '外帶';
  timestamp: Date;
  needsMemo: boolean;
};

type View = 'menu' | 'checkout' | 'orders' | 'summary';

type StoredOrder = Omit<Order, 'timestamp'> & {
  timestamp: string;
};

function toStoredOrder(order: Order): StoredOrder {
  return {
    ...order,
    timestamp: order.timestamp.toISOString(),
  };
}

function fromStoredOrder(order: StoredOrder): Order {
  return {
    ...order,
    timestamp: new Date(order.timestamp),
  };
}

function readStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.orders);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredOrder[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(fromStoredOrder);
  } catch {
    return [];
  }
}

function readStoredNextOrderNumber(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.nextOrderNumber);
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : 1;
  } catch {
    return 1;
  }
}

function formatLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function logOrderToSheets(order: Order) {
  try {
    const res = await fetch(SHEETS_WEBAPP_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'logOrder',
        date: formatLocalDateKey(new Date()),
        order: {
          orderId: order.id,
          orderTotal: order.cafeTotal,
          items: order.items.map(item => ({
            itemId: item.id,
            count: item.quantity,
          })),
          payments: order.paymentSplits.map(split => ({
            method: split.method === '現金'
              ? 'cash'
              : split.method === 'LINE Pay'
                ? 'line'
                : split.method === '街口支付'
                  ? 'jko'
                  : 'card',
            value: split.amount,
          })),
        },
      }),
    });

    const text = await res.text();
    console.log('logOrderToSheets:', res.status, text);
  } catch (error) {
    console.error('Failed to log order:', error);
  }
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>('menu');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(() => readStoredOrders());
  const [nextOrderNumber, setNextOrderNumber] = useState<number>(() =>
    readStoredNextOrderNumber()
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders.map(toStoredOrder)));
    } catch (error) {
      console.error('Failed to save orders locally:', error);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.nextOrderNumber, String(nextOrderNumber));
    } catch (error) {
      console.error('Failed to save next order number locally:', error);
    }
  }, [nextOrderNumber]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);

      if (existing) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }

      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    setCart(prev => {
      if (quantity <= 0) {
        return prev.filter(i => i.id !== itemId);
      }

      return prev.map(i => (i.id === itemId ? { ...i, quantity } : i));
    });
  };

  const clearCart = () => setCart([]);

  useEffect(() => {
    let alive = true;

    const loadMenu = async () => {
      const inventoryRows = await fetchInventory();
      if (!alive) return;

      setMenuItems(
        inventoryRows
          .filter(row => row.active === 1)
          .map(row => ({
            id: row.item_id,
            name: row.item_name,
            price: row.price,
            category:
              row.category === 'd'
                ? '飲品'
                : row.category === 'f'
                ? '食品'
                : '商品',
            imageUrl: row.image_url || getMenuImageUrl(row.item_id) || undefined,
            requiresMemo: false,
          }))
      );
    };

    loadMenu().catch(error => {
      console.error('Failed to load menu inventory:', error);
    });

    return () => {
      alive = false;
    };
  }, []);

  const createOrder = async (
    paymentSplits: PaymentSplit[],
    serviceType?: '內用' | '外帶'
  ) => {
    if (cart.length === 0) return;

    const cafeTotal = cart
      .filter(item => item.category !== '商品')
      .reduce((sum, item) => sum + item.price * item.quantity, 0);

    const needsMemo = cart.some(item => item.requiresMemo && !item.memo?.trim());

    const orderNumber = nextOrderNumber;

    const newOrder: Order = {
      id: `#${String(orderNumber).padStart(4, '0')}`,
      sequence: orderNumber,
      items: cart.map(item => ({ ...item })),
      cafeTotal,
      paymentSplits,
      status: paymentSplits.some(split => split.method === '代付款') ? '待付款' : '製作中',
      serviceType,
      timestamp: new Date(),
      needsMemo,
    };

    setOrders(prev => [...prev, newOrder]);
    setNextOrderNumber(prev => prev + 1);
    clearCart();
    setCurrentView('orders');

    if (newOrder.status !== '待付款') {
      await logOrderToSheets(newOrder);
    }
  };

  async function logDailySummaryToSheets(orders: Order[]) {
    try {
      const completedOrders = orders.filter(order => order.status === '完成');
      const settledAt = new Date().toLocaleTimeString();
      const revenue = completedOrders.reduce((sum, order) => sum + order.cafeTotal, 0);
      const orderCount = completedOrders.length;

      const paymentTotals: Record<'現金' | 'LINE Pay' | '街口支付' | '刷卡', number> = {
        現金: 0,
        'LINE Pay': 0,
        '街口支付': 0,
        刷卡: 0,
      };

      completedOrders.forEach(order => {
        const orderTotal = order.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        if (orderTotal <= 0) return;

        const cafeRatio = order.cafeTotal / orderTotal;

        order.paymentSplits.forEach(split => {
          const amount = Math.round((Number(split.amount) || 0) * cafeRatio);

          if (split.method in paymentTotals) {
            paymentTotals[split.method as keyof typeof paymentTotals] += amount;
          }
        });
      });

      const res = await fetch(SHEETS_WEBAPP_URL, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
          action: 'logDailySummary',
          date: formatLocalDateKey(new Date()),
          revenue,
          orderCount,
          settledAt,
          cashAmount: paymentTotals['現金'],
          lineAmount: paymentTotals['LINE Pay'],
          jkoAmount: paymentTotals['街口支付'],
          cardAmount: paymentTotals['刷卡'],
        }),
      });

      const text = await res.text();
      console.log('logDailySummaryToSheets:', res.status, text);
    } catch (error) {
      console.error('Failed to log daily summary:', error);
    }
  }

  const updateOrderStatus = (
    orderId: string,
    status: '製作中' | '完成' | '待付款'
  ) => {
    setOrders(prev =>
      prev.map(order => (order.id === orderId ? { ...order, status } : order))
    );
  };

  const updateOrderMemo = (orderId: string, itemId: string, memo: string) => {
    setOrders(prev =>
      prev.map(order => {
        if (order.id !== orderId) return order;

        const updatedItems = order.items.map(item =>
          item.id === itemId ? { ...item, memo } : item
        );

        const stillNeedsMemo = updatedItems.some(
          item => item.requiresMemo && !item.memo?.trim()
        );

        return {
          ...order,
          items: updatedItems,
          needsMemo: stillNeedsMemo,
        };
      })
    );
  };

  const removeOrder = (orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));
  };

  const updateOrderPaymentMethod = async (
    orderId: string,
    method: Exclude<PaymentMethod, '代付款' | '轉帳'>
  ) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? {
              ...order,
              paymentSplits: [{ method, amount: order.cafeTotal }],
              status: '完成',
            }
          : order
      )
    );

    const settledOrder = orders.find(order => order.id === orderId);
    if (settledOrder?.status === '待付款') {
      await logOrderToSheets({
        ...settledOrder,
        paymentSplits: [{ method, amount: settledOrder.cafeTotal }],
        status: '完成',
      });
    }
  };

  const settleToday = async () => {
  const confirmed = window.confirm(
    '確定要進行今日結算嗎？這將清除目前畫面並重置編號。'
  );

  if (!confirmed) return;

  await logDailySummaryToSheets(orders);

  setOrders([]);
  setCart([]);
  setNextOrderNumber(1);
  setCurrentView('menu');

  try {
    localStorage.removeItem(STORAGE_KEYS.orders);
    localStorage.removeItem(STORAGE_KEYS.nextOrderNumber);
  } catch (error) {
    console.error('Failed to clear local storage:', error);
  }
};

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const pendingOrderCount = useMemo(
    () => orders.filter(order => order.status !== '完成').length,
    [orders]
  );

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-stone-900">
      {currentView !== 'checkout' && (
        <header className="sticky top-0 z-50 border-b border-stone-200 bg-[#f6f1e8]/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 md:px-6">
            <button
              onClick={() => setCurrentView('menu')}
              className={`relative flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                currentView === 'menu'
                  ? 'bg-stone-900 text-white shadow'
                  : 'bg-white text-stone-700 hover:bg-stone-100'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              菜單

              {cartCount > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
                  !
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentView('orders')}
              className={`relative flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                currentView === 'orders'
                  ? 'bg-stone-900 text-white shadow'
                  : 'bg-white text-stone-700 hover:bg-stone-100'
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              訂單

              {pendingOrderCount > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
                  {pendingOrderCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentView('summary')}
              className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                currentView === 'summary'
                  ? 'bg-stone-900 text-white shadow'
                  : 'bg-white text-stone-700 hover:bg-stone-100'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              今日結算
            </button>

            <div className="ml-auto">
              {cartCount > 0 &&
                currentView !== 'orders' &&
                currentView !== 'summary' && (
                  <button
                    onClick={() => setCurrentView('checkout')}
                    className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-stone-800"
                  >
                    前往結帳 · ${cartTotal}
                  </button>
                )}
            </div>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-[1600px]">
        {currentView === 'menu' && (
          <Menu
            menuItems={menuItems}
            addToCart={addToCart}
            cart={cart}
            updateQuantity={updateCartQuantity}
            onCheckout={() => setCurrentView('checkout')}
            cartTotal={cartTotal}
            cartCount={cartCount}
          />
        )}

        {currentView === 'checkout' && (
          <Checkout
            cart={cart}
            updateQuantity={updateCartQuantity}
            onConfirm={createOrder}
            onCancel={() => setCurrentView('menu')}
          />
        )}

        {currentView === 'orders' && (
          <ActiveOrders
            orders={orders}
            updateOrderStatus={updateOrderStatus}
            updateOrderPaymentMethod={updateOrderPaymentMethod}
            updateOrderMemo={updateOrderMemo}
            removeOrder={removeOrder}
          />
        )}

        {currentView === 'summary' && (
          <DailySummary
            orders={orders}
            onSettleToday={settleToday}
          />
        )}
      </main>
    </div>
  );
}