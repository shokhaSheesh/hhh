// ─── Nested objects ──────────────────────────────────────────────────────────

export interface ClientTypeData {
  client_platform_ids: string[] | null;
  columns:             unknown  | null;
  confirm_by:          string;
  created_at:          string;
  default_page:        string;
  deleted_at:          string | null;
  guid:                string;
  is_system:           boolean;
  name:                string;
  project_id:          string | null;
  self_recover:        boolean;
  self_register:       boolean;
  session_limit:       number;
  table_slug:          string;
  updated_at:          string;
}

export interface RoleData {
  client_platform_id: string | null;
  client_type_id:     string;
  created_at:         string;
  deleted_at:         string | null;
  guid:               string;
  is_system:          boolean;
  name:               string;
  project_id:         string | null;
  status:             boolean;
  updated_at:         string;
}

// ─── Core entity ─────────────────────────────────────────────────────────────

export interface User {
  active:                  boolean | null;
  address:                 string  | null;
  app_language:            string[];
  balance:                 number;
  birth_date:              string;
  client_type_id:          string;
  client_type_id_data:     ClientTypeData;
  created_at:              string;
  device_id:               string | null;
  gender:                  string[];
  guid:                    string;
  last_login_time:         string;
  last_verified_time:      string;
  name:                    string;
  notifications_topic:     string | null;
  open_id:                 string;
  passport_serial_number:  string;
  phone:                   string;
  photo:                   string;
  pinfl:                   string | null;
  role_id:                 string;
  role_id_data:            RoleData;
  status:                  number;
  synced:                  boolean | null;
  unique_id:               string;
  updated_at:              string;
  user_id_auth:            string;
  verified:                boolean;
}

// ─── API response wrappers ────────────────────────────────────────────────────

export interface UsersListData {
  count:    number;
  response: User[];
}

/** Shape at response.data.data — the path to actual users is .data.data.response */
export interface UsersListResponse {
  status:      string;
  description: string;
  data: {
    data: UsersListData;
  };
}

// ─── Request body ─────────────────────────────────────────────────────────────

export interface UsersListBody {
  offset: number;
  limit:  number;
  search?: string;
}

// ─── Create / Update payload ──────────────────────────────────────────────────

export interface UCodeUserPayload {
  data: {
    guid?:                   string;  // included for PUT only
    user_id_auth?:           string;  // included for PUT only
    open_id?:                string;  // generated UUID for POST only
    phone:                   string;
    name:                    string;
    status:                  number;
    balance:                 number;
    active:                  boolean;
    verified:                boolean;
    synced:                  boolean;
    birth_date:              string;
    gender:                  string[];
    app_language:            string[];
    client_type_id:          string;
    role_id:                 string;
    address?:                string;
    passport_serial_number?: string;
    pinfl?:                  string;
  };
  disable_faas?: boolean;
}
