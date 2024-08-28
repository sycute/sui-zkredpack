import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "../App";
import { ConfigProvider } from "antd";
import SendRedPack from "../components/SendRedPack.jsx";
import Claim from "../components/ClaimRedPack.jsx";


export function Router() {
  return (
    <BrowserRouter>
      <ConfigProvider
        theme={
          {
           
          }
        }
      >
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<SendRedPack />} />
            <Route path="claim" element={<Claim />} />
          </Route>
        </Routes>
      </ConfigProvider>
    </BrowserRouter>
  );
}
