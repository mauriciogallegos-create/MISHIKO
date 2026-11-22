import React, { useState } from 'react';
import {
  CheckCircle2,
  Delete,
  KeyRound,
  Lock,
  Monitor,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { StaffRoleKey } from '../types/mishiko';

interface AdminTerminalLoginViewProps {
  onAuthenticated: (profile: {
    name: string;
    roleTitle: string;
    stationId: string;
  }) => void;
}

const TERMINALS = [
  { id: 'TER-04', label: 'TER-04 SALA MESA', detail: 'Mesas 01–16 · Sala' },
  { id: 'KDS-01', label: 'KDS-01 CALIENTE', detail: '14 comandas · 11 min prom.' },
  { id: 'KDS-02', label: 'KDS-02 FRÍO & BAR', detail: '5 comandas · 4 min prom.' },
];

export const AdminTerminalLoginView: React.FC<AdminTerminalLoginViewProps> = ({
  onAuthenticated,
}) => {
  const [roleProfile, setRoleProfile] = useState<StaffRoleKey>('sala');
  const [email, setEmail] = useState('carlos.mozo@mishiko.internal');
  const [pin, setPin] = useState('9021');
  const [selectedTerminal, setSelectedTerminal] = useState('TER-04');
  const [offlineMode, setOfflineMode] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    setPin((p) => p + digit);
  };

  const handleBackspace = () => {
    setPin((p) => p.slice(0, -1));
  };

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (pin.length < 4) {
      setAuthFeedback('Ingresa los 4 dígitos del PIN de estación.');
      return;
    }
    const roleTitle =
      roleProfile === 'admin'
        ? 'Administrador Control Total'
        : roleProfile === 'cocina'
          ? 'Chef / KDS Despacho'
          : 'Mozo / Sala Comandas';
    const roleClaim =
      roleProfile === 'admin'
        ? 'ROLE_ADMIN'
        : roleProfile === 'cocina'
          ? 'ROLE_KDS'
          : 'ROLE_WAITER';
    setAuthFeedback(`Token JWT emitido (${roleClaim}) para ${selectedTerminal}.`);
    onAuthenticated({
      name: email.split('@')[0] || 'Carlos V.',
      roleTitle,
      stationId: selectedTerminal,
    });
  };

  const claimsPayload = {
    sub: email,
    role:
      roleProfile === 'admin'
        ? 'ROLE_ADMIN'
        : roleProfile === 'cocina'
          ? 'ROLE_KDS'
          : 'ROLE_WAITER',
    station_id: selectedTerminal,
    dining_shift: 'NOCHE_B',
    offline_cache: offlineMode,
    exp: 1740000000,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[#9E3304] dark:text-amber-400">
            PORTAL DE AUTENTICACIÓN GASTRONÓMICA
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 mt-0.5">
            Acceso al Servicio de Turno
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Selecciona tu perfil operativo, vincula tu terminal y autentica con PIN de 4 dígitos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOfflineMode((v) => !v)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold min-h-[42px] ${
            offlineMode
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-800 dark:text-amber-300'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200'
          }`}
        >
          {offlineMode ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
          <span>{offlineMode ? 'Modo Local (Offline)' : 'Modo Red Activo'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Login & PIN Keypad */}
        <form
          onSubmit={handleLogin}
          className="lg:col-span-7 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 sm:p-6 space-y-5"
        >
          <div className="space-y-2">
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Perfil Operativo Destino
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { key: 'admin', label: 'Administrador Control Total' },
                { key: 'sala', label: 'Mozo / Sala Comandas' },
                { key: 'cocina', label: 'Chef / KDS Cocción' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setRoleProfile(opt.key as StaffRoleKey)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-colors min-h-[44px] ${
                    roleProfile === opt.key
                      ? 'bg-[#9E3304] border-[#9E3304] text-white'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Correo Corporativo / Usuario
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                PIN Rápido de Estación (4 dígitos)
              </div>
              <div className="h-12 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center gap-3 font-mono text-xl font-bold tracking-[0.4em] tabular-nums">
                {pin.padEnd(4, '·')}
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDigit(d)}
                    className="h-11 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-sm font-bold hover:bg-stone-100 dark:hover:bg-stone-700"
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPin('')}
                  className="h-11 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold"
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={() => handleDigit('0')}
                  className="h-11 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-sm font-bold hover:bg-stone-100 dark:hover:bg-stone-700"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  aria-label="Borrar dígito"
                  className="h-11 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Terminales KDS & Sala Disponibles
              </div>
              {TERMINALS.map((term) => (
                <button
                  key={term.id}
                  type="button"
                  onClick={() => setSelectedTerminal(term.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-colors ${
                    selectedTerminal === term.id
                      ? 'border-[#9E3304] bg-amber-50/70 dark:bg-amber-950/30'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-stone-100">
                    <span className="inline-flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5" />
                      {term.label}
                    </span>
                    {selectedTerminal === term.id && (
                      <CheckCircle2 className="w-4 h-4 text-[#9E3304] dark:text-amber-400" />
                    )}
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    {term.detail}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {authFeedback && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              {authFeedback}
            </div>
          )}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#9E3304] hover:bg-[#822802] text-white text-sm font-semibold min-h-[48px]"
          >
            <KeyRound className="w-4 h-4" />
            <span>Ingresar al Sistema (Generar Token JWT)</span>
          </button>
        </form>

        {/* Right: Live JWT Claims Payload */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-50">
              <ShieldCheck className="w-4 h-4 text-[#9E3304] dark:text-amber-400" />
              <span>Claims Payload (JWT)</span>
            </div>
            <span className="text-[11px] font-mono text-stone-500">HMAC-SHA256</span>
          </div>

          <pre className="rounded-xl bg-stone-950 text-amber-200 p-4 text-xs font-mono overflow-x-auto leading-relaxed">
            {JSON.stringify(claimsPayload, null, 2)}
          </pre>

          <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#9E3304] dark:text-amber-400 shrink-0" />
              <span>Access Token TTL: 60 min · Refresh Token: 24 hrs</span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Protección CSRF activa, bloqueo automático a los 15 minutos de inactividad y sincronización directa con KDS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
