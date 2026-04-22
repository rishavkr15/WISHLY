import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";

const buildSort = (sortValue) => {
  switch (sortValue) {
    case "price_asc":
      return { price: 1 };
    case "price_desc":
      return { price: -1 };
    case "newest":
      return { createdAt: -1 };
    case "rating":
      return { rating: -1, reviewsCount: -1 };
    default:
      return { isFeatured: -1, createdAt: -1 };
  }
};

export const getProducts = asyncHandler(async (req, res) => {
  const { search = "", category = "", featured = "", sort = "", limit = "24" } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } }
    ];
  }

  if (category) {
    query.category = category;
  }

  if (featured === "true") {
    query.isFeatured = true;
  }

  const parsedLimit = Math.min(Math.max(Number(limit), 1), 60);
  const products = await Product.find(query)
    .sort(buildSort(sort))
    .limit(parsedLimit)
    .lean();

  res.set("Cache-Control", "public, max-age=60");
  res.json(products);
});

export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true })
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  res.set("Cache-Control", "public, max-age=120");
  res.json(products);
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const product = await Product.findOne({
    $or: [{ slug }, { _id: slug.match(/^[0-9a-fA-F]{24}$/) ? slug : null }]
  }).lean();

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.set("Cache-Control", "public, max-age=120");
  res.json(product);
});
