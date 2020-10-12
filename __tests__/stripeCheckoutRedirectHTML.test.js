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
});
