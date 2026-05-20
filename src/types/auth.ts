export interface LoginPermission {
  id:         string;
  role_id:    string;
  table_slug: string;
  read:       'Yes' | 'No';
  write:      'Yes' | 'No';
  update:     'Yes' | 'No';
  delete:     'Yes' | 'No';
  [key: string]: unknown;
}

export interface AuthSession {
  access_token:  string;
  refresh_token: string;
  login:         string;
  permissions:   LoginPermission[];
}
