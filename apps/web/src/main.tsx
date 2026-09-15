import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";

const Application = window.location.pathname.startsWith("/sunleo")
  ? lazy(() => import("./sunleo/SunleoApp").then(module => ({ default: module.SunleoApp })))
  : lazy(() => import("./App").then(module => ({ default: module.App })));

createRoot(document.querySelector("#root") as HTMLElement).render(
  <StrictMode>
    <Suspense fallback={<p role="status">Загрузка…</p>}><Application /></Suspense>
  </StrictMode>
);
