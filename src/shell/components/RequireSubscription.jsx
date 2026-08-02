// Every tool page wraps its tool component in this component. itdocsy has no
// accounts, subscriptions, or usage limits — every tool is free and
// unlimited for everyone, so this is now just a transparent passthrough.
// Kept as a component (rather than deleting it and editing every tool page)
// so all existing <RequireSubscription toolSlug="..."><Tool /></RequireSubscription>
// call sites keep working unchanged.
export default function RequireSubscription({ children }) {
  return children;
}
