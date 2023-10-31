const { jwt_secret, db_host, db_user, db_pwd, db_name } = require("../../env");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { makeDb } = require("../../_helpers/db");
const { createLog } = require("../../_helpers/activityLog");
const requestIp = require("request-ip");
const {slugFilter} = require("../../_helpers/slugFilter");
// const { ɵSWITCH_CHANGE_DETECTOR_REF_FACTORY__POST_R3__ } = require('@angular/core');
const saltRounds = 10;

const MailConfig = require("../../_helpers/email");

var sendForgotPwdEmail = MailConfig.sendForgotPwdEmail;

module.exports = {
  login,
  register,
  changePassword,
  forgotPassword,
};

async function login(req, res, next) {
  const { email, password } = req.body;

  try {
    if (email == "") {
      res.status(400);
      res.json({
        statusCode: 400,
        message: "Please fill Email",
      });
      return;
    }
    if (password == "") {
      res.status(400);
      res.json({
        statusCode: 400,
        message: "Please fill Password",
      });
      return;
    }
    const connection = makeDb();
    var rows = await connection.query(
      `SELECT * from restaurants_admin where email=?`,
      email
    );
    const rows2 = await connection.query(
      `SELECT * from restaurants r LEFT JOIN restaurants_admin ra ON r.res_admin_id = ra.id WHERE ra.email = ? `,
      email
    );
    
    connection.close();

    if (!rows || rows.length == 0) {
      res.status(400);
      res.json({
        statusCode: 400,
        message: "Email is incorrect!",
      });
      return;
    }

    if (!bcrypt.compareSync(password, rows[0].password)) {
      res.status(403);
      res.json({
        statusCode: 403,
        message: "Password is incorrect!",
      });
      return;
    }

    var user = rows[0];
    user = omitPassword(user);

    const token = jwt.sign({ sub: user.id }, jwt_secret, { expiresIn: "7d" });
    const _user = {
      user,
      token,
    };
    createLog(
      "Login",
      `POST @login Successfully ${rows2[0].title}`,
      "",
      "restaurant_admin",
      rows[0].id,
      rows[0].first_name,
      req
    );
    res.status(201);
    res.json(_user);

    return;
  } catch (err) {
    console.log(err)
    createLog(
      "Login",
      "POST @login faild",
      "",
      "restaurant_admin",
      rows[0].id,
      rows[0].first_name,
      req
    );
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error",
      error: err,
    });

    return;
  }
}

async function register(req, res, next) {
  try {
    const { firstname, lastname, email, password, title } = req.body;
    var slug = await slugFilter(title)
    if (firstname == "") {
      res.status(400);
      res.json({
        statusCode: 400,
        message: "Please fill First Name",
      });
      return;
    }
    if (lastname == "") {
      res.status(400);
      res.json({
        statusCode: 400,
        message: "Please fill Last Name",
      });
      return;
    }
    if (email == "") {
      res.status(400);
      res.json({
        statusCode: 400,
        message: "Please fill Email",
      });
      return;
    }
    if (password == "") {
      res.status(400);
      res.json({
        statusCode: 400,
        message: "Please fill Password",
      });
      return;
    }
    if (title == "") {
      res.status(400);
      res.json({
        statusCode: 400,
        message: "Please fill Restaurant name",
      });
      return;
    }
    const connection = makeDb();
    var rows = await connection.query(
      `SELECT * from restaurants_admin where email=?`,
      email
    );
    if (rows && rows.length > 0) {
      res.status(400);
      res.json({
        statusCode: 400,
        message: "Email already is used!",
      });
      return;
    }

    var hash_password = bcrypt.hashSync(password, saltRounds);
    let sql = `INSERT INTO restaurants_admin (first_name, last_name, email, password, login_type, login_status) VALUES (?)`;
    let values = [firstname, lastname, email, hash_password, "email", "on"];

    var result = await connection.query(sql, [values]);
    if (result) {
      let restaurantSql = `INSERT INTO restaurants (title,slug,res_admin_id) VALUES (?)`;
      
      let values2 = [title, slug, result.insertId];

      await connection.query(restaurantSql, [values2]);

      var rows = await connection.query(
        `SELECT * from restaurants_admin where email=?`,
        email
      );

      connection.close();

      if (!rows || rows.length == 0) {
        res.status(400);
        res.json({
          statusCode: 400,
          message: "Can not find registered user!",
        });
        return;
      }
      var user = rows[0];
      user = omitPassword(user);
      const token = jwt.sign({ sub: user.id }, jwt_secret, { expiresIn: "7d" });
      var _user = {
        user,
        token,
      };
      res.status(201);
      res.json(_user);
      return;
    } else {
      connection.close();

      res.status(400);
      res.json({
        statusCode: 400,
        message: "Can not insert data!",
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

async function changePassword(req, res, next) {
  try {
    var { user_id, oldpwd, password } = req.body;

    const connection = makeDb();
    var rows = await connection.query(
      `SELECT * from customers where id=?`,
      user_id
    );

    if (!bcrypt.compareSync(oldpwd, rows[0].password)) {
      res.status(403);
      res.json({ message: "Password is incorrect!" });
      return;
    }

    var hash_password = bcrypt.hashSync(password, saltRounds);
    var query = `UPDATE customers SET PASSWORD = ? WHERE id = ?`;
    var result = connection.query(query, [hash_password, user_id]);
    connection.close();

    res.status(200);
    res.json(result);
  } catch (err) {
    res.status(500);
    res.json({ message: "Internal Server Error" });
  }
}

async function forgotPassword(req, res, next) {
  try {
    var { email } = req.body;

    const connection = makeDb();
    var rows = await connection.query(
      `SELECT * from restaurants_admin where email=?`,
      email
    );

    if (rows && rows.length > 0) {
      var chars =
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
      var string_length = 8;
      var randomstring = "";
      for (var i = 0; i < string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
      }

      var hash_password = bcrypt.hashSync(randomstring, saltRounds);
      var query = `UPDATE restaurants_admin SET PASSWORD = ? WHERE email = ?`;
      var result = connection.query(query, [hash_password, email]);

      await sendForgotPwdEmail(email, randomstring);
      connection.close();

      res.status(201);
      res.json({
        statusCode: 201,
        message: "Successfully updatedd",
      });
    } else {
      res.status(403);
      res.json({
        statusCode: 403,
        message: "You are not registered",
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
}

function omitPassword(user) {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
