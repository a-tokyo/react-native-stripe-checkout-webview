# React Native Stripe Checkout

React Native implementation for [Stripe.js Checkout](https://stripe.com/payments/checkout).

<a href="https://npmjs.com/package/react-native-stripe-checkout-webview">
  <img src="https://img.shields.io/npm/v/react-native-stripe-checkout-webview.svg"></img>
  <img src="https://img.shields.io/npm/dt/react-native-stripe-checkout-webview.svg"></img>
</a>
<a href="https://twitter.com/intent/follow?screen_name=ahmad_tokyo"><img src="https://img.shields.io/twitter/follow/ahmad_tokyo.svg?label=Follow%20@ahmad_tokyo" alt="Follow @ahmad_tokyo"></img></a>

![](https://i.imgur.com/KL7mfZ8.png)

```jsx
import StripeCheckout from 'react-native-stripe-checkout-webview';

const stripeCheckoutComponentProps: {
  stripePublicKey: 'STRIPE_PUBLIC_KEY',
  checkoutSessionInput: {
    sessionId: CHECKOUT_SESSION_ID,
  },
  // Session succeeded
  onSuccess: ({ checkoutSessionId }) => {
    console.log(`Stripe checkout session succeeded. session id: ${checkoutSessionId}.`);
  },
  // Session cancelled
  onCancel: () => {
    console.log(`Stripe checkout session cancelled.`);
  },
};

return (
  <StripeCheckout
    stripePublicKey={config.STRIPE_PUBLIC_KEY}
    {...stripeCheckoutComponentProps}
  />
)
```

## Description
The library allows you to use [Stripe.js Checkout](https://stripe.com/payments/checkout) with react-native without ejecting. You can use it with both server-side implementations and client-side implementations. Simply ensure you follow the [url structure guidelines below](#important-notes-about-urls).

## Prequisites
- This library relies on [React Native Webview](https://www.npmjs.com/package/react-native-webview). Please follow [this guide](https://github.com/react-native-community/react-native-webview/blob/HEAD/docs/Getting-Started.md) to install in your project first.

## Installation

1. Ensure you've completed the setps in [prequisites.](#prequisites)

1. Install package via npm or yarn:

`npm install --save react-native-stripe-checkout-webview` OR `yarn add react-native-stripe-checkout-webview`

1. Import in your project

```javascript
import StripeCheckout from 'react-native-stripe-checkout-webview';
```

## Important Notes about URLs
- successUrl must have the query string params `?sc_checkout=success&sc_sid={CHECKOUT_SESSION_ID}`
  - sc_sid is optional - must be the last param - when passed results in sessionId being passed to the onSuccess function
- cancelUrl must have the query string params `?sc_checkout=cancel`
- A simple way to do this is using [url-join](https://www.npmjs.com/package/url-join). eg: `urlJoin(mySuccessUrl, '?sc_checkout=success&sc_sid={CHECKOUT_SESSION_ID}')`.

## Component props

- `stripePublicKey` (String) - Stripe public key of your project.
- `checkoutSessionInput` (Object) - Object to be passed to Stripe's `redirectToCheckout` function. [Docs](https://stripe.com/docs/js/checkout/redirect_to_checkout).
- `onSuccess` (?Function) - Called upon success of the checkout session with `{ ...props, checkoutSessionId: 'CHECKOUT_SESSION_ID' }`
- `onCancel` (?Function) - Called upon success of the checkout session with `{ ...props }`
- `options` (?Object) - custom options to display content in the webview
  - `htmlContentLoading` (String) - Html string to display a loading indication. - default: `<h1 id="sc-loading">Loading...</h1>` - note: The loading item is set on the element with id='sc-loading'
  - `htmlContentError` (String) - Html string to display stripe errors. - default: `<div id="sc-error-message"></div>` - note: The error is set on the element with id='sc-error-message'
- `webViewProps` (?Object) - WebView Component props, spread on the WebView Component.
- `renderOnComplete` (?(props) => React$Node) - Optional rendering function returning a component to display upon checkout completion. note: You don't need this if your onSuccess and onCancel functions navigate away from the component.

## Contributing
Pull requests are highly appreciated! For major changes, please open an issue first to discuss what you would like to change.

### Roadmap
- Add eslint
- Config prettier
- Add typescript
- Add jest unit + snapshot tests
