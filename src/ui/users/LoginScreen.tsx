import { useEffect, useState } from 'react';
import { db, type UserRow } from '../../db/schema';
import { useSession } from '../../stores/session';
import { NumericPad } from '../common/NumericPad';
import { Button } from '../common/Button';

const COLORS = ['#f59e0b', '#10b981', '#0ea5e9', '#f43f5e', '#8b5cf6', '#6366f1'];

function initial(name: string) { return (name || '?').trim().charAt(0).toUpperCase(); }

export function LoginScreen() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const login = useSession((s) => s.login);

  useEffect(() => {
    void db.users.toArray().then((u) => {
      setUsers(u);
      if (u.length === 1) setSelected(u[0].id);
    });
  }, []);

  async function attempt() {
    setErr('');
    if (!selected) { setErr('Pick a user'); return; }
    const ok = await login(selected, pin);
    if (!ok) { setErr('Wrong PIN'); setPin(''); }
  }

  useEffect(() => {
    if (pin.length === 4) void attempt();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="text-2xl font-bold text-amber-600 mb-4">TindaPOS</div>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-4 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {users.map((u, i) => (
            <button
              key={u.id}
              onClick={() => { setSelected(u.id); setPin(''); setErr(''); }}
              className={`flex flex-col items-center min-w-[64px] ${selected === u.id ? 'opacity-100' : 'opacity-60'}`}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: u.color ?? COLORS[i % COLORS.length] }}>
                {initial(u.name)}
              </div>
              <div className="text-xs mt-1 truncate w-16 text-center">{u.name}</div>
            </button>
          ))}
        </div>
        <div className="text-center text-slate-700">
          {selected ? `Enter PIN for ${users.find((u) => u.id === selected)?.name}` : 'Pick a user'}
        </div>
        <div className="flex justify-center gap-2 min-h-[36px]">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-full ${pin.length > i ? 'bg-amber-500' : 'bg-slate-200'}`} />
          ))}
        </div>
        {err && <div className="text-red-600 text-sm text-center">{err}</div>}
        <NumericPad value={pin} onChange={(v) => setPin(v.replace(/\D/g, '').slice(0, 4))} />
        <Button className="w-full" disabled={!selected || pin.length < 4} onClick={attempt}>
          Log in
        </Button>
      </div>
    </div>
  );
}
