import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Trash2,
  X,
  Wallet,
  Smartphone,
  CreditCard,
  Plus,
  Minus,
} from 'lucide-react';
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

  const [splits, setSplits] = useState<PaymentSplit[]>([]);
  const [serviceType, setServiceType] = useState<'內用' | '外帶' | ''>('');
  const [editingAmountIndex, setEditingAmountIndex] = useState<number | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [isMethodPickerOpen, setIsMethodPickerOpen] = useState(false);
  const previousTotalRef = useRef(total);

  useEffect(() => {
    setSplits(prev => {
      if (prev.length === 0) {
        return [{ method: '現金', amount: total }];
      }

      if (
        prev.length === 1 &&
        prev[0].method === '現金' &&
        prev[0].amount === previousTotalRef.current
      ) {
        return [{ method: '現金', amount: total }];
      }

      return prev;
    });

    previousTotalRef.current = total;
  }, [total]);

  const sumSplits = useMemo(
    () => splits.reduce((sum, split) => sum + (Number(split.amount) || 0), 0),
    [splits]
  );

  const isSplitPayment = splits.length > 1;
  const primarySplit = splits[0] ?? null;
  const isCashPrimary = primarySplit?.method === '現金';
  const cashTendered = isCashPrimary ? Number(primarySplit?.amount || 0) : 0;
  const change = isCashPrimary && cashTendered > total ? cashTendered - total : 0;

  const isBalanced = useMemo(() => {
    if (cart.length === 0) return false;

    if (splits.length === 0) return true;

    if (splits.length === 1) {
      if (splits[0].method === '現金') {
        return Number(splits[0].amount) >= total;
      }

      return Number(splits[0].amount) === total;
    }

    return total === 0 ? true : sumSplits === total;
  }, [cart.length, splits, sumSplits, total]);

  const availableMethods = paymentMethods.filter(
    method => !splits.some(split => split.method === method.value)
  );

  const choosePrimaryMethod = (method: PaymentMethod) => {
    if (splits.length === 0) {
      setSplits([{ method, amount: total }]);
      return;
    }

    if (splits.length === 1) {
      setSplits([{ method, amount: total }]);
      return;
    }

    setSplits(prev => {
      const first = prev[0];
      if (!first) return prev;
      if (first.method === method) return prev;
      if (prev.some(split => split.method === method)) return prev;

      return [{ method, amount: first.amount }, ...prev.slice(1)];
    });
  };

  const openAddMethodPicker = () => {
    if (splits.length === 0) return;
    setIsMethodPickerOpen(true);
  };

  const addPaymentMethod = (method: PaymentMethod) => {
    setSplits(prev => {
      if (prev.some(split => split.method === method)) return prev;
      return [...prev, { method, amount: 0 }];
    });

    setIsMethodPickerOpen(false);
  };

  const startEditingAmount = (index: number) => {
    setEditingAmountIndex(index);
    setAmountInput(String(splits[index]?.amount ?? total));
  };

  const setAmount = (next: string) => {
    setAmountInput(next.replace(/\D/g, '').slice(0, 6));
  };

  const handleKey = (key: string) => {
    if (key === 'C') {
      setAmount('');
      return;
    }

    if (key === '⌫') {
      setAmount(amountInput.slice(0, -1));
      return;
    }

    setAmount((amountInput + key).slice(0, 6));
  };

  const confirmAmount = () => {
    if (editingAmountIndex === null) return;

    const value = Math.max(0, parseInt(amountInput || '0', 10) || 0);

    setSplits(prev => {
      if (prev.length === 0) return prev;

      if (prev.length === 1) {
        return prev.map(split => ({ ...split, amount: value }));
      }

      if (prev.length === 2) {
        const otherAmount = Math.max(0, total - value);
        return prev.map((split, index) =>
          index === editingAmountIndex
            ? { ...split, amount: value }
            : { ...split, amount: otherAmount }
        );
      }

      return prev.map((split, index) =>
        index === editingAmountIndex ? { ...split, amount: value } : split
      );
    });

    setEditingAmountIndex(null);
    setAmountInput('');
  };

  const handleConfirm = () => {
    if (cart.length === 0 || !isBalanced) return;

    if (splits.length === 0) {
      onConfirm([{ method: '現金', amount: total }]);
      return;
    }

    const normalizedSplits = splits
      .filter(split => split.amount > 0)
      .map(split => {
        if (splits.length === 1 && split.method === '現金') {
          return { ...split, amount: Math.min(split.amount, total) };
        }

        return split;
      });

    onConfirm(normalizedSplits);
  };

  return (
    <div className="h-full overflow-hidden px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto h-full max-w-7xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">結帳</h2>
          </div>

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
                  onClick={openAddMethodPicker}
                  className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
                >
                  <Plus className="h-4 w-4" />
                  新增付款方式
                </button>
              )}
            </div>

            <div className="mb-4 rounded-3xl border border-stone-200 bg-stone-50 p-4">
              <p className="mb-3 text-sm font-medium text-stone-500">服務類型</p>
              <div className="grid grid-cols-2 gap-3">
                {(['內用', '外帶'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setServiceType(current => (current === type ? '' : type))}
                    className={`rounded-3xl border px-4 py-3 text-sm font-semibold transition ${
                      serviceType === type
                        ? 'border-stone-900 bg-stone-900 text-white shadow'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map(method => {
                const active = splits.some(split => split.method === method.value);

                return (
                  <button
                    key={method.value}
                    onClick={() => choosePrimaryMethod(method.value)}
                    className={`flex items-center gap-3 rounded-3xl border p-4 text-left transition ${
                      active
                        ? 'border-stone-900 bg-stone-900 text-white shadow'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {method.icon}
                    <span className="font-semibold">{method.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-3">
              {splits.length === 1 && (
                <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-stone-500">付款方式</p>
                      <p className="font-semibold text-stone-900">{splits[0].method}</p>
                    </div>

                    <button
                      onClick={() => startEditingAmount(0)}
                      className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left transition hover:bg-stone-100"
                    >
                      <div className="flex items-center justify-between gap-10">
                        <span className="text-sm text-stone-500">金額</span>
                        <span className="text-xs text-stone-500">點擊輸入</span>
                      </div>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
                        ${splits[0].amount || 0}
                      </p>
                    </button>
                  </div>

                  {isCashPrimary && cashTendered > total && (
                    <div className="mt-3 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm text-stone-600">
                      <span>找零</span>
                      <span className="font-medium">${change}</span>
                    </div>
                  )}
                </div>
              )}

              {splits.length > 1 &&
                splits.map((split, index) => {
                  const hasError = !isBalanced && total > 0;

                  return (
                    <div
                      key={`${split.method}-${index}`}
                      className={`rounded-3xl border p-4 ${
                        hasError ? 'border-rose-400 bg-rose-50/40' : 'border-stone-200 bg-stone-50'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-stone-500">付款方式 {index + 1}</p>
                          <p className="font-semibold text-stone-900">{split.method}</p>
                        </div>

                        <button
                          onClick={() =>
                            setSplits(prev => {
                              const next = prev.filter((_, i) => i !== index);

                              if (next.length === 0) {
                                return [{ method: '現金', amount: total }];
                              }

                              if (next.length === 1) {
                                return next.map(item => ({ ...item, amount: total }));
                              }

                              return next;
                            })
                          }
                          className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-600 transition hover:bg-stone-100"
                        >
                          移除
                        </button>
                      </div>

                      <button
                        onClick={() => startEditingAmount(index)}
                        className={`w-full rounded-2xl border-2 px-4 py-4 text-left transition ${
                          hasError
                            ? 'border-rose-400 bg-white text-rose-700'
                            : 'border-stone-200 bg-white text-stone-900 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-stone-500">金額</span>
                          <span className="text-xs text-stone-500">點擊輸入</span>
                        </div>
                        <p className="mt-1 text-2xl font-semibold tracking-tight">
                          ${split.amount || 0}
                        </p>
                      </button>
                    </div>
                  );
                })}
            </div>

            {splits.length > 1 && (
            <div
              className={`mt-4 rounded-3xl border p-4 ${
                !isBalanced
                  ? 'border-rose-300 bg-rose-50/50'
                  : 'border-stone-200 bg-stone-50'
              }`}
            >
              <div className="flex items-center justify-between text-sm text-stone-600">
                <span>已輸入金額</span>
                <span className="font-medium">${sumSplits}</span>
              </div>

              {isCashPrimary && cashTendered > total && (
                <div className="mt-2 flex items-center justify-between text-sm text-stone-600">
                  <span>找零</span>
                  <span className="font-medium">${change}</span>
                </div>
              )}
            </div>
          )}

            <button
              onClick={handleConfirm}
              disabled={cart.length === 0 || !isBalanced}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              <CreditCard className="h-5 w-5" />
              確認訂單
            </button>
          </section>
        </div>
      </div>

      <Dialog.Root
        open={editingAmountIndex !== null}
        onOpenChange={open => !open && setEditingAmountIndex(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-stone-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-lg font-semibold text-stone-900">
                  輸入金額
                </Dialog.Title>
                <p className="text-sm text-stone-500">
                  {editingAmountIndex !== null ? splits[editingAmountIndex]?.method : ''}
                </p>
              </div>

              <Dialog.Close className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <input
              autoFocus
              inputMode="numeric"
              value={amountInput}
              placeholder={
                editingAmountIndex !== null
                  ? String(splits[editingAmountIndex]?.amount ?? 0)
                  : ''
              }
              onChange={e => setAmount(e.target.value)}
              className="mb-4 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-center text-3xl font-semibold tracking-wide text-stone-900 outline-none placeholder:text-stone-300 focus:border-stone-400"
            />

            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(key => (
                <button
                  key={key}
                  onClick={() => handleKey(key)}
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
              onClick={confirmAmount}
              className="mt-4 w-full rounded-2xl bg-stone-900 py-3.5 text-base font-semibold text-white transition hover:bg-stone-800"
            >
              確認
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={isMethodPickerOpen} onOpenChange={setIsMethodPickerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-stone-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-lg font-semibold text-stone-900">
                  選擇付款方式
                </Dialog.Title>
                <p className="text-sm text-stone-500">加入第二種或更多付款方式</p>
              </div>

              <Dialog.Close className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {availableMethods.length === 0 ? (
                <div className="col-span-2 rounded-3xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
                  已經沒有可新增的付款方式
                </div>
              ) : (
                availableMethods.map(method => (
                  <button
                    key={method.value}
                    onClick={() => addPaymentMethod(method.value)}
                    className="flex items-center gap-3 rounded-3xl border border-stone-200 bg-white p-4 text-left text-stone-700 transition hover:bg-stone-50"
                  >
                    {method.icon}
                    <span className="font-semibold">{method.label}</span>
                  </button>
                ))
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}