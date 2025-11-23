
// /// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUBGRAPH_URL: string;
  readonly VITE_CONTRACT_MARKETPLACE: string;
  readonly VITE_CONTRACT_DMT: string;
  readonly VITE_CONTRACT_USDC: string;
  readonly VITE_CONTRACT_USDT: string;
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
