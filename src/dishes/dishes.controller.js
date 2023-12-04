const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

// MIDDLEWARE
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish not found: dishId ${foundDish}`,
  });
}
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Must include a ${propertyName}` });
  };
}
function priceIsValidNumber(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: `price requires a valid number`,
    });
  }
  next();
}
function idsMatchIfPresent(req, res, next) {
  const { data = {} } = req.body;

  if (
    data &&
    data.id !== undefined &&
    data.id !== null &&
    data.id !== "" &&
    data.id !== res.locals.dish.id
  ) {
    return next({
      status: 400,
      message: `req.data.id ${data.id} does not match route :dishId ${res.locals.dish.id}`,
    });
  }
  next();
}
// OPERATION HANDLERS
// [GET ALL] dishes
function list(req, res) {
  res.json({ data: dishes });
}
// [GET ONE] dish
function read(req, res) {
  res.json({ data: res.locals.dish });
}
// UPDATE order
function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

module.exports = {
  list,
  read: [dishExists, read],
  // create: [validation, create],
  update: [
    dishExists,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    priceIsValidNumber,
    idsMatchIfPresent,
    update,
  ],
  // delete: [dishExists, destroy],
  // // don't need? dishExists, // export to make 404 middleware available for nested route
};
