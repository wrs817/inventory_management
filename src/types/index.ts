export const CATEGORIES = ["日用品", "家科产品", "雅姿", "纽崔莱", "XS"] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Product {
  id: string;
  user_id: string;
  name: string;
  reward_multiplier: number;
  category: Category;
  quantity: number;
  original_price: number | null;
  member_price: number | null;
  barcode: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  user_id: string;
  customer: string;
  product_id: string;
  sell_price: number;
  quantity: number;
  sale_date: string;
  notes: string | null;
  created_at: string;
  // joined
  products?: Pick<Product, "name">;
}

export interface GoodsIn {
  id: string;
  user_id: string;
  product_id: string;
  purchase_price: number;
  quantity: number;
  can_collect_reward_points: boolean;
  reward_points: number;
  notes: string | null;
  created_at: string;
  // joined
  products?: Pick<Product, "name">;
}

export interface Borrow {
  id: string;
  user_id: string;
  product_id: string;
  borrower: string;
  quantity: number;
  return_quantity: number;
  borrow_date: string;
  is_returned: boolean;
  returned_at: string | null;
  created_at: string;
  // joined
  products?: Pick<Product, "name">;
}
