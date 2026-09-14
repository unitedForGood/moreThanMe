const xlsx = require("xlsx");
const fs = require("fs");
const data = fs.readFileSync("/Users/akashg/Desktop/moreThanMe/finalTransactions.csv");
const workbook = xlsx.read(data);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(worksheet);
console.log(json[0]);
console.log(typeof json[0]["Transaction Date"]);
