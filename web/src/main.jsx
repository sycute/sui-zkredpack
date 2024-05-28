import React from "react";
import ReactDOM from "react-dom/client";
// import "@radix-ui/themes/styles.css";
import "@mysten/dapp-kit/dist/index.css";
import { Router } from "./router/index.jsx";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { networkConfig } from "./networkConfig.js";
import "./index.css";
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>    
          <Router></Router>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
    {/* <ConnectButton/> */}
  </React.StrictMode>
);
