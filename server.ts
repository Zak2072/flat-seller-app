import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Stripe Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { userId } = req.body;
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: "Prepped Seller - Material Information Verification",
                description: "One-time fee for legal document verification and vault hosting.",
              },
              unit_amount: 6000, // £60.00 (£50 + VAT)
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.origin}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}?payment=cancel`,
        metadata: {
          userId,
        },
      });

      res.json({ id: session.id });
    } catch (error: any) {
      console.error("Stripe Session Error:", error);
      res.status(500).json({ error: error.message });
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
