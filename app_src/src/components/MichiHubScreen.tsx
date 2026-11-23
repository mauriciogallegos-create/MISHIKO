import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChefHat,
  Flame,
  Hand,
  Heart,
  Keyboard,
  Mic,
  MicOff,
  Palette,
  Play,
  RotateCcw,
  Save,
  ShoppingBag,
  Sparkles,
  Sun,
  Utensils,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { MICHI_GESTURES } from '../data/mishikoSeed';
import {
  Dish,
  DishModifier,
  FurColor,
  KitchenOrder,
  MichiConfig,
  MichiGender,
  MichiGesture,
  MichiOutfit,
} from '../types/mishiko';
import { DishImage } from './DishImage';

interface MichiHubScreenProps {
  dishes: Dish[];
  tableNumber: string;
  config: MichiConfig;
  initialSubView?: 'voz' | 'apariencia' | 'gestos';
  activeOrder?: KitchenOrder;
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

interface ChatMessage {
  id: string;
  sender: 'user' | 'michi';
  text: string;
  time: string;
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
  activeOrder,
  onUpdateConfig,
  onApplyGestureToMenu,
  onAddParsedItemsToCart,
}) => {
  const [subView, setSubView] = useState<'voz' | 'apariencia' | 'gestos'>(
    initialSubView,
  );

  // Género activo: prioriza config.gender o infiere por color blanco
  const catGender: MichiGender = config.gender || (config.furColor === 'Blanco' ? 'hembra' : 'macho');

  // Voice & NLP state
  const [isListening, setIsListening] = useState(false);
  const [secondsListening, setSecondsListening] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [showKeyboardInput, setShowKeyboardInput] = useState(false);
  type MichiPoseType = 'saludo' | 'anotado' | 'listo' | 'satisfecho' | 'curioso' | 'sorprendido' | 'risa';
  const [michiPose, setMichiPose] = useState<MichiPoseType>('saludo');
  const [isJumping, setIsJumping] = useState(false);
  const [activeRec, setActiveRec] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    setIsSpeaking(false);
  };

  // Voces del sistema
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');

  // Historial de conversación para que lo que hable el usuario SE QUEDE en pantalla
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'michi',
      text: catGender === 'hembra'
        ? `¡Hola! Soy ${config.name}, tu mesera virtual de MISHIKO 🐾. Estoy lista para atenderte en Mesa #${tableNumber}. Pregúntame qué comida está lista o qué se te antoja disfrutar hoy.`
        : `¡Hola! Soy ${config.name}, tu mesero virtual de MISHIKO 🐱. Tócame para interactuar o habla por el micrófono para pedir o consultar el estado de tu comanda en Mesa #${tableNumber}.`,
      time: 'Ahora',
    },
  ]);

  const [assistantReply, setAssistantReply] = useState<string>(
    chatMessages[0].text,
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

  // Cargar voces en español del navegador
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const updateVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const spanish = allVoices.filter((v) => v.lang.toLowerCase().startsWith('es'));
      setSystemVoices(spanish.length > 0 ? spanish : allVoices);
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  useEffect(() => {
    setSubView(initialSubView);
  }, [initialSubView]);

  // Cronómetro durante la captura de audio
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
    },
  };

  const currentCatImage = michiImages[catGender][michiPose] || michiImages[catGender].saludo;

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

  // SFX Web Audio API: Sonidos de campanilla y efectos para Michi (100% gratuito)
  const playNyanSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1150, audioCtx.currentTime + 0.12);
      osc.frequency.exponentialRampToValueAtTime(820, audioCtx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.28);
    } catch (_) {}
  };

  // Síntesis de voz con soporte para estilos Anime y voces naturales gratis
  const speakLine = (line: string, customRate?: number, overrideStyle?: MichiVoiceType) => {
    if (!config.voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(line);
      utterance.lang = 'es-PE';

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      // Asignar tono y timbre exacto según el perfil
      const voiceStyle = overrideStyle || config.voiceType || (catGender === 'hembra' ? 'dulce' : 'energico');
      let chosenPitch = 1.0;
      let chosenRate = customRate || config.voiceRate || 1.0;

      if (voiceStyle === 'anime-kawaii') {
        playNyanSound();
        chosenPitch = 1.48; // Agudo anime waifu/neko
        chosenRate = 1.12;
      } else if (voiceStyle === 'anime-shonen') {
        chosenPitch = 1.15; // Shonen culinario enérgico
        chosenRate = 1.15;
      } else if (voiceStyle === 'chibi') {
        playNyanSound();
        chosenPitch = 1.65; // Chibi súper tierno
        chosenRate = 1.18;
      } else if (voiceStyle === 'tom') {
        chosenPitch = 1.35; // Talking Tom divertido
        chosenRate = 1.08;
      } else if (voiceStyle === 'dulce' || catGender === 'hembra') {
        chosenPitch = 1.25; // Michita: dulce y alegre
        chosenRate = 1.0;
      } else {
        chosenPitch = 1.05; // Michi: varonil y claro
        chosenRate = 1.0;
      }

      utterance.pitch = chosenPitch;
      utterance.rate = chosenRate;

      // Si el usuario seleccionó una voz específica del navegador
      if (selectedVoiceName && systemVoices.length > 0) {
        const found = systemVoices.find((v) => v.name === selectedVoiceName);
        if (found) utterance.voice = found;
      } else if (systemVoices.length > 0) {
        // Asignación inteligente de voz según género
        if (catGender === 'hembra' || voiceStyle === 'dulce' || voiceStyle === 'anime-kawaii' || voiceStyle === 'chibi') {
          const female = systemVoices.find((v) =>
            /(salma|dalia|sabina|helena|laura|paulina|monica|paloma|elena|carmen|marta|conchita|lucia|female|mujer|maria)/i.test(v.name) && v.lang.startsWith('es'),
          ) || systemVoices.find((v) => /(female|mujer)/i.test(v.name))
            || systemVoices.find((v) => v.lang.startsWith('es'));
          if (female) utterance.voice = female;
        } else {
          const male = systemVoices.find((v) =>
            /(jorge|alvaro|raul|pablo|enrique|diego|carlos|pedro|mateo|male|hombre)/i.test(v.name) && v.lang.startsWith('es'),
          ) || systemVoices.find((v) => /(male|hombre)/i.test(v.name))
            || systemVoices.find((v) => v.lang.startsWith('es'));
          if (male) utterance.voice = male;
        }
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  // Verificación detallada de comida lista según la comanda real
  const handleFoodStatusQuery = () => {
    if (!activeOrder || !activeOrder.items || activeOrder.items.length === 0) {
      const resp = catGender === 'hembra'
        ? `¡Miau! Querido comensal, en tu Mesa #${tableNumber} aún no tienes una comanda activa enviada a cocina. ¡Pídeme lo que se te antoje de la carta y te lo anoto al instante! 🐾`
        : `¡Miau! En Mesa #${tableNumber} todavía no registras comanda activa. ¡Dime qué platillo o bebida te gustaría ordenar y lo enviamos de inmediato! 🍽️`;
      setAssistantReply(resp);
      setMichiPose('curioso');
      speakLine(resp);
      addChatMessage('michi', resp);
      return;
    }

    const itemsCompletados = activeOrder.items.filter((i) => i.completed);
    const itemsPendientes = activeOrder.items.filter((i) => !i.completed);
    const totalItems = activeOrder.items.length;

    // Caso 1: Todos los platillos listos (o step 4)
    if (activeOrder.step === 4 || (itemsCompletados.length === totalItems && totalItems > 0)) {
      const lista = activeOrder.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
      const resp = catGender === 'hembra'
        ? `¡Buenas noticias! 🎉 Toda tu comanda de Mesa #${tableNumber} ya está lista: ${lista}. En estos momentos el mozo te la está llevando a tu mesa. ¡Que lo disfrutes mucho! 💖`
        : `¡Tu comida ya está lista! 👨‍🍳 De tu comanda #${activeOrder.shortCode} para Mesa #${tableNumber}, salieron de cocina: ${lista}. Ya están emplatados y van en camino a tu mesa. ¡Buen provecho! 🥢`;
      setAssistantReply(resp);
      setMichiPose('listo');
      speakLine(resp);
      addChatMessage('michi', resp);
      return;
    }

    // Caso 2: Ya fue entregado (step 5)
    if (activeOrder.step === 5) {
      const resp = catGender === 'hembra'
        ? `¡Miau! Tu comanda #${activeOrder.shortCode} ya fue entregada en tu mesa. ¿Estuvo todo delicioso o deseas pedir algún postre como la Trilogía de Mochis o un trago de autor? 🍰`
        : `Tu pedido #${activeOrder.shortCode} ya fue entregado en tu mesa. Si gustas pedir algo más de la carta o solicitar la cuenta, solo avísame y te ayudo. 😺`;
      setAssistantReply(resp);
      setMichiPose('satisfecho');
      speakLine(resp);
      addChatMessage('michi', resp);
      return;
    }

    // Caso 3: Algunos platos ya salieron y otros siguen en fuego
    if (itemsCompletados.length > 0 && itemsPendientes.length > 0) {
      const listosTxt = itemsCompletados.map((i) => `${i.quantity}x ${i.name}`).join(', ');
      const pendientesTxt = itemsPendientes.map((i) => `${i.quantity}x ${i.name}`).join(', ');
      const resp = catGender === 'hembra'
        ? `¡Aquí tienes el estado de tu comida! 🍲 Ya salieron listos: ${listosTxt}. Y en el fuego siguen preparándose con esmero: ${pendientesTxt}. ¡Falta muy poquito para servir todo! ✨`
        : `Auditoría Cocina KDS: Ya están listos en el pase: ${listosTxt}. Siguen en cocción a fuego vivo: ${pendientesTxt}. Te aviso apenas el chef dé la señal 👨‍🍳🔥`;
      setAssistantReply(resp);
      setMichiPose('anotado');
      speakLine(resp);
      addChatMessage('michi', resp);
      return;
    }

    // Caso 4: Todos en preparación (step 3)
    const nombresPendientes = activeOrder.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
    const resp = catGender === 'hembra'
      ? `¡Miau! Tu comanda #${activeOrder.shortCode} (${nombresPendientes}) está en preparación en cocina. Los cortes y la sazón tradicional están en pleno proceso para Mesa #${tableNumber}. ¡Pronto estará en tu mesa bien calientita! 🐾🔥`
      : `Tu comanda #${activeOrder.shortCode} (${nombresPendientes}) está marchando en cocina en el fuego tradicional. El tiempo estimado de salida es de 10 a 15 minutos ⏱️🔥`;
    setAssistantReply(resp);
    setMichiPose('curioso');
    speakLine(resp);
    addChatMessage('michi', resp);
  };

  const addChatMessage = (sender: 'user' | 'michi', text: string) => {
    const timeStr = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [
      ...prev,
      { id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, sender, text, time: timeStr },
    ]);
  };

  // Motor NLU con Guardrails: solo temas gastronómicos y de la web MISHIKO
  const processUserInput = (rawText: string) => {
    const text = rawText.toLowerCase().trim();
    if (!text) return;

    // Agregar lo que dijo el usuario al feed para que SE QUEDE visible
    addChatMessage('user', rawText);

    // 0. Interrupción, cambio de opinión o desvío de Michi (Barge-in conversacional)
    if (/(espera|detente|para|calla|silencio|cambie|cambiar|opinion|opinión|desvia|desviando|desviaste|eso no|otra cosa|mejor no|no quiero eso|corrige|esperate|equivocaste)/i.test(text)) {
      stopSpeaking();
      const resp = catGender === 'hembra'
        ? `¡Miau! Me detengo de inmediato 🐾. Perdóname si me adelanté o me desvié. ¿Qué deseas cambiar de tu comanda o qué prefieres pedir en su lugar? Soy todo oídos.`
        : `¡Freno en seco! 🐱 Tienes toda la razón comensal, me detengo. Me callo y te escucho: ¿qué platillo prefieres cambiar o qué se te antoja ordenar ahora?`;
      setAssistantReply(resp);
      setMichiPose('curioso');
      speakLine(resp);
      addChatMessage('michi', resp);
      return;
    }

    // 1. Guardrail: temas fuera del restaurante (fútbol, política, noticias, etc.)
    const fueraDeDominio = /(futbol|fútbol|partido|gol|alianza|cristal|messi|ronaldo|politica|política|presidente|elecciones|noticia|noticias|guerra|clase|tarea|examen|apuesta)/i;
    if (fueraDeDominio.test(text)) {
      const resp = catGender === 'hembra'
        ? `¡Miau! Solo soy tu mesera virtual de MISHIKO 🐾. No sé de fútbol ni noticias externas, pero con mucho gusto te recomiendo los mejores platillos, bebidas según el clima o te llevo el pedido a cocina. ¿Qué se te antoja ordenar?`
        : `¡Miau! Solo soy tu mesero virtual de MISHIKO 🐱. No sé de fútbol ni noticias externas, pero con mucho gusto te recomiendo los mejores platillos, bebidas según el clima o te llevo el pedido a cocina. ¿Qué se te antoja ordenar?`;
      setAssistantReply(resp);
      setMichiPose('saludo');
      speakLine(resp);
      addChatMessage('michi', resp);
      return;
    }

    // 2. Estado de la comida / ¿Qué comida está lista? / ¿Ya está mi comida?
    if (/(estado|comida|ya salio|ya salieron|salio|salieron|listo|lista|listos|listas|cuanto falta|demora|cocina|ya esta|ya estaban|como va)/i.test(text)) {
      handleFoodStatusQuery();
      return;
    }

    // 3. Recomendación de bebidas según el clima
    if (/(clima|calor|frío|frio|sed|bebida|bebidas|refresco|tomar|coctel|cóctel|trago)/i.test(text)) {
      const resp = catGender === 'hembra'
        ? `¡Para el calor te recomiendo nuestra Limonada de Hierbabuena Frozen bien fría o el Pisco Dragon Sour de autor! Si es de noche o hace frío, el Té Verde Jazmín o un Ramen Criollo caliente te sentarán genial ☀️🍹`
        : `¡Para el calor te recomiendo nuestra Limonada de Hierbabuena Frozen bien fría o el Pisco Dragon Sour de autor! Si es de noche o hace frío, el Té Verde Jazmín o un Ramen Criollo caliente te sentarán genial ☀️🍹`;
      setAssistantReply(resp);
      setMichiPose('saludo');
      speakLine(resp);
      addChatMessage('michi', resp);
      return;
    }

    // 4. Recomendaciones generales / sommelier
    if (/(recomiend|sugi|especial|popular|favorito|bueno|rico|carta|chef)/i.test(text)) {
      const resp = `¡Nuestra gran recomendación es la Michi Smash Burger Doble y el Ramen Tonkotsu Black Garlic! De entrada unas Gyozas de Cerdo al vapor con salsa ponzu. ¡Son lo más pedido de la casa! 🍽️`;
      setAssistantReply(resp);
      setMichiPose('saludo');
      speakLine(resp);
      addChatMessage('michi', resp);
      return;
    }

    // 5. Tomar y llevar el pedido
    if (/(quiero|dame|agrega|pon|traeme|trae|comprar|ordenar|pido|lleva|comanda)/i.test(text)) {
      if (parsedMatches.length > 0) {
        onAddParsedItemsToCart(parsedMatches);
        const nombres = parsedMatches.map((m) => `${m.quantity}x ${m.dish.name}`).join(', ');
        const resp = catGender === 'hembra'
          ? `¡Anotado con cariño! He llevado ${nombres} a tu comanda para Mesa #${tableNumber} 💖 ¿Deseas pedir algo más?`
          : `¡Anotado! He llevado ${nombres} a tu comanda para Mesa #${tableNumber} 👍 ¿Deseas pedir algo más?`;
        setAssistantReply(resp);
        setMichiPose('anotado');
        speakLine(resp);
        addChatMessage('michi', resp);
        return;
      }
    }

    // 6. Saludo y Modo Anime
    if (/(anime|konnichiwa|arigato|senpai|kawaii|nya|nyan|saludo anime)/i.test(text)) {
      const resp = catGender === 'hembra'
        ? `¡Konnichiwa, senpai! Nyaaan~ 🐾 Soy Michita-chan, tu mesera waifu en MISHIKO. ¡Es un honor atenderte! Te recomiendo un delicioso Ramen Tonkotsu o unos Mochis dulces. ¿Qué se te antoja hoy? 💖`
        : `¡Irasshaimase, nakama! 🔥 Soy Michi-kun. ¡La pasión por la cocina tradicional y el fuego del wok arden en MISHIKO! ¿Qué platillo legendario deseas probar hoy? 🍜`;
      setAssistantReply(resp);
      setMichiPose('risa');
      speakLine(resp);
      addChatMessage('michi', resp);
      return;
    }

    if (/(hola|buenos dias|buenas tardes|buenas noches|michi|michita|que tal|saluda)/i.test(text)) {
      const resp = catGender === 'hembra'
        ? `¡Hola, qué alegría verte! Bienvenido a MISHIKO. Soy ${config.name}, tu mesera virtual. ¿Qué delicia se te antoja disfrutar hoy? 🐾`
        : `¡Hola! Bienvenido a MISHIKO. Soy ${config.name}, tu mesero virtual. ¿Qué delicia se te antoja disfrutar hoy? 🐱`;
      setAssistantReply(resp);
      setMichiPose('saludo');
      speakLine(resp);
      addChatMessage('michi', resp);
      return;
    }

    // Default con platillos detectados o sugerencia
    if (parsedMatches.length > 0) {
      const nombres = parsedMatches.map((m) => `${m.quantity}x ${m.dish.name}`).join(', ');
      const resp = `Detecté en tu voz: ${nombres}. Puedes pulsar "Llevar a mi pedido" para enviarlo directamente a la comanda 😺`;
      setAssistantReply(resp);
      setMichiPose('anotado');
      speakLine(resp);
      addChatMessage('michi', resp);
    } else {
      const resp = `Entendido. Puedes pedirme cualquier platillo del menú, bebidas según el clima, consultar "¿qué comida está lista?" o decirme "recomiéndame algo" 😺`;
      setAssistantReply(resp);
      setMichiPose('saludo');
      speakLine(resp);
      addChatMessage('michi', resp);
    }
  };

  // Control del micrófono continuo (Permite hablar seguido sin que se corte e interrumpe a Michi)
  const startListening = () => {
    stopSpeaking(); // Interrupción inmediata (Barge-in): si Michi estaba hablando, se calla

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
      rec.continuous = true; // Micrófono continuo para hablar con tranquilidad
      rec.interimResults = true;

      rec.onstart = () => {
        stopSpeaking();
        setIsListening(true);
        setSecondsListening(0);
      };

      let timer: any = null;

      rec.onresult = (event: any) => {
        stopSpeaking(); // Si el comensal empieza a hablar, silenciar a Michi al instante

        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }

        const text = currentTranscript.trim();
        if (text) {
          setTranscript(text);

          clearTimeout(timer);
          timer = setTimeout(() => {
            if (text.length > 2) {
              processUserInput(text);
            }
          }, 1400);
        }
      };

      rec.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          setIsListening(false);
        }
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

    const interacciones: { pose: MichiPoseType; texto: string }[] = catGender === 'hembra' ? [
      {
        pose: 'saludo',
        texto: `¡Miau! Hola comensal 🐾. Soy Michita, tu mesera virtual en Mesa #${tableNumber}. ¡Es un gusto atenderte hoy!`,
      },
      {
        pose: 'risa',
        texto: `¡Ronroneo de felicidad! Me encantan las visitas alegres en MISHIKO 💖. ¿Te traigo algo refrescante para brindar?`,
      },
      {
        pose: 'curioso',
        texto: `¿Qué plato se te antoja hoy? Soy todo oídos 🐾. Dime "¿qué comida está lista?" o pregúntame por las especialidades.`,
      },
      {
        pose: 'sorprendido',
        texto: `¡Vaya elección! Todo lo que prepares con nuestros chefs Nikkei queda delicioso. ¡Pídeme lo que gustes! ✨`,
      },
      {
        pose: 'listo',
        texto: `¡Miau! Estoy atenta a cocina y a tu mesa para que todo salga perfecto. ¡Buen provecho! 🍣`,
      },
      {
        pose: 'satisfecho',
        texto: `¡Mmm, qué rico huele la cocina hoy! El Tonkotsu y los Mochis están espectaculares. ¿Te animas a probarlos? 🍰`,
      },
    ] : [
      {
        pose: 'saludo',
        texto: `¡Miau! Hola comensal 🐱. Soy Michi, tu mesero virtual en Mesa #${tableNumber}. ¡Es un gusto atenderte hoy!`,
      },
      {
        pose: 'risa',
        texto: `¡Miau miau miau! Me encantan los comensales con buen apetito 😺. ¿Qué vamos a degustar hoy?`,
      },
      {
        pose: 'curioso',
        texto: `¿Qué plato se te antoja hoy? Soy todo oídos 🐾. Dime "bebidas según el clima" o pregúntame "¿qué comida está lista?".`,
      },
      {
        pose: 'sorprendido',
        texto: `¡Ufff, excelente gusto! Nuestra carne Wagyu y el Ramen criollo son de los mejores de Lima. ¡Pídeme lo que desees! 🍜`,
      },
      {
        pose: 'listo',
        texto: `¡Listo para servirte! En un instante llevo tu comanda directo a la pantalla de cocina KDS. ¡Tú solo disfruta! 👨‍🍳`,
      },
      {
        pose: 'satisfecho',
        texto: `¡Miau, qué delicia de mesa! Recuerda que puedes pedirme la cuenta o más bebidas cuando gustes. ¡A comer rico! 🥢`,
      },
    ];

    const elegida = interacciones[Math.floor(Math.random() * interacciones.length)];
    setAssistantReply(elegida.texto);
    setMichiPose(elegida.pose);
    speakLine(elegida.texto);
    addChatMessage('michi', elegida.texto);
  };

  const handleSaveAppearance = () => {
    onUpdateConfig(draftConfig);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2400);
  };

  const handlePlayGesture = (gesture: MichiGesture) => {
    setSelectedGesture(gesture);
    setIsPlayingGesture(true);

    let nextPose: MichiPoseType = 'saludo';
    if (gesture.id === 'bienvenida' || gesture.id === 'reverencia') nextPose = 'saludo';
    else if (gesture.id === 'anotando' || gesture.id === 'apuntes') nextPose = 'anotado';
    else if (gesture.id === 'guiño' || gesture.id === 'curiosidad') nextPose = 'curioso';
    else if (gesture.id === 'ronroneo' || gesture.id === 'baile' || gesture.id === 'aplauso') nextPose = 'risa';
    else if (gesture.id === 'sorpresa' || gesture.id === 'estiramiento') nextPose = 'sorprendido';
    else if (gesture.id === 'plato_listo' || gesture.id === 'servir') nextPose = 'satisfecho';
    else if (gesture.id === 'cocina' || gesture.id === 'lista') nextPose = 'listo';
    setMichiPose(nextPose);

    if (config.autoSpeak || config.voiceEnabled) {
      speakLine(gesture.speechLine, config.gestureSpeed);
    }
    setTimeout(() => setIsPlayingGesture(false), 1200 / config.gestureSpeed);
  };

  const handleTestVoice = () => {
    const vType = config.voiceType || (catGender === 'hembra' ? 'dulce' : 'energico');
    let testLine = '';
    if (vType === 'anime-kawaii') {
      testLine = `¡Konnichiwa, senpai! Nyaaan~ 🐾 Soy Michita-chan, tu mesera en MISHIKO. ¡Es un honor atenderte con todo mi cariño!`;
    } else if (vType === 'anime-shonen') {
      testLine = `¡Irasshaimase! 🔥 ¡Soy Michi-kun! ¡El fuego del wok y la sazón de la cocina están ardiendo para tu mesa!`;
    } else if (catGender === 'hembra') {
      testLine = `¡Miau! Hola querido comensal, soy Michita. Esta es mi voz virtual en español. ¡Estoy lista para atenderte con mucho cariño!`;
    } else {
      testLine = `¡Miau! Hola comensal, soy Michi tu mesero virtual. Esta es mi voz de atención en vivo. ¿Qué vamos a pedir hoy?`;
    }
    setAssistantReply(testLine);
    speakLine(testLine);
    addChatMessage('michi', testLine);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28 lg:pb-10 space-y-6">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-stone-500 dark:text-stone-400">
            Asistente Virtual · Mesa #{tableNumber}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <span>Michi AI Hub</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-[#9E3304] dark:bg-amber-950/60 dark:text-amber-300">
              {catGender === 'hembra' ? '🎀 Michita Hembra' : '🐱 Michi Macho'}
            </span>
          </h1>
        </div>

        {/* Sub-view Navigation Pill */}
        <div className="inline-flex p-1 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
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
            <span>Apariencia & Voz</span>
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
            {/* Personaje Interactivo Central */}
            <div className="rounded-3xl bg-gradient-to-b from-amber-500/10 via-white to-stone-50 dark:from-amber-950/20 dark:via-[#191614] dark:to-[#12100E] border border-amber-500/20 dark:border-stone-800 p-6 text-center relative overflow-hidden shadow-sm">
              {/* Header con botón de voz ON/OFF y probar voz */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-xs font-bold text-[#9E3304] dark:text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>En Servicio · Mesa #{tableNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestVoice}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-xs font-bold text-[#9E3304] dark:text-amber-300 hover:bg-amber-100"
                    title="Escuchar la voz actual del Michi"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Probar Voz</span>
                  </button>
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

              {/* Botón flotante para interrumpir cuando Michi esté hablando */}
              {isSpeaking && (
                <div className="my-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      stopSpeaking();
                      processUserInput('espera, cambié de opinión');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/70 dark:text-red-300 dark:hover:bg-red-900 border border-red-300 dark:border-red-700 text-xs font-bold shadow-md animate-bounce transition-all cursor-pointer"
                  >
                    <Hand className="w-4 h-4 text-red-600 animate-pulse" />
                    <span>✋ Interrumpir a Michi / Cambiar de opinión</span>
                  </button>
                </div>
              )}

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
                    alt={`${config.name} interactivo`}
                    className="w-full h-full object-contain filter drop-shadow-2xl"
                  />
                </div>
                <div className="text-xs font-semibold text-stone-400 dark:text-stone-500 mt-1">
                  👆 Toca a {config.name} para saludar o interactuar
                </div>
              </div>

              {/* Botón Principal de Micrófono para Hablar Continuo */}
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
                      <span>🔴 Escuchando en vivo... (Toca para pausar)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span>🎙️ Hablar con {config.name}</span>
                    </>
                  )}
                </button>

                {isListening && (
                  <div className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
                    Micrófono Continuo Activo · 00:{String(secondsListening).padStart(2, '0')} seg
                  </div>
                )}
              </div>
            </div>

            {/* Sugerencias Rápidas de Conversación */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 space-y-3">
              <div className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Preguntas Rápidas y Auditoría de Comida
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => processUserInput('¿Qué comida está lista?')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5"
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>¿Qué comida está lista?</span>
                </button>

                <button
                  type="button"
                  onClick={() => processUserInput('¿Cómo va mi comida?')}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-xs font-semibold text-[#9E3304] dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                >
                  ⏱️ ¿Cómo va mi pedido?
                </button>

                <button
                  type="button"
                  onClick={() => processUserInput('bebidas según el clima')}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-200 flex items-center gap-1.5"
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Bebidas según el clima</span>
                </button>

                <button
                  type="button"
                  onClick={() => processUserInput('recomiéndame algo')}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-200"
                >
                  ⭐ Especialidades
                </button>

                <button
                  type="button"
                  onClick={() => processUserInput('noticias de futbol de hoy')}
                  className="px-3 py-1.5 rounded-lg border border-dashed border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-400 hover:text-stone-600"
                  title="Prueba el filtro de dominio de Michi"
                >
                  ⚽ ¿Quién ganó el partido? (Filtro)
                </button>

                <button
                  type="button"
                  onClick={() => processUserInput('Michita-chan, salúdame al estilo anime')}
                  className="px-3 py-1.5 rounded-lg bg-pink-50 dark:bg-pink-950/40 border border-pink-300 dark:border-pink-800 text-xs font-bold text-pink-700 dark:text-pink-300 hover:bg-pink-100 flex items-center gap-1"
                >
                  <span>🌸 Saludo Anime Nya~</span>
                </button>
              </div>

              {/* Guía Visual: ¿Cómo Preguntarle a Michi? */}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
                  📖 Guía de Ejemplos: ¿Cómo Preguntar?
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div
                    onClick={() => processUserInput('¿Qué comida está lista?')}
                    className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 hover:border-amber-400 cursor-pointer transition-colors"
                  >
                    <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                      <span>🍲 Consultar comanda:</span>
                    </div>
                    <div className="text-stone-500">"¿Qué comida está lista?" o "¿Cómo va mi pedido?"</div>
                  </div>

                  <div
                    onClick={() => processUserInput('Quiero dos hamburguesas smash dobles y una limonada frozen')}
                    className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 hover:border-amber-400 cursor-pointer transition-colors"
                  >
                    <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                      <span>🍔 Ordenar por voz:</span>
                    </div>
                    <div className="text-stone-500">"Quiero dos smash burger dobles y una limonada"</div>
                  </div>

                  <div
                    onClick={() => processUserInput('Tengo mucho calor, ¿qué bebida me recomiendas?')}
                    className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 hover:border-amber-400 cursor-pointer transition-colors"
                  >
                    <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                      <span>☀️ Clima & Bebidas:</span>
                    </div>
                    <div className="text-stone-500">"Tengo calor, ¿qué bebidas frías tienen?"</div>
                  </div>

                  <div
                    onClick={() => processUserInput('¿Cuál es la especialidad más deliciosa de la casa?')}
                    className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 hover:border-amber-400 cursor-pointer transition-colors"
                  >
                    <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                      <span>⭐ Recomendación:</span>
                    </div>
                    <div className="text-stone-500">"¿Cuál es el plato más recomendado?"</div>
                  </div>
                </div>
              </div>

              {/* Botón de texto alternativo */}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                <span className="text-stone-400">¿Prefieres escribir?</span>
                <button
                  type="button"
                  onClick={() => setShowKeyboardInput(!showKeyboardInput)}
                  className="inline-flex items-center gap-1 font-semibold text-[#9E3304] dark:text-amber-400 hover:underline"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>{showKeyboardInput ? 'Ocultar teclado' : 'Escribir con teclado'}</span>
                </button>
              </div>

              {showKeyboardInput && (
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Escribe: ¿Qué comida está lista?, quiero 2 hamburguesas..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        processUserInput(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#9E3304]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Feed de Conversación Persistente y Reconocimiento de Comanda */}
          <div className="lg:col-span-6 space-y-5">
            {/* Historial de conversación (Para que lo que hables SE QUEDE) */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Registro de Voz & Respuestas</span>
                </div>
                <button
                  type="button"
                  onClick={() => setChatMessages([])}
                  className="text-[11px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[10px] font-bold text-stone-400 px-1 mb-0.5">
                      {msg.sender === 'user' ? 'Tú (Voz / Comensal)' : config.name} · {msg.time}
                    </div>
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#9E3304] text-white rounded-br-none'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-bl-none border border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bandeja de Comanda Detectada en Voz */}
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#9E3304] dark:text-amber-400" />
                  <span>Platillos Detectados en tu Voz</span>
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {parsedMatches.length} ítems
                </span>
              </div>

              {parsedMatches.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-dashed border-stone-200 dark:border-stone-800 space-y-2">
                  <Utensils className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
                  <div className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                    Aún no hay platillos reconocidos
                  </div>
                  <div className="text-[11px] text-stone-400 max-w-xs mx-auto">
                    Di por ejemplo: <em>"Quiero dos hamburguesas dobles sin cebolla y una limonada frozen"</em>.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {parsedMatches.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40"
                      >
                        <DishImage
                          src={item.dish.imageUrl}
                          alt={item.dish.name}
                          className="w-12 h-12 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                            {item.quantity}x {item.dish.name}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            {item.modifiers.length > 0
                              ? item.modifiers.map((m) => m.label).join(', ')
                              : 'Porción clásica'}
                          </div>
                        </div>
                        <div className="text-xs font-bold text-[#9E3304] dark:text-amber-400 shrink-0">
                          S/ {((item.dish.price + item.modifiers.reduce((s, m) => s + m.priceDelta, 0)) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs font-bold">
                    <span>Total estimado:</span>
                    <span className="text-[#9E3304] dark:text-amber-400 text-sm">
                      S/ {parsedTotal.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onAddParsedItemsToCart(parsedMatches);
                      const msg = catGender === 'hembra'
                        ? `¡Anotado! He llevado ${parsedMatches.length} platillos a tu comanda de Mesa #${tableNumber} 💖`
                        : `¡Anotado! He llevado ${parsedMatches.length} platillos a tu comanda de Mesa #${tableNumber} 🍽️`;
                      setAssistantReply(msg);
                      setMichiPose('anotado');
                      speakLine(msg);
                      addChatMessage('michi', msg);
                      setTranscript('');
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#9E3304] hover:bg-[#822802] text-white text-xs font-bold shadow-md transition-colors min-h-[46px]"
                  >
                    <span>Llevar a mi pedido</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: APARIENCIA & CONFIGURACIÓN DE VOZ */}
      {subView === 'apariencia' && (
        <div className="max-w-4xl space-y-6">
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Personalización de Michi & Voz
              </h2>
              <p className="text-xs text-stone-500">
                Configura el género (Macho / Hembra), estilo de voz y atuendo del mesero virtual.
              </p>
            </div>

            {/* 1. Selector de Género (Michi Macho vs Michita Hembra) */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                1. Género del Asistente
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setDraftConfig({
                      ...draftConfig,
                      gender: 'macho',
                      name: 'Michi',
                      voiceType: 'energico',
                      voicePitch: 1.05,
                    })
                  }
                  className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    (draftConfig.gender || (draftConfig.furColor === 'Blanco' ? 'hembra' : 'macho')) === 'macho'
                      ? 'border-[#9E3304] bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-500/30'
                      : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-2xl shrink-0">
                    🐱
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      Michi (Macho)
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Mesero clásico, voz cálida y enérgica estilo Talking Tom.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDraftConfig({
                      ...draftConfig,
                      gender: 'hembra',
                      name: 'Michita',
                      voiceType: 'dulce',
                      voicePitch: 1.25,
                    })
                  }
                  className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    draftConfig.gender === 'hembra'
                      ? 'border-[#9E3304] bg-pink-50/50 dark:bg-pink-950/30 ring-2 ring-pink-500/30'
                      : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center text-2xl shrink-0">
                    🎀
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      Michita (Hembra)
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Mesera cariñosa, tono dulce y alegre con expresiones tiernas.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Configuración de Voz y Pruebas */}
            <div className="space-y-3 pt-3 border-t border-stone-100 dark:border-stone-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  2. Estilo de Voz del Asistente
                </label>
                <button
                  type="button"
                  onClick={handleTestVoice}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-xs font-bold text-[#9E3304] dark:text-amber-300 hover:bg-amber-200"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Probar esta voz</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'dulce', label: '🎀 Michita Dulce', desc: 'Femenina / Tierna & Clara', pitch: 1.25 },
                  { id: 'energico', label: '🎙️ Michi Enérgico', desc: 'Masculina / Claro & Amigable', pitch: 1.05 },
                  { id: 'anime-kawaii', label: '🌸 Anime Kawaii', desc: 'Michita-chan / Waifu Nya~', pitch: 1.48 },
                  { id: 'anime-shonen', label: '🔥 Anime Shonen', desc: 'Michi-kun / Wok Hero', pitch: 1.15 },
                  { id: 'chibi', label: '🐱 Chibi Neko', desc: 'Gatito Tierno Chibi', pitch: 1.65 },
                  { id: 'tom', label: '😸 Talking Tom', desc: 'Animado / Divertido', pitch: 1.35 },
                ].map((v) => {
                  const active = (draftConfig.voiceType || (draftConfig.gender === 'hembra' ? 'dulce' : 'energico')) === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() =>
                        setDraftConfig({
                          ...draftConfig,
                          voiceType: v.id as any,
                          voicePitch: v.pitch,
                        })
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        active
                          ? 'border-[#9E3304] bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-500/30'
                          : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50'
                      }`}
                    >
                      <div className="text-xs font-bold text-stone-900 dark:text-stone-100">{v.label}</div>
                      <div className="text-[10px] text-stone-500">{v.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Selector de voces del navegador */}
              {systemVoices.length > 0 && (
                <div className="pt-2">
                  <label className="text-[11px] font-semibold text-stone-500 block mb-1">
                    Voz detectada en el dispositivo (Navegador):
                  </label>
                  <select
                    value={selectedVoiceName}
                    onChange={(e) => setSelectedVoiceName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                  >
                    <option value="">Automática por género ({catGender === 'hembra' ? 'Femenina' : 'Masculina'})</option>
                    {systemVoices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 3. Color de Pelaje */}
            <div className="space-y-3 pt-3 border-t border-stone-100 dark:border-stone-800">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                3. Color de Pelaje
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {FUR_OPTIONS.map((opt) => (
                  <button
                    key={opt.color}
                    type="button"
                    onClick={() => setDraftConfig({ ...draftConfig, furColor: opt.color })}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      draftConfig.furColor === opt.color
                        ? 'border-[#9E3304] bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-500/30'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full ${opt.swatch} shrink-0`} />
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Atuendo de Servicio */}
            <div className="space-y-3 pt-3 border-t border-stone-100 dark:border-stone-800">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                4. Atuendo de Servicio
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {OUTFIT_OPTIONS.map((opt) => (
                  <button
                    key={opt.outfit}
                    type="button"
                    onClick={() => setDraftConfig({ ...draftConfig, outfit: opt.outfit })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      draftConfig.outfit === opt.outfit
                        ? 'border-[#9E3304] bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-500/30'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-stone-900 dark:text-stone-100">{opt.outfit}</div>
                    <div className="text-[10px] text-stone-500">{opt.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Botón Guardar Cambios */}
            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
              {savedToast ? (
                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>¡Apariencia y voz guardadas correctamente!</span>
                </div>
              ) : (
                <div className="text-xs text-stone-400">
                  Los cambios se sincronizan en todo el Smart Dining OS.
                </div>
              )}
              <button
                type="button"
                onClick={handleSaveAppearance}
                className="px-6 py-2.5 rounded-xl bg-[#9E3304] hover:bg-[#822802] text-white text-xs font-bold shadow-md transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 3: LABORATORIO DE GESTOS */}
      {subView === 'gestos' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 space-y-5">
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Laboratorio de Gestos y Expresiones
              </h2>
              <p className="text-xs text-stone-500">
                Prueba las animaciones, gestos y frases de voz predefinidas para {config.name}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {MICHI_GESTURES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handlePlayGesture(g)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedGesture.id === g.id
                      ? 'border-[#9E3304] bg-amber-50/60 dark:bg-amber-950/30 ring-1 ring-amber-500/30'
                      : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100">{g.title}</span>
                    <Play className="w-3.5 h-3.5 text-[#9E3304] dark:text-amber-400" />
                  </div>
                  <div className="text-[11px] text-stone-500 mb-2">{g.description}</div>
                  <div className="text-[10px] italic text-[#9E3304] dark:text-amber-300 truncate">
                    “{g.speechLine}”
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
