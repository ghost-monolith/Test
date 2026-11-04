const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const publicDir = path.join(__dirname, "public");
app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));
app.use(express.static(publicDir));

const products = [
  { id: 1, name: "Noir Evening Bag", category: "Аксессуары", price: 89, description: "Структурированная сумка для вечерних выходов.", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85" },
  { id: 2, name: "Velvet Rose Dress", category: "Одежда", price: 129, description: "Платье с выразительным силуэтом и мягкой фактурой.", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85" },
  { id: 3, name: "Golden Hour Watch", category: "Аксессуары", price: 149, description: "Сдержанный акцент для повседневного образа.", image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=85" },
  { id: 4, name: "Luxe Silk Scarf", category: "Аксессуары", price: 45, description: "Лёгкий шарф с деликатным принтом.", image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=900&q=85" },
  { id: 5, name: "Midnight Heels", category: "Обувь", price: 110, description: "Элегантная пара для особенных случаев.", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85" },
  { id: 6, name: "Pearl Glow Necklace", category: "Украшения", price: 59, description: "Жемчужный акцент в минималистичном исполнении.", image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=85" },
  { id: 7, name: "Cloud Nine Sneakers", category: "Обувь", price: 95, description: "Комфортная пара в лаконичном стиле.", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85" },
  { id: 8, name: "Satin Mini Bag", category: "Аксессуары", price: 72, description: "Компактная сумка с мягким блеском.", image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=900&q=85" },
  { id: 9, name: "Élan Sunglasses", category: "Аксессуары", price: 64, description: "Графичная форма и универсальный силуэт.", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=85" },
  { id: 10, name: "Soft Touch Knit", category: "Одежда", price: 84, description: "Мягкий трикотаж для многослойных образов.", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=85" },
  { id: 11, name: "Crystal Drop Earrings", category: "Украшения", price: 39, description: "Небольшие серьги с сияющим акцентом.", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85" },
  { id: 12, name: "Signature Leather Belt", category: "Аксессуары", price: 55, description: "Классический аксессуар с лаконичной пряжкой.", image: "https://images.unsplash.com/photo-1624222247344-550fb8d5f6a2?auto=format&fit=crop&w=900&q=85" }
];

const orders = new Map();
const ORDER_TTL_MS = 30 * 60 * 1000;

function safeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function getTestCredentialSet() {
  try {
    const parsed = JSON.parse(process.env.TEST_CREDENTIALS || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(x => x && typeof x.number === "string" && typeof x.expiry === "string" && typeof x.cvv === "string");
  } catch {
    console.error("[CONFIG] TEST_CREDENTIALS must be valid JSON array");
    return [];
  }
}

async function notifyAdmin(text) {
  const token = process.env.BOT_TOKEN;
  const chatId = process.env.ADMIN_CHAT_ID;
  if (!token || !chatId) {
    console.warn("[TELEGRAM] BOT_TOKEN or ADMIN_CHAT_ID is not configured");
    return false;
  }
  const response = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" })
  });
  if (!response.ok) {
    console.error("[TELEGRAM] notification failed:", response.status);
    return false;
  }
  return true;
}

app.get("/api/health", (_, res) => res.json({
  ok: true,
  service: "VELVET LUXE educational storefront",
  testPaymentConfigured: getTestCredentialSet().length > 0,
  telegramConfigured: Boolean(process.env.BOT_TOKEN && process.env.ADMIN_CHAT_ID)
}));

app.get("/api/products", (_, res) => res.json(products));

app.post("/api/checkout", (req, res) => {
  const items = req.body && req.body.items;
  if (!Array.isArray(items) || !items.length || items.length > 30) {
    return res.status(400).json({ error: "Корзина пуста или содержит слишком много позиций." });
  }
  let total = 0;
  const orderItems = [];
  for (const item of items) {
    const product = products.find(p => p.id === Number(item.id));
    const quantity = Number(item.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return res.status(400).json({ error: "Некорректный товар или количество." });
    }
    total += product.price * quantity;
    orderItems.push({ id: product.id, name: product.name, quantity, unitPrice: product.price });
  }
  const orderId = "VL-" + crypto.randomBytes(4).toString("hex").toUpperCase();
  orders.set(orderId, { orderId, total, currency: "USD", items: orderItems, createdAt: Date.now(), status: "pending" });
  res.status(201).json({ success: true, demo: true, orderId, currency: "USD", total, items: orderItems });
});

app.get("/api/order/:id", (req, res) => {
  const order = orders.get(String(req.params.id || "").toUpperCase());
  if (!order || Date.now() - order.createdAt > ORDER_TTL_MS) {
    return res.status(404).json({ error: "Заказ не найден или срок его действия истёк." });
  }
  res.json({ orderId: order.orderId, total: order.total, currency: order.currency, status: order.status, items: order.items });
});

app.post("/api/test-payment", async (req, res) => {
  const orderId = String(req.body && req.body.orderId || "").toUpperCase();
  const number = String(req.body && req.body.number || "").trim();
  const expiry = String(req.body && req.body.expiry || "").trim();
  const cvv = String(req.body && req.body.cvv || "").trim();

  const order = orders.get(orderId);
  if (!order || Date.now() - order.createdAt > ORDER_TTL_MS) {
    return res.status(404).json({ error: "Заказ не найден или срок его действия истёк." });
  }
  if (order.status !== "pending") {
    return res.status(409).json({ error: "Для этого заказа проверка уже выполнена." });
  }
  // Accept arbitrary non-empty demo placeholders, but never persist or forward
  // payment-like values. This endpoint does not process a real payment.
  if (!number || !expiry || !cvv || number.length > 64 || expiry.length > 32 || cvv.length > 32) {
    return res.status(400).json({ error: "Заполните все три поля учебными значениями." });
  }

  order.status = "approved";
  order.completedAt = Date.now();
  const date = new Date(order.completedAt).toLocaleString("ru-RU", { timeZone: "Europe/Kyiv" });
  const lines = [
    "<b>VELVET LUXE — учебная оплата</b>",
    "Заказ: <b>" + order.orderId + "</b>",
    "Сумма: <b>$" + order.total.toFixed(2) + "</b>",
    "Время: " + date,
    "Результат: <b>УЧЕБНО ОДОБРЕНО</b>",
    "Режим: демонстрация; денежная операция не выполнялась",
    "Платёжные поля не сохранялись и не пересылались"
  ];
  try { await notifyAdmin(lines.join("\n")); }
  catch (error) { console.error("[TELEGRAM] notification error:", error.message); }

  res.json({
    success: true,
    status: order.status,
    orderId: order.orderId,
    total: order.total,
    message: "Учебная проверка завершена успешно. Реальная оплата не выполнялась."
  });
});

app.get("/payment", (_, res) => res.sendFile(path.join(publicDir, "payment.html")));
app.get("*", (_, res) => res.sendFile(path.join(publicDir, "index.html")));

app.listen(PORT, "0.0.0.0", () => console.log("VELVET LUXE listening on port " + PORT));
