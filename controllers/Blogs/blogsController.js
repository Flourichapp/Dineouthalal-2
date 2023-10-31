const { makeDb } = require("../.././_helpers/db");
// const path = require("path"); // Used for manipulation with path
// const fs = require("fs-extra"); // Classic fs
// const { environment } = require("../.././env");
// const multer = require("multer");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
// const {sendApproveCode} = require("../././../_helpers/email");

module.exports = {
  getBlogs,
};
// Get Blogs
async function getBlogs(req, res, next) {
  try {
    var { slug, pageIndex = 0, pageSize = 10 } = req.query;

    const connection = makeDb();
    var totalBlogs = await connection.query(
      `SELECT COUNT(*) AS count FROM blogs WHERE isDeleted = 0`
      // `SELECT blogs. *, feautured_blogs.featured FROM blogs LEFT JOIN feautured_blogs ON feautured_blogs.BlogId = blogs.id WHERE isDeleted = 0`
    );
    var offset = parseInt(pageIndex) * parseInt(pageSize);
    console.log(offset)
    console.log(pageSize)
    var blogs = [];

    if (slug) {
      
      blogs = await connection.query(
        `SELECT * FROM blogs WHERE slug = ? AND isDeleted = 0 LIMIT 1`,[slug]
      );
    }else {
     
      blogs = await connection.query(
        `SELECT blogs.*, feautured_blogs.featured FROM blogs LEFT JOIN feautured_blogs ON feautured_blogs.BlogId = blogs.id WHERE isDeleted = 0 LIMIT ${offset},${pageSize} `
      );
    }
    var topblogs = await connection.query(
      `SELECT * FROM blogs WHERE isDeleted = 0 ${slug ? "AND slug != ?" : "" } ORDER BY created_at DESC LIMIT 5`,[slug]
    );

    var data = {
      total: totalBlogs[0].count,
      blogs: blogs,
      topblogs: topblogs,
    };

    connection.close();

    res.status(200);
    res.json({
      statusCode:200,
       message:"Data fetched successfully",
       count:data.total,
       blogs:data.blogs,
       topblogs:data.topblogs
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
