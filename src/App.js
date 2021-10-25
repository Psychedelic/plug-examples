import React, { useEffect, useState } from 'react';
import PlugConnect from '@psychedelic/plug-connect';
import { Principal } from '@dfinity/principal';
import { Actor } from '@dfinity/agent';
import CryptoJS from 'crypto-js';
import crc32 from 'buffer-crc32';
import RandomBigInt from 'random-bigint';

import XtcIDL from './idls/xtc.did';
import ExtIDL from './idls/ext.did';
import './App.css';
import nnsMintingDid from './idls/nns-minting.did';
import BatchTransactions from './BatchTransactions';
import nns_ledgerDid from './idls/nns_ledger.did';

const XTC_CANISTER_ID = 'aanaa-xaaaa-aaaah-aaeiq-cai';
const STARVERSE_CID = 'nbg4r-saaaa-aaaah-qap7a-cai';
const NNS_MINTING_CID = 'rkp4c-7iaaa-aaaaa-aaaca-cai';
const NNS_LEDGER_CID = 'ryjl3-tyaaa-aaaaa-aaaba-cai';
const COINFLIP_CANISTER_ID = '24pmb-qiaaa-aaaah-aannq-cai';

// Dfinity Account separator
export const ACCOUNT_DOMAIN_SEPERATOR = '\x0Aaccount-id';

// Subaccounts are arbitrary 32-byte values.
export const SUB_ACCOUNT_ZERO = Buffer.alloc(32);

const WHITELIST = [XTC_CANISTER_ID, STARVERSE_CID, NNS_MINTING_CID, COINFLIP_CANISTER_ID, NNS_LEDGER_CID];

const CYCLES_PER_TC = 1_000_000_000_000;
const E8S_PER_ICP = 100_000_000;

export const wordToByteArray = (word, length) => {
  const byteArray = [];
  const xFF = 0xff;
  if (length > 0) byteArray.push(word >>> 24);
  if (length > 1) byteArray.push((word >>> 16) & xFF);
  if (length > 2) byteArray.push((word >>> 8) & xFF);
  if (length > 3) byteArray.push(word & xFF);

  return byteArray;
};

export const wordArrayToByteArray = (wordArray, length) => {
  if (
    wordArray.hasOwnProperty('sigBytes') &&
    wordArray.hasOwnProperty('words')
  ) {
    length = wordArray.sigBytes;
    wordArray = wordArray.words;
  }

  let result = [];
  let bytes;
  let i = 0;
  while (length > 0) {
    bytes = wordToByteArray(wordArray[i], Math.min(4, length));
    length -= bytes.length;
    result = [...result, bytes];
    i++;
  }
  return [].concat.apply([], result);
};

export const intToHex = (val) =>
  val < 0 ? (Number(val) >>> 0).toString(16) : Number(val).toString(16);

// We generate a CRC32 checksum, and trnasform it into a hexString
export const generateChecksum = (hash) => {
  const crc = crc32.unsigned(Buffer.from(hash));
  const hex = intToHex(crc);
  return hex.padStart(8, '0');
};


export const byteArrayToWordArray = (byteArray) => {
  const wordArray = [];
  let i;
  for (i = 0; i < byteArray.length; i += 1) {
    wordArray[(i / 4) | 0] |= byteArray[i] << (24 - 8 * i);
  }
  // eslint-disable-next-line
  const result = CryptoJS.lib.WordArray.create(
    wordArray,
    byteArray.length
  );
  return result;
};

export const to32bits = (num) => {
  const b = new ArrayBuffer(4);
  new DataView(b).setUint32(0, num);
  return Array.from(new Uint8Array(b));
};

export const getAccountId = (
  principal,
  subAccount
) => {
  const sha = CryptoJS.algo.SHA224.create();
  sha.update(ACCOUNT_DOMAIN_SEPERATOR); // Internally parsed with UTF-8, like go does
  sha.update(byteArrayToWordArray(principal.toUint8Array()));
  const subBuffer = Buffer.from(SUB_ACCOUNT_ZERO);
  if (subAccount) {
    subBuffer.writeUInt32BE(subAccount);
  }
  sha.update(byteArrayToWordArray(subBuffer));
  const hash = sha.finalize();

  /// While this is backed by an array of length 28, it's canonical representation
  /// is a hex string of length 64. The first 8 characters are the CRC-32 encoded
  /// hash of the following 56 characters of hex. Both, upper and lower case
  /// characters are valid in the input string and can even be mixed.
  /// [ic/rs/rosetta-api/ledger_canister/src/account_identifier.rs]
  const byteArray = wordArrayToByteArray(hash, 28);
  const checksum = generateChecksum(byteArray);
  const val = checksum + hash.toString();

  return val;
};

const getTokenIdentifier = (canister, index) => {
  const padding = Buffer.from('\x0Atid');
  const array = new Uint8Array([
    ...padding,
    ...Principal.fromText(canister).toUint8Array(),
    ...to32bits(index),
  ]);
  return Principal.fromUint8Array(array).toText();
};

function App() {
  const [to, setTo] = useState();
  const [amount, setAmount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [nftIndex, setNFTIndex] = useState(0);
  
  const handleChangeTo = e => setTo(e.target.value);
  const handleChangeAmount = e => setAmount(e.target.value);
  const handleChangeIndex = e => setNFTIndex(e.target.value);

  const safeXTCTransfer = async () => {
    // create an actor to interact with XTC
    const actor = await window.ic.plug.createActor({ canisterId: XTC_CANISTER_ID, interfaceFactory: XtcIDL });
    // request a transfer using this actor
    const response = await actor.transfer({ to: Principal.fromText(to), amount: BigInt(amount*CYCLES_PER_TC), from: [] });
    console.log('response', response);
  }

  const unsafeXTCTransfer = async () => {
    const actor = await Actor.createActor(XtcIDL, {
      agent: window.ic.plug.agent,
      canisterId: XTC_CANISTER_ID,
    });
    const response = await actor.transfer({ to: Principal.fromText(to), amount: BigInt(amount*CYCLES_PER_TC), from: [] });
    console.log('response', response);
  }


  const safeICPTransfer = async () => {
    // create an actor to interact with XTC
    const actor = await window.ic.plug.createActor({ canisterId: NNS_LEDGER_CID, interfaceFactory: nns_ledgerDid });
    // request a transfer using this actor
    const response = await actor.send_dfx({
      to: getAccountId(Principal.from(to)),
      fee: { e8s: BigInt(10000) },
      amount: { e8s: BigInt(amount) },
      memo: RandomBigInt(32),
      from_subaccount: [], // For now, using default subaccount to handle ICP
      created_at_time: [],
    });console.log('response', response);
  }

  const unsafeICPTransfer = async () => {
    const actor = await Actor.createActor(nns_ledgerDid, {
      agent: window.ic.plug.agent,
      canisterId: NNS_LEDGER_CID,
    });
    const response = await actor.send_dfx({
      to: getAccountId(Principal.from(to)),
      fee: { e8s: BigInt(10000) },
      amount: { e8s: BigInt(amount) },
      memo: RandomBigInt(32),
      from_subaccount: [], // For now, using default subaccount to handle ICP
      created_at_time: [],
    });
    console.log('response', response);
  }


  const safeNFTTransfer = async () => {
    // create an actor to interact with XTC
    const actor = await window.ic.plug.createActor({ canisterId: STARVERSE_CID, interfaceFactory: ExtIDL });
    // request a transfer using this actor
    const response = await actor.transfer({
      to: { principal: Principal.from(to) },
      from: { principal: await window.ic.plug.agent.getPrincipal() },
      token: getTokenIdentifier(STARVERSE_CID, nftIndex),
      amount: BigInt(1),
      memo: new Array(32).fill(0),
      notify: false,
      subaccount: [],
    });
    console.log('response', response);
  };

  const unsafeNFTTransfer = async () => {
    // create an actor to interact with XTC
    const actor = await Actor.createActor(ExtIDL, {
      agent: window.ic.plug.agent,
      canisterId: STARVERSE_CID,
    });
    // request a transfer using this actor
    const response = await actor.transfer({
      to: { principal: Principal.from(to) },
      from: { principal: await window.ic.plug.agent.getPrincipal() },
      token: getTokenIdentifier(STARVERSE_CID, nftIndex),
      amount: BigInt(1),
      memo: new Array(32).fill(0),
      notify: false,
      subaccount: [],
    });
    console.log('response', response);
  };

  const safeNFTLock = async () => {
    // create an actor to interact with XTC
    const actor = await window.ic.plug.createActor({ canisterId: STARVERSE_CID, interfaceFactory: ExtIDL });
    // request a transfer using this actor
    const response = await actor.lock(
        getTokenIdentifier(STARVERSE_CID, nftIndex),
        BigInt(1),
        getAccountId(Principal.from(to)),
        []
    );
    console.log('response', response);
  };

  // const unsafeNFTTransfer = async () => {
  //   // create an actor to interact with XTC
  //   const actor = await Actor.createActor(ExtIDL, {
  //     agent: window.ic.plug.agent,
  //     canisterId: STARVERSE_CID,
  //   });
  //   // request a transfer using this actor
  //   const response = await actor.transfer({
  //     to: { principal: Principal.from(to) },
  //     from: { principal: await window.ic.plug.agent.getPrincipal() },
  //     token: getTokenIdentifier(STARVERSE_CID, nftIndex),
  //     amount: BigInt(1),
  //     memo: new Array(32).fill(0),
  //     notify: false,
  //     subaccount: [],
  //   });
  //   console.log('response', response);
  // };


  const safeCanisterCall = async () => {
    const actor = await window.ic.plug.createActor({ canisterId: NNS_MINTING_CID, interfaceFactory: nnsMintingDid });
    // request a transfer using this actor
    const response = await actor.transaction_notification({
      to: Principal.from(to),
      from: await window.ic.plug.agent.getPrincipal(),
      amount:  { e8s: BigInt(amount*E8S_PER_ICP) },
      memo: BigInt(100),
      notify: false,
      to_subaccount: [],
      from_subaccount: [],
      block_height: BigInt(100),
    });
    console.log('response', response);
  }

  const unsafeCanisterCall = async () => {
    const actor = await Actor.createActor(nnsMintingDid, {
      agent: window.ic.plug.agent,
      canisterId: NNS_MINTING_CID,
    });
    // request a transfer using this actor
    const response = await actor.transaction_notification({
      to: Principal.from(to),
      from: await window.ic.plug.agent.getPrincipal(),
      amount:  { e8s: BigInt(amount*E8S_PER_ICP) },
      memo: BigInt(100),
      notify: false,
      to_subaccount: [],
      from_subaccount: [],
      block_height: BigInt(100),
    });
    console.log('response', response);
  }

  return (
    <div className="flex column center">
      <h1>Plug Examples</h1>
      <h2>Security Example</h2>
      <div className="plug-button">
        {connected ? 'Connected to plug' : <PlugConnect dark onConnectCallback={() => setConnected(true)} whitelist={WHITELIST} />}
      </div>
      {connected && (
      <>
        <div className="flex column input-container">
          <label htmlFor="to">Recipient principal</label>
          <input name="to" type="text" onChange={handleChangeTo} value={to} />
        </div>
        <div className="flex column input-container">
          <label htmlFor="to">Amount of XTC</label>
          <input name="to" type="number" onChange={handleChangeAmount} value={amount} />
        </div>
        <div className="flex column input-container">
          <label htmlFor="to">Starverse Index</label>
          <input name="to" type="number" onChange={handleChangeIndex} value={nftIndex} />
        </div>
        <div className="security-actions-container flex column">
          <h3>Safe Calls</h3>
          <button disabled={!to} type="button" onClick={safeXTCTransfer}>{`Transfer ${amount} XTC (${CYCLES_PER_TC * amount} cycles)`}</button>
          <button disabled={!to} type="button" onClick={safeNFTTransfer}>{`Transfer Starverse #${nftIndex}`}</button>
          <button disabled={!to} type="button" onClick={safeNFTLock}>{`Lock Starverse #${nftIndex}`}</button>
          <button disabled={!to} type="button" onClick={safeICPTransfer}>{`Transfer ${amount} e8s`}</button>
          <button disabled={!to} type="button" onClick={safeCanisterCall}>Call NNS Minting Canister</button> 
        </div>
        <div className="security-actions-container">
          <h3>Unsafe Calls</h3>
          <button disabled={!to} type="button" onClick={unsafeXTCTransfer}>{`Transfer 0.000001 XTC (1000 cycles)`}</button>
          <button disabled={!to} type="button" onClick={unsafeICPTransfer}>{`Transfer ${amount} e8s`}</button> 
          <button disabled={!to} type="button" onClick={unsafeNFTTransfer}>Transfer NFT</button>
          <button disabled={!to} type="button" onClick={unsafeCanisterCall}>Call NNS Minting Canister</button> 
        </div>
        <BatchTransactions />
      </>
      )}
      
    </div>
  );
}

export default App;
