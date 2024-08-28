import { useEffect, useState } from "react";

export const useCoinBalances = (
    suiClient,
    currAcct,
) => {
    // <CoinBalance[]>
    const [userBalances, setUserBalances] = useState();
    const [error, setError] = useState();

    useEffect(() => {
        const loadUserBalances = async () => {
            setUserBalances(undefined);
            setError(undefined);
            if (!currAcct) {
                return;
            }
            try {
                const balances = await suiClient.getAllBalances({ owner: currAcct.address });
                const nonZeroBalances = balances.filter(bal => BigInt(bal.totalBalance) > 0n);
                setUserBalances(nonZeroBalances);
            } catch (err) {
                setError(`[useCoinBalances] Failed to load user balances: ${String(err)}`);
            }
        };
        loadUserBalances();
    }, [currAcct, suiClient]);

    return { userBalances, error };
};
