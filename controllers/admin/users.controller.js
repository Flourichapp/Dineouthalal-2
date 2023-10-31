const { makeDb } = require('../../_helpers/db');
const path = require('path');               // Used for manipulation with path
const fs = require('fs-extra');             // Classic fs
const { environment } = require('../../env');
const carduploadpath = 'media/uploads/card/';
// const carduploadfullPath = path.join(__dirname, `/../../../${environment}/${carduploadpath}`); // Register the upload path

const avataruploadpath = 'media/uploads/avatar/';
// const avataruploadfullPath = path.join(__dirname, `/../../../${environment}/${avataruploadpath}`); // Register the upload path

fs.ensureDir(carduploadpath); // Make sure that he upload path exits
fs.ensureDir(avataruploadpath); // Make sure that he upload path exits

var MailConfig = require('../../_helpers/email');
// var sendApproveCode = MailConfig.sendApproveCode;
// var sendApproveCodeSMTP = MailConfig.sendApproveCodeSMTP;
// var main = MailConfig.main;

module.exports = {
    getrestaurants,
    getCustomers,
    getPendingCreator,
    getCreatorDetail,
    approveCreator,
    getSubscribers
};

async function getPendingCreator(req, res, next) {
    const connection = makeDb();

    var pendings = await connection.query("select id, first_name, last_name, avatar, created_at from restaurants where approved=FALSE"); // pending users
    connection.close();
   
    res.status(200)
    res.json(pendings)
}

async function getSubscribers(req, res, next) {
    const connection = makeDb();
    var query = `SELECT id, first_name, last_name, email, subscribe AS status, 'customer' AS type, created_at FROM customers
    WHERE is_deleted != 1 UNION
     SELECT id, '' AS first_name, '' AS last_name, email, status, 'visitor' AS type, created_at FROM subscribers ORDER BY created_at ;`
    var rows = await connection.query(query);
    connection.close();

    res.status(200);
    res.json({
      statusCode:200,
      message:"Data fetched successfully",
      rows
    });

}

async function getrestaurants(req, res, next) {
    const connection = makeDb();
    var pendings = await connection.query("select id, first_name, last_name, avatar,approved,created_at from restaurants");
    connection.close();

    res.status(200)
    res.json(pendings)
}
async function getCustomers(req, res, next) {
    const connection = makeDb();
    var pendings = await connection.query("select id, first_name, last_name, avatar, created_at from customers");
    connection.close();

    res.status(200)
    res.json(pendings)
}

async function getCreatorDetail(req, res, next) {
    var {userid} = req.body;
    const connection = makeDb();

    var rows = await connection.query(`SELECT *, c.id as cid from restaurants as c left join restaurant_profile as cp on c.id=cp.creator_id where c.id=?`, [userid]);
    connection.close();

    if(rows && rows.length > 0) {
        res.status(200)
        res.json(rows[0])
    }else{
        res.status(510);
        res.json('There is not such user');
    }
}

async function approveCreator(req, res, next) {
    var {userid} = req.body;
    const connection = makeDb();

    var rows = await connection.query(`UPDATE restaurants SET approved=1 where id=?`, [userid]);
        rows = await connection.query(`SELECT *, c.id as cid from restaurants as c left join restaurant_profile as cp on c.id=cp.creator_id where c.id=?`, [userid]);
    // var user = rows[0];

    // create random code and add to random code table.
    var code = Math.floor(1000 + Math.random() * 9000);
    await connection.query(`insert into verify_code (creator_id, code) values (?, ?)`,[userid, code]);

    // send mail with approve code
    // sendApproveCode('Flourich', user.email, code, '', '', '');
    // sendApproveCodeSMTP('Flourich', user.email, code, '', '', '');
    // await main();
    connection.close();

    if(rows && rows.length > 0) {
        res.status(200)
        res.json(rows[0])
    }else{
        res.status(510);
        res.json('There is not such user');
    }
}

function omitPassword(user) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
}