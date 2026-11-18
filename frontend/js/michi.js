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
  mostrar:    true,
  vozURI:     ''
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
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.150.1/build/three.min.js';
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
    const anterior = michiGroup;
    michiGroup = buildMichiModel();
    michiGroup.position.copy(anterior.position);
    michiGroup.rotation.copy(anterior.rotation);
    michiScene.remove(anterior);
    michiScene.add(michiGroup);
    anterior.traverse(objeto => {
      objeto.geometry?.dispose();
      objeto.material?.dispose();
    });
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
  const respuesta = document.getElementById('michi-respuesta');
  if (respuesta) respuesta.textContent = texto;
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

  const voz = vozesDisponibles.find(v => v.voiceURI === MichiConfig.vozURI) || vozesDisponibles[0];
  if (voz) utterance.voice = voz;

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
    vozSynth?.cancel();
    actualizarBtnMic(true);
  };

  reconocimiento.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(r => r[0].transcript)
      .join('');

    // Mostrar texto reconocido
    const textoEl = document.getElementById('texto-reconocido');
    if (textoEl instanceof HTMLInputElement) textoEl.value = transcript;
    else if (textoEl) textoEl.textContent = transcript;

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

function normalizarConsulta(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function coincidenciasMichi(texto, productos) {
  const palabras = nombre => normalizarConsulta(nombre).split(' ')
    .filter(p => p && !['el', 'la', 'los', 'las'].includes(p))
    .map(p => /[aeiou]s$/.test(p) ? p.slice(0, -1) : p);
  const consulta = palabras(texto);
  if (consulta.length === 0) return [];
  const exactos = productos.filter(p => palabras(p.nombre).join(' ') === consulta.join(' '));
  return exactos.length ? exactos : productos.filter(p => {
    const nombre = palabras(p.nombre);
    return consulta.every(palabra => nombre.includes(palabra));
  });
}

async function procesarInstruccionVoz(instruccion) {
  const texto = normalizarConsulta(instruccion).replace(/^michi\s+/, '');
  if (!texto) return;
  const agregar = texto.match(/^(?:quiero|agrega|dame|pon)\s+(.+)/);
  if (agregar) {
    const numeros = { un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10 };
    const segmentos = agregar[1].split(/\s+y\s+(?=(?:un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\d+)\s)/);
    const pedido = [];
    for (const segmento of segmentos) {
      const [primera, ...resto] = segmento.split(' ');
      const tieneCantidad = /^\d+$/.test(primera) || Object.hasOwn(numeros, primera);
      const cantidad = tieneCantidad ? (numeros[primera] ?? Number(primera)) : 1;
      const producto = tieneCantidad ? resto.join(' ') : segmento;
      const opciones = coincidenciasMichi(producto, todosProductos);
      if (!Number.isSafeInteger(cantidad) || cantidad < 1 || cantidad > 99) {
        return michiHabla('Indica una cantidad entre 1 y 99 por producto.');
      }
      if (opciones.length !== 1) {
        return michiHabla(opciones.length
          ? `Encontré ${opciones.map(p => p.nombre).join(', ')}. Indica cuál quieres.`
          : `No encontré “${producto}” en el menú. Escribe o dicta el nombre del producto.`);
      }
      if (!opciones[0].disponible) return michiHabla(`${opciones[0].nombre} está agotado.`);
      pedido.push({ producto: opciones[0], cantidad });
    }
    pedido.forEach(({ producto, cantidad }) => Cart.add(producto, cantidad));
    renderCarritoItems();
    return michiHabla('Agregué los productos al carrito. Revísalos antes de confirmar tu pedido.');
  }

  const eliminar = texto.match(/^(?:elimina|quita|saca)\s+(.+)/);
  if (eliminar) {
    const opciones = coincidenciasMichi(eliminar[1], Cart.get());
    if (opciones.length !== 1) return michiHabla('Indica el nombre exacto del producto en tu carrito.');
    Cart.remove(opciones[0].id);
    renderCarritoItems();
    return michiHabla(`Quité ${opciones[0].nombre} de tu carrito.`);
  }

  const precio = texto.match(/(?:cuanto cuesta|precio de)\s+(.+)/);
  if (precio) {
    const opciones = coincidenciasMichi(precio[1], todosProductos);
    return michiHabla(opciones.length === 1
      ? `${opciones[0].nombre} cuesta ${Cart.fmt(opciones[0].precio)}.`
      : 'Indica el nombre exacto del producto para consultar su precio.');
  }

  if (texto.includes('estado') && texto.includes('pedido')) {
    if (!pedidoConfirmadoId) return michiHabla('Consulta tu número de pedido en la página de seguimiento.');
    try {
      const pedido = await api.get(`/pedidos/${pedidoConfirmadoId}`);
      return michiHabla(`El pedido ${pedido.numeroPedido} está ${pedido.estado.toLowerCase().replaceAll('_', ' ')}.`);
    } catch (error) {
      return michiHabla('No pude consultar el estado. Vuelve a intentarlo.');
    }
  }

  if (texto.includes('total')) {
    return michiHabla(`El total de tu carrito es ${Cart.fmt(Cart.total())} con IGV.`);
  }

  if (texto.includes('carrito')) {
    if (!document.getElementById('panel-carrito').classList.contains('open')) toggleCarrito();
    return michiHabla(Cart.count() ? 'Aquí tienes tu carrito.' : 'Tu carrito está vacío.');
  }

  const categoria = Array.from(document.querySelectorAll('.categoria-chip'))
    .find(chip => texto.endsWith(normalizarConsulta(chip.textContent)));
  if (categoria) {
    categoria.click();
    return michiHabla(`Mostrando ${categoria.textContent}.`);
  }

  michiHabla('Prueba con “quiero dos limonadas”, “muéstrame mi carrito” o “¿cuánto cuesta la limonada?”.');
}

// ═══════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initMichi3D('michi-canvas');

  const formMichi = document.getElementById('form-michi');
  formMichi?.addEventListener('submit', event => {
    event.preventDefault();
    procesarInstruccionVoz(document.getElementById('texto-reconocido').value);
  });

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
