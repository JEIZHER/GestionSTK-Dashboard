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
  HelpCircle,
  Layers,
  ArrowUpDown,
  Palette,
  Sparkles,
  Smartphone,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function ManualView({ theme, isMobile }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [copiedVariable, setCopiedVariable] = useState(null);

  // Estados del simulador interactivo de WhatsApp
  const [simName, setSimName] = useState('Juan Pérez');
  const [simAddress, setSimAddress] = useState('Av. Brasil 123 Dpto 4');
  const [simOF, setSimOF] = useState('STK-9842');
  const [simAmount, setSimAmount] = useState('14900');
  const [simSector, setSimSector] = useState('Zona Norte');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedVariable(text);
    setTimeout(() => setCopiedVariable(null), 2000);
  };

  const sections = [
    {
      id: 'acc',
      category: 'acc',
      title: '1. Acceso e Inicio de Sesión',
      icon: <UserCheck className="w-5 h-5 text-indigo-500" />,
      items: [
        { title: 'Ingreso de Usuario', desc: 'Inicia sesión con tu correo electrónico y contraseña registrados.' },
        { title: 'Validación de Correo', desc: 'Si la cuenta requiere verificar correo, la app solicita confirmar el enlace enviado a tu bandeja.' },
        { title: 'Aprobación de Acceso', desc: 'Para nuevos usuarios, la aplicación notifica que la cuenta está en proceso de aprobación por administración.' },
        { title: 'Creación de Cuenta', desc: 'Botón de registro para nuevos operadores ingresando nombre completo, correo y contraseña.' }
      ]
    },
    {
      id: 'zonas',
      category: 'zonas',
      title: '2. 📍 Creación, Organización y Gestión de Zonas y Sectores',
      icon: <Layers className="w-5 h-5 text-emerald-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm opacity-80">
            GestionSTK permite estructurar los despachos en áreas geográficas personalizadas para agrupar entregas y optimizar recorridos.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/5">
              <div className="flex items-center gap-2 font-bold text-sm mb-2 text-indigo-500">
                <Layers className="w-4 h-4" /> ➕ Crear Zonas
              </div>
              <p className="text-xs opacity-75">
                En <strong>Configuración ➔ Configurar Sectores</strong> agregá nuevas áreas, tiempo promedio por parada y ventana de atención.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center gap-2 font-bold text-sm mb-2 text-emerald-500">
                <Palette className="w-4 h-4" /> 🎨 Colores de Zona
              </div>
              <p className="text-xs opacity-75">
                Asigná un color identificador que se aplicará en las solapas de Rutas, barras de tarjetas y pines del Mapa.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center gap-2 font-bold text-sm mb-2 text-amber-500">
                <ArrowUpDown className="w-4 h-4" /> ↕️ Reordenar Pestañas
              </div>
              <p className="text-xs opacity-75">
                Usá las flechas (▲/▼) para cambiar el orden jerárquico de las solapas principales para entregar primero las zonas prioritarias.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'rutas',
      category: 'rutas',
      title: '3.1. 🚚 Rutas (Pantalla de Inicio)',
      icon: <Truck className="w-5 h-5 text-blue-500" />,
      items: [
        { title: 'Solapas de Zona', desc: 'Conmutación rápida entre zonas con su color identificador asignado.' },
        { title: 'Reordenamiento Manual (Drag & Drop)', desc: 'Activá el modo arrastre para reordenar la secuencia numérica de entregas deslizando tarjetas arriba/abajo.' },
        { title: 'Pie de Tarjeta (Marcar Estado)', desc: 'Botones directos para marcar como Entregada (✓), Devuelta (✗) o cambiar modalidad de pago.' },
        { title: 'Ficha Rápida del Cliente', desc: 'Tocar el cuerpo de la tarjeta despliega la tarjeta flotante con datos de contacto, dirección y notas.' }
      ]
    },
    {
      id: 'mapas',
      category: 'mapas',
      title: '3.2. 🗺️ Mapas Interactivos',
      icon: <MapPin className="w-5 h-5 text-red-500" />,
      items: [
        { title: 'Marcadores de Entrega', desc: 'Muestra la ubicación geográfica de los destinatarios con pines teñidos del color de su zona.' },
        { title: 'Asignar Coordenadas', desc: 'Al tocar un punto en el mapa se guarda esa posición geográfica (latitud/longitud) directamente en la ficha del contacto.' },
        { title: 'Navegación GPS Externa', desc: 'Lanza Google Maps pre-cargado con las coordenadas de la parada seleccionada.' }
      ]
    },
    {
      id: 'detalles-of',
      category: 'of',
      title: '3.3. 💼 Detalles OF (Categorías y Notificaciones Masivas)',
      icon: <Wallet className="w-5 h-5 text-purple-500" />,
      items: [
        { title: 'Conmutador de Categoría OF', desc: 'Rotación entre tipos de orden: PxP (Por Pagar), COD (Cobro Contra Entrega), CTE (Prepagado) y EXT (Proveedores Especiales).' },
        { title: 'Contador Dinámico Pendientes/Total', desc: 'Indicador en tiempo real de avance por categoría y zona activa (ej. PxP - 5/12).' },
        { title: 'WhatsApp Masivo en Lote', desc: 'Botón superior para enviar notificaciones consecutivas a todos los pendientes de la categoría seleccionada.' }
      ]
    },
    {
      id: 'nomina',
      category: 'nomina',
      title: '3.4. 📋 Nómina (Cargas y Encomiendas sin Contacto)',
      icon: <ClipboardList className="w-5 h-5 text-cyan-500" />,
      items: [
        { title: 'Regla Operativa de Encomiendas sin Contacto', desc: 'En Nómina quedan visibles únicamente las OF que NO tienen contacto asignado. Una vez vinculadas, pasan automáticamente a Rutas.' },
        { title: 'Opciones de Carga', desc: 'Importación desde Google Sheet compartida, archivos XLS/CSV locales o entrada manual punto por punto.' },
        { title: 'Cerrar Todas las Nóminas', desc: 'Opción en el modal de la nube para vaciar la carga activa del teléfono (con opción de respaldo o borrado directo).' }
      ]
    },
    {
      id: 'rendir',
      category: 'rendir',
      title: '3.5. 📑 Rendir (Cierre de Despachos y Liquidación)',
      icon: <FileCheck className="w-5 h-5 text-emerald-500" />,
      items: [
        { title: 'Vista Resumen', desc: 'Panel con balance cuantitativo y financiero (entregadas, devueltas, pendientes, montos COD recopilados y fletes PxP).' },
        { title: 'Vista Lista', desc: 'Lista detallada de entregas agrupadas por zona visual para revisar tarjetas individuales y revertir estados.' },
        { title: 'Ficha Reporte (Rendir)', desc: 'Reporte formal de rendición de cuentas para el cierre de caja o supervisión.' },
        { title: 'Tabla de Tiempos', desc: 'Registro histórico con los horarios estimados y reales de llegada a cada destino.' }
      ]
    },
    {
      id: 'contactos',
      category: 'contactos',
      title: '3.6. 👥 Contactos (Agenda de Clientes)',
      icon: <Users className="w-5 h-5 text-amber-500" />,
      items: [
        { title: 'Agenda Interna Local', desc: 'Base de datos de clientes guardada de forma segura en el dispositivo.' },
        { title: 'Búsqueda & Filtro por Sector', desc: 'Filtrado rápido por nombre, dirección, teléfono o sector asignado.' },
        { title: 'Alta & Edición', desc: 'Formulario para registrar teléfonos, direcciones, coordenadas GPS y notas especiales.' }
      ]
    },
    {
      id: 'settings',
      category: 'settings',
      title: '3.7. ⚙️ Configuración (Ajustes Generales)',
      icon: <Settings className="w-5 h-5 text-gray-500" />,
      items: [
        { title: 'Asistente de IA (Gemini)', desc: 'Ingreso de clave de IA, selector de modelos (Gemini 3.7, 3.6, 3.5, 1.5) y prueba de conexión.' },
        { title: 'Respaldos & Datos', desc: 'Exportación e importación de copias de seguridad locales y restauración.' },
        { title: 'Sectores & Compartir Zonas', desc: 'Configuración de áreas, promedios de tiempo y transferencia de zonas entre repartidores.' }
      ]
    }
  ];

  const filteredSections = sections.filter(sec => {
    if (activeFilter !== 'all' && sec.category !== activeFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchTitle = sec.title.toLowerCase().includes(q);
    const matchItems = sec.items?.some(i => i.title.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q));
    return matchTitle || matchItems;
  });

  return (
    <div className="space-y-8 animate-fadeIn" style={{ color: theme.text }}>
      {/* Header Banner */}
      <div 
        className="p-8 rounded-3xl relative overflow-hidden shadow-xl border"
        style={{ 
          backgroundColor: theme.cardBg, 
          borderColor: theme.border 
        }}
      >
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <BookOpen className="w-3.5 h-3.5" /> Manual de Usuario & Guía Rápida — GestionSTK
          </div>
          <h1 className="text-3xl font-black tracking-tight font-sans">
            Manual Operativo GestionSTK
          </h1>
          <p className="text-sm opacity-80 max-w-3xl leading-relaxed">
            Guía de uso práctica basada estrictamente en la funcionalidad real de la aplicación móvil: optimización de rutas, clasificación de encomiendas, notificaciones por WhatsApp con etiquetas inteligentes y matching automatizado con Inteligencia Artificial.
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-xl">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
              <input
                type="text"
                placeholder="Buscar función, pantalla o módulo (ej: WhatsApp, Drag & Drop, Gemini)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-sm rounded-xl border outline-none transition-all"
                style={{ 
                  backgroundColor: theme.bg, 
                  borderColor: theme.border,
                  color: theme.text 
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Feature Modules Grid */}
      <div className="space-y-6">
        {filteredSections.map(sec => (
          <div 
            key={sec.id} 
            id={sec.id}
            className="p-6 rounded-2xl border shadow-sm transition-all hover:shadow-md"
            style={{ 
              backgroundColor: theme.cardBg, 
              borderColor: theme.border 
            }}
          >
            <div className="flex items-center gap-3 pb-4 mb-4 border-b" style={{ borderColor: theme.border }}>
              {sec.icon}
              <h2 className="text-lg font-bold">{sec.title}</h2>
            </div>

            {sec.content}

            {sec.items && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sec.items.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 rounded-xl border transition-all"
                    style={{ 
                      backgroundColor: theme.bg, 
                      borderColor: theme.border 
                    }}
                  >
                    <h3 className="font-semibold text-sm mb-1.5 flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-indigo-500" /> {item.title}
                    </h3>
                    <p className="text-xs opacity-75 leading-relaxed pl-6">{item.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* WhatsApp Simulator Module */}
      <div 
        id="messaging"
        className="p-6 rounded-2xl border shadow-lg space-y-6"
        style={{ 
          backgroundColor: theme.cardBg, 
          borderColor: theme.border 
        }}
      >
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">📲 Sistema de Mensajería WhatsApp & Etiquetas Inteligentes</h2>
              <p className="text-xs opacity-75">Configuración de plantillas con reemplazo dinámico de variables</p>
            </div>
          </div>
        </div>

        {/* Dynamic Variable Chips */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-70">Etiquetas Inteligentes Disponibles (Click para copiar):</h3>
          <div className="flex flex-wrap gap-2">
            {['{nombre}', '{direccion}', '{orden_flete}', '{monto}', '{sector}'].map(tag => (
              <button
                key={tag}
                onClick={() => copyToClipboard(tag)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all flex items-center gap-1.5"
              >
                {tag}
                {copiedVariable === tag ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-60" />}
              </button>
            ))}
          </div>
        </div>

        {/* Live Interactive Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Controls */}
          <div className="space-y-3 p-4 rounded-xl border" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
            <h4 className="text-xs font-bold uppercase opacity-70 mb-3">Probador de Etiquetas en Tiempo Real:</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs opacity-70 block mb-1">Nombre Destinatario:</label>
                <input
                  type="text"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border outline-none"
                  style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }}
                />
              </div>
              <div>
                <label className="text-xs opacity-70 block mb-1">Dirección:</label>
                <input
                  type="text"
                  value={simAddress}
                  onChange={(e) => setSimAddress(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border outline-none"
                  style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }}
                />
              </div>
              <div>
                <label className="text-xs opacity-70 block mb-1">Nº Orden Flete (OF):</label>
                <input
                  type="text"
                  value={simOF}
                  onChange={(e) => setSimOF(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border outline-none"
                  style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }}
                />
              </div>
              <div>
                <label className="text-xs opacity-70 block mb-1">Monto a Cancelar ($):</label>
                <input
                  type="text"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border outline-none"
                  style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.text }}
                />
              </div>
            </div>
          </div>

          {/* WhatsApp Preview Bubble */}
          <div className="bg-[#0b141a] text-[#e9edef] rounded-xl p-4 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#25d366] flex items-center justify-center text-white font-bold text-xs">
                WA
              </div>
              <div>
                <div className="text-xs font-bold">{simName || 'Cliente'}</div>
                <div className="text-[10px] text-[#8696a0]">Chat de Notificación Directa</div>
              </div>
            </div>

            <div className="bg-[#005c4b] p-3 rounded-xl rounded-tr-none text-xs leading-relaxed max-w-[90%] ml-auto">
              Hola <span className="font-bold text-[#70e000]">{simName}</span>, estamos en camino a <span className="font-bold text-[#70e000]">{simAddress}</span> con tu encomienda OF <span className="font-bold text-[#70e000]">{simOF}</span>. El monto a cancelar es <span className="font-bold text-[#70e000]">${simAmount}</span>.
            </div>

            <div className="pt-3 text-[10px] text-right text-[#8696a0]">
              Entregado vía WhatsApp desde GestionSTK
            </div>
          </div>
        </div>
      </div>

      {/* Gemini AI Matching Module */}
      <div 
        id="ai-matching"
        className="p-6 rounded-2xl border shadow-lg space-y-4"
        style={{ 
          backgroundColor: theme.cardBg, 
          borderColor: theme.border 
        }}
      >
        <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: theme.border }}>
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">🤖 Motor de Matching Inteligente con IA (Gemini)</h2>
            <p className="text-xs opacity-75">Evaluación masiva, coincidencias parciales y auditoría de esfuerzo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
            <h3 className="font-bold text-sm text-purple-500 mb-1">1. Progreso Fluido</h3>
            <p className="text-xs opacity-75">Barra de avance visual continuo mientras la IA o el algoritmo determinista evalúan los registros.</p>
          </div>
          <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
            <h3 className="font-bold text-sm text-emerald-500 mb-1">2. Auditoría de Ahorro</h3>
            <p className="text-xs opacity-75">Resumen final con % de esfuerzo ahorrado y 3 grupos: 🟩 Match Directo, 🟧 Parciales y 🟥 Descartados.</p>
          </div>
          <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
            <h3 className="font-bold text-sm text-amber-500 mb-1">3. Resiliencia ante Cuota</h3>
            <p className="text-xs opacity-75">Si el modelo se satura, podés elegir: <em>Reintentar, Cambiar Modelo o Continuar sin IA</em> sin perder datos.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
