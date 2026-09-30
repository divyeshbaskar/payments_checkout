import { Request, Response } from "express";
import { getAllProducts } from "../catalog/products.js";

export function getProductsHandler(_req: Request, res: Response): void {
  const products = getAllProducts();
  res.json({ products });
}
