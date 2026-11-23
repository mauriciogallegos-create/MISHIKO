import React, { useEffect, useMemo, useState } from 'react';
import {
  ChefHat,
  KeyRound,
  LayoutGrid,
  PawPrint,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Store,
  Utensils,
  UtensilsCrossed,
} from 'lucide-react';
import { AdminCatalogView } from './components/AdminCatalogView';
import { AdminKdsView } from './components/AdminKdsView';
import { AdminSecurityView } from './components/AdminSecurityView';
import { AdminTablesView } from './components/AdminTablesView';
import { AdminTerminalLoginView } from './components/AdminTerminalLoginView';
import { DinerMenuScreen } from './components/DinerMenuScreen';
import { DinerOrderScreen } from './components/DinerOrderScreen';
import { MichiHubScreen } from './components/MichiHubScreen';
import {
  INITIAL_ALERTS,
  INITIAL_DISHES,
  INITIAL_MICHI_CONFIG,
  INITIAL_ORDERS,
  INITIAL_STAFF,
  INITIAL_TABLES,
  PAST_VISITS,
} from './data/mishikoSeed';
import {
  AdminTab,
  CartItem,
  DinerTab,
  DiningTable,
  Dish,
  DishModifier,
  KdsItem,
  KitchenOrder,
  MichiAlert,
  MichiConfig,
  MichiGesture,
  PastVisit,
  StaffMember,
  WorkspaceMode,
} from './types/mishiko';

export default function App() {
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('diner');
  const [dinerTab, setDinerTab] = useState<DinerTab>('menu');
  const [michiSubView, setMichiSubView] = useState<'voz' | 'apariencia' | 'gestos'>('voz');
  const [adminTab, setAdminTab] = useState<AdminTab>('kds');

  // Shared live state across Diner, Michi AI, KDS, Catalog, Tables & Security
  const [isNightMode, setIsNightMode] = useState(false);
  const [branch, setBranch] = useState('Mishiko Bistro - Miraflores');
  const [activeTableNumber, setActiveTableNumber] = useState('04');
  const [dishes, setDishes] = useState<Dish[]>(INITIAL_DISHES);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<KitchenOrder[]>(INITIAL_ORDERS);
  const [tables, setTables] = useState<DiningTable[]>(INITIAL_TABLES);
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [alerts, setAlerts] = useState<MichiAlert[]>(INITIAL_ALERTS);
  const [waitlistDishIds, setWaitlistDishIds] = useState<string[]>([]);
  const [michiConfig, setMichiConfig] = useState<MichiConfig>(INITIAL_MICHI_CONFIG);
  const [michiGreeting, setMichiGreeting] = useState(
    '¡Miau! Bienvenido a Mesa #04. ¿Qué vamos a disfrutar hoy?',
  );
  const [operatorBadge, setOperatorBadge] = useState({
    name: 'Chef Admin',
    roleTitle: 'Gerente General',
    stationId: 'TER-04',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync Tailwind .dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isNightMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isNightMode]);

  // Sincronización en vivo KDS en laptops distintas (LAN & Wi-Fi)
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('mishiko_kds_sync');
        bc.onmessage = (event) => {
          if (event.data?.type === 'NEW_ORDER') {
            const incoming: KitchenOrder = event.data.order;
            setOrders((prev) => {
              if (prev.some((o) => o.id === incoming.id)) return prev;
              return [incoming, ...prev];
            });
            showToast(`¡Nueva comanda ${incoming.shortCode} recibida en Cocina KDS! 👨‍🍳`);
          }
        };
      }
    } catch (_) {}

    const pollId = window.setInterval(async () => {
      try {
        const res = await fetch('/api/cocina/pedidos');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setOrders((prev) => {
              const prevIds = new Set(prev.map((p) => p.id));
              const nuevos: KitchenOrder[] = [];
              data.forEach((p: any) => {
                const orderId = `#ORD-${p.numeroPedido || p.id}`;
                if (!prevIds.has(orderId)) {
                  nuevos.push({
                    id: orderId,
                    shortCode: `#${p.numeroPedido || p.id}`,
                    ticketControl: `#TK-${p.numeroPedido || p.id}-2026`,
                    tableNumber: String(p.mesaNumero || '04').padStart(2, '0'),
                    tableLabel: `Mesa ${String(p.mesaNumero || '04').padStart(2, '0')}`,
                    zone: 'Salón Principal',
                    dinerName: 'Comensal en Mesa',
                    waiterName: 'Carlos V.',
                    createdAtLabel: 'Hace un momento',
                    minutesAgo: 0,
                    step: p.estado === 'ENTREGADO' ? 5 : p.estado === 'LISTO' ? 4 : p.estado === 'EN_PREPARACION' ? 3 : 1,
                    verificationId: `VERIF-M04-${8900 + (p.id || 1)}`,
                    items: (p.detalles || []).map((d: any, idx: number) => ({
                      id: `k-${p.id}-${idx}`,
                      dishId: 'dish-custom',
                      name: d.productoNombre || 'Plato MISHIKO',
                      quantity: d.cantidad || 1,
                      station: 'Estación Caliente' as const,
                      completed: false,
                      modifiers: d.notas ? [d.notas] : [],
                    })),
                  });
                }
              });
              if (nuevos.length > 0) {
                showToast(`🔔 ${nuevos.length} comanda(s) nueva(s) en Cocina KDS`);
                return [...nuevos, ...prev];
              }
              return prev;
            });
          }
        }
      } catch (_) {}
    }, 3500);

    return () => {
      window.clearInterval(pollId);
      if (bc) bc.close();
    };
  }, []);

  const playToastSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (_) {}
  };

  const showToast = (msg: string) => {
    playToastSound();
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3800);
  };

  // Active order for the current diner table
  const activeDinerOrder = useMemo(() => {
    const forTable = orders.find((o) => o.tableNumber === activeTableNumber);
    return forTable ?? orders[0];
  }, [orders, activeTableNumber]);

  const outOfStockCount = useMemo(
    () => dishes.filter((d) => !d.available).length,
    [dishes],
  );

  // Cart Handlers
  const handleAddToCart = (
    dish: Dish,
    quantity: number,
    modifiers: DishModifier[],
  ) => {
    const modCost = modifiers.reduce((s, m) => s + m.priceDelta, 0);
    const unitPrice = dish.price + modCost;
    const modKey = modifiers
      .map((m) => m.id)
      .sort()
      .join(',');

    setCart((prev) => {
      const existing = prev.find(
        (c) =>
          c.dishId === dish.id &&
          c.selectedModifiers
            .map((m) => m.id)
            .sort()
            .join(',') === modKey,
      );
      if (existing) {
        return prev.map((c) =>
          c.cartItemId === existing.cartItemId
            ? { ...c, quantity: c.quantity + quantity }
            : c,
        );
      }
      return [
        ...prev,
        {
          cartItemId: `${dish.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          dishId: dish.id,
          name: dish.name,
          image: dish.image,
          unitPrice,
          quantity,
          selectedModifiers: modifiers,
        },
      ];
    });
    showToast(`Agregado: ${quantity}x ${dish.name}`);
  };

  const handleUpdateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.cartItemId === cartItemId
            ? { ...c, quantity: c.quantity + delta }
            : c,
        )
        .filter((c) => c.quantity > 0),
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((c) => c.cartItemId !== cartItemId));
  };

  const handleSubmitCartOrder = () => {
    if (cart.length === 0) return;

    const newKdsItems: KdsItem[] = cart.map((item) => {
      const dish = dishes.find((d) => d.id === item.dishId);
      return {
        id: `kds-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: item.name,
        quantity: item.quantity,
        station: dish?.station ?? 'Estación Caliente',
        subNote:
          item.selectedModifiers.length > 0
            ? item.selectedModifiers.map((m) => m.label).join(', ')
            : undefined,
        observation:
          item.selectedModifiers.find((m) =>
            m.label.toLowerCase().includes('sin '),
          )?.label ?? undefined,
        completed: false,
        unitPrice: item.unitPrice,
      };
    });

    const addedTotal = cart.reduce(
      (s, it) => s + it.unitPrice * it.quantity,
      0,
    );
    const nextCodeNum = 86 + orders.length;
    const shortCode = `#0${nextCodeNum}`;
    const tableObj = tables.find((t) => t.number === activeTableNumber);

    const newOrder: KitchenOrder = {
      id: `#ORD-2025-0${nextCodeNum}`,
      shortCode,
      ticketControl: `#TK-0${nextCodeNum}-2025`,
      tableNumber: activeTableNumber,
      tableLabel: tableObj?.label ?? `Mesa ${activeTableNumber}`,
      zone: tableObj?.zone ?? 'Salón Principal',
      dinerName: 'Andrea R.',
      waiterName: 'Carlos V.',
      createdAtLabel: 'Ahora mismo',
      minutesAgo: 0,
      step: 1,
      verificationId: `VERIF-M${activeTableNumber}-${8900 + nextCodeNum}`,
      items: newKdsItems,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setTables((prev) =>
      prev.map((t) =>
        t.number === activeTableNumber
          ? {
              ...t,
              status: 'ocupada',
              activeTotal: t.activeTotal + addedTotal,
              activeMinutes: t.activeMinutes || 1,
            }
          : t,
      ),
    );
    setAlerts((prev) => [
      {
        id: `al-${Date.now()}`,
        title: `Comanda ${shortCode} recibida en cocina`,
        detail: `${newKdsItems.length} platos enviados a estación FIFO para Mesa #${activeTableNumber}.`,
        time: 'Ahora',
        unread: true,
      },
      ...prev,
    ]);
    setCart([]);
    setDinerTab('pedido');
    showToast(`Comanda ${shortCode} enviada a Cocina KDS`);

    // Sincronizar por BroadcastChannel con otras pestañas/ventanas KDS
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('mishiko_kds_sync');
        bc.postMessage({ type: 'NEW_ORDER', order: newOrder });
      }
    } catch (_) {}

    // Sincronizar vía REST con el backend Spring Boot para laptops distintas en red
    try {
      fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restauranteId: 1,
          mesaId: Number(activeTableNumber) || 4,
          notas: `Comanda de Mesa #${activeTableNumber}`,
          detalles: newKdsItems.map((it) => ({
            productoId: 1,
            cantidad: it.quantity,
            precioUnitario: 28.0,
            notas: it.modifiers?.join(', ') || it.name,
          })),
        }),
      }).catch(() => {});
    } catch (_) {}
  };

  const handleRepeatVisit = (visit: PastVisit) => {
    const matchedDishes = dishes.filter(
      (d) => visit.dishIds.includes(d.id) && d.available,
    );
    if (matchedDishes.length === 0) {
      showToast('Los platillos de esta visita están agotados actualmente.');
      return;
    }
    matchedDishes.forEach((dish) => handleAddToCart(dish, 1, []));
    setDinerTab('menu');
    showToast(`Platillos de ${visit.tableLabel} agregados a tu bandeja`);
  };

  const handleToggleWaitlist = (dishId: string) => {
    setWaitlistDishIds((prev) =>
      prev.includes(dishId)
        ? prev.filter((id) => id !== dishId)
        : [...prev, dishId],
    );
    showToast('Preferencia de aviso actualizada');
  };

  // KDS Handlers
  const handleToggleKdsItemDone = (orderId: string, itemId: string) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              items: ord.items.map((it) =>
                it.id === itemId ? { ...it, completed: !it.completed } : it,
              ),
            }
          : ord,
      ),
    );
  };

  const handleAdvanceOrderStep = (
    orderId: string,
    nextStep: KitchenOrder['step'],
  ) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, step: nextStep } : ord)),
    );
    const stepText =
      nextStep === 3
        ? 'En Preparación'
        : nextStep === 4
          ? 'Listo en Pase'
          : 'Entregado en Mesa';
    showToast(`Comanda actualizada: ${stepText}`);
  };

  const handleRejectOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    showToast('Comanda cancelada del tablero KDS');
  };

  // Catalog Handlers
  const handleToggleDishAvailability = (dishId: string) => {
    setDishes((prev) =>
      prev.map((d) =>
        d.id === dishId ? { ...d, available: !d.available } : d,
      ),
    );
    showToast('Disponibilidad actualizada en Menú QR');
  };

  const handleAddDish = (dish: Dish) => {
    setDishes((prev) => [dish, ...prev]);
    showToast(`${dish.name} publicado en Menú QR`);
  };

  // Table Handlers
  const handleReleaseTable = (tableId: string) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? { ...t, status: 'libre', activeTotal: 0, activeMinutes: 0, note: undefined }
          : t,
      ),
    );
    showToast('Mesa liberada y sesión QR cerrada');
  };

  const handleSelectActiveDinerTable = (tableNumber: string) => {
    setActiveTableNumber(tableNumber);
    setMichiGreeting(
      `¡Miau! Bienvenido a Mesa #${tableNumber}. ¿Qué vamos a disfrutar hoy?`,
    );
    setWorkspaceMode('diner');
    setDinerTab('menu');
    showToast(`Vista Comensal cambiada a Mesa #${tableNumber}`);
  };

  // Security Handlers
  const handleToggleJwtStatus = (staffId: string) => {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === staffId
          ? {
              ...s,
              jwtStatus: s.jwtStatus === 'activa' ? 'revocada' : 'activa',
              remainingLabel:
                s.jwtStatus === 'activa'
                  ? 'Revocada / Desconectado'
                  : 'Activa (60m restantes)',
            }
          : s,
      ),
    );
    showToast('Estado de sesión JWT actualizado');
  };

  const handleAddStaffMember = (member: StaffMember) => {
    setStaff((prev) => [member, ...prev]);
    showToast(`Credencial emitida para ${member.name}`);
  };

  // Michi Handlers
  const handleApplyGestureToMenu = (gesture: MichiGesture) => {
    setMichiConfig((prev) => ({ ...prev, activeGestureId: gesture.id }));
    setMichiGreeting(gesture.speechLine);
    setDinerTab('menu');
    showToast(`Gesto "${gesture.title}" aplicado al Menú en Vivo`);
  };

  const handleAddParsedItemsToCart = (
    items: { dish: Dish; quantity: number; modifiers: DishModifier[] }[],
  ) => {
    items.forEach((item) =>
      handleAddToCart(item.dish, item.quantity, item.modifiers),
    );
    setDinerTab('menu');
    showToast(`${items.length} ítems de voz agregados a tu bandeja`);
  };

  const openMichiTab = (view: 'voz' | 'apariencia' | 'gestos') => {
    setMichiSubView(view);
    setWorkspaceMode('diner');
    setDinerTab('michi');
  };

  const ADMIN_NAV: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: 'kds', label: 'Cocina KDS', icon: <ChefHat className="w-4 h-4" /> },
    { key: 'catalogo', label: 'Catálogo & Menú', icon: <Utensils className="w-4 h-4" /> },
    { key: 'mesas', label: 'Mesas & QR', icon: <QrCode className="w-4 h-4" /> },
    { key: 'seguridad', label: 'Seguridad & JWT', icon: <ShieldCheck className="w-4 h-4" /> },
    { key: 'acceso', label: 'Acceso Turno', icon: <KeyRound className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#12100E] text-stone-900 dark:text-stone-100 transition-colors">
      {/* DINER WORKSPACE */}
      {workspaceMode === 'diner' ? (
        <>
          {/* Clean 3-Zone Top Navigation Bar */}
          <header className="sticky top-0 z-40 h-16 bg-white/90 dark:bg-[#191614]/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
            <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
              {/* Zone 1: Brand Wordmark & Mascot Logo */}
              <button
                type="button"
                onClick={() => setDinerTab('menu')}
                className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
              >
                <img
                  src="./assets/logo.png"
                  alt="MISHIKO - Smart Dining & Michi"
                  className="h-9 sm:h-10 w-auto object-contain filter drop-shadow-sm"
                />
              </button>

              {/* Zone 2: Desktop Single-Line Nav Links */}
              <nav
                className="hidden md:flex items-center gap-6 text-sm font-semibold"
                aria-label="Navegación principal"
              >
                <button
                  type="button"
                  onClick={() => setDinerTab('menu')}
                  className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    dinerTab === 'menu'
                      ? 'border-[#9E3304] text-[#9E3304] dark:border-amber-400 dark:text-amber-400'
                      : 'border-transparent text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  Menú
                </button>
                <button
                  type="button"
                  onClick={() => setDinerTab('pedido')}
                  className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    dinerTab === 'pedido'
                      ? 'border-[#9E3304] text-[#9E3304] dark:border-amber-400 dark:text-amber-400'
                      : 'border-transparent text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  Mi Pedido
                </button>
                <button
                  type="button"
                  onClick={() => openMichiTab('voz')}
                  className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    dinerTab === 'michi'
                      ? 'border-[#9E3304] text-[#9E3304] dark:border-amber-400 dark:text-amber-400'
                      : 'border-transparent text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  {michiConfig.name} AI
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspaceMode('admin')}
                  className="py-1 border-b-2 border-transparent text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  Operación OS
                </button>
              </nav>

              {/* Zone 3: Single Primary Action */}
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => openMichiTab('voz')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-200 text-xs font-bold hover:bg-violet-200 dark:hover:bg-violet-900/70 transition-colors min-h-[40px] whitespace-nowrap shrink-0"
                >
                  <PawPrint className="w-4 h-4" />
                  <span>{michiConfig.name} AI</span>
                </button>
              </div>
            </div>
          </header>

          {/* Active Diner Screen */}
          <main>
            {dinerTab === 'menu' && (
              <DinerMenuScreen
                dishes={dishes}
                cart={cart}
                tableNumber={activeTableNumber}
                isNightMode={isNightMode}
                onToggleNightMode={() => setIsNightMode((v) => !v)}
                michiConfig={michiConfig}
                michiGreeting={michiGreeting}
                waitlistDishIds={waitlistDishIds}
                onToggleWaitlist={handleToggleWaitlist}
                onAddToCart={handleAddToCart}
                onUpdateCartQuantity={handleUpdateCartQuantity}
                onRemoveCartItem={handleRemoveCartItem}
                onSubmitCartOrder={handleSubmitCartOrder}
                onOpenMichiVoice={() => openMichiTab('voz')}
                onGoToOrder={() => setDinerTab('pedido')}
              />
            )}

            {dinerTab === 'pedido' && (
              <DinerOrderScreen
                activeOrder={activeDinerOrder}
                pastVisits={PAST_VISITS}
                alerts={alerts}
                dishes={dishes}
                onRepeatVisit={handleRepeatVisit}
                onCallWaiter={() =>
                  showToast(`Mozo ${activeDinerOrder.waiterName} notificado para Mesa #${activeTableNumber}`)
                }
                onMarkAlertsRead={() =>
                  setAlerts((prev) => prev.map((a) => ({ ...a, unread: false })))
                }
                onGoToMenu={() => setDinerTab('menu')}
              />
            )}

            {dinerTab === 'michi' && (
              <MichiHubScreen
                dishes={dishes}
                tableNumber={activeTableNumber}
                config={michiConfig}
                initialSubView={michiSubView}
                activeOrder={activeDinerOrder}
                onUpdateConfig={setMichiConfig}
                onApplyGestureToMenu={handleApplyGestureToMenu}
                onAddParsedItemsToCart={handleAddParsedItemsToCart}
              />
            )}
          </main>

          {/* Mobile Bottom Tab Bar (Menú · Mi Pedido · Michi · Admin) */}
          <nav
            aria-label="Navegación móvil"
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-[#191614]/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 grid grid-cols-4 items-center"
          >
            <button
              type="button"
              onClick={() => setDinerTab('menu')}
              className={`flex flex-col items-center justify-center h-full text-[11px] font-semibold ${
                dinerTab === 'menu'
                  ? 'text-[#9E3304] dark:text-amber-400'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              <Utensils className="w-5 h-5 mb-0.5" />
              <span>Menú</span>
            </button>
            <button
              type="button"
              onClick={() => setDinerTab('pedido')}
              className={`flex flex-col items-center justify-center h-full text-[11px] font-semibold ${
                dinerTab === 'pedido'
                  ? 'text-[#9E3304] dark:text-amber-400'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              <ReceiptText className="w-5 h-5 mb-0.5" />
              <span>Mi Pedido</span>
            </button>
            <button
              type="button"
              onClick={() => openMichiTab('voz')}
              className={`flex flex-col items-center justify-center h-full text-[11px] font-semibold ${
                dinerTab === 'michi'
                  ? 'text-[#9E3304] dark:text-amber-400'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              <PawPrint className="w-5 h-5 mb-0.5" />
              <span>{michiConfig.name}</span>
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceMode('admin')}
              className="flex flex-col items-center justify-center h-full text-[11px] font-semibold text-stone-500 dark:text-stone-400"
            >
              <LayoutGrid className="w-5 h-5 mb-0.5" />
              <span>Admin</span>
            </button>
          </nav>
        </>
      ) : (
        /* ADMIN & OPERATIONS SMART DINING OS WORKSPACE */
        <div className="min-h-screen flex flex-col lg:flex-row">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white dark:bg-[#191614] border-r border-stone-200 dark:border-stone-800 p-5 justify-between">
            <div className="space-y-6">
              <div className="flex items-center px-1">
                <img
                  src="./assets/logo.png"
                  alt="MISHIKO - Operación & KDS"
                  className="h-9 w-auto object-contain filter drop-shadow-sm"
                />
              </div>

              <div className="space-y-1">
                <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-stone-400">
                  OPERACIÓN & SISTEMA
                </div>
                {ADMIN_NAV.map((item) => {
                  const active = adminTab === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setAdminTab(item.key)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[42px] whitespace-nowrap ${
                        active
                          ? 'bg-[#9E3304] text-white'
                          : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 p-3.5 space-y-1">
              <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                Servicio en Vivo
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
                {tables.filter((t) => t.status === 'ocupada').length} Mesas Activas · KDS Sincronizado
              </div>
            </div>
          </aside>

          {/* Main Admin Area */}
          <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
            {/* Admin Top Bar */}
            <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-[#191614]/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-4 sm:px-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-semibold">
                  <Store className="w-3.5 h-3.5 text-[#9E3304] dark:text-amber-400 shrink-0" />
                  <select
                    aria-label="Seleccionar sucursal"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="bg-transparent focus:outline-none text-stone-800 dark:text-stone-100"
                  >
                    <option value="Mishiko Bistro - Miraflores">
                      Mishiko Bistro - Miraflores
                    </option>
                    <option value="Sucursal Principal - Polanco">
                      Sucursal Principal - Polanco
                    </option>
                  </select>
                </div>
                <span className="hidden sm:inline text-xs text-stone-500 dark:text-stone-400 truncate">
                  {operatorBadge.name} · {operatorBadge.roleTitle}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setWorkspaceMode('diner')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#9E3304] hover:bg-[#822802] text-white text-xs font-semibold min-h-[40px] whitespace-nowrap shrink-0"
              >
                <QrCode className="w-4 h-4" />
                <span>Vista Comensal QR</span>
              </button>
            </header>

            {/* Mobile Admin Horizontal Tabs */}
            <div className="lg:hidden px-4 py-2.5 bg-white dark:bg-[#191614] border-b border-stone-200 dark:border-stone-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {ADMIN_NAV.map((item) => {
                const active = adminTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setAdminTab(item.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#9E3304] text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
              {adminTab === 'kds' && (
                <AdminKdsView
                  orders={orders}
                  outOfStockCount={outOfStockCount}
                  onToggleItemDone={handleToggleKdsItemDone}
                  onAdvanceOrderStep={handleAdvanceOrderStep}
                  onRejectOrder={handleRejectOrder}
                />
              )}

              {adminTab === 'catalogo' && (
                <AdminCatalogView
                  dishes={dishes}
                  onToggleAvailability={handleToggleDishAvailability}
                  onAddDish={handleAddDish}
                />
              )}

              {adminTab === 'mesas' && (
                <AdminTablesView
                  tables={tables}
                  orders={orders}
                  activeTableNumber={activeTableNumber}
                  onSelectActiveDinerTable={handleSelectActiveDinerTable}
                  onReleaseTable={handleReleaseTable}
                />
              )}

              {adminTab === 'seguridad' && (
                <AdminSecurityView
                  staff={staff}
                  onToggleJwtStatus={handleToggleJwtStatus}
                  onAddStaffMember={handleAddStaffMember}
                />
              )}

              {adminTab === 'acceso' && (
                <AdminTerminalLoginView
                  onAuthenticated={(profile) => {
                    setOperatorBadge(profile);
                    showToast(`Sesión iniciada en ${profile.stationId}`);
                  }}
                />
              )}
            </main>
          </div>
        </div>
      )}

      {/* Non-blocking Live Toast Feedback con Branding MISHIKO */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 z-50 flex items-start gap-3 p-3.5 pr-5 rounded-2xl bg-stone-900/95 dark:bg-stone-900/95 text-stone-100 border border-amber-500/40 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200 max-w-sm"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <img src="./assets/logo.png" alt="MISHIKO" className="w-5 h-5 object-contain" />
          </div>
          <div className="space-y-0.5">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span>MISHIKO Notificación</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-xs font-medium text-stone-200 leading-snug">
              {toastMessage}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
