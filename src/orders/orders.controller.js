const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

// MIDDLEWARE
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order not found: orderId ${foundOrder}`,
  });
}

// OPERATION HANDLERS
// [GET ALL] orders
function list(req, res) {
  res.json({ data: orders });
}
// [GET ONE] order
function read(req, res) {
  res.json({ data: res.locals.order });
}

module.exports = {
  list,
  read: [orderExists, read],
  // create: [validation, create],
  // update: [orderExists, validation,  update],
  // delete: [orderExists, destroy],
  // // don't need? orderExists, // export to make 404 middleware available for nested route
};
