import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  MapPin, 
  Truck, 
  Wallet, 
  ClipboardList, 
  FileCheck, 
  Users, 
  Settings, 
  MessageSquare, 
  Bot, 
  UserCheck, 
  Copy, 
  Check, 
  Layers, 
  ArrowUpDown, 
  Palette, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Info, 
  CloudDownload, 
  Trash2, 
  Clock, 
  FileText, 
  ListCheck, 
  ShieldCheck, 
  RotateCcw,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Minimize2,
  HelpCircle,
  Compass,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function ManualView({ theme, isMobile }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [copiedVariable, setCopiedVariable] = useState(null);

  // Estado inicial: TODAS las secciones colapsadas por defecto
  const [openSections, setOpenSections] = useState({
    acc: false,
    zonas: false,
    rutas: false,
    mapas: false,
    of: false,
    messaging: false,
    nomina: false,
    aimatching: false,
    rendir: false,
    contactos: false,
    settings: false,
    faq: false
  });

  // Estados del simulador interactivo de WhatsApp
  const [simName, setSimName] = useState('Juan Pérez');
  const [simAddress, setSimAddress] = useState('Av. Brasil 123 Dpto 4');
  const [simOF, setSimOF] = useState('STK-9842');
  const [simAmount, setSimAmount] = useState('14900');

  const toggleSection = (id) => {
    setOpenSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const allOpen = {};
    sections.forEach(s => allOpen[s.id] = true);
    setOpenSections(allOpen);
  };

  const collapseAll = () => {
    const allClosed = {};
    sections.forEach(s => allClosed[s.id] = false);
    setOpenSections(allClosed);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedVariable(text);
    setTimeout(() => setCopiedVariable(null), 2000);
  };

  const sections = [
    {
      id: 'acc',
      category: 'general',
      title: '1. Acceso e Inicio de Sesión',
      icon: <UserCheck className="w-5 h-5 text-indigo-500" />,
      summary: 'Ingreso con credenciales Supabase, validación de correo y aprobación administrativa.',
      details: [
        { title: 'Ingreso de Usuario', desc: 'Inicia sesión con tu correo electrónico y contraseña registrados.' },
        { title: 'Validación de Correo (ConfirmEmailScreen)', desc: 'Si tu cuenta requiere verificar el correo, la aplicación te solicitará confirmar el enlace enviado a tu bandeja de entrada.' },
        { title: 'Aprobación de Acceso', desc: 'Para nuevos usuarios registrados, la aplicación notifica que la cuenta se encuentra en proceso de aprobación por la administración.' },
        { title: 'Creación de Cuenta (Registro)', desc: 'Formulario de registro para nuevos operadores ingresando nombre completo, correo y contraseña.' }
      ]
    },
    {
      id: 'zonas',
      category: 'rutas',
      title: '2. 📍 Creación, Organización y Gestión de Zonas y Sectores',
      icon: <Layers className="w-5 h-5 text-emerald-500" />,
      summary: 'Estructuración de áreas geográficas, asignación de colores identificadores y jerarquía de pestañas.',
      content: (
        <div className="space-y-4 pt-2">
          <p className="text-xs opacity-80 leading-relaxed">
            GestionSTK permite estructurar los despachos en áreas geográficas o sectores personalizados para agrupar las entregas y optimizar los recorridos.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/5 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs text-indigo-500">
                <PlusCircle className="w-4 h-4" /> ➕ Creación de Zonas
              </div>
              <p className="text-[11px] opacity-80">
                Ve a <strong>Configuración ➔ Configurar Sectores / Áreas</strong>, tocá <em>"Agregar Área"</em> e ingresá el nombre (ej. <em>Zona Norte, Centro, Macul</em>), tiempo promedio por parada y ventana horaria.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-500">
                <Palette className="w-4 h-4" /> 🎨 Colores Identificadores
              </div>
              <p className="text-[11px] opacity-80">
                Asigná un color propio a cada zona. El color se refleja en: las solapas de <strong>Rutas</strong>, la barra superior de cada tarjeta de entrega y los marcadores (pines) del <strong>Mapa Interactivo</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-500">
                <ArrowUpDown className="w-4 h-4" /> ↕️ Reordenar Pestañas
              </div>
              <p className="text-[11px] opacity-80">
                Usá las flechas <strong>Subir (▲)</strong> y <strong>Bajar (▼)</strong> en la lista de sectores para definir el orden de las pestañas en Rutas y repartir primero las zonas prioritarias.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border bg-black/10 space-y-2 text-xs">
            <div className="font-bold flex items-center gap-1.5 opacity-90">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Reasignación y Compartición de Envíos:
            </div>
            <ul className="list-disc pl-5 space-y-1 opacity-80 text-[11px]">
              <li><strong>Reordenamiento dentro de la Zona (Drag & Drop):</strong> En Rutas, activá el modo arrastre para cambiar el orden numérico deslizando las tarjetas arriba/abajo.</li>
              <li><strong>Reasignar Zona de un Envío:</strong> La zona proviene de la nómina o contacto. Al modificar la zona editando la nómina o el contacto, la tarjeta se mueve automáticamente a la solapa correspondiente.</li>
              <li><strong>Compartir Zonas entre Repartidores:</strong> Desde Configuración podés transferir la estructura de sectores a otros operadores con el botón <em>Compartir Zona</em>.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'rutas',
      category: 'rutas',
      title: '3. 🚚 Rutas (Pantalla Principal — HomeScreen)',
      icon: <Truck className="w-5 h-5 text-blue-500" />,
      summary: 'Trabajo diario, solapas por zona, modo arrastre (Drag & Drop) y acciones en tarjetas.',
      details: [
        { title: 'Barra de Resumen Superior (ResumenHeaderBar)', desc: 'Indica el total de despachos asignados por zona y el avance del estado del día.' },
        { title: 'Pestañas de Zona', desc: 'Permiten conmutar la lista entre distintas áreas geográficas con su color identificador.' },
        { title: 'Búsqueda por Lupa', desc: 'Buscador rápido para ubicar cualquier envío ingresando el número de orden de flete exacto o parcial.' },
        { title: 'Reordenamiento Manual (Drag & Drop)', desc: 'Permite cambiar el orden numérico de entrega dentro de una misma zona deslizando las tarjetas.' },
        { title: 'Marcar Estado (Entregada / Devuelta)', desc: 'En el pie de tarjeta (footer) se ubican los botones de acción rápida para marcar como Entregada (✓) o Devuelta (✗), o cambiar la modalidad de pago.' },
        { title: 'Botón WhatsApp', desc: 'Abre el menú de mensajes pre-configurados para notificar al destinatario al instante.' },
        { title: 'Ficha Rápida del Cliente', desc: 'Al tocar la información del cliente se despliega la tarjeta flotante con sus datos de contacto, dirección y notas.' }
      ]
    },
    {
      id: 'mapas',
      category: 'mapas',
      title: '4. 🗺️ Mapas (MapasScreen & Geolocalización)',
      icon: <MapPin className="w-5 h-5 text-red-500" />,
      summary: 'Visualización geográfica con Leaflet, asignación de coordenadas y guiado GPS externo.',
      details: [
        { title: 'Marcadores en el Mapa', desc: 'Muestra la ubicación de cada cliente con pines pintados del color de su zona correspondiente.' },
        { title: 'Asignación Manual de Coordenadas', desc: 'Si un cliente no tiene ubicación exacta, al tocar el punto deseado en el mapa podés guardar esa posición geográfica (lat/lng) directamente en su ficha o en la OF.' },
        { title: 'Ubicación GPS', desc: 'Botón para centrar el mapa en tu posición actual en la ruta.' },
        { title: 'Navegar a Destino (Guiado GPS)', desc: 'Lanza Google Maps pre-cargado con las coordenadas de la entrega seleccionada para iniciar la navegación giro a giro.' },
        { title: 'Proveedor de Mapas', desc: 'Integración fluida con Leaflet WebView en la aplicación móvil para rendimiento optimizado y bajo consumo de datos.' }
      ]
    },
    {
      id: 'of',
      category: 'of',
      title: '5. 💼 Detalles OF (Categorías de Encomienda y Cobros)',
      icon: <Wallet className="w-5 h-5 text-purple-500" />,
      summary: 'Filtro rotativo por categoría (PxP, COD, CTE, EXT) y notificaciones masivas por WhatsApp.',
      details: [
        { title: 'Conmutador de Tipo de OF (Icono Superior Derecho)', desc: 'Rotación entre categorías: PxP (Por Pagar en destino), COD (Cobro Contra Entrega de producto), CTE (Flete Pagado) y EXT (Proveedores Especiales).' },
        { title: 'Contador Dinámico de Pendientes', desc: 'Muestra en tiempo real la relación Pendientes / Total para la categoría y zona activa (ej. PxP - 5/12).' },
        { title: 'Filtro por Zona', desc: 'Permite conmutar la lista para consultar los tipos de OF en una zona específica.' },
        { title: 'Notificación Masiva por WhatsApp (Icono Grupo)', desc: 'Abre el selector de mensajes para notificar secuencialmente en lote a todos los clientes pendientes de la categoría y zona seleccionadas.' }
      ]
    },
    {
      id: 'messaging',
      category: 'of',
      title: '6. 📲 Sistema de Mensajería WhatsApp, Plantillas & Simulador',
      icon: <MessageSquare className="w-5 h-5 text-emerald-500" />,
      summary: '7 plantillas estándar, etiquetas dinámicas copiables y simulador interactivo.',
      content: (
        <div className="space-y-5 pt-2">
          {/* 7 Standard Templates */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-70">7 Plantillas Pre-configuradas Estándar:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {[
                { name: 'Por Pagar', desc: 'Para envíos cuyo flete se cobra al recibir.' },
                { name: 'Predeterminado', desc: 'Mensaje estándar de cortesía sobre el despacho.' },
                { name: 'Aviso de Llegada', desc: 'Alerta al cliente indicando llegada a la puerta.' },
                { name: 'Coordinación', desc: 'Para acordar horarios o referencias de entrega.' },
                { name: 'Mensaje COD', desc: 'Especifica el monto a cobrar por producto contra entrega.' },
                { name: 'En Camino', desc: 'Notifica inicio de ruta en marcha hacia su sector.' },
                { name: 'Pre-Aviso', desc: 'Notificación anticipada para proveedores o encomiendas especiales.' }
              ].map((tpl, i) => (
                <div key={i} className="p-3 rounded-xl border text-xs" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
                  <div className="font-bold text-emerald-500 mb-0.5">{tpl.name}</div>
                  <div className="text-[10px] opacity-75">{tpl.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Variable Chips */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-70">Etiquetas Inteligentes (Click para copiar):</h3>
            <div className="flex flex-wrap gap-2">
              {['{nombre}', '{direccion}', '{orden_flete}', '{monto}', '{sector}'].map(tag => (
                <button
                  key={tag}
                  onClick={() => copyToClipboard(tag)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                >
                  {tag}
                  {copiedVariable === tag ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-60" />}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive WhatsApp Simulator */}
          <div className="bg-[#0b141a] text-[#e9edef] rounded-xl p-4 border border-white/10 space-y-4 shadow-md">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="w-8 h-8 rounded-full bg-[#25d366] flex items-center justify-center text-white font-bold text-xs">
                WA
              </div>
              <div>
                <div className="text-xs font-bold">{simName || 'Cliente'}</div>
                <div className="text-[10px] text-[#8696a0]">Simulador de Notificación Directa</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>
                <label className="text-[10px] opacity-60 block">Nombre:</label>
                <input
                  type="text"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded bg-white/10 border border-white/10 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] opacity-60 block">Dirección:</label>
                <input
                  type="text"
                  value={simAddress}
                  onChange={(e) => setSimAddress(e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded bg-white/10 border border-white/10 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] opacity-60 block">OF #:</label>
                <input
                  type="text"
                  value={simOF}
                  onChange={(e) => setSimOF(e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded bg-white/10 border border-white/10 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] opacity-60 block">Monto ($):</label>
                <input
                  type="text"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded bg-white/10 border border-white/10 text-white outline-none"
                />
              </div>
            </div>

            <div className="bg-[#005c4b] p-3 rounded-xl rounded-tr-none text-xs leading-relaxed max-w-[85%] ml-auto">
              Hola <span className="font-bold text-[#70e000]">{simName}</span>, estamos en camino a <span className="font-bold text-[#70e000]">{simAddress}</span> con tu encomienda OF <span className="font-bold text-[#70e000]">{simOF}</span>. El monto a cancelar es <span className="font-bold text-[#70e000]">${simAmount}</span>.
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'nomina',
      category: 'nomina',
      title: '7. 📋 Nómina (Cargas y Encomiendas sin Contacto)',
      icon: <ClipboardList className="w-5 h-5 text-cyan-500" />,
      summary: 'Bandeja de encomiendas sin contacto vinculado, opciones de descarga y borrado de nóminas.',
      content: (
        <div className="space-y-3 pt-2">
          <div className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 space-y-1">
            <div className="font-bold text-xs text-indigo-400 flex items-center gap-1.5">
              <Info className="w-4 h-4" /> Regla Operativa de Encomiendas sin Contacto:
            </div>
            <p className="text-[11px] opacity-80 leading-relaxed">
              En la pantalla de <strong>Nómina</strong> quedan visibles <strong>únicamente las órdenes de flete que aún NO tienen un contacto vinculado</strong> (las que no pudieron ser matcheadas automáticamente con la agenda). Su objetivo es permitir al operador asignar manualmente un cliente de la agenda o registrar un <em>Nuevo Contacto</em>. <strong>Una vez que la orden se vincula a un contacto, pasa automáticamente a la pantalla de Rutas</strong>, desapareciendo de la lista de pendientes de Nómina.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl border bg-black/10">
              <div className="font-bold text-xs mb-1 flex items-center gap-1.5 text-cyan-400">
                <CloudDownload className="w-4 h-4" /> Descargar / Opciones de Nómina
              </div>
              <p className="text-[11px] opacity-75">
                Tocá el <strong>Icono de Nube</strong> para cargar planillas desde Google Sheet compartida, archivos XLS/CSV locales o Entrada Manual.
              </p>
            </div>
            <div className="p-3 rounded-xl border bg-black/10">
              <div className="font-bold text-xs mb-1 flex items-center gap-1.5 text-red-400">
                <Trash2 className="w-4 h-4" /> Cerrar Todas las Nóminas
              </div>
              <p className="text-[11px] opacity-75">
                Opción en el modal de la nube para vaciar las nóminas activas del dispositivo (ofreciendo guardar respaldo o realizar borrado directo).
              </p>
            </div>
            <div className="p-3 rounded-xl border bg-black/10">
              <div className="font-bold text-xs mb-1 flex items-center gap-1.5 text-purple-400">
                <Bot className="w-4 h-4" /> Matching Automático
              </div>
              <p className="text-[11px] opacity-75">
                Botonera para disparar el motor de cruce entre la planilla descargada y la agenda de contactos guardada.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'aimatching',
      category: 'nomina',
      title: '8. 🤖 Motor de Matching Inteligente con IA (Gemini)',
      icon: <Bot className="w-5 h-5 text-purple-500" />,
      summary: 'Barra fluida, tarjetas parciales, auditoría de ahorro y resiliencia de cuotas.',
      content: (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border text-xs" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
              <h3 className="font-bold text-purple-500 mb-1">1. Progreso Fluido (AIProcessingModal)</h3>
              <p className="text-[11px] opacity-75">Barra de avance visual con ticker continuo mientras la IA compara planillas.</p>
            </div>

            <div className="p-3.5 rounded-xl border text-xs" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
              <h3 className="font-bold text-amber-500 mb-1">2. Coincidencias Parciales (PartialMatchModal)</h3>
              <p className="text-[11px] opacity-75">Si hay dudas menores en nombre/dirección, despliega tarjeta interactiva para que el usuario confirme.</p>
            </div>

            <div className="p-3.5 rounded-xl border text-xs" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
              <h3 className="font-bold text-emerald-500 mb-1">3. Auditoría de Ahorro (AiAuditModal)</h3>
              <p className="text-[11px] opacity-75">Calcula el % de esfuerzo ahorrado y clasifica en 🟩 Match Directo, 🟧 Parciales y 🟥 Descartados.</p>
            </div>

            <div className="p-3.5 rounded-xl border text-xs" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
              <h3 className="font-bold text-red-500 mb-1">4. Resiliencia de Cuota</h3>
              <p className="text-[11px] opacity-75">Si falla la IA, ofrece 3 opciones: <em>Reintentar, Cambiar Modelo (GeminiQuotaModal) o Continuar sin IA</em>.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'rendir',
      category: 'rendir',
      title: '9. 📑 Rendir (Cierre de Despachos y Auditoría Diaria)',
      icon: <FileCheck className="w-5 h-5 text-emerald-500" />,
      summary: 'Auditoría en terreno del día en curso. La consulta de históricos y gestión de documentos se realiza en el Dashboard Web.',
      details: [
        { title: 'Vista Resumen (Botonera Principal)', desc: 'Muestra en pantalla el balance cuantitativo y financiero del día actual (entregadas, devueltas, cobros COD y fletes PxP por cobrar).' },
        { title: 'Vista Lista (Botonera Principal)', desc: 'Lista detallada de las entregas del día agrupadas por zona (RendirList), para revisar tarjetas individuales (RendirItem) o revertir estados de entrega.' },
        { title: 'Rendir (Ficha Reporte)', desc: 'Despliega la ficha visual en pantalla (FichaReporteRendir) para arqueo directo con la tripulación. La app móvil NO genera archivos o documentos descargables.' },
        { title: 'Plataforma Web (Históricos & Documentos)', desc: 'Para revisar movimientos históricos, estadísticas avanzadas o generar informes consolidados de rendición, ingresá a https://gestiondashboard.netlify.app/.' }
      ]
    },
    {
      id: 'contactos',
      category: 'contactos',
      title: '10. 👥 Contactos (Agenda de Clientes Local)',
      icon: <Users className="w-5 h-5 text-amber-500" />,
      summary: 'Base de datos interna guardada localmente en el dispositivo.',
      details: [
        { title: 'Buscador de Clientes', desc: 'Filtra rápidamente por nombre, dirección o número de teléfono.' },
        { title: 'Nuevo Contacto / Editar (ContactoModal)', desc: 'Formulario para registrar o actualizar nombres, teléfonos, notas de entrega y posiciones geográficas.' },
        { title: 'Filtrar por Sector', desc: 'Permite consultar los contactos guardados pertenecientes a una zona geográfica específica.' }
      ]
    },
    {
      id: 'settings',
      category: 'settings',
      title: '11. ⚙️ Configuración (SettingsScreen & Ajustes del Sistema)',
      icon: <Settings className="w-5 h-5 text-gray-400" />,
      summary: 'Ajustes de IA, temas visuales, respaldos de datos, sectores y sesión.',
      details: [
        { title: 'Asistente de Inteligencia Artificial (Gemini)', desc: 'Ingreso de clave privada de IA, selector de modelo (Gemini 3.7, 3.6, 3.5, 1.5) y botón de prueba de conexión.' },
        { title: 'Apariencia & Temas', desc: 'Personalización de colores del sistema, modo claro u oscuro y fuentes.' },
        { title: 'Copia de Seguridad & Datos', desc: 'Herramientas para exportar e importar respaldos locales de la base de datos o reiniciar datos.' },
        { title: 'Configurar Sectores / Áreas & Compartir Zonas', desc: 'Creación, edición, colores, orden jerárquico y transferencia de zonas entre repartidores.' },
        { title: 'Cierre de Sesión', desc: 'Salida segura de la cuenta de usuario.' }
      ]
    },
    {
      id: 'faq',
      category: 'faq',
      title: '12. ❓ Preguntas Frecuentes (FAQ Operativo)',
      icon: <HelpCircle className="w-5 h-5 text-indigo-400" />,
      summary: 'Respuestas a las dudas operativas más comunes sobre el uso diario de GestionSTK.',
      content: (
        <div className="space-y-3 pt-2">
          {[
            {
              q: '¿Por qué cargué una nómina y no aparecen entregas en la pantalla de Rutas?',
              a: 'Las órdenes de flete recién cargadas no aparecen en Rutas si no tienen un contacto vinculado de la agenda. Permanecen en la pantalla de Nómina como "Sin Contacto". En cuanto les asignes un cliente manualmente o ejecutes el Matching Inteligente con IA, se moverán automáticamente a Rutas.'
            },
            {
              q: '¿Cómo cambio una orden de entrega de una zona a otra?',
              a: 'Ingresá a los datos de la nómina o editá el contacto asociado a esa entrega y seleccioná la nueva zona asignada. El despacho cambiará de pestaña en la pantalla de Rutas y adoptará el color de su nueva zona.'
            },
            {
              q: '¿Qué hago si se agota la cuota de la IA de Gemini durante la importación?',
              a: 'La aplicación desplegará automáticamente el modal de resiliencia de cuota (GeminiQuotaModal). Podés cambiar a un modelo más liviano como Gemini 1.5 Flash, actualizar tu API Key privada en Configuración o presionar "Continuar sin IA" para finalizar el cruce tradicional.'
            },
            {
              q: '¿Cómo reordeno el recorrido de entrega dentro de una misma zona?',
              a: 'En la pantalla de Rutas, activá el modo de reordenamiento manual (Drag & Drop). Podrás deslizar las tarjetas hacia arriba o hacia abajo para establecer el orden numérico exacto de tu recorrido diario.'
            },
            {
              q: '¿Cómo comparto la estructura de zonas con otro repartidor?',
              a: 'Ingresá a Configuración (⚙️) ➔ Configurar Sectores / Áreas y utilizá la opción "Compartir Zona" para transferir la lista de áreas y sus colores asignados a otro operador.'
            },
            {
              q: '¿Cómo realizo el cierre de caja y dónde consulto los reportes e históricos formales?',
              a: 'En la app móvil, la pantalla Rendir te permite auditar los movimientos y montos cobrados en el día (resumen COD, PxP y Ficha Reporte en pantalla). La app móvil solo proporciona una vista operativa del día en curso y no genera archivos. Para revisar movimientos históricos, estadísticas completas o exportar documentos de rendición, ingresá a la web oficial: https://gestiondashboard.netlify.app/.'
            }
          ].map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border text-xs space-y-1" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
              <div className="font-bold text-indigo-400 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 shrink-0 text-indigo-500" /> {item.q}
              </div>
              <p className="text-[11px] opacity-80 leading-relaxed pl-5">{item.a}</p>
            </div>
          ))}
        </div>
      )
    }
  ];

  const categories = [
    { id: 'all', label: 'Todas las Secciones' },
    { id: 'general', label: '1. Acceso & Cuentas' },
    { id: 'rutas', label: '2-3. Zonas & Rutas' },
    { id: 'mapas', label: '4. Mapas & GPS' },
    { id: 'of', label: '5-6. Detalles OF & Mensajes' },
    { id: 'nomina', label: '7-8. Nómina & Matching IA' },
    { id: 'rendir', label: '9. Rendir & Cierre' },
    { id: 'contactos', label: '10. Agenda Contactos' },
    { id: 'settings', label: '11. Configuración' },
    { id: 'faq', label: '12. Preguntas Frecuentes (FAQ)' }
  ];

  const filteredSections = sections.filter(sec => {
    if (activeCategory !== 'all' && sec.category !== activeCategory) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchTitle = sec.title.toLowerCase().includes(q);
    const matchSummary = sec.summary?.toLowerCase().includes(q);
    const matchDetails = sec.details?.some(d => d.title.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q));
    return matchTitle || matchSummary || matchDetails;
  });

  return (
    <div className="space-y-6 animate-fadeIn" style={{ color: theme.text }}>
      {/* Header Banner */}
      <div 
        className="p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-xl border"
        style={{ 
          backgroundColor: theme.cardBg, 
          borderColor: theme.border 
        }}
      >
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <BookOpen className="w-3.5 h-3.5" /> Manual de Usuario & Guía Operativa
            </div>

            {/* Expand / Collapse All Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={expandAll}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 hover:opacity-80"
                style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
              >
                <Maximize2 className="w-3.5 h-3.5 text-indigo-500" /> Expandir Todos
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 hover:opacity-80"
                style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
              >
                <Minimize2 className="w-3.5 h-3.5 text-amber-500" /> Colapsar Todos
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Manual Operativo GestionSTK
            </h1>
            <p className="text-xs md:text-sm opacity-80 max-w-3xl leading-relaxed mt-1">
              Manual completo e interactivo basado en la funcionalidad real del código fuente. Hacé clic en el encabezado de cualquier sección para expandir o colapsar sus detalles.
            </p>
          </div>

          {/* Search Bar & Category Filter */}
          <div className="space-y-3 pt-2">
            <div className="relative max-w-xl">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
              <input
                type="text"
                placeholder="Buscar cualquier función o pantalla (ej: WhatsApp, Drag & Drop, Gemini, PxP, FAQ)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 text-xs md:text-sm rounded-xl border outline-none transition-all"
                style={{ 
                  backgroundColor: theme.bg, 
                  borderColor: theme.border,
                  color: theme.text 
                }}
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                    activeCategory === cat.id 
                      ? 'bg-indigo-500 text-white border-indigo-500 shadow-md' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={activeCategory !== cat.id ? { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text } : {}}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Collapsible Sections */}
      <div className="space-y-4">
        {filteredSections.map(sec => {
          const isOpen = openSections[sec.id] ?? false;

          return (
            <div 
              key={sec.id} 
              id={sec.id}
              className="rounded-2xl border shadow-sm transition-all overflow-hidden"
              style={{ 
                backgroundColor: theme.cardBg, 
                borderColor: theme.border 
              }}
            >
              {/* Accordion Header Bar */}
              <button
                onClick={() => toggleSection(sec.id)}
                className="w-full p-5 text-left flex items-center justify-between transition-colors hover:bg-black/5"
                style={{ borderColor: theme.border }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10">
                    {sec.icon}
                  </div>
                  <div>
                    <h2 className="text-base font-bold flex items-center gap-2">
                      {sec.title}
                    </h2>
                    {sec.summary && (
                      <p className="text-xs opacity-65 mt-0.5 line-clamp-1">{sec.summary}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold opacity-50 px-2 py-0.5 rounded bg-black/10">
                    {isOpen ? 'Abierto' : 'Colapsado'}
                  </span>
                  {isOpen ? <ChevronUp className="w-5 h-5 opacity-60" /> : <ChevronDown className="w-5 h-5 opacity-60" />}
                </div>
              </button>

              {/* Accordion Collapsible Content Body */}
              {isOpen && (
                <div className="p-5 pt-0 border-t space-y-4" style={{ borderColor: theme.border }}>
                  {sec.content}

                  {sec.details && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                      {sec.details.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="p-3.5 rounded-xl border transition-all hover:border-indigo-500/30"
                          style={{ 
                            backgroundColor: theme.bg, 
                            borderColor: theme.border 
                          }}
                        >
                          <h3 className="font-bold text-xs mb-1 flex items-center gap-1.5">
                            <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> {item.title}
                          </h3>
                          <p className="text-[11px] opacity-75 leading-relaxed pl-5">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
