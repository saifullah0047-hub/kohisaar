export interface AccountProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
}

export interface AccountOrderSummary {
  id: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
}

export interface AccountAddress {
  id: string;
  label?: string;
  recipient: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
}

export interface AccountApi {
  login: (input: { email: string; password: string }) => Promise<AccountProfile>;
  register: (input: { fullName: string; email: string; password: string }) => Promise<AccountProfile>;
  requestPasswordReset: (input: { email: string }) => Promise<void>;
  logout: () => Promise<void>;
  getProfile: () => Promise<AccountProfile | null>;
  getOrders: () => Promise<AccountOrderSummary[]>;
  getAddresses: () => Promise<AccountAddress[]>;
}
