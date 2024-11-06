import { useContext, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import ScaleLoader from "react-spinners/ScaleLoader";
import BounceLoader from "react-spinners/BounceLoader";
import PacmanLoader from "react-spinners/PacmanLoader";

import Context from "../context/Context";
import Contracts from "../contracts/data";
import MySellOrdersChild from "./child components/MySellOrdersChild";

const MySellOrders = () => {
    const { web3Http, userAccount, web3Ws } = useContext(Context);

    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(false);
    const [ nothingFound, setNothingFound ] = useState(false);
    const [ sellOrders, setSellOrders ] = useState([]);
    const [ sellOrdersId, setSellOrdersId ] = useState([]);

    useEffect(() => {
        if (userAccount == null) {
            toast.warn("Please connect your wallet to continue", {
                toastId: "Please connect your wallet to continue"
            });
        } else {
            const init = async () => {
                try {
                    const market = new web3Http.eth.Contract(
                        Contracts.MarketplaceImpV1.abi,
                        Contracts.MarketplaceProxy.address
                    );
                
                    market.getPastEvents("SellOrderCreated", {
                        filter: {
                            creator: userAccount
                        },
                        fromBlock: Contracts.MarketplaceProxy.blockNumber
                    }, async (err, res) => {
                        if (!err) {
                            if (res.length > 0) {
                                let orders = res.map(order => {
                                    return order.returnValues.orderId;
                                });
                                setSellOrdersId(orders);

                                let info1 = res.map(order => {
                                    const response = market.methods.sellOrder(order.returnValues.orderId).call({});
            
                                    return response;
                                });
                                let info2 = await Promise.all(info1);
            
                                let info3 = info2.map(val => {
                                    const nft = new web3Http.eth.Contract(
                                        Contracts.ERC721.abi,
                                        val.contractAddr
                                    );
            
                                    const tokenURI = nft.methods.tokenURI(val.nftId).call({});
            
                                    return tokenURI;
                                });
                                let info4 = await Promise.all(info3);
                                    
                                let info5 = info4.map(val => {
                                    const response = fetch(val).then(res => res.text());
            
                                    return response;
                                });
                                let info6 = await Promise.all(info5);
                                    
                                let info7 = info6.map(val => {
                                     return JSON.parse(val);
                                });
            
                                let info8 = info7.map(val => {
                                    let img = `https://nftstorage.link/ipfs/${String(val.image).slice(7, String(val.image).length)}`
                                        
                                    val.image = img;
            
                                    return val;
                                });
                                    
                                let info9 = info2.map((val, index) => {
                                    const nftData = info8[index];
                                    const orderId = res[index].returnValues.orderId;
                                        
                                    return {...val, nftData, orderId, eventData: res[index]};
                                });
    
                                // add extra data to orders that have been canceled
                                let canceledOrders = [];
                                await market.getPastEvents("SellOrderCanceled", {
                                    filter: {
                                        seller: userAccount
                                    },
                                    fromBlock: Contracts.MarketplaceProxy.blockNumber
                                }, (err, data) => {
                                    if (!err) {
                                        for (let i = 0; i < data.length; i++) {
                                            canceledOrders.push(data[i]);
                                        };
                                    } else {
                                        throw new Error("Failed to load your sell orders");
                                    };
                                });
                                
                                const info10 = [];
                                for (let j = 0; j < info9.length; ++j) {
                                    let is = false;
    
                                    for (let i = 0; i < canceledOrders.length; i++) {
                                        if (info9[j].orderId === canceledOrders[i].returnValues.orderId) {
                                            info10.push({...info9[j], cancelationData: canceledOrders[i]});
                                            is = true;
                                            break;
                                        };
                                    };
    
                                    if (!is) {
                                        info10.push(info9[j]);
                                    } else {
                                        is = false;
                                    };
                                };
                                // add extra data to orders that have been ended successfully
                                let enededOrders = [];
                                await market.getPastEvents("BidAccepted", {
                                    filter: {
                                        seller: userAccount
                                    },
                                    fromBlock: Contracts.MarketplaceProxy.blockNumber
                                }, (err, data) => {
                                    if (!err) {
                                        for (let i = 0; i < data.length; i++) {
                                            enededOrders.push(data[i]);
                                        };
                                    } else {
                                        throw new Error("Failed to load your sell orders");
                                    };
                                });
    
                                const info11 = [];
                                for (let j = 0; j < info10.length; ++j) {
                                    let is = false;
    
                                    for (let i = 0; i < enededOrders.length; i++) {
                                        if (info10[j].orderId === enededOrders[i].returnValues.orderId) {
                                            info11.push({...info10[j], acceptionData: enededOrders[i]});
                                            is = true;
                                            break;
                                        };
                                    };
    
                                    if (!is) {
                                        info11.push(info10[j]);
                                    } else {
                                        is = false;
                                    };
                                };
                                /////////////////////////////////////////////////////////////
                                setSellOrders(info11);
                                setLoading(false);
                            } else {
                                toast.warn("Nothing found to show", {
                                    toastId: "no sell orders found"
                                });
                                setLoading(false);
                                setNothingFound(true);
                            };
                        } else {
                            throw new Error("Failed to load your bids");
                        };
                    });
                } catch {
                    toast.error("Failed to load your sell orders", {
                        toastId: "filed to load sell orders"
                    });
                    setLoading(false);
                    setError(true);
                };
            };
    
            init();
        };
    }, [ userAccount, web3Http ]);

    useEffect(() => {
        if (sellOrdersId.length > 0) {
            const market = new web3Ws.eth.Contract(
                Contracts.MarketplaceImpV1.abi,
                Contracts.MarketplaceProxy.address
            );
    
            const options_1 = {
                filter: {
                    sellOrderId: sellOrdersId
                }
            };
            market.events.BidCreated(options_1, (err, data) => {
                if (!err) {
                    toast.info(`New bid created for sell order id "${data.returnValues.sellOrderId}". Click to see`, {
                        toastId: "New bid created",
                        onClick:() => {
                            window.open(`https://mumbai.polygonscan.com/tx/${data.transactionHash}`, "_blank");
                        }
                    });
                };
            });

            const options_2 = {
                filter: {
                    orderId: sellOrdersId
                }
            };
            market.events.BidCanceled(options_2, (err, data) => {
                if (!err) {
                    toast.info(`Bid id "${data.returnValues.bidId}" just canceled in sell order id "${data.returnValues.orderId}". Click to see`, {
                        toastId: "",
                        onClick:() => {
                            window.open(`https://mumbai.polygonscan.com/tx/${data.transactionHash}`, "_blank");
                        }
                    });
                };
            });
        };
    }, [ sellOrdersId, web3Ws ]);

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
                                            sellOrders.map((order, index) => (
                                                <MySellOrdersChild
                                                    key={index}
                                                    sellOrder={order}
                                                    id={index}
                                                />
                                            ))
                                        }
                                    </div>
                                </div>
                            )
                        }
                    </section>
                ) : (
                    <Navigate to="/marketplace"/>
                )
            }
        </>
    );
};

export default MySellOrders;