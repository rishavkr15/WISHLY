import express from "express";
import {
  getFeaturedProducts,
  getProductBySlug,
  getProducts
} from "../controllers/productController.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/featured", getFeaturedProducts);
router.get("/:slug", getProductBySlug);

export default router;
