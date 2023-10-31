const { STRIPE_SECRET } = require("../env");
const { request } = require("express");
const stripe = require("stripe")(STRIPE_SECRET);
module.exports.subscriptions = async(customerId,priceId,trialDays) =>{
  
    return subscription = await stripe.subscriptions.create({
    
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: trialDays,
        payment_settings: {
          save_default_payment_method: "on_subscription",
        },
        trial_settings: {
          end_behavior: {
            missing_payment_method: "pause",
          },
        },
      });
    
      
}