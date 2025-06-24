import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Home from './pages/Home';
import Header from './components/layout/Header';

function App() {
  const [idToken, setIdToken] = useState(null);

  return (
    <Router>
      <div>
        <Header idToken={idToken} setIdToken={setIdToken} />
        <Home idToken={idToken} setIdToken={setIdToken} />
      </div>
    </Router>
  );
}

export default App;
