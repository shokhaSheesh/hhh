export interface SubscriptionUserData {
  guid:   string;
  name:   string;
  phone:  string;
  photo:  string | null;
}

export interface SubscriptionTariffData {
  guid:  string;
  name?: string;
  price?: number;
}

export interface Subscription {
  guid:                  string;
  active:                boolean;
  active_from:           string;
  active_to:             string | null;
  final_amount:          number;
  promocode_amount:      number;
  promocodes_id:         string | null;
  tariffs_id:            string;
  tariffs_id_data?:      SubscriptionTariffData;
  used_swap_count:       number | null;
  used_free_swap_count:  number | null;
  users_id:              string;
  users_id_data?:        SubscriptionUserData;
  created_at:            string;
  updated_at:            string;
  deleted_at:            string | null;
}

export interface SubscriptionsListResponse {
  status: string;
  data: {
    data: {
      count:    number;
      response: Subscription[];
    };
  };
}
