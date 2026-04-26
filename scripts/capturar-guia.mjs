/**
 * Genera `public/guia/captura-*.png` con Playwright: preview de Vite, login, import de Excel
 * con `scripts/datos-demo-guia.mjs` y captura de paneles.
 *
 * Requisitos: `npm i`, `npm run build` (hace falta `dist/`), y Chromium (primera vez: `npx playwright install chromium`).
 * Un solo comando: `npm run build:con-guia` (build + capturas).
 */
import { execSync } from "node:child_process";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import XLSX from "xlsx-js-style";
import { chromium } from "playwright";
import { preview } from "vite";
import { CAMPOS_ORDEN, ETIQUETAS_EXCEL, demoActual, demoAnterior } from "./datos-demo-guia.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "public", "guia");

function buildXlsx(datos) {
  const filas = [["Concepto", "Valor"]];
  for (const k of CAMPOS_ORDEN) {
    const v = datos[k];
    const celda = v === null || v === undefined ? "" : v;
    filas.push([ETIQUETAS_EXCEL[k], celda]);
  }
  const ws = XLSX.utils.aoa_to_sheet(filas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Datos");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  mkdirSync(outDir, { recursive: true });
  if (!existsSync(path.join(root, "node_modules", "playwright"))) {
    console.error("Instalá dependencias: npm install");
    process.exit(1);
  }

  try {
    execSync("npx playwright install chromium", { stdio: "inherit", cwd: root, shell: true });
  } catch {
    /* puede fallar en offline; se intenta igual */
  }

  const tmp = path.join(os.tmpdir(), `guia-xlsx-${Date.now()}`);
  mkdirSync(tmp, { recursive: true });
  const path2025 = path.join(tmp, "demo-2025.xlsx");
  const path2024 = path.join(tmp, "demo-2024.xlsx");
  writeFileSync(path2025, buildXlsx(demoActual));
  writeFileSync(path2024, buildXlsx(demoAnterior));

  if (!existsSync(path.join(root, "dist", "index.html"))) {
    console.error("Falta la carpeta dist/. Ejecutá primero: npm run build  (o npm run build:con-guia para build + capturas).");
    process.exit(1);
  }

  let previewServer;
  let browser;
  try {
    previewServer = await preview({
      root,
      preview: { port: 4173, strictPort: false },
    });
    const urls = previewServer.resolvedUrls;
    const first = urls?.local?.[0] ?? urls?.network?.[0];
    if (!first) {
      throw new Error("Vite preview no expuso URL (revisá que dist/ exista).");
    }
    const base = first.replace(/\/$/, "");

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 2000 });
    const shotOpts = { animations: "disabled" };
    const baseUrl = base + "/";

    await page.goto(baseUrl, { waitUntil: "load", timeout: 60_000 });
    await page.getByLabel("Usuario", { exact: true }).fill("admin");
    await page.getByLabel("Contraseña", { exact: true }).fill("admin");
    await page.getByRole("button", { name: "Ingresar" }).click();
    await page
      .getByRole("heading", { name: "Análisis de estados contables" })
      .first()
      .waitFor({ state: "visible" });
    await delay(500);

    const fileImport = page.locator("input[type=file]");
    await fileImport.first().setInputFiles(path2025);
    const razon = page.getByLabel("Razón social", { exact: true });
    await razon.waitFor({ state: "visible", timeout: 25_000 });
    for (let i = 0; i < 50; i++) {
      const v = await razon.inputValue();
      if (v === "Demostración S.A.") break;
      await delay(200);
    }
    await delay(300);

    const panelDatos = page
      .locator("div.panel")
      .filter({ has: page.getByRole("heading", { name: "Datos contables", exact: true }) });
    await panelDatos.scrollIntoViewIfNeeded();
    await panelDatos.screenshot({ path: path.join(outDir, "captura-datos.png"), ...shotOpts });

    const panelRatios = page.locator("div.panel").filter({
      has: page.getByRole("heading", { name: /Ratios e interpretación/ }),
    });
    await page.locator(".ratio-bloque-details").first().click();
    await delay(400);
    await panelRatios.scrollIntoViewIfNeeded();
    await panelRatios.screenshot({ path: path.join(outDir, "captura-ratios.png"), ...shotOpts });

    await page.getByRole("button", { name: "Cargar ejercicio anterior" }).click();
    await delay(800);
    const allImports = page.locator("input[type=file]");
    await allImports.nth(0).setInputFiles(path2024);
    await allImports.nth(1).setInputFiles(path2025);
    await page
      .getByRole("heading", { name: /Datos contables — ejercicio anterior/ })
      .waitFor({ state: "visible", timeout: 20_000 });
    await delay(800);

    const panelComp = page.locator("div.panel-comparativo");
    await panelComp.scrollIntoViewIfNeeded();
    await page.setViewportSize({ width: 1440, height: 2200 });
    await delay(300);
    await panelComp.screenshot({ path: path.join(outDir, "captura-comparativo.png"), ...shotOpts });

    console.log("Capturas guardadas en public/guia/ (captura-datos, captura-ratios, captura-comparativo).");
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        /* ignore */
      }
    }
    if (previewServer) {
      try {
        await previewServer.close();
      } catch {
        /* ignore */
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
