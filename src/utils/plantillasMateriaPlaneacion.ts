import type { NivelPlaneacion, PlaneacionClase, SecuenciaItem } from '@/services/planeacionPedagogicaService';
import { secuenciaVacia } from '@/services/planeacionPedagogicaService';

export type AreaMateria =
  | 'MATEMATICAS'
  | 'LENGUAJE'
  | 'CIENCIAS_NATURALES'
  | 'CIENCIAS_SOCIALES'
  | 'INGLES'
  | 'ARTISTICA'
  | 'EDUCACION_FISICA'
  | 'OTRA';

export type PlantillaMateria = {
  area: AreaMateria;
  etiqueta: string;
  color: string;
  instrumento: string;
  aprendizajeEsperado: string;
  preguntaProblematizadora: string;
  saberesPrevios: string;
  estandar: string;
  dba: string;
  evidencia: string;
  criterios: string;
  recursos: string;
  refuerzo: string;
  profundizacion: string;
  actividadPractica: string;
  secuencia: SecuenciaItem[];
  tallerTitulo: string;
  tallerContenido: string;
  hints: {
    aprendizaje: string;
    evidencia: string;
    secuencia: string;
  };
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Detecta el área curricular a partir del nombre de la asignatura/tema. */
export function detectarAreaMateria(asignatura?: string | null, tema?: string | null): AreaMateria {
  const t = norm(`${asignatura || ''} ${tema || ''}`);
  if (
    t.includes('matem') ||
    t.includes('algebra') ||
    t.includes('geometr') ||
    t.includes('aritmet') ||
    t.includes('estadistic') ||
    t.includes('porcent') ||
    t.includes('numero')
  ) {
    return 'MATEMATICAS';
  }
  if (
    t.includes('lengua') ||
    t.includes('castellan') ||
    t.includes('espanol') ||
    t.includes('lectura') ||
    t.includes('escritura') ||
    t.includes('argumentativ') ||
    t.includes('literat')
  ) {
    return 'LENGUAJE';
  }
  if (
    t.includes('natural') ||
    t.includes('biolog') ||
    t.includes('fisica') ||
    t.includes('quimic') ||
    t.includes('ecosistema') ||
    t.includes('celula') ||
    t.includes('ciencia')
  ) {
    return 'CIENCIAS_NATURALES';
  }
  if (
    t.includes('social') ||
    t.includes('historia') ||
    t.includes('geograf') ||
    t.includes('ciudadan') ||
    t.includes('independencia') ||
    t.includes('politic')
  ) {
    return 'CIENCIAS_SOCIALES';
  }
  if (t.includes('ingles') || t.includes('english') || t.includes('idioma')) {
    return 'INGLES';
  }
  if (t.includes('artistic') || t.includes('musica') || t.includes('artes') || t.includes('danza')) {
    return 'ARTISTICA';
  }
  if (t.includes('fisica') && t.includes('educacion')) return 'EDUCACION_FISICA';
  if (t.includes('educacion fisica') || t.includes('deporte') || t.includes('recreacion')) {
    return 'EDUCACION_FISICA';
  }
  return 'OTRA';
}

export const AREA_LABEL: Record<AreaMateria, string> = {
  MATEMATICAS: 'Matemáticas',
  LENGUAJE: 'Lenguaje',
  CIENCIAS_NATURALES: 'Ciencias naturales',
  CIENCIAS_SOCIALES: 'Ciencias sociales',
  INGLES: 'Inglés',
  ARTISTICA: 'Educación artística',
  EDUCACION_FISICA: 'Educación física',
  OTRA: 'Otra área'
};

export const AREA_BADGE: Record<AreaMateria, string> = {
  MATEMATICAS: 'bg-blue-50 text-blue-700 border-blue-200',
  LENGUAJE: 'bg-violet-50 text-violet-700 border-violet-200',
  CIENCIAS_NATURALES: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CIENCIAS_SOCIALES: 'bg-amber-50 text-amber-800 border-amber-200',
  INGLES: 'bg-sky-50 text-sky-700 border-sky-200',
  ARTISTICA: 'bg-pink-50 text-pink-700 border-pink-200',
  EDUCACION_FISICA: 'bg-lime-50 text-lime-800 border-lime-200',
  OTRA: 'bg-gray-100 text-gray-700 border-gray-200'
};

function plantillaPrimaria(area: AreaMateria, tema: string): PlantillaMateria {
  const base = {
    area,
    etiqueta: AREA_LABEL[area],
    color: AREA_BADGE[area],
    instrumento: 'Lista de chequeo + observación',
    hints: {
      aprendizaje: 'Verbo simple + observación o registro (identificar, explicar, registrar).',
      evidencia: 'Producto sencillo: maqueta, tabla, exposición oral corta.',
      secuencia: 'Actividades breves, juego, exploración y material concreto.'
    }
  };

  const mapa: Record<AreaMateria, Omit<PlantillaMateria, 'area' | 'etiqueta' | 'color' | 'instrumento' | 'hints'>> = {
    MATEMATICAS: {
      aprendizajeEsperado: `Resolver situaciones cotidianas relacionadas con ${tema || 'el tema'} usando operaciones y representación concreta.`,
      preguntaProblematizadora: '¿Cómo nos ayudan los números a resolver problemas de la vida diaria?',
      saberesPrevios: 'Conteo, valor posicional, operaciones básicas y situaciones de compra/venta.',
      estandar: 'Pensamiento numérico y sistemas numéricos (grupo de grados correspondiente).',
      dba: 'DBA de Matemáticas del grado — operaciones y resolución de problemas.',
      evidencia: 'Taller con material concreto y explicación oral del procedimiento.',
      criterios:
        'Identifica datos; elige la operación adecuada; calcula con apoyo concreto; explica el resultado.',
      recursos: 'Ábaco o fichas, tablero, guía impresa, objetos del aula.',
      refuerzo: 'Repetir dos ejercicios con tabla de apoyo paso a paso.',
      profundizacion: 'Inventar un problema propio y resolverlo ante el grupo.',
      actividadPractica: 'Resolver 3 problemas contextualizados con material manipulable.',
      secuencia: [
        { momento: 'Inicio', actividad: 'Juego corto de conteo o estimación + propósito de la clase', tiempo: '15 min' },
        { momento: 'Desarrollo', actividad: 'Explicación con concreto → ejemplos guiados → práctica individual', tiempo: '50 min' },
        { momento: 'Cierre', actividad: 'Socialización de un problema y autoevaluación breve', tiempo: '15 min' }
      ],
      tallerTitulo: `Taller de Matemáticas: ${tema || 'Situaciones numéricas'}`,
      tallerContenido:
        '1. Lee el problema.\n2. Subraya los datos.\n3. Dibuja o usa material.\n4. Resuelve.\n5. Explica cómo lo hiciste.'
    },
    LENGUAJE: {
      aprendizajeEsperado: `Comprender y producir textos cortos sobre ${tema || 'el tema'} con ideas claras y vocabulario adecuado.`,
      preguntaProblematizadora: '¿Cómo contamos o defendemos una idea para que otros nos entiendan?',
      saberesPrevios: 'Idea principal, oración completa, diferencia entre hecho y opinión.',
      estandar: 'Producción textual y comprensión lectora (grupo de grados).',
      dba: 'DBA de Lenguaje del grado — lectura y escritura.',
      evidencia: 'Párrafo o cartel + lectura en voz alta.',
      criterios: 'Idea clara; organiza oraciones; usa vocabulario; participa con respeto.',
      recursos: 'Texto corto, tablero, cuaderno, diccionario ilustrado.',
      refuerzo: 'Completar un esquema guiado de inicio–desarrollo–cierre.',
      profundizacion: 'Agregar un ejemplo o un dibujo que refuerce el mensaje.',
      actividadPractica: 'Escribir un párrafo corto siguiendo una estructura dada.',
      secuencia: [
        { momento: 'Inicio', actividad: 'Pregunta motivadora y exploración de saberes previos', tiempo: '15 min' },
        { momento: 'Desarrollo', actividad: 'Lectura compartida + escritura guiada', tiempo: '50 min' },
        { momento: 'Cierre', actividad: 'Lectura voluntaria y retroalimentación amable', tiempo: '15 min' }
      ],
      tallerTitulo: `Taller de Lenguaje: ${tema || 'Producción de textos'}`,
      tallerContenido:
        '1. Lee el texto.\n2. Responde: ¿de qué trata?\n3. Escribe tu propio párrafo.\n4. Revisa mayúsculas y puntos.'
    },
    CIENCIAS_NATURALES: {
      aprendizajeEsperado: `Explicar fenómenos o relaciones del entorno vinculadas a ${tema || 'el tema'} mediante observación y registro.`,
      preguntaProblematizadora: '¿Qué pasaría en el entorno si cambiara un elemento del sistema observado?',
      saberesPrevios: 'Seres vivos / no vivos, observación y registro en tablas.',
      estandar: 'Entorno vivo y entorno físico (grupo de grados).',
      dba: 'DBA de Ciencias Naturales del grado.',
      evidencia: 'Tabla de observación, dibujo científico o maqueta sencilla.',
      criterios: 'Observa con atención; registra; explica al menos 2 relaciones; usa vocabulario básico.',
      recursos: 'Imágenes, entorno escolar, lupa (si hay), cuaderno.',
      refuerzo: 'Completar una tabla con apoyo del docente.',
      profundizacion: 'Proponer un cuidado o acción para el entorno observado.',
      actividadPractica: 'Exploración del patio o aula y registro en tabla.',
      secuencia: [
        { momento: 'Inicio', actividad: 'Imagen o pregunta sorpresa + propósito', tiempo: '15 min' },
        { momento: 'Desarrollo', actividad: 'Exploración, registro y explicación guiada', tiempo: '50 min' },
        { momento: 'Cierre', actividad: 'Socialización de hallazgos', tiempo: '15 min' }
      ],
      tallerTitulo: `Taller de Ciencias: ${tema || 'Exploración del entorno'}`,
      tallerContenido:
        '1. Observa.\n2. Anota lo que ves.\n3. Clasifica.\n4. Explica una relación.\n5. Dibuja tu conclusión.'
    },
    CIENCIAS_SOCIALES: {
      aprendizajeEsperado: `Reconocer hechos, lugares o actores relacionados con ${tema || 'el tema'} y explicar su importancia para la comunidad.`,
      preguntaProblematizadora: '¿Por qué lo que ocurre en nuestra comunidad o en el pasado nos importa hoy?',
      saberesPrevios: 'Ubicación temporal básica, familia, barrio o municipio.',
      estandar: 'Relaciones con la historia y las culturas (grupo de grados).',
      dba: 'DBA de Ciencias Sociales del grado.',
      evidencia: 'Línea de tiempo sencilla, mapa o exposición corta.',
      criterios: 'Ubica hechos; diferencia pasado/presente; participa; usa información clara.',
      recursos: 'Mapa, imágenes, lectura corta, cartulina.',
      refuerzo: 'Ordenar tarjetas de acontecimientos con apoyo.',
      profundizacion: 'Entrevistar a un familiar sobre un hecho local.',
      actividadPractica: 'Elaborar una línea de tiempo o mapa colaborativo.',
      secuencia: [
        { momento: 'Inicio', actividad: 'Imagen histórica o del entorno + preguntas', tiempo: '15 min' },
        { momento: 'Desarrollo', actividad: 'Relato, lectura y elaboración de producto', tiempo: '50 min' },
        { momento: 'Cierre', actividad: 'Conclusiones colectivas', tiempo: '15 min' }
      ],
      tallerTitulo: `Taller de Sociales: ${tema || 'Nuestro contexto'}`,
      tallerContenido:
        '1. Observa la imagen.\n2. Responde qué pasó.\n3. Ordena los hechos.\n4. Explica por qué es importante.'
    },
    INGLES: {
      aprendizajeEsperado: `Usar vocabulario y estructuras básicas en inglés relacionadas con ${tema || 'the topic'} en contextos sencillos.`,
      preguntaProblematizadora: 'How can we talk about our daily life in English?',
      saberesPrevios: 'Saludos, vocabulario básico, present simple (si aplica).',
      estandar: 'Competencias comunicativas en lengua extranjera.',
      dba: 'Referente de inglés del grado.',
      evidencia: 'Diálogo corto o ficha de vocabulario ilustrada.',
      criterios: 'Usa vocabulario; intenta estructuras; participa; pronuncia de forma comprensible.',
      recursos: 'Flashcards, audio corto, cuaderno, tablero.',
      refuerzo: 'Repetir vocabulario con imágenes.',
      profundizacion: 'Crear 3 oraciones nuevas con el vocabulario.',
      actividadPractica: 'Completar y representar un mini-diálogo.',
      secuencia: [
        { momento: 'Inicio', actividad: 'Warm-up with songs or flashcards', tiempo: '15 min' },
        { momento: 'Desarrollo', actividad: 'Presentation + guided practice + pair work', tiempo: '50 min' },
        { momento: 'Cierre', actividad: 'Exit ticket: one sentence in English', tiempo: '15 min' }
      ],
      tallerTitulo: `English workshop: ${tema || 'Vocabulary practice'}`,
      tallerContenido: '1. Match words and pictures.\n2. Fill in the blanks.\n3. Write 3 sentences.\n4. Say them aloud.'
    },
    ARTISTICA: {
      aprendizajeEsperado: `Expresar ideas sobre ${tema || 'el tema'} mediante un producto artístico sencillo.`,
      preguntaProblematizadora: '¿Cómo podemos contar una idea con colores, formas o sonidos?',
      saberesPrevios: 'Colores, formas básicas, escucha o movimiento corporal.',
      estandar: 'Educación artística — exploración y expresión.',
      dba: 'Orientaciones de educación artística del grado.',
      evidencia: 'Producto artístico + breve explicación.',
      criterios: 'Explora materiales; expresa una idea; cuida el trabajo; respeta el de otros.',
      recursos: 'Papel, colores, materiales reciclados, audio si aplica.',
      refuerzo: 'Guiar el producto con plantilla.',
      profundizacion: 'Agregar un elemento simbólico y explicarlo.',
      actividadPractica: 'Creación individual o en parejas del producto.',
      secuencia: [
        { momento: 'Inicio', actividad: 'Estímulo visual/sonoro y propósito', tiempo: '10 min' },
        { momento: 'Desarrollo', actividad: 'Exploración y creación', tiempo: '55 min' },
        { momento: 'Cierre', actividad: 'Galería rápida y comentarios positivos', tiempo: '15 min' }
      ],
      tallerTitulo: `Taller artístico: ${tema || 'Expresión creativa'}`,
      tallerContenido: '1. Observa el estímulo.\n2. Elige materiales.\n3. Crea.\n4. Explica qué quisiste expresar.'
    },
    EDUCACION_FISICA: {
      aprendizajeEsperado: `Participar en actividades motrices relacionadas con ${tema || 'el tema'} cuidando el cuerpo y el trabajo en equipo.`,
      preguntaProblematizadora: '¿Cómo cuidamos nuestro cuerpo mientras jugamos y cooperamos?',
      saberesPrevios: 'Reglas básicas de juego, calentamiento, respeto por turnos.',
      estandar: 'Educación física — motricidad y convivencia.',
      dba: 'Orientaciones de educación física del grado.',
      evidencia: 'Participación en circuito o juego cooperativo.',
      criterios: 'Se calienta; sigue instrucciones; coopera; cuida su seguridad y la de otros.',
      recursos: 'Conos, balones, silbato, espacio abierto.',
      refuerzo: 'Repetir estación con apoyo.',
      profundizacion: 'Proponer una variante del juego.',
      actividadPractica: 'Circuito de estaciones o juego cooperativo.',
      secuencia: [
        { momento: 'Inicio', actividad: 'Calentamiento y explicación de reglas', tiempo: '15 min' },
        { momento: 'Desarrollo', actividad: 'Estaciones / juego principal', tiempo: '50 min' },
        { momento: 'Cierre', actividad: 'Estiramiento y reflexión de convivencia', tiempo: '15 min' }
      ],
      tallerTitulo: `Reto motriz: ${tema || 'Juego cooperativo'}`,
      tallerContenido: '1. Calienta.\n2. Cumple la consigna de cada estación.\n3. Ayuda a un compañero.\n4. Evalúa tu esfuerzo.'
    },
    OTRA: {
      aprendizajeEsperado: `Alcanzar el propósito de aprendizaje de ${tema || 'la clase'} mediante actividades pertinentes al área.`,
      preguntaProblematizadora: '¿Qué necesitamos aprender hoy y para qué nos sirve?',
      saberesPrevios: 'Conocimientos previos del grupo sobre el tema.',
      estandar: 'Referente del área según plan de estudios institucional.',
      dba: 'DBA o referente disponible para el área y grado.',
      evidencia: 'Producto o desempeño definido por el docente.',
      criterios: 'Comprende la consigna; desarrolla la actividad; presenta evidencia; participa.',
      recursos: 'Materiales del área y del aula.',
      refuerzo: 'Actividad guiada de nivelación.',
      profundizacion: 'Reto de ampliación.',
      actividadPractica: 'Desarrollo de la actividad central del área.',
      secuencia: secuenciaVacia(),
      tallerTitulo: `Taller: ${tema || 'Actividad de clase'}`,
      tallerContenido: '1. Lee la consigna.\n2. Desarrolla la actividad.\n3. Revisa.\n4. Entrega.'
    }
  };

  return { ...base, ...mapa[area] };
}

function plantillaBachiller(area: AreaMateria, tema: string): PlantillaMateria {
  const base = {
    area,
    etiqueta: AREA_LABEL[area],
    color: AREA_BADGE[area],
    instrumento: 'Rúbrica (Superior / Alto / Básico / Bajo)',
    hints: {
      aprendizaje: 'Verbo de análisis + fuentes/argumentación (analizar, argumentar, contrastar).',
      evidencia: 'Informe, debate, proyecto o prueba con rúbrica.',
      secuencia: 'Mayor autonomía: investigación, debate y resolución de problemas.'
    }
  };

  const mapa: Record<AreaMateria, Omit<PlantillaMateria, 'area' | 'etiqueta' | 'color' | 'instrumento' | 'hints'>> = {
    MATEMATICAS: {
      aprendizajeEsperado: `Resolver e interpretar problemas de ${tema || 'matemáticas'} aplicando procedimientos formales y argumentando el resultado.`,
      preguntaProblematizadora: '¿Cómo modelamos situaciones reales con herramientas matemáticas?',
      saberesPrevios: 'Operaciones, proporcionalidad, lenguaje algebraico básico según el grado.',
      estandar: 'Pensamiento variacional / numérico / métrico según el grupo de grados.',
      dba: 'DBA de Matemáticas del grado (8°–9° o 10°–11°).',
      evidencia: 'Taller de problemas + explicación del procedimiento.',
      criterios:
        'Identifica datos; selecciona estrategia; calcula correctamente; interpreta en contexto; presenta procedimiento ordenado.',
      recursos: 'Guía, calculadora, tablero, ejemplos de facturas o datos reales.',
      refuerzo: 'Dos problemas con tabla de pasos (dato → operación → resultado).',
      profundizacion: 'Comparar dos estrategias y justificar cuál es más eficiente.',
      actividadPractica: 'Situaciones contextualizadas (descuentos, tasas, datos).',
      secuencia: [
        { momento: 'Inicio', actividad: 'Situación problema cotidiana y activación de previos', tiempo: '15 min' },
        { momento: 'Desarrollo', actividad: 'Formalización + ejemplos guiados + taller individual', tiempo: '60 min' },
        { momento: 'Cierre', actividad: 'Socialización de procedimientos y verificación', tiempo: '15 min' }
      ],
      tallerTitulo: `Taller de Matemáticas: ${tema || 'Resolución de problemas'}`,
      tallerContenido:
        '1. Lee y extrae datos.\n2. Plantea la estrategia.\n3. Resuelve mostrando el procedimiento.\n4. Interpreta el resultado.\n5. Propón un problema similar.'
    },
    LENGUAJE: {
      aprendizajeEsperado: `Analizar y producir textos argumentativos sobre ${tema || 'un tema controvertido'} con tesis, argumentos y conclusión.`,
      preguntaProblematizadora: '¿Cómo defendemos una posición con argumentos claros y sustentados?',
      saberesPrevios: 'Hecho vs opinión, idea principal, conectores, organización de párrafos.',
      estandar: 'Comprensión e interpretación textual; producción argumentativa.',
      dba: 'DBA de Lenguaje del grado — argumentación.',
      evidencia: 'Análisis de texto + párrafo o ensayo breve.',
      criterios: 'Tesis clara; argumentos pertinentes; ejemplo; cohesión; ortografía básica.',
      recursos: 'Texto argumentativo, guía de conectores, rúbrica.',
      refuerzo: 'Plantilla: Considero que… porque… Además… Por ejemplo… Por eso…',
      profundizacion: 'Incluir contraargumento y refutación.',
      actividadPractica: 'Escritura de párrafo argumentativo individual.',
      secuencia: [
        { momento: 'Inicio', actividad: 'Afirmación polémica y toma de posición', tiempo: '15 min' },
        { momento: 'Desarrollo', actividad: 'Estructura del texto + lectura + escritura', tiempo: '60 min' },
        { momento: 'Cierre', actividad: 'Lectura voluntaria y rúbrica rápida', tiempo: '15 min' }
      ],
      tallerTitulo: `Taller de Lengua: ${tema || 'Texto argumentativo'}`,
      tallerContenido:
        '1. Identifica tesis y argumentos del texto modelo.\n2. Escribe tu tesis.\n3. Redacta 2 argumentos + ejemplo.\n4. Cierra con conclusión.\n5. Usa al menos 2 conectores.'
    },
    CIENCIAS_NATURALES: {
      aprendizajeEsperado: `Explicar e interpretar ${tema || 'el fenómeno'} usando conceptos científicos y evidencia observable o documental.`,
      preguntaProblematizadora: '¿Qué evidencia necesitamos para explicar este fenómeno?',
      saberesPrevios: 'Conceptos previos del eje (célula, energía, materia, etc.).',
      estandar: 'Procesos biológicos / físicos / químicos según el eje.',
      dba: 'DBA de Ciencias Naturales del grado.',
      evidencia: 'Informe de laboratorio o explicación con esquema.',
      criterios: 'Usa conceptos; relaciona variables; interpreta; comunica con claridad.',
      recursos: 'Guía, lectura científica corta, materiales de laboratorio o simulaciones.',
      refuerzo: 'Mapa conceptual guiado de conceptos clave.',
      profundizacion: 'Relacionar el fenómeno con un problema local.',
      actividadPractica: 'Análisis de caso o práctica guiada.',
      secuencia: [
        { momento: 'Inicio', actividad: 'Pregunta científica y hipótesis iniciales', tiempo: '15 min' },
        { momento: 'Desarrollo', actividad: 'Explicación + práctica/análisis + registro', tiempo: '60 min' },
        { momento: 'Cierre', actividad: 'Conclusiones basadas en evidencia', tiempo: '15 min' }
      ],
      tallerTitulo: `Guía de Ciencias: ${tema || 'Análisis científico'}`,
      tallerContenido:
        '1. Pregunta e hipótesis.\n2. Datos u observación.\n3. Análisis.\n4. Conclusión.\n5. Nueva pregunta.'
    },
    CIENCIAS_SOCIALES: {
      aprendizajeEsperado: `Analizar ${tema || 'el proceso histórico/social'} reconociendo causas, actores, consecuencias y posibles lecturas críticas.`,
      preguntaProblematizadora: '¿Fue un solo acontecimiento o un conjunto de procesos lo que explicó este hecho?',
      saberesPrevios: 'Contexto colonial/republicano o conceptos de ciudadanía según el tema.',
      estandar: 'Relaciones histórico-sociales; pensamiento crítico.',
      dba: 'DBA de Ciencias Sociales del grado.',
      evidencia: 'Línea de tiempo + exposición o informe argumentativo.',
      criterios: 'Orden cronológico; diferencia causas/consecuencias; usa fuentes; argumenta; respeta turnos.',
      recursos: 'Lecturas, mapas, imágenes, noticias, cartulina.',
      refuerzo: 'Relacionar tarjetas causa–acontecimiento–consecuencia.',
      profundizacion: 'Investigar actores poco visibles (mujeres, pueblos étnicos, sectores populares).',
      actividadPractica: 'Debate con roles o línea de tiempo grupal.',
      secuencia: [
        { momento: 'Inicio', actividad: 'Imagen/documento detonante + previos', tiempo: '15 min' },
        { momento: 'Desarrollo', actividad: 'Contexto, fuentes, producto grupal y exposición', tiempo: '60 min' },
        { momento: 'Cierre', actividad: 'Conclusiones y pregunta de salida', tiempo: '15 min' }
      ],
      tallerTitulo: `Taller de Historia/Sociales: ${tema || 'Análisis de proceso'}`,
      tallerContenido:
        '1. Identifica causas internas y externas.\n2. Ordena acontecimientos.\n3. Señala actores.\n4. Explica 2 consecuencias.\n5. Propón una conclusión argumentada.'
    },
    INGLES: {
      aprendizajeEsperado: `Comunicar ideas sobre ${tema || 'the topic'} using appropriate grammar and vocabulary for the grade level.`,
      preguntaProblematizadora: 'How can language help us explain and defend our ideas?',
      saberesPrevios: 'Tenses and vocabulary previously studied.',
      estandar: 'Communicative competence in EFL.',
      dba: 'English referent for the grade.',
      evidencia: 'Short oral presentation or written paragraph.',
      criterios: 'Accuracy; fluency attempts; vocabulary range; task completion; interaction.',
      recursos: 'Reading/listening input, rubric, dictionary.',
      refuerzo: 'Sentence frames and word bank.',
      profundizacion: 'Add supporting details or a counterpoint.',
      actividadPractica: 'Guided production + peer feedback.',
      secuencia: [
        { momento: 'Inicio', actividad: 'Lead-in question and activate schema', tiempo: '15 min' },
        { momento: 'Desarrollo', actividad: 'Input → controlled practice → freer practice', tiempo: '60 min' },
        { momento: 'Cierre', actividad: 'Performance and feedback', tiempo: '15 min' }
      ],
      tallerTitulo: `English task: ${tema || 'Communication practice'}`,
      tallerContenido:
        '1. Read/listen.\n2. Underline key language.\n3. Complete the guided task.\n4. Produce your own text/dialogue.\n5. Self-check with the rubric.'
    },
    ARTISTICA: {
      aprendizajeEsperado: `Crear y fundamentar un producto artístico sobre ${tema || 'el eje'} articulando técnica e intención comunicativa.`,
      preguntaProblematizadora: '¿Qué queremos comunicar y con qué recursos expresivos?',
      saberesPrevios: 'Elementos del lenguaje artístico del área.',
      estandar: 'Educación artística — creación y apreciación.',
      dba: 'Orientaciones artísticas del grado.',
      evidencia: 'Producto + bitácora de intención.',
      criterios: 'Intención clara; dominio básico técnico; originalidad; sustentación oral.',
      recursos: 'Materiales del taller, referentes visuales/sonoros.',
      refuerzo: 'Guía de proceso creativo por pasos.',
      profundizacion: 'Incorporar referentes culturales locales.',
      actividadPractica: 'Proceso creativo y socialización.',
      secuencia: [
        { momento: 'Inicio', actividad: 'Referente y brief creativo', tiempo: '15 min' },
        { momento: 'Desarrollo', actividad: 'Exploración técnica y producción', tiempo: '60 min' },
        { momento: 'Cierre', actividad: 'Muestra y sustentación breve', tiempo: '15 min' }
      ],
      tallerTitulo: `Proyecto artístico: ${tema || 'Creación'}`,
      tallerContenido:
        '1. Define la intención.\n2. Elige técnica.\n3. Produce.\n4. Escribe 5 líneas de sustentación.\n5. Presenta.'
    },
    EDUCACION_FISICA: {
      aprendizajeEsperado: `Aplicar habilidades motrices y acuerdos de convivencia en actividades de ${tema || 'la sesión'} con autonomía creciente.`,
      preguntaProblematizadora: '¿Cómo equilibramos rendimiento, cuidado del cuerpo y trabajo colectivo?',
      saberesPrevios: 'Fundamentos técnicos y normas de seguridad.',
      estandar: 'Educación física — competencia motriz y ciudadana.',
      dba: 'Orientaciones de educación física del grado.',
      evidencia: 'Desempeño en práctica + autoevaluación.',
      criterios: 'Técnica básica; fair play; esfuerzo; seguridad; cooperación.',
      recursos: 'Implementos deportivos, cronómetro, planilla.',
      refuerzo: 'Estación técnica con feedback del docente.',
      profundizacion: 'Diseñar una micro-sesión para compañeros.',
      actividadPractica: 'Juego modificado o secuencia técnica.',
      secuencia: [
        { momento: 'Inicio', actividad: 'Activation and tactical question', tiempo: '15 min' },
        { momento: 'Desarrollo', actividad: 'Technical work + game application', tiempo: '60 min' },
        { momento: 'Cierre', actividad: 'Cool-down and self-assessment', tiempo: '15 min' }
      ],
      tallerTitulo: `Práctica: ${tema || 'Desempeño motriz'}`,
      tallerContenido:
        '1. Warm-up.\n2. Technical stations.\n3. Applied game.\n4. Rate your performance 1–4.\n5. One improvement goal.'
    },
    OTRA: {
      aprendizajeEsperado: `Desarrollar el aprendizaje específico de ${tema || 'la asignatura'} con rigor y evidencia.`,
      preguntaProblematizadora: '¿Qué problema del área resolveremos y con qué criterios?',
      saberesPrevios: 'Preconceptos del eje temático.',
      estandar: 'Referente del plan de área institucional.',
      dba: 'DBA o lineamiento disponible.',
      evidencia: 'Producto o desempeño con rúbrica.',
      criterios: 'Comprensión; procedimiento; argumentación; presentación.',
      recursos: 'Materiales del área.',
      refuerzo: 'Guía de nivelación.',
      profundizacion: 'Reto de investigación breve.',
      actividadPractica: 'Actividad central del área.',
      secuencia: secuenciaVacia(),
      tallerTitulo: `Guía: ${tema || 'Actividad'}`,
      tallerContenido: '1. Contexto.\n2. Consigna.\n3. Desarrollo.\n4. Evidencia.\n5. Autoevaluación.'
    }
  };

  return { ...base, ...mapa[area] };
}

export function obtenerPlantillaMateria(
  asignatura: string | null | undefined,
  nivel: NivelPlaneacion,
  tema?: string | null
): PlantillaMateria {
  const area = detectarAreaMateria(asignatura, tema);
  const temaRef = (tema || asignatura || '').trim();
  return nivel === 'PRIMARIA' ? plantillaPrimaria(area, temaRef) : plantillaBachiller(area, temaRef);
}

/** Rellena solo campos vacíos con la plantilla de esa materia (no pisa lo ya escrito). */
export function aplicarPlantillaSiVacio(
  clase: PlaneacionClase,
  nivel: NivelPlaneacion,
  forzar = false
): PlaneacionClase {
  const plantilla = obtenerPlantillaMateria(clase.asignatura, nivel, clase.tema);
  const pick = (actual: string | null | undefined, sugerido: string) =>
    forzar || !String(actual || '').trim() ? sugerido : actual;

  const secuenciaVaciaOIncompleta =
    forzar ||
    !(clase.secuencia || []).some((s) => String(s.actividad || '').trim());

  return {
    ...clase,
    aprendizajeEsperado: pick(clase.aprendizajeEsperado, plantilla.aprendizajeEsperado),
    preguntaProblematizadora: pick(
      clase.preguntaProblematizadora,
      plantilla.preguntaProblematizadora
    ),
    saberesPrevios: pick(clase.saberesPrevios, plantilla.saberesPrevios),
    estandar: pick(clase.estandar, plantilla.estandar),
    dba: pick(clase.dba, plantilla.dba),
    evidencia: pick(clase.evidencia, plantilla.evidencia),
    criterios: pick(clase.criterios, plantilla.criterios),
    instrumento: pick(clase.instrumento, plantilla.instrumento),
    recursos: pick(clase.recursos, plantilla.recursos),
    refuerzo: pick(clase.refuerzo, plantilla.refuerzo),
    profundizacion: pick(clase.profundizacion, plantilla.profundizacion),
    actividadPractica: pick(clase.actividadPractica, plantilla.actividadPractica),
    tallerTitulo: pick(clase.tallerTitulo, plantilla.tallerTitulo),
    tallerContenido: pick(clase.tallerContenido, plantilla.tallerContenido),
    secuencia: secuenciaVaciaOIncompleta ? plantilla.secuencia : clase.secuencia
  };
}
