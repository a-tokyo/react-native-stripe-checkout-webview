# React Native Stripe Checkout
React Native implementation for [Stripe.js Checkout](https://stripe.com/payments/checkout).

<a href="https://npmjs.com/package/react-native-stripe-checkout-webview">
  <img src="https://img.shields.io/npm/v/react-native-stripe-checkout-webview.svg"></img>
  <img src="https://img.shields.io/npm/dt/react-native-stripe-checkout-webview.svg"></img>
</a>
<a href="https://codecov.io/gh/A-Tokyo/react-native-stripe-checkout-webview">
  <img src="https://codecov.io/gh/A-Tokyo/react-native-stripe-checkout-webview/branch/main/graph/badge.svg" />
</a>
<a href="https://twitter.com/intent/follow?screen_name=ahmad_tokyo"><img src="https://img.shields.io/twitter/follow/ahmad_tokyo.svg?label=Follow%20@ahmad_tokyo" alt="Follow @ahmad_tokyo"></img></a>


<p align="center">
  <img src="https://i.imgur.com/auF95TW.png" width="340px"></img>
</p>


## Description
The library allows you to use [Stripe.js Checkout](https://stripe.com/payments/checkout) with react-native without ejecting. You can use it with both server-side implementations and client-side implementations. Simply ensure you follow the [url structure guidelines below](#important-notes-about-urls).


## Prequisites
- This library relies on [React Native Webview](https://www.npmjs.com/package/react-native-webview). Please follow [this guide](https://github.com/react-native-community/react-native-webview/blob/HEAD/docs/Getting-Started.md) to install in your project first.


## Installation

- Ensure you've completed the setps in [prequisites.](#prequisites)

- Install package via npm or yarn:

`npm install --save react-native-stripe-checkout-webview` OR `yarn add react-native-stripe-checkout-webview`

- Import in your project

```javascript
import StripeCheckout from 'react-native-stripe-checkout-webview';
```


## Usage
```jsx
import StripeCheckout from 'react-native-stripe-checkout-webview';

type Props = { STRIPE_PUBLIC_KEY: string, CHECKOUT_SESSION_ID: string };

const MyStripeCheckout = ({ STRIPE_PUBLIC_KEY, CHECKOUT_SESSION_ID }: Props) => (
  <StripeCheckout
    stripePublicKey={STRIPE_PUBLIC_KEY}
    checkoutSessionInput={{
      sessionId: CHECKOUT_SESSION_ID,
    }}
    onSuccess={({ checkoutSessionId }) => {
      console.log(`Stripe checkout session succeeded. session id: ${checkoutSessionId}.`);
    }}
    onCancel={() => {
      console.log(`Stripe checkout session cancelled.`);
    }}
  />
);

export default MyStripeCheckout;
```


## Important Notes about URLs

- successUrl must have the query string params `?sc_checkout=success&sc_sid={CHECKOUT_SESSION_ID}`
  - sc_sid is optional - must be the last param - when passed results in sessionId being passed to the onSuccess function
- cancelUrl must have the query string params `?sc_checkout=cancel`
- A simple way to do this is using [url-join](https://www.npmjs.com/package/url-join). eg: `urlJoin(mySuccessUrl, '?sc_checkout=success&sc_sid={CHECKOUT_SESSION_ID}')`.


## Component props

- `stripePublicKey` (String) - Stripe public key of your project.
- `checkoutSessionInput` (Object) - Object to be passed to Stripe's `redirectToCheckout` function. [Docs](https://stripe.com/docs/js/checkout/redirect_to_checkout).
  - ```js
    // Server-side Checkout Session flow
    {
      sessionId: string,
      // optional client-side locale hint - see "A note on locale" below
      locale?: string,
    }
    // Client-only flow
    | {
        clientReferenceId: string,
        successUrl: string,
        cancelUrl: string,
        items?: Array<{ plan: string, quantity: string }>,
        lineItems?: Array<{ price: number, quantity: number }>,
        mode?: 'payment' | 'subscription',
        submitType?: string,
        // common
        customerEmail?: string,
        billingAddressCollection?: 'required' | 'auto',
        shippingAddressCollection?: {
          allowedCountries: Array<string>,
        },
        locale?: string,
      }
    ```
  - **When using `sessionId`, only `sessionId` is forwarded to Stripe's `redirectToCheckout`.** Stripe.js rejects the call if any other field (`successUrl`, `cancelUrl`, `locale`, ...) is passed alongside `sessionId`, which would prevent Checkout from loading. Configure those options when you create the Checkout Session server-side instead.
- `onSuccess` (?Function) - Called upon success of the checkout session with `{ ...props, checkoutSessionId: 'CHECKOUT_SESSION_ID' }`
- `onCancel` (?Function) - Called upon cancellation of the checkout session with `{ ...props }`
- `onLoadingComplete` (?Function) - Called when the Stripe checkout session webpage loads successfully.
- `options` (?Object) - custom options to display content in the webview
  - `htmlContentLoading` (String) - Html string to display a loading indication. - default: `<h1 id="sc-loading">Loading...</h1>` - note: The loading item is set on the element with id='sc-loading'
  - `htmlContentError` (String) - Html string to display stripe errors. - default: `<div id="sc-error-message"></div>` - note: The error is set on the element with id='sc-error-message'
  - `htmlContentHead` (String) - Html string to inject in head. - default: ''
- `webViewProps` (?Object) - WebView Component props, spread on the WebView Component.
- `renderOnComplete` (?(props) => React$Node) - Optional rendering function returning a component to display upon checkout completion. note: You don't need this if your onSuccess and onCancel functions navigate away from the component.


## A note on locale
- **Client-only flow** (`lineItems`/`items`): pass `locale` directly in `checkoutSessionInput` - it is forwarded to `redirectToCheckout`.
- **Server-side Checkout Session flow** (`sessionId`): the displayed language is determined by the `locale` you set when **creating the Checkout Session server-side** - this is the authoritative source. Stripe.js does not accept `locale` alongside `sessionId`, so it is not forwarded to `redirectToCheckout` (doing so would prevent Checkout from loading). As a convenience, a `locale` passed in `checkoutSessionInput` is still applied as a client-side hint via the Stripe.js constructor (`Stripe(key, { locale })`), which localizes error strings.


## Avoiding a 404 on success / cancel
- The library intercepts the `successUrl`/`cancelUrl` redirect via the WebView's `onShouldStartLoadWithRequest` and **prevents the WebView from navigating to it**, then calls `onSuccess`/`onCancel`. This means your `successUrl`/`cancelUrl` can be a placeholder that does not resolve to a real page - the WebView will never render its (potentially 404) content. Just make sure the URLs follow the [structure above](#important-notes-about-urls).


## Apple Pay and Google Pay
- This library uses [react-native-webview](https://github.com/react-native-webview) under the hood to render the Stripe Checkout webpage. To get Apple Pay and Google Pay to work we need to pass the context to the browser, [here's how to get it working](https://github.com/react-native-webview/react-native-webview/issues/920#issuecomment-720305564):
  - What causes the issue is an injected script by default on webview start named html5HistoryAPIShimSource
How to fix (Note that the fix doesn't fully work on expo, but workarounds can be found in the issue thread):
    - Comment this line in /node_modules/react-native-webview/apple/RNCWebView.m like shown below (in v10.9.2 line number is 1270.)
    ```
    WKUserScript *script = [[WKUserScript alloc] initWithSource:html5HistoryAPIShimSource injectionTime:WKUserScriptInjectionTimeAtDocumentStart
    forMainFrameOnly:YES];
    // [wkWebViewConfig.userContentController addUserScript:script]; // this line that inject "html5HistoryAPIShimSource" on start
    ```
    - You can use [patch-package](https://www.npmjs.com/package/patch-package) to easily persist this change

## Contributing
Pull requests are highly appreciated! For major changes, please open an issue first to discuss what you would like to change.

### Related Projects
- Stripe's identity verification for react native: [react-native-stripe-identity](https://github.com/A-Tokyo/react-native-stripe-identity)

### Roadmap
- Add eslint
- Config prettier
- Add typescript

