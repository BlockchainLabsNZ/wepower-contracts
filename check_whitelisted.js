const Web3 = require("web3");
const fs = require("fs");
var sleep = require("sleep");

const ContributionABI = require("./build/contracts/Contribution.json").abi;

// NODE ENDPOINT
// INFURA
const providerURL = "https://mainnet.infura.io/073wFpxQklVU59F5vFCG";
// LOCAL
// const providerURL = "http://localhost:8180";

// CONTRACT ADDRESS
// KOVAN
// const CONTRIBUTION_ADDRESS = "0x379927202bBD6cCFdfC4d4397b65d8860fb9978e";
// DEV
// const CONTRIBUTION_ADDRESS = "0x2ceFD8FfD8d8A1c3d7f40BaaF1C070BCeF81A907";
// MAINNET
const CONTRIBUTION_ADDRESS = "0x89dd662cc0651a6f3631a617724525f2ff373b1e";

var web3 = new Web3(new Web3.providers.HttpProvider(providerURL));
let Contribution = new web3.eth.Contract(ContributionABI, CONTRIBUTION_ADDRESS);

let isWhitelisted;

// INITIALIZE LOG FILES
fs.openSync("toWhitelist.csv", "w");
fs.openSync("alreadyWhitelisted.csv", "w");
fs.openSync("erroredAddresses.csv", "w");
fs.openSync("errors.txt", "w");
console.log("Log files initialized");

// FILE WE'LL READ ADDRESSES FROM
const readFrom = "whitelist-new.csv";
var lineReader = require("readline").createInterface({
  input: fs.createReadStream(readFrom, { encoding: "utf8" })
});

// https://stackoverflow.com/a/32599033
let counter = 0;
lineReader.on("line", async line => {
  counter++;
  if (counter % 5000 == 0) {
    console.log("Iterations : ", counter);
    console.log("Pausing job...", new Date());
    lineReader.pause();
    sleep.sleep(5);
    console.log("Resuming job...", new Date());
    lineReader.resume();
  }
  await checkWhitelisted(line.toLowerCase());
});

const checkWhitelisted = async address => {
  sleep.msleep(10);
  try {
    // https://github.com/ethereum/web3.js/issues/1089#issuecomment-342184640
    isWhitelisted = await web3.eth.call({
      to: CONTRIBUTION_ADDRESS,
      data: Contribution.methods.canPurchase(address).encodeABI()
    });
    let result = web3.utils.hexToNumber(isWhitelisted);
    if (result == 1) {
      fs.appendFileSync("alreadyWhitelisted.csv", `${address}\n`);
    } else {
      fs.appendFileSync("toWhitelist.csv", `${address}\n`);
    }
  } catch (err) {
    // saving addresses for errored requests so we'll check them again
    fs.appendFileSync("erroredAddresses.csv", `${address}\n`);
    fs.appendFileSync("errors.txt", `${err}\n`);
  }
};
