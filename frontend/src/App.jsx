import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import "./App.css";
import Path from "./routes/Path";
import { useAuthStore } from "./store/useAuthStore";
function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, []);
  return (
    <>
      <div>
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            style: {
              fontSize: "18px",
              padding: "16px",
              minWidth: "300px",
            },
          }}
        />
      </div>
      <Path />
    </>
  );
}

export default App;
