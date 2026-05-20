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

export interface TariffFacility {
  guid:           string;
  description_uz: string | null;
  description_ru: string | null;
  description_en: string | null;
  tariffs_id:     string | null;
  created_at:     string;
  updated_at:     string;
  [key: string]: unknown;
}

export interface TariffFacilitiesResponse {
  status: string;
  data: {
    data: {
      count:    number;
      response: TariffFacility[];
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
