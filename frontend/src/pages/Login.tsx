import React, { useState } from "react";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import "./Login.css";

interface LoginProps {
  onLoginSuccess: (username: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError("Por favor, preencha as credenciais de acesso.");
      return;
    }

    setError("");
    // Autentica passando o nome digitado para compor o cabeçalho
    onLoginSuccess(username);
  };

  return (
    <div className="login-screen-wrapper" style={{ position: "relative", overflow: "hidden" }}>
      
      {/* NOVO FUNDO: Linhas de dados, malha e nós de monitoramento */}
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
          {/* Malha quadriculada de fundo */}
          <rect width="100%" height="100%" fill="url(#login-grid)" />
          
          {/* Gráficos de linhas/ondas simulando fluxo de dados */}
          <path d="M-50,250 Q150,120 450,380 T1000,180 T1600,450" fill="none" stroke="#22c55e" strokeWidth="1.5" />
          <path d="M0,550 Q350,400 750,680 T1500,250" fill="none" stroke="#22c55e" strokeWidth="1" />
          <path d="M100,150 Q500,320 850,150 T1700,350" fill="none" stroke="#16a34a" strokeWidth="0.8" opacity="0.5" />
          
          {/* Nós conectados do monitoramento (Pontos nas curvas) */}
          <circle cx="450" cy="380" r="4.5" fill="#4ade80" />
          <circle cx="1000" cy="180" r="3.5" fill="#4ade80" />
          <circle cx="750" cy="680" r="4" fill="#4ade80" />
          <circle cx="350" cy="400" r="3" fill="#22c55e" />
        </svg>
      </div>

      {/* CONTEÚDO PRINCIPAL DO LOGIN (Z-INDEX GARANTE QUE FICA POR CIMA DO FUNDO) */}
      <div style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 10 }}>
        
        {/* LOGO OFICIAL DO GOVERNO / SESA POSICIONADA ACIMA DO CARD */}
        <div className="login-external-logo">
          <img 
            src="src/assets/logo.png" 
            alt="Secretaria da Saúde do Ceará" 
            onError={(e) => {
              // Fallback se o caminho da imagem quebrar
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* CONTAINER DO FORMULÁRIO BRANCO */}
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
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '20px',
                fontWeight: 500,
                textAlign: 'center'
              }}>
                {error}
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
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                />
                <button
                  type="button"
                  className="btn-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* SESSÃO CONECTADA */}
            <label className="login-remember-me-row">
              <input type="checkbox" id="remember" />
              <span>Manter-me conectado neste computador</span>
            </label>

            {/* SUBMIT */}
            <button type="submit" className="btn-submit-auth">
              Entrar no Sistema
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}