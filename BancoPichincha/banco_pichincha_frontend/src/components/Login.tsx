import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import clienteService from '../services/clienteService';
import type { Cliente } from '../types';
import './Login.css';

interface LoginProps {
  onLogin: (cliente: Cliente) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');

  const [cedula, setCedula] = useState('');
  const [primerNombre, setPrimerNombre] = useState('');
  const [segundoNombre, setSegundoNombre] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [nuevoUsuario, setNuevoUsuario] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await clienteService.login(usuario, password);
      if (response.ok) {
        onLogin(response.data);
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { msg?: string } } };
      alert(axiosError.response?.data?.msg || 'Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  // Validar cédula ecuatoriana
  const validarCedulaEcuatoriana = (cedula: string): boolean => {
    if (cedula.length !== 10) return false;
    if (!/^\d+$/.test(cedula)) return false;
    
    const provincia = parseInt(cedula.substring(0, 2));
    if (provincia < 1 || provincia > 24) return false;
    
    const tercerDigito = parseInt(cedula[2]);
    if (tercerDigito > 5) return false;
    
    // Algoritmo de validación módulo 10
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    
    for (let i = 0; i < 9; i++) {
      let valor = parseInt(cedula[i]) * coeficientes[i];
      if (valor > 9) valor -= 9;
      suma += valor;
    }
    
    const digitoVerificador = (10 - (suma % 10)) % 10;
    return digitoVerificador === parseInt(cedula[9]);
  };

  const handleRegistro = async (e: FormEvent) => {
    e.preventDefault();

    if (!cedula || cedula.length !== 10) {
      alert('La cédula debe tener 10 dígitos');
      return;
    }

    if (!validarCedulaEcuatoriana(cedula)) {
      alert('La cédula ingresada no es válida');
      return;
    }

    if (nuevoUsuario.length < 4) {
      alert('El usuario debe tener al menos 4 caracteres');
      return;
    }

    if (nuevaPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const response = await clienteService.registro({
        cedula,
        primerNombre,
        segundoNombre,
        primerApellido,
        segundoApellido,
        email,
        telefono: telefono ? parseInt(telefono) : undefined,
        usuario: nuevoUsuario,
        password: nuevaPassword,
      });
      if (response.ok) {
        alert('Registro exitoso. Ahora puedes iniciar sesión.');
        setIsLogin(true);
        setUsuario(nuevoUsuario);
        setCedula('');
        setPrimerNombre('');
        setSegundoNombre('');
        setPrimerApellido('');
        setSegundoApellido('');
        setEmail('');
        setTelefono('');
        setNuevoUsuario('');
        setNuevaPassword('');
        setConfirmarPassword('');
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { msg?: string } } };
      alert(axiosError.response?.data?.msg || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-content">
          <div className="brand">
            <div className="brand-icon">
              <svg viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="4" fill="#FFD100"/>
                <path d="M10 30V10h8c4.5 0 8 3 8 7s-3.5 7-8 7h-4v6h-4z" fill="#00377B"/>
              </svg>
            </div>
            <span className="brand-text">BANCO<br/>PICHINCHA</span>
          </div>
          
          <h1>Verifica en tu navegador que estás en Banca Web.</h1>
          
          <div className="url-bar">
            <Lock size={16} />
            <span>https://bancaweb.pichincha.com/pichincha/login</span>
          </div>
          
          <div className="login-illustration">
            <svg viewBox="0 0 300 250" fill="none">
              <ellipse cx="150" cy="220" rx="120" ry="20" fill="#E8F4FD"/>
              <path d="M100 200 L100 100 Q150 60 200 100 L200 200" fill="#00377B"/>
              <circle cx="150" cy="90" r="40" fill="#FFE5B4"/>
              <circle cx="140" cy="85" r="5" fill="#333"/>
              <circle cx="160" cy="85" r="5" fill="#333"/>
              <path d="M145 100 Q150 105 155 100" stroke="#333" strokeWidth="2" fill="none"/>
              <ellipse cx="150" cy="55" rx="35" ry="20" fill="#1a1a2e"/>
              <circle cx="175" cy="70" r="12" fill="#FFD100" stroke="#333" strokeWidth="2"/>
            </svg>
          </div>
          
          <div className="tips">
            <div className="tip">
              <span className="tip-number">01.</span>
              <span>Cuida tu usuario y contraseña</span>
            </div>
            <div className="tip">
              <span className="tip-number">02.</span>
              <span>Antes de ingresar la Clave Digital verifica que los 4 últimos dígitos de tu cédula sean correctos.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>{isLogin ? 'Bienvenido a tu Banca Web' : 'Regístrate'}</h2>

          {isLogin ? (
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label>Usuario</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    required
                  />
                </div>
                <a href="#" className="forgot-link">¿Olvidaste tu usuario?</a>
              </div>

              <div className="form-group">
                <label>Contraseña</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <a href="#" className="forgot-link">¿Olvidaste tu contraseña?</a>
              </div>

              <button type="submit" className="btn-ingresar" disabled={loading}>
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>

              <div className="login-options">
                <div className="option-card">
                  <Lock size={24} />
                  <span>¿Cuenta bloqueada?</span>
                  <small>Desbloquéala aquí</small>
                </div>
                <div className="option-card" onClick={() => setIsLogin(false)}>
                  <User size={24} />
                  <span>¿Usuario nuevo?</span>
                  <small>Regístrate ahora</small>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegistro} className="login-form registro-form">
              <div className="form-group">
                <label>Cédula de Identidad *</label>
                <input
                  type="text"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
                  maxLength={10}
                  placeholder="Ej: 1712345678"
                  required
                />
                <small className="form-hint">Documento de identidad único (10 dígitos)</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Primer Nombre *</label>
                  <input
                    type="text"
                    value={primerNombre}
                    onChange={(e) => setPrimerNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Segundo Nombre</label>
                  <input
                    type="text"
                    value={segundoNombre}
                    onChange={(e) => setSegundoNombre(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Primer Apellido *</label>
                  <input
                    type="text"
                    value={primerApellido}
                    onChange={(e) => setPrimerApellido(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Segundo Apellido</label>
                  <input
                    type="text"
                    value={segundoApellido}
                    onChange={(e) => setSegundoApellido(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))}
                  maxLength={10}
                />
              </div>

              <div className="form-group">
                <label>Usuario * (mínimo 4 caracteres)</label>
                <input
                  type="text"
                  value={nuevoUsuario}
                  onChange={(e) => setNuevoUsuario(e.target.value.replace(/\s/g, ''))}
                  minLength={4}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contraseña *</label>
                  <input
                    type="password"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirmar *</label>
                  <input
                    type="password"
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-ingresar" disabled={loading}>
                {loading ? 'Registrando...' : 'Crear Cuenta'}
              </button>

              <button type="button" className="btn-back" onClick={() => setIsLogin(true)}>
                Volver al inicio de sesión
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
