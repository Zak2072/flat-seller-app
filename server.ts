import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin
import firebaseConfig from "./firebase-applet-config.json" with { type: "json" };
import fs from "fs";

if (!admin.apps.length) {
  // Use ambient credentials
  console.log(`[Admin] Initializing with default app settings...`);
  admin.initializeApp();
}

const FIRESTORE_DATABASE_ID = firebaseConfig.firestoreDatabaseId;
console.log(`[Admin] Configured Firestore Database ID: ${FIRESTORE_DATABASE_ID || '(default)'}`);

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured in environment variables");
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Stripe Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { userId, priceId, propertyId } = req.body;
      const stripe = getStripe();
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/?payment=cancel`,
        metadata: {
          userId,
          propertyId,
        },
        automatic_tax: { enabled: true },
        billing_address_collection: 'required',
        tax_id_collection: { enabled: true },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Session Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Verify Payment and Update Database
  app.get("/api/verify-payment", async (req, res) => {
    try {
      const { session_id } = req.query;
      console.log(`[Verify] Starting verification for session: ${session_id}`);
      
      if (!session_id) {
        console.error("[Verify] Missing session_id");
        return res.status(400).json({ error: "Missing session_id" });
      }

      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(session_id as string);
      
      // LOG THE FULL SESSION FOR AUDIT
      console.log("[Verify] Full Session Metadata:", JSON.stringify(session.metadata, null, 2));
      console.log(`[Verify] Payment Status: ${session.payment_status}`);

      if (session.payment_status === 'paid') {
        const userId = session.metadata?.userId;
        const propertyId = session.metadata?.propertyId;

        console.log(`[Verify] Payment confirmed for userId: ${userId}, propertyId: ${propertyId}`);

        if (userId && propertyId) {
          return res.json({ 
            success: true, 
            message: "Payment verified by Stripe", 
            metadata: session.metadata 
          });
        } else {
          console.error("[Verify] Missing userId or propertyId in Stripe session metadata");
          return res.json({ 
            success: false, 
            message: "Critical Error: userId or propertyId missing from Stripe metadata.",
            metadata: session.metadata 
          });
        }
      }

      console.warn(`[Verify] Session not paid. Current status: ${session.payment_status}`);
      res.json({ success: false, message: `Stripe reports payment status as: ${session.payment_status}` });
    } catch (error: any) {
      console.error("[Verify] Critical Verification Error:", error);
      // Return 200 with error details to allow the frontend to display the exact cause
      res.json({ 
        success: false, 
        error: error.message, 
        stack: error.stack,
        message: `System Error: ${error.message}. Please check server logs for details.`
      });
    }
  });

  // API Route for Homedata Property Search
  app.get("/api/search-property", async (req, res) => {
    try {
      const searchQuery = req.query.query as string;
      const apiKey = process.env.HOMEDATA_API_KEY;

      if (!apiKey) {
        // Mock data for development if API key is missing
        console.warn('HOMEDATA_API_KEY is missing. Using mock data.');
        return res.json({
          results: [
            {
              uprn: '100023332211',
              address: `${searchQuery || 'Unknown'} (Mock Match 1)`,
              epc_rating: 'B',
              total_floor_area: 75,
              raw: { source: 'mock', id: 1 }
            },
            {
              uprn: '100023332212',
              address: `${searchQuery || 'Unknown'} (Mock Match 2)`,
              epc_rating: 'C',
              total_floor_area: 82,
              raw: { source: 'mock', id: 2 }
            }
          ]
        });
      }

      if (!searchQuery) {
        return res.status(400).json({ error: 'Server received an empty query variable' });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const url = `https://api.homedata.co.uk/api/address/find/?query=${encodeURIComponent(searchQuery)}`;
      console.log(`Homedata API Request: ${url}`);

      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': 'Api-Key ' + apiKey,
            'Accept': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error(`Homedata API error (${response.status}):`, errorText);
          
          let details = {};
          try {
            details = JSON.parse(errorText);
          } catch (e) {
            details = { raw: errorText };
          }

          return res.status(response.status).json({ 
            error: `API error (${response.status})`, 
            status: response.status,
            details 
          });
        }

        const data = await response.json();
        console.log('Homedata API Response:', JSON.stringify(data, null, 2));
        
        // Map the suggestions to our internal format
        // The API returns a flat object with suggestions
        const suggestionsList = data.suggestions || [];
        const suggestions = suggestionsList.map((item: any) => ({
          uprn: item.uprn,
          address: item.address,
          postcode: item.postcode || 'N/A',
          epc_rating: item.epc_rating || item.epc?.current_rating || 'N/A',
          total_floor_area: item.total_floor_area || item.epc?.total_floor_area || 0,
          raw: item
        }));

        res.json({ results: suggestions });
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return res.status(504).json({ error: 'Server timeout' });
        }
        throw err;
      }
    } catch (error: any) {
      console.error("Homedata Search Error:", error);
      res.status(500).json({ 
        error: error.message || 'Service error', 
        status: error.status || 500,
        details: error.details || {}
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
