import React, { useMemo, useState } from 'react';
import {
  Clock,
  Download,
  Lock,
  Printer,
  QrCode,
  Users,
  X,
} from 'lucide-react';
import { DiningTable, KitchenOrder, TableZone } from '../types/mishiko';

interface AdminTablesViewProps {
  tables: DiningTable[];
  orders: KitchenOrder[];
  activeTableNumber: string;
  onSelectActiveDinerTable: (tableNumber: string) => void;
  onReleaseTable: (tableId: string) => void;
}

const ZONES: ('Todas' | TableZone)[] = [
  'Todas',
  'Salón Principal',
  'Terraza Gourmet',
  'Barra Japonesa & Mixología',
];

export const AdminTablesView: React.FC<AdminTablesViewProps> = ({
  tables,
  orders,
  activeTableNumber,
  onSelectActiveDinerTable,
  onReleaseTable,
}) => {
  const [zoneFilter, setZoneFilter] = useState<'Todas' | TableZone>('Todas');
  const [selectedTableId, setSelectedTableId] = useState<string>('t-04');

  const occupiedCount = tables.filter(
    (t) => t.status === 'ocupada' || t.status === 'cuenta',
  ).length;
  const occupancyPct = ((occupiedCount / tables.length) * 100).toFixed(1);
  const billRequestedTables = tables.filter((t) => t.status === 'cuenta');
  const freeTables = tables.filter((t) => t.status === 'libre');

  const visibleZones: TableZone[] =
    zoneFilter === 'Todas'
      ? ['Salón Principal', 'Terraza Gourmet', 'Barra Japonesa & Mixología']
      : [zoneFilter];

  const selectedTable = useMemo(
    () => tables.find((t) => t.id === selectedTableId) ?? null,
    [tables, selectedTableId],
  );

  const selectedTableOrder = useMemo(
    () =>
      selectedTable
        ? orders.find((o) => o.tableNumber === selectedTable.number)
        : undefined,
    [orders, selectedTable],
  );

  const handleDownloadQrPack = () => {
    const csv = [
      'Mesa,Zona,Capacidad,Estado,Link QR,Token',
      ...tables.map(
        (t) =>
          `"${t.label}","${t.zone}",${t.capacity},"${t.status}","https://${t.qrPath}?token=${t.token}","${t.token}"`,
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mishiko-mesas-qr.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 dark:text-stone-400">
            <span className="text-[#9E3304] dark:text-amber-400">SERVICIO ACTIVO</span>
            <span aria-hidden="true">·</span>
            <span>TURNO NOCHE</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{tables.length} MESAS TOTALES</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 mt-0.5">
            Gestión de Mesas & QR Dinámicos
          </h1>
        </div>

        <button
          type="button"
          onClick={handleDownloadQrPack}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-semibold text-stone-800 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800 min-h-[42px] whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>Exportar QRs (CSV)</span>
        </button>
      </div>

      {/* 3 Occupancy KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 sm:p-5">
          <div className="text-xs font-medium text-stone-500 dark:text-stone-400">
            Ocupación Actual
          </div>
          <div className="text-2xl font-bold tabular-nums text-stone-900 dark:text-stone-50 mt-1">
            {occupancyPct}%
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 tabular-nums">
            {occupiedCount} de {tables.length} ocupadas
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 sm:p-5">
          <div className="text-xs font-medium text-stone-500 dark:text-stone-400">
            Cuenta Solicitada
          </div>
          <div className="text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-400 mt-1">
            {billRequestedTables.length} Mesas
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 tabular-nums">
            Ticket prom: S/ 142.00
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 sm:p-5">
          <div className="text-xs font-medium text-stone-500 dark:text-stone-400">
            Mesas Libres
          </div>
          <div className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
            {freeTables.length} Disponibles
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            QR fijo listo para escanear
          </div>
        </div>
      </div>

      {/* Zone Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {ZONES.map((zone) => {
          const count =
            zone === 'Todas'
              ? tables.length
              : tables.filter((t) => t.zone === zone).length;
          const active = zoneFilter === zone;
          return (
            <button
              key={zone}
              type="button"
              onClick={() => setZoneFilter(zone)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 min-h-[40px] tabular-nums ${
                active
                  ? 'bg-[#9E3304] text-white'
                  : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
              }`}
            >
              {zone} ({count})
            </button>
          );
        })}
      </div>

      {/* Main Grid + Detail Drawer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className={`${selectedTable ? 'xl:col-span-8' : 'xl:col-span-12'} space-y-6`}>
          {visibleZones.map((zone) => {
            const zoneTables = tables.filter((t) => t.zone === zone);
            return (
              <section key={zone} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-stone-900 dark:text-stone-50">
                    {zone}
                  </h2>
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    {zone === 'Terraza Gourmet'
                      ? 'Al aire libre · Pet Friendly'
                      : zone === 'Barra Japonesa & Mixología'
                        ? 'Atención directa · Omakase'
                        : 'Mesas 01 – 08'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {zoneTables.map((table) => {
                    const isSelected = selectedTable?.id === table.id;
                    const badgeStyle =
                      table.status === 'ocupada'
                        ? 'bg-[#9E3304] text-white'
                        : table.status === 'cuenta'
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                          : table.status === 'reservada'
                            ? 'bg-violet-100 text-violet-900 dark:bg-violet-950/60 dark:text-violet-300'
                            : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300';

                    return (
                      <button
                        key={table.id}
                        type="button"
                        onClick={() => setSelectedTableId(table.id)}
                        className={`text-left rounded-2xl bg-white dark:bg-stone-900 border p-4 space-y-3 transition-all ${
                          isSelected
                            ? 'border-[#9E3304] ring-2 ring-[#9E3304]/20'
                            : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-[#9E3304] dark:text-amber-300 text-xs font-bold flex items-center justify-center tabular-nums">
                              {table.number}
                            </span>
                            <div>
                              <div className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                {table.label}
                              </div>
                              <div className="text-[11px] text-stone-500 dark:text-stone-400 inline-flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Cap: {table.capacity} pers
                              </div>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold tabular-nums shrink-0 ${badgeStyle}`}
                          >
                            {table.status === 'ocupada'
                              ? `S/ ${table.activeTotal.toFixed(2)}`
                              : table.status === 'cuenta'
                                ? `Cuenta S/ ${table.activeTotal.toFixed(0)}`
                                : table.status === 'reservada'
                                  ? `Reserva ${table.reservationTime}`
                                  : 'Libre'}
                          </span>
                        </div>

                        <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 p-2.5 flex items-center gap-2.5">
                          <QrCode className="w-6 h-6 text-stone-700 dark:text-stone-300 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-stone-500 dark:text-stone-400">
                              {table.status === 'libre' ? 'LINK FIJO QR' : 'LINK ACTIVO'}
                            </div>
                            <div className="text-[11px] font-mono text-stone-700 dark:text-stone-200 truncate">
                              {table.qrPath}
                            </div>
                            <div className="text-[11px] font-mono text-[#9E3304] dark:text-amber-400">
                              Token: {table.token}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Clock className="w-3 h-3" />
                            {table.status === 'libre'
                              ? 'Disponible'
                              : table.status === 'reservada'
                                ? table.guestName
                                : `${table.activeMinutes} min activo`}
                          </span>
                          {table.number === activeTableNumber && (
                            <span className="font-semibold text-[#9E3304] dark:text-amber-400">
                              Mesa en Vista QR
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Slide-Over Table Detail Panel */}
        {selectedTable && (
          <aside className="xl:col-span-4 xl:sticky xl:top-20 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 space-y-5">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-[#9E3304] text-white text-sm font-bold flex items-center justify-center tabular-nums">
                  {selectedTable.number}
                </span>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
                    Detalle de {selectedTable.label}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {selectedTable.zone} · {selectedTable.capacity} Comensales
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTableId('')}
                aria-label="Cerrar detalle de mesa"
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl bg-stone-50 dark:bg-stone-800/70 p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                  ENLACE QR ASIGNADO
                </div>
                <div className="text-xs font-mono font-semibold text-stone-900 dark:text-stone-100 truncate mt-0.5">
                  {selectedTable.qrPath}?token={selectedTable.token}
                </div>
                <div className="text-[11px] text-[#9E3304] dark:text-amber-400 mt-0.5">
                  Token de sesión seguro
                </div>
              </div>
              <QrCode className="w-8 h-8 text-stone-700 dark:text-stone-200 shrink-0" />
            </div>

            {selectedTable.status === 'libre' ? (
              <div className="py-6 text-center text-xs text-stone-500 dark:text-stone-400">
                Esta mesa está libre y lista para nuevos comensales.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-bold text-stone-500 dark:text-stone-400">
                  ÍTEMS ORDENADOS ({selectedTableOrder?.id ?? 'COMANDA ACTIVA'})
                </div>
                {selectedTableOrder ? (
                  <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                    {selectedTableOrder.items.map((it) => (
                      <li
                        key={it.id}
                        className="py-2 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-stone-900 dark:text-stone-100">
                            {it.quantity}x {it.name}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            {it.station}
                          </div>
                        </div>
                        <span className="font-bold tabular-nums">
                          S/ {(it.unitPrice * it.quantity).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Consumo acumulado en sesión actual de mesa.
                  </p>
                )}

                <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-stone-500">
                    <span>Subtotal</span>
                    <span className="tabular-nums">
                      S/ {(selectedTable.activeTotal / 1.18).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>IGV (18%)</span>
                    <span className="tabular-nums">
                      S/ {(selectedTable.activeTotal - selectedTable.activeTotal / 1.18).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#9E3304] dark:text-amber-400 pt-1">
                    <span>Total Acumulado</span>
                    <span className="tabular-nums">
                      S/ {selectedTable.activeTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => onSelectActiveDinerTable(selectedTable.number)}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800 min-h-[42px]"
              >
                Abrir Menú QR como {selectedTable.label}
              </button>

              {selectedTable.status !== 'libre' && (
                <>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800 min-h-[42px]"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Reimprimir Comprobante</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onReleaseTable(selectedTable.id)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#9E3304] hover:bg-[#822802] text-white text-xs font-semibold min-h-[44px]"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Liberar Mesa (Cerrar Servicio)</span>
                  </button>
                </>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
