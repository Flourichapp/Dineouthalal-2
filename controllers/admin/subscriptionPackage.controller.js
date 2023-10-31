const { makeDb } = require("../../_helpers/db");
module.exports.deletePackage = async (req, res) => {
  const connection = makeDb();
  const { id } = req.query;
  if (id) {
    connection.query(`DELETE FROM subscription_package where id = ? `,[id]);
    res.status(204).json({
      statusCode: 204,
      message: "Data deleted successfully",
    });
    connection.close();
  } else {
    res.status(403).json({
      statusCode: 403,
      message: "Id is missing !",
    });
  }
};
module.exports.updatePackage = async (req, res) => {
  const connection = makeDb();
  const { id } = req.query;
  const {
    access_list,
    features,
    title,
    prices,
    product_id,
    status,
    features_not_include,
    sequence,
    description

  } = req.body;
  if (id) {
    const removeBracketsAccesslist = String(access_list).replace(
      /[\[\]']+/g,
      ""
    );
    // const PricesArrayConvertIntoString = JSON.stringify(prices);
    // const featuresArrayConvertIntoString = JSON.stringify(features);
    // const featuresNotIncludeIntoString  = JSON.stringify(features_not_include)
    connection.query(
      `UPDATE subscription_package
      SET access_list = ?,features = ? , title = ?,
      prices = ? ,product_id = ? ,status = ?,features_not_include = ? , sequence = ? , description = ?
      WHERE id = ?`,
      [
        removeBracketsAccesslist,
        features,
        title,
        prices,
        product_id,
        status,
        features_not_include,
        sequence,
        description,
        id
      ]
    );
    res.status(200).json({
      statusCode: 200,
      message: "Data Update successfully",
    });
    connection.close();
  } else {
    res.status(403).json({
      statusCode: 403,
      message: "Id is missing !",
    });
  }
};

module.exports.getPackage = async (req, res) => {
  // const { pageIndex, pageSize } = req.query;
  // let offset = parseInt(pageIndex) * parseInt(pageSize);
  const { id } = req.query;
  if (id && id != "null") {
    const connection = makeDb();
    let data = await connection.query(
      `SELECT id,access_list,features,features_not_include,sequence,description,title,prices,product_id,status from subscription_package WHERE id = ?`,[id]
    );

    if (data && data.length) {
      data[0].features = JSON.parse(data[0].features);
      data[0].prices = JSON.parse(data[0].prices);
      data[0].features_not_include = JSON.parse(data[0].features_not_include);
      if (data[0].access_list.length) {
        const filterIds = data[0].access_list.split(",");

        const row2 = await connection.query(
          `SELECT id,screen_name,url,slug,subscreen,parent_screen FROM access_lists WHERE id in (?)`,[filterIds]
        );
        data[0].access_list = row2;
      }
      // const allcount = await connection.query(
      //   `SELECT COUNT(*) as count from subscription_package where id = ${id}`
      // );
      res.status(200).json({
        statusCode: 200,
        message: "Data fetched successfully",
        data: data[0],
        // count: allcount[0].count,
      });
    } else {
      res.status(404).json({
        statusCode: 404,
        message: "No data found",
      });
    }
  } else {
    res.status(403).json({
      statusCode: 403,
      message: "Id is missing !",
    });
  }
};
module.exports.getPackages = async (req, res) => {
  const { pageIndex = 0, pageSize = 100 } = req.query;
  let offset = parseInt(pageIndex) * parseInt(pageSize);
  const connection = makeDb();
  let data =
    await connection.query(`SELECT id,access_list,features,features_not_include,sequence,description,title,prices,product_id,status from subscription_package LIMIT ${offset},${pageSize}
    `);
  if (data.length > 0) {
    let dataintoArray = data.map((item) => {
      item.prices = JSON.parse(item.prices) || item.prices;
      item.features =
        (item.features && JSON.parse(item.features)) || item.features;
      item.features_not_include =
        (item.features_not_include && JSON.parse(item.features_not_include)) ||
        item.features_not_include;
      return item;
    });
    data = dataintoArray;
  }

  const allcount = await connection.query(
    `SELECT COUNT(*) as count from subscription_package`
  );
  res.status(200).json({
    statusCode: 200,
    message: "Data featched successfully",
    data,
    count: allcount[0].count,
  });
  connection.close();
};

module.exports.createPackage = async (req, res) => {
  const connection = makeDb();
  const {
    access_list,
    features,
    title,
    prices,
    product_id,
    status,
    features_not_include,
    sequence,
    description,
  } = req.body;

  try {
    if (!title || title == null) {
      res.status(403).json({
        statusCode: 403,
        message: "title field are required !",
      });
    } else if (!prices || prices == null) {
      res.status(403).json({
        statusCode: 403,
        message: "prices fields are required !",
      });
    } else {
      const removeBracketsAccesslist = String(access_list).replace(
        /[\[\]']+/g,
        ""
      );
      const sqlQuery = `INSERT INTO subscription_package(access_list,features,title,prices,product_id,status,features_not_include,sequence,description) VALUES(?,?,?,?,?,?,?,?,?)`;
      connection.query(sqlQuery, [
        removeBracketsAccesslist,
        features,
        title,
        prices,
        product_id,
        status,
        features_not_include,
        sequence,
        description,
      ]);
      res.status(201).json({
        statusCode: 201,
        message: "Data created successfully",
      });
      connection.close();
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
      error: err,
    });
    connection.close();
  }
};
