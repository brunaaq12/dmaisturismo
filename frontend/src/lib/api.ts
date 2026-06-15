// API Client — substitui o supabase client
// Aponta para o Cloudflare Worker

const BASE = import.meta.env.VITE_API_URL as string;

if (!BASE) console.warn("[api] VITE_API_URL não definida — verifique .env.local");

// ── Token storage ────────────────────────────────────────────────────────────

export const getToken = (): string | null => localStorage.getItem("dmais_token");
export const setToken = (t: string) => localStorage.setItem("dmais_token", t);
export const clearToken = () => localStorage.removeItem("dmais_token");

// ── Fetch wrapper ─────────────────────────────────────────────────────────────

async function req<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: { auth?: boolean } = { auth: true }
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.auth !== false) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error: string };
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

const get  = <T>(path: string, auth = true) => req<T>("GET",    path, undefined, { auth });
const post = <T>(path: string, body: unknown, auth = true) => req<T>("POST",   path, body, { auth });
const put  = <T>(path: string, body: unknown, auth = true) => req<T>("PUT",    path, body, { auth });
const patch = <T>(path: string, body: unknown, auth = true) => req<T>("PATCH", path, body, { auth });
const del  = <T>(path: string, auth = true) => req<T>("DELETE", path, undefined, { auth });

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  phone?: string | null;
  rg?: string | null;
  role: "admin" | "cliente";
}

export interface AuthResponse { token: string; user: AuthUser; }

export const authApi = {
  register: (data: {
    email: string; password: string; full_name: string; phone: string; rg: string;
  }) => post<AuthResponse>("/api/auth/register", data, false),

  login: (email: string, password: string) =>
    post<AuthResponse>("/api/auth/login", { email, password }, false),

  me: () => get<AuthUser>("/api/auth/me"),

  updateProfile: (data: { full_name?: string; phone?: string }) =>
    patch<{ ok: boolean }>("/api/auth/profile", data),

  passwordReset: (data: {
    full_name: string; email: string; phone: string; new_password: string;
  }) => post<{ ok: boolean }>("/api/auth/password-reset", data, false),
};

// ── Packages ──────────────────────────────────────────────────────────────────

export interface Package {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  departure_date: string;
  duration_days: number;
  price: number;
  total_spots: number;
  available_spots: number;
  cover_image: string | null;
  gallery: string[];
  itinerary: string | null;
  included: string | null;
  is_active: boolean;
  is_featured: boolean;
  package_type: string | null;
  created_at: string;
  
  // Novos campos
  hotel_name?: string | null;
  itinerary_main?: string | null;
  itinerary_farewell?: string | null;
  itinerary_return?: string | null;
}

export interface PackageFilters {
  category?: string;
  month?: string;
  duration?: string;
  q?: string;
  featured?: "1";
}

export const packagesApi = {
  list: (filters?: PackageFilters) => {
    const qs = new URLSearchParams(
      Object.entries(filters ?? {}).filter(([, v]) => v) as [string, string][]
    ).toString();
    return get<Package[]>(`/api/packages${qs ? "?" + qs : ""}`, false);
  },
  all: () => get<Package[]>("/api/packages/all"),
  get: (id: string) => get<Package>(`/api/packages/${id}`, false),
  create: (data: Omit<Package, "id" | "available_spots" | "created_at">) =>
    post<Package>("/api/packages", data),
  update: (id: string, data: Partial<Package>) =>
    put<Package>(`/api/packages/${id}`, data),
  delete: (id: string) => del<{ ok: boolean }>(`/api/packages/${id}`),
};

// ── Bookings ──────────────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  user_id: string;
  package_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  payment_method: string | null;
  voucher_code: string | null;
  passengers: { full_name: string; rg: string }[];
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  payment_proof_url: string | null;
  canceled_by: string | null;
  created_at: string;
  packages?: {
    title: string;
    location: string;
    departure_date: string;
    duration_days?: number;
    hotel_name?: string | null;
    itinerary_main?: string | null;
    itinerary_farewell?: string | null;
    itinerary_return?: string | null;
  } | null;
  // admin fields
  pkg_title?: string;
  user_full_name?: string;
  user_phone?: string;
  user_email?: string;
  user_rg?: string;
}

export const bookingsApi = {
  mine: () => get<Booking[]>("/api/bookings/mine"),
  all: (params?: { status?: string; from?: string; to?: string; package_id?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v) as [string, string][]
    ).toString();
    return get<Booking[]>(`/api/bookings${qs ? "?" + qs : ""}`);
  },
  get: (id: string) => get<Booking>(`/api/bookings/${id}`),
  create: (data: {
    package_id: string; quantity: number;
    passengers?: { full_name: string; rg: string }[];
  }) => post<Booking>("/api/bookings", data),
  cancel: (id: string) => patch<{ ok: boolean }>(`/api/bookings/${id}/cancel`, {}),
  setStatus: (id: string, status: string, extra?: {
    payment_method?: string; payment_proof_url?: string;
  }) => patch<{ ok: boolean }>(`/api/bookings/${id}/status`, { status, ...extra }),
  autoCancel: () => post<{ canceled: number }>("/api/bookings/auto-cancel", {}),
};

// ── Categories ────────────────────────────────────────────────────────────────

export interface Category { slug: string; label: string; }

export const categoriesApi = {
  list: () => get<Category[]>("/api/categories", false),
  create: (slug: string, label: string) => post<Category>("/api/categories", { slug, label }),
  delete: (slug: string) => del<{ ok: boolean }>(`/api/categories/${slug}`),
};

// ── Package Types ─────────────────────────────────────────────────────────────

export interface PackageType {
  slug: string; label: string; discount_percent: number;
}

export const packageTypesApi = {
  list: () => get<PackageType[]>("/api/package-types", false),
  create: (data: { slug: string; label: string; discount_percent?: number }) =>
    post<PackageType>("/api/package-types", data),
  update: (slug: string, data: { label?: string; discount_percent?: number }) =>
    put<{ ok: boolean }>(`/api/package-types/${slug}`, data),
  delete: (slug: string) => del<{ ok: boolean }>(`/api/package-types/${slug}`),
};

// ── Payment Settings ──────────────────────────────────────────────────────────

export interface PublicPaymentInfo {
  pix_key?: string; pix_key_type?: string; pix_holder_name?: string;
  bank_name?: string; bank_agency?: string; bank_account?: string;
  pix_enabled?: boolean | number; mp_enabled?: boolean | number; instructions?: string;
}

export const paymentApi = {
  getPublic: () => get<PublicPaymentInfo>("/api/payment-settings/public", false),
  getAdmin: () => get<Record<string, unknown>>("/api/payment-settings"),
  update: (data: Record<string, unknown>) => put<{ ok: boolean }>("/api/payment-settings", data),
};

// ── Publications ──────────────────────────────────────────────────────────────

export interface Publication {
  id: string; title: string | null; image_url: string; created_at: string;
}

export const publicationsApi = {
  list: () => get<Publication[]>("/api/publications", false),
  create: (data: { title?: string; image_url: string }) =>
    post<{ id: string }>("/api/publications", data),
  delete: (id: string) => del<{ ok: boolean }>(`/api/publications/${id}`),
};

// ── Accommodations ────────────────────────────────────────────────────────────

export const accommodationsApi = {
  list: (params?: { from?: string; to?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v) as [string, string][]
    ).toString();
    return get<Record<string, unknown>[]>(`/api/accommodations${qs ? "?" + qs : ""}`);
  },
  create: (data: Record<string, unknown>) => post<{ id: string }>("/api/accommodations", data),
  update: (id: string, data: Record<string, unknown>) =>
    put<{ ok: boolean }>(`/api/accommodations/${id}`, data),
  delete: (id: string) => del<{ ok: boolean }>(`/api/accommodations/${id}`),
};

// ── Admin Users ───────────────────────────────────────────────────────────────

export const adminUsersApi = {
  list: () => get<AuthUser[]>("/api/admin/users"),
  setRole: (id: string, role: "admin" | "cliente") =>
    patch<{ ok: boolean }>(`/api/admin/users/${id}/role`, { role }),
};

// ── Mercado Pago ──────────────────────────────────────────────────────────────

export const mpApi = {
  createPreference: (items: { title: string; quantity: number; unit_price: number }[], back_url?: string) =>
    post<{ preference_id: string; checkout_url: string }>("/api/mp/preference", { items, back_url }),
};
