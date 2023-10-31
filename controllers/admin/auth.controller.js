const { jwt_secret, db_host, db_user, db_pwd, db_name } = require("../../env");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mysql = require("mysql");
const { makeDb } = require("../../_helpers/db");
const { createLog } = require("../../_helpers/activityLog");
const createUser = async (req, res) => {
  const connection = makeDb();
  const { first_name, last_name, email, password, remember_token, created_at } =
    req.body;
  const emailValidation = await connection.query(
    `SELECT COUNT(email) as count FROM admin where email = ?`,[email]
  );
  if (emailValidation[0].count == 0) {
    const passwordHashed = await bcrypt.hashSync(password, 10);
    const sqlquery = `INSERT INTO admin (first_name,last_name,email,password,remember_token) VALUES (?,?,?,?,?)`;
    await connection.query(sqlquery, [
      first_name,
      last_name,
      email,
      passwordHashed,
      remember_token,
    ]);
    let response = await connection.query(`SELECT * FROM admin`);
    res.status(201).json({
      statusCode: 201,
      message: "Data created successfully",
      response,
    });
  } else {
    res.status(403).json({
      statusCode: 403,
      message: "Email already in use",
    });
  }
};
const updateUser = async (req, res) => {
  const connection = makeDb();
  const { first_name, last_name, email, password, remember_token } = req.body;
  const DataCheck = await connection.query(
    `SELECT COUNT(id) as count FROM admin where id = ?`,[req.params.id]
  );

  if (DataCheck[0].count > 0) {
    const passwordHashed = await bcrypt.hashSync(password, 10);
    const sqlquery = `UPDATE admin SET first_name = ?, last_name = ? ,email = ? ,password = ? ,remember_token = ? WHERE id = ?`;
    await connection.query(sqlquery, [
      first_name,
      last_name,
      email,
      passwordHashed,
      remember_token,
      req.params.id
    ]);
    let data = await connection.query(`SELECT * FROM admin`);
    res.status(200).json({
      statusCode: 200,
      data,
    });
  } else {
    res.status(404).json({
      statusCode: 404,
      message: "User not found",
    });
  }
};
const deleteUser = async (req, res) => {
  const connection = makeDb();
  const SearchId = await connection.query(
    `SELECT COUNT(id) as count from admin where id = ?`,[req.params.id]
  );
  if (SearchId[0].count > 0) {
    // console.log(req.params.id)
    connection.query(`DELETE FROM admin WHERE id = ?`,[req.params.id]);
    res.status(204).json({
      statusCode: 204,
      message: "User deleted Successfully",
    });
  } else {
    res.status(404).json({
      statusCode: 404,
      err: "user not found !",
    });
  }
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
    var rows = await connection.query(`SELECT * from admin where email=?`, [
      email,
    ]);
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
      res.status(401);
      res.json({
        statusCode: 401,
        message: "Password is incorrect!",
      });
      return;
    }
    var user = rows[0];
    user = omitPassword(user);
    const token = jwt.sign({ sub: user.id, email: user.email }, jwt_secret, {
      expiresIn: "7d",
    });
    const _user = {
      user,
      token,
    };
    createLog(
      "Login",
      "POST @login successfully",
      "",
      "admin",
      rows[0].id,
      rows[0].first_name,
      req
    );
    res.status(201);
    res.json(_user);
  } catch (err) {
    createLog(
      "Login",
      "POST @login faild",
      "",
      "customer",
      rows[0].id,
      rows[0].first_name,
      req
    );
    res.status(500);
    res.json({
      statusCode: 500,
      error: err,
    });
  }
}
// helper functions
async function logout(req, res) {
  // const {token} = req.body
  res.status(200).json({
    statusCode: 200,
    message: "Logout successfully !",
  });
}
function omitPassword(user) {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
module.exports = {
  login,
  logout,
  createUser,
  updateUser,
  deleteUser,
};
