import { useContext, useState, useEffect } from "react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { toast } from "react-toastify";
import BounceLoader from "react-spinners/BounceLoader";
import PacmanLoader from "react-spinners/PacmanLoader";

import Context from "../context/Context";
import Contracts from "../contracts/data";
import IndexChild from "./child components/IndexChild";

const Index = () => {
    const { web3Http, web3Ws } = useContext(Context);

    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(false);
    const [ nothingFound, setNothingFound ] = useState(false);
    const [ sellOrders, setSellOrders ] = useState([]);

    useEffect(() => {
        try {
            const market = new web3Http.eth.Contract(
                Contracts.MarketplaceImpV1.abi,
                Contracts.MarketplaceProxy.address
            );

            market.getPastEvents("SellOrderCreated", {
                fromBlock: Contracts.MarketplaceProxy.blockNumber
            }, async (err, res) => {
                if (!err) {
                    let info1 = res.map(order => {
                        const response = market.methods.sellOrder(order.returnValues.orderId).call({});
                        return response;
                    });
                    let info2 = await Promise.all(info1);

                    let validatedRes = [];
                    for (let order = 0; order < info2.length; order++) {
                        let current = info2[order];
                        let orderId = res[order].returnValues.orderId;

                        if (!current["isEnded"] && !current["isCanceled"]) {
                            validatedRes.push({...current, orderId, eventData: res[order]});
                        };
                    };

                    if (validatedRes.length > 0) {
                        let info3 = validatedRes.map(val => {
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
                            
                        let info9 = validatedRes.map((val, index) => {
                            const nftData = info8[index];
                            const orderId = validatedRes[index].orderId;
                            
                            return {...val, nftData, orderId};
                        });
                            
                        setSellOrders(info9);
                        setLoading(false);
                    } else {
                        toast.warn("No sell orders found to show", {
                            toastId: "there is no sell order"
                        });
                        setLoading(false);
                        setNothingFound(true);
                    };
                } else {
                    toast.error("Failed to load the market sell orders. Please try again later", {
                        toastId: "Failed to load sell orders (2)"
                    });
                    setLoading(false);
                    setError(true);
                };
            });
        } catch {
            toast.error("Failed to load the market sell orders. Please try again later", {
                toastId: "Failed to load sell orders (1)"
            });
            setLoading(false);
            setError(true);
        };
    }, [ web3Http ]);

    useEffect(() => {
        const market = new web3Ws.eth.Contract(
            Contracts.MarketplaceImpV1.abi,
            Contracts.MarketplaceProxy.address
        );

        market.events.SellOrderCreated({}, (err, event) => {
            if (!err) {
                toast.info("New sell oreder created. Click to see", {
                    toastId: "New sell oreder created. Click to see",
                    onClick: () => {
                        window.open(`https://mumbai.polygonscan.com/tx/${event.transactionHash}`, "_blank");
                    }
                });
            };
        });
    }, [ web3Ws ]);

    return (
        <>
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
                                        <IndexChild
                                            key={index}
                                            nftData={order}
                                        />
                                    ))
                                }
                            </div>
                        </div>
                    )
                }
            </section>
        </>
    );
};

export default Index;