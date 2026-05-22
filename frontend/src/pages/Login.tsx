import React, { useState } from "react";
import { User, Lock, Eye, EyeOff, ShieldAlert } from "lucide-react";
import "./Login.css";

interface LoginProps {
  onLoginSuccess: (username: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validação de segurança básica no Front-end (Evita requisições desnecessárias)
    if (!username.trim() || !password.trim()) {
      setError("Por favor, preencha as credenciais de acesso.");
      return;
    }

    setError("");
    setIsLoading(true);

    // Simulando um delay de rede para manter a experiência visual (Loading)
    setTimeout(() => {
      const sanitizedUser = username.toLowerCase().trim();

      // 🔐 VALIDAÇÃO MOCK: Permite o login direto enquanto o endpoint /auth não existe no back-end
      if (sanitizedUser === "admin" && password === "sesa@2026") {
        
        // Salva um token fictício para passar pelos guards de rotas da aplicação
        localStorage.setItem("@MonitoraPortarias:token", "mocked-jwt-token-local");

        // Libera a renderização do Dashboard principal
        onLoginSuccess(sanitizedUser);
        setIsLoading(false);
      } else {
        setError("Usuário ou senha incorretos. Tente novamente.");
        setIsLoading(false);
      }
    }, 800); 
  };

  return (
    <div className="login-screen-wrapper" style={{ position: "relative", overflow: "hidden" }}>
      
      {/* FUNDO: Linhas de dados, malha e nós de monitoramento */}
      <div 
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.15,
          pointerEvents: "none",
          zIndex: 0,
          mixBlendMode: "overlay"
        }}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="login-grid" width="45" height="45" patternUnits="userSpaceOnUse">
              <path d="M 45 0 L 0 0 0 45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-grid)" />
          <path d="M-50,250 Q150,120 450,380 T1000,180 T1600,450" fill="none" stroke="#22c55e" strokeWidth="1.5" />
          <path d="M0,550 Q350,400 750,680 T1500,250" fill="none" stroke="#22c55e" strokeWidth="1" />
          <path d="M100,150 Q500,320 850,150 T1700,350" fill="none" stroke="#16a34a" strokeWidth="0.8" opacity="0.5" />
          <circle cx="450" cy="380" r="4.5" fill="#4ade80" />
          <circle cx="1000" cy="180" r="3.5" fill="#4ade80" />
          <circle cx="750" cy="680" r="4" fill="#4ade80" />
          <circle cx="350" cy="400" r="3" fill="#22c55e" />
        </svg>
      </div>

      {/* CONTEÚDO PRINCIPAL DO LOGIN */}
      <div style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 10 }}>
        
        {/* LOGO OFICIAL DO GOVERNO / SESA */}
        <div className="login-external-logo">
          <img 
            src="src/assets/logo.png" 
            alt="Secretaria da Saúde do Ceará" 
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* CONTAINER DO FORMULÁRIO */}
        <div className="login-card-container">
          
          <div className="login-header-group">
            <h2>SESA <span>• Autenticação</span></h2>
            <p>Painel de Monitoramento de Portarias</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                color: '#991b1b',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '20px',
                fontWeight: 500,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <ShieldAlert size={20} style={{ color: '#dc2626', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* CAMPO DO USUÁRIO */}
            <div className="login-form-field">
              <label htmlFor="username">Usuário</label>
              <div className="login-input-icon-wrapper">
                <User className="field-icon" size={18} />
                <input
                  id="username"
                  type="text"
                  placeholder="Digite seu usuário (ex: admin)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* CAMPO DA SENHA */}
            <div className="login-form-field">
              <label htmlFor="password">Senha</label>
              <div className="login-input-icon-wrapper">
                <Lock className="field-icon" size={18} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="btn-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* SESSÃO CONECTADA */}
            <label className="login-remember-me-row">
              <input type="checkbox" id="remember" disabled={isLoading} />
              <span>Manter-me conectado neste computador</span>
            </label>

            {/* SUBMIT COM COORDENAÇÃO DE ESTADO (LOADING) */}
            <button 
              type="submit" 
              className="btn-submit-auth" 
              disabled={isLoading}
              style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              {isLoading ? "Validando credenciais de acesso..." : "Entrar no Sistema"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}