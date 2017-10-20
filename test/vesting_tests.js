const MockContribution = artifacts.require("MockContribution.sol");
const WPR = artifacts.require("WPR.sol");
const WCT = artifacts.require("WCT.sol");
const WCT1 = artifacts.require("WCT1.sol");
const TeamTokenHolder = artifacts.require("MockTeamTokenHolder.sol");
const FutureTokenHolder = artifacts.require("MockFutureTokenHolder.sol");
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const Exchanger = artifacts.require("Exchanger");
const assert = require("chai").assert;
const BigNumber = web3.BigNumber;
import { expectThrow, duration, latestBlock, getTime } from "./utils.js";

contract("Contribution", ([miner, owner, investor]) => {
  let wpr;
  let contribution;
  let exchanger;
  let wct;
  let wct1;
  let tokensPreSold = new BigNumber(55 * 10 ** 18);
  let bonusCap;
  let totalCap;
  let sendingAmount;
  let currentTime;
  let futureHolder;
  let teamHolder;
  let _communityHolder;
  let latestBlockNumber;
  let addresses = [
    "0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501200",
    "0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501201",
    "0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501202",
    "0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501203",
    "0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501204",
    "0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501205",
    "0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501206",
    "0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501207",
    "0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501208",
    "0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501209"
  ];

  it("#constructor accepts Token address", async function() {
    const contribution = await MockContribution.new(
      "0x0000000000000000000000000000000000000123"
    );
    const tokenAddress = await contribution.wpr();
    assert.equal(
      tokenAddress,
      "0x0000000000000000000000000000000000000123",
      "== token address"
    );
  });

  describe("#initialize", async function() {
    beforeEach(async function() {
      const tokenFactory = await MiniMeTokenFactory.new();
      wct = await WCT.new(tokenFactory.address);
      await wct.generateTokens(owner, tokensPreSold);
      wct1 = await WCT1.new(tokenFactory.address);
      wpr = await WPR.new();
      contribution = await MockContribution.new(wpr.address);
      exchanger = await Exchanger.new(
        wct.address,
        wct1.address,
        "0x0",
        wpr.address,
        contribution.address
      );

      totalCap = new BigNumber(1000 * 10 ** 18); //1000 eth
      bonusCap = totalCap.div(10);
      sendingAmount = new BigNumber(10 ** 18); // 1 eth
      currentTime = getTime();
      futureHolder = await FutureTokenHolder.new(
        owner,
        contribution.address,
        wpr.address
      );
      teamHolder = await TeamTokenHolder.new(
        owner,
        contribution.address,
        wpr.address
      );
      _communityHolder = "0x0039F22efB07A647557C7C5d17854CFD6D489eF3";

      latestBlockNumber = await latestBlock();

      await contribution.setBlockTimestamp(currentTime);
      await contribution.setBlockNumber(latestBlockNumber);
      await wpr.transferOwnership(contribution.address);

      await contribution.initialize(
        wct.address,
        wct1.address,
        "0x0",
        exchanger.address,
        owner,
        futureHolder.address,
        teamHolder.address,
        _communityHolder,
        bonusCap,
        totalCap,
        currentTime + 1,
        currentTime + 10
      );

      currentTime = getTime();
      latestBlockNumber = await latestBlock();
      await contribution.setBlockTimestamp(currentTime + 1);
      await contribution.setBlockNumber(latestBlockNumber + 1);
      await contribution.finalize();
    });

    it("Final Balances", async function() {
      const futureHolderBalance = await wpr.balanceOf(futureHolder.address);
      const teamHolderBalance = await wpr.balanceOf(teamHolder.address);
      const communityHolderBalance = await wpr.balanceOf(_communityHolder);
      const preSoldBalance = await wpr.balanceOf(exchanger.address);
      const totalSupplyAfterContribution = await wpr.totalSupply();
      // exchange rate = 2000
      // Unsold Wei = 5 * 10 ** 18
      assert.equal(
        preSoldBalance.div(10 ** 18).toString(),
        new BigNumber(55 * 1250 * 10 ** 18).div(10 ** 18).toString()
      );
      assert.equal(teamHolderBalance.toNumber(), 20 * 1250 * 10 ** 18);
      assert.equal(futureHolderBalance.toNumber(), 15 * 1250 * 10 ** 18);
      assert.equal(communityHolderBalance.toNumber(), 10 * 1250 * 10 ** 18);
      assert.equal(
        totalSupplyAfterContribution.toNumber(),
        100 * 1250 * 10 ** 18
      );
    });

    it("Team Holder will only start givin at month 6 with the amount growing until a year has passed", async function() {
      let teamHolderBalance = await wpr.balanceOf(owner);
      assert.equal(teamHolderBalance.toNumber(), 0);

      currentTime = await getTime();
      await expectThrow(teamHolder.collectTokens({ from: owner }));
      teamHolderBalance = await wpr.balanceOf(owner);
      assert.equal(teamHolderBalance.toNumber(), 0);

      await teamHolder.setBlockTimestamp(currentTime + duration.months(5));
      currentTime = await getTime();
      await expectThrow(teamHolder.collectTokens({ from: owner }));
      teamHolderBalance = await wpr.balanceOf(owner);
      assert.equal(teamHolderBalance.toNumber(), 0);

      await teamHolder.setBlockTimestamp(currentTime + duration.months(6));
      currentTime = await getTime();
      await expectThrow(teamHolder.collectTokens({ from: owner }));
      teamHolderBalance = await wpr.balanceOf(owner);
      assert.equal(teamHolderBalance.toNumber(), 20 * 1250 / 2 * 10 ** 18);

      await teamHolder.setBlockTimestamp(
        currentTime + duration.years(1) + duration.days(1)
      );
      await teamHolder.collectTokens({ from: owner });
      teamHolderBalance = await wpr.balanceOf(owner);
      assert.equal(teamHolderBalance.toNumber(), 20 * 1250 * 10 ** 18);
    });

    it("Remainder can only access Tokens after a year", async function() {
      let futureHolderBalance = await wpr.balanceOf(owner);
      assert.equal(futureHolderBalance.toNumber(), 0);

      currentTime = await getTime();
      await expectThrow(futureHolder.collectTokens({ from: owner }));
      futureHolderBalance = await wpr.balanceOf(owner);
      assert.equal(futureHolderBalance.toNumber(), 0);

      await futureHolder.setBlockTimestamp(currentTime + duration.months(5));
      currentTime = await getTime();
      await expectThrow(futureHolder.collectTokens({ from: owner }));
      futureHolderBalance = await wpr.balanceOf(owner);
      assert.equal(futureHolderBalance.toNumber(), 0);

      await futureHolder.setBlockTimestamp(
        currentTime + duration.years(1) + duration.days(1)
      );
      await futureHolder.collectTokens({ from: owner });
      futureHolderBalance = await wpr.balanceOf(owner);
      assert.equal(futureHolderBalance.toNumber(), 15 * 1250 * 10 ** 18);
    });
  });
});
