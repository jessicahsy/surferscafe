export const menuImages: Record<string, string> = {
  // 飲品 (Drinks)
  'drink-americano-ice': 'images/drinks/americano-i.png',
  'drink-americano-hot': 'images/drinks/americano-h.png',
  'drink-latte-ice': 'images/drinks/latte-i.png',
  'drink-latte-hot': 'images/drinks/latte-h.png',
  'drink-romano': 'images/drinks/romano.png',
  'drink-coldbrew': 'images/drinks/brew.png',
  'drink-blacktea': 'images/drinks/black_tea.png',
  'drink-milktea-ice': 'images/drinks/milk_tea-i.png',
  'drink-milktea-hot': 'images/drinks/milk_tea-h.png',
  'drink-honeylemon': 'images/drinks/honey_lemon.png',
  'drink-lemoncola': 'images/drinks/lemon_coke.png',
  'drink-lemonsparkle': 'images/drinks/sparkling.png',

  // 食品 (Food)
  'food-bagel-strawberry': 'images/food/strawberry_c.png',
  'food-bagel-blueberry': 'images/food/blueberry_c.png',
  'food-bagel-garlic': 'images/food/garlic_c.png',
  'food-bagel-peanut': 'images/food/peanut_c.png',
  'food-bagel-choco': 'images/food/chocolate_c.png',
  'food-bagel-eggsalad': 'images/food/egg_c.png',

  // 商品 (Merchandise)
  'merch-bottle': 'images/merch/other_bev.png',
  'merch-smallwater': 'images/merch/small_water.png',
  'merch-bigwater': 'images/merch/big_water.png',
  'merch-cola': 'images/merch/cola.png',
  'merch-coconut': 'images/merch/coconut.png',
  'merch-energy': 'images/merch/energy.png',
  'merch-beer': 'images/merch/beer.png',
  'merch-orion': 'images/merch/orion.png',
  'merch-shower': 'images/merch/shower.png',
  'merch-footwash': 'images/merch/footwash.png',
  'merch-other': 'images/merch/other.png',
};

/**
 * Get image URL for a menu item
 */
export const getMenuImageUrl = (itemId: string): string | null => {
  const path = menuImages[itemId];
  return path ? `${import.meta.env.BASE_URL}${path}` : null;
};
