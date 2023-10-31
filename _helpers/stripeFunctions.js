const { makeDb } = require("../_helpers/db");
const { STRIPE_SECRET } = require("../env");
const stripe = require("stripe")(STRIPE_SECRET);
async function stripeCustomerUpdate(id, email) {
  const connection = makeDb();
  let getCustomerId = await connection.query(
    `SELECT stripe_customer_id from subscription WHERE restaurant_id = ? ORDER BY created_at DESC LIMIT 2 `,
    [id]
  );
  if (getCustomerId.length > 0) {
    const customer = await stripe.customers.update(
      `${getCustomerId[0].stripe_customer_id}`,

      { email: email }
    );
  }
}
module.exports = stripeCustomerUpdate;
