import { useMemo, useState } from 'react';
import { Clock, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';
import type { Order } from '../App';

type Props = {
  orders: Order[];
  updateOrderStatus: (orderId: string, status: '製作中' | '完成') => void;
  updateOrderMemo: (orderId: string, itemId: string, memo: string) => void;
  removeOrder: (orderId: string) => void;
};

type EditingMemoState = {
  orderId: string;
  itemId: string;
  itemName: string;
} | null;

export function ActiveOrders({ orders, updateOrderStatus, updateOrderMemo, removeOrder }: Props) {
  const [editingMemo, setEditingMemo] = useState<EditingMemoState>(null);
  const [memoText, setMemoText] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status === '製作中').sort((a, b) => a.sequence - b.sequence),
    [orders]
  );

  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === '完成').sort((a, b) => a.sequence - b.sequence),
    [orders]
  );

  const openMemo = (orderId: string, itemId: string, itemName: string, existingMemo = '') => {
    setEditingMemo({ orderId, itemId, itemName });
    setMemoText(existingMemo);
  };

  const handleSaveMemo = () => {
    if (!editingMemo) return;
    updateOrderMemo(editingMemo.orderId, editingMemo.itemId, memoText.trim());
    setEditingMemo(null);
    setMemoText('');
  };

  const OrderCard = ({ order }: { order: Order }) => {
    return (
      <div
        className={`flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border bg-white p-3 shadow-sm ${
          order.status === '完成' ? 'border-emerald-200' : 'border-stone-200'
        }`}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-stone-900">{order.id}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500">
              <Clock className="h-3.5 w-3.5" />
              {format(order.timestamp, 'HH:mm')}
            </p>
          </div>

          <div
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              order.status === '完成'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {order.status}
          </div>
        </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {order.items.map((item) => (
            <div key={item.id} className="rounded-2xl bg-stone-50 px-3 py-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-stone-900">{item.name}</span>
                    <span className="text-sm text-stone-500">x{item.quantity}</span>

                    {item.requiresMemo && !item.memo?.trim() && (
                      <button
                        onClick={() => openMemo(order.id, item.id, item.name, item.memo || '')}
                        className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800"
                      >
                        需備註
                      </button>
                    )}
                  </div>

                  {item.memo?.trim() && (
                    <p className="mt-1 text-xs text-stone-500">備註：{item.memo}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() =>
              updateOrderStatus(order.id, order.status === '製作中' ? '完成' : '製作中')
            }
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              order.status === '完成'
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-stone-900 text-white hover:bg-stone-800'
            }`}
          >
            {order.status === '製作中' ? '完成訂單' : '製作中'}
          </button>

          <button
            onClick={() => removeOrder(order.id)}
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-600 transition hover:bg-stone-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full min-h-0 overflow-hidden px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto flex h-full min-h-0 max-w-7xl flex-col gap-6 overflow-hidden">
        <section className="flex min-h-0 flex-[1.15] flex-col">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">進行中</h2>
            </div>
            <div className="rounded-2xl bg-stone-100 px-3 py-2 text-sm font-medium text-stone-700">
              {activeOrders.length} 張進行中
            </div>
          </div>

          {activeOrders.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-[28px] border border-dashed border-stone-200 bg-white px-4 py-12 text-center text-stone-500 shadow-sm">
              目前沒有進行中的訂單
            </div>
          ) : (
            <div className="h-[60vh] overflow-x-auto overflow-y-hidden">
              <div className="grid h-full grid-flow-col auto-cols-[minmax(16rem,18rem)] gap-3 pb-2 items-stretch">
                {activeOrders.map((order) => (
                  <div key={order.id} className="h-full">
                    <OrderCard order={order} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {completedOrders.length > 0 && (
        <>
          <button
            onClick={() => setShowCompleted(true)}
            className="fixed bottom-5 right-5 z-30 rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white shadow-xl transition hover:bg-stone-800"
          >
            已完成 ({completedOrders.length})
          </button>

          <Dialog.Root open={showCompleted} onOpenChange={setShowCompleted}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" />

              <Dialog.Content className="fixed inset-6 z-50 flex flex-col overflow-hidden rounded-[32px] bg-stone-100 p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <Dialog.Title className="text-2xl font-semibold tracking-tight text-stone-900">
                      已完成訂單
                    </Dialog.Title>
                    <p className="text-sm text-stone-500">{completedOrders.length} 張完成</p>
                  </div>

                  <Dialog.Close className="rounded-full p-2 text-stone-500 transition hover:bg-white hover:text-stone-900">
                    <X className="h-6 w-6" />
                  </Dialog.Close>
                </div>

                <div className="h-[80vh] overflow-x-auto overflow-y-hidden">
                  <div className="grid h-full grid-flow-col auto-cols-[minmax(12rem,16rem)] gap-3 pb-2 items-stretch">
                    {completedOrders.map((order) => (
                      <div key={order.id} className="h-full">
                        <OrderCard order={order} />
                      </div>
                    ))}
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </>
      )}

      <Dialog.Root open={editingMemo !== null} onOpenChange={(open) => !open && setEditingMemo(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-stone-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-lg font-semibold text-stone-900">填寫備註</Dialog.Title>
                <p className="text-sm text-stone-500">{editingMemo?.itemName}</p>
              </div>

              <Dialog.Close className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <textarea
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              placeholder="請輸入備註..."
              className="min-h-32 w-full rounded-2xl border border-stone-200 bg-stone-50 p-4 text-stone-900 outline-none focus:border-stone-400"
            />

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setEditingMemo(null);
                  setMemoText('');
                }}
                className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-3 font-semibold text-stone-700 transition hover:bg-stone-100"
              >
                取消
              </button>
              <button
                onClick={handleSaveMemo}
                className="flex-1 rounded-2xl bg-stone-900 px-4 py-3 font-semibold text-white transition hover:bg-stone-800"
              >
                儲存
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}