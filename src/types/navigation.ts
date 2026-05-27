import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label:          string;
  path:           string;
  icon:           LucideIcon;
  menuId?:        string;  // item-level menu ID
  alwaysVisible?: boolean; // show for all admin types regardless of permissions
}

export interface NavGroup {
  label:   string;
  menuId?: string; // folder menu ID — omit to always show the group
  items:   NavItem[];
}
