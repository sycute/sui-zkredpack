import { ConnectButton } from "@mysten/dapp-kit";
import { Outlet } from "react-router-dom";
import { Flex } from "antd";
import "./App.css";
// import { Link } from "react-router-dom";
function App() {
  return (
    <div>
      <Flex style={{ width: "100%" }} justify="center">
        <div style={{ fontSize: 24, fontWeight: 900 }}> Sui ZkRedPack</div>
      </Flex>
      <Flex style={{ width: "100%" }} justify="flex-end">
        {" "}
        <ConnectButton className="connectBtn" />{" "}
      </Flex>

      <br />
      <Flex style={{ width: "100%" }} justify="center">
        <Outlet />
      </Flex>
    </div>
  );
}

export default App;
