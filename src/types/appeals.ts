export type AppealStatus = 'new' | 'in_progress' | 'solved' | 'closed' | 'ignored';

export interface Appeal {
  guid:        string;
  name:        string;
  phone:       string;
  description: string;
  status:      AppealStatus[];
  created_at:  string;
  updated_at:  string;
}

export interface AppealsListData {
  count:    number;
  response: Appeal[];
}

export interface AppealsListResponse {
  status:      string;
  description: string;
  data: {
    data: AppealsListData;
  };
}
