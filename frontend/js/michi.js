/**
 * michi.js – Mascota virtual Michi 3D con Three.js
 * Voz (SpeechSynthesis) y reconocimiento (SpeechRecognition)
 */

// ═══════════════════════════════════════════════════════
// CONFIGURACIÓN GLOBAL DE MICHI
// ═══════════════════════════════════════════════════════
const MichiConfig = {
  color:      '#FF8C42',  // naranja por defecto
  nombre:     'Michi',
  vozActiva:  true,
  volumen:    0.9,
  mostrar:    true
};

// ═══════════════════════════════════════════════════════
// 3D CON THREE.JS (CDN, cargado dinámicamente)
// ═══════════════════════════════════════════════════════
let michiScene, michiRenderer, michiCamera, michiGroup;
let michiAnimating = true;
let michiClock;
let michiVisible = false;

function initMichi3D(canvasId = 'michi-canvas') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // Cargar Three.js dinámicamente si no está cargado
  if (typeof THREE === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = () => buildMichiScene(canvas);
    document.head.appendChild(script);
  } else {
    buildMichiScene(canvas);
  }
}

function buildMichiScene(canvas) {
  const W = canvas.width  || 80;
  const H = canvas.height || 80;

  michiScene    = new THREE.Scene();
  michiCamera   = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  michiCamera.position.set(0, 0.5, 4);

  michiRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  michiRenderer.setSize(W, H);
  michiRenderer.setPixelRatio(window.devicePixelRatio);
  michiRenderer.setClearColor(0x000000, 0);

  // Luz
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  michiScene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(2, 3, 2);
  michiScene.add(dirLight);

  michiGroup = buildMichiModel();
  michiScene.add(michiGroup);

  michiClock = new THREE.Clock();
  animateMichi();
}

function buildMichiModel() {
  const group = new THREE.Group();
  const pelaje = MichiConfig.color;
  const matPelaje  = new THREE.MeshLambertMaterial({ color: pelaje });
  const matOscuro  = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const matBlanco  = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
  const matRojo    = new THREE.MeshLambertMaterial({ color: 0xCC2222 });
  const matOjo     = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
  const matPupila  = new THREE.MeshLambertMaterial({ color: 0x000000 });
  const matNariz   = new THREE.MeshLambertMaterial({ color: 0xFF9999 });
  const matDelantal= new THREE.MeshLambertMaterial({ color: 0xEEEEEE });

  // ── CUERPO ─────────────────────────────────────────────
  const cuerpo = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), matPelaje);
  cuerpo.scale.set(1, 1.15, 0.9);
  cuerpo.position.y = -0.3;
  group.add(cuerpo);

  // Delantal
  const delantal = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.65), matDelantal);
  delantal.position.set(0, -0.28, 0.42);
  group.add(delantal);

  // ── CABEZA ─────────────────────────────────────────────
  const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), matPelaje);
  cabeza.position.y = 0.52;
  group.add(cabeza);
  group.userData.cabeza = cabeza;

  // Mejillas (blancas)
  [-0.18, 0.18].forEach(x => {
    const mejilla = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), matBlanco);
    mejilla.position.set(x, 0.46, 0.33);
    mejilla.scale.set(1, 0.8, 0.5);
    group.add(mejilla);
  });

  // ── OREJAS ─────────────────────────────────────────────
  [-0.28, 0.28].forEach((x, idx) => {
    const oreja = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.26, 4), matPelaje);
    oreja.position.set(x, 0.88, 0.0);
    oreja.rotation.z = idx === 0 ? 0.4 : -0.4;
    group.add(oreja);
    // Interior oreja
    const interior = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 4), matNariz);
    interior.position.set(x * 0.9, 0.88, 0.04);
    interior.rotation.z = idx === 0 ? 0.4 : -0.4;
    group.add(interior);
  });

  // ── OJOS ───────────────────────────────────────────────
  [-0.15, 0.15].forEach(x => {
    const ojo = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), matOjo);
    ojo.position.set(x, 0.57, 0.37);
    group.add(ojo);
    // Pupila
    const pupila = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), matPupila);
    pupila.position.set(x, 0.57, 0.44);
    group.add(pupila);
    // Brillo
    const brillo = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), matBlanco);
    brillo.position.set(x + 0.03, 0.59, 0.46);
    group.add(brillo);
  });

  // Nariz
  const nariz = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), matNariz);
  nariz.position.set(0, 0.5, 0.42);
  group.add(nariz);

  // ── CORBATÍN ───────────────────────────────────────────
  const corbatin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.05), matRojo);
  corbatin.position.set(0, 0.14, 0.44);
  group.add(corbatin);

  // ── BRAZOS ─────────────────────────────────────────────
  [-0.6, 0.6].forEach((x, idx) => {
    const brazo = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.3, 4, 8), matPelaje);
    brazo.position.set(x, -0.1, 0);
    brazo.rotation.z = idx === 0 ? 0.6 : -0.6;
    group.add(brazo);
    group.userData[idx === 0 ? 'brazoIzq' : 'brazoDer'] = brazo;
  });

  // ── COLA ───────────────────────────────────────────────
  const colaPoints = [];
  for (let i = 0; i <= 8; i++) {
    colaPoints.push(new THREE.Vector2(0.07 - i * 0.005, i * 0.12));
  }
  const cola = new THREE.Mesh(
    new THREE.LatheGeometry(colaPoints, 8),
    matPelaje
  );
  cola.position.set(-0.55, -0.7, -0.1);
  cola.rotation.z = -0.8;
  cola.scale.set(0.7, 0.7, 0.7);
  group.add(cola);

  group.scale.set(0.85, 0.85, 0.85);
  return group;
}

function animateMichi() {
  if (!michiAnimating || !michiRenderer) return;
  requestAnimationFrame(animateMichi);

  const t = michiClock ? michiClock.getElapsedTime() : 0;

  if (michiGroup) {
    // Cabeza: movimiento suave (idle)
    const cabeza = michiGroup.userData.cabeza;
    if (cabeza) {
      cabeza.rotation.z = Math.sin(t * 1.1) * 0.08;
      cabeza.position.y = 0.52 + Math.sin(t * 1.4) * 0.015;
    }
    // Rotación leve del grupo
    michiGroup.rotation.y = Math.sin(t * 0.5) * 0.15;
    michiGroup.position.y = Math.sin(t * 1.2) * 0.04;

    // Brazos
    const brazoIzq = michiGroup.userData.brazoIzq;
    const brazoDer = michiGroup.userData.brazoDer;
    if (brazoIzq) brazoIzq.rotation.x = Math.sin(t) * 0.1;
    if (brazoDer) brazoDer.rotation.x = Math.sin(t + Math.PI) * 0.1;
  }

  michiRenderer.render(michiScene, michiCamera);
}

/** Cambiar color del pelaje */
function cambiarColorMichi(hexColor) {
  MichiConfig.color = hexColor;
  if (michiGroup) {
    // Reconstruir modelo con nuevo color
    if (michiScene) michiScene.remove(michiGroup);
    const canvas = document.getElementById('michi-canvas');
    if (canvas) {
      michiGroup = buildMichiModel();
      michiScene.add(michiGroup);
    }
  }
}

function toggleMichi() {
  const burbuja = document.getElementById('michi-burbuja');
  if (!burbuja) return;
  michiVisible = !michiVisible;
  burbuja.style.display = michiVisible ? 'block' : 'none';
  if (michiVisible) michiHabla('¡Hola! ¿En qué te puedo ayudar? 🐱');
}

// ═══════════════════════════════════════════════════════
// VOZ – SpeechSynthesis API
// ═══════════════════════════════════════════════════════
let vozSynth = window.speechSynthesis || null;
let vozSeleccionada = null;
let vozesDisponibles = [];

function cargarVoces() {
  if (!vozSynth) return [];
  vozesDisponibles = vozSynth.getVoices().filter(v => v.lang.startsWith('es'));
  if (vozesDisponibles.length === 0) vozesDisponibles = vozSynth.getVoices();
  return vozesDisponibles;
}

// Las voces se cargan de forma asíncrona
if (vozSynth) {
  vozSynth.onvoiceschanged = cargarVoces;
  cargarVoces();
}

/**
 * Michi habla un mensaje en voz
 * @param {string} texto
 */
function michiHabla(texto, forzar = false) {
  // Mostrar burbuja con el texto
  const burbuja = document.getElementById('michi-burbuja');
  const msgEl   = document.getElementById('michi-msg');
  if (burbuja && msgEl) {
    msgEl.textContent = texto;
    burbuja.style.display = 'block';
    // Auto-ocultar después de 5s
    clearTimeout(window._michiTimeout);
    window._michiTimeout = setTimeout(() => {
      burbuja.style.display = 'none';
    }, 5500);
  }

  // Voz
  if (!MichiConfig.vozActiva && !forzar) return;
  if (!vozSynth) return;

  vozSynth.cancel();
  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang   = 'es-PE';
  utterance.volume = MichiConfig.volumen;
  utterance.rate   = 1.0;
  utterance.pitch  = 1.1;

  if (vozSeleccionada) utterance.voice = vozSeleccionada;
  else if (vozesDisponibles.length > 0) utterance.voice = vozesDisponibles[0];

  vozSynth.speak(utterance);
}

// ═══════════════════════════════════════════════════════
// RECONOCIMIENTO DE VOZ – SpeechRecognition API
// ═══════════════════════════════════════════════════════
let reconocimiento = null;
let micActivo = false;

function iniciarReconocimiento(onResult) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    mostrarToast('⚠ Tu navegador no soporta reconocimiento de voz. Usa Chrome.', 'warning', 4000);
    return;
  }

  if (micActivo) {
    detenerReconocimiento();
    return;
  }

  reconocimiento = new SpeechRecognition();
  reconocimiento.lang = 'es-PE';
  reconocimiento.interimResults = true;
  reconocimiento.maxAlternatives = 1;
  reconocimiento.continuous = false;

  reconocimiento.onstart = () => {
    micActivo = true;
    michiHabla('Te escucho... 🎤');
    actualizarBtnMic(true);
  };

  reconocimiento.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(r => r[0].transcript)
      .join('');

    // Mostrar texto reconocido
    const textoEl = document.getElementById('texto-reconocido');
    if (textoEl) textoEl.textContent = transcript;

    if (event.results[0].isFinal && onResult) {
      onResult(transcript.toLowerCase());
    }
  };

  reconocimiento.onerror = (e) => {
    console.warn('Error de reconocimiento:', e.error);
    micActivo = false;
    actualizarBtnMic(false);
    if (e.error === 'not-allowed') {
      mostrarToast('🎤 Permiso de micrófono denegado.', 'error');
    }
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
  btn.style.background = activo ? 'var(--error)' : 'var(--primary)';
}

/**
 * Procesar instrucción de voz del cliente para el menú
 * @param {string} instruccion - Texto reconocido en minúsculas
 */
function procesarInstruccionVoz(instruccion) {
  if (!instruccion) return;

  // ── Agregar producto ────────────────────────────────────
  const matchAgregar = instruccion.match(/(?:quiero|agrega|dame|pon)\s+(.+)/);
  if (matchAgregar && typeof todosProductos !== 'undefined') {
    const termino = matchAgregar[1];
    const cantidadMatch = termino.match(/^(\w+)\s+(.+)/);
    let cantidad = 1;
    let nombreProducto = termino;

    if (cantidadMatch) {
      const numPalabras = { uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5 };
      const numParsed = parseInt(cantidadMatch[1]) || numPalabras[cantidadMatch[1]] || null;
      if (numParsed) { cantidad = numParsed; nombreProducto = cantidadMatch[2]; }
    }

    const producto = todosProductos.find(p =>
      p.nombre.toLowerCase().includes(nombreProducto.trim()) ||
      nombreProducto.trim().includes(p.nombre.toLowerCase())
    );

    if (producto) {
      if (!producto.disponible) {
        michiHabla(`Lo siento, ${producto.nombre} está agotado en este momento.`);
        return;
      }
      for (let i = 0; i < cantidad; i++) agregarAlCarrito(producto);
      michiHabla(`Agregué ${cantidad} ${producto.nombre} a tu pedido 😸`);
    } else {
      michiHabla(`No encontré "${nombreProducto}" en el menú. ¿Puedes repetirlo?`);
    }
    return;
  }

  // ── Eliminar producto ───────────────────────────────────
  if (instruccion.includes('elimina') || instruccion.includes('quita') || instruccion.includes('saca')) {
    const items = Cart.get();
    const encontrado = items.find(i => instruccion.includes(i.nombre.toLowerCase()));
    if (encontrado) {
      Cart.remove(encontrado.id);
      renderCarritoItems && renderCarritoItems();
      michiHabla(`Quité ${encontrado.nombre} de tu pedido.`);
    } else {
      michiHabla('No encontré ese producto en tu carrito.');
    }
    return;
  }

  // ── Consultas ───────────────────────────────────────────
  if (instruccion.includes('total') || instruccion.includes('cuánto es')) {
    const total = typeof Cart !== 'undefined' ? Cart.fmt(Cart.total()) : '0';
    michiHabla(`El total de tu pedido es ${total} incluyendo IGV.`);
    return;
  }

  if (instruccion.includes('carrito') || instruccion.includes('pedido')) {
    const items = Cart.get();
    if (items.length === 0) {
      michiHabla('Tu carrito está vacío. ¡Elige algo del menú!');
    } else {
      const resumen = items.map(i => `${i.cantidad} ${i.nombre}`).join(', ');
      michiHabla(`En tu carrito tienes: ${resumen}.`);
    }
    return;
  }

  if (instruccion.includes('postres') || instruccion.includes('bebidas') ||
      instruccion.includes('platos') || instruccion.includes('entradas')) {
    michiHabla('¡Claro! Mira las categorías en la parte superior del menú 👆');
    return;
  }

  // Precio de un producto
  const matchPrecio = instruccion.match(/(?:cuánto cuesta|precio de)\s+(.+)/);
  if (matchPrecio && typeof todosProductos !== 'undefined') {
    const nombre = matchPrecio[1].trim();
    const producto = todosProductos.find(p => p.nombre.toLowerCase().includes(nombre));
    if (producto) {
      michiHabla(`${producto.nombre} cuesta ${Cart.fmt(producto.precio)}.`);
    } else {
      michiHabla(`No encontré ese producto. ¿Puedes ser más específico?`);
    }
    return;
  }

  // Fallback
  michiHabla('No entendí bien. Puedes decir: "Quiero dos hamburguesas", "¿Cuánto es el total?" o "Elimina las papas".');
}

// ═══════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initMichi3D('michi-canvas');

  // Botón de micrófono si existe
  const btnMic = document.getElementById('btn-mic');
  if (btnMic) {
    btnMic.addEventListener('click', () => {
      iniciarReconocimiento((instruccion) => {
        procesarInstruccionVoz(instruccion);
      });
    });
  }
});
