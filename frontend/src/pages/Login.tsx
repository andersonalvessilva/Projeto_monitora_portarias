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
    <div className="login-screen-wrapper">
      <div style={{ width: '100%', maxWidth: '460px' }}>
        
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