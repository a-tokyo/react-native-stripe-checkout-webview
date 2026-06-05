import isHtml from 'is-html';

import stripeCheckoutRedirectHTML from '../src/stripeCheckoutRedirectHTML';

describe('stripeCheckoutRedirectHTML', () => {
  it('generates valid html', () => {
    expect(
      isHtml(
        stripeCheckoutRedirectHTML('sp_test_stripe_public_key', {
          sessionId: 'sessionId',
        }),
      ),
    ).toEqual(true);
  });

  it('generates valid html - with options', () => {
    expect(
      isHtml(
        stripeCheckoutRedirectHTML(
          'sp_test_stripe_public_key',
          {
            sessionId: 'sessionId',
          },
          {
            htmlContentLoading: '<p>htmlContentLoading test</p>',
            htmlContentError: '<p>htmlContentError test</p>',
            htmlContentHead: '<style>.test{}</style>',
          },
        ),
      ),
    ).toEqual(true);
  });

  it('generates valid html - with options null', () => {
    expect(
      isHtml(
        stripeCheckoutRedirectHTML(
          'sp_test_stripe_public_key',
          {
            sessionId: 'sessionId',
          },
          {
            htmlContentLoading: null,
            htmlContentError: null,
            htmlContentHead: null,
          },
        ),
      ),
    ).toEqual(true);
  });

  it('throws error if no stripe key', () => {
    let errorToCheck;
    try {
      stripeCheckoutRedirectHTML('', {
        sessionId: 'sessionId',
      });
    } catch(error) {
      errorToCheck = error;
    }
    expect(errorToCheck).toEqual(expect.any(Error));
    expect(errorToCheck.message).toEqual('Must provide Stripe public key.');
  });
  
  it('throws error if no stripe key', () => {
    let errorToCheck;
    try {
      stripeCheckoutRedirectHTML('sk_test_stripe_public_key', null);
    } catch(error) {
      errorToCheck = error;
    }
    expect(errorToCheck).toEqual(expect.any(Error));
    expect(errorToCheck.message).toEqual('Must provide redirectToCheckout function input.');
  });

  /**
   * https://github.com/a-tokyo/react-native-stripe-checkout-webview/issues/108
   * When using a server-side Checkout Session, Stripe.js only accepts
   * `{ sessionId }`. Forwarding any extra field (eg: `locale`) breaks Checkout.
   */
  it('forwards only sessionId to redirectToCheckout when using a session', () => {
    const html = stripeCheckoutRedirectHTML('sp_test_stripe_public_key', {
      sessionId: 'sessionId',
      locale: 'de',
    });
    expect(html).toContain('redirectToCheckout({"sessionId":"sessionId"})');
    expect(html).not.toContain('redirectToCheckout({"sessionId":"sessionId","locale"');
  });

  it('applies locale as a constructor hint when provided', () => {
    const html = stripeCheckoutRedirectHTML('sp_test_stripe_public_key', {
      sessionId: 'sessionId',
      locale: 'de',
    });
    expect(html).toContain('Stripe(\'sp_test_stripe_public_key\', {"locale":"de"})');
  });

  it('omits constructor options when no locale is provided', () => {
    const html = stripeCheckoutRedirectHTML('sp_test_stripe_public_key', {
      sessionId: 'sessionId',
    });
    expect(html).toContain('Stripe(\'sp_test_stripe_public_key\')');
  });

  it('retains locale in the redirect input for the client-only flow', () => {
    const html = stripeCheckoutRedirectHTML('sp_test_stripe_public_key', {
      clientReferenceId: 'clientReferenceId',
      successUrl: 'https://example.com/success?sc_checkout=success',
      cancelUrl: 'https://example.com/cancel?sc_checkout=cancel',
      lineItems: [{ price: 'price_123', quantity: 1 }],
      mode: 'payment',
      locale: 'de',
    });
    expect(html).toContain('"clientReferenceId":"clientReferenceId"');
    expect(html).toContain('"locale":"de"');
  });
});
