import { FormEvent, useState } from "react";

const WA_NUMERO = "5493513132914";
const WA_MENSAJE =
  "Buen día! Quiero dar de alta mi usuario en el sistema de Análisis de Estados Contables";

type Props = {
  intentarLogin: (usuario: string, clave: string) => Promise<boolean>;
  onSesionIniciada: () => void;
};

export default function LoginScreen({ intentarLogin, onSesionIniciada }: Props) {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function abrirWhatsAppNuevoUsuario() {
    const url = `https://wa.me/${WA_NUMERO}?text=${encodeURIComponent(WA_MENSAJE)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const ok = await intentarLogin(usuario, clave);
      if (!ok) {
        setError("Usuario o contraseña incorrectos.");
        return;
      }
      onSesionIniciada();
    } finally {
      setEnviando(false);
    }
  }

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
              disabled={enviando}
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
              disabled={enviando}
            />
          </label>

          {error && <div className="error-msg login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={enviando}>
            {enviando ? "Verificando…" : "Ingresar"}
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
