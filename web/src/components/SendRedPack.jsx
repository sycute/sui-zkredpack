import { TransactionBlock } from "@mysten/sui.js/transactions";
import { Section } from "@radix-ui/themes";
import {
  ConnectButton,
  ConnectModal,
  useSignAndExecuteTransactionBlock,
  useSuiClient,
} from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { decodeSuiPrivateKey } from "@mysten/sui.js/cryptography";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { toB64 } from "@mysten/sui.js/utils";

import { useState } from "react";
import { Tag, message, Spin, InputNumber, Form } from "antd";
import { ExclamationOutlined } from "@ant-design/icons";
import { HTTP_PROVIDER_URL } from "../constants";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Button } from "flowbite-react";
import {coinMap} from "../data"
function SendRedPack() {
  const [hash, setHash] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [coin, setCoin] = useState(1);
  const [quantity, setQuantity] = useState(2);

  const client = useSuiClient();
  const currentAccount = useCurrentAccount();

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

  const onCoinChange = (a) => {
    setCoin(a);
  };

  const onQuantityChange = (a) => {
    setQuantity(a);
  };
  const onTypeChange= (a) => {
    console.log(a.target.value);
  };
  return (
    <>
      <div className="flex flex-col items-center">
        <div className="flex flex-col w-1/3 h-auto p-10 px-10 mx-auto space-y-12 rounded-sm three-d mb-16">
          <div>
            <form action="">
              <div className="nes-select mb-10">
                <select required  onChange={onTypeChange}>
                  {coinMap.map((v)=>{
                    return  <option value={v.value} key={v.value}>{v.label}</option>
                  })}
                </select>
              </div>

              <div className="nes-field">
                <label >Quantity</label>
                <input type="text"  className="nes-input border-4" onChange={onQuantityChange}/>
              </div>

              <div className="nes-field">
                <label>Coin</label>
                <input type="text" className="nes-input border-4" onChange={onCoinChange}/>
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
          <Spin tip="Loading" size="large" style={{ marginTop: 20 }}>
            processing...
          </Spin>
        ) : (
          ""
        )}
      </div>
    </>
  );

  function send() {
    const keypair = new Ed25519Keypair();
    const url_hash = toB64(
      decodeSuiPrivateKey(keypair.getSecretKey()).secretKey
    );

    const txb = new TransactionBlock();
    const [given_coin] = txb.splitCoins(txb.gas, [coin * 1e9]);
    const given_balance = txb.moveCall({
      target: "0x2::coin::into_balance",
      arguments: [txb.object(given_coin)],
      typeArguments: ["0x2::sui::SUI"],
    });
    txb.moveCall({
      arguments: [
        txb.object(zkredpackStoreObjectId),
        txb.object(given_balance),
        txb.pure.u64(quantity),
        txb.pure.address(keypair.toSuiAddress()),
      ],
      target: `${zkRedpackPackageId}::zkredpack::new_redpack`,
      typeArguments: ["0x2::sui::SUI"],
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
  }
}

export default SendRedPack;
