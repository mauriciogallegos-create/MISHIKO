import React, { useState } from 'react';
import {
  Bell,
  Check,
  ChefHat,
  Clock,
  Download,
  Eye,
  FileText,
  Flame,
  Info,
  Printer,
  RotateCcw,
  Sparkles,
  Utensils,
  X,
} from 'lucide-react';
import { Dish, KitchenOrder, MichiAlert, OrderStep, PastVisit } from '../types/mishiko';
import { DishImage } from './DishImage';

interface DinerOrderScreenProps {
  activeOrder: KitchenOrder;
  pastVisits: PastVisit[];
  alerts: MichiAlert[];
  dishes: Dish[];
  onRepeatVisit: (visit: PastVisit) => void;
  onCallWaiter: () => void;
  onMarkAlertsRead: () => void;
  onGoToMenu: () => void;
}

const STEPS: { step: OrderStep; title: string; subtitle: string; icon: React.ReactNode }[] = [
  {
    step: 1,
    title: '1. Recibido / Pendiente',
    subtitle: 'Comanda enviada al sistema de cocina',
    icon: <Check className="w-4 h-4" />,
  },
  {
    step: 2,
    title: '2. Confirmado por Cocina',
    subtitle: 'Ingredientes seleccionados y asignados',
    icon: <Utensils className="w-4 h-4" />,
  },
  {
    step: 3,
    title: '3. En Preparación',
    subtitle: 'Fuego encendido: los cortes y sazón tradicional están en proceso.',
    icon: <Flame className="w-4 h-4" />,
  },
  {
    step: 4,
    title: '4. Listo para Entrega',
    subtitle: 'Emplatado con control de calidad térmico',
    icon: <ChefHat className="w-4 h-4" />,
  },
  {
    step: 5,
    title: '5. Entregado en Mesa',
    subtitle: '¡Buen provecho! Servicio en tu lugar',
    icon: <Sparkles className="w-4 h-4" />,
  },
];

export const DinerOrderScreen: React.FC<DinerOrderScreenProps> = ({
  activeOrder,
  pastVisits,
  alerts,
  onRepeatVisit,
  onCallWaiter,
  onMarkAlertsRead,
  onGoToMenu,
}) => {
  const [subTab, setSubTab] = useState<'pedidos' | 'alertas'>('pedidos');
  const [receiptPreviewOpen, setReceiptPreviewOpen] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);

  const totalAmount = activeOrder.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const subtotalAfecto = totalAmount / 1.18;
  const igvAmount = totalAmount - subtotalAfecto;
  const unreadAlerts = alerts.filter((a) => a.unread).length;

  const handleCallWaiter = () => {
    setWaiterCalled(true);
    onCallWaiter();
    setTimeout(() => setWaiterCalled(false), 4500);
  };

  const handleDownloadTicket = () => {
    const content = [
      'MISHIKO - SMART DINING & MICHI',
      'RUC: 20608945231 | Av. El Derby 254, Lima',
      `Ticket Control: ${activeOrder.ticketControl}`,
      `Comanda: ${activeOrder.id}`,
      `Mesa Asignada: ${activeOrder.tableLabel} (${activeOrder.zone})`,
      `Hora Emision: ${activeOrder.createdAtLabel}`,
      '----------------------------------------',
      ...activeOrder.items.map(
        (i) => `${i.quantity}x ${i.name} - S/ ${(i.unitPrice * i.quantity).toFixed(2)}`,
      ),
      '----------------------------------------',
      `Subtotal Afecto: S/ ${subtotalAfecto.toFixed(2)}`,
      `I.G.V. (18%):    S/ ${igvAmount.toFixed(2)}`,
      `TOTAL CONSUMO:   S/ ${totalAmount.toFixed(2)}`,
      `Verificacion:    ${activeOrder.verificationId}`,
      'Nota: Comprobante de consumo interno (no SUNAT).',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprobante-${activeOrder.shortCode.replace('#', '')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28 lg:pb-10 space-y-6">
      {/* Segmented Tabs: Mis Pedidos | Michi Alertas */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-stone-200/70 dark:bg-stone-800/80">
          <button
            type="button"
            onClick={() => setSubTab('pedidos')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors min-h-[40px] whitespace-nowrap ${
              subTab === 'pedidos'
                ? 'bg-white dark:bg-stone-900 text-[#9E3304] dark:text-amber-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Mis Pedidos</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSubTab('alertas');
              onMarkAlertsRead();
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors min-h-[40px] whitespace-nowrap ${
              subTab === 'alertas'
                ? 'bg-white dark:bg-stone-900 text-[#9E3304] dark:text-amber-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Michi Alertas ({unreadAlerts || alerts.length})</span>
          </button>
        </div>

        <div className="text-xs font-medium text-stone-500 dark:text-stone-400">
          Sesión activa · {activeOrder.tableLabel} · Mozo: {activeOrder.waiterName}
        </div>
      </div>

      {subTab === 'alertas' ? (
        <div className="max-w-3xl space-y-4">
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">
              Notificaciones de Mesa #{activeOrder.tableNumber}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Actualizaciones en vivo enviadas desde Cocina KDS y Michi Sommelier.
            </p>
            <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
              {alerts.map((alert) => (
                <li key={alert.id} className="py-3.5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {alert.title}
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                      {alert.detail}
                    </p>
                  </div>
                  <span className="text-xs text-stone-400 tabular-nums shrink-0">
                    {alert.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Left Column: Live Order Header, 5-Step Progress, Order Detail, Past Visits */}
          <div className="lg:col-span-7 space-y-6">
            {/* Active Session & Order Header */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-[#9E3304] dark:text-amber-400">
                    Sesión Actual Activa · {activeOrder.tableLabel} · Comensal: {activeOrder.dinerName}
                  </div>
                  <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 mt-1 tabular-nums">
                    Pedido {activeOrder.id}
                  </h1>
                  <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mt-1">
                    <span>{activeOrder.tableLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {activeOrder.createdAtLabel}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    Total Comanda
                  </div>
                  <div className="text-2xl font-bold tabular-nums text-[#9E3304] dark:text-amber-400">
                    S/ {totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Step Live Timeline */}
            <section className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">
                  Estado del Pedido
                </h2>
                <span className="text-xs font-semibold text-violet-700 dark:text-violet-300 tabular-nums">
                  Paso {activeOrder.step} de 5
                </span>
              </div>

              <ol className="space-y-3">
                {STEPS.map((st) => {
                  const isDone = activeOrder.step > st.step;
                  const isCurrent = activeOrder.step === st.step;
                  return (
                    <li
                      key={st.step}
                      className={`rounded-xl p-3.5 border transition-colors ${
                        isCurrent
                          ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-300 dark:border-amber-800'
                          : isDone
                            ? 'bg-stone-50/60 dark:bg-stone-800/40 border-stone-200/70 dark:border-stone-800'
                            : 'bg-transparent border-transparent opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isCurrent
                              ? 'bg-[#9E3304] text-white'
                              : isDone
                                ? 'bg-amber-400 text-stone-900'
                                : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
                          }`}
                        >
                          {st.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3
                              className={`text-sm font-bold ${
                                isCurrent
                                  ? 'text-[#9E3304] dark:text-amber-300'
                                  : 'text-stone-900 dark:text-stone-100'
                              }`}
                            >
                              {st.title}
                            </h3>
                            {isCurrent && st.step < 5 && (
                              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 tabular-nums shrink-0">
                                12–15 min
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                            {st.subtitle}
                          </p>
                          {isCurrent && (
                            <div className="mt-2.5 h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                              <div
                                className="h-full bg-[#9E3304] dark:bg-amber-400 rounded-full transition-all duration-500"
                                style={{ width: `${(activeOrder.step / 5) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* Detalle de Comanda */}
            <section className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">
                  Detalle de Comanda
                </h2>
                <span className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
                  {activeOrder.items.length} artículos
                </span>
              </div>

              <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                {activeOrder.items.map((item) => (
                  <li
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-[#9E3304] dark:text-amber-300 text-xs font-bold flex items-center justify-center tabular-nums shrink-0">
                        {item.quantity}x
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                          {item.name}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                          {item.subNote || item.observation || item.station}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-stone-900 dark:text-stone-100 shrink-0">
                      S/ {(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Visitas Anteriores */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">
                  Visitas Anteriores
                </h2>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  {pastVisits.length} registradas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pastVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-stone-900 dark:text-stone-100">
                          {visit.tableLabel}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400">
                          {visit.dateLabel}
                        </div>
                      </div>
                      <span className="text-base font-bold tabular-nums text-stone-900 dark:text-stone-100">
                        S/ {visit.total.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60">
                      <DishImage
                        src={visit.image}
                        alt={visit.itemsSummary}
                        className="w-11 h-11 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                          {visit.itemsSummary}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                          {visit.receiptRef}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadTicket}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 min-h-[40px]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onRepeatVisit(visit)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-[#9E3304] dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 min-h-[40px]"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Repetir Pedido</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Comprobante de Consumo Interno + Call Waiter */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 sm:p-6 space-y-5">
              <div className="text-center space-y-1 pb-4 border-b border-dashed border-stone-300 dark:border-stone-700">
                <div className="text-lg font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
                  MISHIKO
                </div>
                <div className="text-xs font-semibold tracking-wider text-[#9E3304] dark:text-amber-400">
                  SMART DINING & MICHI
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
                  RUC: 20608945231 · Av. El Derby 254, Lima
                </div>
                <div className="text-xs font-mono text-stone-700 dark:text-stone-300 pt-1">
                  Ticket Control: {activeOrder.ticketControl}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                  <span>Mesa Asignada</span>
                  <span className="font-semibold text-stone-900 dark:text-stone-100">
                    {activeOrder.tableLabel} ({activeOrder.zone})
                  </span>
                </div>
                <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                  <span>Hora Emisión</span>
                  <span className="font-mono tabular-nums text-stone-900 dark:text-stone-100">
                    {activeOrder.createdAtLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800">
                  <span>Subtotal Afecto</span>
                  <span className="font-bold tabular-nums text-stone-900 dark:text-stone-100">
                    S/ {subtotalAfecto.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                  <span>I.G.V. (18%)</span>
                  <span className="font-bold tabular-nums text-stone-900 dark:text-stone-100">
                    S/ {igvAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-bold tracking-wide text-[#9E3304] dark:text-amber-300">
                  TOTAL CONSUMO
                </span>
                <span className="text-xl font-extrabold tabular-nums text-[#9E3304] dark:text-amber-300">
                  S/ {totalAmount.toFixed(2)}
                </span>
              </div>

              {/* Verification QR Block */}
              <div className="rounded-xl bg-stone-50 dark:bg-stone-800/70 p-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Verificación Interna
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Escanea para auditar la comanda en cocina o caja.
                  </p>
                  <div className="text-xs font-mono font-semibold text-violet-700 dark:text-violet-300">
                    ID: {activeOrder.verificationId}
                  </div>
                </div>
                {/* Crisp inline QR vector */}
                <svg
                  viewBox="0 0 36 36"
                  className="w-16 h-16 shrink-0 bg-white p-1.5 rounded-lg border border-stone-200"
                  aria-label={`Código QR ${activeOrder.verificationId}`}
                >
                  <rect x="2" y="2" width="10" height="10" fill="#1C1917" />
                  <rect x="4" y="4" width="6" height="6" fill="#FFFFFF" />
                  <rect x="6" y="6" width="2" height="2" fill="#1C1917" />
                  <rect x="24" y="2" width="10" height="10" fill="#1C1917" />
                  <rect x="26" y="4" width="6" height="6" fill="#FFFFFF" />
                  <rect x="28" y="6" width="2" height="2" fill="#1C1917" />
                  <rect x="2" y="24" width="10" height="10" fill="#1C1917" />
                  <rect x="4" y="26" width="6" height="6" fill="#FFFFFF" />
                  <rect x="6" y="28" width="2" height="2" fill="#1C1917" />
                  <rect x="15" y="4" width="3" height="3" fill="#1C1917" />
                  <rect x="15" y="10" width="6" height="3" fill="#1C1917" />
                  <rect x="14" y="16" width="8" height="4" fill="#1C1917" />
                  <rect x="4" y="16" width="6" height="4" fill="#1C1917" />
                  <rect x="26" y="16" width="8" height="3" fill="#1C1917" />
                  <rect x="16" y="24" width="4" height="10" fill="#1C1917" />
                  <rect x="24" y="25" width="4" height="4" fill="#1C1917" />
                  <rect x="30" y="29" width="4" height="5" fill="#1C1917" />
                </svg>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleDownloadTicket}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#9E3304] hover:bg-[#822802] text-white text-sm font-semibold transition-colors min-h-[46px]"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Comprobante PDF / Ticket</span>
                </button>
                <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
                  <span>Comanda {activeOrder.id}</span>
                  <button
                    type="button"
                    onClick={() => setReceiptPreviewOpen(true)}
                    className="inline-flex items-center gap-1 text-violet-700 dark:text-violet-300 font-semibold hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver vista previa rápida</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 p-3 flex items-start gap-2.5 text-[11px] text-stone-500 dark:text-stone-400">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-stone-400" />
                <p>
                  <strong>Nota obligatoria:</strong> Este documento es un comprobante de consumo interno y no reemplaza a una factura o boleta electrónica oficial SUNAT. Solicítela al pagar en caja.
                </p>
              </div>
            </div>

            {/* Call Waiter / Explore Desserts */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-[#9E3304] dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    ¿Deseas agregar algo más?
                  </div>
                  <button
                    type="button"
                    onClick={onGoToMenu}
                    className="text-xs text-stone-500 dark:text-stone-400 hover:underline text-left"
                  >
                    Llama a un mozo o explora postres
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCallWaiter}
                className={`px-4 py-2 rounded-xl text-xs font-semibold min-h-[40px] whitespace-nowrap shrink-0 transition-colors ${
                  waiterCalled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {waiterCalled ? 'Mozo en camino' : 'Llamar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Thermal Receipt Quick Modal */}
      {receiptPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
                Vista Previa · Ticket {activeOrder.ticketControl}
              </h3>
              <button
                type="button"
                onClick={() => setReceiptPreviewOpen(false)}
                aria-label="Cerrar vista previa"
                className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="font-mono text-xs bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-2 text-stone-800 dark:text-stone-200">
              <div className="text-center font-bold">MISHIKO SMART DINING OS</div>
              <div className="text-center text-[11px] text-stone-500">
                RUC 20608945231 · Av. El Derby 254
              </div>
              <div className="border-t border-dashed border-stone-300 dark:border-stone-700 pt-2">
                <div>Mesa: {activeOrder.tableLabel}</div>
                <div>Comanda: {activeOrder.id}</div>
              </div>
              <div className="border-t border-dashed border-stone-300 dark:border-stone-700 pt-2 space-y-1">
                {activeOrder.items.map((it) => (
                  <div key={it.id} className="flex justify-between">
                    <span>
                      {it.quantity}x {it.name}
                    </span>
                    <span>S/ {(it.unitPrice * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-stone-300 dark:border-stone-700 pt-2 space-y-1 font-bold">
                <div className="flex justify-between font-normal">
                  <span>Subtotal</span>
                  <span>S/ {subtotalAfecto.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-normal">
                  <span>IGV (18%)</span>
                  <span>S/ {igvAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TOTAL</span>
                  <span>S/ {totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 min-h-[42px]"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadTicket}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#9E3304] text-white text-xs font-semibold hover:bg-[#822802] min-h-[42px]"
              >
                <Download className="w-4 h-4" />
                <span>Descargar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
