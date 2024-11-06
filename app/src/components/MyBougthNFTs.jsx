import { useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Navigate } from "react-router-dom";
import ScaleLoader from "react-spinners/ScaleLoader";
import BounceLoader from "react-spinners/BounceLoader"; 
import PacmanLoader from "react-spinners/PacmanLoader";

import Context from "../context/Context";
import Contracts from "../contracts/data";
import MyBougthNFTsChild from "./child components/MyBougthNFTsChild";

const MyBougthNFTs = () => {
    const { userAccount, web3Http } = useContext(Context); 
    
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(false);
    const [ nothingFound, setNothingFound ] = useState(false);
    const [ nfts, setNfts ] = useState(null);

    useEffect(() => {
        const init = async () => {
            try {
                const market = new web3Http.eth.Contract(
                    Contracts.MarketplaceImpV1.abi,
                    Contracts.MarketplaceProxy.address
                );
                // collecting all bought nfts data
                const options = {
                    filter: {
                        buyer: userAccount
                    },
                    fromBlock: Contracts.MarketplaceProxy.blockNumber
                };
                market.getPastEvents("BidAccepted", options, async (err, data) => {
                    if (!err) {
                        if (data.length > 0) {
                            // Then removing the duplicate nfts
                            let info1 = [];
                            for (let val = 0; val < data.length; val++) {
                                const sellOrder = await market.methods.sellOrder(
                                    web3Http.utils.toBN(data[val].returnValues.orderId)
                                ).call({});
    
                                if (info1.length > 0) {
                                    let isValid = true;
    
                                    for (let i = 0; i < info1.length; i++) {
                                        if (
                                            info1[i].contractAddr === sellOrder["contractAddr"] &&
                                            info1[i].nftId === sellOrder["nftId"]
                                        ) {
                                            isValid = false;
                                            break;
                                        };
                                    };
                                        
                                    if (isValid) {
                                        info1.push({
                                            contractAddr: sellOrder["contractAddr"],
                                            nftId: sellOrder["nftId"]
                                        });
                                    };
                                } else {
                                    info1.push({
                                        contractAddr: sellOrder["contractAddr"],
                                        nftId: sellOrder["nftId"]
                                    });
                                };
                            };
                            // removing non-owned nfts
                            let info2 = [];
                            for (let val = 0; val < info1.length; val++) {
                                const nft = new web3Http.eth.Contract(
                                    Contracts.ERC721.abi,
                                    info1[val].contractAddr
                                );
    
                                const response = await nft.methods.ownerOf(info1[val].nftId).call({});
    
                                if (response === userAccount) {
                                    info2.push(info1[val]);
                                };
                            };
                            // adding nft media links
                            if (info2.length > 0) {
                                const info3 = info2.map(async val => {
                                    const nft = new web3Http.eth.Contract(
                                        Contracts.ERC721.abi,
                                        val.contractAddr
                                    );

                                    let response = await nft.methods.tokenURI(web3Http.utils.toBN(val.nftId)).call({});
                            
                                    return response;
                                });
                                const info4 = await Promise.all(info3);
                                        
                                const info5 = info4.map(url => {
                                    let response;
                                            
                                    response = fetch(url).then(res => res.text());
                        
                                    return response;
                                });
                                const info6 = await Promise.all(info5);
                                        
                                const info7 = info6.map(val => JSON.parse(val));
                                const info8 = await Promise.all(info7);
                                        
                                const info9 = info8.map((val, index) => {
                                    val.image = `https://nftstorage.link/ipfs/${String(val.image).slice(7, (val.image).length)}`;
                                    val.tokenId = info2[index].nftId;
                                    val.contractAddr = info2[index].contractAddr;
                                    return val;
                                });
                        
                                setNfts(await Promise.all(info9));
                                setLoading(false);
                            } else {
                                toast.error("Nothing found to show", {
                                    toastId: "Nothing found to show"
                                });
                                setLoading(false);
                                setNothingFound(true);
                            };
                        } else {
                            toast.error("Nothing found to show", {
                                toastId: "Nothing found to show"
                            });
                            setLoading(false);
                            setNothingFound(true);
                        };
                    } else {
                        throw new Error("Failed to load your bougth nfts");
                    };
                });
            } catch {
                toast.error("Failed to load your bougth nfts", {
                    toastId: "Failed to load your bougth nfts"
                });
                setLoading(false);
                setError(true);
            };
        };

        init();
    }, [ userAccount, web3Http ]);

    return (
        <>
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
                 userAccount != null ? (
                    <section>
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
                                            (nfts != null && nfts.length > 0) ? (
                                                nfts.map((nft, index) => (
                                                    <MyBougthNFTsChild
                                                        nftAddress={nft.contractAddr}
                                                        nftName={nft.name}
                                                        nftDesc={nft.description}
                                                        nftImg={nft.image}
                                                        nftId={Number(nft.tokenId)}
                                                        nftMintedTime={nft.time}
                                                        key={index}
                                                    />
                                                ))
                                            ) : (null)
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

export default MyBougthNFTs;