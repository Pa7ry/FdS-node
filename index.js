// index.js
import express, { json } from 'express';
import { connect } from 'mongoose';
import cors from 'cors';
import 'dotenv/config'

import Product from './models/product.js';

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = [
  'https://www.fernandodesantiago.com',
  'http://localhost:4200',
  'http://localhost:4400',
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true
}));


// Conexión a MongoDB
connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch((err) => console.error('❌ Error de conexión:', err));

// Rutas de la API

// CREAR PRODUCTO
app.post('/products', async (req, res) => {
  try {
    const { name, technique, img, price, sold, measures, weight } = req.body;
    const nuevoProduct = new Product({ name, technique, img, price, sold, measures, weight });
    await nuevoProduct.save();
    res.status(201).json(nuevoProduct);
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar el producto' });
  }
});

// OBTENER TODOS LOS PRODUCTOS
app.get('/products', async (_req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los productos' });
  }
});

// OBTENER PRODUCTO POR ID
app.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el producto' });
  }
});

// VENDER PRODUCTO
app.patch('/products/:id/sell', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { sold: true },
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el producto' });
  }
});

// Configuración de Stripe
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Producto de ejemplo',
            },
            unit_amount: 2000, // en céntimos: 2000 = 20.00 €
          },
          quantity: 1,
        },
      ],
      success_url: 'https://www.fernandodesantiago.com/success',
      cancel_url: 'https://www.fernandodesantiago.com/cancel',
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Pago completado para', session.id);
    // Aquí actualizas tu base de datos o envías confirmación
  }

  res.json({ received: true });
});

app.use(json());

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
