const { makeDb } = require("../../_helpers/db");
const path = require("path"); // Used for manipulation with path
const fs = require("fs-extra"); // Classic fs
const { environment } = require("../../env");
// const multer = require('multer');
const { element } = require("protractor");
const { time } = require("console");
const { userConformationEmail } = require("../.././_helpers/userConformation");
const moment = require("moment");
const nodemailer = require("nodemailer");
var smtpTransport = require("nodemailer-smtp-transport");
const { createLog } = require("../../_helpers/activityLog");
module.exports = {
  getInfo,
  updateBookingStatus,
  getBookings,
};

async function getInfo(req, res, next) {
  try {
    const connection = makeDb();
    var { rest_id } = req.body;
    if (rest_id) {
      var seats_rows = await connection.query(
        `SELECT * from restaurant_seats where restaurant_id=?`,
        rest_id
      );
      var booking_query = `SELECT rest_seat_id AS seat_id, rb.id AS booking_id, c.id AS customer_id, CONCAT(rb.booking_date,' ', rb.booking_time, ':00') AS start,
        booking_date, booking_time, CONCAT(c.first_name,' ', c.last_name) AS customer_name, rb.person_no, rb.created_at, rb.status
        FROM restaurant_bookings AS rb
        LEFT JOIN customers AS c ON c.id = rb.customer_id
        WHERE rb.restaurant_id = ?`;
      var booking_rows = await connection.query(booking_query, [rest_id]);
      var data = {};
      // data.seats = seats_rows;
      data.seats = [
        {
          id: 0,
          option: "general",
          restaurant_id: rest_id,
          seat_count: 6,
          status: "empty",
          table_no: "0",
        },
      ];
      data.booking = booking_rows;
      connection.close();

      res.status(200);
      res.json({
        statusCode: 200,
        message: "Data featched successfully",
        data,
      });
    } else {
      res.status(404);
      res.json({
        statusCode: 404,
        message: "Restaurant id is missing !",
      });
    }
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

async function getBookings(req, res, next) {
  try {
    const connection = makeDb();
    var {
      rest_id,
      fromDate,
      toDate,
      pageIndex = 0,
      pageSize = 20,
      status,
    } = req.query;

    var offset2 = parseInt(pageIndex) * parseInt(pageSize);
    var booking_rows = [];

    let isDataExists = await connection.query(
      `SELECT COUNT(*) as count FROM restaurant_bookings as rb WHERE rb.restaurant_id = ?`,[rest_id]
    );

    if (isDataExists[0].count > 0) {
      let _fromDate = moment(fromDate, "MM/DD/YYYY").format();
      let _toDate = moment(toDate, "MM/DD/YYYY").format();

      let dateQuery = "";
      if (fromDate) {
        dateQuery = `AND rb.booking_date ${
          toDate
            ? "BETWEEN '" + _fromDate + "' AND '" + _toDate + "'"
            : ">= '" + _fromDate + "'"
        }`;
      }

      var booking_query = `SELECT rest_seat_id AS seat_id, rb.id AS booking_id, c.id AS customer_id, CONCAT(rb.booking_date,' ', rb.booking_time, ':00') AS start,
        rb.booking_date, rb.booking_time, CONCAT(c.first_name,' ', c.last_name) AS customer_name, rb.person_no, rb.created_at, rb.status
        FROM restaurant_bookings AS rb
        LEFT JOIN customers AS c ON c.id = rb.customer_id
        WHERE rb.restaurant_id = ${rest_id} ${dateQuery} ${
        status ? 'AND rb.status = "' + status + '"' : ""
      } ORDER BY rb.created_at DESC LIMIT ?, ?`;

      booking_rows = await connection.query(booking_query, [
        offset2,
        parseInt(pageSize),
      ]);
    }
    connection.close();
    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data fetched successfully",
      data: booking_rows,
      count: isDataExists[0].count,
    });

    return;
  } catch (err) {
    res.json({
      statusCode: 400,
      message: "internal server error",
      error: err,
    });
    return;
  }
}

async function updateBookingStatus(req, res, next) {
  try {
    const connection = makeDb();
    var { booking_id, status } = req.body;
    // console.log(booking_id, status)
    if (!booking_id || booking_id == null || status == null || !status) {
      res.status(403).json({
        statusCode: 403,
        message: "Id is missing !",
      });
    } else {
      var q = await connection.query(
        `UPDATE restaurant_bookings SET status = ? WHERE id = ? `,[status,booking_id]
      );
    }
    // var userCustomers = await connection.query(
    //   `select * from (select id, booking_date,booking_time,person_no,(customer_id) as customerId from restaurant_bookings)t1
    //   LEFT JOIN
    //   (select first_name,last_name,email,(id) as customerId from customers)t2
    //   using(customerId)
    //   `
    // );
    var userCustomers = await connection.query(
      `SELECT first_name,last_name,email,title,shortdescription,main_logo,thumbnail,phonenumber,open_time,close_time,
      country,state,city,postalcode,table_no,seat_count,lat,lng,restaurant_bookings.id,person_no,restaurant_seats.option
      FROM restaurant_bookings
      LEFT JOIN customers on restaurant_bookings.customer_id = customers.id
       LEFT JOIN restaurants on restaurants.restaurant_id = restaurant_bookings.restaurant_id
       LEFT JOIN restaurant_seats on restaurant_bookings.rest_seat_id = restaurant_seats.id WHERE restaurant_bookings.id = ?
      `,[booking_id]
    );

    let day = await connection.query(
      `SELECT DAYNAME(booking_date) from restaurant_bookings WHERE id = ? `,[booking_id]
    );

    let month = await connection.query(
      `SELECT MONTHNAME(booking_date) from restaurant_bookings WHERE id = ? `,[booking_id]
    );
    let date = await connection.query(
      `SELECT DATE_FORMAT(booking_date,"%e") from restaurant_bookings WHERE id = ? `,[booking_id]
    );
    let bookingTime = await connection.query(
      `SELECT TIME_FORMAT(booking_time,"%h:%p")from restaurant_bookings WHERE id = ? `,[booking_id]
    );
    // let addTime = await connection.query(
    //   `SELECT ADDTIME(booking_time,"4") from restaurant_bookings WHERE id = ${booking_id}`
    // )

    let newTimeTo = JSON.parse(JSON.stringify(bookingTime[0]));
    let EndTimeToValues = Object.values(newTimeTo);
    // let d = v[0].replace(':AM','').replace(':PM','')
    // let newEndTime = parseInt(d)+4
    // console.log(newEndTime)
    // console.log(d)
    // console.log("newtimeto",newTimeTo)

    // Create a new Date object from the existing time
    let plusEndTimeTime = new Date(`01/01/2000 ${EndTimeToValues}`);
    plusEndTimeTime.setHours(plusEndTimeTime.getHours() + 4);
    let newEndTime = plusEndTimeTime.toLocaleTimeString([], {
      hour: "2-digit",
    });

    let bookinganddate = {
      day: day[0],
      month: month[0],
      date: date[0],
      bookingTime: bookingTime[0],
      // bookingTimeto:bookingTime[0]
    };
    let filterBookingDetails = [];
    let bookingDetailObjectValues = Object.values(bookinganddate);
    let ExtractBookingArray = bookingDetailObjectValues.forEach((element) => {
      let GetBookingArrayDetails = element;
      let BookingDetailsComplete = Object.values(GetBookingArrayDetails);
      filterBookingDetails.push(BookingDetailsComplete[0]);
    });

    // for(key in day[0]){
    //   console.log(day[key])
    // }

    // let v = Object.keys(bookinganddate)
    // let w = Object.values(bookinganddate.day)
    // console.log(w)
    let rows = await connection.query(
      `SELECT * FROM restaurant_bookings LEFT JOIN restaurants ON restaurant_bookings.restaurant_id = restaurants.restaurant_id  WHERE restaurant_bookings.id = ?`,
      [booking_id]
    );
    if (status == "approved") {
      createLog(
        "Booking information",
        `[POST] ${rows[0].title}@restaurant Booking approved`,
        "",
        "restaurant_admin",
        rows[0].id,
        rows[0].title,
        req
      );
      // console.log("approved")
      userConformationEmail(
        userCustomers,
        "confirmed",
        filterBookingDetails,
        newEndTime,
        booking_id
      );
    } else if (status == "closed") {
      createLog(
        "Booking information",
        `[POST] ${rows[0].title}@restaurant Booking cancelled`,
        "",
        "restaurant_admin",
        rows[0].id,
        rows[0].title,
        req
      );
      // console.log("closed");
      userConformationEmail(
        userCustomers,
        "rejected",
        filterBookingDetails,
        newEndTime
      );
    }
    res.status(200).json({
      statusCode: 200,
      userCustomers,
      message: "Data updated successfully",
    });
    connection.close();

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
