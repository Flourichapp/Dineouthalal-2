const { makeDb } = require("../../_helpers/db");
const path = require("path"); // Used for manipulation with path
const fs = require("fs-extra"); // Classic fs
const { environment } = require("../../env");
const multer = require("multer");
const { MulterImg } = require("../.././_helpers/multer_settings");
const { createLog } = require("../../_helpers/activityLog");
// const { element } = require('protractor');
// const { time } = require('console');
// const { reverse } = require('dns');
const bcrypt = require("bcrypt");
// const { connect } = require('../../routes/landing.route');
const express = require("express");
const app = express();
const bodyparser = require("body-parser");
const { error } = require("console");
const { slugFilter } = require("../../_helpers/slugFilter");

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
const saltRounds = 10;

const restaurantuploadpath = "media/uploads/restaurant/";
// const restaurantuploadfullPath = path.join(
//   __dirname,
//   `./../../${environment}/${restaurantuploadpath}`
// ); // Register the upload path

const carduploadpath = "media/uploads/card/";
// const carduploadfullPath = path.join(
//   __dirname,
//   `./../../${environment}/${carduploadpath}`
// ); // Register the upload path

const avataruploadpath = "media/uploads/avatar/";
// const avataruploadfullPath = path.join(
//   __dirname,
//   `./../../${environment}/${avataruploadpath}`
// ); // Register the upload path

const portfoliouploadpath = "media/uploads/portfolio/";
// const portfoliouploadfullPath = path.join(
//   __dirname,
//   `./../../${environment}/${portfoliouploadpath}`
// ); // Register the upload path

const restMenuPath = "media/uploads/restaurant/menus";
const restFilePath = "media/uploads/restaurant/menus/pdfFiles";
// const restMenuFullPath = path.join(
//   __dirname,
//   `./../../${environment}/${restMenuPath}`
// ); // Register the upload path

const avatarpath = "media/uploads/restaurant/avatar";
// const avatarfullpath = path.join(
//   __dirname,
//   `./../../${environment}/${avatarpath}`
// ); // Register the upload path

fs.ensureDir(carduploadpath); // Make sure that he upload path exits
fs.ensureDir(avataruploadpath); // Make sure that he upload path exits
fs.ensureDir(portfoliouploadpath); // Make sure that he upload path exits
fs.ensureDir(restFilePath);
fs.ensureDir(restaurantuploadpath); // Make sure that he upload path exits
fs.ensureDir(avatarpath); // Make sure that he upload path exits
fs.ensureDir(restMenuPath); // Make sure that he upload path exits

module.exports = {
  getDashboardData,
  updateSetting,
  getSetting,
  uploadThumbnail,
  deleteThumbnail,
  updateSettingAddress,
  uploadSettingMenu,
  deleteFullMenu,
  uploadgallaryimg,
  deleteGallaryImg,
  uploadGallaries,
  updateOfferMenu,
  getRestSeats,
  updateRestSeats,
  updateDateTimeInfo,
  getRestInfoByUserId,
  addNewRest,
  getTotalReviews,
  updateProfile,
  getMenu,
  addMenu,
  updateMenu,
  deleteMenu,
  uploadFile,
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

async function getDashboardData(req, res, next) {
  try {
    var { rest_id } = req.body;
    const connection = makeDb();

    var today = formatDate(new Date());
    var labels = [];

    for (var i = -7; i < 7; i++) {
      var _days_before = formatDate(
        new Date(new Date().getTime() + i * 24 * 60 * 60 * 1000)
      );
      labels.push(_days_before);
    }

    var booking_created_query = `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS booking_created,
        COUNT(id) AS booking_count
        FROM restaurant_bookings
        WHERE restaurant_id = ? AND DATE(created_at) >= ? AND DATE(created_at) <= ?
        GROUP BY
        YEAR(created_at), MONTH(created_at), DATE(created_at)`;
    var booking_created = await connection.query(booking_created_query, [
      rest_id,
      labels[0],
      labels[labels.length - 1],
    ]);
    // console.log(rest_id)
    var booking_created_arr = [];

    if (booking_created && booking_created.length > 0) {
      labels.forEach((l) => {
        var _booking = booking_created.filter((b) => {
          if (b.booking_created == l) return b;
        });
        if (_booking.length > 0) {
          booking_created_arr.push(_booking[0].booking_count);
        } else {
          booking_created_arr.push(0);
        }
      });
    } else {
      labels.forEach((l) => {
        booking_created_arr.push(0);
      });
    }

    var daily_booking_query = `SELECT DATE_FORMAT(booking_date, '%Y-%m-%d') as booking_date,COUNT(id) AS booking_count
                                    FROM restaurant_bookings
                                    WHERE restaurant_id = ? AND DATE(booking_date) >= ? AND DATE(booking_date) <= ?
                                    GROUP BY
                                    YEAR(booking_date), MONTH(booking_date), DATE(booking_date)`;

    var daily_booking = await connection.query(daily_booking_query, [
      rest_id,
      labels[0],
      labels[labels.length - 1],
    ]);

    var daily_booking_arr = [];

    if (daily_booking && daily_booking.length > 0) {
      labels.forEach((l) => {
        var _booking = daily_booking.filter((b) => {
          if (b.booking_date == l) return b;
        });
        if (_booking.length > 0) {
          daily_booking_arr.push(_booking[0].booking_count);
        } else {
          daily_booking_arr.push(0);
        }
      });
    } else {
      labels.forEach((l) => {
        daily_booking_arr.push(0);
      });
    }

    var today_Booking = await connection.query(
      `SELECT * FROM restaurant_bookings AS b WHERE b.booking_date = ?`,
      today
    );

    var today_customers = await connection.query(
      `SELECT *
        FROM restaurant_bookings AS rb 
        WHERE DATE(created_at) = ?
        AND restaurant_id = ?
        GROUP BY customer_id`,
      [today, rest_id]
    );

    var today_reviews = await connection.query(
      `SELECT *
        FROM restaurant_reviews AS rv
        WHERE DATE(created_at) = ?
        AND restaurant_id = ?`,
      [today, rest_id]
    );

    var reviews = await connection.query(
      `SELECT rv.mark, CONCAT(c.first_name, ' ', last_name) AS c_name, rv.content,
        DATE_FORMAT(rv.created_at, "%Y-%m-%d") AS created,
        FLOOR(HOUR(TIMEDIFF(NOW(),rv.created_at)) / 24) AS diff_day,
        MOD(HOUR(TIMEDIFF(NOW(),rv.created_at)), 24) AS diff_hour,
        MINUTE(TIMEDIFF(NOW(),rv.created_at)) AS diff_minute
        FROM restaurant_reviews AS rv
        LEFT JOIN customers AS c
        ON c.id = rv.customer_id        
        WHERE rv.restaurant_id = ? ORDER BY rv.created_at DESC LIMIT 5`,
      rest_id
    );

    var bookings = await connection.query(
      `SELECT rb.id, DATE_FORMAT(rb.booking_date, '%Y-%m-%d') as booking_date, rb.booking_time, rb.person_no, 
        CONCAT(c.first_name, ' ', last_name) AS c_name, 
        DATE_FORMAT(rb.created_at, "%Y-%m-%d") AS created,
        rs.table_no, rs.seat_count, rs.option
        FROM restaurant_bookings AS rb
        LEFT JOIN customers AS c
        ON c.id = rb.customer_id
        LEFT JOIN restaurant_seats AS rs
        ON rs.id = rb.rest_seat_id
        WHERE rb.restaurant_id = ? ORDER BY rb.booking_date DESC, rb.created_at DESC LIMIT 5`,
      rest_id
    );

    var gallaries = await connection.query(
      `SELECT * FROM restaurant_image
        WHERE restaurant_id = ? ORDER BY RAND() LIMIT 4`,
      rest_id
    );

    var rest = await connection.query(
      `SELECT * FROM restaurants WHERE restaurant_id = ?`,
      rest_id
    );

    var data = {
      daterange: labels,
      booking_created: booking_created_arr,
      daily_booking: daily_booking_arr,
      today_booking: today_Booking.length,
      today_customers: today_customers.length,
      today_reviews: today_reviews.length,
      reviews: reviews,
      bookings: bookings,
      gallaries: gallaries,
      rest: rest,
    };

    connection.close();

    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data fetched successfully",
      data,
    });
    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error: err,
    });
    return;
  }
}

async function getTotalReviews(req, res, next) {
  try {
    var { rest_id, pageIndex, pageSize } = req.body;
    const connection = makeDb();

    var offset = parseInt(pageSize) * parseInt(pageIndex);
    var totalReviews = await connection.query(
      `SELECT * FROM restaurant_reviews WHERE restaurant_id = ?`,
      rest_id
    );

    var reviews = await connection.query(
      `SELECT rv.mark, CONCAT(c.first_name, ' ', last_name) AS c_name, rv.content,
        DATE_FORMAT(rv.created_at, "%Y-%m-%d") AS created,
        rv.food_mark, rv.ambience_mark, rv.service_mark,
        FLOOR(HOUR(TIMEDIFF(NOW(),rv.created_at)) / 24) AS diff_day,
        MOD(HOUR(TIMEDIFF(NOW(),rv.created_at)), 24) AS diff_hour,
        MINUTE(TIMEDIFF(NOW(),rv.created_at)) AS diff_minute
        FROM restaurant_reviews AS rv
        LEFT JOIN customers AS c
        ON c.id = rv.customer_id        
        WHERE rv.restaurant_id = ? ORDER BY rv.created_at DESC LIMIT ?, ?`,
      [rest_id, offset, pageSize]
    );

    var data = {
      reviews: reviews,
      totalReview: totalReviews.length,
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

async function getRestInfoByUserId(req, res, next) {
  try {
    var { user_id } = req.body;
    const connection = makeDb();
    var rests = await connection.query(
      `SELECT r.res_admin_id , r.restaurant_id, r.title, r.status, r.main_logo, r.plan_flag
    from restaurants as r where r.res_admin_id=?`,
      user_id
    );

    connection.close();
    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data fetched successfully",
      rests,
    });
    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error: err,
    });
    return;
  }
}

async function addNewRest(req, res, next) {
  try {
    var { user_id } = req.body;

    const connection = makeDb();

    var rest = await connection.query(
      `INSERT INTO restaurants (title) VALUES ('unknown')`
    );
    await connection.query(
      `INSERT INTO restaurant_user_id (restaurant_id, user_id) VALUES (?, ?)`,
      [rest.insertId, user_id]
    );

    var rests = await connection.query(
      `SELECT r.restaurant_id, r.title, r.paid_date, r.status, r.main_logo   
        from restaurant_user_id as ru left Join restaurants as r on r.restaurant_id = ru.restaurant_id where ru.user_id=?`,
      user_id
    );
    connection.close();

    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data created successfully",
      rests: rests,
      rest_id: rest.insertId,
    });
    return;
  } catch (err) {
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error: err,
    });
    return;
  }
}

async function getSetting(req, res, next) {
  try {
    const connection = makeDb();
    var { restaurant_id } = req.body;
    // firsttab
    var profile = null;
    var rows = await connection.query(
      `SELECT * from restaurants where restaurant_id=?`,
      restaurant_id
    );
    var data = {};
    if (rows && rows.length > 0) {
      profile = rows[0];
      var firsttab = {};
      firsttab.title = profile.title;
      firsttab.shortdescription = profile.shortdescription;
      firsttab.fulldescription = profile.fulldescription;
      firsttab.thumbnail = profile.thumbnail;
      firsttab.average_price = profile.average_price;
      firsttab.food_types = JSON.parse(profile.food_types);
      firsttab.mainlogo = profile.main_logo;
      firsttab.cuisine = profile.cuisine;
      data.firsttab = firsttab;
    }

    // images
    var images = await connection.query(
      `select * from restaurant_image where restaurant_id=?`,
      [restaurant_id]
    );
    connection.close();

    // information
    var information = {};
    // - venue

    // minage
    if (profile) {
      information.minage = profile.minage;
      information.budget = profile.budget;
      information.covid = profile.covid;
    }

    // get address
    var address = {};
    var menu = {};
    var timeinfo = {};
    if (profile) {
      address.city = profile.city;
      address.country = profile.country;
      address.state = profile.state;
      address.address1 = profile.address1;
      address.address2 = profile.address2;
      address.postalcode = profile.postalcode;
      address.lat = profile.lat;
      address.lng = profile.lng;

      menu.offermenu = profile.offer_menu;
      menu.fullmenu = profile.full_menu;

      timeinfo.open_time = profile.open_time;
      timeinfo.close_time = profile.close_time;
      timeinfo.block_date = profile.block_date;
    }

    data.images = images;
    data.information = information;
    data.address = address;
    data.menu = menu;
    data.timeinfo = timeinfo;

    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data fetched successfully",
      data,
    });

    return;
  } catch (err) {
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error: err,
    });
    return;
  }
}

async function updateSetting(req, res, next) {
  try {
    const connection = makeDb();
    var { restaurant_id } = req.body;

    var rows = await connection.query(
      `SELECT * from restaurants where restaurant_id=?`,
      restaurant_id
    );
    var rows2 = await connection.query(
      `SELECT * from restaurants LEFT JOIN restaurants_admin ON restaurants_admin.id = restaurants.res_admin_id  where restaurant_id=?`,
      restaurant_id
    );

    var {
      title,
      shortdescription,
      fulldescription,
      food_types,
      average_price,
      cuisine,
    } = req.body;
    var slug = await slugFilter(title)
    if (rows && rows.length > 0) {
      await connection.query(
        `UPDATE restaurants SET title= ?, shortdescription = ?, fulldescription = ?, food_types=?, average_price=?, cuisine=? , slug=? WHERE restaurant_id = ?`,
        [
          title,
          shortdescription,
          fulldescription,
          food_types,
          average_price,
          cuisine,
          slug,
          restaurant_id,
        ]
      );
    }
    connection.close();
    createLog(
      "Added description",
      "[POST] @Update restaurant settings",
      "",
      "restaurant_admin",
      rows2[0].id,
      rows2[0].first_name,
      req
    );
    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data updated successfully",
    });

    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error: err,
    });
    return;
  }
}

//this is for uploading file by using multer for ONLY SINGLE FILE
async function uploadSettingImage(req, res, next) {
  try {
    const _Storage = multer.diskStorage({
      destination(req, file, callback) {
        callback(null, restaurantuploadfullPath);
      },
      filename(req, file, callback) {
        callback(null, `${Date.now()}_${file.originalname}`);
      },
    });

    const upload = multer({ storage: _Storage }).single("media");

    upload(req, res, async function (err) {
      var { restaurant_id } = req.body;
      var filename = req.file.filename;
      var _storyurl = path.join(restaurantuploadpath, `/${restaurant_id}`);
      var storyurl = path.join(_storyurl, filename);

      var _fullpath = path.join(restaurantuploadpath, `/${restaurant_id}`);
      fs.ensureDir(_fullpath);

      var file = req.file;
      var file_name = file.filename;
      var temp_path = file.path;

      fs.renameSync(temp_path, path.join(_fullpath, `/${file_name}`));

      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        res.status(404);
        res.json({ message: "A Multer error occurred when uploading." });
      } else if (err) {
        // An unknown error occurred when uploading.
        res.status(404);
        res.json({ message: "unknown error occurred when uploading error" });
      }
      const connection = makeDb();
      await connection.query(
        `INSERT INTO restaurant_image (restaurant_id, url) VALUES (?, ?)`,
        [restaurant_id, storyurl]
      );
      var rows = await connection.query(
        `select * from restaurant_image where restaurant_id=? and url=?`,
        [restaurant_id, storyurl]
      );
      connection.close();

      if (rows && rows.length > 0) {
        var image = rows[0];
        res.status(200);
        res.json(image);
      } else {
        res.status(400);
        res.json({ message: "Internel error" });
      }
    });
  } catch (err) {
    res.status(404);
    res.json({
      statusCode: 404,
      message: "Internal Error!",
      error: err,
    });
  }
}

async function uploadThumbnail(req, res, next) {
  try {
    var { restaurant_id, media } = req.body;

    var base64Data = media.replace(/^data:image\/png;base64,/, "");
    var _storyurl = path.join(restaurantuploadpath, `/${restaurant_id}`);
    var filename = `/thumbnail_${Date.now()}.png`;

    var storyurl = path.join(_storyurl, filename);

    var _fullpath = path.join(restaurantuploadpath, `/${restaurant_id}`);
    fs.ensureDir(_fullpath);

    fs.writeFile(_fullpath + filename, base64Data, "base64", function (err) {});

    const connection = makeDb();
    await connection.query(
      `UPDATE restaurants SET thumbnail = ? WHERE restaurant_id = ?`,
      [storyurl, restaurant_id]
    );
    const rows = await connection.query(
      `SELECT * from restaurants LEFT JOIN restaurants_admin ON restaurants_admin.id = restaurants.res_admin_id  WHERE restaurant_id = ? `,
      [restaurant_id]
    );
    connection.close();
    createLog(
      "Added Restaurant image",
      `[POST] ${rows[0].title}@restaurant image added Successfully`,
      "",
      "restaurant_admin",
      rows[0].id,
      rows[0].first_name + rows[0].last_name,
      req
    );
    res.status(200);
    res.json({
      statusCode: 201,
      message: "Data created successfully",
      storyurl,
    });
  } catch (err) {
    console.log(err);
    createLog(
      "Added Restaurant image",
      `[POST] ${rows[0].title}@restaurant image added failed`,
      "",
      "restaurant_admin",
      rows[0].id,
      rows[0].first_name + rows[0].last_name,
      req
    );
    res.status(404);
    res.json({
      statusCode: 404,
      message: "Internal Error!",
      error: err,
    });
  }
}

async function deleteThumbnail(req, res, next) {
  try {
    var { rest_id, filename, kind } = req.body;

    const connection = makeDb();

    var _fullpath = path.join(restaurantuploadpath, `/${rest_id}`);
    fs.unlink(_fullpath + "/" + filename);

    if (kind == "mainlogo") {
      await connection.query(
        `UPDATE restaurants SET main_logo = ? WHERE restaurant_id = ?`,
        ["media/static/no-img.png", rest_id]
      );
    } else {
      await connection.query(
        `UPDATE restaurants SET thumbnail = ? WHERE restaurant_id = ?`,
        ["media/static/no-img.png", rest_id]
      );
    }

    connection.close();

    res.status(204);
    res.json({
      statusCode: 204,
      message: "Data deleted successfully",
    });

    return;
  } catch (err) {
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error: err,
    });
    return;
  }
}

async function uploadgallaryimg(req, res, next) {
  try {
    let { restaurant_id, media, kind } = req.body;
    // console.log(restaurant_id, media, kind)

    if (kind == "gallary") {
      var base64Data = media.replace(/^data:image\/png;base64,/, "");
      var _storyurl = path.join(restaurantuploadpath, `/${restaurant_id}`);
      var filename = `/gallary_${Date.now()}.png`;

      var storyurl = path.join(_storyurl, filename);

      var _fullpath = path.join(restaurantuploadpath, `/${restaurant_id}`);
      fs.ensureDir(_fullpath);

      fs.writeFile(
        _fullpath + filename,
        base64Data,
        "base64",
        function (err) {}
      );

      const connection = makeDb();
      await connection.query(
        `INSERT INTO restaurant_image (restaurant_id, url) VALUES (?, ?)`,
        [restaurant_id, storyurl]
      );
      var rows = await connection.query(
        `select * from restaurant_image where restaurant_id=? and url=?`,
        [restaurant_id, storyurl]
      );
      const rows2 = await connection.query(
        `SELECT * from restaurants LEFT JOIN restaurants_admin ON restaurants_admin.id = restaurants.res_admin_id  WHERE restaurant_id = ? `,
        [restaurant_id]
      );
      connection.close();

      if (rows && rows.length > 0) {
        var image = rows[0];
        createLog(
          "Added Restaurant image",
          `[POST] ${rows2[0].title}@restaurant image added Successfully`,
          "",
          "restaurant_admin",
          rows2[0].id,
          rows2[0].first_name + rows[0].last_name,
          req
        );
        res.status(200);
        res.json({
          statusCode: 200,
          message: "Data created successfully",
          image,
        });
      } else {
        createLog(
          "Added Restaurant image",
          `[POST] ${rows2[0].title}@restaurant image added failed`,
          "",
          "restaurant_admin",
          rows2[0].id,
          rows2[0].first_name + rows[0].last_name,
          req
        );
        res.status(400);
        res.json({ message: "Internel error" });
      }
    } else if (kind == "mainlogo") {
      var base64Data = media.replace(/^data:image\/png;base64,/, "");
      var _url = path.join(restaurantuploadpath, `/${restaurant_id}`);
      var filename = `/mainlogo_${Date.now()}.png`;

      var url = path.join(_url, filename);

      var _fullpath = path.join(restaurantuploadpath, `/${restaurant_id}`);
      fs.ensureDir(_fullpath);

      fs.writeFile(
        _fullpath + filename,
        base64Data,
        "base64",
        function (err) {}
      );

      const connection = makeDb();
      await connection.query(
        `UPDATE restaurants SET main_logo = ? WHERE restaurant_id = ?`,
        [url, restaurant_id]
      );
      const rows2 = await connection.query(
        `SELECT * from restaurants LEFT JOIN restaurants_admin ON restaurants_admin.id = restaurants.res_admin_id  WHERE restaurant_id = ? `,
        [restaurant_id]
      );
      connection.close();

      createLog(
        "Added Restaurant image",
        `[POST] ${rows2[0].title}@restaurant image added successfully`,
        "",
        "restaurant_admin",
        rows2[0].id,
        rows2[0].first_name + rows2[0].last_name,
        req
      );
      res.status(200);
      res.json({
        statusCode: 200,
        message: "Data created successfully",
        url,
      });
    }
  } catch (err) {
    const rows2 = await connection.query(
      `SELECT * from restaurants LEFT JOIN restaurants_admin ON restaurants_admin.id = restaurants.res_admin_id  WHERE restaurant_id = ? `,
      [restaurant_id]
    );
    createLog(
      "Added Restaurant image",
      `[POST] ${rows2[0].title}@restaurant image added failed`,
      "",
      "restaurant_admin",
      rows2[0].id,
      rows2[0].first_name + rows2[0].last_name,
      req
    );
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error: err,
    });
  }
}

async function deleteGallaryImg(req, res, next) {
  try {
    const connection = makeDb();

    var { rest_id, imageid, filename } = req.body;

    var _fullpath = path.join(restaurantuploadpath, `/${rest_id}`);
    fs.unlink(_fullpath + "/" + filename);

    var rows = await connection.query(
      `DELETE FROM restaurant_image WHERE id = ?`,
      [imageid]
    );
    connection.close();

    res.status(200);
    res.json({ message: "Success" });

    return;
  } catch (err) {
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error: err,
    });
    return;
  }
}

async function uploadGallaries(req, res, next) {
  try {
    const _Storage = multer.diskStorage({
      destination(req, file, callback) {
        callback(null, restaurantuploadpath);
      },
      filename(req, file, callback) {
        var name = file.originalname;
        name = name.replace(/-/g, "");
        name = name.replace(/ /g, "");
        callback(null, `menu_${Date.now()}_${name}`);
      },
    });

    const upload = multer({ storage: _Storage }).array("media", 10);

    upload(req, res, async function (err) {
      var { restaurant_id } = req.body;

      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        res.status(404);
        res.json({ message: "A Multer error occurred when uploading." });
      } else if (err) {
        // An unknown error occurred when uploading.
        res.status(404);
        res.json({ message: "unknown error occurred when uploading error" });
      }
      var files = req.files;

      var filenameArray = [];

      const connection = makeDb();

      files.forEach(async (file) => {
        var filename = file.filename;
        var _storyurl = path.join(restaurantuploadpath, `/${restaurant_id}`);
        var storyurl = path.join(_storyurl, filename);

        var _fullpath = path.join(
          restaurantuploadpath,
          `/${restaurant_id}`
        );
        fs.ensureDir(_fullpath);

        var file_name = file.filename;
        var temp_path = file.path;

        filenameArray.push(storyurl);

        fs.renameSync(temp_path, path.join(_fullpath, `/${file_name}`));
        await connection.query(
          `INSERT INTO restaurant_image (restaurant_id, url) VALUES (?, ?)`,
          [restaurant_id, storyurl]
        );
      });

      var rows = await connection.query(
        `select * from restaurant_image where restaurant_id=?`,
        [restaurant_id]
      );

      const rows2 = await connection.query(
        `SELECT * from restaurants LEFT JOIN restaurants_admin ON restaurants_admin.id = restaurants.res_admin_id  WHERE restaurant_id = ? `,
        [restaurant_id]
      );
      if (rows && rows.length > 0) {
        createLog(
          "Added Restaurant image",
          `[POST] ${rows2[0].title}@restaurant image added successfully`,
          "",
          "restaurant_admin",
          rows2[0].id,
          rows2[0].first_name + rows2[0].last_name,
          req
        );
        var image = rows;

        res.status(200);
        res.json({
          statusCode: 200,
          message: "Data created successfully",
          image,
        });
      } else {
        createLog(
          "Added Restaurant image",
          `[POST] ${rows2[0].title}@restaurant image added failed`,
          "",
          "restaurant_admin",
          rows2[0].id,
          rows2[0].first_name + rows2[0].last_name,
          req
        );

        res.status(400);
        res.json({
          statusCode: 400,
          message: "Internel error",
        });
        connection.close();
      }
    });
  } catch (err) {
    createLog(
      "Added Restaurant image",
      `[POST] ${rows2[0].title}@restaurant image added failed`,
      "",
      "restaurant_admin",
      rows2[0].id,
      rows2[0].first_name + rows2[0].last_name,
      req
    );
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error!",
      error: err,
    });
  }
}

async function updateSettingAddress(req, res, next) {
  try {
    const connection = makeDb();
    var {
      restaurant_id,
      country,
      state,
      city,
      address1,
      address2,
      postalcode,
      lat,
      lng,
    } = req.body;
    await connection.query(
      `update restaurants set country=?, state=?, city=?, address1=? , address2=?, postalcode=? , lat=?, lng=? where restaurant_id=?`,
      [
        country,
        state,
        city,
        address1,
        address2,
        postalcode,
        lat,
        lng,
        restaurant_id,
      ]
    );
    connection.close();

    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data updated successfully",
    });
  } catch (err) {
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal server error",
      error: err,
    });
  }
}

async function uploadSettingMenu(req, res, next) {
  try {
    const _Storage = multer.diskStorage({
      destination(req, file, callback) {
        callback(null, restaurantuploadfullPath);
      },
      filename(req, file, callback) {
        var name = file.originalname;
        name = name.replace(/-/g, "");
        name = name.replace(/ /g, "");
        callback(null, `menu_${Date.now()}_${name}`);
      },
    });

    const upload = multer({ storage: _Storage }).array("media", 10);

    upload(req, res, async function (err) {
      var { restaurant_id } = req.body;

      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        res.status(404);
        res.json({
          statusCode: 404,
          message: "A Multer error occurred when uploading.",
        });
      } else if (err) {
        // An unknown error occurred when uploading.
        res.status(404);
        res.json({
          statusCode: 404,
          message: "unknown error occurred when uploading error",
          error: err,
        });
      }
      var files = req.files;

      var filenameArray = [];

      files.forEach(async (file) => {
        var filename = file.filename;
        var _storyurl = path.join(restaurantuploadpath, `/${restaurant_id}`);
        var storyurl = path.join(_storyurl, filename);

        var _fullpath = path.join(
          restaurantuploadpath,
          `/${restaurant_id}`
        );
        fs.ensureDir(_fullpath);

        var file_name = file.filename;
        var temp_path = file.path;

        filenameArray.push(storyurl);

        fs.renameSync(temp_path, path.join(_fullpath, `/${file_name}`));
        // await connection.query(`INSERT INTO restaurant_menu (restaurant_id, url) VALUES (?, ?)`, [restaurant_id, storyurl]);
      });

      const connection = makeDb();
      var rows = await connection.query(
        `select full_menu from restaurants where restaurant_id=?`,
        [restaurant_id]
      );
      if (rows && rows.length > 0) {
        var fullmenu = JSON.parse(rows[0].full_menu);
        filenameArray = filenameArray.concat(fullmenu);

        await connection.query(
          `UPDATE restaurants SET full_menu = ? WHERE restaurant_id = ?`,
          [JSON.stringify(filenameArray), restaurant_id]
        );
      } else {
        res.status(400);
        res.json({
          statusCode: 400,
          message: "Internel error",
        });
      }
      connection.close();

      res.status(201);
      res.json({
        statusCode: 201,
        message: "Data created successfully",
        filenameArray,
      });
    });
  } catch (err) {
    res.status(404);
    res.json({
      statusbar: 404,
      message: "Internal Error!",
      error: err,
    });
  }
}

async function deleteFullMenu(req, res, next) {
  try {
    const connection = makeDb();

    var { rest_id, fullmenu, deletedmenu } = req.body;

    var _fullpath = path.join(restaurantuploadfullPath, `/${rest_id}`);
    fs.unlink(_fullpath + "/" + deletedmenu);

    var rows = await connection.query(
      `UPDATE restaurants SET full_menu = ? WHERE restaurant_id = ?`,
      [fullmenu, rest_id]
    );
    connection.close();

    res.status(204);
    res.json({
      statusCode: 204,
      message: "Data deleted successfully",
    });

    return;
  } catch (err) {
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error: err,
    });
    return;
  }
}

async function updateOfferMenu(req, res, next) {
  try {
    var { rest_id, offermenu } = req.body;

    const connection = makeDb();
    await connection.query(
      `UPDATE restaurants SET offer_menu = ? WHERE restaurant_id = ?`,
      [offermenu, rest_id]
    );
    connection.close();

    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data updated successfully",
      offermenu,
    });
  } catch (err) {
    res.status(404);
    res.json({
      statusCode: 404,
      message: "Internal Error!",
    });
  }
}

async function getRestSeats(req, res, next) {
  try {
    const connection = makeDb();
    var { rest_id } = req.body;
    var rows = await connection.query(
      `select * from restaurant_seats where restaurant_id=?`,
      [rest_id]
    );
    connection.close();

    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data fetched successfully",
      rows,
    });
  } catch (err) {
    res.status(400);
    res.json({
      statusCode: 400,
      message: "Internal error",
      error: err,
    });
  }
}

async function updateRestSeats(req, res, next) {
  try {
    const connection = makeDb();
    var { rest_id, newSeats, removeIds } = req.body;
    var newSeatsArr = JSON.parse(newSeats);
    //  console.log()
    var _removeids = JSON.parse(removeIds);
    if (_removeids.length > 0) {
      for (let id of _removeids) {
        await connection.query("DELETE FROM restaurant_seats WHERE id=?", [id]);
      }
    }

    if (newSeatsArr.length > 0) {
      for (let s of newSeatsArr) {
        await connection.query(
          "INSERT INTO restaurant_seats (`restaurant_id`, `table_no`, `seat_count`, `status`, `option`) VALUES (?, ?, ?, ?, ?)",
          [rest_id, s.table_no, s.seat_count, s.status, s.option]
        );
      }
    }
    var rows = await connection.query(
      "select * from restaurant_seats where restaurant_id=?",
      [rest_id]
    );
    connection.close();

    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data updated successfully",
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

async function updateDateTimeInfo(req, res, next) {
  let rows = [];
  try {
    const connection = makeDb();
    var { rest_id, open_time, close_time, block_date } = req.body;
    await connection.query(
      `UPDATE restaurants SET open_time=? , close_time=?, block_date=? WHERE restaurant_id = ?`,
      [open_time, close_time, block_date, rest_id]
    );
    rows = await connection.query(
      `SELECT * from restaurants LEFT JOIN restaurants_admin ON restaurants_admin.id = restaurants.res_admin_id  WHERE restaurant_id = ? `,
      [rest_id]
    );
    connection.close();
    createLog(
      "Update Restaurant time",
      `[POST] ${rows[0].title}@restaurant Time updated Successfully`,
      "",
      "restaurant_admin",
      rows[0].id,
      rows[0].first_name + rows[0].last_name,
      req
    );
    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data updated successfully",
    });
  } catch (err) {
    // console.log(rows);
    console.log(err);
    res.status(400);
    res.json({
      statusCode: 400,
      message: "Internal error",
      error: err,
    });
  }
}

async function updateProfile(req, res, next) {
  try {
    var { user_id, firstname, lastname, password, avatar } = req.body;

    // update creator table.
    const connection = makeDb();

    if (avatar) {
      var base64Data = avatar.replace(/^data:image\/png;base64,/, "");
      var _storyurl = path.join(avatarpath, `/${user_id}`);
      var filename = `/avatar_${Date.now()}.png`;

      var storyurl = path.join(_storyurl, filename);

      var _fullpath = path.join(avatarfullpath, `/${user_id}`);
      fs.ensureDir(_fullpath);

      fs.writeFile(
        _fullpath + filename,
        base64Data,
        "base64",
        function (err) {}
      );

      var rows = await connection.query(
        `UPDATE restaurants_admin SET avatar=? WHERE id = ?`,
        [storyurl, user_id]
      );
    }

    if (password) {
      var hash_password = bcrypt.hashSync(password, saltRounds);

      var rows = await connection.query(
        `UPDATE restaurants_admin SET first_name = ?, last_name = ?, password = ? WHERE id = ?`,
        [firstname, lastname, hash_password, user_id]
      );
    } else {
      var rows = await connection.query(
        `UPDATE restaurants_admin SET first_name = ?, last_name = ? WHERE id = ?`,
        [firstname, lastname, user_id]
      );
    }

    var rows = await connection.query(
      `SELECT * from restaurants_admin WHERE id = ?`,
      [user_id]
    );

    var user = rows[0];
    user = omitPassword(user);
    const rows2 = await connection.query(
      `SELECT * from restaurants LEFT JOIN restaurants_admin ON restaurants_admin.id = restaurants.res_admin_id  WHERE restaurants_admin.id = ? `,
      [user_id]
    );

    connection.close();
    if (rows) {
      createLog(
        "Password Changed",
        `[POST] ${rows2[0].title}@restaurant passsword changed Successfully`,
        "",
        "restaurant_admin",
        rows2[0].id,
        rows2[0].first_name + rows2[0].last_name,
        req
      );
      res.status(200);
      res.json({
        statusCode: 200,
        message: "Data updated successfully for update",
        user,
      });
    } else {
      createLog(
        "Password Changed",
        `[POST] ${rows2[0].title}@restaurant passsword changed failed`,
        "",
        "restaurant_admin",
        rows2[0].id,
        rows2[0].first_name + rows2[0].last_name,
        req
      );
      res.status(404);
      res.json({
        statusCode: 404,
        message: "Internel error",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(404);
    res.json({
      statusCode: 404,
      message: "Internal Error!",
      error: err,
    });
  }
}

async function uploadCard(req, res, next) {
  try {
    var userid = req.body.userid;
    var filename = req.body.filename;
    var card_type = req.body.cardtype;
    var cardurl = path.join(carduploadpath, filename);
    var fullpath = path.join(carduploadfullPath, filename);

    fs.writeFile(fullpath, req.body.image, "base64", (err) => {
      if (err) throw err;
    });
    // update creator table.
    const connection = makeDb();
    var rows = await connection.query(
      `UPDATE restaurant_profile SET card_image = ?, card_type=?  WHERE creator_id = ?`,
      [cardurl, card_type, userid]
    );
    connection.close();

    if (rows) {
      res.status(200);
      res.json({
        statusbar: 200,
        message: "data featched successfully",
      });
    } else {
      res.status(404);
      res.json({
        statusCode: 404,
        message: "Internel error",
        error: err,
      });
    }
  } catch (err) {
    res.status(404);
    res.json({
      statusCode: 404,
      message: "Internal Error!",
      error: err,
    });
  }
}

async function uploadAvatar(req, res, next) {
  try {
    var userid = req.body.userid;
    var filename = req.body.filename;
    var avatarurl = path.join(avataruploadpath, filename);
    var fullpath = path.join(avataruploadfullPath, filename);

    fs.writeFile(fullpath, req.body.image, "base64", (err) => {
      if (err) throw err;
    });
    // update creator table.
    const connection = makeDb();
    var rows = await connection.query(
      `UPDATE restaurants SET avatar = ? WHERE id = ?`,
      [avatarurl, userid]
    );

    rows = await connection.query(
      `UPDATE restaurant_profile SET finish_setup = 1 WHERE creator_id = ?`,
      [userid]
    );

    // create need approve notification
    await createNeedApproveAdminNotification(userid);
    if (rows) {
      res.status(200);
      res.json({
        message: "success",
      });
    } else {
      res.status(404);
      res.json({
        statusCode: 404,
        message: "Internel error",
        error: err,
      });
    }
    connection.close();
  } catch (err) {
    res.status(404);
    res.json({
      statusbar: 404,
      message: "Internal Error!",
      error: err,
    });
  }
}

async function getMe(req, res, next) {
  try {
    var userid = req.body.userid;
    // update creator table.
    const connection = makeDb();
    var rows = await connection.query(
      `SELECT *, c.id as cid from restaurants as c left join restaurant_profile as cp on c.id=cp.creator_id where c.id=?`,
      [userid]
    );
    connection.close();

    if (rows && rows.length > 0) {
      var user = rows[0];
      res.status(200);
      res.json(user);
    } else {
      res.status(404);
      res.json({
        statusCode: 404,
        message: "Internel error",
        error: err,
      });
    }
  } catch (err) {
    res.status(404);
    res.json({
      statusCode: 404,
      message: "Internal Error!",
      error: err,
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
    // connection.close();

    res.status(200);
    res.json({ code: "success" });
  } else {
    // connection.close();

    res.status(405);
    res.json({ message: "Code is not correct" });
  }
  connection.close();
}

async function uploadPortfolio(req, res, next) {
  try {
    var userid = req.body.userid;
    var ext = req.body.ext;
    var _portfoliourl = path.join(portfoliouploadpath, `/${userid}`);
    var _fullpath = path.join(portfoliouploadfullPath, `/${userid}`);
    fs.ensureDir(_fullpath);

    var filename = makeid(20);
    filename = `${filename}.${ext}`;
    var fullpath = path.join(_fullpath, filename);
    var checkDuplication = await fs.pathExistsSync(fullpath);
    var count = 0;
    while (checkDuplication && count < 20) {
      filename = makeid(20);
      filename = `${filename}.${ext}`;
      fullpath = path.join(_fullpath, filename);
      checkDuplication = await fs.pathExistsSync(fullpath);
      count++;
    }

    var portfoliourl = path.join(_portfoliourl, filename);

    fs.writeFile(fullpath, req.body.media, "base64", (err) => {
      if (err) throw err;
    });
    // update portfolio table.
    const connection = makeDb();
    var rows = await connection.query(
      `INSERT INTO restaurants_portfolio (creator_id,media_type, media_url) VALUES (?, ?, ?)`,
      [userid, "photo", portfoliourl]
    );

    connection.close();

    if (rows) {
      res.status(200);
      res.json({ code: "success" });
    } else {
      res.status(404);
      res.json({
        statusCode: 404,
        message: "Internel error",
        error: err,
      });
    }
  } catch (err) {
    res.status(404);
    res.json({
      statusCode: 404,
      message: "Internal Error!",
      error: err,
    });
  }
}

async function getmediadata(req, res, next) {
  try {
    var userid = req.body.userid;

    const connection = makeDb();
    var portfolio = await connection.query(
      `SELECT * from restaurants_portfolio  where creator_id=?`,
      [userid]
    );
    var story = await connection.query(
      `SELECT * from restaurants_story  where creator_id=?`,
      [userid]
    );
    connection.close();

    var result = {
      portfolio: portfolio,
      story: story,
    };
    res.status(200);
    res.json(result);
  } catch (err) {
    res.status(404);
    res.json({
      statusCode: 404,
      message: "Internal Error!",
      error: err,
    });
  }
}

// CUISIINE CATEGORY API FUNCTIONS

async function getMenu(req, res, next) {
  try {
    const { rest_id } = req.body;
    const connection = makeDb();
    // firsttab
    var rows = await connection.query(
      `SELECT * from restaurant_menus where restaurant_id = ?`,
      [rest_id]
    );
    connection.close();

    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data fetched successfully",
      rows,
    });
    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error: err,
    });
    return;
  }
}

async function addMenu(req, res, next) {
  try {
    const _Storage = multer.diskStorage({
      destination(req, file, callback) {
        callback(null, restMenuFullPath);
      },
      filename(req, file, callback) {
        callback(null, `${Date.now()}_${file.originalname}`);
      },
    });

    const upload = multer({ storage: _Storage }).single("media");

    upload(req, res, async function (err) {
      var { title, price, description, rest_id } = req.body;

      var filename = "";

      filename = req.file ? req.file.filename : "";
      if (filename != "") {
        var _storyurl = restMenuPath;
        var storyurl = path.join(_storyurl, filename);

        var _fullpath = restMenuFullPath;
        fs.ensureDir(_fullpath);

        if (err instanceof multer.MulterError) {
          // A Multer error occurred when uploading.
          res.status(404);
          res.json({ message: "A Multer error occurred when uploading." });
        } else if (err) {
          // An unknown error occurred when uploading.
          res.status(404);
          res.json({ message: "unknown error occurred when uploading error" });
        }
      } else {
        var storyurl = null;
      }
      const connection = makeDb();

      var insertResult = await connection.query(
        `INSERT INTO restaurant_menus (name, price, description, restaurant_id, thumbnail) VALUES (?, ?, ?,?,?)`,
        [title, price, description, rest_id, storyurl]
      );
      var rows = await connection.query(
        `select * from restaurant_menus where id=?`,
        [insertResult.insertId]
      );
      connection.close();

      if (rows && rows.length > 0) {
        var newItem = rows[0];
        res.status(200);
        res.json({
          statusCode: 200,
          message: "Data created successfully",
          data: newItem,
          code: 200,
        });
      } else {
        res.status(400);
        res.json({
          statusCode: 400,
          message: "Internel error",
        });
      }
    });
  } catch (err) {
    console.log(err);
    res.status(404);
    res.json({
      statusCode: 404,
      message: "Internal Error!",
      error: err,
    });
  }
}
async function uploadFile(req, res, next) {
  const connection = makeDb();
  let _storage = await MulterImg(req, res, restFilePath);
  const upload = multer({ storage: _storage }).single("file");
  upload(req, res, async function (err) {
    if (err) {
      res.status(400).json({
        statusCode: 400,
        message: "Something went wrong",
        error: err,
      });
    } else {
      let path = req.file.path;
      let addBackslash = path.split("\\").join("\\\\");
      let menuTitle = req.file.originalname;
      let validateQuery = await connection.query(
        `SELECT COUNT(file) as count from restaurant_menus WHERE restaurant_id = ?`,[req.body.restaurant_id]
      );
      if (validateQuery[0].count > 0) {
        res.status(400).json({
          statusCode: 400,
          message: "You have already uploaded pdf menu.",
        });
      } else {
        let insertedRow = await connection.query(`INSERT INTO restaurant_menus (restaurant_id,name,file) VALUES (?,?,?)`,[req.body.restaurant_id,menuTitle,addBackslash]);
        let getData = `SELECT * FROM restaurant_menus WHERE id = ${insertedRow.insertId}`;
        let response = await connection.query(getData);
        res.status(200).json({
          statusCode: 200,
          message: "Data created successfully",
          response,
        });
      }
      connection.close();
    }
  });
}
async function updateMenu(req, res, next) {
  try {
    const _Storage = multer.diskStorage({
      destination(req, file, callback) {
        callback(null, restMenuFullPath);
      },
      filename(req, file, callback) {
        callback(null, `${Date.now()}_${file.originalname}`);
      },
    });

    const upload = multer({ storage: _Storage }).single("media");

    upload(req, res, async function (err) {
      var { id, title, price, description, rest_id } = req.body;
      var filename = "";
      if (req.file) {
        filename = req.file.filename;
        var _storyurl = restMenuPath;
        var storyurl = path.join(_storyurl, filename);

        var _fullpath = restMenuFullPath;
        fs.ensureDir(_fullpath);
      }

      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        res.status(404);
        res.json({
          statusCode: 404,
          message: "A Multer error occurred when uploading.",
        });
      } else if (err) {
        // An unknown error occurred when uploading.
        res.status(404);
        res.json({
          statusCode: 404,
          message: "unknown error occurred when uploading error",
        });
      }
      const connection = makeDb();

      if (filename) {
        await connection.query(
          `UPDATE restaurant_menus SET name=?, thumbnail=?, price=?, description=? WHERE id=?`,
          [title, storyurl, price, description, id]
        );
      } else {
        await connection.query(
          `UPDATE restaurant_menus SET name=?, price=?, description=? WHERE id=?`,
          [title, price, description, id]
        );
      }
      var rows = await connection.query(
        `select * from restaurant_menus where restaurant_id = ?`,
        [rest_id]
      );
      connection.close();

      if (rows && rows.length > 0) {
        res.status(200);
        res.json({
          statusCode: 200,
          message: "Data updated successfully",
          data: rows,
        });
      } else {
        res.status(400);
        res.json({
          statusCode: 400,
          message: "Internel error",
        });
      }
    });
  } catch (err) {
    console.log(err);
    res.status(404);
    res.json({
      statusCode: 404,
      message: "Internal Error!",
      error: err,
    });
  }
}
async function deleteMenu(req, res, next) {
  try {
    const connection = makeDb();
    var { id } = req.body;
    // update new settings
    if (!id || id == null) {
      res.status(403);
      res.json({
        statusCode: 403,
        message: "Id is missing !",
      });
    } else {
      await connection.query(`delete from restaurant_menus WHERE id = ?`, [id]);
      connection.close();

      res.status(204);
      res.json({
        statusCode: 204,
        message: "Data deleted successfully",
      });
      return;
    }
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error: err,
    });
    return;
  }
}

// helper functions
async function createNeedApproveAdminNotification(userid) {
  const connection = makeDb();
  if (!userid || userid == null) {
    res.status.json({
      statusCode: 404,
      message: "Id is missing !",
    });
  }else{
  await connection.query(
    `insert into notification_admin (user_type, user_id, type) values ("creator", ?, "creator_need_approve")`,
    [userid]
  );
  connection.close();

  return;
}
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
