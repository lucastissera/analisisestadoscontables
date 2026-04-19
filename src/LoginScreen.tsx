import { FormEvent, useState } from "react";
import type { UsuarioRegistro } from "./auth/usuarios";
import { validarCredenciales } from "./auth/usuarios";

const WA_NUMERO = "5493513132914";
const WA_MENSAJE =
  "Buen día! Quiero dar de alta mi usuario en el sistema de Análisis de Estados Contables";

type Props = {
  usuarios: UsuarioRegistro[] | null;
  onSesionIniciada: () => void;
};

export default function LoginScreen({ usuarios, onSesionIniciada }: Props) {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);

  function abrirWhatsAppNuevoUsuario() {
    const url = `https://wa.me/${WA_NUMERO}?text=${encodeURIComponent(WA_MENSAJE)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!usuarios || usuarios.length === 0) {
      setError("No hay usuarios cargados. Revisá el archivo usuarios.json en la carpeta public.");
      return;
    }
    if (!validarCredenciales(usuario, clave, usuarios)) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }
    onSesionIniciada();
  }

  const cargando = usuarios === null;

  return (
    <div className="login-screen">
      <div className="login-panel">
        <h1 className="login-titulo">Análisis de estados contables</h1>
        <p className="login-subtitulo">Iniciá sesión para continuar</p>

        <form className="login-form" onSubmit={onSubmit}>
          <label className="field">
            <span className="name">Usuario</span>
            <input
              type="text"
              name="usuario"
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              disabled={cargando}
            />
          </label>
          <label className="field">
            <span className="name">Contraseña</span>
            <input
              type="password"
              name="clave"
              autoComplete="current-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              disabled={cargando}
            />
          </label>

          {error && <div className="error-msg login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={cargando}>
            {cargando ? "Cargando…" : "Ingresar"}
          </button>
        </form>

        <p className="login-nuevo">
          <button type="button" className="login-link-wa" onClick={abrirWhatsAppNuevoUsuario}>
            Nuevo usuario
          </button>
          <span className="login-nuevo-hint"> (se abre WhatsApp Web para solicitar el alta)</span>
        </p>
      </div>
    </div>
  );
}
