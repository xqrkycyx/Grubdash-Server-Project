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
    message: `Order not found: orderId ${orderId}`,
  });
}
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}
function idsMatchIfPresent(req, res, next) {
  const { data = {} } = req.body;

  if (
    data &&
    data.id !== undefined &&
    data.id !== null &&
    data.id !== "" &&
    data.id !== res.locals.order.id
  ) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${data.id}, Route: ${res.locals.order.id}.`,
    });
  }
  next();
}

function orderStatusIsValid(req, res, next) {
  // UPDATE validations
  if (req.method === "PUT") {
    // Reject PUT if request's proposed status update is not valid
    const proposedStatus = req.body.data.status;
    const validStatusUpdates = [
      "pending",
      "preparing",
      "out-for-delivery",
      "delivered",
    ];
    if (!validStatusUpdates.includes(proposedStatus)) {
      return next({
        status: 400,
        message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
      });
    }

    // Reject PUT if status of order is already delivered
    const currentStatus = res.locals.order.status;
    if (currentStatus === "delivered") {
      return next({
        status: 400,
        message: `A delivered order cannot be changed`,
      });
    }
  }

  // DESTROY validation
  if (req.method === "DELETE") {
    const currentStatus = res.locals.order.status;
    // Reject DELETE if status of order is already delivered
    if (currentStatus !== "pending") {
      return next({
        status: 400,
        message: `An order cannot be deleted unless it is pending`,
      });
    }
  }

  next();
}

function dishesValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  // Dishes field is an array
  if (!Array.isArray(dishes)) {
    return next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  }
  // Dishes array isn't empty
  if (dishes.length === 0) {
    return next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  }

  // VALIDATE DISH DETAILS
  for (let index = 0; index < dishes.length; index++) {
    const { quantity } = dishes[index];

    // Dish quantity is an integer
    if (!Number.isInteger(quantity)) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }

    // Dish quantity is not zero
    if (quantity <= 0) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  }

  next();
}

// OPERATION HANDLERS
// GET ALL orders
function list(req, res) {
  res.json({ data: orders });
}
// GET ONE order
function read(req, res) {
  res.json({ data: res.locals.order });
}
// UPDATE order
function update(req, res) {
  const order = res.locals.order;
  const {
    deliverTo,
    mobileNumber,
    dishes,
    quantity,
    status = {},
  } = req.body.data;
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.dishes = dishes;
  order.quantity = quantity;
  order.status = status;

  res.json({ data: order });
}
// CREATE order
function create(req, res) {
  const { deliverTo, mobileNumber, dishes = {} } = req.body.data;
  const newOrder = {
    id: nextId(),
    status: "pending",
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}
// DELETE order
function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === Number(orderId));
  // `splice()` returns an array of the deleted elements, even if it is one element
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishesValid,
    create,
  ],
  update: [
    orderExists,
    idsMatchIfPresent,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    bodyDataHas("status"),
    orderStatusIsValid,
    dishesValid,
    update,
  ],
  delete: [orderExists, orderStatusIsValid, destroy],
};
