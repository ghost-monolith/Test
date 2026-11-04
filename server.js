const express=require("express");
const path=require("path");
const app=express();
const PORT=Number(process.env.PORT||3000);
app.disable("x-powered-by");
app.use(express.json({limit:"32kb"}));
app.use(express.static(path.join(__dirname,"public")));
const products=[
{id:1,name:"Noir Evening Bag",category:"Аксессуары",price:89,description:"Лаконичная вечерняя сумка.",emoji:"👜"},
{id:2,name:"Velvet Rose Dress",category:"Одежда",price:129,description:"Платье с бархатной фактурой.",emoji:"👗"},
{id:3,name:"Golden Hour Watch",category:"Аксессуары",price:149,description:"Элегантные минималистичные часы.",emoji:"⌚"},
{id:4,name:"Luxe Silk Scarf",category:"Аксессуары",price:45,description:"Лёгкий шарф с шелковистым эффектом.",emoji:"🧣"},
{id:5,name:"Midnight Heels",category:"Обувь",price:110,description:"Классические вечерние туфли.",emoji:"👠"},
{id:6,name:"Pearl Glow Necklace",category:"Украшения",price:59,description:"Украшение с жемчужным акцентом.",emoji:"📿"},
{id:7,name:"Cloud Nine Sneakers",category:"Обувь",price:95,description:"Повседневные кроссовки.",emoji:"👟"},
{id:8,name:"Satin Mini Bag",category:"Аксессуары",price:72,description:"Компактная сумка с сатиновым блеском.",emoji:"👛"},
{id:9,name:"Élan Sunglasses",category:"Аксессуары",price:64,description:"Солнцезащитные очки.",emoji:"🕶️"},
{id:10,name:"Soft Touch Knit",category:"Одежда",price:84,description:"Мягкий трикотаж на каждый день.",emoji:"🧥"},
{id:11,name:"Crystal Drop Earrings",category:"Украшения",price:39,description:"Серьги с деликатным сиянием.",emoji:"✨"},
{id:12,name:"Signature Leather Belt",category:"Аксессуары",price:55,description:"Ремень с лаконичной пряжкой.",emoji:"🪡"}];
app.get("/api/health",(_,res)=>res.json({ok:true,service:"VELVET LUXE demo store"}));
app.get("/api/products",(_,res)=>res.json(products));
app.post("/api/checkout",(req,res)=>{
const items=req.body&&req.body.items;
if(!Array.isArray(items)||!items.length)return res.status(400).json({error:"Корзина пуста."});
let total=0;const orderItems=[];
for(const item of items){const p=products.find(x=>x.id===Number(item.id));const q=Number(item.quantity);
if(!p||!Number.isInteger(q)||q<1||q>20)return res.status(400).json({error:"Некорректный товар или количество."});
total+=p.price*q;orderItems.push({id:p.id,name:p.name,quantity:q,unitPrice:p.price});}
res.status(201).json({success:true,demo:true,orderId:"VL-"+Date.now().toString(36).toUpperCase(),currency:"USD",total,items:orderItems,message:"Демо-заказ принят. Оплата не выполнялась; реальные платежи не подключены."});
});
app.get("*",(_,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,"0.0.0.0",()=>console.log(`VELVET LUXE demo store listening on port ${PORT}`));
