const asset = (path: string) => `${(import.meta as any).env.BASE_URL}${path.replace(/^\/+/, '')}`;

export const menuImages = {
  // 飲品
  'drink-americano-ice': asset('images/drinks/americano-i.png'),
  'drink-americano-hot': asset('images/drinks/americano-h.png'),
  'drink-latte-ice': asset('images/drinks/latte-i.png'),
  'drink-latte-hot': asset('images/drinks/latte-h.png'),
  'drink-romano': asset('images/drinks/romano.png'),
  'drink-coldbrew': asset('images/drinks/brew.png'),
  'drink-blacktea': asset('images/drinks/black_tea.png'),
  'drink-milktea-ice': asset('images/drinks/milk_tea-i.png'),
  'drink-milktea-hot': asset('images/drinks/milk_tea-h.png'),
  'drink-honeylemon': asset('images/drinks/honey_lemon.png'),
  'drink-lemoncola': asset('images/drinks/lemon_coke.png'),
  'drink-lemonsparkle': asset('images/drinks/sparkling.png'),

  // 食品
  'food-bagel-strawberry': asset('images/food/strawberry_c.png'),
  'food-bagel-blueberry': asset('images/food/blueberry_c.png'),
  'food-bagel-garlic': asset('images/food/garlic_c.png'),
  'food-bagel-peanut': asset('images/food/peanut_c.png'),
  'food-bagel-choco': asset('images/food/chocolate_c.png'),
  'food-bagel-eggsalad': asset('images/food/egg_c.png'),

  // 商品
  'merch-bottle': asset('images/merch/other_bev.png'),
  'merch-smallwater': asset('images/merch/small_water.png'),
  'merch-bigwater': asset('images/merch/big_water.png'),
  'merch-cola': asset('images/merch/cola.png'),
  'merch-coconut': asset('images/merch/coconut.png'),
  'merch-energy': asset('images/merch/energy.png'),
  'merch-beer': asset('images/merch/beer.png'),
  'merch-orion': asset('images/merch/orion.png'),
  'merch-corona': asset('images/merch/corona.png'),
  'merch-shower': asset('images/merch/shower.png'),
  'merch-footwash': asset('images/merch/footwash.png'),
  'merch-other': asset('images/merch/other.png'),
} as const;

export type MenuImageKey = keyof typeof menuImages;

export const getMenuImageUrl = (itemId: string): string | null => {
  return menuImages[itemId as MenuImageKey] ?? null;
};