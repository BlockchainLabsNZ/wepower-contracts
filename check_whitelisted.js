const contract = require("truffle-contract");
const ContributionABI = require("./build/contracts/Contribution.json");
const Contribution = contract(ContributionABI);
const Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8180"));

const fs = require("fs");
var sleep = require("sleep");

Contribution.setProvider(web3.currentProvider);

// KOVAN
// const CONTRIBUTION_ADDRESS = "0x379927202bBD6cCFdfC4d4397b65d8860fb9978e";
// const CONTRIBUTION_OWNER = "0x0019810eAceA494E393daf6D2340092b89c97eBB";

// DEV
const CONTRIBUTION_ADDRESS = "0x2ceFD8FfD8d8A1c3d7f40BaaF1C070BCeF81A907";
const CONTRIBUTION_OWNER = "0x0047F35735525f049e2103e3F654CCb589bF2b98";

let txConfirmation;
let isWhitelisted;

var lineReader = require("readline").createInterface({
  input: fs.createReadStream("whitelisted.csv", { encoding: "utf8" })
});

// https://stackoverflow.com/a/32599033
let counter = 0;
lineReader.on("line", async line => {
  counter++;
  if (counter < 300) {
    await checkWhitelisted(line);
  } else {
    return false;
  }
});

const checkWhitelisted = async address => {
  let instance = await Contribution.at(CONTRIBUTION_ADDRESS);

  try {
    isWhitelisted = await instance.canPurchase.call(address);
    if (isWhitelisted == true) {
      console.log("ADDRESS ALREADY WHITELISTED", address);
    } else {
      console.log("ADDRESS NOT WHITELISTED", address);
    }
  } catch (err) {
    console.log(err);
  }
};
