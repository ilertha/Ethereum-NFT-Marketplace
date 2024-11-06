import { useCallback, useState, useContext } from "react";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";

import Context from "../context/Context";
import Contracts from "../contracts/data";

const SearchSellOrder = () => {
    const { web3Http } = useContext(Context);

    const [ id, setId ] = useState(null);
    const [ loading, setLoading ] = useState(false);
    const [ sellOrder, setSellOrder ] = useState(null);
    const [ notFound, setNotFound ] = useState(false);

    const search = useCallback(async () => {
        try {
            if (id != null) {
                if (!isNaN(Number(id)) && Number(id) >= 1) {
                    setLoading(true);

                    const market = new web3Http.eth.Contract(
                        Contracts.MarketplaceImpV1.abi,
                        Contracts.MarketplaceProxy.address
                    );

                    const options = {
                        filter: {
                            orderId: id
                        },
                        fromBlock: Contracts.MarketplaceProxy.blockNumber
                    };
                    market.getPastEvents("SellOrderCreated", options, async (err, event) => {
                        if (!err) {
                            if (event.length === 1) {
                                setNotFound(false);
                                
                                const sellOrderInfo = await market.methods.sellOrder(
                                    web3Http.utils.toBN(event[0].returnValues.orderId)
                                ).call({});
                                setSellOrder(sellOrderInfo);

                                setLoading(false);
                            } else {
                                setSellOrder(null);
                                setNotFound(true);
                                setLoading(false);
                            };
                        } else {
                            setLoading(false);
                            throw new Error("Failed to fetch the event");
                        };
                    });
                } else {
                    setSellOrder(null);
                    setNotFound(false);
                    toast.warn("Please enter valid sell order id", {
                        toastId: "Please enter valid sell order id"
                    });
                    return false;
                };
            } else {
                setSellOrder(null);
                setNotFound(false);
                toast.warn("Please enter a sell order id", {
                    toastId: "Please enter a sell order id"
                });
                return false;
            };
        } catch {
            setSellOrder(null);
            setNotFound(false);
            toast.error("Failed to search", {
                toastId: "Failed to search"
            });
            setLoading(false);
            return false;
        };
    }, [ id, web3Http ]);

    return (
        <>
            <section>
                <div className="container">
                    <div className="row">
                        <div className="col-8 mx-auto my-5">
                            <div className="card">
                                <div className="card-header text-center">
                                    Search Sell Order
                                </div>

                                <div className="card-body">
                                    <div>
                                        <div className="form-group">
                                            <label className="form-label text-muted">Enter sell order id</label>
                                            <input className="form-control" type="number" onChange={(e) => {
                                                setId(e.target.value);
                                            }} min={0}/>
                                        </div>
                                        
                                        <button
                                            className="btn btn-dark btn-block from-control mt-3"
                                            style={{ width: "100%" }}
                                            onClick={search}
                                        >Search</button>
                                    </div>
                                    
                                    {
                                        loading ? (
                                            <>
                                                <div className="row">
                                                    <div className="col-1 mx-auto mt-5 mb-4">
                                                        <ClipLoader
                                                            color="#000000"
                                                            size={38}
                                                            speedMultiplier={0.8}
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            (sellOrder != null) ? (
                                                <>
                                                    <hr />

                                                    <div className="card mx-5 shadow">
                                                        <div className="card-header text-center">
                                                            Sell Order ID "" Details
                                                        </div>

                                                        <div className="card-body text-center">
                                                            <strong className="mb-1">Owner</strong><p>{sellOrder["seller"]}</p> <hr />

                                                            <strong className="mb-1">Status</strong>
                                                            <p>
                                                                {
                                                                    (!sellOrder["isEnded"] && !sellOrder["isCanceled"]) ? (
                                                                        <span className="badge bg-secondary shadow py-1 px-4 mt-2">Pending</span>
                                                                    ) : (
                                                                        sellOrder["isEnded"] ? (
                                                                            <span className="badge bg-success shadow py-1 px-4 mt-2">Ended</span>
                                                                        ) : (
                                                                            <span className="badge bg-danger shadow py-1 px-4 mt-2">Canceled</span>
                                                                        )
                                                                    )
                                                                }
                                                            </p> <hr />

                                                            <strong className="mb-1">Price</strong>
                                                            <p>
                                                                {`${Contracts.Tokens.removeDecimal(sellOrder["token"], sellOrder["price"])} `}
                                                                <img src={Contracts.Tokens.getToken(sellOrder["token"]).icon} alt="bid token" width="17px" className="mb-1"/>
                                                            </p> <hr />

                                                            <strong className="mb-1">NFT contract address</strong><p>{sellOrder["contractAddr"]}</p> <hr />

                                                            <strong className="mb-1">NFT ID</strong><p>{sellOrder["nftId"]}</p> <hr />

                                                            <strong className="mb-1">Created_At</strong><p>{(new Date(sellOrder["startedAt"] * 1000)).toLocaleString()}</p> <hr />

                                                            <strong className="mb-1">Ended_At</strong>
                                                            <p>
                                                                {
                                                                    sellOrder["endedAt"] === "0" ?
                                                                    ("Not-Ended") :
                                                                    ((new Date(sellOrder["endedAt"] * 1000)).toLocaleString())
                                                                }
                                                            </p> <hr />

                                                            <strong className="mb-1">Buyer</strong>
                                                            <p>
                                                                {
                                                                    sellOrder["buyer"] === "0x0000000000000000000000000000000000000000" ?
                                                                    ("No-Body") :
                                                                    (sellOrder["buyer"])
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                notFound ? (
                                                    <>
                                                        <div className="row">
                                                            <div className="col-8 mx-auto mt-5 mb-4">
                                                                <div className="alert alert-warning text-center">
                                                                    Nothing found 🤕
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (null)
                                            )
                                        )
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default SearchSellOrder;