"use strict";
const { Model, Op } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    static associate(models) {

    }
    static addaTodo({ title, dueDate }) {return this.create({ title: title, dueDate: dueDate, completed: false });}
    static getAllTodos() {return this.findAll({ order: [["id", "ASC"]] });}
    static async completedItemsAre() {
      return this.findAll({
        where: { completed: { [Op.eq]: true } },
        order: [["id", "DESC"]],
      });
    }
    static async remove(id) {
      return this.destroy({
        where: {id,},
      });
    }
    setCompletionStatusAs(bool) {return this.update({ completed: bool });}
    static async overdue() {
      return this.findAll({
        where: {
          dueDate: {[Op.lt]: new Date().toLocaleDateString("en-CA"),},
          completed: false,
        },
        order: [["id", "ASC"]],
      });
    }
    static async dueToday() {
      return this.findAll({
        where: {
          dueDate: {[Op.eq]: new Date().toLocaleDateString("en-CA"),},
          completed: false,
        },
        order: [["id", "ASC"]],
      });
    }
    static async dueLater() {
      return this.findAll({
        where: {
          dueDate: {[Op.gt]: new Date().toLocaleDateString("en-CA"),},
          completed: false,
        },
        order: [["id", "ASC"]],
      });
    }
  }

  Todo.init(
    {title: DataTypes.STRING,dueDate: DataTypes.DATEONLY,completed: DataTypes.BOOLEAN,},
    {sequelize,modelName: "Todo",}
  );
  return Todo;
};
