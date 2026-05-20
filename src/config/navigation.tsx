import {
  LayoutDashboard,
  Users,
  FileText,
  UserCog,
  Bell,
  ArrowRightLeft,
  CreditCard,
  Tag,
  Layers,
  Ticket,
  MapPin,
  Settings2,
  Plug,
  RefreshCw,
  BookOpen,
  HelpCircle,
  Settings,
  BatteryFull,
} from 'lucide-react';
import type { NavGroup } from '@/types/navigation';

// Folder-level menu IDs from GET /v3/menus?parent_id=c57eedc3-a954-4262-a0af-376c65b5a284
const MENU_FOLDER = {
  dashboard:   '1d8bebdd-a6fb-4a66-b4a4-aee7897e64fc',
  users:       '7e872bfc-c5b3-49d3-847f-450bb3157c58',
  payment:     '9f4c77de-29e2-4473-939e-20258ff9dee1',
  stations:    '9b809f5e-e23d-43fb-8612-8934e68b73af',
  swaps:       '97527144-7ef6-403b-a250-b08575174510',
  directories: '4e2a8a6f-6ed7-48f7-b78b-fd2f569426da',
  settings:    'c57eedc3-a954-4262-a0af-376c65b5a280',
} as const;

// Item-level menu IDs — from VIEW URL paths + children API responses
const MENU_ITEM = {
  users:             'a095fcab-57ad-47b8-805c-82a21dd59ef1',
  appeals:           'cb0dff65-ffc0-4f88-b7bb-703355abd43f',
  admins:            'd90e55a6-6719-4733-bca1-616d5047c5d0',
  notifications:     'a8919382-fafb-49d4-9534-4eb61a0474a2',
  transactions:      '0eebdfa0-bdab-4b3d-ac20-488a0d65a96e',
  cards:             '3abcfab4-6ac3-4848-9fa5-dad6f5bd08ca',
  tariffs:           '7e938887-d473-4730-814c-ef6a43e55662',
  tariffTypes:       'e5b7556e-8e6e-4f38-8147-f3c0ab3b39a7',
  userOperations:    'e215f4bd-a8a0-43bd-9c54-eec3ba0a8ef0',
  promocodes:        'c23f772e-8946-429f-871a-a787216ffc35',
  stations:          '6e1118c1-b051-4657-80e5-fbea2a4cf6a3',
  batteries:         '96d306f2-c7bf-4f25-86fe-309d1b54fdde',
  batteryCategories: '7da9ec8d-ccd3-4f63-aba3-b6f1d9d9ed6f',
  portBindings:      'bbdcb468-87a5-4164-acfe-a2f8f4ca92b8',
  swaps:             'd8942801-c771-4907-bc02-a61c2c135859',
  documents:         '1ffcf6dc-18c5-41ec-86de-e4714f835d62',
  faq:               'c7f04907-4940-4664-ab1b-15c797afa20a',
} as const;

export const NAV_GROUPS: NavGroup[] = [
  {
    label:  'Asosiy',
    menuId: MENU_FOLDER.dashboard,
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label:  'Foydalanuvchilar',
    menuId: MENU_FOLDER.users,
    items: [
      { label: 'Foydalanuvchilar', path: '/users',   icon: Users,    menuId: MENU_ITEM.users    },
      { label: 'Murojaatlar',      path: '/appeals',  icon: FileText, menuId: MENU_ITEM.appeals  },
      { label: 'Administratorlar', path: '/admins',   icon: UserCog,  menuId: MENU_ITEM.admins   },
    ],
  },
  {
    label: 'Kontent',
    items: [
      { label: 'Bildirishnomalar', path: '/notifications', icon: Bell, menuId: MENU_ITEM.notifications },
    ],
  },
  {
    label:  "To'lovlar",
    menuId: MENU_FOLDER.payment,
    items: [
      { label: 'Tranzaksiyalar',              path: '/payments/transactions',    icon: ArrowRightLeft, menuId: MENU_ITEM.transactions   },
      { label: 'Kartalar',                    path: '/payments/cards',            icon: CreditCard,     menuId: MENU_ITEM.cards          },
      { label: 'Tariflar',                    path: '/payments/tariffs',          icon: Tag,            menuId: MENU_ITEM.tariffs         },
      { label: 'Tarif turlari',               path: '/payments/tariff-types',    icon: Layers,         menuId: MENU_ITEM.tariffTypes     },
      { label: 'Promokodlar',                 path: '/payments/promo-codes',     icon: Ticket,         menuId: MENU_ITEM.promocodes      },
      { label: 'Foydalanuvchi operatsiyalari', path: '/payments/user-operations', icon: ArrowRightLeft, menuId: MENU_ITEM.userOperations  },
    ],
  },
  {
    label:  'Stansiyalar',
    menuId: MENU_FOLDER.stations,
    items: [
      { label: 'Stansiyalar',         path: '/stations',      icon: MapPin,      menuId: MENU_ITEM.stations     },
      { label: 'Batareyalar',         path: '/batteries',     icon: BatteryFull, menuId: MENU_ITEM.batteries    },
      { label: 'Batareyalar turlari', path: '/battery-types', icon: Settings2,   menuId: MENU_ITEM.batteryCategories },
      { label: 'Qurilma portlari',    path: '/ports',         icon: Plug,        menuId: MENU_ITEM.portBindings },
    ],
  },
  {
    label:  'Almashtirishlar',
    menuId: MENU_FOLDER.swaps,
    items: [
      { label: 'Almashtirishlar jurnali', path: '/swaps/log', icon: RefreshCw, menuId: MENU_ITEM.swaps },
    ],
  },
  {
    label:  "Qo'shimcha",
    menuId: MENU_FOLDER.directories,
    items: [
      { label: 'Hujjatlar',                  path: '/extra/documents', icon: BookOpen,   menuId: MENU_ITEM.documents },
      { label: "Ko'p so'raladigan savollar", path: '/extra/faq',       icon: HelpCircle, menuId: MENU_ITEM.faq       },
      { label: 'Sozlamalar',                 path: '/extra/settings',  icon: Settings   },
    ],
  },
];
