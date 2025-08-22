import { dataLoader } from "./data-loader";
import type { MockDataConfiguration } from "@shared/data-types";

type ParsedCustomer = {
  name: string;
  email: string;
  company: string;
  plan: string;
  mrr: string;
  signupDate: string;
  lastLogin?: string;
  healthScore: number;
  churnRisk: string;
  npsScore?: number;
  supportTickets: number;
  featureUsage?: { 
    login: number; 
    features: number; 
    api_calls: number;
    premium?: number;
    claims?: number;
    late_days?: number;
    price_increase_pct?: number;
    days_to_renewal?: number;
    tenure_days?: number;
    autopay_enabled?: boolean;
    payment_method?: string;
  };
  isActive: boolean;
};

function safeNumber(v: any, def = 0): number {
  const n = parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : def;
}

function toBool(v: any, def = true): boolean {
  const s = String(v ?? "").toLowerCase().trim();
  if (["true", "yes", "1", "y"].includes(s)) return true;
  if (["false", "no", "0", "n"].includes(s)) return false;
  return def;
}

// Minimal CSV parser (handles quoted fields)
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur = "";
  let inQuotes = false;
  let row: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && (ch === ",")) {
      row.push(cur);
      cur = "";
      continue;
    }
    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (cur.length || row.length) {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      }
      continue;
    }
    cur += ch;
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter(r => r.some(c => String(c).trim().length));
}

export function mapCsvToCustomers(rows: string[][]): ParsedCustomer[] {
  if (!rows.length) return [];
  const header = rows[0].map(h => h.toLowerCase().trim());
  const idx = (name: string) => header.indexOf(name);
  const get = (r: string[], name: string) => r[idx(name)];

  const customers: ParsedCustomer[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const name = get(r, "name") || get(r, "customer") || "Unnamed";
    const email = get(r, "email") || "";
    const company = get(r, "company") || "";
    const plan = get(r, "plan") || "Basic";
    const mrr = String(get(r, "mrr") || get(r, "monthly_revenue") || "0");
    const signupDate = get(r, "signup_date") || get(r, "signup") || new Date().toISOString();
    const lastLogin = get(r, "last_login") || undefined;
    const healthScore = safeNumber(get(r, "health_score"), 70);
    const churnRisk = String(get(r, "churn_risk") ?? "0");
    const npsScore = get(r, "nps_score") ? safeNumber(get(r, "nps_score")) : undefined;
    const supportTickets = safeNumber(get(r, "support_tickets"), 0);
    const featureA = safeNumber(get(r, "featurea"), 0);
    const featureB = safeNumber(get(r, "featureb"), 0);
    const featureC = safeNumber(get(r, "featurec"), 0);
    // Insurance-specific optional fields
    const premium = safeNumber(get(r, "premium"), 0);
    const claims = safeNumber(get(r, "claims") || get(r, "claims_count"), 0);
    const late_days = safeNumber(get(r, "late_days") || get(r, "late_payments_days"), 0);
    const price_increase_pct = safeNumber(get(r, "price_increase_pct") || get(r, "rate_increase_pct"), 0);
    const days_to_renewal = safeNumber(get(r, "days_to_renewal") || get(r, "renewal_days"), 0);
    const tenure_days = safeNumber(get(r, "tenure_days") || get(r, "policy_tenure_days"), 0);
    const autopay_enabled = toBool(get(r, "autopay_enabled"), false);
    const payment_method = (get(r, "payment_method") || "").toLowerCase().trim();
    const isActive = toBool(get(r, "is_active"), true);

    customers.push({
      name,
      email,
      company,
      plan,
      mrr,
      signupDate,
      lastLogin,
      healthScore,
      churnRisk,
      npsScore,
      supportTickets,
      featureUsage: { 
        login: featureA, 
        features: featureB, 
        api_calls: featureC,
        premium,
        claims,
        late_days,
        price_increase_pct,
        days_to_renewal,
        tenure_days,
        autopay_enabled,
        payment_method,
      },
      isActive,
    });
  }
  return customers;
}

export async function importCustomersFromCsv(csvText: string) {
  const rows = parseCsv(csvText);
  const customers = mapCsvToCustomers(rows);
  const current = dataLoader.getMockData();
  const next: MockDataConfiguration = {
    ...current,
    customers,
  };
  await dataLoader.saveData(next);
}

// Map randomdata.csv (insurance sample) to internal customers
export function mapRandomCsvToCustomers(rows: string[][]): ParsedCustomer[] {
  if (!rows.length) return [];
  const header = rows[0].map(h => h.trim());
  const col = (name: string) => header.indexOf(name);
  const idx = {
    name: col('Customer Name'),
    addr: col('Customer_Address'),
    company: col('Company Name'),
    claimReason: col('Claim Reason'),
    confidentiality: col('Data confidentiality'),
    claimAmount: col('Claim Amount'),
    categoryPremium: col('Category Premium'),
    ratio: col('Premium/Amount Ratio'),
    claimOutput: col('Claim Request output'),
    bmi: col('BMI'),
    churn: col('Churn'),
  };

  const customers: ParsedCustomer[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const name = r[idx.name] || `Customer ${i}`;
    const company = r[idx.company] || 'Unknown Co';
    const plan = r[idx.claimReason] || 'Policy';
    const mrr = String(r[idx.categoryPremium] || '0');
    const bmi = Number(r[idx.bmi] || 24);
    const claimAmt = Number(r[idx.claimAmount] || 0);
    const ratio = Number(r[idx.ratio] || 0);
    const claimOut = (r[idx.claimOutput] || 'No').toLowerCase() === 'yes';
    const churnYes = (r[idx.churn] || 'No').toLowerCase() === 'yes';

    // Derive fields
    const healthBase = Math.max(0, Math.min(100, 100 - Math.max(0, bmi - 18) * 5));
    const healthScore = Math.round(healthBase - (claimOut ? 10 : 0) - Math.min(20, ratio * 50));
    const churnRisk = churnYes ? '85.00' : '15.00';
    const supportTickets = claimOut ? 2 : 0;
    const featureA = Math.max(0, 30 - supportTickets * 5);
    const featureB = Math.max(0, 20 - Math.round(ratio * 20));
    const featureC = Math.round(claimAmt);

    const emailSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || `user${i}`;
    const email = `${emailSlug}@example.com`;

    customers.push({
      name,
      email,
      company,
      plan,
      mrr,
      signupDate: new Date().toISOString(),
      healthScore: Math.max(0, Math.min(100, healthScore)),
      churnRisk,
      npsScore: 5,
      supportTickets,
      featureUsage: { login: featureA, features: featureB, api_calls: featureC },
      isActive: true,
    });
  }
  return customers;
}

export async function importCustomersFromRandomCsv(csvText: string) {
  const rows = parseCsv(csvText);
  const customers = mapRandomCsvToCustomers(rows);
  const current = dataLoader.getMockData();
  const next: MockDataConfiguration = {
    ...current,
    customers,
  };
  await dataLoader.saveData(next);
}


