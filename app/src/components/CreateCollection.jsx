import { useState, useContext, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

import Context from "../context/Context";
import Contracts from "../contracts/data";

const CreateCollection = ({ send, state }) => {
    const { userAccount, web3Ws } = useContext(Context);

    const navigate = useNavigate();

    const [ name, setName ] = useState(null);
    const [ symbol, setSymbol ] = useState(null);
    const [ desc, setDesc ] = useState(null);

    useEffect(() => {
        if (userAccount != null) {
            const market = new web3Ws.eth.Contract(
                Contracts.MarketplaceImpV1.abi,
                Contracts.MarketplaceProxy.address
            );
    
            const options = {
                filter: {
                    creator: userAccount
                },
                fromBlock: Contracts.MarketplaceProxy.blockNumber
            };
            market.events.NFTContractCreated(options, (err, data) => {
                if (!err) {
                    navigate("/");
                };
            });
        };
    }, [ userAccount, web3Ws, navigate ]);

    return (
        <>
            {
                (!state && userAccount != null) ? (
                    <section>
                        <div className="container-fluid">
                            <div className="row">
                                <div className="col-6 mx-auto mt-5">
                                    <div className="card">
                                        <div className="card-header text-center">
                                            Create Collection
                                        </div>
        
                                        <div className="card-body">
                                            <form>
                                                <input type="text" onChange={e => {
                                                    setName(
                                                        e.target.value
                                                    );
                                                }} className="form-control mb-3" placeholder="Enter collection's name"/>
                                                <input type="text" onChange={e => {
                                                    setSymbol(
                                                        e.target.value
                                                    );
                                                }} className="form-control mb-3" placeholder="Enter collection's symbol"/>
                                                <textarea onChange={e => {
                                                    setDesc(
                                                        e.target.value
                                                    );
                                                }} className="form-control mb-4" style={{ height: "120px" }} placeholder="Enter collection's description"></textarea>
        
                                                <p className="form-control btn btn-primary btn-block" onClick={async () => {
                                                    await send(
                                                        name,
                                                        symbol,
                                                        desc
                                                    );
                                                }}>Create</p>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                ) : (
                    <Navigate to="/marketplace"/>
                )
            }
        </>
    );
};

CreateCollection.propTypes = {
    send: PropTypes.func,
    state: PropTypes.bool
};

export default CreateCollection;