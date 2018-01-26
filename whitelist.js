const contract = require("truffle-contract");
const ContributionABI = require("./build/contracts/Contribution.json");
const Contribution = contract(ContributionABI);
const Web3 = require("web3");
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8180"));

const fs = require("fs");

var _ = require("lodash");
var Papa = require("papaparse");
var sleep = require("sleep");

Contribution.setProvider(web3.currentProvider);

const CHUNK_LENGTH = 130;

// const ADDRESSES = require("./ARRAY_OF_ADDRESSES.js")();
let ADDRESSES = fs.readFileSync("./whitelisted.csv", { encoding: "utf8" });

// KOVAN
// const CONTRIBUTION_ADDRESS = "0x379927202bBD6cCFdfC4d4397b65d8860fb9978e";
// const CONTRIBUTION_OWNER = "0x0019810eAceA494E393daf6D2340092b89c97eBB";

// DEV
const CONTRIBUTION_ADDRESS = "0x2ceFD8FfD8d8A1c3d7f40BaaF1C070BCeF81A907";
const CONTRIBUTION_OWNER = "0x0047F35735525f049e2103e3F654CCb589bF2b98";

let txConfirmation;
let isWhitelisted;

let parsedAddresses = Papa.parse(ADDRESSES);
let flattenedAddresses = _.compact(_.flattenDeep(parsedAddresses.data));
let dedupedAddresses = _.uniq(flattenedAddresses);
// let chunkedAddresses = _.chunk(dedupedAddresses, CHUNK_LENGTH);

// Matt:
// USING THIS TO TEST THE BigNumber Error: new BigNumber() not a number: 7c4061b4dc0d0b7493e5182c982f541f67722cf7
// SENDS JUST A FEW CHUNKS - REMOVE ME AND USE ^ ABOVE FOR THE WHOLE ARRAY
let chunkedAddresses = _.drop(_.chunk(dedupedAddresses, CHUNK_LENGTH), 355);

console.log("TOTAL ADDRESSES : ", flattenedAddresses.length);
console.log("UNIQUE ADDRESSES : ", dedupedAddresses.length);
console.log("TRANSACTIONS TO RUN : ", chunkedAddresses.length);

// // UNCOMMENT ME WHEN YOU ARE READY TO GO LIVE AND COMMENT BELOW!
// _.forEach(chunkedAddresses, function(chunk) {
//   whitelist(chunk);
// });

// Sending random chunk - for testing purposes - remove me and use ^ above
whitelist(chunkedAddresses[_.random(0, chunkedAddresses.length - 1, false)]);

async function whitelist(addresses) {
  try {
    let instance = await Contribution.at(CONTRIBUTION_ADDRESS);

    // send only if the last address was whitelisted - maybe change it for a random address?
    isWhitelisted = await instance.isWhitelisted(_.last(addresses), {
      from: CONTRIBUTION_OWNER
    });

    console.log("LAST ADDRESS IS ALREADY WHITELISTED : ", isWhitelisted);

    if (isWhitelisted == false) {
      // Waits for 10 secs so we don't hammer the node
      sleep.sleep(10);
      console.log("SENT AT : ", new Date());
      console.log("NUMBER OF ADDRESSES TO WAITLIST : ", addresses.length);
      try {
        txConfirmation = await instance.whitelistAddresses(addresses, {
          from: CONTRIBUTION_OWNER,
          gas: 3700000
        });
      } catch (err) {
        console.log(err);
      }

      console.log("GAS USED : ", txConfirmation.receipt.gasUsed);
      console.log("TX HASH : ", txConfirmation.receipt.transactionHash);
    }
    console.log(
      "RANDOM ADDRESS TO TEST : ",
      addresses[_.random(0, addresses.length - 1, false)]
    );
    console.log("FIRST ADDRESS TO TEST : ", _.first(addresses));
    console.log("LAST ADDRESS TO TEST : ", _.last(addresses));
  } catch (err) {
    console.log(err);
  }
}
