import { useParams, useNavigate } from "react-router-dom";
import { useState, useContext, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import 'react-tooltip/dist/react-tooltip.css';
import { Tooltip } from "react-tooltip";
import BounceLoader from "react-spinners/BounceLoader";
import ScaleLoader from "react-spinners/ScaleLoader";

import Context from "../context/Context";
import Contracts from "../contracts/data";

const Bid = () => {
    const { web3Http, txValidator, userAccount, ethereum , web3Ws } = useContext(Context);

    const navigate = useNavigate();
    const params = useParams();

    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(false);
    const [ sellOrderFullInfo, setSellOrderFullInfo ] = useState(null);
    const [ token, setToken ] = useState(null);
    const [ price, setPrice ] = useState(null);
    const [ creatingBid, setCreatingBid ] = useState(false);
    const [ nothing, setNothing ] = useState(false);
    const [ refresh, setRefresh ] = useState(false);

    const getTrimedAddr = useCallback((addr) => {
        const p1 = String(addr).slice(0, 7);
        const p2 = String(addr).slice(36, 42); 
        return `${p1}......${p2}`;
    }, []);

    useEffect(() => {
        const market = new web3Ws.eth.Contract(
            Contracts.MarketplaceImpV1.abi,
            Contracts.MarketplaceProxy.address
        );

        if (userAccount != null) {
            const options = {
                filter: {
                    bidder: userAccount,
                    sellOrderId: params.sellOrderId
                }
            };
            market.events.BidCreated(options, (err, data) => {
                if (!err) {
                    setLoading(true);
                    setRefresh(!refresh);
                } else {
                    console.log("Error:\n", err);
                };
            });
        };
    }, [ userAccount, web3Http, web3Ws, refresh, params ]);

    useEffect(() => {
        if (!isNaN(Number(params.sellOrderId))) {
            const init = async () => {
                try {
                    const market = new web3Http.eth.Contract(
                        Contracts.MarketplaceImpV1.abi,
                        Contracts.MarketplaceProxy.address
                    );
                    const sellOrderData = await market.methods.sellOrder(params.sellOrderId).call({});
                    
                    if (sellOrderData["startedAt"] !== 0 && !sellOrderData["isEnded"] && !sellOrderData["isCanceled"]) {
                        const tokenInfo = Contracts.Tokens.getToken(sellOrderData["token"]);

                        const nft = new web3Http.eth.Contract(
                            Contracts.ERC721.abi,
                            sellOrderData["contractAddr"]
                        );
                        const nftURI = await nft.methods.tokenURI(sellOrderData["nftId"]).call({});
                        const collectionName = await nft.methods.name().call({});
                        const colelctionSymbol = await nft.methods.symbol().call({});
                        
                        let nftData = JSON.parse(await fetch(nftURI).then(res => res.text()));
                        nftData.image = `https://nftstorage.link/ipfs/${String(nftData.image).slice(7, (nftData.image).length)}`;
                        nftData = {...nftData, collection: {name: collectionName, symbol: colelctionSymbol}};
                        
                        market.getPastEvents("BidCreated", {
                            filter: {
                                sellOrderId: params.sellOrderId
                            },
                            fromBlock: Contracts.MarketplaceProxy.blockNumber
                        }, async (err, res) => {
                            if (!err) {
                                setNothing(res.length > 0 ? false : true);
                                // validate all bids AND add extra info to each bid object
                                let bids = [];
                                for (let bid = 0; bid < res.length; bid++) {
                                    let currentBid = res[bid];
                                    let response = await market.methods.bid(currentBid.returnValues.bidId).call({});
                                    if (!response["isEnded"] && !response["isCanceled"]) {
                                        bids.push({...currentBid, bidInfo: { price: response["price"], token: response["token"] }});
                                    };
                                };

                                setSellOrderFullInfo({...sellOrderData, tokenInfo, nftData, bids});
                                setLoading(false);
                            } else {
                                setLoading(false);
                                setError(true);
                            };
                        });
                    } else {
                        return navigate("/marketplace");
                    };
                } catch {
                    toast.error("Failed to load the sell order page", {
                        toastId: "Failed to load the sell order page"
                    });
                    setLoading(false);
                    setError(true);
                };
            };

            init();
        } else {
            navigate("/marketplace");
        };
    }, [ params, navigate, web3Http, refresh ]);

    const createBid = useCallback(async () => {
        if (await txValidator()) {
            try {
                setCreatingBid(true);
    
                if (token != null && price != null) {
                    if (web3Http.utils.isAddress(token) && typeof Contracts.Tokens.getToken(token) !== "undefined") {
                        if (!isNaN(Number(price)) && Number(price) > 0) {
                            let to, from, data, chainId, value, Tx, tokenInfo;

                            tokenInfo = Contracts.Tokens.getToken(token);

                            const tokenContract = new web3Http.eth.Contract(
                                tokenInfo.abi,
                                token
                            );

                            const bidPrice = Contracts.Tokens.getPrice(token, price);

                            to = token;
                            from = userAccount;
                            data = tokenContract.methods.approve(Contracts.MarketplaceProxy.address, bidPrice).encodeABI({ from });
                            chainId = web3Http.utils.numberToHex(80001);
                            value = "0x0";
                            Tx = {
                                from,
                                to,
                                data,
                                chainId,
                                value
                            };

                            await toast.promise(
                                ethereum.request({
                                    method: "eth_sendTransaction",
                                    params: [Tx]
                                }).then(async txHash => {
                                    let isValid = null;
                                    while (isValid == null) {
                                        let state = null;
                                        
                                        let receipt = await ethereum.request({
                                            method: "eth_getTransactionReceipt",
                                            params: [txHash]
                                        });
                
                                        if (receipt != null) {
                                            if (receipt.status === "0x1") {
                                                state = true;
                                            } else {
                                                state = false;
                                            };
                                        };
                
                                        isValid = state;
                                    };
            
                                    if (isValid === true) {
                                        toast.success("Marketplace approved", {
                                            toastId: "tx confirmed"
                                        });

                                        // after approving market to spent the token behold the bidder, create a bid for user
                                        const market = new web3Http.eth.Contract(
                                            Contracts.MarketplaceImpV1.abi,
                                            Contracts.MarketplaceProxy.address
                                        );

                                        to = Contracts.MarketplaceProxy.address;
                                        data = market.methods.createBid(
                                            web3Http.utils.toBN(params.sellOrderId),
                                            token,
                                            bidPrice
                                        ).encodeABI({ from });
                                        Tx = {
                                            from,
                                            to,
                                            data,
                                            chainId,
                                            value
                                        };

                                        toast.promise(
                                            ethereum.request({
                                                method: "eth_sendTransaction",
                                                params: [Tx]
                                            }).then(async txHash => {
                                                let isValid = null;
                                                while (isValid == null) {
                                                    let state = null;
                                                    
                                                    let receipt = await ethereum.request({
                                                        method: "eth_getTransactionReceipt",
                                                        params: [txHash]
                                                    });
                            
                                                    if (receipt != null) {
                                                        if (receipt.status === "0x1") {
                                                            state = true;
                                                        } else {
                                                            state = false;
                                                        };
                                                    };
                            
                                                    isValid = state;
                                                };

                                                setCreatingBid(false);
                        
                                                if (isValid === true) {
                                                    toast.success("Bid created", {
                                                        toastId: "tx confirmed"
                                                    });
                                                } else if (isValid === false) {
                                                    toast.error("Failed to create the bid", {
                                                        toastId: "tx failed"
                                                    });  
                                                } else {
                                                    toast.error("Somthing went wrong", {
                                                        toastId: "some error"
                                                    });
                                                };
                                            }),
                                            {
                                                pending: "Sending the transaction",
                                                success: "Transaction sent, Please wait for the last confirmation",
                                                error: "Failed to send the transaction"
                                            }
                                        );
                                    } else if (isValid === false) {
                                        toast.error("Failed to apprive the marketplace", {
                                            toastId: "tx failed"
                                        });
                                        setCreatingBid(false);
                                    } else {
                                        toast.error("Somthing went wrong", {
                                            toastId: "some error"
                                        });
                                        setCreatingBid(false);
                                    };
                                }),
                                {
                                    pending: "Sending the transaction",
                                    success: "Transaction sent, Please wait for the last confirmation",
                                    error: "Failed to send the transaction"
                                }
                            );
                            setCreatingBid(false);
                        } else {
                            toast.warn("Please enter valid price");
                            setCreatingBid(false);
                            return false;
                        };
                    } else {
                        toast.warn("Please choose valid token");
                        setCreatingBid(false);
                        return false;
                    };
                } else {
                    toast.warn("Please enter valid price and choose valid token");
                    setCreatingBid(false);
                    return false;
                };
            } catch {
                toast.error("Failed to create your bid", {
                    toastId: "Failed to create your bid"
                });
                setCreatingBid(false);
                return false;
            };
        } else {
            return false;
        };
    }, [ token, price, txValidator, userAccount, ethereum, params, web3Http ]);

    return (
        <>
            <section>
                {
                    error ? (
                        <div className="col-1 mx-auto" style={{ marginTop: "12%" }}>
                            <BounceLoader
                                color="red"
                                size={70}
                            />
                        </div>
                    ) : (null)
                }

                {
                    loading ? (
                        <div className="col-1 mx-auto" style={{ marginTop: "12%" }}>
                            <ScaleLoader
                                color="black"
                                height={65}
                                width={7}
                            />
                        </div>
                    ) : (
                        <div className="col-xl-6 col-md-8 col-sm-10 mx-auto mt-5 ml-5 mb-5 shadow rounded">
                            <div className="card text-center">
                                <div className="card-header">
                                    Sell Order "<strong>{params.sellOrderId}</strong>"
                                </div>
            
                                <div className="card-body">
                                    <img
                                        id="nftImg"
                                        className="rounded shadow"
                                        src={`${sellOrderFullInfo["nftData"].image}`} 
                                        width="100%"
                                        alt="nft"
                                    />

                                    <Tooltip
                                        anchorId="nftImg"
                                        content={`Collection name - ${sellOrderFullInfo["nftData"].collection.name}`}
                                        place="left"
                                        style={{
                                            paddingTop: "2px",
                                            paddingBottom: "2px",
                                            paddingLeft: "7px",
                                            paddingRight: "7px",
                                            backgroundColor: "black"
                                        }}
                                    />

                                    <Tooltip
                                        anchorId="nftImg"
                                        content={`NFT name - ${sellOrderFullInfo["nftData"].name} | NFT ID - ${sellOrderFullInfo["nftId"]}`}
                                        place="top"
                                        offset={20}
                                        style={{
                                            paddingTop: "2px",
                                            paddingBottom: "2px",
                                            paddingLeft: "7px",
                                            paddingRight: "7px",
                                            backgroundColor: "black"
                                        }}
                                    />

                                    <Tooltip
                                        anchorId="nftImg"
                                        content={`NFT description - ${sellOrderFullInfo["nftData"].description}`}
                                        place="bottom"
                                        style={{
                                            paddingTop: "2px",
                                            paddingBottom: "2px",
                                            paddingLeft: "7px",
                                            paddingRight: "7px",
                                            backgroundColor: "black"
                                        }}
                                    />

                                    <Tooltip
                                        anchorId="nftImg"
                                        content={`Collection symbol - ${sellOrderFullInfo["nftData"].collection.symbol}`}
                                        place="right"
                                        style={{
                                            paddingTop: "2px",
                                            paddingBottom: "2px",
                                            paddingLeft: "7px",
                                            paddingRight: "7px",
                                            backgroundColor: "black"
                                        }}
                                    />
                                </div>

                                <div className="card text-center mx-3 mt-4 shadow">
                                    <div className="card-header">
                                        Create a bid
                                    </div>
                
                                    <div className="card-body">
                                        <div>
                                            <input type="number" min={0} className="form-control mb-2" placeholder="Enter bid price" onChange={e => {
                                                    setPrice(e.target.value);
                                            }}/>

                                            <select className="form-control my-2" onChange={e => {
                                                setToken(e.target.value);
                                            }}>
                                                <option value={null}>
                                                    Choose a currency
                                                </option>
                                                    
                                                {
                                                    (Contracts.Tokens).map((token, index) => (
                                                        <option key={index} value={token.address}>
                                                            {token.name}
                                                        </option>
                                                    ))
                                                }
                                            </select>

                                            {
                                                !creatingBid ? (
                                                    <button className="btn btn-outline-dark btn-block form-control mt-2" onClick={createBid}>Create bid</button>
                                                ) : (
                                                    <button className="btn btn-secondary btn-block form-control mt-2">Creating bid.....</button>
                                                )
                                            }
                                        </div>
                                    </div>
                                </div>

                                <div className="card text-center mx-3 mt-5 mb-3 shadow">
                                    <div className="card-header">
                                        All Listed Bids
                                    </div>
                
                                    <div className="card-body">
                                        <div className="table-responsive">
                                            {
                                                !nothing ? (
                                                    <table className="table mb-0">
                                                        <caption>{sellOrderFullInfo.bids.length} Bid{sellOrderFullInfo.bids.length === 1 ? "" : "s"}</caption>
                                                        <thead className="table-dark">
                                                            <tr>
                                                                <th scope="col">Bid ID</th>
                                                                <th scope="col">Bidder</th>
                                                                <th scope="col">Bid Price</th>
                                                                <th scope="col">Token</th>
                                                                <th scope="col">Created_At</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {
                                                                (sellOrderFullInfo.bids).map((bid, index) => (
                                                                    <tr key={index}>
                                                                        <th>{bid.returnValues.bidId}</th>
                                                                        <td><span id={`bidder-${index}`} onClick={e => {
                                                                            window.navigator.clipboard.writeText(bid.returnValues.bidder).then(() => {
                                                                                toast.info("Bidder address copied !");
                                                                            });
                                                                        }}>{getTrimedAddr(bid.returnValues.bidder)}</span></td>
                                                                        <td>{Contracts.Tokens.removeDecimal(bid.bidInfo.token, bid.bidInfo.price)}</td>
                                                                        <td>
                                                                            <img
                                                                                src={(Contracts.Tokens.getToken(bid.bidInfo.token)).icon}
                                                                                alt={(Contracts.Tokens.getToken(bid.bidInfo.token)).name}
                                                                                width="21px"
                                                                                title={(Contracts.Tokens.getToken(bid.bidInfo.token)).name}
                                                                            />
                                                                        </td>
                                                                        <td>{(new Date(bid.returnValues.time * 1000)).toLocaleString()}</td>
                                                                    </tr>
                                                                ))
                                                            }
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <div className="col-12 mx-auto mt-3 shadow rounded">
                                                        <div className="alert alert-warning text-center">
                                                            No bids found for this sell-order 🙃
                                                        </div>
                                                    </div>
                                                )
                                            }

                                            {
                                                !nothing ? (
                                                    (sellOrderFullInfo.bids).map((bid, index) => (
                                                        <Tooltip
                                                            key={`Tooltip-${index}`}
                                                            anchorId={`bidder-${index}`}
                                                            content={bid.returnValues.bidder}
                                                            place="bottom"
                                                            offset={3}
                                                            style={{
                                                                paddingTop: "2px",
                                                                paddingBottom: "2px",
                                                                paddingLeft: "7px",
                                                                paddingRight: "7px",
                                                                backgroundColor: "black"
                                                            }}
                                                        />
                                                    ))
                                                ) : (null)
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </section>
        </>
    );
};

export default Bid;