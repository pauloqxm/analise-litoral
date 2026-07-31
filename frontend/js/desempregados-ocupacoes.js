/**
 * Aba Pretensões ocupacionais — mapa + ranking de ocupações
 * Fonte: /static/data/desempregados_alojamento_alimentacao_longo.csv
 */

const DESEMP_CSV_URL = "/static/data/desempregados_alojamento_alimentacao_longo.csv";
const DESEMP_GEO_URL = "/static/geo/ce_regioes.geojson";
const DESEMP_PROP = "desemp_total";
const DESEMP_COLORS = ["#f0fdf4", "#bbf7d0", "#4ade80", "#16a34a", "#14532d"];
const DESEMP_NO_DATA = "#e5e7eb";
const DESEMP_CHART_TOP_N = 15;

const DESEMP_ALOJAMENTO_KEYS = [
  "HOTEL",
  "HOTELARIA",
  "CAMAREIRO",
  "RECEPCIONISTA DE HOTEL",
  "PORTEIRO (HOTEL)",
  "GOVERNANTA",
  "MORDOMO",
  "PORTARIA DE HOTEL",
  "GERENTE DE HOTEL",
  "DIRETOR DE PRODUCAO E OPERACOES DE HOTEL",
];

const desempState = {
  rows: [],
  loaded: false,
  loading: false,
  map: null,
  geoJson: null,
  popup: null,
  chart: null,
  selectedCodigo: "",
  selectedOcupacao: "",
  selectedGrupo: "",
  munList: [],
  /** @type {Map<string, number>} nome normalizado → GEO_CODI do GeoJSON */
  nameToGeoCodi: new Map(),
  /** @type {Map<number, number>} GEO_CODI → código IBGE do CSV */
  geoCodiToCodigo: new Map(),
  /** @type {Map<number, string>} código IBGE → nome */
  codigoToNome: new Map(),
};

const desempFmt = new Intl.NumberFormat("pt-BR");

function desempNorm(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

function desempGrupoOcupacao(ocupacao) {
  const n = desempNorm(ocupacao);
  if (DESEMP_ALOJAMENTO_KEYS.some((k) => n.includes(desempNorm(k)))) return "alojamento";
  return "alimentacao";
}

function desempLabelOcupacao(ocupacao) {
  const s = String(ocupacao || "").replace(/\s+/g, " ").trim();
  return s
    .toLowerCase()
    .replace(/(^|[\s(/])\S/g, (m) => m.toUpperCase());
}

function desempParseCsv(text) {
  const raw = String(text || "").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const parseLine = (line) => {
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
  };
  const header = parseLine(lines[0]);
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    const codigo = parseInt(cells[idx.Codigo_IBGE], 10);
    const municipio = cells[idx.Municipio];
    const ocupacao = cells[idx.Ocupacao];
    const quantidade = parseInt(String(cells[idx.Quantidade] || "0").replace(/\D/g, ""), 10) || 0;
    if (!Number.isFinite(codigo) || !municipio || !ocupacao || quantidade <= 0) continue;
    rows.push({
      codigo,
      municipio,
      ocupacao,
      ocupacaoLabel: desempLabelOcupacao(ocupacao),
      quantidade,
      grupo: desempGrupoOcupacao(ocupacao),
    });
  }
  return rows;
}

function desempGeoCodigo(geoCodi) {
  const n = Number(geoCodi);
  if (!Number.isFinite(n)) return null;
  return n;
}

/** Cruza municípios do CSV com o GeoJSON pelo nome (GEO_CODI do arquivo ≠ IBGE oficial em alguns casos). */
function desempBuildGeoNameIndex(geojson) {
  desempState.nameToGeoCodi = new Map();
  desempState.geoCodiToCodigo = new Map();
  desempState.codigoToNome = new Map();

  /** @type {Map<string, number>} */
  const nameToCodigo = new Map();
  for (const r of desempState.rows) {
    nameToCodigo.set(desempNorm(r.municipio), r.codigo);
    desempState.codigoToNome.set(r.codigo, r.municipio);
  }

  for (const f of geojson?.features || []) {
    const nome = f.properties?.Municipio || f.properties?.NOME || "";
    const key = desempNorm(nome);
    const geoCodi = desempGeoCodigo(f.properties?.GEO_CODI);
    if (!key || geoCodi == null) continue;
    const codigo = nameToCodigo.get(key);
    if (codigo == null) continue;
    desempState.nameToGeoCodi.set(key, geoCodi);
    desempState.geoCodiToCodigo.set(geoCodi, codigo);
  }
}

function desempCodigoFromFeature(f) {
  const geoCodi = desempGeoCodigo(f?.properties?.GEO_CODI);
  if (geoCodi != null && desempState.geoCodiToCodigo.has(geoCodi)) {
    return desempState.geoCodiToCodigo.get(geoCodi);
  }
  const nome = f?.properties?.Municipio || f?.properties?.NOME || "";
  const key = desempNorm(nome);
  for (const r of desempState.rows) {
    if (desempNorm(r.municipio) === key) return r.codigo;
  }
  return null;
}

function desempFilteredRows() {
  return desempState.rows.filter((r) => {
    if (desempState.selectedCodigo && String(r.codigo) !== String(desempState.selectedCodigo)) {
      return false;
    }
    if (desempState.selectedGrupo && r.grupo !== desempState.selectedGrupo) return false;
    if (desempState.selectedOcupacao && desempNorm(r.ocupacao) !== desempNorm(desempState.selectedOcupacao)) {
      return false;
    }
    return true;
  });
}

function desempAggByMunicipio(rows) {
  /** @type {Map<number, { codigo:number, municipio:string, total:number, geoCodi:number|null }>} */
  const m = new Map();
  for (const r of rows) {
    const cur = m.get(r.codigo) || {
      codigo: r.codigo,
      municipio: r.municipio,
      total: 0,
      geoCodi: desempState.nameToGeoCodi.get(desempNorm(r.municipio)) ?? null,
    };
    cur.total += r.quantidade;
    cur.municipio = cur.municipio || r.municipio;
    m.set(r.codigo, cur);
  }
  return m;
}

function desempAggByOcupacao(rows) {
  /** @type {Map<string, { ocupacao:string, label:string, grupo:string, total:number }>} */
  const m = new Map();
  for (const r of rows) {
    const key = desempNorm(r.ocupacao);
    const cur = m.get(key) || {
      ocupacao: r.ocupacao,
      label: r.ocupacaoLabel,
      grupo: r.grupo,
      total: 0,
    };
    cur.total += r.quantidade;
    m.set(key, cur);
  }
  return [...m.values()].sort((a, b) => b.total - a.total);
}

function desempThresholds(values) {
  const vals = values.filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  if (!vals.length) return [0, 0, 0, 0];
  const q = (p) => {
    const i = (vals.length - 1) * p;
    const lo = Math.floor(i);
    const hi = Math.ceil(i);
    if (lo === hi) return vals[lo];
    return vals[lo] * (hi - i) + vals[hi] * (i - lo);
  };
  return [q(0.2), q(0.4), q(0.6), q(0.8)];
}

function desempFillExpr(thresholds, colors) {
  const expr = ["step", ["coalesce", ["get", DESEMP_PROP], -1], DESEMP_NO_DATA, 0, colors[0]];
  for (let i = 0; i < thresholds.length; i++) {
    expr.push(thresholds[i], colors[Math.min(i + 1, colors.length - 1)]);
  }
  return expr;
}

function desempSetStatus(msg) {
  const el = document.getElementById("desempStatus");
  if (el) el.textContent = msg || "";
}

function desempPopulateMunicipioSelect() {
  const sel = document.getElementById("desempFilterMunicipio");
  if (!sel) return;
  const prev = sel.value;
  const muns = [...desempAggByMunicipio(desempState.rows).values()].sort((a, b) =>
    a.municipio.localeCompare(b.municipio, "pt-BR")
  );
  desempState.munList = muns;
  sel.innerHTML = `<option value="">Todos os municípios</option>`;
  for (const m of muns) {
    const opt = document.createElement("option");
    opt.value = String(m.codigo);
    opt.textContent = m.municipio;
    sel.appendChild(opt);
  }
  if ([...sel.options].some((o) => o.value === prev)) sel.value = prev;
}

function desempUpdateKpis(rows, byOcup) {
  const byMun = desempAggByMunicipio(rows);
  const total = rows.reduce((s, r) => s + r.quantidade, 0);
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = typeof v === "number" ? desempFmt.format(v) : v;
  };
  set("desempKpiTotal", total);
  set("desempKpiOcup", byOcup.length);
  set("desempKpiMun", byMun.size || desempState.munList.length);
  const recorte = document.getElementById("desempKpiRecorte");
  if (recorte) {
    const parts = [];
    if (desempState.selectedCodigo) {
      const mun = desempState.munList.find((m) => String(m.codigo) === String(desempState.selectedCodigo));
      parts.push(mun?.municipio || desempState.selectedCodigo);
    }
    if (desempState.selectedGrupo === "alojamento") parts.push("Alojamento");
    if (desempState.selectedGrupo === "alimentacao") parts.push("Alimentação");
    if (desempState.selectedOcupacao) parts.push(desempLabelOcupacao(desempState.selectedOcupacao));
    recorte.textContent = parts.length ? parts.join(" · ") : "Todos";
  }
}

function desempUpdateTable(byOcup) {
  const tbody = document.getElementById("desempTableBody");
  if (!tbody) return;
  tbody.innerHTML = byOcup
    .slice(0, 25)
    .map((o, i) => {
      const grupo = o.grupo === "alojamento" ? "Alojamento" : "Alimentação";
      const active = desempNorm(desempState.selectedOcupacao) === desempNorm(o.ocupacao);
      return `<tr data-ocupacao="${escapeAttr(o.ocupacao)}" class="${active ? "is-active" : ""}">
        <td>${i + 1}</td>
        <td>${escapeHtml(o.label)}</td>
        <td><span class="rd-desemp__chip rd-desemp__chip--${o.grupo}">${grupo}</span></td>
        <td>${desempFmt.format(o.total)}</td>
      </tr>`;
    })
    .join("");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

function desempUpdateLegend(thresholds, minV, maxV) {
  const el = document.getElementById("desempLegend");
  if (!el) return;
  const fmt = (v) => desempFmt.format(Math.round(v));
  const breaks = [minV, ...thresholds, maxV];
  const items = DESEMP_COLORS.map((color, i) => {
    const a = breaks[i];
    const b = breaks[i + 1];
    return `<span class="rd-desemp__legend-item"><span class="rd-desemp__swatch" style="background:${color}"></span>${fmt(a)} – ${fmt(b)}</span>`;
  }).join("");
  el.innerHTML = `
    <span class="rd-desemp__legend-title">Pretensões por município</span>
    <div class="rd-desemp__legend-items">${items}
      <span class="rd-desemp__legend-item rd-desemp__legend-item--muted"><span class="rd-desemp__swatch" style="background:${DESEMP_NO_DATA}"></span>Sem dado</span>
    </div>`;
}

function desempMergeGeo(aggByCod) {
  const features = (desempState.geoJson?.features || []).map((f) => {
    const codigo = desempCodigoFromFeature(f);
    const agg = codigo != null ? aggByCod.get(codigo) : null;
    const val = agg && Number.isFinite(agg.total) ? agg.total : null;
    return {
      ...f,
      properties: {
        ...(f.properties || {}),
        [DESEMP_PROP]: val,
        desemp_codigo: codigo,
        desemp_municipio: agg?.municipio || f.properties?.Municipio || "",
      },
    };
  });
  return { type: "FeatureCollection", features };
}

function desempTopOcupacoes(codigo, limit = 7) {
  const rows = desempState.rows.filter((r) => {
    if (String(r.codigo) !== String(codigo)) return false;
    if (desempState.selectedGrupo && r.grupo !== desempState.selectedGrupo) return false;
    return true;
  });
  return desempAggByOcupacao(rows).slice(0, limit);
}

function desempBuildPopupHtml({ municipio, codigo, total, top }) {
  const rows = (top || [])
    .map(
      (o, i) => `
      <div class="rd-desemp-popup__row">
        <span class="rd-desemp-popup__rank">${i + 1}.</span>
        <span class="rd-desemp-popup__ocup">${escapeHtml(o.label)}</span>
        <strong class="rd-desemp-popup__val">${desempFmt.format(o.total)}</strong>
      </div>`
    )
    .join("");
  return `
    <section class="rd-desemp-popup" role="group" aria-label="Top ocupações do município">
      <header class="rd-desemp-popup__head">
        <h4 class="rd-desemp-popup__title">${escapeHtml(municipio || "Município")}</h4>
        <p class="rd-desemp-popup__sub">IBGE ${escapeHtml(String(codigo))} · total ${desempFmt.format(total || 0)}</p>
        <p class="rd-desemp-popup__sub">7 ocupações com mais pretensões</p>
      </header>
      <div class="rd-desemp-popup__list">
        ${rows || `<p class="rd-desemp-popup__empty">Sem ocupações neste recorte.</p>`}
      </div>
    </section>`;
}

function desempShowPopup(lngLat, codigo) {
  const map = desempState.map;
  if (!map || codigo == null) return;
  const munRows = desempState.rows.filter((r) => String(r.codigo) === String(codigo));
  const municipio = munRows[0]?.municipio || desempState.codigoToNome.get(Number(codigo)) || "Município";
  const top = desempTopOcupacoes(codigo, 7);
  const total = munRows
    .filter((r) => !desempState.selectedGrupo || r.grupo === desempState.selectedGrupo)
    .reduce((s, r) => s + r.quantidade, 0);

  if (!desempState.popup) {
    desempState.popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: "320px",
      className: "rd-desemp-popup-wrap",
    });
  }
  desempState.popup
    .setLngLat(lngLat)
    .setHTML(desempBuildPopupHtml({ municipio, codigo, total, top }))
    .addTo(map);
}

function desempPaintMap(aggByCod) {
  const map = desempState.map;
  if (!map?.getSource("desemp-regioes")) return;
  const merged = desempMergeGeo(aggByCod);
  const values = [...aggByCod.values()].map((a) => a.total);
  const thresholds = desempThresholds(values);
  const minV = values.length ? Math.min(...values) : 0;
  const maxV = values.length ? Math.max(...values) : 0;
  map.getSource("desemp-regioes").setData(merged);
  map.setPaintProperty("desemp-fill", "fill-color", desempFillExpr(thresholds, DESEMP_COLORS));
  desempUpdateLegend(thresholds, minV, maxV);
}

function desempFitMap() {
  const map = desempState.map;
  if (!map || !desempState.geoJson) return;
  const geoCodis = new Set(desempState.geoCodiToCodigo.keys());
  const feats = (desempState.geoJson.features || []).filter((f) => {
    const g = desempGeoCodigo(f.properties?.GEO_CODI);
    return g != null && geoCodis.has(g);
  });
  if (!feats.length) return;
  const bounds = new maplibregl.LngLatBounds();
  for (const f of feats) {
    const geom = f.geometry;
    if (!geom) continue;
    const walk = (coords) => {
      if (typeof coords[0] === "number") {
        bounds.extend(coords);
        return;
      }
      for (const c of coords) walk(c);
    };
    walk(geom.coordinates);
  }
  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, { padding: 36, maxZoom: 9.2, duration: 650 });
  }
}

function desempEnsureMap() {
  const el = document.getElementById("desempMap");
  if (!el || typeof maplibregl === "undefined") return Promise.resolve(null);
  if (desempState.map) {
    desempState.map.resize();
    return Promise.resolve(desempState.map);
  }
  return fetch(DESEMP_GEO_URL, { cache: "no-store" })
    .then((r) => r.json())
    .then((geo) => {
      desempState.geoJson = geo;
      desempBuildGeoNameIndex(geo);
      const map = new maplibregl.Map({
        container: el,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap",
            },
          },
          layers: [{ id: "osm", type: "raster", source: "osm" }],
        },
        center: [-38.5, -4.2],
        zoom: 7.2,
        attributionControl: false,
      });
      desempState.map = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      return new Promise((resolve) => {
        map.on("load", () => {
          map.addSource("desemp-regioes", { type: "geojson", data: geo });
          map.addLayer({
            id: "desemp-fill",
            type: "fill",
            source: "desemp-regioes",
            paint: {
              "fill-color": DESEMP_NO_DATA,
              "fill-opacity": 0.78,
              "fill-outline-color": "rgba(0, 60, 40, 0.35)",
            },
          });
          map.addLayer({
            id: "desemp-line",
            type: "line",
            source: "desemp-regioes",
            paint: {
              "line-color": "#0f766e",
              "line-width": 0.6,
              "line-opacity": 0.55,
            },
          });
          map.on("click", "desemp-fill", (e) => {
            const f = e.features?.[0];
            const codigo = desempCodigoFromFeature(f);
            if (codigo == null) return;
            desempState.selectedCodigo = String(codigo);
            const sel = document.getElementById("desempFilterMunicipio");
            if (sel) sel.value = String(codigo);
            desempRefresh();
            desempShowPopup(e.lngLat, codigo);
          });
          map.on("mousemove", "desemp-fill", (e) => {
            const f = e.features?.[0];
            const codigo = desempCodigoFromFeature(f);
            map.getCanvas().style.cursor = codigo != null ? "pointer" : "";
          });
          map.on("mouseleave", "desemp-fill", () => {
            map.getCanvas().style.cursor = "";
          });
          resolve(map);
        });
      });
    });
}

function desempDestroyChart() {
  if (desempState.chart) {
    try {
      desempState.chart.destroy();
    } catch (_) {
      /* ignore */
    }
    desempState.chart = null;
  }
}

function desempBarColor(o) {
  if (desempNorm(desempState.selectedOcupacao) === desempNorm(o.ocupacao)) return "#9a3412";
  return o.grupo === "alojamento" ? "#1d4ed8" : "#166534";
}

function desempToggleOcupacao(ocupacao) {
  const next =
    desempNorm(desempState.selectedOcupacao) === desempNorm(ocupacao) ? "" : ocupacao;
  desempState.selectedOcupacao = next;
  desempRefresh();
}

function desempRenderOcupChart(byOcup) {
  const el = document.getElementById("desempOcupChart");
  const empty = document.getElementById("desempChartEmpty");
  if (!el) return;

  const ranked = byOcup.slice(0, DESEMP_CHART_TOP_N);
  desempDestroyChart();

  if (!ranked.length) {
    el.innerHTML = "";
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  if (typeof ApexCharts === "undefined") {
    el.innerHTML = ranked
      .map(
        (o, i) =>
          `<div class="rd-desemp__chart-fallback" data-ocupacao="${escapeAttr(o.ocupacao)}">
            <span>${i + 1}. ${escapeHtml(o.label)}</span>
            <strong>${desempFmt.format(o.total)}</strong>
          </div>`
      )
      .join("");
    el.querySelectorAll("[data-ocupacao]").forEach((node) => {
      node.addEventListener("click", () => desempToggleOcupacao(node.getAttribute("data-ocupacao") || ""));
    });
    return;
  }

  const data = ranked.map((o) => ({ x: o.label, y: o.total }));
  const colors = ranked.map((o) => desempBarColor(o));
  const height = Math.max(280, 56 + ranked.length * 28);

  const chart = new ApexCharts(el, {
    chart: {
      type: "bar",
      height,
      toolbar: { show: false },
      animations: { speed: 260 },
      fontFamily: "system-ui, Segoe UI, sans-serif",
      foreColor: "#182420",
      events: {
        click: (_e, _ctx, config) => {
          const idx = config?.dataPointIndex;
          if (idx == null || idx < 0) return;
          const hit = ranked[idx];
          if (hit) desempToggleOcupacao(hit.ocupacao);
        },
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        distributed: true,
        barHeight: "68%",
        borderRadius: 3,
        borderRadiusApplication: "end",
      },
    },
    colors,
    series: [{ name: "Pretensões", data }],
    legend: { show: false },
    dataLabels: {
      enabled: true,
      formatter: (val) => desempFmt.format(val),
      style: { fontSize: "11px", colors: ["#fff"], fontWeight: 700 },
      offsetX: 4,
    },
    xaxis: {
      labels: {
        formatter: (v) => desempFmt.format(Math.round(Number(v) || 0)),
        style: { fontSize: "11px" },
      },
      title: { text: "Pretensões", style: { fontSize: "11px", color: "#5b6b60" } },
    },
    yaxis: {
      labels: {
        maxWidth: 200,
        style: { fontSize: "11px", fontWeight: 600 },
      },
    },
    tooltip: {
      y: {
        formatter: (val, opts) => {
          const row = ranked[opts.dataPointIndex];
          const grupo = row?.grupo === "alojamento" ? "Alojamento" : "Alimentação";
          return `${desempFmt.format(val)} pretensões · ${grupo}`;
        },
      },
    },
    grid: { borderColor: "#e5e7eb", padding: { left: 8, right: 12 } },
    states: {
      hover: { filter: { type: "darken", value: 0.12 } },
      active: { allowMultipleDataPointsSelection: false, filter: { type: "none" } },
    },
  });
  chart.render();
  desempState.chart = chart;
}

function desempRefresh() {
  if (!desempState.loaded) return;
  const rows = desempFilteredRows();
  const byOcup = desempAggByOcupacao(rows);
  const rowsForChart = desempState.rows.filter((r) => {
    if (desempState.selectedCodigo && String(r.codigo) !== String(desempState.selectedCodigo)) {
      return false;
    }
    if (desempState.selectedGrupo && r.grupo !== desempState.selectedGrupo) return false;
    return true;
  });
  const byMun = desempAggByMunicipio(
    desempState.rows.filter((r) => {
      if (desempState.selectedGrupo && r.grupo !== desempState.selectedGrupo) return false;
      if (desempState.selectedOcupacao && desempNorm(r.ocupacao) !== desempNorm(desempState.selectedOcupacao)) {
        return false;
      }
      return true;
    })
  );
  desempUpdateKpis(rows, byOcup);
  desempUpdateTable(byOcup);
  desempPaintMap(byMun);
  desempRenderOcupChart(desempAggByOcupacao(rowsForChart));
  const n = rows.length;
  desempSetStatus(
    `${desempFmt.format(rows.reduce((s, r) => s + r.quantidade, 0))} pretensões · ${byOcup.length} ocupações · ${n} registros`
  );
}

async function desempEnsureData() {
  if (desempState.loaded || desempState.loading) return;
  desempState.loading = true;
  desempSetStatus("Carregando pretensões ocupacionais…");
  try {
    const res = await fetch(DESEMP_CSV_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    desempState.rows = desempParseCsv(await res.text());
    desempState.loaded = true;
    desempPopulateMunicipioSelect();
    await desempEnsureMap();
    desempRefresh();
    requestAnimationFrame(() => {
      desempState.map?.resize();
      desempFitMap();
      desempRefresh();
    });
  } catch (err) {
    console.error("[desempregados]", err);
    desempSetStatus("Não foi possível carregar os dados de pretensões ocupacionais.");
  } finally {
    desempState.loading = false;
  }
}

function desempOnPageActivate() {
  const root = document.getElementById("secaoDesempregados");
  if (!root || root.hidden) return;
  void desempEnsureData().then(() => {
    desempState.map?.resize();
    desempRefresh();
  });
}

function desempBind() {
  const root = document.getElementById("secaoDesempregados");
  if (!root || root.dataset.desempBound === "1") return;
  root.dataset.desempBound = "1";

  root.addEventListener("change", (e) => {
    const id = e.target?.id;
    if (id === "desempFilterMunicipio") {
      desempState.selectedCodigo = e.target.value || "";
      desempRefresh();
    }
    if (id === "desempFilterGrupo") {
      desempState.selectedGrupo = e.target.value || "";
      desempRefresh();
    }
  });

  root.addEventListener("click", (e) => {
    if (e.target?.id === "desempClearFilters") {
      desempState.selectedCodigo = "";
      desempState.selectedOcupacao = "";
      desempState.selectedGrupo = "";
      const mun = document.getElementById("desempFilterMunicipio");
      const grp = document.getElementById("desempFilterGrupo");
      if (mun) mun.value = "";
      if (grp) grp.value = "";
      desempRefresh();
      return;
    }
    const tr = e.target?.closest?.("#desempTableBody tr[data-ocupacao]");
    if (tr) {
      const ocup = tr.getAttribute("data-ocupacao") || "";
      desempState.selectedOcupacao =
        desempNorm(desempState.selectedOcupacao) === desempNorm(ocup) ? "" : ocup;
      desempRefresh();
    }
  });

  window.addEventListener("resize", () => {
    if (root.hidden) return;
    clearTimeout(desempBind._t);
    desempBind._t = setTimeout(() => {
      desempState.map?.resize();
      if (desempState.loaded) desempRefresh();
    }, 160);
  });
}

desempBind();

window.desempregadosApi = {
  onPageActivate: desempOnPageActivate,
  refresh: desempRefresh,
  resize: () => {
    desempState.map?.resize();
    if (desempState.loaded) desempRefresh();
  },
};
