export interface AdminClientType {
  guid:                string;
  name:                string;
  table_slug:          string;
  is_system:           boolean;
  confirm_by:          string;
  self_register:       boolean;
  self_recover:        boolean;
  session_limit:       number;
  default_page:        string | null;
  project_id:          string | null;
  client_platform_ids: string[] | null;
  columns:             unknown[] | null;
  created_at:          string;
  updated_at:          string;
  deleted_at:          string | null;
}

export interface AdminRole {
  guid:               string;
  name:               string;
  is_system:          boolean;
  status:             boolean;
  client_type_id:     string;
  client_platform_id: string | null;
  project_id:         string | null;
  created_at:         string;
  updated_at:         string;
  deleted_at:         string | null;
}

export interface Admin {
  guid:                string;
  login:               string;
  password:            string;
  role_id:             string | null;
  role_id_data:        AdminRole | null;
  client_type_id:      string;
  client_type_id_data: AdminClientType;
  created_at:          string;
  updated_at:          string;
  user_id_auth:        string;
}

export interface AdminsListResponse {
  status: string;
  data: {
    data: {
      count:    number;
      response: Admin[];
    };
    project_id: string;
  };
}
