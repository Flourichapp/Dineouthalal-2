const { makeDb } = require("../../_helpers/db");
const { subscriptions } = require("../../_helpers/subsciption");
const moment = require("moment");
var cron = require("node-cron");

// const path = require('path');               // Used for manipulation with path
// const fs = require('fs-extra');             // Classic fs
// const { environment } = require('../../env');
// const multer = require('multer');
// const { element } = require('protractor');
// const { time } = require('console');
const {
  STRIPE_SECRET,
  Pro_trialdays,
  Prosaver_trialdays,
  Pro_basic_trialdays,
  Pro_flexi_trialdays,
} = require("../../env");
const { request } = require("express");
const stripe = require("stripe")(STRIPE_SECRET);

// async function stripePayment(req, res, next) {
//     try {

//         console.log(req.body);
//         var { amount, rest_id, token_id, user_id, monthly_flag } = req.body;

//         if (rest_id) {
//             stripe.charges.create({
//                 amount: amount,
//                 currency: 'EUR',
//                 description: 'monthly',
//                 source: token_id
//             }, async (err, charge) => {
//                 if (err) {
//                     console.log('stripe error===================', err);
//                     res.status(500);
//                     res.json({ 'message': 'Internal Error' });
//                     return;
//                 }

//                 var detail = {};
//                 detail.id = charge.id;
//                 detail.brand = charge.payment_method_details.card.brand;
//                 detail.last4 = charge.payment_method_details.card.last4;

//                 const connection = makeDb();

//                 var rest = await connection.query(`select * from restaurants where restaurant_id = ?`, [rest_id]);

//                 if (rest && rest.length > 0) {
//                     const restaurant = rest[0];

//                     let expiredAt = restaurant.expired_at;

//                     let now = new Date();

//                     let startDate = now;

//                     if (new Date(expiredAt).getTime() >= now.getTime()) {
//                         startDate = new Date(expiredAt);
//                     }

//                     if (monthly_flag == 'yearly') {
//                         var newDate = new Date(startDate.setMonth(startDate.getMonth() + 12));
//                     } else {
//                         var newDate = new Date(startDate.setMonth(startDate.getMonth() + 1));
//                     }

//                     var query = `update restaurants set status="approving", expired_at=?, plan_flag=? where restaurant_id=?`;

//                     await connection.query(query, [newDate.toISOString(), monthly_flag, rest_id]);

//                     var queryResult = await connection.query(`INSERT INTO transactions (rest_owner_id, restaurant_id, amount, paid_at, description) VALUES (?,?,?, NOW(), ?)`, [user_id, rest_id, amount / 100, JSON.stringify(detail)]);

//                     connection.close();

//                     res.status(200);
//                     res.json(queryResult);
//                     return;
//                 } else {
//                     res.status(400);
//                     res.json({ message: 'Bad Request' });
//                     return;
//                 }
//             })
//         } else {
//             res.status(400);
//             res.json({ message: 'Bad Request' });
//             return;
//         }

//     } catch (err) {
//         console.log(err);
//         res.status(500);
//         res.json({ 'message': 'Internal Error' });
//         return;
//     }
// }

// async function transactionData(req, res, next) {
//     try {
//         const connection = makeDb();

//         var { rest_id, pageIndex, pageSize } = req.body;

//         var offset = parseInt(pageSize) * parseInt(pageIndex);
//         var total = await connection.query(`SELECT * from transactions where restaurant_id=?`, [rest_id]);

//         var trans_rows = [];
//         trans_rows = await connection.query(`SELECT * from transactions where restaurant_id=? order by created_at desc  LIMIT ?, ?`, [rest_id, offset, pageSize]);

//         if (trans_rows && trans_rows.length > 0) {
//             trans_rows = trans_rows.map((item, index) => {
//                 trans_rows[index]['detail'] = JSON.parse(item.description);
//                 return item;
//             })
//         }

//         var rest = await connection.query(`select * from restaurants where restaurant_id = ?`, [rest_id]);
//         connection.close();

//         var data = {
//             trans: trans_rows,
//             total: total.length,
//             expired: rest && rest.length > 0?rest[0].expired_at: null
//         }

//         res.status(200);
//         res.json(data);

//         return;
//     } catch (err) {
//         console.log(err);
//         res.status(500);
//         res.json({ 'message': 'Internal Error' });
//         return;
//     }
// }

const customerCreate = async (email, source) => {
  return await stripe.customers.create({
    email,
    source,
  });
};

module.exports.subscription = async (req, res) => {
  const {
    restaurant_id,
    price_id,
    amount,
    subscriptionFlag,
    token_id,
    user_id,
    product_id,
    trialdays,
  } = req.body;
  // console.log( "params",restaurant_id,
  //   price_id,
  //   amount,
  //   subscriptionFlag,
  //   token_id,
  //   user_id,
  //   product_id,
  //   trialdays,)
  const connection = makeDb();
  // const restuarant_admin = `SELECT * FROM restaurants_admin where id = ?`;
  let getrestuserinfo = await connection.query(
    `SELECT * FROM restaurants_admin where id = ?`,
    [user_id]
  );
  const sqlquery = `SELECT * from subscription where restaurant_id = ${restaurant_id} ORDER BY created_at DESC LIMIT 1  `;
  let response = await connection.query(sqlquery);

  if (response.length > 0) {
    //package is already active
    if (response[0].status === "active") {
      return res.status(200).json({
        message: "You have already subscribed.",
      });
    }

    //package is inactive now reactive with payment monthly or yearly
    if (response[0].status === "inactive") {
      // const customer = await stripe.customers.create({
      //   email: getrestuserinfo[0].email,
      //   source: token_id,
      // });

      let customer = await customerCreate(getrestuserinfo[0].email, token_id);

      // let customer_id = customer.id;
      let subsciption = await subscriptions(customer.id, price_id, 0);
      let dateTime = moment().format();
      let expiredAt;

      if (subscriptionFlag == "monthly") {
        expiredAt = moment(dateTime).add(1, "M").format();
      } else if (subscriptionFlag == "yearly") {
        expiredAt = moment(dateTime).add(12, "M").format();
      }

      let sqlQuery = `INSERT INTO subscription (restaurant_id,stripe_customer_id,stripe_subscription_id,subscription_type,package_plan,product_id,amount,status,expire_date) VALUES(?,?,?,?,?,?,?,?,?)`;
      let new_subscription = await connection.query(sqlQuery, [
        restaurant_id,
        customer.id,
        subsciption.id,
        subscriptionFlag,
        "paid",
        product_id,
        amount,
        "active",
        expiredAt,
      ]);
      let package = await connection.query(
        `SELECT id FROM subscription_package WHERE product_id = ?`,
        [product_id]
      );
      await connection.query(
        `UPDATE restaurants_admin SET subscription_id = ? , full_access = 0, package_id = ? WHERE id = ? `,
        [new_subscription.insertId, package[0].id, user_id]
      );
      // let updateQuery = `UPDATE restaurants SET status = 'approving' WHERE restaurant_id = ?`;
      let updateQuery = connection.query(
        `UPDATE restaurants SET status = 'approving' WHERE restaurant_id = ?`,
        [restaurant_id]
      );
      // let data = await connection.query(`SELECT package_id,subscription_id FROM restaurants_admin where id = ${user_id}`);
      return res.status(200).json({
        statusCode: 200,
        data: {
          package_id: package[0].id,
          subsciption_id: new_subscription.insertId,
        },
        // data,
        message: "Your subscription is activated.",
      });
    }

    //new package subscription
  } else {
    let customer = await customerCreate(getrestuserinfo[0].email, token_id);

    // let customer_id = customer.id;
    // let sub = await subscriptions(customer.id, price_id, TRIALDAYS);
    let sub = await subscriptions(customer.id, price_id, trialdays);
    let dateTime = moment().format();
    let expiredAt = moment(dateTime)
      .add(trialdays / 30, "M")
      .format();

    let sqlQuery = `INSERT INTO subscription (restaurant_id,stripe_customer_id,stripe_subscription_id,subscription_type,package_plan,product_id,amount,status,expire_date) VALUES(?,?,?,?,?,?,?,?,?)`;

    let insertrowid = await connection.query(sqlQuery, [
      restaurant_id,
      customer.id,
      sub.id,
      subscriptionFlag,
      "trial",
      product_id,
      0,
      "active",
      expiredAt,
    ]);

    let getSubpackageId = await connection.query(
      `SELECT id FROM subscription_package WHERE product_id = ? `,
      [product_id]
    );

    // let getSubscriptionId = await connection.query(
    //   `SELECT id FROM subsciption where restaurant_id = '${restaurant_id} ORDER BY created_at DESC LIMIT 1`
    // );

    let restautant_adminUpdate = await connection.query(
      `UPDATE restaurants_admin SET subscription_id = ? , full_access = 0, package_id = ? WHERE id = ?  `,
      [insertrowid.insertId, getSubpackageId[0].id, user_id]
    );
    // console.log("insert row id line 258", insertrowid.insertId);

    let updateQuery = await connection.query(
      `UPDATE restaurants SET status = 'approving' WHERE restaurant_id = ?`,
      [restaurant_id]
    );
    return res.status(200).json({
      statusCode: 200,
      message: "Your trial period has been activated",
      data: {
        subscription_id: insertrowid.insertId,
        package_id: getSubpackageId[0].id,
      },
    });
  }
  connection.close();

  // customerCreate();
  // const connection = makeDb();
  // let createCustomer = async () => {
  //   return (customer = await stripe.customers.create({
  //     email: getrestuserinfo[0].email,
  //     source: token_id,
  //   }));
};

module.exports.gettransactionhistory = async (req, res) => {
  const connection = makeDb();
  let { restaurant_id, months, pageIndex, pageSize } = req.query;

  let offset = parseInt(pageIndex) * parseInt(pageSize);
  let rows = [];
  let totalcount = [];
  if (restaurant_id) {
    const sqlQuery = `SELECT r.title,st.id,st.restaurant_id,st.month,st.year,st.stripe_customer_id,st.amount,st.paid,st.paid_date
    FROM  stripe_transaction st left join restaurants r ON r.restaurant_id = st.restaurant_id WHERE st.restaurant_id = ${restaurant_id} LIMIT ${offset},${pageSize}`;
    rows = await connection.query(sqlQuery);
    totalcount = await connection.query(
      `SELECT COUNT(*) as count FROM stripe_transaction where restaurant_id = ${restaurant_id}`
    );
  } else {
    const sqlQuery = `SELECT r.title,st.id,st.restaurant_id,st.month,st.year,st.stripe_customer_id,st.amount,st.paid,st.paid_date
    FROM  stripe_transaction st left join restaurants r ON r.restaurant_id = st.restaurant_id LIMIT ${offset},${pageSize}`;
    rows = await connection.query(sqlQuery);
    totalcount = await connection.query(
      `SELECT COUNT(*) as count FROM stripe_transaction`
    );
  }

  // let  BookingHistory =  []

  // for (let index = 0; index < rows.length; index++) {
  //   const element = rows[index];
  //   const getBookingQuery = `SELECT * FROM restaurant_bookings WHERE MONTHNAME(booking_date) = '${element.Month}' AND restaurant_id = ${req.params.id}  `
  //   let rows2 = await connection.query(getBookingQuery)
  //   console.log(element.Month)
  //   BookingHistory.push( {[element.Month]: rows2})
  // }

  //   let emtyarr = []
  // if(rows){
  // let month = ""
  // rows.filter(row => {
  //   month = row.month
  //   if( month !== ""){
  //     emtyarr.push()
  //   }
  // } )
  connection.close();
  res.status(200).json({
    statusCode: 200,
    message: "Data featched successfully",
    rows,
    count: totalcount[0].count,
  });
};

module.exports.chargeCommsion = async (req, res) => {
  const connection = makeDb();
  const { person, bookingdate, paid_at } = req.body;
  var convertBookingdateformat = moment(bookingdate).format("YYYY-MM-DD");
  var convert_paid_at_date_format = moment(paid_at).format("YYYY-MM-DD");
  const ChargePrice = 1;
  const personCharge = ChargePrice * person;
  const currentDateCronJob = moment().format("YYYY-MM-DD");
  const expireDateCronJob = moment().add(1, "M").format("YYYY-MM-DD");
  const getCronExpireDate = await connection.query(
    `SELECT expire_at FROM cronjobstripe`
  );

  // console.log(expireDateCronJob);
  // const currentDate = moment().format('YYYY-MM-DD')
  // const monthlyDate = moment().add(1,'M').format('YYYY-MM-DD')

  // const charge = await stripe.charges.create({
  //   amount: personCharge,
  //   currency: 'GBP',
  //   source: 'tok_amex',
  // });

  const sqlQuery = `INSERT INTO restaurant_commissions (restaurant_id , booking_date , amount , paid_at) VALUES(?,?,?,?)`;
  connection.query(sqlQuery, [
    req.params.id,
    convertBookingdateformat,
    personCharge,
    convert_paid_at_date_format,
  ]);
  res.status(201).json({
    statusCode: 200,
    message: "Data created successfully",
  });
  connection.close();
};

module.exports.getbookingHistory = async (req, res) => {
  const { pageIndex, pageSize, month, year } = req.query;

  let offset = parseInt(pageIndex) * parseInt(pageSize);
  const connection = makeDb();
  const allcount = await connection.query(
    `SELECT COUNT(*) as count from restaurant_bookings LEFT JOIN customers ON restaurant_bookings.customer_id = customers.id WHERE MONTHNAME(booking_date) = '${month}' AND YEAR(booking_date) = ${year} AND restaurant_id = ${req.params.id} AND status = 'approved' `
  );
  let data = await connection.query(
    `SELECT * FROM restaurant_bookings LEFT JOIN customers ON restaurant_bookings.customer_id = customers.id WHERE MONTHNAME(booking_date) = ? AND YEAR(booking_date) = ? AND restaurant_id = ? AND status = 'approved' LIMIT ${offset},${pageSize} `,
    [month, year, req.params.id]
  );
  res.status(200).json({
    data,
    allcount: allcount[0].count,
  });
  connection.close();
};
module.exports.getStripeSubscription = async (req, res) => {
  const connection = makeDb();
  const { id } = req.params;
  let response = await connection.query(
    `SELECT * FROM subscription WHERE restaurant_id = ? ORDER BY created_at DESC`,
    [id]
  );
  connection.close();
  if (response.length > 0) {
    res.status(200).json(response[0]);
    //  elsestatement
  } else {
    res.status(404).json({ message: "Data not found" });
  }
};

module.exports.stripePaymentWebhooks = async (req, res, event) => {
  const connection = makeDb();
  // console.log("Type", req.body["type"]);
  // customer.subscription.updated
  if (req.body["type"] == "customer.subscription.updated") {
    // console.log("cutomer to update");
    let subscriptionStartTimestamp = req.body.data.object.current_period_start;
    let subscriptionEndTimestamp = req.body.data.object.current_period_end;
    let subStartDate = moment.unix(subscriptionStartTimestamp).format();
    let subEndDate = moment.unix(subscriptionEndTimestamp).format();
    let active = req.body.data.object.status;
    const customerId = req.body.data.object.customer;

    //ifstatemewnt
    if (active == "active") {
      await connection.query(
        `UPDATE subscription SET package_plan = ? , status = ? , created_at = ? , expire_date = ? WHERE stripe_customer_id = '${customerId}'`,
        ["paid", "inactive", subStartDate, subEndDate]
      );
      // connection.close();
    }
  }

  if (req.body["type"] == "customer.subscription.deleted") {
    const customerId = req.body.data.object.customer;

    const subscription = await connection.query(
      `SELECT restaurant_id,id ,package_plan,expire_date FROM subscription WHERE stripe_customer_id = ?`,
      [customerId]
    );

    if (subscription && subscription.length) {
      const sqlQuery = `UPDATE subscription SET package_plan = ? , status = ?, stripe_subscription_id = ? WHERE stripe_customer_id = ?`;
      await connection.query(sqlQuery, ["paid", "inactive", "", customerId]);

      const restaurant_admin = `UPDATE restaurants_admin SET subscription_id = ? , package_id = ? WHERE subscription_id = '${subscription[0].id}'`;
      await connection.query(restaurant_admin, [null, null]);

      const subsciptionExpiryDate = moment(
        subscription[0].expire_date
      ).format();

      var randomName = generateRandomName();
      if (subscription[0].package_plan == "paid") {
        const restaurantStatusQuery = `
    CREATE EVENT ${randomName}
    ON SCHEDULE AT '${subsciptionExpiryDate}'
    DO
    UPDATE restaurants r SET r.status = "approving" WHERE restaurant_id = ?`;

        await connection.query(restaurantStatusQuery, [
          subscription[0].restaurant_id,
        ]);
      } else if (subscription[0].package_plan == "trial") {
        await connection.query(
          `UPDATE restaurants r SET r.status = "pending" WHERE restaurant_id = ?`,
          [subscription[0].restaurant_id]
        );
      }
    } else {
      console.log("Subscription not found in dineouthalal database.");
    }
  }
  connection.close();
};

function generateRandomName() {
  var alphabet = "abcdefghijklmnopqrstuvwxyz";
  var name = "";
  for (var i = 0; i < 5; i++) {
    var randomIndex = Math.floor(Math.random() * alphabet.length);
    var randomChar = alphabet.charAt(randomIndex);
    name += randomChar;
  }

  return name;
}
