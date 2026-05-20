export interface Battery {
  guid:                       string;
  battery_sn:                 string;
  soc:                        number;
  soh:                        number;
  status:                     boolean;
  battery_categories_id:      string | null;
  battery_categories_id_data: null;
  created_at:                 string;
  updated_at:                 string;
}

export interface BatteriesListResponse {
  data: {
    data: {
      response: Battery[];
      count:    number;
    };
  };
}
