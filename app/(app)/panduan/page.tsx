"use client";
import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "pengenalan",  label: "Pengenalan Sistem" },
  { id: "kasir",       label: "Modul Kasir (POS)" },
  { id: "scanner",     label: "Scanner Barcode" },
  { id: "printer",     label: "Printer Struk" },
  { id: "pembelian",   label: "Modul Pembelian" },
  { id: "keuangan",    label: "Modul Keuangan" },
  { id: "laporan",     label: "Modul Laporan" },
  { id: "master",      label: "Master Data" },
  { id: "pengguna",    label: "Manajemen Pengguna" },
  { id: "setting",     label: "Setting Toko" },
  { id: "troubleshoot",label: "Troubleshooting" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-10 scroll-mt-6">
      <h2 className="text-base font-bold text-gray-900 border-b pb-2 mb-4">{title}</h2>
      <div className="text-sm text-gray-700 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-800 text-white text-xs font-bold flex items-center justify-center mt-0.5">{n}</span>
      <p>{children}</p>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2 text-amber-800 text-xs">{children}</div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 text-blue-800 text-xs">{children}</div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>;
}

export default function PanduanPage() {
  const [active, setActive] = useState("pengenalan");

  useEffect(() => {
    const handler = () => {
      const scrollY = window.scrollY + 100;
      for (const s of [...SECTIONS].reverse()) {
        const el = document.getElementById(s.id);
        if (el && el.offsetTop <= scrollY) { setActive(s.id); break; }
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="flex gap-0 h-full">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 border-r bg-white overflow-y-auto sticky top-0 h-full">
        <div className="p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Daftar Isi</p>
          <nav className="space-y-0.5">
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`}
                onClick={() => setActive(s.id)}
                className={`block px-2 py-1.5 rounded text-xs transition-colors ${
                  active === s.id
                    ? "bg-gray-900 text-white font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}>
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Panduan Pengguna</h1>
          <p className="text-xs text-gray-500 mb-8">Kasir App — Sistem Point of Sale untuk toko retail</p>

          {/* ── Pengenalan ── */}
          <Section id="pengenalan" title="Pengenalan Sistem">
            <p>
              Kasir App adalah sistem Point of Sale (POS) berbasis web yang berjalan di komputer kasir dan
              dapat diakses dari perangkat lain (ponsel/laptop pemilik) melalui jaringan WiFi yang sama.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[
                ["Kasir",   "Layar POS untuk transaksi penjualan harian"],
                ["Admin",   "Akses ke semua modul termasuk pembelian dan master data"],
                ["Owner",   "Akses penuh termasuk laporan keuangan dan analitik"],
              ].map(([role, desc]) => (
                <div key={role} className="border rounded p-3">
                  <p className="font-semibold text-gray-800">{role}</p>
                  <p className="text-gray-500 text-xs mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Kasir ── */}
          <Section id="kasir" title="Modul Kasir (POS)">
            <p>Layar utama kasir digunakan untuk melayani pelanggan. Buka halaman <strong>KASIR</strong> di navbar.</p>
            <p className="font-semibold text-gray-800 mt-2">Cara melakukan transaksi:</p>
            <Step n={1}>Pastikan kursor berada di kolom input barcode di bagian bawah layar (otomatis aktif saat halaman dibuka).</Step>
            <Step n={2}>Scan barcode produk menggunakan scanner, atau ketik kode barcode lalu tekan <Code>Enter</Code>.</Step>
            <Step n={3}>Produk muncul di tabel transaksi. Klik baris produk untuk mengubah QTY menggunakan numpad.</Step>
            <Step n={4}>Klik tombol <strong>BAYAR</strong> di pojok kanan bawah untuk membuka layar pembayaran.</Step>
            <Step n={5}>Masukkan nominal uang yang diterima dari pelanggan. Kembalian dihitung otomatis.</Step>
            <Step n={6}>Klik <strong>KONFIRMASI</strong> untuk menyelesaikan transaksi. Struk dicetak otomatis.</Step>
            <Tip>Harga produk menyesuaikan QTY secara otomatis — produk dengan harga grosir akan turun harga saat QTY mencapai batas minimum yang ditentukan.</Tip>
          </Section>

          {/* ── Scanner ── */}
          <Section id="scanner" title="Scanner Barcode">
            <p>
              Scanner barcode bekerja sebagai <strong>keyboard USB HID</strong> — tidak memerlukan driver khusus.
              Scanner mengirim karakter barcode diikuti tombol <Code>Enter</Code>, persis seperti mengetik di keyboard.
            </p>
            <p className="font-semibold text-gray-800 mt-2">Cara menambah scanner baru:</p>
            <Step n={1}>Colokkan kabel USB scanner ke port USB di komputer kasir.</Step>
            <Step n={2}>Tunggu 3–5 detik hingga Windows/Mac mendeteksi perangkat secara otomatis (tidak perlu install driver).</Step>
            <Step n={3}>Buka halaman <strong>KASIR</strong> di browser.</Step>
            <Step n={4}>Klik satu kali di area tabel transaksi agar input barcode aktif (atau tekan Tab).</Step>
            <Step n={5}>Coba scan barcode produk — produk harus langsung muncul di tabel.</Step>
            <Note>Jika scanner tidak merespons: pastikan halaman KASIR sedang aktif dan kursor berada di kolom input barcode. Input barcode selalu aktif otomatis saat halaman dibuka, tapi bisa teralihkan jika ada klik di tempat lain.</Note>
            <p className="font-semibold text-gray-800 mt-2">Troubleshooting scanner:</p>
            <div className="space-y-2">
              <div className="border rounded p-3">
                <p className="font-medium">Scanner menyala tapi tidak scan produk</p>
                <p className="text-gray-500 mt-1">Klik sekali di kolom input barcode (kolom paling bawah di halaman KASIR), kemudian coba scan ulang.</p>
              </div>
              <div className="border rounded p-3">
                <p className="font-medium">Barcode terbaca tapi produk tidak ditemukan</p>
                <p className="text-gray-500 mt-1">Produk belum terdaftar di Master Barang. Tambahkan produk terlebih dahulu di halaman <strong>MASTER → Barang</strong>.</p>
              </div>
              <div className="border rounded p-3">
                <p className="font-medium">Karakter barcode muncul tapi tidak muncul di kolom input</p>
                <p className="text-gray-500 mt-1">Periksa pengaturan bahasa keyboard di OS. Scanner mungkin menggunakan layout keyboard yang berbeda (US vs ID). Sesuaikan di pengaturan Windows/Mac.</p>
              </div>
              <div className="border rounded p-3">
                <p className="font-medium">Scanner tidak terdeteksi sama sekali</p>
                <p className="text-gray-500 mt-1">Coba port USB yang berbeda. Coba di aplikasi Notepad/TextEdit untuk memastikan scanner berfungsi. Jika tetap tidak terdeteksi, scanner mungkin perlu konfigurasi ulang ke mode HID.</p>
              </div>
            </div>
          </Section>

          {/* ── Printer ── */}
          <Section id="printer" title="Printer Struk Termal">
            <p>Printer struk terhubung ke komputer kasir melalui USB atau Serial. Semua perintah cetak diproses oleh server backend menggunakan protokol ESC/POS.</p>
            <p className="font-semibold text-gray-800 mt-2">Cara mengatur printer:</p>
            <Step n={1}>Hubungkan printer struk ke komputer kasir via USB.</Step>
            <Step n={2}>Cek port printer: di Windows buka <Code>Device Manager → Ports (COM & LPT)</Code> — catat nama port seperti <Code>COM3</Code>. Di Linux/Mac cari <Code>/dev/usb/lp0</Code> atau <Code>/dev/ttyUSB0</Code>.</Step>
            <Step n={3}>Buka halaman <strong>SETTING</strong> di aplikasi.</Step>
            <Step n={4}>Isi kolom <strong>Printer Port</strong> dengan nama port yang ditemukan (contoh: <Code>COM3</Code>).</Step>
            <Step n={5}>Pilih <strong>Lebar Kertas</strong> sesuai printer Anda: <Code>58</Code> mm (kertas kecil) atau <Code>80</Code> mm (kertas standar).</Step>
            <Step n={6}>Klik <strong>Simpan Setting</strong>. Printer akan aktif pada transaksi berikutnya.</Step>
            <Note>Jika printer tidak tersedia atau port tidak diisi, transaksi tetap berjalan normal — hanya struk fisik yang tidak tercetak. Gunakan fitur cetak ulang di detail transaksi jika diperlukan.</Note>
          </Section>

          {/* ── Pembelian ── */}
          <Section id="pembelian" title="Modul Pembelian">
            <p>Modul Pembelian digunakan untuk mencatat pembelian stok dari supplier. Stok gudang hanya bertambah setelah pembelian <strong>dikonfirmasi</strong>.</p>
            <p className="font-semibold text-gray-800 mt-2">Cara membuat pembelian:</p>
            <Step n={1}>Buka halaman <strong>PURCHAS</strong> dan klik <strong>Buat Pembelian</strong>.</Step>
            <Step n={2}>Isi nomor faktur dari supplier dan tanggal pembelian.</Step>
            <Step n={3}>Isi baris detail: barcode produk, nama, satuan, jumlah (QTY), dan HPP (harga beli).</Step>
            <Step n={4}>Klik <strong>Simpan Draft</strong>. Pembelian tersimpan dengan status <em>draft</em> — stok belum berubah.</Step>
            <Step n={5}>Setelah barang fisik diterima, klik tombol <strong>Konfirmasi</strong> pada baris pembelian tersebut.</Step>
            <Step n={6}>Stok produk otomatis bertambah dan entri pengeluaran masuk ke buku keuangan.</Step>
            <Tip>Gunakan status <em>draft</em> saat mencatat pesanan yang belum datang. Konfirmasi hanya setelah barang benar-benar diterima di toko.</Tip>
          </Section>

          {/* ── Keuangan ── */}
          <Section id="keuangan" title="Modul Keuangan">
            <p>Buku kas digital yang mencatat semua pemasukan dan pengeluaran toko secara otomatis maupun manual.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="border rounded p-3">
                <p className="font-semibold">Otomatis tercatat:</p>
                <ul className="mt-1 space-y-1 text-gray-600">
                  <li>• Penjualan dari kasir → <em>debit</em></li>
                  <li>• Pembelian dikonfirmasi → <em>kredit</em></li>
                </ul>
              </div>
              <div className="border rounded p-3">
                <p className="font-semibold">Entri manual untuk:</p>
                <ul className="mt-1 space-y-1 text-gray-600">
                  <li>• Biaya listrik, sewa, gaji</li>
                  <li>• Saldo awal kas</li>
                  <li>• Pengeluaran operasional lain</li>
                </ul>
              </div>
            </div>
            <p>Filter tanggal di bagian atas untuk melihat periode tertentu. Klik <strong>Tampilkan</strong> setelah mengubah rentang tanggal.</p>
          </Section>

          {/* ── Laporan ── */}
          <Section id="laporan" title="Modul Laporan">
            <p>Terdiri dari tiga halaman laporan:</p>
            <div className="space-y-2">
              <div className="border rounded p-3">
                <p className="font-semibold">LAPORAN — Ringkasan &amp; Grafik</p>
                <p className="text-gray-500 mt-1">Ringkasan penjualan, grafik revenue vs laba 14 hari, dan produk terlaris bulan ini. Atur rentang tanggal lalu klik <strong>Tampilkan</strong>. Tombol <strong>Export Laporan Lengkap</strong> mengunduh satu PDF yang menggabungkan ringkasan penjualan, detail per item, dan laporan pembelian sekaligus.</p>
              </div>
              <div className="border rounded p-3">
                <p className="font-semibold">PENJUALAN — Detail Per Item</p>
                <p className="text-gray-500 mt-1">Tabel semua item terjual beserta HPP, harga, diskon, dan laba kotor per baris. Bisa difilter per periode dan diekspor ke PDF tersendiri.</p>
              </div>
              <div className="border rounded p-3">
                <p className="font-semibold">LAPORAN → Riwayat Transaksi</p>
                <p className="text-gray-500 mt-1">Daftar transaksi per periode, bisa diperluas untuk melihat detail item dan mencetak ulang struk.</p>
              </div>
            </div>
            <Tip>Akses laporan dari ponsel atau laptop pemilik melalui WiFi yang sama: buka <Code>http://[IP komputer kasir]:3000/laporan</Code>. IP bisa dicek dengan perintah <Code>ipconfig</Code> (Windows) atau <Code>ifconfig</Code> (Mac/Linux).</Tip>
          </Section>

          {/* ── Master ── */}
          <Section id="master" title="Master Data (Barang)">
            <p>Semua produk yang dijual harus terdaftar di Master Barang agar bisa di-scan di kasir.</p>
            <p className="font-semibold text-gray-800 mt-2">Cara menambah produk baru:</p>
            <Step n={1}>Buka <strong>MASTER → tab Barang</strong> dan klik <strong>Tambah</strong>.</Step>
            <Step n={2}>Isi <strong>Barcode</strong> — scan langsung menggunakan scanner di kolom ini, atau ketik manual.</Step>
            <Step n={3}>Isi nama barang, satuan (PCS/BTL/BKS/dll), dan HPP (harga beli/modal).</Step>
            <Step n={4}>Isi <strong>Harga 1</strong> (harga eceran normal).</Step>
            <Step n={5}>Opsional — isi Harga 2 dan Min QTY Harga 2 untuk harga grosir. Contoh: beli 12+ dapat Harga 2.</Step>
            <Step n={6}>Isi <strong>Stok</strong> (jumlah saat ini) dan <strong>Stok Minimum</strong> (batas peringatan merah).</Step>
            <Step n={7}>Klik <strong>Simpan</strong>.</Step>
            <Note>Stok akan berubah otomatis: berkurang saat ada transaksi penjualan, bertambah saat pembelian dikonfirmasi.</Note>
          </Section>

          {/* ── Pengguna ── */}
          <Section id="pengguna" title="Manajemen Pengguna">
            <p>Buka <strong>MASTER → tab Pengguna</strong> untuk mengelola akun kasir dan admin.</p>
            <div className="space-y-2">
              <div className="border rounded p-3">
                <p className="font-semibold">Tambah akun baru</p>
                <p className="text-gray-500 mt-1">Klik <strong>Tambah Akun</strong>, isi username, password, nama lengkap, dan pilih peran (Kasir/Admin/Owner).</p>
              </div>
              <div className="border rounded p-3">
                <p className="font-semibold">Reset password</p>
                <p className="text-gray-500 mt-1">Klik ikon pensil pada baris pengguna. Isi kolom <em>Password Baru</em> dan klik Simpan. Kosongkan jika tidak ingin mengubah password.</p>
              </div>
              <div className="border rounded p-3">
                <p className="font-semibold">Nonaktifkan akun</p>
                <p className="text-gray-500 mt-1">Klik ikon perisai pada baris pengguna untuk toggle aktif/nonaktif. Akun nonaktif tidak bisa login.</p>
              </div>
            </div>
            <Note>Anda tidak dapat menghapus atau menonaktifkan akun yang sedang digunakan untuk login.</Note>
          </Section>

          {/* ── Setting ── */}
          <Section id="setting" title="Setting Toko">
            <p>Buka halaman <strong>SETTING</strong> untuk mengonfigurasi informasi toko dan perangkat keras.</p>
            <div className="border rounded divide-y">
              {[
                ["Nama Toko",      "Muncul di header struk pelanggan"],
                ["Alamat",         "Alamat toko — ditampilkan di struk"],
                ["Telepon",        "Nomor telepon toko di struk"],
                ["Printer Port",   "Port USB/Serial printer. Contoh: COM3 (Windows), /dev/usb/lp0 (Linux)"],
                ["Lebar Kertas",   "58mm (kertas kecil) atau 80mm (kertas standar)"],
                ["Footer Struk",   "Pesan di bagian bawah struk, misalnya ucapan terima kasih"],
                ["Pajak (%)",      "Persentase pajak. Isi 0 jika tidak ada pajak"],
              ].map(([field, desc]) => (
                <div key={field} className="px-3 py-2 flex gap-4">
                  <span className="w-36 font-medium text-gray-800 flex-shrink-0">{field}</span>
                  <span className="text-gray-500">{desc}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Troubleshooting ── */}
          <Section id="troubleshoot" title="Troubleshooting Umum">
            <div className="space-y-3">
              {[
                {
                  q: "Tidak bisa login — username/password salah",
                  a: "Pastikan Caps Lock tidak aktif. Password bawaan: admin = admin123, kasir1 = kasir123. Hubungi admin untuk reset password.",
                },
                {
                  q: "Halaman tidak bisa dibuka dari ponsel pemilik",
                  a: "Pastikan ponsel terhubung ke WiFi yang sama dengan komputer kasir. Gunakan IP lokal komputer (bukan localhost). Cek IP dengan perintah ipconfig (Windows) atau ifconfig (Mac).",
                },
                {
                  q: "Transaksi berhasil tapi struk tidak keluar",
                  a: "Periksa koneksi printer dan pastikan Printer Port di Setting sudah benar. Transaksi sudah tersimpan — bisa cetak ulang dari detail transaksi.",
                },
                {
                  q: "Stok produk tidak bertambah setelah pembelian",
                  a: "Pembelian masih berstatus draft. Klik tombol Konfirmasi pada baris pembelian di halaman PURCHAS untuk mengupdate stok.",
                },
                {
                  q: "Produk tidak ditemukan saat scan barcode",
                  a: "Produk belum terdaftar. Tambahkan di MASTER → Barang dengan barcode yang sesuai.",
                },
                {
                  q: "Server backend tidak bisa diakses (error koneksi)",
                  a: "Pastikan backend berjalan: buka terminal di folder backend, aktifkan virtual env, jalankan uvicorn main:app --host 0.0.0.0 --reload. Cek di http://localhost:8000/docs.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="border rounded p-3">
                  <p className="font-medium text-gray-800">{q}</p>
                  <p className="text-gray-500 mt-1">{a}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Developer credit */}
          <div className="border-t pt-6 mt-2 text-center text-sm text-gray-400">
            <p>Dikembangkan oleh{" "}
              <a
                href="https://faqihalam.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                faqih28alam
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
