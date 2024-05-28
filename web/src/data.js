export const coinMap = [
  { label: "SUI", value: "0x2::sui::SUI" },
  {
    label: "FUD",
    value:
      "0x76cb819b01abed502bee8a702b4c2d547532c12f25001c9dea795a5e631c26f1::fud::FUD", // mainnet only
  },
  {
    label: "BUCK",
    value:
      "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK", // mainnet only
  },
];

export const coinDecimal = {
  "0x2::sui::SUI": 9,
  "0x76cb819b01abed502bee8a702b4c2d547532c12f25001c9dea795a5e631c26f1::fud::FUD": 5,
  "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK": 9,
};

export const coinTypeMap = {
  "0x2::sui::SUI": "SUI",
  "0x76cb819b01abed502bee8a702b4c2d547532c12f25001c9dea795a5e631c26f1::fud::FUD":
    "FUD",
  "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK":
    "BUCK",
};
