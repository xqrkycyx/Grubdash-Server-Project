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

// OPERATION HANDLERS
// [GET ALL] dishes
function list(req, res) {
  res.json({ data: dishes });
}
// [GET ONE] dish
function read(req, res) {
  res.json({ data: res.locals.dish });
}

module.exports = {
  list,
  read: [dishExists, read],
  // create: [validation, create],
  // update: [dishExists, validation,  update],
  // delete: [dishExists, destroy],
  // // don't need? dishExists, // export to make 404 middleware available for nested route
};
