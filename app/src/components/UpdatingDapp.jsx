import ClockLoader from "react-spinners/ClockLoader";
import { useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";

const UpdatingDapp = () => {
    useEffect(() => {
        toast.info("Updating Marketplace. Will we finish as soon as possible", {
            toastId: "Updating Marketplace"
        });
    }, []);

    return (
        <section>
            <div className="container-fluid">
                <div className="row">
                    <div className="col-1 text-center mx-auto" style={{ marginTop: "21%" }}>
                        <ClockLoader
                            color="#2764b3"
                            size={70}
                            speedMultiplier={2}
                        />
                    </div>
                </div>
            </div>

            <ToastContainer
                position="bottom-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                draggable
                pauseOnHover
                theme="colored"
            />
        </section>
    );
};

export default UpdatingDapp;