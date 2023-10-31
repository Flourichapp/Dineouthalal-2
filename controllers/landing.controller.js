const { json } = require("body-parser");
const { makeDb } = require("../_helpers/db");
const { transporter } = require("../_helpers/email");
const { connectionHost } = require("../env");
const path = require("path");
var ejs = require("ejs");
var moment = require("moment"); // require
// const path = require("path"); // Used for manipulation with path
// const fs = require("fs-extra"); // Classic fs
// const { environment } = require("../env");
// const multer = require("multer");
const bcrypt = require("bcrypt");
const {} = require("../routes/landing.route");
// const { request } = require("http");
// const { connect } = require("http2");
//landingcontroller
const saltRounds = 10;

module.exports = {
  getmetadatasingle,
  getLandingPageData,
  featuedBlog,
  getRestSearchData,
  getRestData,
  saveBooking,
  registerSubscriber,
  restaurants,
  updateBooking,
  contact,
};

async function getLandingPageData(req, res, next) {
  try {
    const connection = makeDb();

    var blogs = await connection.query(
      `SELECT * from blogs WHERE isDeleted = 0 ORDER BY created_at  DESC LIMIT 5 `
    );

    var query = `Select t1.restaurant_id, t1.title,t1.slug, t1.shortdescription, t1.main_logo, 
    t1.food_types, t1.address1, t1.address2, t1.city, COUNT(t2.id) AS review_count, SUM(t2.mark) as ratings
    From restaurants as t1
    LEFT JOIN restaurant_reviews as t2 On t1.restaurant_id = t2.restaurant_id
    Where t1.status = "approved" AND t1.isDeleted = 0`;
    var topRestsQuery =
      query + ` Group By t1.restaurant_id Order By ratings desc LIMIT 8`;
    // var halalCertifiedQuery =
    //   query +
    //   ` AND t1.food_types LIKE "%halal_certified%" GROUP BY t2.restaurant_id ORDER BY mark DESC LIMIT 6`;

    var toprests = await connection.query(topRestsQuery);
    // var halalcertified = await connection.query(halalCertifiedQuery);

    var data = {
      blogs: blogs,
      toprests: toprests,
      // halalcertified: halalcertified,
    };
    connection.close();
    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data fetched successfully",
      data,
    });
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error: err,
    });
  }
}

async function featuedBlog(req, res, next) {
  const connection = makeDb();

  var featuredBlogsById = await connection.query(
    `SELECT * FROM blogs INNER JOIN feautured_blogs ON blogs.id = feautured_blogs.BlogId WHERE isDeleted = 0 `
  );
  connection.close();
  return res.status(200).json({
    statusCode: 200,
    message: "Data fetched successfully",
    featuredBlogsById,
  });
}

async function restaurants(req, res, next) {
  const connection = makeDb();
  let SearchResturentByCityQuery = "",
    restaurantSearch = [];

  let isDataExists = await connection.query(
    "SELECT COUNT(*) as count FROM restaurants"
  );
  if (isDataExists[0].count > 0) {
    SearchResturentByCityQuery = `SELECT (cc.title) as cusine_title , r.restaurant_id, r.city, r.title, 
      r.shortdescription, r.main_logo,r.slug, r.address1, r.address2 , r.food_types , COUNT(rr.id) AS review_count, SUM(rr.mark) as ratings
      FROM restaurants as r
      LEFT JOIN restaurant_reviews as rr ON r.restaurant_id = rr.restaurant_id 
      LEFT JOIN cuisine_category as cc ON cc.id = r.cuisine
      WHERE ${
        req.query.city && 'r.city = "' + req.query.city + '" AND'
      } r.isDeleted = 0 AND r.status = 'approved' 
      GROUP BY r.restaurant_id 
      ORDER BY ratings DESC LIMIT 6`;

    //   SearchResturentByCityQuery = `SELECT restaurants.restaurant_id, restaurants.city, restaurants.title, restaurants.shortdescription, restaurants.fulldescription, restaurants.main_logo, restaurants.thumbnail, restaurants.phonenumber, restaurants.open_time, restaurants.close_time,restaurants.address1,restaurants.address2 , (cuisine_category.title) as cusine_title, restaurants.food_types, SUM(restaurant_reviews.mark + restaurant_reviews.food_mark) AS sum_mark, COUNT(restaurant_reviews.id) AS count_review from restaurants
    //   LEFT JOIN restaurant_bookings ON restaurants.restaurant_id = restaurant_bookings.restaurant_id LEFT JOIN restaurant_reviews ON restaurants.restaurant_id = restaurant_reviews.restaurant_id
    //   `
    restaurantSearch = await connection.query(SearchResturentByCityQuery);
  }

  connection.close();
  return res.json({
    statusCode: 200,
    message: "data fetched successfully",
    data: restaurantSearch,
  });
}

async function getRestSearchData(req, res, next) {
  try {
    var {
      search,
      cuisine,
      restaurant_title,
      area,
      category,
      date,
      time,
      seatNum,
      seatOpt,
      priceOpt,
      sort,
      pageIndex,
      pageSize,
      lat,
      lng,
      previousPageIndex,
    } = req.body;
    if (typeof pageIndex == "undefined" || pageIndex == "") {
      pageIndex = 0;
    }

    if (typeof pageSize == "undefined" || pageSize == "") {
      pageSize = 10;
    }

    if (typeof lat == "undefined" || lat == "") {
      lat = 0;
    }

    if (typeof lng == "undefined" || lng == "") {
      lng = 0;
    }

    var offset = parseInt(pageIndex) * parseInt(pageSize);

    var params = [];
    // var query = `SELECT r.restaurant_id, r.title, r.shortdescription, r.main_logo,
    //                 r.open_time, r.close_time, r.food_types, r.average_price,
    //                 r.address1, r.address2, r.city, r.lat, r.lng,
    //                 rv.sum_mark, rv.count_review, r.offer_menu,
    //                 COUNT(r.restaurant_id) AS available_tables,
    //                 cc.title as cuisine, r.cuisine as cuisine_id,

    //                 ROUND( 6353 * 2 *
    //                     ASIN(SQRT( POWER(SIN((? - abs(r.lat)) * pi()/180 / 2),2)
    //                   + COS(? * pi()/180 ) * COS( abs(r.lat) *  pi()/180)
    //                   * POWER(SIN((? - r.lng) * pi()/180 / 2), 2) ))
    //                   , 2) as distance_in_km
    //                 FROM restaurants AS r
    //                 LEFT JOIN
    //                     (SELECT SUM(mark)/COUNT(id) AS sum_mark, COUNT(id) AS count_review, restaurant_id
    //                     FROM restaurant_reviews) AS rv
    //                     ON rv.restaurant_id = r.restaurant_id
    //                 LEFT JOIN cuisine_category as cc on cc.id = r.cuisine `;
    var query = `SELECT r.restaurant_id, r.title, r.shortdescription, r.main_logo, 
                     r.open_time, r.close_time, r.food_types, r.average_price,r.slug,
                     r.created_at,r.status,
                    r.address1, r.address2, r.city, r.lat, r.lng, 
                    r.offer_menu,COUNT(rv.restaurant_id) AS review_count, SUM(rv.mark) as ratings,
                  COUNT(r.restaurant_id) AS available_tables, 
                  cc.title as cuisine, r.cuisine as cuisine_id, 
                   
                    ROUND( 6353 * 2 * 
                      ASIN(SQRT( POWER(SIN((? - abs(r.lat)) * pi()/180 / 2),2) 
                      + COS(? * pi()/180 ) * COS( abs(r.lat) *  pi()/180) 
                    * POWER(SIN((? - r.lng) * pi()/180 / 2), 2) ))
                      , 2) as distance_in_km
                   FROM restaurants AS r 
                   LEFT JOIN restaurant_reviews AS rv ON r.restaurant_id = rv.restaurant_id 
                   LEFT JOIN cuisine_category as cc on cc.id = r.cuisine  `;
    params.push(parseFloat(lat));
    params.push(parseFloat(lat));
    params.push(parseFloat(lng));
    var condition = [];

    // if (typeof cuisine != "undefined" && cuisine != "") {
    //   condition.push(`cc.title = ? `);
    //   params.push(`REGEXP '.*${search}'`);
    // }
    if (typeof search != "undefined" && search != "") {
      condition.push(
        `r.status = 'approved' AND (r.food_types REGEXP '.*${search}' OR r.title REGEXP '.*${search}' OR r.city REGEXP '.*${search}'  OR cc.title REGEXP '.*${search}') `
        // `r.status = 'approved' AND r.title REGEXP '.*${search}'`
      );
    }
    if (typeof search == "undefined" || search == "") {
      condition.push(
        `r.status = 'approved'`
        // `r.status = 'approved' AND r.title REGEXP '.*${search}'`
      );
    }
    if (
      typeof date != "undefined" &&
      date != "" &&
      typeof time != "undefined" &&
      time != ""
    ) {
      var _date = date.split("T")[0];
      var _datetime = _date + " " + time;
      query += ` LEFT JOIN 
                            (SELECT rs1.* FROM restaurant_seats AS rs1
                            LEFT JOIN
                                (SELECT * FROM restaurant_bookings AS rb1
                                WHERE (CONCAT(rb1.booking_date,' ', rb1.booking_time) <= DATE_ADD(?, INTERVAL 149 MINUTE) 
                                AND DATE_ADD(CONCAT(rb1.booking_date,' ', rb1.booking_time), INTERVAL 149 MINUTE) > ?) 
                                AND (rb1.status = 'pending' OR rb1.status = 'approved')) AS booked_seat 
                            ON booked_seat.rest_seat_id = rs1.id
                            WHERE  booked_seat.id IS NULL) AS av_s
                        ON av_s.restaurant_id = r.restaurant_id`;
      params.push(_datetime);
      params.push(_datetime);

      condition.push(`(r.open_time <= ? AND r.close_time >= ?)`);
      params.push(time);
      params.push(time);
      condition.push(`(r.block_date NOT LIKE ? OR r.block_date IS NULL)`);
      params.push("%" + _date + "%");

      if (typeof seatOpt != "undefined" && seatOpt != "") {
        var seatCond = [];
        for (let s of seatOpt) {
          seatCond.push(`(av_s.option=?)`);
          params.push(s);
        }

        if (seatCond.length > 0) {
          var _seatCond = `(` + seatCond.join(` OR `) + `)`;
          condition.push(_seatCond);
        }
      }
      if (typeof seatNum != "undefined" && seatNum != "") {
        condition.push(`av_s.seat_count >= ?`);
        params.push(seatNum);
      }
    }

    if (typeof area != "undefined" && area != "") {
      if (area == "Near By Me") {
        condition.push(`ROUND( 6353 * 2 * 
                    ASIN(SQRT( POWER(SIN((? - abs(r.lat)) * pi()/180 / 2),2) 
                  + COS(? * pi()/180 ) * COS( abs(r.lat) *  pi()/180) 
                  * POWER(SIN((? - r.lng) * pi()/180 / 2), 2) ))
                  , 2) < 10
                `);
        params.push(parseFloat(lat));
        params.push(parseFloat(lat));
        params.push(parseFloat(lng));
      } else {
        condition.push(`r.city LIKE ?`);
        params.push("%" + area + "%");
      }
    }

    if (typeof category != "undefined" && category != "") {
      condition.push(`r.food_types LIKE ?`);
      params.push("%" + category + "%");
    }

    if (typeof priceOpt != "undefined" && priceOpt != "") {
      // 15, 40,
      var pricecondition = [];
      if (priceOpt.indexOf("low") >= 0) {
        pricecondition.push(`(r.average_price < 15)`);
      }
      if (priceOpt.indexOf("medium") >= 0) {
        pricecondition.push(`(r.average_price >= 15 AND r.average_price < 40)`);
      }
      if (priceOpt.indexOf("high") >= 0) {
        pricecondition.push(`(r.average_price > 40)`);
      }
      if (pricecondition.length > 0) {
        var _pricecondition = `(` + pricecondition.join(` OR `) + `)`;
        condition.push(_pricecondition);
      }
    }

    // condition.push(`r.status = 'approved' `);

    // console.log("condition", condition);
    if (condition.length > 0) {
      query += ` WHERE  ` + condition.join(``);
    }

    query += ` GROUP BY r.restaurant_id`;

    const connection = makeDb();

    var totalRests = await connection.query(query, params);

    if (typeof sort != "undefined" && sort != "") {
      if (sort == "rating") {
        query += ` ORDER BY mark`;
      } else if (sort == "review") {
        query += ` ORDER BY count_review`;
      } else if (sort == "pricing") {
        query += ` ORDER BY average_price`;
      }
    } else {
      query += ` ORDER BY created_at`;
    }

    query += ` DESC LIMIT ?,?`;
    params.push(offset);
    params.push(pageSize);

    var rows = await connection.query(query, params);

    var data = {
      total: totalRests.length,
      rests: rows,
    };

    connection.close();
    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data fetched successfully",
      rests: data.rests,
      count: data.total,
    });
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error: err,
    });
  }
  return;
}

async function getRestData(req, res, next) {
  // async function ChangeAllSlug() {
  //   const connection = makeDb();
  //   const sqlQuery = `SELECT restaurant_id, title FROM restaurants`;
  //   let slugInject = await connection.query(sqlQuery);
  //   slugInject.forEach(async (element) => {

  //     let slugdata = element.title && element.title.toLowerCase().split(' ').join("-")
  //     console.log(slugdata)
  //     await connection.query(`UPDATE restaurants SET slug = ? WHERE restaurant_id = ?`,[slugdata,element.restaurant_id]);
  //   });
  // }
  // ChangeAllSlug();
  try {
    var { date, time, seatNum, seatOpt, flag, slug } = req.body;

    const connection = makeDb();
    var data = {},
      rest;

    if (flag == "first") {
    
      /** for the restaurant page */

      // var query = `SELECT r.restaurant_id, r.title, r.fulldescription, r.shortdescription, r.thumbnail, r.offer_menu, r.full_menu,
      //                   r.open_time, r.close_time, r.food_types,  r.average_price, r.block_date,
      //                   r.address1, r.address2, r.city, r.lat, r.lng,
      //                   rv.sum_mark, rv.count_review, cuisine.title as cuisine
      //                   FROM restaurants AS r
      //                   LEFT JOIN
      //                       (SELECT SUM(mark)/COUNT(id) AS sum_mark, COUNT(id) AS count_review, restaurant_id
      //                       FROM restaurant_reviews) AS rv
      //                       ON rv.restaurant_id = r.restaurant_id
      //                   LEFT JOIN cuisine_category AS cuisine ON cuisine.id = r.cuisine
      //                   WHERE r.restaurant_id = ? LIMIT 1`;
      // let isDataExists = await connection.query(
      //   "SELECT COUNT(*) as count FROM restaurants"
      // );
      var query = `SELECT restaurants.restaurant_id,restaurants_admin.package_id,restaurants_admin.full_access,restaurants.title, restaurants.fulldescription, restaurants.shortdescription, restaurants.thumbnail, restaurants.offer_menu, restaurants.full_menu,restaurants.slug,
                 restaurants.open_time,restaurants.close_time, restaurants.food_types, restaurants.average_price, restaurants.block_date,COUNT(restaurant_reviews.id) AS review_count, SUM(restaurant_reviews.mark) as ratings,
                 restaurants.address1, restaurants.address2, restaurants.city, restaurants.lat, restaurants.lng,cuisine.title as cuisine
                 FROM restaurants
                 LEFT JOIN restaurants_admin ON restaurants.res_admin_id = restaurants_admin.id
                 LEFT JOIN cuisine_category AS cuisine ON cuisine.id = restaurants.cuisine
                 LEFT JOIN restaurant_reviews ON  restaurants.restaurant_id = restaurant_reviews.restaurant_id WHERE  restaurants.slug = ?  LIMIT 1
                  `;
     
      rest = await connection.query(query,[slug]);
       
      let accesslist = [];
      if (rest[0].package_id) {
        let package_id = rest[0].package_id;
        let getAccessList = await connection.query(
          `SELECT access_list from subscription_package where id = ?`,
          [package_id]
        );

        if (getAccessList.length > 0 && getAccessList[0].access_list.length) {
          const filterIds = getAccessList[0].access_list.split(",");

          accesslist = await connection.query(
            `SELECT screen_name,slug,url,parent_screen,subscreen from access_lists where id in (?)`,[filterIds]
          );
        }
      }

      // console.log("RES:", rest);
      var images = await connection.query(
        `SELECT url as image, url as thumbImage FROM restaurant_image WHERE restaurant_id=?`,
        [rest[0].restaurant_id]
      );
      var seats = []; //await connection.query(`SELECT option, COUNT(option) FROM restaurant_seats WHERE restaurant_id=? GROUP BY option`, [rest_id]);
      var menus = await connection.query(
        "select * from restaurant_menus where restaurant_id = ?",
        [rest[0].restaurant_id]
      );

      // var review_query = `SELECT rv1.*, new_rv.*, c.first_name, c.last_name FROM restaurant_reviews AS rv1
      //                           LEFT JOIN (
      //                               SELECT COUNT(rv.customer_id) AS customer_reviews, MAX(rv.id) AS c_id
      //                               FROM  restaurant_reviews  AS rv
      //                               LEFT JOIN customers AS c ON c.id = rv.customer_id
      //                               GROUP BY rv.customer_id
      //                               ) AS new_rv ON new_rv.c_id = rv1.id
      //                           LEFT JOIN customers AS c ON c.id =  rv1.customer_id
      //                           WHERE c_id IS NOT NULL
      //                           AND rv1.restaurant_id=?`;
      var reviews_query = `SELECT restaurant_reviews.customer_id, customers.first_name,restaurant_reviews.booking_id,
      customers.last_name,restaurant_reviews.content,restaurant_reviews.mark AS Rating,restaurant_reviews.food_mark,restaurant_reviews.ambience_mark,restaurant_reviews.service_mark,restaurant_reviews.created_at from restaurant_reviews
      LEFT JOIN customers ON restaurant_reviews.customer_id = customers.id
      LEFT JOIN restaurants ON restaurants.restaurant_id = restaurant_reviews.restaurant_id
      WHERE restaurant_reviews.restaurant_id IS NOT NULL AND restaurants.restaurant_id IS NOT NULL AND restaurant_reviews.restaurant_id = ? ORDER BY created_at `;
      var reviews = await connection.query(reviews_query,[rest[0].restaurant_id]);
      /**end for the restaurant page */
      // delete rest[0].package_id;
      data = {
        rest: rest.length > 0 ? rest[0] : [],
        images: images,
        seats: seats,
        menus: menus,
        reviews: reviews,
        accesslist,
      };
    }

    var searchquery = `SELECT r.open_time, r.close_time, r.block_date, av_s.* FROM restaurants AS r`;

    var params = [];

    var condition = [];

    if (
      typeof date != "undefined" &&
      date != "" &&
      typeof time != "undefined" &&
      time != ""
    ) {
      var _date = date.split("T")[0];
      var _datetime = _date + " " + time;
      searchquery += ` LEFT JOIN 
                                (SELECT rs1.* FROM restaurant_seats AS rs1
                                LEFT JOIN
                                    (SELECT * FROM restaurant_bookings AS rb1
                                    WHERE (CONCAT(rb1.booking_date,' ', rb1.booking_time) <= DATE_ADD(?, INTERVAL 149 MINUTE) 
                                    AND DATE_ADD(CONCAT(rb1.booking_date,' ', rb1.booking_time), INTERVAL 149 MINUTE) > ?) 
                                    AND (rb1.status = 'pending' OR rb1.status = 'approved')) AS booked_seat 
                                ON booked_seat.rest_seat_id = rs1.id
                                WHERE booked_seat.id IS NULL) AS av_s
                            ON av_s.restaurant_id = r.restaurant_id`;
      params.push(_datetime);
      params.push(_datetime);

      condition.push(`(r.open_time <= ? AND r.close_time >= ?)`);
      params.push(time);
      params.push(time);
      condition.push(`(r.block_date NOT LIKE ? OR r.block_date IS NULL)`);
      params.push("%" + _date + "%");
    }

    if (typeof seatOpt != "undefined" && seatOpt != "") {
      condition.push(`(av_s.option=?)`);
      params.push(seatOpt);
    }
    if (typeof seatNum != "undefined" && seatNum != "") {
      condition.push(`av_s.seat_count >= ?`);
      params.push(seatNum);
    }

    condition.push(`r.slug = ?`);
    params.push(slug);

    condition.push(`r.status = 'approved'`);

    if (condition.length > 0) {
      searchquery += ` WHERE ` + condition.join(` AND `);
    }

    searchquery += " ORDER BY av_s.seat_count ASC LIMIT 1";

    var available = await connection.query(searchquery, params);

    data.one_av_seat = available;
    connection.close();
    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data fetched successfully",
      data,
    });
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error: err,
    });
  }
}

async function saveBooking(req, res, next) {
  try {
    var {
      seat_id,
      rest_id,
      first_name,
      customer_cat,
      last_name,
      email,
      password,
      date,
      time,
      person,
      UserId,
    } = req.body;
    var jsdate = new Date(date);

    const BookingDate = moment(jsdate).format("DD MMM");
    const connection = makeDb();
    let getRestaurantEmail = await connection.query(
      `SELECT email from restaurants LEFT JOIN restaurants_admin ON restaurants.res_admin_id = restaurants_admin.id where restaurant_id = ?`,[rest_id]
    );
    // let customerNames = await connection.query(
    //   `SELECT first_name,last_name,phone from customers c LEFT JOIN restaurant_bookings as rb ON rb.customer_id = c.id where restaurant_id = ${rest_id}`
    // );
    // console.log("hello", customerNames);

    var rows = await connection.query(`SELECT * from customers where email=?`, [
      email,
    ]);

    let name = "";
    var customer_id = null;
    if (customer_cat == "first") {
      // console.log;
      // var rows = await connection.query(
      //   `SELECT * from customers where email=?`,
      //   [email]
      // );
      if (rows && rows.length > 0) {
        res.status(400);
        res.json({
          statusCode: 400,
          message: "Email already is used!",
        });
        connection.close();
        return;
      }

      var hash_password = bcrypt.hashSync(password, saltRounds);
      let sql = `INSERT INTO customers (first_name, last_name, email, login_type, login_status, password) VALUES (?,?,?,?,?,?)`;
      let values = [first_name, last_name, email, "email", "on", hash_password];
      var result = await connection.query(sql, values);
      customer_id = result.insertId;
      name = first_name + " " + last_name;
    } else if (customer_cat == "ever" && UserId) {
      const sql = `SELECT id FROM customers where id = ?`;
      let customerData = await connection.query(sql,[UserId]);
      customer_id = customerData[0].id;
    } else if (customer_cat == "ever") {
      // var rows = await connection.query(
      //   `SELECT * from customers where email=?`,
      //   [email]
      // );

      if (!rows || rows.length == 0) {
        res.status(400);
        res.json({
          statusCode: 400,
          message: "You are not registered!",
        });
        connection.close();
        return;
      }

      if (!bcrypt.compareSync(password, rows[0].password)) {
        res.status(403);
        res.json({
          statusCode: 403,
          message: "Password is incorrect!",
        });
        connection.close();
        return;
      }

      customer_id = rows[0].id;
      name = rows[0].first_name + " " + rows[0].last_name;
    }

    let parseDate = moment(date, "MM-DD-YYYY").format();
    let bookingsql =
      "INSERT INTO restaurant_bookings (restaurant_id, customer_id, rest_seat_id, booking_date, booking_time, person_no, status) VALUES (?,?,?,?,?,?,?)";
    let bValues = [
      rest_id,
      customer_id,
      seat_id,
      parseDate,
      time,
      person,
      "pending",
    ];

    await connection.query(bookingsql, bValues);
    let templatePath = path.join(
      __dirname,
      "../views/email/restaurantEmail.ejs"
    );

    let options = {
      name,
      date: BookingDate,
      time: time,
      person: person,
      dashboardLink: `${connectionHost}/rest/booking`,
    };
    const data = await ejs.renderFile(templatePath, { options });
    const mailOptions = {
      from: "hello@dineouthalal.com",
      to: getRestaurantEmail[0].email,
      subject: `You have a new Booking`,
      html: data,
    };
    (() => {
      const result = transporter
        .sendMail(mailOptions)
        .then(console.log)
        .catch(console.error);

      // do something with `result` if needed
    })();

    connection.close();
    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data created successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error: err,
    });
  }
}
async function updateBooking(req, res, next) {
  try {
    let { seat_id, date, time, person } = req.body;
    // let parseDate = new Date(date).toISOString().split("T")[0];
    // parseDate.getTimezoneOffset()
    let parseDate = moment(date).format();
    const connection = makeDb();
    let colums = {
      query: `rest_seat_id = ${seat_id}
      ,person_no = ${person}
      ,booking_time = '${time}'
       ,booking_date = '${parseDate}'`,
    };

    let rows = await connection.query(
      `UPDATE restaurant_bookings SET ? WHERE id = ? `,[colums.query,req.params.id]
      // [seat_id, parseDate, time, person]
    );
    res.status(200);
    res.json({
      statusCode:200,
      message: "Data updated successfully",
    });
    connection.close();
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error: err,
    });
  }
}
async function registerSubscriber(req, res, next) {
  try {
    var { email } = req.body;
    if (!email || email == null) {
      res.status(404);
      res.json({
        statusCode: 404,
      });
    } else {
      const connection = makeDb();

      var rows = await connection.query(
        "select * from subscribers where email = ?",
        [email]
      );

      if (rows && rows.length > 0) {
        res.status(200);
        res.json({
          statusCode: 200,
          message: "User already subscribed",
        });
      } else {
        await connection.query(
          ` INSERT INTO subscribers (email) VALUES (?); `,
          [email]
        );
        connection.close();
        res.status(200);
        res.json({
          statusCode: 200,
          message: "Data created successfully",
        });
      }
    }
  } catch (err) {
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error: err,
    });
  }
}
async function getmetadatasingle(req, res) {
  const connection = makeDb();
  const { routername } = req.query;

  try {
    if (!routername || routername == null) {
      res.status(404);
      res.json({
        statusCode: 200,
        message: "Router name is missing !",
      });
    } else {
      const rows = await connection.query(
        `SELECT * FROM page_wise_meta WHERE route_name = ?`,
        [routername]
      );
      const totalcount = await connection.query(
        `SELECT COUNT(*) as count FROM page_wise_meta WHERE route_name = ?`,
        [routername]
      );
      res.status(200);
      res.json({
        statusCode: 200,
        message: "Data fetched successfully",
        rows,
        count: totalcount[0].count,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error: err,
    });
  }
  connection.close();
}
async function contact(req, res) {
  const { username, email, message, userType } = req.body;
  if (!username || !email || !userType) {
    // console.log(username, email, message, userType, "error");
    return res.status(500).json({ message: "All fields are required" });
  } else {
    let templatePath = path.join(__dirname, "../views/email/contactus.ejs");
    const options = {
      username,
      email,
      message,
      userType,
    };
    // console.log(username, email, message, userType);
    const data = await ejs.renderFile(templatePath, { options });
    const mailOptions = {
      from: "hello@dineouthalal.com",
      to: "hello@dineouthalal.com",
      subject: `contact us email`,
      html: data,
    };
    (() => {
      const result = transporter
        .sendMail(mailOptions)
        .then()
        .catch(console.error);

      // do something with `result` if needed
    })();
    res.status(200).json({
      statusCode: 200,
      message: "Your email has been sent successfully.",
    });
  }
}
