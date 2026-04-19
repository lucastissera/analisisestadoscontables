export type UsuarioRegistro = {
  usuario: string;
  clave: string;
};

/** Si no se puede leer `usuarios.json`, se usa esta lista (mismo contenido por defecto). */
export const USUARIOS_RESPALDO: UsuarioRegistro[] = [{ usuario: "admin", clave: "admin" }];

/** Marca legada; la validez real depende de `SESSION_INICIO_KEY` y el plazo. */
export const SESSION_STORAGE_KEY = "aec-sesion-v1";

/** Marca de tiempo (ms) del último login correcto. */
export const SESSION_INICIO_KEY = "aec-sesion-inicio";

/** Duración de la sesión tras el login (30 minutos). */
export const DURACION_SESION_MS = 30 * 60 * 1000;

export function sesionGuardadaValida(): boolean {
  try {
    const t = sessionStorage.getItem(SESSION_INICIO_KEY);
    if (!t) return false;
    const inicio = parseInt(t, 10);
    if (!Number.isFinite(inicio)) return false;
    return Date.now() - inicio < DURACION_SESION_MS;
  } catch {
    return false;
  }
}

export function persistirInicioSesion(): void {
  try {
    const ahora = String(Date.now());
    sessionStorage.setItem(SESSION_INICIO_KEY, ahora);
    sessionStorage.setItem(SESSION_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function limpiarSesion(): void {
  try {
    sessionStorage.removeItem(SESSION_INICIO_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export async function cargarUsuariosDesdeServidor(): Promise<UsuarioRegistro[]> {
  const base = import.meta.env.BASE_URL || "/";
  const url = `${base}usuarios.json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar usuarios.json");
  const data: unknown = await res.json();
  const raw =
    data !== null &&
    typeof data === "object" &&
    "usuarios" in data &&
    Array.isArray((data as { usuarios: unknown }).usuarios)
      ? (data as { usuarios: unknown[] }).usuarios
      : Array.isArray(data)
        ? data
        : null;
  if (!raw) throw new Error("Formato inválido");
  const out: UsuarioRegistro[] = [];
  for (const row of raw) {
    if (
      row !== null &&
      typeof row === "object" &&
      "usuario" in row &&
      "clave" in row &&
      typeof (row as UsuarioRegistro).usuario === "string" &&
      typeof (row as UsuarioRegistro).clave === "string"
    ) {
      out.push({ usuario: (row as UsuarioRegistro).usuario, clave: (row as UsuarioRegistro).clave });
    }
  }
  if (out.length === 0) throw new Error("Sin usuarios");
  return out;
}

export function validarCredenciales(
  usuario: string,
  clave: string,
  lista: UsuarioRegistro[]
): boolean {
  const u = usuario.trim();
  return lista.some((x) => x.usuario === u && x.clave === clave);
}
