/**
 * cart.js – Lógica del carrito de compras de MISHIKO
 * Persiste en localStorage
 */

const Cart = {
  CART_KEY: 'mishiko_cart',
  MESA_KEY: 'mishiko_mesa',
  REST_KEY:  'mishiko_restaurante',

  /** Obtener el carrito del localStorage */
  get() {
    return JSON.parse(localStorage.getItem(this.CART_KEY) || '[]');
  },

  /** Guardar el carrito */
  save(items) {
    localStorage.setItem(this.CART_KEY, JSON.stringify(items));
    this.updateBadge();
  },

  /** Agregar producto al carrito */
  add(producto, cantidad = 1) {
    const items = this.get();
    const existing = items.find(i => i.id === producto.id);
    if (existing) {
      existing.cantidad += cantidad;
    } else {
      items.push({
        id:          producto.id,
        nombre:      producto.nombre,
        precio:      parseFloat(producto.precio),
        imagenUrl:   producto.imagenUrl || null,
        cantidad:    cantidad,
        observacion: ''
      });
    }
    this.save(items);
    return items;
  },

  /** Remover producto por id */
  remove(productoId) {
    const items = this.get().filter(i => i.id !== productoId);
    this.save(items);
    return items;
  },

  /** Cambiar cantidad de un item */
  setQuantity(productoId, cantidad) {
    const items = this.get();
    const item = items.find(i => i.id === productoId);
    if (item) {
      if (cantidad <= 0) return this.remove(productoId);
      item.cantidad = cantidad;
      this.save(items);
    }
    return this.get();
  },

  /** Cambiar observación de un item */
  setObservacion(productoId, obs) {
    const items = this.get();
    const item = items.find(i => i.id === productoId);
    if (item) {
      item.observacion = obs;
      this.save(items);
    }
  },

  /** Limpiar carrito */
  clear() {
    localStorage.removeItem(this.CART_KEY);
    this.updateBadge();
  },

  /** Total de items (suma de cantidades) */
  count() {
    return this.get().reduce((acc, i) => acc + i.cantidad, 0);
  },

  /** Subtotal (sin IGV) */
  subtotal() {
    return this.get().reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  },

  /** IGV 18% */
  igv() {
    return this.subtotal() * 0.18;
  },

  /** Total con IGV */
  total() {
    return this.subtotal() + this.igv();
  },

  /** Formatear importe en Soles */
  fmt(amount) {
    return 'S/ ' + parseFloat(amount).toFixed(2);
  },

  /** Actualizar el badge del navbar */
  updateBadge() {
    const badge = document.getElementById('carrito-count');
    if (badge) {
      const count = this.count();
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
  },

  /** Setear datos de sesión de mesa */
  setMesa(restauranteId, mesaId, mesaNumero) {
    localStorage.setItem(this.MESA_KEY, JSON.stringify({ restauranteId, mesaId, mesaNumero }));
  },

  getMesa() {
    return JSON.parse(localStorage.getItem(this.MESA_KEY) || 'null');
  }
};
