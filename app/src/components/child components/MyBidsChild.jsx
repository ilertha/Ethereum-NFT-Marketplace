import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import 'react-tooltip/dist/react-tooltip.css';
import { Tooltip } from 'react-tooltip';
import { toast } from "react-toastify";
import { useCallback, useState, useContext } from "react";

import Contracts from "../../contracts/data";
import Context from "../../context/Context";

const MyBidsChild = ({ bid, id }) => {
    const { web3Http, ethereum, userAccount, txValidator } = useContext(Context);

    const [ canceling, setCanceling ] = useState(false);

    const cancelBid = useCallback(async ()  => {
        if (await txValidator()) {
            try {
                setCanceling(true);

                const market = new web3Http.eth.Contract(
                    Contracts.MarketplaceImpV1.abi,
                    Contracts.MarketplaceProxy.address
                );

                let from, to, data, chainId, value, Tx;

                from = userAccount;
                to = market.options.address;
                data = market.methods.cancelBid(bid["eventData"].returnValues.bidId).encodeABI({ from });
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
                          toast.success("Bid canceled", {
                            toastId: "tx confirmed"
                          });
                        } else if (isValid === false) {
                          toast.error("Failed to cancel the bid", {
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

                setCanceling(false);
            } catch {
                toast.error("Failed to cancel the bid. Please try again later", {
                    toastId: "Failed to cancel the bid. Please try again later"
                });
                setCanceling(false);
            };
        } else {
            return false;
        };
    }, [ web3Http, ethereum, userAccount, txValidator, bid ]);

    return (
        <>
            <div className="col-xl-3 col-md-6 col-sm-12 mt-5 ml-5 mb-3">
                <div className="card text-center shadow">
                    <div className="card-header">
                        <p className="card-title">
                            Bid ID "{bid["eventData"].returnValues.bidId}"
                        </p>
                    </div>

                    <div className="card-body">
                        {
                            (!bid["isEnded"] && !bid["isCanceled"]) ? (
                                <>
                                    <Link
                                        style={{ textDecoration: "none", color: "white", borderRadius: "12px" }}
                                        className="btn btn-secondary shadow mt-2"
                                        id="pendingBid"
                                        to={`/bid/${bid["sellOrderId"]}`}
                                    >Pending</Link>

                                    <div className="accordion my-3" id={`accordion${id}`}>
                                        <div className="accordion-item">
                                            <h2 className="accordion-header" id="headingOne">
                                                <button style={{ color: "black", backgroundColor: "transparent" }} className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target={`#collapseOne${id}`} aria-expanded="false" aria-controls="collapseOne">
                                                    Bid details
                                                </button>
                                            </h2>
                                            <div id={`collapseOne${id}`} className="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent={`#accordion${id}`}>
                                                <div className="accordion-body">
                                                    {
                                                        !canceling ? (
                                                            <>
                                                                <button onClick={cancelBid} className="btn btn-outline-danger shadow rounded px-5">Cancel the bid</button> <br /><hr />
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button className="btn btn-secondary shadow rounded px-5">Canceling.....</button> <br /><hr />
                                                            </>
                                                        )
                                                    }

                                                    <strong>Sell Order Status</strong>
                                                    <p>
                                                        {
                                                            (!bid["sellOrderData"]["isEnded"] && !bid["sellOrderData"]["isCanceled"]) ? (
                                                                <span className="badge bg-secondary shadow py-1 px-4 mt-2">Pending</span>
                                                            ) : (
                                                                bid["sellOrderData"]["isEnded"] ? (
                                                                    <span className="badge bg-success shadow py-1 px-4 mt-2">Ended</span>
                                                                ) : (
                                                                    <span className="badge bg-danger shadow py-1 px-4 mt-2">Canceled</span>
                                                                )
                                                            )
                                                        }
                                                    </p>
                                                    <hr />
                                                    <strong>NFT contract address</strong><p>{bid["sellOrderData"].contractAddr}</p><hr />
                                                    <strong>Seller</strong><p>{bid["sellOrderData"].seller}</p><hr />
                                                    <strong>Bid price</strong>
                                                    <p>
                                                        {`${Contracts.Tokens.removeDecimal(bid["token"], bid["price"])} `}
                                                        <img src={Contracts.Tokens.getToken(bid["token"]).icon} alt="bid token" width="17px" className="mb-1"/>
                                                    </p>
                                                    <hr />
                                                    <strong>NFT ID</strong><p>{bid["eventData"].returnValues.nftId}</p><hr />
                                                    <strong>
                                                        <a href={`https://mumbai.polygonscan.com/tx/${bid["eventData"].transactionHash}`} target="_blank" style={{ textDecoration: "none", color: "black" }}>
                                                            📄 Click to see the transaction
                                                        </a>
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <Tooltip
                                        anchorId={`accordion${id}`}
                                        html={`<img src=${bid["nftData"].image} width="265px"/>`}
                                        place="top"
                                        style={{
                                            paddingTop: "2px",
                                            paddingBottom: "2px",
                                            paddingLeft: "7px",
                                            paddingRight: "7px",
                                            backgroundColor: "white"
                                        }}
                                    />

                                    <Tooltip
                                        anchorId="pendingBid"
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
                            (bid["isEnded"] && !bid["isCanceled"]) ? (
                                <>
                                    <button
                                        className="btn btn-success shadow mt-2"
                                        style={{ borderRadius: "15px", cursor: "help" }}
                                        id="endedBid"
                                        onClick={() => {
                                            window.navigator.clipboard.writeText(JSON.stringify(bid)).then(() => {
                                                toast.info("Bid full info copied !");
                                            }).catch(() => {
                                                toast.warn("Failed to copy");
                                            });
                                        }}
                                    >Ended</button>

                                    <div className="accordion my-3" id={`accordion${id}`}>
                                        <div className="accordion-item">
                                            <h2 className="accordion-header" id="headingOne">
                                                <button style={{ color: "black", backgroundColor: "transparent" }} className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target={`#collapseOne${id}`} aria-expanded="false" aria-controls="collapseOne">
                                                    Bid details
                                                </button>
                                            </h2>
                                            <div id={`collapseOne${id}`} className="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent={`#accordion${id}`}>
                                                <div className="accordion-body">
                                                    <strong>NFT contract address</strong><p>{bid["sellOrderData"].contractAddr}</p><hr />
                                                    <strong>Bid Ended_At</strong><p>{(new Date(bid["bidEndedAt"] * 1000)).toLocaleString()}</p><hr />
                                                    <strong>Seller</strong><p>{bid["sellOrderData"].seller}</p><hr />
                                                    <strong>Bid price</strong>
                                                    <p>
                                                        {`${Contracts.Tokens.removeDecimal(bid["token"], bid["price"])} `}
                                                        <img src={Contracts.Tokens.getToken(bid["token"]).icon} alt="bid token" width="17px" className="mb-1"/>
                                                    </p>
                                                    <hr />
                                                    <strong>NFT ID</strong><p>{bid["eventData"].returnValues.nftId}</p><hr />
                                                    <strong>
                                                        <a href={`https://mumbai.polygonscan.com/tx/${bid["acceptionData"].transactionHash}`} target="_blank" style={{ textDecoration: "none", color: "black" }}>
                                                            📄 Click to see the transaction
                                                        </a>
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Tooltip
                                        anchorId={`accordion${id}`}
                                        html={`<img src=${bid["nftData"].image} width="265px" className="shadow rounded"/>`}
                                        place="top"
                                        style={{
                                            paddingTop: "2px",
                                            paddingBottom: "2px",
                                            paddingLeft: "7px",
                                            paddingRight: "7px",
                                            backgroundColor: "white"
                                        }}
                                    />

                                    <Tooltip
                                        anchorId="endedBid"
                                        content="Click to copy the bid's details"
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
                            (bid["isCanceled"] && !bid["isEnded"]) ? (
                                <>
                                    <button
                                        className="btn btn-danger shadow mt-2"
                                        style={{ borderRadius: "15px", cursor: "help" }}
                                        id="canceledBid"
                                        onClick={() => {
                                            window.navigator.clipboard.writeText(JSON.stringify(bid)).then(() => {
                                                toast.info("Bid full info copied !");
                                            }).catch(() => {
                                                toast.warn("Failed to copy");
                                            });
                                        }}
                                    >Canceled</button>

                                    <div className="accordion my-3" id={`accordion${id}`}>
                                        <div className="accordion-item">
                                            <h2 className="accordion-header" id="headingOne">
                                                <button style={{ color: "black", backgroundColor: "transparent" }} className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target={`#collapseOne${id}`} aria-expanded="false" aria-controls="collapseOne">
                                                    Bid details
                                                </button>
                                            </h2>
                                            <div id={`collapseOne${id}`} className="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent={`#accordion${id}`}>
                                                <div className="accordion-body">
                                                    <strong>NFT contract address</strong><p>{bid["sellOrderData"].contractAddr}</p><hr />
                                                    <strong>Bid Canceled_At</strong><p>{(new Date(bid["bidEndedAt"] * 1000)).toLocaleString()}</p><hr />
                                                    <strong>Seller</strong><p>{bid["sellOrderData"].seller}</p><hr />
                                                    <strong>Bid price</strong>
                                                    <p>
                                                        {`${Contracts.Tokens.removeDecimal(bid["token"], bid["price"])} `}
                                                        <img src={Contracts.Tokens.getToken(bid["token"]).icon} alt="bid token" width="17px" className="mb-1"/>
                                                    </p>
                                                    <hr />
                                                    <strong>NFT ID</strong><p>{bid["eventData"].returnValues.nftId}</p><hr />
                                                    <strong>
                                                        <a href={`https://mumbai.polygonscan.com/tx/${bid["cancelationData"].transactionHash}`} target="_blank" style={{ textDecoration: "none", color: "black" }}>
                                                            📄 Click to see the transaction
                                                        </a>
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <Tooltip
                                        anchorId={`accordion${id}`}
                                        html={`<img src=${bid["nftData"].image} width="265px" className="shadow rounded"/>`}
                                        place="top"
                                        style={{
                                            paddingTop: "2px",
                                            paddingBottom: "2px",
                                            paddingLeft: "7px",
                                            paddingRight: "7px",
                                            backgroundColor: "white"
                                        }}
                                    />

                                    <Tooltip
                                        anchorId="canceledBid"
                                        content="Click to copy the bid's details"
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
                        Bidded At - {(new Date(bid["biddedAt"] * 1000)).toLocaleString()}
                    </div>
                </div>
            </div>
        </>
    );
};

MyBidsChild.propTypes = {
    bid: PropTypes.object
};

export default MyBidsChild;