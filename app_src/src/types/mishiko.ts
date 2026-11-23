export type DishCategory =
  | 'Todos'
  | 'Especialidades'
  | 'Hamburguesas'
  | 'Nikkei & Fusión'
  | 'Entradas'
  | 'Bebidas & Cocteles'
  | 'Postres';

export interface DishModifier {
  id: string;
  label: string;
  priceDelta: number;
}

export interface Dish {
  id: string;
  name: string;
  description: string;
  category: Exclude<DishCategory, 'Todos'>;
  price: number;
  cost: number;
  prepMinutes: string;
  image: string;
  available: boolean;
  highlightLabel?: string;
  pairing?: string;
  station: 'Estación Caliente' | 'Barra' | 'Vapor / Caliente' | 'Entradas' | 'Repostería';
  modifiers: DishModifier[];
  nightSpecial?: boolean;
  rating?: number;
}

export interface CartItem {
  cartItemId: string;
  dishId: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  selectedModifiers: DishModifier[];
  note?: string;
}

export type OrderStep = 1 | 2 | 3 | 4 | 5;
// 1: Recibido / Pendiente
// 2: Confirmado por Cocina (Por Aceptar -> En Prep)
// 3: En Preparación
// 4: Listo para Entrega (Listo en Pase)
// 5: Entregado en Mesa

export interface KdsItem {
  id: string;
  name: string;
  quantity: number;
  station: string;
  observation?: string;
  subNote?: string;
  completed: boolean;
  unitPrice: number;
}

export interface KitchenOrder {
  id: string; // e.g. "#ORD-2025-084"
  shortCode: string; // e.g. "#084"
  ticketControl: string; // e.g. "#TK-084-2025"
  tableNumber: string; // e.g. "04"
  tableLabel: string; // e.g. "Mesa 04"
  zone: string;
  dinerName: string;
  waiterName: string;
  createdAtLabel: string;
  minutesAgo: number;
  step: OrderStep;
  items: KdsItem[];
  verificationId: string;
}

export type TableStatus = 'ocupada' | 'libre' | 'cuenta' | 'reservada';

export type TableZone =
  | 'Salón Principal'
  | 'Terraza Gourmet'
  | 'Barra Japonesa & Mixología';

export interface DiningTable {
  id: string;
  number: string; // "01".."16"
  label: string; // "Mesa 01", "Barra 14"
  zone: TableZone;
  capacity: number;
  status: TableStatus;
  activeTotal: number;
  activeMinutes: number;
  qrPath: string;
  token: string;
  reservationTime?: string;
  guestName?: string;
  note?: string;
}

export type StaffRoleKey = 'admin' | 'sala' | 'cocina';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  roleTitle: string;
  roleKey: StaffRoleKey;
  pin: string;
  jwtStatus: 'activa' | 'revocada';
  remainingLabel: string;
  deviceInfo: string;
  lastLogin: string;
}

export interface PastVisit {
  id: string;
  tableLabel: string;
  dateLabel: string;
  statusLabel: string;
  receiptRef: string;
  total: number;
  itemsSummary: string;
  dishIds: string[];
  image: string;
}

export interface MichiAlert {
  id: string;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
}

export type FurColor = 'Naranja' | 'Blanco' | 'Gris' | 'Esmoquin';
export type MichiOutfit = 'Corbatín' | 'Delantal' | 'Sombrero' | 'Campanilla';

export type MichiGender = 'macho' | 'hembra';
export type MichiVoiceType = 'dulce' | 'energico' | 'tom' | 'anime-kawaii' | 'anime-shonen' | 'chibi' | 'natural';

export interface MichiConfig {
  name: string;
  furColor: FurColor;
  outfit: MichiOutfit;
  gender?: MichiGender;
  voiceType?: MichiVoiceType;
  voicePitch?: number;
  voiceRate?: number;
  voiceEnabled: boolean;
  autoSpeak: boolean;
  gestureSpeed: 0.5 | 1.0 | 1.5;
  activeGestureId: string;
  moodLabel: string;
}

export interface MichiGesture {
  id: string;
  title: string;
  description: string;
  category: 'Atención en Mesa' | 'Emociones' | 'Comandas';
  speechLine: string;
  badge?: string;
}

export type DinerTab = 'menu' | 'pedido' | 'michi';
export type AdminTab = 'kds' | 'catalogo' | 'mesas' | 'seguridad' | 'acceso';
export type WorkspaceMode = 'diner' | 'admin';
