export default ({ IDL }) => {
  const SetAuthorizedSubnetworkListArgs = IDL.Record({
    'who' : IDL.Opt(IDL.Principal),
    'subnets' : IDL.Vec(IDL.Principal),
  });
  const ICPTs = IDL.Record({ 'e8s' : IDL.Nat64 });
  const TransactionNotification = IDL.Record({
    'to' : IDL.Principal,
    'to_subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'from' : IDL.Principal,
    'memo' : IDL.Nat64,
    'from_subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'amount' : ICPTs,
    'block_height' : IDL.Nat64,
  });
  const CyclesResponse = IDL.Variant({
    'Refunded' : IDL.Tuple(IDL.Text, IDL.Opt(IDL.Nat64)),
    'CanisterCreated' : IDL.Principal,
    'ToppedUp' : IDL.Null,
  });
  const Result = IDL.Variant({ 'Ok' : CyclesResponse, 'Err' : IDL.Text });
  return IDL.Service({
    'set_authorized_subnetwork_list' : IDL.Func(
        [SetAuthorizedSubnetworkListArgs],
        [],
        [],
      ),
    'transaction_notification' : IDL.Func(
        [TransactionNotification],
        [Result],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };