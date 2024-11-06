const Error = ({ error }) => {
    return (
        <section>
            <div className="container-fluid">
                <div className="row">
                    <div className="col-8 text-center mx-auto">
                        {
                            error === "wallet" ? (
                                <div className="alert alert-warning mt-5">
                                    Please download and install MetaMask wallet. <a href="https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en-US" target="_blank">MetaMask</a>
                                </div>
                            ) : (
                                <div className="alert alert-danger mt-5">
                                    MetaMask is not connected to the blockchain.
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Error;