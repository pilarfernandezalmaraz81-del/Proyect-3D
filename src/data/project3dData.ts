import heroFacilityImg from '../assets/images/hero_industrial_3d_facility_1791193728809.jpg';
import servicePrototypingImg from '../assets/images/service_rapid_prototyping_1791193739629.jpg';
import serviceShortSeriesImg from '../assets/images/service_short_series_production_1791193749704.jpg';
import serviceQualityImg from '../assets/images/service_post_processing_quality_1791193762639.jpg';

export type Language = 'es' | 'en';

export interface MaterialSpec {
  id: string;
  nameEs: string;
  nameEn: string;
  techTag: 'FDM Industrial' | 'SLA / DLP Resina' | 'Compuesto Fibra';
  descriptionEs: string;
  descriptionEn: string;
  eurPerCm3: number;
  machineFactor: number;
  heatDeflectionC: number;
  tensileStrengthMPa: number;
  toleranceMm: string;
}

export interface QualitySpec {
  id: 'standard' | 'high' | 'pro';
  nameEs: string;
  nameEn: string;
  layerHeightMm: string;
  machineMultiplier: number;
  detailEs: string;
  detailEn: string;
}

export interface FinishSpec {
  id: 'raw' | 'sanded' | 'painted' | 'inserts';
  nameEs: string;
  nameEn: string;
  surchargeEurPerPiece: number;
  detailEs: string;
  detailEn: string;
}

export interface RalColorSpec {
  id: string;
  ralCode: string;
  nameEs: string;
  nameEn: string;
  hex: string;
}

export type OrderStageIndex = 0 | 1 | 2 | 3 | 4;

export interface ManufacturingOrder {
  id: string;
  orderCode: string;
  clientName: string;
  companyName: string;
  fileName: string;
  dimensionsMm: string;
  materialNameEs: string;
  materialNameEn: string;
  qualityLabelEs: string;
  qualityLabelEn: string;
  infillPercent: number;
  finishNameEs: string;
  finishNameEn: string;
  ralColor: string;
  quantity: number;
  totalWithVatEur: number;
  createdAt: string;
  estimatedDelivery: string;
  deliveryMethodEs: string;
  deliveryMethodEn: string;
  stageIndex: OrderStageIndex;
  engineerNotesEs: string;
  engineerNotesEn: string;
}

export const BRAND_IMAGES = {
  heroFacility: heroFacilityImg,
  servicePrototyping: servicePrototypingImg,
  serviceShortSeries: serviceShortSeriesImg,
  serviceQuality: serviceQualityImg,
};

// Calibrated so that 50 cm3 + PETG Profesional + Alta (0.12mm) + 40% infill + Sin acabado + 1 ud
// yields Material = 18.50 €, Fabricación (Horas Máquina) = 24.00 €, IVA (21%) = 8.93 €, TOTAL = 51.43 € (Exact match to Slide 5!)
export const INDUSTRIAL_MATERIALS: MaterialSpec[] = [
  {
    id: 'petg-pro',
    nameEs: 'PETG Profesional',
    nameEn: 'Professional PETG',
    techTag: 'FDM Industrial',
    descriptionEs: 'Equilibrio mecánico superior, resistencia química y apto para intemperie industrial.',
    descriptionEn: 'Superior mechanical balance, chemical resistance, and suitable for outdoor industrial use.',
    eurPerCm3: 0.37,
    machineFactor: 0.48,
    heatDeflectionC: 78,
    tensileStrengthMPa: 53,
    toleranceMm: '±0.15 mm',
  },
  {
    id: 'pla-tech',
    nameEs: 'PLA Técnico de Alta Rigidez',
    nameEn: 'High-Stiffness Technical PLA',
    techTag: 'FDM Industrial',
    descriptionEs: 'Prototipado rápido, validación dimensional, utillaje ligero y maquetas de ingeniería.',
    descriptionEn: 'Rapid prototyping, dimensional validation, lightweight jigs, and engineering mockups.',
    eurPerCm3: 0.28,
    machineFactor: 0.40,
    heatDeflectionC: 62,
    tensileStrengthMPa: 61,
    toleranceMm: '±0.15 mm',
  },
  {
    id: 'abs-ind',
    nameEs: 'ABS Industrial Estabilizado',
    nameEn: 'Stabilized Industrial ABS',
    techTag: 'FDM Industrial',
    descriptionEs: 'Alta tenacidad frente a impacto y estabilidad térmica en cámara calefactada a 95 °C.',
    descriptionEn: 'High impact toughness and thermal stability printed in a 95 °C heated chamber.',
    eurPerCm3: 0.44,
    machineFactor: 0.54,
    heatDeflectionC: 98,
    tensileStrengthMPa: 46,
    toleranceMm: '±0.20 mm',
  },
  {
    id: 'tpu-95a',
    nameEs: 'TPU 95A Elastómero Técnico',
    nameEn: 'TPU 95A Technical Elastomer',
    techTag: 'FDM Industrial',
    descriptionEs: 'Elastómero flexible resistente a abrasión, aceites y grasas para juntas, topes y fuelles.',
    descriptionEn: 'Abrasion, oil, and grease-resistant flexible elastomer for seals, dampers, and bellows.',
    eurPerCm3: 0.52,
    machineFactor: 0.62,
    heatDeflectionC: 74,
    tensileStrengthMPa: 39,
    toleranceMm: '±0.25 mm',
  },
  {
    id: 'pa12-cf',
    nameEs: 'PA12 Nylon + Fibra de Carbono (15%)',
    nameEn: 'PA12 Nylon + Carbon Fiber (15%)',
    techTag: 'Compuesto Fibra',
    descriptionEs: 'Poliamida reforzada con fibra de carbono para uso estructural extremo y sustitución metálica.',
    descriptionEn: 'Carbon-fiber reinforced polyamide for extreme structural loads and metal replacement.',
    eurPerCm3: 0.78,
    machineFactor: 0.72,
    heatDeflectionC: 155,
    tensileStrengthMPa: 92,
    toleranceMm: '±0.12 mm',
  },
  {
    id: 'resin-sla',
    nameEs: 'Resina Técnica Ingeniería SLA/DLP',
    nameEn: 'SLA/DLP Engineering Technical Resin',
    techTag: 'SLA / DLP Resina',
    descriptionEs: 'Acabado superficial isotrópico ultra-fino, ideal para micro-mecánica, carcasas estancas y conectores.',
    descriptionEn: 'Ultra-fine isotropic surface finish, ideal for micro-mechanics, watertight enclosures, and connectors.',
    eurPerCm3: 0.68,
    machineFactor: 0.66,
    heatDeflectionC: 88,
    tensileStrengthMPa: 65,
    toleranceMm: '±0.05 mm',
  },
];

export const QUALITY_LEVELS: QualitySpec[] = [
  {
    id: 'standard',
    nameEs: 'Estándar Industrial',
    nameEn: 'Industrial Standard',
    layerHeightMm: '0.20 mm',
    machineMultiplier: 0.85,
    detailEs: 'Óptima relación velocidad/resistencia para soportes y piezas estructurales.',
    detailEn: 'Optimal speed-to-strength ratio for brackets and structural components.',
  },
  {
    id: 'high',
    nameEs: 'Alta Precisión',
    nameEn: 'High Precision',
    layerHeightMm: '0.12 mm',
    machineMultiplier: 1.0,
    detailEs: 'Definición superior en encajes mecánicos, roscas y superficies curvas.',
    detailEn: 'Superior definition for mechanical fits, threads, and curved surfaces.',
  },
  {
    id: 'pro',
    nameEs: 'Profesional Ultra-Fina',
    nameEn: 'Ultra-Fine Professional',
    layerHeightMm: '0.05 mm',
    machineMultiplier: 1.35,
    detailEs: 'Acabado isotrópico de máxima resolución con líneas de capa casi imperceptibles.',
    detailEn: 'Maximum resolution isotropic finish with virtually invisible layer lines.',
  },
];

export const FINISH_OPTIONS: FinishSpec[] = [
  {
    id: 'raw',
    nameEs: 'Sin acabado (Bruto de máquina)',
    nameEn: 'Unfinished (As-printed)',
    surchargeEurPerPiece: 0,
    detailEs: 'Retirada de soportes e inspección dimensional básica en banco.',
    detailEn: 'Support removal and standard bench dimensional inspection.',
  },
  {
    id: 'sanded',
    nameEs: 'Granallado y Lijado Técnico',
    nameEn: 'Media Blasting & Technical Sanding',
    surchargeEurPerPiece: 6.5,
    detailEs: 'Homogeneizado superficial satinado mediante microesfera de vidrio y lijado.',
    detailEn: 'Homogenized satin surface via glass-bead blasting and wet sanding.',
  },
  {
    id: 'painted',
    nameEs: 'Pintado Industrial Poliuretano (RAL)',
    nameEn: 'Industrial Polyurethane Coating (RAL)',
    surchargeEurPerPiece: 14.0,
    detailEs: 'Imprimación epoxi + lacado poliuretano bicomponente resistente a UV y químicos.',
    detailEn: 'Epoxy primer + UV and chemical-resistant two-component polyurethane topcoat.',
  },
  {
    id: 'inserts',
    nameEs: 'Insertos Roscados en Caliente (Latón)',
    nameEn: 'Heat-Set Brass Threaded Inserts',
    surchargeEurPerPiece: 9.0,
    detailEs: 'Instalación de insertos metálicos M3/M4/M5 para unión atornillada de alto par.',
    detailEn: 'Installation of M3/M4/M5 brass inserts for high-torque bolted assemblies.',
  },
];

export const RAL_COLORS: RalColorSpec[] = [
  {
    id: 'ral-9011',
    ralCode: 'RAL 9011',
    nameEs: 'Negro Grafito Industrial',
    nameEn: 'Industrial Graphite Black',
    hex: '#1E242B',
  },
  {
    id: 'ral-7016',
    ralCode: 'RAL 7016',
    nameEs: 'Gris Antracita Técnico',
    nameEn: 'Technical Anthracite Grey',
    hex: '#38424B',
  },
  {
    id: 'ral-5015',
    ralCode: 'RAL 5015',
    nameEs: 'Azul Celeste Maquinaria',
    nameEn: 'Machinery Sky Blue',
    hex: '#0284C7',
  },
  {
    id: 'ral-9003',
    ralCode: 'RAL 9003',
    nameEs: 'Blanco Señal Laboratorio',
    nameEn: 'Laboratory Signal White',
    hex: '#E2E8F0',
  },
  {
    id: 'ral-2009',
    ralCode: 'RAL 2009',
    nameEs: 'Naranja Seguridad Industrial',
    nameEn: 'Industrial Safety Orange',
    hex: '#EA580C',
  },
  {
    id: 'ral-6018',
    ralCode: 'RAL 6018',
    nameEs: 'Verde Amarillento Automatización',
    nameEn: 'Automation Yellow Green',
    hex: '#16A34A',
  },
];

export const TRACEABILITY_STAGES = [
  {
    step: 1,
    es: 'Revisión',
    en: 'Technical Review',
    descEs: 'Verificación de malla STL/STEP, espesores mínimos y orientación de capa por ingeniería.',
    descEn: 'STL/STEP mesh verification, minimum wall thickness check, and build orientation setup.',
  },
  {
    step: 2,
    es: 'Aceptado',
    en: 'Approved',
    descEs: 'Presupuesto definitivo validado y asignación de lote en cola de impresión.',
    descEn: 'Final quote validated and batch assigned to the active print farm queue.',
  },
  {
    step: 3,
    es: 'Fabricación',
    en: 'In Production',
    descEs: 'Impresión aditiva en curso bajo control térmico en nuestra planta de Torrijos.',
    descEn: 'Additive manufacturing underway in thermally controlled chambers at our Torrijos facility.',
  },
  {
    step: 4,
    es: 'Control Calidad',
    en: 'Quality Control',
    descEs: 'Inspección dimensional con calibre digital, post-procesado y verificación mecánica.',
    descEn: 'Digital caliper dimensional metrology, post-processing, and mechanical inspection.',
  },
  {
    step: 5,
    es: 'Enviado',
    en: 'Dispatched',
    descEs: 'Embalaje técnico anti-impacto expedido 24/48h o listo para recogida en Pol. Ind. Torrijos.',
    descEn: 'Impact-protected packaging dispatched via 24/48h courier or ready for Torrijos plant pickup.',
  },
];

export const ORDER_LIFECYCLE_STAGES_8 = [
  { step: 1, es: '1. Solicitud recibida', en: '1. Request received', shortEs: 'Solicitud recibida', shortEn: 'Request received' },
  { step: 2, es: '2. En revisión', en: '2. In review', shortEs: 'En revisión', shortEn: 'In review' },
  { step: 3, es: '3. Presupuesto enviado', en: '3. Quote sent', shortEs: 'Presupuesto enviado', shortEn: 'Quote sent' },
  { step: 4, es: '4. Aceptado', en: '4. Approved', shortEs: 'Aceptado', shortEn: 'Approved' },
  { step: 5, es: '5. En fabricación', en: '5. In production', shortEs: 'En fabricación', shortEn: 'In production' },
  { step: 6, es: '6. Control de calidad', en: '6. Quality control', shortEs: 'Control de calidad', shortEn: 'Quality control' },
  { step: 7, es: '7. Enviado', en: '7. Dispatched', shortEs: 'Enviado', shortEn: 'Dispatched' },
  { step: 8, es: '8. Finalizado', en: '8. Completed', shortEs: 'Finalizado', shortEn: 'Completed' },
];

export const INITIAL_ORDERS: ManufacturingOrder[] = [
  {
    id: 'ord-8942',
    orderCode: 'PRJ-2026-8942',
    clientName: 'Juan Domínguez',
    companyName: 'Ingeniería Toledo S.L.',
    fileName: 'soporte_motor_v2.stl',
    dimensionsMm: '120 × 85 × 45 mm',
    materialNameEs: 'PLA Técnico Negro',
    materialNameEn: 'Technical Black PLA',
    qualityLabelEs: 'Estándar (0.20 mm)',
    qualityLabelEn: 'Standard (0.20 mm)',
    infillPercent: 30,
    finishNameEs: 'Sin acabado (Bruto de impresión)',
    finishNameEn: 'Unfinished (As-printed)',
    ralColor: 'Negro Industrial (Mate)',
    quantity: 1,
    totalWithVatEur: 42.96,
    createdAt: '05 Oct 2026 · 09:15',
    estimatedDelivery: '48 - 72 Horas',
    deliveryMethodEs: 'Salida desde Polígono Torrijos',
    deliveryMethodEn: 'Dispatch from Torrijos Industrial Park',
    stageIndex: 2, // Maps to 5. En fabricación in the 8-step lifecycle
    engineerNotesEs: 'Malla cerrada sin errores. Imprimiendo en bancada #04 en nuestra planta del Polígono Industrial de Torrijos.',
    engineerNotesEn: 'Manifold mesh verified. Printing on bay #04 at our Torrijos Industrial Park facility.',
  },
  {
    id: 'ord-088',
    orderCode: 'P3D-2026-088',
    clientName: 'Elena Vargas',
    companyName: 'AgroMecánica Toledo S.A.',
    fileName: 'corona_reductora_planetaria_m2.stl',
    dimensionsMm: '98 × 98 × 64 mm',
    materialNameEs: 'PA12 Nylon + Fibra de Carbono (15%)',
    materialNameEn: 'PA12 Nylon + Carbon Fiber (15%)',
    qualityLabelEs: 'Alta Precisión (0.12 mm)',
    qualityLabelEn: 'High Precision (0.12 mm)',
    infillPercent: 80,
    finishNameEs: 'Granallado y Lijado Técnico',
    finishNameEn: 'Media Blasting & Technical Sanding',
    ralColor: 'RAL 9011 · Negro Grafito Industrial',
    quantity: 12,
    totalWithVatEur: 1248.6,
    createdAt: '02 Oct 2026 · 16:40',
    estimatedDelivery: '05 Oct 2026',
    deliveryMethodEs: 'Envío Urgente 24h (Toledo)',
    deliveryMethodEn: '24h Express Courier (Toledo)',
    stageIndex: 3, // Control de Calidad
    engineerNotesEs: 'Lote de 12 unidades recocidas en horno a 80 °C durante 4h. Verificación de paso dental superada.',
    engineerNotesEn: 'Batch of 12 units annealed at 80 °C for 4h. Gear tooth pitch metrology passed.',
  },
  {
    id: 'ord-084',
    orderCode: 'P3D-2026-084',
    clientName: 'Javier Ruiz',
    companyName: 'Particular / Proyecto Restauración',
    fileName: 'impulsor_bomba_centrifuga_dn110.step',
    dimensionsMm: '110 × 110 × 38 mm',
    materialNameEs: 'Resina Técnica Ingeniería SLA/DLP',
    materialNameEn: 'SLA/DLP Engineering Technical Resin',
    qualityLabelEs: 'Profesional Ultra-Fina (0.05 mm)',
    qualityLabelEn: 'Ultra-Fine Professional (0.05 mm)',
    infillPercent: 100,
    finishNameEs: 'Pintado Industrial Poliuretano (RAL)',
    finishNameEn: 'Industrial Polyurethane Coating (RAL)',
    ralColor: 'RAL 5015 · Azul Celeste Maquinaria',
    quantity: 2,
    totalWithVatEur: 146.9,
    createdAt: '29 Sep 2026 · 11:20',
    estimatedDelivery: '02 Oct 2026',
    deliveryMethodEs: 'Envío Nacional 24/48h (Madrid)',
    deliveryMethodEn: 'National 24/48h Shipping (Madrid)',
    stageIndex: 4, // Enviado
    engineerNotesEs: 'Curado UV completo y ensayo de equilibrado estático realizado. Expedición entregada.',
    engineerNotesEn: 'Full UV post-curing and static balance check completed. Shipment delivered.',
  },
];

export interface SlideItem {
  number: number;
  tagEs: string;
  tagEn: string;
  titleEs: string;
  titleEn: string;
  subtitleEs: string;
  subtitleEn: string;
  theme: 'dark' | 'light';
  targetSection: 'hero' | 'services' | 'quoter' | 'portal' | 'contact' | 'chat';
}

export const PRESENTATION_SLIDES: SlideItem[] = [
  {
    number: 1,
    tagEs: 'PROJECT 3D · TORRIJOS, TOLEDO',
    tagEn: 'PROJECT 3D · TORRIJOS, TOLEDO',
    titleEs: 'Fabricación Industrial Avanzada e Impresión 3D de Alta Precisión',
    titleEn: 'Advanced Industrial Manufacturing & High-Precision 3D Printing',
    subtitleEs:
      'Plataforma integral para empresas y particulares. Sube tu STL, configura tu pieza y obtén presupuestos orientativos instantáneos en Avda. de los Trabajadores, Pol. Ind. Torrijos.',
    subtitleEn:
      'Comprehensive platform for businesses and individuals. Upload your STL, configure your part, and get instant indicative quotes at Avda. de los Trabajadores, Torrijos Industrial Park.',
    theme: 'dark',
    targetSection: 'hero',
  },
  {
    number: 2,
    tagEs: 'Estructura Web',
    tagEn: 'Web Architecture',
    titleEs: 'Menú Principal y Accesos Clave',
    titleEn: 'Main Navigation & Core Access Points',
    subtitleEs:
      'Navegación visible (Inicio, Servicios, Cómo funciona, Presupuesto, Área de clientes, Contacto), CTA destacado "Solicitar Presupuesto" y soporte multilingüe Español / Inglés.',
    subtitleEn:
      'Clear navigation (Home, Services, How it works, Quoter, Client Portal, Contact), high-visibility "Request Quote" CTA, and full Spanish / English interoperability.',
    theme: 'light',
    targetSection: 'services',
  },
  {
    number: 3,
    tagEs: 'Aplicación Web 3D',
    tagEn: '3D Web Application',
    titleEs: 'Paso 1 y 2: Subida de STL y Análisis Geométrico',
    titleEn: 'Step 1 & 2: STL Upload & Geometric Analysis',
    subtitleEs:
      'Formatos compatibles: .STL, .STEP, .OBJ. Validación automática de integridad, cálculo de dimensiones (120 × 85 × 45 mm), volumen real, cantidad de piezas y complejidad geométrica.',
    subtitleEn:
      'Supported formats: .STL, .STEP, .OBJ. Automatic mesh integrity validation, bounding box dimensions (120 × 85 × 45 mm), exact volume, quantity, and geometric feasibility.',
    theme: 'light',
    targetSection: 'quoter',
  },
  {
    number: 4,
    tagEs: 'Aplicación Web 3D',
    tagEn: '3D Web Application',
    titleEs: 'Paso 3: Parámetros de Fabricación e Impresión',
    titleEn: 'Step 3: Manufacturing & Printing Parameters',
    subtitleEs:
      'Selección de Material Industrial (PLA, PETG, ABS, TPU, Nylon CF, Resina), Calidad (Estándar / Alta / Profesional), Relleno estructural (10% a 100%) y Acabados con gama de color RAL.',
    subtitleEn:
      'Industrial Material selection (PLA, PETG, ABS, TPU, Carbon Nylon, Resin), Quality (Standard / High / Professional), Structural Infill (10% to 100%), and Finishes with RAL colors.',
    theme: 'light',
    targetSection: 'quoter',
  },
  {
    number: 5,
    tagEs: 'Cotizador Inteligente',
    tagEn: 'Smart Quoter',
    titleEs: 'Desglose de Presupuesto Orientativo',
    titleEn: 'Indicative Quote Breakdown',
    subtitleEs:
      'Ejemplo base PETG Profesional: Coste de Material (18,50 €) + Coste Estimado de Fabricación / Horas Máquina (24,00 €) + IVA 21% (8,93 €) = TOTAL ESTIMADO CON IVA: 51,43 €. Sujeto a revisión técnica definitiva.',
    subtitleEn:
      'Base Professional PETG example: Material Cost (€18.50) + Estimated Machine Hours (€24.00) + 21% VAT (€8.93) = TOTAL ESTIMATED INCL. VAT: €51.43. Subject to final engineering review.',
    theme: 'light',
    targetSection: 'quoter',
  },
  {
    number: 6,
    tagEs: 'Área Privada',
    tagEn: 'Private Client Portal',
    titleEs: 'Trazabilidad y Estado de Fabricación',
    titleEn: 'Manufacturing Traceability & Order Status',
    subtitleEs:
      'Seguimiento en tiempo real como el Pedido #P3D-2026-089 a través de 5 hitos verificados: 1. Revisión · 2. Aceptado · 3. Fabricación · 4. Control Calidad · 5. Enviado.',
    subtitleEn:
      'Real-time tracking such as Order #P3D-2026-089 across 5 verified milestones: 1. Review · 2. Approved · 3. In Production · 4. Quality Control · 5. Dispatched.',
    theme: 'light',
    targetSection: 'portal',
  },
  {
    number: 7,
    tagEs: 'Asistente 24/7',
    tagEn: '24/7 Assistant',
    titleEs: 'Chatbot Informativo en Español e Inglés',
    titleEn: 'Informative Chatbot in Spanish & English',
    subtitleEs:
      'Respuestas automatizadas sobre materiales, plazos en Torrijos, formatos de archivo y área de clientes, con protocolo de Derivación Humana directa sin inventar información.',
    subtitleEn:
      'Automated responses on materials, Torrijos lead times, file formats, and client portal workflow, with strict Human Engineer Escalation without hallucinating specs.',
    theme: 'light',
    targetSection: 'chat',
  },
  {
    number: 8,
    tagEs: 'Ubicación y Contacto',
    tagEn: 'Location & Contact',
    titleEs: 'Project 3D en el Polígono Industrial de Torrijos',
    titleEn: 'Project 3D at Torrijos Industrial Park',
    subtitleEs:
      'Avenida de los Trabajadores, Polígono Industrial de Torrijos, Torrijos, Toledo, España. Fabricación industrial bajo demanda con máxima confidencialidad en archivos STL y RGPD.',
    subtitleEn:
      'Avenida de los Trabajadores, Polígono Industrial de Torrijos, Torrijos, Toledo, Spain. On-demand industrial manufacturing with strict STL confidentiality and GDPR compliance.',
    theme: 'dark',
    targetSection: 'contact',
  },
];
