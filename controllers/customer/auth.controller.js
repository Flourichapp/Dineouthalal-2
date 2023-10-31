const { jwt_secret } = require("../../env");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { makeDb } = require("../../_helpers/db");

const { createLog } = require("../../_helpers/activityLog");
const saltRounds = 10;
var {sendForgotPwdEmail} = require('../.././_helpers/email.js')
module.exports = {
  login,
  register,
  changePassword,
  forgotPassword,
  removeUser,
};

async function login(req, res, next) {
  const { email, password } = req.body;
  // console.log('googletokenss', email, password);

  try {
    if (email == "") {
      res.status(400);
      res.json({ message: "Please fill Email" });
      return;
    }
    if (password == "") {
      res.status(400);
      res.json({ message: "Please fill Password" });
      return;
    }
    const connection = makeDb();
    var rows = await connection.query(
      `SELECT * from customers as c where email=? AND is_deleted = ?`,[
      email,0]
    );
    connection.close();

    if (!rows || rows.length == 0) {
      res.status(300);
      res.json({ message: "Email is incorrect!" });
      return;
    }

    if (!bcrypt.compareSync(password, rows[0].password)) {
      res.status(403);
      res.json({ message: "Password is incorrect!" });
      return;
    }

    var user = rows[0];
    user = omitPassword(user);
    const token = jwt.sign({ sub: user.id , email:user.email }, jwt_secret, { expiresIn: "7d" });
    const _user = {
      user,
      token,
    };
    res.status(201);
    res.json(_user);
   

    createLog(
      "Login",
      "[POST] @login Successfully",
      "",
      "customer",
      rows[0].id,
      rows[0].first_name+rows[0].last_name,
      req
    );
    return;
    
  } catch (err) {
    console.log(err)
    createLog(
      "Login",
      "[POST] @login faild",
      "",
      "customer",
      rows[0].id,
      rows[0].first_name,
      req
    );
    res.status(500);
    res.json({ 
      statusCode:500,
      message: "Internal error",
      error:err
    });
    
  }
}

async function forgotPassword(req, res, next) {
  try {
    var { email } = req.body;

    const connection = makeDb();
    var rows = await connection.query(
      `SELECT * from customers where email=?`,
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
      var query = `UPDATE customers SET PASSWORD = ? WHERE email = ?`;
      var result = connection.query(query, [hash_password, email]);

      await sendForgotPwdEmail(email, randomstring);
      connection.close();

      res.status(200);
      res.json({ code: "Successfully updated" });
    } else {
      res.status(403);
      res.json({ 
        statusCode:403,
        message: "You are not registered"
      
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({ 
      statusCode:500,
      message: "Internal Server Error",
      error:err
    });
  }
}

async function register(req, res, next) {
  try {
    const { firstname, lastname, email, password } = req.body;
    if (email == "") {
      res.status(400);
      res.json({ message: "Please fill Email" });
      return;
    }
    if (password == "") {
      res.status(400);
      res.json({ message: "Please fill Password" });
      return;
    }
    const connection = makeDb();
    var rows = await connection.query(
      `SELECT * from customers where email=?`,
      email
    );
    if (rows && rows.length > 0) {
      res.status(400);
      res.json({ message: "Email already is used!" });

      connection.close();
      return;
    }

    var hash_password = bcrypt.hashSync(password, saltRounds);
    let sql = `INSERT INTO customers (first_name, last_name, email, password, login_type, login_status) VALUES (?)`;
    let values = [firstname, lastname, email, hash_password, "email", "on"];

    var result = await connection.query(sql, [values]);
    if (result) {
      // transport.sendMail({
      //     from: 'info@dineouthalal.com',
      //     to: email,
      //     subject: 'Welcome to Dineouthalal',
      //     text: 'welcome to dineouthalal'
      // });


      var rows = await connection.query(
        `SELECT * from customers as c where email=?`,
        email
      );
      if (!rows || rows.length == 0) {
        res.status(400);
        res.json({ message: "Can not find registered user!" });
        connection.close();

        return;
      }
      var user = rows[0];
      user = omitPassword(user);
      const token = jwt.sign({ sub: user.id }, jwt_secret, { expiresIn: "7d" });
      var _user = {
        user,
        token,
      };
      res.status(200);
      res.json(_user);
      connection.close();

      return;
    } else {
      res.status(400);
      res.json({ message: "Can not insert data!" });
      return;
    }
  } catch (err) {
    res.status(400);
    res.json({ 
      statusCode:400,
      message: "Internal server Error!",
      error:err
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
      res.json({ message: "Current Password is incorrect!" });

      connection.close();
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
    res.json({ 
      statusCode:500,
      message: "Internal Server Error",
      error:err
    });
  }
}
async function removeUser(req, res, next) {
  const { id } = req.params;
  // console.log(id)
  try {
    const connection = makeDb();
    connection.query(`UPDATE customers SET is_deleted = 1 WHERE id = ?`, [id]);
    res.status(204).json({message:"Customer Deleted successfully"})
  } catch {}
}

function omitPassword(user) {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
