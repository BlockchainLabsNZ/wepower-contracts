const contract = require("truffle-contract");
const ContributionABI = require("./build/contracts/Contribution.json");
const Contribution = contract(ContributionABI);
const Web3 = require("web3");
// var web3 = new Web3(new Web3.providers.HttpProvider("http://192.168.1.233:8545"));
// var web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/073wFpxQklVU59F5vFCG"));
var web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/073wFpxQklVU59F5vFCG"));

const fs = require("fs");

var _ = require("lodash");
var Papa = require("papaparse");
var sleep = require("sleep");

Contribution.setProvider(web3.currentProvider);

const CHUNK_LENGTH = 130;

// const ADDRESSES = require("./ARRAY_OF_ADDRESSES.js")();
let ADDRESSES = fs.readFileSync("./whitelisted_final.csv", { encoding: "utf8" });

// KOVAN
// const CONTRIBUTION_ADDRESS = "0x379927202bsBD6cCFdfC4d4397b65d8860fb9978e";
// const CONTRIBUTION_OWNER = "0x0019810eAceA494E393daf6D2340092b89c97eBB";

// DEV
// const CONTRIBUTION_ADDRESS = "0x2ceFD8FfD8d8A1c3d7f40BaaF1C070BCeF81A907";
// const CONTRIBUTION_OWNER = "0x0047F35735525f049e2103e3F654CCb589bF2b98";

// MAIN NET
const CONTRIBUTION_ADDRESS = "0x89dd662cc0651a6f3631a617724525f2ff373b1e";
const CONTRIBUTION_OWNER = "0x1e5e739d5B051Dc04F9a53eCCB8b31bD3252A427";

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

let num_whitelisted, num_to_whitelist = 0;

async function whitelist(addresses) {
  let_ instance = await Contribution.at(CONTRIBUTION_ADDRESS);
  // try {

    //STEVE PLEASE CHECK FOR NONSENSE

    _.foreach(addresses, function(checkWhitelisted(address){})


  // send only if the last address was whitelisted - maybe change it for a random address?
  await Promise.all(addresses.map(async (address) => {
    sleep.msleep(500);
    isWhitelisted = await instance.isWhitelisted(address, {
      from: CONTRIBUTION_OWNER
    });
    if (isWhitelisted) {
      num_whitelisted++;
      fs.appendFile('whitelisted.csv', address + "\n");
    } else {
      num_to_whitelist++;
      fs.appendFile('to_whitelist.csv', address + "\n");
    }
    console.log('%s - %s', address, isWhitelisted);
  }));

    // if (isWhitelisted == false) {
    //   // Waits for 10 secs so we don't hammer the node
    //   sleep.sleep(10);
    //   console.log("SENT AT : ", new Date());
    //   console.log("NUMBER OF ADDRESSES TO WAITLIST : ", addresses.length);
    //   try {
    //     txConfirmation = await instance.whitelistAddresses(addresses, {
    //       from: CONTRIBUTION_OWNER,
    //       gas: 3700000
    //     });
    //   } catch (err) {
    //     console.log(err);
    //   }

    //   console.log("GAS USED : ", txConfirmation.receipt.gasUsed);
    //   console.log("TX HASH : ", txConfirmation.receipt.transactionHash);
    // }
    // console.log(
    //   "RANDOM ADDRESS TO TEST : ",
    //   addresses[_.random(0, addresses.length - 1, false)]
    // );
  // } catch (err) {
  //   console.log(err);
  // }
  console.log("Total Whitelisted: ", num_whitelisted);
  console.log("Total left to whitelist: ", num_to_whitelist);
}
