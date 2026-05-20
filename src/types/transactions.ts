export type TransactionStatus = 'completed' | 'failed' | string;

export interface ExternalResponse {
  error_code:     number;
  error_note:     string;
  payment_id:     string;
  payment_status: number;
}

export interface TransactionUser {
  guid:      string;
  name:      string;
  phone:     string;
  photo:     string | null;
  unique_id: string;
  active:    boolean;
  balance:   number;
}

export interface TransactionCard {
  guid:   string;
  name:   string;
  number: string;
  phone:  string | null;
}

export interface Transaction {
  guid:              string;
  transaction_id:    string;
  amount:            number;
  status:            TransactionStatus;
  external_response: string | null;
  users_id:          string | null;
  users_id_data:     TransactionUser | null;
  cards_id:          string | null;
  cards_id_data:     TransactionCard | null;
  created_at:        string;
  updated_at:        string;
}

export interface TransactionsListResponse {
  data: {
    data: {
      response: Transaction[];
      count:    number;
    };
  };
}
