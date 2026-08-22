import { useEffect, useState } from 'react';
import { db, type UserRow } from '../../db/schema';
import { hashPin, randomSalt } from '../../engine/pin';
import { Button } from '../common/Button';

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export function UsersSettings() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<'owner' | 'cashier'>('cashier');

  async function reload() { setUsers(await db.users.toArray()); }
  useEffect(() => { void reload(); }, []);

  async function addUser() {
    if (!name.trim()) return;
    const u: UserRow = { id: uid(), name: name.trim(), role };
    if (pin.length === 4) {
      u.pinSalt = randomSalt();
      u.pinHash = await hashPin(pin, u.pinSalt);
    }
    await db.users.put(u);
    setName(''); setPin(''); setRole('cashier');
    await reload();
  }

  async function changePin(id: string) {
    const p = prompt('New 4-digit PIN (empty to remove)');
    if (p == null) return;
    const u = await db.users.get(id);
    if (!u) return;
    if (p === '') {
      delete u.pinHash; delete u.pinSalt;
    } else if (/^\d{4}$/.test(p)) {
      u.pinSalt = randomSalt();
      u.pinHash = await hashPin(p, u.pinSalt);
    } else {
      alert('Must be 4 digits'); return;
    }
    await db.users.put(u);
    await reload();
  }

  async function delUser(id: string) {
    const owners = users.filter((u) => u.role === 'owner');
    const target = users.find((u) => u.id === id);
    if (target?.role === 'owner' && owners.length <= 1) {
      alert('Cannot delete the last owner');
      return;
    }
    if (!confirm('Delete user?')) return;
    await db.users.delete(id);
    await reload();
  }

  async function toggleRole(id: string) {
    const u = await db.users.get(id);
    if (!u) return;
    const owners = users.filter((x) => x.role === 'owner');
    if (u.role === 'owner' && owners.length <= 1) { alert('Need at least one owner'); return; }
    u.role = u.role === 'owner' ? 'cashier' : 'owner';
    await db.users.put(u);
    await reload();
  }

  return (
    <div className="space-y-3">
      <div className="font-semibold">Users</div>
      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id} className="p-3 rounded border border-slate-200 flex items-center gap-2">
            <div className="flex-1">
              <div className="font-medium">{u.name}</div>
              <div className="text-xs text-slate-500">
                {u.role} {u.pinHash ? '· PIN set' : '· no PIN'}
              </div>
            </div>
            <button onClick={() => changePin(u.id)} className="btn-ghost text-xs px-2">PIN</button>
            <button onClick={() => toggleRole(u.id)} className="btn-ghost text-xs px-2">Role</button>
            <button onClick={() => delUser(u.id)} className="btn-ghost text-xs px-2 text-red-600">Del</button>
          </li>
        ))}
      </ul>
      <div className="border-t pt-3 space-y-2">
        <div className="font-semibold text-sm">Add user</div>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)}
          className="w-full min-h-[40px] px-3 rounded border border-slate-200" />
        <input placeholder="4-digit PIN (optional)" value={pin} inputMode="numeric" maxLength={4}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          className="w-full min-h-[40px] px-3 rounded border border-slate-200" />
        <select value={role} onChange={(e) => setRole(e.target.value as 'owner' | 'cashier')}
          className="w-full min-h-[40px] px-3 rounded border border-slate-200">
          <option value="cashier">Cashier</option>
          <option value="owner">Owner</option>
        </select>
        <Button onClick={addUser}>Add user</Button>
      </div>
    </div>
  );
}
