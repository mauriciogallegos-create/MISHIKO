/**
 * michi-ai.js — Integración con sentence-transformers/all-MiniLM-L6-v2
 * Implementa comprensión semántica de pedidos usando embeddings de HuggingFace.
 * Requerimiento del profesor: usar sentence-transformers/all-MiniLM-L6-v2
 *
 * Estrategia: @xenova/transformers (WASM en browser) — sin API key, sin backend.
 * El modelo se descarga de HuggingFace Hub (~25 MB) la primera vez, luego se cachea.
 */

// ═══════════════════════════════════════════════════════════
// CONSTANTES Y FRASES DE REFERENCIA PARA CLASIFICACIÓN DE INTENCIÓN
// ═══════════════════════════════════════════════════════════
const INTENT_EXAMPLES = {
  ORDER: [
    'quiero pedir', 'dame', 'agrega al carrito', 'quiero un', 'pon en mi pedido',
    'me traes', 'me das', 'quiero comer', 'para mí', 'tráeme', 'una orden de',
    'dos porciones', 'quiero dos', 'agrega tres', 'ponme', 'quisiera',
  ],
  RECOMMEND: [
    'qué me recomiendas', 'cuál está bueno', 'qué es popular', 'qué es lo mejor',
    'qué me sugieres', 'qué está rico', 'cuál es el más pedido', 'recomiéndame',
    'cuál es la especialidad', 'qué está de moda', 'qué es especial', 'sugiéreme',
  ],
  PRICE: [
    'cuánto cuesta', 'precio de', 'cuánto vale', 'a cuánto está',
    'qué precio tiene', 'cuánto es', 'cuánto cobras por', 'precio del',
  ],
  STATUS: [
    'estado de mi pedido', 'cómo va mi pedido', 'cuándo llega',
    'ya salió', 'está listo mi pedido', 'en qué está', 'cuánto falta',
    'ya lo están preparando', 'está en cocina',
  ],
  CART: [
    'muéstrame el carrito', 'ver mi carrito', 'qué tengo en mi carrito',
    'cuánto llevas', 'total del carrito', 'qué pedí', 'mi orden',
  ],
  HELP: [
    'ayuda', 'qué puedes hacer', 'para qué sirves', 'cómo funciona',
    'qué comandos tienes', 'cómo te uso', 'qué haces', 'qué sabes hacer',
  ],
};

// ═══════════════════════════════════════════════════════════
// ESTADO DEL MODELO
// ═══════════════════════════════════════════════════════════
let _pipeline = null;
let _loadingPromise = null;
let _modelReady = false;

/**
 * Carga el modelo all-MiniLM-L6-v2 vía @xenova/transformers (WASM).
 * Se cachea en IndexedDB del navegador tras la primera descarga.
 * @returns {Promise<Function>} pipeline de feature-extraction
 */
async function cargarModeloMiniLM() {
  if (_pipeline) return _pipeline;
  if (_loadingPromise) return _loadingPromise;

  _loadingPromise = (async () => {
    try {
      // Importar @xenova/transformers desde CDN de jsDelivr
      const { pipeline, env } = await import(
        'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js'
      );

      // Configurar para usar WASM local (sin servidor backend)
      env.allowRemoteModels = true;
      env.useBrowserCache = true;

      console.log('[MichiAI] Cargando sentence-transformers/all-MiniLM-L6-v2...');
      _pipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',  // espejo oficial de HuggingFace para Xenova/transformers
        { quantized: true }           // versión cuantizada (~25 MB vs 90 MB)
      );
      _modelReady = true;
      console.log('[MichiAI] Modelo all-MiniLM-L6-v2 listo ✓');
      return _pipeline;
    } catch (err) {
      console.error('[MichiAI] Error cargando modelo:', err);
      _loadingPromise = null;
      throw err;
    }
  })();

  return _loadingPromise;
}

/**
 * Genera embedding de 384 dimensiones para un texto dado.
 * @param {string} texto
 * @returns {Promise<Float32Array>} vector de embeddings
 */
async function getEmbedding(texto) {
  const extractor = await cargarModeloMiniLM();
  const output = await extractor(texto, { pooling: 'mean', normalize: true });
  return output.data; // Float32Array[384]
}

/**
 * Calcula similitud coseno entre dos vectores.
 * @param {Float32Array|number[]} a
 * @param {Float32Array|number[]} b
 * @returns {number} similitud entre -1 y 1 (1 = idénticos)
 */
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Clasifica la intención del usuario comparando con frases de referencia.
 * @param {string} texto — texto normalizado del usuario
 * @returns {Promise<{intencion: string, confianza: number}>}
 */
async function clasificarIntencion(texto) {
  try {
    const embTexto = await getEmbedding(texto);

    let mejorIntencion = 'HELP';
    let mejorSim = -1;

    for (const [intencion, ejemplos] of Object.entries(INTENT_EXAMPLES)) {
      for (const ejemplo of ejemplos) {
        const embEjemplo = await getEmbedding(ejemplo);
        const sim = cosineSimilarity(embTexto, embEjemplo);
        if (sim > mejorSim) {
          mejorSim = sim;
          mejorIntencion = intencion;
        }
      }
    }

    console.log(`[MichiAI] Intención: ${mejorIntencion} (sim=${mejorSim.toFixed(3)})`);
    return { intencion: mejorIntencion, confianza: mejorSim };
  } catch (err) {
    console.warn('[MichiAI] Fallback a reglas (modelo no disponible):', err.message);
    return clasificarPorReglas(texto);
  }
}

/**
 * Fallback: clasificación por palabras clave simples (sin IA).
 * Se usa si el modelo no cargó o hay error de red.
 */
function clasificarPorReglas(texto) {
  const t = texto.toLowerCase();
  if (/quiero|dame|agrega|pon|tráeme|quisiera|pido|orden/.test(t)) return { intencion: 'ORDER',   confianza: 0.8 };
  if (/recomienda|sugi|popular|mejor|especial/.test(t))             return { intencion: 'RECOMMEND', confianza: 0.8 };
  if (/cuesta|precio|vale|cobras/.test(t))                          return { intencion: 'PRICE',   confianza: 0.8 };
  if (/estado|pedido|cómo va|cuánto falta/.test(t))                 return { intencion: 'STATUS',  confianza: 0.8 };
  if (/carrito|llevas|total/.test(t))                               return { intencion: 'CART',    confianza: 0.8 };
  return { intencion: 'HELP', confianza: 0.5 };
}

/**
 * Encuentra el producto del menú más similar semánticamente al texto del usuario.
 * @param {string} query — lo que dijo el usuario
 * @param {Array<{nombre: string, descripcion?: string}>} productos
 * @returns {Promise<{producto: object, similitud: number}|null>}
 */
async function encontrarProductoMasSimilar(query, productos) {
  if (!productos || productos.length === 0) return null;

  try {
    const embQuery = await getEmbedding(query);
    let mejorProducto = null;
    let mejorSim = -1;

    for (const prod of productos) {
      // Comparar contra nombre + descripción para mejor recall
      const textoProd = `${prod.nombre} ${prod.descripcion || ''}`.trim();
      const embProd = await getEmbedding(textoProd);
      const sim = cosineSimilarity(embQuery, embProd);
      if (sim > mejorSim) {
        mejorSim = sim;
        mejorProducto = prod;
      }
    }

    console.log(`[MichiAI] Mejor match: "${mejorProducto?.nombre}" sim=${mejorSim.toFixed(3)}`);
    return { producto: mejorProducto, similitud: mejorSim };
  } catch (err) {
    console.warn('[MichiAI] Fallback a búsqueda por texto:', err.message);
    return null;
  }
}

/**
 * Obtiene las top-N recomendaciones del menú por similitud semántica.
 * @param {string} query
 * @param {Array} productos
 * @param {number} topN
 * @returns {Promise<Array<{producto, similitud}>>}
 */
async function obtenerRecomendaciones(query, productos, topN = 3) {
  if (!productos || productos.length === 0) return [];

  try {
    const embQuery = await getEmbedding(query);
    const scores = [];

    for (const prod of productos) {
      if (!prod.disponible) continue;
      const textoProd = `${prod.nombre} ${prod.descripcion || ''}`.trim();
      const embProd = await getEmbedding(textoProd);
      scores.push({ producto: prod, similitud: cosineSimilarity(embQuery, embProd) });
    }

    scores.sort((a, b) => b.similitud - a.similitud);
    return scores.slice(0, topN);
  } catch (err) {
    // Fallback: devolver primeros N disponibles
    return productos.filter(p => p.disponible).slice(0, topN).map(p => ({ producto: p, similitud: 0.5 }));
  }
}

// Exponer funciones globalmente para uso desde michi.js
window.MichiAI = {
  cargarModelo: cargarModeloMiniLM,
  getEmbedding,
  cosineSimilarity,
  clasificarIntencion,
  encontrarProductoMasSimilar,
  obtenerRecomendaciones,
  estaListo: () => _modelReady,
};
