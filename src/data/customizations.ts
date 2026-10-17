import type { MenuItem } from "@/data/menu";

/**
 * Ingredients taken straight from the menu descriptions, so guests can tap to remove them.
 * Anything not listed here can still be removed via the "remove something else" field.
 */
export const INGREDIENTS: Record<string, string[]> = {
  "Philly Cheesesteak": ["Sautéed onions", "American cheese"],
  "Steak Supreme": ["Sautéed onions", "Marinated mushrooms", "Green peppers", "Provolone", "Lettuce", "Tomato", "Mayo"],
  "Chicken Steak Sub": ["Sautéed onions", "Marinated mushrooms", "Provolone", "Lettuce", "Tomato", "Mayo"],
  "Italian Meatball": ["Marinara", "Provolone"],
  "Gourmet Burger (6 oz)": ["Sautéed onions", "Green peppers", "Sautéed mushrooms", "Cheddar"],
  "Double Cheeseburger": ["Cheese", "Lettuce", "Tomato", "Mayo"],
  "Village Cheeseburger (6 oz)": ["Provolone", "Lettuce", "Tomato", "Mayo"],
  "Bacon Burger (6 oz)": ["Bacon", "American cheese", "Lettuce", "Tomato", "Mayo", "Onion"],
  "Texas BBQ Chicken Breast": ["Bacon", "Monterey Jack", "BBQ sauce"],
  "Chicken Bacon Provolone": ["Provolone", "Lettuce", "Tomato", "Mayo"],
  "Burrito Bowl": ["Salsa", "Sour cream", "Rice", "Black beans", "Mozzarella"],
  "Chicken Fajitas": ["Sautéed onions", "Green peppers", "Tomato", "Lettuce", "Mozzarella", "Salsa", "Sour cream", "Tortilla chips"],
  "Jr. Cheeseburger": ["American cheese", "Pickles", "Onions", "Mustard", "Ketchup"],
  "Beef Hot Dog": ["Mustard", "Ketchup", "Onions"],
  "Mozzarella Sticks (5)": ["Marinara"],
};

const SANDWICH = ["Toasted", "Cut in half", "Sauce on the side", "Extra napkins"];

/** Plain-language requests (no price impact), by category id. */
export const REQUESTS: Record<string, string[]> = {
  breakfast: ["Toasted", "Cut in half", "Extra napkins"],
  soup: ["Extra napkins", "Extra spoon"],
  sides: ["Extra crispy", "Sauce on the side", "Extra napkins"],
  pizza: ["Well done", "Light sauce", "Extra napkins"],
  deli: SANDWICH,
  subs: SANDWICH,
  burgers: SANDWICH,
  chicken: SANDWICH,
  wraps: SANDWICH,
  paninis: SANDWICH,
  veggie: SANDWICH,
  texmex: ["Salsa on the side", "Sour cream on the side", "Extra napkins"],
  salads: ["Dressing on the side", "Extra napkins"],
  kids: ["Cut in half", "Extra napkins"],
};

/** Add-ons. No prices are listed on the restaurant's menu, so these are requests the restaurant confirms. */
export const ADDONS: Record<string, string[]> = {
  breakfast: ["Add bacon", "Add cheese"],
  sides: ["Extra cheese", "Add bacon"],
  pizza: ["Extra cheese"],
  deli: ["Extra cheese", "Add bacon", "Extra sauce"],
  subs: ["Extra cheese", "Add bacon", "Extra sauce"],
  burgers: ["Extra cheese", "Add bacon", "Extra sauce"],
  chicken: ["Extra cheese", "Add bacon", "Extra sauce"],
  wraps: ["Extra cheese", "Add bacon", "Extra sauce"],
  paninis: ["Extra cheese", "Add bacon", "Extra sauce"],
  texmex: ["Extra cheese", "Extra salsa", "Extra sour cream"],
  salads: ["Add chicken", "Extra dressing"],
};

export const categoryOf = (item: MenuItem) => item.id.split("-")[0];
