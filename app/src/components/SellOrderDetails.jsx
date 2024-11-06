import { useState, useCallback, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import 'react-tooltip/dist/react-tooltip.css';
import { Tooltip } from "react-tooltip";
import BounceLoader from "react-spinners/BounceLoader";
import ScaleLoader from "react-spinners/ScaleLoader";

import Context from "../context/Context";
import Contracts from "../contracts/data";

const SellOrderDetails = () => {
    const { userAccount, web3Http, txValidator, ethereum, web3Ws } = useContext(Context);

    const params = useParams();
    const navigate = useNavigate();

    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(false);
    const [ sellOrderFullInfo, setSellOrderFullInfo ] = useState(null);
    const [ nothing, setNothing ] = useState(false);
    const [ accept, setAccept ] = useState(false);
    const [ cancel, setCancel ] = useState(false);
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
            const cancelOptions = {
                filter: {
                    seller: userAccount,
                    orderId: params.sellOrderId
                }
            };
            market.events.SellOrderCanceled(cancelOptions, (err, data) => {
                if (!err) {
                    setLoading(true);
                    setRefresh(!refresh);
                } else {
                    console.log("Error:\n", err);
                };
            });

            const acceptionOptions = {
                filter: {
                    seller: userAccount,
                    orderId: params.sellOrderId
                }
            };
            market.events.BidAccepted(acceptionOptions, (err, data) => {
                if (!err) {
                    setLoading(true);
                    setRefresh(!refresh);
                    console.log("Bid accepted:\n", data);
                } else {
                    console.log("Error:\n", err);
                };
            });
        };
    }, [ userAccount, web3Http, web3Ws, refresh, params ]);

    useEffect(() => {
        if (userAccount == null) {
            toast.warn("Please connect your wallet", {
                toastId: "Please connect your wallet"
            });
            navigate("/");
        };

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
    }, [ params, navigate, web3Http, userAccount, refresh ]);

    useEffect(() => {
        if (sellOrderFullInfo != null) {
            if (sellOrderFullInfo["seller"] !== userAccount) {
                toast.warn("You are not the sell order owner", {
                    toastId: "You are not the sell order owner"
                });
                navigate("/marketplace");
            };
        };
    }, [ sellOrderFullInfo, userAccount, navigate ]);

    const acceptBid = useCallback(async (bidId) => {
        if (await txValidator()) {
            try {
                setAccept(true);
    
                const market = new web3Http.eth.Contract(
                    Contracts.MarketplaceImpV1.abi,
                    Contracts.MarketplaceProxy.address
                );
    
                let to, from, data, chainId, Tx, value;
    
                from = userAccount;
                to = market.options.address;
                data = market.methods.acceptBid(bidId, params.sellOrderId).encodeABI({ from });
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
                          toast.success("Bid accepted, You received bid price", {
                            toastId: "tx confirmed"
                          });
                        } else if (isValid === false) {
                          toast.error("Failed to accept the bid", {
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
                        success: "Transaction sent. Please wait for the latest confirmation",
                        error: "Failed to send the transaction"
                    }
                );
    
                setAccept(false);
            } catch {
                toast.error("Failed to accept the bid", {
                    toastId: "Failed to accept the bid"
                });
                setAccept(false);
            };
        } else {
            return false;
        };
    }, [ txValidator, userAccount, web3Http, ethereum, params ]);

    const cancelSellOrder = useCallback(async () => {
        if (await txValidator()) {
            try {
                setCancel(true);
    
                const market = new web3Http.eth.Contract(
                    Contracts.MarketplaceImpV1.abi,
                    Contracts.MarketplaceProxy.address
                );
    
                let to, from, data, chainId, Tx, value;
    
                from = userAccount;
                to = market.options.address;
                data = market.methods.cancelSellOrder(params.sellOrderId).encodeABI({ from });
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
                          toast.success("Sell oreder canceled", {
                            toastId: "tx confirmed"
                          });
                        } else if (isValid === false) {
                          toast.error("Failed to cancel the sell order", {
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
                        success: "Transaction sent. Please wait for the latest confirmation",
                        error: "Failed to send the transaction"
                    }
                );
    
                setCancel(false);
            } catch {
                toast.error("Failed to cancel the sell order", {
                    toastId: "Failed to cancel the sell order"
                });
                setCancel(false);
            };
        } else {
            return false;
        };
    }, [ txValidator, userAccount, web3Http, ethereum, params ]);

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

                                {
                                    !cancel ? (
                                        <button onClick={cancelSellOrder} className="btn btn-outline-danger btn-block mx-3 mt-2">
                                            Cancel sell order
                                        </button>
                                    ) : (
                                        <button className="btn btn-secondary btn-block mx-3 mt-2">
                                            Canceling.....
                                        </button>
                                    )
                                }

                                <div className="card text-center mx-3 mt-4 mb-3 shadow">
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
                                                                <th scope="col">Accept</th>
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
                                                                        <td>
                                                                            {
                                                                                !accept ? (
                                                                                    <button onClick={() => {
                                                                                        acceptBid(bid.returnValues.bidId);
                                                                                    }} className="btn btn-outline-success btn-block">
                                                                                        accept
                                                                                    </button>
                                                                                ) : (
                                                                                    <button
                                                                                        className="btn btn-secondary btn-block"
                                                                                        style={{ cursor: "progress" }}
                                                                                    >
                                                                                        accepting.....
                                                                                    </button>
                                                                                )
                                                                            }
                                                                        </td>
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

export default SellOrderDetails;