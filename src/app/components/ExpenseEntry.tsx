import { useMemo, useState } from 'react';
import { ArrowLeft, DollarSign } from 'lucide-react';

type Props = {
  onSubmit: (item: string, amount: number) => Promise<void>;
  onCancel: () => void;
};

export function ExpenseEntry({ onSubmit, onCancel }: Props) {
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const parsedAmount = useMemo(() => Number(amount.replace(/[^0-9.]/g, '')), [amount]);
  const isValid = item.trim().length > 0 && parsedAmount > 0;

  const handleSave = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setStatus('');

    try {
      await onSubmit(item.trim(), parsedAmount);
      setItem('');
      setAmount('');
      setStatus('支出已記錄。');
    } catch (error) {
      console.error(error);
      setStatus('儲存失敗，請稍後再試。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-hidden px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto h-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-stone-900">
            <DollarSign className="h-6 w-6 text-amber-700" />
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">支出紀錄</h2>
              <p className="text-sm text-stone-500">將支出項目與金額記錄至 Google Sheet。</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            <ArrowLeft className="h-4 w-4" /> 返回
          </button>
        </div>

        <div className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">項目</label>
              <input
                value={item}
                onChange={e => setItem(e.target.value)}
                placeholder="輸入支出項目名称"
                className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none focus:border-stone-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">金額</label>
              <input
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="輸入金額"
                className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none focus:border-stone-400"
                inputMode="decimal"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleSave}
                disabled={!isValid || submitting}
                className="flex-1 rounded-3xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
              >
                儲存支出
              </button>
              <button
                onClick={onCancel}
                className="flex-1 rounded-3xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                取消
              </button>
            </div>

            {status && <p className="text-sm text-stone-600">{status}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
