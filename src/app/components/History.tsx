import { useMemo, useState, useEffect, type ReactNode } from 'react';
import { format, subDays, subMonths, subYears } from 'date-fns';
import * as Tabs from '@radix-ui/react-tabs';
import { ChevronLeft, ChevronRight, Store, ClipboardList } from 'lucide-react';
import type { PaymentMethod } from '../App';

type DailySummary = {
  date: string;
  revenue: number;
  orderCount: number;
  settledAt: string;
  cashAmount: number;
  lineAmount: number;
  jkoAmount: number;
  cardAmount: number;
};

const SHEETS_WEBAPP_URL =
  'https://script.google.com/macros/s/AKfycbzbjsitXZrj9WPW0UxZ0snf55OQJ4NtpyJMYu89qeV1UJNQGqfnc1qfD5eAksu_M2Dntw/exec';

async function fetchDailySummaries(): Promise<DailySummary[]> {
  try {
    const res = await fetch(SHEETS_WEBAPP_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'getSummaries',
      }),
    });

    if (!res.ok) {
      console.error('Failed to fetch summaries:', res.status);
      return [];
    }

    const text = await res.text();
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to fetch summaries:', error);
    return [];
  }
}

type ViewMode = 'daily' | 'monthly' | 'yearly';

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
  big = false,
}: {
  title: string;
  value: string;
  subtext?: string;
  icon: ReactNode;
  accent: string;
  big?: boolean;
}) {
  return (
    <div
      className={`rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm ${
        big ? 'md:p-6' : ''
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-stone-500">{title}</p>
          {subtext && <p className="mt-1 text-xs text-stone-400">{subtext}</p>}
        </div>
        <div className={`rounded-2xl p-3 ${accent}`}>{icon}</div>
      </div>
      <p className={`font-semibold tracking-tight text-stone-900 ${big ? 'text-4xl' : 'text-3xl'}`}>
        {value}
      </p>
    </div>
  );
}

type Props = {};

export function History({}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchDailySummaries();
      setSummaries(data);
      setLoading(false);
    };
    load();
  }, []);

  const getPeriodSummaries = useMemo(() => {
    if (viewMode === 'daily') {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      return summaries.filter(s => s.date === dateStr);
    } else if (viewMode === 'monthly') {
      const monthStr = format(selectedDate, 'yyyy-MM');
      return summaries.filter(s => s.date.startsWith(monthStr));
    } else {
      const yearStr = format(selectedDate, 'yyyy');
      return summaries.filter(s => s.date.startsWith(yearStr));
    }
  }, [summaries, viewMode, selectedDate]);

  const periodSummaries = getPeriodSummaries;

  const cafeRevenue = useMemo(
    () => periodSummaries.reduce((sum, s) => sum + s.revenue, 0),
    [periodSummaries]
  );

  const totalCount = periodSummaries.length;

  const paymentBreakdown = useMemo(() => {
    const totals: Record<PaymentMethod, number> = {
      現金: 0,
      'LINE Pay': 0,
      '街口支付': 0,
      刷卡: 0,
    };

    periodSummaries.forEach(s => {
      totals['現金'] += s.cashAmount || 0;
      totals['LINE Pay'] += s.lineAmount || 0;
      totals['街口支付'] += s.jkoAmount || 0;
      totals['刷卡'] += s.cardAmount || 0;
    });

    return paymentMethodOrder
      .map(method => ({
        method,
        amount: Math.round(totals[method]),
      }))
      .filter(({ amount }) => amount > 0);
  }, [periodSummaries]);

  const handlePrevious = () => {
    if (viewMode === 'daily') {
      setSelectedDate(subDays(selectedDate, 1));
    } else if (viewMode === 'monthly') {
      setSelectedDate(subMonths(selectedDate, 1));
    } else {
      setSelectedDate(subYears(selectedDate, 1));
    }
  };

  const handleNext = () => {
    const now = new Date();
    if (viewMode === 'daily') {
      const nextDate = subDays(selectedDate, -1);
      if (nextDate <= now) setSelectedDate(nextDate);
    } else if (viewMode === 'monthly') {
      const nextDate = subMonths(selectedDate, -1);
      if (nextDate <= now) setSelectedDate(nextDate);
    } else {
      const nextDate = subYears(selectedDate, -1);
      if (nextDate <= now) setSelectedDate(nextDate);
    }
  };

  const getPeriodLabel = () => {
    if (viewMode === 'daily') {
      return format(selectedDate, 'MMMM d, yyyy');
    } else if (viewMode === 'monthly') {
      return format(selectedDate, 'MMMM yyyy');
    } else {
      return format(selectedDate, 'yyyy');
    }
  };

  return (
    <div className="px-4 py-5 md:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">紀錄</h1>
        <Tabs.Root value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <Tabs.List className="flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-stone-200">
            <Tabs.Trigger
              value="daily"
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                viewMode === 'daily'
                  ? 'bg-stone-900 text-white shadow'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              每日
            </Tabs.Trigger>
            <Tabs.Trigger
              value="monthly"
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                viewMode === 'monthly'
                  ? 'bg-stone-900 text-white shadow'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              每月
            </Tabs.Trigger>
            <Tabs.Trigger
              value="yearly"
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                viewMode === 'yearly'
                  ? 'bg-stone-900 text-white shadow'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              每年
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </div>

      <div className="mb-6 flex items-center justify-between rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
        <button
          onClick={handlePrevious}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-stone-700 transition hover:bg-stone-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold">{getPeriodLabel()}</h2>
        <button
          onClick={handleNext}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-stone-700 transition hover:bg-stone-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="營收"
          value={`$${cafeRevenue}`}
          icon={<Store className="h-6 w-6 text-amber-600" />}
          accent="bg-amber-100"
          big
        />
        <StatCard
          title="已結算日期"
          value={`${totalCount}`}
          icon={<ClipboardList className="h-6 w-6 text-blue-600" />}
          accent="bg-blue-100"
        />
        <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm md:col-span-2">
          <p className="mb-4 text-sm font-medium text-stone-500">付款方式</p>
          <div className="space-y-2">
            {paymentBreakdown.length > 0 ? (
              paymentBreakdown.map(({ method, amount }) => (
                <div key={method} className="flex items-center justify-between">
                  <span className="text-sm text-stone-600">{paymentMethodLabels[method]}</span>
                  <span className="font-semibold text-stone-900">${amount}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone-400">無交易</p>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="mt-8 rounded-3xl border border-dashed border-stone-200 bg-stone-50 px-4 py-16 text-center">
          <p className="text-sm text-stone-500">載入中...</p>
        </div>
      )}

      {!loading && periodSummaries.length === 0 && (
        <div className="mt-8 rounded-3xl border border-dashed border-stone-200 bg-stone-50 px-4 py-16 text-center">
          <p className="text-sm text-stone-500">此時期沒有已結算的紀錄</p>
        </div>
      )}
    </div>
  );
}
