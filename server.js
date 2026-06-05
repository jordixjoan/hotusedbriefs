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

app.use(express.json());

app.get('/', (req, res) => {
    res.redirect('https://www.hotusedbriefs.com');
});

app.post("/create-checkout-session", async (req, res) => {
    try {
        const { items } = req.body;

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
        });

        res.json({ url: session.url });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear la sesión de pago" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));