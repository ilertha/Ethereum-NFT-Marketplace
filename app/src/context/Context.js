import { createContext } from "react";

const Context = createContext({
    ethereum: null,
    web3: null,
    web3Http: null,
    web3Ws: null,
    userAccount: null,
    txValidator: null,
    callValidator: null
});

export default Context;