import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  Check,
  Clock,
  Flame,
  Mic,
  Minus,
  Moon,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Sun,
  Trash2,
  Utensils,
  Wine,
} from 'lucide-react';
import { CartItem, Dish, DishCategory, DishModifier, MichiConfig } from '../types/mishiko';
import { DishImage } from './DishImage';
import { MichiAvatar } from './MichiAvatar';

interface DinerMenuScreenProps {
  dishes: Dish[];
  cart: CartItem[];
  tableNumber: string;
  isNightMode: boolean;
  onToggleNightMode: () => void;
  michiConfig: MichiConfig;
  michiGreeting: string;
  waitlistDishIds: string[];
  onToggleWaitlist: (dishId: string) => void;
  onAddToCart: (dish: Dish, quantity: number, modifiers: DishModifier[]) => void;
  onUpdateCartQuantity: (cartItemId: string, delta: number) => void;
  onRemoveCartItem: (cartItemId: string) => void;
  onSubmitCartOrder: () => void;
  onOpenMichiVoice: () => void;
  onGoToOrder: () => void;
}

const CATEGORIES: DishCategory[] = [
  'Todos',
  'Especialidades',
  'Hamburguesas',
  'Nikkei & Fusión',
  'Entradas',
  'Bebidas & Cocteles',
  'Postres',
];

export const DinerMenuScreen: React.FC<DinerMenuScreenProps> = ({
  dishes,
  cart,
  tableNumber,
  isNightMode,
  onToggleNightMode,
  michiConfig,
  michiGreeting,
  waitlistDishIds,
  onToggleWaitlist,
  onAddToCart,
  onUpdateCartQuantity,
  onRemoveCartItem,
  onSubmitCartOrder,
  onOpenMichiVoice,
  onGoToOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<DishCategory>('Todos');
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({
    'dish-smash-doble': [],
  });
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [michiBubbleOpen, setMichiBubbleOpen] = useState(false);

  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      const matchesCategory =
        activeCategory === 'Todos' || dish.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        dish.name.toLowerCase().includes(q) ||
        dish.description.toLowerCase().includes(q) ||
        dish.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [dishes, activeCategory, searchQuery]);

  const nightSpecials = useMemo(
    () => dishes.filter((d) => d.nightSpecial && d.available),
    [dishes],
  );

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0,
  );

  const toggleModifier = (dishId: string, modId: string) => {
    setSelectedModifiers((prev) => {
      const current = prev[dishId] ?? [];
      const exists = current.includes(modId);
      return {
        ...prev,
        [dishId]: exists ? current.filter((id) => id !== modId) : [...current, modId],
      };
    });
  };

  const getDishQty = (dishId: string) => quantities[dishId] ?? 1;

  const setDishQty = (dishId: string, next: number) => {
    setQuantities((prev) => ({
      ...prev,
      [dishId]: Math.max(1, Math.min(12, next)),
    }));
  };

  const handleAddDish = (dish: Dish) => {
    if (!dish.available) return;
    const modIds = selectedModifiers[dish.id] ?? [];
    const mods = dish.modifiers.filter((m) => modIds.includes(m.id));
    const qty = getDishQty(dish.id);
    onAddToCart(dish, qty, mods);
    setQuantities((prev) => ({ ...prev, [dish.id]: 1 }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28 lg:pb-10">
      {/* Top Status & Night Bistro Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-medium text-stone-500 dark:text-stone-400">
            <span>Mesa #{tableNumber} Conectada</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 dark:text-emerald-400">Carta sincronizada en vivo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50 mt-0.5">
            {isNightMode ? 'Modo Oscuro · Menú Digital' : 'Menú Digital'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleNightMode}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors min-h-[40px] whitespace-nowrap shrink-0"
          >
            {isNightMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span>Modo Oscuro</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Menu Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Search + Voice Input */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-stone-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar hamburguesa, ramen, bebidas..."
              aria-label="Buscar en el menú"
              className="w-full pl-11 pr-14 py-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#A63400]/30"
            />
            <button
              type="button"
              onClick={onOpenMichiVoice}
              title="Pedir por voz con Michi AI"
              aria-label="Pedir por voz con Michi AI"
              className="absolute right-2 w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 flex items-center justify-center hover:bg-violet-200 dark:hover:bg-violet-900/70 transition-colors"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          {/* Michi en Vivo Banner */}
          <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-[#E67E22] via-[#C9643B] to-[#6B4E9B] text-white shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <MichiAvatar config={michiConfig} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-white/90 font-medium">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>{michiConfig.name} en Vivo</span>
                    <span aria-hidden="true">·</span>
                    <span>Voz Activa</span>
                  </div>
                  <p className="text-sm font-medium text-white mt-0.5 line-clamp-2">
                    {michiBubbleOpen
                      ? `¡Miau! Soy ${michiConfig.name}, atendiendo Mesa #${tableNumber}. Te recomiendo nuestro Ramen Criollo o la Smash Burger Doble.`
                      : michiGreeting}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setMichiBubbleOpen((v) => !v)}
                  className="px-4 py-2 rounded-xl bg-white text-[#9E3304] text-xs font-bold hover:bg-amber-50 transition-colors min-h-[40px] whitespace-nowrap"
                >
                  {michiBubbleOpen ? 'Ocultar saludo' : '¡Saludar!'}
                </button>
                <button
                  type="button"
                  onClick={onOpenMichiVoice}
                  className="px-4 py-2 rounded-xl bg-black/25 hover:bg-black/35 text-white text-xs font-semibold transition-colors min-h-[40px] whitespace-nowrap"
                >
                  Pedir por voz
                </button>
              </div>
            </div>
          </div>

          {/* Night Bistro Mode: Especiales de Luna Carousel */}
          {isNightMode && nightSpecials.length > 0 && (
            <section aria-label="Especiales de Luna" className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wine className="w-4 h-4 text-amber-400" />
                  <h2 className="text-lg font-bold text-stone-100">
                    Especiales de Luna
                  </h2>
                </div>
                <span className="text-xs font-medium text-amber-400">
                  Chef & Sommelier
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {nightSpecials.map((special) => (
                  <div
                    key={special.id}
                    className="rounded-2xl overflow-hidden bg-[#1D1916] border border-stone-800 flex flex-col"
                  >
                    <div className="relative h-40">
                      <DishImage
                        src={special.image}
                        alt={special.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <span className="absolute top-3 left-3 text-xs font-semibold text-amber-300 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                        {special.highlightLabel}
                      </span>
                      <span className="absolute bottom-3 right-3 text-sm font-bold tabular-nums text-white bg-[#A63400] px-2.5 py-1 rounded-lg">
                        S/ {special.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-stone-100">
                          {special.name}
                        </h3>
                        <p className="text-xs text-stone-400 mt-1 line-clamp-2">
                          {special.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                        <span className="text-xs text-amber-300/90 flex items-center gap-1.5">
                          <Wine className="w-3.5 h-3.5" />
                          {special.pairing ?? 'Sugerencia nocturna'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddDish(special)}
                          className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 font-bold flex items-center justify-center hover:bg-amber-400 transition-colors"
                          aria-label={`Agregar ${special.name}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Category Tabs */}
          <div
            className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
            role="tablist"
            aria-label="Categorías del menú"
          >
            {CATEGORIES.map((category) => {
              const active = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[40px] ${
                    active
                      ? 'bg-[#9E3304] text-white'
                      : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {/* Dishes List */}
          {filteredDishes.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-10 text-center">
              <Utensils className="w-8 h-8 text-stone-400 mx-auto mb-3" />
              <p className="text-base font-semibold text-stone-900 dark:text-stone-100">
                No encontramos platillos con "{searchQuery}"
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                Prueba otra categoría o pregúntale por voz a {michiConfig.name}.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('Todos');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredDishes.map((dish, idx) => {
                const isFeatured = idx === 0 && activeCategory === 'Todos' && !searchQuery;
                const activeMods = selectedModifiers[dish.id] ?? [];
                const extraCost = dish.modifiers
                  .filter((m) => activeMods.includes(m.id))
                  .reduce((sum, m) => sum + m.priceDelta, 0);
                const qty = getDishQty(dish.id);
                const lineTotal = (dish.price + extraCost) * qty;
                const isWaitlisted = waitlistDishIds.includes(dish.id);

                return (
                  <article
                    key={dish.id}
                    className={`rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 overflow-hidden flex flex-col justify-between transition-shadow ${
                      isFeatured ? 'md:col-span-2' : ''
                    } ${!dish.available ? 'opacity-85' : ''}`}
                  >
                    <div>
                      <div className={`relative ${isFeatured ? 'h-56 sm:h-64' : 'h-44'}`}>
                        <DishImage
                          src={dish.image}
                          alt={dish.name}
                          className={`w-full h-full object-cover ${
                            !dish.available ? 'grayscale' : ''
                          }`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                        {dish.available && dish.highlightLabel && (
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#9E3304] text-white text-xs font-semibold">
                            <Flame className="w-3.5 h-3.5" />
                            {dish.highlightLabel}
                          </span>
                        )}
                        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/70 text-white text-xs font-medium tabular-nums">
                          <Clock className="w-3 h-3" />
                          {dish.prepMinutes}
                        </span>
                        {!dish.available && (
                          <div className="absolute inset-0 bg-stone-900/45 flex items-center justify-center">
                            <span className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold tracking-wide">
                              AGOTADO
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 sm:p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                              {dish.category} · {dish.station}
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-50 mt-0.5">
                              {dish.name}
                            </h3>
                          </div>
                          <span className="text-base sm:text-lg font-bold tabular-nums text-[#A63400] dark:text-amber-400 shrink-0">
                            S/ {dish.price.toFixed(2)}
                          </span>
                        </div>

                        <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-2">
                          {dish.description}
                        </p>

                        {dish.pairing && (
                          <div className="rounded-xl px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                            <Wine className="w-3.5 h-3.5 shrink-0" />
                            <span>Maridaje Sommelier: {dish.pairing}</span>
                          </div>
                        )}

                        {dish.available && dish.modifiers.length > 0 && (
                          <div className="pt-2 space-y-2">
                            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                              <span className="font-medium">Personalización</span>
                              <span>Opcional</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {dish.modifiers.map((mod) => {
                                const selected = activeMods.includes(mod.id);
                                return (
                                  <button
                                    key={mod.id}
                                    type="button"
                                    onClick={() => toggleModifier(dish.id, mod.id)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors min-h-[34px] ${
                                      selected
                                        ? 'bg-[#9E3304]/10 border-[#9E3304] text-[#9E3304] dark:bg-amber-500/15 dark:border-amber-400 dark:text-amber-300'
                                        : 'bg-stone-50 dark:bg-stone-800/70 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                                    }`}
                                  >
                                    {selected && <Check className="w-3 h-3" />}
                                    <span>{mod.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2">
                      {dish.available ? (
                        <div className="flex items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() => setDishQty(dish.id, qty - 1)}
                              aria-label="Disminuir cantidad"
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-stone-700 dark:text-stone-200 hover:bg-white dark:hover:bg-stone-700 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-7 text-center text-sm font-bold tabular-nums text-stone-900 dark:text-stone-100">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => setDishQty(dish.id, qty + 1)}
                              aria-label="Aumentar cantidad"
                              className="w-9 h-9 rounded-lg bg-[#9E3304] text-white flex items-center justify-center hover:bg-[#822802] transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddDish(dish)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#9E3304] hover:bg-[#822802] text-white text-xs sm:text-sm font-semibold transition-colors min-h-[44px] tabular-nums whitespace-nowrap"
                          >
                            <ShoppingBag className="w-4 h-4 shrink-0" />
                            <span>Agregar S/ {lineTotal.toFixed(2)}</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onToggleWaitlist(dish.id)}
                          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors min-h-[44px] ${
                            isWaitlisted
                              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-800 dark:text-amber-300'
                              : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                          }`}
                        >
                          <Bell className="w-4 h-4" />
                          <span>
                            {isWaitlisted
                              ? 'Te avisaremos cuando regrese'
                              : 'Avisarme cuando esté disponible'}
                          </span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Sticky Order Summary Rail */}
        <aside className="hidden lg:block lg:col-span-4 sticky top-20">
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-50">
                  Tu Bandeja · Mesa #{tableNumber}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Envío directo al KDS de cocina
                </p>
              </div>
              <span className="text-xs font-bold tabular-nums text-[#9E3304] dark:text-amber-400">
                {cartCount} ítems
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <ShoppingBag className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
                <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
                  Tu bandeja está vacía
                </p>
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  Agrega platillos del menú o usa el asistente por voz {michiConfig.name}.
                </p>
                <button
                  type="button"
                  onClick={onGoToOrder}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9E3304] dark:text-amber-400 hover:underline"
                >
                  <span>Ver comanda activa en curso</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <ul className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <li
                      key={item.cartItemId}
                      className="flex items-start gap-3 pb-3 border-b border-stone-100 dark:border-stone-800 last:border-0 last:pb-0"
                    >
                      <DishImage
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                            {item.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => onRemoveCartItem(item.cartItemId)}
                            aria-label={`Quitar ${item.name}`}
                            className="text-stone-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {item.selectedModifiers.length > 0 && (
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                            {item.selectedModifiers.map((m) => m.label).join(' · ')}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="inline-flex items-center gap-2 bg-stone-100 dark:bg-stone-800 rounded-lg px-1.5 py-0.5">
                            <button
                              type="button"
                              onClick={() => onUpdateCartQuantity(item.cartItemId, -1)}
                              className="w-6 h-6 flex items-center justify-center text-stone-700 dark:text-stone-200"
                              aria-label="Restar unidad"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateCartQuantity(item.cartItemId, 1)}
                              className="w-6 h-6 flex items-center justify-center text-stone-700 dark:text-stone-200"
                              aria-label="Sumar unidad"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-xs font-bold tabular-nums text-stone-900 dark:text-stone-100">
                            S/ {(item.unitPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                    <span>Subtotal (inc. IGV)</span>
                    <span className="font-bold text-base tabular-nums text-stone-900 dark:text-stone-50">
                      S/ {cartSubtotal.toFixed(2)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onSubmitCartOrder}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#9E3304] hover:bg-[#822802] text-white text-sm font-semibold transition-colors min-h-[46px]"
                  >
                    <span>Confirmar y Enviar a Cocina</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile Floating Order Bar (only above bottom nav when cart > 0 or active order) */}
      {cartCount > 0 && (
        <div className="lg:hidden fixed bottom-18 left-3 right-3 z-30">
          <div className="rounded-2xl bg-[#1C1917] dark:bg-stone-900 text-white p-3 shadow-lg border border-stone-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#9E3304] flex items-center justify-center font-bold text-sm tabular-nums shrink-0">
                {cartCount}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-stone-300 truncate">
                  Bandeja Mesa #{tableNumber}
                </div>
                <div className="text-sm font-bold tabular-nums">
                  S/ {cartSubtotal.toFixed(2)}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onSubmitCartOrder}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#9E3304] hover:bg-[#822802] text-white text-xs font-semibold min-h-[44px] whitespace-nowrap shrink-0"
            >
              <span>Enviar Pedido</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
