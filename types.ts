export interface WarehouseLocation {
  warehouseType: string;
  section: string;
  row: string;
}

export type UnitOfMeasure = 'unidades' | 'litros' | 'kilogramos';

export interface Category {
  id: string;
  entityId: string;
  name: string;
}

export interface Supplier {
  id: string;
  entityId: string;
  name: string;
}

export interface Product {
  id: string;
  entityId: string;
  name: string;
  sku?: string;
  serialNumber?: string;
  inventoryNumber?: string;
  categoryId: string;
  quantity: number;
  unitOfMeasure: UnitOfMeasure;
  location: WarehouseLocation;
  supplierId: string;
  addedDate: string; // ISO string
  imageUrl: string;
  price: number;
  reorderPoint?: number;
  rating?: number;
  expirationDate?: string; // ISO string
  isPublished?: boolean;
  storePrice?: number;
}

export enum OrderStatus {
  Pending = 'Pendiente',
  Processing = 'Procesando',
  Shipped = 'Enviado',
  Delivered = 'Entregado',
  Cancelled = 'Cancelado'
}

export interface CustomerDetails {
    name: string;
    lastName: string;
    address: string;
    email: string;
    idCard: string;
}

export interface Order {
  id: string;
  entityId: string;
  userId: string;
  orderDate: string; // ISO string
  status: OrderStatus;
  total: number;
  items: { productId: string; quantity: number }[];
  customerDetails?: CustomerDetails;
}

export interface StatCardData {
    title: string;
    value: string;
    change?: string;
    changeType?: 'increase' | 'decrease';
    icon: React.ReactNode;
}

export enum UserRole {
    SuperUsuario = 'Super Usuario',
    SuperAdmin = 'Super Admin',
    Admin = 'Administrador',
    Almacenero = 'Almacenero',
    User = 'Usuario'
}

export interface User {
    id: string;
    entityId: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl: string;
    password?: string;
}

export type WarehouseStructure = {
  [warehouseType: string]: {
    [section: string]: string[];
  };
};

export type Currency = 'USD' | 'CUP';

export type View = 'dashboard' | 'inventory' | 'orders' | 'users' | 'locations' | 'createOrder' | 'orderDetails' | 'entities' | 'profile' | 'reports' | 'password' | 'entity-settings' | 'activity-log' | 'super-admin-activity-log' | 'super-user-activity-log' | 'store' | 'store-settings' | 'warehouse-heatmap' | 'supplier-dashboard';

export enum EntityType {
    TCP = 'TCP',
    MyPime = 'MyPime',
    Estatal = 'Empresa Estatal',
}

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  exchangeRate: number;
  isStoreEnabled: boolean;
  storeLogoUrl?: string;
  storeCoverUrl?: string;
  storePriceMarkup?: number;
  storeSlug?: string;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: string; // ISO string
  read: boolean;
  entityId: string; // Notifications are now scoped to an entity
  // 'admins_almaceneros' targets users with Admin, SuperAdmin, or Almacenero roles.
  // A string like 'user_id_xyz' targets a specific user.
  target: 'admins_almaceneros' | string; 
}

export interface EntityExportData {
  entity: Entity;
  users: User[];
  products: Product[];
  orders: Order[];
}

export interface EncryptedDataPayload {
  salt: string; // base64
  iv: string;   // base64
  data: string; // base64
}

export interface AuditLogEntry {
  id: string;
  entityId: string;
  userId: string;
  timestamp: string; // ISO string
  action: string;
}

export interface SalesReportData {
    type: 'sales';
    period: string;
    totalRevenue: number;
    totalProfit: number;
    totalOrders: number;
    totalItemsSold: number;
    items: {
        orderId: string;
        orderDate: string;
        customerName: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
    }[];
}

export interface AnnualSalesReportData {
    type: 'annualSales';
    year: number;
    totalRevenue: number;
    totalProfit: number;
    totalOrders: number;
    monthlyData: {
        month: string;
        revenue: number;
        profit: number;
        orders: number;
    }[];
}

export interface FinancialSummaryReportData {
    type: 'financialSummary';
    period: string;
    totalSalesRevenue: number;
    totalInventoryValue: number;
    totalGrossProfit: number;
}