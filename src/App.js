import React, { useEffect, useState } from 'react';
import PlugConnect from '@psychedelic/plug-connect';
import { Principal } from '@dfinity/principal';
import { Actor } from '@dfinity/agent';

import XtcIDL from './idls/xtc.did';
import ExtIDL from './idls/ext.did';
import './App.css';
import nnsMintingDid from './idls/nns-minting.did';

const XTC_CANISTER_ID = 'aanaa-xaaaa-aaaah-aaeiq-cai';
const STARVERSE_CID = 'nbg4r-saaaa-aaaah-qap7a-cai';
const NNS_MINTING_CID = 'rkp4c-7iaaa-aaaaa-aaaca-cai';
const CYCLES_PER_TC = 1_000_000_000_000;
const E8S_PER_ICP = 100_000_000;

export const to32bits = (num) => {
  const b = new ArrayBuffer(4);
  new DataView(b).setUint32(0, num);
  return Array.from(new Uint8Array(b));
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
        {connected ? 'Connected to plug' : <PlugConnect dark onConnectCallback={() => setConnected(true)} whitelist={[XTC_CANISTER_ID, STARVERSE_CID, NNS_MINTING_CID]} />}
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
          <button disabled={!to} type="button" onClick={safeCanisterCall}>Call NNS Minting Canister</button> 
        </div>
        <div className="security-actions-container">
          <h3>Unsafe Calls</h3>
          <button disabled={!to} type="button" onClick={unsafeXTCTransfer}>{`Transfer 0.000001 XTC (1000 cycles)`}</button>
          <button disabled={!to} type="button" onClick={unsafeNFTTransfer}>Transfer NFT</button>
          <button disabled={!to} type="button" onClick={unsafeCanisterCall}>Call NNS Minting Canister</button> 
        </div>
      </>
      )}
      
    </div>
  );
}

export default App;
