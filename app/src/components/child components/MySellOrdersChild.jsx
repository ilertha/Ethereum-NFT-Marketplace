import { toast } from "react-toastify";
import 'react-tooltip/dist/react-tooltip.css';
import { Tooltip } from 'react-tooltip';
import PropTypes from "prop-types";
import { useCallback, useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";

import Context from "../../context/Context";
import Contracts from "../../contracts/data";

const MySellOrdersChild = ({ sellOrder, id }) => {
    const { web3Http } = useContext(Context);

    const [ acceptedBidPrice, setAcceptedBidPrice ] = useState(null);
    const [ acceptedBidToken, setAcceptedBidToken ] = useState(null);
    const [ loading, setLoading ] = useState(true);

    const getCopyData = useCallback(() => {
        const nftId = sellOrder["nftId"];
        const nftImage = sellOrder["nftData"].image;
        const nftName = sellOrder["nftData"].name;
        const nftDesc = sellOrder["nftData"].description;
        const nftContractAddr = sellOrder["contractAddr"];
        const buyer = sellOrder["buyer"];
        const sellOrderCreatedAt = (new Date(sellOrder["startedAt"] * 1000)).toLocaleString();
        const sellOrderId = sellOrder["orderId"];
        const sellOrderStatus = !sellOrder["isEnded"] && !sellOrder["isCanceled"] ? "Pending" : (sellOrder["isEnded"] ? "Ended" : "Canceled");
        const sellOrderCorrespondingTx = !sellOrder["isEnded"] && !sellOrder["isCanceled"]
                                        ?
                                            `https://mumbai.polygonscan.com/tx/${sellOrder["eventData"].transactionHash}`
                                        :
                                        (
                                        sellOrder["isEnded"] ?  
                                            `https://mumbai.polygonscan.com/tx/${sellOrder["acceptionData"].transactionHash}` :
                                            `https://mumbai.polygonscan.com/tx/${sellOrder["cancelationData"].transactionHash}`
                                        );

        const Data = {
            nftId,
            nftImage,
            nftName,
            nftDesc,
            nftContractAddr,
            sellOrderId,
            sellOrderStatus,
            sellOrderCreatedAt,
            sellOrderCorrespondingTx,
            buyer
        };

        window.navigator.clipboard.writeText(JSON.stringify(Data)).then(() => {
            toast.info("Sell order's full info copied !");
        }).catch(() => {
            toast.error("Failed to copy !", {
                toastId: "Failed to copy !"
            });
        });
    }, [ sellOrder ]);

    useEffect(() => {
        if (sellOrder["isEnded"]) {
            const init = async () => {
                const market = new web3Http.eth.Contract(
                    Contracts.MarketplaceImpV1.abi,
                    Contracts.MarketplaceProxy.address
                );
        
                const bidInfo = await market.methods.bid(
                    sellOrder["acceptionData"].returnValues.bidId
                ).call({});
                
                setAcceptedBidPrice(
                    Contracts.Tokens.removeDecimal(bidInfo.token, bidInfo.price)
                );

                setAcceptedBidToken(
                    Contracts.Tokens.getToken(bidInfo.token).icon
                );
            };
    
            init();
        };
        setLoading(false);
    }, [ web3Http, sellOrder ]);

    return (
        <>
            <div className="col-xl-3 col-md-6 col-sm-12 mt-5 ml-5 mb-3">
                <div className="card text-center shadow">
                    <div className="card-header">
                        <p className="card-title">
                            Sell Order ID "{sellOrder["orderId"]}"
                        </p>
                    </div>

                    <div className="card-body">
                        <img
                            className="rounded"
                            src={sellOrder["nftData"].image} 
                            width="100%"
                            alt="nft"
                            id={`nftImg${sellOrder["nftId"]}`}
                            data-contract-addr={sellOrder["contractAddr"]}
                            style={{ cursor: "default" }}
                        />

                        <Tooltip
                            anchorId={`nftImg${sellOrder["nftId"]}`}
                            content={`NFT address - ${sellOrder["contractAddr"]}`}
                            place="top"
                            style={{
                                paddingTop: "2px",
                                paddingBottom: "2px",
                                paddingLeft: "7px",
                                paddingRight: "7px",
                                backgroundColor: "black"
                            }}
                        />
                        
                        {
                            (!sellOrder["isEnded"] && !sellOrder["isCanceled"]) ? (
                                <>
                                    <Link
                                        className="btn btn-secondary shadow mt-3"
                                        style={{ borderRadius: "15px" }}
                                        id={`pendingOrder${sellOrder["nftId"]}`}
                                        to={`/mySellOrderDetails/${sellOrder["orderId"]}`}
                                    >Pending</Link>

                                    <div className="accordion my-3" id={`accordion${id}`}>
                                        <div className="accordion-item">
                                            <h2 className="accordion-header" id="headingOne">
                                                <button style={{ color: "black", backgroundColor: "transparent" }} className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target={`#collapseOne${id}`} aria-expanded="false" aria-controls="collapseOne">
                                                    Sell order information
                                                </button>
                                            </h2>
                                            <div id={`collapseOne${id}`} className="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent={`#accordion${id}`}>
                                                <div className="accordion-body">
                                                    <strong>NFT ID</strong><p>{sellOrder["nftId"]}</p> <hr />
                                                    <strong>Contract address</strong><p>{sellOrder["contractAddr"]}</p> <hr />
                                                    <strong>
                                                        <a href={`https://mumbai.polygonscan.com/tx/${sellOrder["eventData"].transactionHash}`} target="_blank" style={{ textDecoration: "none", color: "black" }}>
                                                            📃 Click to see the transaction
                                                        </a>
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Tooltip
                                        anchorId={`pendingOrder${sellOrder["nftId"]}`}
                                        content="Click to see details"
                                        place="bottom"
                                        style={{
                                            paddingTop: "2px",
                                            paddingBottom: "2px",
                                            paddingLeft: "7px",
                                            paddingRight: "7px",
                                            backgroundColor: "#6c757d"
                                        }}
                                    />
                                </>
                            ) : (null)
                        }
                        
                        {
                            (sellOrder["isEnded"] && !sellOrder["isCanceled"]) ? (
                                <>
                                    <button
                                        id={`endedOrder${sellOrder["nftId"]}`}
                                        className="btn btn-success shadow mt-3"
                                        style={{ borderRadius: "15px", cursor: "help" }}
                                        onClick={getCopyData}
                                    >Ended</button>

                                    <div className="accordion my-3" id={`accordion${id}`}>
                                        <div className="accordion-item">
                                            <h2 className="accordion-header" id="headingOne">
                                                <button style={{ color: "black", backgroundColor: "transparent" }} className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target={`#collapseOne${id}`} aria-expanded="false" aria-controls="collapseOne">
                                                    Sell order information
                                                </button>
                                            </h2>
                                            <div id={`collapseOne${id}`} className="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent={`#accordion${id}`}>
                                                <div className="accordion-body">
                                                    <strong>NFT ID</strong><p>{sellOrder["nftId"]}</p><hr />
                                                    <strong>Contract address</strong><p>{sellOrder["contractAddr"]}</p><hr />
                                                    <strong>Ended_At</strong><p>{(new Date(sellOrder["endedAt"] * 1000)).toLocaleString()}</p><hr />
                                                    <strong>Buyer</strong><p>{sellOrder["buyer"]}</p><hr />
                                                    <strong>Accepted bid price</strong>
                                                    <p>
                                                        {
                                                            loading ? "Loading..." : `${acceptedBidPrice} `
                                                        }

                                                        {
                                                            loading ? null : (
                                                                <>
                                                                    <img src={acceptedBidToken} alt="bid token" width="17px" className="mb-1"/>
                                                                    <small className="text-muted" title="Marketplace Fee Percent"> (-2% fee)</small>
                                                                </> 
                                                            )
                                                        }
                                                    </p>
                                                    <hr />
                                                    <strong>
                                                        <a href={`https://mumbai.polygonscan.com/tx/${sellOrder["acceptionData"].transactionHash}`} target="_blank" style={{ textDecoration: "none", color: "black" }}>
                                                            📃 Click to see the transaction
                                                        </a>
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Tooltip
                                        anchorId={`endedOrder${sellOrder["nftId"]}`}
                                        content="Click to copy the sell order's details"
                                        place="bottom"
                                        style={{
                                            paddingTop: "2px",
                                            paddingBottom: "2px",
                                            paddingLeft: "7px",
                                            paddingRight: "7px",
                                            backgroundColor: "#198754"
                                        }}
                                    />
                                </>
                            ) : (null)
                        }

                        {
                            (sellOrder["isCanceled"] && !sellOrder["isEnded"]) ? (
                                <>
                                    <button
                                        id={`canceledOrder${sellOrder["nftId"]}`}
                                        className="btn btn-danger shadow mt-3"
                                        style={{ borderRadius: "15px", cursor: "help" }}
                                        onClick={getCopyData}
                                    >Canceled</button>

                                    <div className="accordion my-3" id={`accordion${id}`}>
                                        <div className="accordion-item">
                                            <h2 className="accordion-header" id="headingOne">
                                                <button style={{ color: "black", backgroundColor: "transparent" }} className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target={`#collapseOne${id}`} aria-expanded="false" aria-controls="collapseOne">
                                                    Sell order information
                                                </button>
                                            </h2>
                                            <div id={`collapseOne${id}`} className="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent={`#accordion${id}`}>
                                                <div className="accordion-body">
                                                    <strong>NFT ID</strong><p>{sellOrder["nftId"]}</p><hr />
                                                    <strong>Contract address</strong><p>{sellOrder["contractAddr"]}</p><hr />
                                                    <strong>Canceled_At</strong><p>{(new Date(sellOrder["endedAt"] * 1000)).toLocaleString()}</p><hr />
                                                    <strong>
                                                        <a href={`https://mumbai.polygonscan.com/tx/${sellOrder["cancelationData"].transactionHash}`} target="_blank" style={{ textDecoration: "none", color: "black" }}>
                                                            📃 Click to see the transaction
                                                        </a>
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Tooltip
                                        anchorId={`canceledOrder${sellOrder["nftId"]}`}
                                        content="Click to copy the sell order's details"
                                        place="bottom"
                                        style={{
                                            paddingTop: "2px",
                                            paddingBottom: "2px",
                                            paddingLeft: "7px",
                                            paddingRight: "7px",
                                            backgroundColor: "#dc3545"
                                        }}
                                    />
                                </>
                            ) : (null)
                        }
                    </div>

                    <div className="card-footer">
                        Creation Time - {(new Date(sellOrder["startedAt"] * 1000)).toLocaleString()}
                    </div>
                </div>
            </div>
        </>
    );
}; 

MySellOrdersChild.propTypes = {
    sellOrder: PropTypes.object,
    id: PropTypes.number
};

export default MySellOrdersChild;