export type PermValue = 'Yes' | 'No';

// Transformer: GET response uses booleans, PUT requires "Yes" / "No" strings
export const boolToPermValue = (b: boolean): PermValue => (b ? 'Yes' : 'No');

// ─── Roles ────────────────────────────────────────────────────────────────────

export interface Role {
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

export interface RolesResponse {
  status: string;
  data:   Role[];
}

// ─── Table-slug permissions (Phase 20, kept for reference) ────────────────────

export interface Permission {
  guid:             string;
  role_id:          string;
  client_type_id:   string;
  table_slug:       string;
  read:             PermValue;
  write:            PermValue;
  update:           PermValue;
  delete:           PermValue;
}

export interface PermissionsResponse {
  status: string;
  data:   Permission[];
}

export interface UpdatePermissionPayload {
  role_id:        string;
  client_type_id: string;
  table_slug:     string;
  read:           PermValue;
  write:          PermValue;
  update:         PermValue;
  delete:         PermValue;
}

// ─── Menu-based ACL (Phase 20.2) ──────────────────────────────────────────────

export interface MenuPermission {
  guid:    string;
  role_id: string;
  read:    boolean;
  write:   boolean;
  update:  boolean;
  delete:  boolean;
}

export interface MenuItem {
  id:    string;
  label: string;
  data: {
    permission: MenuPermission | null;
  };
  attributes: {
    label_uz?: string | null;
    [key: string]: unknown;
  };
}

export interface MenusResponse {
  data: {
    menus: MenuItem[];
  };
}

export type MenuPermKey = 'read' | 'write' | 'update' | 'delete';

export interface MenuUpdatePayload {
  guid:    string;
  role_id: string;
  read:    PermValue;
  write:   PermValue;
  update:  PermValue;
  delete:  PermValue;
}
