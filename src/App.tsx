import { useMemo, useRef, useState } from "react";
import { datosPorDefecto } from "./data/defaultData";
import {
  exportarDatosAXlsx,
  exportarPlantillaVacia,
  exportarRatiosAXlsx,
  importarDesdeArchivo,
} from "./logic/excelIO";
import { generarPdfAnalisis } from "./logic/pdfExport";
import { formatearValorRatio } from "./logic/formatoRatios";
import { montoAStringEdicion, parseMontoIngreso } from "./logic/numerosFormulario";
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

export default function App() {
  const [datos, setDatos] = useState<DatosFinancieros>({ ...datosPorDefecto });
  /** Texto libre mientras el input tiene foco (permite tipear "12." sin que se borre el punto). */
  const [montosBorrador, setMontosBorrador] = useState<
    Partial<Record<keyof DatosFinancieros, string>>
  >({});
  const [errorImport, setErrorImport] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const ratios = useMemo(() => calcularRatios(datos), [datos]);

  const porGrupo = useMemo(() => {
    const clave = (s: RatioCalculado["situacion"], p: RatioCalculado["plazo"]) => `${s}-${p}`;
    const map = new Map<string, RatioCalculado[]>();
    for (const r of ratios) {
      const k = clave(r.situacion, r.plazo);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    const orden: [RatioCalculado["situacion"], RatioCalculado["plazo"]][] = [
      ["economica", "corto"],
      ["economica", "largo"],
      ["financiera", "corto"],
      ["financiera", "largo"],
    ];
    return orden.map(([s, p]) => ({
      situacion: s,
      plazo: p,
      titulo: grupoTitulo(s, p),
      items: map.get(clave(s, p)) ?? [],
    }));
  }, [ratios]);

  function actualizar<K extends keyof DatosFinancieros>(key: K, value: DatosFinancieros[K]) {
    setDatos((d) => ({ ...d, [key]: value }));
  }

  async function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    setErrorImport(null);
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const buf = await f.arrayBuffer();
      const parcial = importarDesdeArchivo(buf);
      setDatos((prev) => ({ ...prev, ...parcial }));
      setMontosBorrador({});
    } catch {
      setErrorImport(
        "No se pudo leer el archivo. Usá .xlsx o .xls: columna A = concepto, columna B = valor (una fila por dato). Podés descargar la plantilla."
      );
    }
  }

  function exportXlsxDatos() {
    const buf = exportarDatosAXlsx(datos);
    const safe = (datos.razonSocial || "empresa").replace(/[^\w\-]+/g, "_").slice(0, 40);
    descargarBuffer(buf, `datos_${safe}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }

  function exportXlsxAnalisis() {
    const rows = ratios.map((r) => ({
      nombre: r.nombre,
      situacion: r.situacion,
      plazo: r.plazo,
      valorFmt: fmtValor(r),
      formula: r.formula,
      explicacion: r.explicacion,
    }));
    const buf = exportarRatiosAXlsx(datos, rows);
    const safe = (datos.razonSocial || "empresa").replace(/[^\w\-]+/g, "_").slice(0, 40);
    descargarBuffer(
      buf,
      `analisis_ratios_${safe}.xlsx`,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  }

  function exportPdf() {
    const blob = generarPdfAnalisis(datos, ratios);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safe = (datos.razonSocial || "empresa").replace(/[^\w\-]+/g, "_").slice(0, 40);
    a.download = `analisis_${safe}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function plantilla() {
    const buf = exportarPlantillaVacia();
    descargarBuffer(buf, "plantilla_balance_analisis.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }

  function campoInput({ key, label, tipo }: CampoDef) {
    return (
      <label key={key} className="field">
        <span className="name">{label}</span>
        {tipo === "texto" ? (
          <input
            type="text"
            value={String(datos[key])}
            onChange={(e) => actualizar(key, e.target.value as DatosFinancieros[typeof key])}
          />
        ) : key === "flujoEfectivoOperativo" ? (
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Vacío: RN + amortizaciones"
            value={
              montosBorrador.flujoEfectivoOperativo !== undefined
                ? montosBorrador.flujoEfectivoOperativo
                : datos.flujoEfectivoOperativo === null
                  ? ""
                  : montoAStringEdicion(datos.flujoEfectivoOperativo)
            }
            onFocus={() => {
              setMontosBorrador((m) => ({
                ...m,
                flujoEfectivoOperativo:
                  datos.flujoEfectivoOperativo === null
                    ? ""
                    : montoAStringEdicion(datos.flujoEfectivoOperativo),
              }));
            }}
            onChange={(e) => {
              setMontosBorrador((m) => ({
                ...m,
                flujoEfectivoOperativo: e.target.value,
              }));
            }}
            onBlur={(e) => {
              const raw = e.target.value.trim();
              setMontosBorrador((m) => {
                const n = { ...m };
                delete n.flujoEfectivoOperativo;
                return n;
              });
              if (raw === "") {
                actualizar("flujoEfectivoOperativo", null);
              } else {
                const n = parseMontoIngreso(raw);
                actualizar("flujoEfectivoOperativo", Number.isFinite(n) ? n : null);
              }
            }}
          />
        ) : (
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={
              montosBorrador[key] !== undefined
                ? montosBorrador[key]!
                : montoAStringEdicion(datos[key] as number)
            }
            onFocus={() => {
              setMontosBorrador((m) => ({
                ...m,
                [key]: montoAStringEdicion(datos[key] as number),
              }));
            }}
            onChange={(e) => {
              setMontosBorrador((m) => ({ ...m, [key]: e.target.value }));
            }}
            onBlur={(e) => {
              const raw = e.target.value;
              setMontosBorrador((m) => {
                const n = { ...m };
                delete n[key];
                return n;
              });
              actualizar(
                key,
                parseMontoIngreso(raw) as DatosFinancieros[typeof key]
              );
            }}
          />
        )}
      </label>
    );
  }

  return (
    <>
      <h1>Análisis de estados contables</h1>
      <p className="subtitle">
        Ingresá balances y cuenta de resultados, o importá Excel con una fila por concepto (columna A) y el
        valor en la columna B. Los ratios se clasifican en situación
        económica / financiera y corto / largo plazo, con interpretación contextual para la empresa.
      </p>

      <div className="toolbar">
        <label className="file-btn">
          Importar Excel
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={onArchivo} />
        </label>
        <button type="button" className="secondary" onClick={plantilla}>
          Descargar plantilla
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setDatos({ ...datosPorDefecto });
            setMontosBorrador({});
          }}
        >
          Restaurar ejemplo
        </button>
        <button type="button" onClick={exportXlsxDatos}>
          Exportar datos (.xlsx)
        </button>
        <button type="button" onClick={exportXlsxAnalisis}>
          Exportar análisis (.xlsx)
        </button>
        <button type="button" onClick={exportPdf}>
          Exportar informe (.pdf)
        </button>
      </div>
      {errorImport && <div className="error-msg">{errorImport}</div>}

      <div className="panel">
        <h2>Datos contables</h2>
        <p className="form-montos-hint">
          Montos con decimales: punto o coma como separador; si usás coma, los puntos se interpretan como miles
          (ej. 1.234,56).
        </p>
        <div className="form-identificacion">{CAMPOS_IDENTIFICACION.map(campoInput)}</div>
        <div className="form-tres-columnas">
          <div className="form-columna">
            <h3 className="form-columna-titulo">Activo</h3>
            <div className="form-columna-campos">{COLUMNA_ACTIVO.map(campoInput)}</div>
          </div>
          <div className="form-columna">
            <h3 className="form-columna-titulo">Pasivo</h3>
            <div className="form-columna-campos">{COLUMNA_PASIVO.map(campoInput)}</div>
          </div>
          <div className="form-columna">
            <h3 className="form-columna-titulo">Patrimonio neto y resultados</h3>
            <div className="form-columna-campos">{COLUMNA_PATRIMONIO_Y_RESULTADOS.map(campoInput)}</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>Ratios e interpretación</h2>
        {porGrupo.map(({ titulo, items }) => (
          <div key={titulo} className="section-block">
            <h2>{titulo}</h2>
            {items.length === 0 ? (
              <p className="subtitle" style={{ marginBottom: 0 }}>
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
        ))}
      </div>
    </>
  );
}
