import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import 'react-tooltip/dist/react-tooltip.css';
import { Tooltip } from 'react-tooltip';
import { toast } from "react-toastify";

import Context from "../context/Context";
import Contracts from "../contracts/data";

const Navbar = ({ connect, state, connecting }) => {
    const { web3, userAccount, web3Http } = useContext(Context);

    const [ btc, setBtc ] = useState(null);
    const [ eth, setEth ] = useState(null);
    const [ matic, setMatic ] = useState(null);

    useEffect(() => {
        const init = async () => {
            try {
                const market = new web3Http.eth.Contract(
                    Contracts.DataFeeder.abi,
                    Contracts.DataFeeder.address
                );

                const price_btc = await market.methods.btcPrice().call({});
                const price_eth = await market.methods.ethPrice().call({});
                const price_matic = await market.methods.maticPrice().call({});

                const btc = Number(Number(price_btc[0] / Math.pow(10, price_btc[1])).toFixed(2)).toLocaleString();
                const ether = Number(Number(price_eth[0] / Math.pow(10, price_eth[1])).toFixed(2)).toLocaleString();
                const matic = Number(Number(price_matic[0] / Math.pow(10, price_matic[1])).toFixed(3)).toLocaleString();

                setBtc(btc);
                setEth(ether);
                setMatic(matic);
            } catch {
                toast.warn("Failed to fetch market data feeds", {
                    toastId: "Failed to fetch market data feeds"
                });
            };
        };

        init();
    }, [ web3Http ]);

    return (
        <nav>
            <header className="mb-3">
                <div className="container-fluid">
                    <nav className="navbar navbar-expand-lg navbar-light bg-light">
                        <Link to="/" className="navbar-brand">
                            <img src="https://etherscan.io/images/svg/brands/ethereum-original.svg" width="38" height="38" alt="Ethereum" title="Ethereum NFT Marketplace"/>
                        </Link>

                        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar">
                            <span className="navbar-toggler-icon"></span>
                        </button>

                        <Link to="/" className="navbar-brand">Ethereum NFT Marketplace</Link>

                        <div className="collapse navbar-collapse" id="navbar">
                            <ul className="navbar-nav me-auto">

                                <div className="dropdown text-light smal">
                                    <span className="btn dropdown-toggle" data-bs-toggle="dropdown">
                                        Market prices
                                    </span>
                                    <div className="dropdown-menu text-left">
                                        {
                                            (btc != null && eth != null && matic != null) ? (
                                                <>
                                                    <span className="dropdown-item">BTC - {btc} $</span>
                                                    <span className="dropdown-item">ETH - {eth} $</span>
                                                    <span className="dropdown-item">MATIC - {matic} $</span>
                                                </>
                                            ) : (
                                                <span className="dropdown-item">Loading... 🕐</span>
                                            )
                                        }
                                    </div>
                                </div>

                                <li className="nav-item">
                                    <Link to="/SearchSellOrder" className="nav-link">
                                        search sell-order
                                    </Link>
                                </li> 
                               
                            </ul>
                            
                            <div className="d-flex">
                                {
                                    userAccount != null ? (
                                        <div className="dropdown text-light small me-2">
                                            <span className="btn btn-dark dropdown-toggle" data-bs-toggle="dropdown">
                                                My Profile
                                            </span>
                                            <div className="dropdown-menu text-left">
                                                {
                                                    !state ? (
                                                        <Link to="/createCollection" className="dropdown-item">Create collection</Link>
                                                    ) : (null)
                                                }
                                                {
                                                    state ? (
                                                        <>
                                                            <Link to="/mintNft" className="dropdown-item">Mint NFT</Link>
                                                            <Link to="/collectionsNFTs" className="dropdown-item">
                                                                My Collection's NFTs
                                                            </Link>
                                                            <Link to="/" className="dropdown-item">My Collection Details</Link>
                                                        </>
                                                    ) : (null)
                                                }
                                                <Link to="/faucet" className="dropdown-item">Faucet</Link>
                                                <Link to="/myBids" className="dropdown-item">My Bids</Link>
                                                <Link to="/mySellOrders" className="dropdown-item">My Sell-Orders</Link>
                                                <Link to="/myBougthNfts" className="dropdown-item">Bought NFTs</Link>
                                                <Link to="/myReceivedNfts" className="dropdown-item">Received NFTs</Link>
                                            </div>
                                        </div>
                                    ) : (null)
                                }

                                <div>
                                    {
                                        userAccount == null ? (
                                            !connecting ? (
                                                <button className="btn btn-dark small" onClick={connect}>Connect</button> 
                                            ) : (
                                                <button className="btn btn-secondary small">Connecting.....</button> 
                                            )
                                        ) : (
                                            <>
                                                <button id="conBtn" className="btn btn-outline-dark small" style={{fontWeight: "490"}} onMouseOver={(e) => {
                                                const addr = String(userAccount);
                                                
                                                const p1 = addr.slice(0, 5);
                                                const p2 = addr.slice(38, 42);
                                                const p3 = `${p1}......${p2}`;

                                                e.target.innerText = p3;
                                                }} onMouseOut={(e) => {
                                                e.target.innerText = "Connected";
                                                }}>Connected</button>

                                                <Tooltip
                                                    anchorId="conBtn"
                                                    content={web3.utils.toChecksumAddress(userAccount)}
                                                    place="bottom"
                                                    style={{
                                                        paddingTop: "2px",
                                                        paddingBottom: "2px",
                                                        paddingLeft: "7px",
                                                        paddingRight: "7px",
                                                        backgroundColor: "black"
                                                    }}
                                                />
                                            </>
                                        )
                                    }
                                </div>
                            </div>
                        </div>
                    </nav>
                </div>
            </header>

            <ToastContainer
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                draggable
                pauseOnHover
                theme="colored"
            />
        </nav>
    );
};

Navbar.propTypes = {
    connect: PropTypes.func,
    state: PropTypes.bool,
    connecting: PropTypes.bool
};

export default Navbar;
