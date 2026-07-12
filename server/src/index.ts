import express from "express";
import cors from "cors";
import { airportsRouter } from "./routes/airports.js";
import { pricesRouter } from "./routes/prices.js";
import { favoritesRouter } from "./routes/favorites.js";
import { alertsRouter } from "./routes/alerts.js";
import { pushTokensRouter } from "./routes/pushTokens.js";
import { checkFavoriteAlerts } from "./services/alertChecker.js";
import { DEFAULT_ORIGIN, DEFAULT_DESTINATION } from "./data/airports.js";
import { getCalendar } from "./services/priceService.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/airports", airportsRouter);
app.use("/api/prices", pricesRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/push-tokens", pushTokensRouter);

const PORT = Number(process.env.PORT) || 4000;
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h, alinhado ao TTL do cache

async function refreshJob() {
  try {
    // Mantém a rota padrão sempre "quente" e reavalia alertas das rotas favoritas.
    await getCalendar(DEFAULT_ORIGIN, DEFAULT_DESTINATION, 90);
    const triggered = await checkFavoriteAlerts();
    if (triggered.length > 0) {
      console.log(`[alerts] ${triggered.length} rota(s) abaixo do limite definido`, triggered);
    }
  } catch (err) {
    console.error("[refreshJob] falha ao atualizar cache/alertas", err);
  }
}

app.listen(PORT, () => {
  console.log(`Flight price monitor API rodando em http://localhost:${PORT}`);
  refreshJob();
  setInterval(refreshJob, REFRESH_INTERVAL_MS);
});
