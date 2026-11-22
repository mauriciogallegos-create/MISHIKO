import React, { useMemo, useState } from 'react';
import { Clock, Plus, Search, Star, X } from 'lucide-react';
import { IMAGES } from '../data/mishikoSeed';
import { Dish, DishCategory } from '../types/mishiko';
import { DishImage } from './DishImage';

interface AdminCatalogViewProps {
  dishes: Dish[];
  onToggleAvailability: (dishId: string) => void;
  onAddDish: (dish: Dish) => void;
}

const CATALOG_CATEGORIES: DishCategory[] = [
  'Todos',
  'Nikkei & Fusión',
  'Hamburguesas',
  'Especialidades',
  'Entradas',
  'Bebidas & Cocteles',
  'Postres',
];

export const AdminCatalogView: React.FC<AdminCatalogViewProps> = ({
  dishes,
  onToggleAvailability,
  onAddDish,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DishCategory>('Todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'disponibles' | 'agotados'>('todos');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New dish form state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<Exclude<DishCategory, 'Todos'>>('Nikkei & Fusión');
  const [newPrice, setNewPrice] = useState('34.00');
  const [newCost, setNewCost] = useState('12.00');
  const [newPrep, setNewPrep] = useState('12 min');

  const availableCount = dishes.filter((d) => d.available).length;
  const outCount = dishes.length - availableCount;

  const filtered = useMemo(() => {
    return dishes.filter((d) => {
      const matchCat = categoryFilter === 'Todos' || d.category === categoryFilter;
      const matchStatus =
        statusFilter === 'todos'
          ? true
          : statusFilter === 'disponibles'
            ? d.available
            : !d.available;
      const q = search.trim().toLowerCase();
      const matchQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q);
      return matchCat && matchStatus && matchQuery;
    });
  }, [dishes, categoryFilter, statusFilter, search]);

  const handleCreateDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const price = Math.max(1, parseFloat(newPrice) || 25);
    const cost = Math.max(0.5, parseFloat(newCost) || 10);
    const created: Dish = {
      id: `dish-${Date.now()}`,
      name: newName.trim(),
      description:
        newDesc.trim() || 'Preparación artesanal recién incorporada a la carta QR.',
      category: newCategory,
      price,
      cost,
      prepMinutes: newPrep.trim() || '12 min',
      image:
        newCategory === 'Bebidas & Cocteles'
          ? IMAGES.drinks
          : newCategory === 'Hamburguesas'
            ? IMAGES.burger
            : newCategory === 'Entradas'
              ? IMAGES.gyozas
              : IMAGES.ramen,
      available: true,
      highlightLabel: 'Nuevo en Carta',
      station: newCategory === 'Bebidas & Cocteles' ? 'Barra' : 'Estación Caliente',
      modifiers: [],
      rating: 4.9,
    };
    onAddDish(created);
    setNewName('');
    setNewDesc('');
    setIsNewModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header + Stats + CTA */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[#9E3304] dark:text-amber-400">
            CARTA GASTRONÓMICA ACTIVA
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 mt-0.5">
            Gestión de Catálogo & Menú
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Sincronización instantánea con códigos QR de mesas y Kitchen Display System (KDS).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-5 px-4 py-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
            <div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400">
                Platos Totales
              </div>
              <div className="text-lg font-bold tabular-nums text-stone-900 dark:text-stone-50">
                {dishes.length}
              </div>
            </div>
            <div className="h-7 w-px bg-stone-200 dark:bg-stone-800" />
            <div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400">
                Disponibles
              </div>
              <div className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {availableCount}
              </div>
            </div>
            <div className="h-7 w-px bg-stone-200 dark:bg-stone-800" />
            <div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400">
                Agotados
              </div>
              <div className="text-lg font-bold tabular-nums text-red-600 dark:text-red-400">
                {outCount}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#9E3304] hover:bg-[#822802] text-white text-xs font-semibold min-h-[44px] whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Platillo</span>
          </button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por platillo, ingrediente o categoría..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#9E3304]/30"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {CATALOG_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 min-h-[34px] ${
                categoryFilter === cat
                  ? 'bg-[#9E3304] text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-800">
          {(['todos', 'disponibles', 'agotados'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-500 dark:text-stone-400">
                <th className="py-3.5 px-5">Platillo & Ficha</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4">Precio Venta</th>
                <th className="py-3.5 px-4">Tiempo Estimado</th>
                <th className="py-3.5 px-5 text-right">Estado Carta QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filtered.map((dish) => {
                const marginPct = Math.round(
                  ((dish.price - dish.cost) / dish.price) * 100,
                );
                return (
                  <tr
                    key={dish.id}
                    className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                          <DishImage
                            src={dish.image}
                            alt={dish.name}
                            className={`w-full h-full object-cover ${
                              !dish.available ? 'grayscale opacity-65' : ''
                            }`}
                          />
                          {dish.rating && dish.available && (
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-white text-[10px] font-semibold inline-flex items-center gap-0.5 tabular-nums">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              {dish.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 max-w-md">
                          <div
                            className={`text-sm font-bold ${
                              dish.available
                                ? 'text-stone-900 dark:text-stone-50'
                                : 'line-through text-stone-400 dark:text-stone-500'
                            }`}
                          >
                            {dish.name}
                          </div>
                          <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                            {dish.description}
                          </p>
                          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 tabular-nums">
                            {dish.available ? (
                              <span>
                                {dish.highlightLabel ? `${dish.highlightLabel} · ` : ''}
                                Costo: S/ {dish.cost.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                Sin inventario de insumo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                        {dish.category}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-sm font-bold tabular-nums text-[#9E3304] dark:text-amber-400">
                        S/ {dish.price.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
                        Margen {marginPct}%
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300 tabular-nums">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {dish.prepMinutes}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex items-center gap-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={dish.available}
                          aria-label={`Alternar disponibilidad de ${dish.name}`}
                          onClick={() => onToggleAvailability(dish.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            dish.available
                              ? 'bg-[#9E3304]'
                              : 'bg-stone-300 dark:bg-stone-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              dish.available ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span
                          className={`text-xs font-semibold min-w-[70px] text-left ${
                            dish.available
                              ? 'text-stone-800 dark:text-stone-200'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {dish.available ? 'Disponible' : 'Agotado'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3.5 bg-stone-50 dark:bg-stone-800/40 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
          <span>
            Cambios de disponibilidad impactan en vivo en los menús QR en menos de 1 segundo.
          </span>
          <span className="tabular-nums font-medium">
            Mostrando {filtered.length} de {dishes.length} platillos
          </span>
        </div>
      </div>

      {/* Add New Dish Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateDish}
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">
                Nuevo Platillo en Carta QR
              </h3>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Nombre del platillo
                </label>
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Tataki de Bonito Nikkei"
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ingredientes y preparación..."
                  className="mt-1 w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Categoría
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as Exclude<DishCategory, 'Todos'>)
                    }
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm"
                  >
                    {CATALOG_CATEGORIES.filter((c) => c !== 'Todos').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Tiempo Estimado
                  </label>
                  <input
                    value={newPrep}
                    onChange={(e) => setNewPrep(e.target.value)}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Precio Venta (S/)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Costo Insumo (S/)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#9E3304] text-white text-xs font-semibold hover:bg-[#822802]"
              >
                Publicar en Menú QR
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
