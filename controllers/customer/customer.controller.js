const { makeDb } = require("../../_helpers/db");
var ejs = require("ejs");
const path = require("path"); // Used for manipulation with path
const fs = require("fs-extra"); // Classic fs
const { environment } = require("../../env");
const { MulterImg, multer } = require("../.././_helpers/multer_settings");
const { transporter } = require("../../_helpers/email");
const Pictureuploadpath = "media/uploads/customer";
const ambassadorimgPath = "media/uploads/customer/ambassador";
fs.ensureDir(Pictureuploadpath);
fs.ensureDir(ambassadorimgPath);
module.exports = {
  ambassador,
  createProfile,
  updateProfile,
  getMe,
  needApprove,
  verifyCode,
  getUpComingBookings,
  getMypageInfoByUserId,
  saveReview,
  addRemovefavorite,
  bookSeat,
  updateCustomerProfile,
  getBooking,
};

function formatDate(date) {
  var d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}

async function getUpComingBookings(req, res, next) {
  try {
    var { user_id } = req.body;

    const connection = makeDb();
    var currentTime = "2021-02-26 17:48:37.470"; // new Date();

    var query = `SELECT CONCAT(rb.booking_date, ' ', rb.booking_time) AS _datetime, r.title AS rest_name FROM restaurant_bookings AS rb
        LEFT JOIN restaurants AS r ON r.restaurant_id = rb. restaurant_id 
        WHERE CONCAT(rb.booking_date, ' ', rb.booking_time) >= ? AND customer_id = ? LIMIT 3`;

    var rows = await connection.query(query, [currentTime, user_id]);

    connection.close();
    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data fetched successfully",
      rows,
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

async function getMypageInfo(req, res, connection, user_id) {
  try {
    // let _storage = await MulterImg(req, res, Pictureuploadpath);

    // const upload = multer({ storage: _storage }).single("profile_picture");

    // upload(req, res, async function () {
    //   if (req.file) {
    //     let imagePath = req.file.path
    //     let addBackSlashinImg = imagePath.replaceAll("\\", "\\\\");
    //     connection.query(

    //       `UPDATE customers SET avatar = '${addBackSlashinImg}' WHERE id = ${req.body.user_id}`
    //     );
    //   }
    // });

    var query = `SELECT rb.*, CONCAT(rb.booking_date, ' ', rb.booking_time) AS _datetime, 
        TIMEDIFF(CONCAT(rb.booking_date, ' ', rb.booking_time), NOW()) AS _diff, 
        DATEDIFF(NOW(), CONCAT(rb.booking_date, ' ', rb.booking_time)) AS _date_diff, 
        IF(TIMEDIFF(CONCAT(rb.booking_date, ' ', rb.booking_time), NOW()) > '00:00:00','false','true') as _diff_v, r.main_logo, 
        r.food_types, cc.title as cuisine,r.country,r.state,r.city,
        r.title AS rest_name, rv.mark, rv.food_mark, rv.ambience_mark, rv.service_mark, rv.content, rv.created_at as review_time, rs.option AS seat_type,email
        FROM restaurant_bookings AS rb
        LEFT JOIN restaurants AS r ON r.restaurant_id = rb. restaurant_id 
        LEFT JOIN restaurant_reviews AS rv ON rv.booking_id = rb.id 
        LEFT JOIN cuisine_category AS cc ON cc.id = r.cuisine
        LEFT JOIN restaurants_admin ON r.res_admin_id = restaurants_admin.id
        LEFT JOIN restaurant_seats AS rs ON rb.rest_seat_id = rs.id
        WHERE rb.customer_id = ? ORDER BY CONCAT(rb.booking_date, ' ', rb.booking_time) DESC`;

    var bookings = await connection.query(query, [user_id]);

    var favoritequery = `SELECT r.*, rv.*
        FROM customer_favorite AS cf
        LEFT JOIN restaurants AS r ON r.restaurant_id = cf.restaurant_id
        LEFT JOIN 
        (SELECT 
        SUM(mark)/COUNT(id) AS sum_mark, COUNT(id) AS count_review, restaurant_id AS rest_id 
        FROM restaurant_reviews) AS rv 
        ON rv.rest_id = r.restaurant_id
        WHERE cf.customer_id = ?`;

    var favorite = await connection.query(favoritequery, [user_id]);

    var data = {
      bookings: bookings,
      favorites: favorite,
    };

    return data;
  } catch (err) {
    
    return "err";
  }
}

async function updateCustomerProfile(req, res, next) {
  try {
    const connection = makeDb();

    let _storage = await MulterImg(req, res, Pictureuploadpath);

    const upload = multer({ storage: _storage }).single("profile_picture");

    upload(req, res, async function () {
      let { user_id } = req.body;

      if (req.file) {
        let imagePath = req.file.path;
        let addBackSlashinImg = imagePath.split("\\").join("\\\\");

        connection.query(
          `UPDATE customers SET avatar = '${addBackSlashinImg}' WHERE id = ?`,[user_id]
        );
      }

      let customer = await connection.query(
        `SELECT * from customers WHERE id = ?`,[user_id]
      );

      connection.close();

      res.status(200);
      res.json({
        statusCode: 200,
        message: "Data updated successfully",
        customer,
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error:err
    });
  }
}

async function getMypageInfoByUserId(req, res, next) {
  try {
    var { user_id } = req.body;

    const connection = makeDb();

    var data = await getMypageInfo(req, res, connection, user_id);

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
async function getBooking(req, res) {
  try {
    var { id } = req.params;
    const connection = makeDb();
    var query = `SELECT rb.*, CONCAT(rb.booking_date, ' ', rb.booking_time) AS _datetime, 
        TIMEDIFF(CONCAT(rb.booking_date, ' ', rb.booking_time), NOW()) AS _diff, 
        DATEDIFF(NOW(), CONCAT(rb.booking_date, ' ', rb.booking_time)) AS _date_diff, 
        IF(TIMEDIFF(CONCAT(rb.booking_date, ' ', rb.booking_time), NOW()) > '00:00:00','false','true') as _diff_v, r.main_logo, 
        r.food_types, cc.title as cuisine,r.country,r.state,r.city,
        r.title AS rest_name, rv.mark, rv.food_mark, rv.ambience_mark, rv.service_mark, rv.content, rv.created_at as review_time, rs.option AS seat_type, restaurants_admin.email
        FROM restaurant_bookings AS rb
        LEFT JOIN restaurants AS r ON r.restaurant_id = rb.restaurant_id 
        LEFT JOIN restaurant_reviews AS rv ON rv.booking_id = rb.id 
        LEFT JOIN cuisine_category AS cc ON cc.id = r.cuisine
        LEFT JOIN restaurants_admin ON r.res_admin_id = restaurants_admin.id
        LEFT JOIN restaurant_seats AS rs ON rb.rest_seat_id = rs.id
        WHERE rb.id = ? AND rb.customer_id = ? ORDER BY CONCAT(rb.booking_date, ' ', rb.booking_time) DESC`;

    var bookings = await connection.query(query, [id,req.user.sub]);

    // var favoritequery = `SELECT r.*, rv.*
    //     FROM customer_favorite AS cf
    //     LEFT JOIN restaurants AS r ON r.restaurant_id = cf.restaurant_id
    //     LEFT JOIN
    //     (SELECT
    //     SUM(mark)/COUNT(id) AS sum_mark, COUNT(id) AS count_review, restaurant_id AS rest_id
    //     FROM restaurant_reviews) AS rv
    //     ON rv.rest_id = r.restaurant_id
    //     WHERE r.restaurant_id = ?`;

    // var favorite = await connection.query(favoritequery, [user_id]);

    var data = {
      bookings: bookings,
      // favorites: favorite,
    };

    res.json({
      statusCode:200,
      message:"Data fetched successfully",
      data});
  } catch (err) {
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error:err
    });
    return
  }
}

async function addRemovefavorite(req, res, next) {
  try {
    var { user_id, rest_id, flag } = req.body;

    const connection = makeDb();

    if (flag == "add") {
      var query = `INSERT INTO customer_favorite (customer_id, restaurant_id) VALUES (?, ?)`;
      var fav = await connection.query(
        `select * from customer_favorite where customer_id = ? and restaurant_id = ?`,
        [user_id, rest_id]
      );
      if (fav.length > 0) {
        query = "";
      }
    } else if (flag == "remove") {
      var query = `DELETE FROM customer_favorite WHERE customer_id = ? AND restaurant_id = ?`;
    }

    if (query != "") {
      var result = connection.query(query, [user_id, rest_id]);
    }

    var data = await getMypageInfo(req, res, connection, user_id);

    connection.close();

    res.status(204);
    res.json({
      statusCode:204,
      message:"Data deleted successfully",
      data});
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error:err
    });
  }
}

async function saveReview(req, res, next) {
  try {
    var {
      ambience_mark,
      content,
      food_mark,
      mark,
      rest_id,
      service_mark,
      user_id,
      booking_id,
    } = req.body;
    const connection = makeDb();

    var selecQuery = `select * from restaurant_reviews where customer_id = ? and booking_id = ? and  restaurant_id = ?`;
    var oldreview = await connection.query(selecQuery, [
      user_id,
      booking_id,
      rest_id,
    ]);

    if (!oldreview || oldreview.length <= 0) {
      var query = `INSERT INTO restaurant_reviews (customer_id, booking_id, restaurant_id, mark, food_mark, ambience_mark, service_mark, content) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      var result = connection.query(query, [
        user_id,
        booking_id,
        rest_id,
        mark,
        food_mark,
        ambience_mark,
        service_mark,
        content,
      ]);
    }

    var data = await getMypageInfo(req, res, connection, user_id);

    connection.close();

    res.status(201);
    res.json({
      statusCode:201,
      message:"Data created successfully",
      data});
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error:err
    });
  }
}

async function bookSeat(req, res, next) {
  try {
    const connection = makeDb();
    var { rest_id, userid, seat_id, date, time, person } = req.body;

    let bookingsql =
      "INSERT INTO restaurant_bookings (restaurant_id, customer_id, rest_seat_id,option,booking_date, booking_time, person_no, status) VALUES (?,?,?,?,?,?,?,?)";
    let bValues = [rest_id, userid, seat_id, date, time, person, "pending"];
    let b_result = await connection.query(bookingsql, bValues);

    connection.close();

    res.status(201);
    res.json({
      statusCode:201,
      message:"Data created successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error:err
    });
  }
}

async function createProfile(req, res, next) {
  const user = await _createProfile(req.body);
  if (user.message !== undefined) {
    res.status(404);
    res.json(user);
  } else {
    res.status(200);
    res.json(user);
  }
}
async function ambassador(req, res, next) {

  const connection = makeDb();

  let _storage = await MulterImg(req, res, ambassadorimgPath);
  const upload = multer({ storage: _storage }).single("file");

  upload(req, res, async function () {
    let { name, email, socialurl, description } = req.body;
    if (
      name == undefined || name == "" || name == null ||
      email == undefined || email == "" || email == null ||
      socialurl == undefined || socialurl == "" || socialurl == null ||
      description == undefined || description == "" || description == null
    ) {
      return res.status(400).json({
        statusCode: 400,
        message: "All fields are required",
      });
    } else {
      if (req.file) {
        // console.log(req.file);
        let imagePath = req.file.path;
        let addBackSlashinImg = imagePath.split("\\").join("\\\\");

        connection.query(
          `INSERT INTO ambassador (name,email,socialmediaurl,description,file) VALUES(?,?,?,?,?)`,[name, email, socialurl, description,addBackSlashinImg]
        );
      } else {
        connection.query(
          `INSERT INTO ambassador (name,email,socialmediaurl,description,file) VALUES(?,?,?,?,'')`,[name, email, socialurl, description]
        );
        connection.close();
      }
    }

    let templatePath = path.join(__dirname, "../../views/email/ambassador.ejs");
    let options = {
      name: name,
      email: email,
      social: socialurl,
      description: description,
    };
    const data = await ejs.renderFile(templatePath, { options });

    const mailOptions = {
      from: "hello@dineouthalal.com",
      to: "hello@dineouthalal.com",
      subject: `Dineout halal foods ambassador`,
      html: data,
    };
    (() => {
      const result = transporter
        .sendMail(mailOptions)
        .then(console.log)
        .catch(console.error);

      // do something with `result` if needed
    })();
    res.status(200).json({
      statusCode: 200,
      message: "Data created successfully",
    });
  });
}
async function _createProfile(data) {
  try {
    // var res = await insertCreator(email, password);
    const connection = makeDb();
    var {
      userid,
      firstname,
      lastname,
      operate_type,
      businessname,
      minprice,
      maxprice,
      building,
      fulladdress,
      street,
      postalcode,
      weburl,
      instagramurl,
      linkedin,
      behance,
      services,
    } = data;
    services = services.join(",");
    // update creator row
    var rows = await connection.query(
      `UPDATE restaurants SET first_name = ?, last_name = ? WHERE id = ?`,
      [firstname, lastname, userid]
    );

    var rows = await connection.query(
      `SELECT * from restaurant_profile where creator_id=?`,
      userid
    );
    if (rows && rows.length > 0) {
      // update creator_profile row
      var rows = await connection.query(
        `UPDATE restaurant_profile SET 
            operate_type = ?
            , businessname = ?
            , min_price = ?
            , max_price = ?
            , building = ?
            , fulladdress = ?
            , street = ?
            , postalcode = ?
            , weburl = ?
            , instagramurl = ?
            , linkedin = ?
            , behance = ?
            , services = ?
             WHERE creator_id = ?`,
        [
          operate_type,
          businessname,
          minprice,
          maxprice,
          building,
          fulladdress,
          street,
          postalcode,
          weburl,
          instagramurl,
          linkedin,
          behance,
          services,
          userid,
        ]
      );
      return { success: "success" };
    }

    let sql = `INSERT INTO restaurant_profile (
            creator_id, 
            operate_type, 
            businessname, 
            min_price, 
            max_price, 
            building, 
            fulladdress, 
            street, 
            postalcode, 
            weburl, 
            instagramurl, 
            linkedin, 
            behance, 
            services) 
        VALUES (?)`;
    let values = [
      userid,
      operate_type,
      businessname,
      minprice,
      maxprice,
      building,
      fulladdress,
      street,
      postalcode,
      weburl,
      instagramurl,
      linkedin,
      behance,
      services,
    ];

    var result = await connection.query(sql, [values]);

    connection.close();

    if (result) {
      return { message: "success" };
    } else {
      return { message: "Internal server error" };
    }
  } catch (err) {
    console.log(err);
    return { 
      statusCode:500,
      message: "Internal error",
      error:err
    };
  }
}

async function updateProfile(req, res, next) {
  try {
    // update creator table.
    const connection = makeDb();
    var rows = await connection.query(
      `UPDATE restaurants SET first_name = ?, last_name = ?, phone = ? WHERE id = ?`,
      [req.body.first_name, req.body.last_name, req.body.phone, req.body.cid]
    );

    var rows = await connection.query(
      `SELECT * from restaurant_profile where creator_id=?`,
      req.body.cid
    );
    if (rows && rows.length > 0) {
      // update creator_profile row
      var rows = await connection.query(
        `UPDATE restaurant_profile SET 
            operate_type = ?
            , businessname = ?
            , birthday = ?
            , min_price = ?
            , max_price = ?
            , building = ?
            , fulladdress = ?
            , street = ?
            , postalcode = ?
            , weburl = ?
            , instagramurl = ?
            , linkedin = ?
            , behance = ?
            , services = ?
             WHERE creator_id = ?`,
        [
          req.body.operate_type,
          req.body.businessname,
          req.body.birthday,
          req.body.minprice,
          req.body.maxprice,
          req.body.building,
          req.body.fulladdress,
          req.body.street,
          req.body.postalcode,
          req.body.weburl,
          req.body.instagramurl,
          req.body.linkedin,
          req.body.behance,
          req.body.services,
          req.body.cid,
        ]
      );
    } else {
      let sql = `INSERT INTO restaurant_profile (
                creator_id, 
                operate_type, 
                businessname, 
                birthday, 
                min_price, 
                max_price, 
                building, 
                fulladdress, 
                street, 
                postalcode, 
                weburl, 
                instagramurl, 
                linkedin, 
                behance, 
                services) 
            VALUES (?)`;
      let values = [
        req.body.cid,
        req.body.operate_type,
        req.body.businessname,
        req.body.birthday,
        req.body.minprice,
        req.body.maxprice,
        req.body.building,
        req.body.fulladdress,
        req.body.street,
        req.body.postalcode,
        req.body.weburl,
        req.body.instagramurl,
        req.body.linkedin,
        req.body.behance,
        req.body.services,
      ];

      var rows = await connection.query(sql, [values]);
    }

    connection.close();

    if (rows) {
      res.status(200);
      res.json({ code: "success" });
    } else {
      res.status(404);
      res.json({ 
        statusCode:404,
        message: "Internel error",
        error:err
      });
    }
  } catch (err) {
    res.status(404);
    res.json({ 
      statusCode:404,
      message: "Internal Error!",
      error:err
    });
  }
}

async function getMe(req, res, next) {
  try {
    var userid = req.body.userid;
    // update creator table.
    const connection = makeDb();
    var rows = await connection.query(
      `SELECT *, c.id as cid from customers as c left join customers_profile as cp on c.id=cp.customer_id where c.id=?`,
      [userid]
    );

    connection.close();

    if (rows && rows.length > 0) {
      var user = rows[0];
      res.status(200);
      res.json(user);
    } else {
      res.status(404);
      res.json({ message: "Can not find user!" });
    }
  } catch (err) {
    res.status(404);
    res.json({ 
      statusCode:404,
      message: "Internal Error!",
      error:err
    });
  }
}

async function needApprove(req, res, next) {
  var { userid } = req.body;
  await createNeedApproveAdminNotification(userid);
  res.status(200);
  res.json({ success: "success" });
}

async function verifyCode(req, res, next) {
  var { userid, code } = req.body;
  const connection = makeDb();
  var rows = await connection.query(
    `select * from verify_code where creator_id=? and code=?`,
    [userid, code]
  );
  if (rows && rows.length > 0) {
    await connection.query(
      `update restaurants set confirm_approved=1 where id=?`,
      [userid]
    );
    await connection.query(`delete from verify_code where creator_id=?`, [
      userid,
    ]);

    res.status(200);
    res.json({ code: "success" });
  } else {
    res.status(405);
    res.json({ message: "Code is not correct" });
  }
  connection.close();
}

function omitPassword(user) {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

function makeid(length = 10) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}
