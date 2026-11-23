import { getCurrentWindow } from "@tauri-apps/api/window";
import { useState } from "react";
import { useView } from "./api";
import { Account } from "./pages/Account";
import { Home } from "./pages/Home";
import { Mini } from "./pages/Mini";
import { Restrictions } from "./pages/Restrictions";
import { Settings } from "./pages/Settings";
import { Start } from "./pages/Start";
import { ToastHost } from "./pages/ToastHost";
import type { Page } from "./types";

export default function App() {
  // ミニとトーストは別ウィンドウで、同じ画面のコードをウィンドウのラベルで切り替える。
  const label = getCurrentWindow().label;
  if (label === "mini") return <Mini />;
  if (label === "toast") return <ToastHost />;
  return <Main />;
}

function Main() {
  const view = useView();
  const [page, setPage] = useState<Page>("home");
  const home = () => setPage("home");

  if (!view) return null;
  switch (page) {
    case "account":
      return <Account onBack={home} />;
    case "start":
      return <Start onBack={home} onStarted={home} />;
    case "settings":
      return <Settings onBack={home} />;
    case "restrictions":
      return <Restrictions onBack={home} />;
    default:
      return <Home view={view} onNavigate={setPage} />;
  }
}
