export interface Promocode {
  guid:                string;
  key:                 string;
  amount:              number | null;
  discount_percentage: number | null;
  infinite:            boolean;
  special:             boolean;
  status:              boolean;
  user_count:          number | null;
  use_count_per_user:  number;
  users_id:            string | null;
  users_id_data:       null;
  valid_until:         string | null;
  created_at:          string;
  updated_at:          string;
}

export interface PromocodesListResponse {
  status:         string;
  description:    string;
  custom_message: string;
  data: {
    data: {
      count:    number;
      response: Promocode[];
    };
    project_id: string;
  };
}