import { Canvas } from "@react-three/fiber";
import { useState, useEffect, useMemo } from "react";
import { RunnerScene } from "./RunnerScene";
import "./index.scss";

export default function App() {
  const [gameOver, setGameOver] = useState(false);
  const [restartToken, setRestartToken] = useState(0);
  const tg = useMemo(() => (window as any)?.Telegram?.WebApp, []);

  const handleRestart = () => {
    setGameOver(false);
    setRestartToken((t) => t + 1);
  };

  const handleGetData = () => {
    console.log(tg.initData);
  };

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    if (!tg) return;

    console.log("tg:", tg);

    if (!tg) {
      console.log("no tg)");
      return;
    }

    console.log("id:", user?.id);
    console.log("first_name:", user?.first_name);
    console.log("last_name:", user?.last_name);
    console.log("username:", user?.username);

    console.log("start_param:", tg.initData);

    tg.ready?.();
    tg.disableVerticalSwipes?.();
    tg.expand?.();
  }, []);

  return (
    <div className="app">
      <div className="app-container">
        <div className="hud">
          {gameOver ? (
            <div className="over">
              <p className="over__text">Game Over</p>
              <button className="over__btn" onClick={handleRestart}>
                RESTART
              </button>
              <button className="over__btn" onClick={handleGetData}>
                GET DATA
              </button>
            </div>
          ) : (
            <div className="game"></div>
          )}
        </div>
        <Canvas
          style={{ touchAction: "none" }}
          camera={{ position: [0, 4, -7], fov: 55 }}
          dpr={[1, 1.5]}
          className="can"
        >
          <RunnerScene
            key={restartToken}
            onGameOver={() => setGameOver(true)}
          />
        </Canvas>
      </div>
    </div>
  );
}
