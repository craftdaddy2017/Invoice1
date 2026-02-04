
export enum InvoiceStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  PAID = 'Paid',
  OVERDUE = 'Overdue'
}

export interface Address {
  street: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  country: string;
}

export interface BankAccount {
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountType: string;
}

export interface LineItem {
  id: string;
  description: string;
  hsn: string;
  qty: number;
  rate: number;
  taxRate: number; // e.g., 18 for 18%
}

export interface Client {
  id: string;
  name: string;
  email: string;
  address: Address;
  gstin?: string;
  pan?: string;
}

export interface UserBusinessProfile {
  companyName: string;
  logoUrl?: string;
  signatureUrl?: string;
  address: Address;
  gstin: string;
  pan: string;
  bankAccounts: BankAccount[];
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  clientId: string;
  items: LineItem[];
  notes?: string;
  terms?: string;
  placeOfSupply: string;
  bankDetails?: BankAccount;
}

export enum LeadStatus {
  NEW = 'New',
  CONTACTED = 'Contacted',
  PROPOSAL = 'Proposal',
  WON = 'Won',
  LOST = 'Lost'
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  value: number;
  status: LeadStatus;
  createdAt: string;
}
