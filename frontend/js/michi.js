/**
 * michi.js — Mascota virtual Michi con expresiones PNG reales
 * 
 * Expresiones del gato mesero:
 * 1. SALUDO  (saludo):    Patita saludando, bienvenida e idle.
 * 2. ANOTADO (anotado):   Pulgar/dedo arriba ("¡Anotado! He agregado a tu comanda").
 * 3. LISTO   (listo):     Trayendo la comida en bandeja ("¡Tu pedido ya está listo! Va en camino a tu mesa").
 * 
 * Variantes de género (Hombre / Mujer / Preferencia):
 * - MACHO:  Michi (Gato negro con pañuelo naranja, ojos ámbar)
 * - HEMBRA: Michita (Gata blanca con pañuelo celeste, ojos celestes con pestañas)
 * 
 * Integración de IA:
 * - HuggingFace sentence-transformers/all-MiniLM-L6-v2 vía michi-ai.js
 */

// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN GLOBAL DE MICHI
// ═══════════════════════════════════════════════════════════
const MichiConfig = {
  genero:    'macho',  // 'macho' (Michi negro) | 'hembra' (Michita blanca)
  nombre:    'Michi',
  vozActiva: true,
  volumen:   0.9,
  mostrar:   true,
  vozURI:    ''
};

// Resolver ruta de assets independientemente de si estamos en subcarpeta o raíz
function resolverRutaMichi(nombreArchivo) {
  const path = window.location.pathname;
  const enSubcarpeta = path.includes('/mascota/') || path.includes('/admin/') || path.includes('/cocina/');
  const prefijo = enSubcarpeta ? '../assets/michi/' : 'assets/michi/';
  return prefijo + nombreArchivo;
}

// Catálogo de imágenes individuales PNG por género y expresión
const MICHI_IMAGENES = {
  macho: {
    saludo:  'michi-macho-saludo.png',
    anotado: 'michi-macho-anotado.png',
    listo:   'michi-macho-listo.png'
  },
  hembra: {
    saludo:  'michi-hembra-saludo.png',
    anotado: 'michi-hembra-anotado.png',
    listo:   'michi-hembra-listo.png'
  }
};

let michiEstado = 'saludo'; // 'saludo' | 'anotado' | 'listo'
let michiVisible = false;

// ═══════════════════════════════════════════════════════════
// CAMBIO DE EXPRESIÓN Y GÉNERO
// ═══════════════════════════════════════════════════════════

/**
 * Obtiene la URL completa del PNG actual según género y pose.
 */
function getUrlMichi(genero = MichiConfig.genero, expresion = michiEstado) {
  const g = MICHI_IMAGENES[genero] ? genero : 'macho';
  const archivo = MICHI_IMAGENES[g][expresion] || MICHI_IMAGENES[g].saludo;
  return resolverRutaMichi(archivo);
}

/**
 * Aplica una expresión visual a Michi.
 * @param {'saludo'|'anotado'|'listo'} pose
 */
function aplicarExpresionMichi(pose) {
  michiEstado = pose;
  const img = document.getElementById('michi-img');
  if (img) {
    img.src = getUrlMichi(MichiConfig.genero, pose);
    img.alt = `${MichiConfig.nombre} (${pose})`;
  }

  const widget = document.getElementById('michi-widget');
  if (widget) {
    widget.classList.remove('michi-state-saludo', 'michi-state-anotado', 'michi-state-listo');
    widget.classList.add(`michi-state-${pose}`);
  }
}

/**
 * Animar a una expresión y volver a saludo tras duracionMs.
 */
function animarMichiExpresion(pose, duracionMs = 4000) {
  aplicarExpresionMichi(pose);
  clearTimeout(window._michiExpresionTimeout);
  if (pose !== 'saludo') {
    window._michiExpresionTimeout = setTimeout(() => {
      aplicarExpresionMichi('saludo');
    }, duracionMs);
  }
}

/**
 * Cambia el género de Michi (macho = negro, hembra = blanca).
 * @param {'macho'|'hembra'} nuevoGenero
 */
function cambiarGeneroMichi(nuevoGenero) {
  MichiConfig.genero = (nuevoGenero === 'hembra') ? 'hembra' : 'macho';
  if (MichiConfig.nombre === 'Michi' && MichiConfig.genero === 'hembra') {
    MichiConfig.nombre = 'Michita';
  } else if (MichiConfig.nombre === 'Michita' && MichiConfig.genero === 'macho') {
    MichiConfig.nombre = 'Michi';
  }

  try {
    localStorage.setItem('mishiko_michi_genero', MichiConfig.genero);
    localStorage.setItem('mishiko_michi_nombre', MichiConfig.nombre);
  } catch (_) {}

  aplicarExpresionMichi(michiEstado);

  // Actualizar textos en UI si existen
  const previewNombre = document.getElementById('preview-nombre');
  if (previewNombre) previewNombre.textContent = MichiConfig.nombre;
  const msgNombre = document.getElementById('msg-nombre');
  if (msgNombre) msgNombre.textContent = MichiConfig.nombre;
}

// ═══════════════════════════════════════════════════════════
// ACCIONES CLAVE DE MICHI (CON VOZ Y EXPRESIÓN)
// ═══════════════════════════════════════════════════════════

/**
 * Acción: ANOTADO (Pulgar/dedo arriba)
 * Cuando se agrega un producto al pedido.
 */
function michiAnotar(productoNombre, cantidad = 1) {
  animarMichiExpresion('anotado', 4500);
  const cantTexto = cantidad > 1 ? `${cantidad} ` : '';
  const mensaje = `¡Anotado! He agregado ${cantTexto}${productoNombre} a tu comanda 😺 ¿Deseas ordenar algo más?`;
  michiHabla(mensaje, 'anotado');
}

/**
 * Acción: LISTO (Trayendo la comida en bandeja)
 * Cuando el pedido ya está listo en cocina o va camino a la mesa.
 */
function michiComidaLista(numeroPedido = '') {
  animarMichiExpresion('listo', 8000);
  const numTexto = numeroPedido ? ` número ${numeroPedido}` : '';
  const mensaje = `¡Tu pedido${numTexto} ya está listo! Va en camino a tu mesa 🍽️ ¡Buen provecho!`;
  michiHabla(mensaje, 'listo');
}

/**
 * Acción: SALUDO / BIENVENIDA
 */
function michiSaludar() {
  animarMichiExpresion('saludo', 3000);
  const mensaje = `¡Hola! Bienvenido a MISHIKO. Soy ${MichiConfig.nombre}, tu mesero virtual. ¿Qué se te antoja disfrutar hoy? 🐱`;
  michiHabla(mensaje, 'saludo');
}

// ═══════════════════════════════════════════════════════════
// SÍNTESIS DE VOZ (SpeechSynthesis API)
// ═══════════════════════════════════════════════════════════
let vozSynth = window.speechSynthesis || null;
let vozesDisponibles = [];

function cargarVoces() {
  if (!vozSynth) return [];
  vozesDisponibles = vozSynth.getVoices().filter(v => v.lang.startsWith('es'));
  if (vozesDisponibles.length === 0) vozesDisponibles = vozSynth.getVoices();
  return vozesDisponibles;
}

if (vozSynth) {
  vozSynth.onvoiceschanged = cargarVoces;
  cargarVoces();
}

/**
 * Michi habla un texto y activa la expresión indicada.
 * @param {string} texto
 * @param {'saludo'|'anotado'|'listo'} expresion
 */
function michiHabla(texto, expresion = 'saludo') {
  const respuesta = document.getElementById('michi-respuesta');
  if (respuesta) respuesta.textContent = texto;

  const burbuja = document.getElementById('michi-burbuja');
  const msgEl   = document.getElementById('michi-msg');
  if (burbuja && msgEl) {
    msgEl.textContent = texto;
    burbuja.style.display = 'block';
    clearTimeout(window._michiBubbleTimeout);
    window._michiBubbleTimeout = setTimeout(() => {
      burbuja.style.display = 'none';
    }, 6000);
  }

  // Asegurar la expresión visual correspondiente
  if (expresion) aplicarExpresionMichi(expresion);

  if (!MichiConfig.vozActiva || !vozSynth) return;

  vozSynth.cancel();
  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang   = 'es-PE';
  utterance.volume = MichiConfig.volumen;
  utterance.rate   = 1.0;
  // Michita tiene un tono un poco más agudo por ser gata
  utterance.pitch  = MichiConfig.genero === 'hembra' ? 1.3 : 1.05;

  const voz = vozesDisponibles.find(v => v.voiceURI === MichiConfig.vozURI) || vozesDisponibles[0];
  if (voz) utterance.voice = voz;

  utterance.onend = () => {
    // Si la expresión era temporal, regresa suavemente a saludo
    if (michiEstado !== 'saludo') {
      setTimeout(() => aplicarExpresionMichi('saludo'), 1500);
    }
  };

  vozSynth.speak(utterance);
}

// ═══════════════════════════════════════════════════════════
// RECONOCIMIENTO DE VOZ (SpeechRecognition API)
// ═══════════════════════════════════════════════════════════
let reconocimiento = null;
let micActivo = false;

function iniciarReconocimiento(onResult) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (typeof mostrarToast === 'function') {
      mostrarToast('⚠ Tu navegador no soporta voz por micrófono. Usa Chrome.', 'warning', 4000);
    }
    return;
  }

  if (micActivo) {
    detenerReconocimiento();
    return;
  }

  // Michi prestando atención
  aplicarExpresionMichi('saludo');

  reconocimiento = new SpeechRecognition();
  reconocimiento.lang = 'es-PE';
  reconocimiento.interimResults = true;
  reconocimiento.maxAlternatives = 1;
  reconocimiento.continuous = false;

  reconocimiento.onstart = () => {
    micActivo = true;
    vozSynth?.cancel();
    actualizarBtnMic(true);
    aplicarExpresionMichi('saludo');
  };

  reconocimiento.onresult = (event) => {
    const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
    const textoEl = document.getElementById('texto-reconocido') || document.getElementById('texto-reconocido-chat');
    if (textoEl instanceof HTMLInputElement) textoEl.value = transcript;
    else if (textoEl) textoEl.textContent = transcript;

    if (event.results[0].isFinal && onResult) {
      onResult(transcript.toLowerCase());
    }
  };

  reconocimiento.onerror = (e) => {
    console.warn('Error reconocimiento:', e.error);
    micActivo = false;
    actualizarBtnMic(false);
  };

  reconocimiento.onend = () => {
    micActivo = false;
    actualizarBtnMic(false);
  };

  reconocimiento.start();
}

function detenerReconocimiento() {
  if (reconocimiento) reconocimiento.stop();
  micActivo = false;
  actualizarBtnMic(false);
}

function actualizarBtnMic(activo) {
  const btn = document.getElementById('btn-mic');
  if (!btn) return;
  btn.textContent = activo ? '🔴 Escuchando...' : '🎤 Hablar con Michi';
  btn.style.background = activo ? 'var(--mishiko-error, #dc2626)' : 'var(--mishiko-primary, #FF6B35)';
}

// ═══════════════════════════════════════════════════════════
// COMPRENSIÓN SEMÁNTICA CON sentence-transformers/all-MiniLM-L6-v2
// ═══════════════════════════════════════════════════════════
function normalizarConsulta(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function coincidenciasMichi(texto, productos) {
  const stopWords = ['el', 'la', 'los', 'las', 'de', 'con', 'sin', 'un', 'una', 'por', 'favor'];
  const palabras = nombre => normalizarConsulta(nombre).split(' ')
    .filter(p => p && !stopWords.includes(p))
    .map(p => /[aeiou]s$/.test(p) ? p.slice(0, -1) : p);
  const consulta = palabras(texto);
  if (consulta.length === 0) return [];
  const exactos = productos.filter(p => palabras(p.nombre).join(' ') === consulta.join(' '));
  if (exactos.length) return exactos;
  return productos.filter(p => {
    const nombre = palabras(p.nombre);
    return consulta.some(palabra => nombre.includes(palabra));
  });
}

/**
 * Procesa la orden o consulta del usuario usando IA semántica all-MiniLM-L6-v2
 */
async function procesarInstruccionVoz(instruccion) {
  const texto = normalizarConsulta(instruccion).replace(/^michi\s+/, '').replace(/^michita\s+/, '');
  if (!texto) return;

  // 1. Clasificar intención con sentence-transformers/all-MiniLM-L6-v2 si está listo
  let intencion = 'HELP';
  if (window.MichiAI && window.MichiAI.estaListo()) {
    const res = await window.MichiAI.clasificarIntencion(texto);
    intencion = res.intencion;
    console.log(`[Michi] Intención clasificada (MiniLM): ${intencion} (${(res.confianza * 100).toFixed(1)}%)`);
  } else {
    // Clasificador por reglas fallback
    const t = texto.toLowerCase();
    if (/quiero|dame|agrega|pon|traeme|trae|comprar|ordenar|pido/.test(t)) intencion = 'ORDER';
    else if (/recomiend|sugi|especial|popular|mas pedido|rico/.test(t))   intencion = 'RECOMMEND';
    else if (/cuanto cuesta|precio|vale/.test(t))                         intencion = 'PRICE';
    else if (/estado|como va|ya salio|listo mi pedido/.test(t))            intencion = 'STATUS';
    else if (/carrito|mi orden|total/.test(t))                            intencion = 'CART';
  }

  // 2. Ejecutar según intención
  switch (intencion) {
    case 'ORDER':
      return await procesarPedidoVoz(texto);
    case 'RECOMMEND':
      return await procesarRecomendacionVoz(texto);
    case 'PRICE':
      return await procesarPrecioVoz(texto);
    case 'STATUS':
      return await procesarEstadoVoz();
    case 'CART':
      if (typeof toggleCarrito === 'function') {
        if (!document.getElementById('panel-carrito')?.classList.contains('open')) toggleCarrito();
      }
      return michiHabla(
        typeof Cart !== 'undefined' && Cart.count()
          ? 'Aquí tienes tu carrito de compras 🛒 ¿Confirmamos el pedido?'
          : 'Tu carrito está vacío todavía. ¿Qué te gustaría pedir?',
        'saludo'
      );
    default:
      return michiHabla(
        '¡Puedo tomar tu pedido, recomendarte platillos o consultar precios! Prueba con "quiero unas gyozas" o "qué me recomiendas".',
        'saludo'
      );
  }
}

async function procesarPedidoVoz(texto) {
  const numeros = { un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10 };
  const match = texto.match(/(?:quiero|dame|agrega|pon|traeme|trae|comprar|ordenar|pido)\s+(.+)/);
  const consulta = match ? match[1] : texto;

  const prods = (typeof todosProductos !== 'undefined' && todosProductos.length) ? todosProductos : [];
  let opciones = coincidenciasMichi(consulta, prods);

  // Si no coincide por texto, usar búsqueda semántica MiniLM
  if (opciones.length === 0 && window.MichiAI && window.MichiAI.estaListo()) {
    const semMatch = await window.MichiAI.encontrarProductoMasSimilar(consulta, prods);
    if (semMatch && semMatch.similitud > 0.45) {
      opciones = [semMatch.producto];
      console.log(`[Michi] Match semántico all-MiniLM-L6-v2: ${semMatch.producto.nombre}`);
    }
  }

  if (opciones.length === 0) {
    return michiHabla(`No encontré "${consulta}" en el menú. Revisa la carta o pídeme una recomendación 😺`, 'saludo');
  }

  const prod = opciones[0];
  if (!prod.disponible) {
    return michiHabla(`El platillo ${prod.nombre} está agotado por el momento. ¿Te recomiendo una alternativa?`, 'saludo');
  }

  // Extraer cantidad
  const primerToken = consulta.trim().split(' ')[0];
  const cantidad = /^\d+$/.test(primerToken) ? parseInt(primerToken, 10) : (numeros[primerToken] ?? 1);

  if (typeof Cart !== 'undefined') {
    Cart.add(prod, cantidad);
    if (typeof renderCarritoItems === 'function') renderCarritoItems();
  }

  // ¡Anotado con pulgar arriba!
  michiAnotar(prod.nombre, cantidad);
}

async function procesarRecomendacionVoz(texto) {
  const prods = (typeof todosProductos !== 'undefined' && todosProductos.length) ? todosProductos : [];
  if (prods.length === 0) return michiHabla('Cargando el menú en vivo... ¡Vuelve a preguntarme en un segundo!', 'saludo');

  let recomendados = [];
  if (window.MichiAI && window.MichiAI.estaListo()) {
    const hits = await window.MichiAI.obtenerRecomendaciones(texto || 'plato principal delicioso especial', prods, 3);
    recomendados = hits.map(h => h.producto);
  } else {
    recomendados = prods.filter(p => p.disponible).slice(0, 3);
  }

  const nombres = recomendados.map(p => p.nombre).join(', ');
  // Expresión de listo / sirviendo delicias
  michiHabla(`¡Lo más pedido de la casa es: ${nombres}! Todo fresquito y delicioso 😺`, 'listo');
}

async function procesarPrecioVoz(texto) {
  const match = texto.match(/(?:cuanto cuesta|precio|vale)\s+(.+)/);
  const consulta = match ? match[1] : texto;
  const prods = (typeof todosProductos !== 'undefined' && todosProductos.length) ? todosProductos : [];

  let opciones = coincidenciasMichi(consulta, prods);
  if (opciones.length === 0 && window.MichiAI && window.MichiAI.estaListo()) {
    const semMatch = await window.MichiAI.encontrarProductoMasSimilar(consulta, prods);
    if (semMatch) opciones = [semMatch.producto];
  }

  if (opciones.length >= 1) {
    const fmt = typeof Cart !== 'undefined' ? Cart.fmt : (p) => `S/ ${p.toFixed(2)}`;
    return michiHabla(`${opciones[0].nombre} cuesta ${fmt(opciones[0].precio)}.`, 'saludo');
  }
  return michiHabla('¿De qué platillo deseas consultar el precio?', 'saludo');
}

async function procesarEstadoVoz() {
  const pedidoId = typeof pedidoConfirmadoId !== 'undefined' ? pedidoConfirmadoId : null;
  if (!pedidoId) {
    return michiHabla('Puedes consultar tu estado ingresando tu código en la página de Seguimiento 📍', 'saludo');
  }
  try {
    const p = await api.get(`/pedidos/${pedidoId}`);
    if (p.estado === 'LISTO' || p.estado === 'ENTREGADO') {
      michiComidaLista(p.numeroPedido);
    } else {
      michiHabla(`Tu pedido ${p.numeroPedido} está ${p.estado.toLowerCase().replace('_', ' ')}. ¡Ya falta poco!`, 'anotado');
    }
  } catch (_) {
    michiHabla('No pude consultar tu pedido en este momento. Intenta en la sección de seguimiento.', 'saludo');
  }
}

// ═══════════════════════════════════════════════════════════
// INICIALIZACIÓN DEL WIDGET AL CARGAR LA PÁGINA
// ═══════════════════════════════════════════════════════════
function toggleMichi() {
  const burbuja = document.getElementById('michi-burbuja');
  if (!burbuja) return;
  michiVisible = !michiVisible;
  burbuja.style.display = michiVisible ? 'block' : 'none';
  if (michiVisible) {
    michiSaludar();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Cargar configuración persistida
  const generoGuardado = localStorage.getItem('mishiko_michi_genero');
  if (generoGuardado) MichiConfig.genero = generoGuardado;

  const nombreGuardado = localStorage.getItem('mishiko_michi_nombre');
  if (nombreGuardado) MichiConfig.nombre = nombreGuardado;

  // Configurar imagen inicial
  aplicarExpresionMichi('saludo');

  // Widget flotante clic
  const widget = document.getElementById('michi-widget') || document.getElementById('michi-img-wrapper');
  if (widget) {
    widget.addEventListener('click', toggleMichi);
  }

  // Si existe formulario de comandos en página
  const formMichi = document.getElementById('form-michi');
  if (formMichi) {
    formMichi.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('texto-reconocido') || document.getElementById('texto-reconocido-chat');
      if (input && input.value) procesarInstruccionVoz(input.value);
    });
  }

  // Si existe botón de micrófono
  const btnMic = document.getElementById('btn-mic');
  if (btnMic) {
    btnMic.addEventListener('click', () => {
      iniciarReconocimiento((texto) => procesarInstruccionVoz(texto));
    });
  }

  // Exponer globalmente
  window.michiAnotar = michiAnotar;
  window.michiComidaLista = michiComidaLista;
  window.michiSaludar = michiSaludar;
  window.cambiarGeneroMichi = cambiarGeneroMichi;
  window.aplicarExpresionMichi = aplicarExpresionMichi;
});
