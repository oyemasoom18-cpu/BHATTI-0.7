const CurrenciesModel = require('../database/models/currencies');

class CurrenciesController {
  constructor(api) {
    this.api = api;
  }

  get(userID) {
    return CurrenciesModel.get(userID);
  }

  create(userID) {
    return CurrenciesModel.create(userID);
  }

  getBalance(userID) {
    return CurrenciesModel.getBalance(userID);
  }

  getBank(userID) {
    return CurrenciesModel.getBank(userID);
  }

  getTotal(userID) {
    return CurrenciesModel.getTotal(userID);
  }

  addBalance(userID, amount) {
    return CurrenciesModel.addBalance(userID, amount);
  }

  removeBalance(userID, amount) {
    return CurrenciesModel.removeBalance(userID, amount);
  }

  deposit(userID, amount) {
    return CurrenciesModel.deposit(userID, amount);
  }

  withdraw(userID, amount) {
    return CurrenciesModel.withdraw(userID, amount);
  }

  transfer(fromID, toID, amount) {
    return CurrenciesModel.transfer(fromID, toID, amount);
  }

  getBankData(userID) {
    return CurrenciesModel.getBankData(userID);
  }

  updateRegistrationStep(userID, step, data = {}) {
    return CurrenciesModel.updateRegistrationStep(userID, step, data);
  }

  claimDaily(userID) {
    return CurrenciesModel.claimDaily(userID);
  }

  work(userID) {
    return CurrenciesModel.work(userID);
  }

  getTop(limit = 10) {
    return CurrenciesModel.getTop(limit);
  }

  addTransaction(userID, type, amount, note = '') {
    return CurrenciesModel.addTransaction(userID, type, amount, note);
  }

  getData(userID) {
    return CurrenciesModel.getData(userID);
  }

  setData(userID, data) {
    return CurrenciesModel.setData(userID, data);
  }

  getExp(userID) {
    return CurrenciesModel.getExp(userID);
  }

  addExp(userID, amount) {
    return CurrenciesModel.addExp(userID, amount);
  }

  resetAllData() {
    return CurrenciesModel.resetAllData();
  }

  getAllCount() {
    return CurrenciesModel.getAllCount();
  }

  hasBankAccount(userID) {
    return CurrenciesModel.hasBankAccount(userID);
  }

  resetCoinsAtMidnight() {
    return CurrenciesModel.resetCoinsAtMidnight();
  }

  dailyMidnightReset() {
    return CurrenciesModel.dailyMidnightReset();
  }
}

module.exports = CurrenciesController;
