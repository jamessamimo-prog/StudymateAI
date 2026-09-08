export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  price: number;
  cover: string;
  description: string;
  pages: number;
  rating: number;
  content: string;
}

export interface OrderItem {
  bookId: string;
  title: string;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
  paymentMethod: string;
}

export interface ReleaseInfo {
  released: boolean;
  releasedAt: string;
  by: string;
  note?: string;
}

export interface Database {
  users: User[];
  orders: Order[];
  books: Book[];
  releases: Record<string, Record<string, ReleaseInfo>>;
}

export type Session =
  | { role: 'admin' }
  | { role: 'user'; userId: string }
  | null;

export type Page =
  | 'home'
  | 'login'
  | 'signup'
  | 'store'
  | 'book'
  | 'cart'
  | 'library'
  | 'reader'
  | 'dashboard'
  | 'tutor'
  | 'admin'
  | 'about';
