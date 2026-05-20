export interface TariffType {
  guid:      string;
  name:      string;
  day_count: number;
}

export interface Tariff {
  guid:                string;
  key:                 string;
  name:                string;
  description:         string;
  amount:              number;
  color:               string;
  base_tariff:         boolean;
  swap_count:          number;
  free_swap_count:     number;
  daily_swap_limit:    number;
  over_limit_amount:   number;
  tariff_types_id:     string;
  tariff_types_id_data: TariffType | null;
  created_at:          string;
  updated_at:          string;
}

export interface TariffsListResponse {
  status:      string;
  description: string;
  data: {
    data: {
      count:    number;
      response: Tariff[];
    };
  };
}

export interface TariffTypesResponse {
  status: string;
  data: {
    data: {
      count:    number;
      response: TariffType[];
    };
  };
}
