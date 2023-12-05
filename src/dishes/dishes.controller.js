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
    message: `Dish does not exist: ${dishId}`,
  });
}
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}
function priceIsValidNumber(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
  }
  next();
}
function idsMatchIfPresent(req, res, next) {
  const { data: { id } = {} } = req.body;
  if (
    id !== undefined &&
    id !== null &&
    id !== "" &&
    id !== res.locals.dish.id
  ) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${res.locals.dish.id}`,
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
// UPDATE dish
function update(req, res) {
  const dish = res.locals.dish;
  const { name, description, price, image_url = {} } = req.body.data;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}
function create(req, res) {
  const { name, description, price, image_url = {} } = req.body.data;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

module.exports = {
  list,
  read: [dishExists, read],
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    priceIsValidNumber,
    create,
  ],
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
};
