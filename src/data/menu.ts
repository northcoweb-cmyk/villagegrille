export interface MenuItem {
  id: string;
  name: string;
  price: number;
  desc?: string;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

export const IMG_BASE = "https://order.yourmenu.com/_ipx/w_900&f_auto&fit_inside/1020/";
export const img = (file: string) => IMG_BASE + encodeURI(file);

export const PHOTOS = {
  cali: img("Cali club-1771872448210.jpg"),
  turkey: img("Turkey bacon melt-1771872476433.jpg"),
  greek: img("Greek steak sub-1771872485948.jpg"),
  quesadilla: img("Quesadilla-1771872492293.jpg"),
  burrito: img("Burrito bowl-1771872402351.jpg"),
  steak: img("Steak supreme sub-1771872383260.jpg"),
  burger: img("Gourmet Burger-1771872368167.jpg"),
  wrap: img("Chicken ceasar wrap-1771872436506.jpg"),
  taco: img("Taco trio-1771872424405.jpg"),
};

type Row = [name: string, price: number, desc?: string, image?: string];

const cat = (id: string, name: string, rows: Row[]): Category => ({
  id,
  name,
  items: rows.map(([n, price, desc, image], i) => ({ id: `${id}-${i}`, name: n, price, desc, image })),
});

export const MENU: Category[] = [
  cat("breakfast", "Breakfast", [
    ["Pancakes", 11.49],
    ["French Toast", 11.49],
    ["The Lox Bagel", 10.95],
    ["Steak, Egg & Cheese Fajita", 11.95],
    ["Sausage Egg & Cheese Quesadilla", 11.95],
    ["Western Omelette", 11.95],
    ["Greek Omelette", 11.95],
    ["Egg & Cheese Sandwich", 7.5],
    ["Ham Egg & Cheese Sandwich", 8.95],
    ["Bacon Egg & Cheese Sandwich", 8.95],
    ["Sausage Egg & Cheese Sandwich", 8.95],
    ["Toasted Bagel with Cream Cheese, Jelly or Butter", 4.75],
  ]),
  cat("soup", "Soup & Chili", [
    ["Large Beef Chili", 8.95],
    ["Small Beef Chili", 7.95],
    ["Large Veggie Chili", 8.95],
    ["Small Veggie Chili", 7.95],
    ["Large Chicken Vegetable Soup", 8.95],
    ["Small Chicken Vegetable Soup", 7.95],
  ]),
  cat("sides", "Sides & Snacks", [
    ["Chili Cheese Fries", 10.95],
    ["Chili Cheese Nachos", 10.95],
    ["Chili Cheese Dog", 11.95],
    ["Large French Fries with Bacon & Cheese", 7.95],
    ["Small French Fries with Bacon & Cheese", 6.95],
    ["Small Village Fries", 4.95],
    ["Large Village Fries", 6.95],
    ["Small Nachos with Cheese", 4.95],
  ]),
  cat("pizza", "Pizza", [
    ["Slice Cheese Pizza", 4.25],
    ["Slice Pepperoni Pizza", 4.5],
    ['Cheese Pizza, 16" Whole', 18.95],
    ['Pepperoni Pizza, 16" Whole', 20.95],
    ['Veggie Pizza, 16" Whole', 20.95],
  ]),
  cat("deli", "Deli Delights", [
    ["Turkey Bacon Melt", 11.95, undefined, PHOTOS.turkey],
    ["Turkey Sandwich", 12.95],
    ["Honey-Baked Ham with Provolone", 11.95],
    ["California Club Sandwich", 12.95, undefined, PHOTOS.cali],
  ]),
  cat("subs", "Subs", [
    ["Philly Cheesesteak", 11.95, "Thinly sliced porterhouse steak, sautéed onions, melted American cheese, on a toasted Italian sub roll."],
    ["Steak Supreme", 12.95, "Thinly sliced porterhouse steak with sautéed onions, marinated mushrooms and green peppers, topped with melted Provolone, lettuce, tomato and mayo.", PHOTOS.steak],
    ["Greek Steak Sub", 12.95, undefined, PHOTOS.greek],
    ["Chicken Steak Sub", 12.95, "Thin slices of chicken breast grilled with sautéed onions and marinated mushrooms on an Italian sub roll with melted Provolone, lettuce, tomato and mayo."],
    ["Pizza Steak Sub", 12.95],
    ["Italian Meatball", 11.95, "Homemade meatballs topped with marinara and melted Provolone."],
    ["Heated Ham & Provolone Sub", 11.95],
    ["Grilled Veggie Sub", 11.95],
  ]),
  cat("burgers", "Burgers", [
    ["Gourmet Burger (6 oz)", 13.95, "Hand-packed 6 oz burger with sautéed onions, green peppers, sautéed mushrooms and melted Cheddar.", PHOTOS.burger],
    ["Double Cheeseburger", 13.95, "Hand-packed, char-grilled, with lettuce, tomato and mayo."],
    ["Village Cheeseburger (6 oz)", 12.95, "Char-grilled, melted Provolone, heated hamburger roll, lettuce, tomato and mayo."],
    ["Bacon Burger (6 oz)", 13.95, "Char-grilled, bacon, melted American cheese, lettuce, tomato, mayo and onion."],
  ]),
  cat("chicken", "Chicken Breast", [
    ["Texas BBQ Chicken Breast", 13.95, "Topped with crisp bacon strips, melted Monterey Jack and hickory-smoked BBQ sauce."],
    ["Chicken Bacon Provolone", 13.95, "Marinated, skinless char-grilled chicken with melted Provolone, lettuce, tomato and mayo on a soft heated Kaiser roll."],
    ["Chicken Breast Sandwich", 11.95],
  ]),
  cat("wraps", "Wraps", [
    ["California Veggie Wrap", 11.95],
    ["Chicken Parmesan Wrap", 12.95],
    ["Buffalo Chicken Wrap", 12.95],
    ["Turkey-Bacon Wrap", 12.95],
    ["Crispy Chicken Wrap", 12.95],
    ["Chicken Caesar Wrap", 12.95, undefined, PHOTOS.wrap],
    ["California Chicken Wrap", 12.95],
  ]),
  cat("paninis", "Paninis", [["Chicken Chipotle Panini", 11.95]]),
  cat("veggie", "Veggie Specialties", [
    ["Grilled Veggie Hoagie Sub", 11.95],
    ["Veggie Quesadilla", 11.95],
    ["Veggie Fajitas", 11.95],
  ]),
  cat("texmex", "Tex-Mex", [
    ["Burrito Bowl", 14.95, "12\" flour tortilla filled with house-made salsa, sour cream, rice, black beans and mozzarella.", PHOTOS.burrito],
    ["Quesadilla", 14.95, undefined, PHOTOS.quesadilla],
    ["Taco Trio", 14.95, undefined, PHOTOS.taco],
    ["Burrito Wrap", 14.95],
    ["Chicken & Steak Fajitas", 16.95],
    ["Chicken Fajitas", 12.95, "Char-grilled marinated chicken, sautéed onions, green peppers, tomato, lettuce and mozzarella in two flour tortillas with salsa, sour cream and tortilla chips."],
    ["Torta a la Mexicana", 16.5],
  ]),
  cat("salads", "Salads", [
    ["Tossed Salad", 10.95],
    ["Caesar Salad", 10.95],
    ["Greek Salad", 11.95],
    ["Tossed Salad with Chicken", 12.95],
    ["Greek Chicken Salad", 12.95],
    ["Chicken Caesar Salad", 12.95],
    ["California Chicken Salad", 12.95],
    ["Chicken Taco Salad", 12.95],
    ["Beef Taco Salad", 12.95],
    ["Village Chef's Salad", 12.95],
  ]),
  cat("kids", "Junior Combos", [
    ["Jr. Cheeseburger", 8.95, "Smash-style halal beef patty with crispy edges, American cheese, pickles, onions, mustard and ketchup on a toasted bun."],
    ["Jr. Chicken Tenders (3)", 8.95, "Hand-breaded chicken tenders, typically served with french fries."],
    ["Grilled Cheese", 8.95],
    ["Mozzarella Sticks (5)", 8.95, "Seasoned breadcrumb coating, deep-fried, served with marinara."],
    ["Kids Cheese Quesadilla", 7.95],
    ["Peanut Butter & Jelly", 7.95],
    ["Beef Hot Dog", 5.95, "Grilled quarter-pound all-beef hot dog."],
  ]),
];

export const INFO = {
  name: "Village Grille",
  address: "50 Southlawn Court, Rockville, MD 20850",
  mapsUrl: "https://maps.app.goo.gl/sMgwLDVAzfazYGNB6",
  phone: "(202) 557-4492",
  phoneHref: "tel:+12025574492",
  hours: [
    ["Monday", "2:00 PM – 9:30 PM"],
    ["Tuesday", "2:00 PM – 9:30 PM"],
    ["Wednesday", "2:00 PM – 9:30 PM"],
    ["Thursday", "2:00 PM – 9:30 PM"],
    ["Friday", "2:00 PM – 9:30 PM"],
    ["Saturday", "6:00 AM – 9:00 PM"],
    ["Sunday", "6:00 AM – 9:00 PM"],
  ] as [string, string][],
  social: {
    Facebook: "https://www.facebook.com/rockville.village.grille/",
    Yelp: "https://www.yelp.com/biz/village-grille-rockville-2",
    Google: "https://maps.app.goo.gl/sMgwLDVAzfazYGNB6",
    TripAdvisor:
      "https://www.tripadvisor.com/Restaurant_Review-g41353-d19664283-Reviews-Village_Grille-Rockville_Montgomery_County_Maryland.html",
  },
};

export const REVIEWS = [
  {
    text: "Stopped in while here for a travel sports tournament, very friendly service, great selection of sandwiches and entrees. Enjoyed my Deluxe Steak & Cheese w/ Fries. Would definitely patronize again.",
    who: "Navy C.",
  },
  {
    text: "Really impressed with this food service! The meals are always fresh, tasty, and well-portioned. Super convenient during or after skating and the customer service is friendly and helpful.",
    who: "A J.",
  },
];
