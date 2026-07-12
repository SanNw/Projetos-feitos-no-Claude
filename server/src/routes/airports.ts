import { Router } from "express";
import { AIRPORTS, DEFAULT_ORIGIN, DEFAULT_DESTINATION } from "../data/airports.js";

export const airportsRouter = Router();

airportsRouter.get("/", (_req, res) => {
  res.json({ airports: AIRPORTS });
});

airportsRouter.get("/default-route", (_req, res) => {
  res.json({ origin: DEFAULT_ORIGIN, destination: DEFAULT_DESTINATION });
});
