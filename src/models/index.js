import User from "../modules/user/user.model.js";
import Currency from "../modules/currency/currency.model.js";
import Fair from "../modules/fair/fair.model.js";
import Product from "../modules/product/product.model.js";
import ProductCategory from "../modules/product/productCategory.model.js";
import Sale from "../modules/sale/sale.model.js";
import SaleItem from "../modules/sale/saleItem.model.js";
import Event from "../modules/event/event.model.js";
import Expense from "../modules/expense/expense.model.js";

// Asociaciones (relaciones) entre modelos

// User - Currency
User.belongsTo(Currency, {
  foreignKey: 'preferred_currency_id',
  as: 'preferred_currency'
});

// User - Fair
User.hasMany(Fair, {
  foreignKey: 'user_id',
  as: 'fairs'
});

Fair.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User - Event
User.hasMany(Event, {
  foreignKey: 'user_id',
  as: 'events'
});

Event.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User - ProductCategory
User.hasMany(ProductCategory, {
  foreignKey: 'user_id',
  as: 'product_categories'
});

ProductCategory.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// User - Product
User.hasMany(Product, {
  foreignKey: 'user_id',
  as: 'products'
});

Product.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Product - Currency
Product.belongsTo(Currency, {
  foreignKey: 'currency_id',
  as: 'currency'
});

Currency.hasMany(Product, {
  foreignKey: 'currency_id',
  as: 'products'
});

// Product - ProductCategory
Product.belongsTo(ProductCategory, {
  foreignKey: 'category_id',
  as: 'category'
});

ProductCategory.hasMany(Product, {
  foreignKey: 'category_id',
  as: 'products'
});

// User - Sale
User.hasMany(Sale, {
  foreignKey: 'user_id',
  as: 'sales'
});

Sale.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Fair - Sale
Fair.hasMany(Sale, {
  foreignKey: 'fair_id',
  as: 'sales'
});

Sale.belongsTo(Fair, {
  foreignKey: 'fair_id',
  as: 'fair'
});

// Event - Sale
Event.hasMany(Sale, {
  foreignKey: 'event_id',
  as: 'sales'
});

Sale.belongsTo(Event, {
  foreignKey: 'event_id',
  as: 'event'
});

// Sale - SaleItem
Sale.hasMany(SaleItem, {
  foreignKey: 'sale_id',
  as: 'sale_items'
});

SaleItem.belongsTo(Sale, {
  foreignKey: 'sale_id',
  as: 'sale'
});

// Product - SaleItem
Product.hasMany(SaleItem, {
  foreignKey: 'product_id',
  as: 'sale_items'
});

SaleItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// User - Expense
User.hasMany(Expense, {
  foreignKey: 'user_id',
  as: 'expenses'
});

Expense.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Event - Expense (opcional)
Event.hasMany(Expense, {
  foreignKey: 'event_id',
  as: 'expenses'
});

Expense.belongsTo(Event, {
  foreignKey: 'event_id',
  as: 'event'
});

export {
  User,
  Currency,
  Fair,
  Product,
  ProductCategory,
  Sale,
  SaleItem,
  Event,
  Expense
}