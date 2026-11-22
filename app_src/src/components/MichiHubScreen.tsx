import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Edit3,
  Keyboard,
  Mic,
  MicOff,
  Palette,
  Play,
  Save,
  ShoppingBag,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Utensils,
  Sun,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { MICHI_GESTURES } from '../data/mishikoSeed';
import {
  Dish,
  DishModifier,
  FurColor,
  MichiConfig,
  MichiGesture,
  MichiOutfit,
} from '../types/mishiko';
import { DishImage } from './DishImage';

interface MichiHubScreenProps {
  dishes: Dish[];
  tableNumber: string;
  config: MichiConfig;
  initialSubView?: 'voz' | 'apariencia' | 'gestos';
  onUpdateConfig: (next: MichiConfig) => void;
  onApplyGestureToMenu: (gesture: MichiGesture) => void;
  onAddParsedItemsToCart: (
    items: { dish: Dish; quantity: number; modifiers: DishModifier[] }[],
  ) => void;
}

interface ParsedMatch {
  dish: Dish;
  quantity: number;
  modifiers: DishModifier[];
}

const FUR_OPTIONS: { color: FurColor; swatch: string; label: string }[] = [
  { color: 'Naranja', swatch: 'bg-gradient-to-br from-orange-500 to-amber-600', label: 'Michi Clásico (Negro / Naranja)' },
  { color: 'Blanco', swatch: 'bg-gradient-to-br from-white to-stone-200 border border-stone-300', label: 'Michita (Gata Blanca / Azul)' },
  { color: 'Gris', swatch: 'bg-gradient-to-br from-slate-400 to-slate-600', label: 'Michi Gris Carbón' },
  { color: 'Esmoquin', swatch: 'bg-gradient-to-br from-zinc-800 to-zinc-950', label: 'Michi Esmoquin Elegante' },
];

const OUTFIT_OPTIONS: { outfit: MichiOutfit; subtitle: string }[] = [
  { outfit: 'Corbatín', subtitle: 'Elegante' },
  { outfit: 'Delantal', subtitle: 'Maestro Chef' },
  { outfit: 'Sombrero', subtitle: 'Toque Gourmet' },
  { outfit: 'Campanilla', subtitle: 'Oro de Servicio' },
];

export const MichiHubScreen: React.FC<MichiHubScreenProps> = ({
  dishes,
  tableNumber,
  config,
  initialSubView = 'voz',
  onUpdateConfig,
  onApplyGestureToMenu,
  onAddParsedItemsToCart,
}) => {
  const [subView, setSubView] = useState<'voz' | 'apariencia' | 'gestos'>(
    initialSubView,
  );

  // Voice & NLP state
  const [isListening, setIsListening] = useState(false);
  const [secondsListening, setSecondsListening] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [showKeyboardInput, setShowKeyboardInput] = useState(false);
  type MichiPoseType = 'saludo' | 'anotado' | 'listo' | 'satisfecho' | 'curioso' | 'sorprendido' | 'risa';
  const [michiPose, setMichiPose] = useState<MichiPoseType>('saludo');
  const [isJumping, setIsJumping] = useState(false);
  const [activeRec, setActiveRec] = useState<any>(null);

  const [assistantReply, setAssistantReply] = useState<string>(
    `¡Hola! Soy ${config.name}, tu mesero virtual de MISHIKO 🐱. Tócame para interactuar o presiona el micrófono para decirme qué se te antoja ordenar.`
  );

  // Appearance local draft state
  const [draftConfig, setDraftConfig] = useState<MichiConfig>(config);
  const [savedToast, setSavedToast] = useState(false);

  // Gestures state
  const [gestureCategory, setGestureCategory] = useState<string>('Todas');
  const [selectedGesture, setSelectedGesture] = useState<MichiGesture>(
    () =>
      MICHI_GESTURES.find((g) => g.id === config.activeGestureId) ??
      MICHI_GESTURES[1],
  );
  const [isPlayingGesture, setIsPlayingGesture] = useState(false);

  useEffect(() => {
    setSubView(initialSubView);
  }, [initialSubView]);

  // Cronómetro solo cuando el micrófono está realmente escuchando
  useEffect(() => {
    if (!isListening) {
      setSecondsListening(0);
      return;
    }
    const id = window.setInterval(() => {
      setSecondsListening((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [isListening]);

  // Imagen del gato según género y pose (Talking Tom style con 7 expresiones)
  const isWhiteCat = config.furColor === 'Blanco';
  const michiImages: Record<'macho' | 'hembra', Record<MichiPoseType, string>> = {
    macho: {
      saludo:      './assets/michi/michi-macho-saludo.png',
      anotado:     './assets/michi/michi-macho-anotado.png',
      listo:       './assets/michi/michi-macho-listo.png',
      satisfecho:  './assets/michi/michi-macho-satisfecho.png',
      curioso:     './assets/michi/michi-macho-curioso.png',
      sorprendido: './assets/michi/michi-macho-sorprendido.png',
      risa:        './assets/michi/michi-macho-risa.png',
    },
    hembra: {
      saludo:      './assets/michi/michi-hembra-saludo.png',
      anotado:     './assets/michi/michi-hembra-anotado.png',
      listo:       './assets/michi/michi-hembra-listo.png',
      satisfecho:  './assets/michi/michi-hembra-satisfecho.png',
      curioso:     './assets/michi/michi-hembra-curioso.png',
      sorprendido: './assets/michi/michi-hembra-sorprendido.png',
      risa:        './assets/michi/michi-hembra-risa.png',
    }
  };

  const currentCatGender = isWhiteCat ? 'hembra' : 'macho';
  const currentCatImage = michiImages[currentCatGender][michiPose] || michiImages[currentCatGender].saludo;

  // Real client-side Spanish NLP parser matching dishes & modifiers from live menu
  const parsedMatches: ParsedMatch[] = useMemo(() => {
    if (!transcript) return [];
    const text = transcript.toLowerCase();
    const matches: ParsedMatch[] = [];
    const availableDishes = dishes.filter((d) => d.available);

    const extractQtyBefore = (keywords: string[]): number => {
      for (const kw of keywords) {
        const idx = text.indexOf(kw);
        if (idx !== -1) {
          const prefix = text.slice(Math.max(0, idx - 18), idx);
          if (/\b(dos|2)\b/.test(prefix)) return 2;
          if (/\b(tres|3)\b/.test(prefix)) return 3;
          if (/\b(cuatro|4)\b/.test(prefix)) return 4;
          return 1;
        }
      }
      return 0;
    };

    for (const dish of availableDishes) {
      const nameWords = dish.name
        .toLowerCase()
        .split(' ')
        .filter((w) => w.length > 3 && w !== 'michi' && w !== 'mishiko');
      let qty = 0;

      if (dish.id === 'dish-smash-doble' && /(hamburguesa|smash|burger)/.test(text)) {
        qty = extractQtyBefore(['hamburguesa', 'smash', 'burger']) || 1;
      } else if (dish.id === 'dish-limonada-hierbabuena' && /(limonada|hierbabuena)/.test(text)) {
        qty = extractQtyBefore(['limonada', 'hierbabuena']) || 1;
      } else if (dish.id === 'dish-ramen-criollo' && /ramen/.test(text)) {
        qty = extractQtyBefore(['ramen']) || 1;
      } else if (dish.id === 'dish-gyozas-cerdo' && /gyoza/.test(text)) {
        qty = extractQtyBefore(['gyoza']) || 1;
      } else if (dish.id === 'dish-pisco-dragon-sour' && /(pisco|sour|dragon)/.test(text)) {
        qty = extractQtyBefore(['pisco', 'sour', 'dragon']) || 1;
      } else if (dish.id === 'dish-papas-rusticas' && /papas/.test(text)) {
        qty = extractQtyBefore(['papas']) || 1;
      } else if (nameWords.some((w) => text.includes(w))) {
        qty = extractQtyBefore(nameWords) || 1;
      }

      if (qty > 0) {
        const mods = dish.modifiers.filter((m) => {
          const ml = m.label.toLowerCase();
          if (ml.includes('sin cebolla') && text.includes('sin cebolla')) return true;
          if (ml.includes('extra queso') && text.includes('extra queso')) return true;
          if (ml.includes('tocino') && text.includes('tocino')) return true;
          if (ml.includes('muy fría') && (text.includes('fría') || text.includes('fria') || text.includes('hielo')))
            return true;
          if (ml.includes('sin azúcar') && (text.includes('sin azúcar') || text.includes('sin azucar')))
            return true;
          return false;
        });
        matches.push({ dish, quantity: qty, modifiers: mods });
      }
    }

    return matches;
  }, [transcript, dishes]);

  const parsedTotal = parsedMatches.reduce((sum, m) => {
    const delta = m.modifiers.reduce((s, mod) => s + mod.priceDelta, 0);
    return sum + (m.dish.price + delta) * m.quantity;
  }, 0);

  // Síntesis de voz con soporte para género (tono dulce para gata)
  const speakLine = (line: string, rate = 1.0) => {
    if (!config.voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(line);
      utterance.lang = 'es-PE';
      utterance.rate = rate;
      utterance.pitch = isWhiteCat ? 1.3 : 1.05;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignorar errores en navegadores restrictivos
    }
  };

  // Motor NLU con Guardrails: solo temas gastronómicos y de la web MISHIKO
  const processUserInput = (rawText: string) => {
    const text = rawText.toLowerCase().trim();
    if (!text) return;

    // 1. Guardrail: temas fuera del restaurante (fútbol, política, noticias, etc.)
    const fueraDeDominio = /(futbol|fútbol|partido|gol|alianza|cristal|messi|ronaldo|politica|política|presidente|elecciones|noticia|noticias|guerra|clase|tarea|examen|apuesta)/i;
    if (fueraDeDominio.test(text)) {
      const resp = `¡Miau! Solo soy tu mesero virtual de MISHIKO 🐱. No sé de fútbol ni noticias externas, pero con mucho gusto te recomiendo los mejores platillos, bebidas según el clima o te llevo el pedido a cocina. ¿Qué se te antoja ordenar?`;
      setAssistantReply(resp);
      setMichiPose('saludo');
      speakLine(resp);
      return;
    }

    // 2. Recomendación de bebidas según el clima
    if (/(clima|calor|frío|frio|sed|bebida|bebidas|refresco|tomar|coctel|cóctel|trago)/i.test(text)) {
      const resp = `¡Para el calor te recomiendo nuestra Limonada de Hierbabuena Frozen bien fría o el Pisco Dragon Sour de autor! Si es de noche o hace frío, el Té Verde Jazmín o un Ramen Criollo caliente te sentarán genial ☀️🍹`;
      setAssistantReply(resp);
      setMichiPose('saludo');
      speakLine(resp);
      return;
    }

    // 3. Recomendaciones generales / sommelier
    if (/(recomiend|sugi|especial|popular|favorito|bueno|rico|carta|chef)/i.test(text)) {
      const resp = `¡Nuestra gran recomendación es la Michi Smash Burger Doble y el Ramen Criollo Fusión! De entrada unas Gyozas de Cerdo al vapor con salsa ponzu. ¡Son lo más pedido de la casa! 🍽️`;
      setAssistantReply(resp);
      setMichiPose('saludo');
      speakLine(resp);
      return;
    }

    // 4. Tomar y llevar el pedido
    if (/(quiero|dame|agrega|pon|traeme|trae|comprar|ordenar|pido|lleva|comanda)/i.test(text)) {
      if (parsedMatches.length > 0) {
        onAddParsedItemsToCart(parsedMatches);
        const nombres = parsedMatches.map(m => `${m.quantity}x ${m.dish.name}`).join(', ');
        const resp = `¡Anotado! He llevado ${nombres} a tu comanda para Mesa #${tableNumber} 👍 ¿Deseas pedir algo más?`;
        setAssistantReply(resp);
        setMichiPose('anotado');
        speakLine(resp);
        return;
      }
    }

    // 5. Estado de la comida
    if (/(estado|comida|ya salio|listo|cuanto falta|demora|cocina)/i.test(text)) {
      const resp = `¡Tu pedido está en cocina preparándose a fuego vivo! En breve te lo llevo a tu mesa bien caliente 🍽️`;
      setAssistantReply(resp);
      setMichiPose('listo');
      speakLine(resp);
      return;
    }

    // 6. Saludo
    if (/(hola|buenos dias|buenas tardes|buenas noches|michi|michita|que tal)/i.test(text)) {
      const resp = `¡Hola! Bienvenido a MISHIKO. Soy ${config.name}, tu mesero virtual. ¿Qué delicia se te antoja disfrutar hoy? 🐱`;
      setAssistantReply(resp);
      setMichiPose('saludo');
      speakLine(resp);
      return;
    }

    // Default con platillos detectados o sugerencia
    if (parsedMatches.length > 0) {
      const nombres = parsedMatches.map(m => `${m.quantity}x ${m.dish.name}`).join(', ');
      const resp = `Detecté en tu voz: ${nombres}. Puedes pulsar "Llevar a mi pedido" para enviarlo directamente a la comanda 😺`;
      setAssistantReply(resp);
      setMichiPose('anotado');
      speakLine(resp);
    } else {
      const resp = `Entendido. Puedes pedirme cualquier platillo del menú, bebidas según el clima o decirme "recomiéndame algo" 😺`;
      setAssistantReply(resp);
      setMichiPose('saludo');
      speakLine(resp);
    }
  };

  // Control real del micrófono
  const startListening = () => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      alert('Tu navegador no soporta entrada de voz por micrófono. Te recomendamos Google Chrome.');
      return;
    }

    try {
      if (activeRec) {
        try { activeRec.stop(); } catch (_) {}
      }

      const rec = new SpeechRec();
      rec.lang = 'es-PE';
      rec.continuous = false;
      rec.interimResults = true;

      rec.onstart = () => {
        setIsListening(true);
        setSecondsListening(0);
        setTranscript('');
      };

      rec.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        if (text) {
          setTranscript(text);
          if (event.results[0].isFinal) {
            processUserInput(text);
          }
        }
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.start();
      setActiveRec(rec);
    } catch {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (activeRec) {
      try { activeRec.stop(); } catch (_) {}
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  // Interacción táctil estilo Talking Tom al tocar el gato con 7 expresiones
  const handleTouchMichi = () => {
    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 600);

    const interacciones: { pose: MichiPoseType; texto: string }[] = [
      {
        pose: 'risa',
        texto: `¡Jajaja miau! ¡Eso me hace cosquillas en las orejitas y los bigotes! 😹 ¿Listo para ordenar algo rico en Mesa #${tableNumber}?`,
      },
      {
        pose: 'satisfecho',
        texto: `¡Ufff, qué delicia de carta! Me sobo la pancita solo de pensar en el Wagyu y el Ramen Tonkotsu 😋. ¿Te provoco uno?`,
      },
      {
        pose: 'curioso',
        texto: `¿Qué plato se te antoja hoy? Soy todo oídos 🐾. Dime "bebidas según el clima" o pregúntame por las especialidades.`,
      },
      {
        pose: 'sorprendido',
        texto: `¡Waaah! ¡La cocina está a máxima marcha sacando pedidos en tiempo récord! 🔥`,
      },
      {
        pose: 'saludo',
        texto: `¡Miau! Aquí estoy atento a tu servicio. Toca el micrófono rojo o dime tu comanda cuando gustes 🐱`,
      },
      {
        pose: 'listo',
        texto: `¡Tin tin! Servicio listo para llevar los mejores sabores directo a tu mesa 🍽️`,
      },
    ];

    const elegida = interacciones[Math.floor(Math.random() * interacciones.length)];
    setAssistantReply(elegida.texto);
    setMichiPose(elegida.pose);
    speakLine(elegida.texto);
  };

  const handleSaveAppearance = () => {
    onUpdateConfig(draftConfig);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handlePlayGesture = (gesture: MichiGesture) => {
    setSelectedGesture(gesture);
    setIsPlayingGesture(true);

    // Mapeo dinámico de gesto a pose visual
    let nextPose: MichiPoseType = 'saludo';
    if (gesture.id === 'satisfecho' || gesture.id === 'celebracion') nextPose = 'satisfecho';
    else if (gesture.id === 'curioso' || gesture.id === 'pensando' || gesture.id === 'sommelier') nextPose = 'curioso';
    else if (gesture.id === 'sorprendido') nextPose = 'sorprendido';
    else if (gesture.id === 'risa') nextPose = 'risa';
    else if (gesture.id === 'escuchando' || gesture.id === 'confirmado') nextPose = 'anotado';
    else if (gesture.id === 'cocina' || gesture.id === 'lista') nextPose = 'listo';
    setMichiPose(nextPose);

    if (config.autoSpeak || config.voiceEnabled) {
      speakLine(gesture.speechLine, config.gestureSpeed);
    }
    setTimeout(() => setIsPlayingGesture(false), 1200 / config.gestureSpeed);
  };

  const filteredGestures = useMemo(() => {
    if (gestureCategory === 'Todas') return MICHI_GESTURES;
    return MICHI_GESTURES.filter((g) => g.category === gestureCategory);
  }, [gestureCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28 lg:pb-10 space-y-6">
      {/* Sub-navegación entre vistas de Michi */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-stone-500 dark:text-stone-400">
            Mesero Virtual Inteligente · Mesa #{tableNumber}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 mt-0.5">
            {config.name} AI Hub
          </h1>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-stone-200/70 dark:bg-stone-800/80">
          <button
            type="button"
            onClick={() => setSubView('voz')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors min-h-[40px] whitespace-nowrap ${
              subView === 'voz'
                ? 'bg-white dark:bg-stone-900 text-[#9E3304] dark:text-amber-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-300'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Voz en Vivo</span>
          </button>
          <button
            type="button"
            onClick={() => setSubView('apariencia')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors min-h-[40px] whitespace-nowrap ${
              subView === 'apariencia'
                ? 'bg-white dark:bg-stone-900 text-[#9E3304] dark:text-amber-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-300'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Apariencia</span>
          </button>
          <button
            type="button"
            onClick={() => setSubView('gestos')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors min-h-[40px] whitespace-nowrap ${
              subView === 'gestos'
                ? 'bg-white dark:bg-stone-900 text-[#9E3304] dark:text-amber-400 shadow-sm'
                : 'text-stone-600 dark:text-stone-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Gestos & Lab</span>
          </button>
        </div>
      </div>

      {/* VISTA 1: VOZ EN VIVO INTERACTIVA (TALKING TOM STYLE) */}
      {subView === 'voz' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Escenario Interactivo de Michi */}
          <div className="lg:col-span-6 space-y-5">
            {/* Personaje Interactivo Central (Talking Tom Style) */}
            <div className="rounded-3xl bg-gradient-to-b from-amber-500/10 via-white to-stone-50 dark:from-amber-950/20 dark:via-[#191614] dark:to-[#12100E] border border-amber-500/20 dark:border-stone-800 p-6 text-center relative overflow-hidden shadow-sm">
              {/* Header con botón de voz ON/OFF */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-xs font-bold text-[#9E3304] dark:text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>En Servicio · Mesa #{tableNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateConfig({ ...config, voiceEnabled: !config.voiceEnabled })}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                    config.voiceEnabled
                      ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-[#9E3304] dark:text-amber-300'
                      : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500'
                  }`}
                >
                  {config.voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>Voz {config.voiceEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {/* Burbuja de diálogo grande de Michi */}
              <div className="relative mx-auto max-w-md my-3 p-4 rounded-2xl bg-white dark:bg-stone-800 border-2 border-amber-400 dark:border-amber-600/60 shadow-md text-stone-900 dark:text-stone-100 text-sm sm:text-base font-medium leading-relaxed">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#9E3304] dark:text-amber-400 mb-1 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>{config.name} dice:</span>
                </div>
                “{assistantReply}”
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-stone-800 border-b-2 border-r-2 border-amber-400 dark:border-amber-600/60 rotate-45" />
              </div>

              {/* Escenario del Personaje (Tócame para interactuar) */}
              <div
                onClick={handleTouchMichi}
                className={`cursor-pointer my-4 inline-block transition-transform duration-300 select-none ${
                  isJumping ? 'scale-110 -translate-y-4' : 'hover:scale-105 active:scale-95'
                }`}
                title="¡Tócame para interactuar como Talking Tom!"
              >
                <div className="relative w-52 h-52 sm:w-64 sm:h-64 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-amber-400/20 to-transparent blur-xl pointer-events-none" />
                  <img
                    src={currentCatImage}
                    alt={config.name}
                    className="w-full h-full object-contain filter drop-shadow-xl select-none"
                    draggable={false}
                  />
                </div>
                <div className="text-xs font-semibold text-stone-400 dark:text-stone-500 mt-1">
                  👆 Toca a {config.name} para saludar o interactuar
                </div>
              </div>

              {/* Botón Principal de Micrófono para Hablar */}
              <div className="pt-2 max-w-sm mx-auto space-y-3">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold text-white shadow-lg transition-all min-h-[52px] ${
                    isListening
                      ? 'bg-red-600 hover:bg-red-700 ring-4 ring-red-400/40 animate-pulse'
                      : 'bg-[#9E3304] hover:bg-[#822802] ring-2 ring-amber-500/30'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-5 h-5 animate-spin" />
                      <span>🔴 Escuchando tu voz... (Toca para enviar)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span>🎤 Toca para hablar con {config.name}</span>
                    </>
                  )}
                </button>

                {isListening && (
                  <div className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
                    Capturando audio en vivo · 00:{String(secondsListening).padStart(2, '0')} seg
                  </div>
                )}
              </div>
            </div>

            {/* Sugerencias Rápidas de Conversación */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 space-y-3">
              <div className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Preguntas y Acciones Rápidas
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => processUserInput('bebidas según el clima')}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-xs font-semibold text-[#9E3304] dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                >
                  ☀️ Bebidas según el clima
                </button>

                <button
                  type="button"
                  onClick={() => processUserInput('recomiéndame algo')}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-200"
                >
                  ⭐ ¿Qué me recomiendas?
                </button>

                <button
                  type="button"
                  onClick={() => processUserInput('cuál es el estado de mi pedido')}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-200"
                >
                  📍 ¿Cómo va mi comida?
                </button>

                <button
                  type="button"
                  onClick={() => processUserInput('noticias de futbol de hoy')}
                  className="px-3 py-1.5 rounded-lg border border-dashed border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-400 hover:text-stone-600"
                  title="Prueba el filtro de dominio de Michi"
                >
                  ⚽ ¿Quién ganó el partido? (Prueba filtro)
                </button>
              </div>

              {/* Botón de texto alternativo */}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                <span className="text-stone-500">¿Prefieres escribir en vez de hablar?</span>
                <button
                  type="button"
                  onClick={() => setShowKeyboardInput((v) => !v)}
                  className="text-[#9E3304] dark:text-amber-400 font-semibold hover:underline"
                >
                  {showKeyboardInput ? 'Cerrar teclado' : 'Escribir con teclado'}
                </button>
              </div>

              {showKeyboardInput && (
                <div className="pt-2 flex gap-2">
                  <input
                    type="text"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') processUserInput(transcript);
                    }}
                    placeholder="Escribe: dos hamburguesas y una limonada..."
                    className="flex-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => processUserInput(transcript)}
                    className="px-4 py-2.5 rounded-xl bg-[#9E3304] text-white text-xs font-semibold"
                  >
                    Enviar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Interpretación del Pedido y Carrito */}
          <div className="lg:col-span-6 space-y-5">
            {/* Tarjeta de Comanda Detectada */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-stone-50">
                    Comanda Reconocida por {config.name}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Mesa #{tableNumber} · Carta sincronizada en vivo
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-[#9E3304] dark:text-amber-300 tabular-nums">
                  {parsedMatches.length} detectados
                </span>
              </div>

              {/* Si hay texto reconocido */}
              {transcript && (
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800 text-xs text-stone-700 dark:text-stone-300">
                  <span className="font-semibold text-stone-500">Lo que escuché:</span> “{transcript}”
                </div>
              )}

              {/* Lista de platillos parseados */}
              {parsedMatches.length === 0 ? (
                <div className="py-12 text-center rounded-xl border-2 border-dashed border-stone-200 dark:border-stone-800 p-6 space-y-2">
                  <Utensils className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
                  <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
                    Tu bandeja de voz está vacía
                  </p>
                  <p className="text-xs text-stone-400 max-w-xs mx-auto">
                    Presiona el micrófono y pide algo como: <br />
                    <span className="text-[#9E3304] dark:text-amber-400 font-medium">“Michi, quiero dos ramen y una limonada bien fría”</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                    {parsedMatches.map((m, idx) => {
                      const modCost = m.modifiers.reduce((s, mod) => s + mod.priceDelta, 0);
                      const unit = m.dish.price + modCost;
                      return (
                        <li key={idx} className="py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={m.dish.image}
                              alt={m.dish.name}
                              className="w-12 h-12 rounded-xl object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                                {m.quantity}× {m.dish.name}
                              </div>
                              {m.modifiers.length > 0 && (
                                <div className="text-[11px] text-stone-500 truncate">
                                  {m.modifiers.map((mod) => mod.label).join(' · ')}
                                </div>
                              )}
                              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                {m.dish.station}
                              </div>
                            </div>
                          </div>

                          <span className="text-xs font-bold tabular-nums text-stone-900 dark:text-stone-100 shrink-0">
                            S/ {(unit * m.quantity).toFixed(2)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-sm">
                    <span className="font-medium text-stone-500">Subtotal detectado:</span>
                    <span className="text-base font-extrabold text-[#9E3304] dark:text-amber-400 tabular-nums">
                      S/ {parsedTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Botón de acción: Enviar al Carrito */}
                  <button
                    type="button"
                    onClick={() => {
                      onAddParsedItemsToCart(parsedMatches);
                      const msg = `¡Anotado! He llevado ${parsedMatches.length} platillos a tu comanda para Mesa #${tableNumber} 🍽️`;
                      setAssistantReply(msg);
                      setMichiPose('anotado');
                      speakLine(msg);
                      setTranscript('');
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#9E3304] hover:bg-[#822802] text-white text-xs font-bold shadow-md transition-colors min-h-[46px]"
                  >
                    <span>Llevar estos platillos a mi Pedido</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: APARIENCIA */}
      {subView === 'apariencia' && (() => {
        const draftColorKey = (draftConfig.furColor || 'Naranja').toLowerCase();
        const draftOutfitKey = (draftConfig.outfit || 'Corbatín')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        const draftSpriteImg = `./assets/michi/michi-${draftColorKey}-${draftOutfitKey}.png`;

        return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 flex flex-col items-center text-center space-y-4">
            <div className="w-52 h-52 mx-auto flex items-center justify-center p-2 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 shadow-inner">
              <img
                src={draftSpriteImg}
                alt={draftConfig.name}
                className="w-full h-full object-contain filter drop-shadow-md transition-transform hover:scale-105"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50">
                {draftConfig.name}
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                {draftConfig.furColor} · Atuendo {draftConfig.outfit}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveAppearance}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#9E3304] hover:bg-[#822802] text-white text-xs font-bold shadow-md transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Apariencia</span>
            </button>
            {savedToast && <div className="text-xs font-bold text-emerald-600">✓ Apariencia guardada correctamente</div>}
          </div>

          <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 space-y-6">
            <div>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Color y Personaje
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {FUR_OPTIONS.map((opt) => (
                  <button
                    key={opt.color}
                    type="button"
                    onClick={() => setDraftConfig({ ...draftConfig, furColor: opt.color, name: opt.color === 'Blanco' ? 'Michita' : 'Michi' })}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                      draftConfig.furColor === opt.color
                        ? 'border-[#9E3304] bg-amber-50/50 dark:bg-amber-950/20 text-[#9E3304] dark:text-amber-300 font-bold'
                        : 'border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full ${opt.swatch}`} />
                    <span className="text-xs">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Atuendo de Servicio
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                {OUTFIT_OPTIONS.map((opt) => (
                  <button
                    key={opt.outfit}
                    type="button"
                    onClick={() => setDraftConfig({ ...draftConfig, outfit: opt.outfit })}
                    className={`p-3 rounded-xl border text-center transition-colors ${
                      draftConfig.outfit === opt.outfit
                        ? 'border-[#9E3304] bg-amber-50/50 dark:bg-amber-950/20 text-[#9E3304] dark:text-amber-300 font-bold'
                        : 'border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <div className="text-xs">{opt.outfit}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">{opt.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ); })()}

      {/* VISTA 3: GESTOS & LAB */}
      {subView === 'gestos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 flex flex-col items-center text-center space-y-4">
            <div className="w-48 h-48 mx-auto flex items-center justify-center">
              <img
                src={currentCatImage}
                alt={selectedGesture.title}
                className={`w-full h-full object-contain filter drop-shadow-md transition-transform ${
                  isPlayingGesture ? 'scale-110' : ''
                }`}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">
                {selectedGesture.title}
              </h2>
              <p className="text-xs text-stone-500 mt-1">{selectedGesture.description}</p>
            </div>
            <button
              type="button"
              onClick={() => handlePlayGesture(selectedGesture)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#9E3304] text-white text-xs font-bold"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Reproducir Gesto</span>
            </button>
          </div>

          <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 space-y-4">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Catálogo de 10 Gestos de Michi
            </h3>
            <ul className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredGestures.map((g) => (
                <li key={g.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-stone-100">{g.title}</div>
                    <div className="text-[11px] text-stone-500">{g.speechLine}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePlayGesture(g)}
                    className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-[#9E3304] hover:bg-amber-100"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
