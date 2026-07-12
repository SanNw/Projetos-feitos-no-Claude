import { Router } from "express";
import { checkFavoriteAlerts } from "../services/alertChecker.js";

export const alertsRouter = Router();

// Endpoint manual para forçar a verificação (o job periódico chama a mesma função em background).
alertsRouter.get("/check", async (_req, res) => {
  const triggered = await checkFavoriteAlerts();
  res.json({ triggered });
});
