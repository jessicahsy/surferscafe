export const menuImages = {  // 飲品 (Drinks)
  'drink-americano-ice': 'src/images/drinks/americano-i.png', // '/src/images/drinks/americano-ice.jpg'
  'drink-americano-hot': 'src/images/drinks/americano-h.png', // '/src/images/drinks/americano-hot.jpg'
  'drink-latte-ice': 'src/images/drinks/latte-ice.png', // '/src/images/drinks/latte-ice.jpg'
  'drink-latte-hot': 'src/images/drinks/latte-hot.png', // '/src/images/drinks/latte-hot.jpg'
  'drink-sicilian': 'src/images/drinks/sicilian.png', // '/src/images/drinks/sicilian.jpg'
  'drink-coldbrew': 'src/images/drinks/coldbrew.png', // '/src/images/drinks/coldbrew.jpg'
  'drink-blacktea': 'src/images/drinks/blacktea.png', // '/src/images/drinks/blacktea.jpg'
  'drink-milktea-ice': 'src/images/drinks/milktea-ice.png', // '/src/images/drinks/milktea-ice.jpg'
  'drink-milktea-hot': 'src/images/drinks/milktea-hot.png', // '/src/images/drinks/milktea-hot.jpg'
  'drink-honeylemon': 'src/images/drinks/honeylemon.png', // '/src/images/drinks/honeylemon.jpg'
  'drink-lemoncola': 'src/images/drinks/lemoncola.png', // '/src/images/drinks/lemoncola.jpg'
  'drink-lemonsparkle': 'src/images/drinks/lemonsparkle.png', // '/src/images/drinks/lemonsparkle.jpg'

  // 食品 (Food)
  'food-bagel-strawberry': 'src/images/food/bagel-strawberry.png', // '/src/images/food/bagel-strawberry.jpg'
  'food-bagel-blueberry': 'src/images/food/bagel-blueberry.png', // '/src/images/food/bagel-blueberry.jpg'
  'food-bagel-garlic': 'src/images/food/bagel-garlic.png', // '/src/images/food/bagel-garlic.jpg'
  'food-bagel-peanut': 'src/images/food/bagel-peanut.png', // '/src/images/food/bagel-peanut.jpg'
  'food-bagel-choco': 'src/images/food/bagel-choco.png', // '/src/images/food/bagel-choco.jpg'
  'food-bagel-eggsalad': 'src/images/food/bagel-eggsalad.png', // '/src/images/food/bagel-eggsalad.jpg'

  // 商品 (Merchandise)
  'merch-bottle': 'src/images/merch/bottle.png', // '/src/images/merch/bottle.jpg'
  'merch-cola': 'src/images/merch/cola.png', // '/src/images/merch/cola.jpg'
  'merch-coconut': 'src/images/merch/coconut.png', // '/src/images/merch/coconut.jpg'
  'merch-energy': 'src/images/merch/energy.png', // '/src/images/merch/energy.jpg'
  'merch-beer': 'src/images/merch/beer.png', // '/src/images/merch/beer.jpg'
  'merch-orion': 'src/images/merch/orion.png', // '/src/images/merch/orion.jpg'
  'merch-shower': 'src/images/merch/shower.png', // '/src/images/merch/shower.jpg'
  'merch-footwash': 'src/images/merch/footwash.png ', // '/src/images/merch/footwash.jpg'
  'merch-other': 'src/images/merch/other.png' , // '/src/images/merch/other.jpg'
};

/**
 * Get image URL for a menu item
 * Returns the imported image path or null if not yet imported
 */
export const getMenuImageUrl = (itemId: string): string | null => {
  return menuImages[itemId as keyof typeof menuImages] || null;
};
