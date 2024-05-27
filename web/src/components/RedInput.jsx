import { InputNumber, Form, Card } from "antd";
import { useState } from "react";
export default function RedInput() {
  const [coin, setCoin] = useState(1);
  const [quantity, setQuantity] = useState(2);

  const onCoinChange = (a) => {
    setCoin(a);
  };

  const onQuantityChange = (a) => {
    setQuantity(a);
  };
  return (
    <>
      <Card className="border-b-4 border-r-4">
        <Form
          layout="horizontal"
          style={{ maxWidth: 600, minWidth: 400 }}
          labelCol={{ style: { width: "100px" } }}
          wrapperCol={{ span: 16 }}
        >
          <Form.Item label="Sui">
            <InputNumber
              style={{ width: "100%" }}
              defaultValue={1}
              onChange={onCoinChange}
            />
          </Form.Item>
          <Form.Item label="Quantity">
            <InputNumber
              style={{ width: "100%" }}
              defaultValue={2}
              onChange={onQuantityChange}
            />
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
