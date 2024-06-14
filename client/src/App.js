// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FlowchartApp from './FlowchartApp';

const App = () => {
  const [isServerReady, setIsServerReady] = useState(false);

  useEffect(() => {
    const checkServer = async () => {
      try {
        //await axios.get('http://localhost:3000/api/ping');
        setIsServerReady(true);
      } catch (error) {
        setTimeout(checkServer, 1000);
      }
    };

    checkServer();
  }, []);

  return isServerReady ? <FlowchartApp /> : <div>Loading...</div>;
};

export default App;
