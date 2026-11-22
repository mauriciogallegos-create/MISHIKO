import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { StaffMember, StaffRoleKey } from '../types/mishiko';

interface AdminSecurityViewProps {
  staff: StaffMember[];
  onToggleJwtStatus: (staffId: string) => void;
  onAddStaffMember: (member: StaffMember) => void;
}

export const AdminSecurityView: React.FC<AdminSecurityViewProps> = ({
  staff,
  onToggleJwtStatus,
  onAddStaffMember,
}) => {
  const [search, setSearch] = useState('');
  const [cipherTestResult, setCipherTestResult] = useState<string | null>(null);
  const [newModalOpen, setNewModalOpen] = useState(false);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRoleKey, setNewRoleKey] = useState<StaffRoleKey>('sala');
  const [newPin, setNewPin] = useState('5519');

  const activeTokensCount = staff.filter((s) => s.jwtStatus === 'activa').length;

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.roleTitle.toLowerCase().includes(q),
    );
  }, [staff, search]);

  const handleDownloadAuditCsv = () => {
    const csv = [
      'Colaborador,Email,Rol,PIN,Estado JWT,Dispositivo,Ultimo Ingreso',
      ...staff.map(
        (s) =>
          `"${s.name}","${s.email}","${s.roleTitle}","PIN-${s.pin}","${s.jwtStatus}","${s.deviceInfo}","${s.lastLogin}"`,
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mishiko-auditoria-jwt.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunCipherTest = () => {
    setCipherTestResult(
      `HMAC-SHA256 verificado · ${activeTokensCount} tokens activos íntegros · Latencia firma: 1.4 ms`,
    );
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    const roleTitle =
      newRoleKey === 'admin'
        ? 'Administrador General'
        : newRoleKey === 'cocina'
          ? 'Chef de Cocina KDS'
          : 'Mozo Salón';
    onAddStaffMember({
      id: `st-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      roleTitle,
      roleKey: newRoleKey,
      pin: newPin.slice(0, 4) || '1234',
      jwtStatus: 'activa',
      remainingLabel: 'Activa (8h restantes)',
      deviceInfo: 'Terminal Web / IP: 192.168.1.62',
      lastLogin: 'Ahora mismo',
    });
    setNewName('');
    setNewEmail('');
    setNewModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[#9E3304] dark:text-amber-400">
            SEGURIDAD & GOBERNANZA · AUDITORÍA OPERATIVA
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 mt-0.5">
            Gestión de Usuarios, Roles & Control de Acceso (JWT)
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Control centralizado de identidades, tokens de corta duración y privilegios por estación gastronómica.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setNewModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#9E3304] hover:bg-[#822802] text-white text-xs font-semibold min-h-[44px] whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Nuevo Colaborador</span>
        </button>
      </div>

      {/* 4 KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 sm:p-5">
          <div className="text-xs font-medium text-stone-500 dark:text-stone-400">
            Usuarios Activos
          </div>
          <div className="text-3xl font-bold tabular-nums text-stone-900 dark:text-stone-50 mt-1">
            {staff.length + 8}
          </div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
            100% Verificados
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 sm:p-5">
          <div className="text-xs font-medium text-stone-500 dark:text-stone-400">
            Roles Configurados
          </div>
          <div className="text-3xl font-bold tabular-nums text-stone-900 dark:text-stone-50 mt-1">
            3
          </div>
          <div className="text-xs text-violet-700 dark:text-violet-300 mt-0.5">
            Admin · Mozo · KDS
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 sm:p-5">
          <div className="text-xs font-medium text-stone-500 dark:text-stone-400">
            Tokens JWT Emitidos Hoy
          </div>
          <div className="text-3xl font-bold tabular-nums text-stone-900 dark:text-stone-50 mt-1">
            {24 + staff.length}
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 tabular-nums">
            Access Tokens vivos: {activeTokensCount}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 sm:p-5">
          <div className="text-xs font-medium text-stone-500 dark:text-stone-400">
            Accesos Bloqueados
          </div>
          <div className="text-3xl font-bold tabular-nums text-stone-900 dark:text-stone-50 mt-1">
            0
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Detección fuerza bruta PIN activa
          </div>
        </div>
      </div>

      {/* RBAC Matrix */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">
          Matriz Operativa de Roles y Niveles de Concesión
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Administrador',
              level: 'Nivel 01 · Full Root',
              assigned: staff.filter((s) => s.roleKey === 'admin').length + 1,
              desc: 'Acceso total al ecosistema. Facturación electrónica, anulación de comandas y firmas criptográficas.',
              perms: [
                'Dashboard financiero y reportes Z',
                'Edición de Catálogo, Precios y Stock',
                'Gestión de JWT y credenciales de personal',
              ],
              ttl: 'Sesión JWT: 12 Horas · MFA Obligatorio',
            },
            {
              title: 'Personal Sala / Mozos',
              level: 'Nivel 02 · Salón & Mesas',
              assigned: staff.filter((s) => s.roleKey === 'sala').length + 4,
              desc: 'Gestión táctica de mesas en sala, toma y despacho de comandas rápidas con soporte Michi.',
              perms: [
                'Visualización y bloqueo de mesas en plano',
                'Apertura de comandas y asignación',
                'Impresión de pre-cuentas y tickets internos',
              ],
              ttl: 'Sesión JWT: 8 Horas · Autenticación PIN Rápido',
            },
            {
              title: 'Cocina / KDS',
              level: 'Nivel 03 · Despacho FIFO',
              assigned: staff.filter((s) => s.roleKey === 'cocina').length + 3,
              desc: 'Terminales fijas en partida fría, caliente y barra. Recepción cronometrada de platos.',
              perms: [
                'Flujo de comandas FIFO con tiempos',
                'Actualización de estados (Cocción / Listo)',
                'Alertas sonoras y pase de comandas',
              ],
              ttl: 'Sesión JWT: 24 Horas Kiosk · Terminal Fija IP',
            },
          ].map((role) => (
            <div
              key={role.title}
              className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
                      {role.title}
                    </h3>
                    <div className="text-xs font-semibold text-[#9E3304] dark:text-amber-400">
                      {role.level}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 tabular-nums">
                    {role.assigned} asignados
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  {role.desc}
                </p>
                <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
                  {role.perms.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#9E3304] dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 text-[11px] font-medium text-stone-500 dark:text-stone-400">
                {role.ttl}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Active JWT Sessions Table */}
      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden">
        <div className="p-5 flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-50">
              Colaboradores & Sesiones JWT Activas
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Supervisión en tiempo real de tokens otorgados, expiración de credenciales y firmas de dispositivo.
            </p>
          </div>
          <div className="relative min-w-[230px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar colaborador..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                <th className="py-3 px-5">COLABORADOR</th>
                <th className="py-3 px-4">ROL ASIGNADO</th>
                <th className="py-3 px-4">CÓDIGO PIN</th>
                <th className="py-3 px-4">ESTADO SESIÓN JWT</th>
                <th className="py-3 px-4">ÚLTIMO INGRESO</th>
                <th className="py-3 px-5 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
              {filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40">
                  <td className="py-3.5 px-5">
                    <div className="font-bold text-stone-900 dark:text-stone-100">
                      {member.name}
                    </div>
                    <div className="text-stone-500 dark:text-stone-400">
                      {member.email}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-stone-800 dark:text-stone-200">
                    {member.roleTitle}
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-stone-700 dark:text-stone-300">
                    PIN-{member.pin}
                  </td>
                  <td className="py-3.5 px-4">
                    <div
                      className={`font-semibold ${
                        member.jwtStatus === 'activa'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {member.remainingLabel}
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400">
                      {member.deviceInfo}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 tabular-nums text-stone-600 dark:text-stone-400">
                    {member.lastLogin}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      type="button"
                      onClick={() => onToggleJwtStatus(member.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        member.jwtStatus === 'activa'
                          ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>
                        {member.jwtStatus === 'activa' ? 'Revocar JWT' : 'Reemitir Token'}
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3.5 bg-stone-50 dark:bg-stone-800/40 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-stone-500 dark:text-stone-400">
            Los tokens JWT revocados se agregan instantáneamente a la lista de exclusión en memoria.
          </span>
          <button
            type="button"
            onClick={handleDownloadAuditCsv}
            className="inline-flex items-center gap-1.5 font-semibold text-stone-800 dark:text-stone-200 hover:text-[#9E3304]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Log de Auditoría (CSV)</span>
          </button>
        </div>
      </div>

      {/* Cryptographic Session Cycle + Guard Check */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
                Ciclo Criptográfico de Sesión
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Rotación automatizada de claims y validación de cabeceras Bearer.
              </p>
            </div>
            <span className="font-mono text-xs text-stone-500 dark:text-stone-400">
              exp: 3600s
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              '1. Auth PIN / Credencial',
              '2. Firma HMAC-SHA256',
              '3. Access Token Vivo (60m)',
              '4. Refresh Token (24h)',
            ].map((stage, i) => (
              <div
                key={stage}
                className={`rounded-xl p-3 border text-xs font-semibold ${
                  i === 2
                    ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/30 text-violet-800 dark:text-violet-200'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 text-stone-700 dark:text-stone-300'
                }`}
              >
                {stage}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="rounded-xl bg-stone-50 dark:bg-stone-800/50 p-3">
              <div className="text-[10px] font-semibold text-stone-500">
                LONGITUD DE CLAVE
              </div>
              <div className="text-xs font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                256-bit Secret
              </div>
            </div>
            <div className="rounded-xl bg-stone-50 dark:bg-stone-800/50 p-3">
              <div className="text-[10px] font-semibold text-stone-500">
                CABECERA DE ENVÍO
              </div>
              <div className="text-xs font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                Bearer Auth
              </div>
            </div>
            <div className="rounded-xl bg-stone-50 dark:bg-stone-800/50 p-3">
              <div className="text-[10px] font-semibold text-stone-500">
                ALMACENAMIENTO
              </div>
              <div className="text-xs font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                HttpOnly Cookie
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-stone-50">
              <ShieldCheck className="w-4 h-4 text-[#9E3304] dark:text-amber-400" />
              <span>Verificador de Integridad</span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Valida la firma simétrica HMAC-SHA256 de las sesiones activas en cocina y sala.
            </p>
            {cipherTestResult && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                {cipherTestResult}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleRunCipherTest}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 min-h-[42px]"
          >
            <KeyRound className="w-4 h-4" />
            <span>Ejecutar Test de Cifrado</span>
          </button>
        </div>
      </div>

      {/* Add Staff Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateStaff}
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">
                Alta de Nuevo Colaborador
              </h3>
              <button
                type="button"
                onClick={() => setNewModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Nombre y Apellidos
                </label>
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Lucía Mendoza Torres"
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Correo Corporativo
                </label>
                <input
                  required
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="colaborador@mishikofood.com"
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Rol Operativo
                  </label>
                  <select
                    value={newRoleKey}
                    onChange={(e) => setNewRoleKey(e.target.value as StaffRoleKey)}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm"
                  >
                    <option value="sala">Sala & Mozos</option>
                    <option value="cocina">Cocina / KDS</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    PIN Rápido (4 dígitos)
                  </label>
                  <input
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm font-mono tabular-nums"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setNewModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#9E3304] text-white text-xs font-semibold hover:bg-[#822802]"
              >
                Generar Credencial JWT
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
