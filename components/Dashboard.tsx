import React, { useMemo, useState } from 'react';
import { ConflictCase, RiskLevel, CaseStatus, UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface DashboardProps {
  cases: ConflictCase[];
  onSelectCase: (c: ConflictCase) => void;
}

const COLORS: { [key: string]: string } = {
  // Valores en español (del enum)
  'BAJO': '#10B981',      // Green
  'MEDIO': '#F59E0B',     // Amber
  'ALTO': '#EF4444',      // Red
  'CRÍTICO': '#991B1B',   // Deep Red
  // Claves en inglés (fallback por si acaso)
  'LOW': '#10B981',
  'MEDIUM': '#F59E0B',
  'HIGH': '#EF4444',
  'CRITICAL': '#991B1B'
};

const Dashboard: React.FC<DashboardProps> = ({ cases = [], onSelectCase }) => {
  // Estados para búsqueda y filtros
  const [searchId, setSearchId] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [filterReporter, setFilterReporter] = useState<string>('');
  const [filterRisk, setFilterRisk] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  
  // KPIs con protección contra datos vacíos
  const stats = useMemo(() => {
    if (!Array.isArray(cases)) return { total: 0, active: 0, critical: 0, resolved: 0 };
    console.log('📈 [Dashboard Stats] Casos totales:', cases.length);
    return {
      total: cases.length,
      active: cases.filter(c => c.status !== CaseStatus.CLOSED).length,
      critical: cases.filter(c => c.riskLevel === RiskLevel.CRITICAL).length,
      resolved: cases.filter(c => c.status === CaseStatus.RESOLVED || c.status === CaseStatus.CLOSED).length
    };
  }, [cases]);

  // Data para Gráficos
  const riskData = useMemo(() => {
    if (!Array.isArray(cases) || cases.length === 0) return [];
    
    console.log('🔍 [Dashboard] Cases recibidas:', cases.length, 'casos');
    console.log('📊 [Dashboard] RiskLevel enum values:', Object.values(RiskLevel));
    console.log('📊 [Dashboard] Primeros riskLevels de datos:', cases.slice(0, 3).map(c => c.riskLevel));
    
    const counts = cases.reduce((acc, curr) => {
      const risk = curr.riskLevel || 'DESCONOCIDO';
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📊 [Dashboard] Conteos calculados:', counts);
    
    // Mapear los valores del enum a los conteos, priorizando lo que existe en los datos
    const allRisks = new Set([
      ...Object.values(RiskLevel),
      ...Object.keys(counts)
    ]);
    
    const result = Array.from(allRisks).map(level => ({
      name: String(level),
      value: counts[level] || 0
    })).filter(d => d.value > 0);
    
    console.log('📊 [Dashboard] riskData final:', result);
    
    return result;
  }, [cases]);

  // Filtrado y búsqueda
  const filteredCases = useMemo(() => {
    if (!Array.isArray(cases)) return [];
    
    return cases.filter(c => {
      // Búsqueda por ID
      if (searchId && !c.id.toLowerCase().includes(searchId.toLowerCase())) {
        return false;
      }
      
      // Búsqueda por fecha
      if (searchDate) {
        const caseDate = new Date(c.createdAt).toISOString().split('T')[0];
        if (!caseDate.includes(searchDate)) {
          return false;
        }
      }
      
      // Filtro por tipo de reportante
      if (filterReporter && c.reporterRole !== filterReporter) {
        return false;
      }
      
      // Filtro por nivel de riesgo
      if (filterRisk && c.riskLevel !== filterRisk) {
        return false;
      }
      
      // Filtro por estado
      if (filterStatus && c.status !== filterStatus) {
        return false;
      }
      
      return true;
    });
  }, [cases, searchId, searchDate, filterReporter, filterRisk, filterStatus]);

  const getRoleBadge = (role: UserRole) => {
    switch(role) {
        case UserRole.STUDENT:
            return <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-700">ALUMNO</span>;
        case UserRole.PARENT:
            return <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-700">FAMILIA</span>;
        case UserRole.TEACHER:
            return <span className="px-2 py-0.5 rounded text-xs font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-700">DOCENTE</span>;
        default:
            return <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">OTRO</span>;
    }
  };

  // Función para obtener el badge de riesgo con color dinámico (mismos colores que los gráficos)
  const getRiskBadge = (riskLevel: RiskLevel) => {
    const bgColor = COLORS[riskLevel] || COLORS[String(riskLevel).toUpperCase()] || '#6366F1';
    return (
      <span
        className="px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full text-white shadow-sm border border-gray-200"
        style={{
          backgroundColor: bgColor,
          borderColor: bgColor,
        }}
      >
        {riskLevel}
      </span>
    );
  };

  // Función para obtener el color de fondo de la fila según riesgo
  const getRiskRowColor = (riskLevel: RiskLevel) => {
    const colorMap: { [key in RiskLevel]: string } = {
      [RiskLevel.LOW]: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/20',
      [RiskLevel.MEDIUM]: 'hover:bg-amber-50 dark:hover:bg-amber-950/20',
      [RiskLevel.HIGH]: 'hover:bg-orange-50 dark:hover:bg-orange-950/20',
      [RiskLevel.CRITICAL]: 'hover:bg-red-50 dark:hover:bg-red-950/20'
    };
    return colorMap[riskLevel] || colorMap[RiskLevel.MEDIUM];
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-300 dark:border-gray-700 pb-4 gap-4">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Panel Institucional</h1>
        
        <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-white bg-indigo-600 dark:bg-indigo-700 px-3 py-2 rounded shadow-sm uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Sincronizado con Azure SQL
            </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-8 border-gray-800 dark:border-gray-600 border-t border-r border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Casos</p>
          <p className="text-4xl font-extrabold text-gray-900 dark:text-white mt-2">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-8 border-indigo-600 border-t border-r border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Activos</p>
          <p className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-400 mt-2">{stats.active}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-8 border-red-600 border-t border-r border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Riesgo Crítico</p>
          <p className="text-4xl font-extrabold text-red-700 dark:text-red-400 mt-2">{stats.critical}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-8 border-emerald-600 border-t border-r border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resueltos</p>
          <p className="text-4xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-2">{stats.resolved}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Barras - Distribución por Nivel de Riesgo */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-300 dark:border-gray-700 transition-colors duration-200">
          <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-indigo-600 rounded"></span>
            Distribución por Nivel de Riesgo
          </h3>
          {riskData && riskData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={riskData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <XAxis 
                  dataKey="name" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#D1D5DB' }}
                  tick={{ fill: '#6B7280', fontWeight: 'bold' }} 
                />
                <YAxis 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#D1D5DB' }}
                  tick={{ fill: '#6B7280' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#374151', opacity: 0.15 }}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    backgroundColor: '#1F2937', 
                    color: '#fff',
                    padding: '8px 12px',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`${value} casos`, 'Cantidad']}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#6366F1">
                  {riskData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={COLORS[entry.name] || '#6366F1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-900/30 rounded-lg">
              <div className="text-center">
                <p className="text-gray-400 dark:text-gray-500 font-semibold">Sin casos registrados</p>
                <p className="text-sm text-gray-400 dark:text-gray-600">Los gráficos aparecerán cuando haya datos</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Gráfico Pie - Estado del Sistema */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-300 dark:border-gray-700 transition-colors duration-200">
          <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-indigo-600 rounded"></span>
            Distribución de Casos por Riesgo
          </h3>
          {riskData && riskData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`pie-${index}`} fill={COLORS[entry.name] || '#6366F1'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '10px',
                    border: '1px solid #4B5563',
                    backgroundColor: '#0B1224',
                    color: '#F9FAFB',
                    padding: '10px 14px',
                    fontSize: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
                  }}
                  itemStyle={{ color: '#E5E7EB', fontWeight: 'bold' }}
                  labelStyle={{ color: '#F9FAFB', fontWeight: 800, fontSize: 13, letterSpacing: 0.3 }}
                  formatter={(value) => [`${value} casos`, 'Cantidad']}
                  labelFormatter={(name) => `${name}`}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={40}
                  formatter={(value, entry) => `${entry.payload.name}`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-900/30 rounded-lg">
              <div className="text-center">
                <p className="text-gray-400 dark:text-gray-500 font-semibold">Sin casos registrados</p>
                <p className="text-sm text-gray-400 dark:text-gray-600">Los gráficos aparecerán cuando haya datos</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Case List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-300 dark:border-gray-700 overflow-hidden transition-colors duration-200">
        <div className="px-6 py-5 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tighter mb-4">Bandeja de Entrada de Casos</h3>
          
          {/* Búsqueda y Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Búsqueda por ID */}
            <div>
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1 block">Buscar por ID</label>
              <input
                type="text"
                placeholder="Ej: case_123"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Búsqueda por Fecha */}
            <div>
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1 block">Buscar por Fecha</label>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filtro por Reportante */}
            <div>
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1 block">Reportante</label>
              <select
                value={filterReporter}
                onChange={(e) => setFilterReporter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todos</option>
                <option value={UserRole.STUDENT}>Alumno</option>
                <option value={UserRole.PARENT}>Familia</option>
                <option value={UserRole.TEACHER}>Docente</option>
              </select>
            </div>

            {/* Filtro por Riesgo */}
            <div>
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1 block">Nivel Riesgo</label>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todos</option>
                <option value={RiskLevel.LOW}>Bajo</option>
                <option value={RiskLevel.MEDIUM}>Medio</option>
                <option value={RiskLevel.HIGH}>Alto</option>
                <option value={RiskLevel.CRITICAL}>Crítico</option>
              </select>
            </div>

            {/* Filtro por Estado */}
            <div>
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1 block">Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todos</option>
                <option value={CaseStatus.OPEN}>Abierto</option>
                <option value={CaseStatus.IN_PROGRESS}>En Proceso</option>
                <option value={CaseStatus.RESOLVED}>Resuelto</option>
                <option value={CaseStatus.CLOSED}>Cerrado</option>
              </select>
            </div>
          </div>

          {/* Contador de resultados */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Mostrando <span className="font-bold text-indigo-600 dark:text-indigo-400">{filteredCases.length}</span> de <span className="font-bold">{cases.length}</span> casos
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead className="bg-gray-800 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">ID Caso</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Reportante</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Riesgo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {!filteredCases || filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400 font-bold italic">
                    {cases.length === 0 ? 'No se encontraron casos registrados en la base de datos.' : 'No se encontraron casos con los filtros aplicados.'}
                  </td>
                </tr>
              ) : (
                filteredCases?.map((c) => (
                  <tr key={c.id} className={`${getRiskRowColor(c.riskLevel)} transition border-b border-gray-200 dark:border-gray-700`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-700 dark:text-indigo-400">{c.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-semibold">
                      {new Date(c.createdAt).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' })} 
                      <br/>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(c.createdAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(c.reporterRole)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRiskBadge(c.riskLevel)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-300">{c.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => onSelectCase(c)} className="text-white bg-indigo-600 hover:bg-indigo-800 px-4 py-2 rounded-lg text-xs font-black transition shadow-md uppercase tracking-widest">
                        GESTIONAR
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;