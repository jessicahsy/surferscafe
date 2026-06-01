import { useMemo } from 'react';
import { format } from 'date-fns';
import { Clock, CheckCircle2, CircleDashed } from 'lucide-react';
import type { Order } from '../App';

type Props = {
  orders: Order[];
  updateOrderStatus: (orderId: string, status: '製作中' | '完成') => void;
};

export function ActiveOrders({ orders, updateOrderStatus }: Props) {
  const sorted = useMemo(
    () => [...orders].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    [orders]
  );

  const active = sorted.filter(order => order.status === '製作中');
  const completed = sorted.filter(order => order.status === '完成');

  const renderOrderCard = (order: Order) => (
    <div
      key={order.id}
      className={`rounded-[28px] border bg-white p-4 shadow-sm ${
        order.status === '完成' ? 'border-emerald-200' : 'border-stone-200'
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
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

      <div className="space-y-2">
        {order.items.map(item => (
          <div key={item.id} className="rounded-2xl bg-stone-50 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="font-medium text-stone-900">{item.name}</span>
                <span className="ml-2 text-sm text-stone-500">x{item.quantity}</span>
              </div>
              <span className="text-sm font-medium text-stone-700">${item.price * item.quantity}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl bg-stone-50 px-3 py-2">
        <span className="text-sm text-stone-500">總額</span>
        <span className="text-lg font-semibold text-stone-900">${order.total}</span>
      </div>

      <div className="mt-3 flex gap-2">
        {order.status === '製作中' ? (
          <button
            onClick={() => updateOrderStatus(order.id, '完成')}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            <CheckCircle2 className="h-4 w-4" />
            標記完成
          </button>
        ) : (
          <button
            onClick={() => updateOrderStatus(order.id, '製作中')}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <CircleDashed className="h-4 w-4" />
            恢復進行中
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">進行中訂單</h2>
          </div>

          {active.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-stone-200 bg-white px-4 py-10 text-center text-sm text-stone-500">
              目前沒有進行中的訂單
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {active.map(renderOrderCard)}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">已完成訂單</h2>

          {completed.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-stone-200 bg-white px-4 py-10 text-center text-sm text-stone-500">
              目前沒有已完成的訂單
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {completed.map(renderOrderCard)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}