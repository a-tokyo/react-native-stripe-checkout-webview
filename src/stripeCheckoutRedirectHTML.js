/* @flow */

/**
 * Generates HTML content that redirects to a Stripe checkout session
 */
const stripeCheckoutRedirectHTML = (
  stripe_public_key: string,
  input:
    | {
        /**
         * Server-side Checkout Session flow.
         * Only `sessionId` is forwarded to `stripe.redirectToCheckout`.
         * Everything else (`successUrl`, `cancelUrl`, `locale`, ...) must be
         * configured when creating the Checkout Session server-side.
         * `locale`, if provided, is additionally used as a client-side hint via
         * the Stripe.js constructor.
         */
        sessionId: string,
        locale?: string,
      }
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
      },
  options?: {
    /** The loading item is set on the element with id='sc-loading' */
    htmlContentLoading?: string,
    /** The error is set on the element with id='sc-error-message' */
    htmlContentError?: string,
    /** The extra HTML content to be placed in the HEAD */
    htmlContentHead?: string,
  },
): string => {
  if (!stripe_public_key) {
    throw new Error('Must provide Stripe public key.');
  }
  if (!input) {
    throw new Error('Must provide redirectToCheckout function input.');
  }

  /** Get options or defaults */
  const {
    htmlContentLoading = '<h1 id="sc-loading">Loading...</h1>',
    htmlContentError = '<div id="sc-error-message"></div>',
    htmlContentHead = '',
  } = options || {};

  /**
   * Build the input passed to `stripe.redirectToCheckout`.
   *
   * When a server-side Checkout Session is used, Stripe.js only accepts
   * `{ sessionId }` - passing any other field (eg: `locale`, `successUrl`)
   * makes Stripe.js reject the call and the checkout never loads.
   * See https://github.com/a-tokyo/react-native-stripe-checkout-webview/issues/108
   *
   * For the session flow, all other settings (including `locale`) must be set
   * server-side when creating the Checkout Session. For the client-only flow
   * (lineItems/items) the full input - including `locale` - is forwarded.
   *
   * `'sessionId' in input` is used so Flow can narrow the union before reading
   * `input.sessionId` (it does not exist on the client-only member).
   */
  const redirectToCheckoutInput =
    'sessionId' in input ? { sessionId: input.sessionId } : input;

  /**
   * `locale` is applied at the Stripe.js constructor level so it can localize
   * Checkout (and error strings) even when using a server-side session, where
   * `locale` cannot be passed to `redirectToCheckout`.
   */
  const stripeConstructorOptions = input.locale
    ? { locale: input.locale }
    : null;

  /** Return html */
  return `
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Stripe Checkout</title>
      <meta name="author" content="A-Tokyo">
      ${htmlContentHead || ''}
    </head>
    <body>
      <!-- Display loading content -->
      ${htmlContentLoading || ''}
      <!-- Display error content -->
      ${htmlContentError || ''}
      <!-- Exec JS without blocking dom -->      
      <!-- Load Stripe.js -->
      <script src="https://js.stripe.com/v3"></script>
      <!-- Stripe execution script -->
      <script>
        (function initStripeAndRedirectToCheckout () {
          const stripe = Stripe('${stripe_public_key}'${
            stripeConstructorOptions
              ? `, ${JSON.stringify(stripeConstructorOptions)}`
              : ''
          });
          window.onload = () => {
            console.log('RNSC: window loaded');
            // Redirect to Checkout
            stripe.redirectToCheckout(${JSON.stringify(redirectToCheckoutInput)})
            .then((result) => {
                console.log('RNSC: window loaded', result);
                // Remove loading html
                const loadingElement = document.getElementById('sc-loading');
                if (loadingElement) {
                  loadingElement.outerHTML = '';
                }
                // If redirectToCheckout fails due to a browser or network
                // error, display the localized error message to your customer.
                if (result.error) {
                  const displayError = document.getElementById('sc-error-message');
                  if (displayError) {
                    displayError.textContent = result.error.message;
                  }
                }
              }).catch((err) => {
                console.error('RNSC: err', err);
              });
          };
        })();
      </script>
    </body>
  </html>
  `;
};

export default stripeCheckoutRedirectHTML;
