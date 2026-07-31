const CAGED_GRUP_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRYap5Q-G4J4RT1VKQ2vismTIPeEgVTnax0U-GXlKntfK0HXBSRko9zakIzo218MLFhSCtchFrY0Z_I/pub?gid=0&single=true&output=csv";
const CAGED_SALARIO_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRYap5Q-G4J4RT1VKQ2vismTIPeEgVTnax0U-GXlKntfK0HXBSRko9zakIzo218MLFhSCtchFrY0Z_I/pub?gid=1744491440&single=true&output=csv";

const CG_DESDOBRAMENTO_TODOS_KEY = "todos";

const CG_GRUPO_OPTIONS = [
  { key: "agropecuaria", label: "Agropecuária" },
  { key: "comercio", label: "Comércio" },
  { key: "construcao", label: "Construção" },
  { key: "industria", label: "Indústria" },
  { key: "servicos", label: "Serviços" },
  { key: "nao_identificado", label: "Não Identificado" },
];

const CG_GRUPO_TODOS_KEY = "todos";
const CG_METRIC_TODOS_KEY = "todos";
/** Regiões administrativas pré-selecionadas na Análise Leste. */
const CG_DEFAULT_REGIOES = ["Grande Fortaleza", "Litoral Leste"];
/** Municípios pré-selecionados ao carregar a Análise Leste. */
const CG_DEFAULT_MUNICIPIOS = [
  "Eusébio",
  "Aquiraz",
  "Pindoretama",
  "Cascavel",
  "Beberibe",
  "Fortim",
  "Aracati",
  "Icapuí",
];

const CG_METRIC_OPTIONS = [
  { key: "estoque", label: "Total por grupamento", field: "estoque" },
  { key: "admitidos", label: "Admitidos", field: "admitidos" },
  { key: "desligados", label: "Desligados", field: "desligados" },
  { key: "saldo", label: "Saldo", field: "saldo" },
  { key: "salario_medio", label: "Salário médio", field: "salarioMedio" },
];

const CG_BAR_FORMALIZACAO_COLOR = "#1d4ed8";


const cgCharts = {};

const cgState = {
  rows: [],
  salarioRows: [],
  loading: false,
  loaded: false,
  error: null,
  municipiosList: [],
  desdobramentos: [],
};

const cgFmt = new Intl.NumberFormat("pt-BR");

let cgMunSearchTimer = null;

function cgNormGrupoKey(label) {
  const n = String(label ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (n.includes("agropec")) return "agropecuaria";
  if (n.includes("comerc")) return "comercio";
  if (n.includes("constru")) return "construcao";
  if (n.includes("industr")) return "industria";
  if (n.includes("servic")) return "servicos";
  if (n.includes("nao ident") || n === "nao identificado") return "nao_identificado";
  return n.replace(/\s+/g, "_");
}

function cgGrupoLabel(key) {
  if (key === CG_GRUPO_TODOS_KEY) return "Todos os grupamentos";
  return CG_GRUPO_OPTIONS.find((g) => g.key === key)?.label || key;
}

function cgMetricLabel(key) {
  if (key === CG_METRIC_TODOS_KEY) return "Todos os indicadores";
  return CG_METRIC_OPTIONS.find((m) => m.key === key)?.label || key;
}

function cgParseCsvLine(line) {
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

function cgParseNumber(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return 0;
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/** Remuneração: número BR ou null se ***** / inválido. */
function cgParseRemuneracao(raw) {
  const s = String(raw ?? "").trim();
  if (!s || s === "*****" || /^\*+$/.test(s)) return null;
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function cgNormalizeCodigo(raw) {
  const cod = parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(cod) || cod <= 0) return null;
  if (cod >= 1_000_000) return Math.floor(cod / 10);
  return cod;
}

function cgParseReferencia(raw) {
  const s = String(raw || "").trim();
  const m = /^(\d{1,2})\/(\d{4})$/.exec(s);
  if (!m) return null;
  const month = Number(m[1]);
  const year = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year, month, mesAnoKey: `${year}-${String(month).padStart(2, "0")}` };
}

function cgMesAnoKeyRank(key) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(key || ""));
  if (!m) return 0;
  return parseInt(m[1], 10) * 12 + parseInt(m[2], 10);
}

function cgParseCsvRows(text) {
  const raw = String(text || "").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];

  const header = cgParseCsvLine(lines[0]).map((h) => h.trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const pick = (cells, key) => cells[idx[key]] ?? "";

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = cgParseCsvLine(lines[i]);
    if (!cells.length) continue;
    const codigo = cgNormalizeCodigo(pick(cells, "Codigo_Municipio"));
    const municipio = pick(cells, "Municipio");
    if (codigo == null || !municipio) continue;
    const ref = cgParseReferencia(pick(cells, "Referencia"));
    const grupoKey = cgNormGrupoKey(pick(cells, "Grande_Grupamento"));
    const desdobramento = String(pick(cells, "Desdobramento") || "").trim();
    rows.push({
      codigo,
      municipio,
      referencia: pick(cells, "Referencia"),
      ano: ref?.year ?? null,
      mesAnoKey: ref?.mesAnoKey ?? "",
      grandeGrupamento: pick(cells, "Grande_Grupamento"),
      grupamento: String(pick(cells, "Grupamento") || "").trim(),
      desdobramento,
      grupoKey,
      admitidos: cgParseNumber(pick(cells, "Admitidos")),
      desligados: cgParseNumber(pick(cells, "Desligados")),
      saldo: cgParseNumber(pick(cells, "Saldo")),
      estoque: cgParseNumber(pick(cells, "Estoque_Mensal")),
      estoqueTotal: cgParseNumber(pick(cells, "Estoque_Total")),
      tempoEmprego: cgParseNumber(pick(cells, "Tempo_Emprego_Desligados")),
    });
  }
  return rows;
}

function cgParseSalarioCsvRows(text) {
  const raw = String(text || "").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];

  const header = cgParseCsvLine(lines[0]).map((h) => h.trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const pick = (cells, key) => cells[idx[key]] ?? "";

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = cgParseCsvLine(lines[i]);
    if (!cells.length) continue;
    const codigo = cgNormalizeCodigo(pick(cells, "Codigo_Municipio"));
    const municipio = pick(cells, "Municipio");
    if (codigo == null || !municipio) continue;
    const ano = parseInt(String(pick(cells, "Ano") || "").trim(), 10);
    const desdobramento = String(pick(cells, "Desdobramento") || "").trim();
    rows.push({
      codigo,
      municipio,
      ano: Number.isFinite(ano) ? ano : null,
      grandeGrupamento: pick(cells, "Grande_Grupamento"),
      grupamento: String(pick(cells, "Grupamento") || "").trim(),
      desdobramento,
      grupoKey: cgNormGrupoKey(pick(cells, "Grande_Grupamento")),
      estoque: cgParseNumber(pick(cells, "Estoque")),
      salarioMedio: cgParseRemuneracao(pick(cells, "Remuneracao_Real_Media")),
    });
  }
  return rows;
}

function cgBuildDesdobramentosIndex() {
  const set = new Set();
  for (const row of cgState.rows) {
    if (row.desdobramento) set.add(row.desdobramento);
  }
  for (const row of cgState.salarioRows) {
    if (row.desdobramento) set.add(row.desdobramento);
  }
  cgState.desdobramentos = [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function cgPopulateDesdobramentoSelect() {
  const sel = document.getElementById("mapAnaliseLesteDesdobramentoStyle");
  if (!sel) return;
  const prev = sel.value || CG_DESDOBRAMENTO_TODOS_KEY;
  sel.innerHTML = "";
  const all = document.createElement("option");
  all.value = CG_DESDOBRAMENTO_TODOS_KEY;
  all.textContent = "Todos";
  sel.appendChild(all);
  for (const label of cgState.desdobramentos) {
    const opt = document.createElement("option");
    opt.value = label;
    opt.textContent = label;
    sel.appendChild(opt);
  }
  sel.value = [...sel.options].some((o) => o.value === prev) ? prev : CG_DESDOBRAMENTO_TODOS_KEY;
}

function cgPopulateGrupoSelect() {
  const sel = document.getElementById("mapCagedGrupLayerStyle");
  if (!sel) return;
  const prev = sel.value || CG_GRUPO_TODOS_KEY;
  const present = new Set(cgState.rows.map((r) => r.grupoKey).filter(Boolean));
  const options = CG_GRUPO_OPTIONS.filter((g) => present.has(g.key));
  const extras = [...present]
    .filter((k) => !CG_GRUPO_OPTIONS.some((g) => g.key === k))
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .map((key) => ({ key, label: key }));
  sel.innerHTML = "";
  const all = document.createElement("option");
  all.value = CG_GRUPO_TODOS_KEY;
  all.textContent = "Todos";
  sel.appendChild(all);
  for (const g of [...options, ...extras]) {
    const opt = document.createElement("option");
    opt.value = g.key;
    opt.textContent = g.label;
    sel.appendChild(opt);
  }
  sel.value = [...sel.options].some((o) => o.value === prev) ? prev : CG_GRUPO_TODOS_KEY;
}

function cgBuildMunicipiosIndex() {
  const munMap = new Map();
  for (const row of cgState.rows) {
    if (!munMap.has(row.codigo)) munMap.set(row.codigo, row.municipio);
  }
  cgState.municipiosList = [...munMap.entries()]
    .map(([codigo, municipio]) => ({ codigo, municipio }))
    .sort((a, b) => a.municipio.localeCompare(b.municipio, "pt-BR"));
}

function cgPopulateAnoFilter() {
  const sel = document.getElementById("mapFilterAno");
  if (!sel) return;
  const prev = new Set(Array.from(sel.selectedOptions).map((o) => o.value));
  const years = [...new Set(cgState.rows.map((r) => r.ano).filter((y) => Number.isFinite(y)))].sort(
    (a, b) => a - b
  );
  sel.innerHTML = "";
  for (const y of years) {
    const opt = document.createElement("option");
    opt.value = String(y);
    opt.textContent = String(y);
    if (prev.has(String(y))) opt.selected = true;
    sel.appendChild(opt);
  }
}

function cgRebuildMesFilter() {
  const sel = document.getElementById("mapFilterMes");
  const anoSel = cgGetSelectedAnos();
  if (!sel) return;
  const prev = new Set(Array.from(sel.selectedOptions).map((o) => o.value));
  const keys = new Set();
  for (const row of cgState.rows) {
    if (!row.mesAnoKey) continue;
    if (anoSel.length && !anoSel.includes(String(row.ano))) continue;
    keys.add(row.mesAnoKey);
  }
  const sorted = [...keys].sort((a, b) => cgMesAnoKeyRank(a) - cgMesAnoKeyRank(b));
  sel.innerHTML = "";
  for (const key of sorted) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent =
      typeof window.ceRegioesMapApi?.formatMesAnoKey === "function"
        ? window.ceRegioesMapApi.formatMesAnoKey(key)
        : key;
    if (prev.has(key)) opt.selected = true;
    sel.appendChild(opt);
  }
}

function cgRebuildMunicipioOptions(preferredSelection) {
  const sel = document.getElementById("mapFilterMunicipio");
  const searchEl = document.getElementById("mapFilterMunSearch");
  if (!sel || !cgState.municipiosList.length) return;

  const regSel = cgGetSelectedRegioes();
  let pool = cgState.municipiosList;
  if (regSel.length && typeof window.ceRegioesMapApi?.getRegiaoToCodigos === "function") {
    const regMap = window.ceRegioesMapApi.getRegiaoToCodigos();
    const allowed = new Set();
    for (const reg of regSel) {
      const set = regMap.get(reg);
      if (!set) continue;
      for (const c of set) allowed.add(String(c));
    }
    pool = pool.filter((item) => allowed.has(String(item.codigo)));
  }

  const q = (searchEl?.value || "").trim().toLowerCase();
  const selected =
    preferredSelection !== undefined
      ? preferredSelection
      : new Set(Array.from(sel.selectedOptions).map((o) => o.value));

  sel.innerHTML = "";
  for (const item of pool) {
    const codStr = String(item.codigo);
    const match = !q || item.municipio.toLowerCase().includes(q);
    const isSel = selected.has(codStr);
    if (!match && !isSel) continue;
    const opt = document.createElement("option");
    opt.value = codStr;
    opt.textContent = item.municipio;
    if (isSel) opt.selected = true;
    sel.appendChild(opt);
  }
}

function cgSyncMunicipiosFromRegiao() {
  if (!cgState.municipiosList.length) return;
  const regSel = cgGetSelectedRegioes();
  const codes = new Set();
  if (regSel.length && typeof window.ceRegioesMapApi?.getRegiaoToCodigos === "function") {
    const regMap = window.ceRegioesMapApi.getRegiaoToCodigos();
    const valid = new Set(cgState.municipiosList.map((m) => String(m.codigo)));
    for (const reg of regSel) {
      const set = regMap.get(reg);
      if (!set) continue;
      for (const c of set) {
        const cs = String(c);
        if (valid.has(cs)) codes.add(cs);
      }
    }
  }
  cgRebuildMunicipioOptions(codes);
}

function cgNormMunName(name) {
  return String(name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Seleciona os municípios padrão da Análise Leste (mantém o pool das regiões filtradas). */
function cgApplyDefaultMunicipioSelection() {
  if (!cgState.municipiosList.length) return false;
  const wanted = new Set(CG_DEFAULT_MUNICIPIOS.map(cgNormMunName));
  const codes = new Set();
  for (const item of cgState.municipiosList) {
    if (wanted.has(cgNormMunName(item.municipio))) {
      codes.add(String(item.codigo));
    }
  }
  const search = document.getElementById("mapFilterMunSearch");
  if (search) search.value = "";
  cgRebuildMunicipioOptions(codes);
  return codes.size > 0;
}

function cgClearMunicipioSelection() {
  const search = document.getElementById("mapFilterMunSearch");
  if (search) search.value = "";
  cgRebuildMunicipioOptions(new Set());
}

function cgSelectSingleMunicipioFromMap(codigo) {
  const codStr = String(codigo ?? "").trim();
  if (!codStr) return;
  const exists = cgState.municipiosList.some((m) => String(m.codigo) === codStr);
  if (!exists) return;
  const search = document.getElementById("mapFilterMunSearch");
  if (search) search.value = "";
  cgRebuildMunicipioOptions(new Set([codStr]));
  cgRefreshAll();
}

function cgGetSelectedAnos() {
  const sel = document.getElementById("mapFilterAno");
  if (!sel) return [];
  return Array.from(sel.selectedOptions)
    .map((o) => String(o.value || ""))
    .filter(Boolean);
}

function cgGetSelectedMesKeys() {
  const sel = document.getElementById("mapFilterMes");
  if (!sel) return [];
  return Array.from(sel.selectedOptions)
    .map((o) => String(o.value || ""))
    .filter(Boolean);
}

function cgGetSelectedMunicipioCodes() {
  const sel = document.getElementById("mapFilterMunicipio");
  if (!sel) return [];
  return Array.from(sel.selectedOptions)
    .map((o) => String(o.value || ""))
    .filter(Boolean);
}

function cgGetSelectedRegioes() {
  const sel = document.getElementById("mapFilterRegiao");
  if (!sel) return [];
  return Array.from(sel.selectedOptions)
    .map((o) => String(o.value || ""))
    .filter(Boolean);
}

/** Seleciona Grande Fortaleza e Litoral Leste no filtro de região. */
function cgApplyDefaultRegiaoSelection() {
  const sel = document.getElementById("mapFilterRegiao");
  if (!sel || !sel.options.length) return false;
  const wanted = new Set(CG_DEFAULT_REGIOES.map((n) => n.toLowerCase()));
  let matched = 0;
  Array.from(sel.options).forEach((opt) => {
    const hit = wanted.has(String(opt.value || "").trim().toLowerCase());
    opt.selected = hit;
    if (hit) matched += 1;
  });
  return matched > 0;
}

function cgFitMapToDefaultArea() {
  const names = cgGetSelectedRegioes().length
    ? cgGetSelectedRegioes()
    : CG_DEFAULT_REGIOES;
  window.ceRegioesMapApi?.fitSelectedRegioes?.(names, { duration: 700, maxZoom: 9.2 });
}

function cgGetSelectedGrupoKey() {
  const el = document.getElementById("mapCagedGrupLayerStyle");
  const v = el?.value || CG_GRUPO_TODOS_KEY;
  if (v === CG_GRUPO_TODOS_KEY) return CG_GRUPO_TODOS_KEY;
  if (CG_GRUPO_OPTIONS.some((g) => g.key === v)) return v;
  if ([...el?.options || []].some((o) => o.value === v)) return v;
  return CG_GRUPO_TODOS_KEY;
}

function cgGetSelectedMetricKey() {
  const el = document.getElementById("mapCagedGrupMetricStyle");
  const v = el?.value || CG_METRIC_TODOS_KEY;
  if (v === CG_METRIC_TODOS_KEY) return CG_METRIC_TODOS_KEY;
  return CG_METRIC_OPTIONS.some((m) => m.key === v) ? v : CG_METRIC_TODOS_KEY;
}

function cgGetSelectedDesdobramento() {
  const el = document.getElementById("mapAnaliseLesteDesdobramentoStyle");
  const v = String(el?.value || CG_DESDOBRAMENTO_TODOS_KEY).trim();
  if (!v || v === CG_DESDOBRAMENTO_TODOS_KEY) return CG_DESDOBRAMENTO_TODOS_KEY;
  return v;
}

function cgRowsForGrupo(rows, grupoKey) {
  return grupoKey === CG_GRUPO_TODOS_KEY ? rows : rows.filter((r) => r.grupoKey === grupoKey);
}

function cgFilterRows(rows) {
  const anos = cgGetSelectedAnos();
  const meses = cgGetSelectedMesKeys();
  const muns = cgGetSelectedMunicipioCodes();
  const regs = cgGetSelectedRegioes();
  const desdobramento = cgGetSelectedDesdobramento();
  let allowedByReg = null;
  if (regs.length && typeof window.ceRegioesMapApi?.getRegiaoToCodigos === "function") {
    allowedByReg = new Set();
    const regMap = window.ceRegioesMapApi.getRegiaoToCodigos();
    for (const reg of regs) {
      const set = regMap.get(reg);
      if (!set) continue;
      for (const c of set) allowedByReg.add(String(c));
    }
  }

  return rows.filter((row) => {
    if (anos.length && !anos.includes(String(row.ano))) return false;
    if (meses.length && !meses.includes(row.mesAnoKey)) return false;
    if (muns.length && !muns.includes(String(row.codigo))) return false;
    if (allowedByReg && !allowedByReg.has(String(row.codigo))) return false;
    if (desdobramento !== CG_DESDOBRAMENTO_TODOS_KEY && row.desdobramento !== desdobramento) return false;
    return true;
  });
}

function cgLatestMesAnoKeyInRows(rows) {
  let bestRank = -1;
  let bestKey = "";
  for (const row of rows) {
    if (!row.mesAnoKey) continue;
    const rk = cgMesAnoKeyRank(row.mesAnoKey);
    if (rk > bestRank) {
      bestRank = rk;
      bestKey = row.mesAnoKey;
    }
  }
  return bestRank > 0 ? bestKey : "";
}

function cgEmptyMunAgg(municipio = "", codigo = null) {
  return {
    codigo,
    municipio,
    estoque: 0,
    estoqueTotal: 0,
    estoqueAlojamento: 0,
    estoqueAlimentacao: 0,
    admitidos: 0,
    desligados: 0,
    saldo: 0,
    salarioMedio: null,
    salarioAlojamento: null,
    salarioAlimentacao: null,
  };
}

function cgAggregateByCodigoAtMonths(rows, grupoKey) {
  const grupoRows = cgRowsForGrupo(rows, grupoKey);
  /** @type {Map<string, Map<number, ReturnType<typeof cgEmptyMunAgg>>>} */
  const byMonth = new Map();
  for (const row of grupoRows) {
    if (!row.mesAnoKey) continue;
    let byCod = byMonth.get(row.mesAnoKey);
    if (!byCod) {
      byCod = new Map();
      byMonth.set(row.mesAnoKey, byCod);
    }
    const cur = byCod.get(row.codigo) || cgEmptyMunAgg(row.municipio, row.codigo);
    const desdobKey = cgNormDesdobramentoKey(row.desdobramento);
    const estoqueRow = Number(row.estoque) || 0;
    byCod.set(row.codigo, {
      codigo: row.codigo,
      municipio: cur.municipio || row.municipio,
      estoque: cur.estoque + estoqueRow,
      estoqueTotal: Math.max(cur.estoqueTotal || 0, row.estoqueTotal || 0),
      estoqueAlojamento: cur.estoqueAlojamento + (desdobKey === "alojamento" ? estoqueRow : 0),
      estoqueAlimentacao: cur.estoqueAlimentacao + (desdobKey === "alimentacao" ? estoqueRow : 0),
      admitidos: cur.admitidos + row.admitidos,
      desligados: cur.desligados + row.desligados,
      saldo: cur.saldo + row.saldo,
    });
  }
  return byMonth;
}

function cgGetMunicipioMetricFromMonthAgg(monthAgg, codigo, metricField) {
  if (!monthAgg) return null;
  const cod = parseInt(String(codigo), 10);
  const vals = monthAgg.get(cod);
  if (!vals) return null;
  const value = vals[metricField];
  return Number.isFinite(value) ? value : null;
}

function cgAggregateByCodigo(rows, grupoKey) {
  const grupoRows = cgRowsForGrupo(rows, grupoKey);
  const latestMesKey = cgLatestMesAnoKeyInRows(grupoRows);
  const byMonth = cgAggregateByCodigoAtMonths(rows, grupoKey);
  /** @type {Map<number, ReturnType<typeof cgEmptyMunAgg>>} */
  const byCod = new Map();

  for (const monthAgg of byMonth.values()) {
    for (const [cod, vals] of monthAgg) {
      const cur = byCod.get(cod) || cgEmptyMunAgg(vals.municipio, cod);
      byCod.set(cod, {
        codigo: cod,
        municipio: cur.municipio || vals.municipio,
        estoque: cur.estoque,
        estoqueTotal: cur.estoqueTotal,
        estoqueAlojamento: cur.estoqueAlojamento,
        estoqueAlimentacao: cur.estoqueAlimentacao,
        admitidos: cur.admitidos + vals.admitidos,
        desligados: cur.desligados + vals.desligados,
        saldo: cur.saldo + vals.saldo,
      });
    }
  }

  if (latestMesKey) {
    const latestAgg = byMonth.get(latestMesKey);
    if (latestAgg) {
      for (const [cod, vals] of latestAgg) {
        const cur = byCod.get(cod) || cgEmptyMunAgg(vals.municipio, cod);
        const aloj = Number(vals.estoqueAlojamento) || 0;
        const alim = Number(vals.estoqueAlimentacao) || 0;
        const totalGrup = aloj + alim;
        byCod.set(cod, {
          ...cur,
          codigo: cod,
          municipio: cur.municipio || vals.municipio,
          estoque: totalGrup > 0 ? totalGrup : vals.estoque,
          estoqueTotal: vals.estoqueTotal || 0,
          estoqueAlojamento: aloj,
          estoqueAlimentacao: alim,
        });
      }
    }
  }

  return byCod;
}

/**
 * Garante Alojamento/Alimentação (Estoque_Mensal) no agg mesmo com filtro de desdobramento ativo.
 * Total por grupamento = soma dos dois.
 */
function cgEnrichAggDesdobramentoEstoque(aggByCod, rows, grupoKey) {
  const base = cgRowsForGrupo(cgFilterRowsIgnoreDesdobramento(rows), grupoKey);
  const latest = cgLatestMesAnoKeyInRows(base);
  const monthRows = latest ? base.filter((r) => r.mesAnoKey === latest) : [];
  /** @type {Map<number, { municipio: string, alojamento: number, alimentacao: number }>} */
  const byCod = new Map();
  for (const row of monthRows) {
    const key = cgNormDesdobramentoKey(row.desdobramento);
    const cur = byCod.get(row.codigo) || {
      municipio: row.municipio,
      alojamento: 0,
      alimentacao: 0,
    };
    const estoqueRow = Number(row.estoque) || 0;
    if (key === "alojamento") cur.alojamento += estoqueRow;
    else if (key === "alimentacao") cur.alimentacao += estoqueRow;
    byCod.set(row.codigo, cur);
  }
  for (const [cod, parts] of byCod) {
    const cur = aggByCod.get(cod) || cgEmptyMunAgg(parts.municipio, cod);
    const aloj = parts.alojamento;
    const alim = parts.alimentacao;
    const desdob = cgGetSelectedDesdobramento();
    const useSumAsTotal = desdob === CG_DESDOBRAMENTO_TODOS_KEY;
    aggByCod.set(cod, {
      ...cur,
      codigo: cod,
      municipio: cur.municipio || parts.municipio,
      estoqueAlojamento: aloj,
      estoqueAlimentacao: alim,
      estoque: useSumAsTotal ? aloj + alim : cur.estoque,
    });
  }
  return aggByCod;
}

function cgFilterSalarioRowsIgnoringDesdobramento(rows) {
  /* Salário é anual na planilha própria: não aplica filtro de ano/mês do CAGED mensal. */
  const muns = cgGetSelectedMunicipioCodes();
  const regs = cgGetSelectedRegioes();
  let allowedByReg = null;
  if (regs.length && typeof window.ceRegioesMapApi?.getRegiaoToCodigos === "function") {
    allowedByReg = new Set();
    const regMap = window.ceRegioesMapApi.getRegiaoToCodigos();
    for (const reg of regs) {
      const set = regMap.get(reg);
      if (!set) continue;
      for (const c of set) allowedByReg.add(String(c));
    }
  }
  return rows.filter((row) => {
    if (muns.length && !muns.includes(String(row.codigo))) return false;
    if (allowedByReg && !allowedByReg.has(String(row.codigo))) return false;
    return true;
  });
}

function cgFilterSalarioRows(rows) {
  const desdobramento = cgGetSelectedDesdobramento();
  return cgFilterSalarioRowsIgnoringDesdobramento(rows).filter((row) => {
    if (desdobramento !== CG_DESDOBRAMENTO_TODOS_KEY && row.desdobramento !== desdobramento) {
      return false;
    }
    return true;
  });
}

/**
 * Salário médio no mapa: sem agregação entre desdobramentos.
 * Desdobramento = Todos → sem valor no mapa (selecione Alojamento ou Alimentação).
 * ***** → null (sem dado).
 */
function cgAggregateSalarioByCodigo(rows, grupoKey) {
  const desdobramento = cgGetSelectedDesdobramento();
  /** @type {Map<number, ReturnType<typeof cgEmptyMunAgg>>} */
  const byCod = new Map();

  const popupRows = cgRowsForGrupo(cgFilterSalarioRowsIgnoringDesdobramento(rows), grupoKey);
  for (const row of popupRows) {
    const key = cgNormDesdobramentoKey(row.desdobramento);
    const cur = byCod.get(row.codigo) || cgEmptyMunAgg(row.municipio, row.codigo);
    const prevAno = cur._salarioAno ?? -1;
    const ano = row.ano ?? 0;
    if (ano < prevAno) continue;
    if (ano > prevAno) {
      cur.salarioAlojamento = null;
      cur.salarioAlimentacao = null;
      cur._salarioAno = ano;
    }
    if (key === "alojamento") cur.salarioAlojamento = row.salarioMedio;
    else if (key === "alimentacao") cur.salarioAlimentacao = row.salarioMedio;
    cur.municipio = cur.municipio || row.municipio;
    byCod.set(row.codigo, cur);
  }

  if (desdobramento === CG_DESDOBRAMENTO_TODOS_KEY) {
    for (const cur of byCod.values()) cur.salarioMedio = null;
    return byCod;
  }

  const mapRows = cgRowsForGrupo(cgFilterSalarioRows(rows), grupoKey);
  for (const row of mapRows) {
    const cur = byCod.get(row.codigo) || cgEmptyMunAgg(row.municipio, row.codigo);
    const prevAno = cur._mapSalarioAno ?? -1;
    const ano = row.ano ?? 0;
    if (ano >= prevAno) {
      cur.salarioMedio = row.salarioMedio;
      cur._mapSalarioAno = ano;
      cur.municipio = cur.municipio || row.municipio;
      byCod.set(row.codigo, cur);
    }
  }
  return byCod;
}

function cgFmtPct(val, digits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(val) || 0);
}

function cgMesAnoLabel(key) {
  return typeof window.ceRegioesMapApi?.formatMesAnoKey === "function"
    ? window.ceRegioesMapApi.formatMesAnoKey(key)
    : key;
}

/** Rótulo curto para eixos: jan/25 */
function cgMesAnoLabelShort(key) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(key || ""));
  if (!m) return cgMesAnoLabel(key);
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const mi = parseInt(m[2], 10);
  if (mi < 1 || mi > 12) return `${m[2]}/${String(m[1]).slice(-2)}`;
  return `${meses[mi - 1]}/${String(m[1]).slice(-2)}`;
}

function cgPreviousMesAnoKey(latestKey, rows) {
  const latestRank = cgMesAnoKeyRank(latestKey);
  let bestRank = -1;
  let bestKey = "";
  for (const row of rows) {
    const rk = cgMesAnoKeyRank(row.mesAnoKey);
    if (rk < latestRank && rk > bestRank) {
      bestRank = rk;
      bestKey = row.mesAnoKey;
    }
  }
  return bestKey;
}

function cgDestroyChart(key) {
  const chart = cgCharts[key];
  if (!chart) return;
  try {
    chart.destroy();
  } catch (_) {}
  cgCharts[key] = null;
}

function cgDestroyCharts() {
  for (const key of Object.keys(cgCharts)) cgDestroyChart(key);
}

function cgGetMetricField(metricKey) {
  if (metricKey === CG_METRIC_TODOS_KEY) return "estoque";
  return CG_METRIC_OPTIONS.find((m) => m.key === metricKey)?.field || "estoque";
}

const CG_RANKING_TOP_N = 15;

function cgGetSelectedRankOrder() {
  const el = document.getElementById("cgRankOrder");
  return el?.value === "menores" ? "menores" : "maiores";
}

function cgRankOrderLabel(order) {
  return order === "menores" ? "15 menores" : "15 maiores";
}

function cgSortRankingRows(rows, order) {
  rows.sort((a, b) => {
    const cmp = order === "maiores" ? b.value - a.value : a.value - b.value;
    return cmp || a.label.localeCompare(b.label, "pt-BR");
  });
  return rows;
}

function cgPickMunicipioRankingEntries(aggByCod, field, order = cgGetSelectedRankOrder()) {
  const rows = [];
  for (const [, vals] of aggByCod.entries()) {
    const value = vals[field];
    if (!Number.isFinite(value)) continue;
    rows.push({
      codigo: vals.codigo,
      label: vals.municipio || `Código ${vals.codigo}`,
      value,
    });
  }
  return cgSortRankingRows(rows, order).slice(0, CG_RANKING_TOP_N);
}

function cgPickRegiaoRankingEntries(aggByCod, field, order = cgGetSelectedRankOrder()) {
  const regMap = window.ceRegioesMapApi?.getRegiaoToCodigos?.();
  if (!regMap) return [];
  const rows = [];
  for (const [regName, codSet] of regMap.entries()) {
    let sum = 0;
    for (const cod of codSet) {
      const v = aggByCod.get(cod);
      if (v && Number.isFinite(v[field])) sum += v[field];
    }
    rows.push({ label: regName, value: sum });
  }
  return cgSortRankingRows(rows, order).slice(0, CG_RANKING_TOP_N);
}

function cgBuildRankingBarConfig(entries, color, seriesName) {
  const hasData = entries.length > 0;
  const data = hasData ? entries.map((e) => ({ x: e.label, y: e.value })) : [{ x: "Sem dados no filtro", y: 0 }];
  const height = Math.max(280, 48 + Math.max(entries.length || 1, 1) * 28);
  const valFmt = (val) => cgFmt.format(Number(val) || 0);
  return {
    config: {
      chart: {
        type: "bar",
        height,
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
      colors: [color],
      series: [{ name: seriesName, data }],
      xaxis: {
        type: "category",
        labels: { formatter: (v) => valFmt(v), style: { fontSize: "11px", colors: "#475569" } },
      },
      yaxis: {
        labels: {
          maxWidth: 160,
          style: { fontSize: "11px", colors: "#1f2d78" },
        },
      },
      grid: {
        borderColor: "#e2e8f0",
        padding: { left: 12, right: 18, top: 8, bottom: 8 },
      },
      dataLabels: {
        enabled: hasData,
        formatter: (val) => valFmt(val),
        style: { fontSize: "10px", fontWeight: 600, colors: ["#fff"] },
        offsetX: -8,
      },
      tooltip: {
        y: { formatter: (val) => valFmt(val) },
      },
    },
    height,
  };
}

function cgUpdateRankingHints(order) {
  const metricKey = cgGetSelectedMetricKey();
  const metricLabel = cgMetricLabel(metricKey);
  const grupoLabel = cgGrupoLabel(cgGetSelectedGrupoKey());
  const mapMetricNote =
    metricKey === CG_METRIC_TODOS_KEY ? " · mapa por estoque mensal" : "";
  const orderNote = cgRankOrderLabel(order);
  const headHint = document.getElementById("cgRankingsHeadHint");
  if (headHint) {
    headHint.textContent = `${metricLabel}${mapMetricNote} · ${grupoLabel} · ${orderNote} · valor absoluto no recorte dos filtros · mesmos filtros do mapa`;
  }
}

function cgUpdateRankingCharts(filtered, grupoKey) {
  if (typeof ApexCharts === "undefined") return;
  const metricKey = cgGetSelectedMetricKey();
  const metricField = cgGetMetricField(metricKey);
  const metricLabel = cgMetricLabel(metricKey);
  const order = cgGetSelectedRankOrder();
  const aggByCod = cgAggregateByCodigo(filtered, grupoKey);
  const munEntries = cgPickMunicipioRankingEntries(aggByCod, metricField, order);
  const regEntries = cgPickRegiaoRankingEntries(aggByCod, metricField, order);
  cgUpdateRankingHints(order);

  const munEl = document.getElementById("cgChartFormalizacaoMun");
  if (munEl) {
    cgDestroyChart("formMun");
    const { config } = cgBuildRankingBarConfig(munEntries, CG_BAR_FORMALIZACAO_COLOR, metricLabel);
    const chart = new ApexCharts(munEl, config);
    chart.render();
    cgCharts.formMun = chart;
  }

  const regEl = document.getElementById("cgChartFormalizacaoReg");
  if (regEl) {
    cgDestroyChart("formReg");
    const { config } = cgBuildRankingBarConfig(regEntries, CG_BAR_FORMALIZACAO_COLOR, metricLabel);
    const chart = new ApexCharts(regEl, config);
    chart.render();
    cgCharts.formReg = chart;
  }
}

const CG_ANALYTICS_TOP_N = 15;
const CG_SALDO_BAR_MAX = 40;
const CG_COLOR_NEG = "#dc2626";
const CG_COLOR_POS = "#059669";
const CG_COLOR_NEUTRAL = "#64748b";
const CG_COLOR_ALOJ = "#2563eb";
const CG_COLOR_ALIM = "#ea580c";
const CG_COLOR_ROT = "#7c3aed";
const CG_COLOR_PESO = "#0d9488";
const CG_COLOR_ADM = "#16a34a";
const CG_COLOR_DESL = "#ea580c";
const CG_COLOR_SALDO_LINE = "#1d4ed8";
const CG_COLOR_MOV = "#7c3aed";
const CG_COMPARE_ESTOQUE_COLORS = ["#1a4d2e", "#2563eb", "#ea580c", "#7c3aed"];
const CG_SAZONALIDADE_YEAR_COLORS = ["#1a4d2e", "#2563eb", "#ea580c", "#7c3aed", "#0d9488", "#be123c"];
const CG_MES_LABELS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
/** Meses de pico turístico no litoral leste (1-indexed). */
const CG_SAZONALIDADE_PICOS = new Set([1, 7, 12]);
const CG_COMPARE_MUN_IDS = ["cgCompareMun1", "cgCompareMun2", "cgCompareMun3", "cgCompareMun4"];
const CG_COMPARE_EMPTY = "";
/** @type {string[]} */
let cgCompareMunDefaultsApplied = false;

function cgNormDesdobramentoKey(label) {
  const n = String(label ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (n.includes("aloj")) return "alojamento";
  if (n.includes("aliment")) return "alimentacao";
  return n.replace(/\s+/g, "_");
}

/** Filtros espaciais/temporais sem desdobramento (para comparativo Alojamento × Alimentação). */
function cgFilterRowsIgnoreDesdobramento(rows) {
  const anos = cgGetSelectedAnos();
  const meses = cgGetSelectedMesKeys();
  const muns = cgGetSelectedMunicipioCodes();
  const regs = cgGetSelectedRegioes();
  let allowedByReg = null;
  if (regs.length && typeof window.ceRegioesMapApi?.getRegiaoToCodigos === "function") {
    allowedByReg = new Set();
    const regMap = window.ceRegioesMapApi.getRegiaoToCodigos();
    for (const reg of regs) {
      const set = regMap.get(reg);
      if (!set) continue;
      for (const c of set) allowedByReg.add(String(c));
    }
  }
  return rows.filter((row) => {
    if (anos.length && !anos.includes(String(row.ano))) return false;
    if (meses.length && !meses.includes(row.mesAnoKey)) return false;
    if (muns.length && !muns.includes(String(row.codigo))) return false;
    if (allowedByReg && !allowedByReg.has(String(row.codigo))) return false;
    return true;
  });
}

function cgBuildMunicipioAnalyticsList(filtered, grupoKey) {
  const agg = cgAggregateByCodigo(filtered, grupoKey);
  const list = [];
  for (const vals of agg.values()) {
    const movimento = (vals.admitidos || 0) + (vals.desligados || 0);
    const estoque = Number(vals.estoque) || 0;
    const estoqueTotal = Number(vals.estoqueTotal) || 0;
    const saldo = Number(vals.saldo) || 0;
    list.push({
      codigo: vals.codigo,
      label: vals.municipio || `Código ${vals.codigo}`,
      estoque,
      estoqueTotal,
      admitidos: Number(vals.admitidos) || 0,
      desligados: Number(vals.desligados) || 0,
      saldo,
      movimento,
      rotatividade: estoque > 0 ? movimento / estoque : null,
      pesoEstoque: estoqueTotal > 0 ? estoque / estoqueTotal : null,
    });
  }
  return list;
}

function cgPickSaldoSpectrum(list) {
  const withSignal = list.filter((m) => m.saldo !== 0 || m.movimento > 0);
  withSignal.sort((a, b) => a.saldo - b.saldo || a.label.localeCompare(b.label, "pt-BR"));
  if (withSignal.length <= CG_SALDO_BAR_MAX) return withSignal;
  const half = Math.floor(CG_SALDO_BAR_MAX / 2);
  return [...withSignal.slice(0, half), ...withSignal.slice(-half)];
}

function cgUpdateSaldoMunChart(list) {
  const el = document.getElementById("cgChartSaldoMun");
  if (!el || typeof ApexCharts === "undefined") return;
  cgDestroyChart("saldoMun");
  const entries = cgPickSaldoSpectrum(list);
  const hasData = entries.length > 0;
  const data = hasData
    ? entries.map((e) => ({
        x: e.label,
        y: e.saldo,
        fillColor: e.saldo < 0 ? CG_COLOR_NEG : e.saldo > 0 ? CG_COLOR_POS : CG_COLOR_NEUTRAL,
      }))
    : [{ x: "Sem movimentação no filtro", y: 0, fillColor: CG_COLOR_NEUTRAL }];
  const height = Math.max(320, 48 + Math.max(entries.length || 1, 1) * 22);
  const chart = new ApexCharts(el, {
    chart: {
      type: "bar",
      height,
      toolbar: { show: false },
      animations: { speed: 260 },
      fontFamily: "system-ui, Segoe UI, sans-serif",
      foreColor: "#1f2d78",
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "70%",
        borderRadius: 3,
        borderRadiusApplication: "end",
        colors: {
          ranges: [
            { from: -1e9, to: -0.0001, color: CG_COLOR_NEG },
            { from: 0, to: 0, color: CG_COLOR_NEUTRAL },
            { from: 0.0001, to: 1e9, color: CG_COLOR_POS },
          ],
        },
      },
    },
    series: [{ name: "Saldo", data }],
    xaxis: {
      labels: { formatter: (v) => cgFmt.format(Number(v) || 0), style: { fontSize: "11px" } },
      title: { text: "Saldo (Admitidos − Desligados)", style: { fontSize: "11px", color: "#64748b" } },
    },
    yaxis: { labels: { maxWidth: 140, style: { fontSize: "11px" } } },
    dataLabels: {
      enabled: hasData,
      formatter: (val) => cgFmt.format(Number(val) || 0),
      style: { fontSize: "10px", colors: ["#0f172a"] },
    },
    tooltip: {
      y: {
        formatter: (val, opts) => {
          const row = entries[opts.dataPointIndex];
          if (!row) return cgFmt.format(Number(val) || 0);
          return `${cgFmt.format(row.saldo)} · Adm ${cgFmt.format(row.admitidos)} · Desl ${cgFmt.format(row.desligados)}`;
        },
      },
    },
    grid: { borderColor: "#e2e8f0", xaxis: { lines: { show: true } } },
    legend: { show: false },
  });
  chart.render();
  cgCharts.saldoMun = chart;
}

function cgUpdateRotatividadeChart(list) {
  const el = document.getElementById("cgChartRotatividade");
  if (!el || typeof ApexCharts === "undefined") return;
  cgDestroyChart("rotatividade");
  const ranked = list
    .filter((m) => m.estoque > 0 && m.rotatividade != null)
    .sort((a, b) => b.rotatividade - a.rotatividade || a.label.localeCompare(b.label, "pt-BR"))
    .slice(0, CG_ANALYTICS_TOP_N);
  const hasData = ranked.length > 0;
  const data = hasData
    ? ranked.map((e) => ({ x: e.label, y: Number((e.rotatividade * 100).toFixed(2)) }))
    : [{ x: "Sem dados no filtro", y: 0 }];
  const height = Math.max(320, 48 + Math.max(ranked.length || 1, 1) * 24);
  const chart = new ApexCharts(el, {
    chart: {
      type: "bar",
      height,
      toolbar: { show: false },
      animations: { speed: 260 },
      fontFamily: "system-ui, Segoe UI, sans-serif",
      foreColor: "#1f2d78",
    },
    plotOptions: { bar: { horizontal: true, barHeight: "70%", borderRadius: 3, borderRadiusApplication: "end" } },
    colors: [CG_COLOR_ROT],
    series: [{ name: "Rotatividade (%)", data }],
    xaxis: {
      labels: { formatter: (v) => `${cgFmtPct(v, 1)}%`, style: { fontSize: "11px" } },
      title: { text: "(Adm + Desl) / Estoque mensal", style: { fontSize: "11px", color: "#64748b" } },
    },
    yaxis: { labels: { maxWidth: 140, style: { fontSize: "11px" } } },
    dataLabels: {
      enabled: hasData,
      formatter: (val) => `${cgFmtPct(val, 1)}%`,
      style: { fontSize: "10px", colors: ["#fff"] },
    },
    tooltip: {
      y: {
        formatter: (val, opts) => {
          const row = ranked[opts.dataPointIndex];
          if (!row) return `${cgFmtPct(val, 1)}%`;
          return `${cgFmtPct(val, 1)}% · movimento ${cgFmt.format(row.movimento)} · estoque ${cgFmt.format(row.estoque)}`;
        },
      },
    },
    grid: { borderColor: "#e2e8f0" },
  });
  chart.render();
  cgCharts.rotatividade = chart;
}

function cgUpdatePesoEstoqueChart(list) {
  const el = document.getElementById("cgChartPesoEstoque");
  if (!el || typeof ApexCharts === "undefined") return;
  cgDestroyChart("pesoEstoque");
  const ranked = list
    .filter((m) => m.estoqueTotal > 0 && m.pesoEstoque != null)
    .sort((a, b) => b.pesoEstoque - a.pesoEstoque || a.label.localeCompare(b.label, "pt-BR"))
    .slice(0, CG_ANALYTICS_TOP_N);
  const hasData = ranked.length > 0;
  const data = hasData
    ? ranked.map((e) => ({ x: e.label, y: Number((e.pesoEstoque * 100).toFixed(2)) }))
    : [{ x: "Sem dados no filtro", y: 0 }];
  const height = Math.max(320, 48 + Math.max(ranked.length || 1, 1) * 24);
  const chart = new ApexCharts(el, {
    chart: {
      type: "bar",
      height,
      toolbar: { show: false },
      animations: { speed: 260 },
      fontFamily: "system-ui, Segoe UI, sans-serif",
      foreColor: "#1f2d78",
    },
    plotOptions: { bar: { horizontal: true, barHeight: "70%", borderRadius: 3, borderRadiusApplication: "end" } },
    colors: [CG_COLOR_PESO],
    series: [{ name: "Peso (%)", data }],
    xaxis: {
      labels: { formatter: (v) => `${cgFmtPct(v, 1)}%`, style: { fontSize: "11px" } },
      title: { text: "Estoque mensal / Estoque total", style: { fontSize: "11px", color: "#64748b" } },
    },
    yaxis: { labels: { maxWidth: 140, style: { fontSize: "11px" } } },
    dataLabels: {
      enabled: hasData,
      formatter: (val) => `${cgFmtPct(val, 1)}%`,
      style: { fontSize: "10px", colors: ["#fff"] },
    },
    tooltip: {
      y: {
        formatter: (val, opts) => {
          const row = ranked[opts.dataPointIndex];
          if (!row) return `${cgFmtPct(val, 1)}%`;
          return `${cgFmtPct(val, 1)}% · mensal ${cgFmt.format(row.estoque)} · total ${cgFmt.format(row.estoqueTotal)}`;
        },
      },
    },
    grid: { borderColor: "#e2e8f0" },
  });
  chart.render();
  cgCharts.pesoEstoque = chart;
}

function cgUpdateAlojAlimChart(rows, grupoKey) {
  const el = document.getElementById("cgChartAlojAlim");
  if (!el || typeof ApexCharts === "undefined") return;
  cgDestroyChart("alojAlim");

  const base = cgRowsForGrupo(cgFilterRowsIgnoreDesdobramento(rows), grupoKey);
  const latest = cgLatestMesAnoKeyInRows(base);
  const monthRows = latest ? base.filter((r) => r.mesAnoKey === latest) : base;

  /** @type {Map<number, { label: string, alojamento: number, alimentacao: number }>} */
  const byCod = new Map();
  for (const row of monthRows) {
    const key = cgNormDesdobramentoKey(row.desdobramento);
    const cur = byCod.get(row.codigo) || {
      label: row.municipio,
      alojamento: 0,
      alimentacao: 0,
    };
    if (key === "alojamento") cur.alojamento += row.estoque;
    else if (key === "alimentacao") cur.alimentacao += row.estoque;
    byCod.set(row.codigo, cur);
  }

  const ranked = [...byCod.values()]
    .map((v) => ({ ...v, total: v.alojamento + v.alimentacao }))
    .filter((v) => v.total > 0)
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, "pt-BR"))
    .slice(0, CG_ANALYTICS_TOP_N);

  const cats = ranked.length ? ranked.map((r) => r.label) : ["Sem dados no filtro"];
  const height = Math.max(320, 48 + Math.max(ranked.length || 1, 1) * 28);
  const chart = new ApexCharts(el, {
    chart: {
      type: "bar",
      height,
      stacked: false,
      toolbar: { show: false },
      animations: { speed: 260 },
      fontFamily: "system-ui, Segoe UI, sans-serif",
      foreColor: "#1f2d78",
    },
    plotOptions: { bar: { horizontal: true, barHeight: "68%", borderRadius: 3, borderRadiusApplication: "end" } },
    colors: [CG_COLOR_ALOJ, CG_COLOR_ALIM],
    series: [
      { name: "Alojamento", data: ranked.length ? ranked.map((r) => r.alojamento) : [0] },
      { name: "Alimentação", data: ranked.length ? ranked.map((r) => r.alimentacao) : [0] },
    ],
    xaxis: {
      categories: cats,
      labels: { formatter: (v) => cgFmt.format(Number(v) || 0), style: { fontSize: "11px" } },
    },
    yaxis: { labels: { maxWidth: 140, style: { fontSize: "11px" } } },
    legend: { position: "top", horizontalAlign: "left" },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (val) => cgFmt.format(Number(val) || 0) } },
    grid: { borderColor: "#e2e8f0" },
  });
  chart.render();
  cgCharts.alojAlim = chart;
}

function cgRenderEstagnadosTable(list) {
  const body = document.getElementById("cgEstagnadosBody");
  const hint = document.getElementById("cgEstagnadosHint");
  if (!body) return;
  const rows = list
    .filter((m) => m.estoque > 0 && m.admitidos === 0 && m.desligados === 0)
    .sort((a, b) => b.estoque - a.estoque || a.label.localeCompare(b.label, "pt-BR"));
  if (hint) {
    hint.textContent = rows.length
      ? `${rows.length.toLocaleString("pt-BR")} município(s) com estoque mensal e sem admitidos/desligados no recorte`
      : "Nenhum município estagnado no recorte dos filtros";
  }
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="3">Sem registros neste filtro</td></tr>`;
    return;
  }
  body.innerHTML = rows
    .map(
      (r) => `<tr>
      <td>${r.label}</td>
      <td>${cgFmt.format(r.estoque)}</td>
      <td>${cgFmt.format(r.estoqueTotal)}</td>
    </tr>`
    )
    .join("");
}

/** Filtros da série temporal: ignora mês para mostrar a trajetória no período. */
function cgFilterRowsIgnoreMes(rows) {
  const anos = cgGetSelectedAnos();
  const muns = cgGetSelectedMunicipioCodes();
  const regs = cgGetSelectedRegioes();
  const desdobramento = cgGetSelectedDesdobramento();
  let allowedByReg = null;
  if (regs.length && typeof window.ceRegioesMapApi?.getRegiaoToCodigos === "function") {
    allowedByReg = new Set();
    const regMap = window.ceRegioesMapApi.getRegiaoToCodigos();
    for (const reg of regs) {
      const set = regMap.get(reg);
      if (!set) continue;
      for (const c of set) allowedByReg.add(String(c));
    }
  }
  return rows.filter((row) => {
    if (anos.length && !anos.includes(String(row.ano))) return false;
    if (muns.length && !muns.includes(String(row.codigo))) return false;
    if (allowedByReg && !allowedByReg.has(String(row.codigo))) return false;
    if (desdobramento !== CG_DESDOBRAMENTO_TODOS_KEY && row.desdobramento !== desdobramento) return false;
    return true;
  });
}

function cgBuildMovimentacaoPorMes(rows, grupoKey) {
  const grupoRows = cgRowsForGrupo(rows, grupoKey).filter((r) => r.mesAnoKey);
  /** @type {Map<string, { admitidos: number, desligados: number, saldo: number }>} */
  const byMes = new Map();
  for (const row of grupoRows) {
    const cur = byMes.get(row.mesAnoKey) || { admitidos: 0, desligados: 0, saldo: 0 };
    cur.admitidos += Number(row.admitidos) || 0;
    cur.desligados += Number(row.desligados) || 0;
    cur.saldo += Number(row.saldo) || 0;
    byMes.set(row.mesAnoKey, cur);
  }
  return [...byMes.entries()]
    .sort((a, b) => cgMesAnoKeyRank(a[0]) - cgMesAnoKeyRank(b[0]))
    .map(([mesAnoKey, vals]) => ({
      mesAnoKey,
      label: cgMesAnoLabelShort(mesAnoKey),
      labelFull: cgMesAnoLabel(mesAnoKey),
      admitidos: vals.admitidos,
      desligados: vals.desligados,
      saldo: vals.saldo,
      movimento: vals.admitidos + vals.desligados,
    }));
}

function cgUpdateMovimentacaoLineChart(rows, grupoKey) {
  const el = document.getElementById("cgChartMovimentacaoLine");
  if (!el || typeof ApexCharts === "undefined") return;
  cgDestroyChart("movimentacaoLine");

  const seriesRows = cgBuildMovimentacaoPorMes(cgFilterRowsIgnoreMes(rows), grupoKey);
  const cats = seriesRows.length ? seriesRows.map((r) => r.label) : ["Sem dados"];
  const admitidos = seriesRows.length ? seriesRows.map((r) => r.admitidos) : [0];
  const desligados = seriesRows.length ? seriesRows.map((r) => r.desligados) : [0];
  const saldo = seriesRows.length ? seriesRows.map((r) => r.saldo) : [0];
  const movimento = seriesRows.length ? seriesRows.map((r) => r.movimento) : [0];

  const chart = new ApexCharts(el, {
    chart: {
      type: "line",
      height: 360,
      toolbar: { show: false },
      animations: { speed: 280 },
      fontFamily: "system-ui, Segoe UI, sans-serif",
      foreColor: "#1f2d78",
      zoom: { enabled: false },
    },
    stroke: { width: [3, 3, 3, 2], curve: "smooth", dashArray: [0, 0, 0, 6] },
    colors: [CG_COLOR_ADM, CG_COLOR_DESL, CG_COLOR_SALDO_LINE, CG_COLOR_MOV],
    series: [
      { name: "Admitidos", data: admitidos },
      { name: "Desligados", data: desligados },
      { name: "Saldo", data: saldo },
      { name: "Movimentação (Adm+Desl)", data: movimento },
    ],
    xaxis: {
      categories: cats,
      tickAmount: seriesRows.length || undefined,
      labels: {
        rotate: -45,
        rotateAlways: seriesRows.length > 6,
        hideOverlappingLabels: false,
        showDuplicates: true,
        trim: false,
        style: { fontSize: "11px", fontWeight: 600 },
      },
      title: { text: "Mês de referência", style: { fontSize: "11px", color: "#64748b" } },
    },
    yaxis: {
      labels: { formatter: (v) => cgFmt.format(Number(v) || 0), style: { fontSize: "11px" } },
      title: { text: "Vínculos", style: { fontSize: "11px", color: "#64748b" } },
    },
    markers: { size: seriesRows.length <= 24 ? 3 : 2, hover: { sizeOffset: 2 } },
    legend: { position: "top", horizontalAlign: "left", fontSize: "12px" },
    dataLabels: { enabled: false },
    tooltip: {
      shared: true,
      intersect: false,
      x: {
        formatter: (_val, opts) => {
          const row = seriesRows[opts?.dataPointIndex];
          return row?.labelFull || row?.label || "";
        },
      },
      y: { formatter: (val) => cgFmt.format(Number(val) || 0) },
    },
    grid: { borderColor: "#e2e8f0", padding: { bottom: 8 } },
    annotations: {
      yaxis: [
        {
          y: 0,
          borderColor: "#94a3b8",
          strokeDashArray: 4,
          opacity: 0.7,
        },
      ],
    },
  });
  chart.render();
  cgCharts.movimentacaoLine = chart;
}

/**
 * Estoque mensal por calendário (mês 1–12 × ano) para comparação YoY lado a lado.
 * @returns {{ years: number[], byYearMonth: Map<number, number[]>, yoyByYearMonth: Map<number, (number|null)[]> }}
 */
function cgBuildSazonalidadeYoY(rows, grupoKey) {
  const grupoRows = cgRowsForGrupo(rows, grupoKey).filter((r) => r.mesAnoKey);
  /** @type {Map<string, number>} chave YYYY-MM → estoque */
  const byKey = new Map();
  for (const row of grupoRows) {
    const key = row.mesAnoKey;
    byKey.set(key, (byKey.get(key) || 0) + (Number(row.estoque) || 0));
  }

  const years = [
    ...new Set(
      [...byKey.keys()]
        .map((k) => {
          const m = /^(\d{4})-(\d{2})$/.exec(k);
          return m ? parseInt(m[1], 10) : null;
        })
        .filter((y) => Number.isFinite(y))
    ),
  ].sort((a, b) => a - b);

  /** @type {Map<number, number[]>} */
  const byYearMonth = new Map();
  for (const year of years) {
    const vals = Array(12).fill(null);
    for (let mi = 1; mi <= 12; mi++) {
      const key = `${year}-${String(mi).padStart(2, "0")}`;
      if (byKey.has(key)) vals[mi - 1] = byKey.get(key);
    }
    byYearMonth.set(year, vals);
  }

  /** Variação % vs mesmo mês do ano anterior. */
  /** @type {Map<number, (number|null)[]>} */
  const yoyByYearMonth = new Map();
  for (const year of years) {
    const cur = byYearMonth.get(year) || [];
    const prev = byYearMonth.get(year - 1);
    const yoy = cur.map((v, i) => {
      if (!Number.isFinite(v)) return null;
      const p = prev?.[i];
      if (!Number.isFinite(p) || p === 0) return null;
      return ((v - p) / p) * 100;
    });
    yoyByYearMonth.set(year, yoy);
  }

  return { years, byYearMonth, yoyByYearMonth };
}

function cgUpdateSazonalidadeYoYChart(rows, grupoKey) {
  const el = document.getElementById("cgChartSazonalidadeYoY");
  if (!el || typeof ApexCharts === "undefined") return;
  cgDestroyChart("sazonalidadeYoY");

  const { years, byYearMonth, yoyByYearMonth } = cgBuildSazonalidadeYoY(
    cgFilterRowsIgnoreMes(rows),
    grupoKey
  );
  const hasData = years.some((y) => (byYearMonth.get(y) || []).some((v) => Number.isFinite(v)));
  const series = hasData
    ? years.map((year) => ({
        name: String(year),
        data: (byYearMonth.get(year) || []).map((v) => (Number.isFinite(v) ? v : null)),
      }))
    : [{ name: "Sem dados", data: Array(12).fill(0) }];

  const chart = new ApexCharts(el, {
    chart: {
      type: "bar",
      height: 380,
      toolbar: { show: false },
      animations: { speed: 280 },
      fontFamily: "system-ui, Segoe UI, sans-serif",
      foreColor: "#1f2d78",
      stacked: false,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: years.length > 3 ? "78%" : "62%",
        borderRadius: 3,
        borderRadiusApplication: "end",
      },
    },
    colors: CG_SAZONALIDADE_YEAR_COLORS,
    series,
    xaxis: {
      categories: CG_MES_LABELS_SHORT,
      labels: {
        style: {
          fontSize: "11px",
          fontWeight: 600,
          colors: CG_MES_LABELS_SHORT.map((_, i) =>
            CG_SAZONALIDADE_PICOS.has(i + 1) ? "#c2410c" : "#1f2d78"
          ),
        },
      },
      title: {
        text: "Mês do ano (picos turísticos: jan · jul · dez)",
        style: { fontSize: "11px", color: "#64748b" },
      },
    },
    yaxis: {
      labels: { formatter: (v) => cgFmt.format(Number(v) || 0), style: { fontSize: "11px" } },
      title: { text: "Estoque mensal", style: { fontSize: "11px", color: "#64748b" } },
    },
    legend: { position: "top", horizontalAlign: "left", fontSize: "12px" },
    dataLabels: { enabled: false },
    tooltip: {
      shared: true,
      intersect: false,
      custom: ({ series: sArr, dataPointIndex, w }) => {
        const mesLabel = CG_MES_LABELS_SHORT[dataPointIndex] || "";
        const pico = CG_SAZONALIDADE_PICOS.has(dataPointIndex + 1)
          ? ` <span style="color:#c2410c;font-weight:700">(pico)</span>`
          : "";
        let rowsHtml = "";
        const seriesNames = w?.globals?.seriesNames || [];
        for (let si = 0; si < (sArr?.length || 0); si++) {
          const yearName = seriesNames[si] || String(years[si] ?? "");
          const yearNum = parseInt(yearName, 10);
          const val = sArr[si]?.[dataPointIndex];
          if (!Number.isFinite(val)) continue;
          const color =
            w?.globals?.colors?.[si] ||
            CG_SAZONALIDADE_YEAR_COLORS[si % CG_SAZONALIDADE_YEAR_COLORS.length];
          const yoy = Number.isFinite(yearNum)
            ? yoyByYearMonth.get(yearNum)?.[dataPointIndex]
            : null;
          const yoyTxt =
            yoy == null ? "" : ` · YoY ${yoy >= 0 ? "+" : ""}${cgFmtPct(yoy, 1)}%`;
          rowsHtml += `<div style="display:flex;gap:8px;align-items:baseline;margin-top:4px">
            <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0"></span>
            <span style="font-weight:700">${yearName}</span>
            <span>${cgFmt.format(val)} vínculos${yoyTxt}</span>
          </div>`;
        }
        if (!rowsHtml) {
          rowsHtml = `<div style="margin-top:4px;color:#64748b">Sem estoque neste mês</div>`;
        }
        return `<div class="apexcharts-tooltip-title" style="font-family:system-ui,Segoe UI,sans-serif;padding:8px 10px">
          ${mesLabel}${pico}
          ${rowsHtml}
        </div>`;
      },
    },
    grid: { borderColor: "#e2e8f0", padding: { bottom: 4 } },
  });
  chart.render();
  cgCharts.sazonalidadeYoY = chart;
}

function cgGetCompareMunicipioCodes() {
  const codes = [];
  const seen = new Set();
  for (const id of CG_COMPARE_MUN_IDS) {
    const sel = document.getElementById(id);
    const v = String(sel?.value || "").trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    codes.push(v);
    if (codes.length >= 4) break;
  }
  return codes;
}

function cgPopulateCompareMunicipioSelects() {
  if (!cgState.municipiosList.length) return;

  const selectedCodes = cgGetSelectedMunicipioCodes();
  const selectedSet = new Set(selectedCodes);
  const pool = cgState.municipiosList.filter((m) => selectedSet.has(String(m.codigo)));

  /* Padrão: até 4 dos municípios já selecionados no filtro principal. */
  const defaultCodes = [];
  if (!cgCompareMunDefaultsApplied) {
    for (const name of CG_DEFAULT_MUNICIPIOS.map(cgNormMunName)) {
      const hit = pool.find((m) => cgNormMunName(m.municipio) === name);
      if (hit) defaultCodes.push(String(hit.codigo));
      if (defaultCodes.length >= 4) break;
    }
    if (!defaultCodes.length) {
      for (const item of pool) {
        defaultCodes.push(String(item.codigo));
        if (defaultCodes.length >= 4) break;
      }
    }
  }

  CG_COMPARE_MUN_IDS.forEach((id, idx) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const prev = String(sel.value || "");
    sel.innerHTML = "";
    const empty = document.createElement("option");
    empty.value = CG_COMPARE_EMPTY;
    empty.textContent = pool.length ? "— nenhum —" : "— selecione municípios no filtro —";
    sel.appendChild(empty);
    for (const item of pool) {
      const opt = document.createElement("option");
      opt.value = String(item.codigo);
      opt.textContent = item.municipio;
      sel.appendChild(opt);
    }
    let next = prev;
    if (!cgCompareMunDefaultsApplied && defaultCodes[idx]) {
      next = defaultCodes[idx];
    } else if (prev && !selectedSet.has(prev)) {
      next = CG_COMPARE_EMPTY;
    }
    sel.value = [...sel.options].some((o) => o.value === next) ? next : CG_COMPARE_EMPTY;
  });
  cgCompareMunDefaultsApplied = true;
}

/** Série de estoque mensal por município (soma dos desdobramentos no filtro). */
function cgBuildEstoquePorMesByMunicipio(rows, grupoKey, codigo) {
  const cod = String(codigo);
  const grupoRows = cgRowsForGrupo(rows, grupoKey).filter(
    (r) => r.mesAnoKey && String(r.codigo) === cod
  );
  /** @type {Map<string, number>} */
  const byMes = new Map();
  for (const row of grupoRows) {
    byMes.set(row.mesAnoKey, (byMes.get(row.mesAnoKey) || 0) + (Number(row.estoque) || 0));
  }
  return byMes;
}

/** Base da comparação: ano + desdobramento (município vem dos 4 seletores). */
function cgFilterRowsForCompareEstoque(rows) {
  const anos = cgGetSelectedAnos();
  const desdobramento = cgGetSelectedDesdobramento();
  return rows.filter((row) => {
    if (anos.length && !anos.includes(String(row.ano))) return false;
    if (desdobramento !== CG_DESDOBRAMENTO_TODOS_KEY && row.desdobramento !== desdobramento) return false;
    return true;
  });
}

function cgUpdateCompareEstoqueLineChart(rows, grupoKey) {
  const el = document.getElementById("cgChartCompareEstoqueLine");
  if (!el || typeof ApexCharts === "undefined") return;
  cgDestroyChart("compareEstoqueLine");

  const baseRows = cgFilterRowsForCompareEstoque(rows);
  const codes = cgGetCompareMunicipioCodes();
  const munByCod = new Map(cgState.municipiosList.map((m) => [String(m.codigo), m.municipio]));

  /** @type {Set<string>} */
  const monthKeys = new Set();
  const seriesMaps = codes.map((cod) => {
    const map = cgBuildEstoquePorMesByMunicipio(baseRows, grupoKey, cod);
    for (const k of map.keys()) monthKeys.add(k);
    return { cod, map, name: munByCod.get(cod) || `Código ${cod}` };
  });

  const sortedKeys = [...monthKeys].sort((a, b) => cgMesAnoKeyRank(a) - cgMesAnoKeyRank(b));
  const cats = sortedKeys.length ? sortedKeys.map(cgMesAnoLabelShort) : ["Sem dados"];
  const catsFull = sortedKeys.length ? sortedKeys.map(cgMesAnoLabel) : ["Sem dados"];

  const series = seriesMaps.length
    ? seriesMaps.map((s) => ({
        name: s.name,
        data: sortedKeys.map((k) => s.map.get(k) ?? null),
      }))
    : [{ name: "Selecione até 4 municípios", data: [0] }];

  const chart = new ApexCharts(el, {
    chart: {
      type: "line",
      height: 380,
      toolbar: { show: false },
      animations: { speed: 280 },
      fontFamily: "system-ui, Segoe UI, sans-serif",
      foreColor: "#1f2d78",
      zoom: { enabled: false },
    },
    stroke: { width: 3, curve: "smooth" },
    colors: CG_COMPARE_ESTOQUE_COLORS.slice(0, Math.max(series.length, 1)),
    series,
    xaxis: {
      categories: cats,
      tickAmount: sortedKeys.length || undefined,
      labels: {
        rotate: -45,
        rotateAlways: sortedKeys.length > 6,
        hideOverlappingLabels: false,
        showDuplicates: true,
        trim: false,
        style: { fontSize: "11px", fontWeight: 600 },
      },
      title: { text: "Mês de referência", style: { fontSize: "11px", color: "#64748b" } },
    },
    yaxis: {
      labels: { formatter: (v) => cgFmt.format(Number(v) || 0), style: { fontSize: "11px" } },
      title: { text: "Estoque mensal", style: { fontSize: "11px", color: "#64748b" } },
    },
    markers: { size: sortedKeys.length <= 24 ? 3 : 2, hover: { sizeOffset: 2 } },
    legend: { position: "top", horizontalAlign: "left", fontSize: "12px" },
    dataLabels: { enabled: false },
    tooltip: {
      shared: true,
      intersect: false,
      x: {
        formatter: (_val, opts) => catsFull[opts?.dataPointIndex] || "",
      },
      y: {
        formatter: (val) =>
          val == null || !Number.isFinite(Number(val)) ? "—" : cgFmt.format(Number(val)),
      },
    },
    grid: { borderColor: "#e2e8f0", padding: { bottom: 8 } },
  });
  chart.render();
  cgCharts.compareEstoqueLine = chart;
}

function cgUpdateAnalyticsCharts(filtered, grupoKey) {
  const list = cgBuildMunicipioAnalyticsList(filtered, grupoKey);
  cgUpdateMovimentacaoLineChart(cgState.rows, grupoKey);
  cgUpdateSazonalidadeYoYChart(cgState.rows, grupoKey);
  cgUpdateSaldoMunChart(list);
  cgUpdateRotatividadeChart(list);
  cgUpdatePesoEstoqueChart(list);
  cgUpdateAlojAlimChart(cgState.rows, grupoKey);
  cgRenderEstagnadosTable(list);
  cgUpdateCompareEstoqueLineChart(cgState.rows, grupoKey);
}

function cgResizeCharts() {
  for (const key of Object.keys(cgCharts)) {
    try {
      cgCharts[key]?.resize?.();
    } catch (_) {}
  }
}

function cgRefreshCharts() {
  if (!cgIsActivePage() || !cgState.loaded) return;
  const filtered = cgFilterRows(cgState.rows);
  const grupoKey = cgGetSelectedGrupoKey();
  cgUpdateRankingCharts(filtered, grupoKey);
  cgUpdateAnalyticsCharts(filtered, grupoKey);
  requestAnimationFrame(() => cgResizeCharts());
}

function cgComputeKpis(rows, grupoKey) {
  const grupoRows = cgRowsForGrupo(rows, grupoKey);
  const latestMesKey = cgLatestMesAnoKeyInRows(grupoRows);
  /** Estoque_Total é municipal (repete por desdobramento) — soma 1× por município no mês mais recente. */
  const estoqueTotalByCod = new Map();
  const totals = grupoRows.reduce(
    (acc, row) => {
      const countEstoque = latestMesKey && row.mesAnoKey === latestMesKey;
      if (countEstoque && row.codigo != null && Number.isFinite(row.estoqueTotal)) {
        const prev = estoqueTotalByCod.get(row.codigo);
        if (prev == null || row.estoqueTotal > prev) {
          estoqueTotalByCod.set(row.codigo, row.estoqueTotal);
        }
      }
      return {
        estoque: acc.estoque + (countEstoque ? row.estoque : 0),
        admitidos: acc.admitidos + row.admitidos,
        desligados: acc.desligados + row.desligados,
        saldo: acc.saldo + row.saldo,
      };
    },
    { estoque: 0, admitidos: 0, desligados: 0, saldo: 0 }
  );
  let estoqueTotal = 0;
  for (const v of estoqueTotalByCod.values()) estoqueTotal += v;
  return { ...totals, estoqueTotal };
}

function cgRenderKpis(totals) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = Number.isFinite(val) ? cgFmt.format(val) : "—";
  };
  set("mapKpiEstoque", totals.estoque);
  set("mapKpiEstoqueTotal", totals.estoqueTotal);
  set("mapKpiAdmissoes", totals.admitidos);
  set("mapKpiDesligamentos", totals.desligados);
  set("mapKpiSaldos", totals.saldo);

  const titleEl = document.querySelector(".map-ce-main__kpis .map-ce-main__kpis-title-inner span:last-child");
  if (titleEl && cgIsActivePage()) {
    titleEl.textContent = `Totais — ${cgGrupoLabel(cgGetSelectedGrupoKey())}`;
  }
}

function cgRefreshKpis() {
  if (!cgIsActivePage() || !cgState.loaded) return;
  const filtered = cgFilterRows(cgState.rows);
  const grupoKey = cgGetSelectedGrupoKey();
  cgRenderKpis(cgComputeKpis(filtered, grupoKey));
}

function cgUpdateMapReference() {
  const el = document.getElementById("mapRefMesAno");
  if (!el) return;
  const filtered = cgFilterRows(cgState.rows);
  const grupoKey = cgGetSelectedGrupoKey();
  const grupoRows = cgRowsForGrupo(filtered, grupoKey);
  const latestKey = cgLatestMesAnoKeyInRows(grupoRows);
  if (!latestKey) {
    el.textContent = "—";
    return;
  }
  el.textContent =
    typeof window.ceRegioesMapApi?.formatMesAnoKey === "function"
      ? window.ceRegioesMapApi.formatMesAnoKey(latestKey)
      : latestKey;
}

function cgMergeSalarioPopupFields(aggByCod, grupoKey) {
  const salByCod = cgAggregateSalarioByCodigo(cgState.salarioRows, grupoKey);
  for (const [cod, sal] of salByCod) {
    const cur = aggByCod.get(cod) || cgEmptyMunAgg(sal.municipio, cod);
    cur.salarioAlojamento = sal.salarioAlojamento;
    cur.salarioAlimentacao = sal.salarioAlimentacao;
    if (cur.salarioMedio == null) cur.salarioMedio = sal.salarioMedio;
    cur.municipio = cur.municipio || sal.municipio;
    aggByCod.set(cod, cur);
  }
  return aggByCod;
}

function cgRefreshMap() {
  if (!cgIsActivePage() || !cgState.loaded) return;
  const grupoKey = cgGetSelectedGrupoKey();
  const metricKey = cgGetSelectedMetricKey();

  let aggByCod;
  if (metricKey === "salario_medio") {
    aggByCod = cgAggregateSalarioByCodigo(cgState.salarioRows, grupoKey);
    const desdob = cgGetSelectedDesdobramento();
    if (desdob === CG_DESDOBRAMENTO_TODOS_KEY) {
      cgSetStatus(
        "Salário médio: selecione o desdobramento Alojamento ou Alimentação (sem agregação)."
      );
    } else {
      const nComDado = [...aggByCod.values()].filter((a) => a.salarioMedio != null).length;
      cgSetStatus(
        `Salário médio · ${desdob} · ${nComDado.toLocaleString("pt-BR")} municípios com dado · anual (independente do mês/ano do estoque)`
      );
    }
  } else {
    const filtered = cgFilterRows(cgState.rows);
    aggByCod = cgEnrichAggDesdobramentoEstoque(
      cgAggregateByCodigo(filtered, grupoKey),
      cgState.rows,
      grupoKey
    );
    cgMergeSalarioPopupFields(aggByCod, grupoKey);
  }

  window.ceRegioesMapApi?.applyCagedGrupLayer?.(aggByCod, grupoKey, metricKey);
  window.ceRegioesMapApi?.refreshSalarioOverlayLabels?.();
  window.ceRegioesMapApi?.syncSedesOverlay?.();
  cgUpdateMapReference();
}

function cgRefreshAll() {
  if (!cgState.loaded) return;
  cgRefreshKpis();
  cgRefreshMap();
  cgRefreshCharts();
}

function cgSetStatus(message) {
  const el = document.getElementById("cgStatus");
  if (el) {
    el.textContent = message || "";
    el.hidden = !message;
  }
}

async function cgEnsureData() {
  if (cgState.loaded || cgState.loading) return;
  cgState.loading = true;
  cgSetStatus("Carregando planilha Análise Região Leste…");
  cgRenderKpis({ estoque: NaN, estoqueTotal: NaN, admitidos: NaN, desligados: NaN, saldo: NaN });
  try {
    const [resMov, resSal] = await Promise.all([
      fetch(CAGED_GRUP_CSV_URL, { cache: "no-store" }),
      fetch(CAGED_SALARIO_CSV_URL, { cache: "no-store" }),
    ]);
    if (!resMov.ok) throw new Error(`HTTP ${resMov.status}`);
    const text = await resMov.text();
    cgState.rows = cgParseCsvRows(text);
    if (resSal.ok) {
      cgState.salarioRows = cgParseSalarioCsvRows(await resSal.text());
    } else {
      cgState.salarioRows = [];
      console.warn("[analise-leste] planilha de salário médio indisponível:", resSal.status);
    }
    cgState.loaded = true;
    cgState.error = null;
    cgBuildMunicipiosIndex();
    cgBuildDesdobramentosIndex();
    cgPopulateGrupoSelect();
    cgPopulateDesdobramentoSelect();
    cgPopulateAnoFilter();
    cgRebuildMesFilter();
    cgApplyDefaultRegiaoSelection();
    cgApplyDefaultMunicipioSelection();
    cgPopulateCompareMunicipioSelects();
    cgRefreshAll();
    /* Mapa pode ficar pronto um frame depois do CSV: reaplica a coropleta. */
    requestAnimationFrame(() => {
      cgRefreshMap();
      requestAnimationFrame(() => cgFitMapToDefaultArea());
    });
    const grupo = cgGrupoLabel(cgGetSelectedGrupoKey());
    const salNote = cgState.salarioRows.length
      ? ` · ${cgState.salarioRows.length.toLocaleString("pt-BR")} regs. salário`
      : "";
    cgSetStatus(
      `${cgState.rows.length.toLocaleString("pt-BR")} registros · grupamento: ${grupo}${salNote}`
    );
  } catch (err) {
    cgState.error = err;
    cgSetStatus("Não foi possível carregar os dados da Análise Região Leste.");
    console.error("[analise-leste]", err);
  } finally {
    cgState.loading = false;
  }
}

function cgIsActivePage() {
  const root = document.getElementById("secaoMapaCe");
  if (!root || root.hidden) return false;
  return root.classList.contains("section-map-ce--caged-grupamentos") === true;
}

function cgSyncTemporalFilters() {
  const anoSel = document.getElementById("mapFilterAno");
  const mesSel = document.getElementById("mapFilterMes");
  if (!cgState.loaded) {
    if (anoSel) anoSel.innerHTML = "";
    if (mesSel) mesSel.innerHTML = "";
    return;
  }
  cgPopulateAnoFilter();
  cgRebuildMesFilter();
}

function cgOnPageActivate() {
  if (!cgIsActivePage()) return;
  void cgEnsureData().then(() => {
    if (cgState.loaded) {
      cgSyncTemporalFilters();
      cgApplyDefaultRegiaoSelection();
      cgApplyDefaultMunicipioSelection();
      cgPopulateCompareMunicipioSelects();
    }
    cgRefreshAll();
    requestAnimationFrame(() => cgFitMapToDefaultArea());
  });
}

function cgRestoreKpiTitle() {
  const titleEl = document.querySelector(".map-ce-main__kpis .map-ce-main__kpis-title-inner span:last-child");
  if (titleEl) titleEl.textContent = "Totais no filtro";
}

function cgRestoreFullMunicipioFilter() {
  cgRestoreKpiTitle();
  if (typeof window.ceRegioesMapApi?.rebuildAllMunicipios === "function") {
    window.ceRegioesMapApi.rebuildAllMunicipios();
  }
}

function cgBindFilters() {
  const root = document.getElementById("secaoMapaCe");
  if (!root || root.dataset.cgBound === "1") return;
  root.dataset.cgBound = "1";

  root.addEventListener("change", (e) => {
    if (!cgIsActivePage()) return;
    const id = e.target?.id;
    if (id === "mapFilterAno") {
      cgRebuildMesFilter();
      cgRefreshAll();
    }
    if (id === "mapFilterMes" || id === "mapFilterMunicipio" || id === "mapFilterRegiao") {
      if (id === "mapFilterRegiao") {
        cgSyncMunicipiosFromRegiao();
        requestAnimationFrame(() => cgFitMapToDefaultArea());
      }
      cgPopulateCompareMunicipioSelects();
      cgRefreshAll();
    }
    if (
      id === "mapCagedGrupLayerStyle" ||
      id === "mapCagedGrupMetricStyle" ||
      id === "mapAnaliseLesteDesdobramentoStyle"
    ) {
      cgRefreshAll();
      const grupo = cgGrupoLabel(cgGetSelectedGrupoKey());
      cgSetStatus(`${cgState.rows.length.toLocaleString("pt-BR")} registros · grupamento: ${grupo}`);
    }
    if (id === "cgRankOrder") {
      cgRefreshCharts();
    }
    if (CG_COMPARE_MUN_IDS.includes(id)) {
      cgUpdateCompareEstoqueLineChart(cgState.rows, cgGetSelectedGrupoKey());
    }
  });

  root.addEventListener("click", (e) => {
    if (!cgIsActivePage() || !(e.target instanceof HTMLElement)) return;
    if (e.target.id === "mapFilterAnoClear") {
      const sel = document.getElementById("mapFilterAno");
      if (sel) Array.from(sel.options).forEach((o) => { o.selected = false; });
      cgRebuildMesFilter();
      cgRefreshAll();
    }
    if (e.target.id === "mapFilterMesClear") {
      const sel = document.getElementById("mapFilterMes");
      if (sel) Array.from(sel.options).forEach((o) => { o.selected = false; });
      cgRefreshAll();
    }
    if (e.target.id === "mapFilterRegiaoClear") {
      const sel = document.getElementById("mapFilterRegiao");
      if (sel) Array.from(sel.options).forEach((o) => { o.selected = false; });
      cgSyncMunicipiosFromRegiao();
      cgPopulateCompareMunicipioSelects();
      cgRefreshAll();
    }
    if (e.target.id === "mapFilterMunClear") {
      cgClearMunicipioSelection();
      cgPopulateCompareMunicipioSelects();
      cgRefreshAll();
    }
  });

  root.addEventListener("input", (e) => {
    if (!cgIsActivePage() || e.target.id !== "mapFilterMunSearch") return;
    clearTimeout(cgMunSearchTimer);
    cgMunSearchTimer = setTimeout(() => cgRebuildMunicipioOptions(), 160);
  });
}

function cgInit() {
  cgBindFilters();
  if (cgIsActivePage()) cgOnPageActivate();
}

window.cagedGrupamentosApi = {
  onPageActivate: cgOnPageActivate,
  refresh: cgRefreshAll,
  refreshMap: cgRefreshMap,
  refreshKpis: cgRefreshKpis,
  refreshCharts: cgRefreshCharts,
  resizeCharts: cgResizeCharts,
  destroyCharts: cgDestroyCharts,
  syncTemporalFilters: cgSyncTemporalFilters,
  syncMunicipiosFromRegiao: cgSyncMunicipiosFromRegiao,
  applyDefaultRegiaoSelection: cgApplyDefaultRegiaoSelection,
  applyDefaultMunicipioSelection: cgApplyDefaultMunicipioSelection,
  clearMunicipioSelection: cgClearMunicipioSelection,
  selectSingleMunicipioFromMap: cgSelectSingleMunicipioFromMap,
  rebuildMunicipioOptions: cgRebuildMunicipioOptions,
  restoreFullMunicipioFilter: cgRestoreFullMunicipioFilter,
  getGrupoLabel: cgGrupoLabel,
  getMetricLabel: cgMetricLabel,
  getSelectedDesdobramento: cgGetSelectedDesdobramento,
  getSalarioAggByCodigo: () =>
    cgAggregateSalarioByCodigo(cgState.salarioRows, cgGetSelectedGrupoKey()),
  setStatus: cgSetStatus,
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", cgInit);
} else {
  cgInit();
}
