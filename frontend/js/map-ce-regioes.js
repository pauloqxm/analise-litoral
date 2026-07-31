/**
 * Mapa: ce_regioes.geojson + MapLibre + CAGED (Google Sheets).
 * Camadas graduadas (CAGED) + sobreposição opcional por Região administrativa (GeoJSON).
 */

const CE_REGIOES_BOUNDS = [
  [-41.75, -8.12],
  [-36.88, -2.68],
];

const CE_CAGED_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS8xs8t6M_BUp6ZfJa501mp3_zD0zhu13bHQxrq2xjfvElfAe_abXC6Pzb0Nubm7aH3aZcFIsAZi41X/pub?output=csv&single=true";
const CE_SEDE_GEO_URL = "/static/geo/CE_bacia_populacao.geojson";
const CE_PLANEJAMENTO_GEO_URL = "/static/geo/regiao_planejamento.geojson";
const CE_SEDE_LAYER_ID = "ce-sedes-municipais-circle";
const CE_SEDE_POINT_COLOR = "#1d4ed8";
const CE_SEDE_POINT_STROKE = "#ffffff";
const CE_IDT_UNIDADES_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS7dwfNsrFy3-jaaN_h6Tj3Xg6zggspg3-WHhAwYq1B-u54BS5rj-0AA88jKJCmMFzbtdVNp2Xj-zeM/pub?output=csv";
const CE_IDT_POINT_ICON_URL = "/static/assets/pino-unidade.png";
const CE_IDT_POINT_ICON_ID = "ce-idt-pin";

const CE_INTERMEDIACAO_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQyc8fEsbFl47mk9a0w6iN3FXJQgSjkxURmb8R0_RzuhUuRde2NTxK_tbS5ZlWq7w84IAm3tHaRCpKn/pub?gid=0&single=true&output=csv";
/** Mapa canônico (uma entrada por indicador) — usado para derivar CE_INTERMEDIACAO_LAYER_KEYS. */
const CE_INTERMEDIACAO_INDICADOR_TO_KEY = {
  "Atendimentos":  "intermediacao_atendimentos",
  "Autônomos":     "intermediacao_autonomos",
  "Cadastros":     "intermediacao_cadastros",
  "Colocados":     "intermediacao_colocados",
  "Egressos":      "intermediacao_egressos",
  "Empresas":      "intermediacao_empresas",
  "Encaminhados":  "intermediacao_encaminhados",
  "PCD":           "intermediacao_pcd",
  "Vagas":         "intermediacao_vagas",
  "Visitas":       "intermediacao_visitas",
};
const CE_INTERMEDIACAO_LAYER_KEYS = Object.values(CE_INTERMEDIACAO_INDICADOR_TO_KEY);

const CE_PERFIL_EMPRESAS_LAYER_KEYS = [
  "pib_per_capta",
  "mun_simples",
  "empresa_grupamento",
  "empresas_vinculos",
  "vinculo_escolaridade",
  "vinculo_sexo",
];

/**
 * Mapa estendido com variantes de grafia (singular, sem acento, minúsculas) para
 * tolerância no parse do CSV — NÃO usado para derivar CE_INTERMEDIACAO_LAYER_KEYS.
 */
const CE_INTERMEDIACAO_INDICADOR_ALIASES = {
  ...CE_INTERMEDIACAO_INDICADOR_TO_KEY,
  "Autonomos":     "intermediacao_autonomos",
  "Autónomos":     "intermediacao_autonomos",
  "Cadastro":      "intermediacao_cadastros",
  "Colocado":      "intermediacao_colocados",
  "Egresso":       "intermediacao_egressos",
  "Empresa":       "intermediacao_empresas",
  "Encaminhado":   "intermediacao_encaminhados",
  "Vaga":          "intermediacao_vagas",
  "Visita":        "intermediacao_visitas",
};

/** Evita cache HTTP antigo em CSV/planilhas publicadas. */
const CE_FETCH_NO_CACHE = { cache: "no-store" };

const CE_ESTOQUE_COLORS = ["#ffffcc", "#c2e699", "#78c679", "#31a354", "#006837"];
const CE_ADMISSOES_COLORS = ["#f7fbff", "#c6dbef", "#6baed6", "#2171b5", "#08306b"];
const CE_DESLIGAMENTOS_COLORS = ["#fff5eb", "#fdd0a2", "#fd8d3c", "#d94801", "#7f2704"];
const CE_SALDOS_COLORS = ["#fcfbfd", "#dadaeb", "#9e9ac8", "#6a51a3", "#3f007d"];

/** Paleta fixa para categorias de «Região» no GeoJSON (repete se necessário). */
const CE_REGIAO_PALETTE = [
  "#8dd3c7",
  "#bebada",
  "#fb8072",
  "#80b1d3",
  "#fdb462",
  "#b3de69",
  "#fccde5",
  "#bc80bd",
  "#ccebc5",
  "#ffed6f",
  "#d9d6bf",
  "#a6cee3",
  "#b2df8a",
];

const CE_NO_DATA_FILL = "#d9dce8";
const CE_IDT_POINT_COLOR = "#fe840a";
const CE_IDT_POINT_STROKE = "#ffffff";

/** Opacidade do preenchimento da sobreposição «Região» (por cima do graduado). */
const CE_REGIAO_OVERLAY_FILL_OPACITY = 0.42;
/** Contorno da Região de planejamento (`regiao_planejamento.geojson`). */
const CE_PLANEJAMENTO_LINE_WIDTH = 3;
const CE_PLANEJAMENTO_LINE_COLOR = "#000000";
const CE_PLANEJAMENTO_LINE_LAYER_ID = "ce-regiao-planejamento-line";

const CE_GRADUATED_METRICS = ["estoque", "admissoes", "desligamentos", "saldos"];

const CE_METRIC_CONFIG = {
  estoque: { prop: "caged_estoque", colors: CE_ESTOQUE_COLORS, legendTitle: "Estoque" },
  admissoes: { prop: "caged_admissoes", colors: CE_ADMISSOES_COLORS, legendTitle: "Admissões" },
  desligamentos: { prop: "caged_desligamentos", colors: CE_DESLIGAMENTOS_COLORS, legendTitle: "Desligamentos" },
  saldos: { prop: "caged_saldos", colors: CE_SALDOS_COLORS, legendTitle: "Saldos" },
};

const CE_PROFILE_LAYER_PROP = "perfil_metric";
const CE_VAI_VEM_PROP = "vai_vem_metric";
const CE_VAI_VEM_COLORS = ["#fff7ed", "#fed7aa", "#fdba74", "#f97316", "#c2410c"];
const CE_VAI_VEM_LAYER_CONFIG = {
  total: { legendTitle: "Total de solicitações" },
  desempregados: { legendTitle: "Desempregados" },
  vinculoEmprego: { legendTitle: "Vínculo de emprego" },
  aguardandoImpressao: { legendTitle: "Aguardando impressão" },
  cartoesImpressos: { legendTitle: "Cartões impressos" },
  cartaoEntregue: { legendTitle: "Cartão entregue" },
};
const CE_CAGED_GRUP_PROP = "caged_grup_metric";
const CE_CAGED_GRUP_METRIC_COLORS = {
  estoque: CE_ESTOQUE_COLORS,
  admitidos: CE_ADMISSOES_COLORS,
  desligados: CE_DESLIGAMENTOS_COLORS,
  saldo: CE_SALDOS_COLORS,
  salario_medio: ["#f0fdf4", "#bbf7d0", "#4ade80", "#16a34a", "#14532d"],
};
const CE_CAGED_GRUP_METRIC_FIELDS = {
  estoque: "estoque",
  admitidos: "admitidos",
  desligados: "desligados",
  saldo: "saldo",
  salario_medio: "salarioMedio",
};
const CE_SD_PROP = "seguro_desemprego_metric";
const CE_SD_COLORS = ["#eef2ff", "#c7d2fe", "#818cf8", "#4f46e5", "#3730a3"];
const CE_SD_LAYER_CONFIG = {
  requerentes: { legendTitle: "Requerentes", field: "requerentes" },
  requerentes_web: { legendTitle: "Requerentes WEB", field: "requerentesWeb" },
};
const CE_DNM_PROP = "dinheiro_na_mao_metric";
const CE_DNM_COLORS = ["#fffbeb", "#fde68a", "#fbbf24", "#d97706", "#92400e"];
const CE_DNM_LAYER_CONFIG = {
  operacoes: { legendTitle: "Total de operações", field: "operacoes", format: "int" },
  valorOperacoes: { legendTitle: "Valor total das operações", field: "valorOperacoes", format: "currency" },
  valorJuros: { legendTitle: "Valor dos juros", field: "valorJuros", format: "currency" },
};
const CE_QF_PROP = "qualificacao_metric";
const CE_QF_COLORS = ["#ecfdf5", "#a7f3d0", "#34d399", "#059669", "#047857"];
const CE_QF_LAYER_CONFIG = {
  cursos: { legendTitle: "Cursos ofertados", field: "cursos" },
  vagas: { legendTitle: "Vagas ofertadas", field: "vagas" },
  inscritos: { legendTitle: "Inscritos", field: "inscritos" },
  desistentes: { legendTitle: "Desistentes", field: "desistentes" },
  concludentes: { legendTitle: "Concludentes", field: "concludentes" },
};
const CE_QF_CURSOS_SOURCE_ID = "ce-qf-cursos";
const CE_QF_CURSOS_SYMBOL_LAYER_ID = "ce-qf-cursos-symbol";
const CE_QF_CURSOS_CIRCLE_LAYER_ID = "ce-qf-cursos-circle";
const CE_QF_CURSOS_HEAT_LAYER_ID = "ce-qf-cursos-heat";
const CE_QF_CURSOS_ICON_ID = "ce-qf-graduation-cap";
/** Mesmo glifo da aba Qualificação (`fa-solid fa-graduation-cap`). */
const CE_QF_CURSOS_FA_GLYPH = "\uf19d";
const CE_QF_CURSOS_POINT_COLOR = "#2563eb";
const CE_QF_CURSOS_POINT_STROKE = "#ffffff";
const CE_PROFILE_LAYER_SOURCE_BASE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRY77niZrgeJpcmKNv8BWEUyetRRYARaBk-nRzUFqSvJbTF1OdkneesuAJOHWSg0FVwamjEBJsviFJz/pub?output=csv&single=true&gid=";

const CE_PROFILE_LAYER_CONFIG = {
  servidores_municipais: {
    gid: "0",
    label: "Servidores municipais",
    legendTitle: "Servidores municipais",
    colors: ["#edf8e9", "#bae4b3", "#74c476", "#31a354", "#006d2c"],
    popupFields: [
      { label: "Pessoas", key: "pessoas", format: "int" },
      { label: "Referência", key: "referencia", format: "text" },
    ],
  },
  bolsa_familia: {
    gid: "348511521",
    label: "Bolsa Família",
    legendTitle: "Bolsa Família",
    colors: ["#fff7ec", "#fee8c8", "#fdbb84", "#e34a33", "#b30000"],
    popupFields: [
      { label: "Pessoas", key: "pessoas", format: "int" },
      { label: "Soma do valor", key: "somavalor", format: "text" },
      { label: "Média do valor", key: "mediavalor", format: "text" },
      { label: "Referência", key: "referencia", format: "text" },
    ],
  },
  bpc: {
    gid: "971288912",
    label: "BPC",
    legendTitle: "BPC",
    colors: ["#f3e8ff", "#d8b4fe", "#c084fc", "#9333ea", "#6b21a8"],
    popupFields: [
      { label: "Pessoas", key: "pessoas", format: "int" },
      { label: "Total repassado ao BPC", key: "totalrepassadoaobpc", format: "text" },
      { label: "Referência", key: "referencia", format: "text" },
    ],
  },
  mei: {
    gid: "364837787",
    label: "MEI",
    legendTitle: "MEI",
    colors: ["#eff6ff", "#bfdbfe", "#60a5fa", "#2563eb", "#1d4ed8"],
    popupFields: [
      { label: "Pessoas", key: "pessoas", format: "int" },
      { label: "Referência", key: "referencia", format: "text" },
    ],
  },
  aposentados: {
    gid: "354167679",
    label: "Aposentados",
    legendTitle: "Aposentados",
    colors: ["#fffbeb", "#fde68a", "#fbbf24", "#d97706", "#92400e"],
    popupFields: [
      { label: "Pessoas", key: "pessoas", format: "int" },
      { label: "Referência", key: "referencia", format: "text" },
    ],
  },
  emprego: {
    source: "caged_estoque",
    label: "Emprego",
    legendTitle: "Estoque (CAGED)",
    colors: ["#ecfeff", "#a5f3fc", "#22d3ee", "#0891b2", "#155e75"],
    popupFields: [
      { label: "Estoque", key: "pessoas", format: "int" },
      { label: "Referência", key: "referencia", format: "text" },
    ],
  },
  pib_per_capta: {
    gid: "1494490307",
    label: "PIB per capita",
    legendTitle: "PIB per capita (R$)",
    parseMode: "wide_years",
    valueFormat: "currency",
    kpiAgg: "avg",
    hidePctKpi: true,
    excludeFromTotal: true,
    excludeFromBarCharts: true,
    colors: ["#fff5eb", "#fee6ce", "#fdbb84", "#e6550d", "#a63603"],
    popupFields: [
      { label: "PIB per capita", key: "pessoas", format: "currency" },
      { label: "Ano", key: "ano", format: "text" },
    ],
  },
  ceara_cred: {
    csvUrl:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRTxX3SN-bCMQyty2wj0A3_uwzfy5kBAh0Cwuc5cYLn1VxdrpU7n4phpN23xPz7zGUzsKp9rgMvbXR_/pub?gid=1454518536&single=true&output=csv",
    label: "Ceará Credi",
    legendTitle: "Aprovadas",
    mapMetricKey: "aprovadas",
    /** Limiar fixo da última classe — municípios com valor ≥ este número vão para a classe 5 (mais escura). */
    fixedLastThreshold: 1000,
    parseMode: "ceara_cred",
    valueFormat: "int",
    hidePctKpi: true,
    excludeFromTotal: true,
    excludeFromBarCharts: true,
    hideLayerKpi: true,
    colors: ["#ecfdf5", "#a7f3d0", "#34d399", "#059669", "#047857"],
    popupFields: [
      { label: "Cadastradas", key: "cadastradas", format: "int", metric: true },
      { label: "Em atendimento", key: "em_atendimento", format: "int", metric: true },
      { label: "Aprovadas", key: "aprovadas", format: "int", metric: true },
      { label: "Valor liberado", key: "valor_liberado", format: "currency", metric: true },
      { label: "Referência", key: "referencia", format: "text" },
    ],
  },
  mun_simples: {
    gid: "161725561",
    label: "Município Simples",
    legendTitle: "Total",
    parseMode: "mun_simples",
    valueFormat: "int",
    hidePctKpi: true,
    excludeFromTotal: true,
    excludeFromBarCharts: true,
    hideLayerKpi: true,
    colors: ["#f5f3ff", "#ddd6fe", "#a78bfa", "#7c3aed", "#5b21b6"],
    popupFields: [
      { label: "Não", key: "nao", format: "int", metric: true },
      { label: "Sim", key: "sim", format: "int", metric: true },
      { label: "Total", key: "total", format: "int", metric: true },
      { label: "Referência", key: "referencia", format: "text" },
    ],
  },
  empresa_grupamento: {
    gid: "1090071272",
    label: "Empresa por grupamento",
    legendTitle: "Total de empresas",
    parseMode: "empresa_grupamento",
    valueFormat: "int",
    hidePctKpi: true,
    excludeFromTotal: true,
    excludeFromBarCharts: true,
    hideLayerKpi: true,
    colors: ["#fff7ed", "#fed7aa", "#fdba74", "#f97316", "#c2410c"],
    popupFields: [
      { label: "Total", key: "total", format: "int", metric: true },
      { label: "Referência", key: "referencia", format: "text" },
    ],
  },
  empresas_vinculos: {
    gid: "1940925772",
    label: "Empresas por vínculos",
    legendTitle: "Total de empresas",
    parseMode: "empresas_vinculos",
    valueFormat: "int",
    hidePctKpi: true,
    excludeFromTotal: true,
    excludeFromBarCharts: true,
    hideLayerKpi: true,
    colors: ["#ecfeff", "#a5f3fc", "#22d3ee", "#06b6d4", "#0891b2"],
    popupFields: [
      { label: "Total", key: "total", format: "int", metric: true },
      { label: "Referência", key: "referencia", format: "text" },
    ],
  },
  vinculo_escolaridade: {
    gid: "1538511558",
    label: "Vínculo por escolaridade",
    legendTitle: "Total de vínculos",
    parseMode: "vinculo_escolaridade",
    valueFormat: "int",
    hidePctKpi: true,
    excludeFromTotal: true,
    excludeFromBarCharts: true,
    hideLayerKpi: true,
    colors: ["#eef2ff", "#c7d2fe", "#818cf8", "#4f46e5", "#3730a3"],
    popupFields: [
      { label: "Total", key: "total", format: "int", metric: true },
      { label: "Referência", key: "referencia", format: "text" },
    ],
  },
  vinculo_sexo: {
    gid: "101580331",
    label: "Vínculo por sexo",
    legendTitle: "Total de vínculos",
    parseMode: "vinculo_sexo",
    valueFormat: "int",
    hidePctKpi: true,
    excludeFromTotal: true,
    excludeFromBarCharts: true,
    hideLayerKpi: true,
    colors: ["#fdf2f8", "#fbcfe8", "#f9a8d4", "#ec4899", "#be185d"],
    popupFields: [
      { label: "Total", key: "total", format: "int", metric: true },
      { label: "Referência", key: "referencia", format: "text" },
    ],
  },
  intermediacao_atendimentos: {
    parseMode: "intermediacao", indicador: "Atendimentos",
    label: "Atendimentos", legendTitle: "Atendimentos",
    valueFormat: "int", hidePctKpi: true, excludeFromTotal: true,
    colors: ["#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8", "#1e3a8a"],
    popupFields: [
      { label: "Atendimentos (Real)", key: "real", format: "int" },
      { label: "Referência", key: "referencia", format: "text" },
      { label: "Posto", key: "nomedaposto", format: "text" },
    ],
  },
  intermediacao_autonomos: {
    parseMode: "intermediacao", indicador: "Autônomos",
    label: "Autônomos", legendTitle: "Autônomos",
    valueFormat: "int", hidePctKpi: true, excludeFromTotal: true,
    colors: ["#ccfbf1", "#5eead4", "#14b8a6", "#0f766e", "#134e4a"],
    popupFields: [
      { label: "Autônomos (Real)", key: "real", format: "int" },
      { label: "Referência", key: "referencia", format: "text" },
      { label: "Posto", key: "nomedaposto", format: "text" },
    ],
  },
  intermediacao_cadastros: {
    parseMode: "intermediacao", indicador: "Cadastros",
    label: "Cadastros", legendTitle: "Cadastros",
    valueFormat: "int", hidePctKpi: true, excludeFromTotal: true,
    colors: ["#dcfce7", "#86efac", "#22c55e", "#15803d", "#14532d"],
    popupFields: [
      { label: "Cadastros (Real)", key: "real", format: "int" },
      { label: "Referência", key: "referencia", format: "text" },
      { label: "Posto", key: "nomedaposto", format: "text" },
    ],
  },
  intermediacao_colocados: {
    parseMode: "intermediacao", indicador: "Colocados",
    label: "Colocados", legendTitle: "Colocados",
    valueFormat: "int", hidePctKpi: true, excludeFromTotal: true,
    colors: ["#ecfccb", "#bef264", "#84cc16", "#4d7c0f", "#365314"],
    popupFields: [
      { label: "Colocados (Real)", key: "real", format: "int" },
      { label: "Referência", key: "referencia", format: "text" },
      { label: "Posto", key: "nomedaposto", format: "text" },
    ],
  },
  intermediacao_egressos: {
    parseMode: "intermediacao", indicador: "Egressos",
    label: "Egressos", legendTitle: "Egressos",
    valueFormat: "int", hidePctKpi: true, excludeFromTotal: true,
    colors: ["#fef9c3", "#fde047", "#eab308", "#a16207", "#713f12"],
    popupFields: [
      { label: "Egressos (Real)", key: "real", format: "int" },
      { label: "Referência", key: "referencia", format: "text" },
      { label: "Posto", key: "nomedaposto", format: "text" },
    ],
  },
  intermediacao_empresas: {
    parseMode: "intermediacao", indicador: "Empresas",
    label: "Empresas", legendTitle: "Empresas",
    valueFormat: "int", hidePctKpi: true, excludeFromTotal: true,
    colors: ["#ffedd5", "#fdba74", "#f97316", "#c2410c", "#7c2d12"],
    popupFields: [
      { label: "Empresas (Real)", key: "real", format: "int" },
      { label: "Referência", key: "referencia", format: "text" },
      { label: "Posto", key: "nomedaposto", format: "text" },
    ],
  },
  intermediacao_encaminhados: {
    parseMode: "intermediacao", indicador: "Encaminhados",
    label: "Encaminhados", legendTitle: "Encaminhados",
    valueFormat: "int", hidePctKpi: true, excludeFromTotal: true,
    colors: ["#f3e8ff", "#d8b4fe", "#a855f7", "#7e22ce", "#4a044e"],
    popupFields: [
      { label: "Encaminhados (Real)", key: "real", format: "int" },
      { label: "Referência", key: "referencia", format: "text" },
      { label: "Posto", key: "nomedaposto", format: "text" },
    ],
  },
  intermediacao_pcd: {
    parseMode: "intermediacao", indicador: "PCD",
    label: "PCD", legendTitle: "PCD",
    valueFormat: "int", hidePctKpi: true, excludeFromTotal: true,
    colors: ["#fce7f3", "#f9a8d4", "#ec4899", "#be185d", "#831843"],
    popupFields: [
      { label: "PCD (Real)", key: "real", format: "int" },
      { label: "Referência", key: "referencia", format: "text" },
      { label: "Posto", key: "nomedaposto", format: "text" },
    ],
  },
  intermediacao_vagas: {
    parseMode: "intermediacao", indicador: "Vagas",
    label: "Vagas", legendTitle: "Vagas",
    valueFormat: "int", hidePctKpi: true, excludeFromTotal: true,
    colors: ["#e0e7ff", "#a5b4fc", "#6366f1", "#4338ca", "#312e81"],
    popupFields: [
      { label: "Vagas (Real)", key: "real", format: "int" },
      { label: "Referência", key: "referencia", format: "text" },
      { label: "Posto", key: "nomedaposto", format: "text" },
    ],
  },
  intermediacao_visitas: {
    parseMode: "intermediacao", indicador: "Visitas",
    label: "Visitas", legendTitle: "Visitas",
    valueFormat: "int", hidePctKpi: true, excludeFromTotal: true,
    colors: ["#e0f2fe", "#7dd3fc", "#0ea5e9", "#0369a1", "#0c4a6e"],
    popupFields: [
      { label: "Visitas (Real)", key: "real", format: "int" },
      { label: "Referência", key: "referencia", format: "text" },
      { label: "Posto", key: "nomedaposto", format: "text" },
    ],
  },
};

/** Metadados das séries do gráfico mensal de intermediação. */
const CE_INTERMEDIACAO_LINE_METRICS = CE_INTERMEDIACAO_LAYER_KEYS.map((key) => ({
  key,
  label: CE_PROFILE_LAYER_CONFIG[key]?.label || key,
  color: CE_PROFILE_LAYER_CONFIG[key]?.colors?.[3] || "#1d4ed8",
}));

/** Faixas de vínculos (aba empresas_vinculos). */
const CE_EMPRESAS_VINCULOS_METRICS = [
  { key: "de1a4", label: "De 1 a 4", kpiLabel: "De 1 a 4" },
  { key: "de5a9", label: "De 5 a 9", kpiLabel: "De 5 a 9" },
  { key: "de10a19", label: "De 10 a 19", kpiLabel: "De 10 a 19" },
  { key: "de20a49", label: "De 20 a 49", kpiLabel: "De 20 a 49" },
  { key: "de50a99", label: "De 50 a 99", kpiLabel: "De 50 a 99" },
  { key: "de100a249", label: "De 100 a 249", kpiLabel: "De 100 a 249" },
  { key: "de250a499", label: "De 250 a 499", kpiLabel: "De 250 a 499" },
  { key: "de500a999", label: "De 500 a 999", kpiLabel: "De 500 a 999" },
  { key: "1000oumais", label: "1000 ou Mais", kpiLabel: "1000 ou mais" },
  { key: "total", label: "Total", kpiLabel: "Total de empresas" },
];

const CE_EMPRESAS_VINCULOS_FAIXA_METRICS = CE_EMPRESAS_VINCULOS_METRICS.filter((m) => m.key !== "total");

function ceEmpresasVinculosKpiDomId(key) {
  const safe = String(key).replace(/^(\d)/, "n$1");
  return `mapKpiProfileEmpresasVinculos_${safe}`;
}

const CE_EMPRESAS_VINCULOS_KPI_METRICS = CE_EMPRESAS_VINCULOS_METRICS.map((m) => ({
  key: m.key,
  label: m.kpiLabel || m.label,
  title: m.label,
  id: ceEmpresasVinculosKpiDomId(m.key),
  format: "int",
}));

const CE_EMPRESAS_VINCULOS_CHART_COLORS = [
  "#bae6fd",
  "#7dd3fc",
  "#38bdf8",
  "#0ea5e9",
  "#0284c7",
  "#0369a1",
  "#075985",
  "#0c4a6e",
  "#164e63",
];

CE_PROFILE_LAYER_CONFIG.empresas_vinculos.popupFields = [
  ...CE_EMPRESAS_VINCULOS_FAIXA_METRICS.map((m) => ({
    label: m.label,
    key: m.key,
    format: "int",
    metric: true,
  })),
  { label: "Total", key: "total", format: "int", metric: true },
  { label: "Referência", key: "referencia", format: "text" },
];

/** Escolaridade dos vínculos (aba vinculo_escolaridade). */
const CE_VINCULO_ESCOLARIDADE_METRICS = [
  { key: "analfabeto", label: "Analfabeto", kpiLabel: "Analfabeto" },
  { key: "ate5incompleto", label: "Até 5º Incompleto", kpiLabel: "Até 5º incompleto" },
  { key: "5completofundamental", label: "5º Completo Fundamental", kpiLabel: "5º compl. fundamental" },
  { key: "6a9fundamental", label: "6º a 9º Fundamental", kpiLabel: "6º a 9º fundamental" },
  { key: "fundamentalcompleto", label: "Fundamental Completo", kpiLabel: "Fundamental completo" },
  { key: "medioincompleto", label: "Médio Incompleto", kpiLabel: "Médio incompleto" },
  { key: "mediocompleto", label: "Médio Completo", kpiLabel: "Médio completo" },
  { key: "superiorincompleto", label: "Superior Incompleto", kpiLabel: "Superior incompleto" },
  { key: "superiorcompleto", label: "Superior Completo", kpiLabel: "Superior completo" },
  { key: "mestrado", label: "Mestrado", kpiLabel: "Mestrado" },
  { key: "doutorado", label: "Doutorado", kpiLabel: "Doutorado" },
  { key: "total", label: "Total", kpiLabel: "Total de vínculos" },
];

const CE_VINCULO_ESCOLARIDADE_NIVEL_METRICS = CE_VINCULO_ESCOLARIDADE_METRICS.filter((m) => m.key !== "total");

function ceVinculoEscolaridadeKpiDomId(key) {
  const safe = String(key).replace(/^(\d)/, "n$1");
  return `mapKpiProfileVinculoEscolaridade_${safe}`;
}

const CE_VINCULO_ESCOLARIDADE_KPI_METRICS = CE_VINCULO_ESCOLARIDADE_METRICS.map((m) => ({
  key: m.key,
  label: m.kpiLabel || m.label,
  title: m.label,
  id: ceVinculoEscolaridadeKpiDomId(m.key),
  format: "int",
}));

const CE_VINCULO_ESCOLARIDADE_CHART_COLORS = [
  "#a5b4fc",
  "#818cf8",
  "#6366f1",
  "#4f46e5",
  "#4338ca",
  "#3730a3",
  "#312e81",
  "#1d4ed8",
  "#2563eb",
  "#0284c7",
  "#0369a1",
];

CE_PROFILE_LAYER_CONFIG.vinculo_escolaridade.popupFields = [
  ...CE_VINCULO_ESCOLARIDADE_NIVEL_METRICS.map((m) => ({
    label: m.label,
    key: m.key,
    format: "int",
    metric: true,
  })),
  { label: "Total", key: "total", format: "int", metric: true },
  { label: "Referência", key: "referencia", format: "text" },
];

/** Sexo dos vínculos (aba vinculo_sexo). */
const CE_VINCULO_SEXO_METRICS = [
  { key: "masculino", label: "Masculino", kpiLabel: "Masculino" },
  { key: "feminino", label: "Feminino", kpiLabel: "Feminino" },
  { key: "total", label: "Total", kpiLabel: "Total de vínculos" },
];

const CE_VINCULO_SEXO_GROUP_METRICS = CE_VINCULO_SEXO_METRICS.filter((m) => m.key !== "total");

function ceVinculoSexoKpiDomId(key) {
  return `mapKpiProfileVinculoSexo_${key}`;
}

const CE_VINCULO_SEXO_KPI_METRICS = CE_VINCULO_SEXO_METRICS.map((m) => ({
  key: m.key,
  label: m.kpiLabel || m.label,
  title: m.label,
  id: ceVinculoSexoKpiDomId(m.key),
  format: "int",
}));

const CE_VINCULO_SEXO_CHART_COLORS = ["#2563eb", "#db2777"];

CE_PROFILE_LAYER_CONFIG.vinculo_sexo.popupFields = [
  ...CE_VINCULO_SEXO_GROUP_METRICS.map((m) => ({
    label: m.label,
    key: m.key,
    format: "int",
    metric: true,
  })),
  { label: "Total", key: "total", format: "int", metric: true },
  { label: "Referência", key: "referencia", format: "text" },
];

/** Setores econômicos (aba empresa_grupamento); a chave segue ceNormalizeKey do cabeçalho CSV. */
const CE_EMPRESA_GRUPAMENTO_METRICS = [
  {
    key: "agriculturapecuariaproducaoflorestalpescaeaquicultura",
    label: "Agricultura, pecuária, produção florestal, pesca e aquicultura",
    kpiLabel: "Agricultura, pesca e floresta",
  },
  { key: "industriageral", label: "Indústria geral", kpiLabel: "Indústria geral" },
  { key: "construcao", label: "Construção", kpiLabel: "Construção" },
  {
    key: "comercioreparacaodeveiculosautomotoresemotocicletas",
    label: "Comércio, reparação de veículos automotores e motocicletas",
    kpiLabel: "Comércio e veículos",
  },
  { key: "transportearmazenagemecorreio", label: "Transporte, armazenagem e correio", kpiLabel: "Transporte e correio" },
  { key: "alojamentoealimentacao", label: "Alojamento e alimentação", kpiLabel: "Alojamento e alimentação" },
  {
    key: "informacaocomunicacaoeatividadesfinanceirasimobiliariasprofissionaiseadministrativas",
    label: "Informação, comunicação e atividades financeiras, imobiliárias, profissionais e administrativas",
    kpiLabel: "Informação e finanças",
  },
  {
    key: "administracaopublicadefesaseguridadesocialeducacaosaudehumanaeservicossociais",
    label: "Administração pública, defesa, seguridade social, educação, saúde humana e serviços sociais",
    kpiLabel: "Administração pública",
  },
  { key: "outrosservicos", label: "Outros serviços", kpiLabel: "Outros serviços" },
  { key: "servicosdomesticos", label: "Serviços domésticos", kpiLabel: "Serviços domésticos" },
  { key: "total", label: "Total", kpiLabel: "Total de empresas" },
];

const CE_EMPRESA_GRUPAMENTO_SECTOR_METRICS = CE_EMPRESA_GRUPAMENTO_METRICS.filter((m) => m.key !== "total");

const CE_EMPRESA_GRUPAMENTO_KPI_METRICS = CE_EMPRESA_GRUPAMENTO_METRICS.map((m) => ({
  key: m.key,
  label: m.kpiLabel || m.label,
  title: m.label,
  id: `mapKpiProfileEmpresaGrupamento_${m.key}`,
  format: "int",
}));

const CE_EMPRESA_GRUPAMENTO_CHART_COLORS = [
  "#1d4ed8",
  "#2563eb",
  "#3b82f6",
  "#0891b2",
  "#0d9488",
  "#059669",
  "#84cc16",
  "#ca8a04",
  "#ea580c",
  "#dc2626",
];

CE_PROFILE_LAYER_CONFIG.empresa_grupamento.popupFields = [
  ...CE_EMPRESA_GRUPAMENTO_SECTOR_METRICS.map((m) => ({
    label: m.kpiLabel || m.label,
    key: m.key,
    format: "int",
    metric: true,
  })),
  { label: "Total", key: "total", format: "int", metric: true },
  { label: "Referência", key: "referencia", format: "text" },
];

const CE_CEARA_CRED_KPI_METRICS = [
  { key: "cadastradas", label: "Cadastradas", id: "mapKpiProfileCearaCredCadastradas", format: "int" },
  { key: "em_atendimento", label: "Em atendimento", id: "mapKpiProfileCearaCredEmAtendimento", format: "int" },
  { key: "aprovadas", label: "Aprovadas", id: "mapKpiProfileCearaCredAprovadas", format: "int" },
  {
    key: "valor_liberado",
    label: "Valor liberado",
    id: "mapKpiProfileCearaCredValorLiberado",
    format: "currency",
  },
];

const CE_PROFILE_LAYER_KEYS = Object.keys(CE_PROFILE_LAYER_CONFIG);
const CE_PROFILE_BAR_LAYER_KEYS = CE_PROFILE_LAYER_KEYS.filter(
  (key) =>
    !CE_PROFILE_LAYER_CONFIG[key]?.excludeFromBarCharts &&
    CE_PROFILE_LAYER_CONFIG[key]?.parseMode !== "intermediacao" &&
    key !== "ceara_cred"
);
const CE_PROFILE_KPI_IDS = {
  servidores_municipais: "mapKpiProfileServidores",
  bolsa_familia: "mapKpiProfileBolsaFamilia",
  bpc: "mapKpiProfileBpc",
  mei: "mapKpiProfileMei",
  aposentados: "mapKpiProfileAposentados",
  emprego: "mapKpiProfileEmprego",
  pib_per_capta: "mapKpiProfilePibPerCapta",
  intermediacao_atendimentos: "mapKpiIntAtendimentos",
  intermediacao_autonomos: "mapKpiIntAutonomos",
  intermediacao_cadastros: "mapKpiIntCadastros",
  intermediacao_colocados: "mapKpiIntColocados",
  intermediacao_egressos: "mapKpiIntEgressos",
  intermediacao_empresas: "mapKpiIntEmpresas",
  intermediacao_encaminhados: "mapKpiIntEncaminhados",
  intermediacao_pcd: "mapKpiIntPcd",
  intermediacao_vagas: "mapKpiIntVagas",
  intermediacao_visitas: "mapKpiIntVisitas",
};
const CE_PROFILE_KPI_PCT_IDS = {
  servidores_municipais: "mapKpiProfileServidoresPct",
  bolsa_familia: "mapKpiProfileBolsaFamiliaPct",
  bpc: "mapKpiProfileBpcPct",
  mei: "mapKpiProfileMeiPct",
  aposentados: "mapKpiProfileAposentadosPct",
  emprego: "mapKpiProfileEmpregoPct",
  pib_per_capta: "mapKpiProfilePibPerCaptaPct",
  intermediacao_atendimentos: "mapKpiIntAtendimentosPct",
  intermediacao_autonomos: "mapKpiIntAutonomosPct",
  intermediacao_cadastros: "mapKpiIntCadastrosPct",
  intermediacao_colocados: "mapKpiIntColocadosPct",
  intermediacao_egressos: "mapKpiIntEgressosPct",
  intermediacao_empresas: "mapKpiIntEmpresasPct",
  intermediacao_encaminhados: "mapKpiIntEncaminhadosPct",
  intermediacao_pcd: "mapKpiIntPcdPct",
  intermediacao_vagas: "mapKpiIntVagasPct",
  intermediacao_visitas: "mapKpiIntVisitasPct",
};
const CE_PROFILE_TOTAL_KPI_ID = "mapKpiProfileTotal";
const CE_PROFILE_TOTAL_KPI_PCT_ID = "mapKpiProfileTotalPct";
const CE_PROFILE_CHART_DOM_IDS = {
  municipio: "mapProfileChartMunicipio",
  regiao: "mapProfileChartRegiao",
  pibLine: "mapProfilePibLineChart",
  cearaLine: "mapProfileCearaCredLineChart",
  cearaMunicipio: "mapProfileChartCearaMunicipio",
  cearaRegiao: "mapProfileChartCearaRegiao",
  munSimplesMunicipio: "mapProfileChartMunSimplesMunicipio",
  munSimplesRegiao: "mapProfileChartMunSimplesRegiao",
  empresaGrupamentoMunicipio: "mapProfileChartEmpresaGrupamentoMunicipio",
  empresaGrupamentoRegiao: "mapProfileChartEmpresaGrupamentoRegiao",
  empresaGrupamentoRegiaoBarras: "mapProfileChartEmpresaGrupamentoRegiaoBarras",
  empresasVinculosMunicipio: "mapProfileChartEmpresasVinculosMunicipio",
  empresasVinculosRegiao: "mapProfileChartEmpresasVinculosRegiao",
  empresasVinculosRegiaoBarras: "mapProfileChartEmpresasVinculosRegiaoBarras",
  vinculoEscolaridadeMunicipio: "mapProfileChartVinculoEscolaridadeMunicipio",
  vinculoEscolaridadeRegiao: "mapProfileChartVinculoEscolaridadeRegiao",
  vinculoEscolaridadeRegiaoBarras: "mapProfileChartVinculoEscolaridadeRegiaoBarras",
  vinculoSexoMunicipio: "mapProfileChartVinculoSexoMunicipio",
  vinculoSexoRegiao: "mapProfileChartVinculoSexoRegiao",
  pibMunicipio: "mapProfileChartPibMunicipio",
  pibRegiao: "mapProfileChartPibRegiao",
};

const CE_PIB_VS_MEDIA_CHART_COLORS = ["#e6550d", "#94a3b8"];

const CE_PIB_VS_MEDIA_SERIES_DEFS = [
  { key: "media_periodo", name: "Média nos anos filtrados", format: "currency" },
  { key: "media_recorte", name: "Média geral do recorte", format: "currency" },
];

const CE_CEARA_CRED_CHART_COLORS = ["#059669", "#0d9488", "#10b981", "#047857"];

const CE_MUN_SIMPLES_KPI_METRICS = [
  { key: "nao", label: "Não", id: "mapKpiProfileMunSimplesNao", format: "int" },
  { key: "sim", label: "Sim", id: "mapKpiProfileMunSimplesSim", format: "int" },
  { key: "total", label: "Total", id: "mapKpiProfileMunSimplesTotal", format: "int" },
];

const CE_MUN_SIMPLES_CHART_METRICS = [
  { key: "nao", label: "Não", format: "int" },
  { key: "sim", label: "Sim", format: "int" },
];
const CE_MUN_SIMPLES_CHART_COLORS = ["#dc2626", "#16a34a"];

const CE_CEARA_CRED_LINE_METRICS = [
  { key: "cadastradas", label: "Cadastradas", format: "int", color: CE_CEARA_CRED_CHART_COLORS[0] },
  { key: "em_atendimento", label: "Em atendimento", format: "int", color: CE_CEARA_CRED_CHART_COLORS[1] },
  { key: "aprovadas", label: "Aprovadas", format: "int", color: CE_CEARA_CRED_CHART_COLORS[2] },
  { key: "valor_liberado", label: "Valor liberado", format: "currency", color: CE_CEARA_CRED_CHART_COLORS[3] },
];

const CE_PIB_LINE_MAX_SERIES = 10;
const CE_PIB_LINE_PALETTE = [
  "#e6550d",
  "#7c3aed",
  "#db2777",
  "#0891b2",
  "#ca8a04",
  "#4f46e5",
  "#059669",
  "#dc2626",
  "#0d9488",
  "#9333ea",
];

const CE_REGIOES_MAP_STYLE = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm", minzoom: 0, maxzoom: 19 }],
};

const ceMapRuntime = {
  map: null,
  allRows: [],
  profileRowsByLayer: {},
  geoJsonBase: null,
  currentMergedGeoJson: { type: "FeatureCollection", features: [] },
  legendEl: null,
  /** Índice da classe ativa na legenda (0–4) ou null = todas visíveis */
  activeLegendClass: null,
  /** Última agregação do perfil municipal (para refiltrar gráficos ao clicar na legenda) */
  lastProfileAggByLayer: null,
  lastProfileFilteredByLayer: null,
  municipiosList: [],
  lastAggByCodigo: new Map(),
  profileLastAggByCodigo: new Map(),
  vaiVemAggByMunKey: new Map(),
  cagedGrupAggByCod: new Map(),
  cagedGrupGrupoKey: "todos",
  cagedGrupMetricKey: "estoque",
  /** @type {{ aggByCod: Map<any, any>, grupoKey: string, metricKey: string } | null} */
  pendingCagedGrupApply: null,
  /** @type {Record<string, any>} instâncias ApexCharts por métrica */
  rankingCharts: {},
  /** Pizza estoque / barras saldo por região administrativa */
  /** @type {{ pie: any; bar: any; formalizacao: any }} */
  regionSummaryCharts: { pie: null, bar: null, formalizacao: null },
  /** @type {{ municipio: any; regiao: any }} */
  profileSummaryCharts: {
    municipio: null,
    regiao: null,
    cearaMunicipio: null,
    cearaRegiao: null,
    munSimplesMunicipio: null,
    munSimplesRegiao: null,
    empresaGrupamentoMunicipio: null,
    empresaGrupamentoRegiao: null,
    empresaGrupamentoRegiaoBarras: null,
    empresasVinculosMunicipio: null,
    empresasVinculosRegiao: null,
    empresasVinculosRegiaoBarras: null,
    vinculoEscolaridadeMunicipio: null,
    vinculoEscolaridadeRegiao: null,
    vinculoEscolaridadeRegiaoBarras: null,
    vinculoSexoMunicipio: null,
    vinculoSexoRegiao: null,
    pibMunicipio: null,
    pibRegiao: null,
  },
  /** @type {any} */
  profilePibLineChart: null,
  /** @type {any} */
  profileCearaCredLineChart: null,
  /** @type {any} */
  intermediacaoLineChart: null,
  /** @type {Record<string, { thresholds: number[], min: number, max: number }>} */
  layerStats: {},
  /** @type {Map<string, string>} */
  regiaoColorMap: new Map(),
  /** @type {{ name: string, color: string }[]} */
  regiaoLegendPairs: [],
  /** @type {GeoJSON.FeatureCollection} */
  planejamentoGeoJson: { type: "FeatureCollection", features: [] },
  /** @type {Map<string, string>} */
  planejamentoColorMap: new Map(),
  /** @type {{ name: string, color: string }[]} */
  planejamentoLegendPairs: [],
  /** @type {Map<string, Set<number>>} */
  regiaoToCodigos: new Map(),
  /** @type {GeoJSON.FeatureCollection} */
  unidadesGeoJson: { type: "FeatureCollection", features: [] },
  /** Locais dos cursos (Qualificação) — pontos filtrados */
  /** @type {GeoJSON.FeatureCollection} */
  qualificacaoCursosGeoJson: { type: "FeatureCollection", features: [] },
  /** @type {maplibregl.Marker[]} marcadores HTML com nomes de municípios */
  sedeLabelMarkers: [],
  /** @type {maplibregl.Marker[]} rótulos de salário médio (sobreposição) */
  salarioLabelMarkers: [],
  /** GeoJSON das sedes municipais (pontos) — usado para posicionar rótulos */
  /** @type {GeoJSON.FeatureCollection} */
  sedesGeoJson: { type: "FeatureCollection", features: [] },
  /** População municipal (sedes / CE_bacia_populacao.geojson), chave = código IBGE normalizado como no CSV */
  /** @type {Map<number, number>} */
  populacaoByCodigo: new Map(),
  /** Linha Admissões × Desligamentos por mês */
  /** @type {any} */
  monthlyLineChart: null,
  /** Barras Saldo por mês */
  /** @type {any} */
  monthlySaldoChart: null,
};

const CE_RANK_CHART_IDS = {
  estoque: "mapRankChartEstoque",
  admissoes: "mapRankChartAdmissoes",
  desligamentos: "mapRankChartDesligamentos",
  saldos: "mapRankChartSaldos",
};

/** Ranking extra (formalização municipal); não faz parte de CE_GRADUATED_METRICS */
const CE_RANK_CHART_FORMALIZACAO_MUN = "formalizacao_mun";
const CE_RANK_CHART_FORMALIZACAO_MUN_DOM_ID = "mapRankChartFormalizacaoMun";

const CE_FORMALIZACAO_RANK_COLOR = "#1d4ed8";

/** Quantidade de municípios no ranking (maiores / menores). */
const CE_RANKING_TOP_N = 15;

let ceRegioesMap = null;
let ceRegioesInitPromise = null;
let ceRegioesMapResizeObserver = null;
let ceMunSearchTimer = null;

function ceNormalizeKey(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function ceParseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
        continue;
      }
      inQ = !inQ;
      continue;
    }
    if (!inQ && c === ",") {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

const CE_MESES_RANK = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  março: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

/** Abreviações comuns (planilhas / exportações). */
const CE_MESES_ABREV = {
  jan: 1,
  fev: 2,
  mar: 3,
  abr: 4,
  mai: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  set: 9,
  out: 10,
  nov: 11,
  dez: 12,
};

const CE_MESES_NOMES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/**
 * Extrai mês (1–12) e ano a partir de textos como:
 * - `12/2024`, `01/2025` (só número no mês)
 * - `junho/2025`, `Junho/2025`
 * - `jun/2025` (abreviação)
 */
function ceParseMesAnoParts(raw) {
  const s0 = String(raw || "").trim();
  if (!s0) return null;

  const numM = s0.match(/^(\d{1,2})\s*\/\s*(\d{4})\s*$/);
  if (numM) {
    const mes = parseInt(numM[1], 10);
    const ano = parseInt(numM[2], 10);
    if (mes >= 1 && mes <= 12 && Number.isFinite(ano) && ano >= 1900 && ano <= 2200) {
      return { month: mes, year: ano };
    }
    return null;
  }

  const s = s0
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const yearOnly = s0.match(/^(\d{4})$/);
  if (yearOnly) {
    const ano = parseInt(yearOnly[1], 10);
    if (Number.isFinite(ano) && ano >= 1900 && ano <= 2200) {
      return { month: 12, year: ano };
    }
    return null;
  }

  const parts = s.split("/");
  if (parts.length < 2) return null;
  const mesToken = parts[0].trim();
  const ano = parseInt(parts[1].trim(), 10);
  if (!Number.isFinite(ano) || ano < 1900 || ano > 2200) return null;

  let mes = CE_MESES_RANK[mesToken] || CE_MESES_ABREV[mesToken] || 0;
  if (!mes && /^\d{1,2}$/.test(mesToken)) {
    const n = parseInt(mesToken, 10);
    if (n >= 1 && n <= 12) mes = n;
  }
  if (!mes) return null;
  return { month: mes, year: ano };
}

/** Chave canônica para filtro e ordenação: `YYYY-MM`. */
function ceMesAnoKey(raw) {
  const p = ceParseMesAnoParts(raw);
  if (!p) return "";
  return `${p.year}-${String(p.month).padStart(2, "0")}`;
}

function ceMesAnoKeyRank(key) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(key || ""));
  if (!m) return 0;
  return parseInt(m[1], 10) * 12 + parseInt(m[2], 10);
}

function ceFormatMesAnoFromKey(key) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(key || ""));
  if (!m) return String(key || "").trim() || "—";
  const yi = parseInt(m[1], 10);
  const mi = parseInt(m[2], 10);
  if (mi < 1 || mi > 12) return `${m[2]}/${yi}`;
  const nome = CE_MESES_NOMES_PT[mi - 1];
  return `${nome}/${yi}`;
}

function ceMesAnoRank(raw) {
  const k = ceMesAnoKey(raw);
  return k ? ceMesAnoKeyRank(k) : 0;
}

function ceParseNumberPt(raw) {
  const t = String(raw ?? "").trim();
  if (!t) return NaN;
  const n = Number(t.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

/** Parseia percentuais da planilha (ex.: "95,5%", "95.5", "0,955"). */
function ceParsePercentPt(raw) {
  const t = String(raw ?? "").trim();
  if (!t) return NaN;
  const hasSymbol = t.includes("%");
  const n = ceParseNumberPt(t.replace("%", "").trim());
  if (!Number.isFinite(n)) return NaN;
  if (!hasSymbol && n > 0 && n <= 1) return n * 100;
  return n;
}

/** Valores com ponto decimal internacional (ex.: PIB 3483.92). */
function ceParseDecimalFlexible(raw) {
  const t = String(raw ?? "").trim();
  if (!t) return NaN;
  if (t.includes(",")) return ceParseNumberPt(t);
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

function ceIsProfileWideYearLayer(layerKey) {
  return CE_PROFILE_LAYER_CONFIG[layerKey]?.parseMode === "wide_years";
}

function ceGetActiveProfileValueFormat() {
  return ceGetActiveProfileLayerConfig()?.valueFormat || "int";
}

function ceFormatProfileMetricValue(value, layerKey = ceGetSelectedProfileLayerKey()) {
  const fmt = CE_PROFILE_LAYER_CONFIG[layerKey]?.valueFormat || "int";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  if (fmt === "currency") return ceFormatCurrencyPt(n);
  return ceFormatIntPt(n);
}

/**
 * Alinha o código do CSV ao mapa (mesma chave que GEO_CODI/10 no GeoJSON).
 * Aceita 6 dígitos ou código IBGE com dígito verificador (7 dígitos).
 */
function ceNormalizeCsvCodigoMunicipio(raw) {
  const cod = parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(cod) || cod <= 0) return null;
  if (cod >= 1_000_000) return Math.floor(cod / 10);
  return cod;
}

function ceParseCagedCsvRows(text) {
  /** @type {Array<{codigo:number,municipio:string,mesAno:string,mesAnoKey:string,estoque:number,admissoes:number,desligamentos:number,saldos:number}>} */
  const rows = [];
  const rawText = String(text || "").replace(/^\uFEFF/, "");
  const lines = rawText.split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!/^\d{6,7}\s*,/.test(t)) continue;
    const cells = ceParseCsvLine(t);
    if (cells.length < 7) continue;
    const cod = ceNormalizeCsvCodigoMunicipio(cells[0]);
    const municipio = cells[1];
    const mesAno = cells[2];
    const mesAnoKey = ceMesAnoKey(mesAno);
    const estoque = ceParseNumberPt(cells[3]);
    const adm = ceParseNumberPt(cells[4]);
    const desl = ceParseNumberPt(cells[5]);
    const saldo = ceParseNumberPt(cells[6]);
    if (cod == null) continue;
    rows.push({
      codigo: cod,
      municipio,
      mesAno,
      mesAnoKey,
      estoque: Number.isFinite(estoque) ? estoque : 0,
      admissoes: Number.isFinite(adm) ? adm : 0,
      desligamentos: Number.isFinite(desl) ? desl : 0,
      saldos: Number.isFinite(saldo) ? saldo : 0,
    });
  }
  return rows;
}

function ceGetCellByKeys(record, keys) {
  for (const k of keys) {
    const v = record[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function ceBuildProfileLayerCsvUrl(layerKey) {
  const cfg = CE_PROFILE_LAYER_CONFIG[layerKey];
  if (!cfg) return "";
  if (cfg.csvUrl) return cfg.csvUrl;
  if (!cfg.gid) return "";
  return `${CE_PROFILE_LAYER_SOURCE_BASE_URL}${cfg.gid}`;
}

function ceGetSelectedProfileLayerKey() {
  const el = document.getElementById("mapProfileLayerStyle");
  let v = el?.value || CE_PROFILE_LAYER_KEYS[0];
  if (!CE_PROFILE_LAYER_CONFIG[v]) v = CE_PROFILE_LAYER_KEYS[0];
  const isIntermediacao =
    ceIsIntermediacaoMode() || cePendingPageMode === "series_historicas";
  if (isIntermediacao && !v.startsWith("intermediacao_")) {
    return CE_INTERMEDIACAO_LAYER_KEYS[0];
  }
  const isCearaCredi =
    ceIsCearaCrediMode() || cePendingPageMode === "ceara_credi";
  if (isCearaCredi) return "ceara_cred";
  if (ceIsVaiVemMode() || cePendingPageMode === "vai_vem") return CE_PROFILE_LAYER_KEYS[0];
  if (ceIsCagedGrupamentosMode() || ceIsCagedGrupamentosSheet(cePendingPageMode)) return CE_PROFILE_LAYER_KEYS[0];
  if (ceIsSeguroDesempregoMode() || cePendingPageMode === "seguro_desemprego") return CE_PROFILE_LAYER_KEYS[0];
  if (ceIsDinheiroNaMaoMode() || cePendingPageMode === "dinheiro_na_mao") return CE_PROFILE_LAYER_KEYS[0];
  if (ceIsQualificacaoMode()) return CE_PROFILE_LAYER_KEYS[0];
  return v;
}

function ceGetActiveProfileLayerConfig() {
  return CE_PROFILE_LAYER_CONFIG[ceGetSelectedProfileLayerKey()] || CE_PROFILE_LAYER_CONFIG[CE_PROFILE_LAYER_KEYS[0]];
}

function ceGetProfileSortToggleBtn() {
  const layerKey = ceGetSelectedProfileLayerKey();
  const id =
    layerKey === "ceara_cred"
      ? "mapProfileSortToggleCeara"
      : layerKey === "mun_simples"
        ? "mapProfileSortToggleMunSimples"
        : layerKey === "empresa_grupamento"
          ? "mapProfileSortToggleEmpresaGrupamento"
          : layerKey === "empresas_vinculos"
            ? "mapProfileSortToggleEmpresasVinculos"
            : layerKey === "vinculo_escolaridade"
              ? "mapProfileSortToggleVinculoEscolaridade"
              : layerKey === "vinculo_sexo"
                ? "mapProfileSortToggleVinculoSexo"
              : layerKey === "pib_per_capta"
                ? "mapProfileSortTogglePib"
            : "mapProfileSortToggle";
  return document.getElementById(id);
}

function ceGetProfileSortOrder() {
  const btn = ceGetProfileSortToggleBtn();
  return btn?.dataset?.order === "asc" ? "asc" : "desc";
}

function ceToggleProfileSortOrder() {
  const btn = ceGetProfileSortToggleBtn();
  if (!btn) return;
  const next = btn.dataset.order === "asc" ? "desc" : "asc";
  btn.dataset.order = next;
  btn.textContent = `Ordem: ${next === "asc" ? "crescente" : "decrescente"}`;
}

function ceParseProfileCsvRows(text) {
  const rawText = String(text || "").replace(/^\uFEFF/, "");
  const lines = rawText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = ceParseCsvLine(lines[0]).map((h) => ceNormalizeKey(h));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = ceParseCsvLine(lines[i]);
    if (!cells.length) continue;
    const record = {};
    headers.forEach((h, idx) => {
      if (!h) return;
      record[h] = (cells[idx] || "").trim();
    });
    const cod = ceNormalizeCsvCodigoMunicipio(
      ceGetCellByKeys(record, ["codibge", "cod_ibge", "codibgecodibge", "geocodi"])
    );
    if (cod == null) continue;
    const mesAno = ceGetCellByKeys(record, ["referencia"]);
    const pessoas = ceParseNumberPt(ceGetCellByKeys(record, ["pessoas"]));
    rows.push({
      codigo: cod,
      municipio: ceGetCellByKeys(record, ["municipio", "municipios", "municpio"]),
      mesAno,
      mesAnoKey: ceMesAnoKey(mesAno),
      pessoas: Number.isFinite(pessoas) ? pessoas : 0,
      raw: record,
    });
  }
  return rows;
}

function ceParseProfileWideYearsCsvRows(text) {
  const rawText = String(text || "").replace(/^\uFEFF/, "");
  const lines = rawText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = ceParseCsvLine(lines[0]).map((h) => ceNormalizeKey(h));
  const yearCols = [];
  headers.forEach((h, idx) => {
    if (/^\d{4}$/.test(h)) yearCols.push({ year: h, idx });
  });
  if (!yearCols.length) return [];

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = ceParseCsvLine(lines[i]);
    if (!cells.length) continue;
    const record = {};
    headers.forEach((h, idx) => {
      if (!h) return;
      record[h] = (cells[idx] || "").trim();
    });
    const cod = ceNormalizeCsvCodigoMunicipio(
      ceGetCellByKeys(record, ["codibge", "cod_ibge", "codibgecodibge", "geocodi"])
    );
    if (cod == null) continue;
    const municipio = ceGetCellByKeys(record, ["municipio", "municipios", "municpio"]);
    for (const { year, idx } of yearCols) {
      const val = ceParseDecimalFlexible(cells[idx] ?? record[year] ?? "");
      if (!Number.isFinite(val) || val <= 0) continue;
      rows.push({
        codigo: cod,
        municipio,
        mesAno: year,
        mesAnoKey: `${year}-01`,
        pessoas: val,
        raw: { ...record, ano: year },
      });
    }
  }
  return rows;
}

function ceParseCearaCredCsvRows(text) {
  const rawText = String(text || "").replace(/^\uFEFF/, "");
  const lines = rawText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = ceParseCsvLine(lines[0]).map((h) => ceNormalizeKey(h));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = ceParseCsvLine(lines[i]);
    if (!cells.length) continue;
    const record = {};
    headers.forEach((h, idx) => {
      if (!h) return;
      record[h] = (cells[idx] || "").trim();
    });
    const cod = ceNormalizeCsvCodigoMunicipio(
      ceGetCellByKeys(record, ["geocodi", "codibge", "cod_ibge"])
    );
    if (cod == null) continue;
    const mesAno = ceGetCellByKeys(record, ["referencia"]);
    const cadastradas = ceParseDecimalFlexible(ceGetCellByKeys(record, ["cadastradas"]));
    const emAtendimento = ceParseDecimalFlexible(ceGetCellByKeys(record, ["ematendimento"]));
    const aprovadas = ceParseDecimalFlexible(ceGetCellByKeys(record, ["aprovadas"]));
    const valorLiberado = ceParseDecimalFlexible(ceGetCellByKeys(record, ["valorliberado"]));
    const metrics = {
      cadastradas: Number.isFinite(cadastradas) ? cadastradas : 0,
      em_atendimento: Number.isFinite(emAtendimento) ? emAtendimento : 0,
      aprovadas: Number.isFinite(aprovadas) ? aprovadas : 0,
      valor_liberado: Number.isFinite(valorLiberado) ? valorLiberado : 0,
    };
    const mapMetricKey = CE_PROFILE_LAYER_CONFIG.ceara_cred?.mapMetricKey || "aprovadas";
    rows.push({
      codigo: cod,
      municipio: ceGetCellByKeys(record, ["municipio", "municipios", "municpio"]),
      mesAno,
      mesAnoKey: ceMesAnoKey(mesAno),
      pessoas: Number(metrics[mapMetricKey]) || 0,
      metrics,
      raw: record,
    });
  }
  return rows;
}

function ceParseMunSimplesCsvRows(text) {
  const rawText = String(text || "").replace(/^\uFEFF/, "");
  const lines = rawText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = ceParseCsvLine(lines[0]).map((h) => ceNormalizeKey(h));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = ceParseCsvLine(lines[i]);
    if (!cells.length) continue;
    const record = {};
    headers.forEach((h, idx) => {
      if (!h) return;
      record[h] = (cells[idx] || "").trim();
    });
    const cod = ceNormalizeCsvCodigoMunicipio(
      ceGetCellByKeys(record, ["geocodi", "codibge", "cod_ibge"])
    );
    if (cod == null) continue;
    const nao = ceParseDecimalFlexible(ceGetCellByKeys(record, ["nao"]));
    const sim = ceParseDecimalFlexible(ceGetCellByKeys(record, ["sim"]));
    const total = ceParseDecimalFlexible(ceGetCellByKeys(record, ["total"]));
    const metrics = {
      nao: Number.isFinite(nao) ? nao : 0,
      sim: Number.isFinite(sim) ? sim : 0,
      total: Number.isFinite(total) ? total : 0,
    };
    if (!Number.isFinite(metrics.total) || metrics.total <= 0) {
      metrics.total = metrics.nao + metrics.sim;
    }
    const mesAno = ceGetCellByKeys(record, ["referencia"]);
    rows.push({
      codigo: cod,
      municipio: ceGetCellByKeys(record, ["municipio", "municipios", "municpio"]),
      mesAno,
      mesAnoKey: ceMesAnoKey(mesAno),
      pessoas: Number(metrics.total) || 0,
      metrics,
      raw: record,
    });
  }
  return rows;
}

function ceEmptyEmpresaGrupamentoMetrics() {
  const metrics = {};
  for (const m of CE_EMPRESA_GRUPAMENTO_METRICS) metrics[m.key] = 0;
  return metrics;
}

function ceParseEmpresaGrupamentoCsvRows(text) {
  const rawText = String(text || "").replace(/^\uFEFF/, "");
  const lines = rawText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = ceParseCsvLine(lines[0]).map((h) => ceNormalizeKey(h));
  const skipHeaders = new Set(["geocodi", "municipio", "regiao", "referencia"]);
  const metricHeaders = headers.filter((h) => h && !skipHeaders.has(h));

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = ceParseCsvLine(lines[i]);
    if (!cells.length) continue;
    const record = {};
    headers.forEach((h, idx) => {
      if (!h) return;
      record[h] = (cells[idx] || "").trim();
    });
    const cod = ceNormalizeCsvCodigoMunicipio(
      ceGetCellByKeys(record, ["geocodi", "codibge", "cod_ibge"])
    );
    if (cod == null) continue;

    const metrics = ceEmptyEmpresaGrupamentoMetrics();
    for (const hk of metricHeaders) {
      const val = ceParseDecimalFlexible(record[hk] ?? "");
      metrics[hk] = Number.isFinite(val) ? val : 0;
    }
    if (!Number.isFinite(metrics.total) || metrics.total <= 0) {
      metrics.total = metricHeaders
        .filter((k) => k !== "total")
        .reduce((sum, k) => sum + (Number(metrics[k]) || 0), 0);
    }

    const mesAno = ceGetCellByKeys(record, ["referencia"]);
    rows.push({
      codigo: cod,
      municipio: ceGetCellByKeys(record, ["municipio", "municipios", "municpio"]),
      mesAno,
      mesAnoKey: ceMesAnoKey(mesAno),
      pessoas: Number(metrics.total) || 0,
      metrics,
      raw: record,
    });
  }
  return rows;
}

function ceEmptyEmpresasVinculosMetrics() {
  const metrics = {};
  for (const m of CE_EMPRESAS_VINCULOS_METRICS) metrics[m.key] = 0;
  return metrics;
}

function ceParseEmpresasVinculosCsvRows(text) {
  const rawText = String(text || "").replace(/^\uFEFF/, "");
  const lines = rawText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = ceParseCsvLine(lines[0]).map((h) => ceNormalizeKey(h));
  const skipHeaders = new Set(["geocodi", "municipio", "regiao", "referencia"]);
  const metricHeaders = headers.filter((h) => h && !skipHeaders.has(h));

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = ceParseCsvLine(lines[i]);
    if (!cells.length) continue;
    const record = {};
    headers.forEach((h, idx) => {
      if (!h) return;
      record[h] = (cells[idx] || "").trim();
    });
    const cod = ceNormalizeCsvCodigoMunicipio(
      ceGetCellByKeys(record, ["geocodi", "codibge", "cod_ibge"])
    );
    if (cod == null) continue;

    const metrics = ceEmptyEmpresasVinculosMetrics();
    for (const hk of metricHeaders) {
      const val = ceParseDecimalFlexible(record[hk] ?? "");
      metrics[hk] = Number.isFinite(val) ? val : 0;
    }
    if (!Number.isFinite(metrics.total) || metrics.total <= 0) {
      metrics.total = metricHeaders
        .filter((k) => k !== "total")
        .reduce((sum, k) => sum + (Number(metrics[k]) || 0), 0);
    }

    const mesAno = ceGetCellByKeys(record, ["referencia"]);
    rows.push({
      codigo: cod,
      municipio: ceGetCellByKeys(record, ["municipio", "municipios", "municpio"]),
      mesAno,
      mesAnoKey: ceMesAnoKey(mesAno),
      pessoas: Number(metrics.total) || 0,
      metrics,
      raw: record,
    });
  }
  return rows;
}

function ceEmptyVinculoEscolaridadeMetrics() {
  const metrics = {};
  for (const m of CE_VINCULO_ESCOLARIDADE_METRICS) metrics[m.key] = 0;
  return metrics;
}

function ceParseVinculoEscolaridadeCsvRows(text) {
  const rawText = String(text || "").replace(/^\uFEFF/, "");
  const lines = rawText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = ceParseCsvLine(lines[0]).map((h) => ceNormalizeKey(h));
  const skipHeaders = new Set(["geocodi", "municipio", "regiao", "referencia"]);
  const metricHeaders = headers.filter((h) => h && !skipHeaders.has(h));

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = ceParseCsvLine(lines[i]);
    if (!cells.length) continue;
    const record = {};
    headers.forEach((h, idx) => {
      if (!h) return;
      record[h] = (cells[idx] || "").trim();
    });
    const cod = ceNormalizeCsvCodigoMunicipio(
      ceGetCellByKeys(record, ["geocodi", "codibge", "cod_ibge"])
    );
    if (cod == null) continue;

    const metrics = ceEmptyVinculoEscolaridadeMetrics();
    for (const hk of metricHeaders) {
      const val = ceParseDecimalFlexible(record[hk] ?? "");
      metrics[hk] = Number.isFinite(val) ? val : 0;
    }
    if (!Number.isFinite(metrics.total) || metrics.total <= 0) {
      metrics.total = metricHeaders
        .filter((k) => k !== "total")
        .reduce((sum, k) => sum + (Number(metrics[k]) || 0), 0);
    }

    const mesAno = ceGetCellByKeys(record, ["referencia"]);
    rows.push({
      codigo: cod,
      municipio: ceGetCellByKeys(record, ["municipio", "municipios", "municpio"]),
      mesAno,
      mesAnoKey: ceMesAnoKey(mesAno),
      pessoas: Number(metrics.total) || 0,
      metrics,
      raw: record,
    });
  }
  return rows;
}

function ceEmptyVinculoSexoMetrics() {
  const metrics = {};
  for (const m of CE_VINCULO_SEXO_METRICS) metrics[m.key] = 0;
  return metrics;
}

function ceParseVinculoSexoCsvRows(text) {
  const rawText = String(text || "").replace(/^\uFEFF/, "");
  const lines = rawText.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = ceParseCsvLine(lines[0]).map((h) => ceNormalizeKey(h));
  const skipHeaders = new Set(["geocodi", "municipio", "regiao", "referencia"]);
  const metricHeaders = headers.filter((h) => h && !skipHeaders.has(h));

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = ceParseCsvLine(lines[i]);
    if (!cells.length) continue;
    const record = {};
    headers.forEach((h, idx) => {
      if (!h) return;
      record[h] = (cells[idx] || "").trim();
    });
    const cod = ceNormalizeCsvCodigoMunicipio(
      ceGetCellByKeys(record, ["geocodi", "codibge", "cod_ibge"])
    );
    if (cod == null) continue;

    const metrics = ceEmptyVinculoSexoMetrics();
    for (const hk of metricHeaders) {
      const val = ceParseDecimalFlexible(record[hk] ?? "");
      metrics[hk] = Number.isFinite(val) ? val : 0;
    }
    if (!Number.isFinite(metrics.total) || metrics.total <= 0) {
      metrics.total = metricHeaders
        .filter((k) => k !== "total")
        .reduce((sum, k) => sum + (Number(metrics[k]) || 0), 0);
    }

    const mesAno = ceGetCellByKeys(record, ["referencia"]);
    rows.push({
      codigo: cod,
      municipio: ceGetCellByKeys(record, ["municipio", "municipios", "municpio"]),
      mesAno,
      mesAnoKey: ceMesAnoKey(mesAno),
      pessoas: Number(metrics.total) || 0,
      metrics,
      raw: record,
    });
  }
  return rows;
}

function ceMapCagedRowsToEmpregoProfile(rows) {
  return (rows || []).map((row) => ({
    codigo: row.codigo,
    municipio: row.municipio || "",
    mesAno: row.mesAno || "",
    mesAnoKey: row.mesAnoKey || ceMesAnoKey(row.mesAno),
    pessoas: Number.isFinite(row.estoque) ? row.estoque : 0,
    raw: {
      referencia: row.mesAno || "",
      pessoas: String(Number.isFinite(row.estoque) ? row.estoque : 0),
    },
  }));
}

function ceParseProfileLayerCsvRows(layerKey, text) {
  const cfg = CE_PROFILE_LAYER_CONFIG[layerKey];
  if (cfg?.source === "caged_estoque" || cfg?.parseMode === "caged_estoque") {
    return ceMapCagedRowsToEmpregoProfile(ceParseCagedCsvRows(text || ""));
  }
  if (cfg?.parseMode === "ceara_cred") return ceParseCearaCredCsvRows(text || "");
  if (cfg?.parseMode === "mun_simples") return ceParseMunSimplesCsvRows(text || "");
  if (cfg?.parseMode === "empresa_grupamento") return ceParseEmpresaGrupamentoCsvRows(text || "");
  if (cfg?.parseMode === "empresas_vinculos") return ceParseEmpresasVinculosCsvRows(text || "");
  if (cfg?.parseMode === "vinculo_escolaridade") return ceParseVinculoEscolaridadeCsvRows(text || "");
  if (cfg?.parseMode === "vinculo_sexo") return ceParseVinculoSexoCsvRows(text || "");
  if (cfg?.parseMode === "wide_years") return ceParseProfileWideYearsCsvRows(text || "");
  return ceParseProfileCsvRows(text || "");
}

function ceGetCurrentTemporalRows() {
  if (ceIsPerfilMunicipalMode()) {
    return ceMapRuntime.profileRowsByLayer[ceGetSelectedProfileLayerKey()] || [];
  }
  return ceMapRuntime.allRows || [];
}

function ceAggregateProfileByCodigo(rows, options = {}) {
  /** @type {Map<number, { pessoas: number, raw: Record<string, string>, mesAno: string }>} */
  const agg = new Map();
  const sumAllPeriods = options.sumAllPeriods === true;
  const latestKey = sumAllPeriods
    ? ""
    : rows.reduce((max, r) => {
        const key = ceRowMesAnoKey(r);
        return !key || ceMesAnoKeyRank(key) <= ceMesAnoKeyRank(max) ? max : key;
      }, "");

  for (const row of rows) {
    if (!sumAllPeriods && latestKey && ceRowMesAnoKey(row) !== latestKey) continue;
    const cur = agg.get(row.codigo) || {
      pessoas: 0,
      metrics: {},
      raw: row.raw || {},
      mesAno: row.mesAno || "",
    };
    cur.pessoas += Number.isFinite(row.pessoas) ? row.pessoas : 0;
    if (row.metrics && typeof row.metrics === "object") {
      for (const [mk, mv] of Object.entries(row.metrics)) {
        const n = Number(mv);
        cur.metrics[mk] = (cur.metrics[mk] || 0) + (Number.isFinite(n) ? n : 0);
      }
    }
    if (!cur.mesAno && row.mesAno) cur.mesAno = row.mesAno;
    if (!cur.raw || Object.keys(cur.raw).length === 0) cur.raw = row.raw || {};
    agg.set(row.codigo, cur);
  }
  return agg;
}

function ceNormMunKey(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function ceGetSelectedVaiVemLayerKey() {
  const el = document.getElementById("mapVaiVemLayerStyle");
  const v = el?.value || "total";
  return Object.prototype.hasOwnProperty.call(CE_VAI_VEM_LAYER_CONFIG, v) ? v : "total";
}

function ceMergeVaiVemIntoGeojson(geojson, aggByMunKey, metricKey) {
  return {
    type: "FeatureCollection",
    features: (geojson.features || []).map((f) => {
      const { municipio } = cePropsMunReg(f.properties);
      const key = ceNormMunKey(municipio);
      const agg = key ? aggByMunKey.get(key) : null;
      const raw = agg ? agg[metricKey] : null;
      const val = agg != null && Number.isFinite(Number(raw)) ? Number(raw) : null;
      return {
        ...f,
        properties: {
          ...(f.properties || {}),
          [CE_VAI_VEM_PROP]: val,
        },
      };
    }),
  };
}

function ceApplyVaiVemMapFillPaint() {
  const map = ceMapRuntime.map;
  if (!map?.getLayer("ce-regioes-fill")) return false;

  const metricKey = ceGetSelectedVaiVemLayerKey();
  const cfg = CE_VAI_VEM_LAYER_CONFIG[metricKey];
  const stats = ceComputePropStats(ceMapRuntime.currentMergedGeoJson, CE_VAI_VEM_PROP, {});
  const activeIdx = ceMapRuntime.activeLegendClass;

  map.setPaintProperty(
    "ce-regioes-fill",
    "fill-color",
    ceBuildNumericFillExpr(
      CE_VAI_VEM_PROP,
      stats?.thresholds || [],
      CE_VAI_VEM_COLORS,
      activeIdx
    )
  );
  map.setPaintProperty("ce-regioes-fill", "fill-opacity", 0.82);
  return true;
}

function ceApplyVaiVemLayer(aggByMunKey) {
  const map = ceMapRuntime.map;
  if (!map?.getSource?.("ce-regioes") || !ceMapRuntime.geoJsonBase) return;

  ceMapRuntime.vaiVemAggByMunKey = aggByMunKey instanceof Map ? aggByMunKey : new Map();
  const metricKey = ceGetSelectedVaiVemLayerKey();
  const merged = ceMergeVaiVemIntoGeojson(ceMapRuntime.geoJsonBase, ceMapRuntime.vaiVemAggByMunKey, metricKey);
  ceMapRuntime.currentMergedGeoJson = merged;
  try {
    map.getSource("ce-regioes").setData(merged);
    ceScheduleMapVisualizationRefresh();
  } catch (e) {
    console.warn("Atualizar mapa Vai Vem:", e);
  }
}

function ceBuildVaiVemPopupHtml({ municipio, regiao, agg, accentColor }) {
  const fmt = (v) => (Number.isFinite(Number(v)) ? ceFormatIntPt(Number(v)) : "—");
  const rows = agg
    ? [
        ["Total", agg.total],
        ["Desempregados", agg.desempregados],
        ["Vínculo de emprego", agg.vinculoEmprego],
        ["Aguardando impressão", agg.aguardandoImpressao],
        ["Cartões impressos", agg.cartoesImpressos],
        ["Cartão entregue", agg.cartaoEntregue],
      ]
    : [];
  const fieldRows = rows
    .map(
      ([label, value]) => `
        <div class="map-ce-popup__row">
          <span class="map-ce-popup__label">
            <span class="map-ce-popup__icon map-ce-popup__icon--label" aria-hidden="true"><i class="fa-solid fa-chart-column"></i></span>
            ${ceEscapeHtml(label)}
          </span>
          <strong class="map-ce-popup__value map-ce-popup__value--metric">${ceEscapeHtml(fmt(value))}</strong>
        </div>`
    )
    .join("");

  return `
    <section class="map-ce-popup" style="--map-popup-accent:${ceEscapeHtml(accentColor || "#ea580c")}" role="group" aria-label="Detalhes do Vai Vem">
      <header class="map-ce-popup__head">
        <h4 class="map-ce-popup__title">
          <span class="map-ce-popup__icon" aria-hidden="true"><i class="fa-solid fa-bus"></i></span>
          ${ceEscapeHtml(municipio || "Município")}
        </h4>
        ${regiao ? `<p class="map-ce-popup__subtitle">${ceEscapeHtml(regiao)}</p>` : ""}
      </header>
      <div class="map-ce-popup__grid">
        ${
          fieldRows ||
          `<p class="map-ce-popup__empty">Sem solicitações do Vai Vem neste município nos filtros ativos.</p>`
        }
      </div>
    </section>
  `;
}

function ceGetCagedGrupMetricField(metricKey) {
  if (metricKey === "todos") return "estoque";
  return CE_CAGED_GRUP_METRIC_FIELDS[metricKey] || "estoque";
}

function ceGetCagedGrupLegendConfig(grupoKey, metricKey) {
  const colorMetricKey = metricKey === "todos" ? "estoque" : metricKey;
  const colors = CE_CAGED_GRUP_METRIC_COLORS[colorMetricKey] || CE_ESTOQUE_COLORS;
  const grupoLabel = window.cagedGrupamentosApi?.getGrupoLabel?.(grupoKey) || grupoKey;
  const metricLabel = window.cagedGrupamentosApi?.getMetricLabel?.(metricKey) || metricKey;
  const mapNote = metricKey === "todos" ? " · mapa por total por grupamento" : "";
  const salarioNote =
    metricKey === "salario_medio" ? " · anual · selecione desdobramento" : "";
  return {
    legendTitle: `${grupoLabel} — ${metricLabel}${mapNote}${salarioNote}`,
    colors,
    format: metricKey === "salario_medio" ? "currency" : "int",
  };
}

function ceGetSelectedCagedGrupGrupoKey() {
  const el = document.getElementById("mapCagedGrupLayerStyle");
  const v = el?.value || "todos";
  return v;
}

function ceGetSelectedCagedGrupMetricKey() {
  const el = document.getElementById("mapCagedGrupMetricStyle");
  const v = el?.value || "todos";
  if (v === "todos") return "todos";
  return CE_CAGED_GRUP_METRIC_FIELDS[v] ? v : "estoque";
}

function ceMergeCagedGrupIntoGeojson(geojson, aggByCod, metricKey) {
  const field = ceGetCagedGrupMetricField(metricKey);
  return {
    type: "FeatureCollection",
    features: (geojson.features || []).map((f) => {
      const cod = ceGeoCodiToCodigoMunicipio(f.properties?.GEO_CODI);
      const agg = cod != null ? aggByCod.get(cod) : null;
      const raw = agg ? agg[field] : null;
      const val = agg != null && Number.isFinite(Number(raw)) ? Number(raw) : null;
      return {
        ...f,
        properties: {
          ...(f.properties || {}),
          [CE_CAGED_GRUP_PROP]: val,
        },
      };
    }),
  };
}

function ceApplyCagedGrupMapFillPaint() {
  const map = ceMapRuntime.map;
  if (!map?.getLayer("ce-regioes-fill")) return false;

  const grupoKey = ceMapRuntime.cagedGrupGrupoKey;
  const metricKey = ceMapRuntime.cagedGrupMetricKey;
  const cfg = ceGetCagedGrupLegendConfig(grupoKey, metricKey);
  const stats = ceComputePropStats(ceMapRuntime.currentMergedGeoJson, CE_CAGED_GRUP_PROP, {});
  const activeIdx = ceMapRuntime.activeLegendClass;

  map.setPaintProperty(
    "ce-regioes-fill",
    "fill-color",
    ceBuildNumericFillExpr(CE_CAGED_GRUP_PROP, stats?.thresholds || [], cfg.colors, activeIdx)
  );
  map.setPaintProperty("ce-regioes-fill", "fill-opacity", 0.78);
  return true;
}

function ceIsCagedGrupMapReady() {
  const map = ceMapRuntime.map;
  return Boolean(
    map?.getSource?.("ce-regioes") &&
      map.getLayer?.("ce-regioes-fill") &&
      ceMapRuntime.geoJsonBase
  );
}

function ceApplyCagedGrupLayer(aggByCod, grupoKey, metricKey) {
  const resolvedGrupo = grupoKey || ceGetSelectedCagedGrupGrupoKey();
  const resolvedMetric = metricKey || ceGetSelectedCagedGrupMetricKey();
  const resolvedAgg = aggByCod instanceof Map ? aggByCod : new Map();

  ceMapRuntime.cagedGrupAggByCod = resolvedAgg;
  ceMapRuntime.cagedGrupGrupoKey = resolvedGrupo;
  ceMapRuntime.cagedGrupMetricKey = resolvedMetric;

  /* Sem source+fill, só enfileira: setData sem paint deixa o fill constante #e8eef5. */
  if (!ceIsCagedGrupMapReady()) {
    ceMapRuntime.pendingCagedGrupApply = {
      aggByCod: resolvedAgg,
      grupoKey: resolvedGrupo,
      metricKey: resolvedMetric,
    };
    return false;
  }

  ceMapRuntime.pendingCagedGrupApply = null;
  const merged = ceMergeCagedGrupIntoGeojson(
    ceMapRuntime.geoJsonBase,
    ceMapRuntime.cagedGrupAggByCod,
    ceMapRuntime.cagedGrupMetricKey
  );
  ceMapRuntime.currentMergedGeoJson = merged;
  try {
    const map = ceMapRuntime.map;
    map.getSource("ce-regioes").setData(merged);
    ceApplyCagedGrupMapFillPaint();
    ceRenderFullLegend(ceMapRuntime.cagedGrupMetricKey || "estoque");
    ceScheduleMapVisualizationRefresh();
    return true;
  } catch (e) {
    console.warn("Atualizar mapa CAGED grupamentos:", e);
    return false;
  }
}

function ceFlushPendingCagedGrupApply() {
  const pending = ceMapRuntime.pendingCagedGrupApply;
  if (!pending) {
    if (
      ceIsCagedGrupMapReady() &&
      ceMapRuntime.cagedGrupAggByCod instanceof Map &&
      ceMapRuntime.cagedGrupAggByCod.size > 0
    ) {
      return ceApplyCagedGrupLayer(
        ceMapRuntime.cagedGrupAggByCod,
        ceMapRuntime.cagedGrupGrupoKey,
        ceMapRuntime.cagedGrupMetricKey
      );
    }
    return false;
  }
  return ceApplyCagedGrupLayer(pending.aggByCod, pending.grupoKey, pending.metricKey);
}

/** Após o mapa ficar pronto: aplica pending e/ou recarrega a planilha classificada. */
function ceEnsureCagedGrupClassifiedMap() {
  if (!(ceIsCagedGrupamentosMode() || ceIsCagedGrupamentosSheet(cePendingPageMode))) {
    return;
  }
  ceFlushPendingCagedGrupApply();
  window.cagedGrupamentosApi?.refresh?.();
  ceApplyVisualization();
  ceRenderFullLegend(ceMapRuntime.cagedGrupMetricKey || ceGetSelectedCagedGrupMetricKey());
}

function ceGetSelectedSeguroDesempregoLayerKey() {
  const el = document.getElementById("mapSeguroDesempregoLayerStyle");
  const v = el?.value || "requerentes";
  return Object.prototype.hasOwnProperty.call(CE_SD_LAYER_CONFIG, v) ? v : "requerentes";
}

function ceGetSeguroDesempregoMetricField(metricKey) {
  return CE_SD_LAYER_CONFIG[metricKey]?.field || "requerentes";
}

function ceMergeSeguroDesempregoIntoGeojson(geojson, aggByCod, metricKey) {
  const field = ceGetSeguroDesempregoMetricField(metricKey);
  return {
    type: "FeatureCollection",
    features: (geojson.features || []).map((f) => {
      const cod = ceGeoCodiToCodigoMunicipio(f.properties?.GEO_CODI);
      const agg = cod != null ? aggByCod.get(cod) : null;
      const raw = agg ? agg[field] : null;
      const val = agg != null && Number.isFinite(Number(raw)) ? Number(raw) : null;
      return {
        ...f,
        properties: {
          ...(f.properties || {}),
          [CE_SD_PROP]: val,
        },
      };
    }),
  };
}

function ceApplySeguroDesempregoMapFillPaint() {
  const map = ceMapRuntime.map;
  if (!map?.getLayer("ce-regioes-fill")) return false;

  const metricKey = ceMapRuntime.seguroDesempregoMetricKey || ceGetSelectedSeguroDesempregoLayerKey();
  const cfg = CE_SD_LAYER_CONFIG[metricKey] || CE_SD_LAYER_CONFIG.requerentes;
  const stats = ceComputePropStats(ceMapRuntime.currentMergedGeoJson, CE_SD_PROP, {});
  const activeIdx = ceMapRuntime.activeLegendClass;

  map.setPaintProperty(
    "ce-regioes-fill",
    "fill-color",
    ceBuildNumericFillExpr(CE_SD_PROP, stats?.thresholds || [], CE_SD_COLORS, activeIdx)
  );
  map.setPaintProperty("ce-regioes-fill", "fill-opacity", 0.78);
  return true;
}

function ceApplySeguroDesempregoLayer(aggByCod, metricKey) {
  const map = ceMapRuntime.map;
  if (!map?.getSource?.("ce-regioes") || !ceMapRuntime.geoJsonBase) return;

  ceMapRuntime.seguroDesempregoAggByCod = aggByCod instanceof Map ? aggByCod : new Map();
  ceMapRuntime.seguroDesempregoMetricKey = metricKey || ceGetSelectedSeguroDesempregoLayerKey();
  const merged = ceMergeSeguroDesempregoIntoGeojson(
    ceMapRuntime.geoJsonBase,
    ceMapRuntime.seguroDesempregoAggByCod,
    ceMapRuntime.seguroDesempregoMetricKey
  );
  ceMapRuntime.currentMergedGeoJson = merged;
  try {
    map.getSource("ce-regioes").setData(merged);
    ceScheduleMapVisualizationRefresh();
  } catch (e) {
    console.warn("Atualizar mapa Seguro Desemprego:", e);
  }
}

function ceBuildSeguroDesempregoPopupHtml({ municipio, regiao, agg, accentColor }) {
  const fmt = (v) => (Number.isFinite(Number(v)) ? ceFormatIntPt(Number(v)) : "—");
  const rows = agg
    ? [
        ["Requerentes", agg.requerentes],
        ["Requerentes WEB", agg.requerentesWeb],
        ["Requerentes Presencial", (Number(agg.requerentes) || 0) - (Number(agg.requerentesWeb) || 0)],
      ]
    : [];
  const fieldRows = rows
    .map(
      ([label, value]) => `
        <div class="map-ce-popup__row">
          <span class="map-ce-popup__label">
            <span class="map-ce-popup__icon map-ce-popup__icon--label" aria-hidden="true"><i class="fa-solid fa-chart-column"></i></span>
            ${ceEscapeHtml(label)}
          </span>
          <strong class="map-ce-popup__value map-ce-popup__value--metric">${ceEscapeHtml(fmt(value))}</strong>
        </div>`
    )
    .join("");

  return `
    <section class="map-ce-popup" style="--map-popup-accent:${ceEscapeHtml(accentColor || "#4f46e5")}" role="group" aria-label="Detalhes do Seguro Desemprego">
      <header class="map-ce-popup__head">
        <h4 class="map-ce-popup__title">
          <span class="map-ce-popup__icon" aria-hidden="true"><i class="fa-solid fa-shield-halved"></i></span>
          ${ceEscapeHtml(municipio || "Município")}
        </h4>
        ${regiao ? `<p class="map-ce-popup__subtitle">${ceEscapeHtml(regiao)}</p>` : ""}
      </header>
      <div class="map-ce-popup__grid">
        ${
          fieldRows ||
          `<p class="map-ce-popup__empty">Sem requerimentos de Seguro Desemprego neste município nos filtros ativos.</p>`
        }
      </div>
    </section>
  `;
}

function ceGetSelectedDinheiroNaMaoLayerKey() {
  const value = document.getElementById("mapDinheiroNaMaoLayerStyle")?.value || "operacoes";
  return Object.prototype.hasOwnProperty.call(CE_DNM_LAYER_CONFIG, value) ? value : "operacoes";
}

function ceMergeDinheiroNaMaoIntoGeojson(geojson, aggByCod, metricKey) {
  const field = CE_DNM_LAYER_CONFIG[metricKey]?.field || "operacoes";
  return {
    type: "FeatureCollection",
    features: (geojson.features || []).map((feature) => {
      const code = ceGeoCodiToCodigoMunicipio(feature.properties?.GEO_CODI);
      const aggregate = code != null ? aggByCod.get(code) : null;
      const raw = aggregate?.[field];
      const value = aggregate != null && Number.isFinite(Number(raw)) ? Number(raw) : null;
      return {
        ...feature,
        properties: {
          ...(feature.properties || {}),
          [CE_DNM_PROP]: value,
        },
      };
    }),
  };
}

function ceApplyDinheiroNaMaoMapFillPaint() {
  const map = ceMapRuntime.map;
  if (!map?.getLayer("ce-regioes-fill")) return false;
  const metricKey = ceMapRuntime.dinheiroNaMaoMetricKey || ceGetSelectedDinheiroNaMaoLayerKey();
  const stats = ceComputePropStats(ceMapRuntime.currentMergedGeoJson, CE_DNM_PROP, {});
  map.setPaintProperty(
    "ce-regioes-fill",
    "fill-color",
    ceBuildNumericFillExpr(CE_DNM_PROP, stats?.thresholds || [], CE_DNM_COLORS, ceMapRuntime.activeLegendClass)
  );
  map.setPaintProperty("ce-regioes-fill", "fill-opacity", 0.8);
  return true;
}

function ceApplyDinheiroNaMaoLayer(aggByCod, metricKey) {
  const map = ceMapRuntime.map;
  if (!map?.getSource?.("ce-regioes") || !ceMapRuntime.geoJsonBase) return;
  ceMapRuntime.dinheiroNaMaoAggByCod = aggByCod instanceof Map ? aggByCod : new Map();
  ceMapRuntime.dinheiroNaMaoMetricKey = metricKey || ceGetSelectedDinheiroNaMaoLayerKey();
  const merged = ceMergeDinheiroNaMaoIntoGeojson(
    ceMapRuntime.geoJsonBase,
    ceMapRuntime.dinheiroNaMaoAggByCod,
    ceMapRuntime.dinheiroNaMaoMetricKey
  );
  ceMapRuntime.currentMergedGeoJson = merged;
  try {
    map.getSource("ce-regioes").setData(merged);
    ceScheduleMapVisualizationRefresh();
  } catch (error) {
    console.warn("Atualizar mapa Dinheiro na Mão:", error);
  }
}

function ceBuildDinheiroNaMaoPopupHtml({ municipio, regiao, agg, accentColor }) {
  const rows = agg
    ? [
        ["Total de operações", ceFormatIntPt(Number(agg.operacoes) || 0)],
        ["Valor das operações", ceFormatCurrencyPt(Number(agg.valorOperacoes) || 0)],
        ["Valor dos juros", ceFormatCurrencyPt(Number(agg.valorJuros) || 0)],
      ]
    : [];
  const fieldRows = rows
    .map(
      ([label, value]) => `
        <div class="map-ce-popup__row">
          <span class="map-ce-popup__label">
            <span class="map-ce-popup__icon map-ce-popup__icon--label" aria-hidden="true"><i class="fa-solid fa-chart-column"></i></span>
            ${ceEscapeHtml(label)}
          </span>
          <strong class="map-ce-popup__value map-ce-popup__value--metric">${ceEscapeHtml(value)}</strong>
        </div>`
    )
    .join("");
  return `
    <section class="map-ce-popup" style="--map-popup-accent:${ceEscapeHtml(accentColor || "#d97706")}" role="group" aria-label="Detalhes do Dinheiro na Mão">
      <header class="map-ce-popup__head">
        <h4 class="map-ce-popup__title">
          <span class="map-ce-popup__icon" aria-hidden="true"><i class="fa-solid fa-money-bill-transfer"></i></span>
          ${ceEscapeHtml(municipio || "Município")}
        </h4>
        ${regiao ? `<p class="map-ce-popup__subtitle">${ceEscapeHtml(regiao)}</p>` : ""}
      </header>
      <div class="map-ce-popup__grid">
        ${fieldRows || `<p class="map-ce-popup__empty">Sem operações neste município nos filtros ativos.</p>`}
      </div>
    </section>
  `;
}

function ceGetSelectedQualificacaoLayerKey() {
  const el = document.getElementById("mapQualificacaoLayerStyle");
  const v = el?.value || "cursos";
  return Object.prototype.hasOwnProperty.call(CE_QF_LAYER_CONFIG, v) ? v : "cursos";
}

function ceGetQualificacaoMetricField(metricKey) {
  return CE_QF_LAYER_CONFIG[metricKey]?.field || "cursos";
}

function ceMergeQualificacaoIntoGeojson(geojson, aggByCod, metricKey) {
  const field = ceGetQualificacaoMetricField(metricKey);
  return {
    type: "FeatureCollection",
    features: (geojson.features || []).map((f) => {
      const cod = ceGeoCodiToCodigoMunicipio(f.properties?.GEO_CODI);
      const agg = cod != null ? aggByCod.get(cod) : null;
      const raw = agg ? agg[field] : null;
      const val = agg != null && Number.isFinite(Number(raw)) ? Number(raw) : null;
      return {
        ...f,
        properties: {
          ...(f.properties || {}),
          [CE_QF_PROP]: val,
        },
      };
    }),
  };
}

function ceApplyQualificacaoMapFillPaint() {
  const map = ceMapRuntime.map;
  if (!map?.getLayer("ce-regioes-fill")) return false;

  /* Com mapa de calor ativo, o graduado municipal fica neutro. */
  if (ceIsQualificacaoHeatOverlayOn()) {
    map.setPaintProperty("ce-regioes-fill", "fill-color", "#e8eef5");
    map.setPaintProperty("ce-regioes-fill", "fill-opacity", 0.42);
    return true;
  }

  const metricKey = ceMapRuntime.qualificacaoMetricKey || ceGetSelectedQualificacaoLayerKey();
  const cfg = CE_QF_LAYER_CONFIG[metricKey] || CE_QF_LAYER_CONFIG.cursos;
  const stats = ceComputePropStats(ceMapRuntime.currentMergedGeoJson, CE_QF_PROP, {});
  const activeIdx = ceMapRuntime.activeLegendClass;

  map.setPaintProperty(
    "ce-regioes-fill",
    "fill-color",
    ceBuildNumericFillExpr(CE_QF_PROP, stats?.thresholds || [], CE_QF_COLORS, activeIdx)
  );
  map.setPaintProperty("ce-regioes-fill", "fill-opacity", 0.78);
  return true;
}

function ceApplyQualificacaoLayer(aggByCod, metricKey) {
  const map = ceMapRuntime.map;
  if (!map?.getSource?.("ce-regioes") || !ceMapRuntime.geoJsonBase) return;

  ceMapRuntime.qualificacaoAggByCod = aggByCod instanceof Map ? aggByCod : new Map();
  ceMapRuntime.qualificacaoMetricKey = metricKey || ceGetSelectedQualificacaoLayerKey();
  const merged = ceMergeQualificacaoIntoGeojson(
    ceMapRuntime.geoJsonBase,
    ceMapRuntime.qualificacaoAggByCod,
    ceMapRuntime.qualificacaoMetricKey
  );
  ceMapRuntime.currentMergedGeoJson = merged;
  try {
    map.getSource("ce-regioes").setData(merged);
    ceScheduleMapVisualizationRefresh();
  } catch (e) {
    console.warn("Atualizar mapa Qualificação:", e);
  }
}

function ceSetQualificacaoCursosOverlaysVisibility(map) {
  if (!map) return;
  const inMode = ceIsQualificacaoRoute() && ceIsQualificacaoMode();
  const layerId = ceGetQualificacaoCursosLayerId(map);
  if (layerId) {
    const onPts = inMode && ceIsQualificacaoCursosOverlayOn();
    map.setLayoutProperty(layerId, "visibility", onPts ? "visible" : "none");
  }
  if (map.getLayer(CE_QF_CURSOS_HEAT_LAYER_ID)) {
    const onHeat = inMode && ceIsQualificacaoHeatOverlayOn();
    map.setLayoutProperty(CE_QF_CURSOS_HEAT_LAYER_ID, "visibility", onHeat ? "visible" : "none");
  }
}

function ceApplyQualificacaoCursosPoints(geojson) {
  const fc =
    geojson && geojson.type === "FeatureCollection"
      ? geojson
      : { type: "FeatureCollection", features: [] };
  ceMapRuntime.qualificacaoCursosGeoJson = fc;
  const map = ceMapRuntime.map;
  const src = map?.getSource?.(CE_QF_CURSOS_SOURCE_ID);
  if (!src) return;
  try {
    src.setData(fc);
    ceSetQualificacaoCursosOverlaysVisibility(map);
  } catch (e) {
    console.warn("Atualizar pontos Qualificação:", e);
  }
}

function ceBuildQualificacaoCursoPopupHtml(props) {
  const p = props || {};
  const fmt = (v) => (Number.isFinite(Number(v)) ? ceFormatIntPt(Number(v)) : "");
  const row = (icon, label, value) =>
    value
      ? `<div class="map-ce-popup__row">
          <span class="map-ce-popup__label"><span class="map-ce-popup__icon map-ce-popup__icon--label" aria-hidden="true"><i class="fa-solid ${icon}"></i></span>${ceEscapeHtml(label)}</span>
          <strong class="map-ce-popup__value">${ceEscapeHtml(String(value))}</strong>
        </div>`
      : "";
  return `
    <section class="map-ce-popup" style="--map-popup-accent:${CE_QF_CURSOS_POINT_COLOR}" role="group" aria-label="Local do curso">
      <header class="map-ce-popup__head">
        <h4 class="map-ce-popup__title">
          <span class="map-ce-popup__icon" aria-hidden="true"><i class="fa-solid fa-graduation-cap"></i></span>
          ${ceEscapeHtml(p.curso || "Curso")}
        </h4>
        ${p.municipio ? `<p class="map-ce-popup__subtitle">${ceEscapeHtml(p.municipio)}</p>` : ""}
      </header>
      <div class="map-ce-popup__grid">
        ${row("fa-building", "Executora", p.executora)}
        ${row("fa-layer-group", "Programa", p.programa)}
        ${row("fa-book", "Área", p.area)}
        ${row("fa-map-pin", "Bairro", p.bairro)}
        ${row("fa-road", "Endereço", p.endereco)}
        ${row("fa-calendar", "Data término", p.dataTermino)}
        ${row("fa-users", "Vagas", fmt(p.vagas))}
        ${row("fa-user-check", "Inscritos", fmt(p.inscritos))}
        ${row("fa-user-xmark", "Desistentes", fmt(p.desistentes))}
        ${row("fa-certificate", "Concludentes", fmt(p.concludentes))}
      </div>
    </section>
  `;
}

function ceBuildQualificacaoPopupHtml({ municipio, regiao, agg, accentColor }) {
  const fmt = (v) => (Number.isFinite(Number(v)) ? ceFormatIntPt(Number(v)) : "—");
  const rows = agg
    ? [
        ["Cursos ofertados", agg.cursos],
        ["Vagas ofertadas", agg.vagas],
        ["Inscritos", agg.inscritos],
        ["Desistentes", agg.desistentes],
        ["Concludentes", agg.concludentes],
      ]
    : [];
  const fieldRows = rows
    .map(
      ([label, value]) => `
        <div class="map-ce-popup__row">
          <span class="map-ce-popup__label">
            <span class="map-ce-popup__icon map-ce-popup__icon--label" aria-hidden="true"><i class="fa-solid fa-chart-column"></i></span>
            ${ceEscapeHtml(label)}
          </span>
          <strong class="map-ce-popup__value map-ce-popup__value--metric">${ceEscapeHtml(fmt(value))}</strong>
        </div>`
    )
    .join("");

  return `
    <section class="map-ce-popup" style="--map-popup-accent:${ceEscapeHtml(accentColor || "#059669")}" role="group" aria-label="Detalhes da Qualificação">
      <header class="map-ce-popup__head">
        <h4 class="map-ce-popup__title">
          <span class="map-ce-popup__icon" aria-hidden="true"><i class="fa-solid fa-graduation-cap"></i></span>
          ${ceEscapeHtml(municipio || "Município")}
        </h4>
        ${regiao ? `<p class="map-ce-popup__subtitle">${ceEscapeHtml(regiao)}</p>` : ""}
      </header>
      <div class="map-ce-popup__grid">
        ${
          fieldRows ||
          `<p class="map-ce-popup__empty">Sem dados de Qualificação neste município nos filtros ativos.</p>`
        }
      </div>
    </section>
  `;
}

function ceBuildCagedGrupPopupHtml({ municipio, regiao, agg, grupoKey, metricKey, accentColor }) {
  const cfg = ceGetCagedGrupLegendConfig(grupoKey, metricKey);
  const isSalario = metricKey === "salario_medio";
  const fmtInt = (v) => (Number.isFinite(Number(v)) ? ceFormatIntPt(Number(v)) : "—");
  const fmtSal = (v) => (v == null || !Number.isFinite(Number(v)) ? "—" : ceFormatCurrencyPt(Number(v)));

  let rows = [];
  if (agg) {
    if (isSalario) {
      rows = [
        ["Salário médio — Alojamento", agg.salarioAlojamento, fmtSal(agg.salarioAlojamento)],
        ["Salário médio — Alimentação", agg.salarioAlimentacao, fmtSal(agg.salarioAlimentacao)],
      ];
    } else {
      const aloj = Number(agg?.estoqueAlojamento);
      const alim = Number(agg?.estoqueAlimentacao);
      const total =
        (Number.isFinite(aloj) ? aloj : 0) + (Number.isFinite(alim) ? alim : 0);
      rows = [
        ["Total por grupamento", total, fmtInt(total)],
        ["Alojamento", Number.isFinite(aloj) ? aloj : 0, fmtInt(Number.isFinite(aloj) ? aloj : 0)],
        ["Alimentação", Number.isFinite(alim) ? alim : 0, fmtInt(Number.isFinite(alim) ? alim : 0)],
        ["Salário médio — Alojamento", agg.salarioAlojamento, fmtSal(agg.salarioAlojamento)],
        ["Salário médio — Alimentação", agg.salarioAlimentacao, fmtSal(agg.salarioAlimentacao)],
      ];
    }
  }

  const fieldRows = rows
    .map(
      ([label, , display]) => `
        <div class="map-ce-popup__row">
          <span class="map-ce-popup__label">
            <span class="map-ce-popup__icon map-ce-popup__icon--label" aria-hidden="true"><i class="fa-solid fa-chart-column"></i></span>
            ${ceEscapeHtml(label)}
          </span>
          <strong class="map-ce-popup__value map-ce-popup__value--metric">${ceEscapeHtml(display)}</strong>
        </div>`
    )
    .join("");

  return `
    <section class="map-ce-popup" style="--map-popup-accent:${ceEscapeHtml(accentColor || "#006d2c")}" role="group" aria-label="Detalhes do CAGED por grupamento">
      <header class="map-ce-popup__head">
        <h4 class="map-ce-popup__title">
          <span class="map-ce-popup__icon" aria-hidden="true"><i class="fa-solid fa-industry"></i></span>
          ${ceEscapeHtml(municipio || "Município")}
        </h4>
        ${regiao ? `<p class="map-ce-popup__subtitle">${ceEscapeHtml(regiao)}</p>` : ""}
        <p class="map-ce-popup__subtitle">${ceEscapeHtml(cfg.legendTitle)}</p>
      </header>
      <div class="map-ce-popup__grid">
        ${
          fieldRows ||
          `<p class="map-ce-popup__empty">Sem dados deste grupamento neste município nos filtros ativos.</p>`
        }
      </div>
    </section>
  `;
}

function ceMergeProfileIntoGeojson(geojson, aggByCod, options = {}) {
  const { nullifyZero = false } = options;
  return {
    type: "FeatureCollection",
    features: (geojson.features || []).map((f) => {
      const cod = ceGeoCodiToCodigoMunicipio(f.properties?.GEO_CODI);
      const agg = cod != null ? aggByCod.get(cod) : null;
      const val = agg ? agg.pessoas : null;
      return {
        ...f,
        properties: {
          ...(f.properties || {}),
          [CE_PROFILE_LAYER_PROP]: nullifyZero && val === 0 ? null : val,
        },
      };
    }),
  };
}

function ceGetFiniteFeatureNumber(properties, prop) {
  const raw = properties?.[prop];
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function ceComputePropStats(geojson, prop, options = {}) {
  const vals = (geojson?.features || [])
    .map((f) => ceGetFiniteFeatureNumber(f.properties, prop))
    .filter((n) => n !== null);
  if (!vals.length) return { thresholds: [], min: 0, max: 0 };
  vals.sort((a, b) => a - b);
  const min = vals[0];
  const max = vals[vals.length - 1];
  if (min === max) return { thresholds: [], min, max };

  const fixedLast = options.fixedLastThreshold;
  if (Number.isFinite(fixedLast)) {
    /* As 4 primeiras quebras são quantis sobre os valores < fixedLast;
       a 4ª quebra (t3) é sempre o fixedLast, formando a última classe. */
    const below = vals.filter((v) => v < fixedLast);
    const quantilesBelow = [0.25, 0.5, 0.75].map((q) => {
      if (!below.length) return fixedLast;
      const idx = Math.min(below.length - 1, Math.max(0, Math.ceil(below.length * q) - 1));
      return below[idx];
    });
    const thresholds = [...quantilesBelow, fixedLast];
    return { thresholds, min, max };
  }

  return {
    thresholds: [0.2, 0.4, 0.6, 0.8].map((q) => {
      const idx = Math.min(vals.length - 1, Math.max(0, Math.ceil(vals.length * q) - 1));
      return vals[idx];
    }),
    min,
    max,
  };
}

function ceParseIdtUnidadesCsv(text) {
  const rawText = String(text || "").replace(/^\uFEFF/, "");
  const lines = rawText.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { type: "FeatureCollection", features: [] };

  const headers = ceParseCsvLine(lines[0]).map((h) => ceNormalizeKey(h));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = ceParseCsvLine(lines[i]);
    if (!cells.length) continue;
    const record = {};
    headers.forEach((h, idx) => {
      if (!h) return;
      record[h] = (cells[idx] || "").trim();
    });
    rows.push(record);
  }

  const features = [];
  for (const r of rows) {
    const lat = Number(ceGetCellByKeys(r, ["latitude", "lat"]).replace(",", "."));
    const lon = Number(ceGetCellByKeys(r, ["longitude", "long"]).replace(",", "."));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [lon, lat],
      },
      properties: {
        cod_posto: ceGetCellByKeys(r, ["codposto"]),
        cod_ibge: ceGetCellByKeys(r, ["codibge"]),
        municipio: ceGetCellByKeys(r, ["municipio"]),
        unidade: ceGetCellByKeys(r, ["posto"]),
        tipo: ceGetCellByKeys(r, ["tipo"]),
        responsavel: ceGetCellByKeys(r, ["responsavelatual", "responsavel"]),
        bairro: ceGetCellByKeys(r, ["bairro"]),
        endereco: ceGetCellByKeys(r, ["endereco"]),
        telefone: ceGetCellByKeys(r, ["telefonedaunidade", "telefone"]),
        celular: ceGetCellByKeys(r, ["celulardoresponsavel", "celular"]),
      },
    });
  }

  return { type: "FeatureCollection", features };
}

/**
 * Normaliza um código de posto para comparação: tenta converter para inteiro
 * (remove zeros à esquerda e espaços), mantendo a string original se não for numérico.
 */
function ceNormalizePostoCodigo(raw) {
  const s = String(raw || "").trim();
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? String(n) : s;
}

/**
 * Constrói Map<cod_posto normalizado → cod_ibge (número 6 dígitos)> lendo
 * diretamente o texto CSV das unidades IDT — sem depender do filtro de
 * coordenadas de ceParseIdtUnidadesCsv, garantindo que todos os postos
 * (inclusive sem lat/lon válido) entrem no mapa de lookup.
 */
function ceBuildPostoToIbgeMapFromCsv(text) {
  const m = new Map();
  const rawText = String(text || "").replace(/^\uFEFF/, "");
  const lines = rawText.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return m;
  const headers = ceParseCsvLine(lines[0]).map((h) => ceNormalizeKey(h));
  for (let i = 1; i < lines.length; i++) {
    const cells = ceParseCsvLine(lines[i]);
    if (!cells.length) continue;
    const record = {};
    headers.forEach((h, idx) => { if (h) record[h] = (cells[idx] || "").trim(); });
    const codPosto = ceNormalizePostoCodigo(ceGetCellByKeys(record, ["codposto"]));
    const codIbge  = ceNormalizeCsvCodigoMunicipio(ceGetCellByKeys(record, ["codibge"]));
    if (codPosto && codIbge != null) m.set(codPosto, codIbge);
  }
  return m;
}

/** @deprecated Use ceBuildPostoToIbgeMapFromCsv em vez desta função. */
function ceBuildPostoToIbgeMap(unidadesGeoJson) {
  const m = new Map();
  for (const f of unidadesGeoJson?.features || []) {
    const p = f.properties || {};
    const codPosto = ceNormalizePostoCodigo(p.cod_posto);
    const codIbge = ceNormalizeCsvCodigoMunicipio(p.cod_ibge);
    if (codPosto && codIbge != null) m.set(codPosto, codIbge);
  }
  return m;
}

/**
 * Constrói uma string mesAno a partir das colunas disponíveis no registro.
 * Prioridade: referencia → mês nº + Ano → mês (nome) + Ano → só Ano.
 */
function ceBuildIntermedicaoMesAno(record) {
  const ref = ceGetCellByKeys(record, ["referencia"]);
  if (ref && ceMesAnoKey(ref)) return ref;

  const mesNo  = ceGetCellByKeys(record, ["mesn"]);   // mês nº (normalizado)
  const mesNom = ceGetCellByKeys(record, ["mes"]);    // mês (nome, normalizado)
  const ano    = ceGetCellByKeys(record, ["ano"]);

  if (mesNo && ano) {
    const n = parseInt(mesNo, 10);
    if (n >= 1 && n <= 12) return `${n}/${ano}`;
  }
  if (mesNom && ano) return `${mesNom}/${ano}`;
  if (ano) return ano;
  return ref || "";
}

/**
 * Parseia o CSV de intermediação e distribui as linhas por camada (indicador).
 * Retorna um objeto { "intermediacao_atendimentos": rows[], ... }
 * Cada row segue o formato padrão: { codigo, municipio, mesAno, mesAnoKey, pessoas, raw }
 */
function ceParseIntermedicaoCsv(text, postoCodIbgeMap) {
  const byLayer = Object.fromEntries(CE_INTERMEDIACAO_LAYER_KEYS.map((k) => [k, []]));
  const rawText = String(text || "").replace(/^\uFEFF/, "");
  const lines = rawText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return byLayer;

  const headers = ceParseCsvLine(lines[0]).map((h) => {
    const raw = String(h || "").trim();
    if (raw === "%") return "pct";
    return ceNormalizeKey(h);
  });

  for (let i = 1; i < lines.length; i++) {
    const cells = ceParseCsvLine(lines[i]);
    if (!cells.length) continue;
    const record = {};
    headers.forEach((h, idx) => { if (h) record[h] = (cells[idx] || "").trim(); });

    const indicadorRaw = ceGetCellByKeys(record, ["indicador"]).trim();
    /* Tenta match no mapa de aliases (inclui variantes de grafia e case-insensitive) */
    const layerKey = CE_INTERMEDIACAO_INDICADOR_ALIASES[indicadorRaw]
      || Object.keys(CE_INTERMEDIACAO_INDICADOR_ALIASES).reduce((found, k) => {
        return found || (k.toLowerCase() === indicadorRaw.toLowerCase()
          ? CE_INTERMEDIACAO_INDICADOR_ALIASES[k] : null);
      }, null);
    if (!layerKey) continue;

    /* Lookup cod_ibge via cod_posto (normalizado para comparação robusta) */
    const codPostoRaw = ceGetCellByKeys(record, ["codposto"]);
    const codPosto = ceNormalizePostoCodigo(codPostoRaw);
    const codIbge = postoCodIbgeMap?.get(codPosto);
    if (codIbge == null) continue;

    const mesAno = ceBuildIntermedicaoMesAno(record);
    /* Coluna H: Prev. · coluna I: Real. · coluna J: % */
    const real = ceParseNumberPt(ceGetCellByKeys(record, ["real", "reali"]));
    const prev = ceParseNumberPt(ceGetCellByKeys(record, ["prev"]));
    const pctMeta = ceParsePercentPt(ceGetCellByKeys(record, ["pct", "percentual", "perc"]));

    byLayer[layerKey].push({
      codigo: codIbge,
      municipio: ceGetCellByKeys(record, ["nomedaposto"]),
      mesAno,
      mesAnoKey: ceMesAnoKey(mesAno),
      pessoas: Number.isFinite(real) ? real : 0,
      previsao: Number.isFinite(prev) ? prev : 0,
      pctMeta: Number.isFinite(pctMeta) ? pctMeta : null,
      raw: record,
    });
  }
  return byLayer;
}

function ceGeoCodiToCodigoMunicipio(geoCodi) {
  const n = Number(geoCodi);
  if (!Number.isFinite(n)) return null;
  return Math.floor(n / 10);
}

function ceBuildRegiaoToCodigosMap(geojson) {
  /** @type {Map<string, Set<number>>} */
  const m = new Map();
  for (const f of geojson.features || []) {
    const cod = ceGeoCodiToCodigoMunicipio(f.properties?.GEO_CODI);
    if (cod == null) continue;
    const { regiao } = cePropsMunReg(f.properties);
    const reg = String(regiao || "").trim();
    if (!reg) continue;
    if (!m.has(reg)) m.set(reg, new Set());
    m.get(reg).add(cod);
  }
  return m;
}

function ceRowMesAnoKey(r) {
  return r.mesAnoKey || ceMesAnoKey(r.mesAno);
}

function ceGetFilteredRows(allRows, selMes, selMun, selReg, selAno) {
  /** @type {Set<string> | null} */
  let allowedByReg = null;
  if (selReg && selReg.size > 0) {
    allowedByReg = new Set();
    for (const regName of selReg) {
      const set = ceMapRuntime.regiaoToCodigos.get(regName);
      if (set) {
        for (const c of set) allowedByReg.add(String(c));
      }
    }
  }

  const skipTemporalFilter =
    ceIsPerfilMunicipalMode() && ceIsProfileWideYearLayer(ceGetSelectedProfileLayerKey());

  return allRows.filter((r) => {
    const key = ceRowMesAnoKey(r);
    let yearStr = key && /^(\d{4})-/.exec(key)?.[1];
    if (!yearStr) {
      const rawYear = String(r.mesAno || "").trim();
      if (/^\d{4}$/.test(rawYear)) yearStr = rawYear;
    }
    const okMes = skipTemporalFilter || selMes.size === 0 || (key && selMes.has(key));
    const okAno = skipTemporalFilter || !selAno || selAno.size === 0 || (yearStr && selAno.has(yearStr));
    const okMun = selMun.size === 0 || selMun.has(String(r.codigo));
    const okReg = allowedByReg === null || allowedByReg.has(String(r.codigo));
    return okMes && okAno && okMun && okReg;
  });
}

/** Chave do período mais recente nas linhas (para estoque em nível de mês). */
function ceLatestMesAnoKeyInRows(rows) {
  let bestRank = -1;
  let bestKey = "";
  for (const r of rows) {
    const key = ceRowMesAnoKey(r);
    if (!key) continue;
    const rk = ceMesAnoKeyRank(key);
    if (rk > bestRank) {
      bestRank = rk;
      bestKey = key;
    }
  }
  return bestRank > 0 ? bestKey : "";
}

/** Estoque CAGED é nível no mês; entre linhas filtradas usa só o rótulo mes/ano mais recente. */
function ceLatestMesAnoLabelInRows(rows) {
  const k = ceLatestMesAnoKeyInRows(rows);
  return k ? ceFormatMesAnoFromKey(k) : "";
}

function ceUpdateMapReferenceMesAno() {
  const el = document.getElementById("mapRefMesAno");
  if (!el) return;
  const latest = ceLatestMesAnoLabelInRows(ceMapRuntime.allRows || []);
  el.textContent = latest || "—";
}

function ceAggregateByCodigo(filteredRows) {
  const latestMesKey = ceLatestMesAnoKeyInRows(filteredRows);
  /** @type {Map<number, {estoque:number,admissoes:number,desligamentos:number,saldos:number}>} */
  const m = new Map();
  for (const r of filteredRows) {
    const x = m.get(r.codigo) || { estoque: 0, admissoes: 0, desligamentos: 0, saldos: 0 };
    const rowKey = ceRowMesAnoKey(r);
    const countEstoque = latestMesKey && rowKey === latestMesKey;
    m.set(r.codigo, {
      estoque: x.estoque + (countEstoque ? r.estoque : 0),
      admissoes: x.admissoes + r.admissoes,
      desligamentos: x.desligamentos + r.desligamentos,
      saldos: x.saldos + r.saldos,
    });
  }
  return m;
}

function ceSumKpis(filteredRows) {
  const latestMesKey = ceLatestMesAnoKeyInRows(filteredRows);
  return filteredRows.reduce(
    (acc, r) => {
      const rowKey = ceRowMesAnoKey(r);
      const countEstoque = latestMesKey && rowKey === latestMesKey;
      return {
        estoque: acc.estoque + (countEstoque ? r.estoque : 0),
        admissoes: acc.admissoes + r.admissoes,
        desligamentos: acc.desligamentos + r.desligamentos,
        saldos: acc.saldos + r.saldos,
      };
    },
    { estoque: 0, admissoes: 0, desligamentos: 0, saldos: 0 }
  );
}

function ceMergeCagedIntoGeojson(geojson, aggByCod) {
  const features = (geojson.features || []).map((f) => {
    const key = ceGeoCodiToCodigoMunicipio(f.properties?.GEO_CODI);
    const agg = key != null ? aggByCod.get(key) : undefined;
    return {
      ...f,
      properties: {
        ...f.properties,
        caged_estoque: agg ? agg.estoque : null,
        caged_admissoes: agg ? agg.admissoes : null,
        caged_desligamentos: agg ? agg.desligamentos : null,
        caged_saldos: agg ? agg.saldos : null,
      },
    };
  });
  return { type: "FeatureCollection", features };
}

function ceCollectRegionNamesFromGeojson(geojson) {
  const s = new Set();
  for (const f of geojson.features || []) {
    const r =
      f.properties?.["Região"] ||
      f.properties?.Regiao ||
      f.properties?.REGIÃO ||
      f.properties?.regiao ||
      f.properties?.REGIAO ||
      "";
    const t = String(r).trim();
    if (t) s.add(t);
  }
  return [...s].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function ceInitRegiaoPalette(geojson) {
  const names = ceCollectRegionNamesFromGeojson(geojson);
  const colorMap = new Map();
  const pairs = [];
  names.forEach((n, i) => {
    const c = CE_REGIAO_PALETTE[i % CE_REGIAO_PALETTE.length];
    colorMap.set(n, c);
    pairs.push({ name: n, color: c });
  });
  ceMapRuntime.regiaoColorMap = colorMap;
  ceMapRuntime.regiaoLegendPairs = pairs;
}

function ceCollectPlanejamentoNamesFromGeojson(geojson) {
  const s = new Set();
  for (const f of geojson?.features || []) {
    const n = String(f.properties?.REGIAO_D1 || f.properties?.regiao_d1 || "").trim();
    if (n) s.add(n);
  }
  return [...s].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function ceInitPlanejamentoPalette(geojson) {
  const names = ceCollectPlanejamentoNamesFromGeojson(geojson);
  const colorMap = new Map();
  const pairs = [];
  names.forEach((n, i) => {
    const c = CE_REGIAO_PALETTE[(i + 3) % CE_REGIAO_PALETTE.length];
    colorMap.set(n, c);
    pairs.push({ name: n, color: c });
  });
  ceMapRuntime.planejamentoColorMap = colorMap;
  ceMapRuntime.planejamentoLegendPairs = pairs;
}

function ceBuildRegiaoFillExpr(colorMap) {
  const coalesce = [
    "coalesce",
    ["get", "Região"],
    ["get", "Regiao"],
    ["get", "REGIÃO"],
    ["get", "regiao"],
    ["get", "REGIAO"],
    "",
  ];
  const expr = ["match", coalesce];
  for (const [name, color] of colorMap) {
    expr.push(name, color);
  }
  expr.push(CE_NO_DATA_FILL);
  return expr;
}

function ceQuantileThresholds(values, k = 5) {
  const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return [];
  const thresholds = [];
  for (let c = 1; c < k; c++) {
    const idx = Math.min(n - 1, Math.floor((c * n) / k));
    thresholds.push(sorted[idx]);
  }
  return thresholds;
}

function ceComputeMetricStats(merged, prop) {
  const valores = [];
  for (const f of merged.features || []) {
    const v = f.properties?.[prop];
    if (v != null && Number.isFinite(Number(v))) valores.push(Number(v));
  }
  const min = valores.length ? Math.min(...valores) : 0;
  const max = valores.length ? Math.max(...valores) : 0;
  const thresholds = ceQuantileThresholds(valores, 5);
  return { thresholds, min, max };
}

function ceRefreshLayerStats(merged) {
  const stats = {};
  for (const key of CE_GRADUATED_METRICS) {
    const cfg = CE_METRIC_CONFIG[key];
    stats[key] = ceComputeMetricStats(merged, cfg.prop);
  }
  ceMapRuntime.layerStats = stats;
}

function ceFormatIntPt(n) {
  if (!Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString("pt-BR");
}

function ceFormatCurrencyPt(n) {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function ceFormatPercentPt(pct) {
  if (pct == null || !Number.isFinite(pct)) return "—";
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pct)}%`;
}

function ceFormatMetricValue(metricKey, value, formatOverride = null) {
  const cfg = CE_METRIC_CONFIG[metricKey] || {};
  const format = formatOverride || cfg.format || "int";
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  if (format === "percent") return ceFormatPercentPt(n);
  return ceFormatIntPt(n);
}

function ceBuildSedeLabelMarkers(map, sedesFc) {
  ceMapRuntime.sedeLabelMarkers.forEach((m) => m.remove());
  ceMapRuntime.sedeLabelMarkers = [];
  for (const f of sedesFc?.features || []) {
    const nome =
      f.properties?.MUNICIPIO ||
      f.properties?.Municipio ||
      f.properties?.municipio ||
      f.properties?.NOME ||
      f.properties?.nome ||
      "";
    const coords = f.geometry?.coordinates;
    if (!nome || !coords) continue;
    const cod = ceNormalizeCsvCodigoMunicipio(
      f.properties?.GEOCODIGO ?? f.properties?.GEOCODIGO_MUN ?? f.properties?.GEO_CODI
    );
    const el = document.createElement("span");
    el.className = "ce-sede-label";
    el.textContent = nome;
    if (cod != null) el.dataset.codigo = String(cod);
    const marker = new maplibregl.Marker({ element: el, anchor: "top" })
      .setLngLat([coords[0], coords[1]])
      .addTo(map);
    el.style.display = "none";
    ceMapRuntime.sedeLabelMarkers.push(marker);
  }
}

/** Códigos do filtro Município (vazio = todos). */
function ceGetSelectedMunicipioCodeSet() {
  const munEl = document.getElementById("mapFilterMunicipio");
  return new Set(
    Array.from(munEl?.selectedOptions || [])
      .map((o) => String(o.value || "").trim())
      .filter(Boolean)
  );
}

/** Sedes filtradas pelo select de município (vazio = todas). */
function ceFilterSedesByMunicipio(sedesFc, munSel) {
  const features = sedesFc?.features || [];
  if (!munSel || munSel.size === 0) {
    return { type: "FeatureCollection", features };
  }
  return {
    type: "FeatureCollection",
    features: features.filter((f) => {
      const cod = ceNormalizeCsvCodigoMunicipio(
        f.properties?.GEOCODIGO ?? f.properties?.GEOCODIGO_MUN ?? f.properties?.GEO_CODI
      );
      return cod != null && munSel.has(String(cod));
    }),
  };
}

function ceSetSedesLayersVisibility(map, visible) {
  const munSel = ceGetSelectedMunicipioCodeSet();
  const src = map?.getSource?.("ce-sedes-municipais");
  if (src && ceMapRuntime.sedesGeoJson?.features) {
    try {
      src.setData(ceFilterSedesByMunicipio(ceMapRuntime.sedesGeoJson, munSel));
    } catch (e) {
      console.warn("Filtrar sedes municipais:", e);
    }
  }
  if (map?.getLayer(CE_SEDE_LAYER_ID)) {
    map.setLayoutProperty(CE_SEDE_LAYER_ID, "visibility", visible ? "visible" : "none");
  }
  const filterActive = munSel.size > 0;
  for (const m of ceMapRuntime.sedeLabelMarkers) {
    const el = m.getElement();
    if (!el) continue;
    const cod = el.dataset?.codigo;
    const inFilter = !filterActive || (cod && munSel.has(cod));
    el.style.display = visible && inFilter ? "" : "none";
  }
}

function ceIsSalarioMedioOverlayOn() {
  const btn = document.getElementById("mapToggleSalarioMedio");
  return btn?.getAttribute("aria-pressed") === "true";
}

function ceClearSalarioMedioOverlayLabels() {
  for (const m of ceMapRuntime.salarioLabelMarkers) {
    try {
      m.remove();
    } catch (_) {}
  }
  ceMapRuntime.salarioLabelMarkers = [];
}

function ceFormatSalarioOverlayLabel(n) {
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/** Pontos de sede por código IBGE (para posicionar rótulos). */
function ceBuildSedeCoordsByCodigo(sedesFc) {
  /** @type {Map<number, [number, number]>} */
  const out = new Map();
  for (const f of sedesFc?.features || []) {
    const p = f.properties || {};
    const cod = ceNormalizeCsvCodigoMunicipio(p.GEOCODIGO ?? p.GEOCODIGO_MUN ?? p.GEO_CODI);
    const coords = f.geometry?.coordinates;
    if (cod == null || !coords || coords.length < 2) continue;
    out.set(cod, [Number(coords[0]), Number(coords[1])]);
  }
  return out;
}

/** Centroide aproximado do polígono (fallback se a sede não existir). */
function ceFeatureCentroidLngLat(feature) {
  const g = feature?.geometry;
  if (!g) return null;
  if (g.type === "Point" && Array.isArray(g.coordinates) && g.coordinates.length >= 2) {
    return [Number(g.coordinates[0]), Number(g.coordinates[1])];
  }
  let ring = null;
  if (g.type === "Polygon") ring = g.coordinates?.[0];
  else if (g.type === "MultiPolygon") ring = g.coordinates?.[0]?.[0];
  if (!Array.isArray(ring) || !ring.length) return null;
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const c of ring) {
    if (!c || c.length < 2) continue;
    const x = Number(c[0]);
    const y = Number(c[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    sx += x;
    sy += y;
    n += 1;
  }
  if (!n) return null;
  return [sx / n, sy / n];
}

function ceBuildPolygonCoordsByCodigo(geojson) {
  /** @type {Map<number, [number, number]>} */
  const out = new Map();
  for (const f of geojson?.features || []) {
    const cod = ceGeoCodiToCodigoMunicipio(f.properties?.GEO_CODI);
    if (cod == null || out.has(cod)) continue;
    const ll = ceFeatureCentroidLngLat(f);
    if (ll) out.set(cod, ll);
  }
  return out;
}

function ceBuildSalarioOverlayCoordsByCodigo() {
  const fromSedes = ceBuildSedeCoordsByCodigo(
    ceMapRuntime.sedesGeoJson?.features?.length ? ceMapRuntime.sedesGeoJson : null
  );
  const fromPolys = ceBuildPolygonCoordsByCodigo(
    ceMapRuntime.currentMergedGeoJson || ceMapRuntime.geoJsonBase
  );
  if (!fromSedes.size) return fromPolys;
  if (!fromPolys.size) return fromSedes;
  /** @type {Map<number, [number, number]>} */
  const out = new Map(fromPolys);
  for (const [cod, ll] of fromSedes) out.set(cod, ll);
  return out;
}

/**
 * Texto do rótulo de salário: com desdobramento específico usa salarioMedio;
 * com «Todos» mostra Alojamento e/ou Alimentação disponíveis.
 */
function ceResolveSalarioOverlayDisplay(agg, desdob) {
  if (!agg) return null;
  const isTodos = desdob === "todos" || desdob == null || desdob === "";
  if (!isTodos) {
    const val = Number(agg.salarioMedio);
    if (!Number.isFinite(val)) return null;
    return {
      text: ceFormatSalarioOverlayLabel(val),
      title: `${agg.municipio || "Município"} · ${ceFormatCurrencyPt(val)}`,
    };
  }
  const aloj = Number(agg.salarioAlojamento);
  const alim = Number(agg.salarioAlimentacao);
  const parts = [];
  const titleParts = [];
  if (Number.isFinite(aloj)) {
    parts.push(`A ${ceFormatSalarioOverlayLabel(aloj)}`);
    titleParts.push(`Alojamento ${ceFormatCurrencyPt(aloj)}`);
  }
  if (Number.isFinite(alim)) {
    parts.push(`L ${ceFormatSalarioOverlayLabel(alim)}`);
    titleParts.push(`Alimentação ${ceFormatCurrencyPt(alim)}`);
  }
  if (!parts.length) return null;
  return {
    text: parts.join(" · "),
    title: `${agg.municipio || "Município"} · ${titleParts.join(" · ")}`,
  };
}

/**
 * Sobreposição «Salário médio»: rótulos em R$ sobre cada município com dado
 * (respeita grupamento/desdobramento/filtros da Análise Leste).
 */
function ceRefreshSalarioMedioOverlayLabels() {
  const map = ceMapRuntime.map;
  ceClearSalarioMedioOverlayLabels();
  if (!map || !ceIsCagedGrupamentosMode() || !ceIsSalarioMedioOverlayOn()) {
    const st = document.getElementById("cgStatus");
    if (st && String(st.textContent || "").includes("Sobreposição salário")) {
      window.cagedGrupamentosApi?.setStatus?.("");
    }
    return;
  }

  const api = window.cagedGrupamentosApi;
  if (typeof api?.getSalarioAggByCodigo !== "function") return;

  const desdob = api.getSelectedDesdobramento?.();
  const aggByCod = api.getSalarioAggByCodigo();
  if (!(aggByCod instanceof Map) || !aggByCod.size) {
    api.setStatus?.("Sobreposição salário: sem dados no filtro atual.");
    return;
  }

  const coordsByCod = ceBuildSalarioOverlayCoordsByCodigo();
  if (!coordsByCod.size) {
    api.setStatus?.("Sobreposição salário: coordenadas municipais indisponíveis.");
    return;
  }

  let placed = 0;
  for (const [cod, agg] of aggByCod) {
    const display = ceResolveSalarioOverlayDisplay(agg, desdob);
    if (!display) continue;
    const coords = coordsByCod.get(Number(cod));
    if (!coords) continue;
    const el = document.createElement("span");
    el.className = "ce-salario-label";
    el.textContent = display.text;
    el.title = display.title;
    const marker = new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat(coords)
      .addTo(map);
    ceMapRuntime.salarioLabelMarkers.push(marker);
    placed += 1;
  }

  if (!placed) {
    api.setStatus?.(
      "Sobreposição salário: nenhum município com remuneração válida no filtro (valores ***** são omitidos)."
    );
    return;
  }

  const st = document.getElementById("cgStatus");
  if (st && String(st.textContent || "").includes("Sobreposição salário")) {
    api.setStatus?.("");
  }
}

/** População por município a partir do GeoJSON das sedes (GEOCODIGO alinhado ao código do CSV). */
function ceBuildPopulacaoByCodigoFromSedes(fc) {
  /** @type {Map<number, number>} */
  const m = new Map();
  for (const f of fc?.features || []) {
    const p = f.properties || {};
    const cod = ceNormalizeCsvCodigoMunicipio(p.GEOCODIGO ?? p.GEOCODIGO_MUN ?? p.GEO_CODI);
    if (cod == null) continue;
    const digits = String(p.populacao ?? p.POPULACAO ?? "").replace(/\D/g, "");
    const pop = digits ? Number(digits) : NaN;
    if (!Number.isFinite(pop) || pop <= 0) continue;
    m.set(cod, pop);
  }
  return m;
}

/**
 * Municípios que entram na população do denominador: mesmos filtros geográficos dos KPIs
 * (todos com população no GeoJSON se não há filtro de município nem de região).
 * @param {Set<string>} munSel
 * @param {Set<string>} regSel
 */
function ceCodigosEscopoParaPopulacao(munSel, regSel) {
  const popMap = ceMapRuntime.populacaoByCodigo;
  /** @type {Set<number>} */
  const out = new Set();

  if (munSel && munSel.size > 0) {
    for (const c of munSel) {
      const n = parseInt(String(c), 10);
      if (Number.isFinite(n)) out.add(n);
    }
    return out;
  }

  if (regSel && regSel.size > 0) {
    for (const regName of regSel) {
      const subset = ceMapRuntime.regiaoToCodigos.get(regName);
      if (!subset) continue;
      for (const c of subset) out.add(c);
    }
    return out;
  }

  for (const k of popMap.keys()) out.add(k);
  return out;
}

function ceSumPopulacaoEscopo(codigos) {
  const popMap = ceMapRuntime.populacaoByCodigo;
  let sum = 0;
  for (const c of codigos) {
    const v = popMap.get(c);
    if (Number.isFinite(v)) sum += v;
  }
  return sum;
}

/** Estoque (último mês no filtro) / população no escopo geográfico × 100 */
function ceFormalizacaoPct(estoque, munSel, regSel) {
  const scope = ceCodigosEscopoParaPopulacao(munSel, regSel);
  const popSum = ceSumPopulacaoEscopo(scope);
  if (popSum <= 0 || !Number.isFinite(estoque)) return null;
  return (estoque / popSum) * 100;
}

function cePctSobrePopulacao(valor, munSel, regSel) {
  const scope = ceCodigosEscopoParaPopulacao(munSel, regSel);
  const popSum = ceSumPopulacaoEscopo(scope);
  if (popSum <= 0 || !Number.isFinite(valor)) return null;
  return (valor / popSum) * 100;
}

function ceComputeMapKpiTotals(filteredRows, munSel, regSel) {
  const base = ceSumKpis(filteredRows);
  return {
    ...base,
    formalizacaoPct: ceFormalizacaoPct(base.estoque, munSel, regSel),
  };
}

function ceSumProfilePessoasLatest(filteredRows) {
  const agg = ceAggregateProfileByCodigo(filteredRows);
  let total = 0;
  for (const entry of agg.values()) {
    if (Number.isFinite(entry?.pessoas)) total += entry.pessoas;
  }
  return total;
}

function ceComputeProfileKpiTotals(mesSel, munSel, regSel, anoSel) {
  const totals = {};
  for (const layerKey of CE_PROFILE_LAYER_KEYS) {
    const rows = ceMapRuntime.profileRowsByLayer[layerKey] || [];
    const filtered = ceGetFilteredRows(rows, mesSel, munSel, regSel, anoSel);
    totals[layerKey] = ceSumProfilePessoasLatest(filtered);
  }
  return totals;
}

/** Ceará Credi: somar todas as referências do recorte (vários anos/meses no filtro). */
function ceShouldSumCearaCredPeriods() {
  return true;
}

function ceSumCearaCredKpiFromRows(rows) {
  const sub = { cadastradas: 0, em_atendimento: 0, aprovadas: 0, valor_liberado: 0 };
  for (const row of rows) {
    const m = row.metrics || {};
    for (const k of Object.keys(sub)) {
      sub[k] += Number(m[k]) || 0;
    }
  }
  return sub;
}

function ceSumMunSimplesKpiFromRows(rows) {
  const sub = { nao: 0, sim: 0, total: 0 };
  for (const row of rows) {
    const m = row.metrics || {};
    sub.nao += Number(m.nao) || 0;
    sub.sim += Number(m.sim) || 0;
    sub.total += Number(m.total) || Number(row.pessoas) || 0;
  }
  return sub;
}

function ceSumEmpresaGrupamentoKpiFromRows(rows) {
  const sub = ceEmptyEmpresaGrupamentoMetrics();
  for (const row of rows) {
    const m = row.metrics || {};
    for (const metric of CE_EMPRESA_GRUPAMENTO_METRICS) {
      sub[metric.key] += Number(m[metric.key]) || 0;
    }
    if (!Number(m.total) && Number(row.pessoas)) {
      sub.total += Number(row.pessoas) || 0;
    }
  }
  return sub;
}

function ceMetricsToEmpresaGrupamentoValues(metrics, entry) {
  const values = {};
  for (const metric of CE_EMPRESA_GRUPAMENTO_METRICS) {
    values[metric.key] = Number(metrics?.[metric.key]) || 0;
  }
  values.total = Number(values.total) || Number(entry?.pessoas) || 0;
  return values;
}

function ceSumEmpresasVinculosKpiFromRows(rows) {
  const sub = ceEmptyEmpresasVinculosMetrics();
  for (const row of rows) {
    const m = row.metrics || {};
    for (const metric of CE_EMPRESAS_VINCULOS_METRICS) {
      sub[metric.key] += Number(m[metric.key]) || 0;
    }
    if (!Number(m.total) && Number(row.pessoas)) {
      sub.total += Number(row.pessoas) || 0;
    }
  }
  return sub;
}

function ceMetricsToEmpresasVinculosValues(metrics, entry) {
  const values = {};
  for (const metric of CE_EMPRESAS_VINCULOS_METRICS) {
    values[metric.key] = Number(metrics?.[metric.key]) || 0;
  }
  values.total = Number(values.total) || Number(entry?.pessoas) || 0;
  return values;
}

function ceSumVinculoEscolaridadeKpiFromRows(rows) {
  const sub = ceEmptyVinculoEscolaridadeMetrics();
  for (const row of rows) {
    const m = row.metrics || {};
    for (const metric of CE_VINCULO_ESCOLARIDADE_METRICS) {
      sub[metric.key] += Number(m[metric.key]) || 0;
    }
    if (!Number(m.total) && Number(row.pessoas)) {
      sub.total += Number(row.pessoas) || 0;
    }
  }
  return sub;
}

function ceMetricsToVinculoEscolaridadeValues(metrics, entry) {
  const values = {};
  for (const metric of CE_VINCULO_ESCOLARIDADE_METRICS) {
    values[metric.key] = Number(metrics?.[metric.key]) || 0;
  }
  values.total = Number(values.total) || Number(entry?.pessoas) || 0;
  return values;
}

function ceSumVinculoSexoKpiFromRows(rows) {
  const sub = ceEmptyVinculoSexoMetrics();
  for (const row of rows) {
    const m = row.metrics || {};
    for (const metric of CE_VINCULO_SEXO_METRICS) {
      sub[metric.key] += Number(m[metric.key]) || 0;
    }
    if (!Number(m.total) && Number(row.pessoas)) {
      sub.total += Number(row.pessoas) || 0;
    }
  }
  return sub;
}

function ceMetricsToVinculoSexoValues(metrics, entry) {
  const values = {};
  for (const metric of CE_VINCULO_SEXO_METRICS) {
    values[metric.key] = Number(metrics?.[metric.key]) || 0;
  }
  values.total = Number(values.total) || Number(entry?.pessoas) || 0;
  return values;
}

function ceBuildProfileAggByLayer(mesSel, munSel, regSel, anoSel) {
  const aggByLayer = {};
  const filteredByLayer = {};
  for (const layerKey of CE_PROFILE_LAYER_KEYS) {
    const rows = ceMapRuntime.profileRowsByLayer[layerKey] || [];
    const filtered = ceGetFilteredRows(rows, mesSel, munSel, regSel, anoSel);
    filteredByLayer[layerKey] = filtered;
    const sumAllPeriods =
      layerKey === "ceara_cred" ||
      CE_PROFILE_LAYER_CONFIG[layerKey]?.parseMode === "intermediacao";
    aggByLayer[layerKey] = ceAggregateProfileByCodigo(filtered, { sumAllPeriods });
  }
  return { aggByLayer, filteredByLayer };
}

const CE_LEGEND_DIM_COLOR = "#d4d7e3";

function ceBuildStrictStepThresholds(thresholds) {
  if (!Array.isArray(thresholds) || thresholds.length < 4) return [];
  const strict = thresholds.slice(0, 4).map((v) => Number(v));
  if (strict.some((v) => !Number.isFinite(v))) return [];
  for (let i = 1; i < strict.length; i++) {
    if (strict[i] <= strict[i - 1]) {
      strict[i] = strict[i - 1] + Number.EPSILON;
    }
  }
  return strict;
}

function ceBuildNumericFillExpr(prop, thresholds, colors, activeIdx = null) {
  const displayColors = activeIdx !== null
    ? colors.map((c, i) => (i === activeIdx ? c : CE_LEGEND_DIM_COLOR))
    : colors;
  const stepThresholds = ceBuildStrictStepThresholds(thresholds);

  if (!stepThresholds.length) {
    return [
      "case",
      ["==", ["get", prop], ["literal", null]],
      CE_NO_DATA_FILL,
      displayColors[Math.min(4, displayColors.length - 1)] || CE_NO_DATA_FILL,
    ];
  }
  const [t0, t1, t2, t3] = stepThresholds;
  return [
    "case",
    ["==", ["get", prop], ["literal", null]],
    CE_NO_DATA_FILL,
    [
      "step",
      ["to-number", ["get", prop], 0],
      displayColors[0],
      t0,
      displayColors[1],
      t1,
      displayColors[2],
      t2,
      displayColors[3],
      t3,
      displayColors[4],
    ],
  ];
}

function ceLegendClassIndex(value, thresholds) {
  const n = Number(value);
  if (!Number.isFinite(n) || !thresholds || thresholds.length < 4) return -1;
  const [t0, t1, t2, t3] = ceBuildStrictStepThresholds(thresholds);
  if (n < t0) return 0;
  if (n < t1) return 1;
  if (n < t2) return 2;
  if (n < t3) return 3;
  return 4;
}

function ceGetActiveLegendThresholds() {
  if (ceIsVaiVemMode()) {
    const stats = ceComputePropStats(ceMapRuntime.currentMergedGeoJson, CE_VAI_VEM_PROP, {});
    return stats?.thresholds || [];
  }
  if (ceIsCagedGrupamentosMode()) {
    const stats = ceComputePropStats(ceMapRuntime.currentMergedGeoJson, CE_CAGED_GRUP_PROP, {});
    return stats?.thresholds || [];
  }
  if (ceIsSeguroDesempregoMode()) {
    const stats = ceComputePropStats(ceMapRuntime.currentMergedGeoJson, CE_SD_PROP, {});
    return stats?.thresholds || [];
  }
  if (ceIsDinheiroNaMaoMode()) {
    const stats = ceComputePropStats(ceMapRuntime.currentMergedGeoJson, CE_DNM_PROP, {});
    return stats?.thresholds || [];
  }
  if (ceIsQualificacaoMode()) {
    const stats = ceComputePropStats(ceMapRuntime.currentMergedGeoJson, CE_QF_PROP, {});
    return stats?.thresholds || [];
  }
  if (ceIsPerfilMunicipalMode()) {
    const profileCfg = ceGetActiveProfileLayerConfig();
    const profileStats = ceComputePropStats(ceMapRuntime.currentMergedGeoJson, CE_PROFILE_LAYER_PROP, {
      fixedLastThreshold: profileCfg?.fixedLastThreshold,
    });
    return profileStats?.thresholds || [];
  }
  const mode = ceGetSelectedLayerMode();
  return ceMapRuntime.layerStats[mode]?.thresholds || [];
}

function ceValueMatchesActiveLegendClass(value) {
  const activeIdx = ceMapRuntime.activeLegendClass;
  if (activeIdx === null) return true;
  const thresholds = ceGetActiveLegendThresholds();
  if (!thresholds.length) return true;
  return ceLegendClassIndex(value, thresholds) === activeIdx;
}

function ceBuildLegendClassGroupsByProp(prop, thresholds) {
  const groups = Array.from({ length: 5 }, () => ({ count: 0, nomes: [] }));
  if (!thresholds || thresholds.length < 4) return groups;
  for (const f of ceMapRuntime.currentMergedGeoJson?.features || []) {
    const v = ceGetFiniteFeatureNumber(f.properties, prop);
    if (v === null) continue;
    const idx = ceLegendClassIndex(v, thresholds);
    if (idx < 0) continue;
    groups[idx].count += 1;
    const { municipio } = cePropsMunReg(f.properties);
    const nome = municipio || f.properties?.Município || f.properties?.Municipio || f.properties?.MUNICIPIO;
    if (nome) groups[idx].nomes.push(nome);
  }
  for (const g of groups) {
    g.nomes.sort((a, b) => a.localeCompare(b, "pt-BR"));
  }
  return groups;
}

function ceUpdateLegendNumeric(el, metricKey, thresholds, minV, maxV) {
  const cfg = CE_METRIC_CONFIG[metricKey];
  ceUpdateLegendNumericGeneric(el, {
    prop: cfg?.prop,
    colors: cfg?.colors,
    legendTitle: cfg?.legendTitle || "Indicador",
    formatValue: (value) => ceFormatMetricValue(metricKey, value),
  }, thresholds, minV, maxV);
}

function ceUpdateLegendNumericGeneric(el, cfg, thresholds, minV, maxV) {
  if (!el) return;
  if (!cfg?.prop || !cfg?.colors || !thresholds.length) {
    el.innerHTML = `<span class="map-ce-legend__title">${ceEscapeHtml(cfg?.legendTitle || "Indicador")}</span><p class="map-ce-legend__empty">Sem valores para classificar neste filtro.</p>`;
    return;
  }
  const colors = cfg.colors;
  const [t0, t1, t2, t3] = thresholds;
  const fmt = typeof cfg.formatValue === "function" ? cfg.formatValue : (value) => ceFormatIntPt(Number(value));
  const groups = ceBuildLegendClassGroupsByProp(cfg.prop, thresholds);
  const hasFixedLast = Number.isFinite(cfg.fixedLastThreshold);
  const activeIdx = ceMapRuntime.activeLegendClass;
  let ranges;
  if (minV === maxV) {
    ranges = [
      { label: fmt(minV), color: colors[4], count: groups[4].count, nomes: groups[4].nomes },
    ];
  } else {
    ranges = [
      { label: `menores que ${fmt(t0)}`, color: colors[0], count: groups[0].count, nomes: groups[0].nomes },
      { label: `${fmt(t0)} a ${fmt(t1)}`, color: colors[1], count: groups[1].count, nomes: groups[1].nomes },
      { label: `${fmt(t1)} a ${fmt(t2)}`, color: colors[2], count: groups[2].count, nomes: groups[2].nomes },
      { label: `${fmt(t2)} a ${fmt(t3)}`, color: colors[3], count: groups[3].count, nomes: groups[3].nomes },
      {
        label: hasFixedLast ? `${fmt(cfg.fixedLastThreshold)} ou mais` : `${fmt(t3)} ou mais`,
        color: colors[4],
        count: groups[4].count,
        nomes: groups[4].nomes,
      },
    ];
  }
  const legendSubtitle = hasFixedLast
    ? "última classe fixa em " + fmt(cfg.fixedLastThreshold) + " · demais por quantis"
    : "5 classes (quantis)";
  const activeHint = activeIdx !== null
    ? `<span class="map-ce-legend__filter-hint">Clique novamente para limpar o filtro</span>`
    : `<span class="map-ce-legend__filter-hint">Clique em uma classe para destacá-la no mapa</span>`;
  el.innerHTML = `
    <span class="map-ce-legend__title">${ceEscapeHtml(cfg.legendTitle)} — ${ceEscapeHtml(legendSubtitle)}</span>
    <span class="map-ce-legend__range">Nos municípios com dado: ${fmt(minV)} — ${fmt(maxV)} · filtros ativos</span>
    ${activeHint}
    <div class="map-ce-legend__items">
      ${ranges
        .map(
          (r, i) => {
            const isActive = activeIdx === i;
            const isDimmed = activeIdx !== null && !isActive;
            const cls = [
              "map-ce-legend__item",
              "map-ce-legend__item--clickable",
              isActive ? "map-ce-legend__item--active" : "",
              isDimmed ? "map-ce-legend__item--dimmed" : "",
            ].filter(Boolean).join(" ");
            return `<span class="${cls}" data-legend-class="${i}" role="button" tabindex="0" title="${ceEscapeHtml(isActive ? "Clique para ver todas as classes" : "Clique para destacar esta classe")}">
              <span class="map-ce-legend__item-body">
                <span class="map-ce-legend__item-line map-ce-legend__item-line--legend">
                  <span class="map-ce-legend__swatch" style="background:${r.color}"></span>
                  <strong>${ceEscapeHtml(r.label)}</strong>
                </span>
                <details class="map-ce-legend__detail">
                  <summary class="map-ce-legend__item-count">${ceEscapeHtml(String(r.count || 0))} município(s)</summary>
                  <div class="map-ce-legend__item-names">${ceEscapeHtml((r.nomes || []).join(", ") || "—")}</div>
                </details>
              </span>
            </span>`;
          }
        )
        .join("")}
      <span class="map-ce-legend__item map-ce-legend__item--muted"><span class="map-ce-legend__swatch" style="background:${CE_NO_DATA_FILL}"></span>Sem dado no filtro</span>
    </div>
  `;
}

/** Legenda completa: indicador graduado + bloco opcional da sobreposição «Região». */
function ceRenderFullLegend(metricKey) {
  const el = ceMapRuntime.legendEl;
  if (!el) return;
  if (ceIsVaiVemMode()) {
    const layerKey = ceGetSelectedVaiVemLayerKey();
    const cfg = CE_VAI_VEM_LAYER_CONFIG[layerKey];
    const st = ceComputePropStats(ceMapRuntime.currentMergedGeoJson, CE_VAI_VEM_PROP, {});
    ceUpdateLegendNumericGeneric(
      el,
      {
        prop: CE_VAI_VEM_PROP,
        colors: CE_VAI_VEM_COLORS,
        legendTitle: cfg.legendTitle,
        formatValue: (value) => ceFormatIntPt(Number(value)),
      },
      st.thresholds,
      st.min,
      st.max
    );
  } else if (ceIsCagedGrupamentosMode()) {
    const grupoKey = ceMapRuntime.cagedGrupGrupoKey;
    const metricKey = ceMapRuntime.cagedGrupMetricKey;
    const cfg = ceGetCagedGrupLegendConfig(grupoKey, metricKey);
    const st = ceComputePropStats(ceMapRuntime.currentMergedGeoJson, CE_CAGED_GRUP_PROP, {});
    ceUpdateLegendNumericGeneric(
      el,
      {
        prop: CE_CAGED_GRUP_PROP,
        colors: cfg.colors,
        legendTitle: cfg.legendTitle,
        formatValue: (value) =>
          cfg.format === "currency"
            ? ceFormatCurrencyPt(Number(value))
            : ceFormatIntPt(Number(value)),
      },
      st.thresholds,
      st.min,
      st.max
    );
  } else if (ceIsSeguroDesempregoMode()) {
    const layerKey = ceMapRuntime.seguroDesempregoMetricKey || ceGetSelectedSeguroDesempregoLayerKey();
    const cfg = CE_SD_LAYER_CONFIG[layerKey] || CE_SD_LAYER_CONFIG.requerentes;
    const st = ceComputePropStats(ceMapRuntime.currentMergedGeoJson, CE_SD_PROP, {});
    ceUpdateLegendNumericGeneric(
      el,
      {
        prop: CE_SD_PROP,
        colors: CE_SD_COLORS,
        legendTitle: cfg.legendTitle,
        formatValue: (value) => ceFormatIntPt(Number(value)),
      },
      st.thresholds,
      st.min,
      st.max
    );
  } else if (ceIsDinheiroNaMaoMode()) {
    const layerKey = ceMapRuntime.dinheiroNaMaoMetricKey || ceGetSelectedDinheiroNaMaoLayerKey();
    const cfg = CE_DNM_LAYER_CONFIG[layerKey] || CE_DNM_LAYER_CONFIG.operacoes;
    const st = ceComputePropStats(ceMapRuntime.currentMergedGeoJson, CE_DNM_PROP, {});
    ceUpdateLegendNumericGeneric(
      el,
      {
        prop: CE_DNM_PROP,
        colors: CE_DNM_COLORS,
        legendTitle: cfg.legendTitle,
        formatValue: (value) =>
          cfg.format === "currency"
            ? ceFormatCurrencyPt(Number(value))
            : ceFormatIntPt(Number(value)),
      },
      st.thresholds,
      st.min,
      st.max
    );
  } else if (ceIsQualificacaoMode()) {
    const layerKey = ceMapRuntime.qualificacaoMetricKey || ceGetSelectedQualificacaoLayerKey();
    const cfg = CE_QF_LAYER_CONFIG[layerKey] || CE_QF_LAYER_CONFIG.cursos;
    const st = ceComputePropStats(ceMapRuntime.currentMergedGeoJson, CE_QF_PROP, {});
    ceUpdateLegendNumericGeneric(
      el,
      {
        prop: CE_QF_PROP,
        colors: CE_QF_COLORS,
        legendTitle: cfg.legendTitle,
        formatValue: (value) => ceFormatIntPt(Number(value)),
      },
      st.thresholds,
      st.min,
      st.max
    );
  } else if (ceIsPerfilMunicipalMode()) {
    const cfg = ceGetActiveProfileLayerConfig();
    const st = ceComputePropStats(
      ceMapRuntime.currentMergedGeoJson,
      CE_PROFILE_LAYER_PROP,
      { fixedLastThreshold: cfg.fixedLastThreshold }
    );
    ceUpdateLegendNumericGeneric(
      el,
      {
        prop: CE_PROFILE_LAYER_PROP,
        colors: cfg.colors,
        legendTitle: cfg.legendTitle,
        formatValue: (value) => ceFormatProfileMetricValue(value),
        fixedLastThreshold: cfg.fixedLastThreshold,
      },
      st.thresholds,
      st.min,
      st.max
    );
  } else {
    const st = ceMapRuntime.layerStats[metricKey] || { thresholds: [], min: 0, max: 0 };
    ceUpdateLegendNumeric(el, metricKey, st.thresholds, st.min, st.max);
  }

  if (ceIsRegiaoOverlayOn()) {
    const pairs = ceMapRuntime.regiaoLegendPairs || [];
    const overlayItems =
      pairs.length === 0
        ? '<p class="map-ce-legend__empty">Nenhuma região no GeoJSON.</p>'
        : `<div class="map-ce-legend__items">
            ${pairs
              .map(
                (p) =>
                  `<span class="map-ce-legend__item"><span class="map-ce-legend__swatch" style="background:${p.color}"></span>${ceEscapeHtml(p.name)}</span>`
              )
              .join("")}
            <span class="map-ce-legend__item map-ce-legend__item--muted"><span class="map-ce-legend__swatch" style="background:${CE_NO_DATA_FILL}"></span>Sem região</span>
          </div>`;

    el.innerHTML += `
      <div class="map-ce-legend__overlay">
        <span class="map-ce-legend__overlay-title">Sobreposição — Região administrativa</span>
        <span class="map-ce-legend__range">Camada semitransparente (${Math.round(CE_REGIAO_OVERLAY_FILL_OPACITY * 100)}%) sobre o indicador graduado · <code>ce_regioes.geojson</code></span>
        ${overlayItems}
      </div>
    `;
  }

  if (!ceIsPlanejamentoOverlayOn()) return;

  const planPairs = ceMapRuntime.planejamentoLegendPairs || [];
  const planNames =
    planPairs.length === 0
      ? ""
      : `<p class="map-ce-legend__item-names">${ceEscapeHtml(planPairs.map((p) => p.name).join(", "))}</p>`;

  el.innerHTML += `
    <div class="map-ce-legend__overlay">
      <span class="map-ce-legend__overlay-title">Sobreposição — Região de planejamento</span>
      <span class="map-ce-legend__range">Contorno preto (${CE_PLANEJAMENTO_LINE_WIDTH}px) · <code>regiao_planejamento.geojson</code></span>
      <div class="map-ce-legend__items">
        <span class="map-ce-legend__item">
          <span class="map-ce-legend__swatch" style="background:${CE_PLANEJAMENTO_LINE_COLOR}"></span>
          Limite da região de planejamento
        </span>
      </div>
      ${planNames}
    </div>
  `;
}

function ceIsRegiaoOverlayOn() {
  const btn = document.getElementById("mapToggleRegiao");
  return btn?.getAttribute("aria-pressed") === "true";
}

function ceIsUnidadesOverlayOn() {
  const btn = document.getElementById("mapToggleUnidades");
  return btn?.getAttribute("aria-pressed") === "true";
}

function ceIsQualificacaoCursosOverlayOn() {
  return false;
}

function ceIsQualificacaoHeatOverlayOn() {
  return false;
}

function ceResetQualificacaoCursoToggles() {
  /* aba Qualificação removida */
}

function ceIsSedesOverlayOn() {
  const btn = document.getElementById("mapToggleSedes");
  return btn?.getAttribute("aria-pressed") === "true";
}

function ceIsPlanejamentoOverlayOn() {
  const btn = document.getElementById("mapTogglePlanejamento");
  return btn?.getAttribute("aria-pressed") === "true";
}

function ceIsPerfilMunicipalMode() {
  const root = document.getElementById("secaoMapaCe");
  if (root?.classList.contains("section-map-ce--perfil")) return true;
  if (root?.classList.contains("section-map-ce--intermediacao")) return true;
  if (root?.classList.contains("section-map-ce--ceara-credi")) return true;
  if (root?.classList.contains("section-map-ce--perfil-empresas")) return true;
  if (root?.classList.contains("section-map-ce--vai-vem")) return true;
  if (cePendingPageMode && ceIsProfileMapPageMode(cePendingPageMode)) return true;
  return false;
}

function ceIsIntermediacaoMode() {
  const root = document.getElementById("secaoMapaCe");
  return root?.classList.contains("section-map-ce--intermediacao") === true;
}

function ceIsCearaCrediMode() {
  const root = document.getElementById("secaoMapaCe");
  return root?.classList.contains("section-map-ce--ceara-credi") === true;
}

function ceIsPerfilEmpresasMode() {
  const root = document.getElementById("secaoMapaCe");
  return root?.classList.contains("section-map-ce--perfil-empresas") === true;
}

function ceIsVaiVemMode() {
  const root = document.getElementById("secaoMapaCe");
  return root?.classList.contains("section-map-ce--vai-vem") === true;
}

function ceIsCagedGrupamentosSheet(sheetName) {
  return sheetName === "caged_grupamentos" || sheetName === "analise_leste";
}

function ceIsCagedGrupamentosMode() {
  const root = document.getElementById("secaoMapaCe");
  return root?.classList.contains("section-map-ce--caged-grupamentos") === true;
}

function ceIsSeguroDesempregoMode() {
  const root = document.getElementById("secaoMapaCe");
  return root?.classList.contains("section-map-ce--seguro-desemprego") === true;
}

function ceIsDinheiroNaMaoMode() {
  const root = document.getElementById("secaoMapaCe");
  return root?.classList.contains("section-map-ce--dinheiro-na-mao") === true;
}

function ceIsQualificacaoRoute() {
  return false;
}

function ceIsQualificacaoMode() {
  return false;
}

function ceIsPerfilEmpresasLayerKey(layerKey) {
  return CE_PERFIL_EMPRESAS_LAYER_KEYS.includes(layerKey);
}

function ceIsProfileMapPageMode(sheetName) {
  return (
    sheetName === "perfil_municipal" ||
    sheetName === "perfil_empresas" ||
    sheetName === "series_historicas" ||
    sheetName === "ceara_credi" ||
    sheetName === "vai_vem"
  );
}

/** Modo de página pendente — aplicado assim que o mapa terminar de carregar. */
let cePendingPageMode = null;

function ceApplyPageModeClasses(sheetName) {
  const root = document.getElementById("secaoMapaCe");
  if (!root) return;
  const isIntermediacao = sheetName === "series_historicas";
  const isCearaCredi = sheetName === "ceara_credi";
  const isPerfilEmpresas = sheetName === "perfil_empresas";
  const isVaiVem = sheetName === "vai_vem";
  const isCagedGrup = ceIsCagedGrupamentosSheet(sheetName);
  const isSeguroDesemp = sheetName === "seguro_desemprego";
  const isDinheiroNaMao = sheetName === "dinheiro_na_mao";
  const isQualificacao = false;
  const isPerfilMode = ceIsProfileMapPageMode(sheetName);
  root.classList.toggle("section-map-ce--perfil", isPerfilMode);
  root.classList.toggle("section-map-ce--intermediacao", isIntermediacao);
  root.classList.toggle("section-map-ce--ceara-credi", isCearaCredi);
  root.classList.toggle("section-map-ce--perfil-empresas", isPerfilEmpresas);
  root.classList.toggle("section-map-ce--vai-vem", isVaiVem);
  root.classList.toggle("section-map-ce--caged-grupamentos", isCagedGrup);
  root.classList.toggle("section-map-ce--seguro-desemprego", isSeguroDesemp);
  root.classList.toggle("section-map-ce--dinheiro-na-mao", isDinheiroNaMao);
  root.classList.toggle("section-map-ce--qualificacao", isQualificacao);
  if (!isQualificacao) ceResetQualificacaoCursoToggles();
}

function ceSyncProfileLayerSelectForPage(sheetName) {
  const sel = document.getElementById("mapProfileLayerStyle");
  if (!sel) return;
  const allowed =
    sheetName === "series_historicas"
      ? new Set(CE_INTERMEDIACAO_LAYER_KEYS)
      : sheetName === "ceara_credi"
        ? new Set(["ceara_cred"])
        : sheetName === "perfil_empresas"
          ? new Set(CE_PERFIL_EMPRESAS_LAYER_KEYS)
          : sheetName === "vai_vem"
            ? new Set()
            : null;
  for (const opt of sel.options) {
    const isIntLayer = opt.value.startsWith("intermediacao_");
    const isCearaCred = opt.value === "ceara_cred";
    const isEmpresaLayer = CE_PERFIL_EMPRESAS_LAYER_KEYS.includes(opt.value);
    if (sheetName === "vai_vem") {
      opt.hidden = true;
      continue;
    }
    if (ceIsCagedGrupamentosSheet(sheetName)) {
      opt.hidden = true;
      continue;
    }
    if (sheetName === "seguro_desemprego") {
      opt.hidden = true;
      continue;
    }
    if (sheetName === "qualificacao") {
      opt.hidden = true;
      continue;
    }
    if (sheetName === "dinheiro_na_mao") {
      opt.hidden = true;
      continue;
    }
    if (allowed) {
      opt.hidden = !allowed.has(opt.value);
    } else if (sheetName === "perfil_municipal") {
      opt.hidden = isIntLayer || isCearaCred || isEmpresaLayer;
    }
  }
  if (allowed && !allowed.has(sel.value)) {
    sel.value = [...allowed][0];
  } else if (
    sheetName === "perfil_municipal" &&
    (sel.value.startsWith("intermediacao_") || sel.value === "ceara_cred" || isEmpresaLayerSelected(sel))
  ) {
    const first = Array.from(sel.options).find((o) => !o.hidden);
    if (first) sel.value = first.value;
  }
}

function isEmpresaLayerSelected(sel) {
  return CE_PERFIL_EMPRESAS_LAYER_KEYS.includes(sel.value);
}

function ceGetIdtLayerId(map) {
  if (map?.getLayer("ce-idt-unidades-symbol")) return "ce-idt-unidades-symbol";
  if (map?.getLayer("ce-idt-unidades-circle")) return "ce-idt-unidades-circle";
  return null;
}

function ceGetQualificacaoCursosLayerId(map) {
  if (map?.getLayer(CE_QF_CURSOS_SYMBOL_LAYER_ID)) return CE_QF_CURSOS_SYMBOL_LAYER_ID;
  if (map?.getLayer(CE_QF_CURSOS_CIRCLE_LAYER_ID)) return CE_QF_CURSOS_CIRCLE_LAYER_ID;
  return null;
}

/**
 * Rasteriza o ícone Font Awesome da aba Qualificação (graduation-cap) para MapLibre.
 * Estilo alinhado ao badge do page-ident: fundo em degradê + glifo branco.
 */
function ceBuildQualificacaoCapIconImageData(size = 96) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const r = Math.round(size * 0.28);
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(0, 0, size, size, r);
  } else {
    ctx.moveTo(r, 0);
    ctx.arcTo(size, 0, size, size, r);
    ctx.arcTo(size, size, 0, size, r);
    ctx.arcTo(0, size, 0, 0, r);
    ctx.arcTo(0, 0, size, 0, r);
    ctx.closePath();
  }
  const grd = ctx.createLinearGradient(0, 0, size, size);
  grd.addColorStop(0, "#7c83ff");
  grd.addColorStop(0.45, "#4a59ff");
  grd.addColorStop(1, "#2563eb");
  ctx.fillStyle = grd;
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.round(size * 0.48)}px "Font Awesome 6 Free"`;
  ctx.fillText(CE_QF_CURSOS_FA_GLYPH, size / 2, size / 2 + size * 0.02);
  return ctx.getImageData(0, 0, size, size);
}

async function ceEnsureQualificacaoCapIcon(map) {
  if (!map) return false;
  if (map.hasImage(CE_QF_CURSOS_ICON_ID)) return true;
  try {
    if (document.fonts?.load) {
      await document.fonts.load(`900 48px "Font Awesome 6 Free"`);
    } else if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  } catch (_) {}
  const imageData = ceBuildQualificacaoCapIconImageData(96);
  if (!imageData) return false;
  try {
    map.addImage(CE_QF_CURSOS_ICON_ID, imageData);
    return true;
  } catch (err) {
    console.warn("Ícone Qualificação (graduation-cap) não carregado:", err);
    return false;
  }
}

function ceGetSelectedLayerMode() {
  const el = document.getElementById("mapLayerStyle");
  const v = el?.value || "estoque";
  return CE_GRADUATED_METRICS.includes(v) ? v : "estoque";
}

/** Atualiza apenas o preenchimento graduado no modo perfil/intermediação. */
function ceApplyProfileMapFillPaint() {
  const map = ceMapRuntime.map;
  if (!map?.getLayer("ce-regioes-fill")) return false;

  const profileCfg = ceGetActiveProfileLayerConfig();
  const profileStats = ceComputePropStats(ceMapRuntime.currentMergedGeoJson, CE_PROFILE_LAYER_PROP, {
    fixedLastThreshold: profileCfg?.fixedLastThreshold,
  });
  const activeIdx = ceMapRuntime.activeLegendClass;

  map.setPaintProperty(
    "ce-regioes-fill",
    "fill-color",
    ceBuildNumericFillExpr(
      CE_PROFILE_LAYER_PROP,
      profileStats?.thresholds || [],
      profileCfg?.colors || CE_ESTOQUE_COLORS,
      activeIdx
    )
  );
  map.setPaintProperty("ce-regioes-fill", "fill-opacity", 0.82);
  return true;
}

/** Reaplica visualização após setData — o paint pode ficar preso na paleta CAGED no primeiro carregamento. */
function ceScheduleMapVisualizationRefresh() {
  ceApplyVisualization();
  const map = ceMapRuntime.map;
  if (!map) return;
  requestAnimationFrame(() => {
    ceApplyVisualization();
    try {
      map.triggerRepaint();
    } catch (_) {}
  });
  map.once("idle", () => {
    ceApplyVisualization();
  });
}

function ceApplyVisualization() {
  const map = ceMapRuntime.map;
  if (!map || !map.getSource("ce-regioes")) return;

  const mode = ceGetSelectedLayerMode();
  const cfg = CE_METRIC_CONFIG[mode];
  const st = ceMapRuntime.layerStats[mode] || { thresholds: [], min: 0, max: 0 };
  const isPerfil = ceIsPerfilMunicipalMode();
  const activeIdx = ceMapRuntime.activeLegendClass;

  try {
    if (ceIsVaiVemMode()) {
      ceApplyVaiVemMapFillPaint();
    } else if (ceIsCagedGrupamentosMode()) {
      ceApplyCagedGrupMapFillPaint();
    } else if (ceIsSeguroDesempregoMode()) {
      ceApplySeguroDesempregoMapFillPaint();
    } else if (ceIsDinheiroNaMaoMode()) {
      ceApplyDinheiroNaMaoMapFillPaint();
    } else if (ceIsQualificacaoMode()) {
      ceApplyQualificacaoMapFillPaint();
    } else if (isPerfil) {
      ceApplyProfileMapFillPaint();
    } else {
      map.setPaintProperty(
        "ce-regioes-fill",
        "fill-color",
        ceBuildNumericFillExpr(cfg.prop, st.thresholds, cfg.colors, activeIdx)
      );
      map.setPaintProperty("ce-regioes-fill", "fill-opacity", 0.78);
    }
    map.setPaintProperty("ce-regioes-fill", "fill-outline-color", "rgba(0, 60, 40, 0.35)");

    if (map.getLayer("ce-regioes-regiao-fill")) {
      const on = ceIsRegiaoOverlayOn();
      map.setLayoutProperty("ce-regioes-regiao-fill", "visibility", on ? "visible" : "none");
      if (on) {
        map.setPaintProperty(
          "ce-regioes-regiao-fill",
          "fill-color",
          ceBuildRegiaoFillExpr(ceMapRuntime.regiaoColorMap)
        );
      }
    }

    if (map.getLayer(CE_PLANEJAMENTO_LINE_LAYER_ID)) {
      const onPlan = ceIsPlanejamentoOverlayOn();
      map.setLayoutProperty(CE_PLANEJAMENTO_LINE_LAYER_ID, "visibility", onPlan ? "visible" : "none");
      if (onPlan) {
        map.setPaintProperty(CE_PLANEJAMENTO_LINE_LAYER_ID, "line-color", CE_PLANEJAMENTO_LINE_COLOR);
        map.setPaintProperty(CE_PLANEJAMENTO_LINE_LAYER_ID, "line-width", CE_PLANEJAMENTO_LINE_WIDTH);
      }
    }

    const idtLayerId = ceGetIdtLayerId(map);
    if (idtLayerId) {
      const onIdt = ceIsUnidadesOverlayOn();
      map.setLayoutProperty(idtLayerId, "visibility", onIdt ? "visible" : "none");
    }

    const qfCursosLayerId = ceGetQualificacaoCursosLayerId(map);
    if (qfCursosLayerId || map.getLayer(CE_QF_CURSOS_HEAT_LAYER_ID)) {
      ceSetQualificacaoCursosOverlaysVisibility(map);
    }

    ceSetSedesLayersVisibility(map, ceIsSedesOverlayOn());
    ceRenderFullLegend(mode);
  } catch (e) {
    console.warn("ceApplyVisualization:", e);
  }
}

function ceUpdateMapKpis(totals) {
  const set = (id, v) => {
    const n = document.getElementById(id);
    if (n) n.textContent = ceFormatIntPt(v);
  };
  const elForm = document.getElementById("mapKpiFormalizacao");
  if (elForm) elForm.textContent = ceFormatPercentPt(totals.formalizacaoPct);
  set("mapKpiEstoque", totals.estoque);
  set("mapKpiAdmissoes", totals.admissoes);
  set("mapKpiDesligamentos", totals.desligamentos);
  set("mapKpiSaldos", totals.saldos);
}

function ceSumIntermediacaoKpiFromRows(rows) {
  let total = 0;
  let totalPrev = 0;
  let pctWeighted = 0;
  let prevForPct = 0;
  for (const row of rows) {
    const real = Number(row.pessoas) || 0;
    const prev = Number(row.previsao) || 0;
    total += real;
    totalPrev += prev;
    if (Number.isFinite(row.pctMeta) && prev > 0) {
      pctWeighted += row.pctMeta * prev;
      prevForPct += prev;
    }
  }
  let pct = null;
  if (prevForPct > 0) {
    pct = pctWeighted / prevForPct;
  } else if (totalPrev > 0) {
    pct = (total / totalPrev) * 100;
  }
  return { total, pct };
}

function ceComputeProfileKpiMetricsFromAgg(aggByLayer, filteredByLayer, munSel, regSel) {
  const metrics = {};
  let totalGeral = 0;
  for (const layerKey of CE_PROFILE_LAYER_KEYS) {
    const layerCfg = CE_PROFILE_LAYER_CONFIG[layerKey];
    const entries = [...(aggByLayer[layerKey]?.values?.() || [])];

    if (layerKey === "ceara_cred") {
      const cearaRows = filteredByLayer?.[layerKey] || [];
      const sub = cearaRows.length
        ? ceSumCearaCredKpiFromRows(cearaRows)
        : (() => {
            const fallback = { cadastradas: 0, em_atendimento: 0, aprovadas: 0, valor_liberado: 0 };
            for (const entry of entries) {
              for (const k of Object.keys(fallback)) {
                fallback[k] += Number(entry?.metrics?.[k]) || 0;
              }
            }
            return fallback;
          })();
      metrics.ceara_cred = { sub, total: sub.cadastradas, pct: null };
      continue;
    }

    if (layerKey === "mun_simples") {
      const munRows = filteredByLayer?.[layerKey] || [];
      const sub = munRows.length
        ? ceSumMunSimplesKpiFromRows(munRows)
        : (() => {
            const fallback = { nao: 0, sim: 0, total: 0 };
            for (const entry of entries) {
              fallback.nao += Number(entry?.metrics?.nao) || 0;
              fallback.sim += Number(entry?.metrics?.sim) || 0;
              fallback.total += Number(entry?.metrics?.total) || Number(entry?.pessoas) || 0;
            }
            return fallback;
          })();
      metrics.mun_simples = { sub, total: sub.total, pct: null };
      continue;
    }

    if (layerKey === "empresa_grupamento") {
      const empresaRows = filteredByLayer?.[layerKey] || [];
      const sub = empresaRows.length
        ? ceSumEmpresaGrupamentoKpiFromRows(empresaRows)
        : (() => {
            const fallback = ceEmptyEmpresaGrupamentoMetrics();
            for (const entry of entries) {
              const m = entry?.metrics || {};
              for (const metric of CE_EMPRESA_GRUPAMENTO_METRICS) {
                fallback[metric.key] += Number(m[metric.key]) || 0;
              }
            }
            return fallback;
          })();
      metrics.empresa_grupamento = { sub, total: sub.total, pct: null };
      continue;
    }

    if (layerKey === "empresas_vinculos") {
      const vincRows = filteredByLayer?.[layerKey] || [];
      const sub = vincRows.length
        ? ceSumEmpresasVinculosKpiFromRows(vincRows)
        : (() => {
            const fallback = ceEmptyEmpresasVinculosMetrics();
            for (const entry of entries) {
              const m = entry?.metrics || {};
              for (const metric of CE_EMPRESAS_VINCULOS_METRICS) {
                fallback[metric.key] += Number(m[metric.key]) || 0;
              }
            }
            return fallback;
          })();
      metrics.empresas_vinculos = { sub, total: sub.total, pct: null };
      continue;
    }

    if (layerKey === "vinculo_escolaridade") {
      const escRows = filteredByLayer?.[layerKey] || [];
      const sub = escRows.length
        ? ceSumVinculoEscolaridadeKpiFromRows(escRows)
        : (() => {
            const fallback = ceEmptyVinculoEscolaridadeMetrics();
            for (const entry of entries) {
              const m = entry?.metrics || {};
              for (const metric of CE_VINCULO_ESCOLARIDADE_METRICS) {
                fallback[metric.key] += Number(m[metric.key]) || 0;
              }
            }
            return fallback;
          })();
      metrics.vinculo_escolaridade = { sub, total: sub.total, pct: null };
      continue;
    }

    if (layerKey === "vinculo_sexo") {
      const sexoRows = filteredByLayer?.[layerKey] || [];
      const sub = sexoRows.length
        ? ceSumVinculoSexoKpiFromRows(sexoRows)
        : (() => {
            const fallback = ceEmptyVinculoSexoMetrics();
            for (const entry of entries) {
              const m = entry?.metrics || {};
              for (const metric of CE_VINCULO_SEXO_METRICS) {
                fallback[metric.key] += Number(m[metric.key]) || 0;
              }
            }
            return fallback;
          })();
      metrics.vinculo_sexo = { sub, total: sub.total, pct: null };
      continue;
    }

    if (layerCfg?.parseMode === "intermediacao") {
      const intRows = filteredByLayer?.[layerKey] || [];
      const { total, pct } = ceSumIntermediacaoKpiFromRows(intRows);
      metrics[layerKey] = { total, pct };
      continue;
    }

    const values = entries.map((entry) => Number(entry?.pessoas) || 0).filter((n) => Number.isFinite(n));
    let total = 0;
    if (layerCfg?.kpiAgg === "avg") {
      total = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    } else {
      total = values.reduce((a, b) => a + b, 0);
    }
    if (!layerCfg?.excludeFromTotal) totalGeral += total;
    metrics[layerKey] = {
      total,
      pct: layerCfg?.hidePctKpi ? null : cePctSobrePopulacao(total, munSel, regSel),
    };
  }
  metrics.total_geral = {
    total: totalGeral,
    pct: cePctSobrePopulacao(totalGeral, munSel, regSel),
  };
  return metrics;
}

function ceUpdateProfileKpis(metricsByLayer) {
  for (const layerKey of CE_PROFILE_LAYER_KEYS) {
    if (CE_PROFILE_LAYER_CONFIG[layerKey]?.hideLayerKpi) continue;
    const valueEl = document.getElementById(CE_PROFILE_KPI_IDS[layerKey]);
    const pctEl = document.getElementById(CE_PROFILE_KPI_PCT_IDS[layerKey]);
    const metric = metricsByLayer?.[layerKey] || { total: 0, pct: null };
    if (valueEl) {
      valueEl.textContent = ceFormatProfileMetricValue(metric.total ?? 0, layerKey);
    }
    if (pctEl) {
      const layerCfgPct = CE_PROFILE_LAYER_CONFIG[layerKey];
      if (layerCfgPct?.parseMode === "intermediacao") {
        const pctTxt =
          metric.pct != null && Number.isFinite(metric.pct)
            ? ceFormatPercentPt(metric.pct)
            : "—";
        pctEl.textContent =
          metric.pct != null && Number.isFinite(metric.pct) ? `· ${pctTxt}` : "—";
      } else if (layerCfgPct?.hidePctKpi) {
        pctEl.textContent = "média no recorte";
      } else {
        pctEl.textContent = ceFormatPercentPt(metric.pct);
      }
    }
  }

  const cearaSub = metricsByLayer?.ceara_cred?.sub;
  for (const item of CE_CEARA_CRED_KPI_METRICS) {
    const valueEl = document.getElementById(item.id);
    const v = Number(cearaSub?.[item.key] ?? 0);
    if (valueEl) {
      valueEl.textContent =
        item.format === "currency" ? ceFormatCurrencyPt(v) : ceFormatIntPt(v);
    }
  }

  const munSimplesSub = metricsByLayer?.mun_simples?.sub;
  for (const item of CE_MUN_SIMPLES_KPI_METRICS) {
    const valueEl = document.getElementById(item.id);
    const v = Number(munSimplesSub?.[item.key] ?? 0);
    if (valueEl) {
      valueEl.textContent = ceFormatIntPt(v);
    }
  }

  const empresaSub = metricsByLayer?.empresa_grupamento?.sub;
  for (const item of CE_EMPRESA_GRUPAMENTO_KPI_METRICS) {
    const valueEl = document.getElementById(item.id);
    const v = Number(empresaSub?.[item.key] ?? 0);
    if (valueEl) {
      valueEl.textContent = ceFormatIntPt(v);
      if (item.title) valueEl.setAttribute("title", item.title);
    }
    const card = valueEl?.closest(".map-ce-kpi-card");
    const labelEl = card?.querySelector(".map-ce-kpi-card__label");
    if (labelEl) {
      if (item.label) labelEl.textContent = item.label;
      if (item.title) labelEl.setAttribute("title", item.title);
    }
  }

  const vinculosSub = metricsByLayer?.empresas_vinculos?.sub;
  for (const item of CE_EMPRESAS_VINCULOS_KPI_METRICS) {
    const valueEl = document.getElementById(item.id);
    const v = Number(vinculosSub?.[item.key] ?? 0);
    if (valueEl) {
      valueEl.textContent = ceFormatIntPt(v);
      if (item.title) valueEl.setAttribute("title", item.title);
    }
    const card = valueEl?.closest(".map-ce-kpi-card");
    const labelEl = card?.querySelector(".map-ce-kpi-card__label");
    if (labelEl) {
      if (item.label) labelEl.textContent = item.label;
      if (item.title) labelEl.setAttribute("title", item.title);
    }
  }

  const escolaridadeSub = metricsByLayer?.vinculo_escolaridade?.sub;
  for (const item of CE_VINCULO_ESCOLARIDADE_KPI_METRICS) {
    const valueEl = document.getElementById(item.id);
    const v = Number(escolaridadeSub?.[item.key] ?? 0);
    if (valueEl) {
      valueEl.textContent = ceFormatIntPt(v);
      if (item.title) valueEl.setAttribute("title", item.title);
    }
    const card = valueEl?.closest(".map-ce-kpi-card");
    const labelEl = card?.querySelector(".map-ce-kpi-card__label");
    if (labelEl) {
      if (item.label) labelEl.textContent = item.label;
      if (item.title) labelEl.setAttribute("title", item.title);
    }
  }

  const sexoSub = metricsByLayer?.vinculo_sexo?.sub;
  for (const item of CE_VINCULO_SEXO_KPI_METRICS) {
    const valueEl = document.getElementById(item.id);
    const v = Number(sexoSub?.[item.key] ?? 0);
    if (valueEl) {
      valueEl.textContent = ceFormatIntPt(v);
      if (item.title) valueEl.setAttribute("title", item.title);
    }
    const card = valueEl?.closest(".map-ce-kpi-card");
    const labelEl = card?.querySelector(".map-ce-kpi-card__label");
    if (labelEl) {
      if (item.label) labelEl.textContent = item.label;
      if (item.title) labelEl.setAttribute("title", item.title);
    }
  }

  const totalMetric = metricsByLayer?.total_geral || { total: 0, pct: null };
  const totalValueEl = document.getElementById(CE_PROFILE_TOTAL_KPI_ID);
  const totalPctEl = document.getElementById(CE_PROFILE_TOTAL_KPI_PCT_ID);
  if (totalValueEl) totalValueEl.textContent = ceFormatIntPt(Number(totalMetric.total ?? 0));
  if (totalPctEl) totalPctEl.textContent = ceFormatPercentPt(totalMetric.pct);
}

function ceDestroyProfileSummaryCharts() {
  const charts = ceMapRuntime.profileSummaryCharts;
  for (const key of Object.keys(charts)) {
    const chart = charts[key];
    if (!chart) continue;
    try {
      chart.destroy();
    } catch (_) {}
    charts[key] = null;
  }
}

function ceDestroyCearaCredSummaryCharts() {
  for (const key of ["cearaMunicipio", "cearaRegiao"]) {
    const chart = ceMapRuntime.profileSummaryCharts[key];
    if (!chart) continue;
    try {
      chart.destroy();
    } catch (_) {}
    ceMapRuntime.profileSummaryCharts[key] = null;
  }
}

function ceDestroyMunSimplesSummaryCharts() {
  for (const key of ["munSimplesMunicipio", "munSimplesRegiao"]) {
    const chart = ceMapRuntime.profileSummaryCharts[key];
    if (!chart) continue;
    try {
      chart.destroy();
    } catch (_) {}
    ceMapRuntime.profileSummaryCharts[key] = null;
  }
}

function ceDestroyEmpresaGrupamentoSummaryCharts() {
  for (const key of ["empresaGrupamentoMunicipio", "empresaGrupamentoRegiao", "empresaGrupamentoRegiaoBarras"]) {
    const chart = ceMapRuntime.profileSummaryCharts[key];
    if (!chart) continue;
    try {
      chart.destroy();
    } catch (_) {}
    ceMapRuntime.profileSummaryCharts[key] = null;
  }
}

function ceSortProfileRowsBySelectedLayer(rows, selectedLayerKey, sortOrder = "desc") {
  const layerKey = CE_PROFILE_LAYER_CONFIG[selectedLayerKey] ? selectedLayerKey : CE_PROFILE_LAYER_KEYS[0];
  return [...rows].sort((a, b) => {
    const av = Number(a.values?.[layerKey] || 0);
    const bv = Number(b.values?.[layerKey] || 0);
    return (sortOrder === "asc" ? av - bv : bv - av) || a.label.localeCompare(b.label, "pt-BR");
  });
}

function ceGetProfileBarLayerKeysForCharts() {
  if (ceIsIntermediacaoMode()) return CE_INTERMEDIACAO_LAYER_KEYS;
  return CE_PROFILE_BAR_LAYER_KEYS;
}

function ceBuildProfileMunicipioRows(aggByLayer, selectedLayerKey, sortOrder) {
  const nomeMap = ceCodigoToNomeMap();
  const rowsByCod = new Map();
  const layerKeys = ceGetProfileBarLayerKeysForCharts();

  for (const layerKey of layerKeys) {
    const agg = aggByLayer[layerKey];
    for (const [cod, entry] of agg?.entries?.() || []) {
      const current = rowsByCod.get(cod) || {
        codigo: cod,
        label: nomeMap.get(cod) || `Código ${cod}`,
        values: {},
        total: 0,
      };
      const pessoas = Number(entry?.pessoas) || 0;
      current.values[layerKey] = pessoas;
      current.total += pessoas;
      rowsByCod.set(cod, current);
    }
  }

  const selectedAgg = aggByLayer[selectedLayerKey];
  return ceSortProfileRowsBySelectedLayer(
    Array.from(rowsByCod.values())
      .filter((row) => row.total > 0)
      .filter((row) => {
        const metricVal = Number(selectedAgg?.get(row.codigo)?.pessoas) || 0;
        return ceValueMatchesActiveLegendClass(metricVal);
      }),
    selectedLayerKey,
    sortOrder
  );
}

function ceBuildProfileRegiaoRows(aggByLayer, selectedLayerKey, sortOrder) {
  const rows = [];
  const layerKeys = ceGetProfileBarLayerKeysForCharts();
  for (const [regiao, codSet] of ceMapRuntime.regiaoToCodigos.entries()) {
    const values = {};
    let total = 0;
    for (const layerKey of layerKeys) {
      let sum = 0;
      const agg = aggByLayer[layerKey];
      for (const cod of codSet) {
        const pessoas = Number(agg?.get?.(cod)?.pessoas) || 0;
        sum += pessoas;
      }
      values[layerKey] = sum;
      total += sum;
    }
    if (total > 0) rows.push({ label: regiao, values, total });
  }
  return ceSortProfileRowsBySelectedLayer(rows, selectedLayerKey, sortOrder);
}

function ceBuildCearaCredMunicipioRows(aggByLayer, sortOrder) {
  const nomeMap = ceCodigoToNomeMap();
  const agg = aggByLayer.ceara_cred;
  const sortKey = CE_PROFILE_LAYER_CONFIG.ceara_cred?.mapMetricKey || "aprovadas";
  const rows = [];
  for (const [cod, entry] of agg?.entries?.() || []) {
    const m = entry?.metrics || {};
    const values = {
      cadastradas: Number(m.cadastradas) || 0,
      em_atendimento: Number(m.em_atendimento) || 0,
      aprovadas: Number(m.aprovadas) || 0,
      valor_liberado: Number(m.valor_liberado) || 0,
    };
    rows.push({
      label: nomeMap.get(cod) || `Código ${cod}`,
      values,
      total: Number(values[sortKey]) || 0,
    });
  }
  rows.sort((a, b) => (sortOrder === "asc" ? a.total - b.total : b.total - a.total) || a.label.localeCompare(b.label, "pt-BR"));
  return rows
    .filter((r) => r.total > 0 || Object.values(r.values).some((v) => v > 0))
    .filter((r) => ceValueMatchesActiveLegendClass(r.total));
}

function ceBuildCearaCredRegiaoRows(aggByLayer, sortOrder) {
  const agg = aggByLayer.ceara_cred;
  const sortKey = CE_PROFILE_LAYER_CONFIG.ceara_cred?.mapMetricKey || "aprovadas";
  const rows = [];
  for (const [regiao, codSet] of ceMapRuntime.regiaoToCodigos.entries()) {
    const values = { cadastradas: 0, em_atendimento: 0, aprovadas: 0, valor_liberado: 0 };
    for (const cod of codSet) {
      const m = agg?.get?.(cod)?.metrics || {};
      values.cadastradas += Number(m.cadastradas) || 0;
      values.em_atendimento += Number(m.em_atendimento) || 0;
      values.aprovadas += Number(m.aprovadas) || 0;
      values.valor_liberado += Number(m.valor_liberado) || 0;
    }
    const total = Number(values[sortKey]) || 0;
    if (total > 0 || Object.values(values).some((v) => v > 0)) {
      rows.push({ label: regiao, values, total });
    }
  }
  rows.sort((a, b) => (sortOrder === "asc" ? a.total - b.total : b.total - a.total) || a.label.localeCompare(b.label, "pt-BR"));
  return rows;
}

function ceBuildMunSimplesMunicipioRows(aggByLayer, sortOrder) {
  const nomeMap = ceCodigoToNomeMap();
  const agg = aggByLayer.mun_simples;
  const rows = [];
  for (const [cod, entry] of agg?.entries?.() || []) {
    const m = entry?.metrics || {};
    const values = {
      nao: Number(m.nao) || 0,
      sim: Number(m.sim) || 0,
      total: Number(m.total) || Number(entry?.pessoas) || 0,
    };
    rows.push({
      label: nomeMap.get(cod) || `Código ${cod}`,
      values,
      total: values.total,
    });
  }
  rows.sort((a, b) => (sortOrder === "asc" ? a.total - b.total : b.total - a.total) || a.label.localeCompare(b.label, "pt-BR"));
  return rows
    .filter((r) => r.total > 0 || Object.values(r.values).some((v) => v > 0))
    .filter((r) => ceValueMatchesActiveLegendClass(r.total));
}

function ceBuildMunSimplesRegiaoRows(aggByLayer, sortOrder) {
  const agg = aggByLayer.mun_simples;
  const rows = [];
  for (const [regiao, codSet] of ceMapRuntime.regiaoToCodigos.entries()) {
    const values = { nao: 0, sim: 0, total: 0 };
    for (const cod of codSet) {
      const m = agg?.get?.(cod)?.metrics || {};
      values.nao += Number(m.nao) || 0;
      values.sim += Number(m.sim) || 0;
      values.total += Number(m.total) || Number(agg?.get?.(cod)?.pessoas) || 0;
    }
    if (values.total > 0 || values.nao > 0 || values.sim > 0) {
      rows.push({ label: regiao, values, total: values.total });
    }
  }
  rows.sort((a, b) => (sortOrder === "asc" ? a.total - b.total : b.total - a.total) || a.label.localeCompare(b.label, "pt-BR"));
  return rows;
}

function ceBuildEmpresasVinculosMunicipioRows(aggByLayer, sortOrder) {
  const nomeMap = ceCodigoToNomeMap();
  const agg = aggByLayer.empresas_vinculos;
  const rows = [];
  for (const [cod, entry] of agg?.entries?.() || []) {
    const values = ceMetricsToEmpresasVinculosValues(entry?.metrics, entry);
    rows.push({
      label: nomeMap.get(cod) || `Código ${cod}`,
      values,
      total: values.total,
    });
  }
  rows.sort((a, b) => (sortOrder === "asc" ? a.total - b.total : b.total - a.total) || a.label.localeCompare(b.label, "pt-BR"));
  return rows
    .filter((r) => r.total > 0 || CE_EMPRESAS_VINCULOS_FAIXA_METRICS.some((m) => (r.values?.[m.key] ?? 0) > 0))
    .filter((r) => ceValueMatchesActiveLegendClass(r.total));
}

function ceBuildEmpresasVinculosFaixaPieSlices(aggByLayer, sortOrder = "desc") {
  const agg = aggByLayer.empresas_vinculos;
  const faixaTotals = ceEmptyEmpresasVinculosMetrics();
  for (const metric of CE_EMPRESAS_VINCULOS_FAIXA_METRICS) {
    faixaTotals[metric.key] = 0;
  }

  for (const [, entry] of agg?.entries?.() || []) {
    const values = ceMetricsToEmpresasVinculosValues(entry?.metrics, entry);
    if (!ceValueMatchesActiveLegendClass(values.total)) continue;
    for (const metric of CE_EMPRESAS_VINCULOS_FAIXA_METRICS) {
      faixaTotals[metric.key] += Number(values[metric.key]) || 0;
    }
  }

  const slices = CE_EMPRESAS_VINCULOS_FAIXA_METRICS.map((m) => ({
    label: m.kpiLabel || m.label,
    title: m.label,
    value: Number(faixaTotals[m.key]) || 0,
  })).filter((s) => s.value > 0);

  slices.sort((a, b) => {
    const diff = sortOrder === "asc" ? a.value - b.value : b.value - a.value;
    return diff || a.label.localeCompare(b.label, "pt-BR");
  });
  return slices;
}

function ceBuildEmpresasVinculosRegiaoRows(aggByLayer, sortOrder) {
  const agg = aggByLayer.empresas_vinculos;
  const rows = [];
  for (const [regiao, codSet] of ceMapRuntime.regiaoToCodigos.entries()) {
    const values = ceEmptyEmpresasVinculosMetrics();
    for (const cod of codSet) {
      const entry = agg?.get?.(cod);
      const partial = ceMetricsToEmpresasVinculosValues(entry?.metrics, entry);
      if (!ceValueMatchesActiveLegendClass(partial.total)) continue;
      for (const metric of CE_EMPRESAS_VINCULOS_METRICS) {
        values[metric.key] += partial[metric.key] || 0;
      }
    }
    values.total = CE_EMPRESAS_VINCULOS_FAIXA_METRICS.reduce(
      (sum, m) => sum + (Number(values[m.key]) || 0),
      0
    );
    if (values.total > 0 || CE_EMPRESAS_VINCULOS_FAIXA_METRICS.some((m) => values[m.key] > 0)) {
      rows.push({ label: regiao, values, total: values.total });
    }
  }
  rows.sort((a, b) => (sortOrder === "asc" ? a.total - b.total : b.total - a.total) || a.label.localeCompare(b.label, "pt-BR"));
  return rows;
}

function ceDestroyEmpresasVinculosSummaryCharts() {
  for (const key of ["empresasVinculosMunicipio", "empresasVinculosRegiao", "empresasVinculosRegiaoBarras"]) {
    const chart = ceMapRuntime.profileSummaryCharts[key];
    if (!chart) continue;
    try {
      chart.destroy();
    } catch (_) {}
    ceMapRuntime.profileSummaryCharts[key] = null;
  }
}

function ceBuildVinculoEscolaridadeMunicipioRows(aggByLayer, sortOrder) {
  const nomeMap = ceCodigoToNomeMap();
  const agg = aggByLayer.vinculo_escolaridade;
  const rows = [];
  for (const [cod, entry] of agg?.entries?.() || []) {
    const values = ceMetricsToVinculoEscolaridadeValues(entry?.metrics, entry);
    rows.push({
      label: nomeMap.get(cod) || `Código ${cod}`,
      values,
      total: values.total,
    });
  }
  rows.sort((a, b) => (sortOrder === "asc" ? a.total - b.total : b.total - a.total) || a.label.localeCompare(b.label, "pt-BR"));
  return rows
    .filter((r) => r.total > 0 || CE_VINCULO_ESCOLARIDADE_NIVEL_METRICS.some((m) => (r.values?.[m.key] ?? 0) > 0))
    .filter((r) => ceValueMatchesActiveLegendClass(r.total));
}

function ceBuildVinculoEscolaridadeNivelPieSlices(aggByLayer, sortOrder = "desc") {
  const agg = aggByLayer.vinculo_escolaridade;
  const nivelTotals = ceEmptyVinculoEscolaridadeMetrics();
  for (const metric of CE_VINCULO_ESCOLARIDADE_NIVEL_METRICS) {
    nivelTotals[metric.key] = 0;
  }

  for (const [, entry] of agg?.entries?.() || []) {
    const values = ceMetricsToVinculoEscolaridadeValues(entry?.metrics, entry);
    if (!ceValueMatchesActiveLegendClass(values.total)) continue;
    for (const metric of CE_VINCULO_ESCOLARIDADE_NIVEL_METRICS) {
      nivelTotals[metric.key] += Number(values[metric.key]) || 0;
    }
  }

  const slices = CE_VINCULO_ESCOLARIDADE_NIVEL_METRICS.map((m) => ({
    label: m.kpiLabel || m.label,
    title: m.label,
    value: Number(nivelTotals[m.key]) || 0,
  })).filter((s) => s.value > 0);

  slices.sort((a, b) => {
    const diff = sortOrder === "asc" ? a.value - b.value : b.value - a.value;
    return diff || a.label.localeCompare(b.label, "pt-BR");
  });
  return slices;
}

function ceBuildVinculoEscolaridadeRegiaoRows(aggByLayer, sortOrder) {
  const agg = aggByLayer.vinculo_escolaridade;
  const rows = [];
  for (const [regiao, codSet] of ceMapRuntime.regiaoToCodigos.entries()) {
    const values = ceEmptyVinculoEscolaridadeMetrics();
    for (const cod of codSet) {
      const entry = agg?.get?.(cod);
      const partial = ceMetricsToVinculoEscolaridadeValues(entry?.metrics, entry);
      if (!ceValueMatchesActiveLegendClass(partial.total)) continue;
      for (const metric of CE_VINCULO_ESCOLARIDADE_METRICS) {
        values[metric.key] += partial[metric.key] || 0;
      }
    }
    values.total = CE_VINCULO_ESCOLARIDADE_NIVEL_METRICS.reduce(
      (sum, m) => sum + (Number(values[m.key]) || 0),
      0
    );
    if (values.total > 0 || CE_VINCULO_ESCOLARIDADE_NIVEL_METRICS.some((m) => values[m.key] > 0)) {
      rows.push({ label: regiao, values, total: values.total });
    }
  }
  rows.sort((a, b) => (sortOrder === "asc" ? a.total - b.total : b.total - a.total) || a.label.localeCompare(b.label, "pt-BR"));
  return rows;
}

function ceDestroyVinculoEscolaridadeSummaryCharts() {
  for (const key of ["vinculoEscolaridadeMunicipio", "vinculoEscolaridadeRegiao", "vinculoEscolaridadeRegiaoBarras"]) {
    const chart = ceMapRuntime.profileSummaryCharts[key];
    if (!chart) continue;
    try {
      chart.destroy();
    } catch (_) {}
    ceMapRuntime.profileSummaryCharts[key] = null;
  }
}

function ceBuildVinculoSexoMunicipioRows(aggByLayer, sortOrder) {
  const nomeMap = ceCodigoToNomeMap();
  const agg = aggByLayer.vinculo_sexo;
  const rows = [];
  for (const [cod, entry] of agg?.entries?.() || []) {
    const values = ceMetricsToVinculoSexoValues(entry?.metrics, entry);
    rows.push({
      label: nomeMap.get(cod) || `Código ${cod}`,
      values,
      total: values.total,
    });
  }
  rows.sort((a, b) => (sortOrder === "asc" ? a.total - b.total : b.total - a.total) || a.label.localeCompare(b.label, "pt-BR"));
  return rows
    .filter((r) => r.total > 0 || CE_VINCULO_SEXO_GROUP_METRICS.some((m) => (r.values?.[m.key] ?? 0) > 0))
    .filter((r) => ceValueMatchesActiveLegendClass(r.total));
}

function ceBuildVinculoSexoPieSlices(aggByLayer, sortOrder = "desc") {
  const agg = aggByLayer.vinculo_sexo;
  const totals = ceEmptyVinculoSexoMetrics();
  for (const metric of CE_VINCULO_SEXO_GROUP_METRICS) {
    totals[metric.key] = 0;
  }

  for (const [, entry] of agg?.entries?.() || []) {
    const values = ceMetricsToVinculoSexoValues(entry?.metrics, entry);
    if (!ceValueMatchesActiveLegendClass(values.total)) continue;
    for (const metric of CE_VINCULO_SEXO_GROUP_METRICS) {
      totals[metric.key] += Number(values[metric.key]) || 0;
    }
  }

  const slices = CE_VINCULO_SEXO_GROUP_METRICS.map((m) => ({
    label: m.kpiLabel || m.label,
    title: m.label,
    value: Number(totals[m.key]) || 0,
  })).filter((s) => s.value > 0);

  slices.sort((a, b) => {
    const diff = sortOrder === "asc" ? a.value - b.value : b.value - a.value;
    return diff || a.label.localeCompare(b.label, "pt-BR");
  });
  return slices;
}

function ceDestroyVinculoSexoSummaryCharts() {
  for (const key of ["vinculoSexoMunicipio", "vinculoSexoRegiao"]) {
    const chart = ceMapRuntime.profileSummaryCharts[key];
    if (!chart) continue;
    try {
      chart.destroy();
    } catch (_) {}
    ceMapRuntime.profileSummaryCharts[key] = null;
  }
}

function ceBuildEmpresaGrupamentoMunicipioRows(aggByLayer, sortOrder) {
  const nomeMap = ceCodigoToNomeMap();
  const agg = aggByLayer.empresa_grupamento;
  const rows = [];
  for (const [cod, entry] of agg?.entries?.() || []) {
    const values = ceMetricsToEmpresaGrupamentoValues(entry?.metrics, entry);
    rows.push({
      label: nomeMap.get(cod) || `Código ${cod}`,
      values,
      total: values.total,
    });
  }
  rows.sort((a, b) => (sortOrder === "asc" ? a.total - b.total : b.total - a.total) || a.label.localeCompare(b.label, "pt-BR"));
  return rows
    .filter((r) => r.total > 0 || CE_EMPRESA_GRUPAMENTO_SECTOR_METRICS.some((m) => (r.values?.[m.key] ?? 0) > 0))
    .filter((r) => ceValueMatchesActiveLegendClass(r.total));
}

/** Fatias do gráfico de pizza: participação de cada setor econômico no total do recorte. */
function ceBuildEmpresaGrupamentoSetorPieSlices(aggByLayer, sortOrder = "desc") {
  const agg = aggByLayer.empresa_grupamento;
  const sectorTotals = ceEmptyEmpresaGrupamentoMetrics();
  for (const metric of CE_EMPRESA_GRUPAMENTO_SECTOR_METRICS) {
    sectorTotals[metric.key] = 0;
  }

  for (const [, entry] of agg?.entries?.() || []) {
    const values = ceMetricsToEmpresaGrupamentoValues(entry?.metrics, entry);
    if (!ceValueMatchesActiveLegendClass(values.total)) continue;
    for (const metric of CE_EMPRESA_GRUPAMENTO_SECTOR_METRICS) {
      sectorTotals[metric.key] += Number(values[metric.key]) || 0;
    }
  }

  const slices = CE_EMPRESA_GRUPAMENTO_SECTOR_METRICS.map((m) => ({
    label: m.kpiLabel || m.label,
    title: m.label,
    value: Number(sectorTotals[m.key]) || 0,
  })).filter((s) => s.value > 0);

  slices.sort((a, b) => {
    const diff = sortOrder === "asc" ? a.value - b.value : b.value - a.value;
    return diff || a.label.localeCompare(b.label, "pt-BR");
  });
  return slices;
}

function ceBuildEmpresaGrupamentoRegiaoRows(aggByLayer, sortOrder) {
  const agg = aggByLayer.empresa_grupamento;
  const rows = [];
  for (const [regiao, codSet] of ceMapRuntime.regiaoToCodigos.entries()) {
    const values = ceEmptyEmpresaGrupamentoMetrics();
    for (const cod of codSet) {
      const entry = agg?.get?.(cod);
      const partial = ceMetricsToEmpresaGrupamentoValues(entry?.metrics, entry);
      if (!ceValueMatchesActiveLegendClass(partial.total)) continue;
      for (const metric of CE_EMPRESA_GRUPAMENTO_SECTOR_METRICS) {
        values[metric.key] += partial[metric.key] || 0;
      }
    }
    values.total = CE_EMPRESA_GRUPAMENTO_SECTOR_METRICS.reduce(
      (sum, m) => sum + (Number(values[m.key]) || 0),
      0
    );
    if (values.total > 0 || CE_EMPRESA_GRUPAMENTO_SECTOR_METRICS.some((m) => values[m.key] > 0)) {
      rows.push({ label: regiao, values, total: values.total });
    }
  }
  rows.sort((a, b) => (sortOrder === "asc" ? a.total - b.total : b.total - a.total) || a.label.localeCompare(b.label, "pt-BR"));
  return rows;
}

function ceCreateProfilePieChart(el, slices, options = {}) {
  const pieSource = (slices || []).filter((s) => Number(s.value) > 0);
  const pieSeries = pieSource.length ? pieSource.map((s) => s.value) : [1];
  const pieLabels = pieSource.length ? pieSource.map((s) => s.label) : ["Sem dados no filtro"];
  const pieGrandTotal = pieSeries.reduce((a, b) => a + b, 0);
  const palette = options.colors || CE_REGIAO_PALETTE;
  const pieColors = pieSource.length
    ? pieSource.map((_, i) => palette[i % palette.length])
    : ["#cbd5e1"];
  const height = options.height || 380;
  const showPercentLabels = options.showPercentLabels !== false;

  return new ApexCharts(el, {
    chart: {
      type: "pie",
      height,
      toolbar: { show: false },
      fontFamily: "system-ui, Segoe UI, sans-serif",
      foreColor: "#1f2d78",
      animations: { speed: 280 },
    },
    series: pieSeries,
    labels: pieLabels,
    colors: pieColors,
    legend: {
      position: "bottom",
      fontSize: "11px",
      itemMargin: { horizontal: 10, vertical: 4 },
    },
    dataLabels: {
      enabled: Boolean(pieSource.length && pieSource.length <= 14),
      formatter: (_val, opts) => {
        const raw = Number(opts.w.globals.series[opts.seriesIndex]) || 0;
        if (!showPercentLabels) return ceFormatIntPt(raw);
        const pct = pieGrandTotal > 0 ? (raw / pieGrandTotal) * 100 : 0;
        return ceFormatPercentPt(pct);
      },
      style: { fontSize: "11px", fontWeight: 600 },
    },
    tooltip: {
      custom: ({ series, seriesIndex, w }) => {
        const n = Number(series[seriesIndex]) || 0;
        const pct = pieGrandTotal > 0 ? (n / pieGrandTotal) * 100 : 0;
        const title = pieSource[seriesIndex]?.title || w.globals.labels[seriesIndex] || "";
        return `<div class="apexcharts-tooltip-title">${ceEscapeHtml(title)}</div>
          <div class="apexcharts-tooltip-series-group apexcharts-active">
            <span class="apexcharts-tooltip-text">${ceFormatIntPt(n)} empresas · ${ceFormatPercentPt(pct)}</span>
          </div>`;
      },
    },
    plotOptions: {
      pie: {
        expandOnClick: false,
      },
    },
    stroke: { width: 1, colors: ["#fff"] },
    noData: {
      text: pieSource.length ? "" : "Sem dados no filtro",
    },
  });
}

function ceBuildProfileBarSeries(rows, seriesDefs) {
  const hasRows = rows.length > 0;
  const categories = hasRows ? rows.map((row) => row.label) : ["Sem dados no filtro"];
  const series = seriesDefs.map((def) => ({
    name: def.name,
    data: hasRows ? rows.map((row) => Number(row.values?.[def.key] ?? 0)) : [0],
    _format: def.format || "int",
  }));
  return { categories, series, hasRows };
}

function ceBuildProfileStackedSeries(rows, layerKeys) {
  const defs = layerKeys.map((layerKey) => ({
    key: layerKey,
    name: CE_PROFILE_LAYER_CONFIG[layerKey].label,
    format: "int",
  }));
  return ceBuildProfileBarSeries(rows, defs);
}

function ceCreateProfileGroupedBarChart(el, rows, options = {}) {
  const layerKeys = options.layerKeys || CE_PROFILE_BAR_LAYER_KEYS;
  const seriesDefs =
    options.seriesDefs ||
    layerKeys.map((layerKey) => ({
      key: layerKey,
      name: CE_PROFILE_LAYER_CONFIG[layerKey]?.label || layerKey,
      format: CE_PROFILE_LAYER_CONFIG[layerKey]?.valueFormat === "currency" ? "currency" : "int",
    }));
  const colors = options.colors || layerKeys.map((lk) => CE_PROFILE_LAYER_CONFIG[lk]?.colors?.[3] || "#2563eb");
  const { categories, series, hasRows } = ceBuildProfileBarSeries(rows, seriesDefs);
  const height = Math.max(320, 64 + Math.max(categories.length, 1) * 38);
  return new ApexCharts(el, {
    chart: {
      type: "bar",
      height,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { speed: 260 },
      fontFamily: "system-ui, Segoe UI, sans-serif",
      foreColor: "#1f2d78",
    },
    colors,
    series,
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "74%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    xaxis: {
      categories,
      labels: {
        formatter: (val) =>
          options.xaxisFormat === "currency"
            ? ceFormatCurrencyPt(Number(val))
            : ceFormatIntPt(Number(val)),
        style: { fontSize: "11px", colors: "#475569" },
      },
    },
    yaxis: {
      labels: {
        style: { fontSize: "11px", colors: "#1f2d78" },
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontSize: "11px",
      itemMargin: { horizontal: 10, vertical: 4 },
    },
    grid: {
      borderColor: "#e2e8f0",
      padding: { left: 8, right: 14, top: 8, bottom: 8 },
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val, opts) => {
          const fmt = series[opts?.seriesIndex]?._format || "int";
          const n = Number(val);
          return fmt === "currency" ? ceFormatCurrencyPt(n) : ceFormatIntPt(n);
        },
      },
    },
    states: {
      active: { allowMultipleDataPointsSelection: false },
    },
    noData: {
      text: hasRows ? "" : "Sem dados no filtro",
    },
  });
}

function ceUpdateStandardProfileSummaryCharts(aggByLayer, selectedLayerKey, sortOrder) {
  const munEl = document.getElementById(CE_PROFILE_CHART_DOM_IDS.municipio);
  const regEl = document.getElementById(CE_PROFILE_CHART_DOM_IDS.regiao);
  if (!munEl || !regEl) return;

  const layerKeys = ceGetProfileBarLayerKeysForCharts();
  const munRows = ceBuildProfileMunicipioRows(aggByLayer, selectedLayerKey, sortOrder);
  const regRows = ceBuildProfileRegiaoRows(aggByLayer, selectedLayerKey, sortOrder);

  const munChart = ceCreateProfileGroupedBarChart(munEl, munRows, {
    layerKeys,
    colors: layerKeys.map((lk) => CE_PROFILE_LAYER_CONFIG[lk]?.colors?.[3] || "#2563eb"),
  });
  const regChart = ceCreateProfileGroupedBarChart(regEl, regRows, {
    layerKeys,
    colors: layerKeys.map((lk) => CE_PROFILE_LAYER_CONFIG[lk]?.colors?.[3] || "#2563eb"),
  });

  munChart.render();
  regChart.render();

  ceMapRuntime.profileSummaryCharts.municipio = munChart;
  ceMapRuntime.profileSummaryCharts.regiao = regChart;

  const munTitle = document.getElementById("mapProfileChartMunicipioTitle");
  const regTitle = document.getElementById("mapProfileChartRegiaoTitle");
  const legendSuffix = ceMapRuntime.activeLegendClass !== null ? " · classe selecionada na legenda" : "";
  if (munTitle) munTitle.textContent = `Por município${legendSuffix}`;
  if (regTitle) regTitle.textContent = "Por região";
}

function ceUpdateCearaCredSummaryCharts(aggByLayer, sortOrder) {
  const munEl = document.getElementById(CE_PROFILE_CHART_DOM_IDS.cearaMunicipio);
  const regEl = document.getElementById(CE_PROFILE_CHART_DOM_IDS.cearaRegiao);
  if (!munEl || !regEl) return;

  const seriesDefs = CE_CEARA_CRED_KPI_METRICS.map((m, i) => ({
    key: m.key,
    name: m.label,
    format: m.format,
  }));
  const munRows = ceBuildCearaCredMunicipioRows(aggByLayer, sortOrder);
  const regRows = ceBuildCearaCredRegiaoRows(aggByLayer, sortOrder);

  const munChart = ceCreateProfileGroupedBarChart(munEl, munRows, {
    seriesDefs,
    colors: CE_CEARA_CRED_CHART_COLORS,
  });
  const regChart = ceCreateProfileGroupedBarChart(regEl, regRows, {
    seriesDefs,
    colors: CE_CEARA_CRED_CHART_COLORS,
  });

  munChart.render();
  regChart.render();

  ceMapRuntime.profileSummaryCharts.cearaMunicipio = munChart;
  ceMapRuntime.profileSummaryCharts.cearaRegiao = regChart;

  const munPanelTitle = munEl.closest(".map-ce-profile-charts__panel")?.querySelector(".map-ce-profile-charts__panel-title");
  if (munPanelTitle) {
    munPanelTitle.textContent =
      ceMapRuntime.activeLegendClass !== null
        ? "Indicadores por município · classe selecionada na legenda"
        : "Indicadores por município";
  }
}

function ceUpdateMunSimplesSummaryCharts(aggByLayer, sortOrder) {
  const munEl = document.getElementById(CE_PROFILE_CHART_DOM_IDS.munSimplesMunicipio);
  const regEl = document.getElementById(CE_PROFILE_CHART_DOM_IDS.munSimplesRegiao);
  if (!munEl || !regEl) return;

  const seriesDefs = CE_MUN_SIMPLES_CHART_METRICS.map((m) => ({
    key: m.key,
    name: m.label,
    format: m.format,
  }));
  const munRows = ceBuildMunSimplesMunicipioRows(aggByLayer, sortOrder);
  const regRows = ceBuildMunSimplesRegiaoRows(aggByLayer, sortOrder);

  const munChart = ceCreateProfileGroupedBarChart(munEl, munRows, {
    seriesDefs,
    colors: CE_MUN_SIMPLES_CHART_COLORS,
  });
  const regChart = ceCreateProfileGroupedBarChart(regEl, regRows, {
    seriesDefs,
    colors: CE_MUN_SIMPLES_CHART_COLORS,
  });

  munChart.render();
  regChart.render();

  ceMapRuntime.profileSummaryCharts.munSimplesMunicipio = munChart;
  ceMapRuntime.profileSummaryCharts.munSimplesRegiao = regChart;

  const munPanelTitle = munEl.closest(".map-ce-profile-charts__panel")?.querySelector(".map-ce-profile-charts__panel-title");
  if (munPanelTitle) {
    munPanelTitle.textContent =
      ceMapRuntime.activeLegendClass !== null
        ? "Por município · classe selecionada na legenda"
        : "Por município";
  }
}

function ceUpdateEmpresaGrupamentoSummaryCharts(aggByLayer, sortOrder) {
  const munEl = document.getElementById(CE_PROFILE_CHART_DOM_IDS.empresaGrupamentoMunicipio);
  const regEl = document.getElementById(CE_PROFILE_CHART_DOM_IDS.empresaGrupamentoRegiao);
  const regBarrasEl = document.getElementById(CE_PROFILE_CHART_DOM_IDS.empresaGrupamentoRegiaoBarras);
  if (!munEl || !regEl) return;

  const seriesDefs = CE_EMPRESA_GRUPAMENTO_SECTOR_METRICS.map((m) => ({
    key: m.key,
    name: m.kpiLabel || m.label,
    format: "int",
  }));
  const munRows = ceBuildEmpresaGrupamentoMunicipioRows(aggByLayer, sortOrder);
  const setorPieSlices = ceBuildEmpresaGrupamentoSetorPieSlices(aggByLayer, sortOrder);
  const regRows = ceBuildEmpresaGrupamentoRegiaoRows(aggByLayer, sortOrder);

  const munChart = ceCreateProfileGroupedBarChart(munEl, munRows, {
    seriesDefs,
    colors: CE_EMPRESA_GRUPAMENTO_CHART_COLORS,
  });
  const regChart = ceCreateProfilePieChart(regEl, setorPieSlices, {
    colors: CE_EMPRESA_GRUPAMENTO_CHART_COLORS,
    showPercentLabels: true,
  });

  munChart.render();
  regChart.render();

  ceMapRuntime.profileSummaryCharts.empresaGrupamentoMunicipio = munChart;
  ceMapRuntime.profileSummaryCharts.empresaGrupamentoRegiao = regChart;

  if (regBarrasEl) {
    const regBarrasChart = ceCreateProfileGroupedBarChart(regBarrasEl, regRows, {
      seriesDefs,
      colors: CE_EMPRESA_GRUPAMENTO_CHART_COLORS,
    });
    regBarrasChart.render();
    ceMapRuntime.profileSummaryCharts.empresaGrupamentoRegiaoBarras = regBarrasChart;

    const regBarrasPanelTitle = regBarrasEl
      .closest(".map-ce-profile-charts__panel")
      ?.querySelector(".map-ce-profile-charts__panel-title");
    if (regBarrasPanelTitle) {
      regBarrasPanelTitle.textContent =
        ceMapRuntime.activeLegendClass !== null
          ? "Por região · todos os grupamentos (classe da legenda)"
          : "Por região · todos os grupamentos";
    }
  } else {
    ceMapRuntime.profileSummaryCharts.empresaGrupamentoRegiaoBarras = null;
  }

  const munPanelTitle = munEl.closest(".map-ce-profile-charts__panel")?.querySelector(".map-ce-profile-charts__panel-title");
  if (munPanelTitle) {
    munPanelTitle.textContent =
      ceMapRuntime.activeLegendClass !== null
        ? "Por município · classe selecionada na legenda"
        : "Por município";
  }

  const regPanelTitle = regEl.closest(".map-ce-profile-charts__panel")?.querySelector(".map-ce-profile-charts__panel-title");
  if (regPanelTitle) {
    regPanelTitle.textContent =
      ceMapRuntime.activeLegendClass !== null
        ? "Participação por setor · % do total (classe da legenda)"
        : "Participação por setor · % do total";
  }
}

function ceUpdateEmpresasVinculosSummaryCharts(aggByLayer, sortOrder) {
  const munEl = document.getElementById(CE_PROFILE_CHART_DOM_IDS.empresasVinculosMunicipio);
  const regEl = document.getElementById(CE_PROFILE_CHART_DOM_IDS.empresasVinculosRegiao);
  const regBarrasEl = document.getElementById(CE_PROFILE_CHART_DOM_IDS.empresasVinculosRegiaoBarras);
  if (!munEl || !regEl) return;

  const seriesDefs = CE_EMPRESAS_VINCULOS_FAIXA_METRICS.map((m) => ({
    key: m.key,
    name: m.kpiLabel || m.label,
    format: "int",
  }));
  const munRows = ceBuildEmpresasVinculosMunicipioRows(aggByLayer, sortOrder);
  const faixaPieSlices = ceBuildEmpresasVinculosFaixaPieSlices(aggByLayer, sortOrder);
  const regRows = ceBuildEmpresasVinculosRegiaoRows(aggByLayer, sortOrder);

  const munChart = ceCreateProfileGroupedBarChart(munEl, munRows, {
    seriesDefs,
    colors: CE_EMPRESAS_VINCULOS_CHART_COLORS,
  });
  const regChart = ceCreateProfilePieChart(regEl, faixaPieSlices, {
    colors: CE_EMPRESAS_VINCULOS_CHART_COLORS,
    showPercentLabels: true,
  });

  munChart.render();
  regChart.render();

  ceMapRuntime.profileSummaryCharts.empresasVinculosMunicipio = munChart;
  ceMapRuntime.profileSummaryCharts.empresasVinculosRegiao = regChart;

  if (regBarrasEl) {
    const regBarrasChart = ceCreateProfileGroupedBarChart(regBarrasEl, regRows, {
      seriesDefs,
      colors: CE_EMPRESAS_VINCULOS_CHART_COLORS,
    });
    regBarrasChart.render();
    ceMapRuntime.profileSummaryCharts.empresasVinculosRegiaoBarras = regBarrasChart;

    const regBarrasPanelTitle = regBarrasEl
      .closest(".map-ce-profile-charts__panel")
      ?.querySelector(".map-ce-profile-charts__panel-title");
    if (regBarrasPanelTitle) {
      regBarrasPanelTitle.textContent =
        ceMapRuntime.activeLegendClass !== null
          ? "Por região · todas as faixas (classe da legenda)"
          : "Por região · todas as faixas de vínculos";
    }
  } else {
    ceMapRuntime.profileSummaryCharts.empresasVinculosRegiaoBarras = null;
  }

  const munPanelTitle = munEl.closest(".map-ce-profile-charts__panel")?.querySelector(".map-ce-profile-charts__panel-title");
  if (munPanelTitle) {
    munPanelTitle.textContent =
      ceMapRuntime.activeLegendClass !== null
        ? "Por município · classe selecionada na legenda"
        : "Por município";
  }

  const regPanelTitle = regEl.closest(".map-ce-profile-charts__panel")?.querySelector(".map-ce-profile-charts__panel-title");
  if (regPanelTitle) {
    regPanelTitle.textContent =
      ceMapRuntime.activeLegendClass !== null
        ? "Participação por faixa · % do total (classe da legenda)"
        : "Participação por faixa · % do total";
  }
}

function ceUpdateVinculoEscolaridadeSummaryCharts(aggByLayer, sortOrder) {
  const munEl = document.getElementById(CE_PROFILE_CHART_DOM_IDS.vinculoEscolaridadeMunicipio);
  const regEl = document.getElementById(CE_PROFILE_CHART_DOM_IDS.vinculoEscolaridadeRegiao);
  const regBarrasEl = document.getElementById(CE_PROFILE_CHART_DOM_IDS.vinculoEscolaridadeRegiaoBarras);
  if (!munEl || !regEl) return;

  const seriesDefs = CE_VINCULO_ESCOLARIDADE_NIVEL_METRICS.map((m) => ({
    key: m.key,
    name: m.kpiLabel || m.label,
    format: "int",
  }));
  const munRows = ceBuildVinculoEscolaridadeMunicipioRows(aggByLayer, sortOrder);
  const nivelPieSlices = ceBuildVinculoEscolaridadeNivelPieSlices(aggByLayer, sortOrder);
  const regRows = ceBuildVinculoEscolaridadeRegiaoRows(aggByLayer, sortOrder);

  const munChart = ceCreateProfileGroupedBarChart(munEl, munRows, {
    seriesDefs,
    colors: CE_VINCULO_ESCOLARIDADE_CHART_COLORS,
  });
  const regChart = ceCreateProfilePieChart(regEl, nivelPieSlices, {
    colors: CE_VINCULO_ESCOLARIDADE_CHART_COLORS,
    showPercentLabels: true,
  });

  ceMapRuntime.profileSummaryCharts.vinculoEscolaridadeMunicipio = munChart;
  ceMapRuntime.profileSummaryCharts.vinculoEscolaridadeRegiao = regChart;

  requestAnimationFrame(() => {
    if (ceMapRuntime.profileSummaryCharts.vinculoEscolaridadeMunicipio === munChart) munChart.render();
    if (ceMapRuntime.profileSummaryCharts.vinculoEscolaridadeRegiao === regChart) regChart.render();
  });

  if (regBarrasEl) {
    const regBarrasChart = ceCreateProfileGroupedBarChart(regBarrasEl, regRows, {
      seriesDefs,
      colors: CE_VINCULO_ESCOLARIDADE_CHART_COLORS,
    });
    ceMapRuntime.profileSummaryCharts.vinculoEscolaridadeRegiaoBarras = regBarrasChart;
    requestAnimationFrame(() => {
      if (ceMapRuntime.profileSummaryCharts.vinculoEscolaridadeRegiaoBarras === regBarrasChart) regBarrasChart.render();
    });

    const regBarrasPanelTitle = regBarrasEl
      .closest(".map-ce-profile-charts__panel")
      ?.querySelector(".map-ce-profile-charts__panel-title");
    if (regBarrasPanelTitle) {
      regBarrasPanelTitle.textContent =
        ceMapRuntime.activeLegendClass !== null
          ? "Por região · todos os níveis (classe da legenda)"
          : "Por região · todos os níveis de escolaridade";
    }
  } else {
    ceMapRuntime.profileSummaryCharts.vinculoEscolaridadeRegiaoBarras = null;
  }

  const munPanelTitle = munEl.closest(".map-ce-profile-charts__panel")?.querySelector(".map-ce-profile-charts__panel-title");
  if (munPanelTitle) {
    munPanelTitle.textContent =
      ceMapRuntime.activeLegendClass !== null
        ? "Por município · classe selecionada na legenda"
        : "Por município";
  }

  const regPanelTitle = regEl.closest(".map-ce-profile-charts__panel")?.querySelector(".map-ce-profile-charts__panel-title");
  if (regPanelTitle) {
    regPanelTitle.textContent =
      ceMapRuntime.activeLegendClass !== null
        ? "Participação por escolaridade · % do total (classe da legenda)"
        : "Participação por escolaridade · % do total";
  }
}

function ceUpdateVinculoSexoSummaryCharts(aggByLayer, sortOrder) {
  const munEl = document.getElementById(CE_PROFILE_CHART_DOM_IDS.vinculoSexoMunicipio);
  const regEl = document.getElementById(CE_PROFILE_CHART_DOM_IDS.vinculoSexoRegiao);
  if (!munEl || !regEl) return;

  const seriesDefs = CE_VINCULO_SEXO_GROUP_METRICS.map((m) => ({
    key: m.key,
    name: m.kpiLabel || m.label,
    format: "int",
  }));
  const munRows = ceBuildVinculoSexoMunicipioRows(aggByLayer, sortOrder);
  const sexoPieSlices = ceBuildVinculoSexoPieSlices(aggByLayer, sortOrder);

  const munChart = ceCreateProfileGroupedBarChart(munEl, munRows, {
    seriesDefs,
    colors: CE_VINCULO_SEXO_CHART_COLORS,
  });
  const regChart = ceCreateProfilePieChart(regEl, sexoPieSlices, {
    colors: CE_VINCULO_SEXO_CHART_COLORS,
    showPercentLabels: true,
  });

  ceMapRuntime.profileSummaryCharts.vinculoSexoMunicipio = munChart;
  ceMapRuntime.profileSummaryCharts.vinculoSexoRegiao = regChart;

  requestAnimationFrame(() => {
    if (ceMapRuntime.profileSummaryCharts.vinculoSexoMunicipio === munChart) munChart.render();
    if (ceMapRuntime.profileSummaryCharts.vinculoSexoRegiao === regChart) regChart.render();
  });

  const munPanelTitle = munEl.closest(".map-ce-profile-charts__panel")?.querySelector(".map-ce-profile-charts__panel-title");
  if (munPanelTitle) {
    munPanelTitle.textContent =
      ceMapRuntime.activeLegendClass !== null
        ? "Por município · classe selecionada na legenda"
        : "Por município";
  }

  const regPanelTitle = regEl.closest(".map-ce-profile-charts__panel")?.querySelector(".map-ce-profile-charts__panel-title");
  if (regPanelTitle) {
    regPanelTitle.textContent =
      ceMapRuntime.activeLegendClass !== null
        ? "Participação por sexo · % do total (classe da legenda)"
        : "Participação por sexo · % do total";
  }
}

function ceUpdateProfileSummaryCharts(aggByLayer) {
  if (typeof ApexCharts === "undefined") return;
  if (!ceIsPerfilMunicipalMode()) return;

  const selectedLayerKey = ceGetSelectedProfileLayerKey();
  const sortOrder = ceGetProfileSortOrder();

  ceDestroyProfileSummaryCharts();
  ceDestroyCearaCredSummaryCharts();
  ceDestroyMunSimplesSummaryCharts();
  ceDestroyEmpresaGrupamentoSummaryCharts();
  ceDestroyEmpresasVinculosSummaryCharts();
  ceDestroyVinculoEscolaridadeSummaryCharts();
  ceDestroyVinculoSexoSummaryCharts();
  ceDestroyPibPerCaptaBarCharts();

  if (selectedLayerKey === "pib_per_capta") {
    if (!ceIsPerfilEmpresasMode()) return;
    const filteredRows =
      ceMapRuntime.lastProfileFilteredByLayer?.pib_per_capta ||
      ceMapRuntime.profileRowsByLayer?.pib_per_capta ||
      [];
    ceUpdatePibPerCaptaBarCharts(filteredRows, sortOrder);
    return;
  }

  if (selectedLayerKey === "ceara_cred") {
    if (!ceIsCearaCrediMode()) return;
    ceUpdateCearaCredSummaryCharts(aggByLayer, sortOrder);
    return;
  }

  if (selectedLayerKey === "mun_simples") {
    if (!ceIsPerfilEmpresasMode()) return;
    ceUpdateMunSimplesSummaryCharts(aggByLayer, sortOrder);
    return;
  }

  if (selectedLayerKey === "empresa_grupamento") {
    if (!ceIsPerfilEmpresasMode()) return;
    ceUpdateEmpresaGrupamentoSummaryCharts(aggByLayer, sortOrder);
    return;
  }

  if (selectedLayerKey === "empresas_vinculos") {
    if (!ceIsPerfilEmpresasMode()) return;
    ceUpdateEmpresasVinculosSummaryCharts(aggByLayer, sortOrder);
    return;
  }

  if (selectedLayerKey === "vinculo_escolaridade") {
    if (!ceIsPerfilEmpresasMode()) return;
    ceUpdateVinculoEscolaridadeSummaryCharts(aggByLayer, sortOrder);
    return;
  }

  if (selectedLayerKey === "vinculo_sexo") {
    if (!ceIsPerfilEmpresasMode()) return;
    ceUpdateVinculoSexoSummaryCharts(aggByLayer, sortOrder);
    return;
  }

  const isIntermediacaoLayer = CE_PROFILE_LAYER_CONFIG[selectedLayerKey]?.parseMode === "intermediacao";
  if (isIntermediacaoLayer && !ceIsIntermediacaoMode()) return;

  ceUpdateStandardProfileSummaryCharts(aggByLayer, selectedLayerKey, sortOrder);
}

function ceDestroyProfilePibLineChart() {
  const c = ceMapRuntime.profilePibLineChart;
  if (c) {
    try {
      c.destroy();
    } catch (_) {}
    ceMapRuntime.profilePibLineChart = null;
  }
}

function ceDestroyPibPerCaptaBarCharts() {
  for (const key of ["pibMunicipio", "pibRegiao"]) {
    const chart = ceMapRuntime.profileSummaryCharts[key];
    if (!chart) continue;
    try {
      chart.destroy();
    } catch (_) {}
    ceMapRuntime.profileSummaryCharts[key] = null;
  }
}

/** Média de PIB per capita por município nos anos presentes em filteredRows. */
function ceComputePibAvgByCodigo(filteredRows) {
  const sumByCod = new Map();
  const countByCod = new Map();
  for (const r of filteredRows) {
    const v = Number(r.pessoas);
    if (!Number.isFinite(v) || v <= 0) continue;
    const cod = r.codigo;
    sumByCod.set(cod, (sumByCod.get(cod) || 0) + v);
    countByCod.set(cod, (countByCod.get(cod) || 0) + 1);
  }
  const avgByCod = new Map();
  for (const [cod, sum] of sumByCod) {
    const n = countByCod.get(cod) || 1;
    avgByCod.set(cod, sum / n);
  }
  return avgByCod;
}

function ceComputePibOverallAvg(avgByCod) {
  const vals = [...avgByCod.values()].filter((n) => Number.isFinite(n) && n > 0);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

function ceBuildPibVsMediaMunicipioRows(filteredRows, sortOrder) {
  const avgByCod = ceComputePibAvgByCodigo(filteredRows);
  const overallAvg = ceComputePibOverallAvg(avgByCod);
  const nomeMap = ceCodigoToNomeMap();
  const rows = [];
  for (const [cod, avg] of avgByCod) {
    if (!ceValueMatchesActiveLegendClass(avg)) continue;
    rows.push({
      label: nomeMap.get(cod) || `Código ${cod}`,
      values: {
        media_periodo: avg,
        media_recorte: overallAvg,
      },
      total: avg,
    });
  }
  rows.sort(
    (a, b) =>
      (sortOrder === "asc" ? a.total - b.total : b.total - a.total) ||
      a.label.localeCompare(b.label, "pt-BR")
  );
  return { rows, overallAvg };
}

function ceBuildPibVsMediaRegiaoRows(filteredRows, sortOrder) {
  const avgByCod = ceComputePibAvgByCodigo(filteredRows);
  const overallAvg = ceComputePibOverallAvg(avgByCod);
  const rows = [];
  for (const [regiao, codSet] of ceMapRuntime.regiaoToCodigos.entries()) {
    const avgs = [];
    for (const cod of codSet) {
      const v = avgByCod.get(cod);
      if (Number.isFinite(v) && v > 0) avgs.push(v);
    }
    if (!avgs.length) continue;
    const regAvg = avgs.reduce((a, b) => a + b, 0) / avgs.length;
    if (!ceValueMatchesActiveLegendClass(regAvg)) continue;
    rows.push({
      label: regiao,
      values: {
        media_periodo: regAvg,
        media_recorte: overallAvg,
      },
      total: regAvg,
    });
  }
  rows.sort(
    (a, b) =>
      (sortOrder === "asc" ? a.total - b.total : b.total - a.total) ||
      a.label.localeCompare(b.label, "pt-BR")
  );
  return { rows, overallAvg };
}

function ceUpdatePibPerCaptaBarCharts(filteredRows, sortOrder) {
  if (typeof ApexCharts === "undefined") return;
  if (!ceIsPerfilEmpresasMode() || ceGetSelectedProfileLayerKey() !== "pib_per_capta") return;

  const munEl = document.getElementById(CE_PROFILE_CHART_DOM_IDS.pibMunicipio);
  const regEl = document.getElementById(CE_PROFILE_CHART_DOM_IDS.pibRegiao);
  if (!munEl || !regEl) return;

  ceDestroyPibPerCaptaBarCharts();

  const { rows: munRows } = ceBuildPibVsMediaMunicipioRows(filteredRows, sortOrder);
  const { rows: regRows } = ceBuildPibVsMediaRegiaoRows(filteredRows, sortOrder);

  const chartOpts = {
    seriesDefs: CE_PIB_VS_MEDIA_SERIES_DEFS,
    colors: CE_PIB_VS_MEDIA_CHART_COLORS,
    xaxisFormat: "currency",
  };

  const munChart = ceCreateProfileGroupedBarChart(munEl, munRows, chartOpts);
  const regChart = ceCreateProfileGroupedBarChart(regEl, regRows, chartOpts);

  ceMapRuntime.profileSummaryCharts.pibMunicipio = munChart;
  ceMapRuntime.profileSummaryCharts.pibRegiao = regChart;

  requestAnimationFrame(() => {
    if (ceMapRuntime.profileSummaryCharts.pibMunicipio === munChart) munChart.render();
    if (ceMapRuntime.profileSummaryCharts.pibRegiao === regChart) regChart.render();
  });

  const munPanelTitle = munEl
    .closest(".map-ce-profile-charts__panel")
    ?.querySelector(".map-ce-profile-charts__panel-title");
  if (munPanelTitle) {
    munPanelTitle.textContent =
      ceMapRuntime.activeLegendClass !== null
        ? "Por município · média nos anos filtrados vs média geral (classe da legenda)"
        : "Por município · média nos anos filtrados vs média geral";
  }

  const regPanelTitle = regEl
    .closest(".map-ce-profile-charts__panel")
    ?.querySelector(".map-ce-profile-charts__panel-title");
  if (regPanelTitle) {
    regPanelTitle.textContent =
      ceMapRuntime.activeLegendClass !== null
        ? "Por região · média nos anos filtrados vs média geral (classe da legenda)"
        : "Por região · média nos anos filtrados vs média geral";
  }
}

function ceCollectPibYearsFromRows(rows) {
  const years = new Set();
  for (const r of rows) {
    const y = r?.raw?.ano || (ceRowMesAnoKey(r) && /^(\d{4})-/.exec(ceRowMesAnoKey(r))?.[1]);
    if (y) years.add(String(y));
  }
  return [...years].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
}

function ceGetPibSortReferenceYear(years, byYearCod, anoSel) {
  if (!years.length) return "";
  if (anoSel && anoSel.size > 0) {
    const pick = [...anoSel]
      .map(String)
      .filter((y) => years.includes(y))
      .sort((a, b) => parseInt(b, 10) - parseInt(a, 10))[0];
    if (pick && byYearCod.has(pick)) return pick;
  }
  for (let i = years.length - 1; i >= 0; i -= 1) {
    const y = years[i];
    if (byYearCod.get(y)?.size) return y;
  }
  return years[years.length - 1];
}

function ceBuildPibAnnualLineSeries(filteredRows, anoSel) {
  const years = ceCollectPibYearsFromRows(filteredRows);
  if (!years.length) {
    return { categories: [], series: [], hasRows: false };
  }

  const byYearCod = new Map();
  for (const r of filteredRows) {
    const year = r?.raw?.ano || /^(\d{4})-/.exec(ceRowMesAnoKey(r) || "")?.[1];
    if (!year) continue;
    if (!byYearCod.has(year)) byYearCod.set(year, new Map());
    byYearCod.get(year).set(r.codigo, Number(r.pessoas) || 0);
  }

  const categories = years;
  const series = [];

  const nomeMap = ceCodigoToNomeMap();

  const refYear = ceGetPibSortReferenceYear(years, byYearCod, anoSel);
  const refMap = byYearCod.get(refYear) || new Map();

  const sortedCods = [...refMap.entries()]
    .sort((a, b) => b[1] - a[1] || String(nomeMap.get(a[0]) || a[0]).localeCompare(String(nomeMap.get(b[0]) || b[0]), "pt-BR"))
    .slice(0, CE_PIB_LINE_MAX_SERIES)
    .map(([cod]) => cod);

  sortedCods.forEach((cod, idx) => {
    const label = nomeMap.get(cod) || `Código ${cod}`;
    series.push({
      name: label,
      data: years.map((y) => byYearCod.get(y)?.get(cod) ?? null),
      _color: CE_PIB_LINE_PALETTE[idx % CE_PIB_LINE_PALETTE.length],
    });
  });

  return { categories, series, hasRows: true };
}

function ceUpdateProfilePibLineChart(filteredRows, anoSel) {
  if (typeof ApexCharts === "undefined") return;
  const el = document.getElementById(CE_PROFILE_CHART_DOM_IDS.pibLine);
  if (!el) return;

  ceDestroyProfilePibLineChart();

  const isPib = ceGetSelectedProfileLayerKey() === "pib_per_capta";
  if (!isPib || !ceIsPerfilEmpresasMode()) return;

  const { categories, series, hasRows } = ceBuildPibAnnualLineSeries(filteredRows, anoSel);
  const cats = hasRows ? categories : ["Sem dados no filtro"];
  const chartSeries = hasRows
    ? series.map((s, idx) => ({
        name: s.name,
        data: s.data.map((v) => (Number.isFinite(v) ? v : null)),
      }))
    : [{ name: "PIB per capita", data: [0] }];

  const colors = hasRows
    ? series.map((s, idx) => s._color || CE_PIB_LINE_PALETTE[idx % CE_PIB_LINE_PALETTE.length])
    : [CE_PIB_LINE_PALETTE[0]];

  const showLabels = hasRows && chartSeries.length <= 4;
  const labelFontSize = chartSeries.length === 1 ? "11px" : "9px";

  const chart = new ApexCharts(el, {
    chart: {
      type: "line",
      height: showLabels ? 520 : 440,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "system-ui, Segoe UI, sans-serif",
      foreColor: "#1f2d78",
      animations: { speed: 320 },
    },
    series: chartSeries,
    colors,
    xaxis: {
      categories: cats,
      title: { text: "Ano", style: { fontSize: "12px", fontWeight: 600, color: "#475569" } },
      labels: { style: { fontSize: "11px", colors: "#475569" } },
    },
    yaxis: {
      labels: {
        formatter: (val) => ceFormatCurrencyPt(Number(val)),
        style: { fontSize: "11px", colors: "#475569" },
      },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    markers: {
      size: hasRows ? 4 : 0,
      strokeWidth: 2,
      hover: { size: 6 },
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontSize: "12px",
      fontWeight: 600,
      onItemClick: { toggleDataSeries: true },
      onItemHover: { highlightDataSeries: true },
    },
    grid: {
      borderColor: "#e2e8f0",
      strokeDashArray: 4,
      padding: { left: 8, right: 12, top: showLabels ? 28 : 10, bottom: 4 },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val, { seriesIndex, dataPointIndex, w }) => {
          const n = Number(val);
          const baseText = ceFormatCurrencyPt(n);
          if (!Number.isFinite(n) || dataPointIndex === 0) return baseText;
          const prev = w.globals.series[seriesIndex][dataPointIndex - 1];
          if (!Number.isFinite(prev) || prev <= 0) return baseText;
          const pct = ((n - prev) / prev) * 100;
          const arrow = pct >= 0 ? "▲" : "▼";
          const sign = pct >= 0 ? "+" : "";
          return `${baseText} (${arrow} ${sign}${pct.toFixed(1)}% vs ${cats[dataPointIndex - 1]})`;
        },
      },
    },
    dataLabels: {
      enabled: showLabels,
      formatter: function (val, { seriesIndex, dataPointIndex, w }) {
        if (!Number.isFinite(val) || dataPointIndex === 0) return "";
        const prev = w.globals.series[seriesIndex][dataPointIndex - 1];
        if (!Number.isFinite(prev) || prev <= 0) return "";
        const pct = ((val - prev) / prev) * 100;
        const arrow = pct >= 0 ? "▲" : "▼";
        return `${arrow} ${Math.abs(pct).toFixed(1)}%`;
      },
      style: {
        fontSize: labelFontSize,
        fontWeight: 700,
        colors: colors,
      },
      background: {
        enabled: true,
        foreColor: "#fff",
        padding: 3,
        borderRadius: 4,
        borderWidth: 0,
        opacity: 0.82,
        dropShadow: { enabled: false },
      },
      offsetY: -10,
    },
    noData: { text: hasRows ? "" : "Sem dados no filtro" },
  });

  chart.render();
  ceMapRuntime.profilePibLineChart = chart;
}

function ceDestroyProfileCearaCredLineChart() {
  const c = ceMapRuntime.profileCearaCredLineChart;
  if (c) {
    try {
      c.destroy();
    } catch (_) {}
    ceMapRuntime.profileCearaCredLineChart = null;
  }
  const el = document.getElementById(CE_PROFILE_CHART_DOM_IDS.cearaLine);
  if (el) el.innerHTML = "";
}

function ceRowYearFromCearaCred(r) {
  const key = ceRowMesAnoKey(r);
  let yearStr = key && /^(\d{4})-/.exec(key)?.[1];
  if (!yearStr) {
    const rawYear = String(r.mesAno || "").trim();
    if (/^\d{4}$/.test(rawYear)) yearStr = rawYear;
  }
  return yearStr || "";
}

function ceCollectCearaCredYearsFromRows(rows) {
  const years = new Set();
  for (const r of rows) {
    const y = ceRowYearFromCearaCred(r);
    if (y) years.add(y);
  }
  return [...years].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
}

/** Linhas Ceará Credi só com filtros espaciais (região/município), sem ano/mês globais. */
function ceFilterCearaCredRowsForLineChart(rows, munSel, regSel) {
  return ceGetFilteredRows(rows, new Set(), munSel, regSel, new Set());
}

function ceRenderCearaCredLineYearFilters(availableYears) {
  const wrap = document.getElementById("mapCearaCredLineYearFilters");
  if (!wrap) return;
  const prev = new Set(
    Array.from(wrap.querySelectorAll('input[name="cearaLineYear"]:checked')).map((el) => el.value)
  );
  const hadSelection = prev.size > 0;
  wrap.innerHTML = "";
  for (const y of availableYears) {
    const label = document.createElement("label");
    label.className = "map-ce-chip";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "cearaLineYear";
    input.value = y;
    input.checked = hadSelection ? prev.has(y) : true;
    label.appendChild(input);
    const span = document.createElement("span");
    span.textContent = y;
    label.appendChild(span);
    wrap.appendChild(label);
  }
}

function ceGetCearaCredLineSelectedYears(availableYears) {
  const wrap = document.getElementById("mapCearaCredLineYearFilters");
  if (!wrap) return new Set(availableYears);
  const sel = new Set(
    Array.from(wrap.querySelectorAll('input[name="cearaLineYear"]:checked')).map((el) => el.value)
  );
  if (!sel.size) return new Set(availableYears);
  return sel;
}

function ceGetCearaCredLineSelectedMetrics() {
  const sel = new Set(
    Array.from(document.querySelectorAll('input[name="cearaLineMetric"]:checked')).map((el) => el.value)
  );
  return sel;
}

function ceBuildCearaCredAnnualLineSeries(filteredRows, metricKeys) {
  const years = ceCollectCearaCredYearsFromRows(filteredRows);
  if (!years.length || !metricKeys.size) {
    return { categories: [], series: [], hasRows: false };
  }

  const byYear = new Map();
  for (const row of filteredRows) {
    const yearStr = ceRowYearFromCearaCred(row);
    if (!yearStr) continue;
    const cur = byYear.get(yearStr) || {
      cadastradas: 0,
      em_atendimento: 0,
      aprovadas: 0,
      valor_liberado: 0,
    };
    const m = row.metrics || {};
    cur.cadastradas += Number(m.cadastradas) || 0;
    cur.em_atendimento += Number(m.em_atendimento) || 0;
    cur.aprovadas += Number(m.aprovadas) || 0;
    cur.valor_liberado += Number(m.valor_liberado) || 0;
    byYear.set(yearStr, cur);
  }

  const series = CE_CEARA_CRED_LINE_METRICS.filter((def) => metricKeys.has(def.key)).map((def) => ({
    name: def.label,
    data: years.map((y) => {
      const v = Number(byYear.get(y)?.[def.key]);
      return Number.isFinite(v) ? v : 0;
    }),
    _format: def.format,
    _color: def.color,
    _key: def.key,
  }));

  const hasAnyValue = series.some((s) => s.data.some((v) => Number(v) > 0));
  return { categories: years, series, hasRows: hasAnyValue };
}

function ceFormatCearaCredLineTooltip(val, format) {
  const n = Number(val);
  if (!Number.isFinite(n)) return "—";
  return format === "currency" ? ceFormatCurrencyPt(n) : ceFormatIntPt(n);
}

function ceBuildCearaCredLineApexConfig(categories, seriesMeta) {
  const chartSeries = seriesMeta.map((s) => ({ name: s.name, data: s.data }));
  const colors = seriesMeta.map((s) => s._color);
  const hasCurrency = seriesMeta.some((s) => s._format === "currency");
  const hasCount = seriesMeta.some((s) => s._format !== "currency");

  let yaxis;
  if (hasCurrency && hasCount) {
    yaxis = [
      {
        title: { text: "Quantidade", style: { fontSize: "12px", fontWeight: 600, color: "#047857" } },
        labels: {
          formatter: (val) => ceFormatIntPt(Number(val)),
          style: { fontSize: "11px", colors: "#047857" },
        },
        min: 0,
      },
      {
        opposite: true,
        seriesName: "Valor liberado",
        title: { text: "Valor liberado (R$)", style: { fontSize: "12px", fontWeight: 600, color: "#0f766e" } },
        labels: {
          formatter: (val) => ceFormatCurrencyPt(Number(val)),
          style: { fontSize: "11px", colors: "#0f766e" },
        },
        min: 0,
      },
    ];
  } else if (hasCurrency) {
    yaxis = {
      title: { text: "Valor liberado (R$)", style: { fontSize: "12px", fontWeight: 600, color: "#0f766e" } },
      labels: {
        formatter: (val) => ceFormatCurrencyPt(Number(val)),
        style: { fontSize: "11px", colors: "#0f766e" },
      },
      min: 0,
    };
  } else {
    yaxis = {
      title: { text: "Quantidade", style: { fontSize: "12px", fontWeight: 600, color: "#047857" } },
      labels: {
        formatter: (val) => ceFormatIntPt(Number(val)),
        style: { fontSize: "11px", colors: "#047857" },
      },
      min: 0,
    };
  }

  return {
    chart: {
      type: "line",
      height: 460,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "system-ui, Segoe UI, sans-serif",
      foreColor: "#065f46",
      animations: { speed: 320 },
    },
    series: chartSeries,
    colors,
    xaxis: {
      categories,
      title: { text: "Ano de referência", style: { fontSize: "12px", fontWeight: 600, color: "#475569" } },
      labels: { style: { fontSize: "11px", colors: "#475569" } },
    },
    yaxis,
    stroke: { curve: "smooth", width: 3 },
    markers: { size: 5, strokeWidth: 2, hover: { size: 7 } },
    legend: {
      show: false,
    },
    grid: {
      borderColor: "#d1fae5",
      strokeDashArray: 4,
      padding: { left: 8, right: 12, top: 10, bottom: 4 },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val, { seriesIndex }) => {
          const fmt = seriesMeta[seriesIndex]?._format || "int";
          return ceFormatCearaCredLineTooltip(val, fmt);
        },
      },
    },
  };
}

function ceGetMapFilterMunRegSets() {
  const mesEl = document.getElementById("mapFilterMes");
  const anoEl = document.getElementById("mapFilterAno");
  const munEl = document.getElementById("mapFilterMunicipio");
  const regEl = document.getElementById("mapFilterRegiao");
  return {
    munSel: new Set(Array.from(munEl?.selectedOptions || []).map((o) => o.value)),
    regSel: new Set(Array.from(regEl?.selectedOptions || []).map((o) => o.value)),
    mesEl,
    anoEl,
  };
}

function ceRefreshCearaCredLineChart() {
  const { munSel, regSel } = ceGetMapFilterMunRegSets();
  ceUpdateProfileCearaCredLineChart(munSel, regSel);
}

function ceUpdateProfileCearaCredLineChart(munSel, regSel) {
  if (typeof ApexCharts === "undefined") return;
  const el = document.getElementById(CE_PROFILE_CHART_DOM_IDS.cearaLine);
  const emptyEl = document.getElementById("mapCearaCredLineEmpty");
  if (!el) return;

  const isCearaCred = ceGetSelectedProfileLayerKey() === "ceara_cred";
  if (!isCearaCred || !ceIsPerfilMunicipalMode()) {
    ceDestroyProfileCearaCredLineChart();
    return;
  }

  const baseRows = ceFilterCearaCredRowsForLineChart(
    ceMapRuntime.profileRowsByLayer.ceara_cred || [],
    munSel,
    regSel
  );
  const availableYears = ceCollectCearaCredYearsFromRows(baseRows);
  ceRenderCearaCredLineYearFilters(availableYears);

  const selYears = ceGetCearaCredLineSelectedYears(availableYears);
  const selMetrics = ceGetCearaCredLineSelectedMetrics();
  const rowsForChart = baseRows.filter((r) => selYears.has(ceRowYearFromCearaCred(r)));

  const { categories, series, hasRows } = ceBuildCearaCredAnnualLineSeries(rowsForChart, selMetrics);
  const showChart = hasRows && categories.length > 0 && series.length > 0;

  if (emptyEl) {
    emptyEl.hidden = showChart;
    if (!showChart) {
      emptyEl.textContent =
        selMetrics.size === 0
          ? "Selecione ao menos uma variável para exibir o gráfico."
          : selYears.size === 0
            ? "Selecione ao menos um ano para exibir o gráfico."
            : "Sem dados para o recorte e filtros selecionados.";
    }
  }

  ceDestroyProfileCearaCredLineChart();
  if (!showChart) return;

  const renderChart = () => {
    try {
      const chart = new ApexCharts(el, ceBuildCearaCredLineApexConfig(categories, series));
      chart
        .render()
        .then(() => {
          ceMapRuntime.profileCearaCredLineChart = chart;
          requestAnimationFrame(() => {
            try {
              chart.resize();
            } catch (_) {}
          });
        })
        .catch((err) => {
          console.warn("Ceará Credi linha:", err);
        });
    } catch (err) {
      console.warn("Ceará Credi linha (config):", err);
    }
  };

  requestAnimationFrame(renderChart);
}

function ceDestroyIntermediacaoLineChart() {
  const c = ceMapRuntime.intermediacaoLineChart;
  if (c) {
    try {
      c.destroy();
    } catch (_) {}
    ceMapRuntime.intermediacaoLineChart = null;
  }
}

function ceRenderIntermediacaoLineMetricFilters() {
  const wrap = document.getElementById("mapIntermediacaoLineMetricFilters");
  if (!wrap) return;
  const prev = new Set(
    Array.from(wrap.querySelectorAll('input[name="intermediacaoLineMetric"]:checked')).map((el) => el.value)
  );
  const hadSelection = prev.size > 0;
  const activeKey = ceGetSelectedProfileLayerKey();
  wrap.innerHTML = "";
  for (const def of CE_INTERMEDIACAO_LINE_METRICS) {
    const label = document.createElement("label");
    label.className = "map-ce-chip";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "intermediacaoLineMetric";
    input.value = def.key;
    input.checked = hadSelection ? prev.has(def.key) : def.key === activeKey;
    label.appendChild(input);
    const span = document.createElement("span");
    span.textContent = def.label;
    label.appendChild(span);
    wrap.appendChild(label);
  }
}

function ceGetIntermediacaoLineSelectedMetrics() {
  return new Set(
    Array.from(document.querySelectorAll('input[name="intermediacaoLineMetric"]:checked')).map((el) => el.value)
  );
}

function ceBuildIntermediacaoMonthlyLineSeries(munSel, regSel, anoSel, metricKeys) {
  if (!metricKeys.size) {
    return { categories: [], series: [], hasRows: false };
  }

  const monthRanks = new Map();
  /** @type {Map<string, Map<string, number>>} */
  const byMetricMonth = new Map();
  /** @type {Map<string, Map<string, number>>} */
  const byMetricMonthPrev = new Map();

  for (const layerKey of CE_INTERMEDIACAO_LAYER_KEYS) {
    if (!metricKeys.has(layerKey)) continue;
    const rows = ceMapRuntime.profileRowsByLayer[layerKey] || [];
    const filtered = ceGetFilteredRows(rows, new Set(), munSel, regSel, anoSel);
    const monthMap = new Map();
    const monthMapPrev = new Map();
    for (const row of filtered) {
      const key = ceRowMesAnoKey(row);
      if (!key) continue;
      monthRanks.set(key, ceMesAnoKeyRank(key));
      monthMap.set(key, (monthMap.get(key) || 0) + (Number(row.pessoas) || 0));
      monthMapPrev.set(key, (monthMapPrev.get(key) || 0) + (Number(row.previsao) || 0));
    }
    byMetricMonth.set(layerKey, monthMap);
    byMetricMonthPrev.set(layerKey, monthMapPrev);
  }

  const sortedKeys = [...monthRanks.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([key]) => key);
  const categories = sortedKeys.map((key) => ceFormatMesAnoFromKey(key));

  const series = [];
  for (const def of CE_INTERMEDIACAO_LINE_METRICS.filter((d) => metricKeys.has(d.key))) {
    series.push({
      name: def.label,
      data: sortedKeys.map((key) => {
        const v = Number(byMetricMonth.get(def.key)?.get(key));
        return Number.isFinite(v) ? v : 0;
      }),
      _color: def.color,
      _dash: false,
    });
    series.push({
      name: `${def.label} (prev.)`,
      data: sortedKeys.map((key) => {
        const v = Number(byMetricMonthPrev.get(def.key)?.get(key));
        return Number.isFinite(v) ? v : 0;
      }),
      _color: def.color,
      _dash: true,
    });
  }

  const hasRows = series.some((s) => s.data.some((v) => Number(v) > 0));
  return { categories, series, hasRows };
}

function ceBuildIntermediacaoLineApexConfig(categories, seriesMeta) {
  return {
    chart: {
      type: "line",
      height: 460,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "system-ui, Segoe UI, sans-serif",
      foreColor: "#065f46",
      animations: { speed: 320 },
    },
    series: seriesMeta.map((s) => ({ name: s.name, data: s.data })),
    colors: seriesMeta.map((s) => s._color),
    xaxis: {
      categories,
      title: { text: "Mês de referência", style: { fontSize: "12px", fontWeight: 600, color: "#475569" } },
      labels: {
        rotate: categories.length > 8 ? -35 : 0,
        rotateAlways: false,
        hideOverlappingLabels: true,
        style: { fontSize: "11px", colors: "#475569" },
      },
    },
    yaxis: {
      title: { text: "Quantidade (Real e prev.)", style: { fontSize: "12px", fontWeight: 600, color: "#047857" } },
      labels: {
        formatter: (val) => ceFormatIntPt(Number(val)),
        style: { fontSize: "11px", colors: "#047857" },
      },
      min: 0,
    },
    stroke: {
      curve: "smooth",
      width: seriesMeta.map((s) => (s._dash ? 2 : 3)),
      dashArray: seriesMeta.map((s) => (s._dash ? 6 : 0)),
    },
    markers: {
      size: seriesMeta.map((s) => (s._dash ? 0 : 4)),
      strokeWidth: 2,
      hover: { size: 6 },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontSize: "12px",
      fontWeight: 600,
      markers: { width: 10, height: 10, radius: 3 },
      onItemClick: { toggleDataSeries: true },
      onItemHover: { highlightDataSeries: true },
    },
    grid: {
      borderColor: "#d1fae5",
      strokeDashArray: 4,
      padding: { left: 8, right: 12, top: 10, bottom: 4 },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val) => ceFormatIntPt(Number(val)),
      },
    },
  };
}

function ceRefreshIntermediacaoLineChart() {
  const { munSel, regSel, anoEl } = ceGetMapFilterMunRegSets();
  const anoSel = new Set(Array.from(anoEl?.selectedOptions || []).map((o) => o.value));
  ceUpdateIntermediacaoLineChart(munSel, regSel, anoSel);
}

function ceUpdateIntermediacaoLineChart(munSel, regSel, anoSel) {
  if (typeof ApexCharts === "undefined") return;
  if (!ceIsIntermediacaoMode()) {
    ceDestroyIntermediacaoLineChart();
    return;
  }

  const el = document.getElementById("mapIntermediacaoLineChart");
  const emptyEl = document.getElementById("mapIntermediacaoLineEmpty");
  if (!el) return;

  ceRenderIntermediacaoLineMetricFilters();
  const selMetrics = ceGetIntermediacaoLineSelectedMetrics();
  const { categories, series, hasRows } = ceBuildIntermediacaoMonthlyLineSeries(
    munSel,
    regSel,
    anoSel,
    selMetrics
  );

  const showChart = selMetrics.size > 0 && hasRows;
  if (emptyEl) {
    emptyEl.hidden = showChart;
    emptyEl.textContent = !selMetrics.size
      ? "Selecione ao menos uma variável para exibir o gráfico."
      : "Sem dados para o recorte e filtros selecionados.";
  }
  el.style.display = showChart ? "" : "none";

  ceDestroyIntermediacaoLineChart();
  if (!showChart) return;

  const renderChart = () => {
    try {
      const chart = new ApexCharts(el, ceBuildIntermediacaoLineApexConfig(categories, series));
      chart
        .render()
        .then(() => {
          ceMapRuntime.intermediacaoLineChart = chart;
          requestAnimationFrame(() => {
            try {
              chart.resize();
            } catch (_) {}
          });
        })
        .catch((err) => {
          console.warn("Intermediação linha:", err);
        });
    } catch (err) {
      console.warn("Intermediação linha (config):", err);
    }
  };

  requestAnimationFrame(renderChart);
}

function ceSyncProfileLayerUi() {
  const root = document.getElementById("secaoMapaCe");
  if (!root) return;

  const isPerfil = ceIsPerfilMunicipalMode();
  if (!isPerfil || ceIsVaiVemMode() || ceIsCagedGrupamentosMode() || ceIsSeguroDesempregoMode() || ceIsQualificacaoMode()) {
    root.classList.remove(
      "section-map-ce--pib-layer",
      "section-map-ce--ceara-cred-layer",
      "section-map-ce--mun-simples-layer",
      "section-map-ce--empresa-grupamento-layer",
      "section-map-ce--empresas-vinculos-layer",
      "section-map-ce--vinculo-escolaridade-layer",
      "section-map-ce--vinculo-sexo-layer",
      "section-map-ce--kpi-standard",
      "section-map-ce--profile-years"
    );
    ceDestroyProfilePibLineChart();
    ceDestroyProfileCearaCredLineChart();
    ceDestroyIntermediacaoLineChart();
    const pibWrap = document.querySelector(".map-ce-pib-line-wrap");
    if (pibWrap) {
      pibWrap.hidden = true;
      pibWrap.setAttribute("aria-hidden", "true");
    }
    const cearaLineWrap = document.querySelector(".map-ce-ceara-cred-line-wrap");
    if (cearaLineWrap) {
      cearaLineWrap.hidden = true;
      cearaLineWrap.setAttribute("aria-hidden", "true");
    }
    const intLineWrap = document.querySelector(".map-ce-intermediacao-line-wrap");
    if (intLineWrap) {
      intLineWrap.hidden = true;
      intLineWrap.setAttribute("aria-hidden", "true");
    }
    for (const wrap of document.querySelectorAll(".map-ce-profile-charts-wrap")) {
      wrap.hidden = true;
      wrap.setAttribute("aria-hidden", "true");
    }
    return;
  }

  const layerKey = ceGetSelectedProfileLayerKey();
  const isPib = layerKey === "pib_per_capta";
  const isCearaCred = layerKey === "ceara_cred" || ceIsCearaCrediMode();
  const isMunSimples = layerKey === "mun_simples";
  const isEmpresaGrupamento = layerKey === "empresa_grupamento";
  const isEmpresasVinculos = layerKey === "empresas_vinculos";
  const isVinculoEscolaridade = layerKey === "vinculo_escolaridade";
  const isVinculoSexo = layerKey === "vinculo_sexo";
  const isIntermediacao = CE_PROFILE_LAYER_CONFIG[layerKey]?.parseMode === "intermediacao";
  /* data-int-layer: sufixo do layerKey (ex: "atendimentos") usado pelo CSS para mostrar o KPI correto */
  const intMatch = layerKey.match(/^intermediacao_(.+)$/);
  root.dataset.intLayer = intMatch ? intMatch[1] : "";
  const isStandard =
    !isPib &&
    !isCearaCred &&
    !isMunSimples &&
    !isEmpresaGrupamento &&
    !isEmpresasVinculos &&
    !isVinculoEscolaridade &&
    !isIntermediacao &&
    !isVinculoSexo;
  const showGroupedBarCharts =
    isStandard || (isIntermediacao && ceIsIntermediacaoMode());
  const isWide = ceIsProfileWideYearLayer(layerKey);
  root.classList.toggle("section-map-ce--pib-layer", isPib);
  root.classList.toggle("section-map-ce--ceara-cred-layer", isCearaCred);
  root.classList.toggle("section-map-ce--mun-simples-layer", isMunSimples);
  root.classList.toggle("section-map-ce--empresa-grupamento-layer", isEmpresaGrupamento);
  root.classList.toggle("section-map-ce--empresas-vinculos-layer", isEmpresasVinculos);
  root.classList.toggle("section-map-ce--vinculo-escolaridade-layer", isVinculoEscolaridade);
  root.classList.toggle("section-map-ce--vinculo-sexo-layer", isVinculoSexo);
  root.classList.toggle("section-map-ce--kpi-standard", isStandard);
  root.classList.toggle("section-map-ce--profile-years", isWide);

  const pibWrap = document.querySelector(".map-ce-pib-line-wrap");
  if (pibWrap) {
    pibWrap.hidden = !isPib;
    pibWrap.setAttribute("aria-hidden", isPib ? "false" : "true");
  }

  const cearaLineWrap = document.querySelector(".map-ce-ceara-cred-line-wrap");
  if (cearaLineWrap) {
    cearaLineWrap.hidden = !isCearaCred;
    cearaLineWrap.setAttribute("aria-hidden", isCearaCred ? "false" : "true");
    if (isCearaCred) {
      requestAnimationFrame(() => ceRefreshCearaCredLineChart());
    }
  }
  if (!isCearaCred) ceDestroyProfileCearaCredLineChart();

  const intLineWrap = document.querySelector(".map-ce-intermediacao-line-wrap");
  if (intLineWrap) {
    intLineWrap.hidden = !isIntermediacao;
    intLineWrap.setAttribute("aria-hidden", isIntermediacao ? "false" : "true");
    if (isIntermediacao) {
      requestAnimationFrame(() => ceRefreshIntermediacaoLineChart());
    }
  }
  if (!isIntermediacao) ceDestroyIntermediacaoLineChart();

  const standardChartsWrap = document.querySelector(".map-ce-profile-charts-wrap--standard");
  const cearaChartsWrap = document.querySelector(".map-ce-profile-charts-wrap--ceara-cred");
  const munSimplesChartsWrap = document.querySelector(".map-ce-profile-charts-wrap--mun-simples");
  const empresaGrupamentoChartsWrap = document.querySelector(".map-ce-profile-charts-wrap--empresa-grupamento");
  const empresasVinculosChartsWrap = document.querySelector(".map-ce-profile-charts-wrap--empresas-vinculos");
  const vinculoEscolaridadeChartsWrap = document.querySelector(".map-ce-profile-charts-wrap--vinculo-escolaridade");
  const vinculoSexoChartsWrap = document.querySelector(".map-ce-profile-charts-wrap--vinculo-sexo");
  const pibChartsWrap = document.querySelector(".map-ce-profile-charts-wrap--pib");
  if (standardChartsWrap) {
    standardChartsWrap.hidden = !showGroupedBarCharts;
    standardChartsWrap.setAttribute("aria-hidden", showGroupedBarCharts ? "false" : "true");
  }
  if (cearaChartsWrap) {
    cearaChartsWrap.hidden = !isCearaCred;
    cearaChartsWrap.setAttribute("aria-hidden", isCearaCred ? "false" : "true");
  }
  if (munSimplesChartsWrap) {
    munSimplesChartsWrap.hidden = !isMunSimples;
    munSimplesChartsWrap.setAttribute("aria-hidden", isMunSimples ? "false" : "true");
  }
  if (empresaGrupamentoChartsWrap) {
    empresaGrupamentoChartsWrap.hidden = !isEmpresaGrupamento;
    empresaGrupamentoChartsWrap.setAttribute("aria-hidden", isEmpresaGrupamento ? "false" : "true");
  }
  if (empresasVinculosChartsWrap) {
    empresasVinculosChartsWrap.hidden = !isEmpresasVinculos;
    empresasVinculosChartsWrap.setAttribute("aria-hidden", isEmpresasVinculos ? "false" : "true");
  }
  if (vinculoEscolaridadeChartsWrap) {
    vinculoEscolaridadeChartsWrap.hidden = !isVinculoEscolaridade;
    vinculoEscolaridadeChartsWrap.setAttribute("aria-hidden", isVinculoEscolaridade ? "false" : "true");
  }
  if (vinculoSexoChartsWrap) {
    vinculoSexoChartsWrap.hidden = !isVinculoSexo;
    vinculoSexoChartsWrap.setAttribute("aria-hidden", isVinculoSexo ? "false" : "true");
  }
  if (pibChartsWrap) {
    pibChartsWrap.hidden = !isPib;
    pibChartsWrap.setAttribute("aria-hidden", isPib ? "false" : "true");
  }
  if (!isPib) ceDestroyPibPerCaptaBarCharts();

  const chartsTitle = document.getElementById("mapProfileChartsTitle");
  const chartsHint = document.getElementById("mapProfileChartsHint");
  if (showGroupedBarCharts && chartsTitle && chartsHint) {
    if (ceIsIntermediacaoMode() && isIntermediacao) {
      chartsTitle.textContent = "Variáveis da intermediação";
      chartsHint.textContent =
        "Mesmos filtros do mapa · comparação entre as variáveis de intermediação (coluna Real.) · total no recorte · ordenação pela camada selecionada no mapa";
    } else {
      chartsTitle.textContent = "Variáveis do perfil municipal";
      chartsHint.textContent =
        "Mesmos filtros do mapa · comparação entre as seis variáveis (coluna Pessoas) · referência mais recente do recorte · ordenação pela camada selecionada no mapa";
    }
  }
}

function cePickFormalizacaoMunicipioEntries(aggByCod, order) {
  const nomes = ceCodigoToNomeMap();
  const popMap = ceMapRuntime.populacaoByCodigo;
  const rows = [];
  for (const [cod, vals] of aggByCod.entries()) {
    const est = vals.estoque;
    const pop = popMap.get(cod);
    if (!Number.isFinite(est) || est < 0) continue;
    if (!Number.isFinite(pop) || pop <= 0) continue;
    rows.push({
      cod,
      label: nomes.get(cod) || `Código ${cod}`,
      value: (est / pop) * 100,
    });
  }
  rows.sort((a, b) => (order === "maiores" ? b.value - a.value : a.value - b.value));
  return rows.slice(0, CE_RANKING_TOP_N);
}

/** Σ estoque / Σ população por região administrativa (mesmos filtros que o mapa). */
function cePickFormalizacaoRegiaoEntries(aggByCod, order) {
  const popMap = ceMapRuntime.populacaoByCodigo;
  const rows = [];
  for (const [regName, codSet] of ceMapRuntime.regiaoToCodigos.entries()) {
    let estoque = 0;
    let pop = 0;
    for (const cod of codSet) {
      const v = aggByCod.get(cod);
      if (v && Number.isFinite(v.estoque)) estoque += v.estoque;
      const p = popMap.get(cod);
      if (Number.isFinite(p) && p > 0) pop += p;
    }
    if (pop <= 0 || !Number.isFinite(estoque)) continue;
    rows.push({
      label: regName,
      value: (estoque / pop) * 100,
    });
  }
  rows.sort((a, b) => (order === "maiores" ? b.value - a.value : a.value - b.value));
  return rows.slice(0, CE_RANKING_TOP_N);
}

function ceDestroyRankingCharts() {
  for (const metricKey of CE_GRADUATED_METRICS) {
    const c = ceMapRuntime.rankingCharts[metricKey];
    if (c) {
      try {
        c.destroy();
      } catch (_) {}
    }
    ceMapRuntime.rankingCharts[metricKey] = null;
  }
  const fz = ceMapRuntime.rankingCharts[CE_RANK_CHART_FORMALIZACAO_MUN];
  if (fz) {
    try {
      fz.destroy();
    } catch (_) {}
  }
  ceMapRuntime.rankingCharts[CE_RANK_CHART_FORMALIZACAO_MUN] = null;
}

/** Monta mapa código IBGE → nome do município (lista derivada do CSV). */
function ceCodigoToNomeMap() {
  const m = new Map();
  for (const row of ceMapRuntime.municipiosList) {
    m.set(row.codigo, row.municipio);
  }
  return m;
}

/**
 * @param {Map<number, {estoque:number,admissoes:number,desligamentos:number,saldos:number}>} aggByCod
 * @param {"estoque"|"admissoes"|"desligamentos"|"saldos"} metricKey
 * @param {"maiores"|"menores"} order
 */
function cePickRankingEntries(aggByCod, metricKey, order) {
  const nomes = ceCodigoToNomeMap();
  const rows = [];
  for (const [cod, vals] of aggByCod.entries()) {
    const v = vals[metricKey];
    if (!Number.isFinite(v)) continue;
    rows.push({
      cod,
      label: nomes.get(cod) || `Código ${cod}`,
      value: v,
    });
  }
  rows.sort((a, b) => (order === "maiores" ? b.value - a.value : a.value - b.value));
  return rows.slice(0, CE_RANKING_TOP_N);
}

function ceUpdateRankingCharts() {
  if (typeof ApexCharts === "undefined") return;

  const orderEl = document.getElementById("mapRankOrder");
  const order = orderEl?.value === "menores" ? "menores" : "maiores";
  const agg = ceMapRuntime.lastAggByCodigo;

  for (const metricKey of CE_GRADUATED_METRICS) {
    const domId = CE_RANK_CHART_IDS[metricKey];
    const el = document.getElementById(domId);
    if (!el) continue;

    const prev = ceMapRuntime.rankingCharts[metricKey];
    if (prev) {
      try {
        prev.destroy();
      } catch (_) {}
      ceMapRuntime.rankingCharts[metricKey] = null;
    }

    const entries = cePickRankingEntries(agg, metricKey, order);
    const seriesData = entries.length
      ? entries.map((e) => ({ x: e.label, y: e.value }))
      : [{ x: "Sem dados no filtro", y: 0 }];

    const cfg = CE_METRIC_CONFIG[metricKey];
    const barColor = cfg.colors[Math.min(3, cfg.colors.length - 1)];

    const h = Math.max(200, 48 + Math.max(entries.length || 1, 1) * 28);

    const chart = new ApexCharts(el, {
      chart: {
        type: "bar",
        height: h,
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { speed: 260 },
        fontFamily: "system-ui, Segoe UI, sans-serif",
        foreColor: "#1f2d78",
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: "72%",
          borderRadius: 4,
          borderRadiusApplication: "end",
        },
      },
      colors: [barColor],
      series: [{ name: cfg.legendTitle, data: seriesData }],
      xaxis: {
        type: "category",
        labels: {
          show: true,
          trim: false,
          hideOverlappingLabels: false,
          style: {
            fontSize: "11px",
            fontWeight: 500,
            colors: "#1f2d78",
          },
        },
      },
      yaxis: {
        labels: {
          style: { fontSize: "11px", colors: "#475569" },
        },
      },
      grid: {
        borderColor: "#e2e8f0",
        padding: { left: 12, right: 18, top: 8, bottom: 8 },
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
      },
      dataLabels: {
        enabled: entries.length > 0,
        formatter: (val) => ceFormatIntPt(Number(val)),
        style: { fontSize: "10px", fontWeight: 600, colors: ["#1e293b"] },
      },
      tooltip: {
        x: { show: true },
        y: {
          formatter: (val) => ceFormatIntPt(Number(val)),
          title: { formatter: () => cfg.legendTitle },
        },
      },
    });

    chart.render();
    ceMapRuntime.rankingCharts[metricKey] = chart;
  }

  const fzPrev = ceMapRuntime.rankingCharts[CE_RANK_CHART_FORMALIZACAO_MUN];
  if (fzPrev) {
    try {
      fzPrev.destroy();
    } catch (_) {}
    ceMapRuntime.rankingCharts[CE_RANK_CHART_FORMALIZACAO_MUN] = null;
  }

  const fzEl = document.getElementById(CE_RANK_CHART_FORMALIZACAO_MUN_DOM_ID);
  if (fzEl) {
    const fzEntries = cePickFormalizacaoMunicipioEntries(agg, order);
    const fzData = fzEntries.length
      ? fzEntries.map((e) => ({ x: e.label, y: e.value }))
      : [{ x: "Sem dados no filtro", y: 0 }];
    const fzH = Math.max(200, 48 + Math.max(fzEntries.length || 1, 1) * 28);
    const fzFmt = (val) =>
      `${new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(val))}%`;

    const fzChart = new ApexCharts(fzEl, {
      chart: {
        type: "bar",
        height: fzH,
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { speed: 260 },
        fontFamily: "system-ui, Segoe UI, sans-serif",
        foreColor: "#1f2d78",
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: "72%",
          borderRadius: 4,
          borderRadiusApplication: "end",
        },
      },
      colors: [CE_FORMALIZACAO_RANK_COLOR],
      series: [{ name: "Formalização", data: fzData }],
      xaxis: {
        type: "category",
        labels: {
          show: true,
          trim: false,
          hideOverlappingLabels: false,
          style: {
            fontSize: "11px",
            fontWeight: 500,
            colors: "#1f2d78",
          },
        },
      },
      yaxis: {
        labels: {
          style: { fontSize: "11px", colors: "#475569" },
        },
      },
      grid: {
        borderColor: "#e2e8f0",
        padding: { left: 12, right: 18, top: 8, bottom: 8 },
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
      },
      dataLabels: {
        enabled: fzEntries.length > 0,
        formatter: (val) => fzFmt(val),
        style: { fontSize: "10px", fontWeight: 600, colors: ["#1e293b"] },
      },
      tooltip: {
        x: { show: true },
        y: {
          formatter: (val) => fzFmt(val),
          title: { formatter: () => "Formalização" },
        },
      },
    });

    fzChart.render();
    ceMapRuntime.rankingCharts[CE_RANK_CHART_FORMALIZACAO_MUN] = fzChart;
  }
}

function ceDestroyRegionSummaryCharts() {
  const rs = ceMapRuntime.regionSummaryCharts;
  if (rs.pie) {
    try {
      rs.pie.destroy();
    } catch (_) {}
    rs.pie = null;
  }
  if (rs.bar) {
    try {
      rs.bar.destroy();
    } catch (_) {}
    rs.bar = null;
  }
  if (rs.formalizacao) {
    try {
      rs.formalizacao.destroy();
    } catch (_) {}
    rs.formalizacao = null;
  }
}

/**
 * Soma estoque e saldos por região administrativa (GeoJSON), com base na agregação municipal atual.
 * @param {Map<number, {estoque:number,admissoes:number,desligamentos:number,saldos:number}>} aggByCod
 */
function ceAggregateTotalsByRegiao(aggByCod) {
  const rows = [];
  for (const [regName, codSet] of ceMapRuntime.regiaoToCodigos.entries()) {
    let estoque = 0;
    let saldos = 0;
    for (const cod of codSet) {
      const v = aggByCod.get(cod);
      if (v) {
        estoque += v.estoque;
        saldos += v.saldos;
      }
    }
    rows.push({ regiao: regName, estoque, saldos });
  }
  rows.sort((a, b) => a.regiao.localeCompare(b.regiao, "pt-BR"));
  return rows;
}

function ceUpdateRegionSummaryCharts() {
  if (typeof ApexCharts === "undefined") return;

  const pieEl = document.getElementById("mapRegionPieEstoque");
  const barEl = document.getElementById("mapRegionBarSaldo");
  const formEl = document.getElementById("mapRegionRankFormalizacao");
  if (!pieEl || !barEl) return;

  ceDestroyRegionSummaryCharts();

  const orderEl = document.getElementById("mapRankOrder");
  const order = orderEl?.value === "menores" ? "menores" : "maiores";

  const agg = ceMapRuntime.lastAggByCodigo;
  const byReg = ceAggregateTotalsByRegiao(agg);

  const pieSource = byReg.filter((r) => r.estoque > 0);
  const pieSeries = pieSource.length ? pieSource.map((r) => r.estoque) : [1];
  const pieLabels = pieSource.length ? pieSource.map((r) => r.regiao) : ["Sem dados no filtro"];
  const pieColors = pieSource.length
    ? pieSource.map((_, i) => CE_REGIAO_PALETTE[i % CE_REGIAO_PALETTE.length])
    : ["#cbd5e1"];

  const pie = new ApexCharts(pieEl, {
    chart: {
      type: "pie",
      height: 380,
      toolbar: { show: false },
      fontFamily: "system-ui, Segoe UI, sans-serif",
      foreColor: "#1f2d78",
      animations: { speed: 280 },
    },
    series: pieSeries,
    labels: pieLabels,
    colors: pieColors,
    legend: {
      position: "bottom",
      fontSize: "11px",
      itemMargin: { horizontal: 10, vertical: 4 },
    },
    dataLabels: {
      enabled: Boolean(pieSource.length && pieSource.length <= 14),
      formatter: (_val, opts) => ceFormatIntPt(Number(pieSeries[opts.seriesIndex])),
      style: { fontSize: "11px", fontWeight: 600 },
    },
    tooltip: {
      y: {
        formatter: (val) => ceFormatIntPt(Number(val)),
      },
    },
    plotOptions: {
      pie: {
        expandOnClick: false,
      },
    },
    stroke: { width: 1, colors: ["#fff"] },
  });

  const barRows = [...byReg].sort((a, b) => b.saldos - a.saldos);
  const barData = barRows.length
    ? barRows.map((r) => ({ x: r.regiao, y: r.saldos }))
    : [{ x: "Sem dados no filtro", y: 0 }];
  const barH = Math.max(320, 44 + Math.max(barRows.length || 1, 1) * 28);

  const bar = new ApexCharts(barEl, {
    chart: {
      type: "bar",
      height: barH,
      toolbar: { show: false },
      fontFamily: "system-ui, Segoe UI, sans-serif",
      foreColor: "#1f2d78",
      animations: { speed: 280 },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "72%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    colors: [CE_METRIC_CONFIG.saldos.colors[3]],
    series: [{ name: "Saldo", data: barData }],
    xaxis: {
      type: "category",
      labels: {
        style: { fontSize: "11px", fontWeight: 500, colors: "#1f2d78" },
        trim: false,
      },
    },
    yaxis: {
      labels: {
        style: { fontSize: "11px", colors: "#475569" },
      },
    },
    grid: {
      borderColor: "#e2e8f0",
      padding: { left: 8, right: 14, top: 8, bottom: 8 },
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: {
      enabled: barRows.length > 0,
      formatter: (val) => ceFormatIntPt(Number(val)),
      style: { fontSize: "10px", fontWeight: 600, colors: ["#1e293b"] },
    },
    tooltip: {
      y: {
        formatter: (val) => ceFormatIntPt(Number(val)),
      },
    },
  });

  let formalizacao = null;
  if (formEl) {
    const fEntries = cePickFormalizacaoRegiaoEntries(agg, order);
    const fData = fEntries.length
      ? fEntries.map((e) => ({ x: e.label, y: e.value }))
      : [{ x: "Sem dados no filtro", y: 0 }];
    const fH = Math.max(320, 44 + Math.max(fEntries.length || 1, 1) * 28);
    const regPctFmt = (val) =>
      `${new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(val))}%`;

    formalizacao = new ApexCharts(formEl, {
      chart: {
        type: "bar",
        height: fH,
        toolbar: { show: false },
        fontFamily: "system-ui, Segoe UI, sans-serif",
        foreColor: "#1f2d78",
        animations: { speed: 280 },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: "72%",
          borderRadius: 4,
          borderRadiusApplication: "end",
        },
      },
      colors: [CE_FORMALIZACAO_RANK_COLOR],
      series: [{ name: "Formalização", data: fData }],
      xaxis: {
        type: "category",
        labels: {
          style: { fontSize: "11px", fontWeight: 500, colors: "#1f2d78" },
          trim: false,
        },
      },
      yaxis: {
        labels: {
          style: { fontSize: "11px", colors: "#475569" },
        },
      },
      grid: {
        borderColor: "#e2e8f0",
        padding: { left: 8, right: 14, top: 8, bottom: 8 },
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
      },
      dataLabels: {
        enabled: fEntries.length > 0,
        formatter: (val) => regPctFmt(val),
        style: { fontSize: "10px", fontWeight: 600, colors: ["#1e293b"] },
      },
      tooltip: {
        y: {
          formatter: (val) => regPctFmt(val),
        },
      },
    });
  }

  pie.render();
  bar.render();
  if (formalizacao) formalizacao.render();
  ceMapRuntime.regionSummaryCharts.pie = pie;
  ceMapRuntime.regionSummaryCharts.bar = bar;
  ceMapRuntime.regionSummaryCharts.formalizacao = formalizacao;
}

function ceGetCurrentFilterRows() {
  const mesEl = document.getElementById("mapFilterMes");
  const anoEl = document.getElementById("mapFilterAno");
  const munEl = document.getElementById("mapFilterMunicipio");
  const regEl = document.getElementById("mapFilterRegiao");
  const mesSel = new Set(Array.from(mesEl?.selectedOptions || []).map((o) => o.value));
  const anoSel = new Set(Array.from(anoEl?.selectedOptions || []).map((o) => o.value));
  const munSel = new Set(Array.from(munEl?.selectedOptions || []).map((o) => o.value));
  const regSel = new Set(Array.from(regEl?.selectedOptions || []).map((o) => o.value));
  return ceGetFilteredRows(ceGetCurrentTemporalRows(), mesSel, munSel, regSel, anoSel);
}

/** Soma admissões e desligamentos por rótulo mês/ano, ordenado cronologicamente. */
function ceAggregateAdmDeslPorMes(rows) {
  /** @type {Map<string, { admissoes: number; desligamentos: number }>} */
  const m = new Map();
  for (const r of rows) {
    const k = ceRowMesAnoKey(r);
    if (!k) continue;
    const cur = m.get(k) || { admissoes: 0, desligamentos: 0 };
    cur.admissoes += r.admissoes;
    cur.desligamentos += r.desligamentos;
    m.set(k, cur);
  }
  const keys = [...m.keys()].sort((a, b) => ceMesAnoKeyRank(a) - ceMesAnoKeyRank(b));
  return {
    categories: keys.map((k) => ceFormatMesAnoFromKey(k)),
    admissoes: keys.map((k) => m.get(k).admissoes),
    desligamentos: keys.map((k) => m.get(k).desligamentos),
  };
}

/** Soma saldos por rótulo mês/ano, ordenado cronologicamente. */
function ceAggregateSaldoPorMes(rows) {
  /** @type {Map<string, number>} */
  const m = new Map();
  for (const r of rows) {
    const k = ceRowMesAnoKey(r);
    if (!k) continue;
    const cur = m.get(k) ?? 0;
    m.set(k, cur + r.saldos);
  }
  const keys = [...m.keys()].sort((a, b) => ceMesAnoKeyRank(a) - ceMesAnoKeyRank(b));
  return {
    categories: keys.map((k) => ceFormatMesAnoFromKey(k)),
    saldos: keys.map((k) => m.get(k) ?? 0),
  };
}

function ceDestroyMonthlyLineChart() {
  const c = ceMapRuntime.monthlyLineChart;
  if (c) {
    try {
      c.destroy();
    } catch (_) {}
    ceMapRuntime.monthlyLineChart = null;
  }
}

function ceUpdateMonthlyLineChart() {
  if (typeof ApexCharts === "undefined") return;

  const el = document.getElementById("mapLineAdmDes");
  if (!el) return;

  ceDestroyMonthlyLineChart();

  const rows = ceGetCurrentFilterRows();
  const { categories, admissoes, desligamentos } = ceAggregateAdmDeslPorMes(rows);

  const hasData = categories.length > 0;
  const cats = hasData ? categories : ["Sem dados no filtro"];
  const adm = hasData ? admissoes : [0];
  const des = hasData ? desligamentos : [0];

  const chart = new ApexCharts(el, {
    chart: {
      type: "line",
      height: 420,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "system-ui, Segoe UI, sans-serif",
      foreColor: "#1f2d78",
      animations: { speed: 320 },
    },
    series: [
      { name: "Admissões", data: adm },
      { name: "Desligamentos", data: des },
    ],
    xaxis: {
      categories: cats,
      labels: {
        rotate: hasData && cats.length > 8 ? -35 : 0,
        rotateAlways: false,
        hideOverlappingLabels: true,
        style: { fontSize: "11px", colors: "#475569" },
      },
      axisBorder: { color: "#cbd5e1" },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (val) => ceFormatIntPt(Number(val)),
        style: { fontSize: "11px", colors: "#475569" },
      },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    colors: [CE_METRIC_CONFIG.admissoes.colors[3], CE_METRIC_CONFIG.desligamentos.colors[3]],
    markers: {
      size: hasData ? 4 : 0,
      strokeWidth: 2,
      hover: { size: 6 },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      fontSize: "12px",
      fontWeight: 600,
      markers: { width: 12, height: 12, radius: 3 },
    },
    grid: {
      borderColor: "#e2e8f0",
      strokeDashArray: 4,
      padding: { left: 8, right: 12, top: 10, bottom: 4 },
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val) => ceFormatIntPt(Number(val)),
      },
    },
    dataLabels: {
      enabled: false,
    },
  });

  chart.render();
  ceMapRuntime.monthlyLineChart = chart;
}

/** Azul sólido alinhado ao restante do painel (saldo temporal). */
const CE_SALDO_MES_BAR_COLOR = "#1e40af";

function ceDestroyMonthlySaldoChart() {
  const c = ceMapRuntime.monthlySaldoChart;
  if (c) {
    try {
      c.destroy();
    } catch (_) {}
    ceMapRuntime.monthlySaldoChart = null;
  }
}

function ceUpdateMonthlySaldoChart() {
  if (typeof ApexCharts === "undefined") return;

  const el = document.getElementById("mapBarSaldoMes");
  if (!el) return;

  ceDestroyMonthlySaldoChart();

  const rows = ceGetCurrentFilterRows();
  const { categories, saldos } = ceAggregateSaldoPorMes(rows);

  const hasData = categories.length > 0;
  const cats = hasData ? categories : ["Sem dados no filtro"];
  const vals = hasData ? saldos : [0];

  let yMin;
  let yMax;
  if (hasData && vals.length) {
    let lo = Math.min(...vals);
    let hi = Math.max(...vals);
    if (lo === hi) {
      const pad = Math.max(Math.abs(lo) * 0.15, 1);
      lo -= pad;
      hi += pad;
    }
    const span = hi - lo;
    const padY = span * 0.12 + 1;
    yMin = lo - padY;
    yMax = hi + padY;
    if (lo >= 0) yMin = Math.min(0, yMin - span * 0.05);
    if (hi <= 0) yMax = Math.max(0, yMax + span * 0.05);
  }

  const chart = new ApexCharts(el, {
    chart: {
      type: "bar",
      height: 400,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "system-ui, Segoe UI, sans-serif",
      foreColor: "#1f2d78",
      animations: { speed: 320 },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "58%",
        borderRadius: 3,
        borderRadiusApplication: "end",
      },
    },
    series: [{ name: "Saldo", data: vals }],
    xaxis: {
      categories: cats,
      labels: {
        rotate: hasData && cats.length > 10 ? -35 : 0,
        rotateAlways: false,
        hideOverlappingLabels: true,
        style: { fontSize: "11px", colors: "#475569" },
      },
      axisBorder: { color: "#cbd5e1" },
      axisTicks: { show: false },
    },
    yaxis: {
      min: hasData ? yMin : undefined,
      max: hasData ? yMax : undefined,
      labels: {
        formatter: (v) => ceFormatIntPt(Number(v)),
        style: { fontSize: "11px", colors: "#475569" },
      },
    },
    colors: [CE_SALDO_MES_BAR_COLOR],
    grid: {
      borderColor: "#e2e8f0",
      strokeDashArray: 4,
      padding: { left: 8, right: 12, top: 18, bottom: 4 },
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: {
      enabled: hasData,
      formatter: (val) => ceFormatIntPt(Number(val)),
      offsetY: -6,
      style: { fontSize: "10px", fontWeight: 600, colors: ["#0f172a"] },
    },
    tooltip: {
      y: {
        formatter: (val) => ceFormatIntPt(Number(val)),
      },
    },
    annotations: hasData
      ? {
          yaxis: [
            {
              y: 0,
              borderColor: "#64748b",
              strokeDashArray: 0,
              borderWidth: 1,
              opacity: 0.65,
              label: { show: false },
            },
          ],
        }
      : {},
    legend: { show: false },
  });

  chart.render();
  ceMapRuntime.monthlySaldoChart = chart;
}

/**
 * Reconstrói o `<select>` de municípios (respeita o campo de busca).
 * @param {Set<string>|undefined} preferredSelection — se definido, usa esta seleção em vez da atual no DOM.
 */
function ceRebuildMunicipioOptions(preferredSelection) {
  if (!ceMapRuntime.municipiosList.length) return;
  const sel = document.getElementById("mapFilterMunicipio");
  const searchEl = document.getElementById("mapFilterMunSearch");
  if (!sel) return;
  const q = (searchEl?.value || "").trim().toLowerCase();
  const selected =
    preferredSelection !== undefined
      ? preferredSelection
      : new Set(Array.from(sel.selectedOptions).map((o) => o.value));

  sel.innerHTML = "";
  for (const { codigo, municipio } of ceMapRuntime.municipiosList) {
    const codStr = String(codigo);
    const match = !q || municipio.toLowerCase().includes(q);
    const isSel = selected.has(codStr);
    if (!match && !isSel) continue;
    const opt = document.createElement("option");
    opt.value = codStr;
    opt.textContent = municipio;
    if (isSel) opt.selected = true;
    sel.appendChild(opt);
  }
}

/** Ao escolher região(ões), marca no filtro todos os municípios dessas regiões (GeoJSON). Sem região → limpa o filtro de municípios (= todos). */
function ceSyncMunicipiosFromRegioes() {
  const regEl = document.getElementById("mapFilterRegiao");
  if (!regEl || !ceMapRuntime.municipiosList.length) return;

  const regSel = new Set(Array.from(regEl.selectedOptions).map((o) => o.value));
  /** @type {Set<string>} */
  const codes = new Set();
  if (regSel.size > 0) {
    const valid = new Set(ceMapRuntime.municipiosList.map((x) => String(x.codigo)));
    for (const name of regSel) {
      const set = ceMapRuntime.regiaoToCodigos.get(name);
      if (!set) continue;
      for (const c of set) {
        const cs = String(c);
        if (valid.has(cs)) codes.add(cs);
      }
    }
  }
  ceRebuildMunicipioOptions(codes);
}

/**
 * Monta o select de meses. Se `selAnoForMonthList` tiver ano(s), só entram períodos daquele(s) ano(s).
 * Set vazio = todos os meses presentes na base.
 */
function cePopulateMesSelect(rows, selAnoForMonthList) {
  if (ceIsDinheiroNaMaoMode() || cePendingPageMode === "dinheiro_na_mao") {
    window.dinheiroNaMaoApi?.syncTemporalFilters?.();
    return;
  }
  if (ceIsQualificacaoMode()) {
    /* qualificacao removida */
    return;
  }
  const sel = document.getElementById("mapFilterMes");
  if (!sel) return;
  const prevSelected = new Set(Array.from(sel.selectedOptions).map((o) => o.value));
  const filterByYear = selAnoForMonthList && selAnoForMonthList.size > 0;

  const keySet = new Set();
  for (const r of rows) {
    const k = ceRowMesAnoKey(r);
    if (!k) continue;
    if (filterByYear) {
      const y = /^(\d{4})-/.exec(k)?.[1];
      if (!y || !selAnoForMonthList.has(y)) continue;
    }
    keySet.add(k);
  }
  const mesSorted = [...keySet].sort((a, b) => ceMesAnoKeyRank(a) - ceMesAnoKeyRank(b));
  sel.innerHTML = "";
  for (const k of mesSorted) {
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = ceFormatMesAnoFromKey(k);
    if (prevSelected.has(k)) opt.selected = true;
    sel.appendChild(opt);
  }
}

/** Recalcula opções de mês conforme ano(s) marcado(s) no filtro. */
function ceRefreshMesOptionsFromAnoFilter() {
  const anoEl = document.getElementById("mapFilterAno");
  const anoSel = new Set(Array.from(anoEl?.selectedOptions || []).map((o) => o.value));
  cePopulateMesSelect(ceGetCurrentTemporalRows(), anoSel);
}

function cePopulateAnoSelect(rows) {
  if (ceIsDinheiroNaMaoMode() || cePendingPageMode === "dinheiro_na_mao") {
    window.dinheiroNaMaoApi?.syncTemporalFilters?.();
    return;
  }
  if (ceIsQualificacaoMode()) {
    /* qualificacao removida */
    return;
  }
  const sel = document.getElementById("mapFilterAno");
  if (!sel) return;
  const years = new Set();
  for (const r of rows) {
    const k = ceRowMesAnoKey(r);
    const y = k && /^(\d{4})-/.exec(k)?.[1];
    if (y) years.add(y);
  }
  const sorted = [...years].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  sel.innerHTML = "";
  for (const y of sorted) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    sel.appendChild(opt);
  }
}

function ceSyncTemporalFiltersForCurrentMode() {
  if (ceIsDinheiroNaMaoMode() || cePendingPageMode === "dinheiro_na_mao") {
    window.dinheiroNaMaoApi?.syncTemporalFilters?.();
    return;
  }
  if (ceIsCagedGrupamentosMode() || ceIsCagedGrupamentosSheet(cePendingPageMode)) {
    window.cagedGrupamentosApi?.syncTemporalFilters?.();
    return;
  }
  if (ceIsQualificacaoMode()) {
    /* qualificacao removida */
    return;
  }
  const anoEl = document.getElementById("mapFilterAno");
  const mesEl = document.getElementById("mapFilterMes");
  const prevAno = new Set(Array.from(anoEl?.selectedOptions || []).map((o) => o.value));
  const prevMes = new Set(Array.from(mesEl?.selectedOptions || []).map((o) => o.value));
  const rows = ceGetCurrentTemporalRows();

  cePopulateAnoSelect(rows);
  if (anoEl) {
    Array.from(anoEl.options).forEach((opt) => {
      opt.selected = prevAno.has(opt.value);
    });
    // Para camadas de intermediação sem ano previamente selecionado, auto-seleciona o mais recente
    const activeLayerKey = ceGetSelectedProfileLayerKey();
    if (CE_PROFILE_LAYER_CONFIG[activeLayerKey]?.parseMode === "intermediacao") {
      const anySelected = Array.from(anoEl.options).some((o) => o.selected);
      if (!anySelected && anoEl.options.length > 0) {
        anoEl.options[anoEl.options.length - 1].selected = true;
      }
    }
  }

  const appliedAno = new Set(Array.from(anoEl?.selectedOptions || []).map((o) => o.value));
  cePopulateMesSelect(rows, appliedAno);
  if (mesEl) {
    const keepMes = ceIsPerfilMunicipalMode() && !ceIsProfileWideYearLayer(ceGetSelectedProfileLayerKey());
    Array.from(mesEl.options).forEach((opt) => {
      opt.selected = keepMes && prevMes.has(opt.value);
    });
  }
}

function cePopulateRegiaoSelect(geojson) {
  const sel = document.getElementById("mapFilterRegiao");
  if (!sel) return;
  const selected = new Set(Array.from(sel.selectedOptions).map((o) => o.value));
  const names = ceCollectRegionNamesFromGeojson(geojson);
  sel.innerHTML = "";
  for (const name of names) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    if (selected.has(name)) opt.selected = true;
    sel.appendChild(opt);
  }
}

function ceBuildMunicipiosList(rows) {
  const munMap = new Map();
  for (const r of rows) {
    if (!munMap.has(r.codigo)) munMap.set(r.codigo, r.municipio);
  }
  return [...munMap.entries()]
    .map(([codigo, municipio]) => ({ codigo, municipio }))
    .sort((a, b) => a.municipio.localeCompare(b.municipio, "pt-BR"));
}

/** Seleciona apenas um município no filtro e reaplica os filtros no mapa/gráficos. */
function ceSelectSingleMunicipioFromMap(codigo) {
  if (codigo == null) return;
  const codStr = String(codigo);
  const exists = ceMapRuntime.municipiosList.some((m) => String(m.codigo) === codStr);
  if (!exists) return;
  ceRebuildMunicipioOptions(new Set([codStr]));
  ceApplyMapFilters();
}

/** Limpa a seleção de municípios (nenhum marcado = todos). */
function ceClearMunicipioSelectionFromMap() {
  ceRebuildMunicipioOptions(new Set());
  ceApplyMapFilters();
}

function ceApplyMapFilters() {
  const map = ceMapRuntime.map;

  const mesEl = document.getElementById("mapFilterMes");
  const anoEl = document.getElementById("mapFilterAno");
  const munEl = document.getElementById("mapFilterMunicipio");
  const regEl = document.getElementById("mapFilterRegiao");
  const mesSel = new Set(Array.from(mesEl?.selectedOptions || []).map((o) => o.value));
  const anoSel = new Set(Array.from(anoEl?.selectedOptions || []).map((o) => o.value));
  const munSel = new Set(Array.from(munEl?.selectedOptions || []).map((o) => o.value));
  const regSel = new Set(Array.from(regEl?.selectedOptions || []).map((o) => o.value));

  /* Sedes: sempre acompanham o filtro de município (mesmo com early-return das abas). */
  if (map) ceSetSedesLayersVisibility(map, ceIsSedesOverlayOn());

  if (ceIsVaiVemMode()) {
    window.vaiVemApi?.refresh?.();
    return;
  }

  if (ceIsCagedGrupamentosMode()) {
    window.cagedGrupamentosApi?.refresh?.();
    return;
  }

  if (ceIsSeguroDesempregoMode()) {
    window.seguroDesempregoApi?.refresh?.();
    return;
  }

  if (ceIsDinheiroNaMaoMode()) {
    window.dinheiroNaMaoApi?.refresh?.();
    return;
  }

  if (ceIsQualificacaoMode()) {
    /* qualificacao removida */
    return;
  }

  if (ceIsPerfilMunicipalMode()) {
    ceSyncProfileLayerUi();
    const { aggByLayer, filteredByLayer } = ceBuildProfileAggByLayer(mesSel, munSel, regSel, anoSel);
    ceMapRuntime.lastProfileAggByLayer = aggByLayer;
    ceMapRuntime.lastProfileFilteredByLayer = filteredByLayer;
    ceUpdateProfileKpis(ceComputeProfileKpiMetricsFromAgg(aggByLayer, filteredByLayer, munSel, regSel));
    ceUpdateProfileSummaryCharts(aggByLayer);
    ceUpdateProfileCearaCredLineChart(munSel, regSel);
    ceUpdateProfilePibLineChart(
      filteredByLayer[ceGetSelectedProfileLayerKey()] || [],
      anoSel
    );
    if (ceIsIntermediacaoMode()) {
      ceUpdateIntermediacaoLineChart(munSel, regSel, anoSel);
    } else {
      ceDestroyIntermediacaoLineChart();
    }

    if (!map || !map.getSource("ce-regioes")) return;

    const profileRows = ceMapRuntime.profileRowsByLayer[ceGetSelectedProfileLayerKey()] || [];
    const filteredProfile = ceGetFilteredRows(profileRows, mesSel, munSel, regSel, anoSel);
    const profileLayerKey = ceGetSelectedProfileLayerKey();
    const sumCearaCredOnMap = profileLayerKey === "ceara_cred";
    const isIntermedicaoOnMap =
      CE_PROFILE_LAYER_CONFIG[profileLayerKey]?.parseMode === "intermediacao";
    const aggProfile = ceAggregateProfileByCodigo(filteredProfile, {
      sumAllPeriods: sumCearaCredOnMap || isIntermedicaoOnMap,
    });
    ceMapRuntime.profileLastAggByCodigo = aggProfile;
    const mergedProfile = ceMergeProfileIntoGeojson(
      ceMapRuntime.geoJsonBase,
      aggProfile,
      { nullifyZero: isIntermedicaoOnMap }
    );
    ceMapRuntime.currentMergedGeoJson = mergedProfile;
    try {
      map.getSource("ce-regioes").setData(mergedProfile);
      ceScheduleMapVisualizationRefresh();
    } catch (e) {
      console.warn("Atualizar mapa Perfil Municipal:", e);
    }
    return;
  }

  if (!map || !map.getSource("ce-regioes")) return;

  ceSyncProfileLayerUi();
  ceDestroyProfileSummaryCharts();
  ceDestroyProfilePibLineChart();
  ceDestroyProfileCearaCredLineChart();

  const filtered = ceGetFilteredRows(ceMapRuntime.allRows, mesSel, munSel, regSel, anoSel);
  ceUpdateMapKpis(ceComputeMapKpiTotals(filtered, munSel, regSel));

  const aggByCod = ceAggregateByCodigo(filtered);
  ceMapRuntime.lastAggByCodigo = aggByCod;

  const merged = ceMergeCagedIntoGeojson(ceMapRuntime.geoJsonBase, aggByCod);
  ceMapRuntime.currentMergedGeoJson = merged;
  ceRefreshLayerStats(merged);

  try {
    map.getSource("ce-regioes").setData(merged);
    ceApplyVisualization();
  } catch (e) {
    console.warn("Atualizar mapa CAGED:", e);
  }
  ceUpdateRankingCharts();
  ceUpdateRegionSummaryCharts();
  ceUpdateMonthlyLineChart();
  ceUpdateMonthlySaldoChart();
}

function cePropsMunReg(p) {
  const raw = p || {};
  const mun =
    raw.Municipio ||
    raw.MUNICIPIO ||
    raw.municipio ||
    raw.NM_MUN ||
    raw.NOME ||
    "";
  const reg =
    raw["Região"] ||
    raw["REGIÃO"] ||
    raw.Regiao ||
    raw.regiao ||
    raw.REGIAO ||
    "";
  return { municipio: String(mun).trim(), regiao: String(reg).trim() };
}

function ceEscapeHtml(s) {
  if (s == null) return "";
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

/** Expande bbox [minLng, minLat, maxLng, maxLat] a partir de coordenadas GeoJSON. */
function ceExpandBboxFromCoords(coords, bbox) {
  if (!coords) return;
  if (typeof coords[0] === "number") {
    const lng = coords[0];
    const lat = coords[1];
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
    bbox[0] = Math.min(bbox[0], lng);
    bbox[1] = Math.min(bbox[1], lat);
    bbox[2] = Math.max(bbox[2], lng);
    bbox[3] = Math.max(bbox[3], lat);
    return;
  }
  for (const c of coords) ceExpandBboxFromCoords(c, bbox);
}

/**
 * Enquadra o mapa nas regiões administrativas selecionadas no filtro
 * (ex.: Grande Fortaleza + Litoral Leste).
 * @param {string[] | null} [regiaoNames]
 * @param {{ duration?: number, maxZoom?: number }} [options]
 */
function ceFitMapToSelectedRegioes(regiaoNames = null, options = {}) {
  const map = ceMapRuntime.map;
  const geojson = ceMapRuntime.currentMergedGeoJson || ceMapRuntime.geoJsonBase;
  if (!map || !geojson?.features?.length) return false;

  let names = Array.isArray(regiaoNames) ? regiaoNames.filter(Boolean) : null;
  if (!names || !names.length) {
    const sel = document.getElementById("mapFilterRegiao");
    names = Array.from(sel?.selectedOptions || [])
      .map((o) => String(o.value || "").trim())
      .filter(Boolean);
  }
  if (!names.length) return false;

  const allowed = new Set();
  for (const name of names) {
    const set = ceMapRuntime.regiaoToCodigos?.get(name);
    if (!set) continue;
    for (const c of set) allowed.add(Number(c));
  }
  if (!allowed.size) return false;

  const bbox = [Infinity, Infinity, -Infinity, -Infinity];
  let hits = 0;
  for (const f of geojson.features) {
    const cod = ceGeoCodiToCodigoMunicipio(f.properties?.GEO_CODI);
    if (cod == null || !allowed.has(cod)) continue;
    ceExpandBboxFromCoords(f.geometry?.coordinates, bbox);
    hits += 1;
  }
  if (!hits || !Number.isFinite(bbox[0])) return false;

  map.fitBounds(
    [
      [bbox[0], bbox[1]],
      [bbox[2], bbox[3]],
    ],
    {
      padding: { top: 36, bottom: 48, left: 36, right: 36 },
      maxZoom: options.maxZoom ?? 9.2,
      duration: options.duration ?? 700,
    }
  );
  return true;
}

function ceSedeFeatureNomePop(props) {
  const p = props || {};
  const nome = String(p.MUNICIPIO || p.municipio || "").trim() || "—";
  const raw = p.populacao ?? p.POPULACAO ?? "";
  const digits = String(raw).replace(/\D/g, "");
  const n = digits ? Number(digits) : NaN;
  const popTxt = Number.isFinite(n) ? ceFormatIntPt(n) : "—";
  return { nome, popTxt };
}

function ceBuildSedeHoverHtml(props) {
  const { nome, popTxt } = ceSedeFeatureNomePop(props);
  return `
    <section class="map-ce-popup map-ce-popup--sede" style="--map-popup-accent:${ceEscapeHtml(CE_SEDE_POINT_COLOR)}" role="group" aria-label="Sede municipal">
      <header class="map-ce-popup__head">
        <h4 class="map-ce-popup__title">
          <span class="map-ce-popup__icon" aria-hidden="true"><i class="fa-solid fa-location-dot"></i></span>
          ${ceEscapeHtml(nome)}
        </h4>
      </header>
      <div class="map-ce-popup__grid">
        <div class="map-ce-popup__row">
          <span class="map-ce-popup__label">
            <span class="map-ce-popup__icon map-ce-popup__icon--label" aria-hidden="true"><i class="fa-solid fa-users"></i></span>
            População
          </span>
          <strong class="map-ce-popup__value map-ce-popup__value--metric">${ceEscapeHtml(popTxt)}</strong>
        </div>
      </div>
    </section>
  `;
}

function ceFormatPopupFieldValue(format, value) {
  if (value == null || String(value).trim() === "") return "—";
  if (format === "int") {
    const n = Number(value);
    return Number.isFinite(n) ? ceFormatIntPt(n) : "—";
  }
  if (format === "currency") {
    const n = Number(value);
    return Number.isFinite(n) ? ceFormatCurrencyPt(n) : "—";
  }
  return String(value).trim();
}

function ceBuildPlanejamentoPopupHtml(props) {
  const nome = String(props?.REGIAO_D1 || props?.regiao_d1 || "—").trim() || "—";
  const areaRaw = props?.AREA_KM22 ?? props?.area_km22;
  const areaNum = Number(String(areaRaw ?? "").replace(",", "."));
  const areaTxt = Number.isFinite(areaNum)
    ? `${areaNum.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km²`
    : areaRaw
      ? String(areaRaw)
      : "—";
  return `
    <div class="map-ce-popup map-ce-popup--planejamento">
      <p class="map-ce-popup__title">Região de planejamento</p>
      <p class="map-ce-popup__row">
        <span class="map-ce-popup__label">Região</span>
        <strong class="map-ce-popup__value">${ceEscapeHtml(nome)}</strong>
      </p>
      <p class="map-ce-popup__row">
        <span class="map-ce-popup__label">Área</span>
        <strong class="map-ce-popup__value">${ceEscapeHtml(areaTxt)}</strong>
      </p>
    </div>
  `;
}

function ceBuildMapPopupHtml({ municipio, regiao, indicador, valor, accentColor }) {
  const metricRow = indicador
    ? `
        <div class="map-ce-popup__row">
          <span class="map-ce-popup__label">
            <span class="map-ce-popup__icon map-ce-popup__icon--label" aria-hidden="true"><i class="fa-solid fa-chart-column"></i></span>
            ${ceEscapeHtml(indicador)}
          </span>
          <strong class="map-ce-popup__value map-ce-popup__value--metric">${ceEscapeHtml(valor || "—")}</strong>
        </div>`
    : "";
  return `
    <section class="map-ce-popup" style="--map-popup-accent:${ceEscapeHtml(accentColor || "#1d4ed8")}" role="group" aria-label="Detalhes do município">
      <header class="map-ce-popup__head">
        <h4 class="map-ce-popup__title">
          <span class="map-ce-popup__icon" aria-hidden="true"><i class="fa-solid fa-city"></i></span>
          ${ceEscapeHtml(municipio || "Município não identificado")}
        </h4>
      </header>
      <div class="map-ce-popup__grid">
        <div class="map-ce-popup__row">
          <span class="map-ce-popup__label">
            <span class="map-ce-popup__icon map-ce-popup__icon--label" aria-hidden="true"><i class="fa-solid fa-map-location-dot"></i></span>
            Região administrativa
          </span>
          <strong class="map-ce-popup__value">${ceEscapeHtml(regiao || "—")}</strong>
        </div>
        ${metricRow}
      </div>
    </section>
  `;
}

function ceGetSelectedAnoLabels() {
  const anoEl = document.getElementById("mapFilterAno");
  return Array.from(anoEl?.selectedOptions || [])
    .map((o) => o.value)
    .filter(Boolean);
}

function ceBuildProfileMapPopupHtml({ municipio, regiao, accentColor, layerCfg, row }) {
  const isIntermedicao = layerCfg?.parseMode === "intermediacao";
  const fieldRows = (layerCfg?.popupFields || [])
    .map((field) => {
      const rawValue =
        field.key === "pessoas" || (isIntermedicao && field.key === "real")
          ? row?.pessoas
          : field.key === "referencia" && isIntermedicao
            ? (() => {
                const anos = ceGetSelectedAnoLabels();
                if (anos.length === 1) return `Total em ${anos[0]}`;
                if (anos.length > 1) return `Total em ${anos.join(", ")}`;
                return row?.mesAno || row?.raw?.referencia || "—";
              })()
          : field.key === "ano"
            ? row?.raw?.ano || row?.mesAno
            : field.metric && row?.metrics && field.key in row.metrics
              ? row.metrics[field.key]
              : row?.raw?.[ceNormalizeKey(field.key)] ?? row?.raw?.[field.key];
      return `
        <div class="map-ce-popup__row">
          <span class="map-ce-popup__label">
            <span class="map-ce-popup__icon map-ce-popup__icon--label" aria-hidden="true"><i class="fa-solid fa-chart-column"></i></span>
            ${ceEscapeHtml(field.label)}
          </span>
          <strong class="map-ce-popup__value map-ce-popup__value--metric">${ceEscapeHtml(
            ceFormatPopupFieldValue(field.format, rawValue)
          )}</strong>
        </div>`;
    })
    .join("");

  return `
    <section class="map-ce-popup" style="--map-popup-accent:${ceEscapeHtml(accentColor || "#1d4ed8")}" role="group" aria-label="Detalhes do município">
      <header class="map-ce-popup__head">
        <h4 class="map-ce-popup__title">
          <span class="map-ce-popup__icon" aria-hidden="true"><i class="fa-solid fa-city"></i></span>
          ${ceEscapeHtml(municipio || "Município não identificado")}
        </h4>
      </header>
      <div class="map-ce-popup__grid">
        <div class="map-ce-popup__row">
          <span class="map-ce-popup__label">
            <span class="map-ce-popup__icon map-ce-popup__icon--label" aria-hidden="true"><i class="fa-solid fa-map-location-dot"></i></span>
            Região administrativa
          </span>
          <strong class="map-ce-popup__value">${ceEscapeHtml(regiao || "—")}</strong>
        </div>
        ${fieldRows}
      </div>
    </section>
  `;
}

function ceBuildIdtPopupHtml(props) {
  const p = props || {};
  const row = (icon, label, value) =>
    value
      ? `<div class="map-ce-popup__row">
          <span class="map-ce-popup__label"><span class="map-ce-popup__icon map-ce-popup__icon--label" aria-hidden="true"><i class="fa-solid ${icon}"></i></span>${ceEscapeHtml(label)}</span>
          <strong class="map-ce-popup__value">${ceEscapeHtml(value)}</strong>
        </div>`
      : "";
  return `
    <section class="map-ce-popup map-ce-popup--idt" style="--map-popup-accent:#fe840a;--map-popup-bg-start:#ffffff;--map-popup-bg-end:#f5f7fa;--map-popup-title:#259b3e;--map-popup-label:#fe840a;--map-popup-value:#259b3e" role="group" aria-label="Detalhes da unidade IDT">
      <header class="map-ce-popup__head">
        <h4 class="map-ce-popup__title">
          <span class="map-ce-popup__icon" aria-hidden="true"><i class="fa-solid fa-building-user"></i></span>
          ${ceEscapeHtml(p.unidade || "Unidade IDT")}
        </h4>
      </header>
      <div class="map-ce-popup__grid">
        ${row("fa-location-dot", "Município", p.municipio)}
        ${row("fa-layer-group", "Posto", p.unidade)}
        ${row("fa-user", "Responsável", p.responsavel)}
        ${row("fa-map-pin", "Bairro", p.bairro)}
        ${row("fa-road", "Endereço", p.endereco)}
        ${row("fa-phone", "Telefone", p.telefone)}
        ${row("fa-mobile-screen", "Celular", p.celular)}
      </div>
    </section>
  `;
}

function ceWireMapFiltersDelegation() {
  const root = document.getElementById("secaoMapaCe");
  if (!root || root.dataset.ceFiltersBound === "1") return;
  root.dataset.ceFiltersBound = "1";

  root.addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "mapFilterRegiao") {
      if (ceIsCagedGrupamentosMode()) {
        window.cagedGrupamentosApi?.syncMunicipiosFromRegiao?.();
      } else if (ceIsSeguroDesempregoMode()) {
        window.seguroDesempregoApi?.syncMunicipiosFromRegiao?.();
      } else if (ceIsDinheiroNaMaoMode()) {
        window.dinheiroNaMaoApi?.syncMunicipiosFromRegiao?.();
      } else if (ceIsQualificacaoMode()) {
        /* qualificacao removida */
      } else {
        ceSyncMunicipiosFromRegioes();
      }
    }
    if (t.id === "mapFilterVaiVemRegiao" && ceIsVaiVemMode()) {
      window.vaiVemApi?.syncMunicipiosFromRegiao?.();
    }
    if (t.id === "mapFilterAno" && !ceIsQualificacaoMode() && !ceIsDinheiroNaMaoMode() && !ceIsCagedGrupamentosMode()) {
      ceRefreshMesOptionsFromAnoFilter();
    }
    if (t.id === "mapFilterMes" || t.id === "mapFilterAno" || t.id === "mapFilterMunicipio" || t.id === "mapFilterRegiao" || t.id === "mapFilterVaiVemRegiao") {
      ceMapRuntime.activeLegendClass = null;
      if (ceIsCagedGrupamentosMode()) {
        const map = ceMapRuntime.map;
        if (map) ceSetSedesLayersVisibility(map, ceIsSedesOverlayOn());
        window.cagedGrupamentosApi?.refresh?.();
      } else {
        ceApplyMapFilters();
      }
    }
    if (t.id === "mapLayerStyle") {
      ceMapRuntime.activeLegendClass = null;
      ceApplyVisualization();
    }
    if (t.id === "mapProfileLayerStyle") {
      ceMapRuntime.activeLegendClass = null;
      ceSyncTemporalFiltersForCurrentMode();
      ceApplyMapFilters();
    }
    if (t.id === "mapVaiVemLayerStyle") {
      ceMapRuntime.activeLegendClass = null;
      window.vaiVemApi?.refreshMap?.();
    }
    if (t.id === "mapCagedGrupLayerStyle" || t.id === "mapCagedGrupMetricStyle") {
      ceMapRuntime.activeLegendClass = null;
      window.cagedGrupamentosApi?.refreshMap?.();
    }
    if (t.id === "mapSeguroDesempregoLayerStyle") {
      ceMapRuntime.activeLegendClass = null;
      window.seguroDesempregoApi?.refresh?.();
    }
    if (t.id === "mapDinheiroNaMaoLayerStyle") {
      ceMapRuntime.activeLegendClass = null;
      window.dinheiroNaMaoApi?.refresh?.();
    }
    if (t.id === "mapQualificacaoLayerStyle" || t.id === "mapQualificacaoExecutoraStyle") {
      ceMapRuntime.activeLegendClass = null;
      /* qualificacao removida */
    }
    if (t.id === "mapRankOrder") {
      ceUpdateRankingCharts();
      ceUpdateRegionSummaryCharts();
    }
    if (t.closest?.("#mapCearaCredLineFilters")) {
      ceRefreshCearaCredLineChart();
    }
    if (t.closest?.("#mapIntermediacaoLineFilters")) {
      ceRefreshIntermediacaoLineChart();
    }
  });

  root.addEventListener("click", (e) => {
    // ── Filtro por classe de legenda ──
    const legendItem = e.target.closest("[data-legend-class]");
    if (legendItem) {
      const clickedIdx = parseInt(legendItem.getAttribute("data-legend-class"), 10);
      ceMapRuntime.activeLegendClass =
        ceMapRuntime.activeLegendClass === clickedIdx ? null : clickedIdx;
      ceApplyVisualization();
      if (ceIsPerfilMunicipalMode() && ceMapRuntime.lastProfileAggByLayer) {
        ceUpdateProfileSummaryCharts(ceMapRuntime.lastProfileAggByLayer);
        const fb = ceMapRuntime.lastProfileFilteredByLayer;
        ceRefreshCearaCredLineChart();
      }
      return;
    }

    const profileSortBtn = e.target.closest(
      "#mapProfileSortToggle, #mapProfileSortToggleCeara, #mapProfileSortToggleMunSimples, #mapProfileSortToggleEmpresaGrupamento, #mapProfileSortToggleEmpresasVinculos, #mapProfileSortToggleVinculoEscolaridade, #mapProfileSortToggleVinculoSexo, #mapProfileSortTogglePib"
    );
    if (profileSortBtn) {
      ceToggleProfileSortOrder();
      ceApplyMapFilters();
      return;
    }
    const toggleBtn = e.target.closest(
      "#mapToggleRegiao, #mapTogglePlanejamento, #mapToggleUnidades, #mapToggleQualificacaoCursos, #mapToggleQualificacaoHeat, #mapToggleSedes, #mapToggleSalarioMedio"
    );
    if (toggleBtn) {
      if (
        (toggleBtn.id === "mapToggleQualificacaoCursos" || toggleBtn.id === "mapToggleQualificacaoHeat") &&
        !ceIsQualificacaoMode()
      ) {
        ceResetQualificacaoCursoToggles();
        ceSetQualificacaoCursosOverlaysVisibility(ceMapRuntime.map);
        return;
      }
      const next = toggleBtn.getAttribute("aria-pressed") !== "true";
      toggleBtn.setAttribute("aria-pressed", next ? "true" : "false");
      if (toggleBtn.id === "mapToggleSedes") {
        const map = ceMapRuntime.map;
        if (map) ceSetSedesLayersVisibility(map, next);
      }
      if (toggleBtn.id === "mapToggleSalarioMedio") {
        ceRefreshSalarioMedioOverlayLabels();
      }
      if (toggleBtn.id === "mapToggleQualificacaoHeat" && next) {
        ceMapRuntime.activeLegendClass = null;
      }
      ceApplyVisualization();
      return;
    }
    const t = e.target;
    if (t.id === "mapFilterMesClear") {
      const sel = document.getElementById("mapFilterMes");
      if (sel) Array.from(sel.options).forEach((o) => { o.selected = false; });
      ceApplyMapFilters();
    }
    if (t.id === "mapFilterAnoClear") {
      const sel = document.getElementById("mapFilterAno");
      if (sel) Array.from(sel.options).forEach((o) => { o.selected = false; });
      ceRefreshMesOptionsFromAnoFilter();
      ceApplyMapFilters();
    }
    if (t.id === "mapFilterRegiaoClear") {
      const sel = document.getElementById("mapFilterRegiao");
      if (sel) Array.from(sel.options).forEach((o) => { o.selected = false; });
      if (ceIsCagedGrupamentosMode()) {
        window.cagedGrupamentosApi?.syncMunicipiosFromRegiao?.();
      } else if (ceIsSeguroDesempregoMode()) {
        window.seguroDesempregoApi?.syncMunicipiosFromRegiao?.();
      } else if (ceIsDinheiroNaMaoMode()) {
        window.dinheiroNaMaoApi?.syncMunicipiosFromRegiao?.();
      } else if (ceIsQualificacaoMode()) {
        /* qualificacao removida */
      } else {
        ceSyncMunicipiosFromRegioes();
      }
      ceApplyMapFilters();
    }
    if (t.id === "mapFilterMunClear") {
      const sel = document.getElementById("mapFilterMunicipio");
      const search = document.getElementById("mapFilterMunSearch");
      if (sel) Array.from(sel.options).forEach((o) => { o.selected = false; });
      if (search) search.value = "";
      if (ceIsVaiVemMode()) {
        window.vaiVemApi?.clearMunicipioSelection?.();
      } else if (ceIsCagedGrupamentosMode()) {
        window.cagedGrupamentosApi?.clearMunicipioSelection?.();
      } else if (ceIsSeguroDesempregoMode()) {
        window.seguroDesempregoApi?.clearMunicipioSelection?.();
      } else if (ceIsDinheiroNaMaoMode()) {
        window.dinheiroNaMaoApi?.clearMunicipioSelection?.();
      } else if (ceIsQualificacaoMode()) {
        /* qualificacao removida */
      } else {
        ceRebuildMunicipioOptions();
      }
      ceApplyMapFilters();
    }
    if (t.id === "mapFilterVaiVemRegiaoClear") {
      const sel = document.getElementById("mapFilterVaiVemRegiao");
      if (sel) Array.from(sel.options).forEach((o) => { o.selected = false; });
      if (ceIsVaiVemMode()) window.vaiVemApi?.syncMunicipiosFromRegiao?.();
      ceApplyMapFilters();
    }
  });

  root.addEventListener("input", (e) => {
    if (e.target.id !== "mapFilterMunSearch") return;
    clearTimeout(ceMunSearchTimer);
    ceMunSearchTimer = setTimeout(() => {
      if (ceIsVaiVemMode()) {
        window.vaiVemApi?.rebuildMunicipioOptions?.();
      } else if (ceIsCagedGrupamentosMode()) {
        window.cagedGrupamentosApi?.rebuildMunicipioOptions?.();
      } else if (ceIsSeguroDesempregoMode()) {
        window.seguroDesempregoApi?.rebuildMunicipioOptions?.();
      } else if (ceIsDinheiroNaMaoMode()) {
        window.dinheiroNaMaoApi?.rebuildMunicipioOptions?.();
      } else if (ceIsQualificacaoMode()) {
        /* qualificacao removida */
      } else {
        ceRebuildMunicipioOptions();
      }
    }, 160);
  });
}

ceWireMapFiltersDelegation();

function ceDestroyMap() {
  ceRegioesInitPromise = null;
  ceDestroyRankingCharts();
  ceDestroyRegionSummaryCharts();
  ceDestroyProfileSummaryCharts();
  ceDestroyProfilePibLineChart();
  ceDestroyProfileCearaCredLineChart();
  ceDestroyIntermediacaoLineChart();
  ceDestroyMonthlyLineChart();
  ceDestroyMonthlySaldoChart();
  if (!ceRegioesMap) return;
  if (ceRegioesMapResizeObserver) {
    try {
      ceRegioesMapResizeObserver.disconnect();
    } catch (_) {}
    ceRegioesMapResizeObserver = null;
  }
  try {
    ceRegioesMap.remove();
  } catch (_) {}
  ceRegioesMap = null;
  ceMapRuntime.map = null;
  ceMapRuntime.allRows = [];
  ceMapRuntime.profileRowsByLayer = {};
  ceMapRuntime.geoJsonBase = null;
  ceMapRuntime.currentMergedGeoJson = { type: "FeatureCollection", features: [] };
  ceMapRuntime.municipiosList = [];
  ceMapRuntime.lastAggByCodigo = new Map();
  ceMapRuntime.profileLastAggByCodigo = new Map();
  ceMapRuntime.layerStats = {};
  ceMapRuntime.regiaoColorMap = new Map();
  ceMapRuntime.regiaoLegendPairs = [];
  ceMapRuntime.planejamentoGeoJson = { type: "FeatureCollection", features: [] };
  ceMapRuntime.planejamentoColorMap = new Map();
  ceMapRuntime.planejamentoLegendPairs = [];
  ceMapRuntime.regiaoToCodigos = new Map();
  ceMapRuntime.profileSummaryCharts = {
    municipio: null,
    regiao: null,
    cearaMunicipio: null,
    cearaRegiao: null,
    munSimplesMunicipio: null,
    munSimplesRegiao: null,
    empresaGrupamentoMunicipio: null,
    empresaGrupamentoRegiao: null,
    empresaGrupamentoRegiaoBarras: null,
    empresasVinculosMunicipio: null,
    empresasVinculosRegiao: null,
    empresasVinculosRegiaoBarras: null,
    vinculoEscolaridadeMunicipio: null,
    vinculoEscolaridadeRegiao: null,
    vinculoEscolaridadeRegiaoBarras: null,
    vinculoSexoMunicipio: null,
    vinculoSexoRegiao: null,
    pibMunicipio: null,
    pibRegiao: null,
  };
  ceMapRuntime.profilePibLineChart = null;
  ceMapRuntime.intermediacaoLineChart = null;
  cePendingPageMode = null;
  ceMapRuntime.unidadesGeoJson = { type: "FeatureCollection", features: [] };
  ceMapRuntime.qualificacaoCursosGeoJson = { type: "FeatureCollection", features: [] };
  ceMapRuntime.sedeLabelMarkers.forEach((m) => m.remove());
  ceMapRuntime.sedeLabelMarkers = [];
  ceClearSalarioMedioOverlayLabels();
  ceMapRuntime.sedesGeoJson = { type: "FeatureCollection", features: [] };
  ceMapRuntime.populacaoByCodigo = new Map();
  ceUpdateMapReferenceMesAno();
}

function ceEnsureRegioesMap(containerEl, geoUrl, legendEl = null) {
  if (!containerEl || typeof maplibregl === "undefined") {
    return Promise.resolve(null);
  }
  if (ceRegioesMap) {
    return Promise.resolve(ceRegioesMap);
  }
  if (ceRegioesInitPromise) return ceRegioesInitPromise;

  ceMapRuntime.legendEl = legendEl;

  ceRegioesInitPromise = new Promise((resolve) => {
    const hoverPopup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: "360px",
    });
    const unitPopup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: "360px",
    });

    const map = new maplibregl.Map({
      container: containerEl,
      style: CE_REGIOES_MAP_STYLE,
      center: [-39.2, -5.2],
      zoom: 6,
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });

    ceRegioesMap = map;
    ceMapRuntime.map = map;

    if (typeof ResizeObserver !== "undefined") {
      if (ceRegioesMapResizeObserver) {
        try {
          ceRegioesMapResizeObserver.disconnect();
        } catch (_) {}
        ceRegioesMapResizeObserver = null;
      }
      ceRegioesMapResizeObserver = new ResizeObserver(() => {
        ceResizeRegioesMap();
      });
      ceRegioesMapResizeObserver.observe(containerEl);
    }

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100 }), "bottom-left");

    map.on("load", () => {
      void (async () => {
        let merged = { type: "FeatureCollection", features: [] };
        let thresholds = [];
        let sedesFc = { type: "FeatureCollection", features: [] };
        let planejamentoFc = { type: "FeatureCollection", features: [] };

        try {
          const planRes = await fetch(CE_PLANEJAMENTO_GEO_URL, CE_FETCH_NO_CACHE);
          if (planRes.ok) {
            const j = await planRes.json();
            if (j && j.type === "FeatureCollection" && Array.isArray(j.features)) planejamentoFc = j;
          }
        } catch (planErr) {
          console.warn("GeoJSON região de planejamento:", planErr);
        }
        ceMapRuntime.planejamentoGeoJson = planejamentoFc;
        ceInitPlanejamentoPalette(planejamentoFc);

        try {
          /* Exclui intermediação e camadas derivadas do CAGED (já carregado em CE_CAGED_CSV_URL). */
          const profileFetches = CE_PROFILE_LAYER_KEYS
            .filter((key) => {
              const cfg = CE_PROFILE_LAYER_CONFIG[key];
              if (!cfg) return false;
              if (cfg.parseMode === "intermediacao") return false;
              if (cfg.source === "caged_estoque" || cfg.parseMode === "caged_estoque") return false;
              return Boolean(cfg.csvUrl || cfg.gid);
            })
            .map((layerKey) =>
              fetch(ceBuildProfileLayerCsvUrl(layerKey), CE_FETCH_NO_CACHE)
                .then((r) => (r.ok ? r.text() : ""))
                .then((text) => [layerKey, text])
                .catch(() => [layerKey, ""])
            );

          const [geoRes, csvRes, idtCsvRes, intermediacaoRes, ...profileEntries] = await Promise.all([
            fetch(geoUrl).then((r) => {
              if (!r.ok) throw new Error("GeoJSON");
              return r.json();
            }),
            fetch(CE_CAGED_CSV_URL, CE_FETCH_NO_CACHE).then((r) => (r.ok ? r.text() : "")),
            fetch(CE_IDT_UNIDADES_CSV_URL, CE_FETCH_NO_CACHE).then((r) => (r.ok ? r.text() : "")),
            fetch(CE_INTERMEDIACAO_CSV_URL, CE_FETCH_NO_CACHE).then((r) => (r.ok ? r.text() : "")).catch(() => ""),
            ...profileFetches,
          ]);

          try {
            const sedesRes = await fetch(CE_SEDE_GEO_URL, CE_FETCH_NO_CACHE);
            if (sedesRes.ok) {
              const j = await sedesRes.json();
              if (j && j.type === "FeatureCollection" && Array.isArray(j.features)) sedesFc = j;
            }
          } catch (_) {}

          ceMapRuntime.populacaoByCodigo = ceBuildPopulacaoByCodigoFromSedes(sedesFc);
          ceMapRuntime.sedesGeoJson = sedesFc;

          ceInitRegiaoPalette(geoRes);
          ceMapRuntime.regiaoToCodigos = ceBuildRegiaoToCodigosMap(geoRes);
          cePopulateRegiaoSelect(geoRes);
          if (ceIsCagedGrupamentosSheet(cePendingPageMode) || ceIsCagedGrupamentosMode()) {
            window.cagedGrupamentosApi?.applyDefaultRegiaoSelection?.();
            window.cagedGrupamentosApi?.applyDefaultMunicipioSelection?.();
          }

          const rows = ceParseCagedCsvRows(csvRes || "");
          ceMapRuntime.unidadesGeoJson = ceParseIdtUnidadesCsv(idtCsvRes || "");
          ceMapRuntime.allRows = rows;
          ceMapRuntime.profileRowsByLayer = Object.fromEntries(
            profileEntries.map(([layerKey, text]) => [
              layerKey,
              ceParseProfileLayerCsvRows(layerKey, text || ""),
            ])
          );
          /* Emprego no Perfil Municipal reutiliza o estoque CAGED já carregado. */
          ceMapRuntime.profileRowsByLayer.emprego = ceMapCagedRowsToEmpregoProfile(rows);
          /* Parseia o CSV de intermediação (Cod_posto → cod_ibge via CSV bruto das unidades IDT) */
          const postoCodIbgeMap = ceBuildPostoToIbgeMapFromCsv(idtCsvRes || "");
          Object.assign(
            ceMapRuntime.profileRowsByLayer,
            ceParseIntermedicaoCsv(intermediacaoRes || "", postoCodIbgeMap)
          );
          ceUpdateMapReferenceMesAno();
          ceMapRuntime.geoJsonBase = geoRes;

          if (ceIsCagedGrupamentosSheet(cePendingPageMode) || ceIsCagedGrupamentosMode()) {
            window.cagedGrupamentosApi?.syncTemporalFilters?.();
          } else {
            cePopulateAnoSelect(rows);
            cePopulateMesSelect(rows, new Set());
          }
          ceMapRuntime.municipiosList = ceBuildMunicipiosList(rows);
          ceRebuildMunicipioOptions();

          const filteredInit = ceGetFilteredRows(rows, new Set(), new Set(), new Set(), new Set());
          ceUpdateMapKpis(ceComputeMapKpiTotals(filteredInit, new Set(), new Set()));
          const aggInit = ceAggregateByCodigo(filteredInit);
          ceMapRuntime.lastAggByCodigo = aggInit;
          merged = ceMergeCagedIntoGeojson(geoRes, aggInit);
          ceMapRuntime.currentMergedGeoJson = merged;
          ceRefreshLayerStats(merged);

          const mode0 = ceGetSelectedLayerMode();
          const st0 = ceMapRuntime.layerStats[mode0] || { thresholds: [], min: 0, max: 0 };
          thresholds = st0.thresholds;
        } catch (err) {
          console.warn("Camada CAGED / GeoJSON:", err);
          ceUpdateLegendNumeric(ceMapRuntime.legendEl, "estoque", [], 0, 0);
          ceUpdateMapKpis({
            estoque: 0,
            admissoes: 0,
            desligamentos: 0,
            saldos: 0,
            formalizacaoPct: null,
          });
          ceUpdateProfileKpis({});
          ceMapRuntime.lastAggByCodigo = new Map();
          ceMapRuntime.regiaoToCodigos = new Map();
          ceMapRuntime.unidadesGeoJson = { type: "FeatureCollection", features: [] };
          ceMapRuntime.qualificacaoCursosGeoJson = { type: "FeatureCollection", features: [] };
          ceMapRuntime.profileRowsByLayer = {};
          ceMapRuntime.populacaoByCodigo = new Map();
          ceMapRuntime.currentMergedGeoJson = { type: "FeatureCollection", features: [] };
          const regFail = document.getElementById("mapFilterRegiao");
          if (regFail) regFail.innerHTML = "";
        }

        map.addSource("ce-regioes", {
          type: "geojson",
          data: merged,
        });
        map.addSource("ce-idt-unidades", {
          type: "geojson",
          data: ceMapRuntime.unidadesGeoJson,
        });
        map.addSource(CE_QF_CURSOS_SOURCE_ID, {
          type: "geojson",
          data: ceMapRuntime.qualificacaoCursosGeoJson,
        });
        map.addSource("ce-sedes-municipais", {
          type: "geojson",
          data: sedesFc,
        });
        map.addSource("ce-regiao-planejamento", {
          type: "geojson",
          data: planejamentoFc,
        });

        const profileModeInit =
          ceIsPerfilMunicipalMode() ||
          (cePendingPageMode && ceIsProfileMapPageMode(cePendingPageMode));
        if (profileModeInit) {
          const initSheet =
            cePendingPageMode && ceIsProfileMapPageMode(cePendingPageMode)
              ? cePendingPageMode
              : ceIsIntermediacaoMode()
                ? "series_historicas"
                : ceIsCearaCrediMode()
                  ? "ceara_credi"
                  : ceIsVaiVemMode()
                    ? "vai_vem"
                  : ceIsPerfilEmpresasMode()
                    ? "perfil_empresas"
                    : "perfil_municipal";
          ceSyncProfileLayerSelectForPage(initSheet);
        }
        let initialFill;
        let initialFillOpacity = 0.78;
        if (profileModeInit && !ceIsVaiVemMode() && cePendingPageMode !== "vai_vem" && !ceIsCagedGrupamentosMode() && !ceIsCagedGrupamentosSheet(cePendingPageMode) && !ceIsSeguroDesempregoMode() && cePendingPageMode !== "seguro_desemprego" && !ceIsQualificacaoMode()) {
          const profileCfg = ceGetActiveProfileLayerConfig();
          initialFill = ceBuildNumericFillExpr(CE_PROFILE_LAYER_PROP, [], profileCfg.colors);
          initialFillOpacity = 0.82;
        } else if (ceIsVaiVemMode() || cePendingPageMode === "vai_vem") {
          initialFill = "#e8eef5";
          initialFillOpacity = 0.52;
        } else if (ceIsCagedGrupamentosMode() || ceIsCagedGrupamentosSheet(cePendingPageMode)) {
          initialFill = "#e8eef5";
          initialFillOpacity = 0.52;
        } else if (ceIsSeguroDesempregoMode() || cePendingPageMode === "seguro_desemprego") {
          initialFill = "#e8eef5";
          initialFillOpacity = 0.52;
        } else if (ceIsDinheiroNaMaoMode() || cePendingPageMode === "dinheiro_na_mao") {
          initialFill = "#e8eef5";
          initialFillOpacity = 0.52;
        } else if (ceIsQualificacaoMode()) {
          initialFill = "#e8eef5";
          initialFillOpacity = 0.52;
        } else {
          const mode0 = ceGetSelectedLayerMode();
          const cfg0 = CE_METRIC_CONFIG[mode0];
          initialFill = ceBuildNumericFillExpr(cfg0.prop, thresholds, cfg0.colors);
        }

        map.addLayer({
          id: "ce-regioes-fill",
          type: "fill",
          source: "ce-regioes",
          paint: {
            "fill-color": initialFill,
            "fill-opacity": initialFillOpacity,
            "fill-outline-color": "rgba(0, 60, 40, 0.35)",
          },
        });

        /* Fill já existe: aplica coropleta se a planilha chegou antes do mapa. */
        if (ceIsCagedGrupamentosMode() || ceIsCagedGrupamentosSheet(cePendingPageMode)) {
          ceFlushPendingCagedGrupApply();
        }

        map.addLayer({
          id: "ce-regioes-regiao-fill",
          type: "fill",
          source: "ce-regioes",
          layout: { visibility: "none" },
          paint: {
            "fill-color": ceBuildRegiaoFillExpr(ceMapRuntime.regiaoColorMap),
            "fill-opacity": CE_REGIAO_OVERLAY_FILL_OPACITY,
            "fill-outline-color": "rgba(40, 55, 75, 0.5)",
          },
        });

        map.addLayer({
          id: "ce-regioes-line",
          type: "line",
          source: "ce-regioes",
          paint: {
            "line-color": "#006837",
            "line-width": 0.35,
            "line-opacity": 0.45,
          },
        });

        map.addLayer({
          id: CE_PLANEJAMENTO_LINE_LAYER_ID,
          type: "line",
          source: "ce-regiao-planejamento",
          layout: { visibility: "none" },
          paint: {
            "line-color": CE_PLANEJAMENTO_LINE_COLOR,
            "line-width": CE_PLANEJAMENTO_LINE_WIDTH,
            "line-opacity": 1,
          },
        });

        /* Carrega o pino IDT com a API Promise do MapLibre 4.x */
        let idtIconLoaded = false;
        try {
          const imgResult = await map.loadImage(CE_IDT_POINT_ICON_URL);
          if (imgResult && imgResult.data) {
            if (!map.hasImage(CE_IDT_POINT_ICON_ID)) {
              map.addImage(CE_IDT_POINT_ICON_ID, imgResult.data);
            }
            idtIconLoaded = true;
          }
        } catch (iconErr) {
          console.warn("Ícone IDT não carregado, usará círculo:", iconErr);
        }

        if (idtIconLoaded) {
          map.addLayer({
            id: "ce-idt-unidades-symbol",
            type: "symbol",
            source: "ce-idt-unidades",
            layout: {
              visibility: "none",
              "icon-image": CE_IDT_POINT_ICON_ID,
              "icon-size": [
                "interpolate",
                ["linear"],
                ["zoom"],
                5, 0.385,
                8, 0.49,
                11, 0.616,
              ],
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "icon-anchor": "bottom",
            },
          });
        } else {
          map.addLayer({
            id: "ce-idt-unidades-circle",
            type: "circle",
            source: "ce-idt-unidades",
            layout: { visibility: "none" },
            paint: {
              "circle-radius": [
                "interpolate", ["linear"], ["zoom"],
                5, 5, 8, 7, 11, 9,
              ],
              "circle-color": CE_IDT_POINT_COLOR,
              "circle-stroke-color": CE_IDT_POINT_STROKE,
              "circle-stroke-width": 2,
              "circle-opacity": 0.95,
            },
          });
        }

        const qfIconLoaded = await ceEnsureQualificacaoCapIcon(map);
        map.addLayer({
          id: CE_QF_CURSOS_HEAT_LAYER_ID,
          type: "heatmap",
          source: CE_QF_CURSOS_SOURCE_ID,
          layout: { visibility: "none" },
          paint: {
            "heatmap-weight": [
              "interpolate",
              ["linear"],
              ["coalesce", ["to-number", ["get", "vagas"]], 1],
              0, 0.35,
              20, 0.75,
              60, 1,
            ],
            "heatmap-intensity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              5, 0.55,
              8, 0.9,
              11, 1.35,
            ],
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0, "rgba(37, 99, 235, 0)",
              0.15, "rgba(56, 189, 248, 0.55)",
              0.35, "rgba(74, 222, 128, 0.7)",
              0.55, "rgba(250, 204, 21, 0.8)",
              0.75, "rgba(249, 115, 22, 0.85)",
              1, "rgba(220, 38, 38, 0.92)",
            ],
            "heatmap-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              5, 14,
              8, 22,
              11, 36,
            ],
            "heatmap-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              5, 0.72,
              11, 0.82,
            ],
          },
        });
        if (qfIconLoaded) {
          map.addLayer({
            id: CE_QF_CURSOS_SYMBOL_LAYER_ID,
            type: "symbol",
            source: CE_QF_CURSOS_SOURCE_ID,
            layout: {
              visibility: "none",
              "icon-image": CE_QF_CURSOS_ICON_ID,
              "icon-size": [
                "interpolate",
                ["linear"],
                ["zoom"],
                5, 0.16,
                8, 0.2,
                11, 0.24,
              ],
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "icon-anchor": "center",
            },
          });
        } else {
          map.addLayer({
            id: CE_QF_CURSOS_CIRCLE_LAYER_ID,
            type: "circle",
            source: CE_QF_CURSOS_SOURCE_ID,
            layout: { visibility: "none" },
            paint: {
              "circle-radius": [
                "interpolate", ["linear"], ["zoom"],
                5, 3, 8, 4, 11, 5,
              ],
              "circle-color": CE_QF_CURSOS_POINT_COLOR,
              "circle-stroke-color": CE_QF_CURSOS_POINT_STROKE,
              "circle-stroke-width": 2,
              "circle-opacity": 0.92,
            },
          });
        }

        map.addLayer({
          id: CE_SEDE_LAYER_ID,
          type: "circle",
          source: "ce-sedes-municipais",
          layout: { visibility: "none" },
          paint: {
            "circle-radius": [
              "interpolate", ["linear"], ["zoom"],
              4, 4.5, 7, 6, 10, 8,
            ],
            "circle-color": CE_SEDE_POINT_COLOR,
            "circle-stroke-color": CE_SEDE_POINT_STROKE,
            "circle-stroke-width": 2,
            "circle-opacity": 0.92,
          },
        });

        ceBuildSedeLabelMarkers(map, sedesFc);

        if (cePendingPageMode && (ceIsProfileMapPageMode(cePendingPageMode) || ceIsCagedGrupamentosSheet(cePendingPageMode) || cePendingPageMode === "seguro_desemprego" || cePendingPageMode === "dinheiro_na_mao")) {
          ceSetPageMode(cePendingPageMode);
        } else if (ceIsPerfilMunicipalMode()) {
          let mode = "perfil_municipal";
          if (ceIsIntermediacaoMode()) mode = "series_historicas";
          else if (ceIsCearaCrediMode()) mode = "ceara_credi";
          else if (ceIsVaiVemMode()) mode = "vai_vem";
          else if (ceIsCagedGrupamentosMode()) mode = "analise_leste";
          else if (ceIsSeguroDesempregoMode()) mode = "seguro_desemprego";
          else if (ceIsDinheiroNaMaoMode()) mode = "dinheiro_na_mao";
          else if (ceIsPerfilEmpresasMode()) mode = "perfil_empresas";
          ceSetPageMode(mode);
        } else {
          ceSyncTemporalFiltersForCurrentMode();
          ceApplyVisualization();
          ceUpdateRankingCharts();
          ceUpdateRegionSummaryCharts();
          ceUpdateMonthlyLineChart();
          ceUpdateMonthlySaldoChart();
        }

        if (ceIsCagedGrupamentosSheet(cePendingPageMode) || ceIsCagedGrupamentosMode()) {
          window.cagedGrupamentosApi?.applyDefaultRegiaoSelection?.();
          window.cagedGrupamentosApi?.applyDefaultMunicipioSelection?.();
          ceEnsureCagedGrupClassifiedMap();
          if (!ceFitMapToSelectedRegioes(null, { duration: 0, maxZoom: 9.2 })) {
            map.fitBounds(CE_REGIOES_BOUNDS, {
              padding: { top: 12, bottom: 36, left: 12, right: 12 },
              maxZoom: 6,
              duration: 0,
            });
          }
          map.once("idle", () => {
            if (!ceIsCagedGrupamentosMode()) return;
            ceEnsureCagedGrupClassifiedMap();
            ceFitMapToSelectedRegioes(null, { duration: 500, maxZoom: 9.2 });
          });
        } else {
          map.fitBounds(CE_REGIOES_BOUNDS, {
            padding: { top: 12, bottom: 36, left: 12, right: 12 },
            maxZoom: 6,
            duration: 0,
          });
        }

        const polygonPopup = (e) => {
          const idtLayerId = ceGetIdtLayerId(map);
          if (idtLayerId) {
            const idtHits = map.queryRenderedFeatures(e.point, { layers: [idtLayerId] });
            if (idtHits && idtHits.length) return;
          }
          const qfCursosLayerId = ceGetQualificacaoCursosLayerId(map);
          if (ceIsQualificacaoMode() && qfCursosLayerId) {
            const qfHits = map.queryRenderedFeatures(e.point, { layers: [qfCursosLayerId] });
            if (qfHits && qfHits.length) return;
          }
          if (map.getLayer(CE_SEDE_LAYER_ID)) {
            const sedeHits = map.queryRenderedFeatures(e.point, { layers: [CE_SEDE_LAYER_ID] });
            if (sedeHits && sedeHits.length) return;
          }
          const f = e.features && e.features[0];
          if (!f) return;
          const { municipio, regiao } = cePropsMunReg(f.properties);
          let popupHtml = "";
          let accentColor = "#00a859";
          if (ceIsVaiVemMode()) {
            const key = ceNormMunKey(municipio);
            const agg = key ? ceMapRuntime.vaiVemAggByMunKey?.get(key) : null;
            accentColor = CE_VAI_VEM_COLORS[Math.min(3, CE_VAI_VEM_COLORS.length - 1)];
            popupHtml = ceBuildVaiVemPopupHtml({ municipio, regiao, agg, accentColor });
          } else if (ceIsCagedGrupamentosMode()) {
            const cod = ceGeoCodiToCodigoMunicipio(f.properties?.GEO_CODI);
            const agg = cod != null ? ceMapRuntime.cagedGrupAggByCod?.get(cod) : null;
            const grupoKey = ceMapRuntime.cagedGrupGrupoKey;
            const metricKey = ceMapRuntime.cagedGrupMetricKey;
            const cfg = ceGetCagedGrupLegendConfig(grupoKey, metricKey);
            accentColor = cfg.colors[Math.min(3, cfg.colors.length - 1)];
            popupHtml = ceBuildCagedGrupPopupHtml({
              municipio,
              regiao,
              agg,
              grupoKey,
              metricKey,
              accentColor,
            });
          } else if (ceIsSeguroDesempregoMode()) {
            const cod = ceGeoCodiToCodigoMunicipio(f.properties?.GEO_CODI);
            const agg = cod != null ? ceMapRuntime.seguroDesempregoAggByCod?.get(cod) : null;
            accentColor = CE_SD_COLORS[Math.min(3, CE_SD_COLORS.length - 1)];
            popupHtml = ceBuildSeguroDesempregoPopupHtml({ municipio, regiao, agg, accentColor });
          } else if (ceIsDinheiroNaMaoMode()) {
            const cod = ceGeoCodiToCodigoMunicipio(f.properties?.GEO_CODI);
            const agg = cod != null ? ceMapRuntime.dinheiroNaMaoAggByCod?.get(cod) : null;
            accentColor = CE_DNM_COLORS[Math.min(3, CE_DNM_COLORS.length - 1)];
            popupHtml = ceBuildDinheiroNaMaoPopupHtml({ municipio, regiao, agg, accentColor });
          } else if (ceIsQualificacaoMode()) {
            const cod = ceGeoCodiToCodigoMunicipio(f.properties?.GEO_CODI);
            const agg = cod != null ? ceMapRuntime.qualificacaoAggByCod?.get(cod) : null;
            accentColor = CE_QF_COLORS[Math.min(3, CE_QF_COLORS.length - 1)];
            popupHtml = ceBuildQualificacaoPopupHtml({ municipio, regiao, agg, accentColor });
          } else {
          const isPerfil = ceIsPerfilMunicipalMode();
          let indicador = "";
          let metricTxt = "";
          if (!isPerfil) {
            const cod = ceGeoCodiToCodigoMunicipio(f.properties?.GEO_CODI);
            const agg = cod != null ? ceMapRuntime.lastAggByCodigo.get(cod) : null;
            const mode = ceGetSelectedLayerMode();
            const cfg = CE_METRIC_CONFIG[mode];
            accentColor = cfg.colors[Math.min(3, cfg.colors.length - 1)];
            if (agg && Object.prototype.hasOwnProperty.call(agg, mode) && !cfg.popupProp) {
              const v = agg[mode];
              metricTxt = ceFormatMetricValue(mode, v);
            } else {
              const pv = f.properties?.[cfg.popupProp || cfg.prop];
              metricTxt = ceFormatMetricValue(mode, pv, cfg.popupFormat || null);
            }
            indicador = cfg.popupLabel || `${cfg.legendTitle} (filtros)`;
            popupHtml = ceBuildMapPopupHtml({
              municipio,
              regiao,
              indicador,
              valor: metricTxt,
              accentColor,
            });
          } else {
            const cod = ceGeoCodiToCodigoMunicipio(f.properties?.GEO_CODI);
            const agg = cod != null ? ceMapRuntime.profileLastAggByCodigo.get(cod) : null;
            const layerCfg = ceGetActiveProfileLayerConfig();
            accentColor = layerCfg.colors[Math.min(3, layerCfg.colors.length - 1)];
            popupHtml = ceBuildProfileMapPopupHtml({
              municipio,
              regiao,
              accentColor,
              layerCfg,
              row: agg,
            });
          }
          }
          if (!municipio && !regiao) return;
          hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(popupHtml)
            .addTo(map);
          const tip = hoverPopup.getElement()?.querySelector(".maplibregl-popup-tip");
          if (tip) tip.style.borderTopColor = accentColor;
        };

        const popupOut = () => {
          map.getCanvas().style.cursor = "";
          hoverPopup.remove();
        };

        const selectMunicipioFromFeature = (e) => {
          const idtLayerId = ceGetIdtLayerId(map);
          if (idtLayerId) {
            const idtHits = map.queryRenderedFeatures(e.point, { layers: [idtLayerId] });
            if (idtHits && idtHits.length) return;
          }
          const qfCursosLayerId = ceGetQualificacaoCursosLayerId(map);
          if (ceIsQualificacaoMode() && qfCursosLayerId) {
            const qfHits = map.queryRenderedFeatures(e.point, { layers: [qfCursosLayerId] });
            if (qfHits && qfHits.length) return;
          }
          const f = e.features && e.features[0];
          if (!f) return;
          if (ceIsVaiVemMode()) {
            const { municipio } = cePropsMunReg(f.properties);
            window.vaiVemApi?.selectSingleMunicipioFromMap?.(ceNormMunKey(municipio));
            return;
          }
          if (ceIsCagedGrupamentosMode()) {
            const cod = ceGeoCodiToCodigoMunicipio(f.properties?.GEO_CODI);
            window.cagedGrupamentosApi?.selectSingleMunicipioFromMap?.(cod);
            return;
          }
          if (ceIsSeguroDesempregoMode()) {
            const cod = ceGeoCodiToCodigoMunicipio(f.properties?.GEO_CODI);
            window.seguroDesempregoApi?.selectSingleMunicipioFromMap?.(cod);
            return;
          }
          if (ceIsDinheiroNaMaoMode()) {
            const cod = ceGeoCodiToCodigoMunicipio(f.properties?.GEO_CODI);
            window.dinheiroNaMaoApi?.selectSingleMunicipioFromMap?.(cod);
            return;
          }
          if (ceIsQualificacaoMode()) {
            const cod = ceGeoCodiToCodigoMunicipio(f.properties?.GEO_CODI);
            /* qualificacao removida */
            return;
          }
          const cod = ceGeoCodiToCodigoMunicipio(f.properties?.GEO_CODI);
          ceSelectSingleMunicipioFromMap(cod);
        };

        map.on("click", "ce-regioes-fill", selectMunicipioFromFeature);
        map.on("click", "ce-regioes-regiao-fill", selectMunicipioFromFeature);
        map.on("click", (e) => {
          const idtLayerId = ceGetIdtLayerId(map);
          const layers = ["ce-regioes-fill", "ce-regioes-regiao-fill"];
          if (map.getLayer(CE_PLANEJAMENTO_LINE_LAYER_ID)) layers.push(CE_PLANEJAMENTO_LINE_LAYER_ID);
          if (idtLayerId) layers.push(idtLayerId);
          const qfCursosLayerId = ceGetQualificacaoCursosLayerId(map);
          if (ceIsQualificacaoMode() && qfCursosLayerId) layers.push(qfCursosLayerId);
          if (map.getLayer(CE_SEDE_LAYER_ID)) layers.push(CE_SEDE_LAYER_ID);
          const hits = map.queryRenderedFeatures(e.point, {
            layers,
          });
          if (hits && hits.length) return;
          if (ceIsVaiVemMode()) {
            window.vaiVemApi?.clearMunicipioSelection?.();
            window.vaiVemApi?.refresh?.();
            return;
          }
          if (ceIsCagedGrupamentosMode()) {
            window.cagedGrupamentosApi?.clearMunicipioSelection?.();
            window.cagedGrupamentosApi?.refresh?.();
            return;
          }
          if (ceIsSeguroDesempregoMode()) {
            window.seguroDesempregoApi?.clearMunicipioSelection?.();
            window.seguroDesempregoApi?.refresh?.();
            return;
          }
          if (ceIsDinheiroNaMaoMode()) {
            window.dinheiroNaMaoApi?.clearMunicipioSelection?.();
            window.dinheiroNaMaoApi?.refresh?.();
            return;
          }
          if (ceIsQualificacaoMode()) {
            /* qualificacao removida */
            /* qualificacao removida */
            return;
          }
          ceClearMunicipioSelectionFromMap();
        });
        const planejamentoPopup = (e) => {
          const f = e.features && e.features[0];
          if (!f) return;
          hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(ceBuildPlanejamentoPopupHtml(f.properties || {}))
            .addTo(map);
          const tip = hoverPopup.getElement()?.querySelector(".maplibregl-popup-tip");
          if (tip) tip.style.borderTopColor = CE_PLANEJAMENTO_LINE_COLOR;
        };

        map.on("mousemove", "ce-regioes-fill", polygonPopup);
        map.on("mousemove", "ce-regioes-regiao-fill", polygonPopup);
        map.on("mousemove", CE_PLANEJAMENTO_LINE_LAYER_ID, planejamentoPopup);
        map.on("mouseenter", "ce-regioes-fill", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseenter", "ce-regioes-regiao-fill", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseenter", CE_PLANEJAMENTO_LINE_LAYER_ID, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "ce-regioes-fill", popupOut);
        map.on("mouseleave", "ce-regioes-regiao-fill", popupOut);
        map.on("mouseleave", CE_PLANEJAMENTO_LINE_LAYER_ID, popupOut);

        const bindIdtPointEvents = (layerId) => {
          if (!layerId || !map.getLayer(layerId)) return;
          map.on("mouseenter", layerId, () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", layerId, () => {
            map.getCanvas().style.cursor = "";
            /* popup da unidade só fecha no X */
          });
          map.on("click", layerId, (e) => {
            const f = e.features && e.features[0];
            if (!f) return;
            unitPopup
              .setLngLat(e.lngLat)
              .setHTML(ceBuildIdtPopupHtml(f.properties || {}))
              .addTo(map);
            const tip = unitPopup.getElement()?.querySelector(".maplibregl-popup-tip");
            if (tip) tip.style.borderTopColor = CE_IDT_POINT_COLOR;
          });
        };
        bindIdtPointEvents(ceGetIdtLayerId(map));

        const qfCursosLayerId = ceGetQualificacaoCursosLayerId(map);
        if (qfCursosLayerId) {
          map.on("mouseenter", qfCursosLayerId, () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", qfCursosLayerId, () => {
            map.getCanvas().style.cursor = "";
          });
          map.on("click", qfCursosLayerId, (e) => {
            const f = e.features && e.features[0];
            if (!f) return;
            unitPopup
              .setLngLat(e.lngLat)
              .setHTML(ceBuildQualificacaoCursoPopupHtml(f.properties || {}))
              .addTo(map);
            const tip = unitPopup.getElement()?.querySelector(".maplibregl-popup-tip");
            if (tip) tip.style.borderTopColor = CE_QF_CURSOS_POINT_COLOR;
          });
        }

        const sedeHoverMove = (e) => {
          const f = e.features && e.features[0];
          if (!f) return;
          hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(ceBuildSedeHoverHtml(f.properties || {}))
            .addTo(map);
          const tip = hoverPopup.getElement()?.querySelector(".maplibregl-popup-tip");
          if (tip) tip.style.borderTopColor = CE_SEDE_POINT_COLOR;
        };
        map.on("mousemove", CE_SEDE_LAYER_ID, sedeHoverMove);
        map.on("mouseleave", CE_SEDE_LAYER_ID, popupOut);
        map.on("mouseenter", CE_SEDE_LAYER_ID, () => {
          map.getCanvas().style.cursor = "pointer";
        });

        resolve(map);
      })();
    });

    map.on("error", (e) => {
      console.warn("Mapa CE regiões:", e?.error || e);
    });
  });

  return ceRegioesInitPromise;
}

function ceResizeRegioesMap() {
  if (!ceRegioesMap) return;
  requestAnimationFrame(() => {
    try {
      ceRegioesMap.resize();
    } catch (_) {}
    for (const metricKey of CE_GRADUATED_METRICS) {
      try {
        ceMapRuntime.rankingCharts[metricKey]?.resize?.();
      } catch (_) {}
    }
    try {
      ceMapRuntime.rankingCharts[CE_RANK_CHART_FORMALIZACAO_MUN]?.resize?.();
    } catch (_) {}
    try {
      ceMapRuntime.regionSummaryCharts.pie?.resize?.();
      ceMapRuntime.regionSummaryCharts.bar?.resize?.();
      ceMapRuntime.regionSummaryCharts.formalizacao?.resize?.();
      ceMapRuntime.profileSummaryCharts.municipio?.resize?.();
      ceMapRuntime.profileSummaryCharts.regiao?.resize?.();
      ceMapRuntime.profileSummaryCharts.cearaMunicipio?.resize?.();
      ceMapRuntime.profileSummaryCharts.cearaRegiao?.resize?.();
      ceMapRuntime.profileSummaryCharts.munSimplesMunicipio?.resize?.();
      ceMapRuntime.profileSummaryCharts.munSimplesRegiao?.resize?.();
      ceMapRuntime.profileSummaryCharts.empresaGrupamentoMunicipio?.resize?.();
      ceMapRuntime.profileSummaryCharts.empresaGrupamentoRegiao?.resize?.();
      ceMapRuntime.profileSummaryCharts.empresaGrupamentoRegiaoBarras?.resize?.();
      ceMapRuntime.profileSummaryCharts.empresasVinculosMunicipio?.resize?.();
      ceMapRuntime.profileSummaryCharts.empresasVinculosRegiao?.resize?.();
      ceMapRuntime.profileSummaryCharts.empresasVinculosRegiaoBarras?.resize?.();
      ceMapRuntime.profileSummaryCharts.vinculoEscolaridadeMunicipio?.resize?.();
      ceMapRuntime.profileSummaryCharts.vinculoEscolaridadeRegiao?.resize?.();
      ceMapRuntime.profileSummaryCharts.vinculoEscolaridadeRegiaoBarras?.resize?.();
      ceMapRuntime.profileSummaryCharts.vinculoSexoMunicipio?.resize?.();
      ceMapRuntime.profileSummaryCharts.vinculoSexoRegiao?.resize?.();
      ceMapRuntime.profileSummaryCharts.pibMunicipio?.resize?.();
      ceMapRuntime.profileSummaryCharts.pibRegiao?.resize?.();
      ceMapRuntime.profilePibLineChart?.resize?.();
      ceMapRuntime.profileCearaCredLineChart?.resize?.();
      ceMapRuntime.intermediacaoLineChart?.resize?.();
      ceMapRuntime.monthlyLineChart?.resize?.();
      ceMapRuntime.monthlySaldoChart?.resize?.();
    } catch (_) {}
  });
}

function ceSetPageMode(sheetName) {
  if (!sheetName) {
    /* Não limpa o modo pendente enquanto o mapa ainda está inicializando — evita paint CAGED preso. */
    if (ceMapRuntime.map?.getSource?.("ce-regioes")) {
      cePendingPageMode = null;
    }
    return;
  }
  cePendingPageMode = sheetName;

  ceApplyPageModeClasses(sheetName);
  const isQualificacao = sheetName === "qualificacao" && ceIsQualificacaoRoute();
  if (!isQualificacao) ceResetQualificacaoCursoToggles();
  if (ceIsCagedGrupamentosSheet(sheetName)) {
    const regBtn = document.getElementById("mapToggleRegiao");
    if (regBtn) regBtn.setAttribute("aria-pressed", "false");
  }
  if (!ceIsCagedGrupamentosSheet(sheetName)) {
    ceClearSalarioMedioOverlayLabels();
    const salBtn = document.getElementById("mapToggleSalarioMedio");
    if (salBtn) salBtn.setAttribute("aria-pressed", "false");
  }
  if (ceIsProfileMapPageMode(sheetName)) {
    ceSyncProfileLayerSelectForPage(sheetName);
  }

  const map = ceMapRuntime.map;
  if (!map?.getSource?.("ce-regioes")) return;
  ceSetQualificacaoCursosOverlaysVisibility(map);

  ceSyncProfileLayerUi();
  if (sheetName === "qualificacao") {
    /* qualificacao removida */
  } else if (sheetName === "dinheiro_na_mao") {
    window.dinheiroNaMaoApi?.syncTemporalFilters?.();
  } else if (ceIsCagedGrupamentosSheet(sheetName)) {
    window.cagedGrupamentosApi?.syncTemporalFilters?.();
    window.cagedGrupamentosApi?.applyDefaultRegiaoSelection?.();
    window.cagedGrupamentosApi?.applyDefaultMunicipioSelection?.();
  } else {
    ceSyncTemporalFiltersForCurrentMode();
  }
  ceApplyMapFilters();
  if (ceIsCagedGrupamentosSheet(sheetName) || ceIsCagedGrupamentosMode()) {
    ceEnsureCagedGrupClassifiedMap();
  }
  ceResizeRegioesMap();
  if (ceIsCagedGrupamentosSheet(sheetName) || ceIsCagedGrupamentosMode()) {
    requestAnimationFrame(() => {
      ceFitMapToSelectedRegioes(null, { duration: 650, maxZoom: 9.2 });
    });
  }
}

window.ceRegioesMapApi = {
  ensure: ceEnsureRegioesMap,
  resize: ceResizeRegioesMap,
  setPageMode: ceSetPageMode,
  destroy: ceDestroyMap,
  applyVaiVemLayer: ceApplyVaiVemLayer,
  applyCagedGrupLayer: ceApplyCagedGrupLayer,
  refreshSalarioOverlayLabels: ceRefreshSalarioMedioOverlayLabels,
  syncSedesOverlay: () => {
    const map = ceMapRuntime.map;
    if (map) ceSetSedesLayersVisibility(map, ceIsSedesOverlayOn());
  },
  applySeguroDesempregoLayer: ceApplySeguroDesempregoLayer,
  applyDinheiroNaMaoLayer: ceApplyDinheiroNaMaoLayer,
  normMunKey: ceNormMunKey,
  rebuildAllMunicipios: ceRebuildMunicipioOptions,
  getRegiaoToCodigos: () => ceMapRuntime.regiaoToCodigos,
  fitSelectedRegioes: ceFitMapToSelectedRegioes,
  formatMesAnoKey: ceFormatMesAnoFromKey,
  pickFormalizacaoByMunicipio: (aggByCod) => cePickFormalizacaoMunicipioEntries(aggByCod, "maiores"),
  pickFormalizacaoByRegiao: (aggByCod) => cePickFormalizacaoRegiaoEntries(aggByCod, "maiores"),
};
