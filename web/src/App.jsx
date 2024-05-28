import { Outlet } from "react-router-dom";

// import { Link } from "react-router-dom";
function App() {
  return (
    <div className="flex flex-col h-screen space-y-24">
      <div className="flex flex-row self-center mt-32 text-5xl text-white">
        Sui Zk <p className="text-red-500">Red</p>Pack
      </div>
      <Outlet />
    </div>
  );
}
export default App;
