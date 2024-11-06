import { useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import ScaleLoader from "react-spinners/ScaleLoader";
import BounceLoader from "react-spinners/BounceLoader";
import PacmanLoader from "react-spinners/PacmanLoader";

import Context from "../context/Context";
import Contracts from "../contracts/data";
import MyBidsChild from "./child components/MyBidsChild";

const MyBids = () => {
    const { userAccount, web3Http, web3Ws } = useContext(Context);

    const navigate = useNavigate();

    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(false);
    const [ nothingFound, setNothingFound ] = useState(false);
    const [ bids, setBids ] = useState(null);

    useEffect(() => {
        if (userAccount == null) {
            toast.warn("Please connect your wallet to continue", {
                toastId: "Please connect your wallet to continue"
            });
            navigate("/");
        } else {
            const init = async () => {
                try {
                    const market = new web3Http.eth.Contract(
                        Contracts.MarketplaceImpV1.abi,
                        Contracts.MarketplaceProxy.address
                    );
    
                    market.getPastEvents("BidCreated", {
                        filter: {
                            bidder: userAccount
                        },
                        fromBlock: Contracts.MarketplaceProxy.blockNumber
                    }, async (err, events) => {
                        if (!err) {
                            if (events.length > 0) {
                                let info1 = events.map(val => {
                                    const response = market.methods.bid(val.returnValues.bidId).call({});
                                    return response;
                                });
                                let info2 = await Promise.all(info1);
                                
                                let info3 = info2.map(async val => {
                                    const response = await market.methods.sellOrder(val.sellOrderId).call({});
                                    return {...val, sellOrderData: response};
                                });
                                let info4 = await Promise.all(info3);
                                
                                let info5 = info4.map((val, index) => {
                                    return {...val, eventData: events[index]};
                                });
                                console.log(info5);
                                let info6 = info5.map(async val => {
                                    const nft = new web3Http.eth.Contract(
                                        Contracts.ERC721.abi,
                                        val["eventData"].returnValues.contractAddr
                                    );

                                    const response = await nft.methods.tokenURI(
                                        val["sellOrderData"].nftId
                                    ).call({});

                                    return {...val, nftData: response};
                                });
                                let info7 = await Promise.all(info6);

                                let info8 = info7.map(async val => {
                                    const response = await fetch(val["nftData"]).then(res => res.text());
            
                                    return {...val, nftData: response};
                                });
                                let info9 = await Promise.all(info8);
                                    
                                let info10 = info9.map(val => {
                                    return {...val, nftData: JSON.parse(val["nftData"])};
                                });
            
                                let info11 = info10.map(val => {
                                    let img = `https://nftstorage.link/ipfs/${String(val["nftData"].image).slice(7, String(val["nftData"].image).length)}`
                                        
                                    val["nftData"].image = img;
            
                                    return val;
                                });

                                // add extra data to bids that have been canceled
                                let canceledBids = [];
                                await market.getPastEvents("BidCanceled", {
                                    filter: {
                                        bidder: userAccount
                                    },
                                    fromBlock: Contracts.MarketplaceProxy.blockNumber
                                }, (err, data) => {
                                    if (!err) {
                                        for (let i = 0; i < data.length; i++) {
                                            canceledBids.push(data[i]);
                                        };
                                    } else {
                                        throw new Error("Failed to load your bids");
                                    };
                                });
                                
                                const info12 = [];
                                for (let j = 0; j < info11.length; ++j) {
                                    let is = false;
    
                                    for (let i = 0; i < canceledBids.length; i++) {
                                        if (info11[j]["eventData"].returnValues.bidId === canceledBids[i].returnValues.bidId) {
                                            info12.push({...info11[j], cancelationData: canceledBids[i]});
                                            is = true;
                                            break;
                                        };
                                    };
    
                                    if (!is) {
                                        info12.push(info11[j]);
                                    } else {
                                        is = false;
                                    };
                                };
                                // add extra data to bids that have been ended successfully
                                let enededBids = [];
                                await market.getPastEvents("BidAccepted", {
                                    filter: {
                                        buyer: userAccount
                                    },
                                    fromBlock: Contracts.MarketplaceProxy.blockNumber
                                }, (err, data) => {
                                    if (!err) {
                                        for (let i = 0; i < data.length; i++) {
                                            enededBids.push(data[i]);
                                        };
                                    } else {
                                        throw new Error("Failed to load your bids");
                                    };
                                });
    
                                const info13 = [];
                                for (let j = 0; j < info12.length; ++j) {
                                    let is = false;
    
                                    for (let i = 0; i < enededBids.length; i++) {
                                        if (info12[j]["eventData"].returnValues.bidId === enededBids[i].returnValues.bidId) {
                                            info13.push({...info12[j], acceptionData: enededBids[i]});
                                            is = true;
                                            break;
                                        };
                                    };
    
                                    if (!is) {
                                        info13.push(info12[j]);
                                    } else {
                                        is = false;
                                    };
                                };
                                /////////////////////////////////////////////////////////////
                                setBids(info13);
                                setLoading(false);
                            } else {
                                setNothingFound(true);
                                setLoading(false);
                                toast.warn("Nothing found to show", {
                                    toastId: "no bids found"
                                });
                            };
                        } else {
                            throw new Error("Failed to load your bids");
                        };
                    });
                } catch {
                    toast.error("Failed to load your bids", {
                        toastId: "Failed to load your bids"
                    });
                    setLoading(false);
                    setError(true);
                };
            };
    
            init();
        };
    }, [ navigate, userAccount, web3Http ]);

    useEffect(() => {
        if (bids != null && bids.length > 0) {
            const market = new web3Ws.eth.Contract(
                Contracts.MarketplaceImpV1.abi,
                Contracts.MarketplaceProxy.address
            );
    
            const options = {
                filter: {
                    buyer: userAccount
                }
            };
            market.events.BidCreated(options, (err, data) => {
                if (!err) {
                    toast.info(`Sell order "${data.returnValues.orderId}" owner accepted your bid "${data.returnValues.bidId}". Click to see`, {
                        toastId: "accepted your bid",
                        onClick:() => {
                            window.open(`https://mumbai.polygonscan.com/tx/${data.transactionHash}`, "_blank");
                        }
                    });
                };
            });
        };
    }, [ web3Ws, userAccount, bids ]);

    return (
        <>
            {
                (userAccount != null) ? (
                    <section>
                        {
                            nothingFound ? (
                                <div className="col-1 mx-auto" style={{ marginTop: "12%" }}>
                                    <PacmanLoader
                                        color="black"
                                        size={30}
                                    />
                                </div>
                            ) : (null)
                        }

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
                                <div className="container-fluid">
                                    <div className="row">
                                        {
                                            bids != null && bids.length > 0 ? (                                 
                                                bids.map((val, index) => (
                                                    <MyBidsChild
                                                        key={index}
                                                        bid={val}
                                                        id={index}
                                                    />
                                                ))
                                            ) : (null)
                                        }
                                    </div>
                                </div>
                            )
                        }
                    </section>
                ) : (null)
            }
        </>
    );
};

export default MyBids;