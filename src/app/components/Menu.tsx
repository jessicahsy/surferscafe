import { useMemo, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Coffee, Sandwich, ShoppingBag, Minus, Plus, ImageIcon, CreditCard } from 'lucide-react';
import type { CartItem, MenuItem, MenuCategory } from '../App';

type Props = {
  menuItems: MenuItem[];
  addToCart: (item: MenuItem) => void;
  cart: CartItem[];
  updateQuantity: (itemId: string, quantity: number) => void;
  onCheckout: () => void;
  cartTotal: number;
  cartCount: number;
};

export function Menu({
  menuItems,
  addToCart,
  cart,
  updateQuantity,
  onCheckout,
  cartTotal,
  cartCount,
}: Props) {
  const [activeTab, setActiveTab] = useState<MenuCategory>('d');

  const filteredItems = useMemo(
    () => menuItems.filter(item => item.category === activeTab),
    [activeTab, menuItems]
  );

  const getItemQuantity = (itemId: string) => cart.find(i => i.id === itemId)?.quantity || 0;

  const renderCard = (item: MenuItem) => {
    const quantity = getItemQuantity(item.id);

    return (
      <div
        key={item.id}
        role="button"
        tabIndex={0}
        onClick={() => addToCart(item)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            addToCart(item);
          }
        }}
        className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
          quantity > 0 ? 'border-stone-300 ring-2 ring-stone-300/30' : 'border-stone-200'
        }`}
      >
        <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
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
            </div>
            <span className="shrink-0 text-base font-semibold text-stone-900">${item.price}</span>
          </div>

          <div className="mt-auto">
            {quantity > 0 ? (
              <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
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
                    updateQuantity(item.id, quantity);
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
            ) : (
              <button
                type="button"
                className="flex h-11 w-full items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                加入
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const categoryIcon = (category: MenuCategory) => {
    switch (category) {
      case 'd':
        return <Coffee className="h-4 w-4" />;
      case 'f':
        return <Sandwich className="h-4 w-4" />;
      case 'm':
        return <ShoppingBag className="h-4 w-4" />;
    }
  };

  const categoryLabel = (category: MenuCategory) => {
    switch (category) {
      case 'd':
        return '飲品';
      case 'f':
        return '食品';
      case 'm':
        return '商品';
    }
  };

  const categories: MenuCategory[] = ['d', 'f', 'm'];

  return (
    <div className="px-4 py-5 md:px-6 lg:px-8">
      <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as MenuCategory)}>
        <Tabs.List className="mb-4 flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-stone-200">
          {categories.map(tab => (
            <Tabs.Trigger
              key={tab}
              value={tab}
              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                activeTab === tab ? 'bg-stone-900 text-white shadow' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {categoryIcon(tab)}
              {categoryLabel(tab)}
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
              <h2 className="text-lg font-semibold">目前訂單</h2>
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
                        <p className="text-sm text-stone-500">
                          ${item.price} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-stone-900">
                          ${item.price * item.quantity}
                        </p>
                      </div>
                    </div>
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
    </div>
  );
}