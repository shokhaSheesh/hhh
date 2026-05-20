export interface CardUser {
  guid:                   string;
  name:                   string;
  phone:                  string;
  photo:                  string | null;
  unique_id:              string;
  active:                 boolean;
  balance:                number;
  address:                string | null;
  app_language:           string[];
  birth_date:             string | null;
  client_type_id:         string;
  created_at:             string;
  deleted_at:             string | null;
  device_id:              string | null;
  gender:                 string[];
  last_login_time:        string | null;
  last_verified_time:     string | null;
  notifications_topic:    string | null;
  open_id:                string | null;
  passport_serial_number: string | null;
  pinfl:                  string | null;
  role_id:                string;
  status:                 number;
  synced:                 boolean;
  updated_at:             string;
  user_id_auth:           string;
  verified:               boolean;
}

export interface Card {
  guid:          string;
  name:          string;
  number:        string;
  expire_date:   string;
  token:         string;
  verified:      boolean;
  users_id:      string | null;
  users_id_data: CardUser | null;
  created_at:    string;
  updated_at:    string;
}

export interface CardsListResponse {
  data: {
    data: {
      response: Card[];
      count:    number;
    };
  };
}
