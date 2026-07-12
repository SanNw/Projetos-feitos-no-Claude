import { Router } from "express";
import { addPushToken, removePushToken } from "../services/cache.js";

export const pushTokensRouter = Router();

pushTokensRouter.post("/", (req, res) => {
  const { token } = req.body ?? {};
  if (typeof token !== "string" || !/^Expo(nent)?PushToken/.test(token)) {
    return res.status(400).json({ error: "token inválido (esperado um Expo push token)" });
  }
  addPushToken(token);
  res.status(201).json({ ok: true });
});

pushTokensRouter.delete("/:token", (req, res) => {
  const removed = removePushToken(req.params.token);
  if (!removed) return res.status(404).json({ error: "token não encontrado" });
  res.status(204).send();
});
