import type { Request, Response } from "express";
import { sessionNotImplemented } from "../services/sessionService.js";

export function createSession(_request: Request, response: Response) {
  response.status(501).json(sessionNotImplemented());
}

export function getSession(_request: Request, response: Response) {
  response.status(501).json(sessionNotImplemented());
}

