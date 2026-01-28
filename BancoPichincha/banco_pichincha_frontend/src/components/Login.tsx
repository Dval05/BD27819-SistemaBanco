import { useState, type FormEvent } from 'react';
import { Lightbulb } from 'lucide-react';
import clienteService from '../services/clienteService';
import type { Cliente } from '../types';
import './Login.css';

interface LoginProps {
  onLogin: (cliente: Cliente) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Campos de login
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');

  // Campos de registro
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [nuevoUsuario, setNuevoUsuario] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [errorCedula, setErrorCedula] = useState('');

  // Función para validar cédula ecuatoriana
  const validarCedulaEcuatoriana = (cedula: string): boolean => {
    if (!cedula || cedula.length !== 10) return false;
    if (!/^\d{10}$/.test(cedula)) return false;

    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || (provincia > 24 && provincia !== 30)) return false;

    const tercerDigito = parseInt(cedula.charAt(2), 10);
    if (tercerDigito > 5) return false;

    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;

    for (let i = 0; i < 9; i++) {
      let valor = parseInt(cedula.charAt(i), 10) * coeficientes[i];
      if (valor > 9) valor -= 9;
      suma += valor;
    }

    const digitoVerificadorCalculado = (10 - (suma % 10)) % 10;
    const digitoVerificador = parseInt(cedula.charAt(9), 10);

    return digitoVerificadorCalculado === digitoVerificador;
  };

  const handleCedulaChange = (value: string) => {
    // Solo permitir números
    const soloNumeros = value.replace(/\D/g, '').substring(0, 10);
    setCedula(soloNumeros);

    if (soloNumeros.length === 10) {
      if (!validarCedulaEcuatoriana(soloNumeros)) {
        setErrorCedula('Cédula ecuatoriana no válida');
      } else {
        setErrorCedula('');
      }
    } else if (soloNumeros.length > 0) {
      setErrorCedula('');
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await clienteService.login(usuario, password);
      if (response.ok) {
        alert(response.msg);
        onLogin(response.data);
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { msg?: string } } };
      alert(axiosError.response?.data?.msg || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistro = async (e: FormEvent) => {
    e.preventDefault();

    // Validar cédula
    if (!validarCedulaEcuatoriana(cedula)) {
      alert('La cédula ecuatoriana no es válida');
      return;
    }

    // Validar usuario
    if (nuevoUsuario.length < 4) {
      alert('El usuario debe tener al menos 4 caracteres');
      return;
    }

    // Validar contraseña
    if (nuevaPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Validar que las contraseñas coincidan
    if (nuevaPassword !== confirmarPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const response = await clienteService.registro({
        nombre,
        cedula,
        email,
        telefono,
        usuario: nuevoUsuario,
        password: nuevaPassword,
      });
      if (response.ok) {
        alert(response.msg);
        // Cambiar a login después de registrarse
        setIsLogin(true);
        setUsuario(nuevoUsuario);
        setPassword('');
        // Limpiar campos de registro
        setNombre('');
        setCedula('');
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
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <img src="/Banco-Pichincha.png" alt="Banco Pichincha" />
          </div>
          <h1>Banco Pichincha</h1>
          <p>Bienvenido a tu Banca Web</p>
        </div>

        <div className="login-tabs">
          <button
            className={`tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Iniciar Sesión
          </button>
          <button
            className={`tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Registrarse
          </button>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Usuario</label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Ingresa tu usuario"
                required
              />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
              />
            </div>
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegistro} className="login-form">
            <div className="form-group">
              <label>Nombre Completo *</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>
            <div className="form-group">
              <label>Cédula Ecuatoriana *</label>
              <input
                type="text"
                value={cedula}
                onChange={(e) => handleCedulaChange(e.target.value)}
                placeholder="Ej: 1712345678"
                maxLength={10}
                required
                className={errorCedula ? 'input-error' : ''}
              />
              {errorCedula && (
                <span className="error-message">{errorCedula}</span>
              )}
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ej: juan@email.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 0991234567"
              />
            </div>
            <div className="form-group">
              <label>Usuario * (mínimo 4 caracteres)</label>
              <input
                type="text"
                value={nuevoUsuario}
                onChange={(e) =>
                  setNuevoUsuario(
                    e.target.value.toLowerCase().replace(/\s/g, ''),
                  )
                }
                placeholder="Ej: juanperez"
                minLength={4}
                required
              />
            </div>
            <div className="form-group">
              <label>Contraseña * (mínimo 6 caracteres)</label>
              <input
                type="password"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                minLength={6}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirmar Contraseña *</label>
              <input
                type="password"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                placeholder="Confirma tu contraseña"
                required
              />
            </div>
            <button
              type="submit"
              className="btn-login btn-registro"
              disabled={loading || !!errorCedula}
            >
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </form>
        )}

        <div className="login-footer">
          <p>
            <Lightbulb size={16} /> Abre múltiples ventanas del navegador para
            simular diferentes usuarios
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
