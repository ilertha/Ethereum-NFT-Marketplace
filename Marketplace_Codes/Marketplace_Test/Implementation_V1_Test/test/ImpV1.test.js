const MarketPlace = artifacts.require("MarketPlace");
const Factory = artifacts.require("Factory");
const Token = artifacts.require("Token");
const WETH = artifacts.require("WETH");
const ERC721 = artifacts.require("NFTCollection");

const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider(""));

const { expect, assert } = require("chai");
const { constants } = require("@openzeppelin/test-helpers");
const { ZERO_ADDRESS: zeroAddr } = constants;

contract("MarketPlace testing scripts", ([ owner, marketFeeTaker, user1, user2, user3 ]) => {
    // deploying all contracs and check everything after that
    before(async () => {
        this.weth = await WETH.new();
        expect(this.weth.address).to.not.be.equal(zeroAddr);

        this.factory = await Factory.new();
        expect(this.factory.address).to.not.be.equal(zeroAddr);

        const totalSupply = web3.utils.toBN(3500000000).mul(web3.utils.toBN(Math.pow(10, 6)));
        this.usdt = await Token.new("Tether", "USDT", 6, totalSupply);
        expect(this.usdt.address).to.not.be.equal(zeroAddr);

        const tokens = [ this.weth.address, this.usdt.address ];
        const factoryAddress = this.factory.address;
        const marketPlaceFeeTaker = marketFeeTaker;
        const marketFee = "2";
        this.market = await MarketPlace.new(
            marketFee,
            marketPlaceFeeTaker,
            tokens,
            factoryAddress
        , { from: owner });
        expect(this.market.address).to.not.be.equal(zeroAddr);
        expect(await this.market.factory()).to.be.equal(this.factory.address);
        expect(await this.market.proxyOwner()).to.be.equal(owner);
        expect(await this.market.marketFeeTaker()).to.be.equal(marketFeeTaker);
        expect((await this.market.marketFee()).toString()).to.be.equal(marketFee);
        const tokensList = await this.market.getTokens();  
        expect(tokensList[0]).to.be.equal(this.weth.address);
        expect(tokensList[1]).to.be.equal(this.usdt.address);
        expect(Number((await this.market.sellOrderCount()).toString())).to.be.equal(1);
        expect(Number((await this.market.bidCount()).toString())).to.be.equal(1);
    });

    describe("Checking 'changeOwner' functionality", () => {
        it("Non-owner user must not be able to change the current owner", async () => {
            try {
                await this.market.changeOwner(user1, { from: user1 });

                assert(false);
            } catch(err) {
                expect(err.reason).to.be.deep.equal("Only owner.");
            }
        });
    });

    describe("Checking 'createERC721Contract' functionality", () => {
        it("Should create a contract for user1", async () => {
            try {
                // create new erc721 contract by user1 AND validate all actions
                const receipt = await this.market.createERC721Contract(
                    "Pooria Soltan",
                    "POS",
                    "Soltan pooria's collection",
                    this.factory.address
                , { from: user1 });
                // checking tx receipt
                const createdContractAddr = await this.market.getUserContract(user1);
                expect(createdContractAddr).to.be.not.equal(zeroAddr);
                const { logs: event } = receipt;
                expect(event[0].event).to.be.deep.equal("NFTContractCreated");
                expect(event[0].args.creator).to.be.equal(user1);
                expect(event[0].args.contractAddr).to.be.equal(createdContractAddr);
                const status = await this.market.isValid(createdContractAddr);
                expect(status).to.be.deep.equal(true);
                // checking created contract
                const nft = await ERC721.at(createdContractAddr);
                expect(await nft.getOwner()).to.be.equal(user1);
                expect(await nft.name()).to.be.deep.equal("Pooria Soltan");
                expect(await nft.symbol()).to.be.deep.equal("POS");
                expect(await nft.description()).to.be.deep.equal("Soltan pooria's collection");
                // mint a nft-token
                await nft.mint("User's 1 nft-1", { from: user1 });
                await nft.mint("User's 1 nft-2", { from: user1 });
                await nft.mint("User's 1 nft-3", { from: user1 });
                // creating a nft contract for user2
                await this.market.createERC721Contract(
                    "Illuvium",
                    "ILV",
                    "Illuvium is a collection collector nft-game",
                    this.factory.address
                , { from: user2 });
                const createdContractAddr2 = await this.market.getUserContract(user2);
                const nft2 = await ERC721.at(createdContractAddr2);
                await nft2.mint("User's 2 nft-1 (ILV)", { from: user2 });
            } catch(err) {
                console.log(err.message);
                assert(false);
            };
            assert(true);
        });

        it("User1 must not be able to create a contract again", async () => {
            try {
                await this.market.createERC721Contract(
                    "PooriaGg",
                    "POG",
                    "Pooriagg's collection",
                    this.factory.address
                , { from: user1 });

                assert(false);
            } catch(err) {
                expect(err.reason).to.be.deep.equal("Cannot deploy contract again!");
            };
        });

        it("User3 must not be able to create a contract without specifing the name and symbol", async () => {
            try {
                await this.market.createERC721Contract("", "", "", this.factory.address, { from: user3 });
                assert(false);
            } catch(err) {
                expect(err.reason).to.be.deep.equal("Invalid data eneterd!");
            };
        });
    });

    describe("Checking 'createSellOrder' functionality", () => {
        it("Owner of the nft-contract must be able to create a sell-order successfully", async () => {
            try {
                const createdContractAddr = await this.market.getUserContract(user1);
                const nft = await ERC721.at(createdContractAddr);
                // approve marketplace to be able to transfer the nft
                await nft.approve(this.market.address, web3.utils.toBN(1), { from: user1 });
                const price = web3.utils.toBN(5).mul(web3.utils.toBN(Math.pow(10, 18))); // 5 weths
                const nftId = web3.utils.toBN(1);
                const recepit = await this.market.createSellOrder(
                    createdContractAddr,
                    nftId,
                    this.weth.address,
                    price
                , { from: user1 });
                // check that owner of the nft must be marketplace
                const newOwner = await nft.ownerOf(1);
                assert.equal(newOwner, this.market.address);
                // check the tx effects in the market
                const sellOrder = await this.market.sellOrder(1);
                expect(sellOrder.seller).to.be.equal(user1);
                // checking the emitted event
                const { logs: event } = recepit;
                expect(event[0].event).to.be.deep.equal("SellOrderCreated");
                expect(event[0].args.creator).to.be.equal(user1);
                expect(Number((event[0].args.orderId).toString())).to.be.equal(1);
            } catch(err) {
                console.log(err.message);
                assert(false);
            };
        });

        it("User must not be able to create a sell-order with unvalidated nft contract", async () => {
            try {
                await this.market.createSellOrder(
                    user3,
                    `${2}`,
                    user3,
                    `${100 * 10**6}`,
                    { from: user2 }
                );

                assert(false);
            } catch(err) {
                expect(err.reason).to.be.deep.equal("Invalid contract address!");
            };
        });

        it("User must not be able to create a sell-order with unvalidated token", async () => {
            try {
                const createdContractAddr = await this.market.getUserContract(user1);
                await this.market.createSellOrder(
                    createdContractAddr,
                    `${2}`,
                    this.market.address,
                    `${100 * 10**6}`,
                    { from: user2 }
                );

                assert(false);
            } catch(err) {
                expect(err.reason).to.be.deep.equal("Invalid token address!");
            };
        });
    });

    describe("Checking 'createBid' functionality", () => {
        it("User2 must be able to create a bid by passing correct input to the function", async () => {
            try {
                // creating a bid id for user1's sell-order by user2
                const orderId = web3.utils.toBN(1);
                const price = web3.utils.toBN(4).mul(web3.utils.toBN(Math.pow(10, 18)));
                // minting weth and approving for marketpalce to spend it
                const etherValue = web3.utils.toBN(10).mul(web3.utils.toBN(Math.pow(10, 18)));
                const approvalAmount = web3.utils.toBN(4).mul(web3.utils.toBN(Math.pow(10, 18)));
                await this.weth.deposit({ from: user2, value: etherValue });
                await this.weth.approve(this.market.address, approvalAmount, { from: user2 });
                const receipt = await this.market.createBid(
                    orderId,
                    this.weth.address,
                    price,
                    { from: user2 }
                );
                // check user2 and marketFeeTaker weth balance
                const user2Ba = await this.weth.balanceOf(user2);
                const marketplaceBal = await this.weth.balanceOf(this.market.address);
                assert.equal(user2Ba.toString(), (web3.utils.toBN(6).mul(web3.utils.toBN(Math.pow(10, 18)))).toString());
                assert.equal(marketplaceBal.toString(), (web3.utils.toBN(4).mul(web3.utils.toBN(Math.pow(10, 18)))).toString());
                // check the nft new owner
                const user1ContractAddr = await this.market.getUserContract(user1);
                const nft = await ERC721.at(user1ContractAddr);
                const nftNewOwner = await nft.ownerOf("1");
                assert.equal(nftNewOwner, this.market.address);
                // check the created bid's owner
                const bid = await this.market.bid("1");
                assert.equal(bid.bidder, user2);
                // check emitted event
                const user1SellOrder = await this.market.sellOrder("1");
                const { logs } = receipt;
                const [ event ] = logs;
                const { args } = event;
                assert.deepEqual(event.event, "BidCreated");
                assert.equal(args.bidder, user2);
                assert.equal(args.contractAddr, user1ContractAddr);
                assert.equal(Number((args.nftId).toString()), user1SellOrder.nftId);
                assert.equal(Number((args.bidId).toString()), "1");
            } catch {
                assert(false);
            };
        });

        it("User must not be able to create a bid for a ended/canceled sell-order", async () => {
            try {
                // create a second sell-order for user1
                const createdContractAddr = await this.market.getUserContract(user1);
                const nft = await ERC721.at(createdContractAddr);
                await nft.approve(this.market.address, web3.utils.toBN(2), { from: user1 });
                const price = web3.utils.toBN(10).mul(web3.utils.toBN(Math.pow(10, 18)));
                const nftId = web3.utils.toBN(2);
                await this.market.createSellOrder(
                    createdContractAddr,
                    nftId,
                    this.weth.address,
                    price
                , { from: user1 });
                // then cancel it
                await this.market.cancelSellOrder(2, { from: user1 });
                // then try to create a bid for this canceled sell-order - it will fail
                await this.market.createBid(
                    `${2}`,
                    this.weth.address,
                    price,
                    { from: user3 }
                );

                assert(false);
            } catch(err) {
                expect(err.reason).to.be.deep.equal("Order is not accessible.");
            };
        });

        it("User must not be able to create a bid for a non-existing sell-order", async () => {
            try {
                await this.market.createBid(
                    `${5}`,
                    this.weth.address,
                    `${1 * 10**18}`,
                    { from: user3 }
                );

                assert(false);
            } catch(err) {
                expect(err.reason).to.be.deep.equal("Order not found!");
            };
        });
    });

    describe("Checking 'acceptBid' function", () => {
        it("User1 must be able to accept a user2's bid", async () => {
            try  {
                //* User2 created a bid for nftid-1 of user1's collection for 4-weths (bid-id => 1)
                const receipt = await this.market.acceptBid(
                    "1",
                    "1",
                    { from: user1 }
                );
                // check weths balances of marketFeeTaker, user1 and user2
                const sellerBal = await this.weth.balanceOf(user1); // expected -> 3.92 weths
                const buyerBal = await this.weth.balanceOf(user2); // expected -> 6 weths
                const feeTakerBal = await this.weth.balanceOf(marketFeeTaker);// expected -> 0.08 weths
                assert.equal(sellerBal.toString(), `${3.92 * Math.pow(10, 18)}`);
                assert.equal(buyerBal.toString(), `${6 * Math.pow(10, 18)}`);
                assert.equal(feeTakerBal.toString(), `${0.08 * Math.pow(10, 18)}`);
                // check the ownership of the nft that sold
                const createdContractAddr = await this.market.getUserContract(user1);
                const nft = await ERC721.at(createdContractAddr);
                const nftOwner = await nft.ownerOf(1);
                assert.equal(nftOwner, user2);
                // check the emitted event and changes in the marketplace contract
                const { logs } = receipt;
                const [ event ] = logs;
                const { args } = event;
                assert.equal(event.event, "BidAccepted");
                assert.equal(args.seller, user1);
                assert.equal(args.buyer, user2);
                assert.equal((args.bidId).toString(), "1");
                assert.equal((args.orderId).toString(), "1");
            } catch(err) {
                console.log(err.reason);
                assert(false);
            };
        });

        context("Testing all requires", () => {
            before(async () => {
                // create a new sell-order for user1 for third and fourth test (nftId => 3)
                const createdContractAddr = await this.market.getUserContract(user1);
                const nft = await ERC721.at(createdContractAddr);
                await nft.approve(this.market.address, web3.utils.toBN(3), { from: user1 });
                const price = web3.utils.toBN(5).mul(web3.utils.toBN(Math.pow(10, 18)));
                const nftId = web3.utils.toBN(3);
                await this.market.createSellOrder(
                    createdContractAddr,
                    nftId,
                    this.weth.address,
                    price
                , { from: user1 });
                // create two new bids for user1's sell-order
                // user2's bid for third test
                const orderId = web3.utils.toBN(3);
                const bidPrice = web3.utils.toBN(2).mul(web3.utils.toBN(Math.pow(10, 18)));
                const approvalAmount = web3.utils.toBN(2).mul(web3.utils.toBN(Math.pow(10, 18)));
                await this.weth.approve(this.market.address, approvalAmount, { from: user2 });
                await this.market.createBid(
                    orderId,
                    this.weth.address,
                    bidPrice,
                    { from: user2 }
                );
                // user3's bid must be canceled for fourth test
                const orderId2 = web3.utils.toBN(3);
                const bidPrice2 = web3.utils.toBN(1).mul(web3.utils.toBN(Math.pow(10, 18)));
                const etherValue = web3.utils.toBN(30).mul(web3.utils.toBN(Math.pow(10, 18)));
                const approvalAmount2 = web3.utils.toBN(1).mul(web3.utils.toBN(Math.pow(10, 18)));
                await this.weth.deposit({ from: user3, value: etherValue });
                await this.weth.approve(this.market.address, approvalAmount2, { from: user3 });
                await this.market.createBid(
                    orderId2,
                    this.weth.address,
                    bidPrice2,
                    { from: user3 }
                );
                // cancel the bid
                const currentBidId = await this.market.bidCount();
                await this.market.cancelBid(currentBidId - 1, { from: user3 });
                // create a bid for user2's nft by user3 for second test
                // 1) create a sell-order by user2
                const createdContractAddr2 = await this.market.getUserContract(user2);
                const nft2 = await ERC721.at(createdContractAddr2);
                await nft2.approve(this.market.address, web3.utils.toBN(1), { from: user2 });
                const price2 = web3.utils.toBN(10000).mul(web3.utils.toBN(Math.pow(10, 6)));
                const nftId2 = web3.utils.toBN(1);
                await this.market.createSellOrder(
                    createdContractAddr2,
                    nftId2,
                    this.usdt.address,
                    price2
                , { from: user2 });
                // 2) create a bid for the user2's sell-order by user3
                const orderId3 = web3.utils.toBN(4);
                const bidPrice3 = web3.utils.toBN(7).mul(web3.utils.toBN(Math.pow(10, 18)));
                const approvalAmount3 = web3.utils.toBN(7).mul(web3.utils.toBN(Math.pow(10, 18)));
                await this.weth.approve(this.market.address, approvalAmount3, { from: user3 });
                await this.market.createBid(
                    orderId3,
                    this.weth.address,
                    bidPrice3,
                    { from: user3 }
                );
            });

            it("User1 must not be able to accept the duplicate bid", async () => {
                try {
                    await this.market.acceptBid(
                        "1",
                        "1",
                        { from: user1 }
                    );
                    assert(false);
                } catch(err) {
                    assert.equal(err.reason, "Sell-order is not availabe.");
                };
            });
    
            it("User1 cannot accept a bid that does not match with his/her sell-order", async () => {
                try {
                    await this.market.acceptBid(
                        "4",
                        "3",
                        { from: user1 }
                    );

                    assert(false);
                } catch(err) {
                    assert.equal(err.reason, "Bid does not match with the sell-order!");
                };
            });
    
            it("Non-owner user must not be able to accept a bid that corresponds to the user2's sell-order", async () => {
                try {
                    await this.market.acceptBid(
                        "4",
                        "4",
                        { from: user3 }
                    );

                    assert(false); 
                } catch(err) {
                    assert.equal(err.reason, "Only sell-order owner can accept a bid!");
                };
            });
    
            it("User2 cannot accept a canceled bid", async () => {
                try {
                    await this.market.cancelBid("4", { from: user3 });

                    await this.market.acceptBid(
                        "4",
                        "4",
                        { from: user2 }
                    );

                    assert(false); 
                } catch(err) {
                    assert.equal(err.reason, "Bid is not availabe.");
                };
            });
        });
    });
});