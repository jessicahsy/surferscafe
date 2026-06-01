import { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, ClipboardList, BarChart3 } from 'lucide-react';
import { Menu } from './components/Menu';
import { Checkout } from './components/Checkout';
import { ActiveOrders } from './components/ActiveOrders';
import { DailySummary } from './components/DailySummary';
import {
  appendOrder,
  fetchInventory,
  fetchOrders,
  settleTodaySheet,
  updateOrderStatus as updateOrderStatusSheet,
  type InventoryItem,
  type SheetOrderRow,
} from './components/Inventory';
import { getMenuImageUrl } from './images';

export type MenuCategory = 'd' | 'f' | 'm';

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: MenuCategory;
  imageUrl?: string;
};

export type CartItem = MenuItem & {
  quantity: number;
};

export type PaymentMethod = '現金' | 'LINE Pay' | '街口支付' | '刷卡';

export type PaymentSplit = {
  method: PaymentMethod;
  amount: number;
};

export type Order = {
  id: string;
  timestamp: Date;
  items: CartItem[];
  total: number;
  paymentSplits: PaymentSplit[];
  status: '製作中' | '完成';
};

type View = 'menu' | 'checkout' | 'orders' | 'summary';

function mapInventoryToMenuItems(rows: InventoryItem[]): MenuItem[] {
  return rows
    .filter(row => Number(row.active) === 1)
    .map(row => ({
      id: row.item_id,
      name: row.item_name,
      price: Number(row.price || 0),
      category: row.category,
      imageUrl: getMenuImageUrl(row.image_url),
    }));
}

function hydrateOrders(sheetRows: SheetOrderRow[], menuItems: MenuItem[]): Order[] {
  const itemMap = new Map(menuItems.map(item => [item.id, item]));

  return sheetRows.map(row => {
    const items: CartItem[] = row.items.map(([itemId, quantity]) => {
      const base = itemMap.get(itemId);
      return {
        id: itemId,
        name: base?.name ?? itemId,
        price: base?.price ?? 0,
        category: base?.category ?? 'd',
        imageUrl: base?.imageUrl ?? '',
        quantity: Number(quantity || 0),
      };
    });

    return {
      id: row.order_id,
      timestamp: new Date(row.timestamp),
      items,
      total: Number(row.total || 0),
      paymentSplits: (row.payment_methods || []).map(([method, amount]) => ({
        method: method as PaymentMethod,
        amount: Number(amount || 0),
      })),
      status: row.status,
    };
  });
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>('menu');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const inventoryRows = await fetchInventory();
      if (!alive) return;

      const nextMenuItems = mapInventoryToMenuItems(inventoryRows);
      setMenuItems(nextMenuItems);

      const sheetOrders = await fetchOrders();
      if (!alive) return;

      setOrders(hydrateOrders(sheetOrders, nextMenuItems));
    };

    load().catch(error => {
      console.error('Failed to load inventory/orders:', error);
    });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (menuItems.length === 0) return;

    let alive = true;

    const refreshOrders = async () => {
      const sheetOrders = await fetchOrders();
      if (!alive) return;

      setOrders(hydrateOrders(sheetOrders, menuItems));
    };

    refreshOrders().catch(error => {
      console.error('Failed to refresh orders:', error);
    });

    const id = window.setInterval(() => {
      refreshOrders().catch(error => {
        console.error('Failed to refresh orders:', error);
      });
    }, 5000);

    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [menuItems]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    setCart(prev => {
      if (quantity <= 0) return prev.filter(i => i.id !== itemId);
      return prev.map(i => (i.id === itemId ? { ...i, quantity } : i));
    });
  };

  const clearCart = () => setCart([]);

  const createOrder = async (paymentSplits: PaymentSplit[]) => {
    if (cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderId = `O-${Date.now()}`;

    const newOrder: Order = {
      id: orderId,
      timestamp: new Date(),
      items: cart.map(item => ({ ...item })),
      total,
      paymentSplits,
      status: '製作中',
    };

    await appendOrder({
      order_id: newOrder.id,
      timestamp: newOrder.timestamp.toISOString(),
      items: newOrder.items.map(item => [item.id, item.quantity]),
      total: newOrder.total,
      payment_methods: newOrder.paymentSplits.map(split => [split.method, split.amount]),
      status: newOrder.status,
    });

    clearCart();
    setCurrentView('orders');

    const sheetOrders = await fetchOrders();
    setOrders(hydrateOrders(sheetOrders, menuItems));
  };

  const updateOrderStatus = async (orderId: string, status: '製作中' | '完成') => {
    await updateOrderStatusSheet(orderId, status);
    setOrders(prev => prev.map(order => (order.id === orderId ? { ...order, status } : order)));
  };

  const settleToday = async () => {
    const confirmed = window.confirm('確定要進行今日結算嗎？這會把今日摘要寫入 Google Sheets。');
    if (!confirmed) return;

    await settleTodaySheet();

    const sheetOrders = await fetchOrders();
    setOrders(hydrateOrders(sheetOrders, menuItems));
    setCurrentView('summary');
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
              {cartCount > 0 && currentView !== 'orders' && currentView !== 'summary' && (
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
          <ActiveOrders orders={orders} updateOrderStatus={updateOrderStatus} />
        )}

        {currentView === 'summary' && (
          <DailySummary orders={orders} onSettleToday={settleToday} />
        )}
      </main>
    </div>
  );
}