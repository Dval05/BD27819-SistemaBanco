import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import type { Cliente } from './types';
import './App.css';

function App() {
  const [cliente, setCliente] = useState<Cliente | null>(null);

  // Verificar si hay un cliente guardado en sessionStorage
  useEffect(() => {
    const clienteGuardado = sessionStorage.getItem('cliente');
    if (clienteGuardado) {
      setCliente(JSON.parse(clienteGuardado));
    }
  }, []);

  // Manejar login exitoso
  const handleLogin = (clienteData: Cliente) => {
    setCliente(clienteData);
    sessionStorage.setItem('cliente', JSON.stringify(clienteData));
  };

  // Manejar logout
  const handleLogout = () => {
    setCliente(null);
    sessionStorage.removeItem('cliente');
  };

  // Manejar actualización de cliente
  const handleClienteUpdate = (clienteActualizado: Cliente) => {
    setCliente(clienteActualizado);
    sessionStorage.setItem('cliente', JSON.stringify(clienteActualizado));
  };

  

  return (
    <div className="App">
      {cliente ? (
        <Dashboard 
          cliente={cliente} 
          onLogout={handleLogout} 
          onClienteUpdate={handleClienteUpdate}
        />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
