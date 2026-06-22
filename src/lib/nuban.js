const BANK_MAP = [
  { name: "Access Bank", prefix: ["044", "0044", "11"] },
  { name: "GTBank", prefix: ["058", "0058", "22"] },
  { name: "Zenith Bank", prefix: ["057", "0057", "33"] },
  { name: "UBA", prefix: ["033", "0033", "44"] },
  { name: "First Bank", prefix: ["011", "0011", "55"] },
  { name: "Fidelity Bank", prefix: ["070", "0070", "66"] },
  { name: "Union Bank", prefix: ["032", "0032", "77"] },
  { name: "Stanbic IBTC", prefix: ["221", "88"] },
  { name: "Ecobank", prefix: ["050", "0050", "99"] },
  { name: "Sterling Bank", prefix: ["232", "00"] },
  { name: "Polaris Bank", prefix: ["076", "0076", "12"] },
  { name: "FCMB", prefix: ["214", "0214", "13"] },
  { name: "Wema Bank", prefix: ["035", "0035", "14"] },
  { name: "Heritage Bank", prefix: ["030", "0030", "15"] },
  { name: "Keystone Bank", prefix: ["082", "0082", "16"] },
  { name: "Unity Bank", prefix: ["215", "17"] },
];

const FIRST_NAMES = ["Adebayo", "Chukwuemeka", "Fatima", "Ngozi", "Taiwo", "Kemi", "Emeka", "Yetunde", "Musa", "Funmilayo", "Ibrahim", "Chidinma", "Oluwaseun", "Aisha", "Tunde"];
const LAST_NAMES = ["Adeleke", "Okonkwo", "Sule", "Williams", "Afolabi", "Oduya", "Nwosu", "Bello", "Adeyemi", "Eze", "Hassan", "Okafor", "Johnson", "Aliyu", "Adeola"];

function seededRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

export function lookupNuban(accountNumber) {
  if (!accountNumber || accountNumber.length !== 10) return null;

  const first2 = accountNumber.slice(0, 2);
  const first3 = accountNumber.slice(0, 3);

  let bank = null;
  for (const b of BANK_MAP) {
    if (b.prefix.includes(first3) || b.prefix.includes(first2)) {
      bank = b.name;
      break;
    }
  }

  const seed = parseInt(accountNumber, 10) || 12345;
  const rng = seededRng(seed);
  const firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];

  if (!bank) {
    const bankIdx = Math.floor(rng() * BANK_MAP.length);
    bank = BANK_MAP[bankIdx].name;
  }

  return {
    name: `${firstName} ${lastName}`,
    bank,
  };
}
