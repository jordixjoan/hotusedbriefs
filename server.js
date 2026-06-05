require("dotenv").config();
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

const allowedOrigins = [
    "https://hotusedbriefs.com",
    "https://www.hotusedbriefs.com",
    "http://127.0.0.1:5500"
];

const fs = require("fs");
const path = require("path");

const productsPath = path.join(__dirname, "products.json");

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: "GET,POST",
    allowedHeaders: "Content-Type,Authorization"
}));

app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("Webhook signature error:", err.message);
        return res.sendStatus(400);
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        try {
            const productIds = session.metadata.product_ids
                ? session.metadata.product_ids.split(",")
                : [];

            const extraIds = session.metadata.extra_ids
                ? session.metadata.extra_ids.split(",")
                : [];

            const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));

            productIds.forEach(id => {
                const product = products.find(p => p.id === id);

                if (product) {
                    product.stock = 0;
                }
            });

            fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));

            console.log("Products marked as sold:", productIds);

            const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

            if (process.env.APPS_SCRIPT_URL) {
                await fetch(process.env.APPS_SCRIPT_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: session.customer_details?.name || "Not specified",
                        email: session.customer_details?.email || "Not specified",
                        phone: session.customer_details?.phone || "Not specified",
                        address: [
                            session.customer_details?.address?.line1,
                            session.customer_details?.address?.line2,
                            session.customer_details?.address?.city,
                            session.customer_details?.address?.state,
                            session.customer_details?.address?.postal_code,
                            session.customer_details?.address?.country
                        ].filter(Boolean).join(", "),
                        items: lineItems.data.map((item, index) => {
                            const productId = productIds[index];
                            const hasVideo = extraIds.includes(productId);

                            return {
                                id: productId,
                                name: item.description,
                                quantity: item.quantity,
                                price: (item.amount_total / 100).toFixed(2),
                                currency: item.currency.toUpperCase(),
                                hasVideo: hasVideo
                            };
                        })
                    })
                });

                console.log("Order sent to Apps Script");
            }

        } catch (error) {
            console.error("Error processing completed checkout:", error);
        }
    }

    res.sendStatus(200);
});

app.use(express.json());

app.get('/', (req, res) => {
    res.redirect('https://www.hotusedbriefs.com');
});

app.get("/products", (req, res) => {
    const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));
    res.json(products);
});

app.post("/create-checkout-session", async (req, res) => {
    try {
        const { items } = req.body;

        const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));

        const realItems = items.filter(item => item.id);

        for (const item of realItems) {
            const product = products.find(p => p.id === item.id);

            if (!product) {
                return res.status(400).json({
                    error: "Product not found."
                });
            }

            if (product.stock <= 0) {
                return res.status(400).json({
                    error: `${product.name} is already sold.`
                });
            }
        }

        const lineItems = items.map(item => ({
            price_data: {
                currency: "eur",
                product_data: {
                    name: item.name,
                },
                unit_amount: Math.round(
                    parseFloat(String(item.price).replace('€', '').replace(',', '.')) * 100
                ),
            },
            quantity: 1,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL}/success/pago`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`,
            billing_address_collection: "required",
            shipping_address_collection: {
                allowed_countries: ["ES", "DE", "FR", "GB", "IT", "NL", "SE", "CH", "BE", "PL", "AT", "IE", "DK", "FI", "PT"]
            },
            phone_number_collection: {
                enabled: true,
            },
            metadata: {
                product_ids: realItems.map(item => item.id).join(","),
                extra_ids: realItems
                    .filter(item => item.extra === true)
                    .map(item => item.id)
                    .join(",")
            },
        });

        res.json({ url: session.url });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear la sesión de pago" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));