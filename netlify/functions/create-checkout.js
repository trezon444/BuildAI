const { StripeClient } = require("stripe");

const stripe = new StripeClient(
  process.env.STRIPE_SECRET_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Method not allowed"
      })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const plan = body.plan;

    const prices = {
      pro: process.env.STRIPE_PRO_PRICE_ID,
      premium: process.env.STRIPE_PREMIUM_PRICE_ID
    };

    if (!prices[plan]) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Invalid plan"
        })
      };
    }

    const session = await stripe.v1.checkout.sessions.create({
      mode: "subscription",

      line_items: [
        {
          price: prices[plan],
          quantity: 1
        }
      ],

      success_url:
        `${process.env.SITE_URL}/plans.html?success=true&plan=${plan}`,

      cancel_url:
        `${process.env.SITE_URL}/plans.html?cancelled=true`,

      billing_address_collection: "auto",

      client_reference_id:
        `buildai_${plan}_${Date.now()}`,

      subscription_data: {
        metadata: {
          buildai_plan: plan
        }
      },

      integration_identifier: "buildai_aBcDeFgH"
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: session.url
      })
    };

  } catch (error) {
    console.error("Stripe error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Unable to create Stripe checkout session"
      })
    };
  }
};