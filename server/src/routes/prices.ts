import { Router } from "express";
import { getCalendar, getBestDays, getDayWithNeighbors, compareOrigins } from "../services/priceService.js";

export const pricesRouter = Router();

function parseDays(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 180);
}

pricesRouter.get("/calendar", async (req, res) => {
  const { origin, destination, days } = req.query;
  if (typeof origin !== "string" || typeof destination !== "string") {
    return res.status(400).json({ error: "origin e destination são obrigatórios" });
  }
  const calendar = await getCalendar(origin, destination, parseDays(days, 90));
  res.json({ origin, destination, calendar });
});

pricesRouter.get("/best", async (req, res) => {
  const { origin, destination, days, limit } = req.query;
  if (typeof origin !== "string" || typeof destination !== "string") {
    return res.status(400).json({ error: "origin e destination são obrigatórios" });
  }
  const bestDays = await getBestDays(origin, destination, parseDays(days, 90), Number(limit) || 10);
  res.json({ origin, destination, bestDays });
});

pricesRouter.get("/day", async (req, res) => {
  const { origin, destination, date } = req.query;
  if (typeof origin !== "string" || typeof destination !== "string" || typeof date !== "string") {
    return res.status(400).json({ error: "origin, destination e date são obrigatórios" });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "date deve estar no formato YYYY-MM-DD" });
  }
  const days = await getDayWithNeighbors(origin, destination, date);
  res.json({ origin, destination, date, days });
});

pricesRouter.get("/compare-origins", async (req, res) => {
  const { origins, destination, date } = req.query;
  if (typeof origins !== "string" || typeof destination !== "string" || typeof date !== "string") {
    return res.status(400).json({ error: "origins (separados por vírgula), destination e date são obrigatórios" });
  }
  const originList = origins.split(",").map((o) => o.trim().toUpperCase()).filter(Boolean);
  const comparison = await compareOrigins(originList, destination, date);
  res.json({ destination, date, comparison });
});
