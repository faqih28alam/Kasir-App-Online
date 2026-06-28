// Mock API for Vercel demo — no backend required, all data is in-memory

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function dt(daysAgo = 0, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function inRange(iso: string, from: string, to: string): boolean {
  const d = iso.slice(0, 10);
  return d >= from && d <= to;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── SETTING ──────────────────────────────────────────────────────────────────
let SETTING: Record<string, unknown> = {
  id: 1,
  nama_toko: "Toko Makmur Jaya",
  alamat: "Jl. Sudirman No. 45, Jakarta Pusat",
  telepon: "021-5551234",
  receipt_footer: "Terima kasih telah berbelanja!",
  auto_print: false,
  printer_port: "",
  paper_width: 80,
};

// ─── USERS ────────────────────────────────────────────────────────────────────
const DEMO_USERS: Array<Record<string, unknown>> = [
  { id: 1, username: "admin",  password: "admin123", nama: "Administrator", role: "owner", is_active: true },
  { id: 2, username: "kasir",  password: "kasir123", nama: "Kasir Utama",   role: "kasir", is_active: true },
];
let nextUserId = 3;

// ─── BARANG ───────────────────────────────────────────────────────────────────
let DB_BARANG: Record<string, unknown>[] = [
  { barcode: "8992717300009", nama_barang: "Aqua 600ml",             sat: "PCS",      hpp: 2500,  harga_1: 4000,  stok: 200, stok_minimum: 20, harga_tiers: [] },
  { barcode: "8992717300016", nama_barang: "Aqua 1500ml",            sat: "PCS",      hpp: 5000,  harga_1: 8000,  stok: 150, stok_minimum: 10, harga_tiers: [{ id: 1, min_qty: 10, harga: 7500 }] },
  { barcode: "8886388110152", nama_barang: "Indomie Goreng",          sat: "PCS",      hpp: 2800,  harga_1: 3500,  stok: 300, stok_minimum: 50, harga_tiers: [] },
  { barcode: "8994500022401", nama_barang: "Teh Botol Sosro 450ml",  sat: "PCS",      hpp: 4000,  harga_1: 6000,  stok: 120, stok_minimum: 20, harga_tiers: [] },
  { barcode: "8991000500109", nama_barang: "Chitato Sapi Panggang",  sat: "PCS",      hpp: 12000, harga_1: 16000, stok: 80,  stok_minimum: 10, harga_tiers: [] },
  { barcode: "8992885310025", nama_barang: "Roma Kelapa",            sat: "PCS",      hpp: 8000,  harga_1: 12000, stok: 60,  stok_minimum: 10, harga_tiers: [] },
  { barcode: "8998009010051", nama_barang: "Rokok Sampoerna Mild",   sat: "BUNGKUS",  hpp: 21000, harga_1: 25000, stok: 50,  stok_minimum: 5,  harga_tiers: [{ id: 2, min_qty: 10, harga: 24000 }] },
  { barcode: "8992866600016", nama_barang: "Minyak Goreng Bimoli 1L",sat: "PCS",      hpp: 18000, harga_1: 22000, stok: 30,  stok_minimum: 5,  harga_tiers: [] },
  { barcode: "8990050100030", nama_barang: "Gula Pasir 1Kg",         sat: "KG",       hpp: 13000, harga_1: 17000, stok: 25,  stok_minimum: 5,  harga_tiers: [] },
  { barcode: "8991001810001", nama_barang: "Sabun Lifebuoy",         sat: "PCS",      hpp: 4500,  harga_1: 7000,  stok: 40,  stok_minimum: 10, harga_tiers: [] },
];

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
function resolvePrice(barang: Record<string, unknown>, qty: number): number {
  const tiers = [...(barang.harga_tiers as Array<{ min_qty: number; harga: number }>)].sort((a, b) => b.min_qty - a.min_qty);
  for (const tier of tiers) { if (qty >= tier.min_qty) return tier.harga; }
  return barang.harga_1 as number;
}

type SeedItem = [string, number, number]; // [barcode, qty, diskon]
interface TrxSeed { da: number; h: number; kasirId: number; items: SeedItem[]; }

function buildTransactions(seeds: TrxSeed[]) {
  const trxs: Record<string, unknown>[] = [];
  const details: Record<string, unknown>[] = [];
  const keus: Record<string, unknown>[] = [];
  const noCounter: Record<string, number> = {};
  let trxId = 1, detId = 1, keuId = 1;

  for (const seed of seeds) {
    const tanggal = dt(seed.da, seed.h);
    const dateKey = tanggal.slice(0, 10).replace(/-/g, "");
    noCounter[dateKey] = (noCounter[dateKey] ?? 0) + 1;
    const no_transaksi = `TRX-${dateKey}-${String(noCounter[dateKey]).padStart(3, "0")}`;

    let total = 0;
    const myDet: Record<string, unknown>[] = [];

    for (const [barcode, qty, diskon] of seed.items) {
      const b = DB_BARANG.find((x) => x.barcode === barcode)!;
      const harga = resolvePrice(b, qty);
      const itemTotal = qty * harga - diskon;
      total += itemTotal;
      myDet.push({ id: detId++, id_transaksi: trxId, barcode, nama_barang: b.nama_barang, sat: b.sat, qty, hpp: b.hpp, harga, diskon, total: itemTotal });
    }

    const bayar = total + ((trxId * 37) % 5) * 1000;
    trxs.push({ id: trxId, no_transaksi, tanggal, id_user: seed.kasirId, total, bayar, kembalian: bayar - total, status: "paid" });
    details.push(...myDet);
    keus.push({ id: keuId++, tanggal, keterangan: `Penjualan ${no_transaksi}`, debit: total, kredit: 0, ref_type: "transaksi", ref_id: trxId });
    trxId++;
  }

  return { trxs, details, keus, nextTrxId: trxId, nextDetId: detId, nextKeuId: keuId };
}

const SEEDS: TrxSeed[] = [
  { da: 0,  h: 9,  kasirId: 1, items: [["8992717300009", 5,  0], ["8886388110152", 3, 0]] },
  { da: 0,  h: 14, kasirId: 2, items: [["8998009010051", 2,  0], ["8994500022401", 2, 0]] },
  { da: 1,  h: 10, kasirId: 2, items: [["8992717300016", 10, 0], ["8991000500109", 2, 0]] },
  { da: 1,  h: 11, kasirId: 2, items: [["8992866600016", 1,  0], ["8990050100030", 1, 0]] },
  { da: 1,  h: 15, kasirId: 1, items: [["8992885310025", 3,  0], ["8991001810001", 2, 0]] },
  { da: 2,  h: 8,  kasirId: 2, items: [["8992717300009", 12, 0]] },
  { da: 2,  h: 13, kasirId: 2, items: [["8886388110152", 5,  0], ["8994500022401", 3, 0]] },
  { da: 2,  h: 16, kasirId: 1, items: [["8998009010051", 10, 0], ["8991000500109", 1, 0]] },
  { da: 3,  h: 9,  kasirId: 2, items: [["8992717300009", 6,  0], ["8992717300016", 4, 0]] },
  { da: 3,  h: 11, kasirId: 1, items: [["8992885310025", 2,  2000], ["8991001810001", 3, 0]] },
  { da: 5,  h: 10, kasirId: 2, items: [["8886388110152", 10, 0], ["8994500022401", 5, 0]] },
  { da: 5,  h: 14, kasirId: 1, items: [["8992866600016", 2,  0], ["8990050100030", 2, 0]] },
  { da: 7,  h: 9,  kasirId: 2, items: [["8992717300009", 8,  0], ["8991000500109", 3, 0]] },
  { da: 7,  h: 15, kasirId: 1, items: [["8998009010051", 3,  0], ["8992885310025", 4, 0]] },
  { da: 10, h: 10, kasirId: 2, items: [["8992717300016", 20, 0]] },
  { da: 10, h: 13, kasirId: 2, items: [["8886388110152", 6,  0], ["8994500022401", 4, 0]] },
  { da: 12, h: 11, kasirId: 1, items: [["8991001810001", 5,  0], ["8990050100030", 3, 0]] },
  { da: 12, h: 14, kasirId: 2, items: [["8992717300009", 15, 0], ["8991000500109", 2, 0]] },
];

const _init = buildTransactions(SEEDS);
let DB_TRANSAKSI = _init.trxs;
let DB_TRANSAKSI_DETAIL = _init.details;
let DB_KEUANGAN: Record<string, unknown>[] = [
  ..._init.keus,
  { id: _init.nextKeuId + 0, tanggal: dt(0), keterangan: "Listrik toko bulan ini",    debit: 0, kredit: 250000,  ref_type: "manual" },
  { id: _init.nextKeuId + 1, tanggal: dt(2), keterangan: "Gaji karyawan",             debit: 0, kredit: 1500000, ref_type: "manual" },
  { id: _init.nextKeuId + 2, tanggal: dt(5), keterangan: "Pembelian kantong plastik", debit: 0, kredit: 50000,   ref_type: "manual" },
  { id: _init.nextKeuId + 3, tanggal: dt(8), keterangan: "Pembelian PO-001",          debit: 0, kredit: 500000,  ref_type: "pembelian", ref_id: 1 },
  { id: _init.nextKeuId + 4, tanggal: dt(3), keterangan: "Pembelian PO-002",          debit: 0, kredit: 1065000, ref_type: "pembelian", ref_id: 2 },
];
let nextTrxId = _init.nextTrxId;
let nextDetId = _init.nextDetId;
let nextKeuId = _init.nextKeuId + 5;

// ─── PEMBELIAN ────────────────────────────────────────────────────────────────
let DB_PEMBELIAN: Record<string, unknown>[] = [
  { id: 1, no_faktur: "PO-001", tanggal: dt(8), total: 500000,  status: "confirmed" },
  { id: 2, no_faktur: "PO-002", tanggal: dt(3), total: 1065000, status: "confirmed" },
  { id: 3, no_faktur: "PO-003", tanggal: dt(1), total: 476000,  status: "draft" },
];
let DB_PEMBELIAN_DETAIL: Record<string, unknown>[] = [
  { id: 1, id_pembelian: 1, barcode: "8992717300009", nama_barang: "Aqua 600ml",           sat: "PCS",     qty: 100, hpp: 2500,  harga_1: 4000,  total: 250000 },
  { id: 2, id_pembelian: 1, barcode: "8992717300016", nama_barang: "Aqua 1500ml",          sat: "PCS",     qty: 50,  hpp: 5000,  harga_1: 8000,  total: 250000 },
  { id: 3, id_pembelian: 2, barcode: "8886388110152", nama_barang: "Indomie Goreng",        sat: "PCS",     qty: 150, hpp: 2800,  harga_1: 3500,  total: 420000 },
  { id: 4, id_pembelian: 2, barcode: "8998009010051", nama_barang: "Rokok Sampoerna Mild",  sat: "BUNGKUS", qty: 30,  hpp: 21500, harga_1: 25000, total: 645000 },
  { id: 5, id_pembelian: 3, barcode: "8994500022401", nama_barang: "Teh Botol Sosro 450ml", sat: "PCS",     qty: 48,  hpp: 4000,  harga_1: 6000,  total: 192000 },
  { id: 6, id_pembelian: 3, barcode: "8991000500109", nama_barang: "Chitato Sapi Panggang", sat: "PCS",     qty: 22,  hpp: 13000, harga_1: 16000, total: 286000 },
];
let nextPemId = 4, nextPemDetId = 7;

// ─── ROUTER ───────────────────────────────────────────────────────────────────
type Params = Record<string, string | number | boolean | undefined>;
type Opts = { method?: string; body?: unknown; params?: Params };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function request<T>(path: string, opts: Opts = {}): Promise<T> {
  await delay(80);
  const { method = "GET", body, params } = opts;

  // Parse query string embedded in path (e.g. DELETE /master/barang?barcode=xxx)
  const [cleanPath, qs] = path.split("?");
  const qp: Record<string, string> = {};
  if (qs) for (const part of qs.split("&")) { const [k, v] = part.split("="); qp[decodeURIComponent(k)] = decodeURIComponent(v ?? ""); }
  const p = { ...params, ...qp } as Record<string, string>;
  const seg = cleanPath.replace(/^\//, "").split("/").filter(Boolean);

  // ── AUTH ────────────────────────────────────────────────────────────────────
  if (seg[0] === "auth") {
    const { username, password } = body as Record<string, string>;
    const user = DEMO_USERS.find((u) => u.username === username && u.password === password);
    if (!user) throw new Error("Username atau password salah");
    const { password: _pw, ...userOut } = user;
    return { access_token: "demo-token", user: userOut } as T;
  }

  // ── SETTING ─────────────────────────────────────────────────────────────────
  if (seg[0] === "setting") {
    if (method === "GET")  return { ...SETTING } as T;
    if (method === "PUT")  { SETTING = { ...SETTING, ...(body as object) }; return { ...SETTING } as T; }
    if (method === "POST") return { ...SETTING } as T; // logo upload no-op
  }

  // ── MASTER BARANG ────────────────────────────────────────────────────────────
  if (seg[0] === "master" && seg[1] === "barang") {
    if (method === "GET") {
      if (seg[2]) {
        const b = DB_BARANG.find((x) => x.barcode === seg[2]);
        if (!b) throw new Error(`Barang "${seg[2]}" tidak ditemukan`);
        return b as T;
      }
      const q = (p.q ?? "").toLowerCase();
      return (q ? DB_BARANG.filter((b) => (b.nama_barang as string).toLowerCase().includes(q) || (b.barcode as string).includes(q)) : DB_BARANG) as T;
    }
    if (method === "POST") {
      const nb = body as Record<string, unknown>;
      if (DB_BARANG.find((x) => x.barcode === nb.barcode)) throw new Error("Barcode sudah digunakan");
      DB_BARANG.push(nb); return nb as T;
    }
    if (method === "PUT" && seg[2]) {
      const idx = DB_BARANG.findIndex((x) => x.barcode === seg[2]);
      if (idx < 0) throw new Error("Barang tidak ditemukan");
      DB_BARANG[idx] = { ...DB_BARANG[idx], ...(body as object) }; return DB_BARANG[idx] as T;
    }
    if (method === "DELETE" && p.barcode) {
      DB_BARANG = DB_BARANG.filter((x) => x.barcode !== p.barcode); return undefined as T;
    }
  }

  // ── MASTER USER ───────────────────────────────────────────────────────────────
  if (seg[0] === "master" && seg[1] === "user") {
    if (method === "GET") return DEMO_USERS.map(({ password: _pw, ...u }) => u) as T;
    if (method === "POST") {
      const nu = { ...(body as object), id: nextUserId++, is_active: true };
      DEMO_USERS.push(nu as Record<string, unknown>);
      const { password: _pw, ...out } = nu as Record<string, unknown>; return out as T;
    }
    if (method === "PUT" && seg[2]) {
      const idx = DEMO_USERS.findIndex((u) => u.id === Number(seg[2]));
      if (idx >= 0) DEMO_USERS[idx] = { ...DEMO_USERS[idx], ...(body as object) };
      const { password: _pw, ...out } = DEMO_USERS[idx ?? 0]; return out as T;
    }
    if (method === "DELETE" && seg[2]) {
      const idx = DEMO_USERS.findIndex((u) => u.id === Number(seg[2]));
      if (idx >= 0) DEMO_USERS.splice(idx, 1); return undefined as T;
    }
  }

  // ── LAPORAN ──────────────────────────────────────────────────────────────────
  if (seg[0] === "laporan") {
    const from = p.tgl_mulai ?? "";
    const to   = p.tgl_selesai ?? "";
    const paidTrx = DB_TRANSAKSI.filter((t) => t.status === "paid" && inRange(t.tanggal as string, from, to));
    const paidIds  = new Set(paidTrx.map((t) => t.id));
    const paidDet  = DB_TRANSAKSI_DETAIL.filter((d) => paidIds.has(d.id_transaksi));

    if (seg[1] === "penjualan") {
      const byDate = new Map<string, { total_penjualan: number; laba_kotor: number; jumlah_transaksi: number }>();
      for (const trx of paidTrx) {
        const date = (trx.tanggal as string).slice(0, 10);
        const dets = DB_TRANSAKSI_DETAIL.filter((d) => d.id_transaksi === trx.id);
        const laba = dets.reduce((s, d) => s + (d.total as number) - (d.hpp as number) * (d.qty as number), 0);
        const cur = byDate.get(date) ?? { total_penjualan: 0, laba_kotor: 0, jumlah_transaksi: 0 };
        byDate.set(date, { total_penjualan: cur.total_penjualan + (trx.total as number), laba_kotor: cur.laba_kotor + laba, jumlah_transaksi: cur.jumlah_transaksi + 1 });
      }
      return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([tanggal, v]) => ({ tanggal, ...v })) as T;
    }

    if (seg[1] === "produk-terlaris") {
      const limit = Number(p.limit ?? 10);
      const byBarcode = new Map<string, { nama_barang: string; total_qty: number; total_penjualan: number }>();
      for (const d of paidDet) {
        const cur = byBarcode.get(d.barcode as string) ?? { nama_barang: d.nama_barang as string, total_qty: 0, total_penjualan: 0 };
        byBarcode.set(d.barcode as string, { ...cur, total_qty: cur.total_qty + (d.qty as number), total_penjualan: cur.total_penjualan + (d.total as number) });
      }
      return [...byBarcode.entries()].map(([barcode, v]) => ({ barcode, ...v })).sort((a, b) => b.total_qty - a.total_qty).slice(0, limit) as T;
    }

    if (seg[1] === "penjualan-detail") {
      return paidDet.map((d) => {
        const trx = DB_TRANSAKSI.find((t) => t.id === d.id_transaksi)!;
        return { id: d.id, transaksi_id: trx.id, tanggal: trx.tanggal, no_transaksi: trx.no_transaksi, nama_barang: d.nama_barang, sat: d.sat, qty: d.qty, hpp: d.hpp, harga: d.harga, diskon: d.diskon, total: d.total, laba_kotor: (d.total as number) - (d.hpp as number) * (d.qty as number) };
      }).sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal))) as T;
    }

    if (seg[1] === "transaksi") {
      return paidTrx.sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal))).map((trx) => ({
        ...trx,
        kasir: ((DEMO_USERS.find((u) => u.id === trx.id_user) ?? { nama: "-" }).nama),
        detail: DB_TRANSAKSI_DETAIL.filter((d) => d.id_transaksi === trx.id).map((d) => ({ nama_barang: d.nama_barang, qty: d.qty, sat: d.sat, harga: d.harga, diskon: d.diskon, total: d.total })),
      })) as T;
    }

    if (seg[1] === "stok") return DB_BARANG as T;
  }

  // ── KEUANGAN ─────────────────────────────────────────────────────────────────
  if (seg[0] === "keuangan") {
    if (method === "GET") {
      const from = p.tgl_mulai ?? ""; const to = p.tgl_selesai ?? "";
      return DB_KEUANGAN.filter((k) => inRange(k.tanggal as string, from, to)).sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal))) as T;
    }
    if (method === "POST") {
      const entry = { ...(body as object), id: nextKeuId++, tanggal: new Date().toISOString(), ref_type: "manual" };
      DB_KEUANGAN.push(entry); return entry as T;
    }
  }

  // ── PURCHAS ───────────────────────────────────────────────────────────────────
  if (seg[0] === "purchas") {
    const pemId = seg[1] ? Number(seg[1]) : null;

    if (!pemId && method === "GET") {
      const from = p.tgl_mulai ?? ""; const to = p.tgl_selesai ?? "";
      return DB_PEMBELIAN.filter((x) => inRange(x.tanggal as string, from, to))
        .sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)))
        .map((x) => ({ ...x, detail: DB_PEMBELIAN_DETAIL.filter((d) => d.id_pembelian === x.id) })) as T;
    }

    if (!pemId && method === "POST") {
      const { detail: dets, ...header } = body as Record<string, unknown>;
      const total = (dets as Record<string, number>[]).reduce((s, d) => s + d.qty * d.hpp, 0);
      const np = { ...header, id: nextPemId++, total, status: "draft" };
      DB_PEMBELIAN.push(np);
      const nd = (dets as Record<string, unknown>[]).map((d) => ({ ...d, id: nextPemDetId++, id_pembelian: np.id, total: (d.qty as number) * (d.hpp as number) }));
      DB_PEMBELIAN_DETAIL.push(...nd);
      return { ...np, detail: nd } as T;
    }

    if (pemId && seg[2] === "confirm" && method === "POST") {
      const pm = DB_PEMBELIAN.find((x) => x.id === pemId);
      if (!pm) throw new Error("Pembelian tidak ditemukan");
      if (pm.status === "confirmed") throw new Error("Sudah dikonfirmasi");
      pm.status = "confirmed";
      for (const d of DB_PEMBELIAN_DETAIL.filter((x) => x.id_pembelian === pemId)) {
        const b = DB_BARANG.find((x) => x.barcode === d.barcode);
        if (b) b.stok = (b.stok as number) + (d.qty as number);
      }
      DB_KEUANGAN.push({ id: nextKeuId++, tanggal: pm.tanggal, keterangan: `Pembelian ${pm.no_faktur}`, debit: 0, kredit: pm.total, ref_type: "pembelian", ref_id: pemId });
      return pm as T;
    }

    if (pemId && method === "PUT") {
      const pm = DB_PEMBELIAN.find((x) => x.id === pemId);
      if (!pm) throw new Error("Pembelian tidak ditemukan");
      if (pm.status === "confirmed") throw new Error("Tidak dapat mengubah yang sudah dikonfirmasi");
      const { detail: dets, ...header } = body as Record<string, unknown>;
      const total = (dets as Record<string, number>[]).reduce((s, d) => s + d.qty * d.hpp, 0);
      Object.assign(pm, { ...header, total });
      DB_PEMBELIAN_DETAIL = DB_PEMBELIAN_DETAIL.filter((x) => x.id_pembelian !== pemId);
      const nd = (dets as Record<string, unknown>[]).map((d) => ({ ...d, id: nextPemDetId++, id_pembelian: pemId, total: (d.qty as number) * (d.hpp as number) }));
      DB_PEMBELIAN_DETAIL.push(...nd);
      return { ...pm, detail: nd } as T;
    }
  }

  // ── KASIR ─────────────────────────────────────────────────────────────────────
  if (seg[0] === "kasir") {
    if (seg[1] === "session") return { has_held: false, transaksi: null } as T;

    if (seg[1] === "transaksi" && !seg[2] && method === "POST") {
      const { bayar, detail } = body as Record<string, unknown>;
      const dets = detail as Record<string, number>[];
      const total = dets.reduce((s, i) => s + i.qty * i.harga - i.diskon, 0);
      if ((bayar as number) < total) throw new Error(`Uang bayar kurang dari total (${total.toLocaleString("id-ID")})`);
      const now = new Date();
      const dateKey = now.toISOString().slice(0, 10).replace(/-/g, "");
      const todayCount = DB_TRANSAKSI.filter((t) => (t.tanggal as string).slice(0, 10) === now.toISOString().slice(0, 10)).length;
      const no_transaksi = `TRX-${dateKey}-${String(todayCount + 1).padStart(3, "0")}`;
      const newTrx = { id: nextTrxId++, no_transaksi, tanggal: now.toISOString(), id_user: 1, total, bayar, kembalian: (bayar as number) - total, status: "paid" };
      DB_TRANSAKSI.push(newTrx);
      const nd = (detail as Record<string, unknown>[]).map((i) => ({
        id: nextDetId++, id_transaksi: newTrx.id, barcode: i.barcode, nama_barang: i.nama_barang, sat: i.sat, qty: i.qty, hpp: i.hpp, harga: i.harga, diskon: i.diskon,
        total: (i.qty as number) * (i.harga as number) - (i.diskon as number),
      }));
      DB_TRANSAKSI_DETAIL.push(...nd);
      for (const d of nd) {
        const b = DB_BARANG.find((x) => x.barcode === d.barcode);
        if (b) {
          if ((b.stok as number) - (d.qty as number) < 0) throw new Error(`Stok ${b.nama_barang} tidak mencukupi`);
          b.stok = (b.stok as number) - (d.qty as number);
        }
      }
      DB_KEUANGAN.push({ id: nextKeuId++, tanggal: newTrx.tanggal, keterangan: `Penjualan ${no_transaksi}`, debit: total, kredit: 0, ref_type: "transaksi", ref_id: newTrx.id });
      return { ...newTrx, detail: nd } as T;
    }

    if (seg[1] === "transaksi" && seg[3] === "void" && method === "POST") {
      const id = Number(seg[2]);
      const trx = DB_TRANSAKSI.find((t) => t.id === id);
      if (!trx) throw new Error("Transaksi tidak ditemukan");
      if (trx.status === "cancelled") throw new Error("Transaksi sudah dibatalkan");
      trx.status = "cancelled";
      for (const d of DB_TRANSAKSI_DETAIL.filter((x) => x.id_transaksi === id)) {
        const b = DB_BARANG.find((x) => x.barcode === d.barcode);
        if (b) b.stok = (b.stok as number) + (d.qty as number);
      }
      DB_KEUANGAN.push({ id: nextKeuId++, tanggal: new Date().toISOString(), keterangan: `VOID ${trx.no_transaksi}`, debit: 0, kredit: trx.total, ref_type: "transaksi", ref_id: id });
      return trx as T;
    }
  }

  // ── PRINT (no-op) ────────────────────────────────────────────────────────────
  if (seg[0] === "print") return undefined as T;

  return undefined as T;
}

type ApiParams = Record<string, string | number | boolean | undefined>;

export const api = {
  get:    <T>(path: string, params?: ApiParams) => request<T>(path, { params }),
  post:   <T>(path: string, body: unknown)       => request<T>(path, { method: "POST", body }),
  put:    <T>(path: string, body: unknown)        => request<T>(path, { method: "PUT",  body }),
  delete: <T>(path: string)                       => request<T>(path, { method: "DELETE" }),
};
