const { makeDb } = require("../../_helpers/db");
const path = require("path"); // Used for manipulation with path
const fs = require("fs-extra"); // Classic fs
const { environment } = require("../../env");
const multer = require("multer");
const { stat } = require("fs");
const { error } = require("console");
const cuisinecategoryuploadpath = "media/uploads/admin/cuisinecategory";
// const caisinecategoryuploadfullPath = path.join(
//   __dirname,
//   `./../../${environment}/${cuisinecategoryuploadpath}`
// ); // Register the upload path

const nighttypeuploadpath = "media/uploads/admin/nighttype";
// const nighttypeuploadfullPath = path.join(
//   __dirname,
//   `./../../${environment}/${nighttypeuploadpath}`
// ); // Register the upload path

const venuetypeuploadpath = "media/uploads/admin/venuetype";
// const venuetypeuploadfullPath = path.join(
//   __dirname,
//   `./../../${environment}/${venuetypeuploadpath}`
// ); // Register the upload path

fs.ensureDir(cuisinecategoryuploadpath); // Make sure that he upload path exits
fs.ensureDir(nighttypeuploadpath); // Make sure that he upload path exits
fs.ensureDir(cuisinecategoryuploadpath); // Make sure that he upload path exits

module.exports = {
  getBudget,
  addBudget,
  updateBudget,
  deleteBudget,
  getCuisineCategory,
  addCuisineCategory,
  updateCuisineCategory,
  deleteCuisineCategory,
  restoreCuisineCategory,
  getCovid,
  addCovid,
  updateCovid,
  deleteCovid,
  getDisabledFacility,
  addDisabledFacility,
  updateDisabledFacility,
  deleteDisabledFacility,
  getDressCode,
  addDressCode,
  updateDressCode,
  deleteDressCode,
  getMusicType,
  addMusicType,
  updateMusicType,
  deleteMusicType,
  getNightType,
  addNightType,
  updateNightType,
  deleteNightType,
  getVenueType,
  addVenueType,
  updateVenueType,
  deleteVenueType,
};

async function getBudget(req, res, next) {
  try {
    const connection = makeDb();
    // firsttab
    var rows = await connection.query(
      `SELECT * from admin_budget_type where deleted_at IS NULL`
    );
    res.status(200);
    res.json(rows);
    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      message: "Internal Error",
      error: err,
    });
    return;
  }
}

async function updateBudget(req, res, next) {
  try {
    const connection = makeDb();
    var { id, title, minprice, maxprice, status } = req.body;
    // update new settings
    await connection.query(
      `UPDATE admin_budget_type SET title= ?, minprice = ?, maxprice= ?, status = ? WHERE id = ?`,
      [title, minprice, maxprice, status, id]
    );

    res.status(200);
    res.json({ message: "Success" });

    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      message: "Internal Error",
      error: err,
    });
    return;
  }
}

async function addBudget(req, res, next) {
  try {
    const connection = makeDb();
    var { title, minprice, maxprice, status } = req.body;
    // update new settings
    await connection.query(
      `INSERT INTO admin_budget_type (title, minprice, maxprice, status) VALUES (?, ?, ?, ?)`,
      [title, minprice, maxprice, status]
    );

    var rows = await connection.query(
      `select * from admin_budget_type where deleted_at IS NULL`
    );
    res.status(200);
    res.json(rows);

    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      message: "Internal Error",
      error: err,
    });
    return;
  }
}

async function deleteBudget(req, res, next) {
  try {
    const connection = makeDb();
    var { id } = req.body;
    // update new settings
    await connection.query(
      `UPDATE admin_budget_type SET deleted_at= ? WHERE id = ?`,
      [new Date(), id]
    );

    res.status(200);
    res.json({ message: "Success" });

    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      message: "Internal Error",
      error: err,
    });
    return;
  }
}

// CUISIINE CATEGORY API FUNCTIONS

async function getCuisineCategory(req, res, next) {
  try {
    const connection = makeDb();
    // firsttab
    var rows = await connection.query(`SELECT * from cuisine_category`);
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

async function addCuisineCategory(req, res, next) {
  try {
    var { title } = req.body;
    // console.log(req.body);
    const connection = makeDb();
    var exist = await connection.query(
      `select * from cuisine_category where title=?`,
      [title]
    );
    if (exist && exist.length > 0) {
      connection.close();

      res.status(222);
      res.json({
        statusCode: 222,
        message: "same title",
      });
      return;
    }
    var result = await connection.query(
      `INSERT INTO cuisine_category (title) VALUES (?)`,
      [title]
    );

    var rows = await connection.query(
      `select * from cuisine_category where deleted_at IS NULL`
    );
    connection.close();

    if (rows && rows.length > 0) {
      res.status(201);
      res.json({
        statusCode: 201,
        data: rows,
      });
    } else {
      res.status(400);
      res.json({
        statusCode: 400,
        message: "Internel error",
      });
    }
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

async function updateCuisineCategory(req, res, next) {
  try {
    var { id, title } = req.body;
    var filename = "";

    const connection = makeDb();
    var exist = await connection.query(
      `select * from cuisine_category where title=? and id <> ?`,
      [title, id]
    );
    if (exist && exist.length > 0) {
      connection.close();

      res.status(222);
      res.json({
        statusCode: 222,
        message: "Title is alrealy used.",
      });
      return;
    }

    await connection.query(`UPDATE cuisine_category SET title=? WHERE id=?`, [
      title,
      id,
    ]);

    var rows = await connection.query(
      `select * from cuisine_category where deleted_at IS NULL`
    );
    connection.close();

    if (rows && rows.length > 0) {
      res.status(200);
      res.json({
        statusCode: 200,
        data: rows,
      });
    } else {
      res.status(400);
      res.json({
        statusCode: 400,
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
async function deleteCuisineCategory(req, res, next) {
  try {
    const connection = makeDb();
    var { id } = req.body;
    // update new settings
    await connection.query(
      `UPDATE cuisine_category SET deleted_at= ? WHERE id = ?`,
      [new Date(), id]
    );
    connection.close();

    res.status(204);
    res.json({
      statusCode: 204,
      message: "Data deleted successfully",
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
async function restoreCuisineCategory(req, res, next) {
  try {
    const connection = makeDb();
    var { id } = req.body;
    // update new settings
    await connection.query(
      `UPDATE cuisine_category SET deleted_at= NULL WHERE id = ?`,
      [id]
    );
    connection.close();

    res.status(201);
    res.json({
      statusCode: 201,
      message: "Data updated successfully",
    });

    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({ 
      statusCode: 500, 
      message: "Internal Error", 
      error: err 
    });
    return;
  }
}

//  COVID API FUNCTIONS

async function getCovid(req, res, next) {
  try {
    const connection = makeDb();
    // firsttab
    var rows = await connection.query(
      `SELECT * from admin_covid where deleted_at IS NULL`
    );
    res.status(200);
    res.json(rows);
    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({
      statusCode:500,
      message: "Internal Error",
      error:err
    });
    return;
  }
}

async function updateCovid(req, res, next) {
  try {
    const connection = makeDb();
    var { id, title, description, status } = req.body;
    // update new settings
    var exist = await connection.query(
      `select * from admin_covid where title=? and id <> ?`,
      [title, id]
    );
    if (exist && exist.length > 0) {
      res.status(222);
      res.json({ message: "Title is already used.", code: 222 });
      return;
    }
    await connection.query(
      `UPDATE admin_covid SET title= ?, description = ?, status = ? WHERE id = ?`,
      [title, description, status, id]
    );

    res.status(200);
    res.json({ message: "Success", code: 200 });

    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({ 
      statusCode:500,
      message: "Internal Error",
      error:err
    });
    return;
  }
}

async function addCovid(req, res, next) {
  try {
    const connection = makeDb();
    var { title, description, status } = req.body;

    // check same title
    var exist = await connection.query(
      `select * from admin_covid where title=?`,
      [title]
    );
    if (exist && exist.length > 0) {
      res.status(222);
      res.json({ message: "Title is already used.", code: 222 });
      return;
    }

    // update new settings
    await connection.query(
      `INSERT INTO admin_covid (title, description, status) VALUES (?, ?, ?)`,
      [title, description, status]
    );

    var rows = await connection.query(
      `select * from admin_covid where deleted_at IS NULL`
    );
    res.status(200);
    res.json({ data: rows, code: 200 });

    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({ 
      statusCode:500,
      message: "Internal Error",
      error:err
    });
    return;
  }
}

async function deleteCovid(req, res, next) {
  try {
    const connection = makeDb();
    var { id } = req.body;
    // update new settings
    await connection.query(
      `UPDATE admin_covid SET deleted_at= ? WHERE id = ?`,
      [new Date(), id]
    );

    res.status(200);
    res.json({ message: "Success" });

    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({ 
      statusCode:500,
      message: "Internal Error",
      error:err
    });
    return;
  }
}

// DISABLED FACILITY FUNCTIONS
async function getDisabledFacility(req, res, next) {
  try {
    const connection = makeDb();
    // firsttab
    var rows = await connection.query(
      `SELECT * from admin_disabled_facility where deleted_at IS NULL`
    );
    res.status(200);
    res.json(rows);
    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({ 
      statusCode:500,
      message: "Internal Error",
      error:err
    });
    return;
  }
}

async function updateDisabledFacility(req, res, next) {
  try {
    const connection = makeDb();
    var { id, title, description, status } = req.body;
    // update new settings
    var exist = await connection.query(
      `select * from admin_disabled_facility where title=? and id <> ?`,
      [title, id]
    );
    if (exist && exist.length > 0) {
      res.status(222);
      res.json({ message: "Title is already used.", code: 222 });
      return;
    }
    await connection.query(
      `UPDATE admin_disabled_facility SET title= ?, description = ?, status = ? WHERE id = ?`,
      [title, description, status, id]
    );

    res.status(200);
    res.json({ message: "Success", code: 200 });

    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({ 
      statusCode:500,
      message: "Internal Error",
      error:err
    });
    return;
  }
}

async function addDisabledFacility(req, res, next) {
  try {
    const connection = makeDb();
    var { title, description, status } = req.body;

    // check same title
    var exist = await connection.query(
      `select * from admin_disabled_facility where title=?`,
      [title]
    );
    if (exist && exist.length > 0) {
      res.status(222);
      res.json({ message: "Title is already used.", code: 222 });
      return;
    }

    // update new settings
    await connection.query(
      `INSERT INTO admin_disabled_facility (title, description, status) VALUES (?, ?, ?)`,
      [title, description, status]
    );

    var rows = await connection.query(
      `select * from admin_disabled_facility where deleted_at IS NULL`
    );
    res.status(200);
    res.json({ data: rows, code: 200 });

    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({ 
      statusCode:500,
      message: "Internal Error",
      error:err
    });
    return;
  }
}

async function deleteDisabledFacility(req, res, next) {
  try {
    const connection = makeDb();
    var { id } = req.body;
    // update new settings
    await connection.query(
      `UPDATE admin_disabled_facility SET deleted_at= ? WHERE id = ?`,
      [new Date(), id]
    );

    res.status(200);
    res.json({ message: "Success" });

    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({ 
      statusCode:500,
      message: "Internal Error",
      error:err
    });
    return;
  }
}

// dress code
async function getDressCode(req, res, next) {
  try {
    const connection = makeDb();
    // firsttab
    var rows = await connection.query(
      `SELECT * from admin_dress_code where deleted_at IS NULL`
    );
    res.status(200);
    res.json(rows);
    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({ 
      statusCode:500,
      message: "Internal Error",
      error:err
    });
    return;
  }
}

async function updateDressCode(req, res, next) {
  try {
    const connection = makeDb();
    var { id, title, description, status } = req.body;
    // update new settings
    var exist = await connection.query(
      `select * from admin_dress_code where title=? and id <> ?`,
      [title, id]
    );
    if (exist && exist.length > 0) {
      res.status(222);
      res.json({ message: "Title is already used.", code: 222 });
      return;
    }
    await connection.query(
      `UPDATE admin_dress_code SET title= ?, description = ?, status = ? WHERE id = ?`,
      [title, description, status, id]
    );

    res.status(200);
    res.json({ message: "Success", code: 200 });

    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({ 
      statusCode:500,
      message: "Internal Error",
      error:err
    });
    return;
  }
}

async function addDressCode(req, res, next) {
  try {
    const connection = makeDb();
    var { title, description, status } = req.body;

    // check same title
    var exist = await connection.query(
      `select * from admin_dress_code where title=?`,
      [title]
    );
    if (exist && exist.length > 0) {
      res.status(222);
      res.json({ message: "Title is already used.", code: 222 });
      return;
    }

    // update new settings
    await connection.query(
      `INSERT INTO admin_dress_code (title, description, status) VALUES (?, ?, ?)`,
      [title, description, status]
    );

    var rows = await connection.query(
      `select * from admin_dress_code where deleted_at IS NULL`
    );
    res.status(200);
    res.json({ data: rows, code: 200 });

    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({ 
      statusCode:500,
      message: "Internal Error",
      error:err
    });
    return;
  }
}

async function deleteDressCode(req, res, next) {
  try {
    const connection = makeDb();
    var { id } = req.body;
    // update new settings
    await connection.query(
      `UPDATE admin_dress_code SET deleted_at= ? WHERE id = ?`,
      [new Date(), id]
    );

    res.status(200);
    res.json({ message: "Success" });

    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({ 
      statusCode:500,
      message: "Internal Error",
      error:err
    });
    return;
  }
}

// music type
async function getMusicType(req, res, next) {
  try {
    const connection = makeDb();
    // firsttab
    var rows = await connection.query(
      `SELECT * from admin_music_type where deleted_at IS NULL`
    );
    res.status(200);
    res.json(rows);
    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({ 
      statusCode:500,
      message: "Internal Error",
      error:err
    });
    return;
  }
}

async function updateMusicType(req, res, next) {
  try {
    const connection = makeDb();
    var { id, title, description, status } = req.body;
    // update new settings
    var exist = await connection.query(
      `select * from admin_music_type where title=? and id <> ?`,
      [title, id]
    );
    if (exist && exist.length > 0) {
      res.status(222);
      res.json({ message: "Title is already used.", code: 222 });
      return;
    }
    await connection.query(
      `UPDATE admin_music_type SET title= ?, description = ?, status = ? WHERE id = ?`,
      [title, description, status, id]
    );

    res.status(200);
    res.json({ message: "Success", code: 200 });

    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({ 
      statusCode:500,
      message: "Internal Error",
      error:err
    });
    return;
  }
}

async function addMusicType(req, res, next) {
  try {
    const connection = makeDb();
    var { title, description, status } = req.body;

    // check same title
    var exist = await connection.query(
      `select * from admin_music_type where title=?`,
      [title]
    );
    if (exist && exist.length > 0) {
      connection.close();

      res.status(222);
      res.json({ message: "Title is already used.", code: 222 });
      return;
    }

    // update new settings
    await connection.query(
      `INSERT INTO admin_music_type (title, description, status) VALUES (?, ?, ?)`,
      [title, description, status]
    );

    var rows = await connection.query(
      `select * from admin_music_type where deleted_at IS NULL`
    );
    connection.close();

    res.status(200);
    res.json({ data: rows, code: 200 });

    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({ 
      statusCode:500,
      message: "Internal Error",
      error:err
    });
    return;
  }
}

async function deleteMusicType(req, res, next) {
  try {
    const connection = makeDb();
    var { id } = req.body;
    // update new settings
    await connection.query(
      `UPDATE admin_music_type SET deleted_at= ? WHERE id = ?`,
      [new Date(), id]
    );
    connection.close();

    res.status(200);
    res.json({ message: "Success" });

    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({ 
      statusCode:500,
      message: "Internal Error",
      error:err
    });
    return;
  }
}
// night type
async function getNightType(req, res, next) {
  try {
    const connection = makeDb();
    // firsttab
    var rows = await connection.query(
      `SELECT * from admin_night_type where deleted_at IS NULL`
    );
    connection.close();

    res.status(200);
    res.json(rows);
    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({ 
      statusCode:500,
      message: "Internal Error",
      error:err
    });
    return;
  }
}

async function addNightType(req, res, next) {
  try {
    const _Storage = multer.diskStorage({
      destination(req, file, callback) {
        callback(null, nighttypeuploadfullPath);
      },
      filename(req, file, callback) {
        callback(null, `${Date.now()}_${file.originalname}`);
      },
    });

    const upload = multer({ storage: _Storage }).single("media");

    upload(req, res, async function (err) {
      var { title, description } = req.body;

      var filename = req.file.filename;
      var _storyurl = nighttypeuploadpath;
      var storyurl = path.join(_storyurl, filename);

      var _fullpath = nighttypeuploadfullPath;
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
      const connection = makeDb();
      var exist = await connection.query(
        `select * from admin_night_type where title=?`,
        [title]
      );
      if (exist && exist.length > 0) {
        connection.close();

        res.status(222);
        res.json({ message: "same title", code: 222 });
        return;
      }
      await connection.query(
        `INSERT INTO admin_night_type (title, image, description) VALUES (?, ?, ?)`,
        [title, storyurl, description]
      );
      var rows = await connection.query(
        `select * from admin_night_type where title=?`,
        [title]
      );
      connection.close();

      if (rows && rows.length > 0) {
        var newItem = rows[0];
        res.status(200);
        res.json({ data: newItem, code: 200 });
      } else {
        res.status(400);
        res.json({ message: "Internel error" });
      }
    });
  } catch (err) {
    console.log(err);
    res.status(404);
    res.json({ 
      statusCode:404,
      message: "Internal Error!",
      error:err
    });
  }
}

async function updateNightType(req, res, next) {
  try {
    const _Storage = multer.diskStorage({
      destination(req, file, callback) {
        callback(null, nighttypeuploadfullPath);
      },
      filename(req, file, callback) {
        callback(null, `${Date.now()}_${file.originalname}`);
      },
    });

    const upload = multer({ storage: _Storage }).single("media");

    upload(req, res, async function (err) {
      var { id, title, status, description } = req.body;
      var filename = "";
      if (req.file) {
        filename = req.file.filename;
        var _storyurl = nighttypeuploadpath;
        var storyurl = path.join(_storyurl, filename);

        var _fullpath = nighttypeuploadfullPath;
        fs.ensureDir(_fullpath);
      }

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
      var exist = await connection.query(
        `select * from admin_night_type where title=? and id <> ?`,
        [title, id]
      );
      if (exist && exist.length > 0) {
        connection.close();

        res.status(222);
        res.json({ message: "Title is alrealy used.", code: 222 });
        return;
      }
      if (filename) {
        await connection.query(
          `UPDATE admin_night_type SET title=?, image=?, status=?, description=? WHERE id=?`,
          [title, storyurl, status, description, id]
        );
      } else {
        await connection.query(
          `UPDATE admin_night_type SET title=?, status=?, description=? WHERE id=?`,
          [title, status, description, id]
        );
      }
      var rows = await connection.query(
        `select * from admin_night_type where deleted_at IS NULL`
      );
      connection.close();

      if (rows && rows.length > 0) {
        res.status(200);
        res.json({ data: rows, code: 200 });
      } else {
        res.status(400);
        res.json({ message: "Internel error" });
      }
    });
  } catch (err) {
    console.log(err);
    res.status(404);
    res.json({ 
      statusCode:404,
      message: "Internal Error!",
      error:err
    });
  }
}

async function deleteNightType(req, res, next) {
  try {
    const connection = makeDb();
    var { id } = req.body;
    // update new settings
    await connection.query(
      `UPDATE admin_night_type SET deleted_at= ? WHERE id = ?`,
      [new Date(), id]
    );
    connection.close();

    res.status(200);
    res.json({ message: "Success" });

    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({ 
      statusCode:500,
      message: "Internal Error",
      error:err
    });
    return;
  }
}
// // venue type

async function getVenueType(req, res, next) {
  try {
    const connection = makeDb();
    // firsttab
    var rows = await connection.query(
      `SELECT * from admin_venue_type where deleted_at IS NULL`
    );
    connection.close();

    res.status(200);
    res.json(rows);
    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({ 
      statusCode:500,
      message: "Internal Error",
      error:err
    });
    return;
  }
}

async function addVenueType(req, res, next) {
  try {
    const _Storage = multer.diskStorage({
      destination(req, file, callback) {
        callback(null, venuetypeuploadfullPath);
      },
      filename(req, file, callback) {
        callback(null, `${Date.now()}_${file.originalname}`);
      },
    });

    const upload = multer({ storage: _Storage }).single("media");

    upload(req, res, async function (err) {
      var { title, description } = req.body;

      var filename = req.file.filename;
      var _storyurl = venuetypeuploadpath;
      var storyurl = path.join(_storyurl, filename);

      var _fullpath = venuetypeuploadpath;
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
      const connection = makeDb();
      var exist = await connection.query(
        `select * from admin_venue_type where title=?`,
        [title]
      );
      if (exist && exist.length > 0) {
        connection.close();

        res.status(222);
        res.json({ message: "same title", code: 222 });
        return;
      }
      await connection.query(
        `INSERT INTO admin_venue_type (title, image, description) VALUES (?, ?, ?)`,
        [title, storyurl, description]
      );
      var rows = await connection.query(
        `select * from admin_venue_type where title=?`,
        [title]
      );
      connection.close();

      if (rows && rows.length > 0) {
        var newItem = rows[0];
        res.status(200);
        res.json({ data: newItem, code: 200 });
      } else {
        res.status(400);
        res.json({ message: "Internel error" });
      }
    });
  } catch (err) {
    console.log(err);
    res.status(404);
    res.json({ 
      statusCode:404,
      message: "Internal Error!",
      error:err
    });
  }
}

async function updateVenueType(req, res, next) {
  try {
    const _Storage = multer.diskStorage({
      destination(req, file, callback) {
        callback(null, venuetypeuploadpath);
      },
      filename(req, file, callback) {
        callback(null, `${Date.now()}_${file.originalname}`);
      },
    });

    const upload = multer({ storage: _Storage }).single("media");

    upload(req, res, async function (err) {
      var { id, title, status, description } = req.body;
      var filename = "";
      if (req.file) {
        filename = req.file.filename;
        var _storyurl = venuetypeuploadpath;
        var storyurl = path.join(_storyurl, filename);

        var _fullpath = venuetypeuploadpath;
        fs.ensureDir(_fullpath);
      }

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
      var exist = await connection.query(
        `select * from admin_venue_type where title=? and id <> ?`,
        [title, id]
      );

      if (exist && exist.length > 0) {
        connection.close();

        res.status(222);
        res.json({ message: "Title is alrealy used.", code: 222 });
        return;
      }
      if (filename) {
        await connection.query(
          `UPDATE admin_venue_type SET title=?, image=?, status=?, description=? WHERE id=?`,
          [title, storyurl, status, description, id]
        );
      } else {
        await connection.query(
          `UPDATE admin_venue_type SET title=?, status=?, description=? WHERE id=?`,
          [title, status, description, id]
        );
      }
      var rows = await connection.query(
        `select * from admin_venue_type where deleted_at IS NULL`
      );
      connection.close();

      if (rows && rows.length > 0) {
        res.status(200);
        res.json({ data: rows, code: 200 });
      } else {
        res.status(400);
        res.json({ message: "Internel error" });
      }
    });
  } catch (err) {
    console.log(err);
    res.status(404);
    res.json({ 
      statusCode:404,
      message: "Internal Error!",
      error:err
    });
  }
}

async function deleteVenueType(req, res, next) {
  try {
    const connection = makeDb();
    var { id } = req.body;
    // update new settings
    await connection.query(
      `UPDATE admin_venue_type SET deleted_at= ? WHERE id = ?`,
      [new Date(), id]
    );
    connection.close();

    res.status(200);
    res.json({ message: "Success" });

    return;
  } catch (err) {
    console.log(err);
    res.status(500);
    res.json({ 
      statusCode:500,
      message: "Internal Error",
      error:err
    });
    return;
  }
}
function makeid(length = 10) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}
