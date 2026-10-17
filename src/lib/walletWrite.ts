import {
  encodeFunctionData,
  getAddress,
  numberToHex,
  type Abi,
  type Address,
  type ContractFunctionArgs,
  type ContractFunctionName,
  type Hex,
} from "viem";
import type { Config, Connector } from "wagmi";
import { getConnectorClient } from "wagmi/actions";
import { ensureBitcoinAccount, WalletNotConnectedError } from "@/lib/bitcoinWallet";
import { MEZO_TESTNET } from "@/lib/mezo";

type AccountLike = { address?: string };
type Tx = { to: Address; data: Hex; value?: bigint; chain?: { id: number } | null };

type Writer = {
  account?: AccountLike | string;
  chain?: { id: number } | null;
  sendTransaction?: (args: Tx) => Promise<Hex>;
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function accountAddress(account: Writer["account"]): Address | undefined {
  if (typeof account === "string" && account.startsWith("0x")) return getAddress(account);
  if (account && typeof account === "object" && typeof account.address === "string") return getAddress(account.address);
  return undefined;
}

/**
 * A raw address string is a JSON-RPC account, so viem sends eth_sendTransaction
 * to the public HTTP node. OrangeKit replaces sendTransaction with the Bitcoin
 * signature path. Other connectors sign through the provider request.
 */
export async function deliverContractWrite(client: Writer, request: { to: Address; data: Hex; value?: bigint }): Promise<Hex> {
  const chain = client.chain?.id === MEZO_TESTNET.chainId ? client.chain : { id: MEZO_TESTNET.chainId };
  if (typeof client.sendTransaction === "function") {
    return client.sendTransaction({ to: request.to, data: request.data, value: request.value, chain });
  }
  const from = accountAddress(client.account);
  if (!from || typeof client.request !== "function") throw new WalletNotConnectedError();
  const rpc: Record<string, string> = {
    from,
    to: request.to,
    data: request.data,
    chainId: numberToHex(MEZO_TESTNET.chainId),
  };
  if (request.value != null) rpc.value = numberToHex(request.value);
  const hash = await client.request({ method: "eth_sendTransaction", params: [rpc] });
  if (typeof hash !== "string" || !hash.startsWith("0x")) throw new Error("Wallet did not return a transaction hash");
  return hash as Hex;
}

export async function sendContractWrite<
  const abi extends Abi | readonly unknown[],
  functionName extends ContractFunctionName<abi, "nonpayable" | "payable">,
>(
  config: Config,
  connector: Connector | undefined,
  address: Address | undefined,
  request: {
    address: Address;
    abi: abi;
    functionName: functionName;
    args?: ContractFunctionArgs<abi, "nonpayable" | "payable", functionName>;
    value?: bigint;
  },
): Promise<Hex> {
  if (!address) throw new WalletNotConnectedError();
  await ensureBitcoinAccount(connector);
  const client = await getConnectorClient(config, {
    chainId: MEZO_TESTNET.chainId,
    connector,
  });
  const data = encodeFunctionData({
    abi: request.abi,
    functionName: request.functionName,
    args: request.args,
  } as never);
  return deliverContractWrite(client as Writer, { to: request.address, data, value: request.value });
}
