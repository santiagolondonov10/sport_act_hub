export interface OportunidadInversion {
  id: string;
  nombre: string;
  propiedad: string;
  tipo: 'Equity' | 'Debt' | 'Revenue Share';
  descripcion: string;
  montoMinimo: number;
  montoTotal: number;
  montoRecaudado: number;
  retornoEsperado: number;
  tiempoInversion: number;
  logo: string;
  estado: 'Abierto' | 'Cerrado' | 'En Proceso';
  sector: string;
  ubicacion: string;
  progresoRecaudacion: number;
  invertidores: number;
  riesgo: 'Bajo' | 'Medio' | 'Alto';
  descripcionDetallada: string;
}

export const oportunidadesInversion: OportunidadInversion[] = [
  {
    id: 'inv-001',
    nombre: 'Leones FC - Expansión de Infraestructura',
    propiedad: 'Leones FC',
    tipo: 'Equity',
    descripcion: 'Inversión en expansión del estadio y modernización de instalaciones',
    montoMinimo: 10000000,
    montoTotal: 100000000,
    montoRecaudado: 65000000,
    retornoEsperado: 18,
    tiempoInversion: 5,
    logo: '🦁',
    estado: 'En Proceso',
    sector: 'Fútbol',
    ubicacion: 'Medellín, Colombia',
    progresoRecaudacion: 65,
    invertidores: 12,
    riesgo: 'Medio',
    descripcionDetallada: 'Leones FC busca capital para expandir su estadio y modernizar sus instalaciones. Este proyecto incluye la construcción de nuevas zonas VIP, mejoría en accesos y servicios, lo que se espera genere mayores ingresos por eventos. Con una proyección de crecimiento del 18% anual durante 5 años.'
  },
  {
    id: 'inv-002',
    nombre: 'Academia Deportiva Norte - Programa de Talentos',
    propiedad: 'Academia Deportiva Norte',
    tipo: 'Revenue Share',
    descripcion: 'Ingresos por derechos de formación y transferencias de jugadores',
    montoMinimo: 5000000,
    montoTotal: 50000000,
    montoRecaudado: 35000000,
    retornoEsperado: 25,
    tiempoInversion: 3,
    logo: '🎓',
    estado: 'En Proceso',
    sector: 'Formación',
    ubicacion: 'Bogotá, Colombia',
    progresoRecaudacion: 70,
    invertidores: 18,
    riesgo: 'Alto',
    descripcionDetallada: 'Academia especializada en formación de jóvenes talentos con enfoque en fútbol. Los retornos provienen de transferencias internacionales y derechos de los jugadores formados. Histórico de éxito con varios jugadores en equipos profesionales.'
  },
  {
    id: 'inv-003',
    nombre: 'Evento Deportivo Internacional 2025',
    propiedad: 'Organizadores de Eventos SA',
    tipo: 'Debt',
    descripcion: 'Financiamiento para la organización de campeonato internacional',
    montoMinimo: 20000000,
    montoTotal: 200000000,
    montoRecaudado: 80000000,
    retornoEsperado: 12,
    tiempoInversion: 2,
    logo: '🏆',
    estado: 'En Proceso',
    sector: 'Eventos',
    ubicacion: 'Cali, Colombia',
    progresoRecaudacion: 40,
    invertidores: 8,
    riesgo: 'Bajo',
    descripcionDetallada: 'Organización de campeonato deportivo internacional con participación de equipos de 15 países. Retornos fijos garantizados por derechos de transmisión y patrocinios. Evento ya confirmado con contrato de televisión asegurado.'
  },
  {
    id: 'inv-004',
    nombre: 'Plataforma de Streaming Deportivo',
    propiedad: 'SportStream Colombia',
    tipo: 'Equity',
    descripcion: 'Inversión en tecnología y contenido de transmisión deportiva en vivo',
    montoMinimo: 15000000,
    montoTotal: 150000000,
    montoRecaudado: 45000000,
    retornoEsperado: 22,
    tiempoInversion: 4,
    logo: '📺',
    estado: 'Abierto',
    sector: 'Tecnología',
    ubicacion: 'Medellín, Colombia',
    progresoRecaudacion: 30,
    invertidores: 5,
    riesgo: 'Medio',
    descripcionDetallada: 'Plataforma de streaming especializada en transmisión de eventos deportivos regionales. Con crecimiento del 35% mensual en suscriptores y partnerships con 20 equipos profesionales. Proyección de rentabilidad en 18 meses.'
  },
  {
    id: 'inv-005',
    nombre: 'Centro de Entrenamientos de Alto Rendimiento',
    propiedad: 'Elite Training Center',
    tipo: 'Revenue Share',
    descripcion: 'Ingresos por servicios de entrenamiento y alquiler de instalaciones',
    montoMinimo: 8000000,
    montoTotal: 80000000,
    montoRecaudado: 48000000,
    retornoEsperado: 20,
    tiempoInversion: 3,
    logo: '💪',
    estado: 'Abierto',
    sector: 'Entrenamiento',
    ubicacion: 'Cartagena, Colombia',
    progresoRecaudacion: 60,
    invertidores: 14,
    riesgo: 'Bajo',
    descripcionDetallada: 'Centro de entrenamientos de clase mundial con servicios de asesoría nutricional, fisioterapia y análisis biomecánico. Ingresos recurrentes de más de 200 clientes mensuales y convenios con equipos profesionales.'
  }
];
