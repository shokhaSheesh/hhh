export interface PenaltyTypeData {
  guid:       string;
  key:        string;
  amount:     number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PenaltyBindingData {
  guid:                string;
  batteries_id:        string;
  users_id:            string;
  devices_id:          string;
  subscriptions_id:    string;
  status:              string[];
  bound_at:            string | null;
  unbound_at:          string | null;
  bound_battery_soc:   number | null;
  unbound_battery_soc: number | null;
  created_at:          string;
  updated_at:          string;
  deleted_at:          string | null;
}

export interface PenaltyUserData {
  guid:  string;
  name:  string;
  phone: string;
  photo: string | null;
}

export interface Penalty {
  guid:                          string;
  amount:                        number;
  status:                        string[];
  penalty_types_id:              string;
  penalty_types_id_data:         PenaltyTypeData | null;
  users_id:                      string;
  users_id_data:                 PenaltyUserData | null;
  user_battery_bindings_id:      string | null;
  user_battery_bindings_id_data: PenaltyBindingData | null;
  created_at:                    string;
  updated_at:                    string;
}

export interface PenaltiesListResponse {
  status: string;
  data: {
    data: {
      count:    number;
      response: Penalty[];
    };
  };
}
