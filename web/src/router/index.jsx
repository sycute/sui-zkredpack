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
            //   token: {
            //     // Seed Token，影响范围大
            //     colorPrimary: '#00b96b',
            //     borderRadius: 2,
            //     // 派生变量，影响范围小
            //     colorBgContainer: '#f6ffed',
            //   },
            //   components: {
            //     Form:{
            //         labelColor:'#ffffff'
            //     },
            //   },
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
