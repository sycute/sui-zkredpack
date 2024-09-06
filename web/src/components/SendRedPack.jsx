import { TransactionBlock } from "@mysten/sui.js/transactions";
import { Section } from "@radix-ui/themes";
import {
  ConnectModal,
  useSignAndExecuteTransactionBlock,
  useSuiClient,
} from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { decodeSuiPrivateKey } from "@mysten/sui.js/cryptography";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { toB64 } from "@mysten/sui.js/utils";

import { useEffect, useState } from "react";
import { Tag, message, Spin } from "antd";
import { ExclamationOutlined } from "@ant-design/icons";
import { HTTP_PROVIDER_URL } from "../constants";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Button } from "flowbite-react";
import { useCoinBalances } from "../lib/useUserBalance";

function SendRedPack() {
  const [hash, setHash] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [userBalances,setUserBalances]=useState([])
  const [quantity, setQuantity] = useState(2); // number of red packets

  const [amount, setAmount] = useState(1); // number of coin
  const [coinType, setCoinType] = useState("");

  const client = useSuiClient();

  const currentAccount = useCurrentAccount();

  const res = useCoinBalances(client, currentAccount);

 useEffect(()=>{
  setUserBalances(res.userBalances)
  console.log(userBalances);
  if(userBalances?.length>0){
    setCoinType(userBalances[0].coinType)
  }
 },[client,currentAccount,res])

  const zkRedpackPackageId = useNetworkVariable("zkRedpackPackageId");
  const zkredpackStoreObjectId = useNetworkVariable(
    "testnetRedpackStoreObjectId"
  );
  const { mutate: signAndExecute } = useSignAndExecuteTransactionBlock();
  const showTag = hash ? (
    <Tag color="#2db7f5" className="text-lg">
      {" "}
      {HTTP_PROVIDER_URL + "claim#" + hash}{" "}
    </Tag>
  ) : (
    ""
  );
  const showTips = hash ? (
    <div>
      {" "}
      <ExclamationOutlined />
      {"Copy The Link & Share to Claimers!"}
    </div>
  ) : (
    ""
  );

  const handleButtonClicked = () => {
    setIsLoading(true);
    send();
  };

  const handleConnectModal = () => {
    setOpen(true);
  };

  const onAmountChange = (a) => {
    let coin = userBalances.find((i) => i.coinType == coinType);

    let balance = coin?.totalBalance || 0;

    if (balance < a.target.value) {
      message.error("账户余额不足，交易可能会失败！");
    }
    setAmount(a.target.value);
  };

  const onQuantityChange = (a) => {
    setQuantity(a.target.value);
  };

  const onTypeChange = (e) => {
    setCoinType(e.target.value);
  };

  const send = async () => {

    const coinList = await client.getCoins({
      owner: currentAccount?.address,
      coinType: coinType,
    });

    console.log(coinList.data);

    let idList = coinList.data.map((i) => {
      return i.coinObjectId;
    });

    const { decimals } = await client.getCoinMetadata({ coinType });

    
    let txb = new TransactionBlock();

    let given_coin;
    if (coinType != "0x2::sui::SUI" && idList.length > 1) {
      // 合并所有coin对象
      for (let i = 1; i < idList.length; i++) {
        txb.moveCall({
          target: "0x2::coin::join",
          arguments: [txb.object(idList[0]), txb.object(idList[i])],
          typeArguments: [coinType],
        });
      }

      given_coin = txb.moveCall({
        target: "0x2::coin::split",
        arguments: [txb.object(idList[0]), txb.pure(amount * 10 ** decimals)],
        typeArguments: [coinType],
      })
    } else {
      [given_coin] = txb.splitCoins(idList[0], [amount * 10 ** decimals]);
    }
    
    const keypair = new Ed25519Keypair();
    let url_hash = toB64(decodeSuiPrivateKey(keypair.getSecretKey()).secretKey)+ "&&" + coinType ;
    
    const given_balance = txb.moveCall({
      target: "0x2::coin::into_balance",
      arguments: [txb.object(given_coin)],
      typeArguments: [coinType],
    });

    txb.moveCall({
      arguments: [
        txb.object(zkredpackStoreObjectId),
        txb.object(given_balance),
        txb.pure.u64(quantity),
        txb.pure.address(keypair.toSuiAddress()),
      ],
      target: `${zkRedpackPackageId}::zkredpack::new_redpack`,
      typeArguments: [coinType],
    });

    signAndExecute(
      {
        transactionBlock: txb,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      },
      {
        onSuccess: (tx) => {
          client.waitForTransactionBlock({ digest: tx.digest }).then(() => {
            setHash(url_hash);
            setIsLoading(false);
            message.success("now copy the generated link.");
          });
        },
        onError: (error) => {
          setIsLoading(false);
          message.warning(error.message);
        },
      }
    );
  };

  return (
    <>
      <div className="flex flex-col items-center">
        <div className="flex flex-col w-1/3 h-auto p-10 px-10 mx-auto space-y-12 rounded-sm three-d mb-12">
          <div>
            <form action="">
              <div className="nes-select mb-10">
                <select
                  required
                  onChange={onTypeChange}
                  defaultValue={"0x2::sui::SUI"}
                >
                  {userBalances?.map((v) => {
                    let coinName = v.coinType.split("::").reverse()[0];
                    return (
                      <option value={v.coinType} key={v.coinType}>
                        {coinName}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="nes-field">
                <label>Quantity</label>
                <input
                  type="number"
                  className="nes-input border-4"
                  onChange={onQuantityChange}
                  defaultValue={2}
                />
              </div>

              <div className="nes-field">
                <label>Amount</label>
                <input
                  type="number"
                  className="nes-input border-4"
                  onChange={onAmountChange}
                  defaultValue={1}
                />
              </div>
            </form>
          </div>
          <Button
            isProcessing={isLoading}
            size={"md"}
            color={"gray"}
            onClick={() => {
              currentAccount && currentAccount.address
                ? handleButtonClicked()
                : handleConnectModal();
            }}
            className="hover:bg-red-500 hover:text-white border-4"
          >
            {currentAccount && currentAccount.address
              ? "Generate a Redpack"
              : "Connect Wallet"}
          </Button>
          <ConnectModal
            open={open}
            onOpenChange={(isOpen) => setOpen(isOpen)}
          />
        </div>
        <Section size="1">
          {showTag}
          {showTips}
        </Section>
        {isLoading ? (
          <Spin tip="Loading" size="default">
            processing...
          </Spin>
        ) : (
          ""
        )}
      </div>
    </>
  );
}

export default SendRedPack;
