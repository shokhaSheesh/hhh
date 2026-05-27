export interface Coupon {
  guid:        string;
  key:         string | null;
  description: string | null;
  amount:      number | null;
  created_at:  string;
  updated_at:  string;
  [key: string]: unknown;
}

export interface UserCoupon {
  guid:            string;
  users_id:        string | null;
  coupons_id:      string | null;
  created_at:      string;
  updated_at:      string;
  users_id_data:   { name: string; phone: string; photo?: string | null } | null;
  coupons_id_data: { key: string | null; description: string | null; amount: number | null } | null;
  [key: string]: unknown;
}

export interface CouponsV2Response {
  status: string;
  data:   Coupon[];
}

export interface UserCouponsV2Response {
  status: string;
  data:   UserCoupon[];
}
