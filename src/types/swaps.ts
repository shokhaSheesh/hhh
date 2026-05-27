export type SwapStatus = 'bound' | 'unbound';

export interface BatteryData {
  guid:                  string;
  battery_sn:            string;
  soc:                   number;
  soh:                   number;
  status:                boolean;
  battery_categories_id: string | null;
  created_at:            string;
  updated_at:            string;
  deleted_at:            string | null;
}

export interface DeviceData {
  guid:                    string;
  device_name:             string;
  device_name_cyrillic:    string;
  device_code:             string;
  device_location:         string;
  device_location_cyrillic:string;
  address:                 string;
  city:                    string;
  province:                string;
  location:                string;
  online_status:           string[];
  may_number:              number;
  empty_number:            number;
  disable_number:          number;
  photo:                   string[] | null;
  created_at:              string;
  updated_at:              string;
  deleted_at:              string | null;
}

export interface SubscriptionData {
  guid:                string;
  active:              boolean;
  active_from:         string;
  active_to:           string | null;
  final_amount:        number;
  promocode_amount:    number;
  used_swap_count:     number | null;
  used_free_swap_count:number | null;
  tariffs_id:          string;
  promocodes_id:       string | null;
  users_id:            string;
  created_at:          string;
  updated_at:          string;
  deleted_at:          string | null;
}

export interface SwapUserData {
  guid:                  string;
  name:                  string;
  phone:                 string;
  photo:                 string | null;
  unique_id:             string;
  active:                boolean;
  verified:              boolean;
  balance:               number;
  birth_date:            string;
  gender:                string[];
  app_language:          string[];
  passport_serial_number:string;
  pinfl:                 string;
  created_at:            string;
  updated_at:            string;
}

export interface SwapRecord {
  guid:                    string;
  batteries_id:            string;
  batteries_id_data:       BatteryData;
  devices_id:              string;
  devices_id_data:         DeviceData;
  users_id:                string;
  users_id_data:           SwapUserData;
  subscriptions_id:        string;
  subscriptions_id_data:   SubscriptionData;
  status:                  SwapStatus[];
  bound_at:                string | null;
  unbound_at:              string;
  unbound_battery_soc:     number | null;
  bound_battery_soc:       number | null;
  created_at:              string;
  updated_at:              string;
}

export interface SwapsListResponse {
  status:      string;
  description: string;
  data: {
    data: {
      count:    number;
      response: SwapRecord[];
    };
  };
}
