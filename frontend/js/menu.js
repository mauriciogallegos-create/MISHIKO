/**
 * menu.js – Lógica del menú digital de MISHIKO
 * Carga productos/categorías y gestiona el carrito del cliente
 */

// ── Estado global ──────────────────────────────────────────────────────────────
let todosProductos = [];
let categoriaActiva = 0;
let restauranteId = 1;
let mesaId = null;
let mesaNumero = 1;
let pedidoConfirmadoId = null;
let solicitudPendiente = null;

// ── Inicialización ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Leer parámetros de la URL
  const params = new URLSearchParams(window.location.search);
  restauranteId = parseInt(params.get('restauranteId') || '1');
  mesaNumero    = parseInt(params.get('mesa') || '1');
  mesaId        = parseInt(params.get('mesaId') || '0') || null;

  // Actualizar UI
  document.getElementById('mesa-num').textContent = mesaNumero;
  document.getElementById('rev-mesa').textContent = mesaNumero;

  Cart.updateBadge();
  await cargarMenu();
  renderCarritoItems();

  // Michi saluda
  setTimeout(() => michiHabla('¡Hola! Bienvenido a MISHIKO. Soy Michi, tu mesero 🐱 ¿Qué vas a disfrutar hoy?'), 1200);
});

// ── Cargar Menú ────────────────────────────────────────────────────────────────
async function cargarMenu() {
  try {
    const data = await api.get(`/menu?restauranteId=${restauranteId}&mesa=${mesaNumero}`);

    const restaurante = data.restaurante;
    document.getElementById('restaurante-nombre').textContent = restaurante?.nombre || 'MISHIKO';
    document.getElementById('restaurante-desc').textContent = restaurante?.descripcion || '';
    const logo = document.getElementById('restaurante-logo');
    if (restaurante?.logoUrl) {
      logo.onload = () => { logo.hidden = false; };
      logo.onerror = () => { logo.hidden = true; };
      logo.src = urlImagenMishiko(restaurante.logoUrl);
    }

    todosProductos = data.productos || [];
    renderCategorias(data.categorias || []);
    renderProductos(todosProductos);
  } catch (err) {
    mostrarError('No se pudo cargar el menú: ' + err.message);
  }
}

// ── Renderizar Categorías ──────────────────────────────────────────────────────
function renderCategorias(categorias) {
  const container = document.getElementById('categorias-container');
  container.innerHTML = '<button class="categoria-chip active" onclick="filtrarCategoria(0, this)">Todos</button>';
  categorias.forEach(cat => {
    const chip = document.createElement('button');
    chip.className = 'categoria-chip';
    chip.textContent = cat.nombre;
    chip.onclick = () => filtrarCategoria(cat.id, chip);
    container.appendChild(chip);
  });
}

function filtrarCategoria(catId, btn) {
  categoriaActiva = catId;
  document.querySelectorAll('.categoria-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  const filtrados = catId === 0 ? todosProductos : todosProductos.filter(p => p.categoriaId === catId);
  renderProductos(filtrados);
}

// ── Renderizar Productos ───────────────────────────────────────────────────────
function renderProductos(productos) {
  const grid = document.getElementById('productos-grid');
  const loading = document.getElementById('loading-menu');
  const noRes = document.getElementById('no-resultados');

  loading.style.display = 'none';
  noRes.style.display = 'none';

  if (!productos || productos.length === 0) {
    grid.style.display = 'none';
    noRes.style.display = 'block';
    return;
  }

  grid.style.display = 'grid';
  grid.innerHTML = productos.map(p => crearProductoCard(p)).join('');
  grid.querySelectorAll('.producto-card').forEach((card, indice) => {
    card.querySelector('.btn-agregar')?.addEventListener('click', () => agregarAlCarrito(productos[indice]));
  });
}

function crearProductoCard(p) {
  const agotado = !p.disponible;
  const imgHtml = p.imagenUrl
    ? `<img src="${escaparHtml(urlImagenMishiko(p.imagenUrl))}" alt="${escaparHtml(p.nombre)}" onerror="this.parentElement.innerHTML='🍽'">`
    : '🍽';
  const precioFmt = 'S/ ' + parseFloat(p.precio).toFixed(2);

  return `
    <div class="producto-card${agotado ? ' agotado' : ''}" data-id="${p.id}">
      <div class="producto-img">
        ${agotado ? '<span class="badge-agotado">Agotado</span>' : ''}
        ${imgHtml}
      </div>
      <div class="producto-body">
        <div class="producto-categoria">${escaparHtml(p.categoriaNombre || '')}</div>
        <div class="producto-nombre">${escaparHtml(p.nombre)}</div>
        <div class="producto-desc">${escaparHtml(p.descripcion || '')}</div>
        <div class="producto-footer">
          <span class="producto-precio">${precioFmt}</span>
          ${agotado
            ? '<span class="text-muted" style="font-size:0.82rem">No disponible</span>'
            : `<button type="button" class="btn-agregar">+ Agregar</button>`
          }
        </div>
      </div>
    </div>`;
}

// ── Buscar productos ───────────────────────────────────────────────────────────
let searchTimeout;
function buscarProductos(query) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      const filtrados = categoriaActiva === 0 ? todosProductos : todosProductos.filter(p => p.categoriaId === categoriaActiva);
      renderProductos(filtrados);
    } else {
      const filtrados = todosProductos.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q))
      );
      renderProductos(filtrados);
    }
  }, 300);
}

// ── Carrito ────────────────────────────────────────────────────────────────────
function agregarAlCarrito(producto) {
  Cart.add(producto);
  renderCarritoItems();
  mostrarToast(`✅ ${producto.nombre} agregado`, 'success');
  michiHabla('¡Excelente elección! Tu pedido está tomando forma 😸');

  // Animación del botón
  const cards = document.querySelectorAll(`[data-id="${producto.id}"]`);
  cards.forEach(card => {
    card.style.transform = 'scale(1.03)';
    setTimeout(() => card.style.transform = '', 200);
  });
}

function toggleCarrito() {
  const panel = document.getElementById('panel-carrito');
  const overlay = document.getElementById('overlay-carrito');
  const isOpen = panel.classList.contains('open');

  if (isOpen) {
    panel.classList.remove('open');
    overlay.classList.remove('active');
  } else {
    panel.classList.add('open');
    overlay.classList.add('active');
    renderCarritoItems();
  }
}

function renderCarritoItems() {
  const items = Cart.get();
  const container = document.getElementById('carrito-items');
  const totalesDiv = document.getElementById('carrito-totales');
  const btnRevisar = document.getElementById('btn-revisar');

  if (items.length === 0) {
    container.innerHTML = `
      <div class="carrito-vacio">
        <span>😺</span>
        <p>Tu carrito está vacío</p>
        <small>¡Añade algo delicioso!</small>
      </div>`;
    totalesDiv.style.display = 'none';
    btnRevisar.disabled = true;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="carrito-item">
      <div class="carrito-item-info">
        <div class="carrito-item-nombre">${escaparHtml(item.nombre)}</div>
        <div class="carrito-item-precio">${Cart.fmt(item.precio * item.cantidad)}</div>
        <div class="cantidad-control" style="margin-top:0.3rem">
          <button class="btn-cantidad" onclick="cambiarCantidad(${item.id}, ${item.cantidad - 1})">−</button>
          <span class="cantidad-num">${item.cantidad}</span>
          <button class="btn-cantidad" onclick="cambiarCantidad(${item.id}, ${item.cantidad + 1})">+</button>
        </div>
        <div class="carrito-item-obs">
          <input type="text" placeholder="Observación..." value="${escaparHtml(item.observacion || '')}"
            oninput="Cart.setObservacion(${item.id}, this.value)"
            style="width:100%;font-size:0.8rem;padding:3px 6px;border:1px solid #e2e8f0;border-radius:5px;font-family:var(--font)">
        </div>
      </div>
      <button class="btn-eliminar-item" onclick="eliminarItem(${item.id})" title="Eliminar">🗑</button>
    </div>`).join('');

  // Totales
  document.getElementById('subtotal').textContent = Cart.fmt(Cart.subtotal());
  document.getElementById('igv').textContent      = Cart.fmt(Cart.igv());
  document.getElementById('total').textContent    = Cart.fmt(Cart.total());
  totalesDiv.style.display = 'block';
  btnRevisar.disabled = false;
  Cart.updateBadge();
}

function cambiarCantidad(id, cantidad) {
  Cart.setQuantity(id, cantidad);
  renderCarritoItems();
}

function eliminarItem(id) {
  Cart.remove(id);
  renderCarritoItems();
}

// ── Revisión del Pedido ────────────────────────────────────────────────────────
function abrirRevision() {
  const items = Cart.get();
  if (items.length === 0) return;

  document.getElementById('rev-mesa').textContent = mesaNumero;
  document.getElementById('rev-lista').innerHTML = items.map(i => `
    <div class="revision-item">
      <span>${i.cantidad}× ${escaparHtml(i.nombre)}</span>
      <span>${Cart.fmt(i.precio * i.cantidad)}</span>
    </div>
    ${i.observacion ? `<div style="font-size:0.78rem;color:var(--text-muted);padding:2px 0 4px 1rem">Obs: ${escaparHtml(i.observacion)}</div>` : ''}`
  ).join('');

  document.getElementById('rev-subtotal').textContent = Cart.fmt(Cart.subtotal());
  document.getElementById('rev-igv').textContent      = Cart.fmt(Cart.igv());
  document.getElementById('rev-total').textContent    = Cart.fmt(Cart.total());

  document.getElementById('modal-revision').style.display = 'flex';
}

function cerrarModal(id) {
  document.getElementById(id).style.display = 'none';
}

// ── Confirmar Pedido ───────────────────────────────────────────────────────────
async function confirmarPedido() {
  const items = Cart.get();
  const btn = document.getElementById('btn-confirmar');
  if (items.length === 0 || btn.disabled) return;

  btn.disabled = true;
  btn.textContent = 'Enviando...';

  const nombreCliente = document.getElementById('nombre-cliente').value.trim();
  const obsGeneral = document.getElementById('obs-general').value.trim();

  // Si no tenemos mesaId, intentar inferirlo del parámetro URL
  const mesaIdParam = parseInt(new URLSearchParams(window.location.search).get('mesaId') || '0');
  const mesaFinal = mesaIdParam || 1; // fallback mesa 1

  const payload = {
    restauranteId,
    mesaId: mesaFinal,
    nombreCliente: nombreCliente || null,
    observaciones: obsGeneral || null,
    items: items.map(i => ({
      productoId:   i.id,
      cantidad:     i.cantidad,
      observaciones: i.observacion || null
    }))
  };

  try {
    const detalleSolicitud = JSON.stringify(payload);
    if (solicitudPendiente?.detalle !== detalleSolicitud) {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      const id = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
      solicitudPendiente = { detalle: detalleSolicitud, id };
    }
    const pedido = await api.post('/pedidos', { ...payload, solicitudId: solicitudPendiente.id });
    if (!pedido) return;
    solicitudPendiente = null;

    pedidoConfirmadoId = pedido.id;
    document.getElementById('conf-numero').textContent = pedido.numeroPedido;
    document.getElementById('btn-seguimiento').href = `seguimiento.html?numero=${pedido.numeroPedido}`;
    document.getElementById('btn-comprobante').href = `comprobante.html?pedidoId=${pedido.id}`;

    cerrarModal('modal-revision');
    document.getElementById('modal-confirmacion').style.display = 'flex';

    Cart.clear();
    renderCarritoItems();
    document.getElementById('panel-carrito').classList.remove('open');
    document.getElementById('overlay-carrito').classList.remove('active');

    michiHabla('¡Muchas gracias por tu pedido! Ya lo estamos enviando a cocina 🍳');
  } catch (err) {
    mostrarToast('Error al confirmar: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '✅ Confirmar Pedido';
  }
}

// ── Toast y helpers ────────────────────────────────────────────────────────────
function mostrarToast(msg, tipo = 'info', duracion = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(10px)'; setTimeout(() => toast.remove(), 300); }, duracion);
}

function mostrarError(msg) {
  document.getElementById('loading-menu').style.display = 'none';
  document.getElementById('productos-grid').innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--error)">⚠ ${escaparHtml(msg)}</div>`;
  document.getElementById('productos-grid').style.display = 'grid';
}
