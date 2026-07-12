import { Router } from "express";
import { randomUUID } from "node:crypto";
import { addFavorite, listFavorites, removeFavorite, updateFavoriteThreshold } from "../services/cache.js";
import { getCalendar } from "../services/priceService.js";

export const favoritesRouter = Router();

favoritesRouter.get("/", async (_req, res) => {
  const favorites = listFavorites();

  // Para cada favorito, devolve também o menor preço encontrado nos próximos 90 dias,
  // para que a tela de favoritos mostre algo útil sem uma segunda chamada por rota.
  const withLowestPrice = await Promise.all(
    favorites.map(async (favorite) => {
      const calendar = await getCalendar(favorite.origin, favorite.destination, 90);
      const lowest = calendar.reduce<number | null>(
        (min, day) => (min === null || day.price < min ? day.price : min),
        null
      );
      return { ...favorite, lowestPrice: lowest };
    })
  );

  res.json({ favorites: withLowestPrice });
});

favoritesRouter.post("/", (req, res) => {
  const { origin, destination, alertThreshold } = req.body ?? {};
  if (typeof origin !== "string" || typeof destination !== "string") {
    return res.status(400).json({ error: "origin e destination são obrigatórios" });
  }
  const favorite = {
    id: randomUUID(),
    origin: origin.toUpperCase(),
    destination: destination.toUpperCase(),
    alertThreshold: typeof alertThreshold === "number" ? alertThreshold : null,
    createdAt: new Date().toISOString(),
  };
  addFavorite(favorite);
  res.status(201).json({ favorite });
});

favoritesRouter.patch("/:id/alert", (req, res) => {
  const { threshold } = req.body ?? {};
  const value = threshold === null ? null : Number(threshold);
  if (value !== null && !Number.isFinite(value)) {
    return res.status(400).json({ error: "threshold deve ser um número ou null" });
  }
  const updated = updateFavoriteThreshold(req.params.id, value);
  if (!updated) return res.status(404).json({ error: "favorito não encontrado" });
  res.json({ ok: true });
});

favoritesRouter.delete("/:id", (req, res) => {
  const removed = removeFavorite(req.params.id);
  if (!removed) return res.status(404).json({ error: "favorito não encontrado" });
  res.status(204).send();
});
