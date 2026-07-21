"use client";

import React, { useState, useEffect, useRef } from "react";
import { WifiOff, Gamepad2, X, RefreshCw, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

export default function OfflineGameModal() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(true);
  const [showGame, setShowGame] = useState(false);

  // Snake game state
  const [snake, setSnake] = useState([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
  ]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [dir, setDir] = useState({ x: 0, y: -1 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      const savedHigh = localStorage.getItem("easymess_snake_highscore");
      if (savedHigh) setHighScore(parseInt(savedHigh, 10));

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Game loop
  useEffect(() => {
    if (!showGame || !gameStarted || gameOver) return;

    const interval = setInterval(() => {
      setSnake((prevSnake) => {
        const head = {
          x: prevSnake[0].x + dir.x,
          y: prevSnake[0].y + dir.y,
        };

        // Wall collision (20x20 grid)
        if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20) {
          setGameOver(true);
          return prevSnake;
        }

        // Self collision
        for (let i = 0; i < prevSnake.length; i++) {
          if (prevSnake[i].x === head.x && prevSnake[i].y === head.y) {
            setGameOver(true);
            return prevSnake;
          }
        }

        const newSnake = [head, ...prevSnake];

        // Food collision
        if (head.x === food.x && head.y === food.y) {
          setScore((s) => {
            const nextScore = s + 10;
            if (nextScore > highScore) {
              setHighScore(nextScore);
              localStorage.setItem("easymess_snake_highscore", nextScore.toString());
            }
            return nextScore;
          });
          // Generate new food
          setFood({
            x: Math.floor(Math.random() * 20),
            y: Math.floor(Math.random() * 20),
          });
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [showGame, gameStarted, gameOver, dir, food, highScore]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showGame) return;
      if (e.key === "ArrowUp" && dir.y === 0) { setDir({ x: 0, y: -1 }); setGameStarted(true); }
      if (e.key === "ArrowDown" && dir.y === 0) { setDir({ x: 0, y: 1 }); setGameStarted(true); }
      if (e.key === "ArrowLeft" && dir.x === 0) { setDir({ x: -1, y: 0 }); setGameStarted(true); }
      if (e.key === "ArrowRight" && dir.x === 0) { setDir({ x: 1, y: 0 }); setGameStarted(true); }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showGame, dir]);

  const restartGame = () => {
    setSnake([
      { x: 10, y: 10 },
      { x: 10, y: 11 },
    ]);
    setFood({ x: 5, y: 5 });
    setDir({ x: 0, y: -1 });
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  if (isOnline && !showGame) return null;

  return (
    <>
      {/* Offline Top Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[9998] bg-amber-600 text-white px-4 py-2 text-xs font-semibold shadow-md flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-200 animate-pulse" />
            <span>{t("offlineNotice")}</span>
          </div>

          <button
            onClick={() => setShowGame(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-white text-amber-900 font-bold rounded-lg hover:bg-amber-100 transition shadow-sm cursor-pointer"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-amber-600" />
            {t("playMiniGame")}
          </button>
        </div>
      )}

      {/* Mini Game Modal */}
      {showGame && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 w-full max-w-sm flex flex-col items-center gap-4 shadow-2xl">
            {/* Header */}
            <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-sm text-white">{t("offlineGameTitle")}</h3>
              </div>
              <button
                onClick={() => setShowGame(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score display */}
            <div className="flex items-center justify-between w-full text-xs px-2">
              <span className="text-slate-400 font-medium">
                {t("score")}: <strong className="text-orange-400 text-sm font-mono">{score}</strong>
              </span>
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                {t("highScore")}: <strong className="text-amber-400 text-sm font-mono">{highScore}</strong>
              </span>
            </div>

            {/* Canvas grid (20x20 cells) */}
            <div className="relative w-64 h-64 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden grid grid-cols-20 grid-rows-20 p-1">
              {/* Render food */}
              <div
                className="absolute w-3 h-3 bg-red-500 rounded-full shadow-sm animate-pulse"
                style={{
                  left: `${food.x * 12.8}px`,
                  top: `${food.y * 12.8}px`,
                }}
              />
              {/* Render snake */}
              {snake.map((segment, idx) => (
                <div
                  key={idx}
                  className={`absolute w-3 h-3 rounded-sm ${
                    idx === 0 ? "bg-orange-500" : "bg-orange-400/80"
                  }`}
                  style={{
                    left: `${segment.x * 12.8}px`,
                    top: `${segment.y * 12.8}px`,
                  }}
                />
              ))}

              {/* Start overlay */}
              {!gameStarted && !gameOver && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center p-4">
                  <p className="text-xs text-slate-300 font-semibold mb-3">
                    Use Arrow keys or touch controls below to start
                  </p>
                  <button
                    onClick={() => setGameStarted(true)}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                  >
                    Start Game
                  </button>
                </div>
              )}

              {/* Game Over overlay */}
              {gameOver && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center text-center p-4">
                  <p className="text-sm font-extrabold text-red-400 mb-1">Game Over!</p>
                  <p className="text-xs text-slate-400 mb-3">Final Score: {score}</p>
                  <button
                    onClick={restartGame}
                    className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Play Again
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Touch Controls */}
            <div className="flex flex-col items-center gap-1 mt-1">
              <button
                onClick={() => { if (dir.y === 0) { setDir({ x: 0, y: -1 }); setGameStarted(true); } }}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-white shadow cursor-pointer active:scale-95 transition"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => { if (dir.x === 0) { setDir({ x: -1, y: 0 }); setGameStarted(true); } }}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-white shadow cursor-pointer active:scale-95 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { if (dir.x === 0) { setDir({ x: 1, y: 0 }); setGameStarted(true); } }}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-white shadow cursor-pointer active:scale-95 transition"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => { if (dir.y === 0) { setDir({ x: 0, y: 1 }); setGameStarted(true); } }}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-white shadow cursor-pointer active:scale-95 transition"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
