import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label:   string;
  path:    string;
  icon:    LucideIcon;
  menuId?: string; // item-level menu ID — omit to always show within visible group
}

export interface NavGroup {
  label:   string;
  menuId?: string; // folder menu ID — omit to always show the group
  items:   NavItem[];
}
