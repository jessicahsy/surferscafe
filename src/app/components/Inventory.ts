export const SHEETS_WEBAPP_URL =
  'https://script.google.com/macros/s/AKfycbxM9M0se5ModS5bvdf0C2H8JbWr3ed4tJDUzsTFV-hiAGw_9uOZ560AJkwR1MiI2jkaxg/exec';

export type InventoryCategory = 'd' | 'f' | 'm';

export type InventoryItem = {
  item_id: string;
  item_name: string;
  category: InventoryCategory;
  price: number;
  active: number;
  image_url: string;
};

export type SheetOrderRow = {
  order_id: string;
  timestamp: string;
  items: [string, number][];
  total: number;
  payment_methods: [string, number][];
  status: '製作中' | '完成';
};

export type DailySummaryRow = {
  date: string;
  orders_count: number;
  revenue: number;
  cash_amount: number;
  line_amount: number;
  jko_amount: number;
  card_amount: number;
  settled_at: string;
};

async function getJson<T>(action: string): Promise<T> {
  const res = await fetch(`${SHEETS_WEBAPP_URL}?action=${encodeURIComponent(action)}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${action}: ${res.status}`);
  }

  return (await res.json()) as T;
}

async function postJson<T>(payload: Record<string, unknown>): Promise<T> {
  const res = await fetch(SHEETS_WEBAPP_URL, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed request: ${res.status}`);
  }

  return (await res.json()) as T;
}

export async function fetchInventory(): Promise<InventoryItem[]> {
  const data = await getJson<unknown>('inventory');
  if (!Array.isArray(data)) return [];

  return data.map((row: any) => ({
    item_id: String(row.item_id || '').trim(),
    item_name: String(row.item_name || '').trim(),
    category: (String(row.category || '').trim() as InventoryCategory) || 'd',
    price: Number(row.price || 0),
    active: Number(row.active || 0),
    image_url: String(row.image_url || '').trim(),
  }));
}

export async function fetchOrders(): Promise<SheetOrderRow[]> {
  const data = await getJson<unknown>('orders');
  if (!Array.isArray(data)) return [];

  return data.map((row: any) => ({
    order_id: String(row.order_id || '').trim(),
    timestamp: String(row.timestamp || '').trim(),
    items: Array.isArray(row.items) ? row.items : [],
    total: Number(row.total || 0),
    payment_methods: Array.isArray(row.payment_methods) ? row.payment_methods : [],
    status: row.status === '完成' ? '完成' : '製作中',
  }));
}

export async function appendOrder(order: SheetOrderRow): Promise<void> {
  await postJson({
    action: 'append_order',
    order,
  });
}

export async function updateOrderStatus(
  orderId: string,
  status: '製作中' | '完成'
): Promise<void> {
  await postJson({
    action: 'update_order_status',
    order_id: orderId,
    status,
  });
}

export async function settleTodaySheet(): Promise<void> {
  await postJson({
    action: 'settle_today',
  });
}