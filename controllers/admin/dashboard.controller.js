const { makeDb } = require("../../_helpers/db");
// const path = require("path"); // Used for manipulation with path
const fs = require("fs-extra"); // Classic fs
// const { environment } = require("../../env");
// const { sendApproveCodeSMTP } = require("../.././_helpers/email");
// const multer = require('multer');
// const { element } = require("protractor");
// const { time, count } = require("console");
// const { STRIPE_SECRET } = require("../../env");
// const { json } = require("body-parser");
// const stripe = require("stripe")(STRIPE_SECRET);
// const multer = require("multer");
// const { MulterImg, blogMulter, multer } = require("../.././_helpers/multer_settings");
// const { exists } = require("fs");
const { MulterImg, multer } = require("../.././_helpers/multer_settings");
const {slugFilter} = require("../../_helpers/slugFilter")
// const { exists } = require("fs");
// const { error } = require("console");
const Bloguploadpath = "media/uploads/blogs";
// const Bloguploadfullpath = path.join(
//   __dirname,
//   `./../../${environment}/${Bloguploadpath}`
// ); // Register the upload path
fs.ensureDir(Bloguploadpath);
module.exports = {
  getDashboardData,
  getAllRests,
  getRestDetail,
  createBlog,
  // getBlogs,
  // getblogsbyuserid,
  getAllTransactions,
  getSettingData,
  updateSettingData,
  updateRest,
  updateBlog,
  deleteBlogById,
  deleteRest,
};
async function getDashboardData(req, res, next) {
  try {
    const connection = makeDb();

    var daily_earning =
      await connection.query(`SELECT DATE_FORMAT(paid_at, '%Y-%m-%d') AS paid_at, 
        SUM(amount) AS amount FROM transactions GROUP BY YEAR(paid_at), MONTH(paid_at), DATE(paid_at)`);

    var monthly_earning =
      await connection.query(`SELECT DATE_FORMAT(paid_at, '%Y-%m') AS paid_at, 
        SUM(amount) AS amount FROM transactions GROUP BY YEAR(paid_at), MONTH(paid_at)`);

    var yearly_earning =
      await connection.query(`SELECT DATE_FORMAT(paid_at, '%Y') AS paid_at, 
        SUM(amount) AS amount FROM transactions GROUP BY YEAR(paid_at)`);

    var approve_query = `select r.*, ra.first_name, ra.last_name, ra.email, ra.login_type 
        from restaurants as r 
        left join restaurants_admin as ra on ra.id = r.res_admin_id
        where status ='approving' ORDER BY created_at DESC LIMIT 5`;

    var approving = await connection.query(approve_query);

    var total_finance = await connection.query(
      `select sum(amount) as sum_amount from transactions`
    );

    var approving_total = await connection.query(
      `select COUNT(*) AS count from restaurants where status ='approving'`
    );
    var all_total = await connection.query(
      `select Count(*) as count from restaurants where status !='pending'`
    );

    var data = {
      all_total: all_total[0].count,
      approving_total: approving_total[0].count,
      finace: total_finance[0].sum_amount ? total_finance[0].sum_amount : 0,
      approving: approving,
      daily_earning: daily_earning,
      monthly_earning: monthly_earning,
      yearly_earning: yearly_earning,
    };
    connection.close();

    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data fetched successfully",
      data,
    });
    // res.json(data);

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

async function getAllRests(req, res, next) {
  try {
    var {
      // approve_pageIndex,
      // approve_pageSize,
      all_pageIndex,
      all_pageSize,
      // pending_pageIndex,
      // pending_pageSize,
    } = req.body;

    const connection = makeDb();

    // var offset1 = parseInt(approve_pageIndex) * parseInt(approve_pageSize);
    // var offset3 = parseInt(pending_pageIndex) * parseInt(pending_pageSize);
    // var approving_total = await connection.query(
    //   `select * from restaurants where status ='approving'`
    // );

    // var approve_query = `select r.*, ra.first_name, ra.last_name, ra.email, ra.login_type
    //     from restaurants as r
    //     left join restaurants_admin as ra on ra.id = r.res_admin_id
    //     where status ='approving' ORDER BY created_at DESC LIMIT ?, ?`;

    // var approving = await connection.query(approve_query, [
    //   offset1,
    //   approve_pageSize,
    // ]);

    var offset2 = parseInt(all_pageIndex) * parseInt(all_pageSize);

    // var all_query = `select r.*, ra.first_name, ra.last_name, ra.email, ra.login_type
    //     from restaurants as r
    //     left join restaurants_admin as ra on ra.id = r.res_admin_id
    //     where status ='approved' ORDER BY created_at DESC LIMIT ?, ?`;
    var all_query = `select r.*, ra.first_name, ra.last_name, ra.email, ra.login_type,ra.full_access,sp.title as package_name,s.subscription_type,s.package_plan,s.expire_date
        from restaurants as r 
        left join restaurants_admin as ra on ra.id = r.res_admin_id left join subscription_package as sp on ra.package_id = sp.id left join subscription as s on ra.subscription_id = s.id
        ORDER BY created_at DESC LIMIT ?, ?`;

    var all = await connection.query(all_query, [offset2, all_pageSize]);
    // console.log(all)

    var all_total = await connection.query(
      `select Count(*) as count from restaurants WHERE isDeleted = 0`
    );
    // let pendingRes = await connection.query(
    //   `SELECT * FROM restaurants WHERE status = "pending"`,
    //   [offset3, pending_pageSize]
    // );

    var data = {
      count: all_total[0].count,
      // approving_total: approving_total.length,
      data: all,
      // approving: approving,
      // pendingRes: pendingRes,
      // pendingResTotal: pendingRes.length,
    };
    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data fetched successfully",
      count: data.count,
      data: data.data,
    });
    // res.json(data);
    connection.close();

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

async function getRestDetail(req, res, next) {
  try {
    var { rest_id } = req.body;

    const connection = makeDb();
    var data = {};

    /** for the restaurant page */

    var query = `SELECT r.restaurant_id, r.title, r.fulldescription, r.shortdescription, r.thumbnail, r.offer_menu, r.full_menu,
                        r.open_time, r.close_time, r.food_types, r.average_price, r.block_date,
                        r.address1, r.address2, r.city, r.lat, r.lng, 
                        rv.sum_mark, rv.count_review, cuisine.title as cuisine 
                        FROM restaurants AS r
                        LEFT JOIN 
                            (SELECT SUM(mark)/COUNT(id) AS sum_mark, COUNT(id) AS count_review, restaurant_id 
                            FROM restaurant_reviews) AS rv 
                            ON rv.restaurant_id = r.restaurant_id
                        LEFT JOIN cuisine_category AS cuisine ON cuisine.id = r.cuisine 
                        WHERE r.restaurant_id = ? LIMIT 1`;

    var rest = await connection.query(query, [rest_id]);
    var images = await connection.query(
      `SELECT url as image, url as thumbImage FROM restaurant_image WHERE restaurant_id=?`,
      [rest_id]
    );
    var seats = []; //await connection.query(`SELECT option, COUNT(option) FROM restaurant_seats WHERE restaurant_id=? GROUP BY option`, [rest_id]);
    var menus = await connection.query(
      "select * from restaurant_menus where restaurant_id = ?",
      [rest_id]
    );

    var review_query = `SELECT rv1.*, new_rv.*, c.first_name, c.last_name FROM restaurant_reviews AS rv1
                                LEFT JOIN (
                                    SELECT COUNT(rv.customer_id) AS customer_reviews, MAX(rv.id) AS c_id
                                    FROM  restaurant_reviews  AS rv
                                    LEFT JOIN customers AS c ON c.id = rv.customer_id
                                    GROUP BY rv.customer_id
                                    ) AS new_rv ON new_rv.c_id = rv1.id
                                LEFT JOIN customers AS c ON c.id =  rv1.customer_id
                                WHERE c_id IS NOT NULL
                                AND rv1.restaurant_id=?`;

    var reviews = await connection.query(review_query, [rest_id]);

    var transactions = await connection.query(
      `select * from transactions where restaurant_id = ?`,
      [rest_id]
    );

    /**end for the restaurant page */
    if (rest.length > 0) {
      data = {
        rest: rest.length > 0 ? rest[0] : [],
        images: images,
        seats: seats,
        reviews: reviews,
        menus: menus,
        transactions: transactions,
      };
      res.status(200);
      res.json({
        statusCode: 200,
        message: "Data fetched successfully",
        data,
      });
    } else {
      res.json({
        statusCode: 404,
        message: "Data not found",
      });
    }

    connection.close();
  } catch (err) {
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Server Error!",
      error: err,
    });
  }
}

async function updateRest(req, res, next) {
  try {
    var { rest_id, status = null, full_access = null } = req.body;
    const connection = makeDb();
    if (status) {
      await connection.query(
        `update restaurants set status=? where restaurant_id=?`,
        [status, rest_id]
      );
    }
    full_access = parseInt(full_access);

    if (full_access === 0 || full_access === 1) {
      await connection.query(
        `update restaurants_admin LEFT JOIN restaurants ON restaurants.res_admin_id = restaurants_admin.id set full_access = ? where restaurants.restaurant_id = ? `,
        [full_access, rest_id]
      );
    }
    // var offset1 = 0;
    // var offset3 = 0;
    // var approving_total = await connection.query(
    //   `select COUNT(*) AS count from restaurants where status ='approving'`
    // );
    let restaurant = await connection.query(
      `select * from restaurants as r 
        left join restaurants_admin as ra on ra.id = r.res_admin_id
        where r.restaurant_id = ?`,
      [rest_id]
    );
    // var approve_query = `select r.*, ra.first_name, ra.last_name, ra.email, ra.login_type,ra.full_access
    //     from restaurants as r
    //     left join restaurants_admin as ra on ra.id = r.res_admin_id
    //     where status ='approving' ORDER BY created_at DESC LIMIT ?, ?`;

    // var approving = await connection.query(approve_query, [offset1, 10]);

    // var offset2 = 0;

    // var all_query = `select r.*, ra.first_name,ra.last_name, ra.email, ra.login_type,ra.full_access
    //     from restaurants as r
    //     left join restaurants_admin as ra on ra.id = r.res_admin_id
    //     where status !='pending' ORDER BY created_at DESC LIMIT ?, ?`;

    // var all = await connection.query(all_query, [offset2, 10]);

    // var all_total = await connection.query(
    //   `select Count(*) AS count from restaurants where status !='pending'`
    // );
    // let pendingRes = await connection.query(
    //   `SELECT COUNT(*) AS count FROM restaurants WHERE status = "pending"`,
    //   [offset3, 10]
    // );

    // var data = {
    //   // all_total: all_total[0].count,
    //   // approving_total: approving_total[0].count,
    //   // all: all,
    //   // approving: approving,
    //   // pendingRes: pendingRes,
    //   // pendingResTotal: pendingRes[0].count,
    // };
    connection.close();

    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data updated successfully",
      data: restaurant[0],
    });
    // res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Server Error",
      error: err,
    });
  }
}
async function deleteRest(req, res) {
  const connection = makeDb();
  let restaurant = `select * from restaurants where id ${req.params.id}`;
  if (restaurant != 0) {
    let query = await connection.query(
      `UPDATE restaurants
  SET isDeleted = 1
  WHERE restaurant_id = ?`,[req.params.id]
    );
    connection.close();

    res.status(204);
    res.json({
      statusCode: 204,
      message: "Data deleted Successfully",
    });
  } else {
    res.status(404);
    res.json({
      statusCode: 404,
      message: "Data not found",
    });
  }
}
// var blogContent = "";

// function loopForBasecode(cont) {
//   var imgstart = cont.indexOf('src="data:image/');

//   var base64Data = "";
//   if (imgstart > 0) {
//     var _cont = cont.substr(imgstart).replace('src="data:image/', "");

//     var type = _cont.substring(0, _cont.indexOf(";base64,"));
//     _cont = _cont.replace(type + ";base64,", "");

//     base64Data = _cont.substring(0, _cont.indexOf('"'));

//     var _storyurl = path.join(blogpath, `/blogs`);
//     var filename = `/blog_${Date.now()}.` + type;

//     var storyurl = path.join(_storyurl, filename);

//     var _fullpath = path.join(blogfullpath, `/blogs`);
//     fs.ensureDir(_fullpath);

//     fs.writeFile(_fullpath + filename, base64Data, "base64", function (err) {});

//     cont = cont.replace(
//       "data:image/" + type + ";base64," + base64Data,
//       storyurl
//     );

//     console.log("cont", cont.length);

//     loopForBasecode(cont);
//   } else {
//     blogContent = cont;
//     return;
//   }
// }

async function createBlog(req, res, next) {
  // Make sure that he upload path exits

  try {
    let _storage = await MulterImg(req, res, Bloguploadpath);
    const upload = multer({ storage: _storage }).fields([
      { name: "thumbnail" },
      { name: "cover_image" },
    ]);

    upload(req, res, async function (err) {
      var { rest_owner_id, content, title, featured_blog, status } = req.body;

      var slug = await slugFilter(title)
      let thumbnail, cover_image;

      if (Object.keys(req.files).length) {
        if (req.files.thumbnail.length) {
          thumbnail = `${req.files.thumbnail[0].path}`;
        }

        if (req.files.cover_image) {
          cover_image = `${req.files.cover_image[0].path}`;
        }
      }

      const connection = makeDb();
      try {
        let BlogInsertData = await connection.query(
          `INSERT INTO blogs (rest_owner_id, content, thumbnail, cover_image, title, slug,status) VALUES (?, ?, ?, ?, ?,?,?)`,
          [rest_owner_id, content, thumbnail, cover_image, title, slug, status]
        );
        // if (featured_blog == "true") {
        //   console.log(z.insertId);
        let featuredBlogData = await connection.query(
          `SELECT * FROM feautured_blogs `
        );

        if (featuredBlogData.length > 0) {
          await connection.query(
            `UPDATE feautured_blogs SET BlogId = ${
              BlogInsertData.insertId
            }, featured=${featured_blog == "true" ? 1 : 0}`
          );
          // let insertQuery = JSON.stringify(BlogInsertData);

          // await connection.query(
          //   `DELETE FROM feautured_blogs WHERE featured = true `
          // );
          // await connection.query(
          //   `INSERT INTO feautured_blogs (featured) VALUES (?)`,

          //   [featured_blog]
          // );
        } else {
          // console.log(BlogInsertData)
          await connection.query(
            `INSERT INTO feautured_blogs (BlogId, featured)  VALUES (?, 0) `[BlogInsertData.insertId]
          );
        }
        let data = await connection.query(
          `SELECT blogs.*, feautured_blogs.featured FROM blogs LEFT JOIN feautured_blogs ON feautured_blogs.BlogId = blogs.id ORDER BY created_at DESC LIMIT 1`
        );
        connection.close();

        res.status(201);
        res.json({
          statusCode: 201,
          message: "Data created successfully",
          blog: data[0],
        });
        // }
      } catch (error) {
        // console.log(error)
        if (error.code == "ER_DUP_ENTRY" || error.errno == 1062) {
          return res.status(409).json({
            statusCode: 409,
            message: "Title Already exist please use another title !",
            error: error,
          });
        }
      }

      // if(SlugValdidation == 1){
      //  return res.status(500).json({message:"Please enter unique slug"})
      // }

      //  else if (featured_blog == false) {
      //   await connection.query(
      //     `UPDATE feautured_blogs SET featured = 'false' WHERE featured = true`
      //   );
      // }
      // var blogs = await connection.query(`SELECT * FROM blogs`);
    });
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error!",
      error: err,
    });
  }
}

// console.log(path.join(__dirname + "media\uploads\blogs\1678187816873_res_3.jpg"));

async function updateBlog(req, res, next) {
  // const Bloguploadpath = "media/uploads/blogs";
  // const Bloguploadfullpath = path.join(
  //   __dirname,
  //   `./../../${environment}/${Bloguploadpath}`
  // ); // Register the upload path
  // fs.ensureDir(Bloguploadpath); // Make sure that he upload path exits

  const connection = makeDb();
  let _storage = await MulterImg(req, res, Bloguploadpath);

  const upload = multer({ storage: _storage }).fields([
    { name: "thumbnail" },
    { name: "cover_image" },
  ]);

  upload(req, res, async function (err) {
    var { content, title, featured_blog, status, thumbnail, cover_image } =
      req.body;
    var slug = await slugFilter(title)
    const { id } = req.params;
    let SetVariables = `title = ? ,  content = ? , slug = ?`;

    // var _storyurl = Bloguploadpath;

    if (Object.keys(req.files).length) {
      if (req.files.thumbnail.length) {
        thumbnail = `${req.files.thumbnail[0].path}`;
        let newPathImg = thumbnail.split("\\").join("\\\\");
        SetVariables += `, thumbnail= "${newPathImg}"`;
      }

      if (req.files.cover_image) {
        cover_image = `${req.files.cover_image[0].path}`;
        let newPathImgcover = cover_image.split("\\").join("\\\\");
        SetVariables += `, cover_image= "${newPathImgcover}"`;
      }
    }
    let Query = `UPDATE blogs SET ${SetVariables} WHERE id = ${id}`;

    await connection.query(Query, [title, content, slug]);

    let featuredBlogData = await connection.query(
      "SELECT * FROM feautured_blogs where BlogId = " + id
    );

    if (featuredBlogData.length || featured_blog == "true") {
      let featureUpdateQuery = `UPDATE feautured_blogs SET BlogId = ?, featured = ${
        featured_blog == "true" ? 1 : 0
      }`;

      await connection.query(featureUpdateQuery,[id]);
    }

    let data = await connection.query(
      `SELECT * FROM blogs LEFT JOIN feautured_blogs ON blogs.id = feautured_blogs.BlogId where blogs.id = ?`,[id]
    );
    connection.close();
    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data updated successfully",
      data,
    });
  });
}
async function deleteBlogById(req, res, next) {
  try {
    const connection = makeDb();
    var deleteBlog = await connection.query(`UPDATE blogs
  SET isDeleted = 1
   WHERE id = ${req.params.id}`);
    var responseMessage = await connection.query(
      `SELECT * FROM blogs where id = ?`,[req.params.id]
    );
    if (responseMessage != 0) {
      res.status(204);
      res.json({
        statusCode: 204,
        message: "Your Blog deleted Successfully",
      });
    } else {
      res.status(404);
      res.json({
        statusCode: 404,
        message: "Please Enter Valid BlogId",
      });
    }
    connection.close();
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error!",
      error: err,
    });
  }
}
// async function getBlogs(req, res, next) {
//   try {
//     const connection = makeDb();
//     const { slug } = req.body;
//     console.log(slug)
//     if (!slug || slug == null) {
//       res.json({
//         statusCode: 403,
//         message: "Slug required !",
//       });
//     } else {
    
//       var blogs = await connection.query(`SELECT * FROM blogs WHERE slug = ? `,[slug]);
//       connection.close();

//       res.status(200);
//       res.json({
//         statusCode: 200,
//         messsage: "Data featched successfully",
//         data: blogs[0],
//       });
//     }
//   } catch (err) {
//     console.log(err);
//     res.status(500);
//     res.json({
//       statusCode: 500,
//       message: "Internal Error!",
//       error: err,
//     });
//   }
// }
// async function getblogsbyuserid(req, res, next) {
//   try {
//     const connection = makeDb();
//     var blogs = await connection.query(`SELECT * FROM blogs'`);
//     connection.close();

//     res.status(200);
//     res.json({
//       statusCode: 200,
//       message: "Data fetched successfully",
//       data: blogs,
//     });
//   } catch (err) {
//     res.status(500);
//     res.json({
//       statusCode: 500,
//       message: "Internal Error!",
//       error: err,
//     });
//   }
// }

async function getAllTransactions(req, res, next) {
  try {
    var { all_pageIndex, all_pageSize } = req.body;

    const connection = makeDb();

    var offset2 = parseInt(all_pageIndex) * parseInt(all_pageSize);

    var all_query = `SELECT t.amount, t.paid_at, t.description, r.title AS r_name, 
        CONCAT(ro.first_name, ' ', ro.last_name) AS user_name FROM transactions AS t
        LEFT JOIN restaurants_admin AS ro ON ro.id = t.rest_owner_id
        LEFT JOIN restaurants AS r ON r.restaurant_id = t.restaurant_id ORDER BY paid_at DESC LIMIT ?, ?`;

    var all = await connection.query(all_query, [offset2, all_pageSize]);

    var all_total = await connection.query(
      `select COUNT(*) AS count from transactions`
    );

    var total_price = await connection.query(
      `SELECT SUM(amount) AS total FROM transactions`
    );
    var t_price = 0;
    if (total_price && total_price.length > 0) {
      t_price = total_price[0].total;
    }

    var data = {
      all_total: all_total[0].count,
      all: all,
      total: t_price,
    };
    connection.close();

    res.status(200);
    res.json({
      statusCode: 200,
      message: "Data fetched successfully",
      data: {
        all: data.all,
        total: data.total,
        count: all_total,
      },
    });

    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Error!",
      error: err,
    });
  }
}

async function getSettingData(req, res, next) {
  try {
    const connection = makeDb();

    var data = await connection.query(`select * from settings`);
    connection.close();

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
      message: "internal server error",
      error: err,
    });
  }
}

async function updateSettingData(req, res, next) {
  try {
    const connection = makeDb();

    var address = req.body.address;

    var social = req.body.social;
    var setting = await connection.query(`select * from settings`);
    if (setting && setting.length > 0) {
      var data = await connection.query(
        `update settings set generic=?, social=? where id = ?`,
        [JSON.stringify([address]), JSON.stringify([social]), setting[0].id]
      );
    } else {
      var data = await connection.query(
        `insert settings (generic, social) values (?, ?)`,
        [JSON.stringify([address]), JSON.stringify([social])]
      );
    }

    connection.close();

    res.status(200);

    res.json({
      statusCode: 200,
      message: "Data updated successfully",
      data,
    });

    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode: 500,
      message: "Internal Server Error",
      error: err,
    });

    return;
  }
}
