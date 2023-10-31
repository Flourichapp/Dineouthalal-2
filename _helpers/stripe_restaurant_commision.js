const { makeDb } = require("_helpers/db");
const { STRIPE_SECRET } = require("../env");
const stripe = require("stripe")(STRIPE_SECRET);
const currentDate = new Date();
const currentDay = currentDate.getDate();
const moment = require("moment");
module.exports.stripe_restaurant_cronjob = async (req, res) => {
  if (currentDay === 3) {
    // console.log("chala cron");
    const charge = async (req, res) => {
      const connection = makeDb();
      // Yahan aap apna function likhein jo aap har month ki 2nd date par run karna chahte hain;
      let data =
        await connection.query(`SELECT stripe_customer_id,restaurant_commissions.restaurant_id,restaurant_commissions.amount,booking_date FROM restaurant_commissions LEFT JOIN subscription ON restaurant_commissions.restaurant_id = subscription.restaurant_id where DATE_SUB(DATE_FORMAT(NOW(), '%Y-%m-01'), INTERVAL 1 MONTH) <= booking_date
            AND booking_date < DATE_FORMAT(NOW(), '%Y-%m-01') `);

      // Create an object to store the grouped results
      var groupedArray = {};

      // Iterate over each object in the array
      data.forEach(function (obj) {
        // Check if the id already exists in the grouped array
        if (groupedArray.hasOwnProperty(obj.restaurant_id)) {
          // If the id exists, add the person value to the existing person count
          groupedArray[obj.restaurant_id].amount += parseInt(obj.amount);
          groupedArray[obj.restaurant_id].stripe_customer_id =
            obj.stripe_customer_id;
        } else {
          // If the id doesn't exist, create a new entry with the id and person value
          groupedArray[obj.restaurant_id] = {
            restaurant_id: obj.restaurant_id,
            amount: parseInt(obj.amount),
            stripe_customer_id: obj.stripe_customer_id,
          };
        }
      });
      // Convert the grouped object back to an array
      var resultArray = Object.values(groupedArray);

      const date = moment().subtract(1, "months").endOf("month").format("MMM");
      const year = moment().format("YYYY");

      let response = [];
      for (let i = 0; i < resultArray.length; i++) {
        response = await connection.query(
          `select * from stripe_transaction where restaurant_id = ${resultArray[i].restaurant_id} AND stripe_transaction.month = '${date}'  AND stripe_transaction.year = ${year} `
        );
      }
      // console.log(response.length);
      if (response.length === 0) {
        for (let i = 0; i < resultArray.length; i++) {
          const charges = await stripe.charges.create({
            amount: resultArray[i].amount * 100,
            currency: "GBP",
            customer: resultArray[i].stripe_customer_id,
          });
          let month = moment()
            .subtract(1, "months")
            .endOf("month")
            .format("MMM");
          let year = moment().format("YYYY");

          connection.query(
            `INSERT INTO stripe_transaction (restaurant_id,month,year,stripe_customer_id,amount,paid) VALUES(${resultArray[i].restaurant_id},'${month}','${year}','${resultArray[i].stripe_customer_id}','${resultArray[i].amount}',"paid" )`
          );
        }
      }

      // Output the result
    };
    charge();
  }
};
