import { useMemo, type ReactNode } from 'react';
import { format } from 'date-fns';
import { Store, ClipboardList, CreditCard } from 'lucide-react';
import type { Order, PaymentMethod } from '../App';

type Props = {
  orders: Order[];
  onSettleToday: () => void;
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  現金: '現金',
  'LINE Pay': 'LINE Pay',
  '街口支付': '街口支付',
  刷卡: '刷卡',
};

const paymentMethodOrder: PaymentMethod[] = ['現金', 'LINE Pay', '街口支付', '刷卡'];

function StatCard({
  title,
  value,
  subtext,
  icon,
  accent,
}: {
  title: string;
  value: string;
  subtext?: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-stone-500">{title}</p>
          {subtext && <p className="mt-1 text-xs text-stone-400">{subtext}</p>}
        </div>
        <div className={`rounded-2xl p-3 ${accent}`}>{icon}</div>
      </div>
      <p className="text-3xl font-semibold tracking-tight text-stone-900">{value}</p>
    </div>
  );
}

export function DailySummary({ orders, onSettleToday }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd');

  const todayOrders = useMemo(
    () => orders.filter(order => format(order.timestamp, 'yyyy-MM-dd') === today),
    [orders, today]
  );

  const revenue = useMemo(
    () => todayOrders.reduce((sum, order) => sum + order.total, 0),
    [todayOrders]
  );

  const paymentBreakdown = useMemo(() => {
    const totals = Object.fromEntries(
      paymentMethodOrder.map(method => [method, 0])
    ) as Record<PaymentMethod, number>;

    todayOrders.forEach(order => {
      (order.paymentSplits || []).forEach(split => {
        if (split.method in totals) {
          totals[split.method] += Number(split.amount) || 0;
        }
      });
    });

    return paymentMethodOrder
      .map(method => ({
        method,
        amount: Math.round(totals[method]),
      }))
      .filter(item => item.amount > 0);
  }, [todayOrders]);

  return (
    <div className="px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">總覽</h2>
            <p className="mt-1 text-sm text-stone-500">{format(new Date(), 'yyyy年MM月dd日')}</p>
          </div>

          <button
            onClick={onSettleToday}
            className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-stone-800"
          >
            今日結算
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            title="今日營業額"
            value={`$${revenue.toLocaleString()}`}
            icon={<Store className="h-5 w-5 text-amber-700" />}
            accent="bg-amber-100"
          />
          <StatCard
            title="今日訂單數"
            value={`${todayOrders.length}`}
            subtext="包含已完成與進行中"
            icon={<ClipboardList className="h-5 w-5 text-stone-700" />}
            accent="bg-stone-100"
          />
        </div>

        <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-500">付款方式統計</p>
              <p className="mt-1 text-xs text-stone-400">依今日訂單付款拆分加總</p>
            </div>
            <div className="rounded-2xl bg-stone-100 p-3">
              <CreditCard className="h-5 w-5 text-stone-700" />
            </div>
          </div>

          {paymentBreakdown.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
              今天還沒有付款資料
            </div>
          ) : (
            <div className="space-y-3">
              {paymentBreakdown.map(item => (
                <div
                  key={item.method}
                  className="flex items-center justify-between rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4"
                >
                  <span className="font-medium text-stone-700">
                    {paymentMethodLabels[item.method]}
                  </span>
                  <span className="text-lg font-semibold tracking-tight text-stone-900">
                    ${item.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}