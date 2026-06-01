import { useEffect, useMemo, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Trash2, X, Wallet, Smartphone, CreditCard, Plus, Minus } from 'lucide-react';
import type { CartItem, PaymentMethod, PaymentSplit } from '../App';

type Props = {
  cart: CartItem[];
  updateQuantity: (itemId: string, quantity: number) => void;
  onConfirm: (paymentSplits: PaymentSplit[]) => void;
  onCancel: () => void;
};

const paymentMethods: { value: PaymentMethod; label: string; icon: ReactNode }[] = [
  { value: '現金', label: '現金', icon: <Wallet className="h-5 w-5" /> },
  { value: 'LINE Pay', label: 'LINE Pay', icon: <Smartphone className="h-5 w-5" /> },
  { value: '街口支付', label: '街口支付', icon: <Smartphone className="h-5 w-5" /> },
  { value: '刷卡', label: '刷卡', icon: <CreditCard className="h-5 w-5" /> },
];

export function Checkout({ cart, updateQuantity, onConfirm, onCancel }: Props) {
  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const [splits, setSplits] = useState<PaymentSplit[]>([{ method: '現金', amount: total }]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [amountInput, setAmountInput] = useState('');

  useEffect(() => {
    setSplits(prev => {
      if (prev.length === 0) return [{ method: '現金', amount: total }];

      if (prev.length === 1 && prev[0].method === '現金') {
        return [{ method: '現金', amount: total }];
      }

      return prev;
    });
  }, [total]);

  const sumSplits = useMemo(
    () => splits.reduce((sum, split) => sum + (Number(split.amount) || 0), 0),
    [splits]
  );

  const isBalanced = splits.length === 1
    ? (splits[0].method === '現金'
        ? Number(splits[0].amount || 0) >= total
        : Number(splits[0].amount || 0) === total)
    : sumSplits === total;

  const startEditingAmount = (index: number) => {
    setEditingIndex(index);
    setAmountInput(String(splits[index]?.amount ?? 0));
  };

  const confirmAmount = () => {
    if (editingIndex === null) return;
    const value = Math.max(0, parseInt(amountInput || '0', 10) || 0);

    setSplits(prev =>
      prev.map((split, index) => (index === editingIndex ? { ...split, amount: value } : split))
    );

    setEditingIndex(null);
    setAmountInput('');
  };

  const addMethod = () => {
    const available = paymentMethods.find(m => !splits.some(split => split.method === m.value));
    if (!available) return;
    setSplits(prev => [...prev, { method: available.value, amount: 0 }]);
  };

  const removeMethod = (index: number) => {
    setSplits(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) return [{ method: '現金', amount: total }];
      return next;
    });
  };

  const updateMethod = (index: number, method: PaymentMethod) => {
    setSplits(prev => prev.map((split, i) => (i === index ? { ...split, method } : split)));
  };

  const handleConfirm = () => {
    if (cart.length === 0 || !isBalanced) return;
    onConfirm(splits.filter(split => Number(split.amount) > 0));
  };

  return (
    <div className="h-full overflow-hidden px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto h-full max-w-7xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">結帳</h2>
          <button
            onClick={onCancel}
            className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            返回
          </button>
        </div>

        <div className="grid h-full grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-5 overflow-x-auto">
          <section className="flex min-h-0 flex-col rounded-[28px] border border-stone-200 bg-white p-4 shadow-sm md:p-5">
            <h3 className="mb-4 text-lg font-semibold">訂單明細</h3>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-stone-200 bg-stone-50 px-4 py-12 text-center text-stone-500">
                  購物車是空的
                </div>
              ) : (
                cart.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-3xl border border-stone-200 bg-[#fcfaf6] p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-stone-900">{item.name}</h4>
                          <p className="text-sm text-stone-500">單價 ${item.price}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-stone-500">小計</p>
                          <p className="text-lg font-semibold text-stone-900">
                            ${item.price * item.quantity}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="rounded-2xl border border-stone-200 bg-white p-2 text-stone-600 transition hover:bg-stone-100"
                      >
                        <Minus className="h-4 w-4" />
                      </button>

                      <span className="min-w-8 text-center font-semibold">{item.quantity}</span>

                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="rounded-2xl border border-stone-200 bg-white p-2 text-stone-600 transition hover:bg-stone-100"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => updateQuantity(item.id, 0)}
                      className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-rose-600 transition hover:bg-rose-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 rounded-3xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center justify-between text-sm text-stone-500">
                <span>項目數</span>
                <span>{totalItems} 項</span>
              </div>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-sm text-stone-500">總計</span>
                <span className="text-4xl font-semibold tracking-tight text-stone-900">
                  ${total}
                </span>
              </div>
            </div>
          </section>

          <section className="flex h-fit flex-col rounded-[28px] border border-stone-200 bg-white p-4 shadow-sm md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">付款方式</h3>

              {splits.length > 0 && (
                <button
                  onClick={addMethod}
                  className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
                >
                  <Plus className="h-4 w-4" />
                  新增付款方式
                </button>
              )}
            </div>

            <div className="space-y-3">
              {splits.map((split, index) => {
                const methodMeta = paymentMethods.find(m => m.value === split.method);

                return (
                  <div key={`${split.method}-${index}`} className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-stone-500">付款方式 {index + 1}</p>
                        <p className="font-semibold text-stone-900">{split.method}</p>
                      </div>

                      <button
                        onClick={() => removeMethod(index)}
                        className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-600 transition hover:bg-stone-100"
                      >
                        移除
                      </button>
                    </div>

                    <select
                      value={split.method}
                      onChange={(e) => updateMethod(index, e.target.value as PaymentMethod)}
                      className="mb-3 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none"
                    >
                      {paymentMethods.map(method => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => startEditingAmount(index)}
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left transition hover:bg-stone-100"
                    >
                      <div className="flex items-center justify-between gap-10">
                        <span className="text-sm text-stone-500">金額</span>
                        <span className="text-xs text-stone-500">點擊輸入</span>
                      </div>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
                        ${split.amount || 0}
                      </p>
                    </button>

                    <div className="mt-3 flex items-center gap-2 text-sm text-stone-500">
                      {methodMeta?.icon}
                      <span>{methodMeta?.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-3xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center justify-between text-sm text-stone-500">
                <span>付款合計</span>
                <span className={isBalanced ? 'text-emerald-700' : 'text-rose-600'}>
                  ${sumSplits}
                </span>
              </div>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-sm text-stone-500">訂單總額</span>
                <span className="text-3xl font-semibold tracking-tight text-stone-900">
                  ${total}
                </span>
              </div>
              {!isBalanced && (
                <p className="mt-2 text-sm text-rose-600">付款金額需要和總額一致。</p>
              )}
            </div>

            <button
              onClick={handleConfirm}
              disabled={cart.length === 0 || !isBalanced}
              className="mt-4 rounded-2xl bg-stone-900 py-3.5 text-base font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              確認結帳
            </button>
          </section>
        </div>
      </div>

      <Dialog.Root open={editingIndex !== null} onOpenChange={(open) => !open && setEditingIndex(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-stone-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-lg font-semibold text-stone-900">
                  輸入金額
                </Dialog.Title>
              </div>
              <Dialog.Close className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <input
              autoFocus
              inputMode="numeric"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="mb-4 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-center text-3xl font-semibold tracking-wide text-stone-900 outline-none focus:border-stone-400"
            />

            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (key === 'C') {
                      setAmountInput('');
                      return;
                    }
                    if (key === '⌫') {
                      setAmountInput(prev => prev.slice(0, -1));
                      return;
                    }
                    setAmountInput(prev => (prev + key).slice(0, 6));
                  }}
                  className={`h-14 rounded-2xl text-lg font-semibold transition ${
                    key === 'C' || key === '⌫'
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      : 'bg-stone-100 text-stone-900 hover:bg-stone-200'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={confirmAmount}
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