const CE_REGIOES_GEO_URL = "/static/geo/ce_regioes.geojson";

const MAP_TABS = {
  sobre: { label: "Sobre", icon: "fa-solid fa-circle-info" },
  analise_leste: { label: "Análise", icon: "fa-solid fa-map-location-dot" },
};

const PAGE_META = {
  sobre: {
    title: "Sobre a análise",
    desc: "Apresentação do painel de emprego formal no setor hoteleiro e de alimentação da Região Leste.",
    status: "Texto institucional · SET / IDT",
  },
  analise_leste: {
    title: "Análise Região Leste",
    desc: "Mercado de trabalho formal por município: admitidos, desligados, saldo e estoque mensal por grande grupamento e desdobramento (Alojamento e alimentação), com filtros por referência, região e município.",
    status: "Mapa + planilha SET Análise Região Leste",
  },
};

const state = { abaAtual: "sobre", abaFiltrosSincronizados: null };

const els = {
  sidebar: document.getElementById("sidebar"),
  menuToggle: document.getElementById("menuToggle"),
  menuEdgeOpen: document.getElementById("menuEdgeOpen"),
  menuOverlay: document.getElementById("menuOverlay"),
  menuAbas: document.getElementById("menuAbas"),
  tituloPagina: document.getElementById("tituloPagina"),
  descricaoPagina: document.getElementById("descricaoPagina"),
  statusPagina: document.getElementById("statusPagina"),
  pageIdentIcon: document.getElementById("pageIdentIcon"),
  secaoSobre: document.getElementById("secaoSobre"),
  secaoMapaCe: document.getElementById("secaoMapaCe"),
  mapCeRegioes: document.getElementById("mapCeRegioes"),
  mapCeLegend: document.getElementById("mapCeLegend"),
  rdRefMesAnoHero: document.getElementById("rdRefMesAnoHero"),
};

function isMobileSidebarViewport() {
  return typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 1024px)").matches;
}

function openMenu() {
  els.sidebar?.classList.add("open");
  els.menuOverlay?.classList.add("visible");
}

function closeMenu() {
  els.sidebar?.classList.remove("open");
  els.menuOverlay?.classList.remove("visible");
}

function toggleMenu() {
  if (els.sidebar?.classList.contains("open")) closeMenu();
  else openMenu();
}

function applySidebarModeForViewport() {
  /* Redesign usa navbar; sidebar permanece oculto. */
}

function syncPageHeader() {
  const meta = PAGE_META[state.abaAtual] || {};
  const tabMeta = MAP_TABS[state.abaAtual] || {};
  if (els.tituloPagina) els.tituloPagina.textContent = meta.title || tabMeta.label || "Mapa";
  if (els.descricaoPagina) els.descricaoPagina.textContent = meta.desc || "";
  if (els.statusPagina) els.statusPagina.textContent = meta.status || "";
  if (els.pageIdentIcon && tabMeta.icon) {
    els.pageIdentIcon.className = tabMeta.icon;
  }
  document.title =
    state.abaAtual === "sobre"
      ? "SET · Sobre · Análise Região Leste"
      : "SET · Análise Região Leste";
  document.body.classList.toggle("rd-tab--analise", state.abaAtual === "analise_leste");
  document.body.classList.toggle("rd-tab--sobre", state.abaAtual === "sobre");
}

function renderMenu() {
  if (!els.menuAbas) return;
  els.menuAbas.innerHTML = Object.entries(MAP_TABS)
    .map(
      ([sheetName, meta]) => `
      <button type="button" class="rd-tab ${state.abaAtual === sheetName ? "active" : ""}" data-aba="${sheetName}" aria-current="${state.abaAtual === sheetName ? "page" : "false"}">
        <i class="${meta.icon}" aria-hidden="true"></i>
        <span>${meta.label}</span>
      </button>`
    )
    .join("");
  els.menuAbas.querySelectorAll("[data-aba]").forEach((btn) => {
    btn.addEventListener("click", () => loadTab(btn.dataset.aba));
  });
}

const MAP_FILTER_SELECT_IDS = [
  "mapFilterAno",
  "mapFilterMes",
  "mapFilterRegiao",
  "mapFilterMunicipio",
];
const MAP_RANK_ORDER_SELECT_IDS = ["cgRankOrder"];

function syncFilterVisibilityForTab(sheetName) {
  const wrap = els.secaoMapaCe;
  if (!wrap) return;
  wrap.querySelectorAll(".map-ce-filter-group[data-filter-tabs]").forEach((group) => {
    const tabs = (group.dataset.filterTabs || "").split(/\s+/).filter(Boolean);
    group.hidden = !tabs.includes(sheetName);
  });
}

function resetMapFilterSelections() {
  MAP_FILTER_SELECT_IDS.forEach((id) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    Array.from(sel.options).forEach((opt) => {
      opt.selected = false;
    });
  });
  const search = document.getElementById("mapFilterMunSearch");
  if (search) search.value = "";
  MAP_RANK_ORDER_SELECT_IDS.forEach((id) => {
    const sel = document.getElementById(id);
    if (sel && sel.options.length) sel.selectedIndex = 0;
  });
}

function syncHeroReference() {
  const src = document.getElementById("mapRefMesAno");
  if (els.rdRefMesAnoHero && src) {
    els.rdRefMesAnoHero.textContent = src.textContent || "—";
  }
}

function syncSectionsVisibility() {
  const isSobre = state.abaAtual === "sobre";
  const isAnalise = state.abaAtual === "analise_leste";
  if (els.secaoSobre) els.secaoSobre.hidden = !isSobre;
  if (els.secaoMapaCe) els.secaoMapaCe.hidden = !isAnalise;
}

function syncMapSection() {
  syncSectionsVisibility();

  if (state.abaAtual !== "analise_leste") {
    window.cagedGrupamentosApi?.restoreFullMunicipioFilter?.();
    return;
  }

  const wrap = els.secaoMapaCe;
  const mount = els.mapCeRegioes;
  if (!wrap || !mount) return;

  if (state.abaAtual !== state.abaFiltrosSincronizados) {
    resetMapFilterSelections();
    state.abaFiltrosSincronizados = state.abaAtual;
  }
  syncFilterVisibilityForTab(state.abaAtual);

  wrap.classList.add("section-map-ce--caged-grupamentos");

  const filtersTitle = wrap.querySelector(".map-ce-filters-wrap__title");
  if (filtersTitle) {
    filtersTitle.textContent = "Filtros da Análise Região Leste (referência)";
  }

  if (typeof window.ceRegioesMapApi?.setPageMode === "function") {
    window.ceRegioesMapApi.setPageMode("analise_leste");
  }

  window.cagedGrupamentosApi?.onPageActivate?.();

  if (typeof maplibregl === "undefined" || !window.ceRegioesMapApi) return;

  void window.ceRegioesMapApi
    .ensure(mount, CE_REGIOES_GEO_URL, els.mapCeLegend || null)
    .then(() => {
      window.ceRegioesMapApi.setPageMode?.("analise_leste");
      window.ceRegioesMapApi.resize();
      window.cagedGrupamentosApi?.refresh?.();
      syncHeroReference();
      requestAnimationFrame(() => {
        window.ceRegioesMapApi?.resize();
        syncHeroReference();
      });
    });
}

function loadTab(sheetName) {
  if (!MAP_TABS[sheetName]) return;
  state.abaAtual = sheetName;
  const url = new URL(location.href);
  url.searchParams.set("aba", sheetName);
  history.replaceState(null, "", url);
  renderMenu();
  syncPageHeader();
  syncMapSection();
  if (sheetName === "analise_leste" && location.hash) {
    /* mantém âncora se houver */
  } else if (sheetName === "sobre") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function bindExtraNav() {
  document.querySelectorAll("[data-aba]").forEach((el) => {
    if (el.closest("#menuAbas")) return;
    el.addEventListener("click", (e) => {
      const aba = el.getAttribute("data-aba");
      if (!aba || !MAP_TABS[aba]) return;
      e.preventDefault();
      loadTab(aba);
    });
  });

  const dots = document.querySelectorAll(".rd-dotnav a");
  dots.forEach((a) => {
    a.addEventListener("click", () => {
      dots.forEach((x) => x.classList.remove("active"));
      a.classList.add("active");
    });
  });

  const ref = document.getElementById("mapRefMesAno");
  if (ref && typeof MutationObserver !== "undefined") {
    const obs = new MutationObserver(() => syncHeroReference());
    obs.observe(ref, { childList: true, characterData: true, subtree: true });
  }
}

function init() {
  const params = new URLSearchParams(location.search);
  const abaParam = params.get("aba");
  if (abaParam && MAP_TABS[abaParam]) state.abaAtual = abaParam;
  else state.abaAtual = "sobre";

  if (els.menuToggle) els.menuToggle.addEventListener("click", toggleMenu);
  if (els.menuEdgeOpen) els.menuEdgeOpen.addEventListener("click", openMenu);
  if (els.menuOverlay) els.menuOverlay.addEventListener("click", closeMenu);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (state.abaAtual !== "analise_leste") return;
      window.ceRegioesMapApi?.resize();
      window.cagedGrupamentosApi?.resizeCharts?.();
    }, 160);
  });

  renderMenu();
  syncPageHeader();
  bindExtraNav();
  syncMapSection();
}

init();
