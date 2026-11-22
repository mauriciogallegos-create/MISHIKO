import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Check,
  ChefHat,
  Clock,
  Printer,
  Utensils,
  X,
} from 'lucide-react';
import { KitchenOrder } from '../types/mishiko';

interface AdminKdsViewProps {
  orders: KitchenOrder[];
  outOfStockCount: number;
  onToggleItemDone: (orderId: string, itemId: string) => void;
  onAdvanceOrderStep: (orderId: string, nextStep: KitchenOrder['step']) => void;
  onRejectOrder: (orderId: string) => void;
}

export const AdminKdsView: React.FC<AdminKdsViewProps> = ({
  orders,
  outOfStockCount,
  onToggleItemDone,
  onAdvanceOrderStep,
  onRejectOrder,
}) => {
  const [filter, setFilter] = useState<'todas' | 'pendientes' | 'prep' | 'listos'>('todas');
  const [clockText, setClockText] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 8);
  });
  const [printModalOrder, setPrintModalOrder] = useState<KitchenOrder | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockText(new Date().toTimeString().slice(0, 8));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const counts = useMemo(() => {
    const active = orders.filter((o) => o.step < 5);
    return {
      todas: active.length,
      pendientes: active.filter((o) => o.step <= 2).length,
      prep: active.filter((o) => o.step === 3).length,
      listos: active.filter((o) => o.step === 4).length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const active = orders.filter((o) => o.step < 5);
    if (filter === 'pendientes') return active.filter((o) => o.step <= 2);
    if (filter === 'prep') return active.filter((o) => o.step === 3);
    if (filter === 'listos') return active.filter((o) => o.step === 4);
    return active;
  }, [orders, filter]);

  const todaySales = useMemo(() => {
    const base = 1786;
    const activeSum = orders.reduce(
      (sum, ord) =>
        sum + ord.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      0,
    );
    return base + activeSum;
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* KDS Top Header & KPIs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 text-xs font-semibold text-stone-500 dark:text-stone-400">
            <span>KDS COCINA ACTIVA</span>
            <span aria-hidden="true">·</span>
            <span>FIFO Activo</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#9E3304] dark:text-amber-400 tabular-nums">
              Stock 86: {outOfStockCount} agotados
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 mt-0.5">
            Pantalla de Cocina (KDS)
          </h1>
        </div>

        <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <Clock className="w-4 h-4 text-[#9E3304] dark:text-amber-400" />
          <span className="font-mono text-lg font-bold tabular-nums text-stone-900 dark:text-stone-50">
            {clockText}
          </span>
        </div>
      </div>

      {/* 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 sm:p-5">
          <div className="text-xs font-medium text-stone-500 dark:text-stone-400">
            Atendidos Hoy
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold tabular-nums text-stone-900 dark:text-stone-50">
              {39 + orders.length}
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              +12% vs ayer
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 sm:p-5">
          <div className="text-xs font-medium text-stone-500 dark:text-stone-400">
            Tiempo Promedio
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold tabular-nums text-stone-900 dark:text-stone-50">
              14m
            </span>
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Meta &lt; 15m
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 sm:p-5">
          <div className="text-xs font-medium text-stone-500 dark:text-stone-400">
            Ventas del Día
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold tabular-nums text-stone-900 dark:text-stone-50">
              S/ {todaySales.toFixed(0)}
            </span>
            <span className="text-xs font-semibold text-[#9E3304] dark:text-amber-400">
              Mesa QR 92%
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { key: 'todas', label: `Todas (${counts.todas})` },
          { key: 'pendientes', label: `Pendientes (${counts.pendientes})` },
          { key: 'prep', label: `En Prep (${counts.prep})` },
          { key: 'listos', label: `Listos en Pase (${counts.listos})` },
        ].map((tab) => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[40px] tabular-nums ${
                active
                  ? 'bg-[#9E3304] text-white'
                  : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* KDS Ticket Cards Grid */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-10 text-center">
          <ChefHat className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
            No hay comandas en esta cola
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Las nuevas órdenes enviadas desde el Menú QR aparecerán aquí al instante.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
          {filteredOrders.map((order) => {
            const stateLabel =
              order.step <= 2
                ? 'POR ACEPTAR'
                : order.step === 3
                  ? 'EN PREP'
                  : 'LISTO EN PASE';
            const stateColor =
              order.step <= 2
                ? 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/40'
                : order.step === 3
                  ? 'text-violet-700 bg-violet-50 dark:text-violet-300 dark:bg-violet-950/40'
                  : 'text-amber-800 bg-amber-100 dark:text-amber-300 dark:bg-amber-950/50';

            return (
              <article
                key={order.id}
                className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 space-y-4"
              >
                {/* Ticket Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg font-extrabold text-stone-900 dark:text-stone-50">
                        {order.tableLabel}
                      </span>
                      <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
                        Comanda {order.shortCode}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 tabular-nums">
                      Hace {order.minutesAgo} min · {order.dinerName}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide shrink-0 ${stateColor}`}
                  >
                    {stateLabel}
                  </span>
                </div>

                {/* Dish Checklist */}
                <ul className="space-y-3">
                  {order.items.map((item) => (
                    <li key={item.id} className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleItemDone(order.id, item.id)}
                        className="w-full flex items-start justify-between gap-3 text-left group"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              item.completed
                                ? 'bg-violet-600 border-violet-600 text-white'
                                : 'border-stone-300 dark:border-stone-600 group-hover:border-[#9E3304]'
                            }`}
                          >
                            {item.completed && <Check className="w-3.5 h-3.5" />}
                          </span>
                          <div className="min-w-0">
                            <span
                              className={`text-sm font-semibold block ${
                                item.completed
                                  ? 'line-through text-stone-400 dark:text-stone-500'
                                  : 'text-stone-900 dark:text-stone-100'
                              }`}
                            >
                              {item.quantity}x {item.name}
                            </span>
                            {item.subNote && (
                              <span className="text-xs text-stone-500 dark:text-stone-400 block">
                                {item.subNote}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-medium text-stone-500 dark:text-stone-400 text-right shrink-0">
                          {item.completed ? 'Completado' : item.station}
                        </span>
                      </button>

                      {item.observation && (
                        <div className="ml-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 text-xs font-medium text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Observación: {item.observation}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                {/* KDS Ticket Footer Actions */}
                <div className="pt-2 flex items-center gap-2">
                  {order.step <= 2 && (
                    <>
                      <button
                        type="button"
                        onClick={() => onAdvanceOrderStep(order.id, 3)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#9E3304] hover:bg-[#822802] text-white text-xs font-semibold min-h-[42px]"
                      >
                        <Utensils className="w-4 h-4" />
                        <span>Aceptar y Pasar a Cocina</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onRejectOrder(order.id)}
                        aria-label="Cancelar comanda"
                        className="w-10 h-10 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {order.step === 3 && (
                    <>
                      <button
                        type="button"
                        onClick={() => onAdvanceOrderStep(order.id, 4)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#9E3304] hover:bg-[#822802] text-white text-xs font-semibold min-h-[42px]"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>Marcar como Listo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintModalOrder(order)}
                        aria-label="Imprimir comanda"
                        className="w-10 h-10 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {order.step === 4 && (
                    <>
                      <button
                        type="button"
                        onClick={() => onAdvanceOrderStep(order.id, 5)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90 text-xs font-semibold min-h-[42px]"
                      >
                        <Check className="w-4 h-4" />
                        <span>Registrar Entrega a Mesa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintModalOrder(order)}
                        aria-label="Notificar mozo"
                        className="w-10 h-10 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Print Comanda Modal */}
      {printModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-50">
                Ticket Cocina · {printModalOrder.tableLabel}
              </h3>
              <button
                type="button"
                onClick={() => setPrintModalOrder(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="font-mono text-xs bg-stone-50 dark:bg-stone-950 p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2">
              <div className="font-bold">
                COMANDA {printModalOrder.shortCode} · {printModalOrder.tableLabel}
              </div>
              <div className="text-stone-500">{printModalOrder.createdAtLabel}</div>
              <div className="border-t border-dashed border-stone-300 dark:border-stone-700 pt-2 space-y-1">
                {printModalOrder.items.map((it) => (
                  <div key={it.id}>
                    {it.quantity}x {it.name} ({it.station})
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                window.print();
                setPrintModalOrder(null);
              }}
              className="w-full py-2.5 rounded-xl bg-[#9E3304] text-white text-xs font-semibold"
            >
              Imprimir Ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
