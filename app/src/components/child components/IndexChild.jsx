import PropTypes from "prop-types";
import { toast } from "react-toastify";
import 'react-tooltip/dist/react-tooltip.css';
import { Tooltip } from 'react-tooltip';
import { useEffect, useReducer, useCallback } from "react";
import { Link } from "react-router-dom";

import Contracts from "../../contracts/data";

const tokenReducer = (token, action) => {
    switch(action.type) {
        case "SET":
            return action.payload;
        default:
            return token;    
    };
};

const IndexChild = ({ nftData: sellOrder }) => {
    const [ token, dispatchToken ] = useReducer(tokenReducer, null);

    const getCopyData = useCallback(() => {
        const sellerPrice = Number(sellOrder.price / Math.pow(10 ,token.decimal)).toLocaleString() + " " + token.name;
        const nftImage = sellOrder["nftData"].image;
        const nftContractAddr = sellOrder["contractAddr"];
        const sellOrderOwner = sellOrder.seller;
        const nftId = sellOrder["nftId"];
        const sellOrderId = sellOrder["orderId"];
        const sellOrderCreatedAt = (new Date(sellOrder["startedAt"] * 1000)).toLocaleString();
        const sellOrderCreationTx = sellOrder["eventData"].transactionHash;

        const Data = {
            sellerPrice,
            nftImage,
            nftContractAddr,
            sellOrderOwner,
            nftId,
            sellOrderId,
            sellOrderCreatedAt,
            sellOrderCreationTx
        };

        window.navigator.clipboard.writeText(JSON.stringify(Data)).then(() => {
            toast.info("Sell order's full info copied !");
        }).catch(() => {
            toast.error("Failed to copy !", {
                toastId: "Failed to copy !"
            });
        });
    }, [ token, sellOrder ]);

    useEffect(() => {
        dispatchToken({
            type: "SET",
            payload: Contracts.Tokens.getToken(sellOrder.token)
        });
    }, [ sellOrder ]);

    return (
        <>
            <div className="col-xl-3 col-md-6 col-sm-12 mt-5 ml-5 mb-3">
                <div className="card text-center shadow">
                    <div className="card-header">
                        <p className="card-title">
                            Sell Order "{sellOrder["orderId"]}"
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
                            style={{ cursor: "pointer" }}
                            onClick={getCopyData}
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
                        <Tooltip
                            anchorId={`nftImg${sellOrder["nftId"]}`}
                            content={`Seller - ${sellOrder.seller}`}
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
                            anchorId={`nftImg${sellOrder["nftId"]}`}
                            content={`Seller price - ${token != null ? (Number(sellOrder.price / Math.pow(10 ,token.decimal)).toLocaleString() + " " + token.name) : "loading..."}`}
                            place="top"
                            offset={38}
                            style={{
                                paddingTop: "2px",
                                paddingBottom: "2px",
                                paddingLeft: "7px",
                                paddingRight: "7px",
                                backgroundColor: "black"
                            }}
                        />

                        <Link to={`/bid/${sellOrder["orderId"]}`} className="btn btn-outline-dark rounded shadow mt-4 mb-1 px-5">Create a bid</Link>
                    </div>

                    <div className="card-footer">
                        Creation Time - {(new Date(sellOrder["startedAt"] * 1000)).toLocaleString()}
                    </div>
                </div>
            </div>
        </>
    );
};

IndexChild.propTypes = {
    nftData: PropTypes.object
};

export default IndexChild;