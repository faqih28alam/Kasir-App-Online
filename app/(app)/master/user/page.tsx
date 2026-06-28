"use client";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ShieldCheck, ShieldOff } from "lucide-react";
import { api } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { toast } from "@/components/shared/Toast";
import { DataTable } from "@/components/shared/DataTable";
import { Modal } from "@/components/shared/Modal";

interface UserRow {
  id: number;
  username: string;
  nama: string;
  role: "kasir" | "admin" | "owner";
  is_active: boolean;
}

const EMPTY_CREATE = { username: "", password: "", nama: "", role: "kasir" as const };
const EMPTY_EDIT = { nama: "", role: "kasir" as UserRow["role"], is_active: true, password: "" };

const ROLE_LABEL: Record<string, string> = { kasir: "Kasir", admin: "Admin", owner: "Owner" };
const ROLE_COLOR: Record<string, string> = {
  kasir: "bg-blue-100 text-blue-700",
  admin: "bg-purple-100 text-purple-700",
  owner: "bg-amber-100 text-amber-700",
};

export default function UserPage() {
  const [data, setData] = useState<UserRow[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const me = getUser();

  async function load() {
    try { setData(await api.get<UserRow[]>("/master/user")); }
    catch (err) { toast((err as Error).message, "error"); }
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setCreateForm(EMPTY_CREATE); setShowCreate(true); }
  function openEdit(u: UserRow) {
    setEditForm({ nama: u.nama, role: u.role, is_active: u.is_active, password: "" });
    setEditTarget(u);
  }

  async function handleCreate() {
    try {
      await api.post("/master/user", createForm);
      toast("Akun berhasil dibuat", "success");
      setShowCreate(false);
      load();
    } catch (err) { toast((err as Error).message, "error"); }
  }

  async function handleEdit() {
    if (!editTarget) return;
    const payload: Record<string, unknown> = { nama: editForm.nama, role: editForm.role, is_active: editForm.is_active };
    if (editForm.password) payload.password = editForm.password;
    try {
      await api.put(`/master/user/${editTarget.id}`, payload);
      toast("Akun diperbarui", "success");
      setEditTarget(null);
      load();
    } catch (err) { toast((err as Error).message, "error"); }
  }

  async function handleDelete(u: UserRow) {
    if (!confirm(`Hapus akun "${u.username}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await api.delete(`/master/user/${u.id}`);
      toast("Akun dihapus", "success");
      load();
    } catch (err) { toast((err as Error).message, "error"); }
  }

  async function toggleActive(u: UserRow) {
    try {
      await api.put(`/master/user/${u.id}`, { is_active: !u.is_active });
      toast(u.is_active ? "Akun dinonaktifkan" : "Akun diaktifkan", "success");
      load();
    } catch (err) { toast((err as Error).message, "error"); }
  }

  const isSelf = (u: UserRow) => u.id === me?.id;

  return (
    <div className="p-5">
      <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Manajemen Pengguna</h1>
          <p className="text-xs text-gray-500 mt-0.5">Kelola akun kasir dan admin — atur peran, status aktif, dan kata sandi.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-sm flex-shrink-0">
          <Plus size={14} /> Tambah Akun
        </button>
      </div>

      <DataTable
        columns={[
          { key: "username", label: "Username", className: "font-mono font-medium" },
          { key: "nama",     label: "Nama Lengkap", className: "font-medium hidden sm:table-cell" },
          { key: "role",     label: "Peran", render: (r: UserRow) => (
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${ROLE_COLOR[r.role]}`}>
              {ROLE_LABEL[r.role]}
            </span>
          )},
          { key: "is_active", label: "Status", render: (r: UserRow) => (
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${r.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {r.is_active ? "Aktif" : "Nonaktif"}
            </span>
          )},
          { key: "actions", label: "", render: (r: UserRow) => (
            <div className="flex gap-1">
              <button onClick={() => openEdit(r)} title="Edit"
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600">
                <Pencil size={14} />
              </button>
              {!isSelf(r) && (
                <button onClick={() => toggleActive(r)} title={r.is_active ? "Nonaktifkan" : "Aktifkan"}
                  className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-amber-600">
                  {r.is_active ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                </button>
              )}
              {!isSelf(r) && (
                <button onClick={() => handleDelete(r)} title="Hapus"
                  className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )},
        ]}
        data={data}
        keyField="id"
      />

      {/* Create modal */}
      {showCreate && (
        <Modal title="Tambah Akun" onClose={() => setShowCreate(false)}>
          <div className="flex flex-col gap-3">
            {([ ["username","Username","text"], ["nama","Nama Lengkap","text"], ["password","Password","password"] ] as const).map(([k, label, type]) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input type={type} value={createForm[k]}
                  onChange={(e) => setCreateForm({ ...createForm, [k]: e.target.value })}
                  className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Peran</label>
              <select value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as typeof createForm.role })}
                className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300">
                <option value="kasir">Kasir</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Batal</button>
              <button onClick={handleCreate} className="px-4 py-2 text-sm bg-gray-800 text-white rounded hover:bg-gray-700">Simpan</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit modal */}
      {editTarget && (
        <Modal title={`Edit Akun — ${editTarget.username}`} onClose={() => setEditTarget(null)}>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nama Lengkap</label>
              <input type="text" value={editForm.nama}
                onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Peran</label>
              <select value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as typeof editForm.role })}
                className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300">
                <option value="kasir">Kasir</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Password Baru <span className="text-gray-400 font-normal">(kosongkan jika tidak diubah)</span>
              </label>
              <input type="password" value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="••••••••"
                className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
            </div>
            {!isSelf(editTarget) && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="rounded" />
                <span>Akun aktif</span>
              </label>
            )}
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setEditTarget(null)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Batal</button>
              <button onClick={handleEdit} className="px-4 py-2 text-sm bg-gray-800 text-white rounded hover:bg-gray-700">Simpan</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
