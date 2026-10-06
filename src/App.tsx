import React, { useState, useMemo, useRef } from 'react';
import {
  BRAND_IMAGES,
  INDUSTRIAL_MATERIALS,
  QUALITY_LEVELS,
  FINISH_OPTIONS,
  RAL_COLORS,
  ORDER_LIFECYCLE_STAGES_8,
  INITIAL_ORDERS,
  Language,
  ManufacturingOrder,
} from './data/project3dData';
import {
  createIndustrialPresetModels,
  parseCadFileBuffer,
  ParsedCadModel,
} from './utils/stlParser';
import { CadViewport3D } from './components/CadViewport3D';
import { ChatbotDrawer } from './components/ChatbotDrawer';
import { SlideDeckModal } from './components/SlideDeckModal';
import {
  Upload,
  Check,
  FileText,
  ArrowRight,
  Download,
  ShieldCheck,
  MapPin,
  Presentation,
} from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('es');
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [isSlideDeckOpen, setIsSlideDeckOpen] = useState<boolean>(false);

  const presetModels = useMemo(() => createIndustrialPresetModels(), []);
  const [activeModel, setActiveModel] = useState<ParsedCadModel>(presetModels[0]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Step 2 Manufacturing Parameters (defaults match 12.50 € + 18.00 € + 5.00 € = 35.50 € + 7.46 € IVA = 42.96 €)
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('pla-pro');
  const [selectedQualityId, setSelectedQualityId] = useState<'standard' | 'high' | 'pro'>('standard');
  const [infillPercent, setInfillPercent] = useState<number>(20);
  const [selectedFinishId, setSelectedFinishId] = useState<'raw' | 'sanded' | 'painted' | 'inserts'>('raw');
  const [selectedRalId, setSelectedRalId] = useState<string>('ral-9005');
  const [quantity, setQuantity] = useState<number>(1);
  const [deliveryOption, setDeliveryOption] = useState<'pickup' | 'courier'>('pickup');
  const [welcomeDiscountActive, setWelcomeDiscountActive] = useState<boolean>(false);
  const [hasUploadedCustomFile, setHasUploadedCustomFile] = useState<boolean>(false);

  // Client Portal Orders
  const [orders, setOrders] = useState<ManufacturingOrder[]>(INITIAL_ORDERS);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(INITIAL_ORDERS[0].id);
  const [portalTab, setPortalTab] = useState<'pedidos' | 'archivos' | 'facturas' | 'soporte'>('pedidos');
  const [isPortalLoggedIn, setIsPortalLoggedIn] = useState<boolean>(true);
  const [orderLifecycleStepMap, setOrderLifecycleStepMap] = useState<Record<string, number>>({
    'ord-8942': 5,
    'ord-088': 6,
    'ord-084': 8,
  });

  // Definitive Quote Request Form
  const [showRequestForm, setShowRequestForm] = useState<boolean>(false);
  const [clientNameInput, setClientNameInput] = useState<string>('');
  const [companyNameInput, setCompanyNameInput] = useState<string>('');
  const [clientEmailInput, setClientEmailInput] = useState<string>('');
  const [ndaAccepted, setNdaAccepted] = useState<boolean>(true);
  const [quoteSubmittedOrderCode, setQuoteSubmittedOrderCode] = useState<string | null>(null);

  // Contact Form State
  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactCompany, setContactCompany] = useState<string>('');
  const [contactMessage, setContactMessage] = useState<string>('');
  const [contactSuccess, setContactSuccess] = useState<boolean>(false);

  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const selectedMaterial = useMemo(
    () => INDUSTRIAL_MATERIALS.find((m) => m.id === selectedMaterialId) || INDUSTRIAL_MATERIALS[0],
    [selectedMaterialId]
  );
  const selectedQuality = useMemo(
    () => QUALITY_LEVELS.find((q) => q.id === selectedQualityId) || QUALITY_LEVELS[1],
    [selectedQualityId]
  );
  const selectedFinish = useMemo(
    () => FINISH_OPTIONS.find((f) => f.id === selectedFinishId) || FINISH_OPTIONS[0],
    [selectedFinishId]
  );
  const selectedRal = useMemo(
    () => RAL_COLORS.find((c) => c.id === selectedRalId) || RAL_COLORS[1],
    [selectedRalId]
  );

  const quoteBreakdown = useMemo(() => {
    const volRatio = activeModel.volumeCm3 / 185.0;
    const materialRateMap: Record<string, number> = {
      'pla-pro': 1.0,
      'petg-pro': 1.28,
      'abs-ind': 1.38,
      'tpu-95a': 1.65,
      'pa12-cf': 2.45,
      'resin-sla': 2.15,
    };
    const machineRateMap: Record<string, number> = {
      'pla-pro': 1.0,
      'petg-pro': 1.15,
      'abs-ind': 1.25,
      'tpu-95a': 1.4,
      'pa12-cf': 1.75,
      'resin-sla': 1.6,
    };
    const qualityMultMap: Record<'standard' | 'high' | 'pro', number> = {
      standard: 1.0,
      high: 1.22,
      pro: 1.5,
    };

    // Normalized so infillPercent === 20 gives 1.0x (12.50 € material, 18.00 € machine)
    const infillMaterialScale = 1.0 + (infillPercent - 20) * 0.008;
    const infillMachineScale = 1.0 + (infillPercent - 20) * 0.005;

    const unitMaterialEur = +(
      12.5 *
      volRatio *
      (materialRateMap[selectedMaterial.id] || 1.0) *
      infillMaterialScale
    ).toFixed(2);

    const unitMachineEur = +(
      18.0 *
      volRatio *
      (machineRateMap[selectedMaterial.id] || 1.0) *
      (qualityMultMap[selectedQuality.id] || 1.0) *
      infillMachineScale
    ).toFixed(2);

    const basePrepEur = 5.0;
    const unitFinishEur = selectedFinish.surchargeEurPerPiece;
    const volumeDiscountRate =
      quantity >= 100 ? 0.25 : quantity >= 50 ? 0.2 : quantity >= 10 ? 0.1 : 0;
    const batchDiscountRate = Math.max(
      volumeDiscountRate,
      welcomeDiscountActive ? 0.15 : 0
    );
    const discountLabelEs =
      welcomeDiscountActive && batchDiscountRate === 0.15
        ? 'Plan Bienvenida 1er STL (-15%)'
        : quantity >= 100
        ? 'Escala Volumen 100+ uds (-25% · A medida)'
        : `Descuento Escala por Volumen (-${Math.round(batchDiscountRate * 100)}%)`;
    const discountLabelEn =
      welcomeDiscountActive && batchDiscountRate === 0.15
        ? 'Welcome Plan 1st STL (-15%)'
        : quantity >= 100
        ? 'Volume Scale 100+ units (-25% · Custom)'
        : `Volume Scale Discount (-${Math.round(batchDiscountRate * 100)}%)`;

    const rawMaterialTotal = +(unitMaterialEur * quantity).toFixed(2);
    const rawMachineTotal = +(unitMachineEur * quantity).toFixed(2);
    const finishTotal = +(basePrepEur + unitFinishEur * quantity).toFixed(2);
    const shippingEur = deliveryOption === 'courier' ? 6.5 : 0;

    const subtotalBeforeDiscount = +(rawMaterialTotal + rawMachineTotal + finishTotal).toFixed(2);
    const discountEur = +(subtotalBeforeDiscount * batchDiscountRate).toFixed(2);
    const netTaxableEur = +(subtotalBeforeDiscount - discountEur + shippingEur).toFixed(2);
    const vatEur = +(netTaxableEur * 0.21).toFixed(2);
    const totalWithVatEur = +(netTaxableEur + vatEur).toFixed(2);

    return {
      rawMaterialTotal,
      rawMachineTotal,
      finishTotal,
      shippingEur,
      batchDiscountRate,
      discountLabelEs,
      discountLabelEn,
      discountEur,
      subtotalBeforeDiscount,
      netTaxableEur,
      vatEur,
      totalWithVatEur,
    };
  }, [
    activeModel.volumeCm3,
    selectedMaterial,
    selectedQuality,
    infillPercent,
    selectedFinish,
    quantity,
    deliveryOption,
    welcomeDiscountActive,
  ]);

  const formatEur = (val: number) =>
    val.toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' €';

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFileUpload = async (file: File | undefined, jumpToQuoter = false) => {
    if (!file) return;
    setUploadError(null);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['stl', 'step', 'stp', 'obj'].includes(ext)) {
      setUploadError(
        lang === 'es'
          ? 'Formato no soportado. Sube un archivo .STL, .STEP o .OBJ.'
          : 'Unsupported file format. Please upload an .STL, .STEP, or .OBJ file.'
      );
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseCadFileBuffer(buffer, file.name);
      setActiveModel(parsed);
      setHasUploadedCustomFile(true);
      setQuoteSubmittedOrderCode(null);
      if (jumpToQuoter) {
        scrollToSection('presupuesto');
      }
    } catch {
      setUploadError(
        lang === 'es'
          ? 'No se pudo analizar la malla del archivo. Verifica que el STL sea válido.'
          : 'Could not parse file mesh. Please verify the STL integrity.'
      );
    }
  };

  const handleCreateDefinitiveQuoteOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientNameInput.trim() || !clientEmailInput.trim()) return;

    const nextSeq = 90 + orders.length - 3;
    const newOrderCode = `P3D-2026-0${nextSeq}`;
    const newOrder: ManufacturingOrder = {
      id: `ord-${Date.now()}`,
      orderCode: newOrderCode,
      clientName: clientNameInput.trim(),
      companyName:
        companyNameInput.trim() || (lang === 'es' ? 'Cliente Particular' : 'Private Client'),
      fileName: activeModel.fileName,
      dimensionsMm: `${activeModel.dimensionsMm.x} × ${activeModel.dimensionsMm.y} × ${activeModel.dimensionsMm.z} mm`,
      materialNameEs: selectedMaterial.nameEs,
      materialNameEn: selectedMaterial.nameEn,
      qualityLabelEs: `${selectedQuality.nameEs} (${selectedQuality.layerHeightMm})`,
      qualityLabelEn: `${selectedQuality.nameEn} (${selectedQuality.layerHeightMm})`,
      infillPercent,
      finishNameEs: selectedFinish.nameEs,
      finishNameEn: selectedFinish.nameEn,
      ralColor: `${selectedRal.ralCode} · ${
        lang === 'es' ? selectedRal.nameEs : selectedRal.nameEn
      }`,
      quantity,
      totalWithVatEur: quoteBreakdown.totalWithVatEur,
      createdAt: lang === 'es' ? 'Hoy · Recién registrado' : 'Today · Just registered',
      estimatedDelivery:
        deliveryOption === 'pickup'
          ? lang === 'es'
            ? '24–48h laborables (Torrijos)'
            : '24–48 business hrs (Torrijos)'
          : lang === 'es'
          ? '48–72h laborables (Envío Nacional)'
          : '48–72 business hrs (National Courier)',
      deliveryMethodEs:
        deliveryOption === 'pickup'
          ? 'Recogida en Planta (Pol. Ind. Torrijos)'
          : 'Envío Urgente 24/48h Península',
      deliveryMethodEn:
        deliveryOption === 'pickup'
          ? 'Plant Pickup (Torrijos Industrial Park)'
          : '24/48h Express Courier',
      stageIndex: 0,
      engineerNotesEs:
        'Archivo recibido bajo protocolo de confidencialidad STL. En cola para validación de malla definitiva por ingeniería en Torrijos.',
      engineerNotesEn:
        'File received under STL confidentiality protocol. Queued for final mesh validation by our Torrijos engineering team.',
    };

    setOrders((prev) => [newOrder, ...prev]);
    setOrderLifecycleStepMap((prev) => ({ ...prev, [newOrder.id]: 2 }));
    setSelectedOrderId(newOrder.id);
    setQuoteSubmittedOrderCode(newOrderCode);
    setShowRequestForm(false);
  };

  const handleDownloadQuoteSheet = () => {
    const content = [
      '====================================================================',
      'PROJECT 3D — FICHA DE PRESUPUESTO ORIENTATIVO DE FABRICACIÓN ADITIVA',
      'Avda. de los Trabajadores · Pol. Ind. Torrijos · 45500 Torrijos (Toledo)',
      '====================================================================',
      `Fecha de emisión: ${new Date().toISOString().slice(0, 10)}`,
      `Archivo 3D: ${activeModel.fileName} (${activeModel.format})`,
      `Dimensiones (X × Y × Z): ${activeModel.dimensionsMm.x} × ${activeModel.dimensionsMm.y} × ${activeModel.dimensionsMm.z} mm`,
      `Volumen Geométrico: ${activeModel.volumeCm3.toFixed(2)} cm³`,
      `Superficie: ${activeModel.surfaceAreaCm2.toFixed(1)} cm²`,
      '--------------------------------------------------------------------',
      `Material Seleccionado: ${selectedMaterial.nameEs}`,
      `Calidad de Impresión: ${selectedQuality.nameEs} (${selectedQuality.layerHeightMm})`,
      `Relleno Estructural (Infill): ${infillPercent}%`,
      `Acabado Superficial: ${selectedFinish.nameEs}`,
      `Color Industrial: ${selectedRal.ralCode} - ${selectedRal.nameEs}`,
      `Cantidad de Piezas: ${quantity} ud(s)`,
      '--------------------------------------------------------------------',
      `Coste de Material: ${formatEur(quoteBreakdown.rawMaterialTotal)}`,
      `Coste Estimado de Fabricación (Horas Máquina): ${formatEur(quoteBreakdown.rawMachineTotal)}`,
      quoteBreakdown.finishTotal > 0
        ? `Acabado Post-Procesado: ${formatEur(quoteBreakdown.finishTotal)}`
        : null,
      quoteBreakdown.discountEur > 0
        ? `Descuento por Serie Corta: -${formatEur(quoteBreakdown.discountEur)}`
        : null,
      quoteBreakdown.shippingEur > 0
        ? `Logística / Envío: ${formatEur(quoteBreakdown.shippingEur)}`
        : null,
      `Base Imponible: ${formatEur(quoteBreakdown.netTaxableEur)}`,
      `IVA (21%): ${formatEur(quoteBreakdown.vatEur)}`,
      `TOTAL ESTIMADO CON IVA: ${formatEur(quoteBreakdown.totalWithVatEur)}`,
      '--------------------------------------------------------------------',
      '* NOTA LEGAL: Presupuesto orientativo sujeto a revisión técnica definitiva',
      'del archivo por el equipo de ingeniería de Project 3D en Torrijos.',
      'Confidencialidad industrial garantizada (RGPD / Protección de ficheros CAD).',
    ]
      .filter(Boolean)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Presupuesto_Project3D_${activeModel.fileName.replace(/\.[^.]+$/, '')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || orders[0],
    [orders, selectedOrderId]
  );

  const activeOrderStep8 = useMemo(
    () => (activeOrder ? orderLifecycleStepMap[activeOrder.id] || 5 : 5),
    [activeOrder, orderLifecycleStepMap]
  );

  const handleDownloadOrderInvoice = (ord: ManufacturingOrder) => {
    const content = [
      '====================================================================',
      'PROJECT 3D — FACTURA PROFORMA / PRESUPUESTO INDUSTRIAL',
      'Avda. de los Trabajadores · Pol. Ind. Torrijos · 45500 Torrijos (Toledo)',
      '====================================================================',
      `Código de Pedido: #${ord.orderCode}`,
      `Cliente: ${ord.clientName} (${ord.companyName})`,
      `Fecha: ${ord.createdAt}`,
      '--------------------------------------------------------------------',
      `Archivo Procesado: ${ord.fileName}`,
      `Dimensiones: ${ord.dimensionsMm}`,
      `Material: ${ord.materialNameEs} (Relleno ${ord.infillPercent}%)`,
      `Calidad: ${ord.qualityLabelEs}`,
      `Acabado: ${ord.finishNameEs}`,
      `Unidades: ${ord.quantity}`,
      `Plazo Estimado: ${ord.estimatedDelivery} (${ord.deliveryMethodEs})`,
      '--------------------------------------------------------------------',
      `IMPORTE TOTAL (IVA 21% Incluido): ${formatEur(ord.totalWithVatEur)}`,
      '====================================================================',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Factura_Project3D_${ord.orderCode}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSlideNavigate = (
    target: 'hero' | 'services' | 'quoter' | 'portal' | 'contact' | 'chat'
  ) => {
    if (target === 'chat') {
      setIsChatbotOpen(true);
      return;
    }
    const map: Record<string, string> = {
      hero: 'inicio',
      services: 'servicios',
      quoter: 'presupuesto',
      portal: 'clientes',
      contact: 'contacto',
    };
    scrollToSection(map[target] || 'inicio');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* 1. MENÚ PRINCIPAL (3-Zone Top Bar Contract) */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="#inicio"
            className="font-display text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            PROJECT <span className="text-orange-500">3D</span>
          </a>

          {/* Zone 2: Navegación Escritorio */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a
              href="#inicio"
              className="hover:text-orange-400 transition-colors whitespace-nowrap"
            >
              {lang === 'es' ? 'Inicio' : 'Home'}
            </a>
            <a
              href="#servicios"
              className="hover:text-orange-400 transition-colors whitespace-nowrap"
            >
              {lang === 'es' ? 'Servicios' : 'Services'}
            </a>
            <a
              href="#proceso"
              className="hover:text-orange-400 transition-colors whitespace-nowrap"
            >
              {lang === 'es' ? 'Cómo funciona' : 'How it works'}
            </a>
            <a
              href="#ofertas"
              className="hover:text-orange-400 transition-colors whitespace-nowrap"
            >
              {lang === 'es' ? 'Ofertas' : 'Offers'}
            </a>
            <a
              href="#presupuesto"
              className="hover:text-orange-400 transition-colors whitespace-nowrap"
            >
              {lang === 'es' ? 'Presupuesto' : 'Quoter'}
            </a>
            <a
              href="#clientes"
              className="hover:text-orange-400 transition-colors whitespace-nowrap"
            >
              {lang === 'es' ? 'Área de clientes' : 'Client Portal'}
            </a>
            <a
              href="#contacto"
              className="hover:text-orange-400 transition-colors whitespace-nowrap"
            >
              {lang === 'es' ? 'Contacto' : 'Contact'}
            </a>
          </nav>

          {/* Zone 3: Idioma + Botón Destacado */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLang((prev) => (prev === 'es' ? 'en' : 'es'))}
              className="px-3 py-2 text-xs font-mono font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
              aria-label={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            >
              {lang === 'es' ? 'ES · EN' : 'EN · ES'}
            </button>
            <a
              href="#presupuesto"
              className="bg-orange-600 hover:bg-orange-500 text-white font-semibold px-5 py-2.5 rounded-lg shadow-lg shadow-orange-600/30 transition-all duration-200 text-xs sm:text-sm whitespace-nowrap shrink-0"
            >
              {lang === 'es' ? 'Solicitar Presupuesto' : 'Request Quote'}
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* 2. PÁGINA DE INICIO - HERO SECTION */}
        <section
          id="inicio"
          className="relative pt-20 pb-20 md:pt-28 md:pb-28 overflow-hidden border-b border-slate-800/60"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,88,12,0.15),transparent_50%)] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center md:text-left">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-mono text-orange-400">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>Polígono Industrial de Torrijos, Toledo</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-400">Avda. de los Trabajadores</span>
                </div>

                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12] balance-text">
                  {lang === 'es' ? (
                    <>
                      Fabricación aditiva e{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                        industrial de alta precisión
                      </span>
                    </>
                  ) : (
                    <>
                      High-precision{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                        industrial additive manufacturing
                      </span>
                    </>
                  )}
                </h1>

                <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto md:mx-0 leading-relaxed">
                  {lang === 'es'
                    ? 'Transformamos tus diseños en piezas funcionales y prototipos industriales. Sube tu archivo STL, configura los parámetros y obtén un presupuesto orientativo inmediato con la garantía de Project 3D.'
                    : 'We transform your CAD designs into functional parts and industrial prototypes. Upload your STL file, configure parameters, and get an instant indicative quote backed by Project 3D in Torrijos.'}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-2">
                  <a
                    href="#presupuesto"
                    className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-orange-600/30 transition-all text-center whitespace-nowrap"
                  >
                    {lang === 'es' ? 'Subir archivo STL' : 'Upload STL File'}
                  </a>
                  <a
                    href="#servicios"
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold px-8 py-3.5 rounded-xl transition-all text-center whitespace-nowrap"
                  >
                    {lang === 'es' ? 'Conocer servicios' : 'Explore Services'}
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsSlideDeckOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-slate-900/70 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium px-5 py-3.5 rounded-xl transition-all text-sm whitespace-nowrap"
                  >
                    <Presentation className="w-4 h-4 text-orange-400" />
                    <span>{lang === 'es' ? 'Ver Presentación' : 'Slide Deck'}</span>
                  </button>
                </div>
              </div>

              {/* Tarjeta Visual Industrial Interactiva (Soporta Drag & Drop real de archivos .STL) */}
              <div className="lg:col-span-5 relative">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFileUpload(e.dataTransfer.files?.[0], true);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer group w-full h-80 sm:h-96 bg-slate-900 border border-slate-800 hover:border-orange-500/60 rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all"
                >
                  {!brokenImages.hero && (
                    <img
                      src={BRAND_IMAGES.heroFacility}
                      alt="Planta de fabricación aditiva Project 3D en Torrijos"
                      referrerPolicy="no-referrer"
                      onError={() => setBrokenImages((prev) => ({ ...prev, hero: true }))}
                      className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-25 transition-opacity"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-900/75" />

                  <div className="relative z-10 flex justify-between items-center border-b border-slate-800 pb-4 text-xs">
                    <span className="font-mono text-orange-400 font-medium">
                      {lang === 'es'
                        ? 'Cotizador 3D Interactivo'
                        : 'Interactive 3D Quoter'}
                    </span>
                    <span className="text-emerald-400 font-mono">
                      {lang === 'es' ? 'Planta Torrijos Activa' : 'Torrijos Plant Active'}
                    </span>
                  </div>

                  <div className="relative z-10 my-auto text-center space-y-3">
                    <div className="w-16 h-16 mx-auto bg-slate-800/90 group-hover:bg-orange-600/20 rounded-2xl flex items-center justify-center border border-slate-700 group-hover:border-orange-500/50 transition-colors">
                      <Upload className="w-8 h-8 text-orange-500" />
                    </div>
                    <h3 className="text-white font-semibold text-lg">
                      {lang === 'es'
                        ? 'Arrastra tu archivo .STL aquí'
                        : 'Drag & drop your .STL file here'}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                      {lang === 'es'
                        ? 'Compatible con geometrías complejas (.STL, .STEP, .OBJ), PLA, ABS, PETG, TPU, Nylon CF y Resinas.'
                        : 'Compatible with complex geometries (.STL, .STEP, .OBJ), PLA, ABS, PETG, TPU, Carbon Nylon & Resins.'}
                    </p>
                  </div>

                  <div className="relative z-10 bg-slate-950/90 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs text-slate-400">
                    <span>Avenida de los Trabajadores, Torrijos</span>
                    <span className="text-orange-400 font-mono">Toledo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. BREVE RESUMEN DE VENTAJAS */}
        <section className="py-16 bg-slate-900/40 border-b border-slate-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div className="w-10 h-10 bg-orange-600/10 text-orange-500 rounded-lg flex items-center justify-center font-mono font-bold mb-4 border border-orange-600/20 tabular-nums">
                  01
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {lang === 'es' ? 'Rapidez e inmediatez' : 'Speed & Immediacy'}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {lang === 'es'
                    ? 'Calcula presupuestos orientativos en segundos subiendo tu archivo sin esperas innecesarias, con fabricación en 24–48 h en Torrijos.'
                    : 'Calculate indicative quotes in seconds by uploading your CAD file without delays, with 24–48 h turnaround in Torrijos.'}
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div className="w-10 h-10 bg-orange-600/10 text-orange-500 rounded-lg flex items-center justify-center font-mono font-bold mb-4 border border-orange-600/20 tabular-nums">
                  02
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {lang === 'es' ? 'Precisión industrial' : 'Industrial Precision'}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {lang === 'es'
                    ? 'Equipos avanzados de fabricación aditiva FDM y SLA con tolerancias de hasta ±0.05 mm y selección estricta de materiales técnicos certificados.'
                    : 'Advanced FDM and SLA additive manufacturing equipment with tolerances down to ±0.05 mm and certified technical polymers.'}
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div className="w-10 h-10 bg-orange-600/10 text-orange-500 rounded-lg flex items-center justify-center font-mono font-bold mb-4 border border-orange-600/20 tabular-nums">
                  03
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {lang === 'es' ? 'Seguridad de datos' : 'Data & IP Security'}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {lang === 'es'
                    ? 'Tus diseños industriales, archivos STL/STEP y datos personales están protegidos bajo estrictos protocolos de confidencialidad NDA y RGPD.'
                    : 'Your industrial designs, STL/STEP files, and personal data are protected under strict NDA confidentiality and GDPR protocols.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. SERVICIOS INDUSTRIALES (#servicios) & CÓMO FUNCIONA (#proceso) */}
        <section
          id="servicios"
          className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-slate-800/60"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="font-mono text-xs font-semibold text-orange-400 mb-2">
                {lang === 'es' ? 'Catálogo de Servicios' : 'Service Capabilities'}
              </p>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight balance-text">
                {lang === 'es'
                  ? 'Impresión 3D Industrial, Prototipado y Series Cortas'
                  : 'Industrial 3D Printing, Prototyping & Short Series'}
              </h2>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              {lang === 'es'
                ? 'Damos servicio tanto a empresas industriales de Toledo y Madrid como a clientes particulares que buscan acabados profesionales.'
                : 'Serving both industrial enterprises across Toledo and Madrid and private individuals seeking professional-grade parts.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Servicio 01: Span 7 */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between">
              <div className="p-7 sm:p-8 space-y-3">
                <div className="text-xs font-mono text-orange-400">
                  {lang === 'es'
                    ? 'FDM Cámara Calefactada · Compuestos Fibra de Carbono · Tolerancia ±0.12 mm'
                    : 'Heated-Chamber FDM · Carbon Fiber Composites · ±0.12 mm Tolerance'}
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                  {lang === 'es'
                    ? '01. Prototipado Funcional y Recambios Técnicos'
                    : '01. Functional Prototyping & Technical Spare Parts'}
                </h3>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                  {lang === 'es'
                    ? 'Validación geométrica y mecánica de piezas antes de producción en serie. Fabricamos soportes NEMA, carcasas reductoras, utillaje de línea y componentes en PETG Profesional, ABS y PA12 Nylon con Fibra de Carbono.'
                    : 'Geometric and mechanical part validation prior to mass production. We fabricate NEMA mounts, gearbox housings, assembly jigs, and components in Professional PETG, ABS, and PA12 Carbon-Fiber Nylon.'}
                </p>
              </div>
              <div className="h-56 sm:h-64 w-full border-t border-slate-800 bg-slate-950 overflow-hidden">
                {!brokenImages.proto ? (
                  <img
                    src={BRAND_IMAGES.servicePrototyping}
                    alt="Prototipado funcional industrial en Project 3D"
                    referrerPolicy="no-referrer"
                    onError={() => setBrokenImages((prev) => ({ ...prev, proto: true }))}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-mono text-slate-500">
                    01. Prototipado Funcional CAD/STL
                  </div>
                )}
              </div>
            </div>

            {/* Servicio 02: Span 5 */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between">
              <div className="p-7 sm:p-8 space-y-3">
                <div className="text-xs font-mono text-orange-400">
                  {lang === 'es'
                    ? 'Lotes de 10 a 500 Unidades · Sin Coste de Molde · Hasta -18% Dto.'
                    : '10 to 500 Unit Batches · Zero Mold Cost · Up to -18% Discount'}
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                  {lang === 'es'
                    ? '02. Fabricación Bajo Demanda y Series Cortas'
                    : '02. On-Demand Manufacturing & Short Series'}
                </h3>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                  {lang === 'es'
                    ? 'Granja industrial de impresión en paralelo para fabricar lotes repetitivos sin inversión inicial en moldes de inyección.'
                    : 'Parallel industrial print farm for repeatable batch production with zero upfront injection-mold tooling costs.'}
                </p>
              </div>
              <div className="h-56 sm:h-64 w-full border-t border-slate-800 bg-slate-950 overflow-hidden">
                {!brokenImages.series ? (
                  <img
                    src={BRAND_IMAGES.serviceShortSeries}
                    alt="Producción en serie corta en Project 3D Torrijos"
                    referrerPolicy="no-referrer"
                    onError={() => setBrokenImages((prev) => ({ ...prev, series: true }))}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-mono text-slate-500">
                    02. Producción en Serie Corta
                  </div>
                )}
              </div>
            </div>

            {/* Servicio 03: Span 5 */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between">
              <div className="p-7 sm:p-8 space-y-3">
                <div className="text-xs font-mono text-orange-400">
                  {lang === 'es'
                    ? 'Granallado · Pintura Poliuretano RAL · Insertos Latón M3–M6'
                    : 'Media Blasting · RAL Polyurethane Coating · M3–M6 Brass Inserts'}
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                  {lang === 'es'
                    ? '03. Post-Procesado, Lijado y Pintado RAL'
                    : '03. Post-Processing, Sanding & RAL Coating'}
                </h3>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                  {lang === 'es'
                    ? 'Inspección dimensional con calibre digital, homogeneizado superficial, lacado industrial en carta RAL e insertos roscados.'
                    : 'Digital caliper dimensional metrology, surface blasting, industrial RAL polyurethane painting, and threaded inserts.'}
                </p>
              </div>
              <div className="h-52 w-full border-t border-slate-800 bg-slate-950 overflow-hidden">
                {!brokenImages.quality ? (
                  <img
                    src={BRAND_IMAGES.serviceQuality}
                    alt="Control de calidad metrológico Project 3D"
                    referrerPolicy="no-referrer"
                    onError={() => setBrokenImages((prev) => ({ ...prev, quality: true }))}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-mono text-slate-500">
                    03. Control de Calidad Dimensional
                  </div>
                )}
              </div>
            </div>

            {/* 04. CÓMO FUNCIONA (#proceso): Span 7 */}
            <div
              id="proceso"
              className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-7 sm:p-8 flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-mono text-orange-400 mb-2">
                  {lang === 'es' ? 'Flujo de Trabajo Paso a Paso' : 'Step-by-Step Workflow'}
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-6">
                  {lang === 'es'
                    ? '04. Cómo Funciona Project 3D'
                    : '04. How Project 3D Works'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="border-l-2 border-orange-500 pl-4 space-y-1">
                    <div className="font-mono text-xs text-orange-400">Paso 01 · Subida CAD</div>
                    <div className="font-semibold text-sm text-white">
                      {lang === 'es'
                        ? 'Sube tu archivo .STL, .STEP u .OBJ'
                        : 'Upload your .STL, .STEP, or .OBJ'}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {lang === 'es'
                        ? 'Analizamos al instante las dimensiones en milímetros, el volumen en cm³ y la complejidad geométrica.'
                        : 'We instantly analyze millimeter bounding-box dimensions, volume in cm³, and geometric complexity.'}
                    </p>
                  </div>

                  <div className="border-l-2 border-orange-500 pl-4 space-y-1">
                    <div className="font-mono text-xs text-orange-400">Paso 02 · Parámetros</div>
                    <div className="font-semibold text-sm text-white">
                      {lang === 'es'
                        ? 'Configura Material, Relleno y Acabado'
                        : 'Configure Material, Infill & Finish'}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {lang === 'es'
                        ? 'Elige entre PLA, PETG, ABS, TPU, Nylon CF o Resina, calidad de capa y relleno estructural del 10% al 100%.'
                        : 'Choose between PLA, PETG, ABS, TPU, Carbon Nylon, or Resin, layer quality, and 10%–100% structural infill.'}
                    </p>
                  </div>

                  <div className="border-l-2 border-orange-500 pl-4 space-y-1">
                    <div className="font-mono text-xs text-orange-400">Paso 03 · Presupuesto</div>
                    <div className="font-semibold text-sm text-white">
                      {lang === 'es'
                        ? 'Cotización Orientativa + Revisión Técnica'
                        : 'Indicative Quote + Engineering Review'}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {lang === 'es'
                        ? 'Obtén el desglose inmediato con IVA y solicita el presupuesto definitivo validado por nuestros ingenieros.'
                        : 'Get an instant itemized breakdown including VAT and request final validation from our plant engineers.'}
                    </p>
                  </div>

                  <div className="border-l-2 border-orange-500 pl-4 space-y-1">
                    <div className="font-mono text-xs text-orange-400">Paso 04 · Seguimiento</div>
                    <div className="font-semibold text-sm text-white">
                      {lang === 'es'
                        ? 'Trazabilidad en el Área de Clientes'
                        : 'Traceability in the Client Portal'}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {lang === 'es'
                        ? 'Sigue tu pedido en tiempo real (Revisión, Aceptado, Fabricación, Control de Calidad y Enviado).'
                        : 'Follow your order in real time (Review, Approved, Production, Quality Control, and Dispatched).'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {lang === 'es'
                    ? 'Planta de fabricación en Avda. de los Trabajadores · Pol. Ind. Torrijos'
                    : 'Manufacturing plant at Avda. de los Trabajadores · Torrijos Industrial Park'}
                </span>
                <a
                  href="#presupuesto"
                  className="text-orange-400 hover:text-orange-300 font-semibold whitespace-nowrap ml-4"
                >
                  {lang === 'es' ? 'Ir al Cotizador →' : 'Go to Quoter →'}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 4. SECCIÓN DE OFERTAS Y DESCUENTOS INDUSTRIALES (#ofertas) */}
        <section
          id="ofertas"
          className="py-20 bg-slate-950 border-b border-slate-800/60 relative overflow-hidden"
        >
          {/* Efecto decorativo de fondo */}
          <div className="absolute -left-40 top-1/2 transform -translate-y-1/2 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Cabecera de la sección */}
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center space-x-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full text-xs text-orange-400 font-medium">
                <span>
                  {lang === 'es'
                    ? 'Ventajas Comerciales Project 3D'
                    : 'Project 3D Commercial Advantages'}
                </span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {lang === 'es' ? (
                  <>
                    Ofertas y{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                      Descuentos por Volumen
                    </span>
                  </>
                ) : (
                  <>
                    Industrial Offers &{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                      Volume Discounts
                    </span>
                  </>
                )}
              </h2>
              <p className="text-slate-400 text-base">
                {lang === 'es'
                  ? 'Optimizamos nuestros costes de producción en el Polígono Industrial de Torrijos para ofrecerte tarifas competitivas en series cortas, prototipado industrial y encargos recurrentes.'
                  : 'We optimize our production costs at the Torrijos Industrial Park to offer competitive pricing on short series, industrial prototyping, and recurring orders.'}
              </p>
            </div>

            {/* Tarjetas de Ofertas y Descuentos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Oferta 1: Descuento por Volumen (Series Cortas) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between relative hover:border-orange-500/50 transition-all duration-300">
                <div>
                  <div className="w-12 h-12 bg-orange-600/10 text-orange-500 rounded-xl flex items-center justify-center font-bold text-lg mb-6 border border-orange-600/20">
                    %
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {lang === 'es' ? 'Escala por Volumen' : 'Volume Scaling'}
                  </h3>
                  <p className="text-sm text-slate-400 mb-6">
                    {lang === 'es'
                      ? 'Cuantas más unidades fabriques de tu archivo STL, menor será el coste unitario gracias a la optimización de bandejas de impresión.'
                      : 'The more units you manufacture from your STL file, the lower the unit cost thanks to build-plate nesting optimization.'}
                  </p>
                  <ul className="space-y-3 text-sm text-slate-300 mb-8 font-mono">
                    <li
                      onClick={() => {
                        setQuantity(10);
                        scrollToSection('presupuesto');
                      }}
                      className="flex justify-between border-b border-slate-800/80 pb-2 cursor-pointer hover:text-white transition-colors"
                    >
                      <span className="text-slate-400">
                        {lang === 'es' ? '10 - 49 unidades:' : '10 - 49 units:'}
                      </span>
                      <span className="text-orange-400 font-bold">
                        {lang === 'es' ? '-10% dto.' : '-10% off'}
                      </span>
                    </li>
                    <li
                      onClick={() => {
                        setQuantity(50);
                        scrollToSection('presupuesto');
                      }}
                      className="flex justify-between border-b border-slate-800/80 pb-2 cursor-pointer hover:text-white transition-colors"
                    >
                      <span className="text-slate-400">
                        {lang === 'es' ? '50 - 99 unidades:' : '50 - 99 units:'}
                      </span>
                      <span className="text-orange-400 font-bold">
                        {lang === 'es' ? '-20% dto.' : '-20% off'}
                      </span>
                    </li>
                    <li
                      onClick={() => {
                        setQuantity(100);
                        scrollToSection('presupuesto');
                      }}
                      className="flex justify-between border-b border-slate-800/80 pb-2 cursor-pointer hover:text-white transition-colors"
                    >
                      <span className="text-slate-400">
                        {lang === 'es' ? '100+ unidades:' : '100+ units:'}
                      </span>
                      <span className="text-orange-400 font-bold">
                        {lang === 'es' ? 'Presupuesto a medida' : 'Custom quote'}
                      </span>
                    </li>
                  </ul>
                </div>
                <a
                  href="#presupuesto"
                  onClick={(e) => {
                    e.preventDefault();
                    if (quantity < 10) setQuantity(10);
                    scrollToSection('presupuesto');
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl text-center text-sm transition-colors border border-slate-700"
                >
                  {lang === 'es' ? 'Calcular con descuento' : 'Calculate with discount'}
                </a>
              </div>

              {/* Oferta 2: Bienvenida Nuevos Clientes (Área de Clientes) */}
              <div className="bg-gradient-to-b from-orange-950/30 to-slate-900 border border-orange-500/30 rounded-2xl p-8 flex flex-col justify-between relative shadow-lg shadow-orange-950/20">
                <div className="absolute -top-3 right-6 bg-orange-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                  {lang === 'es' ? 'Exclusivo Registro' : 'Registration Exclusive'}
                </div>
                <div>
                  <div className="w-12 h-12 bg-orange-600 text-white rounded-xl flex items-center justify-center font-bold text-lg mb-6 shadow-lg shadow-orange-600/30">
                    ★
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {lang === 'es' ? 'Plan Bienvenida' : 'Welcome Plan'}
                  </h3>
                  <p className="text-sm text-slate-300 mb-6">
                    {lang === 'es'
                      ? 'Regístrate gratis en nuestro nuevo Área de Clientes y obtén una ventaja directa en tu primer pedido de prototipado o piezas industriales.'
                      : 'Register for free in our Client Portal and get an immediate discount on your first prototyping or industrial parts order.'}
                  </p>
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-orange-500/20 mb-8 space-y-2">
                    <span className="block text-xs text-orange-400 uppercase tracking-widest font-mono">
                      {welcomeDiscountActive
                        ? lang === 'es'
                          ? '✓ Beneficio activado en cotizador'
                          : '✓ Benefit activated in quoter'
                        : lang === 'es'
                        ? 'Beneficio activo'
                        : 'Active benefit'}
                    </span>
                    <span className="text-lg font-bold text-white block">
                      {lang === 'es'
                        ? '-15% en tu primer archivo STL'
                        : '-15% on your first STL file'}
                    </span>
                  </div>
                </div>
                <a
                  href="#presupuesto"
                  onClick={(e) => {
                    e.preventDefault();
                    setWelcomeDiscountActive(true);
                    scrollToSection('presupuesto');
                  }}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 rounded-xl text-center text-sm transition-all shadow-lg shadow-orange-600/30"
                >
                  {welcomeDiscountActive
                    ? lang === 'es'
                      ? 'Plan Bienvenida (-15%) Activo · Ir al Cotizador'
                      : 'Welcome Plan (-15%) Active · Go to Quoter'
                    : lang === 'es'
                    ? 'Registrarse y activar'
                    : 'Register & activate'}
                </a>
              </div>

              {/* Oferta 3: Acuerdos Corporativos y Centros Educativos */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between relative hover:border-orange-500/50 transition-all duration-300">
                <div>
                  <div className="w-12 h-12 bg-orange-600/10 text-orange-500 rounded-xl flex items-center justify-center font-bold text-lg mb-6 border border-orange-600/20">
                    🏢
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {lang === 'es' ? 'Empresas e I+D' : 'Corporate & R&D'}
                  </h3>
                  <p className="text-sm text-slate-400 mb-6">
                    {lang === 'es'
                      ? 'Tarifas planas mensuales y condiciones especiales para departamentos de ingeniería, estudios de diseño y centros educativos de Toledo y alrededores.'
                      : 'Monthly flat rates and special terms for engineering departments, design studios, and educational centers in Toledo and surrounding areas.'}
                  </p>
                  <ul className="space-y-2.5 text-sm text-slate-300 mb-8">
                    <li className="flex items-center space-x-2">
                      <span className="text-orange-500 font-bold">✓</span>
                      <span>
                        {lang === 'es'
                          ? 'Facturación agrupada mensual'
                          : 'Consolidated monthly billing'}
                      </span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-orange-500 font-bold">✓</span>
                      <span>
                        {lang === 'es'
                          ? 'Asesoramiento técnico prioritario'
                          : 'Priority engineering consulting'}
                      </span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="text-orange-500 font-bold">✓</span>
                      <span>
                        {lang === 'es'
                          ? 'Prioridad en cola de fabricación'
                          : 'Priority production queue'}
                      </span>
                    </li>
                  </ul>
                </div>
                <a
                  href="#contacto"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!contactMessage.trim()) {
                      setContactMessage(
                        lang === 'es'
                          ? 'Hola equipo de Project 3D, nos gustaría solicitar información sobre los acuerdos para Empresas e I+D (facturación agrupada mensual y prioridad en cola de fabricación en Torrijos).'
                          : 'Hello Project 3D team, we would like information regarding Corporate & R&D agreements (consolidated monthly billing and priority production queue in Torrijos).'
                      );
                    }
                    scrollToSection('contacto');
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl text-center text-sm transition-colors border border-slate-700"
                >
                  {lang === 'es' ? 'Contactar con comercial' : 'Contact sales team'}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 5. APLICACIÓN DE PRESUPUESTOS Y SUBIDA DE STL (#presupuesto) */}
        <section
          id="presupuesto"
          className="py-20 bg-slate-900 border-b border-slate-800/60 relative"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Cabecera de la Aplicación */}
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center space-x-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full text-xs text-orange-400 font-medium">
                <span>
                  {lang === 'es' ? 'Plataforma Industrial 4.0' : 'Industry 4.0 Platform'}
                </span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {lang === 'es' ? (
                  <>
                    Cotizador Automático de{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                      Archivos STL
                    </span>
                  </>
                ) : (
                  <>
                    Automatic Quoter for{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                      STL Files
                    </span>
                  </>
                )}
              </h2>
              <p className="text-slate-400 text-base">
                {lang === 'es'
                  ? 'Sube tu diseño, configura los parámetros de fabricación aditiva y obtén un presupuesto orientativo inmediato desde nuestras instalaciones en el Polígono de Torrijos.'
                  : 'Upload your design, configure additive manufacturing parameters, and get an instant indicative quote from our facility at Torrijos Industrial Park.'}
              </p>
            </div>

            {/* Contenedor Principal de la Aplicación (Tarjetas de Pasos) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Columna Izquierda: Configuración y Subida (Pasos 1 y 2 + Visor 3D) */}
              <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8 shadow-xl">
                {/* PASO 1: Subir Archivo STL */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                      <span className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center text-xs font-mono">
                        1
                      </span>
                      <span>
                        {lang === 'es' ? 'Sube tu archivo 3D' : 'Upload your 3D file'}
                      </span>
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {lang === 'es'
                        ? 'Formatos: .STL, .STEP, .OBJ'
                        : 'Formats: .STL, .STEP, .OBJ'}
                    </span>
                  </div>

                  <div
                    id="drop-zone"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleFileUpload(e.dataTransfer.files?.[0]);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-xl p-8 text-center cursor-pointer transition-all bg-slate-900/50 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="file-input"
                      className="hidden"
                      accept=".stl,.step,.stp,.obj"
                      onChange={(e) => handleFileUpload(e.target.files?.[0])}
                    />
                    <div className="w-14 h-14 mx-auto bg-slate-800 rounded-xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform mb-3">
                      <Upload className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">
                      {lang === 'es' ? (
                        <>
                          Arrastra tu archivo aquí o{' '}
                          <span className="text-orange-500 underline">
                            explora en tu equipo
                          </span>
                        </>
                      ) : (
                        <>
                          Drag your file here or{' '}
                          <span className="text-orange-500 underline">
                            browse your device
                          </span>
                        </>
                      )}
                    </p>
                    <p id="file-name-display" className="text-xs text-slate-400">
                      {hasUploadedCustomFile
                        ? `${activeModel.fileName} (${activeModel.dimensionsMm.x} × ${activeModel.dimensionsMm.y} × ${activeModel.dimensionsMm.z} mm · ${activeModel.volumeCm3.toFixed(1)} cm³)`
                        : lang === 'es'
                        ? 'Tamaño máximo recomendado: 50MB. Archivos seguros y confidenciales.'
                        : 'Recommended max size: 50MB. Secure and confidential files.'}
                    </p>
                    {uploadError && (
                      <p className="text-xs text-rose-400 font-medium mt-2">{uploadError}</p>
                    )}
                  </div>

                  {/* Selector rápido de modelos 3D + Visor 3D Interactivo */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-400 font-mono">
                        {lang === 'es'
                          ? `Pieza activa en visor 3D: ${activeModel.fileName} (${activeModel.volumeCm3.toFixed(1)} cm³)`
                          : `Active 3D model: ${activeModel.fileName} (${activeModel.volumeCm3.toFixed(1)} cm³)`}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {presetModels.map((pm, idx) => {
                          const isSelected = activeModel.fileName === pm.fileName;
                          const shortLabel =
                            idx === 0
                              ? 'Brida NEMA 23'
                              : idx === 1
                              ? 'Reductora'
                              : idx === 2
                              ? 'Impulsor'
                              : 'Colector';
                          return (
                            <button
                              key={pm.id}
                              type="button"
                              onClick={() => {
                                setActiveModel(pm);
                                setHasUploadedCustomFile(false);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
                                isSelected
                                  ? 'bg-orange-600 text-white'
                                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                              }`}
                            >
                              {shortLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <CadViewport3D
                      model={activeModel}
                      colorHex={selectedRal.hex}
                      infillPercent={infillPercent}
                      lang={lang}
                    />
                  </div>
                </div>

                {/* PASO 2: Datos de Fabricación (Materiales, Calidad, Relleno, etc.) */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center text-xs font-mono">
                      2
                    </span>
                    <span>
                      {lang === 'es'
                        ? 'Parámetros de Fabricación'
                        : 'Manufacturing Parameters'}
                    </span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Material */}
                    <div>
                      <label
                        htmlFor="material-select"
                        className="block text-xs font-medium text-slate-300 mb-1"
                      >
                        {lang === 'es' ? 'Material Industrial' : 'Industrial Material'}
                      </label>
                      <select
                        id="material-select"
                        value={selectedMaterialId}
                        onChange={(e) => setSelectedMaterialId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="pla-pro">
                          {lang === 'es'
                            ? 'PLA Técnico (+0.02€/g)'
                            : 'Technical PLA (+€0.02/g)'}
                        </option>
                        <option value="petg-pro">
                          {lang === 'es'
                            ? 'PETG (Alta Resistencia)'
                            : 'PETG (High Strength)'}
                        </option>
                        <option value="abs-ind">
                          {lang === 'es'
                            ? 'ABS (Industrial / Automoción)'
                            : 'ABS (Industrial / Automotive)'}
                        </option>
                        <option value="tpu-95a">
                          {lang === 'es'
                            ? 'TPU Flex (Elastómero)'
                            : 'TPU Flex (Elastomer)'}
                        </option>
                        <option value="pa12-cf">
                          {lang === 'es'
                            ? 'Nylon Reforzado'
                            : 'Carbon-Reinforced Nylon'}
                        </option>
                        <option value="resin-sla">
                          {lang === 'es'
                            ? 'Resina Prototipado Alta Definición'
                            : 'High-Definition Prototyping Resin'}
                        </option>
                      </select>
                    </div>

                    {/* Calidad */}
                    <div>
                      <label
                        htmlFor="quality-select"
                        className="block text-xs font-medium text-slate-300 mb-1"
                      >
                        {lang === 'es' ? 'Calidad de Impresión' : 'Print Quality'}
                      </label>
                      <select
                        id="quality-select"
                        value={selectedQualityId}
                        onChange={(e) =>
                          setSelectedQualityId(
                            e.target.value as 'standard' | 'high' | 'pro'
                          )
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="standard">
                          {lang === 'es'
                            ? 'Estándar (0.20 mm)'
                            : 'Standard (0.20 mm)'}
                        </option>
                        <option value="high">
                          {lang === 'es' ? 'Alta (0.15 mm)' : 'High (0.15 mm)'}
                        </option>
                        <option value="pro">
                          {lang === 'es'
                            ? 'Profesional / Fina (0.10 mm)'
                            : 'Professional / Fine (0.10 mm)'}
                        </option>
                      </select>
                    </div>

                    {/* Relleno */}
                    <div>
                      <label
                        htmlFor="infill-select"
                        className="block text-xs font-medium text-slate-300 mb-1"
                      >
                        {lang === 'es' ? 'Porcentaje de Relleno' : 'Infill Percentage'}
                      </label>
                      <select
                        id="infill-select"
                        value={infillPercent}
                        onChange={(e) =>
                          setInfillPercent(parseInt(e.target.value, 10) || 20)
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value={15}>
                          {lang === 'es' ? '15% (Ligero)' : '15% (Light)'}
                        </option>
                        <option value={20}>
                          {lang === 'es'
                            ? '20% (Estándar Industrial)'
                            : '20% (Industrial Standard)'}
                        </option>
                        <option value={40}>
                          {lang === 'es' ? '40% (Resistente)' : '40% (Reinforced)'}
                        </option>
                        <option value={60}>
                          {lang === 'es' ? '60% (Alta Solidez)' : '60% (High Strength)'}
                        </option>
                        <option value={100}>
                          {lang === 'es' ? '100% (Macizo)' : '100% (Solid)'}
                        </option>
                      </select>
                    </div>

                    {/* Unidades */}
                    <div>
                      <label
                        htmlFor="units-input"
                        className="block text-xs font-medium text-slate-300 mb-1"
                      >
                        {lang === 'es' ? 'Cantidad de Unidades' : 'Number of Units'}
                      </label>
                      <input
                        type="number"
                        id="units-input"
                        value={quantity}
                        min={1}
                        max={1000}
                        onChange={(e) =>
                          setQuantity(
                            Math.max(1, Math.min(1000, parseInt(e.target.value, 10) || 1))
                          )
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Color */}
                    <div>
                      <label
                        htmlFor="color-select"
                        className="block text-xs font-medium text-slate-300 mb-1"
                      >
                        {lang === 'es' ? 'Color del Material' : 'Material Color'}
                      </label>
                      <select
                        id="color-select"
                        value={selectedRalId}
                        onChange={(e) => setSelectedRalId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="ral-9005">
                          {lang === 'es'
                            ? 'Negro Industrial (Mate)'
                            : 'Industrial Matte Black'}
                        </option>
                        <option value="ral-9003">
                          {lang === 'es' ? 'Blanco Técnico' : 'Technical White'}
                        </option>
                        <option value="ral-7016">
                          {lang === 'es'
                            ? 'Gris Grafito (RAL 7024)'
                            : 'Graphite Grey (RAL 7024)'}
                        </option>
                        <option value="ral-5015">
                          {lang === 'es' ? 'Azul Corporativo' : 'Corporate Blue'}
                        </option>
                        <option value="ral-2009">
                          {lang === 'es' ? 'Rojo Seguridad' : 'Safety Orange-Red'}
                        </option>
                      </select>
                    </div>

                    {/* Acabado */}
                    <div>
                      <label
                        htmlFor="finish-select"
                        className="block text-xs font-medium text-slate-300 mb-1"
                      >
                        {lang === 'es'
                          ? 'Post-procesado / Acabado'
                          : 'Post-processing / Finish'}
                      </label>
                      <select
                        id="finish-select"
                        value={selectedFinishId}
                        onChange={(e) =>
                          setSelectedFinishId(
                            e.target.value as 'raw' | 'sanded' | 'painted' | 'inserts'
                          )
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="raw">
                          {lang === 'es'
                            ? 'Sin acabado (Bruto de impresión)'
                            : 'Unfinished (As-printed)'}
                        </option>
                        <option value="sanded">
                          {lang === 'es'
                            ? 'Lijado y alisado superficial'
                            : 'Surface sanding & smoothing'}
                        </option>
                        <option value="painted">
                          {lang === 'es'
                            ? 'Pintado industrial especializado'
                            : 'Specialized industrial painting'}
                        </option>
                        <option value="inserts">
                          {lang === 'es'
                            ? 'Insertos roscados metálicos M3–M6'
                            : 'M3–M6 brass threaded inserts'}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Presupuesto Automático Orientativo (Pasos 3 y 4) */}
              <div className="lg:col-span-5 bg-slate-950 border border-orange-500/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative">
                <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-orange-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  {lang === 'es'
                    ? 'Cálculo en tiempo real (Demo)'
                    : 'Real-time calculation (Demo)'}
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-xl font-bold text-white">
                    {lang === 'es' ? 'Resumen de Presupuesto' : 'Quote Summary'}
                  </h3>
                  <button
                    type="button"
                    onClick={handleDownloadQuoteSheet}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1.5 transition-colors whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5 text-orange-400" />
                    <span>{lang === 'es' ? 'Descargar Ficha' : 'Download Sheet'}</span>
                  </button>
                </div>

                {/* Desglose de costes simulados en tiempo real */}
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">
                      {lang === 'es' ? 'Coste de Material:' : 'Material Cost:'}
                    </span>
                    <span id="cost-material" className="font-mono text-white tabular-nums">
                      {formatEur(quoteBreakdown.rawMaterialTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">
                      {lang === 'es'
                        ? 'Tiempo estimado de máquina:'
                        : 'Estimated machine time:'}
                    </span>
                    <span id="cost-machine" className="font-mono text-white tabular-nums">
                      {formatEur(quoteBreakdown.rawMachineTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">
                      {lang === 'es'
                        ? 'Preparación y post-procesado:'
                        : 'Preparation & post-processing:'}
                    </span>
                    <span className="font-mono text-white tabular-nums">
                      {formatEur(quoteBreakdown.finishTotal)}
                    </span>
                  </div>

                  {quoteBreakdown.discountEur > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>
                        {lang === 'es'
                          ? quoteBreakdown.discountLabelEs
                          : quoteBreakdown.discountLabelEn}
                      </span>
                      <span className="font-mono font-bold tabular-nums">
                        -{formatEur(quoteBreakdown.discountEur)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-slate-800 pt-3">
                    <span className="text-slate-400">
                      {lang === 'es' ? 'Subtotal estimado:' : 'Estimated subtotal:'}
                    </span>
                    <span
                      id="cost-subtotal"
                      className="font-mono text-white font-bold tabular-nums"
                    >
                      {formatEur(quoteBreakdown.netTaxableEur)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">IVA (21%):</span>
                    <span id="cost-iva" className="font-mono text-slate-300 tabular-nums">
                      {formatEur(quoteBreakdown.vatEur)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-4 text-lg">
                    <span className="text-white font-bold">
                      {lang === 'es' ? 'Total Estimado:' : 'Total Estimated:'}
                    </span>
                    <span
                      id="cost-total"
                      className="font-mono text-orange-400 font-extrabold tabular-nums"
                    >
                      {formatEur(quoteBreakdown.totalWithVatEur)}
                    </span>
                  </div>
                </div>

                {/* Aviso obligatorio */}
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-xs text-amber-300 space-y-1">
                  <p className="font-bold uppercase">
                    {lang === 'es'
                      ? '⚠️ Presupuesto orientativo (Demostración)'
                      : '⚠️ Indicative quote (Demonstration)'}
                  </p>
                  <p className="text-slate-400">
                    {lang === 'es'
                      ? 'El precio definitivo puede variar tras la revisión técnica del archivo STL por nuestro equipo en Torrijos.'
                      : 'The final price may vary after technical review of the STL file by our engineering team in Torrijos.'}
                  </p>
                </div>

                {/* Botón de solicitud definitiva + Registro en Área de Clientes */}
                <div className="space-y-2.5">
                  <a
                    href="#contacto"
                    onClick={(e) => {
                      e.preventDefault();
                      setQuoteSubmittedOrderCode(null);
                      setShowRequestForm((prev) => !prev);
                    }}
                    className="block w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 rounded-xl text-center shadow-lg shadow-orange-600/30 transition-all text-sm"
                  >
                    {lang === 'es'
                      ? 'Solicitar Presupuesto Definitivo'
                      : 'Request Final Quote'}
                  </a>
                </div>

                {quoteSubmittedOrderCode && (
                  <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 space-y-2">
                    <div className="font-semibold flex items-center gap-1.5 text-emerald-300">
                      <Check className="w-4 h-4" />
                      <span>
                        {lang === 'es'
                          ? `Solicitud registrada con código #${quoteSubmittedOrderCode}`
                          : `Quote request registered under code #${quoteSubmittedOrderCode}`}
                      </span>
                    </div>
                    <p className="text-emerald-300/90">
                      {lang === 'es'
                        ? 'Tu pieza ya figura en el Área de Clientes en estado "1. Revisión" para validación por nuestros ingenieros en Torrijos.'
                        : 'Your part is now listed in the Client Portal under stage "1. Technical Review" for validation by our Torrijos engineers.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => scrollToSection('clientes')}
                      className="font-semibold text-orange-400 underline underline-offset-2"
                    >
                      {lang === 'es'
                        ? 'Ver seguimiento del pedido en Área de Clientes →'
                        : 'View order tracking in Client Portal →'}
                    </button>
                  </div>
                )}

                {showRequestForm && (
                  <form
                    onSubmit={handleCreateDefinitiveQuoteOrder}
                    className="pt-4 border-t border-slate-800 space-y-3"
                  >
                    <div className="text-xs font-semibold text-white">
                      {lang === 'es'
                        ? 'Confirmar datos para revisión técnica en Torrijos y seguimiento en Área de Clientes:'
                        : 'Confirm details for technical review in Torrijos & Client Portal tracking:'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        required
                        value={clientNameInput}
                        onChange={(e) => setClientNameInput(e.target.value)}
                        placeholder={lang === 'es' ? 'Tu nombre y apellidos *' : 'Your full name *'}
                        className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                      />
                      <input
                        type="text"
                        value={companyNameInput}
                        onChange={(e) => setCompanyNameInput(e.target.value)}
                        placeholder={
                          lang === 'es'
                            ? 'Empresa / Razón Social (opcional)'
                            : 'Company name (optional)'
                        }
                        className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <input
                      type="email"
                      required
                      value={clientEmailInput}
                      onChange={(e) => setClientEmailInput(e.target.value)}
                      placeholder={
                        lang === 'es'
                          ? 'Correo electrónico profesional o particular *'
                          : 'Business or personal email *'
                      }
                      className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                    />
                    <label className="flex items-start gap-2 text-[11px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ndaAccepted}
                        onChange={(e) => setNdaAccepted(e.target.checked)}
                        required
                        className="mt-0.5 accent-orange-500"
                      />
                      <span>
                        {lang === 'es'
                          ? 'Acepto el tratamiento confidencial del archivo CAD/STL y la política de protección de datos RGPD de Project 3D.'
                          : 'I accept the confidential processing of my CAD/STL file and Project 3D GDPR data protection policy.'}
                      </span>
                    </label>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowRequestForm(false);
                          scrollToSection('contacto');
                        }}
                        className="text-xs text-orange-400 hover:text-orange-300 underline underline-offset-2"
                      >
                        {lang === 'es' ? 'O ir al formulario de contacto →' : 'Or go to contact form →'}
                      </button>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowRequestForm(false)}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                        >
                          {lang === 'es' ? 'Cancelar' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors"
                        >
                          {lang === 'es'
                            ? 'Confirmar y Generar Pedido'
                            : 'Confirm & Generate Order'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 6. ÁREA DE CLIENTES Y GESTIÓN DE PEDIDOS (#clientes) */}
        <section
          id="clientes"
          className="py-20 bg-slate-950 border-b border-slate-800/60 relative"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Cabecera de la Sección */}
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center space-x-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full text-xs text-orange-400 font-medium">
                <span>
                  {lang === 'es' ? 'Plataforma Segura 4.0' : 'Secure Platform 4.0'}
                </span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {lang === 'es' ? (
                  <>
                    Área Privada de{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                      Clientes Project 3D
                    </span>
                  </>
                ) : (
                  <>
                    Private Portal for{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                      Project 3D Clients
                    </span>
                  </>
                )}
              </h2>
              <p className="text-slate-400 text-base">
                {lang === 'es'
                  ? 'Accede a tu panel personalizado para gestionar tus archivos STL, descargar facturas, consultar presupuestos y realizar un seguimiento en tiempo real de tus pedidos.'
                  : 'Access your personalized dashboard to manage your STL files, download invoices, review quotes, and track your manufacturing orders in real time.'}
              </p>
            </div>

            {!isPortalLoggedIn ? (
              <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 text-center shadow-xl">
                <div className="w-12 h-12 mx-auto rounded-full bg-orange-600/20 text-orange-400 font-bold flex items-center justify-center border border-orange-600/30">
                  JD
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">
                    {lang === 'es'
                      ? 'Acceso Seguro Área de Clientes'
                      : 'Secure Client Portal Login'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Juan Domínguez · Ingeniería Toledo S.L.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPortalLoggedIn(true)}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-orange-600/30 transition-all"
                >
                  {lang === 'es'
                    ? 'Iniciar Sesión Segura (Demo)'
                    : 'Secure Sign In (Demo)'}
                </button>
              </div>
            ) : (
              /* Contenedor Interactivo: Simulación de Dashboard Privado */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Columna de Navegación del Panel Privado (Simulación Logged-In) */}
                <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                      <div className="w-10 h-10 rounded-full bg-orange-600/20 text-orange-400 font-bold flex items-center justify-center border border-orange-600/30 shrink-0">
                        JD
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Juan Domínguez</h4>
                        <span className="text-xs text-slate-400">
                          Ingeniería Toledo S.L.
                        </span>
                      </div>
                    </div>

                    <nav className="space-y-1 text-sm font-medium">
                      <a
                        href="#pedidos"
                        onClick={(e) => {
                          e.preventDefault();
                          setPortalTab('pedidos');
                        }}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${
                          portalTab === 'pedidos'
                            ? 'bg-orange-600 text-white font-semibold'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>
                          {lang === 'es'
                            ? '📦 Mis Pedidos y Estados'
                            : '📦 My Orders & Status'}
                        </span>
                      </a>
                      <a
                        href="#archivos"
                        onClick={(e) => {
                          e.preventDefault();
                          setPortalTab('archivos');
                        }}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${
                          portalTab === 'archivos'
                            ? 'bg-orange-600 text-white font-semibold'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>
                          {lang === 'es'
                            ? '📁 Archivos STL (Seguros)'
                            : '📁 STL Files (Secure)'}
                        </span>
                      </a>
                      <a
                        href="#facturas"
                        onClick={(e) => {
                          e.preventDefault();
                          setPortalTab('facturas');
                        }}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${
                          portalTab === 'facturas'
                            ? 'bg-orange-600 text-white font-semibold'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>
                          {lang === 'es'
                            ? '📄 Presupuestos y Facturas'
                            : '📄 Quotes & Invoices'}
                        </span>
                      </a>
                      <a
                        href="#soporte"
                        onClick={(e) => {
                          e.preventDefault();
                          setPortalTab('soporte');
                        }}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors ${
                          portalTab === 'soporte'
                            ? 'bg-orange-600 text-white font-semibold'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>
                          {lang === 'es'
                            ? '💬 Contactar con Torrijos'
                            : '💬 Contact Torrijos Plant'}
                        </span>
                      </a>
                    </nav>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsPortalLoggedIn(false)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition-colors border border-slate-700"
                    >
                      {lang === 'es' ? 'Cerrar Sesión Segura' : 'Secure Sign Out'}
                    </button>
                  </div>
                </div>

                {/* Columna Principal: Visualizador de Pedidos Activos y Estados */}
                <div className="lg:col-span-9 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {lang === 'es'
                          ? 'Seguimiento de Producción Industrial'
                          : 'Industrial Production Tracking'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <p className="text-xs text-slate-400">
                          {lang === 'es' ? 'Pedido Activo:' : 'Active Order:'}{' '}
                          <span className="font-mono text-orange-400">
                            #{activeOrder.orderCode}
                          </span>
                        </p>
                        {orders.length > 1 && (
                          <div className="flex flex-wrap items-center gap-1.5 ml-1">
                            {orders.map((ord) => (
                              <button
                                key={ord.id}
                                type="button"
                                onClick={() => setSelectedOrderId(ord.id)}
                                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                                  ord.id === activeOrder.id
                                    ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30 font-bold'
                                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                                }`}
                              >
                                #{ord.orderCode}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-3 py-1.5 rounded-lg font-mono font-bold whitespace-nowrap">
                      {lang === 'es' ? 'Estado:' : 'Status:'}{' '}
                      {lang === 'es'
                        ? ORDER_LIFECYCLE_STAGES_8[activeOrderStep8 - 1]?.shortEs ||
                          'En fabricación'
                        : ORDER_LIFECYCLE_STAGES_8[activeOrderStep8 - 1]?.shortEn ||
                          'In production'}
                    </span>
                  </div>

                  {/* Barra de Progreso de los 8 Estados del Pedido */}
                  <div className="space-y-3">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                      {lang === 'es'
                        ? 'Ciclo de vida del pedido industrial:'
                        : 'Industrial order lifecycle:'}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-[10px]">
                      {ORDER_LIFECYCLE_STAGES_8.map((st) => {
                        const isCompleted = st.step < activeOrderStep8;
                        const isCurrent = st.step === activeOrderStep8;
                        return (
                          <button
                            key={st.step}
                            type="button"
                            onClick={() =>
                              setOrderLifecycleStepMap((prev) => ({
                                ...prev,
                                [activeOrder.id]: st.step,
                              }))
                            }
                            className={`p-2 rounded-lg transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-orange-600 text-white font-bold shadow-lg shadow-orange-600/30'
                                : isCompleted
                                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium'
                                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600'
                            }`}
                          >
                            {lang === 'es' ? st.es : st.en}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detalles del Pedido Actual */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1">
                        {lang === 'es' ? 'Archivo procesado' : 'Processed file'}
                      </span>
                      <span className="text-sm font-mono text-white font-bold block truncate">
                        {activeOrder.fileName}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-1">
                        {lang === 'es'
                          ? `${activeOrder.materialNameEs} (Relleno ${activeOrder.infillPercent}%)`
                          : `${activeOrder.materialNameEn} (Infill ${activeOrder.infillPercent}%)`}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1">
                        {lang === 'es' ? 'Plazo estimado' : 'Estimated turnaround'}
                      </span>
                      <span className="text-sm font-mono text-white font-bold block">
                        {activeOrder.estimatedDelivery}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-1">
                        {lang === 'es'
                          ? activeOrder.deliveryMethodEs
                          : activeOrder.deliveryMethodEn}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1">
                        {lang === 'es' ? 'Documentación' : 'Documentation'}
                      </span>
                      <a
                        href="#descargar"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDownloadOrderInvoice(activeOrder);
                        }}
                        className="text-sm font-semibold text-orange-400 hover:underline flex items-center space-x-1 mt-1"
                      >
                        <span>
                          {lang === 'es'
                            ? '📥 Descargar Presupuesto / Factura'
                            : '📥 Download Quote / Invoice'}
                        </span>
                      </a>
                      <span className="block text-[11px] font-mono text-slate-500 mt-1 tabular-nums">
                        {formatEur(activeOrder.totalWithVatEur)} (IVA inc.)
                      </span>
                    </div>
                  </div>

                  {/* Vista contextual según pestaña lateral seleccionada */}
                  {portalTab === 'archivos' && (
                    <div className="pt-4 border-t border-slate-800 space-y-3">
                      <h4 className="text-sm font-bold text-white">
                        {lang === 'es'
                          ? 'Repositorio Seguro de Archivos STL (Protección NDA / RGPD)'
                          : 'Secure STL File Repository (NDA / GDPR Protected)'}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {orders.map((ord) => (
                          <div
                            key={ord.id}
                            onClick={() => setSelectedOrderId(ord.id)}
                            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-orange-500/40 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2 text-xs font-mono text-white font-semibold truncate">
                              <FileText className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                              <span className="truncate">{ord.fileName}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1 font-mono">
                              {ord.dimensionsMm} · #{ord.orderCode}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {portalTab === 'facturas' && (
                    <div className="pt-4 border-t border-slate-800 space-y-3">
                      <h4 className="text-sm font-bold text-white">
                        {lang === 'es'
                          ? 'Histórico de Presupuestos y Facturas'
                          : 'Quotes & Invoices History'}
                      </h4>
                      <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden text-xs">
                        {orders.map((ord) => (
                          <div
                            key={ord.id}
                            className="p-3.5 flex flex-wrap items-center justify-between gap-3"
                          >
                            <div>
                              <span className="font-mono text-orange-400 font-bold">
                                #{ord.orderCode}
                              </span>{' '}
                              · <span className="text-white font-medium">{ord.fileName}</span>
                              <span className="text-slate-500 ml-2">({ord.createdAt})</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-mono font-bold text-white tabular-nums">
                                {formatEur(ord.totalWithVatEur)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDownloadOrderInvoice(ord)}
                                className="text-orange-400 hover:text-orange-300 font-semibold underline"
                              >
                                {lang === 'es' ? 'Descargar PDF/TXT' : 'Download'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {portalTab === 'soporte' && (
                    <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {lang === 'es'
                            ? 'Línea Directa con Ingeniería en Torrijos'
                            : 'Direct Line with Torrijos Engineering'}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {lang === 'es'
                            ? 'Consulta sobre tolerancias, materiales o estado del pedido #PRJ-2026-8942.'
                            : 'Ask about tolerances, materials, or status for order #PRJ-2026-8942.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setIsChatbotOpen(true)}
                          className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                        >
                          {lang === 'es' ? 'Abrir Chat Técnico 24/7' : 'Open 24/7 Tech Chat'}
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollToSection('contacto')}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap"
                        >
                          {lang === 'es' ? 'Ir a Contacto' : 'Go to Contact'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 7. UBICACIÓN EN EL POLÍGONO INDUSTRIAL DE TORRIJOS Y CONTACTO (#contacto) */}
        <section id="contacto" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-6 space-y-6">
              <p className="font-mono text-xs font-semibold text-orange-400">
                {lang === 'es' ? 'Ubicación y Contacto' : 'Location & Contact'}
              </p>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight balance-text">
                {lang === 'es'
                  ? 'Project 3D en el Polígono Industrial de Torrijos'
                  : 'Project 3D at Torrijos Industrial Park'}
              </h2>

              <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-orange-500 shrink-0 mt-1" />
                  <div>
                    <strong className="text-white block">
                      {lang === 'es'
                        ? 'Dirección de Planta Industrial:'
                        : 'Industrial Plant Address:'}
                    </strong>
                    Avenida de los Trabajadores
                    <br />
                    Polígono Industrial de Torrijos
                    <br />
                    45500 Torrijos, Toledo, España
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0 mt-1" />
                  <div>
                    <strong className="text-white block">
                      {lang === 'es'
                        ? 'Confidencialidad de Archivos STL y Protección de Datos'
                        : 'STL File Confidentiality & GDPR Data Protection'}
                    </strong>
                    {lang === 'es'
                      ? 'Fabricación industrial bajo demanda, prototipado rápido y series cortas con máxima confidencialidad en el tratamiento de ficheros .STL, .STEP y datos personales.'
                      : 'On-demand industrial manufacturing, rapid prototyping, and short series with strict confidentiality in handling .STL, .STEP files and personal data.'}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-6 text-xs text-slate-400 font-mono">
                <div>
                  <div className="text-white font-sans font-semibold mb-1">
                    {lang === 'es' ? 'Horario de Planta' : 'Plant Hours'}
                  </div>
                  <div>Lunes – Viernes · 08:00 – 19:00</div>
                  <div>Pol. Ind. Torrijos, Toledo</div>
                </div>
                <div>
                  <div className="text-white font-sans font-semibold mb-1">
                    {lang === 'es' ? 'Contacto Ingeniería' : 'Engineering Contact'}
                  </div>
                  <div>ingenieria@project3d-torrijos.es</div>
                  <div>+34 925 77 30 30</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-7 sm:p-8">
              <h3 className="font-display text-xl font-bold text-white mb-2">
                {lang === 'es'
                  ? '¿Listo para tu proyecto? Contacta con nuestro equipo'
                  : 'Ready for your project? Contact our engineering team'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mb-6">
                {lang === 'es'
                  ? 'Envíanos tu consulta para series industriales, asesoramiento de materiales o concertar una visita en nuestra planta de Torrijos.'
                  : 'Send us your inquiry for industrial series, material consulting, or to schedule a visit at our Torrijos facility.'}
              </p>

              {contactSuccess ? (
                <div className="p-5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-200 space-y-2 text-sm">
                  <div className="font-semibold text-white">
                    {lang === 'es'
                      ? 'Consulta recibida por el equipo técnico de Project 3D'
                      : 'Inquiry received by the Project 3D engineering team'}
                  </div>
                  <p className="text-xs text-emerald-300 leading-relaxed">
                    {lang === 'es'
                      ? 'Un ingeniero en nuestra planta de Torrijos te responderá en menos de 2 horas laborables.'
                      : 'An engineer at our Torrijos plant will reply within 2 business hours.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setContactSuccess(false);
                      setContactMessage('');
                    }}
                    className="text-xs font-semibold text-orange-400 underline underline-offset-2 pt-1"
                  >
                    {lang === 'es' ? 'Enviar otra consulta' : 'Send another inquiry'}
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!contactName.trim() || !contactEmail.trim()) return;
                    setContactSuccess(true);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">
                        {lang === 'es' ? 'Nombre completo *' : 'Full Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder={lang === 'es' ? 'Ej. Laura Gómez' : 'e.g. Laura Gómez'}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">
                        {lang === 'es' ? 'Empresa / Entidad' : 'Company / Organization'}
                      </label>
                      <input
                        type="text"
                        value={contactCompany}
                        onChange={(e) => setContactCompany(e.target.value)}
                        placeholder={
                          lang === 'es' ? 'Opcional si eres particular' : 'Optional for individuals'
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      {lang === 'es' ? 'Correo electrónico *' : 'Email Address *'}
                    </label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="nombre@empresa.es"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      {lang === 'es'
                        ? 'Detalles técnicos del proyecto *'
                        : 'Technical project details *'}
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder={
                        lang === 'es'
                          ? 'Describe la pieza, material requerido, unidades o dudas técnicas...'
                          : 'Describe the part, target material, quantity, or technical questions...'
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-600/25 transition-colors whitespace-nowrap"
                    >
                      {lang === 'es' ? 'Enviar Consulta a Torrijos' : 'Send Inquiry to Torrijos'}
                    </button>

                    <a
                      href="#presupuesto"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300 whitespace-nowrap"
                    >
                      <span>{lang === 'es' ? 'Empezar Cotización 3D' : 'Start 3D Quote'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 py-8 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display font-bold text-white">
              PROJECT <span className="text-orange-500">3D</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>Avda. de los Trabajadores, Polígono Industrial de Torrijos, Torrijos (Toledo)</span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => setIsSlideDeckOpen(true)}
              className="hover:text-orange-400 transition-colors"
            >
              {lang === 'es' ? 'Presentación (8 Diapositivas)' : 'Presentation (8 Slides)'}
            </button>
            <button
              type="button"
              onClick={() => setIsChatbotOpen(true)}
              className="hover:text-orange-400 transition-colors"
            >
              {lang === 'es' ? 'Asistente 24/7 (ES/EN)' : '24/7 Assistant (ES/EN)'}
            </button>
            <span>© {new Date().getFullYear()} Project 3D · Confidencialidad STL & RGPD</span>
          </div>
        </div>
      </footer>

      <ChatbotDrawer
        isOpen={isChatbotOpen}
        onToggle={() => setIsChatbotOpen((prev) => !prev)}
        lang={lang}
        onJumpToQuoter={() => scrollToSection('presupuesto')}
      />

      <SlideDeckModal
        isOpen={isSlideDeckOpen}
        onClose={() => setIsSlideDeckOpen(false)}
        lang={lang}
        onNavigateSection={handleSlideNavigate}
      />
    </div>
  );
}
