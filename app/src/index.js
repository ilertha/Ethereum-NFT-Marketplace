import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";

import App from './App';
import Error from './Error';
import UpdatingDapp from './components/UpdatingDapp';

//? Updating dapp status
let STATUS = false;

//? Validation for wallet
let errorType = null;
const Validate = async () => {
  if (typeof window.ethereum !== "undefined" && window.ethereum.isMetaMask) {
    if (await window.ethereum.isConnected()) {
      return true;
    } else {
      errorType = "connection-error";
      return false;
    }
  } else {
    errorType = "wallet";
    return false;
  };
};

const root = ReactDOM.createRoot(document.getElementById('root'));

if (!STATUS) {
  if (Validate()) {
    root.render(
      <React.StrictMode>
        <BrowserRouter basename='Ethereum-NFT-Marketplace'>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
  } else {
    root.render(
      <React.StrictMode>
        <Error error={errorType}/>
      </React.StrictMode>
    );
  };
} else {
  root.render(
    <React.StrictMode>
      <UpdatingDapp />
    </React.StrictMode>
  );
};
