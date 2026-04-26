import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import AppFooter from "./AppFooter";
import LoginScreen from "./LoginScreen";
import {
  USUARIOS_RESPALDO,
  cargarUsuariosDesdeServidor,
  limpiarSesion,
  persistirInicioSesion,
  sesionGuardadaValida,
  validarCredenciales,
} from "./auth/usuarios";
import { datosPorDefecto } from "./data/defaultData";
import { leyendaCampo } from "./data/leyendasCampos";
import {
  exportarComparativaAXlsx,
  exportarDatosAXlsx,
  exportarPlantillaVacia,
  exportarRatiosAXlsx,
  importarDesdeArchivo,
} from "./logic/excelIO";
import { generarFilasComparativa, type FilaComparativa } from "./logic/comparativaRatios";
import { generarPdfAnalisis, generarPdfComparativa } from "./logic/pdfExport";
import { formatearValorRatio } from "./logic/formatoRatios";
import {
  montoAStringEdicion,
  montoAStringEdicionDecimales,
  parseMontoIngreso,
  redondearDatosFinancieros,
  redondearDecimales,
} from "./logic/numerosFormulario";
import { comprobarEcuacionContable } from "./logic/ecuacionContable";
import { calcularRatios } from "./logic/ratios";
import type { DatosFinancieros, RatioCalculado } from "./types";

type CampoDef = {
  key: keyof DatosFinancieros;
  label: string;
  tipo: "texto" | "numero";
};

const CAMPOS_IDENTIFICACION: CampoDef[] = [
  { key: "razonSocial", label: "Razón social", tipo: "texto" },
  { key: "periodo", label: "Período / ejercicio", tipo: "texto" },
];

const COLUMNA_ACTIVO: CampoDef[] = [
  { key: "activoCorriente", label: "Activo corriente (total)", tipo: "numero" },
  { key: "efectivoYEquivalentes", label: "Efectivo y equivalentes", tipo: "numero" },
  { key: "creditosPorVentas", label: "Créditos por ventas", tipo: "numero" },
  { key: "inventarios", label: "Inventarios", tipo: "numero" },
  { key: "otrosActivosCorrientes", label: "Otros activos corrientes", tipo: "numero" },
  { key: "activoNoCorriente", label: "Activo no corriente (total)", tipo: "numero" },
  { key: "bienesDeUso", label: "Bienes de uso", tipo: "numero" },
  { key: "inversionesLargoPlazo", label: "Inversiones largo plazo", tipo: "numero" },
  { key: "intangibles", label: "Intangibles", tipo: "numero" },
  { key: "otrosActivosNoCorrientes", label: "Otros activos no corrientes", tipo: "numero" },
];

const COLUMNA_PASIVO: CampoDef[] = [
  { key: "pasivoCorriente", label: "Pasivo corriente (total)", tipo: "numero" },
  { key: "deudaFinancieraCortoPlazo", label: "Deuda financiera corto plazo", tipo: "numero" },
  { key: "proveedores", label: "Proveedores", tipo: "numero" },
  { key: "otrosPasivosCorrientes", label: "Otros pasivos corrientes", tipo: "numero" },
  { key: "pasivoNoCorriente", label: "Pasivo no corriente (total)", tipo: "numero" },
  { key: "deudaFinancieraLargoPlazo", label: "Deuda financiera largo plazo", tipo: "numero" },
  { key: "otrosPasivosNoCorrientes", label: "Otros pasivos no corrientes", tipo: "numero" },
];

const COLUMNA_PATRIMONIO_Y_RESULTADOS: CampoDef[] = [
  { key: "patrimonioNeto", label: "Patrimonio neto", tipo: "numero" },
  { key: "ventasNetas", label: "Ventas netas", tipo: "numero" },
  { key: "costoDeVentas", label: "Costo de ventas", tipo: "numero" },
  { key: "gastosOperativos", label: "Gastos operativos", tipo: "numero" },
  { key: "gastosFinancieros", label: "Gastos financieros (intereses)", tipo: "numero" },
  { key: "resultadoNeto", label: "Resultado neto", tipo: "numero" },
  { key: "amortizacionesYDepreciaciones", label: "Amortizaciones y depreciaciones", tipo: "numero" },
  {
    key: "flujoEfectivoOperativo",
    label: "Flujo operativo (opcional)",
    tipo: "numero",
  },
  {
    key: "inversionesActivosFijos",
    label: "Inversiones en activos — CAPEX",
    tipo: "numero",
  },
];

function fmtValor(r: RatioCalculado): string {
  return formatearValorRatio(r.formato, r.valor);
}

function descargarBuffer(buf: ArrayBuffer, nombre: string, mime: string) {
  const blob = new Blob([buf], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

function grupoTitulo(s: "economica" | "financiera", p: "corto" | "largo") {
  const sit = s === "economica" ? "Situación económica" : "Situación financiera";
  const pl = p === "corto" ? "Corto plazo" : "Largo plazo";
  return `${sit} — ${pl}`;
}

type Tema = "light" | "dark";

function leerTemaGuardado(): Tema {
  try {
    const t = localStorage.getItem("theme");
    if (t === "light" || t === "dark") return t;
  } catch {
    /* ignore */
  }
  return "dark";
}

function IconSol() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function IconLuna() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

type EjercicioId = "actual" | "anterior";

const datosEjemploAnterior: DatosFinancieros = {
  ...datosPorDefecto,
  periodo: "2024",
};

/** Decimales para montos en formularios y coherencia con ratios (pantalla y exportes). */
const DECIMALES_MONTOS = 2;

type PanelDatosProps = {
  titulo: string;
  datos: DatosFinancieros;
  setDatos: React.Dispatch<React.SetStateAction<DatosFinancieros>>;
  borrador: Partial<Record<keyof DatosFinancieros, string>>;
  setBorrador: React.Dispatch<
    React.SetStateAction<Partial<Record<keyof DatosFinancieros, string>>>
  >;
  /** Si se define, los montos se muestran con esa cantidad de decimales y se redondean al salir del campo. */
  decimalesMontos?: number;
};

function PanelDatosContables({
  titulo,
  datos,
  setDatos,
  borrador,
  setBorrador,
  decimalesMontos,
}: PanelDatosProps) {
  function fmtMonto(n: number): string {
    return decimalesMontos !== undefined
      ? montoAStringEdicionDecimales(n, decimalesMontos)
      : montoAStringEdicion(n);
  }

  function aplicarMontoIngresado(raw: string): number {
    let n = parseMontoIngreso(raw);
    if (decimalesMontos !== undefined) n = redondearDecimales(n, decimalesMontos);
    return n;
  }

  function actualizar<K extends keyof DatosFinancieros>(key: K, value: DatosFinancieros[K]) {
    setDatos((d) => ({ ...d, [key]: value }));
  }

  function campoInput({ key, label, tipo }: CampoDef) {
    const tip = leyendaCampo(key);
    return (
      <label key={key} className="field">
        <span className="name" title={tip}>
          {label}
        </span>
        {tipo === "texto" ? (
          <input
            type="text"
            value={String(datos[key])}
            onChange={(e) => actualizar(key, e.target.value as DatosFinancieros[typeof key])}
            title={tip}
          />
        ) : key === "flujoEfectivoOperativo" ? (
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            title={tip}
            placeholder="Vacío: RN + amortizaciones"
            value={
              borrador.flujoEfectivoOperativo !== undefined
                ? borrador.flujoEfectivoOperativo
                : datos.flujoEfectivoOperativo === null
                  ? ""
                  : fmtMonto(datos.flujoEfectivoOperativo)
            }
            onFocus={(e) => {
              const cfo = datos.flujoEfectivoOperativo;
              if (cfo === null || cfo === 0) {
                setBorrador((m) => ({ ...m, flujoEfectivoOperativo: "" }));
              } else {
                setBorrador((m) => ({ ...m, flujoEfectivoOperativo: fmtMonto(cfo) }));
                queueMicrotask(() => e.currentTarget.select());
              }
            }}
            onChange={(e) => {
              setBorrador((m) => ({
                ...m,
                flujoEfectivoOperativo: e.target.value,
              }));
            }}
            onBlur={(e) => {
              const raw = e.target.value.trim();
              setBorrador((m) => {
                const n = { ...m };
                delete n.flujoEfectivoOperativo;
                return n;
              });
              if (raw === "") {
                actualizar("flujoEfectivoOperativo", null);
              } else {
                const n = aplicarMontoIngresado(raw);
                actualizar("flujoEfectivoOperativo", Number.isFinite(n) ? n : null);
              }
            }}
          />
        ) : (
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            title={tip}
            value={borrador[key] !== undefined ? borrador[key]! : fmtMonto(datos[key] as number)}
            onFocus={(e) => {
              const n = datos[key] as number;
              if (n === 0) {
                setBorrador((m) => ({ ...m, [key]: "" }));
              } else {
                setBorrador((m) => ({ ...m, [key]: fmtMonto(n) }));
                queueMicrotask(() => e.currentTarget.select());
              }
            }}
            onChange={(e) => {
              setBorrador((m) => ({ ...m, [key]: e.target.value }));
            }}
            onBlur={(e) => {
              const raw = e.target.value;
              setBorrador((m) => {
                const n = { ...m };
                delete n[key];
                return n;
              });
              actualizar(key, aplicarMontoIngresado(raw) as DatosFinancieros[typeof key]);
            }}
          />
        )}
      </label>
    );
  }

  return (
    <div className="panel">
      <h2>{titulo}</h2>
      <p className="form-montos-hint">
        Montos con decimales: punto o coma como separador; si usás coma, los puntos se interpretan como miles
        (ej. 1.234,56).
        {decimalesMontos !== undefined && (
          <> En este bloque los importes numéricos se muestran y guardan con {decimalesMontos} decimales.</>
        )}
      </p>
      <div className="form-identificacion">{CAMPOS_IDENTIFICACION.map(campoInput)}</div>
      <div className="form-tres-columnas">
        <div className="form-columna">
          <h3
            className="form-columna-titulo"
            title="Bienes y derechos de la entidad. El total (activo corriente + no corriente) debe encajar con pasivo + patrimonio, según el balance."
          >
            Activo
          </h3>
          <div className="form-columna-campos">{COLUMNA_ACTIVO.map(campoInput)}</div>
        </div>
        <div className="form-columna">
          <h3
            className="form-columna-titulo"
            title="Obligaciones a pagar a terceros. La suma de pasivo corriente y no corriente es el total del pasivo del balance (sin patrimonio)."
          >
            Pasivo
          </h3>
          <div className="form-columna-campos">{COLUMNA_PASIVO.map(campoInput)}</div>
        </div>
        <div className="form-columna">
          <h3
            className="form-columna-titulo"
            title="Patrimonio: recursos de los propietarios. Resultados: cuenta de resultados o estado de desempeño. El balance cuadra si activo = pasivo + patrimonio neto (al menos a nivel de totales)."
          >
            Patrimonio neto y resultados
          </h3>
          <div className="form-columna-campos">{COLUMNA_PATRIMONIO_Y_RESULTADOS.map(campoInput)}</div>
        </div>
      </div>
    </div>
  );
}

function formatMontoCorto(n: number): string {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function AlertaEcuacionContable({ datos, etiqueta }: { datos: DatosFinancieros; etiqueta: string }) {
  const c = comprobarEcuacionContable(datos);
  if (c.ok) {
    return (
      <div className="ecuacion-box ecuacion-ok" role="status">
        <strong>{etiqueta}:</strong> el total de activo ({formatMontoCorto(c.totalActivo)}) coincide con pasivo + patrimonio
        neto ({formatMontoCorto(c.totalPasivoMasPat)}), según las cifras cargadas.
      </div>
    );
  }
  return (
    <div className="ecuacion-box ecuacion-aviso" role="alert">
      <strong>{etiqueta} — posible desvío en el balance:</strong> el activo total es{" "}
      {formatMontoCorto(c.totalActivo)} y la suma de pasivo total ({formatMontoCorto(c.totalPasivo)} más
      patrimonio neto {formatMontoCorto(c.pat)}) es {formatMontoCorto(c.totalPasivoMasPat)}.{" "}
      <strong>Diferencia: {formatMontoCorto(c.diferencia)}</strong> (revisá totales o partidas; la ecuación
      contable es Activo = Pasivo + Patrimonio neto).
    </div>
  );
}

type GrupoRatios = { titulo: string; items: RatioCalculado[] };

type BloqueRatiosProps = {
  titulo: string;
  porGrupo: GrupoRatios[];
  pistaPlegable?: boolean;
};

function BloqueRatios({ titulo, porGrupo, pistaPlegable = true }: BloqueRatiosProps) {
  return (
    <div className="panel">
      <h2>{titulo}</h2>
      {pistaPlegable && (
        <p className="form-montos-hint ratio-plegable-hint">
          Abrí cada bloque según situación (financiera o económica) y plazo. Dentro verás la lista de ratios con
          fórmula e interpretación.
        </p>
      )}
      {porGrupo.map(({ titulo: t, items }) => (
        <details key={t} className="ratio-bloque-details">
          <summary className="ratio-bloque-summary">
            <span className="ratio-bloque-titulo">{t}</span>
            <span className="ratio-bloque-contador">
              {items.length} ratio{items.length === 1 ? "" : "s"}
            </span>
          </summary>
          <div className="ratio-bloque-body">
            {items.length === 0 ? (
              <p className="subtitle ratio-bloque-vacio" style={{ marginBottom: 0 }}>
                Sin ratios en este bloque.
              </p>
            ) : (
              items.map((r) => (
                <article key={r.id} className="ratio-card">
                  <header>
                    <span className="title">{r.nombre}</span>
                    <span className="valor">{fmtValor(r)}</span>
                    <span className={`pill ${r.situacion === "financiera" ? "fin" : "eco"}`}>
                      {r.situacion === "financiera" ? "Financiera" : "Económica"}
                    </span>
                    <span className="pill corto">{r.plazo === "corto" ? "Corto plazo" : "Largo plazo"}</span>
                  </header>
                  <div className="formula">{r.formula}</div>
                  <p className="interpret">{r.explicacion}</p>
                </article>
              ))
            )}
          </div>
        </details>
      ))}
    </div>
  );
}

function ContenidoAnalisis() {
  const [datosActual, setDatosActual] = useState<DatosFinancieros>(() =>
    redondearDatosFinancieros({ ...datosPorDefecto }, DECIMALES_MONTOS)
  );
  const [datosAnterior, setDatosAnterior] = useState<DatosFinancieros>(() =>
    redondearDatosFinancieros({ ...datosEjemploAnterior }, DECIMALES_MONTOS)
  );
  const [dosEjercicios, setDosEjercicios] = useState(false);

  const [montosBorrador, setMontosBorrador] = useState<{
    actual: Partial<Record<keyof DatosFinancieros, string>>;
    anterior: Partial<Record<keyof DatosFinancieros, string>>;
  }>({ actual: {}, anterior: {} });

  const [errorImport, setErrorImport] = useState<{ actual: string | null; anterior: string | null }>({
    actual: null,
    anterior: null,
  });

  const fileRefActual = useRef<HTMLInputElement>(null);
  const fileRefAnterior = useRef<HTMLInputElement>(null);
  const [tema, setTema] = useState<Tema>(leerTemaGuardado);

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", tema);
    try {
      localStorage.setItem("theme", tema);
    } catch {
      /* ignore */
    }
  }, [tema]);

  const ratiosActual = useMemo(() => calcularRatios(datosActual), [datosActual]);
  const ratiosAnterior = useMemo(() => calcularRatios(datosAnterior), [datosAnterior]);

  const porGrupoActual = useMemo(
    () => agruparRatiosPorSeccion(ratiosActual),
    [ratiosActual]
  );
  const porGrupoAnterior = useMemo(
    () => agruparRatiosPorSeccion(ratiosAnterior),
    [ratiosAnterior]
  );

  const filasComparativa = useMemo(
    () => generarFilasComparativa(ratiosAnterior, ratiosActual, datosAnterior, datosActual),
    [ratiosAnterior, ratiosActual, datosAnterior, datosActual]
  );

  const gruposComparativa = useMemo(
    () => agruparComparativasEnBloques(filasComparativa),
    [filasComparativa]
  );

  function setError(ej: EjercicioId, msg: string | null) {
    setErrorImport((e) => ({ ...e, [ej]: msg }));
  }

  async function onArchivo(ej: EjercicioId, e: React.ChangeEvent<HTMLInputElement>) {
    setError(ej, null);
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const buf = await f.arrayBuffer();
      const parcial = importarDesdeArchivo(buf);
      if (ej === "actual") {
        setDatosActual((prev) => redondearDatosFinancieros({ ...prev, ...parcial }, DECIMALES_MONTOS));
        setMontosBorrador((m) => ({ ...m, actual: {} }));
      } else {
        setDatosAnterior((prev) =>
          redondearDatosFinancieros({ ...prev, ...parcial }, DECIMALES_MONTOS)
        );
        setMontosBorrador((m) => ({ ...m, anterior: {} }));
      }
    } catch {
      setError(
        ej,
        "No se pudo leer el archivo. Usá .xlsx o .xls: columna A = concepto, columna B = valor (una fila por dato). Podés descargar la plantilla."
      );
    }
  }

  function exportXlsxDatos(d: DatosFinancieros, sufijo: string) {
    const buf = exportarDatosAXlsx(d);
    const safe = (d.razonSocial || "empresa").replace(/[^\w\-]+/g, "_").slice(0, 40);
    descargarBuffer(
      buf,
      `datos_${sufijo}_${safe}.xlsx`,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  }

  function exportXlsxAnalisis(d: DatosFinancieros, ratios: RatioCalculado[], sufijo: string) {
    const buf = exportarRatiosAXlsx(d, ratios);
    const safe = (d.razonSocial || "empresa").replace(/[^\w\-]+/g, "_").slice(0, 40);
    descargarBuffer(
      buf,
      `analisis_ratios_${sufijo}_${safe}.xlsx`,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  }

  function exportPdf(d: DatosFinancieros, ratios: RatioCalculado[], sufijo: string) {
    const blob = generarPdfAnalisis(d, ratios);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safe = (d.razonSocial || "empresa").replace(/[^\w\-]+/g, "_").slice(0, 40);
    a.download = `analisis_${sufijo}_${safe}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function plantilla() {
    const buf = exportarPlantillaVacia();
    descargarBuffer(
      buf,
      "plantilla_balance_analisis.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  }

  function restaurarEjemplos() {
    setDatosActual(redondearDatosFinancieros({ ...datosPorDefecto }, DECIMALES_MONTOS));
    setDatosAnterior(redondearDatosFinancieros({ ...datosEjemploAnterior }, DECIMALES_MONTOS));
    setMontosBorrador({ actual: {}, anterior: {} });
  }

  function exportComparativoXlsx() {
    const empresa = datosActual.razonSocial || datosAnterior.razonSocial || "empresa";
    const buf = exportarComparativaAXlsx(
      filasComparativa,
      empresa,
      datosAnterior.periodo || "Anterior",
      datosActual.periodo || "Actual"
    );
    const safe = empresa.replace(/[^\w\-]+/g, "_").slice(0, 40);
    descargarBuffer(
      buf,
      `analisis_comparativo_${safe}.xlsx`,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  }

  function exportComparativoPdf() {
    const empresa = datosActual.razonSocial || datosAnterior.razonSocial || "empresa";
    const blob = generarPdfComparativa(
      empresa,
      datosAnterior.periodo || "Anterior",
      datosActual.periodo || "Actual",
      filasComparativa
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safe = empresa.replace(/[^\w\-]+/g, "_").slice(0, 40);
    a.download = `analisis_comparativo_${safe}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function activarEjercicioAnterior() {
    setDosEjercicios(true);
    setDatosActual((d) => redondearDatosFinancieros(d, DECIMALES_MONTOS));
    setDatosAnterior(redondearDatosFinancieros({ ...datosEjemploAnterior }, DECIMALES_MONTOS));
    setMontosBorrador((m) => ({ ...m, anterior: {} }));
    setError("anterior", null);
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header-text">
          <h1>Análisis de estados contables</h1>
          <p className="subtitle">
            Ingresá balances y cuenta de resultados, o importá Excel con una fila por concepto (columna A) y el
            valor en la columna B. Los ratios se clasifican en situación
            económica / financiera y corto / largo plazo, con interpretación contextual para la empresa.
            {dosEjercicios && (
              <>
                {" "}
                Con dos ejercicios cargados podés comparar ratios entre el período anterior y el actual e
                importar/exportar cada uno por separado.
              </>
            )}
          </p>
        </div>
        <div className="theme-switch" role="group" aria-label="Tema de la interfaz">
          <button
            type="button"
            title="Modo claro"
            aria-label="Modo claro"
            aria-pressed={tema === "light"}
            onClick={() => setTema("light")}
          >
            <IconSol />
          </button>
          <button
            type="button"
            title="Modo oscuro"
            aria-label="Modo oscuro"
            aria-pressed={tema === "dark"}
            onClick={() => setTema("dark")}
          >
            <IconLuna />
          </button>
        </div>
      </header>

      <div className="acciones-iniciales">
        {!dosEjercicios ? (
          <button type="button" className="btn-carga-anterior" onClick={activarEjercicioAnterior}>
            Cargar ejercicio anterior
          </button>
        ) : (
          <button
            type="button"
            className="secondary btn-ocultar-anterior"
            onClick={() => {
              setDosEjercicios(false);
              setError("anterior", null);
            }}
          >
            Ocultar ejercicio anterior
          </button>
        )}
      </div>

      {!dosEjercicios ? (
        <>
          <div className="toolbar">
            <label className="file-btn">
              Importar Excel
              <input
                ref={fileRefActual}
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => onArchivo("actual", e)}
              />
            </label>
            <button type="button" className="secondary" onClick={plantilla}>
              Descargar plantilla
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setDatosActual(redondearDatosFinancieros({ ...datosPorDefecto }, DECIMALES_MONTOS));
                setMontosBorrador((m) => ({ ...m, actual: {} }));
              }}
            >
              Restaurar ejemplo
            </button>
            <button type="button" onClick={() => exportXlsxDatos(datosActual, "actual")}>
              Exportar datos (.xlsx)
            </button>
            <button type="button" onClick={() => exportXlsxAnalisis(datosActual, ratiosActual, "actual")}>
              Exportar análisis (.xlsx)
            </button>
            <button type="button" onClick={() => exportPdf(datosActual, ratiosActual, "actual")}>
              Exportar informe (.pdf)
            </button>
          </div>
          {errorImport.actual && <div className="error-msg">{errorImport.actual}</div>}
        </>
      ) : (
        <>
          <div className="toolbar toolbar-global">
            <button type="button" className="secondary" onClick={plantilla}>
              Descargar plantilla
            </button>
            <button type="button" className="secondary" onClick={restaurarEjemplos}>
              Restaurar ejemplos (ambos períodos)
            </button>
            <button type="button" className="btn-comparativo" onClick={exportComparativoXlsx}>
              Exportar comparativo (.xlsx)
            </button>
            <button type="button" className="btn-comparativo" onClick={exportComparativoPdf}>
              Exportar comparativo (.pdf)
            </button>
          </div>

          <div className="toolbar-doble">
            <div className="toolbar-periodo">
              <h3 className="toolbar-periodo-titulo">Ejercicio anterior</h3>
              <div className="toolbar">
                <label className="file-btn">
                  Importar Excel
                  <input
                    ref={fileRefAnterior}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => onArchivo("anterior", e)}
                  />
                </label>
                <button type="button" onClick={() => exportXlsxDatos(datosAnterior, "anterior")}>
                  Exportar datos (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={() => exportXlsxAnalisis(datosAnterior, ratiosAnterior, "anterior")}
                >
                  Exportar análisis (.xlsx)
                </button>
                <button type="button" onClick={() => exportPdf(datosAnterior, ratiosAnterior, "anterior")}>
                  Exportar informe (.pdf)
                </button>
              </div>
              {errorImport.anterior && <div className="error-msg">{errorImport.anterior}</div>}
            </div>
            <div className="toolbar-periodo">
              <h3 className="toolbar-periodo-titulo">Ejercicio actual</h3>
              <div className="toolbar">
                <label className="file-btn">
                  Importar Excel
                  <input
                    ref={fileRefActual}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => onArchivo("actual", e)}
                  />
                </label>
                <button type="button" onClick={() => exportXlsxDatos(datosActual, "actual")}>
                  Exportar datos (.xlsx)
                </button>
                <button type="button" onClick={() => exportXlsxAnalisis(datosActual, ratiosActual, "actual")}>
                  Exportar análisis (.xlsx)
                </button>
                <button type="button" onClick={() => exportPdf(datosActual, ratiosActual, "actual")}>
                  Exportar informe (.pdf)
                </button>
              </div>
              {errorImport.actual && <div className="error-msg">{errorImport.actual}</div>}
            </div>
          </div>
        </>
      )}

      {!dosEjercicios ? (
        <>
          <AlertaEcuacionContable datos={datosActual} etiqueta="Ecuación del balance" />
          <PanelDatosContables
            titulo="Datos contables"
            datos={datosActual}
            setDatos={setDatosActual}
            borrador={montosBorrador.actual}
            setBorrador={(action) =>
              setMontosBorrador((m) => ({
                ...m,
                actual: typeof action === "function" ? action(m.actual) : action,
              }))
            }
            decimalesMontos={DECIMALES_MONTOS}
          />
          <BloqueRatios titulo="Ratios e interpretación" porGrupo={porGrupoActual} />
        </>
      ) : (
        <>
          <div className="ecuacion-doble">
            <AlertaEcuacionContable datos={datosAnterior} etiqueta="Ecuación (ejercicio anterior)" />
            <AlertaEcuacionContable datos={datosActual} etiqueta="Ecuación (ejercicio actual)" />
          </div>
          <div className="dos-columnas-form">
            <PanelDatosContables
              titulo="Datos contables — ejercicio anterior"
              datos={datosAnterior}
              setDatos={setDatosAnterior}
              borrador={montosBorrador.anterior}
              setBorrador={(action) =>
                setMontosBorrador((m) => ({
                  ...m,
                  anterior: typeof action === "function" ? action(m.anterior) : action,
                }))
              }
              decimalesMontos={DECIMALES_MONTOS}
            />
            <PanelDatosContables
              titulo="Datos contables — ejercicio actual"
              datos={datosActual}
              setDatos={setDatosActual}
              borrador={montosBorrador.actual}
              setBorrador={(action) =>
                setMontosBorrador((m) => ({
                  ...m,
                  actual: typeof action === "function" ? action(m.actual) : action,
                }))
              }
              decimalesMontos={DECIMALES_MONTOS}
            />
          </div>
          <div className="dos-columnas-ratios">
            <BloqueRatios titulo="Ratios e interpretación — ejercicio anterior" porGrupo={porGrupoAnterior} />
            <BloqueRatios
              titulo="Ratios e interpretación — ejercicio actual"
              porGrupo={porGrupoActual}
              pistaPlegable={false}
            />
          </div>
          <div className="panel panel-comparativo">
            <h2>Análisis comparativo (ejercicio anterior → actual)</h2>
            <p className="form-montos-hint">
              Abrí cada bloque (mismo criterio que en ratios). Dentro, comparación por ratio: a la izquierda el
              ejercicio anterior y a la derecha el actual. Podés exportar con &quot;Exportar comparativo&quot;
              arriba.
            </p>
            {gruposComparativa.map(({ titulo, items }) => (
              <details key={titulo} className="ratio-bloque-details panel-comparativo-bloque">
                <summary className="ratio-bloque-summary">
                  <span className="ratio-bloque-titulo">{titulo}</span>
                  <span className="ratio-bloque-contador">
                    {items.length} ratio{items.length === 1 ? "" : "s"}
                  </span>
                </summary>
                <div className="ratio-bloque-body">
                  {items.map((f) => (
                    <article key={f.id} className="ratio-card ratio-card-comparativo">
                      <header>
                        <span className="title">{f.nombre}</span>
                        <span className={`pill ${f.situacionLabel === "Financiera" ? "fin" : "eco"}`}>
                          {f.situacionLabel}
                        </span>
                        <span className="pill corto">{f.plazoLabel}</span>
                      </header>
                      <div className="comparativo-valores">
                        <div className="comparativo-valor-celda comparativo-valor-izq">
                          <span className="comparativo-valor-etiq">
                            Ejercicio anterior
                            {datosAnterior.periodo ? ` (${datosAnterior.periodo})` : ""}
                          </span>
                          <span className="comparativo-valor-num">{f.valorAnterior}</span>
                        </div>
                        <div className="comparativo-valor-celda comparativo-valor-der">
                          <span className="comparativo-valor-etiq">
                            Ejercicio actual
                            {datosActual.periodo ? ` (${datosActual.periodo})` : ""}
                          </span>
                          <span className="comparativo-valor-num">{f.valorActual}</span>
                        </div>
                      </div>
                      <p className="comparativo-var">{f.variacionResumen}</p>
                      <p className="interpret">{f.analisisCausas}</p>
                    </article>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function agruparRatiosPorSeccion(ratios: RatioCalculado[]) {
  const clave = (s: RatioCalculado["situacion"], p: RatioCalculado["plazo"]) => `${s}-${p}`;
  const map = new Map<string, RatioCalculado[]>();
  for (const r of ratios) {
    const k = clave(r.situacion, r.plazo);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(r);
  }
  const orden: [RatioCalculado["situacion"], RatioCalculado["plazo"]][] = [
    ["financiera", "corto"],
    ["financiera", "largo"],
    ["economica", "corto"],
    ["economica", "largo"],
  ];
  return orden.map(([s, p]) => ({
    titulo: grupoTitulo(s, p),
    items: map.get(clave(s, p)) ?? [],
  }));
}

const BLOQUES_COMPARATIVA = ["fin-corto", "fin-largo", "eco-corto", "eco-largo"] as const;

type ClaveBloqueComp = (typeof BLOQUES_COMPARATIVA)[number];

function claveBloqueComparativa(f: FilaComparativa): ClaveBloqueComp {
  const fin = f.situacionLabel === "Financiera";
  const corto = f.plazoLabel === "Corto plazo";
  if (fin && corto) return "fin-corto";
  if (fin && !corto) return "fin-largo";
  if (!fin && corto) return "eco-corto";
  return "eco-largo";
}

function tituloBloqueComparativa(k: ClaveBloqueComp): string {
  const s: "financiera" | "economica" =
    k === "fin-corto" || k === "fin-largo" ? "financiera" : "economica";
  const p: "corto" | "largo" = k === "fin-corto" || k === "eco-corto" ? "corto" : "largo";
  return grupoTitulo(s, p);
}

function agruparComparativasEnBloques(filas: FilaComparativa[]) {
  const map = new Map<ClaveBloqueComp, FilaComparativa[]>();
  for (const k of BLOQUES_COMPARATIVA) map.set(k, []);
  for (const f of filas) {
    const k = claveBloqueComparativa(f);
    map.get(k)!.push(f);
  }
  return BLOQUES_COMPARATIVA.map((k) => ({
    titulo: tituloBloqueComparativa(k),
    items: map.get(k) ?? [],
  }));
}

export default function App() {
  const [sesionActiva, setSesionActiva] = useState(() => sesionGuardadaValida());

  /** Vuelve a leer `usuarios.json` en cada intento (así los cambios en el archivo se aplican sin recargar la página). */
  async function intentarLogin(usuario: string, clave: string): Promise<boolean> {
    try {
      const lista = await cargarUsuariosDesdeServidor();
      return validarCredenciales(usuario, clave, lista);
    } catch {
      return validarCredenciales(usuario, clave, USUARIOS_RESPALDO);
    }
  }

  /** Si la sesión expira mientras la app está abierta, vuelve al login. */
  useEffect(() => {
    if (!sesionActiva) return;
    function verificarVencimiento() {
      if (!sesionGuardadaValida()) {
        limpiarSesion();
        setSesionActiva(false);
      }
    }
    const id = setInterval(verificarVencimiento, 30_000);
    window.addEventListener("focus", verificarVencimiento);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", verificarVencimiento);
    };
  }, [sesionActiva]);

  function onSesionIniciada() {
    persistirInicioSesion();
    setSesionActiva(true);
  }

  if (!sesionActiva) {
    return (
      <div className="app-layout">
        <main className="app-main app-main--login">
          <LoginScreen intentarLogin={intentarLogin} onSesionIniciada={onSesionIniciada} />
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="app-layout">
      <main className="app-main">
        <ContenidoAnalisis />
      </main>
      <AppFooter />
    </div>
  );
}
