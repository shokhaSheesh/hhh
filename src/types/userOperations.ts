export interface UserOperationUser {
  guid:      string;
  name:      string;
  phone:     string;
  photo:     string | null;
  unique_id: string;
}

export interface SubscriptionData {
  guid:             string;
  tariffs_id:       string | null;
  final_amount:     number;
  active:           boolean;
  active_from:      string | null;
  active_to:        string | null;
  used_swap_count:  number | null;
  promocode_amount: number;
  [key: string]: unknown;
}

export interface PenaltyData {
  guid:         string;
  name?:        string;
  amount?:      number;
  description?: string;
  [key: string]: unknown;
}

export interface CouponData {
  guid:   string;
  name?:  string;
  code?:  string;
  title?: string;
  [key: string]: unknown;
}

export interface PromoCodeData {
  guid: string;
  key:  string;
  [key: string]: unknown;
}

export interface TransactionData {
  guid:           string;
  amount:         number;
  status:         string[];
  transaction_id: string;
  [key: string]: unknown;
}

export interface UserOperation {
  guid:                  string;
  amount:                number;
  type:                  string[];
  description:           string | null;
  users_id:              string | null;
  users_id_data:         UserOperationUser | null;
  subscriptions_id:      string | null;
  subscriptions_id_data: SubscriptionData | null;
  penalties_id:          string | null;
  penalties_id_data:     PenaltyData | null;
  coupons_id:            string | null;
  coupons_id_data:       CouponData | null;
  transactions_id:       string | null;
  transactions_id_data:  TransactionData | null;
  promocodes_id:         string | null;
  promocodes_id_data:    PromoCodeData | null;
  created_at:            string;
  updated_at:            string;
  [key: string]: unknown;
}

export interface UserOperationsListResponse {
  data: {
    data: {
      response: UserOperation[];
      count:    number;
    };
  };
}
