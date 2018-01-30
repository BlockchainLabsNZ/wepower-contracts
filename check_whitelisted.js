// KOVAN
// const CONTRIBUTION_ADDRESS = "0x379927202bBD6cCFdfC4d4397b65d8860fb9978e";

// DEV
// const CONTRIBUTION_ADDRESS = "0x2ceFD8FfD8d8A1c3d7f40BaaF1C070BCeF81A907";

// MAIN NET
const CONTRIBUTION_ADDRESS = "0x89dd662cc0651a6f3631a617724525f2ff373b1e";

const ContributionABI = require("./build/contracts/Contribution.json").abi;

const Web3 = require("web3");

// LOCAL
// var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8180"));

// INFURA
var web3 = new Web3(
  new Web3.providers.HttpProvider(
    "https://mainnet.infura.io/073wFpxQklVU59F5vFCG"
  )
);

const fs = require("fs");
var sleep = require("sleep");

let Contribution = new web3.eth.Contract(ContributionABI, CONTRIBUTION_ADDRESS);

let txConfirmation;
let isWhitelisted;
let instance;

// CREATE LOG FILES
let toWhitelist = fs.openSync("toWhitelist.csv", "w");
let alreadyWhitelisted = fs.openSync("alreadyWhitelisted.csv", "w");
let errorsFile = fs.openSync("errors.txt", "w");

var lineReader = require("readline").createInterface({
  input: fs.createReadStream("whitelisted.csv", { encoding: "utf8" })
});

// https://stackoverflow.com/a/32599033
let counter = 0;
lineReader.on("line", async line => {
  counter++;
  if (counter % 10000 == 0) {
    lineReader.pause();
    console.log("Pausing stream for 5 seconds...");
    setTimeout(() => {
      console.log("Resuming stream...");
      lineReader.resume();
    }, 1000);
  } else {
    await checkWhitelisted(line.toLowerCase());
  }

  // PAUL/MATT: ALTERNATIVELY YOU CAN PLAY WITH THE COUNTER VALUE
  // if (counter < 10000) {
  //   await checkWhitelisted(line.toLowerCase());
  // } else {
  //   return false;
  // }
});

const checkWhitelisted = async address => {
  try {
    sleep.msleep(5);
    // https://github.com/ethereum/web3.js/issues/1089#issuecomment-342184640
    isWhitelisted = await web3.eth.call({
      to: CONTRIBUTION_ADDRESS,
      data: Contribution.methods.canPurchase(address).encodeABI()
    });

    let result = web3.utils.hexToNumber(isWhitelisted);

    if (result == 1) {
      try {
        fs.appendFileSync("alreadyWhitelisted.csv", address + "\n");
      } catch (err) {
        console.log(err);
      }
    } else {
      try {
        fs.appendFileSync("toWhitelist.csv", address + "\n");
      } catch (err) {
        console.log(err);
      }
    }
  } catch (err) {
    try {
      console.log(err);
      fs.appendFileSync("errors.txt", err + "\n");
    } catch (err) {
      console.log(err);
    }
  }
};
