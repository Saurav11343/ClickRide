import { useCallback, useEffect, useRef, useState } from "react";
import { Toaster } from "react-hot-toast";
import "./App.css";
import Path from "./routes/Path";
import { useAuthStore } from "./store/useAuthStore";
import { axiosInstance } from "./lib/axios";
import ServerWakeup from "./component/ServerWakeup/ServerWakeup";

const MAX_WAKE_ATTEMPTS = 8;

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const [serverStatus, setServerStatus] = useState("connecting");
  const [attempt, setAttempt] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const runId = useRef(0);

  const connectToServer = useCallback(async () => {
    const currentRun = ++runId.current;
    setIsReady(false);
    setServerStatus("connecting");

    for (let currentAttempt = 1; currentAttempt <= MAX_WAKE_ATTEMPTS; currentAttempt += 1) {
      if (currentRun !== runId.current) return;
      setAttempt(currentAttempt);
      if (currentAttempt > 1) setServerStatus("retrying");

      try {
        await axiosInstance.get("/ready", { timeout: 15000 });
        if (currentRun !== runId.current) return;
        await checkAuth();
        setIsReady(true);
        return;
      } catch {
        if (currentAttempt < MAX_WAKE_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, Math.min(2000 * currentAttempt, 8000)));
        }
      }
    }

    if (currentRun === runId.current) setServerStatus("error");
  }, [checkAuth]);

  useEffect(() => {
    connectToServer();
    return () => { runId.current += 1; };
  }, [connectToServer]);

  if (!isReady) {
    return <ServerWakeup status={serverStatus} attempt={attempt} onRetry={connectToServer} />;
  }

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
