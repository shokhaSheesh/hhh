export type OnlineStatus = 'online' | 'offline';

export interface Station {
  guid:                    string;
  device_code:             string;
  device_name:             string;
  device_name_cyrillic:    string;
  device_location:         string;
  device_location_cyrillic:string;
  address:                 string;
  address_cyrillic:        string;
  city:                    string;
  province:                string;
  area:                    string;
  location:                string;
  business_hours:          string;
  online_status:           OnlineStatus[];
  empty_number:            number;
  may_number:              number;
  disable_number:          number;
  port_num:                number;
  photo:                   string[] | null;
  refresh:                 string | null;
  created_at:              string;
  updated_at:              string;
}

export interface StationsListResponse {
  status:      string;
  description: string;
  data: {
    data: {
      count:    number;
      response: Station[];
    };
  };
}