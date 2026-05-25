import { useMemo, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';
import { Coffee, Sandwich, ShoppingBag, Minus, Plus, X, ImageIcon, CreditCard } from 'lucide-react';
import type { CartItem, MenuCategory, MenuItem } from '../App';

type Props = {
  addToCart: (item: MenuItem) => void;
  cart: CartItem[];
  updateQuantity: (itemId: string, quantity: number) => void;
  onCheckout: () => void;
  cartTotal: number;
  cartCount: number;
};

type PadState = {
  type: 'quantity' | 'price';
  item: MenuItem;
  value: string;
};

const palette = ['#9f7a5a', '#c8925c', '#d7b48a', '#8d6b52', '#b98b6a', '#7f664c'];

const createPlaceholderImage = (title: string, index: number) => {
  const bg = palette[index % palette.length];
  const label = encodeURIComponent(title);
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fbf4ea"/>
          <stop offset="100%" stop-color="${bg}"/>
        </linearGradient>
      </defs>
      <rect width="320" height="220" rx="28" fill="url(#g)"/>
      <circle cx="248" cy="54" r="38" fill="rgba(255,255,255,0.25)"/>
      <circle cx="82" cy="150" r="60" fill="rgba(255,255,255,0.14)"/>
      <text x="50%" y="48%" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#ffffff" font-weight="700">${label}</text>
      <text x="50%" y="64%" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#ffffff" opacity="0.92">可替換照片</text>
    </svg>
  `)}`;
};

const menuItems: MenuItem[] = [
  // 飲品
  { id: 'drink-americano-ice', name: '美式（冰）', price: 80, category: '飲品', imageUrl: 'src/images/drinks/americano-i.png'},
  { id: 'drink-americano-hot', name: '美式（熱）', price: 80, category: '飲品', imageUrl: 'src/images/drinks/americano-h.png'},
  { id: 'drink-latte-ice', name: '拿鐵（冰）', price: 100, category: '飲品', imageUrl: 'src/images/drinks/latte-i.png'},
  { id: 'drink-latte-hot', name: '拿鐵（熱）', price: 100, category: '飲品', imageUrl: 'src/images/drinks/latte-h.png' },
  { id: 'drink-romano', name: '西西里', price: 120, category: '飲品', imageUrl: 'src/images/drinks/romano.png'},
  { id: 'drink-coldbrew', name: '冷萃', price: 100, category: '飲品', imageUrl: 'src/images/drinks/brew.png'},
  { id: 'drink-blacktea', name: '古早味紅茶', price: 60, category: '飲品', imageUrl: 'src/images/drinks/black_tea.png' },
  { id: 'drink-milktea-ice', name: '鮮奶茶（冰）', price: 100, category: '飲品', imageUrl: 'src/images/drinks/milk_tea-i.png' },
  { id: 'drink-milktea-hot', name: '鮮奶茶（熱）', price: 100, category: '飲品', imageUrl: 'src/images/drinks/milk_tea-h.png' },
  { id: 'drink-honeylemon', name: '蜂蜜檸檬', price: 80, category: '飲品', imageUrl: 'src/images/drinks/honey_lemon.png' },
  { id: 'drink-lemoncola', name: '檸檬可樂', price: 60, category: '飲品', imageUrl: 'src/images/drinks/lemon_coke.png' },
  { id: 'drink-lemonsparkle', name: '檸檬氣泡水', price: 60, category: '飲品', imageUrl: 'src/images/drinks/sparkling.png' },

  // 食品
  { id: 'food-bagel-strawberry', name: '貝果-草莓', price: 60, category: '食品', imageUrl: 'src/images/food/strawberry_c.png' },
  { id: 'food-bagel-blueberry', name: '貝果-藍莓', price: 60, category: '食品', imageUrl: 'src/images/food/blueberry_c.png' },
  { id: 'food-bagel-garlic', name: '貝果-蒜味', price: 60, category: '食品', imageUrl: 'src/images/food/garlic_c.png' },
  { id: 'food-bagel-peanut', name: '貝果-花生', price: 60, category: '食品', imageUrl: 'src/images/food/peanut_c.png' },
  { id: 'food-bagel-choco', name: '貝果-巧克力', price: 60, category: '食品', imageUrl: 'src/images/food/chocolate_c.png' },
  { id: 'food-bagel-eggsalad', name: '貝果-蛋沙拉', price: 90, category: '食品', imageUrl: 'src/images/food/egg_c.png' },

  // 商品
  { id: 'merch-bottle', name: '瓶裝飲料', price: 30, category: '商品', imageUrl: 'src/images/merch/other_bev.png'},
  { id: 'merch-cola', name: '可樂', price: 40, category: '商品', imageUrl: 'src/images/merch/cola.png' },
  { id: 'merch-coconut', name: '椰子汁', price: 50, category: '商品', imageUrl: 'src/images/merch/coconut.png' },
  { id: 'merch-energy', name: '能量飲料', price: 70, category: '商品', imageUrl: 'src/images/merch/energy.png' },
  { id: 'merch-beer', name: '啤酒', price: 40, category: '商品', imageUrl: 'src/images/merch/beer.png' },
  { id: 'merch-orion', name: '奧利恩', price: 50, category: '商品', imageUrl: 'src/images/merch/orion.png' },
  { id: 'merch-shower', name: '洗澡', price: 20, category: '商品', imageUrl: createPlaceholderImage('洗澡', 0) },
  { id: 'merch-footwash', name: '沖腳', price: 20, category: '商品', imageUrl: createPlaceholderImage('沖腳', 1) },
  { id: 'merch-other', name: '其他', price: 0, category: '商品', imageUrl: createPlaceholderImage('其他', 2), requiresMemo: true },
];

export function Menu({ addToCart, cart, updateQuantity, onCheckout, cartTotal, cartCount }: Props) {
  const [activeTab, setActiveTab] = useState<MenuCategory>('飲品');
  const [padState, setPadState] = useState<PadState | null>(null);

  const filteredItems = useMemo(
    () => menuItems.filter(item => item.category === activeTab),
    [activeTab]
  );

  const getItemQuantity = (itemId: string) => cart.find(i => i.id === itemId)?.quantity || 0;

  const openQuantityPad = (item: MenuItem) => {
    const current = getItemQuantity(item.id);
    setPadState({ type: 'quantity', item, value: String(current) });
  };

  const openPricePad = (item: MenuItem) => {
    setPadState({ type: 'price', item, value: '' });
  };

  const tapCard = (item: MenuItem, target: HTMLElement) => {
    const isControl = target.closest('[data-control="true"]');
    if (isControl) return;

    if (item.id === 'merch-other') {
      openPricePad(item);
      return;
    }

    addToCart(item);
  };

  const setValue = (next: string) => {
    setPadState(prev => (prev ? { ...prev, value: next } : prev));
  };

  const handlePadKey = (key: string) => {
    if (!padState) return;
    if (key === 'C') {
      setValue('');
      return;
    }
    if (key === '⌫') {
      setValue(padState.value.slice(0, -1));
      return;
    }
    setValue((padState.value + key).slice(0, 4));
  };

  const confirmPad = () => {
    if (!padState) return;

    const numericValue = Math.max(0, parseInt(padState.value || '0', 10) || 0);
    if (padState.type === 'quantity') {
      updateQuantity(padState.item.id, numericValue);
    } else if (padState.item.id === 'merch-other') {
      const price = numericValue;
      if (price > 0) {
        addToCart({ ...padState.item, id: `custom-${Date.now()}`, price });
      }
    }

    setPadState(null);
  };

  const renderCard = (item: MenuItem) => {
    const quantity = getItemQuantity(item.id);
    const isCustom = item.id === 'merch-other';

    return (
      <div
        key={item.id}
        role="button"
        tabIndex={0}
        onClick={(e) => tapCard(item, e.target as HTMLElement)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            tapCard(item, e.target as HTMLElement);
          }
        }}
        className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${quantity > 0 ? 'border-stone-300 ring-2 ring-stone-300/30' : 'border-stone-200'}`}
      >
        <div className="relative w-full overflow-hidden bg-stone-100 aspect-square">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <h3 className="text-[15px] font-semibold leading-tight text-stone-900">{item.name}</h3>
              {item.requiresMemo && (
                <p className="mt-1 text-xs text-amber-700">需備註</p>
              )}
            </div>
            <span className="shrink-0 text-base font-semibold text-stone-900">
              {isCustom ? '輸入金額' : `$${item.price}`}
            </span>
          </div>

          <div className="mt-auto">
            {quantity > 0 && (
  <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2" data-control="true">
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        updateQuantity(item.id, quantity - 1);
      }}
      className="flex h-11 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-stone-700 transition hover:bg-stone-100"
    >
      <Minus className="h-4 w-4" />
    </button>

    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openQuantityPad(item);
      }}
      className="h-11 rounded-2xl border border-stone-200 bg-white text-lg font-semibold text-stone-900 transition hover:bg-stone-50"
    >
      {quantity}
    </button>

    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        updateQuantity(item.id, quantity + 1);
      }}
      className="flex h-11 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-stone-700 transition hover:bg-stone-100"
    >
      <Plus className="h-4 w-4" />
    </button>
  </div>
)}
          </div>
        </div>
      </div>
    );
  };

  const categoryIcon = (category: MenuCategory) => {
    switch (category) {
      case '飲品': return <Coffee className="h-4 w-4" />;
      case '食品': return <Sandwich className="h-4 w-4" />;
      case '商品': return <ShoppingBag className="h-4 w-4" />;
    }
  };

  return (
    <div className="px-4 py-5 md:px-6 lg:px-8">
      <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as MenuCategory)}>
        <Tabs.List className="mb-4 flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-stone-200">
          {(['飲品', '食品', '商品'] as MenuCategory[]).map(tab => (
            <Tabs.Trigger
              key={tab}
              value={tab}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition rounded-2xl ${activeTab === tab ? 'bg-stone-900 text-white shadow' : 'text-stone-600 hover:bg-stone-100'}`}
            >
              {categoryIcon(tab)}
              {tab}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-5">
          <section className="rounded-[28px] border border-stone-200 bg-[#fffaf3] p-4 shadow-sm md:p-5">
            <Tabs.Content value={activeTab} className="space-y-4 outline-none">
              <div className="grid grid-cols-3 gap-3">
                {filteredItems.map(renderCard)}
              </div>
            </Tabs.Content>
          </section>

        <aside className="rounded-[28px] border border-stone-200 bg-white p-4 shadow-sm md:p-5 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:overflow-auto">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">目前訂單</h2>
            </div>

          </div>

          <div className="space-y-3">
            {cart.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-stone-200 bg-stone-50 px-4 py-10 text-center text-sm text-stone-500">
                目前沒有加入任何項目
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="rounded-3xl border border-stone-200 bg-[#fcfaf6] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-stone-900">{item.name}</h3>
                      <p className="text-sm text-stone-500">${item.price} × {item.quantity}</p>
                      {item.requiresMemo && (
                        <p className="mt-1 text-xs text-amber-700">備註待填</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-stone-900">${item.price * item.quantity}</p>
                    </div>
                  </div>

                  {item.requiresMemo}
                </div>
              ))
            )}
          </div>

          <div className="mt-4 rounded-3xl border border-stone-200 bg-stone-50 p-4">
            <div className="flex items-center justify-between text-sm text-stone-600">
              <span>訂單金額</span>
              <span>{cartCount} 項</span>
            </div>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-sm text-stone-500">合計</span>
              <span className="text-3xl font-semibold text-stone-900">${cartTotal}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCheckout}
            disabled={cart.length === 0}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            <CreditCard className="h-5 w-5" />
            結帳
          </button>
        </aside>
      </div>
      </Tabs.Root>

      <Dialog.Root open={padState !== null} onOpenChange={(open) => !open && setPadState(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-stone-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-lg font-semibold text-stone-900">
                  {padState?.type === 'quantity' ? '輸入數量' : '輸入金額'}
                </Dialog.Title>
                <p className="text-sm text-stone-500">{padState?.item.name}</p>
              </div>
              <Dialog.Close className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <input
              autoFocus
              inputMode="numeric"
              value={padState?.value ?? ''}
              onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="mb-4 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-center text-3xl font-semibold tracking-wide text-stone-900 outline-none ring-0 focus:border-stone-400"
            />

            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePadKey(key)}
                  className={`h-14 rounded-2xl text-lg font-semibold transition ${key === 'C' || key === '⌫' ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-stone-100 text-stone-900 hover:bg-stone-200'}`}
                >
                  {key}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={confirmPad}
              className="mt-4 w-full rounded-2xl bg-stone-900 py-3.5 text-base font-semibold text-white transition hover:bg-stone-800"
            >
              確認
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
